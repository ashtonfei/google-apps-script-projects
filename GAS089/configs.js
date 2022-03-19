this.CONFIG = {
  NAME: 'Gmail Tracker',
  ACTIVE_USER: Session.getActiveUser(),
  SHEET_NAME: {
    TRACKING_EMAILS: "Tracking Emails"
  },
  HEADER: {
    TRACKING_EMAILS: ["Sent At", "To", "Subject", "Thread ID", "Permalink", "Tracking Number", "Opened", "Opened At"],
  },
  API_URL: "https://script.google.com/macros/s/AKfycbwXxyjKQvc1CYp0sQ92a1OpCeASAcUqtj42QI66NICQkL-dl1CysIX2jh57ZKLwTnk1Yw/exec",
}

this._app = new App()
this._utils = new Utils()
this._api = new Api()

String.prototype.toPascalCase = function(){
  const words = this.concat().toLowerCase().split(/\s+/).filter(v => v !== "").map(v => v.slice(0, 1).toUpperCase() + v.slice(1))
  const pascalCase = words.join("")
  return pascalCase
}

String.prototype.toCamelCase = function(){
  const words = this.concat().toLowerCase().split(/\s+/).filter(v => v !== "").map(v => v.slice(0, 1).toUpperCase() + v.slice(1))
  const pascalCase = words.join("")
  return pascalCase.slice(0,1).toLowerCase() + pascalCase.slice(1)
}