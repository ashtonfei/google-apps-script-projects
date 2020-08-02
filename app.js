const OVER_HOURS = 24 // {integer} hours of email you didn't reply 
const NEWER_THAN_DAYS = 30 // {integer} days of email recieved in the past
const NO_REPLY_LABEL_NAME = "NoReply"  // {string} label name to be applied to no reply emails
const QUERY = "in:inbox" // {string} limit the search result with query string
const GMAIL_SEARCH_OPERATOR_URL = "https://support.google.com/mail/answer/7190?hl=en"
const MAX = 100 // {integer} max search result
const SEND_NOTIFICATION = true // send yourself an email notification with a list of no reply emails


function addNoReplyLabel(){    
    const query = `${QUERY} newer_than:${NEWER_THAN_DAYS}d`
    let start = 0
    let threads = []
    const noReplyEmails = []
    const now = new Date()
    const activeUser = Session.getActiveUser().getEmail()
    const labelNoReply = getLabelByName(NO_REPLY_LABEL_NAME)
    
    removeNoReplyLabel()
    
    do {
        threads = GmailApp.search(query, start, MAX)
        threads.forEach(thread=>{
            // thread = threads[0]
            const lastMessage = thread.getMessages().pop()
            
            // check if the last message of the thread is over hours in the app settings
            const date = lastMessage.getDate()
            const isOverHours = (now - date) > OVER_HOURS * 60 * 60 * 1000
            
            // check if the last message is from the active user
            const from = lastMessage.getFrom()
            const isFromOthers = from.indexOf(activeUser) === -1
            
            // mark the thread is no reply if last message is over hours and is not from the active user
            if (isOverHours && isFromOthers){
                // push the thread to no reply email array
                noReplyEmails.push(thread)
                
                // apply no reply label to the thread
                thread.addLabel(labelNoReply)
            }
            
        })
        start += MAX
    }while(threads.length === MAX)
    console.log(noReplyEmails.length)
    if(SEND_NOTIFICATION && noReplyEmails.length){
        sendNotification(activeUser, noReplyEmails)
    }
}


function removeNoReplyLabel(){
    const query = `label:${NO_REPLY_LABEL_NAME}`
    let start = 0
    let threads = []
    const noReplyEmails = []
    const now = new Date()
    const activeUser = Session.getActiveUser().getEmail()
    const labelNoReply = getLabelByName(NO_REPLY_LABEL_NAME)

    do {
        threads = GmailApp.search(query, start, MAX)
        threads.forEach(thread => {
            // thread = threads[0]
            const lastMessage = thread.getMessages().pop()
            
            // check if the last message is from the active user
            const from = lastMessage.getFrom()
            const isFromActiveUser = from.indexOf(activeUser) !== -1
            if (isFromActiveUser) thread.removeLabel(labelNoReply)
            
        })
    }while(threads.length === MAX)
}


function getLabelByName(labelName){
    let label = GmailApp.getUserLabelByName(labelName)
    if (!label) label = GmailApp.createLabel(labelName)
    return label
}


function createHtmlTabel(noReplyEmails){
    let html = `<p><table style="width: 100%; border-collapse: collapse;">
        <tr>
            <th style="border-bottom: 1px solid #111;">No.<\/th>
            <th style="border-bottom: 1px solid #111;">Subject<\/th>
            <th style="border-bottom: 1px solid #111;">Date<\/th>
        <\/tr>`
    noReplyEmails.forEach((thread, i) =>{
        const lastMessage = thread.getMessages().pop()
        const subject = lastMessage.getSubject()
        const date = Utilities.formatDate(lastMessage.getDate(), Session.getScriptTimeZone(), "dd/MMM/YYYY hh:mm:ss")
        const from = lastMessage.getFrom()
        const htmlRow = `<tr>
            <td style="border-bottom: 1px solid #111;">${i + 1}<\/td>
            <td style="border-bottom: 1px solid #111;">${subject}<\/td>
            <td style="border-bottom: 1px solid #111;">${date}<\/td>
        <\/tr>`
        html += htmlRow
    })
    html += "<\/table><\/p>"
    return html
}

function sendNotification(activeUser, noReplyEmails){
    try {
        const daytime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MMM/YYYY hh:mm:ss")
        const subject = `No Reply Emails Checked at ${daytime}`
        const body = ""
        const options = {}
        const htmlTable = createHtmlTabel(noReplyEmails)
        options.htmlBody = `
            <p>You have <b>${noReplyEmails.length}<\/b> no-rely emails, please go and check them in the label: <b>${NO_REPLY_LABEL_NAME}<\/b>.<br>
            Checked at ${daytime}.<\/p>
            ${htmlTable}
            <p>Created by Ashton Fei<br>
            Powered by <a href="https://developers.google.com/apps-script">Google Apps Script<\/a><br>
            More videos on <a href="https://youtube.com/ashtonfei/">YouTube<\/a><br>
            Check the source code here on <a href="https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-060">Github<\/a><\/p>`
        GmailApp.sendEmail(activeUser, subject, body, options)
    }catch(e){
        // pass
        console.log(e.message)
    }
}


function createTriggers(){
    // delete triggers
    const triggers = ScriptApp.getProjectTriggers()
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger))
    
    // add a new trigger to add no reply label to emails meet your condition in the setup
    ScriptApp.newTrigger("addNoReplyLabel")
        .timeBased()
        .everyDays(1)
        .atHour(9)
        .create()
   
   // add a new trigger to remove no reply label for the replied emails
    ScriptApp.newTrigger("removeNoReplyLabel")
        .timeBased()
        .everyHours(1)
        .create()
}