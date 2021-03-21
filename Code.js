const APP_NAME = "📬 Mail Merge" // app name and title name
const APP_NAME_ERROR = "🔴 Mail Merge" // title name when there is an error
const APP_NAME_GOOD = "🟢 Mail Merge" // title name when there is no error

const SN_BODY = "Email Body" // sheet name of the email body template
const SN_SETTINGS = "Email Settings" // sheet name of the email settings
const TIS_TOAST = 20 // time in seconds for the toast message
const FONT_SIZE_SCALE = 1.3 // font size scale (actual font size in email = size in sheet * FONT_SIZE_SCALE)

const BORDER_STYLES = {
  default: "1px solid",
  DOTTED: "1px dotted",
  DASHED: "1px dashed",
  SOLID: "1px solid",
  SOLID_MEDIUM: "2px solid",
  SOLID_THICK: "3px solid",
  DOUBLE: "3px double"
}

class App {
  constructor() {
    this.ss = SpreadsheetApp.getActive()
    this.theme = this.ss.getSpreadsheetTheme()
    this.ui = SpreadsheetApp.getUi()
    this.buttonSet = this.ui.ButtonSet

    this.wsBody = this.ss.getSheetByName(SN_BODY)
    this.wsSettings = this.ss.getSheetByName(SN_SETTINGS)
    this.isAppValid = this.wsBody && this.wsSettings

    this.token = ScriptApp.getOAuthToken()
  }

  getThemeColor(themeColor) {
    return this.theme.getConcreteColor(themeColor).asRgbColor().asHexString()
  }

  getFileBlobs(urls) {
    // get the file urls by split them by new line
    urls = urls.toString().trim().split("\n").map(v => v.trim()).filter(v => v.indexOf("https://drive.google.com/file/d/") !== -1)

    // remove duplicates
    urls = [... new Set(urls)]

    // get file blobs
    const blobs = []
    urls.forEach(url => {
      const id = url.split("/d/")[1].split("/")[0]
      const file = DriveApp.getFileById(id)
      if (file) blobs.push(file.getBlob())
    })
    return blobs
  }

