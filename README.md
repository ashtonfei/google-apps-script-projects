# GAS-058 Google Form with File Categorization

### Description
This project is used to handle the uploaded files in Google Form with Google Apps Script. If you want to classify or organize the uploaded files automatically, you might be instreseted. You can try the deom form 

### Apps Script Type
Google Form

### Features
1. Categorize the uploaded files by the selected folder or entered keyword.
2. Share the uploaded files to the respondent.

### Instructions
Setup the form and update the consts in the main.js file if needed.
   * Enable email collection if you want to share the uploaded files with the respondent
   ```javascript
   const share_with_respondent = true         // if you want to share the uploaded file to the respondent, make sure email collection is enabled in the form
   ```
   * Create a question named "Folder" for the destination folder of the uploaded files. If you want to pick another name, please remember to change the code in the script.
   ```javascript
   const folder_keyword = "Folder"  // The question title in the form for the folder
   ```
   * Create a file uploader with name "Files"
   ```javascript
   const files_keyword = "Files"    // The question title in the form for the file uploader
   ```
![image](https://user-images.githubusercontent.com/16481229/87748247-f3ee9380-c827-11ea-86a2-b4a0cd0265da.png)

### Output
![image](https://user-images.githubusercontent.com/16481229/87748308-184a7000-c828-11ea-9e70-e2deecd98012.png)

### YouTube
* [GAS-058 Google Form with File Categorization](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)
* My Playlist about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)
