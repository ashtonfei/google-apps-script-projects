const SPREADSHEET_ID = "1qqVWY03wwQYjzSjGJDMRUlWY1E0VXh1IvBTHlWJdNAo"
const TOKEN = PropertiesService.getScriptProperties().getProperty("token")
const WS = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet()
const bot = new Bot(TOKEN)


function handlePostData(data){
    const channel_post = data.channel_post
    if(!channel_post) return {error: "invalid payload", data}
    const chat_id = channel_post.chat.id
    const message_id = channel_post.message_id
    const text = channel_post.text
    if (!text.indexOf("/") === 0) return {error: "invalid command", data}
    const [key, ...props] = text.split(" ")
    switch (key) {
        case "/append_row":
            const rowContents = props.join(" ").split(",").map(item => item.trim())
            WS.appendRow(rowContents)
            bot.replyMessage(chat_id, message_id, "New row added.")
            break
        case "/send_email":
            const [recipient, subject, body] = props.join(" ").split(",").map(item => item.trim())
            try{
                GmailApp.sendEmail(recipient, subject, body)
                bot.replyMessage(chat_id, message_id, "Email has been sent.")
            }catch(e){
                bot.replyMessage(chat_id, message_id, e.message)
            }
            break;
        default:
            bot.replyMessage(chat_id, message_id, "Unknown command")
    }
}


function doPost(e) {
    const token = e.parameter.token
    let result
    if (token === TOKEN) {
        const postData = JSON.parse(e.postData.contents)
        result = handlePostData(postData)
    }else{
        result = {
            success: false,
            error: "Invalid token",
        } 
    }
    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
}