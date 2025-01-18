const parseOptions_ = (value) => {
  if (value === "") return [];
  if (/""/.test(value)) {
    value = value.replace(/""/g, '\\"');
  }
  try {
    return JSON.parse(`[${value}]`);
  } catch (err) {
    return value.split(/,\s/);
  }
};

const test = () => {
  const sheet = SpreadsheetApp.getActive().getSheetByName("orders");
  const values = sheet.getDataRange().getValues();
  const items = values.map((v) => {
    const value = v[1];
    const items = parseOptions_(value);
    const length = items.length;
    return {
      value,
      items,
      length,
    };
  });
  console.log(items);
};
