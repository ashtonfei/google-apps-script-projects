class Bot {
    constructor(token, offset, sheet) {
        this.url = "https://api.telegram.org/bot" + token + "/"
        this.sheet = sheet
        this.offsetKey = "offset"
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
        console.log(url)
        return this.get(url)
    }
    getUpdates(){
        const offset = this.getProp(this.offsetKey)
        let url = `${this.url}getUpdates`
        if (offset) url = `${this.url}getUpdates?offset=${offset}`
        const updates = this.get(url)
        if (!updates.ok) return null
        const result = updates.result
        if (result.length === 0) return null
        const lastUpdate = result[result.length -1]
        this.setProp(this.offsetKey, (lastUpdate.update_id + 1).toString())
        return result
    }
    getCommands(){
        const updates = this.getUpdates()
        if (!updates) return null
        return updates.filter(update => {
            if (!update.channel_post) return false
            return update.channel_post.text.indexOf("/command") === 0
        })
    }
}