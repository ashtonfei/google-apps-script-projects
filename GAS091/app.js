this.CONFIG = {
  DEBUG: false,
  DEBUG_EMAIL: "gas.test.fei@gmail.com",
  NAME: "GAS-091",
  SUBJECT: 'Share request for',
  FROM: "drive-shares-dm-noreply@google.com",
  CHECK_FREQUENCY_IN_MINIS: 10, // 1, 5, 10, 15, 30
  SHARED_LABEL: "SHARED",
  LOGS: "Logs",
  FILE_WHITELIST: "File Whitelist",
  USER_WHITELIST: "User Whitelist",
  PERMISSION: {
    READ: "Read",
    EDIT: "Edit",
    COMMENT: "Comment",
  }
}


function addDataValidation_(){
  const values = Object.entries(CONFIG.PERMISSION).map(([,value]) => value)
  const validation = SpreadsheetApp.newDataValidation().requireValueInList(values).build()
  const ss = SpreadsheetApp.getActive()
  const wsFileWhitelist = ss.getSheetByName(CONFIG.FILE_WHITELIST)
  if (wsFileWhitelist) wsFileWhitelist.getRange(`B2:B${wsFileWhitelist.getLastRow()}`).setDataValidation(validation)
  const wsUserWhitelist = ss.getSheetByName(CONFIG.USER_WHITELIST)
  if (wsUserWhitelist) wsUserWhitelist.getRange(`B2:B${wsUserWhitelist.getLastRow()}`).setDataValidation(validation)
}

function addFilesToWhitelist() {
  const ui = SpreadsheetApp.getUi()
  const ss = SpreadsheetApp.getActive()
  const propmt = ui.prompt(CONFIG.NAME, "Enter a folder ID to add files to whitelist:", ui.ButtonSet.OK_CANCEL)
  if (propmt.getSelectedButton() !== ui.Button.OK) return ss.toast("Cancelled!", CONFIG.NAME)
  const id = propmt.getResponseText().trim()
  if (!id) return ss.toast("Folder id is required!", CONFIG.NAME)
  try {
    const folder = DriveApp.getFolderById(id)
    const folderName = folder.getName()
    const folderUrl = folder.getUrl()
    const files = folder.getFiles()
    const newFiles = []
    while (files.hasNext()) {
      const file = files.next()
      newFiles.push([
        file.getId(),
        CONFIG.PERMISSION.READ,
        file.getName(),
        file.getUrl(),
        id,
        folderName,
        folderUrl,
      ])
    }
    if (newFiles.length === 0) return ss.toast("No files in the folder!", CONFIG.NAME)
    const ws = ss.getSheetByName(CONFIG.FILE_WHITELIST) || ss.insertSheet(CONFIG.FILE_WHITELIST)
    ws.getRange("1:1").clear()
    const headers = ["ID *", "Permission *", "Name", "URL", "Folder ID", "Folder Name", "Folder URL"]
    ws.getRange(1, 1, 1, headers.length).setValues([headers])
    ws.getRange(ws.getLastRow() + 1, 1, newFiles.length, newFiles[0].length).setValues(newFiles)
    addDataValidation_()
    ws.activate()
    ss.toast("New files have been added.")
  } catch (error) {
    return ss.toast(error.message, CONFIG.NAME)
  }
}

function getFileWhitelist_() {
  const ws = SpreadsheetApp.getActive().getSheetByName(CONFIG.FILE_WHITELIST)
  const [, ...items] = ws.getDataRange().getDisplayValues()
  const whitelist = {}
  items.forEach(([id, permission]) => whitelist[id] = { id, permission })
  return whitelist
}

function getUserWhitelist_() {
  const ws = SpreadsheetApp.getActive().getSheetByName(CONFIG.USER_WHITELIST)
  const [, ...items] = ws.getDataRange().getDisplayValues()
  const whitelist = {}
  items.forEach(([email, permission]) => whitelist[email] = { email, permission })
  return whitelist
}

function getSharedLabel_() {
  const label = GmailApp.getUserLabelByName(CONFIG.SHARED_LABEL)
  if (label) return label
  return GmailApp.createLabel(CONFIG.SHARED_LABEL)
}

