const ACTION = {
  UPDATE_EVENTS_IN_BOOKING_FORM: {
    ACTION: "actionUpdateEventsInBookingForm",
    CAPTION: "Update events in booking form",
  },
  ON_CALENDAR_CHANGE: {
    ACTION: "triggerOnCalendarChange",
    CAPTION: "On calendar change",
  },
  ON_FORM_SUBMIT: {
    ACTION: "triggerOnFormSubmit",
    CAPTION: "On form submit",
  },
  EVERY_30_MINS: {
    ACTION: "triggerEvery30Mins",
    CAPTION: "Every 30 mins",
  },
  INSTALL_TRIGGERS: {
    ACTION: "actionInstallTriggers",
    CAPTION: "Install triggers",
  },
  UNINSTALL_TRIGGERS: {
    ACTION: "actionUninstallTriggers",
    CAPTION: "Uninstall triggers",
  },
};

const TRIGGERS = [
  {
    name: ACTION.ON_CALENDAR_CHANGE.ACTION,
    note: "Update events in the booking form",
  },
  {
    name: ACTION.ON_FORM_SUBMIT.ACTION,
    note: "Handle events when form submit",
  },
  {
    name: ACTION.EVERY_30_MINS.ACTION,
    note: "Update events in the booking form every 30 mins",
  },
];

const CONFIG = {
  NAME: "GAS102",
  ACTION,
  KEY: {
    TRIGGERS_INSTALLED: "triggersInstalled",
  },
};
