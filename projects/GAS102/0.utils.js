function _updateTextWithPlaceholders_(
  text,
  placeholders,
  caseSensitive = false,
) {
  if (text == "") return text;
  const flags = caseSensitive ? "g" : "gi";
  Object.entries(placeholders).forEach(([key, value]) => {
    text = text.replace(new RegExp(`{{${key}}}`, flags), value);
  });
  return text;
}

function _getTimezone_() {
  return (
    SpreadsheetApp.getActive().getSpreadsheetTimeZone() ||
    Session.getScriptTimeZone()
  );
}

function _getSheetByNameOrId_(nameOrId, ss = SpreadsheetApp.getActive()) {
  return ss
    .getSheets()
    .find(
      (sheet) => sheet.getSheetId() == nameOrId || sheet.getName() == nameOrId,
    );
}

/**
 * Convert a string to camel case
 * @param {string} str
 * @returns {string}
 */
function _toCamelCase_(str) {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((v) => v)
    .map((v, i) => (i == 0 ? v : `${v.charAt(0).toUpperCase()}${v.slice(1)}`))
    .join("");
}

function _getSettings_(sheetName = "Settings") {
  const settings = {};
  const sheet = _getSheetByNameOrId_(sheetName);
  if (!sheet) return settings;
  sheet
    .getDataRange()
    .getValues()
    .slice(1)
    .forEach(([key, value]) => {
      key = _toCamelCase_(key);
      if (key == "") return;
      if (key.endsWith("*")) return;
      settings[key] = value;
    });
  return settings;
}

function _getUi_() {
  return SpreadsheetApp.getUi();
}

function _alert_(msg, title = "Alert") {
  const ui = _getUi_();
  return ui.alert(title, msg, ui.ButtonSet.OK);
}

function _confirm_(msg, title = "Confirm") {
  const ui = _getUi_();
  return ui.alert(title, msg, ui.ButtonSet.YES_NO);
}

function _toast_(msg, title = "Toast", timeInSeconds = 5) {
  SpreadsheetApp.getActive().toast(msg, title, timeInSeconds);
}

function _getErrorMessage_(error) {
  return error.stack
    ? error.stack.split("\n").slice(0, 2).join("\n")
    : error.message;
}

function _tryAction_(action, title) {
  try {
    return action();
  } catch (error) {
    const msg = _getErrorMessage_(error);
    console.log(error.stack);
    _toast_(msg, title, 0.1);
    _alert_(msg, title);
  }
}
