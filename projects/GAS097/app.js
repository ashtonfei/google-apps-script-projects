const CONFIG = {
  APP_NAME: "💮 Multiple Select",
  DELIMITER: ","
}

class App {
  constructor(delimiter = ",") {
    this.name = CONFIG.APP_NAME
    this.ss = SpreadsheetApp.getActive()
    this.delimiter = CONFIG.DELIMITER
  }

  getUi() {
    return SpreadsheetApp.getUi()
  }

  onOpen(e) {
    const ui = this.getUi()
    const menu = ui.createMenu(this.name)
    menu.addItem("Open", "openSidebar")
    menu.addToUi()
  }

  getAppData() {
    const activeCell = this.ss.getActiveCell()
    const values = activeCell.getValue().toString().split(this.delimiter).filter(v => v !== "")
    const dataValidation = activeCell.getDataValidation()
    let items = []
    if (dataValidation) {
      const type = dataValidation.getCriteriaType().toString()
      if (type === "VALUE_IN_LIST") {
        items = [... new Set(dataValidation.getCriteriaValues()[0].filter(v => !v.includes(this.delimiter)))]
      } else if (type === "VALUE_IN_RANGE") {
        items = [...new Set(dataValidation.getCriteriaValues()[0].getValues().map(v => v[0]).filter(v => !v.includes(this.delimiter)))]
      }
    }
    items.sort()
    return {
      items,
      values,
      rangeName: activeCell.getA1Notation(),
      sheetName: activeCell.getSheet().getName(),
    }
  }

  openSidebar() {
    const template = HtmlService.createTemplateFromFile('sidebar.html')
    template.appData = JSON.stringify(this.getAppData())
    this.getUi().showSidebar(template.evaluate().setTitle(this.name)) 
  }

  toast(msg, title = this.name, timeout = 15){
    return this.ss.toast(msg, title, timeout)
  }
}

class MultipleSelectApp extends App {
  constructor() {
    super()
  }

  getValues(){
    const data = this.getAppData()
    return data
  }

  setValues(payload){
    let {values, items, rangeName, sheetName} = JSON.parse(payload)
    const value = values.join(this.delimiter)
    if (values.length) {
      items = [...new Set([...items, ...values])]
      items.sort()
      items.push(values.join(this.delimiter))
    }

    const activeRangeList = this.ss.getSelection().getActiveRangeList()
    let ranges = activeRangeList.getRanges()
    if (rangeName !== 'Selected Ranges') {
      const range = this.ss.getSheetByName(sheetName).getRange(rangeName)
      ranges = [range]
    }
    
    const dataValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(items)
      .build()
    
    ranges.forEach(range => {
      range.setDataValidation(dataValidation)
      range.setValue(value)
      range.activate()
    })
    if (rangeName === "Selected Ranges") {
      activeRangeList.activate()
    }
    const addresses = ranges.map(v => v.getA1Notation()).join(",")
    SpreadsheetApp.flush()
    this.toast(`Updated for "${addresses}"!`)
    return this.getValues()
  }

  clearValues(){
    const activeRangeList = this.ss.getSelection().getActiveRangeList()
    activeRangeList.getRanges().forEach(range => {
      range.clearContent()
      range.clearDataValidations()
    })
    this.toast(`Values and validations removed!`)
  }
}

const onOpen = (e) => new App().onOpen(e)
const openSidebar = () => new App().openSidebar()
const getValues = () => JSON.stringify(new MultipleSelectApp().getValues())
const setValues = (payload) => JSON.stringify(new MultipleSelectApp().setValues(payload))
const clearValues = () => new MultipleSelectApp().clearValues()

