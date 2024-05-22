function _toCamelCase_(text) {
  const words = text
    .toString()
    .trim()
    .toLowerCase()
    .split(/\s*[-_\*\s]+\s*/);
  return words
    .filter((v) => v)
    .map((v, i) => (i === 0 ? v : v.charAt(0).toUpperCase() + v.slice(1)))
    .join("");
}

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
      if (/^\[.*\]$/.test(key)) return;
      key = _toCamelCase_(key);
      settings[key] = value;
    });
  return settings;
}

function _getNestedValueFromObject_(item, path) {
  path.split(".").forEach((k) => (item = item?.[k]));
  return item;
}

function _getNextSyncToken_(id) {
  return Calendar.Events.list(id, { maxResult: 1 }).nextSyncToken;
}

function _getLastestEvent_(id, syncToken) {
  let res = null;
  try {
    res = Calendar.Events.list(id, { syncToken });
  } catch (error) {
    syncToken = _getNextSyncToken_(id);
    res = Calendar.Events.list(id, { syncToken });
  }
  return {
    nextSyncToken: res.nextSyncToken,
    event: res.items[0],
  };
}

function _createQueryString_(queryObject) {
  return Object.entries(queryObject)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function _exportSheetAsPdf_(
  sheetId,
  spreadsheetId = SpreadsheetApp.getActive().getId(),
  { size, portrait }
) {
  size =
    [
      "Letter",
      "Tabloid",
      "Legal",
      "Statement",
      "Executive",
      "Folio",
      "A3",
      "A4",
      "B4",
      "B5",
    ].indexOf(size) || 7;
  const queryObject = {
    format: "pdf",
    fzr: true,
    size,
    portrait,
    gid: sheetId,
    gridlines: false,
    download: true,
  };
  const queryString = _createQueryString_(queryObject);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${queryString}`;
  const token = ScriptApp.getOAuthToken();
  return UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).getBlob();
}

function _getErrorMessage_(error) {
  return error.stack
    ? error.stack.split("\n").slice(0, 2).join("\n")
    : error.message;
}

function _tryFunction_(functionName, title = "Script") {
  try {
    functionName();
  } catch (error) {
    const msg = _getErrorMessage_(error);
    _toast_(msg, title, 0.01);
    return _alert_(msg, title);
  }
}
