const RESPONSE_SHEET_NAME = "Responses"
const UPLOADS_FOLDER = "Uploads"
const START_IMAGE = "https://images.unsplash.com/photo-1468174578019-d2e029959f4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60"
const END_IMAGE = "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1051&q=80"
const FORM_IMAGES = [
    "https://images.unsplash.com/photo-1498480086004-2400bd8c3663?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1487537177666-94b1f521631a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1431263154979-0982327fccbb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1490291268787-39288ca029c7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1590101490234-780fb118bd84?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60"
]

// App object
const app = {
    name: "Typeform style form with GAS",
    session: "start",
    submitting: false,
}
    
// Form object
const form = {
    valid: null,
    maxResponses: 500,
    validFrom: new Date(2020, 0, 1, 8, 30, 0), // 2020 Jan 1st 8:30:00 am
    validTo: new Date(2020, 11, 25, 20, 30, 0), // 2020 Aug(7 + 1) 1st 8:30:00 pm
    visible: true,
    start: {
        session: "start",
        startButtonName: "Start",
        startButtonIcon: null,
        title: "Typeform Style Form with Google Apps Script",
        subTitle: `
            <p>This is a demo form built with Google Apps Script, Vue Material, and Typeform. 
            The form can be configured to have below features:<br>
            1. Maximun allowed responses<br>
            2. Valid in a date time range<br>
            3. Differece background image for each form question<br>
            4. Form validation with REGEX<\/p>
        `,
        next: 0,
        style: {
            "background-image": `url("${START_IMAGE}")`,
        },
    },
    items: [
        {
            type: "input", // item type
            title: "Full name", // item title
            description: "What's your name please?", // item description
            placeholder: "Your full name", // item input placeholder
            pattern: ".+", // regex pattern for item validation
            modifier: "gim", // regex modifier for item validation
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, // item default value
        },
        {
            type: "input",
            title: "Email",
            description: "We'll need your email for sending you a copy of this submission.",
            placeholder: "Your email address",
            pattern: "[a-z0-9_\\.]+@[a-z0-9_\\.]+", // regex pattern
            modifier: "gm", // regex modifier
            error: "Invaid email addess, choose letters from [a-z0-1_.]",
            required: true,
            valid: null,
            value: null,
        },
        {
            type: "radio", // item type
            title: "Gender", // item title
            description: "Your gender please, we'll keep it as a secret.", // item description
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, //  item default value
            options: ["Male", "Female", "Other"], // options for the radio buttons
        },
        {
            type: "checkbox", // item type
            title: "Programming languages", // item title
            description: "Choose your favorite programming languages.", // item description
            min: 2, // minimun selection required
            max: null, // maximum selection allowed
            error: "Choose at least two", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: [], //  item default value, must be an array
            options: ["JavaScript", "Python", "Visual Basic", "C#", "Java", "Lua", "C++"], // options for the radio buttons
        },
        {
            type: "textarea", // item type
            title: "Comments", // item title
            description: "Any comment about this form", // item description
            placeholder: "enter your comments here", // item input placeholder
            pattern: ".+", // regex pattern for item validation
            modifier: "gm", // regex modifier for item validation
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, // item default value
        },
        {
            type: "date", // item type
            title: "Due date", // item title
            description: "Pick a date", // item description
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), // item default value
        },
        {
            type: "file", // item type
            title: "File", // item title
            description: "We need you to upload a file about yourself", // item description
            error: "This is a required question", // item error message
            data: null, // data for uploaded file, keep it null
            required: true, // is item required
            valid: null, // item default valid status
            value: null, // item default value
            maxSize: 5000, // max file size in KB
            fileTypes: "image/*, .pdf", // accept file types, null for all file types
        }
    ],
    end: {
        session: "end",
        title: "Confirmation Message",
        message: null,
        endButtonName: "Go back to start",
        endButtonIcon: null,
        style: {
            "background-image": `url("${END_IMAGE}")`,
        },
    }
}

// Vue Data object
const data = {
    app,
    form,
}
    
function getAppData(){
    data.form.items.forEach((item, i)=>{
        let url = FORM_IMAGES[i]
        if (url){
            item.style = {
                "background-image": `url("${FORM_IMAGES[i]}")`,
            }
        }else{
            item.style = {
                "background-image": `url("${START_IMAGE}")`,
            }
        }
    })

    const now = new Date()
    const validFrom =  form.validFrom || now
    const validTo = form.validTo || now
    if (now < validFrom || now > validTo){
        form.visible = false
    }else{
        form.visible = true
    }
    return JSON.stringify(data)
}

function createFile({name, data}){
    const id = SpreadsheetApp.getActive().getId()
    const parentFolder = DriveApp.getFileById(id).getParents().next()
    let folder
    const folders = parentFolder.getFoldersByName(UPLOADS_FOLDER)
    if (folders.hasNext()) {
        folder = folders.next()
    }else{
        folder = parentFolder.createFolder(UPLOADS_FOLDER)
    }
    
    let [contentType, dataBytes] = data.split(";base64,")
    contentType = contentType.replace("data:", "")
    dataBytes = Utilities.base64Decode(dataBytes)
    const blob = Utilities.newBlob(dataBytes, contentType, name)
    const file = folder.createFile(blob)
    return file.getUrl()
}

function saveDataToSheet(data){
    const ss = SpreadsheetApp.getActive()
    let ws = ss.getSheetByName(RESPONSE_SHEET_NAME)
    if (!ws) ws = ss.insertSheet(RESPONSE_SHEET_NAME)
    
    const counts = ws.getDataRange().getValues().length - 1
    
    const now = new Date()
    const validFrom =  form.validFrom || now
    const validTo = form.validTo || now
    
    if (now < validFrom || now > validTo) return `<p>Sorry, the form is currently unavailable.<\/p>`
    
    if (counts >= form.maxResponses && form.maxResponses) return `<p>Sorry, you've reached the maximun allowed responses.<\/p>`
   
    let {values, headers} = JSON.parse(data)

    values.forEach((value, i)=>{
        if (value.data){
            values[i] = createFile(value)
        }
    })

    const uuid = Utilities.getUuid()
    headers = ["Timestamp", ...headers, "UUID"]
    values = [now, ...values, uuid]
    ws.getRange(1, 1, 1, headers.length).setValues([headers])
    ws.appendRow(values)
    const message = `<p>Thanks for you submission, here is your unique id <b>${uuid}<\/b> of the submisssion.<\/p>`
    return message
}
    