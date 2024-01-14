const _getUi_ = () => SpreadsheetApp.getUi();

const _createAlert_ = (ui = _getUi_()) => (title) => (msg) =>
  ui.alert(title, msg, ui.ButtonSet.OK);

const _createConfirm_ = (ui = _getUi_()) => (title) => (msg) => {
  return ui.alert(title, msg, ui.ButtonSet.YES_NO);
};

const _createMenu_ = (ui = _getUi_()) => (items, caption = null) => {
  const menu = caption ? ui.createMenu(caption) : ui.createAddonMenu();
  const createMenuItem = ({ title, items, caption, fn, sep }) => {
    if (title && items) {
      return menu.addSubMenu(_createMenu_(ui)(items, title));
    }
    if (caption && fn) return menu.addItem(caption, fn);

    if (sep) return menu.addSeparator();
  };
  items.forEach(createMenuItem);
  return menu;
};

/**
 * @param {Function[]} rules - A list of functions which return true or an error message
 * @param {any} value - The value to be checked
 * @returns {string[]} A list of error messages
 */
const _createValidator_ = (rules) => (value) =>
  rules
    .map((rule) => rule(value))
    .filter((v) => v !== true)
    .map((v) => `${v}\nYour input: ${value}`);

/**
 * @param {string} title - The title of the prompt
 * @param {string} msg - The message body of the prompt
 * @param {Function[]|undefined} rules - A list of validator functions
 * @returns {string|null} return null if cancelled else return the value entered
 */
const _createInput_ = (title) => (msg) => (rules) => {
  const ui = SpreadsheetApp.getUi();
  const input = ui.prompt(title, msg, ui.ButtonSet.OK_CANCEL);
  if (input.getSelectedButton() !== ui.Button.OK) return null;
  const value = input.getResponseText();
  if (!rules) return value;
  const validator = _createValidator_(rules);
  const firstErrorMessage = validator(value)[0];
  if (!firstErrorMessage) return value;
  return _createInput_(title)(firstErrorMessage)(rules);
};

const _try_ = (fn) => {
  try {
    return fn();
  } catch (err) {
    console.log(err.stack);
    _createAlert_()("Error")(err.message);
  }
};

const _setProps_ =
  (ps = PropertiesService.getScriptProperties()) => (props) => {
    ps.setProperties(props);
  };

const _getProp_ = (ps = PropertiesService.getScriptProperties()) => (key) => {
  return ps.getProperty(key);
};

const _getProps_ = (ps = PropertiesService.getScriptProperties()) => {
  return ps.getProperties();
};

const _getSheetByName_ =
  (ss = SpreadsheetApp.getActive()) => (name, createIfNotFound) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
    if (createIfNotFound) return ss.insertSheet(name);
  };
