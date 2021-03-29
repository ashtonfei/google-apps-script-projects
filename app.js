const APP_NAME = "⏳ Approval Flow"

const HEADER_REQUESTOR = "Requestor"
const HEADER_TITLE = "Title"
const HEADER_DESCRIPTION = "Description"

const SN_REQUESTS = "Requests" // sheet name of 'Requests'
const SN_REQUESTORS = "Requestors" // sheet name of 'Requestors'

const STATUS_FAIL = "Fail"
const STATUS_OPEN = "Open"
const STATUS_APPROVED = "Approved"
const STATUS_REJECTED = "Rejected"
const STATUS_ABORTED = "Aborted"

class App {
    constructor() {
        this.ss = SpreadsheetApp.getActive()
        this.wsRequests = this.ss.getSheetByName(SN_REQUESTS)
        this.wsRequestors = this.ss.getSheetByName(SN_REQUESTORS)
    }

    getItems(sheetname) {
        const ws = this.ss.getSheetByName(sheetname)
        const [keys, ...values] = ws.getDataRange().getValues()
        return values.map(v => {
            const item = {}
            keys.forEach((key, i) => item[key.toString().trim()] = v[i])
            return item
        })
    }

    getItemByKeyAndValue(sheetName, key, value) {
        const items = this.getItems(sheetName)
        return items.find(v => v[key] === value)
    }

    addItem(item) {
        const dataRange = this.wsRequests.getDataRange()
        const [keys] = dataRange.getDisplayValues()
        const rowContents = keys.map(key => item[key.trim()])
        this.wsRequests.getRange(dataRange.getLastRow() + 1, 1, 1, rowContents.length).setValues([rowContents])
    }

    getSentThread(subject) {
        const threads = GmailApp.search("label:sent")
        if (threads.length === 0) return
        const lastThread = threads[0]
        if (!subject) return lastThread
        if (subject !== lastThread.getFirstMessageSubject()) return
        return lastThread
    }

    sendApprovalRequest(item) {
        const recipient = item.approverEmail
        const subject = `Approval Request - ${item[HEADER_TITLE]}`
        const htmlBody = `
      <p>Dear ${item.approver},</p>
      <p>Your approval is required for the below reqeust.</p>
      <p>
      <span style="color: blue; font-style: italic; font-weight: bold; text-decoration-line: underline;">${HEADER_REQUESTOR}:</span>
      <span style="color: blue; font-style: italic;">${item[HEADER_REQUESTOR]}</span><br>
      <span style="color: blue; font-style: italic; font-weight: bold; text-decoration-line: underline;">${HEADER_TITLE}:</span>
      <span style="color: blue; font-style: italic;">${item[HEADER_TITLE]}</span><br>
      <span style="color: blue; font-style: italic; font-weight: bold; text-decoration-line: underline;">${HEADER_DESCRIPTION}:</span>
      <span style="color: blue; font-style: italic;">${item[HEADER_DESCRIPTION]}</span>
      </p>
      <p style="color: grey;">
        <span style="font-weight: bold;">By replying 
        <span style="color: blue; font-style: italic;">${STATUS_APPROVED}</span> or 
        <span style="color: blue; font-style: italic;">${STATUS_REJECTED}</span> to approve or reject the reqeust.</span><br>
        <span>Approve with comments:</span><span style="color: blue; font-style: italic;">${STATUS_APPROVED}:{comments}</span><br>
        <span>Reject with comments:</span><span style="color: blue; font-style: italic;">${STATUS_REJECTED}:{comments}</span>
      </p>
      <p style="color: grey;">${APP_NAME}</p>
    `

        try {
            GmailApp.sendEmail(recipient, subject, "", { htmlBody, name: APP_NAME })
            const thread = this.getSentThread(subject)
            item.threadId = thread.getId()
            item.threadLink = thread.getPermalink()
            item.createdOn = thread.getLastMessageDate()
        } catch (e) {
            item.comment = e.message
            item.status = STATUS_FAIL
        }
        this.addItem(item)
    }

    getReplyMessages(threadId, from) {
        const thread = GmailApp.getThreadById(threadId)
        const messages = thread.getMessages().slice(1)
        return messages.filter(message => message.getFrom().includes(from))
    }

    getApprovalStatusFromMessages(messages) {
        if (messages.length === 0) return null
        return messages.map(message => {
            const body = message.getPlainBody()
                .replace(`${STATUS_APPROVED}:{comments}`, "")
                .replace(`${STATUS_REJECTED}:{comments}`, "")
                .replace(`${STATUS_APPROVED} or ${STATUS_REJECTED}`, "")

            const text = body.split("\r\n\r\n").find(v => v.includes(STATUS_APPROVED) || v.includes(STATUS_REJECTED))
            if (!text) return null
            return {
                status: text.slice(0, body.indexOf(":")).trim().replace("\r\n", " "),
                comment: text.slice(body.indexOf(":") + 1).trim().replace("\r\n", " "),
            }
        })
    }


    onFormSubmit(e) {
        const namedValues = e.namedValues
        const [keys] = this.wsRequests.getDataRange().getDisplayValues()
        const request = {}
        keys.forEach(key => {
            key = key.trim()
            const value = namedValues[key]
            request[key] = null
            if (value) request[key] = value[0]
        })

        request.uuid = Utilities.getUuid()

        let { requestorEmail, approvers, approverEmails, approvalType } = this.getItemByKeyAndValue(SN_REQUESTORS, HEADER_REQUESTOR, request[HEADER_REQUESTOR])
        approvers = approvers.toString().trim().split("\n").map(v => v.trim())
        approverEmails = approverEmails.toString().trim().split("\n").map(v => v.trim())
        approverEmails.forEach((approverEmail, i) => {
            const approver = approvers[i]
            const item = {
                ...request
            }
            item.approverEmail = approverEmail
            item.approver = approver
            item.requestorEmail = requestorEmail
            item.approvalType = approvalType
            item.isRequestorNotified = "No"
            item.status = STATUS_OPEN

            this.sendApprovalRequest(item)
        })
    }

