class ThreadPageView {
  constructor() {
    this.props = PropertiesService.getUserProperties()
  }

  createAddRemoveReminderSection() {
    const addAction = CardService.newAction().setFunctionName("addReminder")
    const addButton = CardService.newTextButton()
      .setText("Add")
      .setOnClickAction(addAction)
      .setBackgroundColor(CONFIGS.colors.primary)

    const removeAction = CardService.newAction().setFunctionName("removeReminder")
    const removeButton = CardService.newTextButton()
      .setText("Remove")
      .setBackgroundColor(CONFIGS.colors.error)

      .setOnClickAction(removeAction)
    const buttonSet = CardService.newButtonSet()
      .addButton(addButton)
      .addButton(removeButton)
    return CardService.newCardSection().addWidget(buttonSet)
  }

  createReminderSection(reminder, index) {
    const time = reminder.runAt
    if (reminder.sent) {
      const datetime = CardService.newDecoratedText()
        .setTopLabel("Sent at")
        .setText(new Date(time).toLocaleString())
      const message = CardService.newDecoratedText()
        .setTopLabel("Message")
        .setText(reminder.message)
      return CardService.newCardSection()
        .addWidget(datetime)
        .addWidget(message)
        .setHeader(`${index + 1}. Reminder [sent]`)
    } else {
      const datetimeInput = CardService.newDateTimePicker()
        .setTitle("Sent at")
        .setFieldName("datetime" + index)
        .setValueInMsSinceEpoch(time)
      const messageInput = CardService.newTextInput()
        .setTitle("Message")
        .setFieldName("message" + index)
        .setMultiline(true)
        .setValue(reminder.message)
      return CardService.newCardSection()
        .addWidget(datetimeInput)
        .addWidget(messageInput)
        // .setCollapsible(true)
        .setHeader(`${index + 1}. Reminder`)
    }
  }

  createThreadSection(thread) {
    const section = CardService.newCardSection()
    // section.setHeader("First message")
    const firstMessage = thread.getMessages()[0]
    const from = firstMessage.getFrom().replace(/</g, "[").replace(/>/g, "]")
    const to = firstMessage.getTo().replace(/</g, "[").replace(/>/g, "]")
    const content = CardService.newTextParagraph()
      .setText(`From: ${from}\nTo: ${to}\nDate: ${firstMessage.getDate().toLocaleString()}`)
    section.addWidget(content)
    return section
  }

  createNewFollowUpCard(threadId, tempReminders = null) {
    const card = CardService.newCardBuilder()
    const thread = GmailApp.getThreadById(threadId)
    const cardHeader = CardService.newCardHeader()
      .setTitle(thread.getFirstMessageSubject())
      .setSubtitle(`Status: Not following`)
      .setImageUrl(CONFIGS.urls.mailImageUrl)
      .setImageAltText("Mail")
    card.setHeader(cardHeader)
    const threadSection = this.createThreadSection(thread)
    card.addSection(threadSection)
    const reminders = tempReminders || this.getDefaultReminders()

    reminders.forEach((reminder, index) => {
      card.addSection(this.createReminderSection(reminder, index))
    })

    // add, remove button set for reminders
    card.addSection(this.createAddRemoveReminderSection())

    const newFollowUpAction = CardService.newAction().setFunctionName("createFollowUp").setParameters({ threadId })
    const newFollowUpButton = CardService.newTextButton()
      .setText("Create Follow Up")
      .setOnClickAction(newFollowUpAction)
    const footer = CardService.newFixedFooter()
      .setPrimaryButton(newFollowUpButton)
    card.setFixedFooter(footer)

    return card.build()
  }

  createFollowUpCard(threadId, reminders) {
    const card = CardService.newCardBuilder()
    const thread = GmailApp.getThreadById(threadId)
    const closedReminders = reminders.filter(item => item.sent)
    const openReminders = reminders.filter(item => !item.sent)

    const cardHeader = CardService.newCardHeader()
      .setTitle(thread.getFirstMessageSubject())
      .setSubtitle(`Status: ${openReminders.length ? "Following" : "Closed"}, Open: ${openReminders.length}, Closed: ${closedReminders.length}`)
      .setImageUrl(openReminders.length ? CONFIGS.urls.openImageUrl : CONFIGS.urls.closedImageUrl)
      .setImageAltText("Mail")
    card.setHeader(cardHeader)

    const threadSection = this.createThreadSection(thread)
    card.addSection(threadSection)

    reminders.forEach((reminder, index) => {
      card.addSection(this.createReminderSection(reminder, index))
    })

    

    const updateFollowUpAction = CardService.newAction()
      .setFunctionName("updateFollowUp")
      .setParameters({ threadId })
    const updateFollowUpButton = CardService.newTextButton()
      .setText("Update")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(updateFollowUpAction)
      .setBackgroundColor(CONFIGS.colors.primary)

    const deleteFollowUpAction = CardService.newAction()
      .setFunctionName("deleteFollowUp")
      .setParameters({ threadId })
    const deleteFollowUpButton = CardService.newTextButton()
      .setText("Delete")
      .setOnClickAction(deleteFollowUpAction)
      .setBackgroundColor(CONFIGS.colors.error)

    const footer = CardService.newFixedFooter()
      .setPrimaryButton(updateFollowUpButton)
    
    if (openReminders.length){
      card.addSection(this.createAddRemoveReminderSection())
      card.setFixedFooter(CardService.newFixedFooter().setPrimaryButton(updateFollowUpButton).setSecondaryButton(deleteFollowUpButton))
    }else{
      card.setFixedFooter(CardService.newFixedFooter().setPrimaryButton(deleteFollowUpButton))
    }
    return card.build()
  }

