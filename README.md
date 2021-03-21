# GAS-078 Mail Merge Google Sheet

### Description

A mail merge application with data in a google sheet.

### Make a copy of the script

[Make a copy](https://docs.google.com/spreadsheets/d/1cWfIfMAIbmx5F8J8_3H6tHATqcDqMrv4oJVtllhIJyI/copy)

### If you prefer to use clasp

[GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-259) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Script Type

Google Sheet

### Configuration

```javascirpt
const APP_NAME = "📬 Mail Merge" // app name and title name
const APP_NAME_ERROR = "🔴 Mail Merge" // title name when there is an error
const APP_NAME_GOOD = "🟢 Mail Merge" // title name when there is no error

const SN_BODY = "Email Body" // sheet name of the email body template
const SN_SETTINGS = "Email Settings" // sheet name of the email settings
const TIS_TOAST = 20 // time in seconds for the toast message
const FONT_SIZE_SCALE = 1.3 // font size scale (actual font size in email = size in sheet * FONT_SIZE_SCALE)

const BORDER_STYLES = {
  default: "1px solid",
  DOTTED: "1px dotted",
  DASHED: "1px dashed",
  SOLID: "1px solid",
  SOLID_MEDIUM: "2px solid",
  SOLID_THICK: "3px solid",
  DOUBLE: "3px double"
}
```

### Screenshots

Email settings
![image](https://user-images.githubusercontent.com/16481229/111897065-b4341780-8a58-11eb-9061-a2b6445b7a73.png)
Email body
![image](https://user-images.githubusercontent.com/16481229/111897096-df1e6b80-8a58-11eb-9acd-97836c254cdd.png)
Email
![image](https://user-images.githubusercontent.com/16481229/111900044-31688800-8a6b-11eb-8eae-35ff39fd3631.png)

### YouTube

- Check on YouTube [GAS-078 Mail Merge Google Sheet](https://youtu.be/C5Wv3zI2RF4)
- More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)
