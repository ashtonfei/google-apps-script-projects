/**
 * From Ashton (13/Aug/2024):
 * I updated the API to use the post/page URL as a unique key
 * so we don't need to use the blog id and post id as the key any more
 */

/**
 * Ignore requests from other websites
 */
const PREFIX_WHITE_LIST = [
  "https://ashtonfei.blogspot.com/",
  "https://ashtontheroad.blogspot.com/",
  "https://miaomiaofriends.blogspot.com/",
  "https://automatetheboring.blogspot.com/",
  "https://yougastube.blogspot.com/",
];

function getBaseUrl_(url) {
  if (url.includes("://")) {
    url = url.split("://")[1];
  }
  if (url.includes("?")) {
    url = url.split("?")[0];
  }
  if (url.includes("#")) {
    url = url.split("#")[0];
  }
  return url;
}

function createJsonResponse_(data) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(data));
}

function updatePostViews_(url) {
  const key = getBaseUrl_(url);
  const props = PropertiesService.getScriptProperties();
  const views = (props.getProperty(key) || 1) * 1;
  props.setProperty(key, views + 1);
  return views;
}

/**
 * The Web App will be used as an API for the post views
 * @param {GoogleAppsScript.Events.DoGet} e
 */
function doGet(e) {
  const { url } = e.parameter;
  if (!url) {
    return;
  }
  if (!PREFIX_WHITE_LIST.find((v) => url.startsWith(v))) {
    return;
  }
  const views = updatePostViews_(url);
  return createJsonResponse_({
    views,
  });
}
