/**
 * Courses API service.
 *
 * Thin wrapper around the shared axios client - keeps the endpoint path and
 * response shape in one place so callers (React Query hooks, etc.) don't
 * reach into `api` directly.
 */
import { api } from "@/lib/api/client";
import type { CourseListResponse } from "@/lib/types/api";

export async function getCourses(): Promise<CourseListResponse> {
  const { data } = await api.get<CourseListResponse>("/courses");
  return data;
}
