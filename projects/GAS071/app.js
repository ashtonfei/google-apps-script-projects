class App {
  constructor() {
    this.wsDropdowns = SpreadsheetApp.getActive().getSheetByName("Dropdowns");
    this.wsForm = SpreadsheetApp.getActive().getSheetByName("Form");
    this.pageKey = "Question";
    this.responseSheetName = "Form Responses";
    this.sheetName = this.responseSheetName + " (combined)";
    this.uuidHeader = "UUID";

    this.sheet = null;
    this.form = null;
  }

  unlinkForms() {
    SpreadsheetApp.getActive()
      .getSheets()
      .forEach((sheet) => {
        const url = SpreadsheetApp.getActive().getFormUrl();
        if (url) {
          sheet.setName(sheet.getName() + " (unlinked)").setTabColor("#777777");
          FormApp.openByUrl(url).removeDestination();
        }
      });
    this.form = null;
    this.sheet = null;
  }

  getForm() {
    const sheet = SpreadsheetApp.getActive()
      .getSheets()
      .find((sheet) => sheet.getFormUrl());
    if (!sheet) return;
    sheet.setName(this.responseSheetName);
    this.form = FormApp.openByUrl(sheet.getFormUrl());
    this.sheet = sheet;
    return { sheet, form: FormApp.openByUrl(sheet.getFormUrl()) };
  }

  renameResponseSheet() {
    const sheet = SpreadsheetApp.getActive()
      .getSheets()
      .find((sheet) => sheet.getFormUrl());
    if (sheet) sheet.setName(this.responseSheetName);
    this.sheet = sheet;
    return sheet;
  }

  createDropdowns(form) {
    const values = this.wsDropdowns.getDataRange().getValues();
    const items = {};
    const [parentTitle, childTitle] = values.shift();
    values.forEach(([key, value]) => {
      key = key.toString().trim();
      value = value.toString().trim();
      const item = items[key];
      if (item) {
        item.push(value);
      } else {
        items[key] = [value];
      }
    });

    const kidPages = [];
    const parentDropdown = form
      .addListItem()
      .setTitle(parentTitle)
      .setRequired(true);

    const choices = Object.keys(items).map((parent) => {
      const page = form.addPageBreakItem().setTitle(parent);
      form
        .addListItem()
        .setTitle(childTitle)
        .setChoiceValues(items[parent])
        .setRequired(true);
      const choice = parentDropdown.createChoice(parent, page);
      kidPages.push(page);
      return choice;
    });
    parentDropdown.setChoices(choices);
    return kidPages;
  }

  getPageItems(sheet) {
    const values = sheet.getDataRange().getValues();
    values.shift();
    return values.map(([question, helpText, type, required, options]) => {
      required = required === "Yes";
      options = options.split(",").map((item) => item.trim());

      return { question, helpText, type, required, options };
    });
  }

  createPages(form) {
    const pages = [];
    SpreadsheetApp.getActive()
      .getSheets()
      .forEach((sheet) => {
        if (sheet.getRange("A1").getValue() === this.pageKey) {
          const items = this.getPageItems(sheet);
          const page = form.addPageBreakItem().setTitle(sheet.getName());

          items.forEach(({ question, helpText, type, required, options }) => {
            // form = FormApp.getActiveForm()

            let formItem;
            switch (type.toLowerCase().trim()) {
              case "paragraph":
                formItem = form.addParagraphTextItem();
                break;
              case "checkbox":
                formItem = form.addCheckboxItem().setChoiceValues(options);
                break;
              case "radio":
                formItem = form
                  .addMultipleChoiceItem()
                  .setChoiceValues(options);
                break;
              case "dropdown":
                formItem = form.addListItem().setChoiceValues(options);
                break;
              default:
                formItem = form.addTextItem();
                break;
            }
            formItem
              .setTitle(question)
              .setHelpText(helpText)
              .setRequired(required);
          });
          pages.push(page);
        }
      });
    return pages;
  }

  createForm() {
    this.unlinkForms();

    const values = this.wsForm.getDataRange().getValues();
    const title = values[0][1] +
      " - " +
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd hh:mm:ss",
      );
    const description = values[1][1];
    const collect = values[2][1] === "Yes";
    const message = values[3][1];

    const form = FormApp.create(title);
    form
      .setDescription(description)
      .setCollectEmail(collect)
      .setConfirmationMessage(message);

    const destination = DriveApp.getFileById(SpreadsheetApp.getActive().getId())
      .getParents()
      .next();
    DriveApp.getFileById(form.getId()).moveTo(destination);

    const dropdowns = this.createDropdowns(form);
    const pages = this.createPages(form);

    if (pages.length) {
      dropdowns.forEach((dropdown) => dropdown.setGoToPage(pages[0]));
    }
    form.setDestination(
      FormApp.DestinationType.SPREADSHEET,
      SpreadsheetApp.getActive().getId(),
    );
    const url = form.getPublishedUrl();
    SpreadsheetApp.flush();

    this.form = form;
    this.renameResponseSheet();
    this.getForm();

    const sheet = SpreadsheetApp.getActive().getSheetByName(this.sheetName) ||
      SpreadsheetApp.getActive().insertSheet(this.sheetName);
    sheet.clear();

    return url;
  }

  getDropdownTitles() {
    const values = this.wsDropdowns.getDataRange().getValues();
    let [parentTitle, childTitle] = values.shift();
    parentTitle = parentTitle.toString().trim();
    childTitle = childTitle.toString().trim();

    const parents = values.map((value) => value[0]);
    const count = [...new Set(parents)].length;
    return { parentTitle, childTitle, count };
  }

  onSubmit(e) {
    const namedValues = e.namedValues;
    const values = e.values;
    const { rowStart, rowEnd, columnStart, columnEnd } = e.range;

    const sheet = SpreadsheetApp.getActive().getSheetByName(this.sheetName) ||
      SpreadsheetApp.getActive().insertSheet(this.sheetName);
    sheet.setTabColor("#673BB7");

    const form = this.getForm();

    const headers = form.sheet
      .getDataRange()
      .getValues()[0]
      .slice(columnStart - 1);

    if (headers[headers.length - 1] !== this.uuidHeader) {
      form.sheet.getRange(1, headers.length + 1).setValue(this.uuidHeader);
      headers.push(this.uuidHeader);
    }

    const { parentTitle, childTitle, count } = this.getDropdownTitles();
    const childValue = namedValues[childTitle]
      .filter((item) => item !== "")
      .join(", ");
    const firstChildIndex = headers.indexOf(childTitle);
    const uuid = Utilities.getUuid();

    form.sheet.getRange(rowEnd, headers.length).setValue(uuid);

    const newHeaders = [
      ...headers.slice(0, firstChildIndex),
      ...headers.slice(firstChildIndex + count - 1),
    ];

    const newValues = [
      ...values.slice(0, firstChildIndex),
      ...values.slice(firstChildIndex + count - 1),
    ];
    newValues[firstChildIndex] = childValue;
    newValues[newHeaders.length - 1] = uuid;

    sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
    sheet.appendRow(newValues);
  }
}

