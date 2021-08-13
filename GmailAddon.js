const CONFIGS = {
  triggerFunctionName: "checkGmailThread",
  settings: {
    defaultReminders: [
      { runInHours: 24 * 3, message: "This is a reminder!" },
    ],
    deleteAfterCompleted: false,
    defaultReminderMessage: "This is a reminder!",
    label: "Following",
  },
  settingsKey: "settings",
  tempSettingKey: "tempSettings",
  tempRemindersKey: "tempReminders",
  keyPrefixes: {
    threadId: "threadId",
    triggerUid: "triggerUid",
  },
  urls: {
    settingsImageUrl: "https://image.flaticon.com/icons/png/512/2099/2099058.png",
    mailImageUrl: "https://image.flaticon.com/icons/png/512/893/893292.png",
    youtubeImageUrl: "https://image.flaticon.com/icons/png/512/2190/2190466.png",
    githubImageUrl: "https://image.flaticon.com/icons/png/512/25/25471.png",
    followupImageUrl: "https://image.flaticon.com/icons/png/512/1792/1792931.png",
    closedImageUrl: "https://image.flaticon.com/icons/png/512/845/845646.png",
    openImageUrl: "https://image.flaticon.com/icons/png/512/2838/2838676.png",
    cancelledImageUrl: "https://image.flaticon.com/icons/png/512/3472/3472620.png",
  },
  colors: {
    primary: "#4285F4",
    error: "#EA4335",
    warning: "#FBBC04",
    success: "#34A853"
  }
}

class App {
  constructor() {
    this.props = PropertiesService.getUserProperties()
    this.keyPrefixes = CONFIGS.keyPrefixes
    this.functionName = CONFIGS.triggerFunctionName
  }

  getLabel(name) {
    const label = GmailApp.getUserLabelByName(name)
    if (label) return label
    return GmailApp.createLabel(name)
  }

  applyLabel(labelName, threadId) {
    if (!labelName.trim()) return
    const thread = GmailApp.getThreadById(threadId)
    if (!thread) return
    const label = this.getLabel(labelName)
    thread.addLabel(label)
  }

  removeLabel(labelName, threadId) {
    if (!labelName.trim()) return
    const thread = GmailApp.getThreadById(threadId)
    if (!thread) return
    const label = this.getLabel(labelName)
    thread.removeLabel(label)
  }

  addThreadReminders(threadId, reminders) {
    this.deleteThreadReminders(threadId)
    const key = `${this.keyPrefixes.threadId}${threadId}`
    reminders.forEach((reminder, index) => {
      if (!reminder.sent) {
        const triggerUid = this.addTrigger(threadId, reminder.runAt)
        reminders[index].triggerUid = triggerUid
      }
    })
    this.props.setProperty(key, JSON.stringify({ reminders, created: new Date() }))

    const { label } = new SettingsPageView().getSettings()
    this.applyLabel(label, threadId)

    return reminders
  }

  deleteThreadReminders(threadId) {
    const { label } = new SettingsPageView().getSettings()
    this.removeLabel(label, threadId)

    // delete triggers
    const { reminders } = this.getThreadReminders(threadId)
    if (!reminders) return

    const triggerUids = reminders.map(reminder => reminder.triggerUid)
    this.deleteTriggerByIds(triggerUids)

    // delete property
    const key = `${this.keyPrefixes.threadId}${threadId}`
    this.props.deleteProperty(key)
  }

  deleteTriggerByIds(ids) {
    ScriptApp.getProjectTriggers().forEach(trigger => {
      const triggerUid = trigger.getUniqueId()
      if (ids.includes(triggerUid)) {
        ScriptApp.deleteTrigger(trigger)
      }
    })
  }

  getThreadReminders(threadId) {
    const key = `${this.keyPrefixes.threadId}${threadId}`
    const reminders = this.props.getProperty(key)
    if (!reminders) return {}
    return JSON.parse(reminders)
  }

  createTimeTrigger(runAt) {
    runAt = new Date(runAt)
    const trigger = ScriptApp.newTrigger(this.functionName)
      .timeBased()
      .at(runAt)
      .create()
    const triggerUid = trigger.getUniqueId()
    return triggerUid
  }


  addTrigger(threadId, runAt) {
    const triggerUid = this.createTimeTrigger(runAt)
    const key = `${this.keyPrefixes.triggerUid}${triggerUid}`
    this.props.setProperty(key, threadId)
    return triggerUid
  }

  getThreadIdByTriggerUid(triggerUid) {
    const key = `${this.keyPrefixes.triggerUid}${triggerUid}`
    return this.props.getProperty(key)
  }


  getFollowUps() {
    const props = this.props.getProperties()
    const items = []
    Object.keys(props).forEach(key => {
      if (key.startsWith(this.keyPrefixes.threadId)) {
        const { reminders, created } = JSON.parse(props[key])
        const threadId = key.replace(this.keyPrefixes.threadId, "")
        if (GmailApp.getThreadById(threadId)){

          items.push({
            threadId,
            reminders,
            created: new Date(created)
          })
        } else {
          this.deleteThreadReminders(threadId)
        }
      }
    })
    items.sort((a, b) => b.created - a.created)
    return items
  }

  resetUserSettings() {
    this.props.deleteAllProperties()
    ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger))
  }

  sendReminder(threadId, triggerUid) {
    const { defaultReminderMessage, deleteAfterCompleted } = new SettingsPageView().getSettings()
    const { reminders, created } = this.getThreadReminders(threadId)
    let isLastReminder = false
    reminders.forEach((reminder, index) => {
      if (triggerUid === reminder.triggerUid) {
        const firstMessage = GmailApp.getThreadById(threadId).getMessages()[0]
        firstMessage.forward(firstMessage.getTo(), {
          htmlBody: `<div>${reminder.message || defaultReminderMessage}</div>`
        })
        this.deleteTriggerByIds([triggerUid])
        reminders[index].sent = true
        if (index + 1 === reminders.length) {
          isLastReminder = true
        }
      }
    })
    const key = `${this.keyPrefixes.threadId}${threadId}`
    this.props.setProperty(key, JSON.stringify({ reminders, created }))
    if (isLastReminder && deleteAfterCompleted) {
      this.deleteThreadReminders(threadId)
    }
  }

  isThreadReplied(threadId) {
    const thread = GmailApp.getThreadById(threadId)
    const messages = thread.getMessages()
    const firstMessage = messages[0]
    const toEmails = firstMessage.getTo()
    let isReplied = false
    messages.slice(1).forEach(message => {
      const replyFromEmail = message.getFrom().split("<").pop().slice(0, -1)
      if (toEmails.includes(replyFromEmail)) {
        isReplied = true
      }
    })
    return isReplied
  }

  checkGmailThread({ triggerUid }) {
    const threadId = this.getThreadIdByTriggerUid(triggerUid)
    const isReplied = this.isThreadReplied(threadId)
    if (isReplied) {
      this.deleteThreadReminders(threadId)
    } else {
      this.sendReminder(threadId, triggerUid)
    }
  }
}

function checkGmailThread(e) {
  new App().checkGmailThread(e)
}

function resetUserSettings() {
  new App().resetUserSettings()
}


function onThreadOpen(e) {
  return new ThreadPageView().create(e.gmail.threadId)
}

function onHomePage(e) {
  return new HomePageView().create(e)
}

function openSettings() {
  return new SettingsPageView().create()
}




