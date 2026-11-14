import json
import base64
import urllib.request
import urllib.error
import getpass

API_URL = (
    "http://localhost:8080/"
    "llm-darija-translator-1.0-SNAPSHOT/api/translate"
)


def translate(text, target_language, username, password):
    """Send a translation request to the Java REST API."""

    request_data = {
        "text": text,
        "targetLanguage": target_language
    }

    json_data = json.dumps(request_data).encode("utf-8")

    credentials = f"{username}:{password}".encode("utf-8")
    encoded_credentials = base64.b64encode(credentials).decode("ascii")

    request = urllib.request.Request(
        API_URL,
        data=json_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {encoded_credentials}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result.get("translatedText", "No translation returned.")

    except urllib.error.HTTPError as error:
        if error.code == 401:
            return "Authentication failed. Check your username and password."
        elif error.code == 403:
            return "Access denied. Your account may not have the required role."
        elif error.code == 400:
            return "Invalid request. Please check the text and language."
        elif error.code == 502:
            return "Translation service error. Please try again later."
        else:
            return f"API error: HTTP {error.code}"

    except urllib.error.URLError as error:
        return f"Connection error: {error.reason}"

    except json.JSONDecodeError:
        return "Error: The API returned an invalid response."

    except TimeoutError:
        return "Request timed out. Please try again."


def main():
    print("=" * 45)
    print("       MULTILINGUAL TRANSLATOR")
    print("=" * 45)

    username = input("Username: ")
    password = getpass.getpass("Password: ")

    while True:
        print("\nAvailable languages:")
        print("1. Moroccan Darija")
        print("2. Hindi")
        print("3. Exit")

        choice = input("\nChoose an option: ").strip()

        if choice == "3":
            print("Goodbye!")
            break

        if choice == "1":
            language = "DARIJA"
        elif choice == "2":
            language = "HINDI"
        else:
            print("Invalid choice. Please select 1, 2, or 3.")
            continue

        text = input("\nEnter English text: ").strip()

        if not text:
            print("Please enter some text.")
            continue

        print("\nTranslating...")

        result = translate(text, language, username, password)

        print("\nTranslated Text:")
        print("-" * 45)
        print(result)
        print("-" * 45)


if __name__ == "__main__":
    main()