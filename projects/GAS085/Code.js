const APP_NAME = "💹 SlidePro"
const REPORT_FOLDER_NAME = "Reports"
const SHEET_NAME_REPORTS = "Reports"
const SHEET_NAME_TEXT = "Text"
const SHEET_NAME_IMAGE = "Image"
const SHEET_NAME_TABLE_PATTERN = /^{{.+}}$/
const TRANSPARENT_COLOR = "#ffffff" // take white as transparent for table cell

class App {
  constructor(name = APP_NAME) {
    this.name = name
    this.ss = SpreadsheetApp.getActive()
    this.currentFolder = DriveApp.getFileById(this.ss.getId()).getParents().next()
    this.setTextPlaceholdersSheet()
    this.setImagePlaceholdersSheet()
    this.setTablePlaceholdersSheets()
    this.setReportFolder()
    this.setSlideTemplate()
  }

  getFileIdFromUrl(url){
    if (url.indexOf("/d/") === -1) return url
    return url.split("/d/")[1].split("/")[0]
  }

  setSlideTemplate() {
    const templateUrl = this.ss.getSheetByName(SHEET_NAME_REPORTS).getRange("B1").getDisplayValue()
    const id = this.getFileIdFromUrl(templateUrl)
    this.template = DriveApp.getFileById(id)
    return this
  }

  setTextPlaceholdersSheet(name = SHEET_NAME_TEXT) {
    this.sheetTextPlaceholders = this.ss.getSheetByName(name)
    return this
  }

  setImagePlaceholdersSheet(name = SHEET_NAME_IMAGE) {
    this.sheetImagePlaceholders = this.ss.getSheetByName(name)
    return this
  }

  setTablePlaceholdersSheets() {
    this.sheetsTablePlaceholders = this.ss.getSheets().filter(sheet => {
      const name = sheet.getName()
      if (SHEET_NAME_TABLE_PATTERN.test(name)) return sheet
    })
    return this
  }

  setReportFolder(name = REPORT_FOLDER_NAME) {
    this.sheetReports = this.ss.getSheetByName(SHEET_NAME_REPORTS) || this.ss.insertSheet(SHEET_NAME_REPORTS)
    this.sheetReports.getRange(2, 1, 1, 3).setValues([["Report name", "Link", "Created At"]])
    const folders = this.currentFolder.getFoldersByName(name)
    if (folders.hasNext()) {
      this.reportFolder = folders.next()
    } else {
      this.reportFolder = this.currentFolder.createFolder(name)
    }
    return this
  }

  getTextPlaceholders() {
    const placeholders = {}
    const values = this.sheetTextPlaceholders.getDataRange().getDisplayValues().slice(1)
    values.forEach(([key, value]) => {
      placeholders[key.trim()] = value
    })
    return placeholders
  }

  getImagePlaceholders() {
    const placeholders = {}
    const values = this.sheetImagePlaceholders.getDataRange().getValues().slice(1)
    values.forEach(([key, id, url, crop, link]) => {
      id = this.getFileIdFromUrl(id)
      placeholders[key.trim()] = { id, url, crop, link }
    })
    return placeholders
  }

  getTablePlaceholders() {
    const placeholders = {}
    this.sheetsTablePlaceholders.forEach(sheet => {
      const values = sheet.getDataRange().getDisplayValues()
      const colors = sheet.getDataRange().getFontColors()
      const bgColors = sheet.getDataRange().getBackgrounds()
      placeholders[sheet.getName()] = values.map((rowValues, rowIndex) => {
        return rowValues.map((value, colIndex) => ({
          value,
          color: colors[rowIndex][colIndex],
          bgColor: bgColors[rowIndex][colIndex] === TRANSPARENT_COLOR ? null : bgColors[rowIndex][colIndex]
        }))
      })
    })
    return placeholders
  }

  createReportFilename(placeholders) {
    let name = this.template.getName()
    Object.entries(placeholders).forEach(([key, value]) => {
      name = name.replace(new RegExp(key, 'gi'), value)
    })
    return name
  }

  createReport() {
    const ui = SpreadsheetApp.getUi()
    const confirm = ui.alert(`${this.name} [Confirm]`, "Are you sure to create a new report?", ui.ButtonSet.YES_NO)
    if (confirm !== ui.Button.YES) return
    try {
      this.ss.toast("working...", `Processing placeholders`)
      const textPlaceholders = this.getTextPlaceholders()
      const imagePlaceholders = this.getImagePlaceholders()
      const tablePlaceholders = this.getTablePlaceholders()

      const name = this.createReportFilename(textPlaceholders)

      this.ss.toast("working...", `Create a copy from template`)
      const copy = this.template.makeCopy(name, this.reportFolder)
      const presentation = SlidesApp.openById(copy.getId())

      this.ss.toast("working...", `Update images`)
      SlidePro.replaceImagePlaceholders(presentation, imagePlaceholders)
      this.ss.toast("working...", `Update texts`)
      SlidePro.replaceTextPlaceholders(presentation, textPlaceholders)
      this.ss.toast("working...", `Update tables`)
      SlidePro.replaceTablePlaceholders(presentation, tablePlaceholders)
      this.sheetReports.appendRow([presentation.getName(), presentation.getUrl(), new Date()])
      this.sheetReports.activate()
      this.ss.toast("Done!", `${this.name} [Success]`)
      ui.alert(`${this.name} [Success]`, "New report has been created successfully!", ui.ButtonSet.OK)
    } catch (err) {
      this.ss.toast(err.message, `Error`)
      ui.alert(`${this.name} [Error]`, err.message, ui.ButtonSet.OK)
    }
  }
}

function createReport() {
  const app = new App().createReport()
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(APP_NAME)
    .addItem("▶ Create report", "createReport")
    .addToUi()
}