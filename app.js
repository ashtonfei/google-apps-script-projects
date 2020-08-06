const APP_SETTINGS_KEY = "app_setting_key"
const TEMPLATE_NAME = "Prefilled Content"
const THEME_BACKGROUND_COLOR = "#448AFF"
const THEME_FONT_COLOR = "#FFFFFF"
const SEPARATOR = ","

function onOpen(e) {
    const ui = SpreadsheetApp.getUi()
    ui.createMenu("App")
        .addItem("Send prefilled form", "sendPrefilledForm")
        .addItem("Open settings", "showSettings")
        .addToUi()
}


function showSettings(){
    const template = HtmlService.createTemplateFromFile("setup.html")
    const userInterface = template.evaluate()
    userInterface.setTitle("Settings")
        .setWidth(800)
        .setHeight(550)
    
    SpreadsheetApp.getActive().show(userInterface)
}


function getAppSettings(){
    const scriptProps = PropertiesService.getScriptProperties()
    const appSettings = scriptProps.getProperty(APP_SETTINGS_KEY)
    return appSettings
}


function saveAppSettings(appSettings){
    const scriptProps = PropertiesService.getScriptProperties()
    scriptProps.setProperty(APP_SETTINGS_KEY, appSettings)
    return appSettings
}

function validateForm(url){
    const appSettings = {
        url: null,
        publishedUrl: null,
        editResponseUrl: null,
        hasFirstResponse: null,
    }
    if (!url) url = JSON.parse(getAppSettings()).url
    if (url) {
        const form = FormApp.openByUrl(url)
        if (form){
            const reponses = form.getResponses()
            appSettings.url = form.getEditUrl()
            appSettings.publishedUrl = form.getPublishedUrl()
            if (reponses.length) {
                appSettings.hasFirstResponse = true
                appSettings.editResponseUrl = reponses[0].getEditResponseUrl()
            }
        }
    }
    return saveAppSettings(JSON.stringify(appSettings))
}

function getTemplateData(){
    const url = JSON.parse(getAppSettings()).url
    const form = FormApp.openByUrl(url)
    const firstResponse = form.getResponses()[0]
    const prefilledUrl = firstResponse.toPrefilledUrl()
    const pattern = /entry.[0-9]+/gm
    let headers = prefilledUrl.match(pattern)
    headers = [... new Set(headers)]
    headers.push("Prefilled URL")
    headers.push("Send To")
    headers.push("Status")
    
    const itemResponses = firstResponse.getItemResponses()
    const values = []
    const notes = []
    itemResponses.forEach((response,i)=>{
        //response = itemResponses[0].getItem().asMultipleChoiceItem().getChoices()
        const itemTitle = response.getItem().getTitle()
        const itemType = response.getItem().getType()
        let choices
        switch (itemType){
            case FormApp.ItemType.CHECKBOX:
                choices = response.getItem().asCheckboxItem().getChoices().map(choice=>choice.getValue()).join("\n")
                choices = `Multiple select\nSeparate with ${SEPARATOR}\nOptions as below:\n${choices}`
                notes.push(choices)
                break
            case FormApp.ItemType.LIST:
                choices = response.getItem().asListItem().getChoices().map(choice=>choice.getValue()).join("\n")
                choices = `Single select\nOptions as below:\n${choices}`
                notes.push(choices)
                break
            case FormApp.ItemType.MULTIPLE_CHOICE:
                choices = response.getItem().asMultipleChoiceItem().getChoices().map(choice=>choice.getValue()).join("\n")
                choices = `Single select\nOptions as below:\n${choices}`
                notes.push(choices)
                break
            default:
                notes.push(null)
                
        } 
        headers[i] = [itemTitle, headers[i]].join("\n")
        const value = response.getResponse()
        if (Array.isArray(value)){
            values.push(value.join(SEPARATOR))
        }else{
            values.push(value)
        }
    })
    values.push(prefilledUrl)
    values.push("someone@example.com")
    values.push("New")
    
    notes.push(null)
    notes.push("Comma separated email addresses")
    notes.push(`Sent: Email sent successfully, line will be ignored in the next run`)
    return {headers, values, notes}
    
}

function createTemplate(){
    let ws = SpreadsheetApp.getActive().getSheetByName(TEMPLATE_NAME)
    let message
    if (ws) {
        message = `There is a sheet name "${TEMPLATE_NAME}" in the spreadsheet, please rename it and try again.`
    }else{
        ws = SpreadsheetApp.getActive().insertSheet(TEMPLATE_NAME)
        const {headers, values, notes} = getTemplateData()
        ws.setTabColor(THEME_BACKGROUND_COLOR)
        ws.getRange(1,1,2, headers.length).setValues([headers, values])
        ws.getRange(1, 1, 1, headers.length)
            .setBackground(THEME_BACKGROUND_COLOR)
            .setFontColor(THEME_FONT_COLOR)
            .setFontWeight("Bold")
            .setHorizontalAlignment("Center")
            .setVerticalAlignment("Middle")
        ws.getRange(1, 1, 1, notes.length).setNotes([notes])
        message = `Template named "${TEMPLATE_NAME}" has been created successfully.`
    }
    return message
}

function sendEmail(sendTo, value, headers, publishedUrl){
    const key = "entry."
    let prefilledUrl = publishedUrl + "?"
    value.slice(0, value.length - 3).forEach((prefilledValue, i)=>{
        const entry = key + headers[i].split(key)[1]
        if (entry){
            if(prefilledValue.indexOf(SEPARATOR) === -1){
                prefilledUrl += `&${entry}=${prefilledValue}`
            }else{
                prefilledValue.split(SEPARATOR).forEach(segment=>{
                    segment = segment.trim()
                    prefilledUrl += `&${entry}=${segment}`
                })
            }
            
        }
    })
    const template = HtmlService.createTemplateFromFile("email.html")
    template.value = value
    template.prefilledUrl = prefilledUrl
    console.log(prefilledUrl)
    console.log(value)
    const htmlBody = template.evaluate().getContent()
    
    const subject = "Prefilled Form Link"
    const body = ""
    const options = {
        htmlBody
    }
    try{
        GmailApp.sendEmail(sendTo, subject, body, options)
        return {status: "Sent", prefilledUrl}
    }catch(e){
        return {status: e.message, prefilledUrl}
    }
}

function sendPrefilledForm(){
    const {url, publishedUrl} = JSON.parse(getAppSettings())
    const ss = SpreadsheetApp.getActive()
    const ui = SpreadsheetApp.getUi()
    const ws = ss.getSheetByName(TEMPLATE_NAME)
    
    let title = "Message"
    let prompt = ""
    let buttons = ui.ButtonSet.OK
    if (ws){
        const values = ws.getDataRange().getDisplayValues()
        const headers = values[0]
        values.forEach((value, i)=>{
            let status = value[value.length - 1].toLowerCase().trim()
            const sendTo = value[value.length - 2]
            if (i > 0 && sendTo.indexOf("@") !== -1 && status !== "sent"){
                const {status, prefilledUrl} = sendEmail(sendTo, value, headers, publishedUrl)
                values[i][value.length - 1] = status
                values[i][value.length - 3] = prefilledUrl
            }
        })
        
        ws.getRange(1, 1, values.length, values[0].length).setValues(values)
        
    }else{
        prompt = `Sheet "${TEMPLATE_NAME}" was not found in the spreadsheet. You may need to open the app settings to create the template.`
        ui.alert(title, prompt, buttons)
    }
}

