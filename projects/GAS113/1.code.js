const CONFIG = {
  RANGE: {
    START: "start", // where the start time of the timer is saved
    TASK: "task", // where the row number of the selected task is saved
    REFRESH: "H1", // a cell used for refreshing the timer (the cell will be cleared by the script)
    REPORT_FROM: "reportFrom", // where the email of the active user will be entered
    REPORT_TO: "reportTo", // where the email of the report should be sent to
    REPORT_BY: "reportBy", // where the name of the sender saved
  },
  SHEET: {
    TASKS: "Tasks",
    RECORDS: "Records",
    REPORT: "Report",
  },
  EMAIL: {
    SUBJECT: "Time Tracking Report to {{reportClient}}", // placeholders (named ranges for report) can be used
    CC: "",
    BCC: "",
  },
};

const refreshTimer = () => {
  const start = SpreadsheetApp.getActive().getRange(CONFIG.RANGE.START);
  const range = start.getSheet().getRange(CONFIG.RANGE.REFRESH);
  range.setValue("refresh");
  _flush_();
  range.setValue(null);
};

const installTrigger_ = () => {
  const fn = "refreshTimer";
  uninstallTrigger_();
  ScriptApp.newTrigger(fn).timeBased().everyMinutes(1).create();
};

const uninstallTrigger_ = () => {
  const fn = "refreshTimer";
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() == fn) ScriptApp.deleteTrigger(t);
  });
};

const startTimer_ = () => {
  const ss = SpreadsheetApp.getActive();
  const start = ss.getRange(CONFIG.RANGE.START).getValue();
  if (start) {
    throw new Error("There is a running timer.");
  }
  const selectedRow = ss.getRange(CONFIG.RANGE.TASK).getValue();
  if (selectedRow) {
    throw new Error("There is a running timer.");
  }

  const activeCell = ss.getActiveCell();
  const row = activeCell.getRow();
  if (row <= 2) {
    throw new Error("Active row is not a task item.");
  }

  let [task, project] = activeCell
    .getSheet()
    .getRange(`${row}:${row}`)
    .getValues()[0];

  task = task.trim();
  project = project.trim();

  if (!task || !project) {
    throw new Error("No task or project in the active row.");
  }

  ss.getRange(CONFIG.RANGE.START).setValue(new Date());
  ss.getRange(CONFIG.RANGE.TASK).setValue(row);
  installTrigger_();
  _toast_("Timer")("Started");
};

const stopTimer_ = () => {
  const ss = SpreadsheetApp.getActive();
  const end = new Date();
  const start = ss.getRange(CONFIG.RANGE.START).getValue();
  const row = ss.getRange(CONFIG.RANGE.TASK).getValue();

  if (!start || !row) {
    throw new Error("No timer to be stopped.");
  }

  const ui = _getUi_();
  const confirm = _createConfirm_("Confirm")(
    `Are you sure to stop the timer?

    Yes - Stop timer and save it as a record
    No - Keep timer and do nothing
    Cancel - Cancel timer without saving a record`,
    ui.ButtonSet.YES_NO_CANCEL,
  );
  if (ui.Button.CANCEL == confirm) {
    ss.getRange(CONFIG.RANGE.START).setValue(null);
    ss.getRange(CONFIG.RANGE.TASK).setValue(null);
    return;
  }

  if (ui.Button.YES != confirm) {
    return;
  }

  const sheetTasks = ss.getSheetByName(CONFIG.SHEET.TASKS);
  const values = sheetTasks.getRange(`${row}:${row}`).getValues()[0];
  const [task, project, status, billable] = values;
  const hourlyRate = values[6];

  const sheetRecords = ss.getSheetByName(CONFIG.SHEET.RECORDS);
  const record = [task, project, status, billable, hourlyRate, start, end];
  sheetRecords
    .getRange(sheetRecords.getLastRow() + 1, 1, 1, record.length)
    .setValues([record]);

  uninstallTrigger_();
  ss.getRange(CONFIG.RANGE.TASK).setValue(null);
  ss.getRange(CONFIG.RANGE.START).setValue(null);

  _toast_("Timer")("Stopped");
};

const sendReport_ = () => {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CONFIG.SHEET.REPORT);
  if (!sheet) {
    throw new Error(`Sheet "Report" was missing.`);
  }
  sheet.activate();
  const ui = _getUi_();
  const confirm = _createConfirm_("Confirm")(
    "Are you sure to send this report?",
  );
  if (ui.Button.YES != confirm) {
    return;
  }
  const activeUser = Session.getActiveUser().getEmail();
  sheet.getRange(CONFIG.RANGE.REPORT_FROM).setValue(activeUser);
  SpreadsheetApp.flush();

  const filter = (v) => /report.+/.test(v);
  const data = _getNamedValues_(ss)(filter);
  textUpdater = _updateTextWithPlaceholders_(data);
  const subject = textUpdater(CONFIG.EMAIL.SUBJECT);
  const recipient = data[CONFIG.RANGE.REPORT_TO];
  const template = HtmlService.createTemplateFromFile("email.html");
  template.data = data;

  const report = _exportSpreadsheetAsPdf_(
    ss.getId(),
    ScriptApp.getOAuthToken(),
    {
      gid: sheet.getSheetId(),
    },
  ).setName("Time Tracking Reprot.pdf");

  const options = {
    htmlBody: template.evaluate().getContent(),
    name: data[CONFIG.RANGE.REPORT_BY],
    attachments: [report],
    cc: CONFIG.EMAIL.CC,
    bcc: CONFIG.EMAIL.BCC,
  };
  GmailApp.sendEmail(recipient, subject, "", options);
  _toast_("Report")("Sent!");
};

const onStartTimer = () => _try_(startTimer_);

const onStopTimer = () => _try_(stopTimer_);

const onSendReport = () => _try_(sendReport_);

const onOpen = () => {
  const ui = _getUi_();
  const menu = ui.createMenu("GAS113");
  menu.addItem("Send report", "onSendReport");
  menu.addToUi();
};
