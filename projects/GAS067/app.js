/**
 * consts
 */
const QUERY = "subject:XML Demo has:attachment filename:xml newer_than:1d"; //https://support.google.com/mail/answer/7190?hl=en
const SEP = ">";
const XML_TYPE = "text/xml";
const WS_XML = "XML";
const WS_IMPORT = "IMPORT XML";
const EXCLUDE_TAGS = ["Invoice>InvoicePDF"];
const FUNCTION_NAME = "triggerFunction";
const HOURS = [
  "Midnight to 1am",
  "1am to 2am",
  "2am to 3am",
  "3am to 4am",
  "4am to 5am",
  "5am to 6am",
  "6am to 7am",
  "7am to 8am",
  "8am to 9am",
  "9am to 10am",
  "10am to 11am",
  "11am to 12pm",
  "12pm to 1pm",
  "1pm to 2pm",
  "2pm to 3pm",
  "3pm to 4pm",
  "4pm to 5pm",
  "5pm to 6pm",
  "6pm to 7pm",
  "7pm to 8pm",
  "8pm to 9pm",
  "9pm to 10pm",
  "10pm to 11pm",
  "11pm to Midnight",
];

/**
 * get sheet by name (create new sheet when not found)
 */
function getSheetByName(name) {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(name);
  if (ws) return ws;
  return ss.insertSheet(name);
}

/**
 * get gmail query from the properties in the script properties
 */
function getQuery() {
  const items = [];
  const { subject, from, to, others, xml } =
    PropertiesService.getScriptProperties().getProperties();
  if (subject) items.push("subject:" + subject);
  if (from) items.push("from:" + from);
  if (to) items.push("to:" + to);
  if (others) items.push(others);
  items.push(xml);
  return items.join(" ") || QUERY;
}

/**
 * trigger function
 */
function triggerFunction() {
  runQuery();
}

/**
 * runQuery
 */
function runQuery() {
  const query = getQuery();
  const attachments = getXmlAttachments(query);
  let xmlValues = [];
  let xmlTags = [];
  let xmlKeys = [];
  attachments.forEach((attachment) => {
    const content = attachment.getDataAsString();
    const filename = attachment.getName();
    const [tags, keys, values] = convertXML(content, filename);
    xmlTags = tags;
    xmlKeys = keys;
    xmlValues = [...xmlValues, ...values];
  });
  // write array data to sheet
  let { keepOldRecords } =
    PropertiesService.getScriptProperties().getProperties();
  keepOldRecords = keepOldRecords ? JSON.parse(keepOldRecords) : true;
  const ws = getSheetByName(WS_XML);
  if (!keepOldRecords) ws.clear().clearNotes();
  if (xmlTags.length)
    ws.getRange(1, 1, 1, xmlTags.length)
      .setValues([xmlTags])
      .setNotes([xmlKeys]);
  xmlValues.forEach((values) => {
    ws.appendRow(values);
  });
  ws.activate();
  return getAppData();
}

/**
 * get all xml attachments from the gmail threads with the query
 */
function getXmlAttachments(query) {
  // search for mail threads
  const threads = GmailApp.search(query);
  let xmls = [];
  threads.forEach((thread) => {
    let messages = thread.getMessages();
    let lastMessage = messages.pop();
    let attachments = lastMessage.getAttachments({
      includeInlineImages: false,
    });
    attachments = attachments.filter((attachment) => {
      return attachment.getContentType() === XML_TYPE;
    });
    xmls = xmls.concat(attachments);
  });
  return xmls;
}

/**
 * convert xml to arrays of headers, keys, and values
 */
function xmlToArray(
  root,
  parentKey = null,
  repeatTag = null,
  excludedTags = [],
) {
  //root = xml.getRootElement()
  let headers = [];
  let keys = [];
  let values = [];
  const children = root.getChildren();
  const attributes = root.getAttributes();
  const tagName = root.getName();
  const key = parentKey
    ? [parentKey, root.getName()].join(SEP)
    : root.getName();
  const tagValue = root.getText();
  attributes.forEach((attribute) => {
    const attributeKey = [key, attribute.getName()].join(SEP);
    const attributeName = [tagName, attribute.getName()].join("");
    const attributeValue = attribute.getValue();
    if (excludedTags.indexOf(attributeKey) === -1) {
      headers.push(attributeName);
      keys.push(attributeKey);
      values.push(attributeValue);
    }
  });
  if (children.length) {
    children.forEach((child) => {
      if (child.getName() !== repeatTag) {
        let [childHeaders, childKeys, childValues] = xmlToArray(
          child,
          key,
          null,
          excludedTags,
        );
        headers = [...headers, ...childHeaders];
        keys = [...keys, ...childKeys];
        values = [...values, ...childValues];
      }
    });
  } else {
    if (excludedTags.indexOf(key) === -1) {
      headers.push(tagName);
      keys.push(key);
      values.push(tagValue);
    }
  }
  return [headers, keys, values];
}

