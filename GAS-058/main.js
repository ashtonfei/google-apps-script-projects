/**
* Please make a copy of the code to your Google Drive
* This file is shared to all of you. Please DON'T edit the code here, or the others may make a copy of the verion after your edition.
*/

const share_with_respondent = true         // if you want to share the uploaded file to the respondent, make sure email collection is enabled in the form
const folder_keyword = "Folder"  // The question title in the form for the folder
const files_keyword = "Files"    // The question title in the form for the file uploader
const function_name = "_onFormSubmit"

function onOpen(){
    let triggerCreated = isTriggerCreated()
    if (triggerCreated === false){
        FormApp.getUi()
            .createMenu("App")
            .addItem("Create trigger", "createTrigger")
            .addToUi()
    }
}


// check if the trigger is created in the project
function isTriggerCreated(){
    let triggers = ScriptApp.getProjectTriggers()
    let isTriggerFound = false
    for ( let i = 0; i < triggers.length; i ++ ) {
        let trigger = triggers[i]
        if ( trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT &&
            trigger.getHandlerFunction() === function_name ){
            isTriggerFound = true
            break
        }
    }
    return isTriggerFound
}


// create a new trigger
function createTrigger(){
    let message = "Trigger has been created successfully."
    let form = FormApp.getActiveForm()
    try{
        ScriptApp.newTrigger(function_name)
            .forForm(form)
            .onFormSubmit()
            .create()
    } catch (e) {
        message = e.message
    }
    FormApp.getUi().alert("Message", message, FormApp.getUi().ButtonSet.OK)
}

function _onFormSubmit(e) {
    let response = e.response
//    let response = FormApp.getActiveForm().getResponses()[0]
    let items = response.getItemResponses()
    let foldername = getFolderName(items)
    let ids = getFileIds(items) 
    
    let shareWithRespondent = false
    if ( share_with_respondent && response.getRespondentEmail() ){
        shareWithRespondent = response.getRespondentEmail()
    }
    
    if (foldername && ids){
        moveFilesToFolder(ids, foldername, shareWithRespondent)
    }
}


// get the folder name from the response
function getFolderName(items){
    let foldername
    for ( let i = 0; i < items.length; i ++ ) {
        let title = items[i].getItem().getTitle()
        if (title === folder_keyword){
            foldername = items[i].getResponse()
            break
        }
    }
    return foldername
}

// get file ids from the reponse
function getFileIds(items){
    let urls
    for ( let i = 0; i < items.length; i ++ ) {
        let title = items[i].getItem().getTitle()
        if (title === files_keyword){
            urls = items[i].getResponse()
            break
        }
    }
    return urls
}

// search folder by name and create new folder when it's not found
function getFolderByName(foldername, parentFolder){
    let folder
    let folders = parentFolder.getFoldersByName(foldername)
    if ( folders.hasNext() ){
        folder = folders.next()
    }else{
        folder = parentFolder.createFolder(foldername)
    }
    return folder
}

// move files to destination folder and share files with repondent
function moveFilesToFolder( ids, foldername, shareWithRespondent = false ){
    let parentFolder = DriveApp.getFileById(ids[0]).getParents().next()
    let folder = getFolderByName(foldername, parentFolder)
    ids.forEach(id=>{
        let file = DriveApp.getFileById(id)
        file.moveTo(folder)
        if (shareWithRespondent){
            try{
                file.addViewer(shareWithRespondent)
            }catch(e){
                //pass
            }
        }
    })
}


