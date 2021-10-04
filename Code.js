const UID = {
  HEADER: "UID_HEADER",
  PREFIX: "UID",
  LENGTH: 5,
}

class App{
  constructor(){
    this.ss = SpreadsheetApp.getActive()
    this.sheet = this.getLinkedSheet()
    if (!this.sheet) {
      throw Error(`There is no linked form in this spreadsheet.`)
    }
    this.form = FormApp.openByUrl(this.sheet.getFormUrl())
    this.message = this.form.getConfirmationMessage()
    this.uidRegex = new RegExp(`${UID.PREFIX}[\\d]{${UID.LENGTH}}`, 'gi')
  }

  createUidByNumber(number){
    return UID.PREFIX + (10 ** UID.LENGTH  + number).toString().slice(-UID.LENGTH)
  }

  getLinkedSheet(){
    return this.ss.getSheets().find(sheet => sheet.getFormUrl())
  }


  getUidFromConfirmationMessage(){
    const message = this.form.getConfirmationMessage()
    const results = message.match(this.uidRegex)
    if (!results) throw Error(`No UID found in the current confirmation message with regex ${this.uidRegex}.`)
    return results[0]
  }

  createNextUid(currentUid){
    const nextUidNumber = Number(currentUid.replace(UID.PREFIX, "")) + 1
    return this.createUidByNumber(nextUidNumber)
  }

  saveCurrentUid(uid, rowStart){
    const [headers] = this.sheet.getDataRange().getDisplayValues()
    let uidHeaderIndex = headers.indexOf(UID.HEADER)
    if (uidHeaderIndex === -1) {
      uidHeaderIndex = headers.length
      this.sheet.getRange(1, uidHeaderIndex + 1).setValue(UID.HEADER)
    }
    this.sheet.getRange(rowStart, uidHeaderIndex + 1).setValue(uid)
  }

  updateConfirmationMessage(nextUid){
    const message = this.message.replace(this.uidRegex, nextUid)
    this.form.setConfirmationMessage(message)
  }

  run(e){
    const {rowStart} = e.range
    const currentUid = this.getUidFromConfirmationMessage()
    this.saveCurrentUid(currentUid, rowStart)
    const nextUid = this.createNextUid(currentUid)
    this.updateConfirmationMessage(nextUid)
  }
}

function _onFormSubmit(e) {
  new App().run(e)
}