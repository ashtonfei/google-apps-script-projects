class Maze {
  constructor(
    { rows, columns, size, color, nextColor, bgColor, refreshPerCells, start, ws }
  ) {
    this.rows = rows || 10
    this.columns = columns || 10
    this.size = size || 21
    this.color = color || "#FFF3F3"
    this.nextColor = nextColor || "#5383EC"
    this.bgColor = bgColor || "#F3F3F3"
    this.refreshPerCells = refreshPerCells || 10
    this.start = start || {row: 2, columns: 2}
    this.cells = null
    this.ws = ws
    this.walls = []
    this.init()
  }

  init() {
    this.cells = Array(this.rows).fill().map((_, x) => {
      return Array(this.columns).fill().map((_, y) => ({
        x,
        y,
        color: 0
      }))
    })
    const requiredRows = this.rows + this.start.row + 2
    const requiredColumns = this.columns + this.start.column + 2

    if (requiredRows > this.ws.getMaxRows()) {
      this.ws.insertRows(this.ws.getMaxRows(), requiredRows - this.ws.getMaxRows())
    }
    if (requiredColumns > this.ws.getMaxColumns()) {
      this.ws.insertColumns(this.ws.getMaxColumns(), requiredColumns - this.ws.getMaxColumns())
    }
    this.ws.setRowHeights(this.start.row, this.rows + 2, this.size)
    this.ws.setColumnWidths(this.start.column, this.columns + 2, this.size)
    return this
  }

  ramdonIndex(length) {
    return Math.floor(Math.random() * length)
  }

  updateMaze() {
    const bgColors = this.cells.map(v => {
      return [
        this.bgColor,
        ...v.map(v => {
          if (v.color === 1) return this.color
          if (v.color === 0) return this.bgColor
          if (v.color === -1) return this.nextColor
        }),
        this.bgColor]
    })
    bgColors.unshift(Array(this.columns + 2).fill(this.bgColor))
    bgColors.push(Array(this.columns + 2).fill(this.bgColor))
    this.ws.getRange(this.start.row, this.start.column, bgColors.length, bgColors[0].length).setBackgrounds(bgColors)
    return this
  }

  updateWalls() {
    const walls = []
    this.cells.forEach((cellsInRow, x) => {
      cellsInRow.forEach((cell, y) => {
        if (cell.color === 1) return
        let count = 0
        const topCell = x - 1 >= 0 ? this.cells[x - 1][y] : {}
        if (topCell.color === 1) count++
        const rightCell = y + 1 < this.columns ? this.cells[x][y + 1] : {}
        if (rightCell.color === 1) count++
        const bottomCell = x + 1 < this.rows ? this.cells[x + 1][y] : {}
        if (bottomCell.color === 1) count++
        const leftCell = y - 1 >= 0 ? this.cells[x][y - 1] : {}
        if (leftCell.color === 1) count++
        if (count === 1) {
          cell.color = -1
          walls.push(cell)
        } else {
          cell.color = 0
        }
      })
    })
    this.walls = walls
    return this
  }

  build() {
    const startCell = this.cells[this.ramdonIndex(this.rows)][this.ramdonIndex(this.columns)]
    startCell.color = 1
    this.updateWalls().updateMaze()
    let count = 0
    // SpreadsheetApp.flush()
    while (this.walls.length) {
      let nextCellIndex = this.ramdonIndex(this.walls.length)
      let nextCell = this.walls[nextCellIndex]
      nextCell.color = 1
      this.updateWalls()
      // this.updateMaze()
      // SpreadsheetApp.flush()
      if (count % this.refreshPerCells === 0) this.updateMaze()
      count++
    }
    return this.updateMaze()
  }
}

class App {
  constructor() {
    this.name = "🧩 Maze"
    this.ss = SpreadsheetApp.getActive()
    this.sheetName = {
      maze: "🧩 Maze",
      settings: "⚙️ Settings"
    }
  }

  getUi() {
    return SpreadsheetApp.getUi()
  }

  toast(msg, title = this.name, timeout = 12) {
    return this.ss.toast(msg, title, timeout)
  }

  randomHexColor(exceptions = null) {
    function toHexString(number) {
      const hexString = (number).toString(16)
      return `0${hexString}`.slice(-2)
    }
    const red = toHexString(Math.floor(Math.random() * 256))
    const green = toHexString(Math.floor(Math.random() * 256))
    const blue = toHexString(Math.floor(Math.random() * 256))
    const color = `#${red}${green}${blue}`.toUpperCase()
    if (!exceptions) return color
    if (exceptions.includes(color)) return randomHexColor(exceptions)
    return color
  }

  onOpen() {
    const ui = this.getUi();
    ui.createMenu(this.name)
      .addItem("Create", "createMaze")
      .addToUi()
  }

  getSettings() {
    const data = {}
    const ws = this.ss.getSheetByName(this.sheetName.settings)
    if (!ws) return data
    const dataRange = ws.getDataRange()
    const colors = dataRange.getBackgrounds().slice(1)
    ws.getDataRange().getValues().slice(1)
      .forEach(([key, value], index) => {
        if (/color/gi.test(key)) {
          data[key] = value || colors[index][1].toUpperCase()
        } else {
          data[key] = value
        }
      })
    data.start = {
      row: data.startRow,
      column: data.startColumn
    }
    data.matrix = {
      rows: data.matrixRows,
      columns: data.matrixColumns,
      color: data.matrixColor,
      colors: data.matrixColor.includes(",") ? data.matrixColor.split(/\s*,\s*/) : null
    }
    return data
  }

  createMaze() {
    const settings = this.getSettings()
    const ws = this.ss.getSheetByName(this.sheetName.maze) || this.ss.insertSheet(this.sheetName.maze);
    settings.ws = ws
    ws.clear()
    ws.activate()
    const originalStartColumn = settings.start.column
    let count = 0
    for (let i = 0; i < settings.matrix.rows; i ++) {
      for (let j = 0; j < settings.matrix.columns; j ++) {
        if (/^#[A-Z0-9]{6}$/.test(settings.matrix.color)) {
          settings.color = settings.matrix.color 
        } else if (settings.matrix.colors) {
          settings.color = settings.matrix.colors[count] || this.randomHexColor([settings.bgColor, settings.nextColor, settings.color])
        } else {
          settings.color = this.randomHexColor([settings.bgColor, settings.nextColor, settings.color])
        }
        const maze = new Maze(settings)
        maze.build()
        settings.start.column += settings.columns + 3
        count ++
      }
      settings.start.row += settings.rows + 3
      settings.start.column = originalStartColumn
    }
    this.toast("Done!")
  }
}

const onOpen = e => new App().onOpen(e)
const createMaze = () => new App().createMaze()

