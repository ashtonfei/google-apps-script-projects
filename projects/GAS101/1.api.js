function reverseLanguageList_(list) {
  const data = {};
  Object.entries(list).forEach(([key, value]) => (data[value] = key));
  return data;
}

function parseSubtitles_(values, languageList) {
  const data = {};
  const reversedLanguageList = reverseLanguageList_(languageList);
  const columns = values[0].length;
  for (let c = 0; c < columns; c++) {
    const language = values[0][c];
    if (!language) continue;
    const title = values[0 + 2][c];
    if (!title) continue;
    const description = values[0 + 4][c];
    data[language] = {};
    data[language][reversedLanguageList[language]] = {
      title,
      description,
    };
  }
  return data;
}

function parseVideoId_(url) {
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1].split(/[\/\&\?]/)[0];
  }
  if (url.includes("/video/")) {
    return url.split("/video/")[1].split(/[\/\&\?]/)[0];
  }
  if (url.includes("/shorts/")) {
    return url.split("/shorts/")[1].split(/[\/\&\?]/)[0];
  }
  if (url.includes("/youtu.be/")) {
    return url.split("/youtu.be/")[1].split(/[\/\&\?]/)[0];
  }
  return url;
}

function getVideoInfo_(languageList) {
  const ss = SpreadsheetApp.getActive();
  const RN = CONFIG.RANGE_NAME;
  const id = parseVideoId_(ss.getRange(RN.VIDEO).getDisplayValue());
  const defaultLanguage = ss.getRange(RN.DEFAULT_LANGUAGE).getDisplayValue();
  const categoryId = ss.getRange(RN.CATEGORY_ID).getDisplayValue();
  const subtitles = parseSubtitles_(
    ss.getRange(RN.SUBTITLES).getDisplayValues(),
    languageList
  );
  return {
    id,
    defaultLanguage,
    categoryId,
    subtitles,
  };
}

/**
 * @param {GoogleAppsScript.YouTube.Schema.Video} video
 */
function updateVideoInfo_(video, languageList) {
  const ss = SpreadsheetApp.getActive();
  let { subtitleLanguages } = _getSettings_();
  subtitleLanguages = subtitleLanguages
    .trim()
    .split(/\s*,\s*/)
    .filter((v) => v);
  if (subtitleLanguages.length === 0) {
    subtitleLanguages = ["English", "Spanish", "Chinese"];
  }

  const RN = CONFIG.RANGE_NAME;
  ss.getRange(RN.CATEGORY_ID).setValue(video.snippet.categoryId);

  const defaultLanguage =
    languageList[video.snippet.defaultLanguage] || subtitleLanguages[0];
  ss.getRange(RN.DEFAULT_LANGUAGE).setValue(defaultLanguage || null);

  const languages = [defaultLanguage];
  const titles = [video.snippet.title];
  const descriptions = [video.snippet.description];
  subtitleLanguages = subtitleLanguages.filter((v) => v !== defaultLanguage);

  if (video.localizations) {
    const keys = Object.keys(video.localizations);
    keys.sort().forEach((key) => {
      if (key == video.snippet.defaultLanguage) {
        return;
      }
      languages.push(languageList[key]);
      titles.push(video.localizations[key].title);
      descriptions.push(video.localizations[key].description);
      subtitleLanguages = subtitleLanguages.filter(
        (v) => v !== languageList[key]
      );
    });
  }
  if (subtitleLanguages.length) {
    subtitleLanguages.forEach((v) => {
      languages.push(v);
      titles.push(null);
      descriptions.push(null);
    });
  }

  const rangeSubtitles = ss.getRange(RN.SUBTITLES);
  rangeSubtitles.setValue(null);

  const sheet = rangeSubtitles.getSheet();
  const row = rangeSubtitles.getRow();
  const column = rangeSubtitles.getColumn();
  sheet.getRange(row, column, 1, languages.length).setValues([languages]);
  sheet.getRange(row + 2, column, 1, titles.length).setValues([titles]);
  sheet
    .getRange(row + 4, column, 1, descriptions.length)
    .setValues([descriptions]);
  SpreadsheetApp.flush();
}

