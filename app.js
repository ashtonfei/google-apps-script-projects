const PUBLISHER = "Ashton Fei"
const PUBLISHER_URL = "https://www.youtube.com/ashtonfei"

function doGet(e){
    if (e.queryString){
        let {name, format, download} = e.parameter
        if (name && format) {
            format = format.trim().toLowerCase()
            if (format === "json") return createJSON(name, download)
            if (format === "xml") return createXML(name, download)
        }else{
            return ContentService
              .createTextOutput(JSON.stringify({error: `${e.queryString} is an invalid API query`}))
              .setMimeType(ContentService.MimeType.JSON) 
        }
    }else{
        const homePage = createHomePage()
        return homePage
    }
}

const getBaseUrl = () => {
    return ScriptApp.getService().getUrl()
}

const createHomePage = () => {
    const baseUrl = getBaseUrl()
    const apis = SpreadsheetApp.getActive().getSheets().map(sheet=>`${baseUrl}?name=${sheet.getName()}&format=json`)
    const downloads = apis.map(api=>`${api}&download=true`)
    
    const apisXml = SpreadsheetApp.getActive().getSheets().map(sheet=>`${baseUrl}?name=${sheet.getName()}&format=xml`)
    const downloadsXml = apisXml.map(api=>`${api}&download=true`)
    
    const template = HtmlService.createTemplateFromFile("index.html")
    template.baseUrl = baseUrl
    template.apis = apis
    template.downloads = downloads
    template.apisXml = apisXml
    template.downloadsXml = downloadsXml
    
    return template
        .evaluate()
        .setTitle("API Documentation")
        .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}


const createJSON = (sheetName = "users", download = false) => {
    // mimeType for JSON
    const mimeType = ContentService.MimeType.JSON
    // get the file by sheet name
    const ws = SpreadsheetApp.getActive().getSheetByName(sheetName)
    
    // if sheet name was not found => return an error object 
    if (!ws) {
        if ((download == "true")) return ContentService
          .createTextOutput(JSON.stringify({error: `${sheetName} is invalid.`}))
          .setMimeType(mimeType)
          .downloadAsFile(`${sheetName}.json`)
        return ContentService
          .createTextOutput(JSON.stringify({error: `${sheetName} is invalid.`}))
          .setMimeType(mimeType)
    }
        
    // if sheet name is found => create a JSON object and return it
    // get the values of data range
    const values = ws.getDataRange().getValues()
    
    // initialize the object
    const obj = {}
    // add count property to the object
    obj.count = values.length - 1
    obj.publisher = PUBLISHER
    obj.publisherUrl = PUBLISHER_URL
    obj.lastBuildDate = new Date()
    // initialize the items array of the object
    obj.items = []
    // get the keys form the table header (the first row (index 0) in the sheet)
    const keys = values[0]
    
    // loop through values row by row, each row will be added as an item in the object
    values.forEach((rowValue, row) => {
        // read the data from row 2 (index 1)
        if (row > 0){
            // initialize the item object for each row
            let item = {}
            // loop through row value cell by cell, each cell will be added as an property in the item object
            rowValue.forEach((cell, column) => {
                // add row index as an id for the item
                item.id = row
                // get the key for the cell
                let key = keys[column]
                // assign key : cell pair to the item object
                item[key] = cell
            })
            // push item to items array
            obj.items.push(item)
        }
    })
    // return the obj
    
    if (download == "true") return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(mimeType)
      .downloadAsFile(`${sheetName}.json`)
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(mimeType)
}

const createXML = (sheetName = "users", download = false) => {
    // mimeType for XML
    const mimeType = ContentService.MimeType.XML
    // get the file by sheet name
    const ws = SpreadsheetApp.getActive().getSheetByName(sheetName)
    
    // if sheet name was not found => return an xml with error message
    if (!ws) {
        const root = XmlService.createElement("error")
        root.setText(`${sheetName} is invalid.`)
        const xmlDoc = XmlService.createDocument(root)
        const content = XmlService.getRawFormat().format(xmlDoc)
        if (download == "true") return ContentService.createTextOutput(content).setMimeType(mimeType).downloadAsFile(`${sheetName}.xml`)
        return ContentService.createTextOutput(content).setMimeType(mimeType)
    } 
        
    // if sheet name is found => create a JSON object and return it
    // get the values of data range
    const values = ws.getDataRange().getValues()
    
    // initialize the root element
    const rootElement = XmlService.createElement(sheetName)
    
    const countElement = XmlService.createElement("count").setText(values.length - 1)
    rootElement.addContent(countElement)
    
    const publisherElement = XmlService.createElement("publisher").setText(PUBLISHER)
    rootElement.addContent(publisherElement)
    
    const publisherUrlElement = XmlService.createElement("publisherUrl").setText(PUBLISHER_URL)
    rootElement.addContent(publisherUrlElement)
    
    const lastBuildDateElement = XmlService.createElement("lastBuildDate").setText(new Date())
    rootElement.addContent(lastBuildDateElement)
    
    // get the keys form the table header (the first row (index 0) in the sheet)
    const keys = values[0]
    
    // loop through values row by row, each row will be added as an item element in the root element
    values.forEach((rowValue, row) => {
        // read the data from row 2 (index 1)
        if (row > 0){
            // initialize the item element for each row
            let childElement = XmlService.createElement("item")
            // add row index as an id for the item
            let idElement = XmlService.createElement("id").setText(row)
            childElement.addContent(idElement)
            // loop through row value cell by cell, each cell will be added as an property in the item element
            rowValue.forEach((cell, column) => {
                // get the key for the cell
                let key = keys[column]
                let cdata = XmlService.createCdata(cell)
                // assign key : cell pair to the item object
                let element = XmlService.createElement(key).addContent(cdata)
                childElement.addContent(element)
            })
            // add child element to root
            rootElement.addContent(childElement)
        }
    })
    const xmlDoc = XmlService.createDocument(rootElement)
    // return the xml
    const content = XmlService.getRawFormat().format(xmlDoc)
    if (download == "true") return ContentService
      .createTextOutput(content)
      .setMimeType(mimeType)
      .downloadAsFile(`${sheetName}.xml`)
    return ContentService
      .createTextOutput(content)
      .setMimeType(mimeType)
}


function fetchJsonData(){
    const url = "https://script.google.com/macros/s/AKfycbzeI0x3BF5YO1Bv43Zkr3Bj5CfmK-UTxtjHQrFDzwwEJ8Qlx2Y/exec?name=users&format=json"
    const response = UrlFetchApp.fetch(url).getContentText()
    const json = JSON.parse(response)
    console.log(json)
    return json
}

function fetchXmlData(){
    const url = "https://script.google.com/macros/s/AKfycbzeI0x3BF5YO1Bv43Zkr3Bj5CfmK-UTxtjHQrFDzwwEJ8Qlx2Y/exec?name=users&format=xml"
    const response = UrlFetchApp.fetch(url).getContentText()
    const xml = XmlService.parse(response)
    console.log(XmlService.getPrettyFormat().format(xml))
    return xml
}
