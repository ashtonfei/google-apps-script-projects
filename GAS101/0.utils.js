/**
 * Ashton's Apps Script Utilities
 * Changes
 * 1/Apr/2022
 * - Initial release
 * 13/Nov/2022
 * - new function _getColumnNameByIndex_
 * - new function _getColumnIndexByName_
 */

String.prototype.toCamelCase = function () {
  return this.toString()
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .map((v, i) => (i === 0 ? v : v.charAt(0).toUpperCase() + v.substring(1)))
    .join("");
};

String.prototype.toPascalCase = function () {
  return this.toString()
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .map((v) => v.charAt(0).toUpperCase() + v.substring(1))
    .join("");
};

/**
 * Get the value from an array by index (negative indexing)
 * @param {number} index The index of the item (-1 means the last one)
 * @return {any}
 */
Array.prototype.getValueByIndex = function (index) {
  index = index * 1;
  if (index >= 0) return this[index];
  if (index * -1 > this.length) return undefined;
  return this.slice(index)[0];
};

function _createMenu_(name, items, submenu = false) {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu(name);
  items.forEach((item) => {
    if (!item) return menu.addSeparator();
    if (item.name) {
      return menu.addSubMenu(_createMenu_(item.name, item.items, true));
    }
    if (item.caption && item.action) {
      return menu.addItem(item.caption, item.action);
    }
    return menu.addSeparator();
  });
  if (submenu) return menu;
  menu.addToUi();
}

/**
 * Convert a list of headers into keys in camcel case by default
 * @param {string[]} headers A list of headers
 * @param {boolean} useCamelCase Use camelCase if true, else PascalCase is sued
 * @returns {string[]}
 */
function _createKeys_(headers, useCamelCase = true) {
  return headers.map((v) => {
    if (useCamelCase) {
      return v.toCamelCase();
    } else {
      return v.toString().toPascalCase();
    }
  });
}

/**
 * Build an object by mapping the values into keys by the indexes
 * @param {string[]} keys A list of keys
 * @param {any[]} A list of values
 * @returns {object} An item object
 */
function _createItem_(keys, values) {
  const item = {};
  keys.forEach((k, i) => (item[k] = values[i]));
  return item;
}

/**
 * Build an array by mapping the item object with  a list of keys
 * @param {string[]} keys A list of keys
 * @param {object} item A item object
 * @param {any[]} currentValues A list of the original values
 * @returns {any[]} A list of values
 */
function _createRowValues_(keys, item, currentValues = null) {
  return keys.map((k, i) => {
    if (k in item) return item[k];
    if (currentValues) return currentValues[i];
    return null;
  });
}

/**
 * Get a list of item object from a sheet
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet where the data is stored
 * @param {Function} filterFunction A callback function to filter the array of items
 * @returns {object[]}
 */
function _getItemsFromSheet_(sheet, filterFunction = null) {
  const [headers, ...values] = sheet.getDataRange().getValues();
  const keys = _createKeys_(headers);
  const items = [];
  values.forEach((v, i) => {
    const item = _createItem_(keys, v);
    item._rowIndex = i + 2;
    if (!filterFunction) return items.push(item);
    if (filterFunction(item)) return items.push(item);
  });
  return items;
}

/**
 * Get the Spreadsheet Ui Object
 * @returns {GoogleAppsScript.Base.Ui}
 */
function _getUi_() {
  return SpreadsheetApp.getUi();
}

/**
 * Send a toast message to the active sheet
 * @param {string} message The toast message
 * @param {string} title The title of the toast
 * @param {number} [10] timeout The timeout in seconds
 */
function _toast_(message, title = "Toast", timeout = 4) {
  SpreadsheetApp.getActive().toast(message, title, timeout);
}

/**
 * Show an alert in the spreadsheet
 * @param {string} message The message to show in the alert
 * @param {string} title The title of the alert
 * @return {GoogleAppsScript.Base.PromptResponse}
 */
function _alert_(message, title = "Alert") {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, message, ui.ButtonSet.OK);
}

/**
 * Show a confirm dialog in the spreadsheet
 * @param {string} message The message to show in the alert
 * @param {string} title The title of the alert
 * @return {GoogleAppsScript.Base.PromptResponse}
 */
function _confirm_(message, title = "Confirm") {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, message, ui.ButtonSet.YES_NO);
}

/**
 * Show a prompt in the spreadsheet
 * @param {string} message The message to show in the alert
 * @param {string} title The title of the alert
 * @return {GoogleAppsScript.Base.PromptResponse}
 */
