package com.tanishka.darija.integration;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;

import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;

@ApplicationScoped
public class GeminiClient {

    private static final String API_BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    private static final Duration CONNECT_TIMEOUT =
            Duration.ofSeconds(15);

    private static final Duration REQUEST_TIMEOUT =
            Duration.ofSeconds(60);

    private final HttpClient httpClient;

    // Constructor: initializes the HTTP client
    public GeminiClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .build();
    }

    /**
     * Sends a prompt to Gemini and returns the generated text.
     */
    public String generateContent(String prompt) {

        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException(
                    "Prompt cannot be empty."
            );
        }

        // Retrieve configuration from environment variables
        String apiKey = getRequiredEnvironmentVariable(
                "GEMINI_API_KEY"
        );

        String modelName = getRequiredEnvironmentVariable(
                "GEMINI_MODEL"
        );

        // Construct Gemini API request body
        JsonObject requestBody = Json.createObjectBuilder()
                .add("contents", Json.createArrayBuilder()
                        .add(Json.createObjectBuilder()
                                .add("role", "user")
                                .add("parts", Json.createArrayBuilder()
                                        .add(Json.createObjectBuilder()
                                                .add("text", prompt)))))
                .add("generationConfig", Json.createObjectBuilder()
                        .add("temperature", 0.2)
                        .add("maxOutputTokens", 2048))
                .build();

        // Construct HTTP request
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(
                        API_BASE_URL + modelName + ":generateContent"
                ))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(
                        requestBody.toString()
                ))
                .build();

        try {

            // Send request to Gemini
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            int statusCode = response.statusCode();

            // Check HTTP response status
            if (statusCode < 200 || statusCode >= 300) {
                throw handleApiError(statusCode);
            }

            // Extract generated text
            return extractGeneratedText(response.body());

        } catch (HttpTimeoutException e) {

            throw new GeminiApiException(
                    "Gemini API request timed out.",
                    e
            );

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new GeminiApiException(
                    "Gemini API request was interrupted.",
                    e
            );

        } catch (GeminiApiException e) {

            throw e;

        } catch (Exception e) {

            throw new GeminiApiException(
                    "Unexpected error while communicating with Gemini.",
                    e
            );
        }
    }

    /**
     * Extracts generated text from Gemini JSON response.
     */
    private String extractGeneratedText(String responseBody) {

        try (JsonReader reader = Json.createReader(
                new StringReader(responseBody)
        )) {

            JsonObject root = reader.readObject();

            JsonArray candidates = root.getJsonArray("candidates");

            if (candidates == null || candidates.isEmpty()) {
                throw new GeminiApiException(
                        "Gemini returned no response candidates."
                );
            }

            JsonObject candidate = candidates.getJsonObject(0);

            JsonObject content = candidate.getJsonObject("content");

            if (content == null) {
                throw new GeminiApiException(
                        "Gemini returned no content."
                );
            }

            JsonArray parts = content.getJsonArray("parts");

            if (parts == null || parts.isEmpty()) {
                throw new GeminiApiException(
                        "Gemini returned no response parts."
                );
            }

            StringBuilder generatedText = new StringBuilder();

            for (int i = 0; i < parts.size(); i++) {

                JsonObject part = parts.getJsonObject(i);

                if (part.containsKey("text")) {
                    generatedText.append(
                            part.getString("text", "")
                    );
                }
            }

            String result = generatedText.toString().trim();

            if (result.isEmpty()) {
                throw new GeminiApiException(
                        "Gemini returned an empty response."
                );
            }

            return result;

        } catch (GeminiApiException e) {

            throw e;

        } catch (Exception e) {

            throw new GeminiApiException(
                    "Failed to parse Gemini JSON response.",
                    e
            );
        }
    }

    /**
     * Handles unsuccessful HTTP responses.
     */
    private GeminiApiException handleApiError(int statusCode) {

        String message = switch (statusCode) {

            case 400 ->
                    "Gemini rejected the request.";

            case 401, 403 ->
                    "Gemini authentication or authorization failed.";

            case 404 ->
                    "The configured Gemini model or endpoint was not found.";

            case 429 ->
                    "Gemini API quota or rate limit exceeded.";

            case 500, 502, 503, 504 ->
                    "Gemini service is temporarily unavailable.";

            default ->
                    "Gemini API returned an unexpected HTTP error.";
        };

        return new GeminiApiException(message, statusCode);
    }

    /**
     * Retrieves a required environment variable.
     */
    private String getRequiredEnvironmentVariable(String name) {

        String value = System.getenv(name);

        if (value == null || value.isBlank()) {
            throw new GeminiApiException(
                    "Missing required environment variable: " + name
            );
        }

        return value.trim();
    }
}