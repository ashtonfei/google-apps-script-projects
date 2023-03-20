function _getUi_() {
  return SpreadsheetApp.getUi();
}

function _alert_(message, title) {
  const ui = _getUi_();
  return ui.alert(title, message, ui.ButtonSet.OK);
}

function _confirm_(message, title) {
  const ui = _getUi_();
  return ui.alert(title, message, ui.ButtonSet.YES_NO);
}

function _prompt_(message, title) {
  const ui = _getUi_();
  return ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
}

function _toast_(message, title, timeOutSecond = 5) {
  return SpreadsheetApp.getActive().toast(message, title, timeOutSecond);
}

function _getSheetById_(id) {
  return SpreadsheetApp.getActive()
    .getSheets()
    .find((sheet) => sheet.getSheetId() == id);
}

function _getSettings_(sheetId = 0) {
  const settings = {};
  const sheet = _getSheetById_(sheetId);
  sheet
    .getDataRange()
    .getValues()
    .slice(1)
    .forEach(([key, value]) => {
      key = key.toString().trim();
      if (key.endsWith("*")) return;
      settings[key] = value;
    });
  return settings;
}
