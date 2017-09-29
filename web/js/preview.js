document.addEventListener("DOMContentLoaded", writeExportErrorText);

// Extracts the errors that occured during the export and writes them on the page
function writeExportErrorText(event) {
    var errorDiv = document.getElementById("exportErrorText");
    if ((typeof(localStorage.exportErrorText) != undefined) && (localStorage.exportErrorText.length > 0)) {
        errorDiv.innerHTML = "<b>Invalid graph:</b> " + localStorage.exportErrorText;
    } else {
        errorDiv.innerHTML = "<b>Error:</b> Could not load preview. Please try again.";
    }
}