  exportSheetToPDF({ id, gid, name }) {
    const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf&size=7&gridlines=false&gid=${gid}`
    const options = {
      method: "get",
      headers: { "authorization": "Bearer " + this.token }
    }
    const response = UrlFetchApp.fetch(url, options)
    if (response.getResponseCode() == 200) return response.getBlob().setName(`${name}.pdf`)
    return null
  }

  getFileBlobsFromSheet(urls) {
    // get the file urls by split them by new line
    urls = urls.toString().trim().split("\n")
      .map(v => v.trim())
      .filter(v => v.indexOf("https://docs.google.com/spreadsheets/d/") !== -1 && v.indexOf("#gid=") !== -1)

    // remove duplicates
    urls = [... new Set(urls)]

    // get file blobs
    const blobs = []
    urls.forEach(url => {
      const id = url.split("/d/")[1].split("/")[0]
      const gid = url.split("#gid=")[1]
      const sheet = SpreadsheetApp.openByUrl(url).getSheets().find(sheet => sheet.getSheetId() == gid)
      if (sheet) {
        const blob = this.exportSheetToPDF({ id, gid, name: sheet.getSheetName() })
        if (blob) blobs.push(blob)
      }
    })
    return blobs
  }

  getEmailSettings() {
    this.ss.toast("Get email settings...", APP_NAME, TIS_TOAST)
    const [headers, ...values] = this.wsSettings.getDataRange().getValues()
    const settings = {}
    values.forEach(([key, value]) => {
      if (key === "filesOnGoogleDrive") {
        if (settings.attachments) {
          settings.attachments = [...settings.attachments, ...this.getFileBlobs(value)]
        } else {
          settings.attachments = this.getFileBlobs(value)
        }
      } else if (key === "pdfsFromSheet") {
        if (settings.attachments) {
          settings.attachments = [...settings.attachments, ...this.getFileBlobsFromSheet(value)]
        } else {
          settings.attachments = this.getFileBlobsFromSheet(value)
        }
      } else {
        settings[key] = value
      }
    })
    return settings
  }

  getMerges(range) {
    const values = range.getDisplayValues()
    const mergedRanges = {}
    range.getMergedRanges().forEach(range => {
      const key = range.getA1Notation().split(":")[0]
      mergedRanges[key] = {
        rows: range.getNumRows(),
        columns: range.getNumColumns(),
      }
    })

    const merges = values.map((row, r) => row.map((_, c) => {
      const cell = range.getCell(r + 1, c + 1)
      const key = cell.getA1Notation()
      if (!cell.isPartOfMerge()) return null
      return mergedRanges[key]
    }))

    return merges
  }

  getBorders(range) {
    const values = range.getDisplayValues()
    const borders = values.map((row, rowIndex) => row.map((_, columnIndex) => {
      const border = range.getCell(rowIndex + 1, columnIndex + 1).getBorder()
      if (!border) return null
      const item = {}
      const topBorder = border.getTop()
      const rightBorder = border.getRight()
      const bottomBorder = border.getBottom()
      const leftBorder = border.getLeft()

      if (topBorder) {
        const colorType = topBorder.getColor().getColorType().toString()
        let color = ""
        if (colorType === "THEME") {
          color = this.getThemeColor(topBorder.getColor().asThemeColor().getThemeColorType())
        } else if (colorType === "RGB") {
          color = topBorder.getColor().asRgbColor().asHexString()
        }
        const style = BORDER_STYLES[topBorder.getBorderStyle() ? topBorder.getBorderStyle().toString() :  "default"]
        item.top = `${style} ${color};`
      }
      if (rightBorder) {
        const colorType = rightBorder.getColor().getColorType().toString()
        let color = ""
        if (colorType === "THEME") {
          color = this.getThemeColor(rightBorder.getColor().asThemeColor().getThemeColorType())
        } else if (colorType === "RGB") {
          color = rightBorder.getColor().asRgbColor().asHexString()
        }
        const style = BORDER_STYLES[rightBorder.getBorderStyle() ? rightBorder.getBorderStyle().toString() :  "default"]
        item.right = `${style} ${color};`
      }
      if (bottomBorder) {
        const colorType = bottomBorder.getColor().getColorType().toString()
        let color = ""
        if (colorType === "THEME") {
          color = this.getThemeColor(bottomBorder.getColor().asThemeColor().getThemeColorType())
        } else if (colorType === "RGB") {
          color = bottomBorder.getColor().asRgbColor().asHexString()
        }
        const style = BORDER_STYLES[bottomBorder.getBorderStyle() ? bottomBorder.getBorderStyle().toString() :  "default"]
        item.bottom = `${style} ${color};`
      }
      if (leftBorder) {
        const colorType = leftBorder.getColor().getColorType().toString()
        let color = ""
        if (colorType === "THEME") {
          color = this.getThemeColor(leftBorder.getColor().asThemeColor().getThemeColorType())
        } else if (colorType === "RGB") {
          color = leftBorder.getColor().asRgbColor().asHexString()
        }
        const style = BORDER_STYLES[leftBorder.getBorderStyle() ? leftBorder.getBorderStyle().toString() :  "default"]
        item.left = `${style} ${color};`
      }
      return item
    }))
    return borders
  }

  richTextToHtml(text) {
    const runs = text.getRuns()
    let html = ``
    runs.forEach(run => {
      const runStyle = run.getTextStyle()
      const style = `
      font-family:${runStyle.getFontFamily()};
      font-size:${runStyle.getFontSize() * FONT_SIZE_SCALE}px;
      color:${
        runStyle.getForegroundColorObject().getColorType().toString() === "RGB" ?
          runStyle.getForegroundColor() :
          runStyle.getForegroundColorObject().getColorType().toString() === "THEME" ? 
          this.getThemeColor(runStyle.getForegroundColorObject().asThemeColor().getThemeColorType())
          : null
        };
      font-weight:${runStyle.isBold() ? "bold" : "normal"};
      font-style:${runStyle.isItalic() ? "italic" : "normal"};
      text-decoration-line: ${runStyle.isStrikethrough() ? "line-through" : runStyle.isUnderline() ? "underline" : "normal"};
    `
      if (run.getLinkUrl()) {
        html += `<a href="${run.getLinkUrl()}" style="${style}">${run.getText()}</a>`
      } else {
        html += `<span style="${style}">${run.getText().replace(/\n/g, "<br/>").replace(/\s/g, "&nbsp;")}</span>`
      }
    })
    return html
  }

  getEmailBody() {
    this.ss.toast("Get email body...", APP_NAME, TIS_TOAST)
    const range = this.wsBody.getRange(1, 1, this.wsBody.getMaxRows(), this.wsBody.getMaxColumns())
    const values = range.getDisplayValues()
    const richTextValues = range.getRichTextValues()
    const heights = values.map((_, rowIndex) => this.wsBody.getRowHeight(rowIndex + 1))
    const widths = values[0].map((_, columnIndex) => this.wsBody.getColumnWidth(columnIndex + 1))

    const colors = range.getFontColors()
    const bgColors = range.getBackgrounds()
    const families = range.getFontFamilies()
    const styles = range.getFontStyles()
    const lines = range.getFontLines()
    const sizes = range.getFontSizes();
    const weights = range.getFontWeights();
    const xAlignments = range.getHorizontalAlignments();
    const yAlignments = range.getVerticalAlignments();
    const formulas = range.getFormulas()
    const merges = this.getMerges(range)
    const borders = this.getBorders(range)

    let htmlBody = `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">`
    values.forEach((row, r) => {
      let tr = `<tr>`
      row.forEach((cell, c) => {
        cell = cell.replace(/\n/g, "<br/>").replace(/\s/g, "&nbsp;")
        const merge = merges[r][c]
        if (merge !== undefined) {
          let style = `
            width:${widths[c]}px;
            height:${heights[r]}px;
            color:${colors[r][c]};
            background:${bgColors[r][c]};
            font-family:${families[r][c]};
            font-style:${styles[r][c]};
            font-size:${sizes[r][c] * FONT_SIZE_SCALE}px;
            font-weight:${weights[r][c]};
            text-decoration-line:${lines[r][c]};
            text-align:${xAlignments[r][c]};
            vertical-align:${yAlignments[r][c]};
          `

          // if cell is a image formula
          if (formulas[r][c].slice(1, 6).toUpperCase() === "IMAGE") {
            const url = formulas[r][c].split('"')[1]
            cell = `<div style="display:flex;"><img src="${url}" alt="image" style="margin: auto; max-height:${heights[r]}px;"></div>`
          }

          // if cell is a hyperlink formula
          if (formulas[r][c].slice(1, 10).toUpperCase() === "HYPERLINK") {
            const url = formulas[r][c].split('"')[1]
            cell = `<a href="${url}" style="${style}">${cell}</a>`
          }

          if (richTextValues[r][c].getRuns().length > 1) {
            cell = this.richTextToHtml(richTextValues[r][c])
          }

          if (borders[r][c]) {
            if (borders[r][c].top) {
              style += `border-top: ${borders[r][c].top}`
            }
            if (borders[r][c].right) {
              style += `border-right: ${borders[r][c].right}`
            }
            if (borders[r][c].bottom) {
              style += `border-bottom: ${borders[r][c].bottom}`
            }
            if (borders[r][c].left) {
              style += `border-left: ${borders[r][c].left}`
            }
          }

          if (merge) {
            tr += `<td colspan="${merge.columns}" rowspan="${merge.rows}" style="${style}">${cell}</td>`
          } else {
            tr += `<td style="${style}">${cell}</td>`
          }
        }

      })
      tr += "</tr>"
      htmlBody += tr
    })
    htmlBody += "</table>"
    return { htmlBody }
  }

