const CONFIG = {
  APP_NAME: "🍕 Reservation",
  CALENDAR_NAME: "Booking",
  CALENDAR_COLOR: '#EAAA47',
  EVENT_COLOR: {
    OPEN: CalendarApp.EventColor.GREEN,
    FULL: CalendarApp.EventColor.GRAY,
  },
  DAYS_START: 0,
  DAYS_END: 7,
  TITLE: {
    EMAIL: "Email",
    RESERVATION: "Reservation",
  },
  NO_RESERVATIONS: "Sorry, no reservations!"
}

class App {
  constructor() {
    this.name = CONFIG.APP_NAME
    this.form = FormApp.getActiveForm()
    this.calendar = null
    this.startDate = null
    this.endDate = null
    this.timezone = Session.getScriptTimeZone()
  }

  setCalendar_() {
    const name = CONFIG.CALENDAR_NAME
    const calendars = CalendarApp.getCalendarsByName(name)
    if (calendars.length) {
      this.calendar = calendars[0]
    } else {
      this.calendar = CalendarApp.createCalendar(name)
    }
    this.calendar.setColor(CONFIG.CALENDAR_COLOR)
    return this
  }

  setDates_() {
    const today = new Date()
    const dayInMilliseconds = 24 * 60 * 60 * 1000
    this.startDate = new Date(today.getTime() + CONFIG.DAYS_START * dayInMilliseconds)
    this.endDate = new Date(today.getTime() + CONFIG.DAYS_END * dayInMilliseconds)
    return this
  }

  getEvents_() {
    return this.calendar.getEvents(this.startDate, this.endDate)
  }

  getReservations_() {
    const events = this.getEvents_()
    const reservations = []
    events.filter(event => {
      const title = event.getTitle()
      const match = title.match(/\((\d+)\/(\d+)\)/)
      if (!match) return
      const [_, count, max] = match
      if (count * 1 < max * 1) {
        const startTime = Utilities.formatDate(event.getStartTime(), this.timezone, "EEE dd/MMM hh:mm")
        const endTime = Utilities.formatDate(event.getEndTime(), this.timezone, 'hh:mm')
        const slot = `[${startTime} to ${endTime}]`
        reservations.push(`${title.replace(/\((\d+)\/(\d+)\)/, slot)} (${count}/${max})`)
      }
    })
    return reservations
  }

  updateReservations_() {
    const options = this.getReservations_()
    if (options.length === 0) {
      options.push(CONFIG.NO_RESERVATIONS)
    }
    const item = this.form.getItems().find(item => item.getTitle() === CONFIG.TITLE.RESERVATION)
    if (!item) return
    switch (item.getType()) {
      case FormApp.ItemType.MULTIPLE_CHOICE:
        item.asMultipleChoiceItem().setChoiceValues(options)
        break
      case FormApp.ItemType.LIST:
        item.asListItem().setChoiceValues(options)
        break
    }
  }

  /**
   * @param {FormApp.FormResponse} response
   */
  updateEvent_(response){
    const reservationItem = response.getItemResponses().find(v => v.getItem().getTitle() === CONFIG.TITLE.RESERVATION)
    const emailItem = response.getItemResponses().find(v => v.getItem().getTitle() === CONFIG.TITLE.EMAIL)
    const reservation = reservationItem.getResponse()
    const email = emailItem.getResponse().toString().trim().toLocaleLowerCase()
    if (!email || !reservation) return
    const events = this.getEvents_()
    const title = reservation.replace(/\s*\[.+\]\s*/, " ")
    const event = events.find(v => v.getTitle() === title)
    if (!event) return
    const guestEmails = event.getGuestList(true).map(g => g.getEmail())
    if (guestEmails.includes(email)) return
    event.addGuest(email)
    const [_, count, max] = title.match(/\((\d+)\/(\d+)\)/)
    const newTitle = title.replace(/\((\d+)\/(\d+)\)/, `(${count * 1 + 1}/${max})`)
    event.setTitle(newTitle)
    
    const description = event.getDescription()
    const newDescription = `${description}
      ${new Date().toLocaleString()}: booked by ${email}
    `
    event.setDescription(newDescription)
    if (count * 1 + 1 == max) {
      event.setColor(CONFIG.EVENT_COLOR.FULL)
    } else {
      event.setColor(CONFIG.EVENT_COLOR.OPEN)
    }
  }

