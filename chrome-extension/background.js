"use strict";

const STORAGE_KEY = "pendingSelectedText";

// Configure the extension's side panel.
async function configureSidePanel() {
    try {
        await chrome.sidePanel.setPanelBehavior({
            openPanelOnActionClick: true
        });
    } catch (error) {
        console.error("Side panel configuration failed:", error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    configureSidePanel();
});

chrome.runtime.onStartup.addListener(() => {
    configureSidePanel();
});

// Receive selected webpage text from content.js.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "WEBPAGE_TEXT_SELECTED") {
        return;
    }

    const selectedText =
        typeof message.text === "string" ? message.text.trim() : "";

    if (!selectedText) {
        return;
    }

    (async () => {
        try {
            // Save the selected text for the side panel.
            await chrome.storage.session.set({
                [STORAGE_KEY]: {
                    text: selectedText,
                    status: "ready",
                    timestamp: Date.now()
                }
            });

            // Notify the side panel if it is open.
            try {
                await chrome.runtime.sendMessage({
                    type: "SELECTED_TEXT_UPDATED",
                    text: selectedText
                });
            } catch (error) {
                // The side panel may not be open yet.
            }

            sendResponse({ success: true });
        } catch (error) {
            console.error("Could not save selected text:", error);
            sendResponse({ success: false });
        }
    })();

    return true;
});