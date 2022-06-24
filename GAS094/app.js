const EMAILS = {
  Abby: "yunjia.fei@gmail.com",
  Boris: "gas.test.fei@gmail.com",
  Chris: "yunjia.fei@gmail.com",
  Dob: "gas.test.fei@gmail.com",
  Ella: "yunjia.fei@gmail.com",
};
const DEFAULT_EMAIL = "yunjia.fei@gmail.com";
const KEY = {
  SETTINGS: "mailman.settings",
  EMAILS: "mailman.emails",
};

class Form {
  constructor() {
    this.name = "💌 Mailman";
    this.triggerFunctionName = "onSubmit";
    this.form = FormApp.getActiveForm();
    this.props = PropertiesService.getUserProperties();
  }

  getUi() {
    return FormApp.getUi();
  }

  alert(message, title = this.name) {
    const ui = this.getUi();
    ui.alert(title, message, ui.ButtonSet.OK);
  }

  onOpen(e) {
    const ui = FormApp.getUi();
    const menu = ui.createMenu(this.name);
    menu.addItem("Settings", "openSettings");
    menu.addItem("Help", "openHelp");
    menu.addToUi();
  }

  createTrigger() {
    ScriptApp.getProjectTriggers().forEach((trigger) =>
      ScriptApp.deleteTrigger(trigger)
    );
    ScriptApp.newTrigger(this.triggerFunctionName)
      .forForm(this.form)
      .onFormSubmit();
  }

  /**
   * @param {FormApp.FormResponse} response
   */
  getResponseItem(response) {
    // response = this.form.getResponses()[0]
    const item = {};
    response.getItemResponses().map((v) => {
      const title = v.getItem().getTitle();
      const value = v.getResponse();
      item[title] = value;
    });
    item.url_ = this.form.getPublishedUrl();
    item.id_ = response.getId();
    item.editUrl_ = response.getEditResponseUrl();
    item.prefilledUrl_ = response.toPrefilledUrl();
    item.email_ = response.getRespondentEmail();
    return item;
  }

  /**
   * @param {Object} e
   * @param {FormApp.FormResponse} e.response
   */
  onSubmit(e = {}) {
    const response = e.response;
    if (!response) return;
    const item = this.getResponseItem(response);
    const to = item["To"];
    const name = item["Name"];
    const comments = item["Comments"];

    const recipient = EMAILS[to] || DEFAULT_EMAIL;
    const subject = `${to}, you have a new response from ${name}!`;
    const emailBody = `
      <p>Hi ${to},</p>

      <p>You've got a new response!</p>

      <p>
      <span><small>Name:</small></span><br>
      <span>${name}</span><br>
      <span><small>Comments:</small></span><br>
      <span>${comments}</span>
      </p>

      <p>
      <span>Google Form Mailman</span><br>
      <a href="${item.url_}">New</a>
      <a href="${item.editUrl_}">Edit URL</a>
      <a href="${item.prefilledUrl_}">Prefilled URL</a>
      </p>
    `;
    const options = {
      htmlBody: emailBody,
    };
    GmailApp.sendEmail(recipient, subject, "", options);
  }

  getFormItems() {
    return this.form.getItems().map((item) => {
      const type = item.getType();
      let items = null;
      switch (type) {
        case FormApp.ItemType.LIST:
          items = item
            .asListItem()
            .getChoices()
            .map((v) => v.getValue());
          break;
        case FormApp.ItemType.MULTIPLE_CHOICE:
          items = item
            .asMultipleChoiceItem()
            .getChoices()
            .map((v) => v.getValue());
          break;
        case FormApp.ItemType.CHECKBOX:
          items = item
            .asCheckboxItem()
            .getChoices()
            .map((v) => v.getValue());
          break;
      }
      const data = {
        text: item.getTitle(),
        value: {
          id: item.getId(),
          type,
          items,
        },
      };
      return data;
    });
  }

  getSettings() {
    const settings = this.props.getProperty(KEY.SETTINGS);
    if (!settings)
      return {
        mailman: null,
        cc: null,
        bcc: null,
        subject: null,
        body: null,
      };
    return JSON.parse(settings);
  }

  getEmails() {
    const emails = this.props.getProperty(KEY.EMAILS);
    if (!emails) return {};
    return JSON.parse(emails);
  }

  saveSettings({ settings, emails }) {
    this.props.setProperty(KEY.SETTINGS, JSON.stringify(settings));
    this.props.setProperty(KEY.EMAILS, JSON.stringify(emails));
    return { settings: this.getSettings(), emails: this.getEmails() };
  }

  openSettings() {
    const name = `${this.name} - Settings`;
    const settings = this.getSettings();
    const emails = this.getEmails();
    const formItems = this.getFormItems();
    const template = HtmlService.createTemplateFromFile("settings.html");
    template.appData = JSON.stringify({
      settings,
      emails,
      formItems,
    });
    const ui = this.getUi();
    const userInterface = template
      .evaluate()
      .setTitle(name)
      .setHeight(800)
      .setWidth(600);
    ui.showDialog(userInterface);
  }

  openHelp() {
    this.alert("Help");
  }
}

const onOpen = (e) => new Form().onOpen(e);
const onSubmit = (e) => new Form().onSubmit(e);
const openSettings = () => new Form().openSettings();
const saveSettings = (payload) =>
  JSON.stringify(new Form().saveSettings(JSON.parse(payload)));
const openHelp = () => new Form().openHelp();
const test = () => {
  console.log(new Form().getFormItems()[0].value.items);
};
