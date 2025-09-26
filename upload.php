<?php
// ==== НАСТРОЙКИ ====
$token = "ТВОЙ_GITHUB_TOKEN";   // сюда вставь токен
$repoOwner = "ТВОЙ_USERNAME";   // имя профиля GitHub
$repoName = "my-files-repo";    // имя репозитория
$tag = "v1.0";                  // тег релиза (можно всегда один)

// ==== ПОЛУЧАЕМ ФАЙЛ ====
if (!isset($_FILES['file'])) {
    die("Файл не загружен!");
}

$filePath = $_FILES['file']['tmp_name'];
$fileName = basename($_FILES['file']['name']);

// ==== ПРОВЕРЯЕМ РЕЛИЗ ====
$releaseUrl = "https://api.github.com/repos/$repoOwner/$repoName/releases/tags/$tag";

$ch = curl_init($releaseUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: token $token",
    "User-Agent: PHP"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$release = json_decode($response, true);

// Если релиза нет → создаём
if (isset($release['message']) && $release['message'] === 'Not Found') {
    $createUrl = "https://api.github.com/repos/$repoOwner/$repoName/releases";
    $data = json_encode([
        "tag_name" => $tag,
        "name" => "Release $tag",
        "body" => "Автозагрузка файлов с сайта"
    ]);

    $ch = curl_init($createUrl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: token $token",
        "User-Agent: PHP",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    $release = json_decode($response, true);
}

// ==== ЗАГРУЖАЕМ ФАЙЛ В РЕЛИЗ ====
$uploadUrl = $release['upload_url'];
$uploadUrl = str_replace("{?name,label}", "?name=" . urlencode($fileName), $uploadUrl);

$ch = curl_init($uploadUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: token $token",
    "User-Agent: PHP",
    "Content-Type: application/octet-stream"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($filePath));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$asset = json_decode($response, true);

// ==== ГОТОВАЯ ССЫЛКА ====
if (isset($asset['browser_download_url'])) {
    echo "Файл загружен!<br>";
    echo "Ссылка: <a href='" . $asset['browser_download_url'] . "'>" . $asset['browser_download_url'] . "</a>";
} else {
    echo "Ошибка при загрузке:";
    print_r($asset);
}
?>
