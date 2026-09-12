<?php
/**
 * Bema Learn schema.
 *
 * Forward-only. Each run is idempotent: creating a table that already exists is
 * a no-op, so activating the plugin twice is safe.
 *
 * THIS FILE IS THE AUTHORITY ON WHAT COLUMNS EXIST.
 * If code elsewhere reads a column, it must exist here.
 */

if (!defined('ABSPATH')) {
    exit;
}

class BL_Migrations {

    public static function run() {
        global $wpdb;

        $charset = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $courses = $wpdb->prefix . 'bl_courses';
        dbDelta("CREATE TABLE {$courses} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(191) NOT NULL,
            description TEXT NULL,
            instructor_id BIGINT UNSIGNED NOT NULL,
            price_minor INT UNSIGNED NOT NULL DEFAULT 0,
            currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
            lesson_count INT UNSIGNED NOT NULL DEFAULT 0,
            enrolment_count INT UNSIGNED NULL DEFAULT NULL,
            average_rating DECIMAL(3,2) NULL DEFAULT NULL,
            is_published TINYINT(1) NOT NULL DEFAULT 0,
            published_at DATETIME NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_instructor (instructor_id),
            KEY idx_published (is_published)
        ) {$charset};");

        $enrolments = $wpdb->prefix . 'bl_enrolments';
        dbDelta("CREATE TABLE {$enrolments} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            course_id BIGINT UNSIGNED NOT NULL,
            learner_id BIGINT UNSIGNED NOT NULL,
            amount_paid_minor INT UNSIGNED NOT NULL,
            rating TINYINT UNSIGNED NULL DEFAULT NULL,
            enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            refunded_at DATETIME NULL DEFAULT NULL,
            PRIMARY KEY (id),
            KEY idx_course (course_id),
            KEY idx_learner (learner_id)
        ) {$charset};");

        /*
         * Instructor earnings ledger. APPEND-ONLY.
         *
         * A reversal is a new row with a negative amount, never an edit or a
         * delete of the original. The balance is the SUM of this table, so
         * history stays auditable.
         */
        $ledger = $wpdb->prefix . 'bl_earnings_ledger';
        dbDelta("CREATE TABLE {$ledger} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            instructor_id BIGINT UNSIGNED NOT NULL,
            amount_minor INT NOT NULL,
            entry_type VARCHAR(32) NOT NULL,
            available_at DATETIME NULL DEFAULT NULL,
            enrolment_id BIGINT UNSIGNED NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_instructor (instructor_id),
            KEY idx_available (available_at)
        ) {$charset};");

        /*
         * Withdrawals.
         *
         * payout_reference is the idempotency key: a retried request carrying
         * the same reference must return the ORIGINAL row rather than create a
         * second payout.
         *
         * NOTE FOR THE CANDIDATE (Task 5): look closely at the unique key
         * below and satisfy yourself that it does what that paragraph claims.
         */
        $withdrawals = $wpdb->prefix . 'bl_withdrawals';
        dbDelta("CREATE TABLE {$withdrawals} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            instructor_id BIGINT UNSIGNED NOT NULL,
            amount_minor INT UNSIGNED NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            payout_reference VARCHAR(64) NULL DEFAULT NULL,
            cancelled_at DATETIME NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_reference (instructor_id, payout_reference, cancelled_at),
            KEY idx_status (status)
        ) {$charset};");

        update_option('bemalearn_schema_version', BEMALEARN_VERSION);
    }
}