function fetchSubtitles_() {
  const ss = SpreadsheetApp.getActive();
  const title = CONFIG.ACTION.FETCH_SUBTITLES.CAPTION;
  let msg = null;
  const id = parseVideoId_(
    ss.getRange(CONFIG.RANGE_NAME.VIDEO).getDisplayValue()
  );
  if (!id) {
    msg = `No video URL or ID in the active cell.`;
    ss.getRange(CONFIG.RANGE_NAME.VIDEO).activate();
    return _alert_(msg, title);
  }
  const part = "id,snippet,localizations";
  const video = YouTube.Videos.list(part, { id }).items[0];
  if (!video) {
    msg = `Video with id "${id}" not available or you don't have the access.`;
    return _alert_(msg, title);
  }
  const languageList = fetchLanguages_(false);
  updateVideoInfo_(video, languageList);
  msg = "Video subtitles have been fetched.";
  return _toast_(msg, title);
}

function updateSubtitles_() {
  const title = CONFIG.ACTION.UPDATE_SUBTITLES.CAPTION;
  let msg = null;
  const languageList = fetchLanguages_(false);
  const video = getVideoInfo_(languageList);
  let defaultLanguage = video.subtitles[video.defaultLanguage];
  let localizations = {};
  Object.entries(video.subtitles).forEach(([key, value]) => {
    localizations = {
      ...localizations,
      ...JSON.parse(JSON.stringify(value)),
    };
    if (key == video.defaultLanguage) {
      const languageId = Object.keys(defaultLanguage)[0];
      defaultLanguage = defaultLanguage[languageId];
      defaultLanguage.id = languageId;
    }
  });

  const payload = {
    id: video.id,
    localizations,
    snippet: {
      defaultLanguage: defaultLanguage.id,
      title: defaultLanguage.title,
      categoryId: video.categoryId,
      description: defaultLanguage.description,
    },
  };
  const part = "id,snippet,localizations";
  YouTube.Videos.update(payload, part);
  msg = `Subtitles have been updated.`;
  _toast_(msg, title);
}

function fetchLanguages_(updateSheet = true) {
  const key = CONFIG.KEY.LANGUAGE_CACHE;
  const cache = CacheService.getScriptCache();
  const cacheData = cache.get(key);
  let data = {};
  if (!cacheData || updateSheet === true) {
    const part = "snippet";
    YouTube.I18nLanguages.list(part).items.forEach((item) => {
      data[item.id] = item.snippet.name;
    });
    cache.put(key, JSON.stringify(data), 6 * 60 * 60);
  } else {
    data = JSON.parse(cacheData);
  }

  data["zh"] = data["zh"] || "Chinese";
  data["zh-Hant"] = data["zh-Hant"] || "Chinese (Traditional)";

  if (updateSheet === true) {
    const values = [["name", "id"]];
    for (let key in data) {
      values.push([data[key], key]);
    }
    const sheet = SpreadsheetApp.getActive()
      .getRange(CONFIG.RANGE_NAME.LANGUAGES)
      .getSheet();
    _valuesToSheet_(values, sheet, 1, 1, true, false);
    sheet.activate();
  }
  return data;
}

function googleTranslate_() {
  const ss = SpreadsheetApp.getActive();
  const rangeSubtitles = ss.getRange(CONFIG.RANGE_NAME.SUBTITLES);
  const values = rangeSubtitles.getDisplayValues();
  const formula = `=GOOGLETRANSLATE(R[0]C3,VLOOKUP(R10C3,languages,2,0),VLOOKUP(R10C[0],languages,2,0))`;
  for (let i = 0; i < values[0].length; i++) {
    if (i === 0) continue;
    const language = values[0][i];
    if (!language) continue;
    values[2][i] === "" && (values[2][i] = formula);
    values[4][i] === "" && (values[4][i] = formula);
  }
  rangeSubtitles.setValues(values);
  SpreadsheetApp.flush();
}

function test() {
  console.log(
    SpreadsheetApp.getActive()
      .getSheetByName("YouTube")
      .getRange("D12")
      .getFormulaR1C1()
  );
}
