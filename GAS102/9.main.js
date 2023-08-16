function onOpen() {
  const ui = _getUi_();
  const menu = ui.createMenu(CONFIG.NAME);
  const areTriggersInstalled = PropertiesService.getScriptProperties()
    .getProperty(
      CONFIG.KEY.TRIGGERS_INSTALLED,
    );

  menu.addItem(
    ACTION.UPDATE_EVENTS_IN_BOOKING_FORM.CAPTION,
    ACTION.UPDATE_EVENTS_IN_BOOKING_FORM.ACTION,
  );
  if (areTriggersInstalled) {
    menu.addItem(
      ACTION.UNINSTALL_TRIGGERS.CAPTION,
      ACTION.UNINSTALL_TRIGGERS.ACTION,
    );
  } else {
    menu.addItem(
      ACTION.INSTALL_TRIGGERS.CAPTION,
      ACTION.INSTALL_TRIGGERS.ACTION,
    );
  }
  menu.addToUi();
}

function parseNamedValues_(values) {
  const data = {};
  Object.entries(values).forEach(([key, value]) => {
    data[key] = value.join(",");
  });
  return data;
}

function createBookingEventTitle_(item, settings) {
  return _updateTextWithPlaceholders_(settings.eventTitleBooked, item);
}

function createCancelledEventTitle_(item, settings) {
  return _updateTextWithPlaceholders_(settings.eventTitleCancelled, item);
}

function parseEventIdFromTitle_(title) {
  return title.split("[").at(-1).slice(0, -1);
}

function getValuesFromSheet_(row, sheet) {
  const item = {};
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rowValues = values[row - 1];
  headers.forEach((header, index) => (item[header] = rowValues[index]));
  return item;
}

function getEventsAndUpdateForm_(settings = _getSettings_()) {
  const {
    sheetNameBooking,
    calendarId,
    calendarDays,
    calendarMinutes,
    titleBooking,
    formatEventDate,
    optionNoEvent,
  } = settings;
  const timezone = _getTimezone_();
  const events = [];
  getEventsFromCalendar_(calendarId, calendarDays, calendarMinutes).forEach(
    (event) => {
      const title = event.getTitle();
      const startTime = Utilities.formatDate(
        event.getStartTime(),
        timezone,
        "hh:mm",
      );
      const endTime = Utilities.formatDate(
        event.getEndTime(),
        timezone,
        "hh:mm",
      );
      const date = Utilities.formatDate(
        event.getStartTime(),
        timezone,
        formatEventDate,
      );
      const guests = event.getGuestList();
      if (guests.length > 0) {
        event.setColor(CalendarApp.EventColor[settings.eventColorBooked]);
        return;
      }
      const eventId = event.getId().replace("@google.com", "");
      events.push(
        `[${startTime} - ${endTime} ${date}] [${title}] [${eventId}]`,
      );
    },
  );
  const sheetBooking = _getSheetByNameOrId_(sheetNameBooking);
  const formUrl = sheetBooking.getFormUrl();
  let noEvents = false;
  if (events.length == 0) {
    events.push(optionNoEvent);
    noEvents = true;
  }
  const form = updateEventsInForm_(formUrl, titleBooking, events);
  if (noEvents) {
    form.setAcceptingResponses(false);
  } else {
    form.setAcceptingResponses(true);
  }
}

