"use strict";

// Existing secured Java REST API.
const API_URL =
    "http://localhost:8080/llm-darija-translator-1.0-SNAPSHOT/api/translate";

// Session storage keys.
const CREDENTIALS_KEY = "translatorCredentials";
const LANGUAGE_KEY = "targetLanguage";
const STORAGE_KEY = "pendingSelectedText";

// Screen elements.
const setupScreen = document.getElementById("setupScreen");
const translatorScreen = document.getElementById("translatorScreen");

// Setup elements.
const connectionForm = document.getElementById("connectionForm");
const apiUsername = document.getElementById("apiUsername");
const apiPassword = document.getElementById("apiPassword");
const connectButton = document.getElementById("connectButton");
const setupStatus = document.getElementById("setupStatus");

// Translator elements.
const sourceText = document.getElementById("sourceText");
const targetLanguage = document.getElementById("targetLanguage");
const translatedResult = document.getElementById("translatedResult");
const characterCount = document.getElementById("characterCount");
const translationStatus = document.getElementById("translationStatus");
const resultLanguage = document.getElementById("resultLanguage");
const clearButton = document.getElementById("clearButton");
const copyButton = document.getElementById("copyButton");
const settingsButton = document.getElementById("settingsButton");

// Application state.
let credentials = null;
let currentTranslation = "";
let translationTimer = null;
let currentRequest = 0;
let lastTranslatedText = "";
let lastTranslatedLanguage = "";


/**
 * Show the initial connection screen.
 */
function showSetupScreen() {

    setupScreen.classList.remove("hidden");
    translatorScreen.classList.add("hidden");

    apiUsername.value = "";
    apiPassword.value = "";

    setupStatus.textContent = "";
}


/**
 * Show the main translator.
 */
function showTranslatorScreen() {

    setupScreen.classList.add("hidden");
    translatorScreen.classList.remove("hidden");

    updateLanguageLabel();
    updateCharacterCount();
}


/**
 * Display a status message.
 */
function setStatus(message, type = "") {

    translationStatus.textContent = message;

    translationStatus.className = type;
}


/**
 * Update the character counter.
 */
function updateCharacterCount() {

    const count = sourceText.value.length;

    characterCount.textContent = `${count} characters`;
}


/**
 * Update the selected language label.
 */
function updateLanguageLabel() {

    const language = targetLanguage.value;

    if (language === "HINDI") {
        resultLanguage.textContent = "Hindi";
    } else {
        resultLanguage.textContent = "Moroccan Darija";
    }
}


/**
 * Display a translation placeholder or message.
 */
function displayResult(message) {

    translatedResult.textContent = message;

    currentTranslation = "";

    copyButton.disabled = true;
}


/**
 * Connect using the supplied API credentials.
 *
 * The credentials are kept in session storage.
 * They are checked by the API on the first translation.
 */
async function connectToTranslator(event) {

    event.preventDefault();

    const username = apiUsername.value.trim();
    const password = apiPassword.value;

    if (!username || !password) {

        setupStatus.textContent =
            "Please enter both username and password.";

        setupStatus.className = "status-error";

        return;
    }

    connectButton.disabled = true;
    connectButton.textContent = "Connecting...";

    try {

        credentials = {
            username: username,
            password: password
        };

        await chrome.storage.session.set({
            [CREDENTIALS_KEY]: credentials
        });

        showTranslatorScreen();

        setStatus("Connected. Ready to translate.", "status-success");

        // Retrieve a selection made before opening the panel.
        await loadPendingSelection();

    } catch (error) {

        console.error("Connection setup error:", error);

        setupStatus.textContent =
            "Could not save your connection settings.";

        setupStatus.className = "status-error";

    } finally {

        connectButton.disabled = false;
        connectButton.textContent = "Connect";
    }
}


/**
 * Restore a previous session connection.
 */
async function restoreConnection() {

    try {

        const stored = await chrome.storage.session.get([
            CREDENTIALS_KEY,
            LANGUAGE_KEY
        ]);

        credentials = stored[CREDENTIALS_KEY] || null;

        if (stored[LANGUAGE_KEY]) {
            targetLanguage.value = stored[LANGUAGE_KEY];
        }

        if (credentials) {

            showTranslatorScreen();

            setStatus("Connected. Ready to translate.");

            await loadPendingSelection();

        } else {

            showSetupScreen();
        }

    } catch (error) {

        console.error("Could not restore session:", error);

        showSetupScreen();
    }
}


/**
 * Load selected text saved by background.js.
 */
async function loadPendingSelection() {

    try {

        const stored =
            await chrome.storage.session.get(STORAGE_KEY);

        const selection = stored[STORAGE_KEY];

        if (selection && selection.text) {

            await updateSourceText(selection.text);

            await chrome.storage.session.remove(STORAGE_KEY);
        }

    } catch (error) {

        console.error("Could not load selected text:", error);
    }
}


/**
 * Receive new selected text from a webpage.
 */
chrome.runtime.onMessage.addListener((message) => {

    if (
        message.type === "SELECTED_TEXT_UPDATED" &&
        typeof message.text === "string"
    ) {

        updateSourceText(message.text);
    }
});


/**
 * Update the source text and automatically translate.
 */
