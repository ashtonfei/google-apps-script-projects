const getAppData_ = () => {
  const ss = SpreadsheetApp.getActive();
  const settings = _getSettings_(ss)("Settings");
  const sheetData = _getSheet_(ss)(settings.sheetNameData);
  const data = _getItemsFromSheet_(sheetData);
  return {
    data,
    settings,
  };
};

const doGet = () => {
  const data = getAppData_();
  const { app } = data.settings;
  const template = HtmlService.createTemplateFromFile("index.html");
  template.data = JSON.stringify(data);
  const output = template
    .evaluate()
    .setTitle(app || "App Name Not Assigned")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
  return output;
};
