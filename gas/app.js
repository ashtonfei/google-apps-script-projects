const SPREADSHEET_ID = "1qqVWY03wwQYjzSjGJDMRUlWY1E0VXh1IvBTHlWJdNAo"
const TOKEN = PropertiesService.getScriptProperties().getProperty("token")
const WS = SpreadsheetApp.openById("1qqVWY03wwQYjzSjGJDMRUlWY1E0VXh1IvBTHlWJdNAo").getActiveSheet()
const bot = new Bot(TOKEN, WS)

function handleCommands() {    
    const commands = bot.getCommands()
    if (commands) {
        commands.forEach(command => {
            const chat_id = command.channel_post.chat.id
            const message_id = command.channel_post.message_id
            const text = command.channel_post.text
            const [key, ...props] = text.split(" ")
            switch (key) {
                case "/command1":
                    // append row to spreadsheet
                    const rowContents = props.join(" ").split(",").map(item => item.trim())
                    WS.appendRow(rowContents)
                    console.log({rowContents})
                    bot.replyMessage(chat_id, message_id, "New row added.")
                    break
                case "/command2":
                    console.log(props)
                    break
                case "/command3":
                    console.log(props)
                    break
                case "/command4":
                    console.log(props)
                    break
                default:
                    bot.replyMessage(chat_id, message_id, "Unknown command")
                    console.log("replied")
            }
        })
    }
}
