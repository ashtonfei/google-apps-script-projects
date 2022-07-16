const CONFIG = {
  NAME: "Folder Sharing",
  ENDPOINT:
    "https://script.google.com/macros/s/AKfycby4ZjXw_I-oOROvRKXINc5mRl8SGMXmw6swg766Qq4_3gcgt8DZazMyHgP5BOQvjnvo3Q/exec",
  SHEET_NAME: {
    SHARING_LINKS: "Sharing Links",
    FOLDERS: "Folders",
  },
  UNLIMITED: "Unlimited",
};

/**
 *  Utilities
 */
const utils = {};

utils.getUi = function () {
  return SpreadsheetApp.getUi();
};

utils.getCurrentFolder = function () {
  try {
    const ss = SpreadsheetApp.getActive();
    const id = ss.getId();
    return DriveApp.getFolderById(id).getParents().next();
  } catch (err) {
    return DriveApp.getRootFolder();
  }
};

utils.createRowValues = function (keys, item, currentValues = null) {
  return keys.map((key, index) => {
    if (key in item) return item[key];
    return currentValues ? currentValues[index] : null;
  });
};

utils.createItem = function (keys, values) {
  const item = {};
  keys.forEach((key, index) => (item[key] = values[index]));
  return item;
};

utils.getFolders = function () {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(CONFIG.SHEET_NAME.FOLDERS);
  const items = ws.getDataRange().getValues().slice(1);
  const folders = [];
  items.forEach((item) => {
    const value = item[0].toString().replace(/\s+/g, "");
    try {
      const id = value.includes("/folders/")
        ? value.split(/\/folders\//i)[1]
        : value;
      const folder = DriveApp.getFolderById(id);
      folders.push({
        text: folder.getName(),
        value: {
          id: folder.getId(),
          name: folder.getName(),
          url: folder.getUrl(),
          lastUpdated: folder.getLastUpdated(),
        },
      });
    } catch (err) {
      // pass
      console.log(err);
    }
  });
  return folders;
};

utils.createPage = function (filename, title = CONFIG.NAME, data = null) {
  const tempalte = HtmlService.createTemplateFromFile(filename);
  if (data) tempalte.data = JSON.stringify(data);
  return tempalte
    .evaluate()
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
};

utils.createFile = function (data, file, folderId) {
  console.log({ data: data.slice(0, 50), file, folderId });
  const decodedData = Utilities.base64Decode(data.split("base64,")[1]);
  const resource = {
    title: file.name,
    mimeType: file.type,
    parents: [{ id: folderId }],
  };
  const blob = Utilities.newBlob(decodedData);
  return Drive.Files.insert(resource, blob);
};

utils.sendSharingLinks = function (payload) {
  payload = JSON.parse(JSON.stringify(payload));
  const { link, emails, folder } = payload;
  const shareFolder = DriveApp.getFolderById(folder);
  emails.forEach((email) => {
    const url = `${link}&email=${email}`;
    const shareFolderName = shareFolder.getName();
    try {
      const subject = `You've been Shared to Folder "${shareFolderName}" - ${CONFIG.NAME}`;
      let htmlBody =
        HtmlService.createHtmlOutputFromFile("email.html").getContent();
      payload.url = url;
      payload.shareFolderName = shareFolderName;
      payload.validTo =
        payload.validTo !== CONFIG.UNLIMITED
          ? new Date(payload.validTo).toLocaleString()
          : payload.validTo;
      payload.size =
        payload.size !== CONFIG.UNLIMITED ? `${payload.size} MB` : payload.size;
      payload.password = payload.password || "NOT REQUIRED";
      Object.entries(payload).forEach(([key, value]) => {
        htmlBody = htmlBody.replace(new RegExp(`\{${key}\}`, "gi"), value);
      });
      GmailApp.sendEmail(email, subject, "", { htmlBody });
    } catch (err) {
      console.log(err);
      //pass
    }
  });
};

function createSharingPage_() {
  const appData = {
    folders: utils.getFolders(),
  };
  return utils.createPage("sharing.html", `${CONFIG.NAME}`, appData);
}

function getSharingLinkDataById_(id) {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(CONFIG.SHEET_NAME.SHARING_LINKS);
  const [headers, ...items] = ws.getDataRange().getValues();
  const indexOfId = headers.indexOf("id");
  const foundItem = items.find((item) => item[indexOfId] == id);
  if (foundItem) {
    return utils.createItem(headers, foundItem);
  }
}

function getSharingLinksByUserEmail_(email) {
  const now = new Date();
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(CONFIG.SHEET_NAME.SHARING_LINKS);
  const items = [];
  if (!ws) return items;
  const [headers, ...records] = ws.getDataRange().getValues();
  records.forEach((values) => {
    const item = utils.createItem(headers, values);
    if (
      (!item.validTo || item.validTo > now) &&
      (item.createdBy == email || !email)
    ) {
      item.validTo =
        typeof item.validTo == "object"
          ? Utilities.formatDate(
              item.validTo,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd"
            )
          : item.validTo;
      items.push(item);
    }
  });
  return items;
}

function checkSharingLink_(link, email) {
  if (!link) {
    return "This is an invalid sharing link (invalid sharing id)!";
  }
  if (link.emails) {
    const emails = link.emails.split(/\s*\,\s*/);
    if (!emails.includes(email))
      return "This is an invalid sharing link (invalid email)!";
  }
  if (link.validTo !== CONFIG.UNLIMITED && link.validTo < new Date()) {
    return "This is an invalid sharing link (expired)!";
  }
  if (link.timesOfUploads !== CONFIG.UNLIMITED && link.timesOfUploads <= 0) {
    return "This is an invalid sharing link (out of upload quota)!";
  }
}

function createUploadPage_(id, email) {
  const link = getSharingLinkDataById_(id);
  let folder = null;
  let errorMessage = checkSharingLink_(link, email);
  if (!errorMessage) {
    try {
      folder = DriveApp.getFolderById(link.folder);
      folder = {
        name: folder.getName(),
        lastUpdated: folder.getLastUpdated(),
      };
    } catch (err) {
      errorMessage =
        "Sharing link is not valid anymore (folder not accessible)!";
    }
    if (link.password) {
      link.requirePassword = true;
    } else {
      link.requirePassword = false;
    }
  }

  if (link) {
    delete link.password;
  }
  const appData = {
    link,
    folder,
    errorMessage,
    email,
  };
  return utils.createPage("upload.html", `Upload - ${CONFIG.NAME}`, appData);
}

function createAdminPage_() {
  const user = Session.getActiveUser().getEmail();
  const appData = {
    links: this.getSharingLinksByUserEmail_(user),
  };
  return utils.createPage("admin.html", `Admin - ${CONFIG.NAME}`, appData);
}

function onOpen(e) {
  const ui = utils.getUi();
  const menu = ui.createMenu(CONFIG.NAME);
  menu.addItem("Open", "openSharingDialog");
  menu.addToUi();
}

function openSharingDialog() {
  const ui = utils.getUi();
  const sharePage = createSharingPage_();
  sharePage.setHeight(700).setWidth(600);
  return ui.showDialog(sharePage);
}

/** API calls from the frontend */

function doGet(e) {
  const { id, email } = e.parameter;
  if (id) {
    return createUploadPage_(id, email);
  }
  return utils.createPage("404.html", `Page Not Found - ${CONFIG.NAME}`);
}

function createSharingLink(payload) {
  payload = JSON.parse(payload);
  const id = Utilities.getUuid();
  payload.id = id;
  payload.createdAt = new Date();
  payload.modifiedAt = payload.createdAt;
  payload.link = `${CONFIG.ENDPOINT}?id=${id}`;
  payload.createdBy = Session.getActiveUser().getEmail();
  payload.validTo =
    payload.validTo !== CONFIG.UNLIMITED
      ? new Date(
          payload.createdAt.getTime() + payload.validTo * 26 * 60 * 60 * 1000
        )
      : payload.validTo;
  utils.sendSharingLinks(payload);
  payload.emails = payload.emails.join(",");
  payload.status = `=IF(R[0]C[-4]<NOW(),"Inactive",IF(R[0]C[-2]<=0,"Inactive","Active"))`;
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(CONFIG.SHEET_NAME.SHARING_LINKS);
  const headers = ws.getDataRange().getValues()[0];
  const rowValues = utils.createRowValues(headers, payload);
  ws.getRange(ws.getLastRow() + 1, 1, 1, rowValues.length).setValues([
    rowValues,
  ]);
  return JSON.stringify(payload);
}

function updateSharingLink(payload) {
  payload = JSON.parse(payload);
  payload.modifiedAt = new Date();
  payload.validTo = payload.validTo ? new Date(payload.validTo) : null;
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(CONFIG.SHEET_NAME.SHARING_LINKS);
  const [headers, ...records] = ws.getDataRange().getValues();
  const indexOfId = headers.indexOf("id");
  const findIndex = records.findIndex(
    (values) => values[indexOfId] == payload.id
  );
  if (findIndex == -1) {
    throw new Error(`Invalid sharing link id ${payload.id}!`);
  }
  const rowValues = utils.createRowValues(headers, payload, records[findIndex]);
  ws.getRange(findIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  const email = Session.getActiveUser().getEmail();
  return JSON.stringify({
    links: getSharingLinksByUserEmail_(email),
  });
}

function deleteSharingLink(payload) {
  payload = JSON.parse(payload);
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(CONFIG.SHEET_NAME.SHARING_LINKS);
  const [headers, ...records] = ws.getDataRange().getValues();
  const indexOfId = headers.indexOf("id");
  const findIndex = records.findIndex(
    (values) => values[indexOfId] == payload.id
  );
  if (findIndex == -1) {
    throw new Error(`Invalid sharing link id ${payload.id}!`);
  }
  ws.deleteRow(findIndex + 2);
  const email = Session.getActiveUser().getEmail();
  return JSON.stringify({
    links: getSharingLinksByUserEmail_(email),
  });
}

function validatePassword(payload) {
  const { id, password } = JSON.parse(payload);
  const link = getSharingLinkDataById_(id);
  if (!link) {
    throw new Error("The sharing link is not valid anymore!");
  }
  if (password != link.password) {
    throw new Error("Wrong password!");
  }
  return JSON.stringify({
    success: true,
  });
}

function updateSharingLinkTimesOfUploads_(id) {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(CONFIG.SHEET_NAME.SHARING_LINKS);
  const [headers, ...records] = ws.getDataRange().getValues();
  const indexOfId = headers.indexOf("id");
  const indexOfTimesOfUploads = headers.indexOf("timesOfUploads");
  const findIndex = records.findIndex((values) => values[indexOfId] == id);
  if (findIndex == -1) {
    throw new Error(`Invalid sharing link id ${payload.id}!`);
  }
  const record = records[findIndex];
  record[indexOfTimesOfUploads]--;
  ws.getRange(findIndex + 2, indexOfTimesOfUploads + 1).setValue(
    record[indexOfTimesOfUploads]
  );
  return utils.createItem(headers, record);
}

function uploadFiles(payload) {
  let { fileData, link, email } = JSON.parse(payload);
  link = getSharingLinkDataById_(link.id);
  let errorMessage = checkSharingLink_(link, email);
  if (errorMessage) throw new Error(errorMessage);
  fileData.map(({ data, file }) => {
    return utils.createFile(data, file, link.folder);
  });
  if (link.timesOfUploads !== CONFIG.UNLIMITED) {
    link = updateSharingLinkTimesOfUploads_(link.id);
  }
  if (link.password) {
    delete link.password;
  }
  return JSON.stringify({
    link,
  });
}
