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
};

const onCalendarUpdate_ = (e) => {
  console.log(e);
};

const getMyCalendars_ = () => {
  const props = PropertiesService.getUserProperties();
  let appData = props.getProperty(CONFIG.KEY.APP_DATA);
  if (appData) {
    appData = JSON.parse(appData);
  } else {
    appData = {};
  }

  return CalendarApp.getAllOwnedCalendars().map((calendar) => {
    const id = calendar.getId();
    const triggerId = appData[id]?.triggerId;
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
  const data = {};
  const functionName = CONFIG.TRIGGER.CALENDAR;
  calendars.forEach((id) => {
    const trigger = ScriptApp.newTrigger(functionName)
      .forUserCalendar(id)
      .onEventUpdated()
      .create();
    data[id] = { triggerId: trigger.getUniqueId() };
  });
  const props = PropertiesService.getUserProperties();
  props.setProperty(CONFIG.KEY.APP_DATA, JSON.stringify(data));
  return apiGetAppData();
};
