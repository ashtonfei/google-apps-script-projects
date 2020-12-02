const APP_NAME = "Zoom Transcript App"
const SN_SUMMARY = "Summary"
const FN_TRANSCRIPTS = "Transcripts"

class App {
    constructor() {
        this.ss = SpreadsheetApp.getActive()
        this.id = this.ss.getId()
        this.currentFolder = this.getCurrentFolder()
    }
    
    getFolderByName(name){
        const folders = this.currentFolder.getFoldersByName(name)
        if (folders.hasNext()) return folders.next()
        return this.currentFolder.createFolder(name)
    }
    
    
    getCurrentFolder() {
        return DriveApp.getFileById(this.id).getParents().next()
    }
    
    getTranscriptFiles() {
        const folder = this.getFolderByName(FN_TRANSCRIPTS)
        const files = folder.getFiles()
        const extension = ".rtf"
        const transcripts = []
        while (files.hasNext()) {
            const file = files.next()
            const fileName = file.getName()
            if( fileName.lastIndexOf(extension) === fileName.length - extension.length ) transcripts.push(file)
        }
        return transcripts
    }
    
    convertToDoc(file){
        const resource = {
            title: file.getName().replace(".rtf", ""),
            mimeType: MimeType.GOOGLE_DOCS,
        }
        const mediaData = file.getBlob()
        const optionalArgs = {convert: true}
        const doc = Drive.Files.insert(resource, mediaData, optionalArgs)
        return doc
    }
    
    handleTranscript(file){
        const doc = this.convertToDoc(file)
        const tempFile = DriveApp.getFileById(doc.id)
        const fileName = tempFile.getName()
        const text = DocumentApp.openById(doc.id).getBody().getText().replace(/\n\n\n+/, "\n\n")
        tempFile.setTrashed(true)
        
        const blocks = text.split("\n\n")
        blocks.shift()
        const today = new Date().toLocaleDateString()
        
        let segments = blocks.map(block => {
            const [segment, time, ...rest] = block.split("\n")
            let [start, end] = time.split("-->")
            start = start.trim()
            end = end.trim()
            
            const timeUsed = (new Date(today + " " + end).getTime() - new Date(today + " " + start).getTime()) / 1000
            const [speaker, ...contents] = rest.join("").split(":")
            
            const content = contents.join("").trim()
            const wordCount = content.split(" ").filter(v => v !== "").length
            
            return [segment.trim(), start, end, timeUsed, speaker.trim(), content, wordCount]
        })
        
        segments = segments.map(([segment, start, end, timeUsed, speaker, content, wordCount], i) => {
            const nextSegment = segments[i + 1]
            if (!nextSegment) return [segment, start, end, timeUsed, speaker, null, content, wordCount]
            const nextSpeaker = nextSegment[4]
            if (nextSpeaker !== speaker) {
                return [segment, start, end, timeUsed, speaker, nextSpeaker, content, wordCount]
            }else{
                return [segment, start, end, timeUsed, speaker, null, content, wordCount]
            }
        })
        
        const summary = this.summarize(segments)
        
        segments.unshift(["Segment", "Time Start", "Time End", "Time Used(s)", "Speaker", "Target", "Content", "Word Count"])
        
        const ws = this.ss.getSheetByName(fileName) || this.ss.insertSheet(fileName)
        ws.clearContents()
        
        let usedRangeValues = ws.getDataRange().getValues()
        let column = usedRangeValues[0].length
        column = column === 1 ? 1 : column + 2
        ws.getRange(1, column, summary.length, summary[0].length).setValues(summary)
        
        usedRangeValues = ws.getDataRange().getValues()
        column = usedRangeValues[0].length
        column = column === 1 ? 1 : column + 2
        ws.getRange(1, column, segments.length, segments[0].length).setValues(segments)

    }
    
    summarize(segments){
        let totalTalkTime = 0
        let totalHandoffs = 0
        let totalWords = 0
        let summary = {}
        segments.forEach(([segment, start, end, timeUsed, speaker, nextSpeaker, content, wordCount]) => {
            if (wordCount > 0){
                const speakerSummary = summary[speaker]
                const handoff = nextSpeaker ? 1 : 0
                totalTalkTime += timeUsed
                totalHandoffs += handoff
                totalWords += wordCount
                
                if (!speakerSummary) {
                    summary[speaker] = {
                        talkTime: timeUsed,
                        words: wordCount,
                        handoffs: handoff,
                    }
                }else{
                    speakerSummary.talkTime += timeUsed
                    speakerSummary.words += wordCount
                    speakerSummary.handoffs += handoff
                }
            }
        })
        
        
        const values = [ ["Speaker", "Total Talk Time", "%", "Handoffs", "%", "Total Words", "Words Per Minute"] ]
        
        Object.keys(summary).sort().forEach(key => {
            const { talkTime, words, handoffs } = summary[key]
            values.push([
                key,
                talkTime,
                talkTime / totalTalkTime,
                handoffs,
                handoffs / totalHandoffs,
                words,
                words / talkTime * 60
            ])
        })
        return values
    }
    
    run(){
      const files = this.getTranscriptFiles()
      files.forEach(file => this.handleTranscript(file))
      return files.length
    }
}

function onOpen(){
    const ui = SpreadsheetApp.getUi()
    const menu = ui.createMenu(APP_NAME)
    menu.addItem("Convert transcripts", "run")
    menu.addToUi()
}

function run() {
    const start = new Date().getTime()
    const ss = SpreadsheetApp.getActive()
    ss.toast("Converting transcript files on your drive...", APP_NAME)
    try{
        const app = new App()
        const count = app.run()
        const end = new Date().getTime()
        const usedTimeInSeconds = Math.floor((end - start) / 1000)
        ss.toast(`${count} transcript files have been converted to this spreadsheet. Used time in seconds ${usedTimeInSeconds}.`, APP_NAME + " - Success", 30) 
    }catch(e){
        ss.toast(e.message, APP_NAME + " - Error", 30)
    }
    
}
