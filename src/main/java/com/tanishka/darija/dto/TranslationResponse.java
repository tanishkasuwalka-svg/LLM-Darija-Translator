package com.tanishka.darija.dto;

public class TranslationResponse {

    private String sourceText;
    private String translatedText;
    private String sourceLanguage;
    private String targetLanguage;

    // Default constructor
    public TranslationResponse() {
    }

    // Parameterized constructor
    public TranslationResponse(
            String sourceText,
            String translatedText,
            String sourceLanguage,
            String targetLanguage) {

        this.sourceText = sourceText;
        this.translatedText = translatedText;
        this.sourceLanguage = sourceLanguage;
        this.targetLanguage = targetLanguage;
    }

    // Getters and Setters

    public String getSourceText() {
        return sourceText;
    }

    public void setSourceText(String sourceText) {
        this.sourceText = sourceText;
    }

    public String getTranslatedText() {
        return translatedText;
    }

    public void setTranslatedText(String translatedText) {
        this.translatedText = translatedText;
    }

    public String getSourceLanguage() {
        return sourceLanguage;
    }

    public void setSourceLanguage(String sourceLanguage) {
        this.sourceLanguage = sourceLanguage;
    }

    public String getTargetLanguage() {
        return targetLanguage;
    }

    public void setTargetLanguage(String targetLanguage) {
        this.targetLanguage = targetLanguage;
    }
}