const CONFIG = {
  NAME: "Gmail Downloader",
  SHEET_NAME: {
    APP: "App",
    LOG: "Log"
  },
  FOLDER_NAME: {
    DOWNLOADS: "Downloads"
  },
  LABEL_NAME: "Downloaded",
  TRIGGER_FUNCTION_NAME: "download",
  RUN_AT: "8:00",
  DAYS: 1,
  DATE_TIME_FORMAT: "dd/mm/yyyy HH:mm:ss"
}

class App{
  constructor(){
    this.ss = SpreadsheetApp.getActive()
  }

  onOpen(e){
    const ui = SpreadsheetApp.getUi()
    ui.createMenu(CONFIG.NAME)
      .addItem("Download", "download")
      .addSeparator()
      .addItem("Configurate", "configurate")
      .addItem("Create trigger", "createTrigger")
      .addToUi()
  }

  toast(message){
    this.ss.toast(message, CONFIG.NAME)
  }

  confirm(message){
    const ui = SpreadsheetApp.getUi()
    return ui.alert(`${CONFIG.NAME} [Confirm]`, message, ui.ButtonSet.YES_NO)
  }

  createSheetLog(){
    const sheet = this.ss.getSheetByName(CONFIG.SHEET_NAME.LOG) || this.ss.insertSheet(CONFIG.SHEET_NAME.LOG)
    sheet.clear()
    sheet.appendRow(['Timestamp', 'Subject', 'Thread URL', 'Status', 'Attachments'])
    sheet.autoResizeColumns(1,4)
    sheet.getRange("A2:A").setNumberFormat(CONFIG.DATE_TIME_FORMAT)
    return sheet
  }

  createSheetApp(){
    const sheet = this.ss.getSheetByName(CONFIG.SHEET_NAME.APP) || this.ss.insertSheet(CONFIG.SHEET_NAME.APP)
    sheet.clear()
    const values = [
      ["GAS-088 " + CONFIG.NAME, null, null],
      ["Key", "Value", "Note"],
      ["Query", "subject:GAS-088 from:example@gmail.com", 'Check this link for details: https://support.google.com/mail/answer/7190?hl=en'],
      ["File Extensions", ".pdf,.xlsx", "Comma-seperated file extensions"],
      ["Download Folder", CONFIG.FOLDER_NAME.DOWNLOADS, "Folder Name (in the same directory where the spreadsheet is located), folder ID, or folder URL"],
      ["Label", CONFIG.LABEL_NAME, "The label to be applied to the downloaded Gmail thread"],
      ["Days", 1, "Search emails in past days"],
      ["Run At", "8:00", "Script rus at every day(for daily trigger)"],
      ["Send Log", true, "Send log email"],
      ["Send Log To", 'example@gmail.com', "Comma-separated email addresses (required only if send log is checked)"],
      ["Log Email Subject", CONFIG.NAME + ' Logs', "(required only if send log is checked)"],
    ]
    sheet.getRange(1,1,values.length, values[0].length).setValues(values)
    sheet.getRange("B9").insertCheckboxes()
    sheet.getRange("A1:C1").merge().setFontSize(36).setBackground("#34a853").setFontColor("#ffffff").setHorizontalAlignment('center').setFontWeight('bold')
    sheet.getRange("A2:C2").setBackground("#eeeeee").setFontWeight('bold')
    sheet.getRange("A2:A11").setBackground("#eeeeee").setFontWeight('bold')
    sheet.getRange("B2:B11").setHorizontalAlignment("left")
    sheet.getRange("C2:C11").setBackground("#eeeeee")
    sheet.setColumnWidth(1, 140)
    sheet.autoResizeColumns(2,3)
    return sheet
  }

