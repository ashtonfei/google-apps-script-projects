const RESPONSE_SHEET_NAME = "Responses"
const START_IMAGE = "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1051&q=80"
const END_IMAGE = "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1051&q=80"
const FORM_IMAGES = [
    "https://images.unsplash.com/photo-1508717146309-25a0019d0381?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1520763185298-1b434c919102?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
    "https://images.unsplash.com/photo-1431263154979-0982327fccbb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1590101490234-780fb118bd84?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1590794244624-676c7cd5e1b4?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
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
            "background-image": `url("${START_IMAGE}")`
        },
    },
    items: [
        {
            type: "input",
            title: "Full name",
            description: "What's your name please?",
            icon: null,
            placeholder: "Your full name",
            pattern: ".+", // regex pattern
            modifier: "im", // regex modifier
            error: "This is a required question",
            required: true,
            valid: null,
            value: null,
        },
        {
            type: "input",
            title: "Email",
            description: "We'll need your email for sending you a copy of this submission.",
            icon: null,
            placeholder: "Your email address",
            pattern: ".+", // regex pattern
            modifier: "im", // regex modifier
            error: "This is a required question",
            required: true,
            valid: null,
            value: null,
        },
        {
            type: "radio",
            title: "Gender",
            description: "Your gender please, we'll keep it as a secret.",
            icon: null,
            error: "This is a required question",
            required: true,
            valid: null,
            value: null,
            options: ["Male", "Female", "Other"],
        },
        {
            type: "checkbox",
            title: "Programming languages",
            description: "Choose your favorite programming languages.",
            icon: null,
            min: 2,
            max: null,
            error: "Choose at least two",
            required: true,
            valid: null,
            value: [],
            options: ["JavaScript", "Python", "Visual Basic", "C#", "Java", "Lua", "C++"],
        },
    ],
    end: {
        session: "end",
        title: "Confirmation Message",
        message: null,
        endButtonName: "Go back to start",
        endButtonIcon: null,
        style: {
            "background-image": `url("${END_IMAGE}")`
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
                "background-image": `url("${FORM_IMAGES[i]}")`
            }
        }else{
            item.style = {
                "background-image": `url("${START_IMAGE}")`
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
    const uuid = Utilities.getUuid()
    headers = ["Timestamp", ...headers, "UUID"]
    values = [now, ...values, uuid]
    ws.getRange(1, 1, 1, headers.length).setValues([headers])
    ws.appendRow(values)
    const message = `<p>Thanks for you submission, here is your unique id <b>${uuid}<\/b> of the submisssion.<\/p>`
    return message
}
    