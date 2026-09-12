"use client";

/**
 * Task 1 - published course list.
 *
 * Loading / error / empty are rendered as three genuinely distinct states via
 * StatusMessage - a failed request must never look like "no courses".
 */
import { useQuery } from "@tanstack/react-query";
import { getCourses } from "@/lib/api/services/courses";
import { StatusMessage } from "@/components/StatusMessage";
import { formatMoney, formatNullableNumber } from "@/lib/format";

export default function CoursesPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
    // The contract's `previewExpiresInSeconds` tells us how long this
    // response stays fresh. We only know that value once we've fetched at
    // least once, so fall back to 0 (always stale) until then - see
    // SOLUTION.md for the full reasoning.
    staleTime: (query) => {
      const seconds = query.state.data?.previewExpiresInSeconds;
      return seconds !== undefined ? seconds * 1000 : 0;
    },
  });

  if (isPending) {
    return <StatusMessage state="loading" />;
  }

  if (isError) {
    return (
      <StatusMessage
        state="error"
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const courses = data.courses;

  if (courses.length === 0) {
    return <StatusMessage state="empty" message="No courses published yet." />;
  }

  return (
    <ul className="space-y-4">
      {courses.map((course) => (
        <li
          key={course.id}
          className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">{course.title}</h2>
              <p className="text-sm text-slate-500">{course.instructorName}</p>
            </div>
            <p className="whitespace-nowrap font-semibold text-slate-900">
              {formatMoney(course.priceMinor, course.currency)}
            </p>
          </div>
          <dl className="mt-3 flex gap-6 text-sm text-slate-600">
            <div>
              <dt className="inline text-slate-400">Enrolled: </dt>
              <dd className="inline">{formatNullableNumber(course.enrolmentCount)}</dd>
            </div>
            <div>
              <dt className="inline text-slate-400">Rating: </dt>
              <dd className="inline">{formatNullableNumber(course.averageRating)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
