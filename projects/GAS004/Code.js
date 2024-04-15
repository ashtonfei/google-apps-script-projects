/**
 * Script was updated by Ashton on 15 Apr 2024
 */

function sendEmail() {
  const subject = "GAS004 Send HTML EMAIL FROM GMAIL";
  const recipient = Session.getActiveUser().getEmail();

  const template = HtmlService.createTemplateFromFile("template.html");
  // <?= name ?> for placeholder name in the HTML
  template.name = "Ashton Fei";
  // <?= email ?> for placeholder email in the HTML
  template.email = recipient;

  const htmlBody = template.evaluate().getContent();
  const options = {
    htmlBody,
  };
  GmailApp.sendEmail(recipient, subject, "", options);
}
