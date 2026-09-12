/**
 * Types for the Bema Learn API.
 *
 * These mirror docs/API-CONTRACT.md. Note the nullable fields - `null` and `0`
 * carry different meanings and the UI must not collapse them.
 */

export interface Course {
  id: number;
  title: string;
  instructorName: string;
  priceMinor: number;
  currency: string;
  /** null = not yet counted. NOT the same as 0. */
  enrolmentCount: number | null;
  /** null = no ratings yet. 0 would mean "rated zero". */
  averageRating: number | null;
  publishedAt: string | null;
  isPublished: boolean;
}

export interface CourseListResponse {
  courses: Course[];
  previewExpiresInSeconds: number;
}

export interface AuthUser {
  id: number;
  name: string;
  role: "instructor" | "learner";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface Earnings {
  availableMinor: number;
  pendingMinor: number;
  currency: string;
  /** Read this from the API. Do not hardcode a minimum in the UI. */
  minimumWithdrawalMinor: number;
  lastWithdrawalAt: string | null;
}

export interface Withdrawal {
  id: number;
  amountMinor: number;
  status: string;
  payoutReference: string;
  createdAt: string;
}

/** The error envelope every failing endpoint returns. */
export interface ApiError {
  code: string;
  message: string;
  data?: { status: number };
}
