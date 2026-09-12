<?php
/**
 * Courses endpoints.
 *
 * GET /bemalearn/v1/courses       public list
 * GET /bemalearn/v1/courses/{id}  public detail
 *
 * The authority on what these should return is docs/API-CONTRACT.md.
 */

if (!defined('ABSPATH')) {
    exit;
}

class BL_Courses_Controller {

    const PREVIEW_TTL = 300;

    public function register_routes() {
        register_rest_route('bemalearn/v1', '/courses', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_courses'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('bemalearn/v1', '/courses/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_course'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => [
                    'required'          => true,
                    'validate_callback' => function ($v) {
                        return is_numeric($v) && (int) $v > 0;
                    },
                ],
            ],
        ]);
    }

    public function get_courses($request) {
        global $wpdb;

        $table = $wpdb->prefix . 'bl_courses';
        $users = $wpdb->users;

        $rows = $wpdb->get_results(
            "SELECT c.id, c.title, c.price_minor, c.currency,
                    c.enrolment_count, c.average_rating,
                    c.is_published, c.published_at,
                    u.display_name AS instructor_name
               FROM {$table} c
               LEFT JOIN {$users} u ON u.ID = c.instructor_id
              WHERE c.is_published = 1
              ORDER BY c.published_at DESC, c.id DESC"
        );

        $courses = [];
        foreach ((array) $rows as $row) {
            $courses[] = $this->shape($row);
        }

        return new WP_REST_Response([
            'courses'                 => $courses,
            'previewExpiresInSeconds' => self::PREVIEW_TTL,
        ], 200);
    }

    public function get_course($request) {
        global $wpdb;

        $id    = (int) $request->get_param('id');
        $table = $wpdb->prefix . 'bl_courses';
        $users = $wpdb->users;

        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT c.*, u.display_name AS instructor_name
               FROM {$table} c
               LEFT JOIN {$users} u ON u.ID = c.instructor_id
              WHERE c.id = %d",
            $id
        ));

        // An unpublished course is treated as absent. A 403 here would confirm
        // that the course exists, which is itself a disclosure.
        if (!$row || !(int) $row->is_published) {
            return new WP_Error('not_found', 'Course not found.', ['status' => 404]);
        }

        $shaped = $this->shape($row);
        $shaped['description'] = $row->description;
        $shaped['lessonCount'] = (int) ($row->lesson_count ?? 0);

        return new WP_REST_Response($shaped, 200);
    }

    /**
     * Turn a database row into the contract shape.
     *
     * enrolmentCount and averageRating are nullable in the contract: null means
     * "not yet counted", which is not the same as a measured zero. They are
     * cast only when they carry a value.
     */
    private function shape($row) {
        return [
            'id'             => (int) $row->id,
            'title'          => $row->title,
            'instructorName' => $row->instructor_name,
            'priceMinor'     => (int) $row->price_minor,
            'currency'       => $row->currency,
            'enrolmentCount' => $row->enrolment_count === null ? null : (int) $row->enrolment_count,
            'averageRating'  => $row->average_rating === null ? null : (float) $row->average_rating,
            'publishedAt'    => $row->published_at
                ? gmdate('c', strtotime($row->published_at))
                : null,
            'isPublished'    => (bool) $row->is_published,
        ];
    }
}
