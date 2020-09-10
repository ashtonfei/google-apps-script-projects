const TITLE = "UUID" // default title of the restriction question
const DESCRIPTION = "Please enter your UUID" // default description of the restriction question
const ITEMS = ["UUID001", "UUID002", "UUID003", "UUID004"] // default valid items of the restriction question
const ERROR = "Invalid UUID code." // default error message of the restriction question
const EMPTY_MESSAGE = "No item is available now." // default message of the restriction question when there is no valid item left

const KEY_TITLE = "title" // key name for storing restriction question title
const KEY_DESCRIPTION = "description" // key name for storing the restrction question description
const KEY_ITEMS = "items" // key name for storing valid items
const KEY_ERROR = "error" // key name for storing restriction error message
const KEY_EMPTY_MESSAGE = "empty" // key name for storing the empty message

const FUNCTION_NAME = "onFormSubmit"

function onOpen() {
    const ui = FormApp.getUi()
    const menu = ui.createMenu("From Restriction")
    menu.addItem("Settings", "showSidebar")
    if ( !isTriggerCreated() ) menu.addItem("Create trigger", "createTrigger")
    menu.addToUi()
}

const showSidebar = () => {
    const scriptProp = PropertiesService.getScriptProperties()
    let items = JSON.parse(scriptProp.getProperty(KEY_ITEMS))
    if ( items ) items = items.join("\n")
    const title = scriptProp.getProperty(KEY_TITLE)
    const description = scriptProp.getProperty(KEY_DESCRIPTION)
    const error = scriptProp.getProperty(KEY_ERROR)
    const emptyMessage = scriptProp.getProperty(KEY_EMPTY_MESSAGE)
    
    const ui = FormApp.getUi()
    const template = HtmlService.createTemplateFromFile("sidebar")
    template.items = items || ITEMS.join("\n")
    template.title = title || TITLE
    template.description = description || DESCRIPTION
    template.error = error || ERROR
    template.emptyMessage = emptyMessage || EMPTY_MESSAGE
    template.titles = getTextItemTitles()
    
    template.url = FormApp.getActiveForm().getPublishedUrl()
    
    const userInterface = template.evaluate()
        .setHeight(560)
        .setWidth(720)
        .setTitle("Settings")
    ui.showSidebar(userInterface)
}

const updateRestriction = ({title, description, items, error, emptyMessage}) => {
    const uuidItem = getItemByTitle(title)
    if ( !uuidItem ) return `<p class="error">Title "${title}" was not found in the form.<\/p>`
    const pattern = items.map(item=>`^${item}$`).join("|")
    const validation = FormApp
        .createTextValidation()
        .requireTextMatchesPattern(pattern)
        .setHelpText(error)
        .build()
    uuidItem
        .asTextItem()
        .setRequired(true)
        .setHelpText(description)
        .setValidation(validation)
    
    const scriptProp = PropertiesService.getScriptProperties()
    scriptProp.setProperty(KEY_TITLE, title)
    scriptProp.setProperty(KEY_DESCRIPTION, description)
    scriptProp.setProperty(KEY_ITEMS, JSON.stringify(items))
    scriptProp.setProperty(KEY_ERROR, error)
    scriptProp.setProperty(KEY_EMPTY_MESSAGE, emptyMessage)
    return "<p>Success<\/p>"
}

const getItemByTitle = (title) => {
    const form = FormApp.getActiveForm()
    const items = form.getItems()
    for ( let i = 0; i < items.length; i ++ ) {
        if (items[i].getTitle() === title) return items[i]
    }
}

const getTextItemTitles = () => {
    const form = FormApp.getActiveForm()
    const textItems = form.getItems(FormApp.ItemType.TEXT)
    const textItemTitles = textItems.map(item => item.getTitle())
    return textItemTitles
}


const onFormSubmit = (e) => {
    const scriptProps = PropertiesService.getScriptProperties()
    const title = scriptProps.getProperty(KEY_TITLE) || TITLE
    let description = scriptProps.getProperty(KEY_DESCRIPTION) || DESCRIPTION
    let items = JSON.parse(scriptProps.getProperty(KEY_ITEMS)) || ITEMS
    let error = scriptProps.getProperty(KEY_ERROR) || ERROR
    let emptyMessage = scriptProps.getProperty(KEY_EMPTY_MESSAGE) || EMPTY_MESSAGE
    
    const response = e. response
    const itemResponses = response.getItemResponses()
    let usedItem
    for ( let i = 0; i < itemResponses.length; i++ ) {
        if (itemResponses[i].getItem().getTitle() === title){
            usedItem = itemResponses[i].getResponse()
            break
        }
    }
    
    if ( usedItem ) {
        items = items.filter(item => item != usedItem)
        if (items.length === 0) {
            items = [Utilities.base64EncodeWebSafe("afei-" + Utilities.getUuid() + "-afei")]
            error = emptyMessage
            description = emptyMessage
        }
        updateRestriction( {title, description, items, error, emptyMessage} )
    }
}


const isTriggerCreated = () => {
    const type = ScriptApp.EventType.ON_FORM_SUBMIT
    const triggers = ScriptApp.getProjectTriggers()
    const matches = triggers.filter( trigger => trigger.getHandlerFunction() === FUNCTION_NAME && trigger.getEventType() === type)
    if ( matches.length > 0 ) return matches[0]
}


const createTrigger = () => {
    const type = ScriptApp.EventType.ON_FORM_SUBMIT
    if ( !isTriggerCreated() ) {
        const form = FormApp.getActiveForm()
        ScriptApp.newTrigger(FUNCTION_NAME).forForm(form).onFormSubmit().create()
        onOpen()
        FormApp.getUi().alert("Message", "Trigger has been created.", FormApp.getUi().ButtonSet.OK)
    }
}


