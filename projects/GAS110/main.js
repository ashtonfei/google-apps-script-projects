const mergeDocs = () => {
  const updateStatus_ = (status, message) => {
    rangeStatus.setValue(status);
    rangeMergedDoc.setValue(message);
    SpreadsheetApp.flush();
  };
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("App");
  const docUrlFilter = (v) =>
    v && v.startsWith("https://docs.google.com/document/");
  const rangeStatus = sheet.getRange("status");
  const rangeMergedDoc = sheet.getRange("mergedDoc");
  const rangeUrlFolderMerged = sheet.getRange("urlFolderMerged");
  const rangeKeepPageBreak = sheet.getRange("keepPagebreak");
  const keepPagebreak = rangeKeepPageBreak.getValue() === true;

  const tableInput = sheet.getRange("B3").getDataRegion();

  const urls = tableInput
    .getValues()
    .slice(1)
    .map((v) => v[1])
    .filter(docUrlFilter);

  if (urls.length <= 1) {
    updateStatus_(
      "Error",
      "At least two docs should be entered in the input table to merge.",
    );
    return;
  }
  let folder = null;
  const folderUrl = rangeUrlFolderMerged.getValue();
  const folderId = folderUrl.split("?id=")[1] ||
    folderUrl.split("/folders/")[1];

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (err) {
      updateStatus_("Error", err.message);
      return;
    }
  }

  updateStatus_("Merging ...", null);

  try {
    const doc = mergeDocs_(urls, keepPagebreak);
    folder && DriveApp.getFileById(doc.getId()).moveTo(folder);
    updateStatus_("Success", doc.getUrl());
  } catch (err) {
    updateStatus_("Error", err.message);
  }
};

/**
 * @param {string[]} urlsOrIds a list of Google Docs urls or ids
 * @param {boolean} keepPagebreak Insert a pagebreak between docs to be merged
 * @param {string} filename The file name of the merged file
 * @return {GoogleAppsScript.Drive.File} a merged Google Docs file
 */
const mergeDocs_ = (urlsOrIds, keepPagebreak = true, filename) => {
  const urlFilter = (v) => v.startsWith("https://");

  /**
   * @param {GoogleAppsScript.Document.Document} targetDoc
   * @param {boolean} keepPagebreak Insert a pagebreak between docs to be merged
   * @param {GoogleAppsScript.Document.Document} doc
   */
  const appendDoc_ = (targetDoc, doc, keepPagebreak = true) => {
    const bodyTarget = targetDoc.getBody();
    const body = doc.getBody();
    const countOfElement = body.getNumChildren();
    if (countOfElement === 0) return;
    keepPagebreak && bodyTarget.appendPageBreak();

    for (let i = 0; i < countOfElement; i++) {
      const child = body.getChild(i);
      const type = child.getType();
      const copy = child.copy();
      if (type === DocumentApp.ElementType.TABLE) {
        bodyTarget.appendTable(copy.asTable());
      } else if (type === DocumentApp.ElementType.PAGE_BREAK) {
        bodyTarget.appendPageBreak(copy.asPageBreak());
      } else if (type === DocumentApp.ElementType.INLINE_IMAGE) {
        bodyTarget.appendImage(copy.asInlineImage());
      } else if (type === DocumentApp.ElementType.HORIZONTAL_RULE) {
        bodyTarget.appendHorizontalRule();
      } else if (type === DocumentApp.ElementType.LIST_ITEM) {
        const listItem = copy.asListItem();
        bodyTarget
          .appendListItem(listItem)
          .setAttributes(listItem.getAttributes());
      } else {
        bodyTarget.appendParagraph(copy.asParagraph());
      }
    }

    return targetDoc;
  };

  const [firstDoc, ...restDocs] = urlsOrIds
    .map((v) => {
      try {
        return urlFilter(v)
          ? DocumentApp.openByUrl(v)
          : DocumentApp.openById(v);
      } catch (err) {
        return err.message;
      }
    })
    .filter((v) => typeof v !== "string");

  filename = filename || "Merged doc " + new Date().toLocaleString();
  const copy = DriveApp.getFileById(firstDoc.getId())
    .makeCopy()
    .setName(filename);
  const mergedDoc = DocumentApp.openById(copy.getId());

  restDocs.forEach((doc) => appendDoc_(mergedDoc, doc, keepPagebreak));
  mergedDoc.saveAndClose();

  return copy;
};
