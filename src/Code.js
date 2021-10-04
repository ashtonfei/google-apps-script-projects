/**
* MIT License
* 
* Copyright (c) 2021 Ashton Fei
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
const APP_NAME = "🛍 DocPro"
class App {
  constructor(name = APP_NAME) {
    this.name = name
    /**@property {SpreadsheetApp.Sheet} */
    this.ss = SpreadsheetApp.getActive()
    /**@property {DriveApp.Folder} */
    this.parentFolder = this.getParentFolder()
    /**@property {SpreadsheetApp.Sheet} */
    this.textSheet = null
    /**@property {SpreadsheetApp.Sheet} */
    this.imageSheet = null
    /**@property {SpreadsheetApp.Sheet[]} */
    this.tableSheets = []
  }

  getParentFolder() {
    const file = DriveApp.getFileById(this.ss.getId())
    return file.getParents().next()
  }

  /**
   * Set the sheet for text placeholders
   * 
   * @param {string} name The name of the sheet for text placeholder
   * @return {object} this
   */
  setTextPlaceholderSheetByName(name) {
    const sheet = this.ss.getSheetByName(name)
    if (!sheet) throw new Error(`Sheet "${name}" was not found.`)
    this.textSheet = sheet
    return this
  }

  /**
   * Set the sheet for image placeholders
   * 
   * @param {string} name The name of the sheet for image placeholder
   * @return {object} this
   */
  setImagePlaceholderSheetByName(name) {
    const sheet = this.ss.getSheetByName(name)
    if (!sheet) throw new Error(`Sheet "${name}" was not found.`)
    this.imageSheet = sheet
    return this
  }

  /**
   * Create a table placeholder object with data from sheets
   * 
   * @param {array} names The names of the sheets for table placeholder
   * @return {object} The table placeholder project
   */
  setTablePlaceholderSheetsByNames(names) {
    this.ss.getSheets().forEach(sheet => {
      if (names.includes(sheet.getName())) this.tableSheets.push(sheet)
    })
    return this
  }

  setDocTemplateById(id) {
    this.template = DriveApp.getFileById(id)
    return this
  }

  getTextPlaceholders() {
    const values = this.textSheet.getDataRange().getDisplayValues().slice(1)
    const obj = {}
    values.forEach(([key, value]) => {
      obj[key] = value
    })
    return obj
  }

  getImagePlaceholders() {
    const values = this.imageSheet.getDataRange().getValues().slice(1)
    const obj = {}
    values.forEach(([key, id, url, width, height]) => {
      obj[key] = {
        id,
        url,
        width,
        height,
      }
    })
    return obj
  }

  getTablePlaceholders() {
    const placeholders = {}
    this.tableSheets.forEach(sheet => {
      const dataRange = sheet.getDataRange()
      const values = dataRange.getDisplayValues()
      const bgColors = dataRange.getBackgrounds()
      const fontColors = dataRange.getFontColors()
      const tableData = values.map((value, r) => {
        return value.map((cell, c) => {
          const style = {}
          style[DocumentApp.Attribute.FOREGROUND_COLOR] = fontColors[r][c]
          return {
            value: cell,
            bgColor: bgColors[r][c],
            style
          }
        })
      })
      placeholders[sheet.getName()] = tableData
    })
    return placeholders
  }

  run() {
    const textPlaceholders = this.getTextPlaceholders()
    const imagePlaceholders = this.getImagePlaceholders()
    const tablePlaceholders = this.getTablePlaceholders()

    tablePlaceholders["{{tableOne}}"][0][0].link = "https://youtube.com/ashtonfei"

    console.log(textPlaceholders)
    console.log(imagePlaceholders)
    console.log(JSON.stringify(tablePlaceholders))

    const filename = "DocPro " + new Date().toLocaleString()
    const copy = this.template.makeCopy(filename, this.parentFolder)
    const doc = DocumentApp.openById(copy.getId())

    DocPro.replaceTextPlaceholders(doc, textPlaceholders)
    DocPro.replaceImagePlaceholders(doc, imagePlaceholders)
    DocPro.replaceTablePlaceholders(doc, tablePlaceholders)
    SpreadsheetApp.getUi().alert(this.name, `New Doc has been created successfully.\n${doc.getUrl()}`, SpreadsheetApp.getUi().ButtonSet.OK)
  }
}

function run() {
  const app = new App(APP_NAME)
  app.setDocTemplateById("1h_84DIW591aD-aBsIidE7-h11ARs18RJqzykJmZHxEA")
  app.setTextPlaceholderSheetByName("Text")
  app.setImagePlaceholderSheetByName("Image")
  app.setTablePlaceholderSheetsByNames([
    "{{tableOne}}",
    "{{tableTwo}}",
    "{{tabeThree}}"
  ])
  app.run()
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(APP_NAME)
    .addItem("🆕 Create", "run")
    .addToUi()
}


function replaceText() {
  const placeholders = {
    "{{name}}": "Google",
    "{{gender}}": "Male"
  }
  const doc = DocumentApp.openById("17jAyJWWcMPynenOAdlZOBedtnoqIKhoarzvvhil3o4I")
  DocPro.replaceTextPlaceholders(doc, placeholders)
}

function replaceImages() {
  const doc = DocumentApp.openById("17jAyJWWcMPynenOAdlZOBedtnoqIKhoarzvvhil3o4I")
  const placeholders = {
    "{{image}}": {
      id: "1BEsBnmi4NSXt130CWKhrN7GjHGdzcc46", // For image on your Google Drive - optional
    },
  }
  DocPro.replaceImagePlaceholders(doc, placeholders)
}

function replaceTables() {
  const doc = DocumentApp.openById("17jAyJWWcMPynenOAdlZOBedtnoqIKhoarzvvhil3o4I")
  const placeholders = {
    "{{google}}":
      [
        [
          { value: "Name", bgColor: "#FF0000", link: "https://youtube.com/ashtonfei", style: { FOREGROUND_COLOR: "#FFFFFF", BOLD: true } },
          { value: "Email", bgColor: "#FF0000", style: { FOREGROUND_COLOR: "#FFFFFF", BOLD: true } },
          { value: "Gender", bgColor: "#FF0000", style: { FOREGROUND_COLOR: "#FFFFFF", BOLD: true } }
        ],
        [
          { value: "Ashton Fei", bgColor: "#FF0000", style: { FOREGROUND_COLOR: "#000000", ITALIC: true } },
          { value: "test@gmail.com", bgColor: "#FF0000", style: { FOREGROUND_COLOR: "#000000", ITALIC: true } },
          { value: "Male", bgColor: "#FF0000", style: { FOREGROUND_COLOR: "#000000", ITALIC: true } }
        ],
      ]
  }
  DocPro.replaceTablePlaceholders(doc, placeholders)
}

