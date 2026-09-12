<?php
/**
 * Plugin Name: Bema Learn Assessment API
 * Description: A small course platform API. Assessment use only.
 * Version:     1.0.0
 * Requires PHP: 7.4
 * Author:      Bema Integrated Services Ltd
 */

if (!defined('ABSPATH')) {
    exit;
}

define('BEMALEARN_VERSION', '1.0.0');
define('BEMALEARN_PATH', plugin_dir_path(__FILE__));

require_once BEMALEARN_PATH . 'includes/class-bl-migrations.php';
require_once BEMALEARN_PATH . 'includes/class-bl-auth.php';
require_once BEMALEARN_PATH . 'includes/class-bl-courses-controller.php';
require_once BEMALEARN_PATH . 'includes/class-bl-earnings-controller.php';
require_once BEMALEARN_PATH . 'includes/class-bl-seeder.php';

register_activation_hook(__FILE__, ['BL_Migrations', 'run']);
register_activation_hook(__FILE__, ['BL_Seeder', 'seed']);

add_action('rest_api_init', function () {
    (new BL_Courses_Controller())->register_routes();
    (new BL_Earnings_Controller())->register_routes();
});

/**
 * CORS for the assessment frontend on :3000.
 *
 * Kept deliberately simple. Task 4 does not concern this file.
 */
add_action('init', function () {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (preg_match('#^http://localhost:\d+$#', $origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, Idempotency-Key');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        status_header(200);
        exit;
    }
});

/**
 * WP-CLI helper so the environment can be reset between attempts.
 *
 *   wp bemalearn reset
 */
if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('bemalearn reset', function () {
        BL_Migrations::run();
        BL_Seeder::seed(true);
        WP_CLI::success('Bema Learn data reset.');
    });
}
