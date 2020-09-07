const TITLE = "UUID" // default title of the restriction question
const ITEMS = ["UUID001", "UUID002", "UUID003", "UUID004"] // default valid items of the restriction question
const ERROR = "Invalid UUID code." // default error message of the restriction question
const EMPTY_MESSAGE = "No item is availabel now." // default message of the restriction question when there is no valid item left

const KEY_TITLE = "title" // key name for storing restriction question title
const KEY_ITEMS = "items" // key name for storing valid items
const KEY_ERROR = "error" // key name for storing restriction error message

function onOpen() {
    const ui = FormApp.getUi()
    const menu = ui.createMenu("Restriction")
    menu.addItem("Update restrictions", "showSidebar")
    menu.addToUi()
    showSidebar()
}

const showSidebar = () => {
    const scriptProp = PropertiesService.getScriptProperties()
    let items = JSON.parse(scriptProp.getProperty(KEY_ITEMS))
    if ( items ) items = items.join("\n")
    const title = scriptProp.getProperty(KEY_TITLE)
    const error = scriptProp.getProperty(KEY_ERROR)
    
    const ui = FormApp.getUi()
    const template = HtmlService.createTemplateFromFile("sidebar")
    template.items = items || ITEMS.join("\n")
    template.title = title || TITLE
    template.error = error || ERROR
    template.titles = getTextItemTitles()

    const userInterface = template.evaluate()
        .setHeight(560)
        .setWidth(720)
        .setTitle("Update restrictions")
    ui.showSidebar(userInterface)
}

const updateRestriction = ({title, items, error}) => {
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
        .setValidation(validation)
    const scriptProp = PropertiesService.getScriptProperties()
    scriptProp.setProperty(KEY_TITLE, title)
    scriptProp.setProperty(KEY_ITEMS, JSON.stringify(items))
    scriptProp.setProperty(KEY_ERROR, error)
    return "Success"
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
    const items = form.getItems()
    const textItems = items.filter(item => item.getType() === FormApp.ItemType.TEXT)
    const textItemTitles = textItems.map(item => item.getTitle())
    return textItemTitles
}


const onFormsubmit = (e) => {
    console.log(e)
    const scriptProps = PropertiesService.getScriptProperties()
    const title = scriptProps.getProperty(KEY_TITLE)
    let items = JSON.parse(scriptProps.getProperty(KEY_ITEMS))
    let error = scriptProps.getProperty(KEY_ERROR)
    
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
            items = ["afei-" + Utilities.getUuid() + "-afei"]
            error = EMPTY_MESSAGE
        }
        updateRestriction( {title, items, error} )
    }
}





