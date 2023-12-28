const CONFIG = {
  NAME: "GAS103",
  VERSION: "1.0.1",
  SHEET_NAME: "Files",
  WATCH_FOLDER_ID: "1X87CJq4NE-2r4rN-8hm_EHPx5Cus9V7f",
  KEY: {
    LAST_RUN_AT: "lastRunAt",
    INSTALLED: "installed",
  },
  STATUS: {
    TRASHED: "Trashed",
    CREATED: "Created",
    MODIFIED: "Modified",
  },
  FIELDS: [
    "id",
    "name",
    "mimeType",
    "createdTime",
    "modifiedTime",
    "trashed",
    "shared",
    "webViewLink",
    "webContentLink",
    "size",
    "driveId",
  ],
  HEADERS: [
    { key: "name", value: "Name" },
    { key: "id", value: "ID" },
    { key: "mimeType", value: "MimeType" },
    { key: "size", value: "Size" },
    { key: "_status", value: "Status" },
    { key: "modifiedTime", value: "Modified At" },
    { key: "createdTime", value: "Created At" },
    { key: "trashed", value: "Trashed" },
    { key: "shared", value: "Shared" },
    { key: "webViewLink", value: "Web View Link" },
    { key: "webContentLink", value: "Web Content Link" },
  ],
  ACTION: {
    GET_ALL_FILES: {
      CAPTION: "Get all files",
      ACTION: "actionGetAllFiles",
    },
    GET_UPDATED_FILES: {
      CAPTION: "Get updated files",
      ACTION: "actionGetUpdatedFiles",
      TRIGGER: "triggerGetUpdatedFiles",
      RUN_EVERY_MINUTE: 1, // valid values 1, 5, 10, 15, 30
    },
    INSTALL: {
      CAPTION: "Install trigger",
      ACTION: "actionInstallTrigger",
    },
    UNINSTALL: {
      CAPTION: "Uninstall trigger",
      ACTION: "actionUninstallTrigger",
    },
  },
};
