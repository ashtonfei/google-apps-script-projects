/**
 * Update by Ashton 16 Apr 2024
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Google Scripts")
    .addItem("Weather Forecast", "weatherForecast")
    .addToUi();
}

function weatherForecast() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getSheetByName("Weather");
  const apiKey = "YOUR OPEN WEATHER MAP API_KEY"; // https://home.openweathermap.org/api_keys

  const cityName = sheet.getRange("B1").getValue();
  // Go to https://openweathermap.org, register and get a free API key
  const apiCall = "api.openweathermap.org/data/2.5/weather?q=" +
    cityName +
    "&appid=" +
    apiKey;

  const response = UrlFetchApp.fetch(apiCall, { muteHttpExceptions: true });
  const data = JSON.parse(response.getContentText());
  if (data.message) {
    return ui.alert("Error", data.message, ui.ButtonSet.OK);
  }

  const weather = data["weather"][0]; //It's an array

  const weatherData = [
    ["Location:", data.name],
    ["Country:", data.sys.country],
    ["Weather:", weather.main],
    ["Teaperture:", data.main.temp],
    ["Min Temp:", data.main.temp_min],
    ["Max Temp:", data.main.temp_max],
  ];

  sheet
    .getRange(3, 1, weatherData.length, weatherData[0].length)
    .setValues(weatherData);
}