  sendEmail() {

    // if app is not valid (when tab Email Body or Email Settings not found)
    if (!this.isAppValid) {
      this.ui.alert(APP_NAME_ERROR, `${SN_BODY} or ${SN_SETTINGS} not found in this spreadsheet.`, this.buttonSet.OK)
      return
    }

    // send a message to user
    this.ss.toast("Sending...", APP_NAME, TIS_TOAST)

    // get email settings
    const { trigger, recipient, subject, ...options } = this.getEmailSettings()

    // if email trigger is false (abort)
    if (!trigger) {
      this.ss.toast(`Email trigger is ${trigger}, email was not sent.`, APP_NAME_ERROR, TIS_TOAST)
      return
    }

    // if recipient or subject is not defined (abort)
    if (!(recipient && subject)) {
      this.ss.toast(`Recipient and subject are required, email was not sent.`, APP_NAME_ERROR, TIS_TOAST)
      return
    }

    // get email body
    const { htmlBody } = this.getEmailBody()

    // send email with email settings and boy
    try {
      GmailApp.sendEmail(recipient, subject, "", { ...options, htmlBody })
      this.ss.toast("Email has been sent successfully.", APP_NAME_GOOD, TIS_TOAST)
    } catch (e) {
      this.ss.toast(`${e.message}`, APP_NAME_ERROR, TIS_TOAST)
    }

  }
}

const sendEmail = () => new App().sendEmail()
const test = () => new App().getEmailBody()

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(APP_NAME)
    .addItem("📤 Send", "sendEmail")
    .addToUi()
}