function _prompt_(message, title = "Prompt") {
  const ui = SpreadsheetApp.getUi();
  return ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
}

function _getCurrentFolder_(id = SpreadsheetApp.getActive().getId()) {
  return (
    DriveApp.getFileById(id).getParents().next() || DriveApp.getRootFolder()
  );
}

function _getFolderByName_(name, parentFolder, createIfNotFound = true) {
  const folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  if (createIfNotFound) return parentFolder.createFolder(name);
}

/**
 * Save values to a sheet
 * @param {any[][]} values An 2D array
 * @param {string | GoogleAppsScript.Spreadsheet.Sheet} sheet A sheet or a name of the sheet
 * @param {number} headerRowAt The row position of the header (starts from 1)
 * @param {number} headerColumnStart The start position of the header column (starts from 1)
 * @param {boolean} clearContents Clear the current contents (false will append as new data)
 * @param {boolean} clearFormats Clear the current foramts
 */
function _valuesToSheet_(
  values,
  sheet,
  headerRowAt = 1,
  headerColumnStart = 1,
  clearContents = true,
  clearFormats = true
) {
  if (typeof sheet === "string") {
    sheet =
      SpreadsheetApp.getActive().getSheetByName(sheet) ||
      SpreadsheetApp.getActive().insertSheet(sheet);
  }
  const [headers, ...items] = values;
  const rangeToBeCleared = sheet.getRange(
    headerRowAt,
    headerColumnStart,
    sheet.getMaxRows() - headerRowAt + 1,
    sheet.getMaxColumns() - headerColumnStart + 1
  );
  if (clearContents) {
    rangeToBeCleared.clearContent();
  }
  if (clearFormats) {
    rangeToBeCleared.clearFormat();
  }
  if (!headers || headers.length === 0) return sheet;
  sheet
    .getRange(headerRowAt, headerColumnStart, 1, headers.length)
    .setValues([headers]);
  if (!items || items.length === 0) return;
  sheet
    .getRange(
      sheet.getLastRow() + 1,
      headerColumnStart,
      items.length,
      items[0].length
    )
    .setValues(items);
  return sheet;
}

/**
 * Apply number formats to the columns in the sheet
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to be formatted
 * @param {string[]} formats A list of number formats
 * @param {number} headerRowAt The row position of the header (starts from 1)
 * @param {number} headerColumnStart The column start position of the header (starts from 1)
 * @returns {void}
 */
function _formatSheet_(sheet, formats, headerRowAt = 1, headerColumnStart = 1) {
  const lastRow = sheet.getLastRow();
  const maxRows = sheet.getMaxRows();
  formats.forEach((format, i) => {
    const column = sheet.getRange(
      headerRowAt + 1,
      i + headerColumnStart,
      maxRows - headerRowAt,
      1
    );
    column.removeCheckboxes();
    if (format === "checkbox") {
      return sheet
        .getRange(
          headerRowAt + 1,
          i + headerColumnStart,
          lastRow - headerRowAt,
          1
        )
        .insertCheckboxes();
    }
    column.setNumberFormat(format);
  });
}

/**
 * Get the value from a nested object by the path of keys
 * @param {object} item The item object
 * @param {string} path A path of keys joined with ".", like "address.home"
 * @return {any}
 */
function _getNestedValueFromObject_(item, path) {
  path.split(".").forEach((k) => (item = item?.[k]));
  return item;
}

/**
 * Create a query string by an object
 * @param {object} params A query object
 * @returns {string} A query string
 */
function _createQueryString_(params) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

/**
 * Get the id from a Google Doc or Google Folder URL
 * @param {string} url A folder URL or file url
 * @return {string} An file id on Google Drive
 */
