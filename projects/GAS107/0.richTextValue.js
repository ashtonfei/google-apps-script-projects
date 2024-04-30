const createDefaultTextStyle_ = () => {
  return SpreadsheetApp.newTextStyle()
    .setBold(false)
    .setStrikethrough(false)
    .setUnderline(false)
    .setItalic(false)
    .setFontSize(10)
    .setFontFamily("Default")
    .setForegroundColor("#000000")
    .build();
};

/**
 * @param {GoogleAppsScript.Spreadsheet.RichTextValue[]} values A list of rich text values
 * @param {string} by
 * @return {GoogleAppsScript.Spreadsheet.RichTextValue} A single rich text value
 */
const join_ = (values, by = "\n") => {
  if (values.length === 0) return null;
  const richTextValue = SpreadsheetApp.newRichTextValue();
  const text = values.map((v) => (v ? v.getText() : "")).join(by);
  if (text === "") return null;
  richTextValue.setText(text);
  let start = 0;
  const defaultStyle = createDefaultTextStyle_();
  values.forEach((value, index) => {
    if (value === null) return;
    const runs = value.getRuns();
    runs.forEach((run) => {
      const text = run.getText();
      if (text === "") return;
      const link = run.getLinkUrl();
      const style = run.getTextStyle();
      const end = start + text.length;
      link && richTextValue.setLinkUrl(start, end, link);
      richTextValue.setTextStyle(start, end, style);
      start = end;
    });
    if (index == values.length - 1) return;
    richTextValue.setTextStyle(start, start + by.length, defaultStyle);
    start = start + by.length;
  });
  return richTextValue.build();
};

/**
 * @param {GoogleAppsScript.Spreadsheet.RichTextValue} value
 * @param {string} by
 * @return {GoogleAppsScript.Spreadsheet.RichTextValue[]} A list of rich text
 * values
 */
const split_ = (value, by = "\n") => {
  const text = value.getText();
  const splittedValues = text.split(by);
  const values = splittedValues.map((v) =>
    SpreadsheetApp.newRichTextValue().setText(v)
  );
  let index = 0;
  let start = 0;
  value.getRuns().forEach((run) => {
    const text = run.getText();
    const style = run.getTextStyle();
    const link = run.getLinkUrl();
    const end = start + text.length;
    if (text.includes(by) === false) {
      link && values[index].setLinkUrl(start, end, link);
      values[index].setTextStyle(start, end, style);
      start = end;
      return;
    }
    if (text === by) {
      index++;
      start = 0;
      return;
    }
    text.split(by).forEach((v) => {
      if (v === "") return;
      const end = start + v.length;
      url && values[index].setLinkUrl(start, end, url);
      values[index].setTextStyle(start, end, style);
      index++;
      start = 0;
    });
  });
  return values.map((v) => v.build());
};
