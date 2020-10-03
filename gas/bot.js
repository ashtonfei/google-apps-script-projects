class Bot {
    constructor(token) {
        this.url = "https://api.telegram.org/bot" + token + "/"
    }
    getProp(key){
        return PropertiesService.getScriptProperties().getProperty(key)
    }
    setProp(key, value) {
        PropertiesService.getScriptProperties().setProperty(key, value)
    }
    get(url) {
        try {
            const response = UrlFetchApp.fetch(url)
            return JSON.parse(response.getContentText())
        } catch (e) {
            return { error: e.message }
        }
    }
    replyMessage(chat_id, message_id, message) {
        const url = `${this.url}sendMessage?chat_id=${chat_id}&reply_to_message_id=${message_id}&text=${message}`
        return this.get(url)
    }
}