    updateRequest(rowIndex, request) {
        const [keys] = this.wsRequests.getDataRange().getDisplayValues()
        Object.keys(request).forEach(key => {
            const colIndex = keys.indexOf(key) + 1
            if (colIndex) this.wsRequests.getRange(rowIndex, colIndex).setValue(request[key])
        })
    }

    checkApprovalStatus(uuid) {
        const items = []
        this.getItems(SN_REQUESTS).forEach((item, i) => {
            item.rowIndex = i + 2
            if (item.uuid === uuid) items.push(item)
        })
        if (items.length === 0) return
        const request = items[0]
        const approvalType = request.approvalType
        const status = items.map(v => v.status)

        let approvalStatus
        if (status.includes(STATUS_REJECTED)) {
            approvalStatus = STATUS_REJECTED
        } else {
            if (approvalType === "Any") {
                if (status.includes(STATUS_APPROVED)) approvalStatus = STATUS_APPROVED
            } else {
                const item = [... new Set(status)]
                if (item.length === 1 && item[0] === STATUS_APPROVED) approvalStatus = STATUS_APPROVED
            }
        }
        if (approvalStatus) {
            const recipient = request.requestorEmail
            const subject = `${approvalStatus} - ${request[HEADER_TITLE]}`
            const table = items.map(({ approver, approverEmail, status, comment }) => `<tr>
        <td style="Padding: 6px; border: 1px solid #111;">${approver}</td>
        <td style="Padding: 6px; border: 1px solid #111;">${approverEmail}</td>
        <td style="Padding: 6px; border: 1px solid #111; color:${status === STATUS_APPROVED ? 'green' : status === STATUS_REJECTED ? 'red' : 'black'};">
          ${status !== STATUS_APPROVED && status !== STATUS_REJECTED ? STATUS_ABORTED : status}</td>
        <td style="Padding: 6px; border: 1px solid #111;">${comment}</td>
      </tr>`)
            table.unshift(`
        <table style="border-collapse: collapse;"><tr>
        <th style="Padding: 6px; border: 1px solid #111;">Approver</th>
        <th style="Padding: 6px; border: 1px solid #111;">Approver Email</th>
        <th style="Padding: 6px; border: 1px solid #111;">Status</th>
        <th style="Padding: 6px; border: 1px solid #111;">Comment</th>
      </tr>`)
            table.push("</table>")

            let htmlBody = `
        <p>Dear ${request.Requestor},</p>
        <p>Your request below has been <span style="font-weight: bold; color:${approvalStatus === STATUS_APPROVED ? 'green' : 'red'};">${approvalStatus}</span>.</p>
        <p>
        <span style="color: blue; font-style: italic; font-weight: bold; text-decoration-line: underline;">${HEADER_REQUESTOR}:</span>
        <span style="color: blue; font-style: italic;">${request[HEADER_REQUESTOR]}</span><br>
        <span style="color: blue; font-style: italic; font-weight: bold; text-decoration-line: underline;">${HEADER_TITLE}:</span>
        <span style="color: blue; font-style: italic;">${request[HEADER_TITLE]}</span><br>
        <span style="color: blue; font-style: italic; font-weight: bold; text-decoration-line: underline;">${HEADER_DESCRIPTION}:</span>
        <span style="color: blue; font-style: italic;">${request[HEADER_DESCRIPTION]}</span>
        </p>
        <p>Details [<span style="color: blue; font-style: italic; font-weight: bold; text-decoration-line: underline;">${request.approvalType}</span>]</p>
        <div>${table.join("")}</div>
        <p style="color: grey;">${APP_NAME}</p>
        `
            const options = {
                name: APP_NAME,
                htmlBody
            }

            let isRequestorNotified = "Yes"
            try {
                GmailApp.sendEmail(recipient, subject, "", options)
            } catch (e) {
                isRequestorNotified = `No - {e.message}`
            }

            items.forEach(item => {
                this.updateRequest(item.rowIndex, {
                    isRequestorNotified,
                    status: item.status !== STATUS_APPROVED && item.status !== STATUS_REJECTED ? STATUS_ABORTED : item.status,
                })
            })
        }
    }

    checkApprovals() {
        const items = this.getItems(SN_REQUESTS)
        items.forEach((item, i) => {
            if (item.status === STATUS_OPEN && item.threadId) {
                const replyMessages = this.getReplyMessages(item.threadId, item.approverEmail)
                const approvalStatus = this.getApprovalStatusFromMessages(replyMessages)
                if (approvalStatus) {
                    const { status, comment } = approvalStatus[0]
                    this.updateRequest(i + 2, { status, comment })
                    this.checkApprovalStatus(item.uuid)
                }
            }
        })
    }
}

const onFormSubmit = e => new App().onFormSubmit(e)
const checkApprovals = () => new App().checkApprovals()

const onOpen = e => {
    SpreadsheetApp.getUi()
        .createMenu(APP_NAME)
        .addItem("Check Approvals", "checkApprovals")
        .addToUi()
}

