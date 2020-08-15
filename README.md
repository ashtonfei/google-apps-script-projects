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

### Instructions
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
            icon: null, // material icon name (not supported well yet)
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
            icon: null, // material icon name (not supported well yet)
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, //  item default value
            options: ["Male", "Female", "Other"], // options for the radio buttons
        },
    ```
* Form item checkbox
    ``` javascript
        {
            type: "checkbox", // item type
            title: "Programming languages", // item title
            description: "Choose your favorite programming languages.", // item description
            icon: null, // material icon name (not supported well yet)
            min: 2, // minimun selection required
            max: null, // maximum selection allowed
            error: "Choose at least two", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: [], //  item default value, must be an array
            options: ["JavaScript", "Python", "Visual Basic", "C#", "Java", "Lua", "C++"], // options for the radio buttons
        },
    ```
* From item textarea
    ``` javascript
        {
            type: "textarea", // item type
            title: "Comments", // item title
            description: "Any comment about this form", // item description
            icon: null, // material icon name (not supported well yet)
            placeholder: "enter your comments here", // item input placeholder
            pattern: ".+", // regex pattern for item validation
            modifier: "im", // regex modifier for item validation
            error: "This is a required question", // item error message
            required: true, // is item required
            valid: null, // item default valid status
            value: null, // item default value
        }
    ```

### Screenshots
* Start page
    ![image](https://user-images.githubusercontent.com/16481229/90259114-17831900-de7c-11ea-8625-57194ad1354d.png)
* Input page
    ![image](https://user-images.githubusercontent.com/16481229/90259180-2ec20680-de7c-11ea-9f22-b3c836742cb7.png)
* Radio page
    ![image](https://user-images.githubusercontent.com/16481229/90259279-53b67980-de7c-11ea-8d03-d935dcf0ce12.png)
* Checkbox page
    ![image](https://user-images.githubusercontent.com/16481229/90259300-5c0eb480-de7c-11ea-9c92-616a663bc9db.png)
* End page
    ![image](https://user-images.githubusercontent.com/16481229/90259361-734da200-de7c-11ea-9c69-f776ab8d1893.png)

### YouTube
* Check on YouTube [GAS-062 Typeform Style Form](https://youtu.be/dUGDwNoMHcs)
* More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

