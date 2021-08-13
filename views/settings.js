class SettingsPageView{
  constructor(){
    this.props = PropertiesService.getUserProperties()
  }

  getSettings(){
    const settings = this.props.getProperty(CONFIGS.settingsKey)
    if (!settings) return CONFIGS.settings
    return JSON.parse(settings)
  }

  createHeader(){
    return CardService.newCardHeader()
      .setTitle("Settings")
      .setImageUrl(CONFIGS.urls.settingsImageUrl)
      .setImageAltText("settings")
  }

  createReminderSection(header, runInHours = "", message = "", index = ""){
    const runInHoursInput = CardService.newTextInput()
      .setFieldName(`runInHours${index}`)
      .setTitle("Run in hours")
      .setValue(runInHours)
    const messageInput = CardService.newTextInput()
      .setFieldName(`message${index}`)
      .setTitle("Message")
      .setMultiline(true)
      .setValue(message)
    return CardService.newCardSection()
      .setHeader(header)
      .addWidget(runInHoursInput)
      .addWidget(messageInput)
  }

  createGeneralSection(deleteAfterCompleted=false, defaultReminderMessage="", label = ""){
    const labeInput = CardService.newTextInput()
      .setFieldName("label")
      .setValue(label)
      .setTitle("Apply label")
    const defaultReminderMessageInput = CardService.newTextInput()
      .setFieldName("defaultReminderMessage")
      .setValue(defaultReminderMessage)
      .setTitle("Default reminder message")
    const deleteAfterCompletedSwith = CardService.newSwitch()
      .setFieldName("deleteAfterCompleted")
      .setSelected(deleteAfterCompleted)
      .setValue("true")
    const deleteAfterCompletedToggle = CardService.newDecoratedText()
      .setText("Yes")
      .setSwitchControl(deleteAfterCompletedSwith)
      .setTopLabel("Delete after completed")
    return CardService.newCardSection()
      .setHeader("General")
      .addWidget(labeInput)
      .addWidget(defaultReminderMessageInput)
      .addWidget(deleteAfterCompletedToggle)
  }

  createControlSection(){
    const addButton = CardService.newTextButton()
    .setText("Add")
    .setOnClickAction(CardService.newAction().setFunctionName("addSettingReminder"))
    const removeButton = CardService.newTextButton()
    .setText("Remove")
    .setOnClickAction(CardService.newAction().setFunctionName("removeSettingReminder"))
    const controls = CardService.newButtonSet()
      .addButton(addButton)
      .addButton(removeButton)
    return CardService.newCardSection()
      .addWidget(controls)
  }

  createFooter(){
    const primaryAction = CardService.newAction().setFunctionName("saveSettings")
    const primaryButton = CardService.newTextButton()
      .setText("Save")
      .setOnClickAction(primaryAction)
      .setBackgroundColor(CONFIGS.colors.primary)
    const secondaryAction = CardService.newAction().setFunctionName("resetSettings")
    const secondaryButton = CardService.newTextButton()
      .setText("Reset")
      .setOnClickAction(secondaryAction)
      .setBackgroundColor(CONFIGS.colors.error)
    return CardService.newFixedFooter()
    .setPrimaryButton(primaryButton)
    .setSecondaryButton(secondaryButton)
  }

  create(tempSettings=null){
    const name = "settings"
    const settings = tempSettings || this.getSettings()
    
    // save settings to temp settings
    this.props.setProperty(CONFIGS.tempSettingKey, JSON.stringify(settings))

    const {defaultReminders, deleteAfterCompleted, defaultReminderMessage, label} = settings

    const card = CardService.newCardBuilder()
    card.setName(name)
    card.setHeader(this.createHeader())
    // general section
    card.addSection(this.createGeneralSection(deleteAfterCompleted, defaultReminderMessage, label))

    // default reminders section
    defaultReminders.forEach(({runInHours, message}, index) => {
      card.addSection(this.createReminderSection(`Default reminder #${index + 1}`, runInHours, message, index))
    })

    // add / remove control section
    card.addSection(this.createControlSection())
    card.setFixedFooter(this.createFooter())
    return card.build()
  }

  addReminder(){
    let tempSettings = this.props.getProperty(CONFIGS.tempSettingKey)
    if (tempSettings){
      tempSettings = JSON.parse(tempSettings)
      tempSettings.defaultReminders.push({
        runInHours: "",
        message: ""
      })
    }
    const card = this.create(tempSettings)
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().popCard().pushCard(card))
      .build()
  }

  removeReminder(){
    let tempSettings = this.props.getProperty(CONFIGS.tempSettingKey)
    if (tempSettings){
      tempSettings = JSON.parse(tempSettings)
      tempSettings.defaultReminders.pop()
    }
    const card = this.create(tempSettings)
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().popCard().push(card))
      .build()
  }

  saveSettings(e){
    const {formInput} = e
    const {label, defaultReminderMessage, deleteAfterCompleted} = formInput

    delete formInput.label
    delete formInput.defaultReminderMessage
    delete formInput.deleteAfterCompleted

    const keys = Object.keys(formInput)
    const count = keys.length / 2
    const defaultReminders = []
    for (let i = 0; i < count; i ++){
      defaultReminders.push({
        runInHours: Number(formInput[`runInHours${i}`]),
        message: formInput[`message${i}`]
      })
    }

    const settings = {
      label,
      defaultReminderMessage,
      deleteAfterCompleted: deleteAfterCompleted ? true : false,
      defaultReminders,
    }
    this.props.setProperty(CONFIGS.settingsKey, JSON.stringify(settings))

    const card = this.create(settings)
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().popCard().pushCard(card))
      .setStateChanged(true)
      .setNotification(CardService.newNotification().setText("Settings have been updated!"))
      .build()
  }

  resetSettings(){
    this.props.deleteProperty(CONFIGS.settingsKey)
    const card = this.create()
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().popCard().pushCard(card))
      .setStateChanged(true)
      .setNotification(CardService.newNotification().setText("Settings have been reset to default!"))
      .build()
  }


}

function addSettingReminder(){
  return new SettingsPageView().addReminder()
}

function removeSettingReminder(){
  return new SettingsPageView().removeReminder()
}

function saveSettings(e){
  return new SettingsPageView().saveSettings(e)
}

function resetSettings(){
  return new SettingsPageView().resetSettings()
}

function getSettings(){
  return new SettingsPageView().getSettings()
}