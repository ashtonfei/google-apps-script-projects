/**
 * @returns {GoogleAppsScript.Calendar.CalendarEvent[]}
 */
function getEventsFromCalendar_(calendarId, days = 30, minutes = 30) {
  const calendar = CalendarApp.getCalendarById(calendarId);
  const now = new Date();
  const startTime = new Date(now.getTime() + minutes * 60 * 1000);
  const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return calendar.getEvents(startTime, endTime);
}

/**
 * @param {string} formId
 * @param {string} fieldName
 * @param {string[]} events
 */
function updateEventsInForm_(formUrl, fieldName, events) {
  const form = FormApp.openByUrl(formUrl);

  const field = form.getItems().find((item) => item.getTitle() == fieldName);
  if (!field) {
    throw new Error(`Field title "${fieldName}" was not foud in the form.`);
  }
  events = [...new Set(events)];
  field.asListItem().setChoiceValues(events);
  return form;
}

function uninstallTriggers_() {
  ScriptApp.getProjectTriggers().forEach((trigger) =>
    ScriptApp.deleteTrigger(trigger)
  );
  PropertiesService.getScriptProperties().deleteProperty(
    CONFIG.KEY.TRIGGERS_INSTALLED,
  );
  onOpen();
}

function createCalendarTrigger_(calendarId) {
  return ScriptApp.newTrigger(ACTION.ON_CALENDAR_CHANGE.ACTION)
    .forUserCalendar(calendarId)
    .onEventUpdated()
    .create();
}

function createFormSubmitTrigger_(spreadsheetId) {
  return ScriptApp.newTrigger(ACTION.ON_FORM_SUBMIT.ACTION)
    .forSpreadsheet(spreadsheetId)
    .onFormSubmit()
    .create();
}

function installTriggers_() {
  uninstallTriggers_();
  const { calendarId } = _getSettings_();
  createCalendarTrigger_(calendarId);
  const spreadsheetId = SpreadsheetApp.getActive().getId();
  createFormSubmitTrigger_(spreadsheetId);
  ScriptApp.newTrigger(ACTION.EVERY_30_MINS.ACTION)
    .timeBased()
    .everyMinutes(30)
    .create();
  PropertiesService.getScriptProperties().setProperty(
    CONFIG.KEY.TRIGGERS_INSTALLED,
    true,
  );
  onOpen();
}