  createTrigger(){
    const sheetApp = this.ss.getSheetByName(CONFIG.SHEET_NAME.APP)
    const [hour, minute] = (sheetApp.getRange("B8").getDisplayValue().trim() || CONFIG.RUN_AT).split(":")
    const triggerUrl = `https://script.google.com/home/projects/${ScriptApp.getScriptId()}/triggers`
    console.log(triggerUrl)
    const confirm = this.confirm(`Are you sure to create a trigger to download Gmail attachments every day at ${hour}:${minute}?\n
    Alternatively, create the trigger manually by visiting this link:\n${triggerUrl}`)
    if (confirm !== SpreadsheetApp.getUi().Button.YES) return this.toast("Cancelled!")

    const triggers = ScriptApp.getProjectTriggers()
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger))
    ScriptApp.newTrigger(CONFIG.TRIGGER_FUNCTION_NAME)
      .timeBased()
      .everyDays(1)
      .atHour(Number(hour))
      .nearMinute(Number(minute))
      .create()
    this.toast("The trigger has been created successfully!")
  }

  configurate(){
    const ui = SpreadsheetApp.getUi()
    let sheetApp = this.ss.getSheetByName(CONFIG.SHEET_NAME.APP)
    let sheetLog = this.ss.getSheetByName(CONFIG.SHEET_NAME.LOG)
    if (sheetApp && sheetLog) {
      const confirm = this.confirm(`You already have sheets "${CONFIG.SHEET_NAME.APP}" and "${CONFIG.SHEET_NAME.LOG}" configurated. Are you sure to procceed and overwrite them?`)
      if (confirm !== ui.Button.YES) return this.toast('Cancelled!')
    } 
    sheetLog = this.createSheetLog()
    sheetApp = this.createSheetApp()
    sheetApp.activate()
    this.toast(`Sheets "${CONFIG.SHEET_NAME.APP}" and "${CONFIG.SHEET_NAME.LOG}" have been configurated.`)
  }

  getLabelByName(name){
    const label = GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name)
    return label
  }

  getFolderByName(name){
    const currentFolder = DriveApp.getFileById(this.ss.getId()).getParents().next()
    const folders = currentFolder.getFoldersByName(name)
    if (folders.hasNext()) return folders.next()
    return currentFolder.createFolder(name)
  }

  getDownloadFolder(value){
    if (!value) return this.getFolderByName(CONFIG.FOLDER_NAME.DOWNLOADS)
    if (value.indexOf("https://drive.google.com/drive/folders/") !== -1) {
      value = value.split("folders/")[1].split("/")[0]
    }
    try {
      return DriveApp.getFolderById(value)
    } catch(error) {
      return this.getFolderByName(value)
    }
  }

  getAppData(){
    const sheet = this.ss.getSheetByName(CONFIG.SHEET_NAME.APP)
    if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME.APP}" was not found in the spreadsheet!`)
    const [, , ...values] = sheet.getDataRange().getValues()
    const query = values[0][1].toString().trim()
    const extensions = values[1][1].toString().trim().toLocaleLowerCase().split(",").map(v => v.trim()).filter(v => v !== "")
    const downloadFolder = this.getDownloadFolder(values[2][1].toString().trim())
    const label = this.getLabelByName(values[3][1].toString().trim() || CONFIG.LABEL_NAME)
    const days = values[4][1] || CONFIG.DAYS
    const runAt = values[5][1] || CONFIG.RUN_AT
    const sendLog = values[6][1]
    const sendLogTo = values[7][1].toString().replace(/\s*/g, "")
    const logEmailSubject = values[8][1].toString() || `${CONFIG.NAME} Logs`
    const after = new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0,10)
    const data = {
      query: `${query} has:attachment after:${after}`,
      extensions,
      downloadFolder,
      label,
      days,
      runAt,
      sendLog,
      sendLogTo,
      logEmailSubject
    }
    return data
  }

  /**
   * @param {GmailApp.GmailThread} thread
   * @param {GmailApp.GmailLabel} label
   */
  isThreadDownloaded(thread, label){
    const labels = thread.getLabels()
    return labels.includes(label)
  }

  isInFileExtensions(name, extensions){
    if (extensions.length === 0) return true
    if (extensions[0] === "*") return true
    name = name.toLocaleLowerCase()
    return extensions.findIndex(extension => name.includes(extension)) !== -1
  }
  /**
   * @param {GmailApp.GmailThread} thread
   * @param {GmailApp.GmailLabel} label
   * @param {DriveApp.Folder} downloadFolder
   * @param {String[]} extensions
   */
  downloadAttachments(thread, label, downloadFolder, extensions){
    if (this.isThreadDownloaded(thread, label)) return [
      new Date(), 
      thread.getFirstMessageSubject(), 
      thread.getPermalink(),
      'Thread was processed',
      null
    ]

    thread.addLabel(label)
    const attachments = thread.getMessages()[0].getAttachments()
    const links = []
    attachments.forEach(attachment => {
      const name = attachment.getName()
      if (this.isInFileExtensions(name, extensions)){
        const blob = attachment.copyBlob()
        const file = downloadFolder.createFile(blob)
        links.push(file.getUrl())
      }
    })
    return [
      new Date(),
      thread.getFirstMessageSubject(),
      thread.getPermalink(),
      links.length ? 'Downloaded': "No valid attachments",
      links.join('\n')
    ]
  }

  /**
   * @param {GmailApp.GmailThread[]} threads
   */
  processThreads(threads, {downloadFolder, extensions, label}){
    return threads.map(thread => {
      return this.downloadAttachments(thread, label, downloadFolder, extensions)
    })
  }

  addLogs(logs){
    const sheetLog = this.ss.getSheetByName(CONFIG.SHEET_NAME.LOG)
    sheetLog.clearFormats()
    sheetLog.getRange("A2:A").setNumberFormat(CONFIG.DATE_TIME_FORMAT)
    sheetLog.getRange(sheetLog.getLastRow() + 1, 1, logs.length, logs[0].length).setValues(logs).setBackground("#eeeeee")
    sheetLog.autoResizeColumns(1, 5)
    sheetLog.activate()
  }

  sendLogEmail({sendLogTo, logEmailSubject}, logs){
    const template = HtmlService.createTemplateFromFile("logEmail.html")
    template.logs = logs
    template.appName = CONFIG.NAME
    try{
      GmailApp.sendEmail(sendLogTo, logEmailSubject, "", {
        htmlBody: template.evaluate().getContent()
      })
    } catch(error) {
      // pass
      this.addLogs([[new Date(), "Send Log Email", error.message, null]])
    }
  }

  download(){
    const appData = this.getAppData()
    const threads = GmailApp.search(appData.query)
    const logs = this.processThreads(threads, appData)
    if (logs.length){
      this.addLogs(logs)
    }
    if (appData.sendLog && appData.sendLogTo && logs.length) {
      this.sendLogEmail(appData, logs)
    }
    if (logs.length) {
      this.toast(`Downloaded! Check the results in the sheet ${CONFIG.SHEET_NAME.LOG}`)
    } else {
      this.toast("No threads found to be downloaded.")
    }
  }
}

const app = new App()

const onOpen = (e) => app.onOpen(e) 
const configurate = () => app.configurate()
const download = () => app.download()
const createTrigger = () => app.createTrigger()