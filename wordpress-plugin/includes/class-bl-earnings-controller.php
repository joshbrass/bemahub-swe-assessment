<?php
/**
 * Earnings and withdrawals.
 *
 * GET  /bemalearn/v1/me/earnings      instructor only
 * POST /bemalearn/v1/me/withdrawals   instructor only
 *
 * These endpoints move money. The authority on their behaviour is
 * docs/API-CONTRACT.md.
 */

if (!defined('ABSPATH')) {
    exit;
}

class BL_Earnings_Controller {

    const MINIMUM_WITHDRAWAL_MINOR = 50000;

    public function register_routes() {
        register_rest_route('bemalearn/v1', '/me/earnings', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_earnings'],
            'permission_callback' => [$this, 'check_authenticated'],
        ]);

        register_rest_route('bemalearn/v1', '/me/withdrawals', [
            'methods'             => 'POST',
            'callback'            => [$this, 'create_withdrawal'],
            'permission_callback' => [$this, 'check_instructor'],
            'args'                => [
                'amountMinor' => [
                    'required'          => true,
                    'validate_callback' => function ($v) {
                        // Money is an integer in minor units, and a withdrawal
                        // is strictly positive. Rejects strings, floats and
                        // negatives with a 400 before anything reaches the DB.
                        if (!is_int($v) && !(is_string($v) && ctype_digit($v))) {
                            return new WP_Error(
                                'rest_invalid_param',
                                'amountMinor must be a positive integer in minor units.',
                                ['status' => 400]
                            );
                        }
                        return (int) $v > 0;
                    },
                ],
                'payoutReference' => [
                    'required'          => true,
                    'validate_callback' => function ($v) {
                        // Must fit the VARCHAR(64) idempotency column.
                        return is_string($v)
                            && $v !== ''
                            && strlen($v) <= 64
                            && preg_match('/^[A-Za-z0-9_-]+$/', $v) === 1;
                    },
                    'sanitize_callback' => function ($v) {
                        return sanitize_text_field((string) $v);
                    },
                ],
            ],
        ]);

        register_rest_route('bemalearn/v1', '/auth/login', [
            'methods'             => 'POST',
            'callback'            => [$this, 'login'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * The caller is signed in. Says nothing about their role.
     */
    public function check_authenticated($request) {
        $user = BL_Auth::user_from_request($request);

        if (!$user) {
            return new WP_Error('unauthenticated', 'Sign in to continue.', ['status' => 401]);
        }

        return true;
    }

    public function check_instructor($request) {
        $user = BL_Auth::user_from_request($request);

        if (!$user) {
            return new WP_Error('unauthenticated', 'Sign in to continue.', ['status' => 401]);
        }

        if (!in_array('bl_instructor', (array) $user->roles, true)) {
            return new WP_Error('forbidden', 'Instructors only.', ['status' => 403]);
        }

        return true;
    }

    public function login($request) {
        $email    = sanitize_email((string) $request->get_param('email'));
        $password = (string) $request->get_param('password');

        $user = get_user_by('email', $email);

        if (!$user || !wp_check_password($password, $user->user_pass, $user->ID)) {
            return new WP_Error(
                'invalid_credentials',
                'Email or password is incorrect.',
                ['status' => 401]
            );
        }

        return new WP_REST_Response([
            'token' => BL_Auth::issue_token($user->ID),
            'user'  => [
                'id'   => (int) $user->ID,
                'name' => $user->display_name,
                'role' => in_array('bl_instructor', (array) $user->roles, true)
                    ? 'instructor' : 'learner',
            ],
        ], 200);
    }

    public function get_earnings($request) {
        global $wpdb;

        $user = BL_Auth::user_from_request($request);
        $ledger = $wpdb->prefix . 'bl_earnings_ledger';

        $available = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(amount_minor), 0) FROM {$ledger}
              WHERE instructor_id = %d
                AND available_at IS NOT NULL
                AND available_at <= UTC_TIMESTAMP()",
            $user->ID
        ));

        $pending = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(amount_minor), 0) FROM {$ledger}
              WHERE instructor_id = %d
                AND (available_at IS NULL OR available_at > UTC_TIMESTAMP())",
            $user->ID
        ));

        $last = $wpdb->get_var($wpdb->prepare(
            "SELECT created_at FROM {$wpdb->prefix}bl_withdrawals
              WHERE instructor_id = %d ORDER BY id DESC LIMIT 1",
            $user->ID
        ));

        return new WP_REST_Response([
            'availableMinor'         => $available,
            'pendingMinor'           => $pending,
            'currency'               => 'NGN',
            'minimumWithdrawalMinor' => self::MINIMUM_WITHDRAWAL_MINOR,
            'lastWithdrawalAt'       => $last ? gmdate('c', strtotime($last)) : null,
        ], 200);
    }

    public function create_withdrawal($request) {
        global $wpdb;

        $user   = BL_Auth::user_from_request($request);
        $amount = (int) $request->get_param('amountMinor');
        $ref    = (string) $request->get_param('payoutReference');

        $table = $wpdb->prefix . 'bl_withdrawals';

        // Idempotency: a repeat of the same reference returns the original.
        if ($ref) {
            $existing = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table} WHERE instructor_id = %d AND payout_reference = %s",
                $user->ID, $ref
            ));
            if ($existing) {
                return new WP_REST_Response($this->shape($existing), 200);
            }
        }

        $available = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(amount_minor), 0) FROM {$wpdb->prefix}bl_earnings_ledger
              WHERE instructor_id = %d
                AND available_at IS NOT NULL
                AND available_at <= UTC_TIMESTAMP()",
            $user->ID
        ));

        if ($amount > $available) {
            return new WP_Error(
                'insufficient_balance',
                'Your available balance is lower than the requested amount.',
                ['status' => 422]
            );
        }

        $pending = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE instructor_id = %d AND status = 'pending'",
            $user->ID
        ));

        if ($pending > 0) {
            return new WP_Error(
                'withdrawal_in_progress',
                'You already have a withdrawal in progress.',
                ['status' => 422]
            );
        }

        $wpdb->insert($table, [
            'instructor_id'    => $user->ID,
            'amount_minor'     => $amount,
            'status'           => 'pending',
            'payout_reference' => $ref,
            'created_at'       => current_time('mysql', true),
        ]);

        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $wpdb->insert_id));

        return new WP_REST_Response($this->shape($row), 201);
    }

    private function shape($row) {
        return [
            'id'              => (int) $row->id,
            'amountMinor'     => (int) $row->amount_minor,
            'status'          => $row->status,
            'payoutReference' => $row->payout_reference,
            'createdAt'       => gmdate('c', strtotime($row->created_at)),
        ];
    }
}
