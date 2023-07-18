function getFormula() {
  const sheet = SpreadsheetApp.getActive().getSheetByName("YouTube");
  console.log(sheet.getRange("C12").getFormulaR1C1());
}

function parseSubtitles_(values) {
  const data = {};
  const columns = values[0].length;
  for (let c = 0; c < columns; c++) {
    const language = values[0][c];
    if (!language) continue;
    const languageId = values[0 + 2][c];
    if (!languageId) continue;
    const title = values[0 + 4][c];
    if (!title) continue;
    const description = values[0 + 6][c];
    data[language] = {};
    data[language][languageId] = {
      title,
      description,
    };
  }
  return data;
}

function parseVideoId_(url) {
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1].split("&")[0];
  }
  if (url.includes("/video/")) {
    return url.split("/video/")[1].split("/")[0];
  }
  if (url.includes("/shorts/")) {
    return url.split("/shorts/")[1].split("/")[0];
  }
  if (url.includes("/youtu.be/")) {
    return url.split("/youtu.be/")[1].split("/")[0];
  }
  return url;
}

function getVideoInfo_() {
  const ss = SpreadsheetApp.getActive();
  const RN = CONFIG.RANGE_NAME;
  const id = parseVideoId_(ss.getRange(RN.VIDEO).getDisplayValue());
  const defaultLanguage = ss.getRange(RN.DEFAULT_LANGUAGE).getDisplayValue();
  const categoryId = ss.getRange(RN.CATEGORY_ID).getDisplayValue();
  const subtitles = parseSubtitles_(
    ss.getRange(RN.SUBTITLES).getDisplayValues()
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
  const RN = CONFIG.RANGE_NAME;
  ss.getRange(RN.CATEGORY_ID).setValue(video.snippet.categoryId);
  const defaultLanguage = languageList[video.snippet.defaultLanguage];
  ss.getRange(RN.DEFAULT_LANGUAGE).setValue(defaultLanguage || null);
  const formula = `=IFERROR(VLOOKUP(R10C[0],languages,2,FALSE),"N/A")`;
  const languageIds = [formula];
  const languages = [defaultLanguage];
  const titles = [video.snippet.title];
  const descriptions = [video.snippet.description];
  if (!video.localizations) {
    languageIds.push(formula);
    languages.push("Chinese (China)");
    titles.push("Chinese title");
    descriptions.push("Chinese description");
  }
  const rangeSubtitles = ss.getRange(RN.SUBTITLES);
  rangeSubtitles.setValue(null);
  const sheet = rangeSubtitles.getSheet();
  const row = rangeSubtitles.getRow();
  const column = rangeSubtitles.getColumn();
  sheet.getRange(row, column, 1, languages.length).setValues([languages]);
  sheet
    .getRange(row + 2, column, 1, languageIds.length)
    .setValues([languageIds]);
  sheet.getRange(row + 4, column, 1, titles.length).setValues([titles]);
  sheet
    .getRange(row + 6, column, 1, descriptions.length)
    .setValues([descriptions]);
  SpreadsheetApp.flush();
}

function fetchSubtitles_() {
  const ss = SpreadsheetApp.getActive();
  const title = CONFIG.ACTION.FETCH_SUBTITLES.CAPTION;
  let msg = null;
  const { id } = getVideoInfo_();
  if (!id) {
    msg = `No video URL or ID in the active cell.`;
    ss.getRange(CONFIG.RANGE_NAME.VIDEO).activate();
    return _alert_(msg, title);
  }
  const part = "id,snippet";
  const video = YouTube.Videos.list(part, { id }).items[0];
  if (!video) {
    msg = `Video with id "${id}" not available or you don't have the access.`;
    return _alert_(msg, title);
  }
  const languages = fetchLanguages_(false);
  updateVideoInfo_(video, languages);
}

function updateSubtitles_() {
  const title = CONFIG.ACTION.UPDATE_SUBTITLES.CAPTION;
  const vedio = getVideoInfo_();
  console.log(vedio);
  const defaultLanguage = vedio.subtitles[vedio.defaultLanguage];
  console.log(defaultLanguage);
  const payload = {
    id: "XNxceU899co",
    localizations: {
      "zh-CN": {
        title: "用Chalkline提升你的生产力：数据筛选，自动化流程",
        description: "用Chalkline提升你的生产力：数据筛选，自动化流程",
      },
    },
    snippet: {
      defaultLanguage: "en",
      title:
        "Boost Your Productivity with Chalkline: Data Filtering, Google Forms Automation with Mail Merge",
      categoryId: "27",
      description: "",
    },
  };
}

function fetchLanguages_(updateSheet = true) {
  const key = CONFIG.KEY.LANGUAGE_CACHE;
  const cache = CacheService.getScriptCache();
  const cacheData = cache.get(key);
  console.log(cacheData);
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
