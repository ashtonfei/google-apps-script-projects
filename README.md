# GAS-059 How to Use clasp

### Description
This is a quick guide for you to use [git](https://git-scm.com/downloads) and [clasp](https://github.com/google/clasp) to clone and deploy my google apps script project on your Google drive.

### Installation
* Install [node](https://nodejs.org/en/).
* Install [clasp](https://github.com/google/clasp).
* Install [git](https://git-scm.com/downloads).

### Quick guide
1. Git clone my project or one branch of my project to your local dicrectory.
    * Clone project
    ``` git
    git clone https://github.com/ashtonfei/google-apps-script-projects.git
    ``` 
    * Clone one branch **(-b|--branch)**
    ```git
    git clone -b GAS-058 https://github.com/ashtonfei/google-apps-script-projects.git
    ```
2. Create a new apps script project on your Google drive, and get the script id of your project. You can find the id either in the url or in the project properties.
    ![image](https://user-images.githubusercontent.com/16481229/87847833-8cab0f00-c90d-11ea-84d5-594b5d98655b.png)
3. Replace the script id in the file .clasp.json with yours.
    ``` json
    {"scriptId":"Place your project id here"}
    ```
4. Clasp login and authorization
    * Login
    ```
    clasp login
    ```
    * Sign in
    ![image](https://user-images.githubusercontent.com/16481229/87848211-836f7180-c910-11ea-969b-e55b1b6cbfc8.png)
    * Authroization
    ![image](https://user-images.githubusercontent.com/16481229/87848222-9b46f580-c910-11ea-8f6a-f4d942b50abf.png)
    * Success
    ![image](https://user-images.githubusercontent.com/16481229/87848237-c3365900-c910-11ea-8fe4-5399b3deb4db.png)
5. Push your local project to the online apps script project
    ```
    clasp push
    ```
6. Open the apps script project to validate the result
    ```
    clasp open
    ```
    
### YouTube
My playlist about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)