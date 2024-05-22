/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string|number} nameOrId
 * @returns {GoogleAppsScript.Spreadsheet.Sheet|undefined}
 */
const _getSheet_ = (ss = SpreadsheetApp.getActive()) => (nameOrId) => {
  return ss
    .getSheets()
    .find(
      (sheet) => sheet.getName() == nameOrId || sheet.getSheetId() == nameOrId,
    );
};

const _getSettings_ =
  (ss = SpreadsheetApp.getActive()) => (sheetName = "Settings") => {
    const sheet = _getSheet_(ss)(sheetName);
    const settings = {};
    sheet
      .getDataRange()
      .getValues()
      .forEach(([key, value], index) => {
        if (index === 0) return;
        key = key.trim();
        if (!key) return;
        settings[key] = value;
      });
    return settings;
  };

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Function} filter
 */
const _getItemsFromSheet_ = (sheet, filter = null) => {
  const items = [];
  const createItem = (keys, values) => {
    const item = {};
    keys.forEach((key, index) => (item[key] = values[index]));
    return item;
  };
  const [headers, ...values] = sheet.getDataRange().getDisplayValues();
  values.forEach((rowValues, index) => {
    const item = createItem(headers, rowValues);
    item.row_ = index + 1;
    if (!filter) return items.push(item);
    filter(item) && items.push(item);
  });
  return items;
};
