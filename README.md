# How to use clasp

### Description
This is a quick guide for you to use [git](https://git-scm.com/downloads) and [clasp](https://github.com/google/clasp) to clone and deploy my google apps script project on your Google drive.

### Installation
* Install [node](https://nodejs.org/en/).
* Install [clasp](https://github.com/google/clasp).
* Install [git](https://git-scm.com/downloads).

### Quick guide
1. Git clone my project or one branch of my project to your local dicrectory.
    * Command in terminal, clone project
    ``` git
    git clone https://github.com/ashtonfei/google-apps-script-projects.git
    ``` 
    * Command in terminal, clone one branch **(-b|--branch)**
    ```git
    git clone -b GAS-058 https://github.com/ashtonfei/google-apps-script-projects.git
    ```
2. Create a new apps script project on your Google drive, and get the script id of your project. You can find the id either in the url or in the project properties.
    ![image](https://user-images.githubusercontent.com/16481229/87847833-8cab0f00-c90d-11ea-84d5-594b5d98655b.png)
3. Replace the script id in the file .clasp.json with yours.
    ``` json
    {"scriptId":"Place your project id here"}
    ```
4. Login clasp
    * Command in terminal
    ```
    clasp login
    ```
    * Sign in
    ![image](https://user-images.githubusercontent.com/16481229/87847929-51f5a680-c90e-11ea-92d5-0003b92f372c.png)
    * Authroization
    ![image](https://user-images.githubusercontent.com/16481229/87847942-718ccf00-c90e-11ea-9e70-07152beed0ca.png)
    * Success
    ![image](https://user-images.githubusercontent.com/16481229/87847959-a39e3100-c90e-11ea-94f5-e67ae6ab8707.png)
5. Push your local project to the online apps script project
    * Command in terminal
    ```
    clasp push
    ```
6. Open the apps script project to validate the result
    * Command in terminal
    ```
    clasp open
    ```

### YouTube
My playlist about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

