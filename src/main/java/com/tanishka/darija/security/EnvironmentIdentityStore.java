package com.tanishka.darija.security;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.annotation.Priority;
import jakarta.security.enterprise.credential.Credential;
import jakarta.security.enterprise.credential.UsernamePasswordCredential;
import jakarta.security.enterprise.identitystore.CredentialValidationResult;
import jakarta.security.enterprise.identitystore.IdentityStore;

import java.util.Set;

@ApplicationScoped
@Priority(100)
public class EnvironmentIdentityStore implements IdentityStore {

    @Override
    public CredentialValidationResult validate(Credential credential) {

        if (!(credential instanceof UsernamePasswordCredential)) {
            return CredentialValidationResult.NOT_VALIDATED_RESULT;
        }

        String expectedUsername =
                System.getenv("TRANSLATOR_USERNAME");

        String expectedPassword =
                System.getenv("TRANSLATOR_PASSWORD");

        if (expectedUsername == null || expectedPassword == null
                || expectedUsername.isBlank() || expectedPassword.isBlank()) {

            System.err.println(
                    "Security configuration error: authentication credentials are not configured."
            );

            return CredentialValidationResult.INVALID_RESULT;
        }

        UsernamePasswordCredential usernamePasswordCredential =
                (UsernamePasswordCredential) credential;

        if (usernamePasswordCredential.compareTo(
                expectedUsername,
                expectedPassword)) {

            return new CredentialValidationResult(
                    expectedUsername,
                    Set.of("USER")
            );
        }

        return CredentialValidationResult.INVALID_RESULT;
    }
}