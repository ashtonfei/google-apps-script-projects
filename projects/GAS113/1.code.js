const CONFIG = {
  RANGE: {
    START: "start",
    TASK: "task",
    TIMER: "timer",
  },
  SHEET: {
    TASKS: "Tasks",
    RECORDS: "Records",
  },
};

const refreshTimer = () => {
  const start = SpreadsheetApp.getActive().getRange("start");
  const range = start.getSheet().getRange("G1");
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

    YES - Stop timer and save it as a record
    NO - Keep timer and do nothing
    CANCEL - Cancel timer without saving a record`,
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
  const [task, project, status, billable, hourlyRate] = values;

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

const onStartTimer = () => _try_(startTimer_);

const onStopTimer = () => _try_(stopTimer_);
