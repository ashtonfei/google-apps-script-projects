const APP_NAME = "Meeting Assistant"


/**
 * Evalute an html temlpate and insert it to another html file
 * @param {string} filename 
 */
function include(filename){
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent()
}

/**
 * Standard function fro google apps script web app project
 * @param {event object} e 
 */
function doGet(e){
    let template = HtmlService.createTemplateFromFile("html/index")
    let htmlOuput = template.evaluate()

    // set title
    htmlOuput.setTitle(APP_NAME)

    // set viewport meta tag
    let name = "viewport"
    let content = "width=device-width,initial-scale=1,minimal-ui"
    htmlOuput.addMetaTag(name, content)
    
    // set x frame option mode
    htmlOuput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)

    return htmlOuput
}
