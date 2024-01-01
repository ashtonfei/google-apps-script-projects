const _getSheetByName_ =
  (ss = SpreadsheetApp.getActive()) => (name, create = true) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
    if (create) return ss.insertSheet(name);
  };

const _getSheetById_ = (ss = SpreadsheetApp.getActive()) => (id) => {
  return ss.getSheets().find((sheet) => sheet.getSheetId() == id);
};

const _valuesToSheet_ = (sheet) => (values, row = 1, col = 1) => {
  if (typeof sheet === "string") {
    sheet = _getSheetByName_()(sheet);
  }
  return sheet
    .getRange(row, col, values.length, values[0].length)
    .setValues(values);
};

const _getUi_ = () => SpreadsheetApp.getUi();

const _createAlert_ = (title = "Alert") => (msg) => {
  const ui = _getUi_();
  return ui.alert(title, msg, ui.ButtonSet.OK);
};

const _createConfirm_ = (title = "Confirm") => (msg) => {
  const ui = _getUi_();
  return ui.alert(title, msg, ui.ButtonSet.YES_NO);
};

const _getIdFromUrl_ = (url) => {
  const keywords = [
    "/projects/",
    "/spreadsheets/d/",
    "/presentation/d/",
    "/document/d/",
    "/forms/d/",
  ];
  const key = keywords.find((key) => url.includes(key));
  if (!key) return url;
  return url.split(key)[1].split("/")[0];
};

const _action_ = (fn) => {
  try {
    return fn();
  } catch (err) {
    console.log(err);
    _createAlert_("Error")(err.message);
  }
};

const _updateCell_ = (range, col) => (row, value) => {
  range.getCell(row, col).setValue(value);
};