function _getIdFromUrl_(url) {
  if (/\/d\//.test(url)) {
    return url.split(/\/d\//)[1].split(/[\/|\?]/)[0];
  }
  if (/\/folders\//.test(url)) {
    return url.split(/\/folders\//)[1].split(/[\/|\?]/)[0];
  }
  return url;
}

/**
 * Create a Google Sheet header object
 * @param {string} header The header for the header
 * @param {string}[null] key The key for the header, camel case of header will be used if not assigned
 * @param {string}[null] format The number format for the header column
 * @param {string}[null] path The nested object key path, the key will be used if null
 * @returns {object}
 */
function _createHeaderObject_(header, key = null, format = null, path = null) {
  return Object.freeze({
    header,
    key: key || header.toLowerCase(),
    format,
    path: path || key || header.toLowerCase(),
  });
}

/**
 * Get the keys, headers, formats, and paths from the header data object
 * @param {object[]} headerData An array of header data object
 * @param {object}
 */
function _getHeaderData_(headerData) {
  const headers = [];
  const keys = [];
  const formats = [];
  const paths = [];
  headerData.forEach(({ header, key, format, path }) => {
    headers.push(header);
    keys.push(key);
    formats.push(format);
    paths.push(path);
  });
  return { headers, keys, formats, paths };
}

/**
 * Get the settings from sheet sheetings, keys in column A and values in column B
 * @param {string}[Settings] sheetName The name of the sheet settings
 * @param {boolean}[true] convertKeyToCamelCase Format the key to camcel case
 */
function _getSettings_(sheetName = "Settings", convertKeyToCamelCase = true) {
  const settings = {};
  const ws = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!ws) return settings;
  ws.getDataRange()
    .getValues()
    .slice(1)
    .forEach(([k, v]) => {
      k = convertKeyToCamelCase
        ? k.toString().toCamelCase()
        : k.toString().trim();
      if (!k) return;
      if (!(k in settings)) return (settings[k] = v);
      if (Array.isArray(settings[k])) return settings[k].push(v);
      return (settings[k] = [settings[k], v]);
    });
  return settings;
}

/**
 * Create a inline style from a style object with css properties
 * @param {object} styleObject The style object
 * @returns {string} A inline css style
 */
function _createStyle_(styleObject) {
  return (
    Object.entries(styleObject)
      .map(([k, v]) => `${k}:${v}`)
      .join(";") + ";"
  );
}

/**
 * Open an HTML dialog
 * @param {string} html The html content to be displayed in the dialog
 * @param {string} title The title of the dialog
 * @param {number}[450] width The width in px
 * @param {number} [500] height The height in px
 * @returns {void}
 */
function _openDialog_(html, title, width = 540, height = 460) {
  const divStyle = {
    "font-family": "Roboto,RobotoDraft,Helvetica,Arial,sans-serif",
  };
  html = `<div style='${_createStyle_(divStyle)}'>${html}</div>`;
  const dialog = HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setWidth(width)
    .setHeight(height);
  SpreadsheetApp.getActive().show(dialog);
}

/** */
function _openLink_(link, title = "Open Link") {
  const divStyle = {
    "font-family": "Roboto,RobotoDraft,Helvetica,Arial,sans-serif",
  };
  const buttonStyle = {
    cursor: "pointer",
    "border-radius": "4px",
    "font-weight": 500,
    "font-size": "14px",
    height: "36px",
    "letter-spacing": "0.25px",
    "line-height": "16px",
    padding: "9px 24px 11px 24px",
    border: "1px solid #dadce0",
    color: "#137333",
    background: "#ffffff",
  };
  const html = `<div style='${_createStyle_(divStyle)}'>
			<p>Click below button to open it if the popup window was not opened.</p>
			<div>
			<button
				style='${_createStyle_(buttonStyle)}'
				onclick="window.open('${link}', '_target');google.script.host.close();"
			>Open</button>
			<button
				style='${_createStyle_(buttonStyle)}'
				onclick="google.script.host.close();"
			>Close</button>
			</div>
			</div>
			<script>window.open("${link}", "_blank");</script>
		`;
  const dialog = HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setHeight(120);
  SpreadsheetApp.getActive().show(dialog);
}

/**
 * Include an HTML file into another HTML file
 * @param {string} filename The name of an HTML file
 * @param { any }[null] data Data for the template
 * @returns {string}
 */
function _include_(filename, data = null) {
  const template = HtmlService.createTemplateFromFile(filename);
  if (data) template.data = data;
  return template.evaluate().getContent();
}

/**
 * Remove extra empty rows
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet A sheet object
 * @param {number} blankRows Blank rows to be kept
 */
function _removeExtraRows_(sheet, blankRows = 0) {
  if (sheet.getLastRow() + blankRows >= sheet.getMaxRows()) return;
  sheet.deleteRows(
    sheet.getLastRow() + 1 + blankRows,
    sheet.getMaxRows() - sheet.getLastRow() - blankRows
  );
}

/**
 * Remove extra empty columns
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet A sheet object
 * @param {number} blankRows Blank columns to be kept
 */
function _removeExtraColumns_(sheet, blankColumns = 0) {
  if (sheet.getLastColumn() + blankColumns >= sheet.getMaxColumns()) return;
  sheet.deleteColumns(
    sheet.getLastColumn() + 1 + blankColumns,
    sheet.getMaxColumns() - sheet.getLastColumn() - blankColumns
  );
}

/**
 * Get column name by the index
 * @param {number} index The index of column starts from 0 (A)
 * @returns {string} The name of the column
 */
function _getColumnNameByIndex_(index) {
  const quotient = Math.floor(index / 26);
  const remainder = index % 26;
  const letter = String.fromCharCode(remainder + 65);
  if (quotient === 0) return letter;
  return _getColumnNameByIndex_(quotient - 1) + letter;
}

/**
 * Get the column index by the name
 * @param {string} name The name of the column like A,B,C,AZ
 * @returns {number} The index of column starts from 0
 */
function _getColumnIndexByName_(name) {
  name = name.toUpperCase();
  let value = -1;
  name.split("").forEach((c, i) => {
    value += (c.codePointAt(0) - 64) * 26 ** (name.length - i - 1);
  });
  return value;
}

/**
 * Generate a random password
 * @param {number} digits The length of the password to be generated
 * @returns {string} A random password
 */
function _generatePassword_(digits = 6) {
  const letters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST0123456789!@#$%^&*._-";
  return Array(digits)
    .fill("")
    .map(() => letters[Math.floor(Math.random() * letters.length)])
    .join("");
}

function _generateUuid_() {
  const uuid = Utilities.getUuid().replace(/\-/g, "");
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST0123456789";
  const prefix = Array(12)
    .fill("")
    .map(() => letters[Math.floor(Math.random() * letters.length)])
    .join("");
  return prefix + "." + uuid;
}

/**
 * Hash password with a secret
 * @param {string} password The original password
 * @param {string} secret The secret used to hash the password
 * @returns {string} A hashed password
 */
function _hashPassword_(password, secret) {
  return Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(password, secret)
  );
}

