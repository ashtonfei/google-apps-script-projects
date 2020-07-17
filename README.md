# How to use clasp

### Description
This is a quick guide for you to use [clasp](https://github.com/google/clasp) to clone and deploy my google apps script project on your Google drive.

### Installation
* Install [node](https://nodejs.org/en/).
* Install [clasp](https://github.com/google/clasp).
* Install [git](https://git-scm.com/downloads).

### Quick guide
You have 2 options here, you can choose the one you prefered.

* Option 1 (Clone my project first)
    1. Clone my project form github with Git clone
    ```
    git clone <git repo url>
    ```
    2. Create a new apps script project on your Google drive, and replace the "script id"(1IpfC6QBXRB3XoLGJv7MQHT-q0HHsIFsKiYfki5NbTr9XWhyExQ9yHZP-) in the file .clasp.json. The script id can be found the in the apps script project URL you just created.
    ``` javascript
    {"scriptId":"1IpfC6QBXRB3XoLGJv7MQHT-q0HHsIFsKiYfki5NbTr9XWhyExQ9yHZP-"}
    ```
    3. Login clasp
    ```
    clasp login
    ```
    4. Push your local project to the online apps script project
    ```
    clasp push
    ```
    5. Open the apps script project to validate the result
    ```
    clasp open
    ```
* Option 2 (Create the apps script project first)
    1. Create a new apps script project, the script id will be saved to .clasp.json automatically.
    ```
    clasp create
    ```
    2. Clone my project form github with Git clone
    ```
    git clone <git repo url>
    ```
    3. Login clasp
    ```
    clasp login
    ```
    4. Push your local project to the online apps script project
    ```
    clasp push
    ```
    5. Open the apps script project to validate the result
    ```
    clasp open
    ```

### YouTube
My Playlist about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

