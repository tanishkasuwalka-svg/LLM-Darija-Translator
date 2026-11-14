import json
import base64
import urllib.request
import urllib.error
import getpass
import os

API_URL = (
    "http://localhost:8080/"
    "llm-darija-translator-1.0-SNAPSHOT/api/translate"
)


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def create_auth_header(username, password):
    credentials = f"{username}:{password}".encode("utf-8")
    encoded = base64.b64encode(credentials).decode("ascii")
    return f"Basic {encoded}"


def verify_login(username, password):
    """Verify credentials before opening the translator."""

    request_data = {
        "text": "",
        "targetLanguage": "DARIJA"
    }

    request = urllib.request.Request(
        API_URL,
        data=json.dumps(request_data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": create_auth_header(username, password)
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return True

    except urllib.error.HTTPError as error:
        if error.code in (401, 403):
            return False

        # The backend may reject empty text after authentication.
        if error.code in (400, 422):
            return True

        print(f"Login verification failed: HTTP {error.code}")
        return False

    except urllib.error.URLError as error:
        print(f"Cannot connect to the server: {error.reason}")
        return None

    except TimeoutError:
        print("Connection timed out.")
        return None


def login():
    """Display the login screen."""

    while True:
        clear_screen()

        print("=" * 50)
        print("              MULTILINGUAL TRANSLATOR")
        print("=" * 50)
        print("\n                     LOGIN")
        print("-" * 50)

        username = input("Username: ").strip()
        password = getpass.getpass("Password: ")

        if not username or not password:
            print("\nPlease enter both username and password.")
            input("\nPress Enter to try again...")
            continue

        print("\nVerifying credentials...")

        result = verify_login(username, password)

        if result is True:
            clear_screen()
            print("\nLogin successful!")
            print("Welcome to the Multilingual Translator.")
            input("\nPress Enter to continue...")
            return username, password

        elif result is False:
            print("\nInvalid username or password.")
            input("\nPress Enter to try again...")

        else:
            input("\nPress Enter to try again...")


def translate(text, target_language, username, password):
    """Send a translation request to the Java REST API."""

    request_data = {
        "text": text,
        "targetLanguage": target_language
    }

    request = urllib.request.Request(
        API_URL,
        data=json.dumps(request_data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": create_auth_header(username, password)
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result.get(
                "translatedText",
                "No translation returned."
            )

    except urllib.error.HTTPError as error:
        if error.code == 401:
            return "Authentication failed. Please log in again."
        elif error.code == 403:
            return "Access denied."
        elif error.code == 400:
            return "Invalid request. Please check your text."
        elif error.code == 502:
            return "Translation service error. Try again later."
        else:
            return f"API error: HTTP {error.code}"

    except urllib.error.URLError as error:
        return f"Connection error: {error.reason}"

    except json.JSONDecodeError:
        return "The API returned an invalid response."

    except TimeoutError:
        return "Request timed out. Please try again."


def translator_menu(username, password):
    """Display the main translation interface."""

    while True:
        clear_screen()

        print("=" * 50)
        print("              MULTILINGUAL TRANSLATOR")
        print("=" * 50)
        print("\nWelcome, " + username + "!")
        print("\nSelect your target language:")
        print("-" * 50)
        print("  1. Moroccan Darija")
        print("  2. Hindi")
        print("  3. Logout")
        print("-" * 50)

        choice = input("\nChoose an option: ").strip()

        if choice == "3":
            print("\nLogging out...")
            return

        if choice == "1":
            language = "DARIJA"
            language_name = "Moroccan Darija"

        elif choice == "2":
            language = "HINDI"
            language_name = "Hindi"

        else:
            print("\nInvalid choice.")
            input("Press Enter to continue...")
            continue

        clear_screen()

        print("=" * 50)
        print("              MULTILINGUAL TRANSLATOR")
        print("=" * 50)
        print(f"\nTarget Language: {language_name}")
        print("-" * 50)

        text = input("\nEnter English text: ").strip()

        if not text:
            print("\nPlease enter some text.")
            input("\nPress Enter to continue...")
            continue

        print("\nTranslating...")

        result = translate(text, language, username, password)

        print("\n" + "=" * 50)
        print("                 TRANSLATION")
        print("=" * 50)
        print("\n" + result)
        print("\n" + "=" * 50)

        input("\nPress Enter to return to the main menu...")


def main():
    try:
        while True:
            username, password = login()
            translator_menu(username, password)

    except KeyboardInterrupt:
        print("\n\nThank you for using Multilingual Translator. Goodbye!")


if __name__ == "__main__":
    main()