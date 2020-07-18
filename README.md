# How to use clasp

### Description
This is a quick guide for you to use [clasp](https://github.com/google/clasp) to clone and deploy my google apps script project on your Google drive.

### Installation
* Install [node](https://nodejs.org/en/).
* Install [clasp](https://github.com/google/clasp).
* Install [git](https://git-scm.com/downloads).

### Quick guide
1. Git clone my project or one branch from my porject to your local dicrectory
    * Clone project
    ``` git
    git clone https://github.com/ashtonfei/google-apps-script-projects.git
    ``` 
    * Clone one branch
    ```git
    git clone -b GAS-058 https://github.com/ashtonfei/google-apps-script-projects.git
    ```

2. Create a new apps script project on your Google drive, and replace the "script id"(e.g. 1IpfC6QBXRB3XoLGJv7MQHT-q0HHsIFsKiYfki5NbTr9XWhyExQ9yHZP-) in the file .clasp.json. The script id can be found the in the apps script project URL you just created.
``` json
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

### YouTube
My playlist about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

