const _getUi_ = () => SpreadsheetApp.getUi();

const _createAlert_ = (title = "Alert") => (msg) => {
  const ui = _getUi_();
  return ui.alert(title, msg, ui.ButtonSet.OK);
};

const _createConfirm_ = (title = "Confirm") => (msg) => {
  const ui = _getUi_();
  return ui.alert(title, msg, ui.ButtonSet.YES_NO);
};

const _getProperty_ = (ps = PropertiesService.getScriptProperties()) => (key) =>
  ps.getProperty(key);

const _setProperty_ =
  (ps = PropertiesService.getScriptProperties()) => (key, value) =>
    ps.setProperty(key, value);

const _getHeaders_ = (items) => {
  const headers = [];
  const keys = [];
  items.forEach(({ key, value }) => {
    headers.push(value);
    keys.push(key);
  });
  return { keys, headers };
};

const _createRowValues_ = (keys) => (item) => {
  return keys.map((key) => item[key]);
};

const _getSheetByName_ =
  (ss = SpreadsheetApp.getActive()) => (name, createNewIfNotFound = true) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
    if (createNewIfNotFound) return ss.insertSheet(name);
  };

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
const _valuesToSheet_ = (sheet) => (values) => {
  sheet.clearContents();
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  return sheet;
};

const _action_ = (fn) => {
  try {
    return fn();
  } catch (err) {
    _createAlert_("Error")(err.message);
  }
};
