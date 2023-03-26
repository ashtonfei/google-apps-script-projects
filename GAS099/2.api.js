const apiGetAppData = () => {
  let appData = PropertiesService.getUserProperties().getProperty(
    CONFIG.KEY.APP_DATA
  );
  appData = appData
    ? JSON.parse(appData)
    : { isWeeklyOn: false, isMonthlyOn: false, isYearlyOn: false };
  const data = {
    ..._getSettings_(),
    calendars: getMyCalendars_(),
    ...appData,
  };
  data.name = data.appName;
  return JSON.stringify(data);
};

const apiAddToTracker = (payload) => {
  const { calendars, isWeeklyOn, isMonthlyOn, isYearlyOn } =
    JSON.parse(payload);
  if (!calendars) {
    throw new Error("No calendars in the request.");
  }
  deleteAllTriggers_();

  createReportTriggers_({ isWeeklyOn, isMonthlyOn, isYearlyOn });
  const props = PropertiesService.getUserProperties();
  props.setProperty(
    CONFIG.KEY.APP_DATA,
    JSON.stringify({
      isWeeklyOn,
      isMonthlyOn,
      isYearlyOn,
    })
  );

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
  props.deleteProperty(CONFIG.KEY.APP_DATA);
  calendars.forEach((calendar) => props.deleteProperty(calendar));
  return apiGetAppData();
};