/**
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
function handleBookingResponse_(e, settings) {
  const item = e.item;
  const eventTitle = item[settings.titleBooking];
  const email = item[settings.titleEmail];
  const eventId = parseEventIdFromTitle_(eventTitle);
  const event = CalendarApp.getCalendarById(settings.calendarId).getEventById(
    eventId,
  );
  if (!event) return;
  if (!email) return;
  event.addGuest(email);
  const title = _updateTextWithPlaceholders_(settings.eventTitleBooked, item);
  event.setTitle(title);
  const description = _updateTextWithPlaceholders_(
    settings.eventDescriptionBooked,
    item,
  );
  event.setDescription(description);
  event.setColor(CalendarApp.EventColor[settings.eventColorBooked]);
}

/**
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
function handleCancellationResponse_(e, settings) {
  const item = e.item;
  const email = item[settings.titleEmail];
  const sheetBooking = _getSheetByNameOrId_(settings.sheetNameBooking);
  const [headers, ...values] = sheetBooking.getDataRange().getValues();
  const indexOfEmail = headers.indexOf(settings.titleEmail);
  const indexOfBooking = headers.indexOf(settings.titleBooking);
  const foundRowIndex = values.findIndex((v) => v[indexOfEmail] == email);

  headers.forEach((header, index) => {
    if (header in item) {
      header = `c.${header}`;
    }
    item[header] = values[foundRowIndex][index];
  });

  const eventTitle = values[foundRowIndex][indexOfBooking];
  const eventId = parseEventIdFromTitle_(eventTitle);
  const event = CalendarApp.getCalendarById(settings.calendarId).getEventById(
    eventId,
  );
  event.getGuestList().forEach((guest) => event.removeGuest(guest.getEmail()));

  const title = _updateTextWithPlaceholders_(
    settings.eventTitleCancelled,
    item,
  );
  event.setTitle(title);

  const description = _updateTextWithPlaceholders_(
    settings.eventDescriptionCancelled,
    item,
  );
  event.setDescription(description);
  event.setColor(CalendarApp.EventColor[settings.eventColorCancelled]);
  return item;
}

function getLinkedForms_(ss = SpreadsheetApp.getActive()) {
  const forms = {};
  ss.getSheets().forEach((sheet) => {
    const url = sheet.getFormUrl();
    if (!url) return;
    const form = FormApp.openByUrl(url);
    const title = form.getTitle();
    const publishedUrl = form.getPublishedUrl();
    forms[sheet.getName().trim()] = { url, publishedUrl, title };
  });
  return forms;
}

function removeFormResponsesByEmail_(email, url) {
  const form = FormApp.openByUrl(url);
  form.getResponses().forEach((r) => {
    const emailToCheck = r.getRespondentEmail();
    if (!emailToCheck) return;
    if (emailToCheck.trim().toLowerCase() != email) {
      return;
    }
    form.deleteResponse(r.getId());
  });
}

function sendEmail_({ email, subject, message, item, formLink }) {
  message = message.replace(/\n/g, "<br/>");
  let htmlBody = _updateTextWithPlaceholders_(message, item);
  htmlBody = `<div>${htmlBody}</div><br/><div>${formLink}</div>`;
  subject = _updateTextWithPlaceholders_(subject, item);
  try {
    GmailApp.sendEmail(email, subject, "", { htmlBody });
  } catch (err) {
    return;
  }
}

/**
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
function triggerOnFormSubmit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const settings = _getSettings_();
  e.item = getValuesFromSheet_(e.range.rowStart, sheet);
  e.formUrl = sheet.getFormUrl();
  e.forms = getLinkedForms_(sheet.getParent());
  const isEmailOn = settings.emailOn;
  const email = e.item[settings.titleEmail].trim().toLowerCase();
  const bookingForm = e.forms[settings.sheetNameBooking];
  const cancellationForm = e.forms[settings.sheetNameCancellation];
  if (sheetName == settings.sheetNameBooking) {
    handleBookingResponse_(e, settings);
    removeFormResponsesByEmail_(email, cancellationForm.url);
    const formLink =
      `<a href="${cancellationForm.publishedUrl}">${cancellationForm.title}</a>`;
    isEmailOn &&
      sendEmail_({
        email,
        subject: settings.subjectBooked,
        message: settings.messageBooked,
        formLink,
        item: e.item,
      });
  } else if (sheetName == settings.sheetNameCancellation) {
    e.item = handleCancellationResponse_(e, settings);
    removeFormResponsesByEmail_(email, e.forms[settings.sheetNameBooking].url);
    const formLink =
      `<a href="${bookingForm.publishedUrl}">${bookingForm.title}</a>`;
    isEmailOn &&
      sendEmail_({
        email,
        subject: settings.subjectCancelled,
        message: settings.messageCancelled,
        formLink,
        item: e.item,
      });
  }
  getEventsAndUpdateForm_(settings);
}

function triggerOnCalendarChange() {
  getEventsAndUpdateForm_();
}

function triggerEvery30Mins() {
  getEventsAndUpdateForm_();
}

function actionInstallTriggers() {
  const title = ACTION.INSTALL_TRIGGERS.CAPTION;
  const ui = _getUi_();
  const triggers = TRIGGERS.map(
    ({ name, note }, index) => `${index + 1}. ${name} -> ${note}`,
  ).join("\n");
  const msg = `Are you sure to install these triggers?\n${triggers}`;
  const confirm = _confirm_(msg, title);
  if (confirm !== ui.Button.YES) return;
  _tryAction_(installTriggers_, title);
}

function actionUninstallTriggers() {
  const title = ACTION.UNINSTALL_TRIGGERS.CAPTION;
  let msg =
    "Are you sure to uninstall all triggers? All automations will be disabled.";
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.length === 0) {
    msg = "No triggers to be uninstalled.";
    return _alert_(msg, title);
  }
  const ui = _getUi_();
  const confirm = _confirm_(msg, title);
  if (confirm !== ui.Button.YES) return;
  _tryAction_(uninstallTriggers_, title);
}

function actionUpdateEventsInBookingForm() {
  const title = ACTION.UPDATE_EVENTS_IN_BOOKING_FORM.CAPTION;
  _tryAction_(() => {
    getEventsAndUpdateForm_();
    _toast_("Events have been updated in the booking form.", title);
  }, title);
}
