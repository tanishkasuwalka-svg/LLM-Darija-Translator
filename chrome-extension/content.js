"use strict";

/**
 * Detect text selected by the user on the webpage
 * and send it to the extension's background service worker.
 */
function sendSelectedText() {

    const selectedText = window.getSelection()?.toString().trim();

    if (!selectedText) {
        return;
    }

    chrome.runtime.sendMessage({
        type: "WEBPAGE_TEXT_SELECTED",
        text: selectedText
    }).catch(error => {
        console.debug("Could not send selected text:", error);
    });
}

// Detect mouse-based text selection.
document.addEventListener("mouseup", () => {
    // Small delay allows the browser to finish updating the selection.
    setTimeout(sendSelectedText, 100);
});

// Detect keyboard-based text selection.
document.addEventListener("keyup", (event) => {

    const selectionKeys = [
        "Shift",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End"
    ];

    if (selectionKeys.includes(event.key)) {
        setTimeout(sendSelectedText, 100);
    }
});