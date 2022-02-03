const CONFIG = {
  INDEX: "index.html",
  NAME: "GAS-086 Approval Application",
  TITLE: "Created by Ashton Fei",
  PAGE_SIZE: 15,
  REVERSE: true,
  CACHE_EXPIRATION_IN_SECONDS: 3 * 60 * 60,
  SHEET_NAME: {
    USERS: "users",
    APPROVALS: "approvals",
  },
  STATUS: {
    OPEN: "Open",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  }
}


class App {
  constructor() {
    this.db = SpreadsheetApp.getActive()
    this.pageSize = CONFIG.PAGE_SIZE
    this.reverse = CONFIG.REVERSE
    this.props = PropertiesService.getScriptProperties()
    this.cache = CacheService.getScriptCache()
    this.headerId = "id"
  }

  createKeys(headers) {
    return headers.map(header => header.toString().trim())
  }

  createItemObject(keys, values) {
    const item = {}
    keys.forEach((key, index) => item[key] = values[index])
    return item
  }

  createPassword() {
    return Utilities.getUuid().replace(/-/g, "").slice(0, 8) // add your password generateor here
  }

  generateId(keys, records) {
    if (records.length === 0) return 1
    const indexOfId = keys.indexOf(this.headerId)
    if (indexOfId === -1) throw new Error(`"${this.headerId}" column is missing in the table!`)
    return records[records.length - 1][indexOfId] + 1
  }

  createValues(keys, item, values = []) {
    return keys.map((key, index) => {
      if (item.hasOwnProperty(key)) {
        return item[key]
      } else {
        return values[index] || null
      }
    })
  }

  createItem({ sheetName, item }) {
    const ws = this.db.getSheetByName(sheetName)
    if (!ws) throw new Error(`${sheetName} was not found in the database.`)
    if (sheetName === "users") item.password = this.createPassword()
    const [headers, ...records] = ws.getDataRange().getValues()
    const keys = this.createKeys(headers)
    item.createdOn = new Date()
    item.modifiedOn = new Date()
    item.id = this.generateId(keys, records)
    const values = this.createValues(keys, item)
    ws.getRange(records.length + 2, 1, 1, values.length).setValues([values])
    return {
      success: true,
      message: `Item ${item.id} has been created successfully!`,
      data: item,
    }
  }

  checkFilters(keys, record, filters, partial = true) {
    const results = Object.entries(filters).map(([key, value]) => {
      const index = keys.indexOf(key)
      if (partial) return new RegExp(value, 'i').test(record[index])
      return record[index] == value
    })
    if (partial) return results.includes(true)
    return !results.includes(false)
  }

  updateItem({ sheetName, item }) {
    const ws = this.db.getSheetByName(sheetName)
    if (!ws) throw new Error(`${sheetName} was not found in the database.`)
    const [headers, ...records] = ws.getDataRange().getValues()
    const keys = this.createKeys(headers)
    const filters = {}
    filters[this.headerId] = item[this.headerId]
    const index = records.findIndex(record => this.checkFilters(keys, record, filters, false))
    if (index === -1) return {
      success: false,
      message: `Item with ID "${item.id}" was not found in the database.`
    }
    item.modifiedOn = new Date()
    delete item.createdOn
    const values = this.createValues(keys, item, records[index])
    ws.getRange(index + 2, 1, 1, values.length).setValues([values])
    return {
      success: true,
      message: `Item ${item.id} has been updated successfully!`,
      data: item,
    }
  }

  updateFindItem(findItem, item) {
    if (item.assignedTo === findItem.requestedBy) throw new Error("You can't assign the request to the requestor.")
    const data = JSON.parse(findItem.data)
    const index = data.findIndex(v => v.email === findItem.pendingOn)
    if (item.type === "Approve") {
      data[index].status = CONFIG.STATUS.APPROVED
      data[index].comments = item.comments
      data[index].timestamp = new Date()
      if (data[index + 1]) {
        item.pendingOn = data[index + 1].email
      } else {
        item.pendingOn = null
        item.status = CONFIG.STATUS.APPROVED
      }
      item.assignedTo = findItem.assignedTo
    } else if (item.type === "Reject") {
      data[index].status = CONFIG.STATUS.REJECTED
      data[index].comments = item.comments
      data[index].timestamp = new Date()
      item.status = CONFIG.STATUS.REJECTED
      item.pendingOn = null
      item.assignedTo = findItem.assignedTo
    } else if (item.type === "Forward") {
      data[index].email = item.assignedTo
      item.pendingOn = item.assignedTo
      item.assignedTo = findItem.assignedTo.replace(findItem.pendingOn, item.assignedTo)
    }
    item.data = JSON.stringify(data)
  }

