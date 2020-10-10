const ACTION = "_action"
const UPDATE = "Update"
const CREATE = "Create"
const DELETE = "Delete"

const KEY_TABLE_NAME = "tableName"
const KEY_API_KEY = "apiKey"
const KEY_BASE_ID = "baseId"

const SS = SpreadsheetApp.getActive()
const airtable = new Airtable()

function onOpen() {
    const TABLE_NAME = PropertiesService.getScriptProperties().getProperty(KEY_TABLE_NAME)
    const API_KEY = PropertiesService.getScriptProperties().getProperty(KEY_API_KEY)
    const BASE_ID = PropertiesService.getScriptProperties().getProperty(KEY_BASE_ID)

    const ui = SpreadsheetApp.getUi()
    const menu = ui.createMenu("Airtable")
    if (TABLE_NAME && API_KEY && BASE_ID) {
        menu.addItem(`Read (${TABLE_NAME})`, "readTable")
            .addItem(`Process (${TABLE_NAME})`, "processTable")
            .addSeparator()
    }
    menu.addItem("Settings", "openSettings")
    menu.addToUi()
}

function getTableData(name) {
    const ws = SS.getSheetByName(name)
    if (!ws) return
    const values = ws.getDataRange().getDisplayValues()
    const headers = values.shift()
    const creates = []
    const updates = []
    const deletes = []
    values.forEach(value => {
        const action = value.pop()
        const createTime = value.pop()
        const id = value.pop()

        if (action === CREATE) {
            const record = {
                fields: {}
            }
            value.forEach((cell, i) => {
                const key = headers[i]

                try {
                    const parsedValue = JSON.parse(cell)
                    if (typeof parsedValue === "object") {
                        record.fields[key] = parsedValue
                    } else {
                        record.fields[key] = cell
                    }
                } catch (e) {
                    record.fields[key] = cell
                }

            })
            creates.push(record)
        } else if (action === UPDATE) {
            const record = {
                id: id,
                fields: {},
            }
            value.forEach((cell, i) => {
                const key = headers[i]
                if (cell !== "") {
                    try {
                        const parsedValue = JSON.parse(cell)
                        if (typeof parsedValue === "object") {
                            record.fields[key] = parsedValue
                        } else {
                            record.fields[key] = cell
                        }
                    } catch (e) {
                        record.fields[key] = cell
                    }
                }
            })
            updates.push(record)
        } else if (action === DELETE) {
            deletes.push(id)
        }
    })

    const data = { creates, updates, deletes }
    return data
}

function processTable() {
    const ui = SpreadsheetApp.getUi()
    const confirm = ui.alert(
        "Airtable",
        `Are you sure to process the table "${airtable.tableName}" by the actions in the column "${ACTION}"?`,
        ui.ButtonSet.YES_NO)
    if (confirm === ui.Button.NO) return

    const { deletes, updates, creates } = getTableData(airtable.tableName)
    try {
        createRecords(creates)
        updateRecords(updates)
        deleteRecords(deletes)
        ui.alert("Airtable", `Table processing is done. You can run the "Read" function to see the result.`, ui.ButtonSet.OK)
    } catch (e) {
        ui.alert("Airtable Error", e.message, ui.ButtonSet.OK)
    }

}

function readTable() {
    const records = airtable.list()
    if (!records) return
    let keys
    let values = records.map(({ id, fields, createdTime }) => {
        if (!keys) {
            keys = Object.keys(fields)
            keys.sort()
        }

        let value = keys.map(key => typeof fields[key] === "object" ? JSON.stringify(fields[key]) : fields[key])
        value = [...value, id, createdTime, "No action"]
        return value
    })
    
    keys = [...keys, "id", "createdTime", ACTION]
    values = [keys, ...values]

    let sheet = SS.getSheetByName(airtable.tableName)
    if (!sheet) sheet = SS.insertSheet(TABLE_NAME)


    // clear old data and format
    sheet.getDataRange().clearDataValidations()
    sheet.clear()
    sheet.clearConditionalFormatRules()

    // set values
    sheet.getRange(1, 1, values.length, keys.length).setValues(values)

    // set data validation
    const rule = SpreadsheetApp.newDataValidation().requireValueInList([UPDATE, DELETE, CREATE, "No action"])

    const actionRange = sheet.getRange(2, keys.length, values.length - 1, 1)
    actionRange.setDataValidation(rule)

    // set conditional format
    const createRule = SpreadsheetApp.newConditionalFormatRule()
        .setRanges([actionRange])
        .whenTextEqualTo(CREATE)
        .setBackground("#34a853")
        .setFontColor("#ffffff")
        .build()
    const updateRule = SpreadsheetApp.newConditionalFormatRule()
        .setRanges([actionRange])
        .whenTextEqualTo(UPDATE)
        .setBackground("#fbbc04")
        .build()
    const deleteRule = SpreadsheetApp.newConditionalFormatRule()
        .setRanges([actionRange])
        .whenTextEqualTo(DELETE)
        .setBackground("#ea4335")
        .setFontColor("#ffffff")
        .build()

    sheet.setConditionalFormatRules([createRule, updateRule, deleteRule])

    sheet.getRange("A1").activate()
}

function createRecords(records) {
    for (let i = 0; i < records.length; i += 10) {
        const slice = records.slice(i, i + 10)
        airtable.create(slice)
    }
}

function updateRecords(records) {
    for (let i = 0; i < records.length; i += 10) {
        const slice = records.slice(i, i + 10)
        airtable.update(slice)
    }
}


function deleteRecords(records) {
    for (let i = 0; i < records.length; i += 10) {
        const slice = records.slice(i, i + 10)
        airtable.delete(slice)
    }
}


function openSettings() {
    const TABLE_NAME = PropertiesService.getScriptProperties().getProperty(KEY_TABLE_NAME)
    const API_KEY = PropertiesService.getScriptProperties().getProperty(KEY_API_KEY)
    const BASE_ID = PropertiesService.getScriptProperties().getProperty(KEY_BASE_ID)

    const settings = {
        apiKey: API_KEY,
        tableName: TABLE_NAME,
        baseId: BASE_ID,
    }
    const template = HtmlService.createTemplateFromFile("settings")
    template.settings = settings
    const userInterface = template.evaluate()
    userInterface
        .setTitle("Settings")
    SpreadsheetApp.getUi().showSidebar(userInterface)
}


function saveSettings(data) {
    PropertiesService.getScriptProperties().setProperties(data)
    onOpen()
}