function createForm() {
  let title = "Apps Script";
  SpreadsheetApp.getActive().toast("Creating...", title);
  const app = new App();
  let message = "";
  try {
    const formUrl = app.createForm();
    message =
      `The new form has been created successfully and linked to sheet "${app.responseSheetName}".`;
  } catch (err) {
    message = err.message;
    title = "Error";
  }
  SpreadsheetApp.getUi().alert(
    title,
    message,
    SpreadsheetApp.getUi().ButtonSet.OK,
  );
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu("Google Form");

  menu.addItem("Create form", "createForm");
  const installed = PropertiesService.getScriptProperties().getProperty(
    "installed",
  );
  if (!installed) {
    menu.addItem("Create trigger", "createTrigger");
  } else {
    menu.addItem("Delete trigger", "deleteTrigger");
  }
  menu.addToUi();
}

function deleteTrigger() {
  const ss = SpreadsheetApp.getActive();
  ss.toast("Deleting...", "Apps Script");
  const functionName = "onFormSubmit";
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  PropertiesService.getScriptProperties().deleteProperty("installed");
  onOpen();
  ss.toast("Trigger has been deleted.", "Apps Script");
}

function createTrigger() {
  const ss = SpreadsheetApp.getActive();
  ss.toast("Creating...", "Apps Script");
  const functionName = "onFormSubmit";
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger(functionName)
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  PropertiesService.getScriptProperties().setProperty("installed", "yes");
  onOpen();
  ss.toast("New trigger has been created.", "Apps Script");
}

function onFormSubmit(e) {
  const app = new App();
  app.onSubmit(e);
}
