const _getUi_ = () => SpreadsheetApp.getUi();

const _flush_ = () => SpreadsheetApp.flush();

const _toast_ = (title = "Toast") => (msg, timeoutSeconds = 3) => {
  return SpreadsheetApp.getActive().toast(msg, title, timeoutSeconds);
};

const _createAlert_ = (title = "Alert") => (msg) => {
  const ui = _getUi_();
  return ui.alert(title, msg, ui.ButtonSet.OK);
};

const _error_ = _createAlert_("Error");
const _warning_ = _createAlert_("Warning");
const _success_ = _createAlert_("Success");

const _createConfirm_ = (title = "Confirm") => (msg, buttons) => {
  const ui = _getUi_();
  return ui.alert(title, msg, buttons || ui.ButtonSet.YES_NO);
};

const _updateTextWithPlaceholders_ = (data) => (text) => {
  Object.entries(data).forEach(([key, value]) => {
    text = text.replace(new RegExp(`{{${key}}}`, "gi"), value);
  });
  return text;
};

const _getNamedValues_ =
  (ss = SpreadsheetApp.getActive()) => (filter = null) => {
    const values = {};
    ss.getNamedRanges().forEach((namedRange) => {
      const key = namedRange.getName();
      const value = namedRange.getRange().getDisplayValue();
      if (!filter) {
        return (values[key] = value);
      }
      if (!filter(key)) return;
      values[key] = value;
    });
    return values;
  };

const _createQueryString_ = (params) => {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
};

const _exportSpreadsheetAsPdf_ = (
  spreadsheetId,
  accessToken = ScriptApp.getOAuthToken(),
  options = {},
) => {
  const queryParams = {
    size: "Letter",
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
  const url =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${queryString}`;
  return UrlFetchApp.fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).getBlob();
};

const _try_ = (fn) => {
  try {
    return fn();
  } catch (err) {
    _error_(err.message);
  }
};
