function createKey_(blogId, postId) {
  return `${postId}/${blogId}`;
}

function createJsonResponse_(data) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(data));
}

function updatePostViews_(blogId, postId, fingerprint, mins) {
  const cache = CacheService.getScriptCache();
  const seconds = /^\d+$/.test(mins) ? mins * 60 : 0;
  const maxSeconds = 6 * 60 * 60; // 6 hours is the max cache time
  const useFingerprint = seconds > 0 && seconds <= maxSeconds && fingerprint;
  const visited = useFingerprint ? cache.get(fingerprint) : false;

  const key = createKey_(blogId, postId);
  const props = PropertiesService.getScriptProperties();
  const currentViews = (props.getProperty(key) || 0) * 1;
  if (visited) return currentViews;
  const views = currentViews + 1;
  if (useFingerprint) {
    cache.put(fingerprint, "VISITED", seconds);
  }
  props.setProperty(key, views);
  return visited ? currentViews || 1 : views;
}

/**
 * The Web App will be used as an API for the post views
 * @param {GoogleAppsScript.Events.DoGet} e
 */
function doGet(e) {
  const { postId, blogId, fingerprint, mins } = e.parameter;
  if (!blogId) {
    return;
  }
  if (!postId) {
    return;
  }
  const views = updatePostViews_(blogId, postId, fingerprint, mins);
  return createJsonResponse_({
    blogId,
    postId,
    views,
  });
}
