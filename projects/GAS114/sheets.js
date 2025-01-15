const demoSheetsIntegration = () => {
  const ok = "OK";
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const [_, ...values] = sheet.getDataRange().getValues();
  values.forEach(([imageUri, _, labels, text, colors, status], i) => {
    if (status == ok) return;
    if (!imageUri) return;
    if (!labels && !text && !colors) return;
    const row = i + 2;
    sheet.getRange(`F${row}:G${row}`).setValues([["Annotating ...", null]]);
    SpreadsheetApp.flush();
    if (imageUri.includes("drive.google.com")) {
      const id = imageUri.split("id=")[1].split(/[&#]+/)[0];
      imageUri = Utilities.base64Encode(
        DriveApp.getFileById(id).getBlob().getBytes(),
      );
    }
    const annotation = imageAnnotate_(imageUri, { labels, text, colors });
    const data = parseImageAnnotation_(annotation);
    console.log(imageUri);
    console.log(data);
    const results = [
      data.labels ? data.labels.join(", ") : labels,
      data.text ? data.text : text,
      data.colors ? data.colors.slice(0, colors).join(", ") : colors,
      data.error ? data.error : ok,
      new Date(),
    ];
    sheet.getRange(`C${row}:G${row}`).setValues([results]);
  });
};
