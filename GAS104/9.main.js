const MENU = {
  FETCH_SCRIPTS: {
    caption: "Fetch scripts",
    fn: "fnFetchScripts",
  },
  COPY_SCRIPTS: {
    caption: "Copy scripts",
    fn: "fnCopyScripts",
  },
};
const RN = {
  FROM: "startFrom",
  TO: "startTo",
  SCRIPT_ID: "scriptId",
};

const CONFIG = {
  NAME: "GAS104",
  MENU,
};

const getAccessToken_ = () => ScriptApp.getOAuthToken();

const createRequest_ = (
  url,
  method = "GET",
  token = getAccessToken_(),
  payload = null,
) => {
  const request = {
    url,
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    contentType: "application/json",
    muteHttpExceptions: true,
  };
  if (payload) {
    request.payload = JSON.stringify(payload);
  }
  return request;
};

const processRequests_ = (requests) => {
  return UrlFetchApp.fetchAll(requests).map((res) => {
    const result = JSON.parse(res.getContentText());
    const code = res.getResponseCode();
    if (code != 200) {
      const error = `${code}: ${result?.error?.message}`;
      throw new Error(error);
    }
    return result;
  });
};

const getScriptFilesById_ = (scriptId = ScriptApp.getScriptId()) => {
  const urlMeta = `https://script.googleapis.com/v1/projects/${scriptId}`;
  const urlContent =
    `https://script.googleapis.com/v1/projects/${scriptId}/content`;
  const requests = [createRequest_(urlMeta), createRequest_(urlContent)];
  const [file, { files }] = processRequests_(requests);
  return { ...file, files };
};

const getAllScriptProjects_ = () => {
  const api = "https://www.googleapis.com/drive/v3/files";
  const q = "mimeType = 'application/vnd.google-apps.script'";
  let projects = [];
  const runQuery = (pageToken) => {
    const url = pageToken
      ? `${api}?q=${q}&pageToken=${pageToken}`
      : `${api}?q=${q}`;
    const request = createRequest_(url);
    console.log(request);
    const { nextPageToken, files } = processRequests_([request])[0];
    projects = [...projects, ...files];
    if (nextPageToken) {
      runQuery(nextPageToken);
    }
  };
  runQuery();
  return projects;
};

const getScriptContainers_ = (projects) => {
  const token = getAccessToken_();
  const requests = projects.map(({ id }) => {
    const url = `https://script.googleapis.com/v1/projects/${id}`;
    return createRequest_(url, "GET", token);
  });
  return processRequests_(requests);
};

const createProject_ = (title, parentId, token) => {
  const payload = { title, parentId };
  const url = "https://script.googleapis.com/v1/projects";
  const request = createRequest_(url, "POST", token, payload);
  console.log(payload);
  console.log(request);
  return processRequests_([request])[0];
};

const copyToFile_ = ({ scriptId, parentId, title }, files, token) => {
  if (!scriptId) {
    scriptId = createProject_(title, parentId, token).scriptId;
  }
  const url = `https://script.googleapis.com/v1/projects/${scriptId}/content`;
  const request = createRequest_(url, "PUT", token, { files });
  console.log(request);
  return processRequests_([request])[0];
};

const getScriptId_ = (ss, rangeName = RN.SCRIPT_ID) => {
  const range = ss.getRange(rangeName);
  return _getIdFromUrl_(range.getValue());
};

const fetchScripts_ = () => {
  const success = _createAlert_("Success");
  const error = _createAlert_("Error");
  const ss = SpreadsheetApp.getActive();
  const scriptId = getScriptId_(ss, RN.SCRIPT_ID);
  if (!scriptId) {
    return error("No script to be fetched.");
  }

  const { files } = getScriptFilesById_(scriptId);
  const values = files.map(({ name, type }) => [name, type, true]);
  values.unshift(["File Name", "File Type", "Selected"]);
  const startRange = ss.getRange(RN.FROM);
  startRange.getDataRegion().clearContent();
  const sheet = startRange.getSheet();

  _valuesToSheet_(sheet)(values, startRange.getRow(), startRange.getColumn());
  SpreadsheetApp.flush();
  success(
    "All scripts in the project has been fetched, you can now select the files to be copied to the target files.",
  );
};

const copyScripts_ = () => {
  const success = _createAlert_("Success");
  const error = _createAlert_("Error");
  const ss = SpreadsheetApp.getActive();

  const scriptId = getScriptId_(ss, RN.SCRIPT_ID);
  if (!scriptId) {
    return error("No script to be copied from.");
  }

  const fromValues = ss.getRange(RN.FROM).getDataRegion().getValues();
  const selectedFiles = fromValues
    .filter((v) => v[2] === true)
    .map((v) => v[0]);
  if (selectedFiles.length === 0) {
    return error("You didn't select any file to copy.");
  }
  const rangeTo = ss.getRange(RN.TO);
  const valuesTo = rangeTo.getDataRegion().getValues();
  const targetFiles = valuesTo
    .slice(1)
    .map(([url, scriptId, updatedAt, status]) => {
      const parentId = _getIdFromUrl_(url);
      return {
        parentId,
        url,
        scriptId,
        status,
        updatedAt,
      };
    });
  const filter = (file) =>
    file.name == "appsscript" || selectedFiles.includes(file.name);
  const { files, title } = getScriptFilesById_(scriptId);
  const filteredFiles = files.filter(filter);

  // const updatedValues = [["URL", "Script ID", "Updated At", "Status"]];
  const token = getAccessToken_();
  const dataRegionTo = rangeTo.getDataRegion();
  const updateScriptId = _updateCell_(dataRegionTo, 2);
  const updateUpdatedAt = _updateCell_(dataRegionTo, 3);
  const updateStatus = _updateCell_(dataRegionTo, 4);
  targetFiles.forEach((file, index) => {
    file.title = title;
    const row = index + 2;
    updateUpdatedAt(row, null);
    updateStatus(row, "Copying");
    SpreadsheetApp.flush();
    try {
      const { scriptId } = copyToFile_(file, filteredFiles, token);
      updateScriptId(row, scriptId);
      updateUpdatedAt(row, new Date());
      updateStatus(row, "Success");
    } catch (err) {
      updateUpdatedAt(row, new Date());
      updateStatus(row, err.message);
    }
  });
  SpreadsheetApp.flush();
  success("Script copy request has been completed.");
};

const fnFetchScripts = () => _action_(fetchScripts_);
const fnCopyScripts = () => _action_(copyScripts_);