  createThreadRepliedCard(threadId){
    const thread = GmailApp.getThreadById(threadId)
    const card = CardService.newCardBuilder()
    const header = CardService.newCardHeader()
      .setTitle(thread.getFirstMessageSubject())
      .setSubtitle("Thread was already replied.")
      .setImageUrl(CONFIGS.urls.mailImageUrl)
    card.setHeader(header)

    card.addSection(this.createThreadSection(thread))
    return card.build()
  }

  create(threadId, tempReminders = null) {
    const thread = GmailApp.getThreadById(threadId)
    if (!thread){
      return 
    }
    const isReplied = new App().isThreadReplied(threadId)
    if (isReplied){
      return this.createThreadRepliedCard(threadId)
    }
    let { reminders } = new App().getThreadReminders(threadId)
    if (reminders) {
      reminders = tempReminders || reminders
      this.props.setProperty(CONFIGS.tempRemindersKey, JSON.stringify(reminders))
      return this.createFollowUpCard(threadId, reminders)
    } else {
      const now = new Date().getTime()
      const settings = new SettingsPageView().getSettings()
      reminders = tempReminders || settings.defaultReminders.map(({ runInHours, message }) => ({
        runAt: runInHours * 60 * 60 * 1000 + now,
        message,
        sent: false,
        triggerUid: "",
      }))
      this.props.setProperty(CONFIGS.tempRemindersKey, JSON.stringify(reminders))
      return this.createNewFollowUpCard(threadId, reminders)
    }
  }

  addReminder(e) {
    const threadId = e.gmail.threadId || e.parameters.threadId
    const tempReminders = JSON.parse(this.props.getProperty(CONFIGS.tempRemindersKey))
    tempReminders.push({
      triggerUid: "",
      sent: false,
      runAt: new Date().getTime() + 24 * 60 * 60 * 1000,
      message: "",
    })
    const card = this.create(threadId, tempReminders)
    const nav = CardService.newNavigation().popCard().pushCard(card)
    return CardService.newActionResponseBuilder().setNavigation(nav).build()
  }

  removeReminder(e) {
    const threadId = e.gmail.threadId || e.parameters.threadId
    const tempReminders = JSON.parse(this.props.getProperty(CONFIGS.tempRemindersKey))
    tempReminders.pop()
    const card = this.create(threadId, tempReminders)
    const nav = CardService.newNavigation().popCard().pushCard(card)
    return CardService.newActionResponseBuilder().setNavigation(nav).build()
  }

  getRemindersFromFormInput(formInput) {
    const reminders = JSON.parse(this.props.getProperty(CONFIGS.tempRemindersKey))
    reminders.forEach((_, i)=>{
      if (formInput[`datetime${i}`]){
        reminders[i].runAt = formInput[`datetime${i}`].msSinceEpoch
      }
      if (formInput[`message${i}`]){
        reminders[i].message = formInput[`message${i}`]
      }
    })
    return reminders
  }

  createFollowUp(e, update=false) {
    const threadId = e.gmail.threadId || e.parameters.threadId
    const reminders = this.getRemindersFromFormInput(e.formInput)
    new App().addThreadReminders(threadId, reminders)
    const card = this.create(threadId, reminders)
    const nav = CardService.newNavigation().popCard().pushCard(card)
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(`${update ? "Follow-up has been updated." : "Follow-up has been created."}`))
      .setNavigation(nav)
      .build()
  }

  deleteFollowUp(e) {
    const threadId = e.gmail.threadId || e.parameters.threadId
    new App().deleteThreadReminders(threadId)
    const card = this.create(threadId)
    const nav = CardService.newNavigation().popCard().pushCard(card)
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Follow-up has been deleted."))
      .setNavigation(nav).build()
  }
}

function addReminder(e) {
  return new ThreadPageView().addReminder(e)
}

function removeReminder(e) {
  return new ThreadPageView().removeReminder(e)
}


function createFollowUp(e) {
  return new ThreadPageView().createFollowUp(e)
}

function updateFollowUp(e) {
  return new ThreadPageView().createFollowUp(e, true)
}

function deleteFollowUp(e) {
  return new ThreadPageView().deleteFollowUp(e)
}