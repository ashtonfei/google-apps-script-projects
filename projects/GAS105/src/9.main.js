const createMenu_ = () => {
  const { installed } = getSettings_();
  const menuItems = installed
    ? [MENU.RUN, MENU.ADD_SAMPLE_RULE, { sep: true }, MENU.RESET, MENU.VERSION]
    : [MENU.SETUP, { sep: true }, MENU.VERSION];
  _createMenu_()(menuItems, CONFIG.NAME).addToUi();
};

const onOpen = () => {
  createMenu_();
};

const getRules_ = () => {
  const name = CONFIG.SHEET_NAME.RULES;
  const sheet = _getSheetByName_()(name);
  if (!sheet) {
    throw new Error(`Sheet "" was not found.`);
  }
  return sheet
    .getDataRange()
    .getValues()
    .slice(1)
    .map((v) => {
      return {
        query: v[0],
        prompt: v[1],
        messages: v[2],
        replyAll: v[3],
        replyInDraft: v[4],
        enabled: v[5],
      };
    })
    .filter((v) => v.query && v.enabled === true);
};

function getNewEmails_(query, after, start = 0, max = 50) {
  const emails = [];
  query = `${query} newer_than:1d`;
  const email = getUser_();
  const runQuery_ = (start, max) => {
    const threads = GmailApp.search(query, start, max);
    threads.forEach((v) => {
      const emailFrom = v.getMessages().at(-1).getFrom();
      if (emailFrom.includes(email)) return;
      const date = v.getLastMessageDate().toISOString();
      if (date <= after) return;
      emails.push(v);
    });
    if (threads.length == max) {
      runQuery_(start + max, max);
    }
  };
  runQuery_(start, max);
  return emails;
}

function createResponseMessage_(prompt, apiKey) {
  const request = createOpenaiPromptRequest_(
    prompt,
    CHAT_GPT.MODEL,
    CHAT_GPT.TEMPERATURE,
    apiKey,
  );
  const [response] = UrlFetchApp.fetchAll([request]);
  const result = JSON.parse(response.getContentText());
  if (result?.error?.message) {
    throw new Error(result.error.message);
  }
  return getFirstChoice_(result);
}

function getFirstChoice_({ choices, candidates }) {
  if (choices) {
    return choices[0]?.message?.content;
  }
  if (candidates) {
    return candidates[0]?.content;
  }
  return "No response";
}

function createOpenaiPromptRequest_(
  prompt,
  model = CHAT_GPT.MODEL,
  temperature = CHAT_GPT.TEMPERATURE,
  apiKey,
) {
  const payload = {
    model,
    temperature,
    messages: [{ role: "user", content: prompt }],
  };

  return {
    url: CHAT_GPT.ENDPOINT,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    muteHttpExceptions: true,
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };
}

/**
 * @param {GmailApp.GmailThread} thread
 */
function createReply_(
  thread,
  { query, prompt, messages, replyAll, replyInDraft },
  settings,
) {
  let start = -1;
  if (messages === "All") {
    start = 0;
  } else if (typeof messages !== "number" || messages <= 0) {
    start = -1;
  } else {
    start = messages * -1;
  }
  const items = thread.getMessages();
  const message = items.at(-1);

  const contents = items
    .slice(start)
    .map((v) => v.getPlainBody())
    .join("\n");
  const rowValues = [query, thread.getId(), thread.getFirstMessageSubject()];

  let body = null;

  try {
    body = createResponseMessage_(
      [
        prompt
          ? `My name is ${settings.name}. ${prompt}`
          : `My name is ${settings.name}, create a reply email according to the messages below:`,
        contents,
      ].join("\n"),
      settings.apiKey,
    );
  } catch (err) {
    return settings.sheetLogs.appendRow([
      ...rowValues,
      err.message,
      "Error",
      new Date(),
    ]);
  }

  rowValues.push(body);

  if (replyInDraft) {
    message.createDraftReply(body);
    rowValues.push("Draft Reply Created");
  } else if (replyAll) {
    message.replyAll(body);
    rowValues.push("Replied All");
  } else {
    message.reply(body);
    rowValues.push("Replied");
  }
  rowValues.push(new Date());
  settings.sheetLogs.appendRow(rowValues);
}

const processRule_ = (rule, settings) => {
  const threads = getNewEmails_(rule.query, settings.after);
  threads.forEach((thread) => createReply_(thread, rule, settings));
};

const run_ = () => {
  const settings = getSettings_();
  settings.sheetLogs = _getSheetByName_()(CONFIG.SHEET_NAME.LOGS, true);
  const now = new Date();
  getRules_().forEach((rule) => processRule_(rule, settings));
  _setProps_()({ [CONFIG.KEY.AFTER]: now.toISOString() });
};

const fnRun = () => _try_(run_);

const triggerRun = () => _try_(run_);
