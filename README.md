# GAS-060 No Reply Emails

### Description
Apply an Gmail label to the emails that you didn't rely in a specific time(e.g. in the past 24 hours) in Gmail, and remove the label is the email is replied.

### Make a copy of the source code from my drive
[Make a copy](https://script.google.com/d/1Tsn__jf1XFpfOjT_PmJxejAEjqrP60dtwJhYLJk-JBz0ZuiKbugjZ_dL/copy)

### If you prefer to use clasp
* [GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-059) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Script Type
Standalone

### Instructions
* Settings
    ```javascript
    const OVER_HOURS = 24 // {integer} hours of email you didn't reply 
    const NEWER_THAN_DAYS = 30 // {integer} days of email recieved in the past
    const NO_REPLY_LABEL_NAME = "NoReply"  // {string} label name to be applied to no reply emails
    const QUERY = "in:inbox" // {string} limit the search result with query string
    const MAX = 100 // {integer} max search result
    const SEND_NOTIFICATION = true // {boolean} send yourself an email notification with a list of no-reply emails
    ```
    Read [Gmail search operators](https://support.google.com/mail/answer/7190?hl=en) if you don't know how to write a Gmail search query for the const QUERY.
* Create triggers
    Option 1. Create the triggers by running the function "createTriggers".
    Option 2. create the triggers manually, read this [doc](https://developers.google.com/apps-script/guides/triggers/installable#managing_triggers_manually) if you don't know how to create it.
    ![image](https://user-images.githubusercontent.com/16481229/89124497-f9c3c480-d509-11ea-8a4e-d84e7dc52006.png)


### Screenshots
* Settings
    ![image](https://user-images.githubusercontent.com/16481229/89124350-f24feb80-d508-11ea-91bd-d261f9dc387a.png)
* Triggers
    ![image](https://user-images.githubusercontent.com/16481229/89124332-c9c7f180-d508-11ea-86c4-3c63fe878bc6.png)
* Email notification
    ![image](https://user-images.githubusercontent.com/16481229/89123831-f37f1980-d504-11ea-8c4b-7c0416bb6293.png)


### YouTube
More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

