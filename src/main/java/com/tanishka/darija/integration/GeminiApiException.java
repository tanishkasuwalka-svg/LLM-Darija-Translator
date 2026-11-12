package com.tanishka.darija.integration;

public class GeminiApiException extends RuntimeException {

    private final int statusCode;

    // Constructor for general errors
    public GeminiApiException(String message) {
        super(message);
        this.statusCode = 0;
    }

    // Constructor for errors with a cause
    public GeminiApiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 0;
    }

    // Constructor for HTTP errors
    public GeminiApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    // Getter for HTTP status code
    public int getStatusCode() {
        return statusCode;
    }
}