const APP_NAME = "Dashboard (ChartJS & GAS)"
const SN_DASHBOARD = "Dashboard"

class App {
    constructor() {
        this.ws = SpreadsheetApp.getActive().getSheetByName(SN_DASHBOARD)
    }

    getColumnName(i) {
        return this.ws.getRange(1, i + 1).getA1Notation().slice(0, -1)
    }

    createDatasets(values, colors, bgColors, datasetColumns) {
        datasetColumns = datasetColumns.split(",").map(v => v.trim().toUpperCase()).filter(v => v !== "")
        const [, ...headers] = values.shift()
        const datasets = []
        headers.forEach((h, i) => {
            const columnName = this.getColumnName(i + 1)
            if (datasetColumns.indexOf(columnName) !== -1) {
                const data = values.map(v => v[i + 1])
                const label = h
                datasets.push({ label, data, backgroundColor: bgColors[i], borderColor: colors[i], borderWidth: 1 })
            }
        })
        const labels = values.map(v => v[0])
        return { labels, datasets }
    }

    createChartData([index, type, title, url, sheetName, datasetColumns]) {
        title = `${index}. ${title}`
        const ss = SpreadsheetApp.openByUrl(url)
        if (!ss) return null
        const ws = ss.getSheetByName(sheetName)
        if (!ws) return null

        const dataRange = ws.getDataRange()
        const values = dataRange.getValues()
        const colors = dataRange.getFontColors()[0].slice(1)
        const bgColors = dataRange.getBackgrounds()[0].slice(1)

        const { labels, datasets } = this.createDatasets(values, colors, bgColors, datasetColumns)

        const chartData = {
            type,
            data: {
                labels,
                datasets,
            },
            options: {
                title: {
                    text: title,
                    display: title !== ""
                },
                aspectRatio: 1,
            }
        }
        return chartData
    }

    getDashboardData() {
        const values = this.ws.getDataRange().getValues()
        values.shift()
        const charts = values.map(v => this.createChartData(v))
        return charts
    }
}


function include(filename) {
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent()
}

function doGet() {
    return HtmlService.createTemplateFromFile("index")
        .evaluate()
        .setTitle(APP_NAME)
        .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

function getDashboardData() {
    const app = new App()
    const data = app.getDashboardData()
    return JSON.stringify({ charts: data, appName: APP_NAME })
}