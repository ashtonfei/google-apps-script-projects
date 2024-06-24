/**
 * @param {GoogleAppsScript.Events.DoGet} e
 */
function doGet(e) {
  const { id } = e.parameter;
  const settings = getSettings_();
  const data = getAppData_(id, settings);
  const template = HtmlService.createTemplateFromFile("1.sign.html");
  template.data = JSON.stringify(data);
  template.name = settings.name;
  template.url = settings.urlDocumentPub + "?embedded=true";
  return template
    .evaluate()
    .setTitle(settings.name || "FormSign")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

const getAppData_ = (
  id,
  { headerSignStatus, headerUuid, headerName, headerEmail },
) => {
  const signature = {
    error: "",
  };
  if (!id) {
    signature.error = "Page Not Found";
    return signature;
  }
  try {
    const sheet = getLinkedSheet_();
    const filter = (v) => v[headerUuid] == id;
    const item = getItemsFromSheet_(sheet, filter)[0];
    if (!item) {
      return {
        error: `No item found for the id "${id}".`,
      };
    }
    item.status = item[headerSignStatus];
    item.id = item[headerUuid];
    item.email = item[headerEmail];
    item.fullname = item[headerName];
    return { ...item, ...signature };
  } catch (err) {
    signature.error = err.message;
    return signature;
  }
};

const sign_ = ({ data, id }) => {
  const sheet = getLinkedSheet_();
  const settings = getSettings_();
  const filter = (v) => v[settings.headerUuid] == id;
  const item = getItemsFromSheet_(sheet, filter)[0];
  if (!item) {
    throw new Error(`No record found for id "${id}".`);
  }
  if (item[settings.headerSignStatus] === "Signed") {
    return item;
  }
  const encodedData = data.split(",")[1];
  const decodedData = Utilities.base64Decode(encodedData);
  const imageBlob = Utilities.newBlob(decodedData);
  const templateId = getIdFromUrl_(settings.urlDocument);
  const template = DriveApp.getFileById(templateId);
  const copy = template.makeCopy();
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();

  body.getTables().forEach((table) => {
    const foundElement = table.findText(
      settings.signaturePlaceholder || "{{signature}}",
    );
    if (!foundElement) return;
    const cell = foundElement
      .getElement()
      .getParent()
      .getParent()
      .asTableCell();
    const image = cell.clear().insertImage(0, imageBlob);
    const width = settings.signatureWidth || 200;
    const ratio = image.getHeight() / image.getWidth();
    const height = width * ratio;
    image.setWidth(width).setHeight(height);
  });

  const signedDate = new Date();
  item["date"] = signedDate.toLocaleDateString();
  Object.entries(item).forEach(([key, value]) => {
    const text = typeof value == "string" ? value : String(value);
    body.replaceText(`{{${key}}}`, text);
  });
  doc.saveAndClose();
  const filename = updateTextWithPlaceholders_(template.getName(), item);
  const pdf = copy.getAs("application/pdf").setName(`${filename}.pdf`);
  const folder = DriveApp.getFolderById(getIdFromUrl_(settings.urlFolder));
  copy.setName(filename);
  copy.moveTo(folder);

  const pdfFile = folder.createFile(pdf);

  const {
    signedSubject,
    signedBody,
    signedEmailEnabled,
    headerEmail,
    includeSignedPdf,
    signedBcc,
    headerSignStatus,
    headerSignedDate,
    headerSignedDocument,
    headerSignedPdf,
  } = settings;
  if (signedEmailEnabled) {
    const subject = updateTextWithPlaceholders_(signedSubject, item);
    const htmlBody = updateTextWithPlaceholders_(
      addLineBreaks_(signedBody),
      item,
    );
    const options = {
      htmlBody,
    };
    if (includeSignedPdf) {
      options.attachments = [pdf];
    }
    if (signedBcc) {
      options.bcc = settings.signedBcc;
    }
    GmailApp.sendEmail(item[headerEmail], subject, "", options);
  }
  const updatedValues = {
    [headerSignStatus]: "Signed",
    [headerSignedDate]: signedDate,
    [headerSignedDocument]: doc.getUrl(),
    [headerSignedPdf]: pdfFile.getUrl(),
  };
  updateRowValues_(sheet)(item._row, updatedValues);
  return getAppData_(id, settings);
};

const apiSign = (payload) => JSON.stringify(sign_(JSON.parse(payload)));
