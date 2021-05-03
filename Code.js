const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const CONFIGS = {
    sheet_name_questions: "Questions",
    sheet_name_settings: "Settings",
    folder_name_output: "Questionnarie",
    app_name: "Questionnarie",
}
const HEADINGS = {
    Title: DocumentApp.ParagraphHeading.TITLE,
    Subtitle: DocumentApp.ParagraphHeading.SUBTITLE,
    Heading1: DocumentApp.ParagraphHeading.HEADING1,
    Heading2: DocumentApp.ParagraphHeading.HEADING2,
    Heading3: DocumentApp.ParagraphHeading.HEADING3,
    Heading4: DocumentApp.ParagraphHeading.HEADING4,
    Heading5: DocumentApp.ParagraphHeading.HEADING5,
    Heading6: DocumentApp.ParagraphHeading.HEADING6,
    Normal: DocumentApp.ParagraphHeading.NORMAL,
}


class App {
    constructor() {
        this.ss = SpreadsheetApp.getActive()
        this.ws_questions = this.ss.getSheetByName(CONFIGS.sheet_name_questions)
        this.ws_settings = this.ss.getSheetByName(CONFIGS.sheet_name_settings)
        this.current_folder = DriveApp.getFileById(this.ss.getId()).getParents().next()
        this.ouput_folder = this.get_folder_by_name(this.current_folder, CONFIGS.folder_name_output)
        this.invliad_image_blob = UrlFetchApp.fetch("https://via.placeholder.com/300x150/FF0000/FFFFFF/?text=INVALID%20IMAGE%20URL").getBlob()
    }

    get_folder_by_name(folder, name) {
        const folders = folder.getFoldersByName(name)
        if (folders.hasNext()) return folders.next()
        return folder.createFolder(name)
    }

    get_settings() {
        const [, ...values] = this.ws_settings.getDataRange().getValues()
        const settings = {}
        values.forEach(([key, value]) => {
            if (key === 'output_file_name') {
                if (!value) value = CONFIGS.app_name + " " + new Date().toLocaleString()
            } else if (key === 'answer_list_type') {
                if (!value) value = "UPPER"
            } else if (key === "answer_text") {
                if (!value) value = "Your answers:"
            } else if (key.slice(-6) === "_style") {
                value = HEADINGS[value]
            }
            settings[key] = value
        })
        return settings
    }

    get_questions() {
        const [, ...values] = this.ws_questions.getDataRange().getValues()
        const questions = []
        values.forEach(([index, q_and_a, type, image, width, height, answer_text, blank_rows_after_answer_text, blank_rows_after_answer_line]) => {
            if (index > 0) {
                questions.push({
                    index,
                    question: q_and_a,
                    type: type.toString().trim().toLowerCase(),
                    image,
                    width,
                    height,
                    answer_text,
                    blank_rows_after_answer_text,
                    blank_rows_after_answer_line,
                    answers: [],
                })
            } else {
                questions[questions.length - 1].answers.push(q_and_a)
            }
        })
        // console.log(questions)
        return questions
    }

    get_image_blob(url) {
        try {
            if (url.indexOf("https://drive.google.com/file/d/") === 0) {
                const id = url.split("/d/")[1].split('/')[0]
                return DriveApp.getFileById(id).getBlob()
            }
            if (url.indexOf("http") === 0) return UrlFetchApp.fetch(url).getBlob()
            return this.invliad_image_blob
        } catch (e) {
            return this.invliad_image_blob
        }
    }

    create_doc_template(url, name) {
        try {
            const template = DocumentApp.openByUrl(url)
            const file = DriveApp.getFileById(template.getId())
            const copy = file.makeCopy(this.ouput_folder).setName(name)
            return DocumentApp.openById(copy.getId())
        } catch (e) {
            const doc = DocumentApp.create(name)
            DriveApp.getFileById(doc.getId()).moveTo(this.ouput_folder)
            return doc
        }
    }

    create() {
        const settings = this.get_settings()
        const questions = this.get_questions()
        const doc = this.create_doc_template(settings['doc_template_url'], settings['output_file_name'])
        const body = doc.getBody()
        questions.forEach(item => {
            let p = null
            // append question
            let question = `${item.index}. ${item.question}`
            if (item.type.indexOf('single') === 0) {
                question = `${question} [${item.type}]`
            } else if (item.type.indexOf("multiple") === 0) {
                question = `${question} [${item.type}]`
            }
            p = body.appendParagraph(question)
            if (settings['question_style']) p.setHeading(settings['question_style'])

            // append image
            if (item.image) {
                const image = body.appendImage(this.get_image_blob(item.image))
                if (item.width) image.setWidth(item.width)
                if (item.height) image.setHeight(item.height)
            }

            // append answers
            if (item.answers.length) {
                item.answers.forEach((answer, index) => {
                    let list_index
                    if (settings["answer_list_type"] === "NUMBER") {
                        list_index = index + 1
                    } else if (settings["answer_list_type"] === "UPPER") {
                        list_index = LETTERS[index]
                    } else {
                        list_index = LETTERS[index].toLocaleLowerCase()
                    }
                    p = body.appendParagraph(`${settings["answer_check_box"]} ${list_index}. ${answer}`)
                    if (settings['answer_style']) p.setHeading(settings['answer_style'])
                })
            }

            // append answer text
            p = body.appendParagraph(item.answer_text || settings["default_answer_text"])

            if (settings['answer_text_style']) p.setHeading(settings['answer_text_style'])

            // append blank rows after answer text
            let rows = item.blank_rows_after_answer_text || settings["default_blank_rows_after_answer_text"]
            for (let i = 1; i <= rows; i++) {
                body.appendParagraph("")
            }

            // add answer line
            if (settings["add_answer_line"]) body.appendHorizontalRule()

            // append blank rows after answer line
            rows = item.blank_rows_after_answer_line || settings["default_blank_rows_after_answer_line"]
            for (let i = 1; i <= rows; i++) {
                body.appendParagraph("")
            }
        })
        doc.saveAndClose()
        return doc.getUrl()
    }
}


function create_questionnaire() {
    SpreadsheetApp.getActive().toast("Creating...", CONFIGS.app_name)
    try {
        const app = new App()
        const doc_url = app.create()
        SpreadsheetApp.getActive().toast("Done!", CONFIGS.app_name)
        SpreadsheetApp.getUi().alert(CONFIGS.app_name + "[success]", `Created sucessfully!\n${doc_url}`, SpreadsheetApp.getUi().ButtonSet.OK)
    } catch (e) {
        SpreadsheetApp.getActive().toast("Error!", CONFIGS.app_name)
        SpreadsheetApp.getUi().alert(CONFIGS.app_name + "[error]", `${e.message}`, SpreadsheetApp.getUi().ButtonSet.OK)
    }
}

function onOpen() {
    SpreadsheetApp.getUi().createMenu(CONFIGS.app_name)
        .addItem("Create", "create_questionnaire")
        .addToUi()
}
