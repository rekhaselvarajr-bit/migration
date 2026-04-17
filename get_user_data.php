<?php
require_once(dirname(__FILE__) . '/../config.php');
$PAGE->set_context(get_context_instance(CONTEXT_SYSTEM));
$PAGE->set_url('/mhfdashboard/get_user_data.php');

$edit  = optional_param('edit', null, PARAM_BOOL);
$reset = optional_param('reset', null, PARAM_BOOL);

require_login();

header('Content-Type: application/json');

$servername = $CFG->dbhost;
$username = $CFG->dbuser;
$password = $CFG->dbpass;
$dbname = $CFG->dashdbname;
$userdbname = $CFG->dbname;

$secret_key = 'secret_key_for_user_data';
$secret_iv  = 'my_heart_fitness';

$key = hash('sha256', $secret_key, true);
$iv  = substr(hash('sha256', $secret_iv), 0, 16);

$encrypted = $_GET['data'] ?? '';

$decrypted = openssl_decrypt(
    base64_decode(str_replace(' ', '+', $encrypted)),
    'AES-256-CBC',
    $key,
    OPENSSL_RAW_DATA,
    $iv
);

if ($decrypted === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

$request = json_decode($decrypted, true);
if (!is_array($request)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

// Optional sesskey: if present (query or encrypted JSON), it must match. If omitted, rely on
// require_login() + encrypted userid (for Calculate My Risk first load with only { "userid": n }).
$sesskey = optional_param('sesskey', '', PARAM_RAW);
if ($sesskey === '' && isset($request['sesskey'])) {
    $sesskey = (string) $request['sesskey'];
}
if ($sesskey !== '') {
    if (!confirm_sesskey($sesskey)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid session']);
        exit;
    }
}
unset($request['sesskey']);

$userid = (int) ($request['userid'] ?? 0);
if ($userid <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid userid']);
    exit;
}

$connUser = new mysqli($servername, $username, $password, $userdbname);

if ($connUser->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$stmt = $connUser->prepare(
    'SELECT id, username, email, firstname, lastname FROM `mhfmood_user`
      WHERE id = ? AND suspended = 0 AND deleted = 0 AND confirmed = 1'
);
$stmt->bind_param('i', $userid);
$stmt->execute();
$result = $stmt->get_result();

$rows = [];
if ($result->num_rows > 0) {
    foreach ($result as $row) {
        $rows[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'firstname' => $row['firstname'],
            'lastname' => $row['lastname'],
        ];
    }
} else {
    $rows = [[
        'id' => 0,
        'username' => '',
        'email' => '',
        'firstname' => '',
        'lastname' => '',
    ]];
}

// Encrypted JSON: { "users": [ ... ], "sesskey": "<current Moodle sesskey>" } for downstream POSTs.
$response = [
    'users'   => $rows,
    'sesskey' => sesskey(),
];

$json = json_encode($response);

$out = base64_encode(
    openssl_encrypt($json, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv)
);
echo $out;

$result->free();
$stmt->close();
$connUser->close();
