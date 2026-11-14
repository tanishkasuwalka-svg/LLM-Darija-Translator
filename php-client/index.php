<?php
declare(strict_types=1);

session_start();

$apiUrl = "http://localhost:8080/llm-darija-translator-1.0-SNAPSHOT/api/translate";

$error = "";
$translation = "";
$sourceText = "";
$targetLanguage = "DARIJA";

// Escape output before displaying it in HTML.
function escapeHtml(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8");
}

// Send a request to the Java REST API using Basic Authentication.
function callTranslationApi(
    string $url,
    string $username,
    string $password,
    string $text,
    string $language
): array {
    $jsonData = json_encode(
        ["text" => $text, "targetLanguage" => $language],
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE
    );

    $curl = curl_init($url);

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $jsonData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_USERPWD => $username . ":" . $password,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Accept: application/json"
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 70
    ]);

    $response = curl_exec($curl);
    $curlError = curl_error($curl);
    $httpStatus = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    return [
        "response" => $response,
        "error" => $curlError,
        "status" => $httpStatus
    ];
}

// LOGOUT
if ($_SERVER["REQUEST_METHOD"] === "POST"
    && ($_POST["action"] ?? "") === "logout") {

    $_SESSION = [];
    session_destroy();

    header("Location: " . $_SERVER["PHP_SELF"]);
    exit;
}

// LOGIN
if ($_SERVER["REQUEST_METHOD"] === "POST"
    && ($_POST["action"] ?? "") === "login") {

    $username = trim($_POST["username"] ?? "");
    $password = $_POST["password"] ?? "";

    if ($username === "" || $password === "") {
        $error = "Please enter both your username and password.";
    } elseif (!function_exists("curl_init")) {
        $error = "PHP cURL extension is not enabled.";
    } else {
        try {
            // Empty text is used to check authentication.
            // The backend must reject empty text before calling Gemini.
            $result = callTranslationApi(
                $apiUrl,
                $username,
                $password,
                "",
                "DARIJA"
            );

            if ($result["response"] === false) {
                $error = "Cannot connect to the translation server: "
                    . $result["error"];
            } elseif ($result["status"] === 401
                || $result["status"] === 403) {
                $error = "Invalid username or password.";
            } elseif ($result["status"] === 400
                || $result["status"] === 422) {

                // Expected response when authentication succeeds
                // but the backend rejects the intentionally empty text.
                session_regenerate_id(true);

                $_SESSION["api_username"] = $username;
                $_SESSION["api_password"] = $password;

                header("Location: " . $_SERVER["PHP_SELF"]);
                exit;
            } else {
                $error = "Could not verify your login (HTTP "
                    . $result["status"] . ").";
            }

        } catch (JsonException $exception) {
            $error = "Could not prepare the login request.";
        }
    }
}

// TRANSLATION
if ($_SERVER["REQUEST_METHOD"] === "POST"
    && ($_POST["action"] ?? "") === "translate"
    && isset($_SESSION["api_username"], $_SESSION["api_password"])) {

    $sourceText = trim($_POST["text"] ?? "");
    $targetLanguage = strtoupper(
        trim($_POST["targetLanguage"] ?? "DARIJA")
    );

    if ($sourceText === "") {
        $error = "Please enter text to translate.";
    } elseif (!in_array($targetLanguage, ["DARIJA", "HINDI"], true)) {
        $error = "Please select a valid target language.";
    } else {
        try {
            $result = callTranslationApi(
                $apiUrl,
                $_SESSION["api_username"],
                $_SESSION["api_password"],
                $sourceText,
                $targetLanguage
            );

            if ($result["response"] === false) {
                $error = "Network error: " . $result["error"];
            } elseif ($result["status"] === 401) {
                $error = "Authentication expired. Please log in again.";
                $_SESSION = [];
                session_destroy();
            } elseif ($result["status"] === 403) {
                $error = "Access denied. Your account cannot use this API.";
            } elseif ($result["status"] < 200
                || $result["status"] >= 300) {
                $error = "Translation API error (HTTP "
                    . $result["status"] . ").";
            } else {
                $responseData = json_decode($result["response"], true);

                if (!is_array($responseData)
                    || !isset($responseData["translatedText"])
                    || !is_string($responseData["translatedText"])
                    || trim($responseData["translatedText"]) === "") {
                    $error = "The API returned an invalid translation.";
                } else {
                    $translation = $responseData["translatedText"];
                }
            }

        } catch (JsonException $exception) {
            $error = "Could not prepare the translation request.";
        }
    }
}

