package com.tanishka.darija.dto;

public class TranslationRequest {

    private String text;
    private String targetLanguage = "DARIJA";

    // Default constructor
    public TranslationRequest() {
    }

    // Parameterized constructor
    public TranslationRequest(String text, String targetLanguage) {
        this.text = text;
        setTargetLanguage(targetLanguage);
    }

    // Getters and Setters

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getTargetLanguage() {
        return targetLanguage;
    }

    public void setTargetLanguage(String targetLanguage) {
        if (targetLanguage == null || targetLanguage.isBlank()) {
            this.targetLanguage = "DARIJA";
        } else {
            this.targetLanguage = targetLanguage.trim().toUpperCase();
        }
    }
}