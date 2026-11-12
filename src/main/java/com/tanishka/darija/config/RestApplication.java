package com.tanishka.darija.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.security.enterprise.authentication.mechanism.http.BasicAuthenticationMechanismDefinition;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

@ApplicationScoped
@BasicAuthenticationMechanismDefinition(realmName = "Translator API")
@ApplicationPath("/api")
public class RestApplication extends Application {

}