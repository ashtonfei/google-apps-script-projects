/**
 * @param {GoogleAppsScript.Events.FormsOnFormSubmit} e
 */
const getNamedValues_ = (e) => {
  const values = {};
  e.response.getItemResponses().forEach((ir) => {
    const item = ir.getItem();
    const title = item.getTitle().trim().toLowerCase().replace(/\s+/g, "_");
    const value = ir.getResponse();
    values[title] = value;
  });
  return values;
};

const createEvent_ = (values) => {
  const { calendar, title, description, guests, location, from, to } = values;
  const startTime = new Date(from);
  const endTime = new Date(to);
  if (startTime >= endTime) {
    throw new Error(`Event start time is greater than end time.`);
  }
  const calendarFound = CalendarApp.getCalendarsByName(calendar)[0] ||
    CalendarApp.getDefaultCalendar();
  const event = calendarFound.createEvent(title, startTime, endTime);
  description && event.setDescription(description);
  guests && event.addGuest(guests);
  location && event.setLocation(location);
};

/**
 * @param {GoogleAppsScript.Events.FormsOnFormSubmit} e
 */
const onFormSubmit_ = (e) => {
  if (!e) return console.error("Form submit event object is missing.");
  const values = getNamedValues_(e);
  createEvent_(values);
};

const triggerOnFormSubmit = (e) => onFormSubmit_(e);

const deleteTriggers_ = () => {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
};

const installTrigger = () => {
  const fn = "triggerOnFormSubmit";
  deleteTriggers_();
  const form = FormApp.getActiveForm();
  ScriptApp.newTrigger(fn).forForm(form).onFormSubmit().create();
  const ui = FormApp.getUi();
  ui.alert("Trigger has been installed.");
};

const uninstallTrigger = () => {
  deleteTriggers_();
  const ui = FormApp.getUi();
  ui.alert("Trigger has been uninstalled.");
};

const onOpen = () => {
  const ui = FormApp.getUi();
  ui.createMenu("GAS013")
    .addItem("Install trigger", "installTrigger")
    .addItem("Uninstall trigger", "uninstallTrigger")
    .addToUi();
};
