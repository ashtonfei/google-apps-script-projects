const APP_SETTINGS_KEY = "app_setting_key"
const TEMPLATE_NAME = "Prefilled Content"
const THEME_BACKGROUND_COLOR = "#448AFF"
const THEME_FONT_COLOR = "#FFFFFF"
const SEPARATOR = ","
const EMBED_FLAG = true

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
    const formItems = []
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
                formItems.push({type: "checkbox", id: headers[i], value:null})
                break
            case FormApp.ItemType.LIST:
                choices = response.getItem().asListItem().getChoices().map(choice=>choice.getValue()).join("\n")
                choices = `Single select\nOptions as below:\n${choices}`
                notes.push(choices)
                formItems.push({type: "select", id: headers[i], value:null})
                break
            case FormApp.ItemType.MULTIPLE_CHOICE:
                choices = response.getItem().asMultipleChoiceItem().getChoices().map(choice=>choice.getValue()).join("\n")
                choices = `Single select\nOptions as below:\n${choices}`
                notes.push(choices)
                formItems.push({type: "radio", id: headers[i], value:null})
                break
            case FormApp.ItemType.TEXT:
                notes.push("Input")
                formItems.push({type: "input", id: headers[i], value:null})
                break
            case FormApp.ItemType.PARAGRAPH_TEXT:
                notes.push("Paragraph")
                formItems.push({type: "textarea", id: headers[i], value:null})
                break
            case FormApp.ItemType.DATE:
                notes.push("Date")
                formItems.push({type: "date", id: headers[i], value:null})
                break
            case FormApp.ItemType.DATETIME:
                notes.push("Datetime")
                formItems.push({type: "datetime", id: headers[i], value:null})
            case FormApp.ItemType.TIME:
                notes.push("Time")
                formItems.push({type: "time", id: headers[i], value:null})
            default:
                notes.push(null)
                formItems.push({type: null, id: headers[i], value:null})
                
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
    return {headers, values, notes, formItems}
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

function sendEmail(sendTo, value, headers, publishedUrl, formItems){
    const key = "entry."
    let prefilledUrl = publishedUrl + "?"
    
    value.slice(0, value.length - 3).forEach((prefilledValue, i)=>{
        const entry = key + headers[i].split(key)[1]
        if (entry){
            formItems[i].value = prefilledValue
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
    template.embedFlag = EMBED_FLAG
    template.prefilledUrl = prefilledUrl
    
    let htmlBody = template.evaluate().getContent()
    htmlBody.replace(' selected=""', "")
    console.log(formItems)
    formItems.forEach(({id, value, type})=>{
        switch (type) {
            case "input":
                if (value) htmlBody = htmlBody.replace(`name="${id}" value=""`, `name="${id}" value="${value}"`)
                console.log(`Input: name="${id}" value="${value}"`)
                break
            case "textarea":
                if (value) {
                    id = id.replace("entry.", "")
                    let re = new RegExp(`${id}".+\s+.+">`)
                    let match = htmlBody.match(re)
                    if (match){
                        match = match[0]
                        htmlBody = htmlBody.replace(match, `${match}${value}`)
                        console.log(`Textarea: ${match}${value} `)
                    }
                }
                break
            case "radio":
                if (value) htmlBody = htmlBody.replace(`name="${id}" value="${value}"`, `name="${id}" value="${value}" checked `)
                console.log(`Radio: name="${id}" value="${value}" checked `)
                break
            case "checkbox":
                if (value) {
                    value.split(SEPARATOR).forEach(segment=>{
                        segment = segment.trim()
                        htmlBody = htmlBody.replace(`name="${id}" value="${segment}"`, `name="${id}" value="${segment}" checked `)
                        console.log(`Checkbox: name="${id}" value="${segment}" checked `)
                    })
                }
                break
            case "select":
                if (value) {
                    id = id.replace("entry.", "")
                    let re = new RegExp(`${id}".+\\s+.+<option value="${value}"`, "gm")
                    let match = htmlBody.match(re)
                    if (match) {
                        match = match[0]
                        htmlBody = htmlBody.replace(match, `${match} selected `)
                        console.log(`Select: ${match} selected `)
                    }
                }
                break
             case "date":
                 console.log(value)
                 if (value){
                     const date = new Date(value)
                     console.log(date)
                     id = id.replace("entry.", "")
                     let re
                     let match
                         
                     const year = date.getFullYear()
                     if (!isNaN(year)){
                         re = new RegExp(`${id}_year".+\\s+.+<option value="${year}"`, "gm")
                         match = htmlBody.match(re)
                         console.log(re)
                         console.log(match)
                         if (match){
                              match = match[0]
                              htmlBody = htmlBody.replace(match, `${match} selected `)
                              console.log(`Select: ${match} selected `)
                         }
                     }
                     
                     const month = date.getMonth() + 1
                     if(!isNaN(month)){
                         re = new RegExp(`${id}_month".+\\s+.+<option value="${month}"`, "gm")
                         match = htmlBody.match(re)
                         console.log(re)
                         console.log(match)
                         if (match){
                              match = match[0]
                              htmlBody = htmlBody.replace(match, `${match} selected `)
                              console.log(`Select: ${match} selected `)
                         }
                     }
                     
                     const day = date.getDate()
                     if (!isNaN(day)){
                         re = new RegExp(`${id}_day".+\\s+.+<option value="${day}"`, "gm")
                         match = htmlBody.match(re)
                         console.log(re)
                         console.log(match)
                         if (match){
                              match = match[0]
                              htmlBody = htmlBody.replace(match, `${match} selected `)
                              console.log(`Select: ${match} selected `)
                         }
                     }
                 }
                 break
            case "time":
                console.log(value)
                if(value){
                    id = id.replace("entry.", "")
                    let ampm = "AM"
                    let [hour, minute] = value.split(":")
                    
                    if (hour >= 12) ampm = "PM"
                    if (hour == 0) hour = 12
                    if (hour > 12) hour = hour - 12
                    
                    hour = hour > 9 ? `${hour}` : `0${hour}`

                    let re = new RegExp(`${id}_hour".*\\s*.*<option value="${hour}"`, "gm")
                    let match = htmlBody.match(re)
                    if (match){
                        match = match[0]
                        htmlBody = htmlBody.replace(match, `${match} selected `)
                    }

                    re = new RegExp(`${id}_minute".*\\s*.*<option value="${minute}"`, "gm")
                    match = htmlBody.match(re)
                    if (match){
                        match = match[0]
                        htmlBody = htmlBody.replace(match, `${match} selected `)
                    }

                    re = new RegExp(`${id}_ampm".*\\s*.*<option value="${ampm}"`, "gm")
                    match = htmlBody.match(re)
                    if (match){
                        match = match[0]
                        htmlBody = htmlBody.replace(match, `${match} selected `)
                    }
                }
                break
        }
    })
    
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
    const {formItems} = getTemplateData()
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
                const {status, prefilledUrl} = sendEmail(sendTo, value, headers, publishedUrl, formItems)
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

