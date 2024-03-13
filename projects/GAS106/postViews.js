/** set this to 'true' if you want to reduce
 * some duplicate visits from the same browser in a short time
 */
const USE_FINGERPRINT = false;

// The time for caching the browser fingerprint, max time is 6 hours
const FINGERPRINT_CACHE_SECONDS = 30 * 60;

function createKey_(blogId, postId) {
  return `${blogId}/${postId}`;
}

function createJsonResponse_(data) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(data));
}

function updatePostViews_(blogId, postId, fingerprint) {
  const cache = CacheService.getScriptCache();
  const visited = USE_FINGERPRINT ? cache.get(fingerprint) : false;
  const key = createKey_(blogId, postId);
  const props = PropertiesService.getScriptProperties();
  const currentViews = (props.getProperty(key) || 0) * 1;
  if (visited) return currentViews;
  const views = currentViews + 1;
  if (USE_FINGERPRINT) {
    cache.put(fingerprint, "VISITED", FINGERPRINT_CACHE_SECONDS);
  }
  props.setProperty(key, views);
  return visited ? currentViews || 1 : views;
}

/**
 * The Web App will be used as an API for the post views
 * @param {GoogleAppsScript.Events.DoGet} e
 */
function doGet(e) {
  const { postId, blogId, key } = e.parameter;
  if (!blogId) {
    return;
  }
  if (!postId) {
    return;
  }
  if (!key) {
    return;
  }
  const views = updatePostViews_(blogId, postId, key);
  return createJsonResponse_({
    blogId,
    postId,
    views,
  });
}