  updateApproval({ item }) {
    const sheetName = CONFIG.SHEET_NAME.APPROVALS
    const ws = this.db.getSheetByName(sheetName)
    if (!ws) throw new Error(`${sheetName} was not found in the database.`)
    const [headers, ...records] = ws.getDataRange().getValues()
    const keys = this.createKeys(headers)
    const filters = {}
    filters[this.headerId] = item[this.headerId]
    const index = records.findIndex(record => this.checkFilters(keys, record, filters, false))
    if (index === -1) return {
      success: false,
      message: `Item with ID "${item.id}" was not found in the database.`
    }

    const findItem = this.createItemObject(keys, records[index])
    this.updateFindItem(findItem, item)
    item.modifiedOn = new Date()
    const values = this.createValues(keys, item, records[index])
    ws.getRange(index + 2, 1, 1, values.length).setValues([values])
    return {
      success: true,
      message: `Item ${item.id} has been updated successfully!`,
      data: item,
    }
  }

  deleteItem({ sheetName, item }) {
    const ws = this.db.getSheetByName(sheetName)
    if (!ws) throw new Error(`${sheetName} was not found in the database.`)
    const [headers, ...records] = ws.getDataRange().getValues()
    const keys = this.createKeys(headers)
    const filters = {}
    filters[this.headerId] = item[this.headerId]
    const index = records.findIndex(record => this.checkFilters(keys, record, filters, false))
    if (index === -1) return {
      success: false,
      message: `Item with ID "${item.id}" was not found in the database.`
    }
    ws.deleteRow(index + 2)
    return {
      success: true,
      message: `Item ${item.id} has been deleted successfully!`,
    }
  }

  getItems({ page, pageSize, sheetName, filters }) {
    const ws = this.db.getSheetByName(sheetName)
    if (!ws) throw new Error(`${sheetName} was not found in the database.`)
    const [headers, ...records] = ws.getDataRange().getValues()
    const keys = this.createKeys(headers)
    if (this.reverse) records.reverse()
    if (pageSize === -1) return {
      pages: 1,
      items: records.map(record => this.createItemObject(keys, record)),
    }
    if (filters) {
      return {
        pages: 1,
        items: records
          .filter(record => this.checkFilters(keys, record, filters))
          .map(record => this.createItemObject(keys, record))
      }
    }
    return {
      pages: Math.ceil(records.length / pageSize),
      items: records.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map(record => this.createItemObject(keys, record)),
    }
  }

  checkItemWithFilters(item, filters) {
    const results = Object.entries(filters).map(([key, value]) => item[key] == value)
    return results.includes(true)
  }

  getItemsByFilters(sheetName, filters) {
    const { items } = this.getItems({ sheetName, page: 1, pageSize: -1 })
    return items.filter(item => this.checkItemWithFilters(item, filters))
  }

  getUserByEmail(email) {
    return this.getItemsByFilters(CONFIG.SHEET_NAME.USERS, { email })[0]
  }

  getAppData() {
    const data = {
      name: CONFIG.NAME,
      title: CONFIG.TITLE,
    }
    return data
  }

  createToken(user) {
    const token = Utilities.getUuid()
    this.cache.put(token, JSON.stringify(user), CONFIG.CACHE_EXPIRATION_IN_SECONDS)
    return token
  }

  validateToken(token) {
    const user = this.cache.get(token)
    if (!user) return false
    this.cache.put(token, user, CONFIG.CACHE_EXPIRATION_IN_SECONDS)
    return JSON.parse(user)
  }

  login({ email, password, token }) {
    if (token) {
      const user = this.validateToken(token)
      if (!user) return {
        success: false,
        message: `Token is expired, enter your credentials to login!`
      }
      user.token = token
      return {
        user,
        app: this.getAppData(),
        success: true,
        message: `Welcome, ${user.name}!`
      }
    }
    const user = this.getUserByEmail(email)
    if (!user) {
      return {
        success: false,
        message: `User with email ${email} was not found in the database.`
      }
    }
    if (user.password !== password) {
      return {
        success: false,
        message: `Invalid credentials.`
      }
    }
    user.token = this.createToken(user)
    return {
      user,
      app: this.getAppData(),
      success: true,
      message: `Welcome, ${user.name}!`
    }
  }

  logout({ token }) {
    return {
      success: true,
      message: "You've been logged out!",
    }
  }
}

const app = new App()

const getAppData = () => JSON.stringify(app.getAppData())
const login = (params) => JSON.stringify(app.login(JSON.parse(params)))
const logout = (params) => JSON.stringify(app.logout(JSON.parse(params)))
const getItems = (params) => JSON.stringify(app.getItems(JSON.parse(params)))


const createItem = (params) => JSON.stringify(app.createItem(JSON.parse(params)))
const updateItem = (params) => JSON.stringify(app.updateItem(JSON.parse(params)))
const updateApproval = (params) => JSON.stringify(app.updateApproval(JSON.parse(params)))
const deleteItem = (params) => JSON.stringify(app.deleteItem(JSON.parse(params)))

function test() {
  const item = {
    id: "2",
    type: "Forward",
    assignedTo: "ashton.fei@gmail.com",
    comments: "Forward 1",
  }
  updateApproval(JSON.stringify({ item }))
}

function doGet() {
  return HtmlService.createTemplateFromFile(CONFIG.INDEX)
    .evaluate()
    .setTitle(CONFIG.NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}


function include_(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent()
}