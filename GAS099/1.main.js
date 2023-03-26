const CONFIG = {
  NAME: "GAS099",
  MENU: {
    LANCH_SIDEBAR: {
      CAPTION: "Launch",
      ACTION: "actionLanchSidebar",
    },
    SEND_REPORT: {
      CAPTION: "Send report",
      ACTION: "actionSendReport",
    },
  },
  TRIGGER: {
    CALENDAR: "triggerCalendarUpdate",
    WEEKLY: "triggerWeeklyReport",
    MONTHLY: "triggerMonthlyReport",
    YEAERLY: "triggerYearlyReport",
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
  const { gidEvents } = _getSettings_();
  if (!event) return console.info(`No event ${event}`);
  const sheet = _getSheetById_(gidEvents);
  if (!sheet) {
    return console.info(`Sheet with GID ${gidEvents} was not found.`);
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
  const functions = [
    CONFIG.TRIGGER.CALENDAR,
    CONFIG.TRIGGER.WEEKLY,
    CONFIG.TRIGGER.MONTHLY,
    CONFIG.TRIGGER.YEAERLY,
  ];
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    const triggerName = trigger.getHandlerFunction();
    if (functions.includes(triggerName)) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
};

const openSidebar_ = () => {
  const { appName } = _getSettings_();
  const title = appName || CONFIG.NAME;
  const template = HtmlService.createTemplateFromFile("html/sidebar.html");
  const sidebar = template.evaluate().setTitle(title);
  SpreadsheetApp.getUi().showSidebar(sidebar);
};

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
const getChartsFromSheet_ = (sheet) => {
  const inlineImages = {};
  const htmlCharts = [];
  sheet.getCharts().forEach((chart) => {
    const id = chart.getChartId();
    const blob = chart.getAs("image/png");
    inlineImages[id] = blob;
    htmlCharts.push(`<img src="cid:${id}" />`);
  });
  return { inlineImages, htmlCharts };
};

const createTableCharts_ = (charts, columns = 1) => {
  const htmlRows = [];
  const rows = Math.ceil(charts.length / columns);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const htmlColumns = ["<tr>"];
    for (let c = 0; c < columns; c++) {
      const chart = charts[i];
      htmlColumns.push(`<td>${chart || ""}</td>`);
      i++;
    }
    htmlColumns.push("</tr>");
    htmlRows.push(htmlColumns.join(""));
  }
  return ["<table width='100%;'>", ...htmlRows, "</table>"].join("");
};

const sendReport_ = () => {
  const title = CONFIG.MENU.SEND_REPORT.CAPTION;
  const {
    gidDashboard,
    subject,
    fromName,
    to,
    cc,
    bcc,
    body,
    attachedAsPdf,
    columns,
    filename,
    size,
    portrait,
  } = _getSettings_();
  const sheetDashboard = _getSheetById_(gidDashboard);
  if (!sheetDashboard) {
    throw new Error(
      `No dashboard with GID "${gidDashboard}" found in the spreadsheet.`
    );
  }
  if (!subject) {
    throw new Error('No "Subject" in the email configuration');
  }
  if (!to) {
    throw new Error('No "To" in the email configuration');
  }
  if (!body) {
    throw new Error('No "body" in the email configuration');
  }

  const { inlineImages, htmlCharts } = getChartsFromSheet_(sheetDashboard);
  const tableCharts = createTableCharts_(htmlCharts, columns);

  let htmlBody = body.startsWith("<")
    ? body.replace(/\n/g, "<br/>")
    : `<div>${body}</div>`;
  htmlBody = body.replace("{{dashboard}}", tableCharts);

  const options = {
    name: fromName,
    cc,
    bcc,
    htmlBody,
    inlineImages,
  };
  if (attachedAsPdf) {
    const pdf = _exportSheetAsPdf_(
      gidDashboard,
      SpreadsheetApp.getActive().getId(),
      {
        size,
        portrait,
      }
    );
    pdf.setName(filename);
    options.attachments = [pdf];
  }
  GmailApp.sendEmail(to, subject, "", options);
  _toast_("Completed", title);
};

const createReportTriggers_ = ({ isWeeklyOn, isMonthlyOn, isYearlyOn }) => {
  if (isWeeklyOn) {
    ScriptApp.newTrigger(CONFIG.TRIGGER.WEEKLY)
      .timeBased()
      .everyWeeks(1)
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(8)
      .create();
  }
  if (isMonthlyOn) {
    ScriptApp.newTrigger(CONFIG.TRIGGER.MONTHLY)
      .timeBased()
      .onMonthDay(1)
      .atHour(8)
      .create();
  }
  if (isYearlyOn) {
    ScriptApp.newTrigger(CONFIG.TRIGGER.YEAERLY)
      .timeBased()
      .onMonthDay(1)
      .atHour(8)
      .create();
  }
};

const onOpen = () => {
  const { appName } = _getSettings_();
  const title = appName || CONFIG.NAME;
  const ui = _getUi_();
  const menu = ui.createMenu(title);
  menu.addItem(
    CONFIG.MENU.LANCH_SIDEBAR.CAPTION,
    CONFIG.MENU.LANCH_SIDEBAR.ACTION
  );
  menu.addItem(CONFIG.MENU.SEND_REPORT.CAPTION, CONFIG.MENU.SEND_REPORT.ACTION);
  menu.addToUi();
};

const triggerCalendarUpdate = (e) => onCalendarUpdate_(e);
const triggerWeeklyReport = () => sendReport_();
const triggerMonthlyReport = () => sendReport_();
const triggerYearlyReport = () => {
  const date = new Date();
  const month = date.getMonth();
  if (month !== 0) return;
  sendReport_();
};

const actionLanchSidebar = () =>
  _tryFunction_(openSidebar_, CONFIG.MENU.LANCH_SIDEBAR.CAPTION);
const actionSendReport = () =>
  _tryFunction_(sendReport_, CONFIG.MENU.SEND_REPORT.CAPTION);
