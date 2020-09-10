# GAS-065 Google Form Restriction

### Description
This is a Google Form with a restriction question built with Google form [text validation](https://support.google.com/docs/answer/3378864) and apps script. It uses text validation for the restriction of user input, and uses [onFormSubmit(event trigger)](https://developers.google.com/apps-script/reference/script/form-trigger-builder#onformsubmit) to update the text validation pattern after submission.

### Example 
* Original text validation pattern is "UUID001|UUID002|UUID003|UUID004".
* When "UUID001" is used in a submission the script will update the text validation pattern to "UUID002|UUID003|UUID004" with "UUID001" removed.
* After all valid items are used for submission, the script will create a random string like "asdfasfaslj;lajsdfas90120391230019" as the parttern and update the error message to "no item is available now".

### Demo From
* [Google From](https://docs.google.com/forms/d/e/1FAIpQLSfyealiMqDhlkgmTAz-fg1VfZShI6oGeIX79IDJ6RVFqukUfw/viewform)
* Restriction question title: UUID
* Valid input: UUID001, UUID002, UUID003, UUID004

### Make a copy of the script
[Make a copy](https://docs.google.com/forms/d/18lVqiBDYNeSGcNnBmnwyS-6q_nWm3kMn55CDFH8pmNo/copy)

### If you prefer to use clasp
[GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-259) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Script Type
Google From

### Configurations
In the file app.gs
``` javascript
const TITLE = "UUID" // default title of the restriction question
const DESCRIPTION = "Please enter your UUID" // default description of the restriction question
const ITEMS = ["UUID001", "UUID002", "UUID003", "UUID004"] // default valid items of the restriction question
const ERROR = "Invalid UUID code." // default error message of the restriction question
const EMPTY_MESSAGE = "No item is available now." // default message of the restriction question when there is no valid item left

const KEY_TITLE = "title" // key name for storing restriction question title
const KEY_DESCRIPTION = "description" // key name for storing the restrction question description
const KEY_ITEMS = "items" // key name for storing valid items
const KEY_ERROR = "error" // key name for storing restriction error message
const KEY_EMPTY_MESSAGE = "empty" // key name for storing the empty message
```

### Screenshots
* Form addon functions (open settings and create trigger)
![image](https://user-images.githubusercontent.com/16481229/92741218-f77a4300-f3b0-11ea-846d-cee2373c5a13.png)
* Restriction question settings
![image](https://user-images.githubusercontent.com/16481229/92740463-58ede200-f3b0-11ea-9434-919ac2b0de13.png)
* Restriction question
![image](https://user-images.githubusercontent.com/16481229/92740806-a0746e00-f3b0-11ea-9aee-ea6e0364baf8.png)



### YouTube
* Check on YouTube [GAS-065 Google Form Restriction]()
* More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

