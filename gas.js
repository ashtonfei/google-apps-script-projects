class App {
  constructor() {
    this.ss = SpreadsheetApp.getActive()
    this.settings = this.getSettings()
    this.props = PropertiesService.getScriptProperties()
    this.keyOrderNumber = "key-order-number"
  }

  getAppData_() {
    const appData = {
      ...this.settings,
      name: this.settings.appName,
      sheets: {
        responses: this.settings.snResponses,
        commonItems: this.settings.snCommonItems,
        repeatItems: this.settings.snRepeatItems,
        items: this.settings.snItems,
      },
      commonFormItems: this.getFormItems_(this.settings.snCommonItems),
      repeatFormItems: this.getFormItems_(this.settings.snRepeatItems),
    }
    return appData
  }

  getSettings() {
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

  getFormItems_(sheetname) {
    const ws = this.ss.getSheetByName(sheetname)
    if (!ws) return
    let [headers, ...values] = ws.getDataRange().getDisplayValues()
    headers = headers.map(v => v.trim())
    const indexType = headers.indexOf("type")
    return values.map(v => {
      const item = { value: null, type: v[indexType].trim() }
      headers.forEach((header, i) => {
        const key = header.trim()
        const value = v[i].trim()
        if (key === "items") {
          if (item.type === "autocomplete") {
            if (value.indexOf(",") === -1) {
              item[key] = this.getItems_(value)
            } else {
              item[key] = value.split(",").map(v => v.trim()).filter(v => v !== "")
            }
          } else if (item.type === "single" || item.type === "multiple") {
            item[key] = value.split(",").map(v => v.trim()).filter(v => v !== "")
          } else {
            item[key] = value
          }
        } else {
          item[key] = value
        }
      })
      return item
    })
  }

  addItems_(items) {
    const orderNumber = this.createOrderNumber_()
    const timestamp = new Date()
    items.forEach(item => {
      item[this.settings.keyUuid] = Utilities.getUuid()
      item[this.settings.keyOrderNumber] = orderNumber
      item[this.settings.keyTimestamp] = timestamp
      this.addItem_(item)
    })
  }

  createOrderNumber_() {
    const prop = this.props.getProperty(this.keyOrderNumber)
    const index = prop == null ? 1 : Number(prop)
    this.props.setProperty(this.keyOrderNumber, index + 1)
    const digit = (10 ** this.settings.lengthOrderNumber + index).toString().slice(-this.settings.lengthOrderNumber)
    return `${this.settings.prefixOrderNumber}${digit}`
  }

  addItem_(item) {
    const ws = this.ss.getSheetByName(this.settings.snResponses)
    const [keys] = ws.getDataRange().getDisplayValues()
    Object.keys(item).forEach(key => {
      if (keys.indexOf(key) === -1) keys.push(key)
    })
    ws.getRange(1,1,1,keys.length).setValues([keys])
    const rowContents = keys.map(key => item[key] || null)
    ws.appendRow(rowContents)
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

const submit = items => app.addItems_(JSON.parse(items))


