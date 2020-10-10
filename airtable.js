class Airtable {
    constructor() {
        const TABLE_NAME = PropertiesService.getScriptProperties().getProperty(KEY_TABLE_NAME)
        const API_KEY = PropertiesService.getScriptProperties().getProperty(KEY_API_KEY)
        const BASE_ID = PropertiesService.getScriptProperties().getProperty(KEY_BASE_ID)
        this.tableName = TABLE_NAME
        this.apiKey = API_KEY
        this.url = "https://api.airtable.com/v0/" + BASE_ID + "/" + TABLE_NAME
    }

    list() {
        let hasOffset
        let items = []
        do {
            let url = this.url
            if (hasOffset) url += "?offset=" + hasOffset

            const response = UrlFetchApp.fetch(url, {
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer " + this.apiKey,
                },
            }).getContentText()
            const { offset, records } = JSON.parse(response)
            hasOffset = offset

            items = [...items, ...records]
        } while (hasOffset)
        return items
    }

    create(records) {
        const response = UrlFetchApp.fetch(this.url, {
            "method": "POST",
            "contentType": "application/json",
            "payload": JSON.stringify({ records }),
            "headers": {
                "Authorization": "Bearer " + this.apiKey,
            },
        }).getContentText()
        return JSON.parse(response)
    }

    update(records) {
        const response = UrlFetchApp.fetch(this.url, {
            "method": "PATCH",
            "contentType": "application/json",
            "payload": JSON.stringify({ records }),
            "headers": {
                "Authorization": "Bearer " + this.apiKey,
            },
        }).getContentText()
        return JSON.parse(response)
    }

    delete(records) {
        const url = this.url + "?records[]=" + records.join("&records[]=")
        const response = UrlFetchApp.fetch(url, {
            "method": "DELETE",
            "headers": {
                "Authorization": "Bearer " + this.apiKey,
            },
        }).getContentText()
        return JSON.parse(response)
    }
}

