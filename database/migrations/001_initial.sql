-- 001_initial.sql
-- Bema Learn schema, as applied to the running assessment database.
--
-- APPLIED ALREADY. This file records the migration the environment booted
-- with; it is the baseline, not a task. Do not edit it: it has already run,
-- so editing it changes nothing on your database and rewrites history for
-- anyone who has not run it yet. Schema changes go in a NEW numbered file.
--
-- The plugin applies this same shape on activation via
-- wordpress-plugin/includes/class-bl-migrations.php.

CREATE TABLE IF NOT EXISTS wp_bl_courses (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title           VARCHAR(191) NOT NULL,
    description     TEXT NULL,
    instructor_id   BIGINT UNSIGNED NOT NULL,
    price_minor     INT UNSIGNED NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'NGN',
    lesson_count    INT UNSIGNED NOT NULL DEFAULT 0,
    -- NULL means "not yet counted". It is not the same as a measured 0.
    enrolment_count INT UNSIGNED NULL DEFAULT NULL,
    average_rating  DECIMAL(3,2) NULL DEFAULT NULL,
    is_published    TINYINT(1) NOT NULL DEFAULT 0,
    published_at    DATETIME NULL DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_instructor (instructor_id),
    KEY idx_published (is_published)
);

CREATE TABLE IF NOT EXISTS wp_bl_enrolments (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id         BIGINT UNSIGNED NOT NULL,
    learner_id        BIGINT UNSIGNED NOT NULL,
    amount_paid_minor INT UNSIGNED NOT NULL,
    rating            TINYINT UNSIGNED NULL DEFAULT NULL,
    enrolled_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refunded_at       DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_course (course_id),
    KEY idx_learner (learner_id)
);

-- Instructor earnings ledger. APPEND-ONLY: a reversal is a new row with a
-- negative amount, never an edit or delete of the original.
CREATE TABLE IF NOT EXISTS wp_bl_earnings_ledger (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    instructor_id BIGINT UNSIGNED NOT NULL,
    amount_minor  INT NOT NULL,
    entry_type    VARCHAR(32) NOT NULL,
    available_at  DATETIME NULL DEFAULT NULL,
    enrolment_id  BIGINT UNSIGNED NULL DEFAULT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_instructor (instructor_id),
    KEY idx_available (available_at)
);

-- Withdrawals.
--
-- payout_reference is the idempotency key: a retried request carrying the same
-- reference must return the ORIGINAL row rather than create a second payout.
--
-- NOTE FOR THE CANDIDATE (Task 5.2): look closely at the unique key below and
-- satisfy yourself that it does what that paragraph claims.
CREATE TABLE IF NOT EXISTS wp_bl_withdrawals (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    instructor_id    BIGINT UNSIGNED NOT NULL,
    amount_minor     INT UNSIGNED NOT NULL,
    status           VARCHAR(32) NOT NULL DEFAULT 'pending',
    payout_reference VARCHAR(64) NULL DEFAULT NULL,
    cancelled_at     DATETIME NULL DEFAULT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_reference (instructor_id, payout_reference, cancelled_at),
    KEY idx_status (status)
);
