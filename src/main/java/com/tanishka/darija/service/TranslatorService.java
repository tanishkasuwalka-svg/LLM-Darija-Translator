package com.tanishka.darija.service;

import com.tanishka.darija.dto.TranslationRequest;
import com.tanishka.darija.dto.TranslationResponse;
import com.tanishka.darija.integration.GeminiClient;

import jakarta.enterprise.context.Dependent;
import jakarta.inject.Inject;

@Dependent
public class TranslatorService {

    private final GeminiClient geminiClient;

    @Inject
    public TranslatorService(GeminiClient geminiClient) {
        this.geminiClient = geminiClient;
    }

    public TranslationResponse translate(TranslationRequest request) {

        if (request == null || request.getText() == null
                || request.getText().isBlank()) {
            throw new IllegalArgumentException(
                    "Source text cannot be null or empty."
            );
        }

        String sourceText = request.getText().trim();

        String targetLanguage = request.getTargetLanguage();

        if (targetLanguage == null || targetLanguage.isBlank()) {
            targetLanguage = "DARIJA";
        }

        targetLanguage = targetLanguage.trim().toUpperCase();

        String prompt = buildPrompt(sourceText, targetLanguage);

        String translatedText =
                geminiClient.generateContent(prompt);

        String targetLanguageName =
                getTargetLanguageName(targetLanguage);

        return new TranslationResponse(
                sourceText,
                translatedText,
                "English",
                targetLanguageName
        );
    }

    private String buildPrompt(String sourceText, String targetLanguage) {

        switch (targetLanguage) {

            case "DARIJA":
                return """
                        You are an expert translator specializing in
                        Moroccan Arabic (Darija).

                        Translate the following English text into
                        natural, everyday Moroccan Darija as spoken
                        by people in Morocco.

                        Translation requirements:
                        - Preserve the original meaning and context.
                        - Maintain the original tone and intention.
                        - Prioritize natural Moroccan expressions.
                        - Avoid overly formal Modern Standard Arabic.
                        - Use Arabic script.
                        - Do not add explanations or commentary.
                        - Return only the translated text.

                        English text:
                        """ + sourceText;

            case "HINDI":
                return """
                        You are an expert English-to-Hindi translator.

                        Translate the following English text into
                        natural, standard Hindi.

                        Translation requirements:
                        - Preserve the original meaning and context.
                        - Maintain the original tone and intention.
                        - Use natural and grammatically correct Hindi.
                        - Use Devanagari script.
                        - Avoid unnecessary additions or omissions.
                        - Do not add explanations or commentary.
                        - Return only the translated text.

                        English text:
                        """ + sourceText;

            default:
                throw new IllegalArgumentException(
                        "Unsupported target language: "
                                + targetLanguage
                                + ". Supported languages are DARIJA and HINDI."
                );
        }
    }

    private String getTargetLanguageName(String targetLanguage) {

        switch (targetLanguage) {

            case "DARIJA":
                return "Moroccan Arabic (Darija)";

            case "HINDI":
                return "Hindi";

            default:
                throw new IllegalArgumentException(
                        "Unsupported target language: " + targetLanguage
                );
        }
    }
}