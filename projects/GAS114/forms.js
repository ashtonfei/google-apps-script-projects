/**
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
const triggerOnFormSubmit = (e) => {
  const options = {
    labels: 3,
    colors: 2,
    text: true,
  };
  const parseNamedValues_ = (values) => {
    const item = {};
    Object.entries(values).forEach(([key, value]) => {
      item[key] = value.join(", ");
    });
    return item;
  };
  const item = parseNamedValues_(e.namedValues);

  createImageUri_ = (id) => {
    DriveApp.getFileById(id).setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW,
    );
    return `https://drive.google.com/thumbnail?id=${id}&sz=1080`;
  };

  const createImageContent_ = (id) => {
    return Utilities.base64Encode(
      DriveApp.getFileById(id).getBlob().getBytes(),
    );
  };

  const id = item["Image"].split("id=")[1];
  const imageUri = createImageUri_(id);
  const imageContent = createImageContent_(id);
  const preivew = `=IMAGE("${imageUri}")`;
  const annotation = imageAnnotate_(imageContent, options);
  const data = parseImageAnnotation_(annotation);

  const results = [
    preivew,
    data.labels ? data.labels.join(", ") : null,
    data.text || null,
    data.colors ? data.colors.slice(0, options.colors).join(", ") : null,
    "OK" || data.error,
  ];

  const sheet = e.range.getSheet();
  const row = e.range.rowStart;
  sheet.getRange(`D${row}:H${row}`).setValues([results]);

  const recipient = item["Email Address"];
  const subject = "Image Labels, Text, Colors for Your Upload: GAS114";
  const htmlBody = `
    <div><img src="${imageUri}" style='max-width:480px;'></div>
    <div>Lables: ${results[1]}</div>
    <div>Text: ${results[2]}</div>
    <div>Colors: ${results[3]}</div>
    <div>Status: ${results[4]}</div>
  `;

  GmailApp.sendEmail(recipient, subject, "", {
    htmlBody,
  });
};
