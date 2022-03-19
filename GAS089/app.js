const onOpen = (e) => _app.onOpen(e)
const doGet = (e) => _api.doGet(e)


const include = (filename) => _utils.include(filename)
const openEmailDialog = () => _app.openEmailDialog()
const sendEmail = (payload) => _app.sendEmail(JSON.parse(payload))

const Utils = class {
  constructor() {
  }

  /**
   * @param {string} filename The name of the html file
   * @returns {string} HTML content as string
   */
  include(filename) {
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent()
  }

  alert(message, type = "warning") {
    const ui = SpreadsheetApp.getUi()
    return ui.alert(`${CONFIG.NAME} [${type}]`, message, ui.ButtonSet.OK)
  }

  /**
   * @param {string} message - the cconfirm message
   */
  confirm(message) {
    const ui = SpreadsheetApp.getUi()
    return ui.alert(`${CONFIG.NAME} [confirm]`, message, ui.ButtonSet.YES_NO)
  }

  toast(message, timeoutSeconds = 15) {
    return SpreadsheetApp.getActive().toast(message, CONFIG.NAME, timeoutSeconds)
  }

  render(filename, title, data) {
    const template = HtmlService.createTemplateFromFile(filename)
    if (data) template = { ...template, ...data }
    return template.evaluate().setTitle(title).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
  }

  createJsonResponse(data) {
    return ContentService.createTextOutput().setContent(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
  }

  createKeys(headers) {
    return headers.map(v => v.toString().toCamelCase())
  }

  getSheetByName(name, createIfNotFound = true) {
    const ss = SpreadsheetApp.getActive()
    const ws = ss.getSheetByName(name)
    if (ws) return ws
    if (!createIfNotFound) return ws
    return ss.insertSheet(ws)
  }

  createItemObject(keys, values) {
    const item = {}
    keys.forEach((key, index) => item[key] = values[index])
    return item
  }

  isValidItem(item, filters, partial = true) {
    const results = Object.entries(filters).map(([key, value]) => {
      if (!(key in item)) return false
      return item[key] == value
    })
    if (partial) return results.indexOf(true) !== -1
    return results.indexOf(false) === -1
  }

  insertRecord(sheetName, headers, record) {
    const keys = this.createKeys(headers)
    const values = keys.map((key) => {
      if (key in record) return record[key]
      return null
    })
    const ws = this.getSheetByName(sheetName, true)
    ws.getRange(1, 1, 1, headers.length).setValues([headers])
    const lastRow = ws.getLastRow()
    ws.getRange(lastRow + 1, 1, 1, values.length).setValues([values])
    return { sheet: ws, item: this.createItemObject(keys, values) }
  }

  updateRecord(sheetName, filters, data) {
    const ws = this.getSheetByName(sheetName)
    if (!ws) return
    const [headers, ...records] = ws.getDataRange().getValues()
    const keys = this.createKeys(headers)

    const findRecordIndex = records.findIndex((record) => {
      const item = this.createItemObject(keys, record)
      return this.isValidItem(item, filters, true)
    })
    if (findRecordIndex === -1) return
    const record = records[findRecordIndex]
    const newRecord = keys.map((key, index) => {
      console.log({ key })
      if (key in data) return data[key]
      return record[index]
    })
    console.log(newRecord)
    ws.getRange(findRecordIndex + 2, 1, 1, newRecord.length).setValues([newRecord])
    return { sheet: ws, item: this.createItemObject(keys, newRecord) }
  }
}

const App = class {
  constructor() { }
  
  openEmailDialog() {
    const title = `${CONFIG.NAME} [New Email]`
    const htmlOutput = HtmlService.createTemplateFromFile("emailForm.html").evaluate()
    htmlOutput.setTitle(title).setWidth(600).setHeight(450)
    SpreadsheetApp.getActive().show(htmlOutput)
  }

  getSentEmailBySubject(subject) {
    const query = `in:sent subject:${subject}`
    return GmailApp.search(query, 0, 1)[0]
  }

  /**
   * @param {GmailApp.GmailThread} thread The sent Gmail thread
   */
  saveLog(thread, trackingNumber) {
    const log = {
      to: thread.getMessages()[0].getTo(),
      sentAt: thread.getLastMessageDate(),
      subject: thread.getFirstMessageSubject(),
      threadId: thread.getId(),
      permalink: thread.getPermalink(),
      trackingNumber: trackingNumber,
      opened: false,
      openedAt: null
    }
    const { sheet } = _utils.insertRecord(CONFIG.SHEET_NAME.TRACKING_EMAILS, CONFIG.HEADER.TRACKING_EMAILS, log)
    sheet.getRange(`G2:G${sheet.getLastRow()}`).insertCheckboxes()
  }

  sendEmail({ to, subject, body }) {
    const trackingNumber = Utilities.getUuid()
    const trackingUrl = CONFIG.API_URL + "?id=" + trackingNumber
    const htmlBody = `
      <div>${body}</div>
      <div style="display: none;">
        <img src="${trackingUrl}" tracking-url="${trackingUrl}" />
      </div>
      <script>
      (function() {
        document.querySelectorAll('img').
        forEach(function(image) {
          var search = image.src.match(/googleusercontent.com\/proxy\/.*#(.*)/); 
          if (search) {
            image.src = search[1].replace(/acceptance\d/, 'www');
          }
        });
      })();
      </script>
    `
    GmailApp.sendEmail(to, subject, '', { htmlBody })
    const sentEmail = this.getSentEmailBySubject(subject)
    if (!sentEmail) _utils.alert("No sent email found!", "Error")
    this.saveLog(sentEmail, trackingNumber)
    _utils.toast('Tracking email has been sent!')
  }

  onOpen(e) {
    const ui = SpreadsheetApp.getUi()
    ui.createMenu(CONFIG.NAME)
      .addItem("Send New Email", 'openEmailDialog')
      .addToUi()
  }
}

const Api = class {
  constructor() { }
  /**
   * @param {ScriptApp.EventType} e
   */

  updateTrackingStatus(trackingNumber) {
    const ss = SpreadsheetApp.getActive()
    const ws = ss.getSheetByName(CONFIG.SHEET_NAME.TRACKING_EMAILS)
    if (!ws) return
    const openedAt = new Date()
    return _utils.updateRecord(CONFIG.SHEET_NAME.TRACKING_EMAILS, { trackingNumber }, { opened: true, openedAt, trackingNumber })
  }

  doGet(e) {
    console.log(e)
    const { id } = e.parameter
    if (!id) return _utils.createJsonResponse({ error: true, message: "Invalid API query!" })
    const result = this.updateTrackingStatus(id)
    console.log(result)
    if (!result) return _utils.createJsonResponse({ error: false, message: "No tracking number found!" })
    return _utils.createJsonResponse({ item: result.item })
  }
}