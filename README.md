# LLM-Powered Multilingual Translator

An LLM-powered RESTful web service that translates English text into Moroccan Darija and Hindi using Google's Gemini API.

## 1. Project Overview

This project implements a Java RESTful web service using Jakarta EE and integrates Google's Gemini API to perform AI-powered translations.

The service supports two target languages:

- **Moroccan Darija** – Moroccan Arabic dialect.
- **Hindi** – Indian language.

The backend provides a secured REST API that can be accessed through four different client applications:

1. Chrome Extension
2. PHP Web Application
3. Python Terminal Client
4. React Native Mobile Application

All clients communicate with the same Java RESTful backend.

## 2. System Architecture

The application follows a layered architecture:

- **Presentation Layer:** REST API resources that receive client requests.
- **Business Logic Layer:** Validates requests and manages translation operations.
- **Integration Layer:** Communicates with Google's Gemini API.
- **Security Layer:** Protects the REST endpoint using Jakarta Authentication and HTTP Basic Authentication.

### Technology Stack

| Component | Technology |
|---|---|
| Backend | Java 21 |
| Enterprise Framework | Jakarta EE 11 |
| REST API | Jakarta RESTful Web Services (JAX-RS) |
| Build Tool | Apache Maven |
| Application Server | WildFly 41 |
| AI Integration | Google Gemini API |
| Authentication | Jakarta Authentication, Basic Authentication |
| Browser Client | Chrome Extension, Manifest V3 |
| Web Client | PHP |
| Terminal Client | Python |
| Mobile Client | React Native and Expo |

## 3. Project Structure

```text
TanishkaSuwalka_project2/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/tanishka/darija/
│       │       ├── config/
│       │       ├── dto/
│       │       ├── filter/
│       │       ├── resource/
│       │       ├── security/
│       │       └── service/
│       │
│       ├── resources/
│       └── webapp/
│
├── chrome-extension/
│
├── php-client/
│   └── index.php
│
├── python-client/
│   └── translator.py
│
├── mobile-app/
│   ├── assets/
│   ├── App.js
│   ├── app.json
│   ├── index.js
│   ├── package.json
│   └── README.md
│
├── pom.xml
└── README.md
```

## 4. Backend Implementation

The Java backend exposes a RESTful endpoint for translation requests.

### Main Components

- **TranslatorResource:** Exposes the translation endpoint and handles incoming HTTP requests.
- **TranslatorService:** Contains the translation business logic and validates requests.
- **GeminiClient:** Communicates with Google's Gemini API and processes its responses.
- **EnvironmentIdentityStore:** Validates user credentials using environment variables.
- **CorsFilter:** Handles Cross-Origin Resource Sharing (CORS) for supported browser clients.
- **CorsAwareBasicAuthenticationMechanism:** Implements HTTP Basic Authentication while allowing CORS preflight requests.

### REST API Endpoint

```text
POST /llm-darija-translator-1.0-SNAPSHOT/api/translate
```

### Request Example

```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "DARIJA"
}
```

The `targetLanguage` field accepts:

- `DARIJA`
- `HINDI`

### Response Example

```json
{
  "sourceLanguage": "English",
  "sourceText": "Hello, how are you?",
  "targetLanguage": "Hindi",
  "translatedText": "नमस्ते, आप कैसे हैं?"
}
```

## 5. Authentication and Security

The REST API is protected using Jakarta Authentication with HTTP Basic Authentication.

Users must provide valid credentials when accessing the translation endpoint.

Authentication credentials are validated against environment variables:

- `TRANSLATOR_USERNAME`
- `TRANSLATOR_PASSWORD`

The Gemini API key and model configuration are also supplied through environment variables:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`

**Security note:** Never commit actual API keys, usernames, passwords or private environment files to the repository.

## 6. Client Applications

### A. Chrome Extension

The browser client is developed using Chrome Extension Manifest V3 and the Chrome Side Panel API.

Features include:

- Login using API credentials.
- Context-menu option to translate selected webpage text.
- Automatic transfer of selected text into the side panel.
- Translation into Moroccan Darija or Hindi.
- Automatic translation and copy functionality.

### B. PHP Web Application

The PHP client provides a browser-based interface for accessing the translation service.

Features include:

- Separate login and translator screens.
- User authentication.
- Language selection.
- English text input and translation.
- Display of translated results.
- Logout functionality.

### C. Python Terminal Client

The Python client provides command-line access to the translation service.

Features include:

- Terminal-based login.
- Secure password input.
- Darija and Hindi language selection.
- English text input.
- Translation results displayed directly in the terminal.
- Logout functionality.

The implementation uses Python standard libraries, including `urllib`, `json`, `base64` and `getpass`.

### D. React Native Mobile Application

The mobile client is developed using React Native and Expo.

Features include:

- Login screen.
- Darija and Hindi language selection.
- English text input.
- Translation results.
- Copy translation functionality.
- Logout functionality.

The application can be developed and previewed using Expo Snack.

## 7. Installation and Setup

### Prerequisites

- Java Development Kit (JDK) 21
- Apache Maven
- WildFly Application Server
- Node.js and npm
- Python 3
- PHP 8 or later
- A Google Gemini API key

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/tanishkasuwalka-svg/LLM-Darija-Translator.git
```

2. Navigate to the project directory:

```bash
cd LLM-Darija-Translator
```

3. Configure the required environment variables:

```text
GEMINI_API_KEY
GEMINI_MODEL
TRANSLATOR_USERNAME
TRANSLATOR_PASSWORD
```

Use your own credentials and API key. Do not place their actual values in the source code.

4. Build the Maven project:

```bash
mvn clean package
```

5. Deploy the generated WAR file to WildFly.

6. Start WildFly and ensure the application is successfully deployed.

### Chrome Extension Setup

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable Developer Mode.
4. Select **Load unpacked**.
5. Choose the `chrome-extension` directory.
6. Open the extension and configure your API credentials.

### PHP Client Setup

1. Navigate to the PHP client directory:

```bash
cd php-client
```

2. Start the PHP development server:

```bash
php -S localhost:8000
```

3. Open the application at:

```text
http://localhost:8000
```

### Python Client Setup

1. Navigate to the Python client directory:

```bash
cd python-client
```

2. Run the application:

```bash
python translator.py
```

3. Log in and select your target language.

### React Native Mobile Client Setup

1. Navigate to the mobile application directory:

```bash
cd mobile-app
```

2. Install the dependencies:

```bash
npm install
```

3. Configure the backend API URL in `App.js` to use an address reachable from the device running the application.

4. Start Expo:

```bash
npx expo start
```

5. Open the application using a compatible Expo development environment.

For physical-device testing, the mobile device and backend computer must be able to communicate over the network.

## 8. API Testing

The RESTful endpoint can be tested using tools such as:

- Postman
- cURL
- Thunder Client

Requests require HTTP Basic Authentication and a JSON request body.

Both supported target languages should be tested to verify the translation functionality.

## 9. Demonstration

The project demonstration showcases:

- The Java RESTful backend and Gemini integration.
- HTTP Basic Authentication.
- Chrome extension context-menu translation and side panel.
- PHP web application.
- Python terminal client.
- React Native mobile application.

## 10. Repository

**GitHub Repository:**

https://github.com/tanishkasuwalka-svg/LLM-Darija-Translator.git

---

**Project:** Mini Project 2 – LLM-Powered RESTful Web Service  
**Developer:** Tanishka Suwalka