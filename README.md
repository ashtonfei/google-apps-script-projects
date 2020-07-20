# GAS-058 Google Form with File Categorization

### Description
This project is used to handle the uploaded files in Google Form with Google Apps Script. If you want to classify or organize the uploaded files automatically, you might be instreseted. You can try the [deom form](https://forms.gle/h8gwa8YfSZy2nhkZ9), and check the result in this [folder](https://drive.google.com/drive/folders/0B9tFtRbfPLIZfkJwU1JvakczNFpVeHlGaXhDOHhzTUZJVDVUUEF5WjlFLURrYzl4NUYwXzA?usp=sharing).

### Apps script type
Google Form

### Features
1. Categorize the uploaded files by the selected folder or entered keyword.
2. Share the uploaded files to the respondent.

### Instruction
1. Setup the form and update the consts in the main.js file if needed.
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
2. Create the trigger if you can see the "addon icon" in the form. Click on the icon, you should be able to see and "App" button, after click it you can use "Create trigger". (Notes, you'll be asked to authorize the app when use it at the first time.)
    ![image](https://user-images.githubusercontent.com/16481229/87755072-dd046d00-c838-11ea-8481-2e681a5ebe1d.png)

### Output
1. Files classified in folders
    ![image](https://user-images.githubusercontent.com/16481229/87748308-184a7000-c828-11ea-9e70-e2deecd98012.png)
2. Files shared with respondent
    ![image](https://user-images.githubusercontent.com/16481229/87755512-b561d480-c839-11ea-8063-0e63a4fbf31e.png)

### YouTube
* [GAS-058 Google Form with File Categorization](https://youtu.be/5gXcSGUYJVA)
* My Playlist about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)
