# GAS-060 No Reply Emails

### Description
Get the emails that you didn't rely in a specific time(like in the past 48 hours) in Gmail.

### How to use my projects with clasp
* [GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-059) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Make a copy of the source code from my drive
[Make a copy](https://script.google.com/d/1Tsn__jf1XFpfOjT_PmJxejAEjqrP60dtwJhYLJk-JBz0ZuiKbugjZ_dL/copy)

### Script Type
Standalone


### Settings
```javascript
const OVER_HOURS = 24 // {integer} hours of email you didn't reply 
const NEWER_THAN_DAYS = 30 // {integer} days of email recieved in the past
const NO_REPLY_LABEL_NAME = "NoReply"  // {string} label name to be applied to no reply emails
const QUERY = "in:inbox" // {string} limit the search result with query string
const GMAIL_SEARCH_OPERATOR_URL = "https://support.google.com/mail/answer/7190?hl=en"
const MAX = 100 // {integer} max search result
const SEND_NOTIFICATION = true // send yourself an email notification with a list of no reply emails
```
Read [Gmail search operators](https://support.google.com/mail/answer/7190?hl=en) if you don't know how to write a Gmail search query for the const QUERY.

### Screenshots
* Email notification
    ![image](https://user-images.githubusercontent.com/16481229/89123831-f37f1980-d504-11ea-8c4b-7c0416bb6293.png)


### YouTube
More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

