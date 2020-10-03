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


function handlePostData(data){
    console.log(data)
    return data
}

function postMan(){
    const url = "https://script.google.com/macros/s/AKfycbwS46l9mFcP_Wc5xpdaWLB7vQUfIK6TBc0C6PzbZfZ0hAX4zUmJ/exec?token=" + TOKEN
    
    const data = {
        "message": "This is a test message",
    }
    
    const params = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(data),
    }
    
    const result = UrlFetchApp.fetch(url, params).getContentText()
    console.log(result)
}
