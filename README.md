# GAS-062 Typeform Style Form

### Description
This is [typeform](http://typeform.com/) style form built with Google Apps Script, Vue Material. One page per question form.

### Demo App
* [Demo App Original](https://script.google.com/macros/s/AKfycby6TaLGN98vnxiWyUozxWpVCSUPRrP_mAvwr3V_SA77StRsvS8b/exec)
* [Demo App - Netlify](https://typeform-style-form.netlify.app)

### Make a copy of the source code from my drive
[Make a copy](https://docs.google.com/spreadsheets/d/1KP9djz0gV6L3cSIcBBKpUo6j5vmj-7vvIfhWfFZRQMA/copy)

### If you prefer to use clasp
* [GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-259) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Script Type
Google Sheet

### Form features
* One page per question
* Maximum form responses
* Form vailaible during a specific date time
* Form validation with REGEX
* Form background images

### Form Configurations
* Maximum responses
    ``` javascript
    maxResponses: 500,
    ```
* Form valid date time
    ``` javascript
    validFrom: new Date(2020, 0, 1, 8, 30, 0), // 2020 Jan 1st 8:30:00 am
    validTo: new Date(2020, 11, 25, 20, 30, 0), // 2020 Dec(11 + 1) 25th 8:30:00 pm
    ```
* From item input
    ``` javascript
        {
            type: "input", // item type
            title: "Full name", // item title
            description: "What's your name please?", // item description
            placeholder: "Your full name", // item input placeholder
            pattern: ".+", // regex pattern for item validation
            modifier: "im", // regex modifier for item validation
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, // item default value
        }
    ```
* Form item radio
    ``` javascript
        {
            type: "radio", // item type
            title: "Gender", // item title
            description: "Your gender please, we'll keep it as a secret.", // item description
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, //  item default value
            options: ["Male", "Female", "Other"], // options for the radio buttons
        }
    ```
* Form item checkbox
    ``` javascript
        {
            type: "checkbox", // item type
            title: "Programming languages", // item title
            description: "Choose your favorite programming languages.", // item description
            min: 2, // minimun selection required
            max: null, // maximum selection allowed
            error: "Choose at least two", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: [], //  item default value, must be an array
            options: ["JavaScript", "Python", "Visual Basic", "C#", "Java", "Lua", "C++"], // options for the radio buttons
        }
    ```
* From item textarea
    ``` javascript
        {
            type: "textarea", // item type
            title: "Comments", // item title
            description: "Any comment about this form", // item description
            placeholder: "enter your comments here", // item input placeholder
            pattern: ".+", // regex pattern for item validation
            modifier: "im", // regex modifier for item validation
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, // item default value
        }
    ```
* Form item date
    ``` javascript
        {
            type: "date", // item type
            title: "Due date", // item title
            description: "Pick a date", // item description
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), // item default value
        }
    ```
* Form item file uploader
    ``` javascript
        {
            type: "file", // item type
            title: "File", // item title
            description: "We need you to upload a file about yourself", // item description
            error: "This is a required question", // item error message
            data: null, // data for uploaded file, keep it null
            required: true, // is item required
            valid: null, // item default valid status
            value: null, // item default value
            maxSize: 5000, // max file size in KB
            fileTypes: "image/*, .pdf", // acceptable file types, null for all file types
        }
    ```
    
### Screenshots
* Start page
    ![image](https://user-images.githubusercontent.com/16481229/90312091-48bf2000-df34-11ea-8e5f-06e44a6a4f20.png)
* Input page
    ![image](https://user-images.githubusercontent.com/16481229/90312102-596f9600-df34-11ea-9990-b25d9e13eeb6.png)
* Radio page
    ![image](https://user-images.githubusercontent.com/16481229/90312126-80c66300-df34-11ea-8195-9cae4cff81c6.png)
* Checkbox page
    ![image](https://user-images.githubusercontent.com/16481229/90312134-920f6f80-df34-11ea-951f-924921adb0ee.png)
* Textarea page
    ![image](https://user-images.githubusercontent.com/16481229/90312146-b8350f80-df34-11ea-9922-50d85c5ef2e8.png)
* Date page
    ![image](https://user-images.githubusercontent.com/16481229/90312175-e87cae00-df34-11ea-8013-e4cbbc0d2fad.png)
* File input page
    ![image](https://user-images.githubusercontent.com/16481229/90312192-ff230500-df34-11ea-80ff-d6a1ee1dad0b.png)
* End page
    ![image](https://user-images.githubusercontent.com/16481229/90312209-119d3e80-df35-11ea-8394-784dca34ecd6.png)

### YouTube
* Check on YouTube [GAS-062 Typeform Style Form](https://youtu.be/6RwjYyfZDBs)
* More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

