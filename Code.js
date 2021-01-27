class App {
    constructor() {
        this.ss = SpreadsheetApp.getActive()
        this.wsStyles = this.ss.getSheetByName("Styles")
    }

    apply(keyword, range, style) {
        const displayValues = range.getDisplayValues()
        const richtextValues = displayValues.map(rowValues => {
            return rowValues.map(v => {
                const startOffset = v.indexOf(keyword)
                const endOffset = startOffset + keyword.length
                if (startOffset === -1) return null
                return SpreadsheetApp.newRichTextValue().setText(v).setTextStyle(startOffset, endOffset, style).build()
            })
        })
        range.setRichTextValues(richtextValues)
    }

    applyStyles(range, styles) {
        const displayValues = range.getDisplayValues()

        const richtextValues = displayValues.map(rowValues => {
            return rowValues.map(v => {
                let isKeywordFound = false
                const richTextValue = SpreadsheetApp.newRichTextValue().setText(v)
                styles.forEach(({ keyword, style, link }) => {
                    const startOffset = v.indexOf(keyword)
                    const endOffset = startOffset + keyword.length
                    if (startOffset !== -1) {
                        if (link) richTextValue.setLinkUrl(startOffset, endOffset, link)
                        // richTextValue.setTextStyle(startOffset, endOffset, style)
                        const { color, size, family, bold, italic, strikethrough, underline } = style
                        if (color) {
                            if (Array.isArray(color)) {
                                color.forEach((value, i) => {
                                    if (i < keyword.length) richTextValue.setTextStyle(startOffset + i, startOffset + i + 1, SpreadsheetApp.newTextStyle().setForegroundColor(value).build())
                                })
                            } else {
                                richTextValue.setTextStyle(startOffset, endOffset, SpreadsheetApp.newTextStyle().setForegroundColor(color).build())
                            }
                        }
                        if (size) {
                            if (Array.isArray(size)) {
                                size.forEach((value, i) => {
                                    if (i < keyword.length) richTextValue.setTextStyle(startOffset + i, startOffset + i + 1, SpreadsheetApp.newTextStyle().setFontSize(value).build())
                                })
                            } else {
                                richTextValue.setTextStyle(startOffset, endOffset, SpreadsheetApp.newTextStyle().setFontSize(size).build())
                            }
                        }
                        if (family) {
                            if (Array.isArray(family)) {
                                family.forEach((value, i) => {
                                    if (i < keyword.length) richTextValue.setTextStyle(startOffset + i, startOffset + i + 1, SpreadsheetApp.newTextStyle().setFontFamily(value).build())
                                })
                            } else {
                                richTextValue.setTextStyle(startOffset, endOffset, SpreadsheetApp.newTextStyle().setFontFamily(family).build())
                            }
                        }
                        if (bold) {
                            if (Array.isArray(bold)) {
                                bold.forEach((value, i) => {
                                    if (i < keyword.length) richTextValue.setTextStyle(startOffset + i, startOffset + i + 1, SpreadsheetApp.newTextStyle().setBold(value).build())
                                })
                            } else {
                                richTextValue.setTextStyle(startOffset, endOffset, SpreadsheetApp.newTextStyle().setBold(bold).build())
                            }
                        }
                        if (italic) {
                            if (Array.isArray(italic)) {
                                italic.forEach((value, i) => {
                                    if (i < keyword.length) richTextValue.setTextStyle(startOffset + i, startOffset + i + 1, SpreadsheetApp.newTextStyle().setItalic(value).build())
                                })
                            } else {
                                richTextValue.setTextStyle(startOffset, endOffset, SpreadsheetApp.newTextStyle().setItalic(italic).build())
                            }
                        }
                        if (strikethrough) {
                            if (Array.isArray(strikethrough)) {
                                strikethrough.forEach((value, i) => {
                                    if (i < keyword.length) richTextValue.setTextStyle(startOffset + i, startOffset + i + 1, SpreadsheetApp.newTextStyle().setStrikethrough(value).build())
                                })
                            } else {
                                richTextValue.setTextStyle(startOffset, endOffset, SpreadsheetApp.newTextStyle().setStrikethrough(strikethrough).build())
                            }
                        }
                        if (underline) {
                            if (Array.isArray(underline)) {
                                underline.forEach((value, i) => {
                                    if (i < keyword.length) richTextValue.setTextStyle(startOffset + i, startOffset + i + 1, SpreadsheetApp.newTextStyle().setUnderline(value).build())
                                })
                            } else {
                                richTextValue.setTextStyle(startOffset, endOffset, SpreadsheetApp.newTextStyle().setUnderline(underline).build())
                            }
                        }
                    }
                })
                return richTextValue.build()
            })
        })
        range.setRichTextValues(richtextValues)
    }

    getStyles() {
        const dataRange = this.wsStyles.getDataRange()
        const values = dataRange.getDisplayValues().slice(1)
        const styles = []
        values.forEach(([keyword, style, link]) => {
            keyword = keyword.trim()
            link = link.trim()
            try {
                style = JSON.parse(style)
                if (keyword) styles.push({ keyword, style, link })
            } catch (e) {
                //pass
            }
        })
        return styles
    }
}

function onOpen() {
    SpreadsheetApp.getUi().createMenu("Richtext App")
        .addItem("Style selection", "styleSelection")
        .addItem("Fill JSON in selection", "setTextStyleJSON")
        .addToUi()
}

const styleSelection = () => {
    const app = new App()
    const ranges = app.ss.getSelection().getActiveRangeList().getRanges()
    const styles = app.getStyles()
    ranges.forEach(range => {
        range.clearFormat()
        app.applyStyles(range, styles)
    })
}

const styleTest = () => {
    const app = new App()
    const styles = app.getStyles()
    const range = SpreadsheetApp.getActive().getSheetByName("Home").getRange("A1:B3")
    range.clearFormat()
    app.applyStyles(range, styles)
}

function setTextStyleJSON() {
    const textStyle = {
        color: ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"],
        size: 48,
        family: "Roboto",
        bold: true,
        italic: false,
        strikethrough: false,
        underline: false,
    }
    SpreadsheetApp.getActiveRange().setValue(JSON.stringify(textStyle, null, "  "))
}