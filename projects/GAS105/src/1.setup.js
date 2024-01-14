const required_ = (v) => !!v || "This is required";
const validateApiKey_ = (key) => {
  const request = createOpenaiPromptRequest_(
    "Hello world",
    CHAT_GPT.MODEL,
    CHAT_GPT.TEMPERATURE,
    key,
  );
  const [response] = UrlFetchApp.fetchAll([request]);
  const result = JSON.parse(response.getContentText());
  return result?.error?.message || true;
};

const validateInterval_ = (v) =>
  CONFIG.INTERVALS.includes(v) ||
  `Invalid interval value, select one from ${CONFIG.INTERVALS.join(", ")}`;

const INPUT_ITEMS = [
  {
    title: "Name",
    key: CONFIG.KEY.NAME,
    msg: "Enter your name for the email signature:",
    rules: [required_],
  },
  {
    title: "Interval",
    key: CONFIG.KEY.INTERVAL,
    msg: `Enter the interval (mins) to check your Gmail account:\n(Options: ${
      CONFIG.INTERVALS.join(
        ", ",
      )
    })`,
    rules: [required_, validateInterval_],
  },
  {
    title: "API Key",
    key: CONFIG.KEY.API_KEY,
    msg: "Enter your OpenAI API key for creating reply message:",
    rules: [required_, validateApiKey_],
  },
];

const getSettings_ = () => {
  const ps = PropertiesService.getScriptProperties();
  const settings = _getProps_(ps);
  settings[CONFIG.KEY.INTERVAL] = settings[CONFIG.KEY.INTERVAL] * 1;
  return settings;
};

const getUser_ = () => Session.getActiveUser().getEmail();

const deleteTriggers_ = () => {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
};

const createTrigger_ = () => {
  deleteTriggers_();
  const settings = getSettings_();
  const fn = MENU.RUN.trigger;
  ScriptApp.newTrigger(fn)
    .timeBased()
    .everyMinutes(settings[CONFIG.KEY.INTERVAL])
    .create();
  _setProps_()({ [CONFIG.KEY.INSTALLED]: getUser_() });
};

const setup_ = () => {
  let isCancelled = false;
  const settings = {};
  INPUT_ITEMS.forEach(({ title, key, msg, rules }, index) => {
    if (isCancelled) return;
    title = `${title} (${index + 1}/${INPUT_ITEMS.length})`;
    const value = _createInput_(title)(msg)(rules);
    settings[key] = value;
    if (!value) isCancelled = true;
  });
  settings[CONFIG.KEY.AFTER] = new Date().toISOString();
  if (isCancelled) return;
  const ps = PropertiesService.getScriptProperties();
  _setProps_(ps)(settings);
  createTrigger_();
  createMenu_();
  _createAlert_()("Success")(
    "The automation has been setup for creating replies with ChatGPT.",
  );
};

const reset_ = () => {
  const error = _createAlert_()("Error");
  const user = getUser_();
  const { installed } = getSettings_();
  if (!installed) {
    return error("The automation was not setup, no need to reset it.");
  }
  if (user !== installed) {
    return error(
      `You are not able to reset the automation created by ${installed}.`,
    );
  }
  const confirm = _createConfirm_()("Confirm")(
    "Are you sure to reset the automation for creating replies with ChatGPT?",
  );
  if (confirm !== _getUi_().Button.YES) return;
  const ps = PropertiesService.getScriptProperties();
  ps.deleteAllProperties();
  deleteTriggers_();
  createMenu_();
  _createAlert_()("Success")(
    "The automation has been disabled for creating replies with ChatGPT.",
  );
};

const addSampleRule_ = () => {
  const headers = [
    "Gmail Query",
    "ChatGPT Prompt",
    "Messages",
    "Reply All",
    "Reply in Draft",
    "Enabled",
  ];
  const rule = [
    "from:yunjia.fei@gmail.com subject:GAS105",
    "My name is Ashton. Create a reply message according to the the messages below:",
    1,
    false,
    true,
    false,
  ];
  const sheet = _getSheetByName_()(CONFIG.SHEET_NAME.RULES, true);
  sheet.insertRowBefore(2);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, rule.length).setValues([rule]).activate();
};

const fnSetup = () => _try_(setup_);
const fnReset = () => _try_(reset_);

const fnAddSampleRule = () => _try_(addSampleRule_);

const fnVersion = () =>
  _try_(() => {
    const count = 3;
    const lines = [`The latest ${count} versions:`];
    VERSIONS.slice(0, 3).forEach(({ items, date }) => {
      lines.push("");
      lines.push(date.toLocaleDateString());
      items.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
    });
    _createAlert_()(MENU.VERSION.caption)(lines.join("\n"));
  });
