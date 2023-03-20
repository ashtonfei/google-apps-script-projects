const CONFIG = {
  NAME: "GAS099",
  MENU: {
    OPEN_SIDEBAR: {
      CAPTION: "Open sidebar",
      ACTION: "openSidebar",
    },
  },
  TRIGGER: {
    CALENDAR: "triggerCalendarUpdate",
  },
  KEY: {
    APP_DATA: "app-data-gas-ashtonfei",
  },
  GID: {
    SETTINGS: 0,
    EVENTS: 1198467070,
  },
  PREFIX: {
    CALENDAR: "CAL",
  },
  HEADERS: [
    { text: "ID", key: "id" },
    { text: "Title", key: "summary" },
    { text: "Status", key: "status" },
    { text: "Calendar", key: "calendarName" },
    { text: "Creator", key: "creator.email" },
    { text: "Updated", key: "updated", format: (v) => new Date(v) },
    { text: "Start Time", key: "start.dateTime", format: (v) => new Date(v) },
    { text: "End Time", key: "end.dateTime", format: (v) => new Date(v) },
    { text: "Days", key: "days", formula: "=RC[-1]-RC[-2]" },
    { text: "Hours", key: "hours", formula: "=RC[-1]*24" },
    { text: "Minutes", key: "minutes", formula: "=RC[-1]*60" },
    { text: "Link", key: "htmlLink" },
  ],
};

const saveEventToSheet_ = (event) => {
  console.log(event);
  if (!event) return console.info(`No event ${event}`);
  const sheet = _getSheetById_(CONFIG.GID.EVENTS);
  if (!sheet) {
    return console.info(`Sheet with GID ${CONFIG.GID.EVENTS} was not found.`);
  }
  const headers = CONFIG.HEADERS.map((v) => v.text);
  const keys = CONFIG.HEADERS.map((v) => v.key);
  const formats = CONFIG.HEADERS.map((v) => v.format);
  const formulas = CONFIG.HEADERS.map((v) => v.formula);

  const values = keys.map((key, index) => {
    const formula = formulas[index];
    if (formula) return formula;
    const value = _getNestedValueFromObject_(event, key);
    const format = formats[index];
    if (!format) return value;
    return format(value);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, values.length).setValues([values]);
  sheet.getDataRange().removeDuplicates([1]);
};

const onCalendarUpdate_ = (e) => {
  const { calendarId, triggerUid } = e;
  const props = PropertiesService.getUserProperties();
  const data = props.getProperty(calendarId);
  if (!data) {
    return console.info(`No data for calendar ${calendarId}`);
  }
  const { syncToken } = JSON.parse(data);
  if (!syncToken) {
    return console.info(`No sync token for calendar ${calendarId}`);
  }
  const res = _getLastestEvent_(calendarId, syncToken);
  const metaData = {
    triggerId: triggerUid,
    syncToken: res.nextSyncToken,
  };
  props.setProperty(calendarId, JSON.stringify(metaData));
  if (res.event) {
    res.event.calendarName = CalendarApp.getCalendarById(calendarId).getName();
  }
  saveEventToSheet_(res.event);
};

const getMyCalendars_ = () => {
  const props = PropertiesService.getUserProperties();
  const triggerIds = ScriptApp.getProjectTriggers().map((trigger) =>
    trigger.getUniqueId()
  );
  return CalendarApp.getAllOwnedCalendars().map((calendar) => {
    const id = calendar.getId();
    let data = props.getProperty(id);
    if (data) {
      data = JSON.parse(data);
    } else {
      data = {};
    }
    const triggerId = triggerIds.includes(data.triggerId)
      ? data.triggerId
      : null;
    return {
      id,
      name: calendar.getName(),
      description: calendar.getDescription(),
      color: calendar.getColor(),
      triggerId,
      on: Boolean(triggerId),
    };
  });
};

const deleteAllTriggers_ = () => {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() !== CONFIG.TRIGGER.CALENDAR) {
      return;
    }
    ScriptApp.deleteTrigger(trigger);
  });
};

const onOpen = () => {
  const name = _getSettings_()?.name || CONFIG.NAME;
  const ui = _getUi_();
  const menu = ui.createMenu(name);
  menu.addItem(
    CONFIG.MENU.OPEN_SIDEBAR.CAPTION,
    CONFIG.MENU.OPEN_SIDEBAR.ACTION
  );
  menu.addToUi();
};

const openSidebar = () => {
  const settings = _getSettings_();
  const title = settings.name || CONFIG.NAME;
  const template = HtmlService.createTemplateFromFile("html/sidebar.html");
  const sidebar = template.evaluate().setTitle(title);
  SpreadsheetApp.getUi().showSidebar(sidebar);
};
const triggerCalendarUpdate = (e) => onCalendarUpdate_(e);

const apiGetAppData = () => {
  const data = {
    ..._getSettings_(),
    calendars: getMyCalendars_(),
  };
  return JSON.stringify(data);
};

const apiAddToTracker = (payload) => {
  const { calendars } = JSON.parse(payload);
  if (!calendars) {
    throw new Error("No calendars in the request.");
  }
  deleteAllTriggers_();
  const props = PropertiesService.getUserProperties();
  const functionName = CONFIG.TRIGGER.CALENDAR;
  calendars.forEach((calendarId) => {
    const trigger = ScriptApp.newTrigger(functionName)
      .forUserCalendar(calendarId)
      .onEventUpdated()
      .create();
    const data = {
      triggerId: trigger.getUniqueId(),
      syncToken: _getNextSyncToken_(calendarId),
    };
    props.setProperty(calendarId, JSON.stringify(data));
  });
  return apiGetAppData();
};

const apiDisableAllCalendars = (payload) => {
  const { calendars } = JSON.parse(payload);
  deleteAllTriggers_();
  const props = PropertiesService.getUserProperties();
  calendars.forEach((calendar) => props.deleteProperty(calendar));
  return apiGetAppData();
};
