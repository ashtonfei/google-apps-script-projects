const CONFIG = {
  NAME: "G Tasks",
  TEMPLATE: [
    ["Send To*", "Title*", "[Notes]", "[Due Date]", "[Task List]", "Send*", "[Status]", "[Timestamp]"],
    [null, 'Google Task Title 1', 'Google Task Note 1', new Date(), "G Tasks", true, null, null],
    [null, 'Google Task Title 2', 'Google Task Note 2', new Date(), "G Tasks", true, null, null],
    [null, 'Google Task Title 3', 'Google Task Note 3', new Date(), "G Tasks", true, null, null],
  ],
  SHEET_NAME: {
    APP: "App",
  },
  REFRESH_TOKEN_EVERY_MINUTES: 10,
}

class Utils {
  constructor(name="Utils") {
    this.name = name
    this.ss = SpreadsheetApp.getActive()
  }

  confirm(message) {
    const ui = SpreadsheetApp.getUi()
    return ui.alert(`${this.name} [confirm]`, message, ui.ButtonSet.YES_NO)
  }

  alert(message, type = "warning") {
    const ui = SpreadsheetApp.getUi()
    return ui.alert(`${this.name} [${type}]`, message, ui.ButtonSet.OK)
  }

  toast(message, timeoutSeconds = 15) {
    return this.ss.toast(message, this.name, timeoutSeconds)
  }

  valuesToSheet(values, sheetName) {
    const ws = this.ss.getSheetByName(sheetName) || this.ss.insertSheet(sheetName)
    ws.clear()
    ws.getRange(1, 1, values.length, values[0].length).setValues(values)
    return ws
  }

  /**
   * @param {Date} date
   */
  formatDate(date){
    if (typeof date === 'string') date = new Date(date)
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  }

  createTrigger(){
    const functionName = "refreshToken"
    ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger))
    ScriptApp.newTrigger(functionName)
      .timeBased()
      .everyMinutes(CONFIG.REFRESH_TOKEN_EVERY_MINUTES)
      .create()
  }
}

class Task {
  constructor(user) {
    this.user = user
    this.utils = new Utils()
    this.props = PropertiesService.getScriptProperties()
    this.cache = CacheService.getScriptCache()
  }

