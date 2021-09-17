const onFormSubmit_ = (e) => GFC.concatenate(e, "Responses", "Source")
const createTrigger = () => GFC.createTrigger()

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("GFC")
        .addItem("Create trigger", "createTrigger")
        .addToUi()
}
