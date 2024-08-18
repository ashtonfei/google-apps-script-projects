const deleteTriggers_ = () => {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
};

const installTrigger = () => {
  deleteTriggers_();
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger("triggerOnFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  PropertiesService.getScriptProperties().setProperty("installed", "yes");
  onOpen();
  ss.toast("Trigger has been installed.", "GAS122", 5);
};

const uninstallTrigger = () => {
  deleteTriggers_();
  PropertiesService.getScriptProperties().deleteProperty("installed");
  onOpen();
  SpreadsheetApp.getActive().toast(
    "Trigger has been uninstalled.",
    "GAS122",
    5,
  );
};

const onOpen = () => {
  const installed = PropertiesService.getScriptProperties().getProperty(
    "installed",
  );
  const menu = SpreadsheetApp.getUi().createMenu("GAS112");
  if (installed) {
    menu.addItem("Uninstall trigger", "uninstallTrigger");
  } else {
    menu.addItem("Install trigger", "installTrigger");
  }
  menu.addToUi();
};

/**
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
const triggerOnFormSubmit = (e) => {
  const settings = getSettings_("Settings");
  const row = e.range.getRow();
  const sheet = e.range.getSheet();
  const { errorHeader, imageHeader, imageField, emailField, emailImage, size } =
    settings;
  const updates = {
    [errorHeader]: "Success",
  };

  try {
    const values = parseNamedValues_(e.namedValues);
    const imageUrl = values[imageField];
    const imageId = imageUrl.split("id=")[1];
    if (!imageId) {
      throw new Error(`No image uploaded at the field "${imageField}".`);
    }
    const imageFile = DriveApp.getFileById(imageId);
    const newImage = compressImageFile_(imageFile, size);

    if (settings.trashMe) {
      imageFile.setTrashed(true);
    }

    if (emailImage && values[emailField]) {
      sendImage_(values, newImage, settings);
    }
    updates[imageHeader] = newImage.getUrl();
  } catch (err) {
    updates[errorHeader] = err.message;
  } finally {
    console.log(updates);
    updateRowValues_(sheet, row)(updates, true);
  }
};
