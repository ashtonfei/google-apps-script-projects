class HomePageView {
  constructor() { 
    this.props = PropertiesService.getUserProperties()
  }

  createThreadWidget({ threadId, reminders, created }) {
    const thread = GmailApp.getThreadById(threadId)
    const closedReminders = reminders.filter(item => item.sent)
    const openReminders = reminders.filter(item => !item.sent)

    return CardService.newDecoratedText()
      .setTopLabel(`Open: ${openReminders.length}, closed: ${closedReminders.length}`)
      .setText(thread.getFirstMessageSubject())
      .setBottomLabel(`${created.toLocaleString()}`)
      .setIconUrl(openReminders.length ? CONFIGS.urls.openImageUrl : CONFIGS.urls.closedImageUrl)
      .setOnClickAction(CardService.newAction().setFunctionName("openThreadView").setParameters({ threadId }))
  }

  createFooter(){
    
    const primaryButton = CardService.newTextButton()
      .setText("Delete closed")
      .setBackgroundColor(CONFIGS.colors.error)
      .setOnClickAction(CardService.newAction().setFunctionName("deleteCompleted"))
    
    const secondaryButton = CardService.newTextButton()
      .setText("Delete all")
      .setBackgroundColor(CONFIGS.colors.error)
      .setOnClickAction(CardService.newAction().setFunctionName("deleteAll"))

    return CardService.newFixedFooter()
      .setPrimaryButton(primaryButton)
      .setSecondaryButton(secondaryButton)
  }

  create() {
    const followUps = new App().getFollowUps()
    const openItems = followUps.filter(item => (item.reminders.map(v => v.sent).includes(false)))
    const closedItems = followUps.filter(item => !(item.reminders.map(v => v.sent).includes(false)))
    const card = CardService.newCardBuilder()
    const header = CardService.newCardHeader()
      .setTitle("Your follow-ups")
      .setSubtitle(`${followUps.length} follow-ups`)
      .setImageUrl(CONFIGS.urls.followupImageUrl)
    card.setHeader(header)

    if (openItems.length){
      const openSection = CardService.newCardSection()
        .setHeader(`Following [${openItems.length}]`)
      openItems.forEach(item => {
        openSection.addWidget(this.createThreadWidget(item))
      })
      card.addSection(openSection)
    }

    if (closedItems.length){
      const closedSection = CardService.newCardSection()
        .setHeader(`Closed [${closedItems.length}]`)
        .setCollapsible(true)
      closedItems.forEach(item => {
        closedSection.addWidget(this.createThreadWidget(item))
      })
      card.addSection(closedSection)
    }

    if (followUps.length) {
      card.setFixedFooter(this.createFooter())
    }
    return card.build()
  }

  deleteAll() {
    const app = new App()
    const followUps = app.getFollowUps()
    followUps.forEach(item => app.deleteThreadReminders(item.threadId))
    const card = new HomePageView().create()
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().popCard().pushCard(card))
      .setNotification(CardService.newNotification().setText("All follow-ups have been removed."))
      .build()

  }

  deleteCompleted() {
    const app = new App()
    const followUps = app.getFollowUps()
    followUps.forEach(item => {
      const closedReminders = item.reminders.filter(v => v.sent)
      if (closedReminders.length === item.reminders.length) {
        app.deleteThreadReminders(item.threadId)
      }
    })
    const card = new HomePageView().create()
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().popCard().pushCard(card))
      .setNotification(CardService.newNotification().setText("All closed follow-ups have been removed."))
      .build()
  }
}

function openThreadView(e) {
  const threadId = e.parameters.threadId
  const card =  new ThreadPageView().create(threadId)
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card))
    .build()
}

function deleteAll(){
  return new HomePageView().deleteAll()
}

function deleteCompleted(){
  return new HomePageView().deleteCompleted()
}






