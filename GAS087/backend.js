const SETTINGS = {
  APP_NAME: "GAS-087 Custom Form with Signature",
  SHEET_NAME: {
    RESPONSES: "Responses"
  },
  HEADERS: [
    { key: "timestamp", value: "Timestamp" },
    { key: "id", value: "ID" },
    { key: "name", value: "Name" },
    { key: "email", value: "Email" },
    { key: "phone", value: "Phone" },
    { key: "gender", value: "Gender" },
    { key: "city", value: "City" },
    { key: "date", value: "Date" },
    { key: "signature", value: "Signature" },
  ]
}

function link(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent()
}

function doGet() {
  return HtmlService.createTemplateFromFile("index.html")
    .evaluate()
    .setTitle(SETTINGS.APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

function submit(data) {
  data = JSON.parse(data)
  const headers = SETTINGS.HEADERS.map(({value}) => value)
  const id = Utilities.getUuid()
  const signatures = []
  const values = SETTINGS.HEADERS.map(({key}, index) => {
    if (key === "id") return id
    if (key === "timestamp") return new Date()
    if (!key in data) return null
    if (Array.isArray(data[key])) return data[key].join(",")
    if (data[key].startsWith("data:image")) {
      signatures.push(index)
      return SpreadsheetApp.newCellImage().setSourceUrl(data[key]).build().toBuilder()
    }
    return data[key]
  })
  const ws = SpreadsheetApp.getActive().getSheetByName(SETTINGS.SHEET_NAME.RESPONSES) || SpreadsheetApp.getActive().insertSheet(SETTINGS.SHEET_NAME.RESPONSES)
  ws.getRange(1,1, 1, headers.length).setValues([headers])
  const lastRow = ws.getLastRow()
  ws.getRange(lastRow + 1, 1, 1, values.length).setValues([values])
  signatures.forEach(index => {
    ws.getRange(lastRow + 1, index + 1).setValue(values[index])
  })
  return JSON.stringify({success: true, message: `Thanks for your submission! ID: ${id}`})
}






