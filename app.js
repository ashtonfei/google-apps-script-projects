function doGet(e){
    if (e.queryString){
        const {name, format, download} = e.parameter
        if (name && format) {
            if (format.trim().toLowerCase() === "json") return createJSON(name, download)
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
    
    const template = HtmlService.createTemplateFromFile("index.html")
    template.baseUrl = baseUrl
    template.apis = apis
    template.downloads = downloads
    
    return template.evaluate().setTitle("API Documentation")
}


const createJSON = (sheetName = "users", download = false) => {
    // mimeType for JSON
    const mimeType = ContentService.MimeType.JSON
    // get the file by sheet name
    const ws = SpreadsheetApp.getActive().getSheetByName(sheetName)
    
    // if sheet name was not found => return an error object 
    if (!ws) return ContentService
        .createTextOutput(JSON.stringify({error: `${sheetName} is invalid.`}))
        .setMimeType(mimeType)
        
    // if sheet name is found => create a JSON object and return it
    // get the values of data range
    const values = ws.getDataRange().getValues()
    
    // initialize the object
    const obj = {}
    // add count property to the object
    obj.count = values.length - 1
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

function fetchData(){
    const url = "https://script.google.com/macros/s/AKfycbzeI0x3BF5YO1Bv43Zkr3Bj5CfmK-UTxtjHQrFDzwwEJ8Qlx2Y/exec?name=users&format=json"
    const response = UrlFetchApp.fetch(url).getContentText()
    console.log(response)
    const json = JSON.parse(response)
    console.log(json)
}