  getAllTaskLists(token) {
    const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100'
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
      contentType: 'application/json',
      muteHttpExceptions: true
    })
    const result = JSON.parse(response.getContentText())
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.items
  }

  getTaskListByName(name, token) {
    const cacheKey = `${this.user}:${name}`
    // const taskList = this.cache.get(cacheKey)
    // if (taskList) return JSON.parse(taskList)

    const taskLists = this.getAllTaskLists(token)
    const foundTaskList = taskLists.find(item => item.title === name)
    if (foundTaskList) {
      this.cache.put(cacheKey, JSON.stringify(foundTaskList), 21600)
      return foundTaskList
    }
    const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists'
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      contentType: 'application/json',
      payload: JSON.stringify({ title: name }),
      muteHttpExceptions: true
    })
    const item = JSON.parse(response.getContentText())
    if (item.error) {
      throw new Error(item.error.message)
    }
    this.cache.put(cacheKey, JSON.stringify(item), 21600)
    return item
  }

  createTask({ title, notes, due, to, taskListName, send, status, timestamp }) {
    if (!send) return [send, status, timestamp]
    if (!to) return [true, 'Error: "Sent To" is required!', new Date()]
    if (!title) return [true, 'Error: "Title" is required!', new Date()]
    const token = this.props.getProperty(to)
    if (!token) return [true, `Error: user ${to} was not connected to the app.`, new Date()]

    taskListName = taskListName || CONFIG.NAME
    const taskList = this.getTaskListByName(taskListName, token)
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskList.id}/tasks`
    notes = notes ? `${notes}\nFrom: ${this.user}` : `From: ${this.user}`
    due = this.utils.formatDate(due)
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      contentType: 'application/json',
      payload: JSON.stringify({ title, notes, due }),
      muteHttpExceptions: true
    })
    const item = JSON.parse(response.getContentText())
    if (item.error){
      return [true, `Error: ${item.error.message}`, new Date()]
    }
    return [false, `Success: sent by ${this.user}`, new Date()]
  }
}

class App {
  constructor() {
    this.name = CONFIG.NAME
    this.user = Session.getActiveUser().getEmail()
    this.utils = new Utils(this.name)
    this.task = new Task(this.user)
    this.ss = SpreadsheetApp.getActive()
    this.props = PropertiesService.getScriptProperties()
    this.cache = CacheService.getScriptCache()
  }

  onOpen(e) {
    const ui = SpreadsheetApp.getUi()
    ui.createMenu(this.name)
      .addItem("Run", "run")
      .addSeparator()
      .addItem("Connect", "connect")
      .addItem("Disconnect", "disconnect")
      .addItem("Create template", "createTemplate")
      .addToUi()
  }

  getUserEmails() {
    return Object.keys(this.props.getProperties()).filter(key => key.includes("@"))
  }

  updateUserEmailValidations() {
    const ws = this.ss.getSheetByName(CONFIG.SHEET_NAME.APP)
    if (!ws) return
    const lastRow = ws.getLastRow()
    if (lastRow < 2) return
    const emails = this.getUserEmails()
    const dataValidation = SpreadsheetApp.newDataValidation().requireValueInList(emails)
    ws.getRange(`A2:A${lastRow}`).setDataValidation(dataValidation)
  }

  createTemplate() {
    const ui = SpreadsheetApp.getUi()
    const confirm = this.utils.confirm(`Are you sure to create a new template in sheet "${CONFIG.SHEET_NAME.APP}"?`)
    if (confirm !== ui.Button.YES) return this.utils.toast("Cancelled!")
    const template = this.utils.valuesToSheet(CONFIG.TEMPLATE, CONFIG.SHEET_NAME.APP)
    this.updateUserEmailValidations()
    template.getRange("H2:H" + CONFIG.TEMPLATE.length).setNumberFormat("M/d/yyyy H:mm:ss")
    template.getRange("F2:F" + CONFIG.TEMPLATE.length).insertCheckboxes()
    template.activate()
    this.utils.toast("New template has been created!")
  }

  connect() {
    const ui = SpreadsheetApp.getUi()
    const confirm = this.utils.confirm(`Are you sure to connect your account ${this.user}?`)
    if (confirm !== ui.Button.YES) return this.utils.toast("Cancelled!")
    this.refreshToken()
    this.updateUserEmailValidations()
    this.utils.createTrigger()
    this.utils.toast("Connected!")
  }

  disconnect(){
    const ui = SpreadsheetApp.getUi()
    const confirm = this.utils.confirm(`Are you sure to disconnect your account ${this.user}?`)
    if (confirm !== ui.Button.YES) return this.utils.toast("Cancelled!")
    this.props.deleteProperty(this.user)
    this.updateUserEmailValidations()
    ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger))
    this.utils.toast("Disconnected!")
  }

  refreshToken(){
    const userEmail = Session.getActiveUser().getEmail()
    const token = ScriptApp.getOAuthToken()
    this.props.setProperty(userEmail, token)
  }

  run() {
    const ws = this.ss.getSheetByName(CONFIG.SHEET_NAME.APP)
    if (!ws) {
      this.utils.alert(`Sheet "${CONFIG.SHEET_NAME.APP}" was not found in the spreadsheet!`, 'Warning')
      return this.createTemplate()
    }
    const [, ...items] = ws.getDataRange().getValues()
    const results = items.map(item => {
      return this.task.createTask({
        to: item[0],
        title: item[1],
        notes: item[2],
        due: item[3],
        taskListName: item[4],
        send: item[5],
        status: item[6],
        timestamp: item[7],
      })
    })
    if (results.length) {
      ws.getRange(`F2:H${results.length + 1}`).setValues(results)
    }
    this.utils.toast("Done!")
  }
}

const app = new App()
const onOpen = (e) => app.onOpen(e)
const connect = () => app.connect()
const disconnect = () => app.disconnect()
const run = () => app.run()
const refreshToken = () => app.refreshToken()
const createTemplate = () => app.createTemplate()