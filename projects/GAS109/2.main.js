const CONFIG = {
  NAME: "FormSign",
  MENU: {
    INSTALL: {
      caption: "Install",
      fn: "actionInstallFormSign",
    },
    UNINSTALL: {
      caption: "Uninstall",
      fn: "actionUninstallFormSign",
    },
  },
  TRIGGER: {
    ON_FORM_SUBMIT: {
      fn: "triggerOnFormSubmit",
    },
  },
  KEY: {
    INSTALLED: "installed",
  },
};

const triggerOnFormSubmit = (e) => onFormSubmit_(e);

const sendSignRequest_ = (values, settings) => {
  const recipient = values[settings.headerEmail];
  const { signSubject, signBody, signBcc } = settings;
  const subject = updateTextWithPlaceholders_(signSubject, values);
  const htmlBody = updateTextWithPlaceholders_(
    addLineBreaks_(signBody),
    values,
  );
  const options = {
    htmlBody,
    name: settings.name,
  };
  if (signBcc) {
    options.bcc = signBcc;
  }
  GmailApp.sendEmail(recipient, subject, "", options);
};

const deleteTriggers_ = (filter = null) => {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (!filter) ScriptApp.deleteTrigger(t);
    filter(t) && ScriptApp.deleteTrigger(t);
  });
};

const installTriggers_ = () => {
  const confirm = confirm_(
    "Are you sure to install FormSign for the linked form in the Spreadsheet?",
  );
  const ui = SpreadsheetApp.getUi();
  if (confirm !== ui.Button.YES) return;

  const { fn } = CONFIG.TRIGGER.ON_FORM_SUBMIT;
  const filter = (trigger) => trigger.getHandlerFunction() == fn;
  deleteTriggers_(filter);
  const form = getLinkedForm_();
  if (!form) throw new Error("No form is linked to current Spreadsheet.");
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger(fn).forSpreadsheet(ss).onFormSubmit().create();
  const key = CONFIG.KEY.INSTALLED;
  const user = Session.getActiveUser().getEmail();
  PropertiesService.getScriptProperties().setProperty(key, user);
  onOpen();
  alert_("FormSign trigger has been installed.", "Success");
};

const uninstallTriggers_ = () => {
  const key = CONFIG.KEY.INSTALLED;
  const user = Session.getActiveUser().getEmail();
  const installed = PropertiesService.getScriptProperties().getProperty(key);
  if (installed !== user) {
    return alert_(
      `You can't uninstall it since you are not the owner(${installed}).`,
      "Error",
    );
  }
  const confirm = confirm_(
    "Are you sure to uninstall FormSign for the linked form in the Spreadsheet?",
  );
  const ui = SpreadsheetApp.getUi();
  if (confirm !== ui.Button.YES) return;

  const { fn } = CONFIG.TRIGGER.ON_FORM_SUBMIT;
  const filter = (trigger) => trigger.getHandlerFunction() == fn;
  deleteTriggers_(filter);
  PropertiesService.getScriptProperties().deleteProperty(key);
  onOpen();
  alert_("FormSign trigger has been uninstalled.", "Success");
};

const installFormSign_ = () => {
  installTriggers_();
};

/**
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
const onFormSubmit_ = (e) => {
  const { range } = e || {};
  if (!range) {
    error_("Invalid event for SheetOnFormSubmit");
  }
  const settings = getSettings_();
  const sheet = e.range.getSheet();
  settings.sheet = sheet;
  const row = range.rowStart;
  settings.row = row;

  const headers = sheet.getRange("1:1").getDisplayValues()[0];
  const values = sheet.getRange(`${row}:${row}`).getDisplayValues()[0];
  const item = createItem_(headers, values);
  const uuid = Utilities.getUuid();
  item[settings.headerUuid] = uuid;
  const signUrl = `${settings.url}?id=${uuid}`;
  item[settings.headerSignUrl] = signUrl;
  item[settings.headerSignStatus] = "Pending";

  sendSignRequest_(item, settings);

  const updates = {
    [settings.headerUuid]: uuid,
    [settings.headerSignUrl]: signUrl,
    [settings.headerSignStatus]: item[settings.headerSignStatus],
  };
  updateRowValues_(settings.sheet)(settings.row, updates);
};

const onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  const name = CONFIG.NAME;
  const key = CONFIG.KEY.INSTALLED;
  const installed = PropertiesService.getScriptProperties().getProperty(key);
  let menuItems = [CONFIG.MENU.INSTALL];
  if (installed) {
    menuItems = [CONFIG.MENU.UNINSTALL];
  }
  const menu = createMenu_(ui)(menuItems, name);
  menu.addToUi();
};

const actionInstallFormSign = () => installTriggers_();
const actionUninstallFormSign = () => uninstallTriggers_();
