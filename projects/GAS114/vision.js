const imageAnnotate_ = (imageUri, { labels, text, colors }) => {
  const token = ScriptApp.getOAuthToken();
  const features = [];
  if (labels) {
    features.push({
      type: "LABEL_DETECTION",
      maxResults: labels,
    });
  }
  if (text) {
    features.push({
      type: "TEXT_DETECTION",
    });
  }
  if (colors) {
    features.push({
      type: "IMAGE_PROPERTIES",
    });
  }

  const image = {};
  if (imageUri.startsWith("http")) {
    image.source = { imageUri };
  } else {
    image.content = imageUri;
  }

  const payload = {
    requests: [
      {
        image,
        features,
      },
    ],
  };
  const request = {
    method: "POST",
    url: `https://vision.googleapis.com/v1/images:annotate`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const [response] = UrlFetchApp.fetchAll([request]);
  return JSON.parse(response.getContentText());
};

const parseImageAnnotation_ = (data) => {
  const results = {};
  if (data.error) {
    results.error = data.error;
    return results;
  }
  const {
    error,
    labelAnnotations,
    textAnnotations,
    imagePropertiesAnnotation,
  } = data?.responses?.[0];

  console.log(data);
  console.log(error);

  if (error) {
    results.error = JSON.stringify(error, null, 4);
    return results;
  }

  const rgbToHex_ = ({ red, green, blue }) => {
    const toHex_ = (v) => v.toString(16).padStart(2, "0");
    return `#${toHex_(red)}${toHex_(green)}${toHex_(blue)}`.toUpperCase();
  };
  if (labelAnnotations) {
    results.labels = labelAnnotations.map((v) => v.description);
  }
  if (imagePropertiesAnnotation) {
    results.colors = imagePropertiesAnnotation.dominantColors.colors.map((v) =>
      rgbToHex_(v.color),
    );
  }
  if (textAnnotations) {
    results.text = textAnnotations[0].description;
  }
  return results;
};