  onSubmit(e) {
    this.setCalendar_().setDates_()
    this.updateEvent_(e.response)
    this.updateReservations_()
  }

  updateReservations(){
    this.setCalendar_().setDates_()
    this.updateReservations_()
  }

  onCalendarChange(e){
    const {calendarId} = e
    console.log(calendarId)
    this.updateReservations()
  }

  onFormOpen(){
    this.updateReservations()
  }

  onOpen(){
    const menu = FormApp.getUi().createMenu(this.name)
    menu.addItem("🍕 Update reservations", "updateReservations")
    menu.addItem("✅ Create triggers", "createTriggers")
    menu.addItem("❎ Delete triggers", "deleteTriggers")
    menu.addToUi()
  }

  deleteTriggers(){
    const title = "Delete Triggers"
    const ui = FormApp.getUi()
    const confirm = ui.alert(title, 'Are you sure to delete all triggers?', ui.ButtonSet.YES_NO)
    if (confirm !== ui.Button.YES) return ui.alert(title, "Cancelled!", ui.ButtonSet.OK)
    const triggers = ScriptApp.getScriptTriggers()
    triggers.forEach(trigger => {
      const functionName = trigger.getHandlerFunction()
      if (functionName === "onCalendarChange" || functionName === "onFormOpen" || functionName === "onSubmit" || functionName === "updateReservations") {
        ScriptApp.deleteTrigger(trigger)
      }
    })
    ui.alert(title, "Triggers have been deleted successfully!", ui.ButtonSet.OK)
  }

  createCalendarChangeTrigger(){
    CalendarApp.getAllOwnedCalendars().forEach(c => {
      if (c.getName() === CONFIG.CALENDAR_NAME) {
        ScriptApp.newTrigger("onCalendarChange").forUserCalendar(c.getId()).onEventUpdated().create()
      }
    })
  }

  createTriggers(){
    const title = "Create Triggers"
    const ui = FormApp.getUi()
    const confirm = ui.alert(title, 'Are you sure to create triggers to update reservation when calendar changes, form submits?', ui.ButtonSet.YES_NO)
    if (confirm !== ui.Button.YES) return ui.alert(title, "Cancelled!", ui.ButtonSet.OK)
    const triggers = ScriptApp.getScriptTriggers()
    triggers.forEach(trigger => {
      const functionName = trigger.getHandlerFunction()
      if (functionName === "onCalendarChange" || functionName === "onFormOpen" || functionName === "onSubmit" || functionName === "updateReservations") {
        ScriptApp.deleteTrigger(trigger)
      }
    })
    this.createCalendarChangeTrigger()
    ScriptApp.newTrigger("onFormOpen")
      .forForm(this.form)
      .onOpen()
      .create()

    ScriptApp.newTrigger("onSubmit")
      .forForm(this.form)
      .onFormSubmit()
      .create()
    
    ScriptApp.newTrigger("updateReservations").timeBased()
      .everyMinutes(30)
      .create()
    
    ui.alert(title, "Triggers have been created successfully!", ui.ButtonSet.OK)
  }
}

const onOpen = () => new App().onOpen()
const onSubmit = e => new App().onSubmit(e)
const onFormOpen = () => new App().onFormOpen()
const onCalendarChange = (e) => new App().onCalendarChange(e)
const updateReservations = () => new App().updateReservations()
const createTriggers = () => new App().createTriggers()
const deleteTriggers = () => new App().deleteTriggers()