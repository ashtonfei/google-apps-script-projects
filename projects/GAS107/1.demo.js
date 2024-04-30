const getNamedValues_ = () => {
  const ss = SpreadsheetApp.getActive();
  const values = {};
  ss.getNamedRanges().forEach((r) => {
    const name = r.getName();
    const value = r.getRange().getDisplayValue();
    if (value === "\\n") {
      return (values[name] = "\n");
    }
    values[name] = value;
  });
  console.log(values);
  return values;
};

const demoSplit = () => {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const { inputSplit, outputSplit, splitBy } = getNamedValues_();
  const outputRange = sheet.getRange(outputSplit);
  const dataRegion = outputRange.getDataRegion();
  dataRegion.getNumColumns() === 1 && dataRegion.clearContent();
  SpreadsheetApp.flush();

  const value = sheet.getRange(inputSplit).getRichTextValue();
  const splitValues = split_(value, splitBy || "\n");
  const values = splitValues.map((v) => [v]);
  sheet
    .getRange(
      outputRange.getRow(),
      outputRange.getColumn(),
      values.length,
      values[0].length,
    )
    .setRichTextValues(values);
};

const demoJoin = () => {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const { inputJoin, outputJoin, joinBy } = getNamedValues_();
  const outputRange = sheet.getRange(outputJoin);
  outputRange.clearContent();
  SpreadsheetApp.flush();

  const values = sheet
    .getRange(inputJoin)
    .getRichTextValues()
    .map((v) => v[0]);
  const joinedValue = join_(values, joinBy || "\n");
  outputRange.setRichTextValue(joinedValue);
};
