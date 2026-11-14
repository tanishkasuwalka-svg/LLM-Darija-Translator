package com.tanishka.darija.security;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.security.enterprise.AuthenticationStatus;
import jakarta.security.enterprise.authentication.mechanism.http.HttpAuthenticationMechanism;
import jakarta.security.enterprise.authentication.mechanism.http.HttpMessageContext;
import jakarta.security.enterprise.credential.UsernamePasswordCredential;
import jakarta.security.enterprise.credential.Password;
import jakarta.security.enterprise.identitystore.CredentialValidationResult;
import jakarta.security.enterprise.identitystore.IdentityStoreHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@ApplicationScoped
@Priority(100)
public class CorsAwareBasicAuthenticationMechanism
        implements HttpAuthenticationMechanism {

    @Inject
    private IdentityStoreHandler identityStoreHandler;

    @Override
    public AuthenticationStatus validateRequest(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpMessageContext context) {

        // Allow CORS preflight requests without authentication.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return context.doNothing();
        }

        String authorization = request.getHeader("Authorization");

        if (authorization == null ||
                !authorization.regionMatches(true, 0, "Basic ", 0, 6)) {
            return unauthorized(response);
        }

        try {
            String encodedCredentials = authorization.substring(6).trim();

            byte[] decoded = Base64.getDecoder().decode(encodedCredentials);
            String credentials = new String(decoded, StandardCharsets.UTF_8);

            int separator = credentials.indexOf(':');

            if (separator < 0) {
                return unauthorized(response);
            }

            String username = credentials.substring(0, separator);
            String password = credentials.substring(separator + 1);

            UsernamePasswordCredential credential =
                    new UsernamePasswordCredential(
                            username,
                            new Password(password)
                    );

            CredentialValidationResult result =
                    identityStoreHandler.validate(credential);

            if (result.getStatus() ==
                    CredentialValidationResult.Status.VALID) {
                return context.notifyContainerAboutLogin(result);
            }

        } catch (IllegalArgumentException exception) {
            return unauthorized(response);
        }

        return unauthorized(response);
    }

    private AuthenticationStatus unauthorized(
            HttpServletResponse response) {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        return AuthenticationStatus.SEND_FAILURE;
    }

    @Override
    public AuthenticationStatus secureResponse(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpMessageContext context) {
        return AuthenticationStatus.SUCCESS;
    }

    @Override
    public void cleanSubject(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpMessageContext context) {
        // No additional cleanup required.
    }
}