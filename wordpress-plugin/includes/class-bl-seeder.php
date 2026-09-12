<?php
/**
 * Seed data for the assessment.
 *
 * Deliberately shaped to exercise the contract's edge cases:
 *   - a course with NULL enrolment_count and NULL average_rating
 *   - a course with a REAL zero rating (0.00) - not the same thing
 *   - an UNPUBLISHED course, which must never appear in the public list
 *   - a ledger with both available and pending money
 */

if (!defined('ABSPATH')) {
    exit;
}

class BL_Seeder {

    public static function seed($force = false) {
        global $wpdb;

        if (!$force && get_option('bemalearn_seeded')) {
            return;
        }

        add_role('bl_instructor', 'Bema Learn Instructor', ['read' => true]);
        add_role('bl_learner', 'Bema Learn Learner', ['read' => true]);

        $instructor = self::ensure_user('instructor@example.test', 'Ada Okafor', 'bl_instructor');
        $learner    = self::ensure_user('learner@example.test', 'Bola Adeyemi', 'bl_learner');

        $courses = $wpdb->prefix . 'bl_courses';
        $wpdb->query("TRUNCATE TABLE {$courses}");

        $rows = [
            // title, price, lessons, enrolments, rating, published, published_at
            ['Introduction to Bread Baking', 4500, 12, 128,  4.60, 1, '2026-03-14 08:00:00'],
            ['Sourdough Starters',           6000, 18,  64,  4.20, 1, '2026-04-02 08:00:00'],
            // NULL enrolments and NULL rating - "not yet counted", NOT zero
            ['Pastry Fundamentals',          7500, 24, null, null, 1, '2026-05-20 08:00:00'],
            // A REAL zero rating - must display differently from NULL
            ['Cake Decorating Basics',       3000,  8,   9,  0.00, 1, '2026-06-11 08:00:00'],
            // UNPUBLISHED - must never appear in the public list
            ['Advanced Laminated Dough',     9000, 30,   0, null, 0, null],
        ];

        foreach ($rows as $r) {
            $wpdb->insert($courses, [
                'title'           => $r[0],
                'description'     => $r[0] . ' - a short course for the assessment environment.',
                'instructor_id'   => $instructor,
                'price_minor'     => $r[1],
                'currency'        => 'NGN',
                'lesson_count'    => $r[2],
                'enrolment_count' => $r[3],
                'average_rating'  => $r[4],
                'is_published'    => $r[5],
                'published_at'    => $r[6],
            ]);
        }

        $ledger = $wpdb->prefix . 'bl_earnings_ledger';
        $wpdb->query("TRUNCATE TABLE {$ledger}");

        // Available now
        foreach ([45000, 60000, 23500] as $amount) {
            $wpdb->insert($ledger, [
                'instructor_id' => $instructor,
                'amount_minor'  => $amount,
                'entry_type'    => 'enrolment',
                'available_at'  => gmdate('Y-m-d H:i:s', time() - 86400),
            ]);
        }

        // Still pending (held)
        $wpdb->insert($ledger, [
            'instructor_id' => $instructor,
            'amount_minor'  => 45000,
            'entry_type'    => 'enrolment',
            'available_at'  => gmdate('Y-m-d H:i:s', time() + (86400 * 5)),
        ]);

        $wpdb->query("TRUNCATE TABLE {$wpdb->prefix}bl_withdrawals");
        $wpdb->query("TRUNCATE TABLE {$wpdb->prefix}bl_enrolments");

        // Enrolments, including one refunded and some unrated rows
        $enr = $wpdb->prefix . 'bl_enrolments';
        $wpdb->insert($enr, ['course_id' => 1, 'learner_id' => $learner, 'amount_paid_minor' => 4500, 'rating' => 5]);
        $wpdb->insert($enr, ['course_id' => 1, 'learner_id' => $learner, 'amount_paid_minor' => 4500, 'rating' => null]);
        $wpdb->insert($enr, ['course_id' => 2, 'learner_id' => $learner, 'amount_paid_minor' => 6000, 'rating' => 4,
                             'refunded_at' => gmdate('Y-m-d H:i:s')]);

        update_option('bemalearn_seeded', 1);
    }

    private static function ensure_user($email, $name, $role) {
        $existing = get_user_by('email', $email);
        if ($existing) {
            return (int) $existing->ID;
        }
        $id = wp_insert_user([
            'user_login'   => sanitize_user(strtok($email, '@')),
            'user_email'   => $email,
            'user_pass'    => 'assessment123',
            'display_name' => $name,
            'role'         => $role,
        ]);
        return (int) $id;
    }
}
