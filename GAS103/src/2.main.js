const createQuery_ = (folderId) => (startTime) => {
  if (!startTime) {
    return `'${folderId}' in parents`;
  }
  return `'${folderId}' in parents and (createdTime >= '${startTime}' or modifiedTime >= '${startTime}')`;
};

const createFields_ = (fields) => {
  return ["nextPageToken", `files(${fields.join(",")})`].join(",");
};

const addFileStatus_ = (file) => {
  const { modifiedTime, createdTime, trashed } = file;
  if (trashed) return (file._status = CONFIG.STATUS.TRASHED);
  if (!modifiedTime || !createdTime) return (file._status = null);
  return (file._status = createdTime >= modifiedTime
    ? CONFIG.STATUS.CREATED
    : CONFIG.STATUS.MODIFIED);
};

const getLastRunAt_ = (key = CONFIG.KEY.LAST_RUN_AT) =>
  _getProperty_(PropertiesService.getDocumentProperties())(key);

const setLastRunAt_ = (timestamp, key = CONFIG.KEY.LAST_RUN_AT) =>
  _setProperty_(PropertiesService.getDocumentProperties())(key, timestamp);

const getFolder_ = (id = CONFIG.WATCH_FOLDER_ID) => {
  if (!id) {
    throw new Error(`No watch folder id in the config.`);
  }
  return DriveApp.getFolderById(id);
};

const runQuery_ = (values = []) => (query, fields, pageToken) => {
  const options = {
    q: query,
    fields,
    supportsAllDrives: true, // for shared drives
    includeItemsFromAllDrives: true, // for shared drives
  };
  if (pageToken) {
    options.pageToken = pageToken;
  }

  const { files, nextPageToken } = Drive.Files.list(options);
  values = [...values, ...files];
  if (!nextPageToken) return values;
  return runQuery_(values)(query, fields, nextPageToken);
};

const getFiles_ = (folderId) => (startTime) => {
  const query = createQuery_(folderId)(startTime);
  const fields = createFields_(CONFIG.FIELDS);
  const files = [];
  return runQuery_(files)(query, fields);
};

const getTrashedFiles_ = (folderId) => {
  const query = `'${folderId}' in parents and trashed = true`;
  const fields = createFields_(CONFIG.FIELDS);
  const files = [];
  return runQuery_(files)(query, fields);
};

const getUpdatedFiles_ = (folder) => {
  const folderId = folder.getId();
  const startTime = getLastRunAt_();
  const { headers, keys } = _getHeaders_(CONFIG.HEADERS);
  const createRowValues = _createRowValues_(keys);
  const now = new Date().toISOString();
  setLastRunAt_(now);
  let files = getFiles_(folderId)(startTime);
  const trashedFiles = getTrashedFiles_(folderId);
  const values = [...files, ...trashedFiles].map((file) => {
    addFileStatus_(file);
    return createRowValues(file);
  });
  const sheet = _getSheetByName_()(CONFIG.SHEET_NAME, true);
  const currentValues = sheet.getDataRange().getValues().slice(1);
  _valuesToSheet_(sheet)([headers, ...values, ...currentValues]);
  const indexOfIdColumn = CONFIG.HEADERS.findIndex((v) => v.key == "id") + 1;
  if (!indexOfIdColumn) {
    return;
  }
  sheet.getDataRange().removeDuplicates([indexOfIdColumn]);
};

const getAllFiles_ = (folder) => {
  setLastRunAt_("");
  const sheet = _getSheetByName_()(CONFIG.SHEET_NAME, true);
  sheet.clearContents();
  getUpdatedFiles_(folder);
};

const actionGetAllFiles = () => {
  const fn = () => {
    const title = CONFIG.ACTION.GET_ALL_FILES.CAPTION;
    const confirm = _createConfirm_(title);
    const ui = _getUi_();
    const folder = getFolder_();
    const msg =
      `Are you sure to get all files from this folder below the spreadsheet?
    Name: ${folder.getName()}
    URL: ${folder.getUrl()}`;
    if (ui.Button.YES !== confirm(msg)) {
      return;
    }
    getAllFiles_(folder);
  };
  _action_(fn);
};

