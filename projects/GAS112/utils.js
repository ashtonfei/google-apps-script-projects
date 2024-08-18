/**
 * @param {GoogleAppsScript.Drive.File} file an image file
 * @param {number} size The width of the image to be created
 * @returns {GoogleAppsScript.Drive.File} a new image file with smaller size
 */
const compressImageFile_ = (file, size = 800) => {
  const accessToken = ScriptApp.getOAuthToken();
  const request = {
    url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=${size}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    muteHttpExceptions: true,
  };

  const [response] = UrlFetchApp.fetchAll([request]);

  if (response.getResponseCode() != 200) {
    throw new Error(response.getContentText());
  }
  const blog = response.getBlob();
  const nameSplits = file.getName().split(".");
  const name = [
    ...nameSplits.slice(0, -1).join("."),
    ` SZ${size}.`,
    ...nameSplits.slice(-1),
  ].join("");
  blog.setName(name);
  return file.getParents().next().createFile(blog);
};

const getSettings_ = (sheetName = "Settings") => {
  const settings = {};
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" was not found in the Spreadsheet.`);
  }
  sheet
    .getDataRange()
    .getValues()
    .forEach(([key, value], index) => {
      if (index === 0) return;
      key = key.trim();
      if (!key) return;
      settings[key] = value;
    });
  return settings;
};

const parseNamedValues_ = (namedValues, delimeter = ", ") => {
  const values = {};
  Object.entries(namedValues).forEach(([key, value]) => {
    values[key] = value.join(delimeter);
  });
  return values;
};

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row The row position starts from 1
 * @param {object} updates An object with headers as keys and updates as values
 * @param {boolean} createMissingHeaders Create the missing headers if the
 * header is not found in the sheet
 * @returns void
 */
const updateRowValues_ =
  (sheet, row) => (updates, createMissingHeader = true) => {
    const [headers] = sheet.getDataRange().getDisplayValues();
    Object.entries(updates).forEach(([key, value]) => {
      let index = headers.indexOf(key);
      if (index == -1) {
        if (!createMissingHeader) {
          return;
        }
        headers.push(key);
        index = headers.length - 1;
        sheet.getRange(1, index + 1).setValue(key);
      }
      sheet.getRange(row, index + 1).setValue(value);
    });
  };

const sendImage_ = (values, image, settings) => {
  const recipient = values[settings.emailField];
  const subject = "Your Compressed Image: GAS122";
  const options = {
    htmlBody: "<p>Here is the compressed image</p>",
    attachments: [image.getBlob()],
  };
  GmailApp.sendEmail(recipient, subject, "", options);
};
