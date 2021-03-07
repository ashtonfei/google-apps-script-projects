class App {
  constructor() {
    this.ss = SpreadsheetApp.getActive()
  }

  getAppData_() {
    const settings = this.getSettings()
    const appData = {
      name: settings.appName,
      sheets: {
        responses: settings.snResponses,
        commonItems: settings.snCommonItems,
        repeatItems: settings.snRepeatItems,
        items: settings.snItems,
      },
      commonFormItems: this.getFormItems_(settings.snCommonItems),
      repeatFormItems: this.getFormItems_(settings.snRepeatItems),
    }
    return appData
  }

  getSettings(){
    const settings = {}
    const ws = this.ss.getSheetByName(SN_APP_DATA)
    if (!ws) return
    ws.getDataRange().getValues().slice(1).forEach(([key, value]) => {
      settings[key.toString().trim()] = value
    })
    return settings
  }

  getItems_(sheetname) {
    const ws = this.ss.getSheetByName(sheetname)
    if (!ws) return []
    const [headers, ...values] = ws.getDataRange().getValues()
    return values.map(v => {
      const item = {}
      headers.forEach((header, i) => {
        const key = header.toString().trim()
        item[key] = v[i]
      })
      return item
    })
  }

  getFormItems_(sheetname){
    const ws = this.ss.getSheetByName(sheetname)
    if (!ws) return
    let [headers, ...values] = ws.getDataRange().getDisplayValues()
    headers = headers.map(v => v.trim())
    const indexType = headers.indexOf("type")
    return values.map(v => {
      const item = { value: null, type: v[indexType].trim() }
      headers.forEach((header, i) => {
        const key = header.trim()
        if (key === "items") {
          if (item.type === "autocomplete") {
            item[key] = this.getItems_(v[i].trim())
          } else if (item.type === "single" || item.type === "multiple") {
            item[key] = v[i].trim().split(",").map(v => v.trim()).filter(v => v != "")
          } else {
            item[key] = v[i].trim()
          }
        } else {
          item[key] = v[i].trim()
        }
      })
      return item
    })
  }
}


const SN_APP_DATA = "App Data"
const app = new App()
const settings = app.getSettings()

const include = (filename) => HtmlService.createTemplateFromFile(filename).evaluate().getContent()

const doGet = e => HtmlService.createTemplateFromFile("index")
  .evaluate()
  .setTitle(settings.appName)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
  .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui")

const getAppData = () => JSON.stringify(app.getAppData_())



