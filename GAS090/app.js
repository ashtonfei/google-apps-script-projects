/**
 * APP CONFIGURATION
 */
this.APP = {
  NAME: "Product Entry Form",
  SN: {
    FORM_DATA: "Product",
    RESPONSE: "Products",
  },
  FN: {
    DEFAULT: "Uploads",
  },
};

class Utils {
  constructor(name = APP.NAME) {
    this.name = name;
    this.ss = SpreadsheetApp.getActive();
  }

  toPascalCase(text) {
    const value = text.toString().toLowerCase();
    const words = value.split(/\s+/).filter((v) => v !== "");
    return words.map((v) => v.slice(0, 1).toUpperCase() + v.slice(1)).join("");
  }

  toCamelCase(text) {
    const pascalCase = this.toPascalCase(text);
    return pascalCase.slice(0, 1).toLowerCase() + pascalCase.slice(1);
  }

  toast(message, timeoutSeconds = 15) {
    return this.ss.toast(message, this.name, timeoutSeconds);
  }

  alert(message, type = "warning") {
    const ui = SpreadsheetApp.getUi();
    const title = `${this.name} [${type}]`;
    return ui.alert(title, message, ui.ButtonSet.OK);
  }

  confirm(message) {
    const ui = SpreadsheetApp.getUi();
    const title = `${this.name} [confirm]`;
    return ui.alert(title, message, ui.ButtonSet.YES_NO);
  }

  createKeys(headers, useCamelCase = true) {
    return headers.map((header) => {
      header = header.replace(/[^a-zA-Z0-9\s]+/gi, "");
      return useCamelCase
        ? this.toCamelCase(header)
        : this.toPascalCase(header);
    });
  }

  createItemObject(keys, values) {
    const item = {};
    keys.forEach((key, index) => (item[key] = values[index]));
    return item;
  }

  getDataFromSheetByName(name) {
    const ws = this.ss.getSheetByName(name);
    if (!ws) return;
    const [headers, ...records] = ws.getDataRange().getValues();
    const keys = this.createKeys(headers);
    return records.map((record, index) => {
      const item = this.createItemObject(keys, record);
      item["rowIndex"] = index + 2;
      return item;
    });
  }

  getCurrentFolder() {
    const id = this.ss.getId();
    const parents = DriveApp.getFileById(id).getParents();
    if (parents.hasNext()) return parents.next();
    return DriveApp.getRootFolder();
  }

  getFolderByName(parentFolder, name, createIfNotFound = true) {
    const folders = parentFolder.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    if (createIfNotFound) return parentFolder.createFolder(name);
  }
}

/**
 * App Class
 */
class App {
  constructor() {
    this.ss = SpreadsheetApp.getActive();
    this.name = APP.NAME;
    this.user = Session.getActiveUser().getEmail();
  }

  /**
   *
   * @param {Object} e On Spreadsheet Open Event Object
   */
  onOpen(e) {
    const ui = SpreadsheetApp.getUi();
    const menu = ui.createMenu(APP.NAME);
    menu.addItem("Run", "run");
    menu.addToUi();
  }

  createHtmlContent() {
    const formData = _utils.getDataFromSheetByName(APP.SN.FORM_DATA);
    const template = HtmlService.createTemplateFromFile("html/dialog.html");
    template.formData = formData;
    template.name = this.name;
    template.user = this.user;
    return template
      .evaluate()
      .setTitle(APP.NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  run() {
    const htmlOuput = this.createHtmlContent();
    SpreadsheetApp.getUi().showSidebar(htmlOuput);
  }

  doGet() {
    return this.createHtmlContent();
  }

  createFiles({ files, folderId }) {
    let folder = null;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (error) {
      const currentFolder = _utils.getCurrentFolder();
      folder = _utils.getFolderByName(currentFolder, APP.FN.DEFAULT);
    }
    return files.map(({ data, name, type }) => {
      const decodedData = Utilities.base64Decode(data.split("base64,")[1]);
      const blob = Utilities.newBlob(decodedData);
      blob.setName(name).setContentType(type);
      return folder.createFile(blob);
    });
  }

  submit(payload) {
    const headers = ["Timestamp", "UUID", "Created By"];
    const uuid = Utilities.getUuid();
    const values = [new Date(), uuid, this.user];
    payload.forEach((item) => {
      headers.push(item.label);
      if (item.type === "file") {
        const files = this.createFiles(item);
        values.push(files.map((v) => v.getUrl()).join("\n"));
      } else {
        if (Array.isArray(item.default)) {
          values.push(JSON.stringify(item.default));
        } else {
          values.push(item.default);
        }
      }
    });
    const ws =
      this.ss.getSheetByName(APP.SN.RESPONSE) ||
      this.ss.insertSheet(APP.SN.RESPONSE);
    ws.getRange(1, 1, 1, headers.length).setValues([headers]);
    const lastRow = ws.getLastRow();
    ws.getRange(lastRow + 1, 1, 1, values.length).setValues([values]);
    return `Item ${uuid} has been created!`;
  }
}

this._utils = new Utils();
this._app = new App();

const onOpen = (e) => _app.onOpen(e);
const run = () => _app.run();
const doGet = (e) => _app.doGet(e);

const submit = (payload) => _app.submit(JSON.parse(payload));