/**
 * Verify the hashed password with normal password
 * @param {string} password The original password
 * @param {string} hashedPassword The hashed password
 * @param {string} secret The secret used to verify the passwords
 * @param {number} expiredInSeconds The expiration of the token in seconds
 * @returns {boolean} The password validation result
 */
function _verifyHashedPassword_(password, hashedPassword, secret) {
  return _hashPassword_(password, secret) === hashedPassword;
}

function _createJwtToken_(payload, secret, expiredInSeconds = null) {
  const header = Utilities.base64Encode(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    })
  );
  if (expiredInSeconds) {
    payload.exp = new Date().getTime() / 1000 + expiredInSeconds;
  }
  payload = Utilities.base64Encode(JSON.stringify(payload));
  secret = Utilities.base64Encode(secret);
  const hashedSecret = _hashPassword_(`${header}.${payload}`, secret);
  return `${header}.${payload}.${hashedSecret}`;
}

function _verifyJwtToken_(token, secret) {
  secret = Utilities.base64Encode(secret);
  const [header, payload, key] = token.split(".");
  if (key !== _hashPassword_(`${header}.${payload}`, secret)) {
    return false;
  }
  token = JSON.parse(
    Utilities.newBlob(Utilities.base64Decode(payload)).getDataAsString()
  );
  if (!token.exp) return token;
  if (token.exp > new Date().getTime() / 1000) return token;
  return false;
}

function _daysBetweenTwo_(startDate, endDate) {
  return Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000));
}

function _getErrorMessage_(error) {
  return error.stack
    ? error.stack.split("\n").slice(0, 2).join("\n")
    : error.message;
}

function _tryAction_(functionName, title = "Script") {
  try {
    functionName();
  } catch (error) {
    console.log(error.stack);
    const msg = _getErrorMessage_(error);
    _alert_(msg, title);
  }
}

function _showVersions_(
  versions = VERSIONS,
  count = 3,
  message = null,
  title = "Versions"
) {
  const changes = count > 0 ? versions.slice(0, count) : versions;
  const messageLines = changes.map(({ date, items }) => {
    return [
      date.toLocaleDateString(),
      ...items.map((item, index) => `${index + 1}. ${item}`),
      "",
    ].join("\n");
  });
  if (message) {
    messageLines.unshift(`${message}\n`);
  }
  return _alert_(messageLines.join("\n"), title);
}

