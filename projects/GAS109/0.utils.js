const testLinebreaks = () => {
  const settings = getSettings_();
  const body = settings.signedBody;
  console.log(body);
  console.log(addLineBreaks_(body));
};

const error_ = (...data) => console.log(...data);

const alert_ = (msg, title = "Alert") => {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, msg, ui.ButtonSet.OK);
};

const confirm_ = (msg, title = "Confirm") => {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, msg, ui.ButtonSet.YES_NO);
};

const createMenu_ = (ui) => (items, caption = null) => {
  const menu = caption ? ui.createMenu(caption) : ui.createAddonMenu();
  const createMenuItem = ({ title, items, caption, fn, sep }) => {
    if (title && items) {
      return menu.addSubMenu(createMenu_(ui)(items, title));
    }
    if (caption && fn) return menu.addItem(caption, fn);

    if (sep) return menu.addSeparator();
  };
  items.forEach(createMenuItem);
  return menu;
};

const getIdFromUrl_ = (url) => {
  if (url.includes("/folders/")) {
    return url.split("/folders/")[1].split("/")[0];
  }
  if (url.includes("/d/")) {
    return url.split("/d/")[1].split("/")[0];
  }
};

const getLinkedSheet_ = (ss = SpreadsheetApp.getActive()) => {
  return ss.getSheets().find((sheet) => sheet.getFormUrl());
};

const getLinkedForm_ = (ss = SpreadsheetApp.getActive()) => {
  const sheet = getLinkedSheet_(ss);
  if (!sheet) return;
  return FormApp.openByUrl(sheet.getFormUrl());
};

const getSettings_ = () => {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("Settings");
  const settings = {};
  sheet
    .getDataRange()
    .getValues()
    .forEach(([key, value], index) => {
      if (index === 0) return;
      key = key
        .toString()
        .replace(/[\[\]]+/g, "")
        .trim();
      if (key.endsWith(":")) return;
      if (!key) return;
      settings[key] = value;
    });
  return settings;
};

const updateTextWithPlaceholders_ = (text, placeholders) => {
  Object.entries(placeholders).forEach(([key, value]) => {
    text = text.replace(new RegExp(`{{${key}}}`, "gi"), value);
  });
  return text;
};

const createItem_ = (keys, values) => {
  const item = {};
  keys.forEach((key, index) => {
    item[key] = values[index];
  });
  return item;
};

/**
 * @param {GoogleAppsScript.Forms.FormResponse} response
 */
const getResponseValues_ = (response) => {
  const values = {};
  response.getItemResponses().forEach((itemResponse) => {
    const title = itemResponse.getItem().getTitle();
    const type = itemResponse.getItem().getType();
    if (type == FormApp.ItemType.PAGE_BREAK) return;
    if (type == FormApp.ItemType.SECTION_HEADER) return;
    values[title] = itemResponse.getResponse();
  });
  values["_id"] = response.getId();
  values["_email"] = response.getRespondentEmail();
  values["_timestamp"] = response.getTimestamp();
  return values;
};

const updateRowValues_ = (sheet) => (row, values) => {
  const headers = sheet.getRange("1:1").getDisplayValues()[0];
  const rowValues = sheet.getRange(`${row}:${row}`).getValues()[0];
  const newValues = rowValues.map((value, index) => {
    const header = headers[index];
    if (header in values) return values[header];
    return value;
  });
  sheet.getRange(row, 1, 1, newValues.length).setValues([newValues]);
};

const getItemsFromSheet_ = (sheet, filter = null) => {
  const items = [];
  const [headers, ...values] = sheet.getDataRange().getValues();
  values.forEach((rowData, index) => {
    const item = createItem_(headers, rowData);
    item._row = index + 2;
    if (!filter) return items.push(item);
    filter(item) && items.push(item);
  });
  return items;
};

const addLineBreaks_ = (body) => {
  body = body.replace(/\n/g, "<br/>");
  return body.startsWith("<") ? body : `<div>${body}</div>`;
};
