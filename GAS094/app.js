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
    this.user = Session.getActiveUser().getEmail();
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
      .onFormSubmit()
      .create();
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

  replacePlaceholders(text, placeholders) {
    Object.entries(placeholders).forEach(([key, value]) => {
      if (Array.isArray(value)) value = value.join(", ");
      text = text.replace(new RegExp(`\{\{${key}\}\}`, "gi"), value);
    });
    return text;
  }

  sendEmails(item) {
    const settings = this.getSettings();
    const emails = this.getEmails();
    const recipientNames = item[settings.mailman.title]
      ? typeof item[settings.mailman.title] == "string"
        ? [item[settings.mailman.title]]
        : item[settings.mailman.title]
      : [];
    const subject = this.replacePlaceholders(settings.subject, item);
    const body = this.replacePlaceholders(settings.body, item).replace(
      /\n/g,
      "<br>"
    );
    const cc = settings.cc;
    const bcc = settings.bcc;

    recipientNames.forEach((name) => {
      const recipient = emails[name];
      const options = {
        htmlBody: `<div>${body}</div>`,
        cc,
        bcc,
      };
      console.log(recipient);
      console.log(options);
      if (recipient) {
        GmailApp.sendEmail(recipient, subject, "", options);
      }
    });
  }
  /**
   * @param {Object} e
   * @param {FormApp.FormResponse} e.response
   */
  onSubmit(e = {}) {
    const response = e.response;
    if (!response) return;
    const item = this.getResponseItem(response);
    this.sendEmails(item);
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
          title: item.getTitle(),
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

  isMailmanEnabled() {
    const triggers = ScriptApp.getProjectTriggers();
    const trigger = triggers.find(
      (trigger) => trigger.getHandlerFunction() == this.triggerFunctionName
    );
    return trigger ? true : false;
  }

  saveSettings({ settings, emails }) {
    this.props.setProperty(KEY.SETTINGS, JSON.stringify(settings));
    this.props.setProperty(KEY.EMAILS, JSON.stringify(emails));
    return { settings: this.getSettings(), emails: this.getEmails() };
  }

  openSettings() {
    const name = `Settings`;
    const settings = this.getSettings();
    const emails = this.getEmails();
    const formItems = this.getFormItems();
    const template = HtmlService.createTemplateFromFile("settings.html");
    template.appData = JSON.stringify({
      settings,
      emails,
      formItems,
      enabled: this.isMailmanEnabled(),
    });
    const ui = this.getUi();
    const userInterface = template
      .evaluate()
      .setTitle(name)
      .setHeight(800)
      .setWidth(600);
    ui.showDialog(userInterface);
  }

  toggleMailman({ toggle }) {
    if (toggle) {
      this.createTrigger();
    } else {
      ScriptApp.getProjectTriggers().forEach((trigger) =>
        ScriptApp.deleteTrigger(trigger)
      );
    }
  }

  sendTestEmail({ settings }) {
    const options = {
      htmlBody: settings.body,
      cc: settings.cc,
      bcc: settings.bcc,
    };
    GmailApp.sendEmail(this.user, settings.subject, "", options);
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
const sendTestEmail = (payload) =>
  new Form().sendTestEmail(JSON.parse(payload));
const openHelp = () => new Form().openHelp();

const toggleMailman = (payload) =>
  new Form().toggleMailman(JSON.parse(payload));