const actionGetUpdatedFiles = () => {
  const fn = () => {
    const title = CONFIG.ACTION.GET_UPDATED_FILES.CAPTION;
    const confirm = _createConfirm_(title);
    const ui = _getUi_();
    const folder = getFolder_();
    const msg =
      `Are you sure to get all updated(new) files from this folder below the spreadsheet?
    Name: ${folder.getName()}
    URL: ${folder.getUrl()}`;
    if (ui.Button.YES !== confirm(msg)) {
      return;
    }
    getUpdatedFiles_(folder);
  };
  _action_(fn);
};

const triggerGetUpdatedFiles = () => {
  const folder = getFolder_();
  getUpdatedFiles_(folder);
};

const deleteAllTriggers_ = (fn = CONFIG.ACTION.GET_UPDATED_FILES.TRIGGER) => {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (fn == t.getHandlerFunction()) ScriptApp.deleteTrigger(t);
  });
};

const actionInstallTrigger = () => {
  const fn = () => {
    const title = CONFIG.ACTION.INSTALL.CAPTION;
    const ui = _getUi_();
    const confirm = _createConfirm_(title);
    const runEveryMinute = CONFIG.ACTION.GET_UPDATED_FILES.RUN_EVERY_MINUTE ||
      1;
    const msg =
      `Are you sure to install a trigger to watch the updates in the folder every ${runEveryMinute} ${
        runEveryMinute == 1 ? "min" : "mins"
      }?`;
    if (ui.Button.YES !== confirm(msg)) return;
    deleteAllTriggers_();
    ScriptApp.newTrigger(CONFIG.ACTION.GET_UPDATED_FILES.TRIGGER)
      .timeBased()
      .everyMinutes(runEveryMinute)
      .create();
    const key = CONFIG.KEY.INSTALLED;
    const user = Session.getActiveUser().getEmail();
    _setProperty_(PropertiesService.getDocumentProperties())(key, user);
    createMenu_();
    _createAlert_("Success")("Trigger has been installed.");
  };
  _action_(fn);
};

const actionUninstallTrigger = () => {
  const fn = () => {
    const title = CONFIG.ACTION.UNINSTALL.CAPTION;
    const ui = _getUi_();
    const docProps = PropertiesService.getDocumentProperties();
    const key = CONFIG.KEY.INSTALLED;
    const user = Session.getActiveUser().getEmail();
    const warning = _createAlert_("Warning");
    const installed = _getProperty_(docProps)(key);
    if (user !== installed) {
      return warning(
        `You are not able to uninstall the trigger installed by ${user}.`,
      );
    }
    const confirm = _createConfirm_(title);
    const msg =
      `Are you sure to uninstall the trigger to watch the updates in the folder?`;
    if (ui.Button.YES !== confirm(msg)) return;
    deleteAllTriggers_();
    _setProperty_(PropertiesService.getDocumentProperties())(key, "");
    createMenu_();
    _createAlert_("Success")("Trigger has been uninstalled.");
  };
  _action_(fn);
};

const createMenu_ = (name = CONFIG.NAME) => {
  const ui = _getUi_();
  const menu = ui.createMenu(name);
  const installed = _getProperty_(PropertiesService.getDocumentProperties())(
    CONFIG.KEY.INSTALLED,
  );
  menu.addItem(
    CONFIG.ACTION.GET_ALL_FILES.CAPTION,
    CONFIG.ACTION.GET_ALL_FILES.ACTION,
  );
  menu.addItem(
    CONFIG.ACTION.GET_UPDATED_FILES.CAPTION,
    CONFIG.ACTION.GET_UPDATED_FILES.ACTION,
  );
  menu.addSeparator();
  if (installed) {
    menu.addItem(
      CONFIG.ACTION.UNINSTALL.CAPTION,
      CONFIG.ACTION.UNINSTALL.ACTION,
    );
  } else {
    menu.addItem(CONFIG.ACTION.INSTALL.CAPTION, CONFIG.ACTION.INSTALL.ACTION);
  }
  menu.addToUi();
};

const onOpen = () => {
  createMenu_();
};
