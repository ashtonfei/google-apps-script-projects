function getAppData(){
    const appData = {
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
        selectedDate: null,
        selectedTime: null,
        submitting: false,
        weekdayNames: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
        monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Oct", "Sep", "Oct", "Nov", "Dec"],
        events: [],
        form: {
            active: false,
            valid: false,
            name: {
                label: "Name",
                value: null,
                valid: null,
                required: true,
                error: "This is a required field",
            },
            email: {
                label: "Email",
                value: null,
                valid: null,
                required: true,
                error: "This is a required field",
            },
            guests: {
                label: "Guests",
                value: [],
                valid: null,
                required: false,
                error: "This is a required field",
            },
            content: {
                label: "Let me know what you'd like to talk about",
                value: null,
                valid: null,
                required: true,
                error: "This is a required field",
            },
        },
        alert: {
            active: false,
            title: "Message",
            message: null,
        },
    }   
    return JSON.stringify(appData)
}

function hasEvent(startTime, endTime){
    startTime = new Date(startTime)
    endTime = new Date(endTime)
    const events = CalendarApp.getEvents(startTime, endTime)
    return events.length > 0
}


function getEvents(date, workingHours,  meetingTime, timeZone = Session.getScriptTimeZone()){
    const scriptTimeZone = Session.getScriptTimeZone()
    const events = []
    const now = new Date()
    workingHours.forEach(({start, end})=>{
        let startHour = Math.floor(start)
        let startMinute = Math.floor((start - startHour) * 60)
        let currentDate = new Date(date)
        currentDate.setHours(startHour)
        currentDate.setMinutes(startMinute)
       
        let endHour = Math.floor(end)
        let endMinute = Math.floor((end - endHour) * 60)
        let endDate = new Date(date)
        endDate.setHours(endHour)
        endDate.setMinutes(endMinute)
        
        while (currentDate < endDate){
            let startDate = currentDate.getTime()
            let endDate = startDate + meetingTime * 60 * 1000
            let hasNoEvent = !hasEvent(startDate, endDate)
            
            let ownerTime = Utilities.formatDate(new Date(startDate), scriptTimeZone, "HH:mm z")
            let userTime = Utilities.formatDate(new Date(startDate), timeZone, "HH:mm z")
            let displayValue = `${userTime} (${ownerTime})`
            
            let ownerTimezoneDetails = Utilities.formatDate(new Date(startDate), scriptTimeZone, "HH:mm zzzz")
            let userTimezoneDetails = Utilities.formatDate(new Date(startDate), timeZone, "HH:mm zzzz")
            let timezoneDetails = `${userTimezoneDetails} (${ownerTimezoneDetails})`
            
            let eventDateTimeDetails = `${Utilities.formatDate(new Date(startDate), timeZone, "HH:mm")} - ${Utilities.formatDate(new Date(endDate), timeZone, "HH:mm zzzz")},
                ${Utilities.formatDate(new Date(startDate), timeZone, "EEEE, MMMM dd, yyyy")}`
            if (currentDate > now) events.push({displayValue, startDate, endDate, hasNoEvent, eventDateTimeDetails, timezoneDetails})
            currentDate = new Date(endDate)
        }
    })
    return JSON.stringify(events)
}

function createEvent(data){
    let {event, name, email, content, guests} = JSON.parse(data)
    
    const hasNoEvent = !hasEvent(event.startDate, event.endDate)
    
    if (hasNoEvent){
        try{
            const startTime = new Date(event.startDate)
            const endTime = new Date(event.endDate)
            const title = `${APP_NAME} - ${name}`
            const options = {
                description: content,
                guests: `${email},${guests}`,
                sendInvites: true,
            }
            CalendarApp.createEvent(title, startTime, endTime, options)
            return "Your meeting has been scheduled successfully."
        }catch(e){
            return `Error: ${e.message}.`
        }
    }else{
        return "Sorry! The time you choose is not available now, please pick another time."
    }
}




















