const APP_NAME = "ChatGPT";
const RANGE_NAME = {
  MESSAGE: "message",
  CONVERSIONS: "conversations",
  HISTORY: "history",
  MODEL: "model",
};

const ROLE = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};

const API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

const KEY = "apikey";

const getApiKey_ = () => {
  return PropertiesService.getUserProperties().getProperty(KEY);
};

const getModel_ = () => {
  const ss = SpreadsheetApp.getActive();
  return (
    ss.getRange(RANGE_NAME.MODEL).getDisplayValue().trim() || "gpt-3.5-turbo"
  );
};

const getMessage_ = () => {
  const message = SpreadsheetApp.getActive()
    .getRange(RANGE_NAME.MESSAGE)
    .getDisplayValue()
    .trim();
  if (!message) {
    throw new Error("Message is empty.");
  }
  return {
    role: ROLE.USER,
    content: message,
  };
};

const getConversations_ = () => {
  const ss = SpreadsheetApp.getActive();
  const conversations = [];
  ss.getRange(RANGE_NAME.CONVERSIONS)
    .getValues()
    .forEach(([role, content]) => {
      if (role == "You:") {
        conversations.push({ role: ROLE.USER, content });
      } else if (role == "ChatGPT:") {
        conversations.push({ role: ROLE.ASSISTANT, content });
      }
    });
  return conversations;
};

const sendRequest_ = (payload) => {
  const apiKey = getApiKey_();
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const res = UrlFetchApp.fetch(API_ENDPOINT, options);
  if (res.getResponseCode() == 200) {
    return JSON.parse(res.getContentText());
  } else {
    return JSON.parse(res.getContentText());
  }
};

const updateHistory_ = (conversations) => {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRange(RANGE_NAME.HISTORY);
  if (!conversations || conversations.length == 0) {
    const values = range.getValues().filter((v) => v[0]);
    if (values.length === 0) {
      return;
    }
    values.unshift([null, null]);
    range
      .getSheet()
      .getRange(
        range.getRow(),
        range.getColumn(),
        values.length,
        values[0].length
      )
      .setValues(values);
    return;
  }
  const desription = conversations[0].content;
  const values = [desription, JSON.stringify(conversations)];
  range
    .getSheet()
    .getRange(range.getRow(), range.getColumn(), 1, values.length)
    .setValues([values]);
};

const updateConversions_ = (conversations, updateHistory = true) => {
  const values = [];
  conversations.forEach(({ role, content }) => {
    if (role == "user") {
      values.push(["You:", content]);
    } else {
      values.push(["ChatGPT:", content]);
      values.push([null, null]);
    }
  });
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRange(RANGE_NAME.CONVERSIONS);
  range.setValue(null);
  if (values.length > 0) {
    range
      .getSheet()
      .getRange(
        range.getRow(),
        range.getColumn(),
        values.length,
        values[0].length
      )
      .setValues(values);
  }
  updateHistory && updateHistory_(conversations);
  ss.getRange(RANGE_NAME.MESSAGE).setValue(null);
};

const sendMessage_ = () => {
  const title = APP_NAME;
  _toast_("Sending ...", title, -1);
  const message = getMessage_();
  const messages = getConversations_();
  const model = getModel_();
  messages.push(message);
  const payload = {
    model,
    messages,
  };
  const res = sendRequest_(payload);
  if (res.error) {
    if (res.error.message.includes("Incorrect API key provided")) {
      _toast_("Invalid API key", title, 0.01);
      return actionSetApiKey();
    }
    return _alert_(res.error.message, title, "🟥 Error");
  }
  messages.push(res.choices[0].message);
  updateConversions_(messages);
  _toast_("Completed", title, 3);
};

const validateApiKey_ = (apiKey) => {
  return Boolean(apiKey);
};

const setApiKey_ = () => {
  const title = APP_NAME;
  const msg = `Enter your API key below:
    You can find your API key at https://platform.openai.com/account/api-keys\n`;
  const input = _prompt_(msg, title);
  const ui = _getUi_();
  if (input.getSelectedButton() != ui.Button.OK) return;
  const apiKey = input.getResponseText().trim();
  if (apiKey == "") {
    return _alert_("You didn't enter any API key", title, "🟥 Error");
  }
  if (validateApiKey_(apiKey) === false) {
    return _alert_("Invalid API key.", title, "🟥 Error");
  }
  PropertiesService.getUserProperties().setProperty(KEY, apiKey);
  _toast_("You can chat in the sheet now.", title);
};

const actionSetApiKey = () => {
  _tryAction_(setApiKey_, APP_NAME);
};

const newChat_ = () => {
  const ss = SpreadsheetApp.getActive();
  updateConversions_([]);
  ss.getRange(RANGE_NAME.CONVERSIONS).setValue(null);
};

const loadChat_ = () => {
  const title = APP_NAME;
  let msg = "";
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const row = ss.getSelection().getActiveRangeList().getRanges()[0].getRow();
  let messages = sheet.getRange(row, 3).getValue();
  if (!messages) {
    msg = `No hisotry data for the selected row ${row}.`;
    return _alert_(msg, title, "🟥 Error");
  }
  try {
    messages = JSON.parse(messages);
  } catch (error) {
    msg = `Invalid history data for the selected row ${row}.`;
    return _alert_(msg, title, "🟥 Error");
  }
  updateConversions_(messages, false);
};

const onOpen = () => {
  const apiKey = getApiKey_();
  if (apiKey == null) {
    return actionSetApiKey();
  }
  if (apiKey) {
    const ui = _getUi_();
    const menu = ui.createMenu(APP_NAME);
    menu.addItem("Remove API key", "actionRemoveApiKey");
    menu.addToUi();
  }
};

const actionSendMessage = () => _tryAction_(sendMessage_);
const actionNewChat = () => _tryAction_(newChat_);
const actionLoadChat = () => _tryAction_(loadChat_);

const actionRemoveApiKey = () => {
  _tryAction_(() => {
    PropertiesService.getUserProperties().deleteProperty(KEY);
    _toast_("API key has been removed from your settings.", APP_NAME);
  });
};
