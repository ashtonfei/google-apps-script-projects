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

const _try_ = (fn) => {
  try {
    return fn();
  } catch (err) {
    _error_(err.message);
  }
};
