const CONFIG = {
  NAME: "GAS111",
  RANGE_NAME: {
    QUERY: "query",
    MAX: "max",
    PRINT_MESSAGES_ONLY: "printMessagesOnly",
    FILENAME: "filename",
    FOLDER: "folder",
    STATUS: "status",
    MESSAGE: "message",
    TABLE_THREADS: "tableThreads",
    MERGE: "merge",
  },
  STATUS: {
    ERROR: "Error",
    SUCCESS: "Success",
    WARNING: "Warning",
  },
};

/**
 * @param {GoogleAppsScript.Base.Blob} blob
 */
const _toBase64ImageUri_ = (blob) => {
  const encodedData = Utilities.base64Encode(blob.getBytes());
  return `data:${blob.getContentType()};base64,${encodedData}`;
};

/**
 * @param {GoogleAppsScript.Gmail.GmailThread} thread
 */
const createThreadContent_ = (thread, printMessagesOnly = false) => {
  const content = [];
  const imageLinks = [];
  thread.getMessages().forEach((message) => {
    let body = message.getBody();
    const images = message
      .getAttachments()
      .filter((v) => v.getName() === "image.png");
    if (images.length) {
      const cids = body.match(/img src="cid:[^"]+" /gi);
      if (cids) {
        cids.forEach((cid, index) => {
          const image = images[index];
          if (!image) return;
          const uri = _toBase64ImageUri_(image);
          body = body.replace(cid, `img src="${uri}"`);
        });
      }
    }
    const links = body.match(/img[^\<\>]+src="http[^"]+"/gi);
    if (links) {
      const urls = links.map((v) => v.split("src=")[1].slice(1, -1));
      imageLinks.push(...urls);
    }
    if (!printMessagesOnly) {
      const date = message.getDate().toLocaleString();
      const subject = message.getSubject();
      const from = message.getFrom();
      const to = message.getTo();
      const cc = message.getCc();
      const bcc = message.getBcc();
      content.push(`<div><strong>Subject: ${subject}</strong></div>`);
      content.push(`<div>Date: ${date}</div>`);
      content.push(`<div>From: ${from}</div>`);
      content.push(`<div>To: ${to}</div>`);
      cc && content.push(`<div>CC: ${cc}</div>`);
      bcc && content.push(`<div>BCC: ${bcc}</div>`);
    }
    content.push(`<br/><div>${body}</div><br/>`);
  });
  let htmlBody = content.join("");
  if (imageLinks.length) {
    const requests = [...new Set(imageLinks)].map((url) => {
      return {
        url,
        method: "GET",
      };
    });
    UrlFetchApp.fetchAll(requests).forEach((response, index) => {
      const blob = response.getBlob();
      const uri = _toBase64ImageUri_(blob);
      const url = requests[index].url;
      htmlBody = htmlBody.replace(new RegExp(url, "g"), uri);
    });
  }
  return htmlBody;
};

const htmlToPdf_ = (body, name) => {
  const head = [
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "</head>",
  ].join("");
  const html = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    head,
    `<body>${body}</body>`,
    "</html>",
  ].join("");
  const file = DriveApp.createFile(name, html, "text/html").setName(
    `${name}.html`,
  );
  const pdf = DriveApp.createFile(file.getAs("application/pdf")).setName(
    `${name}.pdf`,
  );
  file.setTrashed(true);
  return pdf;
};

const _updateStatus_ = (status, message) => {
  const ss = SpreadsheetApp.getActive();
  ss.getRange(CONFIG.RANGE_NAME.STATUS).setValue(status);
  ss.getRange(CONFIG.RANGE_NAME.MESSAGE).setValue(message);
  SpreadsheetApp.flush();
};

const _try_ = (fn) => {
  try {
    return fn();
  } catch (err) {
    console.log(err);
    _updateStatus_("Error", err.message);
  }
};

const print_ = () => {
  const ss = SpreadsheetApp.getActive();
  const tableStart = ss.getRange(CONFIG.RANGE_NAME.TABLE_THREADS);
  const printMessagesOnly = ss
    .getRange(CONFIG.RANGE_NAME.PRINT_MESSAGES_ONLY)
    .getValue();
  const merge = ss.getRange(CONFIG.RANGE_NAME.MERGE).getValue();
  let folder = ss.getRange(CONFIG.RANGE_NAME.FOLDER).getValue();
  if (folder) {
    folder = DriveApp.getFolderById(folder.split("/folders/")[1].split("/")[0]);
  } else {
    folder = DriveApp.getFolderById(ss.getId()).getParents().next();
  }
  const filename = ss.getRange(CONFIG.RANGE_NAME.FILENAME).getValue() ||
    `${CONFIG.NAME} Email Print ${new Date().toLocaleString()}`;

  const threads = tableStart
    .getDataRegion()
    .getValues()
    .filter((v) => {
      return v[0] === true && v[3];
    })
    .map((v) => {
      const threadId = v[3];
      return GmailApp.getThreadById(threadId);
    });
  if (threads.length <= 0) {
    return _updateStatus_(
      "Error",
      "No thread was selected in the thread table.",
    );
  }
  _updateStatus_("Printing ...", null);

  let message = folder.getUrl();
  if (merge) {
    const html = threads
      .map((thread) => createThreadContent_(thread, printMessagesOnly))
      .join("<br/>");
    const pdf = htmlToPdf_(html, filename);
    folder && pdf.moveTo(folder);
    message = pdf.getUrl();
  } else {
    threads.forEach((thread) => {
      const html = createThreadContent_(thread, printMessagesOnly);
      const subject = thread.getFirstMessageSubject() + ".pdf";
      const pdf = htmlToPdf_(html, subject);
      folder && pdf.moveTo(folder);
    });
  }
  tableStart
    .getSheet()
    .getRange(
      tableStart.getRow() + 1,
      tableStart.getColumn(),
      tableStart.getDataRegion().getNumRows(),
      1,
    )
    .setValue(false);
  return _updateStatus_(CONFIG.STATUS.SUCCESS, message);
};

const search_ = () => {
  const ss = SpreadsheetApp.getActive();
  _updateStatus_("Searching ...", null);
  const query = ss.getRange(CONFIG.RANGE_NAME.QUERY).getValue() || "";
  const max = ss.getRange(CONFIG.RANGE_NAME.MAX).getValue() * 1 || 20;
  const threads = GmailApp.search(query, 0, max);
  const values = threads.map((thread) => {
    return [
      false,
      thread.getFirstMessageSubject(),
      thread.getMessages()[0].getPlainBody().slice(0, 30) + " ...",
      thread.getId(),
      thread.getMessages().length,
      thread.getLastMessageDate(),
    ];
  });
  values.unshift([
    "Select",
    "1st Message Subject",
    "1st Message Preview",
    "Thread ID",
    "Message Count",
    "Last Message Date",
  ]);
  const tableStart = ss.getRange(CONFIG.RANGE_NAME.TABLE_THREADS);
  tableStart.getDataRegion().clearContent();

  tableStart
    .getSheet()
    .getRange(
      tableStart.getRow(),
      tableStart.getColumn(),
      values.length,
      values[0].length,
    )
    .setValues(values);
  _updateStatus_("Success", `${threads.length} threads found.`);
};

const onPrint = () => _try_(print_);

const onSearch = () => _try_(search_);
