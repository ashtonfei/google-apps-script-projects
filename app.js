const APP_NAME = "Copydown Addon"
const KEY_SHEET_NAME = "sheet-name"
const KEY_FORMULAS = "formulas"
const FUNCTION_NAME = "onFormSubmit"

function onOpen(){
    const ui = SpreadsheetApp.getUi()
    const menu = ui.createMenu("Copydown")
    menu.addItem("Open", "showSidebar")
    menu.addToUi()
}

function showSidebar(){
    const ui = SpreadsheetApp.getUi()
    const title = APP_NAME
    const userInterface = HtmlService.createHtmlOutputFromFile("sidebar").setTitle(title)
    ui.showSidebar(userInterface)
}


function getFormulasBySheet(sheet) {
    const formulas = []
    const formulasR1C1 = sheet.getDataRange().getFormulasR1C1()
    if (formulasR1C1.length > 1) {
      const headers = sheet.getDataRange().getValues()[0]
      formulasR1C1[1].forEach((formula, i) => {
        if (formula) {
          formulas.push({
            formula: formula,
            label: headers[i],
            copyAsValue: false,
            column: i + 1,
          })
        }
      })
    }
    return formulas
}



const getAppData = (sheet) => {
    const scriptProps = PropertiesService.getScriptProperties().getProperties()
    const appData = {
        name: APP_NAME,
        saved: scriptProps[KEY_SHEET_NAME] && scriptProps[KEY_FORMULAS],
    }
    const ss = SpreadsheetApp.getActive()
    sheet = sheet || ss.getActiveSheet()
    const sheetName = scriptProps[KEY_SHEET_NAME] ? scriptProps[KEY_SHEET_NAME] : sheet.getName()
    const formulas = scriptProps[KEY_FORMULAS] ? JSON.parse(scriptProps[KEY_FORMULAS]) : getFormulasBySheet(sheet)
    
    const sheetNames = ss.getSheets().map(sheet => sheet.getName())
    appData.sheetName = sheetName
    appData.formulas = formulas
    appData.sheetNames = sheetNames
    return JSON.stringify(appData)
}

const onSheetChange = (name) => {
    const sheet = SpreadsheetApp.getActive().getSheetByName(name)
    const scriptProps = PropertiesService.getScriptProperties()
    scriptProps.deleteProperty(KEY_SHEET_NAME)
    scriptProps.deleteProperty(KEY_FORMULAS)
    return getAppData(sheet)
}

const saveSettings = (sheetname, formulas) => {
    const scriptProps = PropertiesService.getScriptProperties()
    scriptProps.setProperty(KEY_SHEET_NAME, sheetname)
    scriptProps.setProperty(KEY_FORMULAS, formulas)
    
    // create trigger
    const triggers = ScriptApp.getProjectTriggers()
    let trigger
    for (let i = 0 ; i < triggers.length; i ++ ) {
        if (triggers[i].getHandlerFunction() === FUNCTION_NAME &&
        triggers[i].getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
            trigger = triggers[i]
            break
        }
    }
    if (!trigger) {
        const url = SpreadsheetApp.getActive().getFormUrl()
        const form = FormApp.openByUrl(url)
        ScriptApp.newTrigger(FUNCTION_NAME)
            .forForm(form)
            .onFormSubmit()
            .create()
    }
    return getAppData()
}


function onFormSubmit(e) {
    const ss = SpreadsheetApp.getActive()
    const formUrl = ss.getFormUrl()
    const form = FormApp.openByUrl(formUrl)
    const response = form.getResponses().pop()
    
    const {sheetName, saved, formulas} = JSON.parse(getAppData())

    if (saved){
        const ws = ss.getSheetByName(sheetName)
        const lastRow = ws.getDataRange().getValues().length
        formulas.forEach(({formula, column, copyAsValue}) => {
            const cell = ws.getRange(lastRow, column)
            cell.setFormulaR1C1(formula)
            if (copyAsValue) {
               cell.setValue(cell.getValue()) 
            }
        })
    }
}




















