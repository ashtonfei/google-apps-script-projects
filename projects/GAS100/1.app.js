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
  const range = SpreadsheetApp.getActiveSheet()
    .getRange(RANGE_NAME.MESSAGE)
    .activate();
  SpreadsheetApp.flush();
  const message = range.getDisplayValue().trim();
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

const sendRequest_ = (payload, apiKey = getApiKey_()) => {
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
  const message = {
    role: ROLE.SYSTEM,
    content: "Hello",
  };
  const payload = {
    model: getModel_(),
    messages: [message],
  };
  const res = sendRequest_(payload, apiKey);
  if (res.error) {
    return res.error.message;
  }
  return true;
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

  const isValidApiKey = validateApiKey_(apiKey);
  if (isValidApiKey !== true) {
    return _alert_(isValidApiKey, title, "🟥 Error");
  }
  PropertiesService.getUserProperties().setProperty(KEY, apiKey);
  onOpen();
  _toast_("You can chat in the sheet now.", title);
};

const actionSetApiKey = () => {
  _tryAction_(setApiKey_, APP_NAME);
};

const newChat_ = () => {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const rangeHistory = ss.getRange(RANGE_NAME.HISTORY);
  if (rangeHistory.getCell(1, 1).getValue()) {
    const values = rangeHistory.getValues().filter((v) => v[0] && v[1]);
    values.unshift([null, null]);
    sheet
      .getRange(
        rangeHistory.getRow(),
        rangeHistory.getColumn(),
        values.length,
        values[0].length
      )
      .setValues(values);
  }
  ss.getRange(RANGE_NAME.CONVERSIONS).setValue(null);
  ss.getRange(RANGE_NAME.MESSAGE).setValue("New chat ...");
};

const loadChat_ = () => {
  const title = APP_NAME;
  let msg = "";
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const row = ss.getSelection().getActiveRangeList().getRanges()[0].getRow();
  const rangeHistory = ss.getRange(RANGE_NAME.HISTORY);
  const rangeRow = rangeHistory.getRow();
  const rangeColumn = rangeHistory.getColumn();

  let [description, messages] = sheet
    .getRange(row, rangeColumn, 1, 2)
    .getValues()[0];
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
  if (row == rangeRow) return;
  const newValues = [];
  let currentValues = [];
  rangeHistory.getValues().forEach((values, index) => {
    if (index == 0) {
      newValues.push([description, JSON.stringify(messages)]);
      currentValues = values;
    } else if (index == row - rangeRow) {
      currentValues[0] && newValues.push(currentValues);
    } else {
      values[0] && newValues.push(values);
    }
  });
  rangeHistory.setValue(null);
  sheet
    .getRange(rangeRow, rangeColumn, newValues.length, newValues[0].length)
    .setValues(newValues);
};

const onOpen = () => {
  const apiKey = getApiKey_();
  const ui = _getUi_();
  const menu = ui.createMenu(APP_NAME);
  if (apiKey) {
    menu.addItem("Remove API key", "actionRemoveApiKey");
  } else {
    menu.addItem("Set API key", "actionSetApiKey");
  }
  menu.addSeparator();
  menu.addItem("Help", "actionOpenHelp");
  menu.addToUi();
};

const actionSendMessage = () => _tryAction_(sendMessage_);
const actionNewChat = () => _tryAction_(newChat_);
const actionLoadChat = () => _tryAction_(loadChat_);

const actionRemoveApiKey = () => {
  _tryAction_(() => {
    PropertiesService.getUserProperties().deleteProperty(KEY);
    onOpen();
    _toast_("API key has been removed from your settings.", APP_NAME);
  });
};

const openHelp_ = () => {
  const html = `
    <div style="font-family:Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif; font-size: 14px;">
      <div>You need an API key from openai.com to make it working.</div>
      <div>You can find your API key at <a href="https://platform.openai.com/account/api-keys" target="_blank">https://platform.openai.com/account/api-keys</a></div>
      <div style="padding-top: 1rem;">Check this <a href="https://youtu.be/wVy-X92R2rU" target="_blank">video</a> for the details if have any questions.</div>
  
      <div style="padding-top: 1rem;">Follow me</div>
      <div><a href="https://www.upwork.com/workwith/ashtonfei" target="_blank">Upwork</a></div>
      <div><a href="https://youtube.com/ashtonfei" target="_blank">YouTube</a></div>
      <div><a href="https://github.com/ashtonfei" target="_blank">Github</a></div>
      <div><a href="https://twitter.com/ashton_fei" target="_blank">Twitter</a></div>
    </div>
  `;
  const ui = _getUi_();
  const dialog = HtmlService.createHtmlOutput(html);
  ui.showModalDialog(dialog, "Help");
};

const actionOpenHelp = () => {
  _tryAction_(openHelp_);
};
