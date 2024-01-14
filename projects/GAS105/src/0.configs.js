const MENU = {
  RUN: {
    caption: "Run",
    fn: "fnRun",
    trigger: "triggerRun",
  },
  ADD_SAMPLE_RULE: {
    caption: "Add sample rule",
    fn: "fnAddSampleRule",
  },
  SETUP: {
    caption: "Setup",
    fn: "fnSetup",
  },
  RESET: {
    caption: "Reset",
    fn: "fnReset",
  },
  VERSION: {
    caption: "Version",
    fn: "fnVersion",
  },
};

const CHAT_GPT = {
  ENDPOINT: "https://api.openai.com/v1/chat/completions",
  MODEL: "gpt-3.5-turbo", // default model to use
  TEMPERATURE: 1, // default temperature What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
};

const CONFIG = {
  NAME: "GAS105",
  SHEET_NAME: { RULES: "Rules", LOGS: "Logs" },
  KEY: {
    NAME: "name",
    API_KEY: "apiKey",
    INTERVAL: "interval",
    INSTALLED: "installed",
    AFTER: "after",
  },
  INTERVALS: ["1", "5", "10", "15", "30"],
};
