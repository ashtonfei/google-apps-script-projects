const installTrigger = () => {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("triggerOnFormSubmit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
  PropertiesService.getScriptProperties().setProperty("installed", "true");
  onOpen();
};

const uninstallTrigger = () => {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  PropertiesService.getScriptProperties().deleteProperty("installed");
  onOpen();
};

const onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu("GAS114");
  const installed =
    PropertiesService.getScriptProperties().getProperty("installed");
  menu.addItem("Image annotate", "demoSheetsIntegration");
  if (installed) {
    menu.addItem("Uninstall trigger", "uninstallTrigger");
  } else {
    menu.addItem("Install trigger", "installTrigger");
  }
  menu.addToUi();
};
