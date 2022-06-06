class App {
  constructor() {
    this.name = "🗓 Calendar";
    this.sheetName = {
      events: "Events",
    };
    this.email = Session.getUser().getEmail();
    this.ss = SpreadsheetApp.getActive();
    this.props = PropertiesService.getScriptProperties();
    this.key = {
      nextSyncToken: "nextSyncToken",
    };
    this.headers = [
      { key: "id", value: "ID", format: "@" },
      { key: "summary", value: "Summary", format: "@" },
      { key: "start", value: "Start", format: "M/d/yyyy H:mm:ss" },
      { key: "end", value: "End", format: "M/d/yyyy H:mm:ss" },
      { key: "organizer", value: "Organizer", format: "@" },
      { key: "creator", value: "Creator", format: "@" },
      { key: "created", value: "Created", format: "M/d/yyyy H:mm:ss" },
      { key: "updated", value: "Updated", format: "M/d/yyyy H:mm:ss" },
      { key: "htmlLink", value: "Link", format: "@" },
      { key: "attendee", value: "Attendee", format: "@" },
      { key: "responseStatus", value: "Response Status", format: "@" },
    ];
    this.status = {
      accepted: "Yes",
      tentative: "Maybe",
      declined: "No",
      cancelled: "Cancelled",
      needsAction: "Not Responded ",
    };
  }

  onOpen() {
    const ui = SpreadsheetApp.getUi();
    const menu = ui.createMenu(this.name);
    menu.addItem("Initial Sync", "initialSync");
    menu.addItem("Sync Now", "onEventUpdate");
    menu.addToUi();
  }

  initialSync() {
    ScriptApp.getProjectTriggers().forEach((trigger) =>
      ScriptApp.deleteTrigger(trigger)
    );
    const trigger = ScriptApp.newTrigger("onEventUpdate")
      .forUserCalendar(this.email)
      .onEventUpdated()
      .create();
    this.getInitialSyncToken();
    this.toast("Done!", `${this.name} [Initial Sync]`);
    return trigger;
  }

  getInitialSyncToken() {
    const calendarId = this.email;
    const initialSync = Calendar.Events.list(calendarId);
    const nextSyncToken = initialSync.nextSyncToken;
    this.saveNextSyncToken(nextSyncToken);
    return nextSyncToken;
  }

  onEventUpdate(e = {}) {
    let nextSyncToken = this.getNextSyncToken();
    const calendarId = e.calendarId || this.email;
    if (!nextSyncToken) {
      nextSyncToken = this.getInitialSyncToken();
    }
    const response = Calendar.Events.list(calendarId, {
      syncToken: nextSyncToken,
    });
    const updates = this.processEventUpdates(response.items);
    updates.unshift(this.headers.map((header) => header.value));
    const ws = this.valuesToSheet(
      updates,
      this.sheetName.events,
      true,
      true,
      this.headers.map((header) => header.format)
    );
    this.saveNextSyncToken(response.nextSyncToken);
    this.applyConditionalFormatting(ws);
    this.toast("Done!");
  }

  /**
   * @param {SpreadsheetApp.Sheet} sheet
   */
  applyConditionalFormatting(sheet) {
    const dataRange = sheet.getDataRange();
    if (dataRange.getNumRows() <= 1) return;
    const range = dataRange.offset(
      1,
      0,
      dataRange.getNumRows() - 1,
      dataRange.getNumColumns()
    );
    const equalToYes = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$K2="${this.status.accepted}"`)
      .setBackground("#b7e1cd")
      .setRanges([range])
      .build();
    const equalToNo = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$K2="${this.status.declined}"`)
      .setBackground("#f4c7c3")
      .setRanges([range])
      .build();
    const equalToMaybe = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$K2="${this.status.tentative}"`)
      .setBackground("#fce8b2")
      .setRanges([range])
      .build();
    const equalToNotResponded = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$K2="${this.status.needsAction}"`)
      .setBackground("#e4e4e4")
      .setRanges([range])
      .build();
    sheet.clearConditionalFormatRules();
    const rules = [equalToYes, equalToNo, equalToMaybe, equalToNotResponded];
    sheet.setConditionalFormatRules(rules);
  }

  toast(message, title = this.name, timeout = 10) {
    return this.ss.toast(message, title, timeout);
  }

  getCurrentEvents(ids) {
    const ws = this.ss.getSheetByName(this.sheetName.events);
    if (!ws) return [];
    const [_, ...events] = ws.getDataRange().getValues();
    const indexOfId = this.headers.findIndex((header) => header.key == "id");
    return events.filter((e) => !ids.includes(e[indexOfId]));
  }

  createRowData(keys, item) {
    return keys.map((key) => item[key]);
  }

  parseEvent(event) {
    const keys = this.headers.map((header) => header.key);
    return event.attendees.map((attendee) => {
      const item = {
        id: event.id,
        summary: event.summary,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        organizer: event.organizer.email,
        creator: event.creator.email,
        created: new Date(event.created),
        updated: new Date(event.updated),
        attendee: attendee.email,
        responseStatus: this.status[attendee.responseStatus],
        htmlLink: event.htmlLink,
      };
      return this.createRowData(keys, item);
    });
  }

  processEventUpdates(events) {
    const eventIds = events.map((e) => e.id);
    let newEvents = [];
    events.forEach((event) => {
      if (event.status !== "cancelled") {
        newEvents = [...newEvents, ...this.parseEvent(event)];
      }
    });
    const currentEvents = this.getCurrentEvents(eventIds);
    return [...newEvents, ...currentEvents];
  }

  saveNextSyncToken(token) {
    if (!token) return;
    this.props.setProperty(this.key.nextSyncToken, token);
  }

  getNextSyncToken() {
    return this.props.getProperty(this.key.nextSyncToken);
  }

  valuesToSheet(
    values,
    sheetName,
    clearContents = true,
    clearFormats = true,
    formats = null
  ) {
    const ws =
      this.ss.getSheetByName(sheetName) || this.ss.insertSheet(sheetName);
    if (clearContents) ws.clearContents();
    if (clearFormats) ws.clearFormats();
    if (formats) this.formatSheet(ws, formats);
    const [headers, ...items] = values;
    ws.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (items.length) {
      ws.getRange(
        ws.getLastRow() + 1,
        1,
        items.length,
        items[0].length
      ).setValues(items);
    }
    return ws;
  }

  /**
   * @param {SpreadsheetApp.Sheet} sheet
   * @param {String[]} formats
   */
  formatSheet(sheet, formats) {
    const rows = sheet.getMaxRows();
    formats.forEach((format, index) => {
      sheet.getRange(2, index + 1, rows, 1).setNumberFormat(format);
    });
    return sheet;
  }
}

const onEventUpdate = (e = {}) => new App().onEventUpdate(e);
const initialSync = () => new App().initialSync();
const onOpen = () => new App().onOpen();
