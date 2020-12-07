const APP_NAME = "Form App"
const SN_TO_BE_SUBMITTED = "To Be Submitted"
const HEADER_STATUS = "Submission Status"
const SUCCESS = "Success"
const SEP = ","

class App {
    constructor() {
        this.ss = SpreadsheetApp.getActive()
        this.ws = this.ss.getSheetByName(SN_TO_BE_SUBMITTED) || this.ss.insertSheet(SN_TO_BE_SUBMITTED)
        this.requestUrl = this.ws.getRange("B1").getValue()
    }


    run() {
        const values = this.ws.getDataRange().getValues()
        values.shift()
        values.shift()
        const headers = values.shift()

        let indexStatusColumn = headers.indexOf(HEADER_STATUS)
        indexStatusColumn = indexStatusColumn === -1 ? headers.length : indexStatusColumn
        headers[indexStatusColumn] = HEADER_STATUS

        values.forEach((value, i) => {
            const status = value[indexStatusColumn] ? value[indexStatusColumn] : ""
            value[indexStatusColumn] = status
            if (status !== SUCCESS) {
                let params = []
                headers.forEach((header, i) => {
                    if (i !== indexStatusColumn) {
                        const items = value[i].trim().split(SEP)
                        items.forEach(item => {
                            item = item.trim()
                            if (item !== "") params.push(`${header}=${item}`)
                        })
                    }
                })
                const url = `${this.requestUrl}?${params.join("&")}`
                const result = this.submit(url)
                value[indexStatusColumn] = result
            }
        })

        values.unshift(headers)
        this.ws.getRange(3, 1, values.length, values[0].length).setValues(values)
    }

    submit(url) {
        try {
            const response = UrlFetchApp.fetch(url, { method: "POST" })
            return SUCCESS
        } catch (e) {
            return e.message
        }
    }
}

function run() {
    const startTime = new Date().getTime()
    const ss = SpreadsheetApp.getActive()
    try {
        ss.toast("Submitting...", APP_NAME)
        const app = new App()
        app.run()
        const endTime = new Date().getTime()
        const usedTime = Math.floor((endTime - startTime) / 1000)
        ss.toast(`Done. Used time in second ${usedTime}.`, APP_NAME + " - Success")
    } catch (e) {
        ss.toast(e.message, APP_NAME + " - Error")
    }
}

function onOpen() {
    SpreadsheetApp.getUi().createMenu(APP_NAME).addItem("Submit", "run").addToUi()
}