/**
 * @param {GmailApp.GmailThread} thread
 * @param {GmailApp.GmailLabel} label
 */
function isLableApplied_(thread, label) {
  return thread.getLabels().some(v => v == label)
}

function searchForShareRequests_(label) {
  const query = `subject:${CONFIG.SUBJECT} from:${CONFIG.FROM} newer_than:1d`
  console.log(query)
  return GmailApp.search(query).filter(v => !isLableApplied_(v, label))
}


function parseEmailBody_(body) {
  const [email, , url] = body.split("\n").filter(v => v.trim() !== "")
  return {
    email: email.split(" ")[0],
    id: url.split("/d/")[1].split("/")[0]
  }
}

/**
 * @param {GmailApp.GmailThread} thread
 */
function shareFile_(thread, label, fileWhitelist, userWhitelist) {
  const message = thread.getMessages()[0]
  const subject = message.getSubject()
  const body = message.getPlainBody()
  const { email, id } = parseEmailBody_(body)
  if (!(email && id)) return [new Date(), subject, body, email, id, "Failed", null, "Email or ID not found in the email body!"]
  try {
    if (!(id in fileWhitelist)) return [new Date(), subject, body, email, id, "Failed", null, "File not in the whitelist!"]
    if (!(email in userWhitelist)) return [new Date(), subject, body, email, id, "Faild", null, "Email not in the whitelist!"]
    const file = DriveApp.getFileById(id)
    const permission = userWhitelist[email].permission || fileWhitelist[id].permission
    if (permission === CONFIG.PERMISSION.EDIT) {
      file.addEditor(CONFIG.DEBUG ? CONFIG.DEBUG_EMAIL : email)
    } else if (permission === CONFIG.PERMISSION.COMMENT) {
      file.addCommenter(CONFIG.DEBUG ? CONFIG.DEBUG_EMAIL : email)
    } else {
      file.addViewer(CONFIG.DEBUG ? CONFIG.DEBUG_EMAIL : email)
    }
    thread.addLabel(label)
    return [new Date(), subject, body, email, id, "Shared", permission, "Success"]
  } catch (error) {
    return [new Date(), subject, body, email, id, "Failed", null, error.message]
  }
}

function addLogs_(logs) {
  const headers = ["Timestamp", 'Subject', "Body", "Email", "ID", "Status", "Permission", "Notes"]
  const ss = SpreadsheetApp.getActive()
  const ws = ss.getSheetByName(CONFIG.LOGS) || ss.insertSheet(CONFIG.LOGS)
  ws.getRange("1:1").clear()
  ws.getRange(1, 1, 1, headers.length).setValues([headers])
  ws.getRange(ws.getLastRow() + 1, 1, logs.length, logs[0].length).setValues(logs)
}

function checkFileShareRequests() {
  const label = getSharedLabel_()
  const threads = searchForShareRequests_(label)
  const fileWhitelist = getFileWhitelist_()
  const userWhitelist = getUserWhitelist_()
  const logs = []
  threads.forEach(thread => {
    logs.push(shareFile_(thread, label, fileWhitelist, userWhitelist))
  })
  if (logs.length) {
    addLogs_(logs)
  }
}

function createTrigger(){
  const ui = SpreadsheetApp.getUi()
  const ss = SpreadsheetApp.getActive()
  const confirm = ui.alert(`${CONFIG.NAME} [confirm]`, "Are you sure to create a trigger to check the file sharing requests?", ui.ButtonSet.YES_NO)
  if (confirm !== ui.Button.YES) return ss.toast("Cancelled!", CONFIG.NAME) 
  const triggers = ScriptApp.getScriptTriggers()
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger))
  ScriptApp.newTrigger("checkFileShareRequests")
    .timeBased()
    .everyMinutes(CONFIG.CHECK_FREQUENCY_IN_MINIS)
    .create()
}

function onOpen() {
  const ui = SpreadsheetApp.getUi()
  const menu = ui.createMenu(CONFIG.NAME)
  menu.addItem("Add files to whitelist", "addFilesToWhitelist")
  menu.addItem("Check file share request", "checkFileShareRequests")
  menu.addItem("Create trigger", "createTrigger")
  menu.addToUi()
}