function _showUpdates_(
  versions,
  title = "Updates",
  msg = "We have some updates:"
) {
  const currentVersion = versions[0].date.getTime();
  const key = "version";
  const props = PropertiesService.getUserProperties();
  const lastVersion = props.getProperty(key);
  if (lastVersion == currentVersion) {
    return;
  }
  props.setProperty(key, currentVersion);
  _showVersions_(versions, 1, msg, title);
}

function _exportSpreadsheetAsPdf_(
  spreadsheetId,
  accessToken = ScriptApp.getOAuthToken(),
  options = {}
) {
  const queryParams = {
    size: "A4",
    format: "pdf",
    portrait: true,
    download: true,
    fitw: true,
    gridlines: false,
    top_margin: 0.25,
    right_margin: 0.25,
    bottom_margin: 0.25,
    left_margin: 0.25,
    ...options,
  };
  const queryString = _createQueryString_(queryParams);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${queryString}`;
  return UrlFetchApp.fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).getBlob();
}

function _getFolderById_(id, times = 5) {
  let folder = null;
  while (!folder && times > 0) {
    times--;
    try {
      folder = DriveApp.getFolderById(id);
    } catch (error) {
      console.info(error.message);
      Utilities.sleep(500);
    }
  }
  return folder;
}

function _rgbToHex_(r, g, b) {
  return ["#", r.toString(16), g.toString(16), b.toString(16)].join("");
}

function _getLineType_(line) {
  const match = line.match(/<\/(h[1-6])>/i);
  if (!match) return "p";
  return match[1];
}

function _getLineText_(line) {
  const match = line.match(/>*([^<>]*)</gm);
  if (!match) return line;
  return match.map((v) => v.replace(/^>/, "").replace(/<$/, "")).join("");
}

function _getLineStyles_(line) {
  const styles = {};
  const match = line.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (match) {
    styles.color = _rgbToHex_(match[1] * 1, match[2] * 1, match[3] * 1);
  }
  if (/<\/strong>/.test(line)) {
    styles.isBold = true;
  }
  if (/<\/em>/.test(line)) {
    styles.isItalic = true;
  }
  if (/<\/u>/.test(line)) {
    styles.isUnderline = true;
  }
  if (/<\/s>/.test(line)) {
    styles.isStrikethrough = true;
  }
  return styles;
}

function _processLine_(line) {
  const type = _getLineType_(line);
  const text = _getLineText_(line);
  return {
    line,
    text,
    type,
    styles: _getLineStyles_(line),
  };
}

function _htmlToRichTextValue_(html) {
  if (!html) return null;
  const fontsize = {
    h1: 22,
    h2: 20,
    h3: 18,
    h4: 16,
    h5: 14,
    h6: 12,
  };
  const lines = html
    .split(/<[hp123456]+>/)
    .filter((v) => v)
    .map((v) => _processLine_(v));
  const value = lines.map((v) => v.text).join("\n");
  const richTextValueBuilder = SpreadsheetApp.newRichTextValue().setText(value);
  let startIndex = 0;
  lines.forEach((line) => {
    const text = line.text;
    if (text == "") return startIndex++;
    const endOffset = startIndex + text.length;
    const style = SpreadsheetApp.newTextStyle();

    if (/h[1-6]/.test(line.type)) {
      style.setFontSize(fontsize[line.type]);
    }
    line.styles.isBold && style.setBold(true);
    line.styles.isItalic && style.setItalic(true);
    line.styles.isStrikethrough && style.setStrikethrough(true);
    line.styles.isUnderline && style.setUnderline(true);
    line.styles.color && style.setForegroundColor(line.styles.color);
    richTextValueBuilder.setTextStyle(startIndex, endOffset, style.build());
    startIndex += text.length + 1;
  });
  return richTextValueBuilder.build();
}

function _getSheetById_(id) {
  if (typeof id === "number") {
    return SpreadsheetApp.getActive()
      .getSheets()
      .find((v) => v.getSheetId() == id);
  }
  return SpreadsheetApp.getActive().getSheetByName(id);
}

function _getValuesByRangeName_(name, filter = (v) => v.some((v) => v !== "")) {
  const range = SpreadsheetApp.getActive().getRange(name);
  if (!filter) {
    return range.getValues();
  }
  return range.getValues().filter((v) => filter(v));
}

function _processDateValues_(values) {
  return values.map((rowValues) => {
    return rowValues.map((v) => {
      return /\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : v;
    });
  });
}
