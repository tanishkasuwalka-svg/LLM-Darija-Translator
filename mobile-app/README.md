# Multilingual Translator — Mobile Application

## Overview

This is the mobile client for the LLM-Powered Multilingual Translator project. It is developed using React Native and Expo.

The application allows users to translate English text into:
- Moroccan Darija
- Hindi

It connects to the Java RESTful web service, which uses Google's Gemini API to generate translations.

## Features

- Login using API credentials.
- Translate English text into Moroccan Darija or Hindi.
- Display translated text.
- Copy translations to the clipboard.
- Logout functionality.

## Technologies Used

- React Native
- Expo
- Java RESTful Web Service
- Google Gemini API
- Jakarta Basic Authentication

## Project Structure

```text
mobile-app/
├── assets/
├── App.js
├── app.json
├── index.js
├── package.json
└── README.md
```

## Setup and Execution

1. Install Node.js and npm.
2. Navigate to the mobile-app directory.
3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the Expo development server:

   ```bash
   npx expo start
   ```

5. Open the application using a compatible Expo development environment.


## Backend Configuration

The mobile application communicates with the Java RESTful API.

The API endpoint is configured in `App.js`:

```javascript
const API_URL =
  "http://10.126.132.16:8080/llm-darija-translator-1.0-SNAPSHOT/api/translate";
```

Before running the application, replace the IP address with the current IPv4 address of the computer hosting WildFly.

For physical device testing:
- Connect the phone and computer to the same Wi-Fi network.
- Make sure WildFly is running and accessible on the network.
- Ensure the required firewall access is allowed.

The application uses HTTP Basic Authentication to authenticate API requests.

## Developer

Developed as part of Mini Project 2:
LLM-Powered RESTful Web Service.