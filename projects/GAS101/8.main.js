const CONFIG = {
  NAME: "YT subtitles",
  VERSION: "1.00",
  ACTION: {
    FETCH_SUBTITLES: {
      ACTION: "actionFetchSubtitles",
      CAPTION: "Fetch subtitles",
    },
    UPDATE_SUBTITLES: {
      ACTION: "actionUpdateSubtitles",
      CAPTION: "Update subtitles",
    },
    FETCH_LANGUAGES: {
      ACTION: "actionFetchLanguages",
      CAPTION: "Fetch languages",
    },
    GOOGLE_TRANSLATE: {
      ACTION: "actionGoogleTranslate",
      CAPTION: "Google translate",
    },
    VERSIONS: {
      ACTION: "actionShowVersions",
      CAPTION: "Versions",
    },
  },
  RANGE_NAME: {
    VIDEO: "video",
    DEFAULT_LANGUAGE: "defaultLanguage",
    CATEGORY_ID: "categoryID",
    SUBTITLES: "subtitles",
    LANGUAGES: "languages",
  },
  KEY: {
    LANGUAGE_CACHE: "languageCache",
  },
};

function onOpen() {
  const title = CONFIG.NAME;
  const ui = _getUi_();
  const menu = ui.createMenu(title);
  menu.addItem(
    CONFIG.ACTION.FETCH_LANGUAGES.CAPTION,
    CONFIG.ACTION.FETCH_LANGUAGES.ACTION
  );
  menu.addItem(CONFIG.ACTION.VERSIONS.CAPTION, CONFIG.ACTION.VERSIONS.ACTION);
  menu.addToUi();
  _showUpdates_(REVISIONS, title);
}

function actionFetchSubtitles() {
  _tryAction_(fetchSubtitles_, CONFIG.ACTION.FETCH_SUBTITLES.CAPTION);
}

function actionUpdateSubtitles() {
  _tryAction_(updateSubtitles_, CONFIG.ACTION.UPDATE_SUBTITLES.CAPTION);
}

function actionFetchLanguages() {
  _tryAction_(fetchLanguages_, CONFIG.ACTION.FETCH_LANGUAGES.CAPTION);
}

function actionGoogleTranslate() {
  _tryAction_(googleTranslate_, CONFIG.ACTION.GOOGLE_TRANSLATE.CAPTION);
}

function actionShowVersions() {
  _tryAction_(() => _showVersions_(REVISIONS), CONFIG.ACTION.VERSIONS.CAPTION);
}