$isLoggedIn = isset(
    $_SESSION["api_username"],
    $_SESSION["api_password"]
);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Multilingual Translator</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 35px 16px;
            min-height: 100vh;
            font-family: "Segoe UI", Arial, sans-serif;
            background: linear-gradient(135deg, #f2edff, #fdf8ff);
            color: #302b45;
        }

        .container {
            max-width: 760px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 28px;
        }

        .header h1 {
            margin-bottom: 8px;
            color: #7054bd;
            font-size: 30px;
        }

        .header p {
            color: #77718c;
            font-size: 14px;
        }

        .card {
            background: white;
            padding: 28px;
            border-radius: 18px;
            box-shadow: 0 8px 30px rgba(80, 60, 130, 0.09);
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 600;
        }

        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 1px solid #e3deef;
            border-radius: 9px;
            font: inherit;
            font-size: 14px;
            margin-bottom: 18px;
            background: white;
        }

        textarea {
            min-height: 140px;
            resize: vertical;
        }

        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #9479d8;
            box-shadow: 0 0 0 3px rgba(148, 121, 216, 0.12);
        }

        .button {
            width: 100%;
            padding: 13px;
            border: none;
            border-radius: 9px;
            background: #785bc5;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }

        .button:hover {
            background: #6245ad;
        }

        .logout-button {
            width: auto;
            padding: 9px 18px;
            border: 1px solid #d8ccef;
            border-radius: 8px;
            background: white;
            color: #7054bd;
            cursor: pointer;
            font-weight: 600;
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
            gap: 12px;
        }

        .logged-in {
            color: #4d9270;
            font-size: 13px;
            font-weight: 600;
        }

        .result {
            background: #faf8ff;
            border: 1px solid #e9e2fa;
            border-radius: 10px;
            padding: 18px;
            min-height: 90px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            line-height: 1.7;
        }

        .copy-button {
            margin-top: 12px;
            padding: 10px 16px;
            border: 1px solid #d8ccef;
            border-radius: 8px;
            background: white;
            color: #7054bd;
            cursor: pointer;
        }

        .error {
            background: #fff0f0;
            color: #b83245;
            border: 1px solid #f4cccc;
            padding: 12px;
            border-radius: 9px;
            margin-bottom: 18px;
            font-size: 13px;
        }

        .success-label {
            color: #4d9270;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .footer {
            text-align: center;
            color: #9991aa;
            font-size: 12px;
            margin-top: 24px;
        }
    </style>
</head>

<body>

<div class="container">

    <header class="header">
        <h1>Multilingual Translator</h1>
        <p>Translate English into Moroccan Darija or Hindi.</p>
    </header>

    <?php if (!$isLoggedIn): ?>

        <!-- LOGIN SCREEN -->
        <section class="card">

            <h2>Welcome Back</h2>
            <p>Log in with your API credentials to access the translator.</p>

            <?php if ($error !== ""): ?>
                <div class="error">
                    <?= escapeHtml($error) ?>
                </div>
            <?php endif; ?>

            <form method="POST">

                <input type="hidden" name="action" value="login">

                <label for="username">API Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    autocomplete="username"
                    required
                >

                <label for="password">API Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                >

                <button type="submit" class="button">
                    Log In
                </button>

            </form>

        </section>

    <?php else: ?>

        <!-- TRANSLATOR SCREEN -->
        <div class="top-bar">
            <span class="logged-in">✓ Logged in successfully</span>

            <form method="POST">
                <input type="hidden" name="action" value="logout">
                <button type="submit" class="logout-button">
                    Log Out
                </button>
            </form>
        </div>

        <?php if ($error !== ""): ?>
            <div class="error">
                <?= escapeHtml($error) ?>
            </div>
        <?php endif; ?>

        <section class="card">

            <h2>Translate Text</h2>
            <p>Enter your English text and choose a target language.</p>

            <form method="POST">

                <input type="hidden" name="action" value="translate">

                <label for="targetLanguage">Target Language</label>

                <select id="targetLanguage" name="targetLanguage">
                    <option value="DARIJA"
                        <?= $targetLanguage === "DARIJA" ? "selected" : "" ?>>
                        Moroccan Darija
                    </option>

                    <option value="HINDI"
                        <?= $targetLanguage === "HINDI" ? "selected" : "" ?>>
                        Hindi
                    </option>
                </select>

                <label for="text">English Text</label>

                <textarea
                    id="text"
                    name="text"
                    placeholder="Enter the English text you want to translate..."
                    required
                ><?= escapeHtml($sourceText) ?></textarea>

                <button type="submit" class="button">
                    Translate
                </button>

            </form>

        </section>

        <?php if ($translation !== ""): ?>

            <section class="card">

                <div class="success-label">
                    ✓ Translation completed successfully
                </div>

                <label>Translated Text</label>

                <div class="result" id="translationResult" dir="auto"><?= escapeHtml($translation) ?></div>

                <button
                    type="button"
                    class="copy-button"
                    onclick="copyTranslation()"
                >
                    Copy Translation
                </button>

            </section>

        <?php endif; ?>

    <?php endif; ?>

    <footer class="footer">
        Powered by the Java REST Translation API
    </footer>

</div>

<script>
function copyTranslation() {
    const result = document.getElementById("translationResult");

    if (!result) return;

    navigator.clipboard.writeText(result.innerText)
        .then(() => alert("Translation copied!"))
        .catch(() => alert("Could not copy the translation."));
}
</script>

</body>
</html>