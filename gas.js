const fs = require('fs')
const path = require('path')

const GAS_VUE_PATH = path.join(__dirname, 'gas', 'vue')
const JS_PATH = path.join(__dirname, 'dist', 'static', 'js')
const CSS_PATH = path.join(__dirname, 'dist', 'static', 'css')
const TYPE_JS = ".js"
const TYPE_CSS = ".css"

function createGasFile(filePath, newFilePath, type) {
    let data = fs.readFileSync(filePath, 'utf-8')
    if (type === TYPE_JS) {
        data = `<script>\n${data}\n</script>`
    } else {
        data = `<style>\n${data}\n</style>`
    }
    fs.writeFileSync(newFilePath, data)
    console.log(`[${new Date().toLocaleTimeString()}] ${newFilePath.split(path.sep).pop()} has been created.`)
}

try {
    if (!fs.existsSync(GAS_VUE_PATH)) fs.mkdirSync(GAS_VUE_PATH)
    console.log(`[${new Date().toLocaleTimeString()}] Creating JS Files for GAS ...`)
    const jsFiles = fs.readdirSync(JS_PATH)
    jsFiles.forEach(fileName => {
        if (fileName.endsWith(TYPE_JS)) {
            filePath = path.join(JS_PATH, fileName)
            const newFilePath = path.join(GAS_VUE_PATH, fileName.split('.')[0] + TYPE_JS + '.html')
            createGasFile(filePath, newFilePath, TYPE_JS)
        }
    })

    console.log(`[${new Date().toLocaleTimeString()}] Creating CSS Files for GAS ...`)
    const cssFiles = fs.readdirSync(CSS_PATH)
    cssFiles.forEach(fileName => {
        if (fileName.endsWith(TYPE_CSS)) {
            filePath = path.join(CSS_PATH, fileName)
            const newFilePath = path.join(GAS_VUE_PATH, fileName.split('.')[0] + TYPE_CSS + '.html')
            createGasFile(filePath, newFilePath, TYPE_CSS)
        }
    })

    console.info(`[${new Date().toLocaleTimeString()}] Done!`)
} catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error: ${error.message}`)
}