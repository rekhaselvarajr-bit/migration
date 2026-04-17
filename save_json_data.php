<?php
/**
 * Saves Calculate My Risk JSON. Requires Moodle login + valid sesskey in JSON body.
 *
 * Cross-origin: browsers must send portal cookies (fetch credentials: 'include').
 * OPTIONS is handled before auth so CORS preflight is not redirected.
 *
 * Add your front-end origins to $SAVE_JSON_CORS_ORIGINS below.
 */
require_once dirname(__FILE__) . '/../config.php';

// Production origins + local dev (http://localhost:any and http://127.0.0.1:any) for credentialed fetch.
$SAVE_JSON_CORS_ORIGINS = [
    'https://calculatemyrisk.org',
    'https://www.calculatemyrisk.org',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$corsCredentials = false;
if ($origin !== '') {
    if (in_array($origin, $SAVE_JSON_CORS_ORIGINS, true)
        || preg_match('#^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?$#', $origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        $corsCredentials = true;
    }
}
if (!$corsCredentials) {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// CORS preflight must succeed without auth (no session cookie on OPTIONS).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Opening the URL in a browser tab or Postman as GET returns HTML if we used require_login() (redirect).
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed',
        'hint' => 'Use POST with raw JSON body, not GET.',
    ]);
    exit;
}

require_once dirname(__FILE__) . '/includes/db.php';

// require_login() redirects to HTML login — unusable for API/Postman. Reply with JSON instead.
if (!isloggedin() || isguestuser()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Not logged in',
        'hint' => 'In Postman: login in browser, copy Cookie MoodleSession=... into request Headers, POST raw JSON including sesskey from M.cfg.sesskey.',
    ]);
    exit;
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url('/mhfdashboard/save_json_data.php');

$jsonString = file_get_contents('php://input');
$data = json_decode($jsonString, true);

if (!is_array($data)) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

if (!isset($data['sesskey']) || !confirm_sesskey($data['sesskey'])) {
    echo json_encode(['error' => 'Invalid session']);
    exit;
}

unset($data['sesskey']);

$conn = get_dashboard_db();

$userid = (int)($data['userid'] ?? 0);
$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$date = date('Y-m-d H:i:s');
$json_raw = json_encode($data, JSON_UNESCAPED_UNICODE);

if ($userid <= 0 || $json_raw === '' || $json_raw === 'null') {
    echo json_encode(['success' => false, 'error' => 'Missing userid or json data']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare(
    'INSERT INTO CalculateMyRisk (userid, username, email, json, dateofcreation)
     VALUES (?, ?, ?, AES_ENCRYPT(?, \'calculatemyrisk_key\'), ?)'
);
$stmt->bind_param('issss', $userid, $username, $email, $json_raw, $date);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'status' => 'ok']);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
exit;