async function updateSourceText(text) {

    if (!credentials) {
        return;
    }

    const cleanedText = text.trim();

    if (!cleanedText) {
        return;
    }

    sourceText.value = cleanedText;

    updateCharacterCount();

    scheduleTranslation(300);
}


/**
 * Schedule automatic translation.
 *
 * The delay avoids unnecessary API calls when
 * the user is still typing or changing selection.
 */
function scheduleTranslation(delay = 700) {

    clearTimeout(translationTimer);

    translationTimer = setTimeout(() => {

        translateText();

    }, delay);
}


/**
 * Translate through the existing secured Java API.
 */
async function translateText() {

    const text = sourceText.value.trim();

    const language = targetLanguage.value;

    if (!text) {

        displayResult(
            "Your translation will appear here automatically."
        );

        setStatus("Ready to translate.");

        return;
    }

    if (!credentials) {

        setStatus(
            "Please connect to the translation service.",
            "status-error"
        );

        return;
    }

    // Avoid sending identical requests repeatedly.
    if (
        text === lastTranslatedText &&
        language === lastTranslatedLanguage &&
        currentTranslation
    ) {
        return;
    }

    const requestId = ++currentRequest;

    setStatus("Translating...", "");

    displayResult("Please wait. Translation is in progress.");

    updateLanguageLabel();

    try {

        const authorization = btoa(
            `${credentials.username}:${credentials.password}`
        );

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${authorization}`
            },

            body: JSON.stringify({
                text: text,
                targetLanguage: language
            })

        });

        const responseText = await response.text();

        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            data = {};
        }

        // Ignore an older response if newer text was selected.
        if (requestId !== currentRequest) {
            return;
        }

        if (response.status === 401) {

            throw new Error(
                "Authentication failed. Please check your credentials."
            );
        }

        if (response.status === 403) {

            throw new Error(
                "Access denied. Your account lacks permission."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                `Translation failed. HTTP ${response.status}.`
            );
        }

        if (!data.translatedText) {

            throw new Error(
                "The API did not return translated text."
            );
        }

        currentTranslation = data.translatedText;

        lastTranslatedText = text;
        lastTranslatedLanguage = language;

        translatedResult.textContent = currentTranslation;

        translatedResult.dir = "auto";

        copyButton.disabled = false;

        setStatus(
            "Translation completed successfully.",
            "status-success"
        );

    } catch (error) {

        if (requestId !== currentRequest) {
            return;
        }

        console.error("Translation error:", error);

        displayResult(error.message);

        setStatus(
            "Translation could not be completed.",
            "status-error"
        );
    }
}


/**
 * Clear the source and translation.
 */
function clearText() {

    clearTimeout(translationTimer);

    currentRequest++;

    sourceText.value = "";

    lastTranslatedText = "";
    lastTranslatedLanguage = "";

    updateCharacterCount();

    displayResult(
        "Your translation will appear here automatically."
    );

    setStatus("Ready to translate.");

    chrome.storage.session.remove(STORAGE_KEY)
        .catch(error => console.error(error));
}


/**
 * Copy the translated text.
 */
async function copyTranslation() {

    if (!currentTranslation) {
        return;
    }

    try {

        await navigator.clipboard.writeText(currentTranslation);

        setStatus(
            "Translation copied successfully.",
            "status-success"
        );

    } catch (error) {

        console.error("Clipboard error:", error);

        setStatus(
            "Could not copy the translation.",
            "status-error"
        );
    }
}


/**
 * Change the target language and translate again.
 */
async function changeLanguage() {

    const language = targetLanguage.value;

    updateLanguageLabel();

    await chrome.storage.session.set({
        [LANGUAGE_KEY]: language
    });

    lastTranslatedText = "";
    lastTranslatedLanguage = "";

    if (sourceText.value.trim()) {
        scheduleTranslation(150);
    }
}


/**
 * Return to the welcome screen and disconnect.
 */
async function disconnectTranslator() {

    const confirmed = confirm(
        "Do you want to disconnect and clear your session credentials?"
    );

    if (!confirmed) {
        return;
    }

    clearTimeout(translationTimer);

    currentRequest++;

    credentials = null;

    lastTranslatedText = "";
    lastTranslatedLanguage = "";

    currentTranslation = "";

    await chrome.storage.session.remove([
        CREDENTIALS_KEY,
        STORAGE_KEY
    ]);

    sourceText.value = "";

    displayResult(
        "Your translation will appear here automatically."
    );

    showSetupScreen();
}


// Event listeners.

connectionForm.addEventListener(
    "submit",
    connectToTranslator
);

sourceText.addEventListener("input", () => {

    updateCharacterCount();

    lastTranslatedText = "";
    lastTranslatedLanguage = "";

    scheduleTranslation(800);
});

targetLanguage.addEventListener(
    "change",
    changeLanguage
);

clearButton.addEventListener(
    "click",
    clearText
);

copyButton.addEventListener(
    "click",
    copyTranslation
);

settingsButton.addEventListener(
    "click",
    disconnectTranslator
);


// Initialize the extension.
document.addEventListener(
    "DOMContentLoaded",
    restoreConnection
);

// Also initialize if the DOMContentLoaded event
// already fired before this script executed.
if (document.readyState !== "loading") {
    restoreConnection();
}