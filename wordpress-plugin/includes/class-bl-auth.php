<?php
/**
 * Minimal bearer-token auth for the assessment.
 *
 * Deliberately simple: a signed, expiring token stored in user meta. This is
 * NOT a production auth design, and Task 4 does not concern this file.
 */

if (!defined('ABSPATH')) {
    exit;
}

class BL_Auth {

    const META_KEY = 'bl_api_token';
    const TTL      = 86400;

    public static function issue_token($user_id) {
        $token = wp_generate_password(48, false, false);
        update_user_meta((int) $user_id, self::META_KEY, [
            'hash'    => hash('sha256', $token),
            'expires' => time() + self::TTL,
        ]);
        return $token;
    }

    /**
     * Resolve the caller from the Authorization header.
     * Returns a WP_User, or null when absent/invalid/expired.
     */
    public static function user_from_request($request) {
        $header = '';
        if (is_object($request) && method_exists($request, 'get_header')) {
            $header = (string) $request->get_header('authorization');
        }
        if ($header === '' && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $header = (string) $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (stripos($header, 'Bearer ') !== 0) {
            return null;
        }

        $token = trim(substr($header, 7));
        if ($token === '') {
            return null;
        }

        $hash = hash('sha256', $token);

        $users = get_users([
            'meta_key'   => self::META_KEY,
            'number'     => 100,
            'fields'     => 'ID',
        ]);

        foreach ($users as $uid) {
            $stored = get_user_meta((int) $uid, self::META_KEY, true);
            if (!is_array($stored) || empty($stored['hash'])) {
                continue;
            }
            if (!hash_equals($stored['hash'], $hash)) {
                continue;
            }
            if (!empty($stored['expires']) && $stored['expires'] < time()) {
                return null;
            }
            return get_user_by('id', (int) $uid);
        }

        return null;
    }
}
