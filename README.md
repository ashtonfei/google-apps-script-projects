# GAS-064 Meeting Assistant

### Description
This is a meeting assistant web app built with Google Apps Script, Google CalendarApp API, and Vue Material.

### Demo App
* [Meeting Assistant](https://script.google.com/macros/s/AKfycbx3w8ZW6cV7Oq1X0WI9fhAZMEvY1boovaA7y8UsSxy1CPe7_sI8/exec)
* [Meeting Assistant - Host on Netlify](https://meeting-assistant.netlify.app/)

### Make a copy of the source code from my drive
[Make a copy](https://docs.google.com/spreadsheets/d/13xh5iT7S_Vmu9Lmvq5ILyca7JwwxVex8t81C1OdmZAQ/copy)

### If you prefer to use clasp
[GAS-059 How to use clasp](https://github.com/ashtonfei/google-apps-script-projects/tree/GAS-259) - [Watch on YouTube](https://youtu.be/V-oE2OyvTKM)

### Script Type
Google Sheet

### Configurations
In file gas/main.gs(gas/main.js if you are using clasp with a local IDE)
``` javascript
name: APP_NAME, // app name
scriptTimeZone: Session.getScriptTimeZone(), // your time zone in the project properties
userTimeZone: Session.getScriptTimeZone(), // default time zone of the users
logo: "meeting_room", // logo image url
company: "Ashton Fei", // company name
meetingTime: 30, // default meeting time in minutes
days: 10, // days in the future can be scheduled
offDays: ["SUN", "SAT"], // days off choose form ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
workingHours: [
    {
        start:9, 
        end:11.5,
    },
    {
        start:13, 
        end:16.5,
    },
], // working start to end in 24 hours format
about: `
    <p>Hello Friends,<\/p>
    <p>Do you have any project on Google Apps Script?<br>
    Do you want to schedule a meeting with me?<br>
    Schedule a meeting with this meeting assistant app.<\/p>
    <p><small>
        Powered by Google Apps Script, and Vue Material<br>
        Created by <a href="https://youtube.com/ashtonfei" target="_blank">Ashton Fei<a>
    <\/small><\/p>
`, // paragraphs about your meeting, html tags can be used
```
### Screenshots
* Meeting Assistant Home
![image](https://user-images.githubusercontent.com/16481229/92297777-51c07180-ef75-11ea-8dca-852795812571.png)
* Schedule the event
![image](https://user-images.githubusercontent.com/16481229/92297803-8fbd9580-ef75-11ea-964b-7065b13d0b15.png)


### YouTube
* Check on YouTube [GAS-064 Meeting Assistant](https://youtu.be/RwmFq40Usns)
* More videos about [Google Apps Script](https://www.youtube.com/playlist?list=PLQhwjnEjYj8Bf_EZDrrcmkB9vcB9Sk3x0)

