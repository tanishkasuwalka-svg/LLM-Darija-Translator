import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";

const API_URL =
    "http://10.126.132.16:8080/llm-darija-translator-1.0-SNAPSHOT/api/translate";

// UTF-8 compatible Base64 encoder
function encodeBase64(input) {
  const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const bytes = unescape(encodeURIComponent(input));
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes.charCodeAt(i);
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? bytes.charCodeAt(i + 1) : 0;
    const c = hasC ? bytes.charCodeAt(i + 2) : 0;

    output += chars[a >> 2];
    output += chars[((a & 3) << 4) | (b >> 4)];
    output += hasB ? chars[((b & 15) << 2) | (c >> 6)] : "=";
    output += hasC ? chars[c & 63] : "=";
  }

  return output;
}

export default function App() {
  const [screen, setScreen] = useState("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [authToken, setAuthToken] = useState("");

  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("DARIJA");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // LOGIN
  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setMessage("Please enter your username and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const token =
        "Basic " + encodeBase64(username.trim() + ":" + password);

    try {
      // Empty text is used to check authentication.
      // The backend should reject the empty text after authentication.
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          text: "",
          targetLanguage: "DARIJA",
        }),
      });

      if (response.status === 401 || response.status === 403) {
        setMessage("Invalid username or password.");
        return;
      }

      if (
          response.ok ||
          response.status === 400 ||
          response.status === 422
      ) {
        setAuthToken(token);
        setScreen("translator");
        setMessage("");
        return;
      }

      setMessage(
          "Unable to verify login. Server returned: " + response.status
      );
    } catch (error) {
      setMessage(
          "Cannot connect to the server. Check that WildFly is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // TRANSLATE
  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setMessage("Please enter some text to translate.");
      return;
    }

    setLoading(true);
    setMessage("");
    setTranslatedText("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          text: inputText.trim(),
          targetLanguage: targetLanguage,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        setMessage("Your session is no longer valid. Please log in again.");
        setAuthToken("");
        setScreen("login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || data.error || "Translation failed.");
        return;
      }

      setTranslatedText(
          data.translatedText ||
          data.translation ||
          data.result ||
          "No translation was returned."
      );
    } catch (error) {
      setMessage("Could not connect to the translation server.");
    } finally {
      setLoading(false);
    }
  };

  // COPY TRANSLATION
  const handleCopy = async () => {
    if (!translatedText) return;

    await Clipboard.setStringAsync(translatedText);
    setMessage("Translation copied to clipboard!");
  };

  // LOGOUT
  const handleLogout = () => {
    setAuthToken("");
    setUsername("");
    setPassword("");
    setInputText("");
    setTranslatedText("");
    setTargetLanguage("DARIJA");
    setMessage("");
    setScreen("login");
  };

  // LOGIN SCREEN
  if (screen === "login") {
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.loginCard}>
            <Text style={styles.logo}>🌍</Text>
            <Text style={styles.title}>Darija Translator</Text>
            <Text style={styles.subtitle}>
              Your English to Moroccan Arabic translator
            </Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {message ? (
                <Text style={styles.error}>{message}</Text>
            ) : null}

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
                disabled={loading}
            >
              {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
              ) : (
                  <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footer}>
              Powered by Gemini AI
            </Text>
          </View>
        </KeyboardAvoidingView>
    );
  }

  // TRANSLATOR SCREEN
  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Translator</Text>
              <Text style={styles.subtitle}>
                English to your preferred language
              </Text>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Translate into</Text>

          <View style={styles.languageContainer}>
            <TouchableOpacity
                style={[
                  styles.languageButton,
                  targetLanguage === "DARIJA" &&
                  styles.selectedLanguage,
                ]}
                onPress={() => {
                  setTargetLanguage("DARIJA");
                  setTranslatedText("");
                  setMessage("");
                }}
            >
              <Text
                  style={[
                    styles.languageText,
                    targetLanguage === "DARIJA" &&
                    styles.selectedLanguageText,
                  ]}
              >
                🇲🇦 Darija
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                  styles.languageButton,
                  targetLanguage === "HINDI" &&
                  styles.selectedLanguage,
                ]}
                onPress={() => {
                  setTargetLanguage("HINDI");
                  setTranslatedText("");
                  setMessage("");
                }}
            >
              <Text
                  style={[
                    styles.languageText,
                    targetLanguage === "HINDI" &&
                    styles.selectedLanguageText,
                  ]}
              >
                🇮🇳 Hindi
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>English text</Text>

          <TextInput
              style={styles.textArea}
              placeholder="Enter the text you want to translate..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
          />

          <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTranslate}
              disabled={loading}
          >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.buttonText}>Translate</Text>
            )}
          </TouchableOpacity>

          {message ? (
              <Text style={styles.infoMessage}>{message}</Text>
          ) : null}

          {translatedText ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                  {targetLanguage === "DARIJA"
                      ? "Moroccan Darija"
                      : "Hindi Translation"}
                </Text>

                <Text
                    style={[
                      styles.resultText,
                      targetLanguage === "DARIJA" &&
                      styles.rtlText,
                    ]}
                >
                  {translatedText}
                </Text>

                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopy}
                >
                  <Text style={styles.copyButtonText}>
                    📋 Copy Translation
                  </Text>
                </TouchableOpacity>
              </View>
          ) : null}

          <Text style={styles.footer}>
            Powered by Gemini AI
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F5FA",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 22,
    paddingTop: 55,
    paddingBottom: 40,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    margin: 22,
    padding: 25,
    borderRadius: 18,
    elevation: 4,
  },
  logo: {
    fontSize: 45,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#263B65",
  },
  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 6,
    marginBottom: 25,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263B65",
    marginBottom: 9,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#F6F7FB",
    borderWidth: 1,
    borderColor: "#DDE1EB",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE1EB",
    borderRadius: 12,
    padding: 15,
    minHeight: 145,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#3157A4",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  error: {
    color: "#D32F2F",
    marginTop: 14,
    textAlign: "center",
  },
  infoMessage: {
    color: "#3157A4",
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#FCE8E8",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 8,
  },
  logoutText: {
    color: "#C62828",
    fontWeight: "600",
  },
  languageContainer: {
    flexDirection: "row",
    gap: 12,
  },
  languageButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE1EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  selectedLanguage: {
    backgroundColor: "#3157A4",
    borderColor: "#3157A4",
  },
  languageText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263B65",
  },
  selectedLanguageText: {
    color: "#FFFFFF",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 13,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#E0E5EF",
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#263B65",
    marginBottom: 15,
  },
  resultText: {
    fontSize: 20,
    color: "#222222",
    lineHeight: 32,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  copyButton: {
    backgroundColor: "#E9EFFB",
    padding: 13,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 18,
  },
  copyButtonText: {
    color: "#3157A4",
    fontWeight: "bold",
    fontSize: 15,
  },
  footer: {
    textAlign: "center",
    color: "#999999",
    fontSize: 12,
    marginTop: 30,
  },
});