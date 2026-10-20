<?php
/**
 * Endpoint: /api/perfil/resumen.php
 * Descripción: Devuelve el resumen diario del colaborador para el widget "Mi día" de BgreenNet.
 * Método: GET
 * Salida: JSON
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración de conexiones de base de datos
// NOTA: Ajustar credenciales según entorno de despliegue
$db_bgreen_host = getenv('DB_BGREEN_HOST') ?: 'localhost';
$db_bgreen_name = getenv('DB_BGREEN_NAME') ?: 'bgreennet';
$db_bgreen_user = getenv('DB_BGREEN_USER') ?: 'root';
$db_bgreen_pass = getenv('DB_BGREEN_PASS') ?: '';

$db_glpi_host   = getenv('DB_GLPI_HOST')   ?: 'localhost';
$db_glpi_name   = getenv('DB_GLPI_NAME')   ?: 'glpidb';
$db_glpi_user   = getenv('DB_GLPI_USER')   ?: 'root';
$db_glpi_pass   = getenv('DB_GLPI_PASS')   ?: '';

// Identificar colaborador (por sesión, parámetro o token)
session_start();
$id_usuario = $_GET['id_usuario'] ?? $_SESSION['id_usuario'] ?? 1;
$email_usuario = $_GET['email'] ?? $_SESSION['email'] ?? 'jangulo@biocosta.com';
$cedula_usuario = $_GET['cedula'] ?? $_SESSION['cedula'] ?? null;

// Inicialización de respuesta estándar
$response = [
    'estado' => 'sede', // 'sede' | 'reunion' | 'remoto' | 'ocupado'
    'ingreso_hoy' => [
        'hora' => '07:28 AM',
        'puntual' => true
    ],
    'pendientes' => [
        'tickets' => 0,
        'aprobaciones' => 0,
        'formatos' => 0,
        'notificaciones' => 0
    ]
];

// 1. OBTENER ESTADO DE DISPONIBILIDAD Y PENDIENTES DE BGREENNET
try {
    $pdo_bgreen = new PDO("mysql:host=$db_bgreen_host;dbname=$db_bgreen_name;charset=utf8mb4", $db_bgreen_user, $db_bgreen_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Estado de disponibilidad del usuario
    $stmtEstado = $pdo_bgreen->prepare("
        SELECT estado 
        FROM usuarios_estado 
        WHERE id_usuario = :id_usuario 
        ORDER BY updated_at DESC LIMIT 1
    ");
    $stmtEstado->execute(['id_usuario' => $id_usuario]);
    $rowEstado = $stmtEstado->fetch();
    if ($rowEstado && in_array($rowEstado['estado'], ['sede', 'reunion', 'remoto', 'ocupado'])) {
        $response['estado'] = $rowEstado['estado'];
    }

    // Aprobaciones pendientes por revisar
    $stmtAprob = $pdo_bgreen->prepare("
        SELECT COUNT(*) AS total 
        FROM solicitudes_aprobacion 
        WHERE id_aprobador = :id_usuario AND estado = 'PENDIENTE'
    ");
    $stmtAprob->execute(['id_usuario' => $id_usuario]);
    $response['pendientes']['aprobaciones'] = (int)($stmtAprob->fetch()['total'] ?? 0);

    // Formatos por diligenciar asignados
    $stmtForm = $pdo_bgreen->prepare("
        SELECT COUNT(*) AS total 
        FROM formatos_asignados 
        WHERE id_usuario = :id_usuario AND completado = 0
    ");
    $stmtForm->execute(['id_usuario' => $id_usuario]);
    $response['pendientes']['formatos'] = (int)($stmtForm->fetch()['total'] ?? 0);

    // Notificaciones sin leer
    $stmtNotif = $pdo_bgreen->prepare("
        SELECT COUNT(*) AS total 
        FROM notificaciones 
        WHERE id_usuario = :id_usuario AND leida = 0
    ");
    $stmtNotif->execute(['id_usuario' => $id_usuario]);
    $response['pendientes']['notificaciones'] = (int)($stmtNotif->fetch()['total'] ?? 0);

} catch (Exception $e) {
    // Si la BD de BgreenNet no está accesible en modo local, se mantienen valores seguros
    error_log("BgreenNet DB Error: " . $e->getMessage());
}

// 2. OBTENER TICKETS ASIGNADOS DE GLPI
try {
    $pdo_glpi = new PDO("mysql:host=$db_glpi_host;dbname=$db_glpi_name;charset=utf8mb4", $db_glpi_user, $db_glpi_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // En GLPI: type = 2 corresponde a 'asignado a' (técnico asignado)
    // status 5 = Resuelto, status 6 = Cerrado
    $stmtTickets = $pdo_glpi->prepare("
        SELECT COUNT(DISTINCT t.id) AS total
        FROM glpi_tickets t
        INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id AND tu.type = 2
        INNER JOIN glpi_users u ON u.id = tu.users_id
        WHERE (u.id = :id_usuario OR u.name = :email OR u.email = :email)
          AND t.status NOT IN (5, 6)
          AND t.is_deleted = 0
    ");
    $stmtTickets->execute([
        'id_usuario' => $id_usuario,
        'email' => $email_usuario
    ]);
    $response['pendientes']['tickets'] = (int)($stmtTickets->fetch()['total'] ?? 0);

} catch (Exception $e) {
    error_log("GLPI DB Error: " . $e->getMessage());
}

// 3. CONSULTAR INGRESO DEL DÍA (SIESA ACCESS / BIOMETRIC)
if ($cedula_usuario) {
    try {
        $db_siesa_host = getenv('DB_SIESA_HOST') ?: 'localhost';
        $db_siesa_name = getenv('DB_SIESA_NAME') ?: 'siesaaccess_biocosta';
        $db_siesa_user = getenv('DB_SIESA_USER') ?: 'sa';
        $db_siesa_pass = getenv('DB_SIESA_PASS') ?: '';

        $pdo_siesa = new PDO("sqlsrv:Server=$db_siesa_host;Database=$db_siesa_name", $db_siesa_user, $db_siesa_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        $hoyStr = date('Y-m-d');
        $stmtIngreso = $pdo_siesa->prepare("
            SELECT TOP 1 a.[EVENDATERECORD] AS Fecha_hora
            FROM [CIOEVENT] a
            INNER JOIN [ENRPERSON] b ON a.[PRSNIDENTIFICATION] = b.[PRSNIDENTIFICATION]
            WHERE b.[PRSNIDENTIFICATIONOWN] = :cedula
              AND a.[TYEVIDENTIFICATION] = 1
              AND CONVERT(VARCHAR(10), a.[EVENDATERECORD], 120) = :hoy
            ORDER BY a.[EVENDATERECORD] ASC
        ");
        $stmtIngreso->execute(['cedula' => $cedula_usuario, 'hoy' => $hoyStr]);
        $rowIngreso = $stmtIngreso->fetch(PDO::FETCH_ASSOC);

        if ($rowIngreso && !empty($rowIngreso['Fecha_hora'])) {
            $ts = strtotime($rowIngreso['Fecha_hora']);
            $horaFormateada = date('h:i A', $ts);
            $minutos = (int)date('H', $ts) * 60 + (int)date('i', $ts);
            $limitePuntual = 7 * 60 + 35; // 7:35 AM (con gabela de 5 min)
            
            $response['ingreso_hoy'] = [
                'hora' => $horaFormateada,
                'puntual' => $minutos <= $limitePuntual
            ];
        }
    } catch (Exception $e) {
        error_log("Siesa Access Error: " . $e->getMessage());
    }
}

// Enviar respuesta en formato JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
