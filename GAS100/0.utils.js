const _getUi_ = () => SpreadsheetApp.getUi();

const _toast_ = (msg, title = "Toast", timeoutSeconds = 6) =>
  SpreadsheetApp.getActive().toast(msg, title, timeoutSeconds);

const _alert_ = (msg, title, type = null) => {
  type && (msg = [type, "", msg].join("\n"));
  const ui = _getUi_();
  _toast_(msg, title, 0.01);
  return ui.alert(title, msg, ui.ButtonSet.OK);
};

const _prompt_ = (msg, title) => {
  const ui = _getUi_();
  return ui.prompt(title, msg, ui.ButtonSet.OK_CANCEL);
};

const _getErrorMessage_ = (error) => {
  return error.stack
    ? error.stack.split("\n").slice(0, 2).join("\n")
    : error.message;
};

const _tryAction_ = (action, title = APP_NAME) => {
  try {
    action();
  } catch (error) {
    const msg = _getErrorMessage_(error);
    _toast_(msg, title, 0.01);
    _alert_(msg, title, "🟥 Error");
  }
};