/**
 * conver row XML string to arrays
 */
function convertXML(xmlString, filename) {
  let { tags, repeatTag } =
    PropertiesService.getScriptProperties().getProperties();
  const excludedTags = tags ? JSON.parse(tags) : [];
  repeatTag = repeatTag || "";

  const xml = XmlService.parse(xmlString);
  const root = xml.getRootElement();
  const rootName = root.getName();

  const [rootTags, rootKeys, rootValues] = xmlToArray(
    root,
    null,
    repeatTag,
    excludedTags,
  );
  let xmlValues = [];
  let xmlTags = [];
  let xmlKeys = [];
  const repeatItems = root.getChildren(repeatTag);

  if (repeatItems.length) {
    repeatItems.forEach((item) => {
      let [tags, keys, values] = xmlToArray(item, rootName, null, excludedTags);
      xmlTags = [...rootTags, ...tags, "Filename", "Timestamp"];
      xmlKeys = [...rootKeys, ...keys, "Filename", "Timestamp"];
      values = [...rootValues, ...values, filename, new Date()];
      xmlValues.push(values);
    });
  } else {
    xmlTags = [...rootTags, "Filename", "Timestamp"];
    xmlKeys = [...rootKeys, "Filename", "Timestamp"];
    xmlValues = [[...rootValues, filename, new Date()]];
  }

  return [xmlTags, xmlKeys, xmlValues];
}

/**
 * import local xml file to spreadsheet
 */
const importXml = (files) => {
  let xmlValues = [];
  let xmlTags = [];
  let xmlKeys = [];
  files.forEach((file) => {
    const { name, data } = file;
    const [tags, keys, values] = convertXML(data, name);
    xmlTags = tags;
    xmlKeys = keys;
    xmlValues = [...xmlValues, ...values];
  });

  let { keepOldRecords } =
    PropertiesService.getScriptProperties().getProperties();
  keepOldRecords = keepOldRecords ? JSON.parse(keepOldRecords) : true;
  const ws = getSheetByName(WS_IMPORT);
  if (!keepOldRecords) ws.clear().clearNotes();
  if (xmlTags.length)
    ws.getRange(1, 1, 1, xmlTags.length)
      .setValues([xmlTags])
      .setNotes([xmlKeys]);
  xmlValues.forEach((values) => {
    ws.appendRow(values);
  });
  ws.activate();
};

/**
 * spreadsheet on open function (create menu)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("XML").addItem("Open", "showSidebar").addToUi();
}

/**
 * show addon settings function
 */
function showSidebar() {
  const ui = SpreadsheetApp.getUi();
  const userInterface =
    HtmlService.createHtmlOutputFromFile("sidebar").setTitle("XML Addon");
  ui.showSidebar(userInterface);
}

/**
 * get app data for sidebar app
 */
const getAppData = () => {
  const props = PropertiesService.getScriptProperties().getProperties();
  const {
    subject,
    from,
    to,
    others,
    enabled,
    hour,
    tags,
    repeatTag,
    keepOldRecords,
  } = props;
  const app = {
    subject: subject || "XML",
    from: from || "",
    to: to || "",
    others: others || "",
    enabled: enabled ? JSON.parse(enabled) : false,
    hour: parseInt(hour) || 8,
    tags: tags ? JSON.parse(tags) : [],
    repeatTag: repeatTag || "",
    keepOldRecords: keepOldRecords ? JSON.parse(keepOldRecords) : true,
    xml: "has:attachment filename:xml newer_than:1d",
    hours: HOURS,
  };

  return JSON.stringify(app);
};

/**
 * delete all triggers in the project
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}

/**
 * create a new trigger which run the runction at hour every day
 */
function createTrigger(hour) {
  deleteAllTriggers();
  ScriptApp.newTrigger(FUNCTION_NAME)
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .create();
}

/**
 * disable the addon by delete triggers
 */
const disableAddon = () => {
  deleteAllTriggers();
  PropertiesService.getScriptProperties().setProperty("enabled", false);
  return getAppData();
};

/**
 * save app settings to script properties
 */
const saveSettings = (app) => {
  app = JSON.parse(app);
  app.tags = JSON.stringify(app.tags);
  const hour = parseInt(app.hour);
  delete app.hours;
  PropertiesService.getScriptProperties().setProperties(app);
  if (app.enabled) {
    createTrigger(hour);
  } else {
    disableAddon();
  }
  return getAppData();
};

