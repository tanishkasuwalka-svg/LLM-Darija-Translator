package com.tanishka.darija.resource;

import com.tanishka.darija.dto.TranslationRequest;
import com.tanishka.darija.dto.TranslationResponse;
import com.tanishka.darija.integration.GeminiApiException;
import com.tanishka.darija.service.TranslatorService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/translate")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class TranslatorResource {

    @Inject
    private TranslatorService translatorService;

    public TranslatorResource() {
    }

    @POST
    public Response translate(TranslationRequest request) {

        try {
            TranslationResponse translationResponse =
                    translatorService.translate(request);

            return Response.ok(translationResponse).build();

        } catch (IllegalArgumentException e) {

            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();

        } catch (GeminiApiException e) {

            System.err.println("GEMINI API DIAGNOSTIC");
            System.err.println("HTTP Status: " + e.getStatusCode());
            System.err.println("Error Details: " + e.getMessage());

            return Response.status(Response.Status.BAD_GATEWAY)
                    .entity(Map.of(
                            "error",
                            "Translation service is currently unavailable."
                    ))
                    .build();

        } catch (Exception e) {

            e.printStackTrace();

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "error",
                            "An unexpected error occurred."
                    ))
                    .build();
        }
    }
}