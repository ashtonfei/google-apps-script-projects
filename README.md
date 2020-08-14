# GAS-061 Embed Prefilled Form to Gmail

### Description
Embed a prefilled form in Gmail with dynamic content from a spreadsheet.

### Make a copy of the source code from my drive
[Make a copy](https://docs.google.com/spreadsheets/d/1Gb-vIPLiFz_dnAsWM2OqZFQJqOAO4l-rGr1RI6kVUWQ/copy)

### If you prefer to use clasp
* [GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-059) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Script Type
Google Sheet

### Supported Google Form Inputs
* Short answer
* Long answer
* Radio
* Checkbox
* Dropdown
* Scale
* Date
* Time

### Instructions
1. Send a embed form to your Gmail
    ![image](https://user-images.githubusercontent.com/16481229/89705457-25263380-d990-11ea-9743-ebdf16ea8ed3.png)
2. Copy the HTML content of the form in your Gmail
    ![image](https://user-images.githubusercontent.com/16481229/89705610-5d7a4180-d991-11ea-8f92-02cfe000bb4c.png)
3. Paste the code to the file "email.html"
    ![image](https://user-images.githubusercontent.com/16481229/89705763-5869c200-d992-11ea-806f-53d0188fe790.png)
4. Configure the app settings
    * Validate the form with an editable form url
        ![image](https://user-images.githubusercontent.com/16481229/89535618-3bfe4600-d829-11ea-8bda-e0a931384275.png)
    * Create the first reponse if there is no one in the form, make sure all questions are answered
        ![image](https://user-images.githubusercontent.com/16481229/89536072-e8402c80-d829-11ea-9708-071d67f31ec8.png)
    * Create the prefilled content template if the form is valid
        ![image](https://user-images.githubusercontent.com/16481229/89535734-66e89a00-d829-11ea-87af-e5e5b65dd6fb.png)
5. Update the prefilled values in the template
6. Run the function to send the prefilled form

### Screenshots
* Prefilled Content Template
    ![image](https://user-images.githubusercontent.com/16481229/89536284-3e14d480-d82a-11ea-80aa-36efda78c7f4.png)
* Prefilled Form in Gmail
    ![image](https://user-images.githubusercontent.com/16481229/89536514-9946c700-d82a-11ea-8520-f59ce2fe6828.png)

### YouTube
* Check on YouTube [GAS-061 Embed Prefilled Form to Gmail](https://youtu.be/dUGDwNoMHcs)
* More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

