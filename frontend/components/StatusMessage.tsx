/**
 * WORKED EXAMPLE - this is the house style. Copy this shape.
 *
 * Three states are DISTINCT, and that distinction is the point:
 *
 *   loading  - we do not know yet
 *   error    - we asked and it failed (say WHY where we safely can)
 *   empty    - we asked, it worked, there is genuinely nothing
 *
 * Collapsing "empty" and "error" into one blank screen is a real defect: the
 * user cannot tell "no courses exist" from "the request failed".
 */
export function StatusMessage({
  state,
  message,
}: {
  state: "loading" | "error" | "empty";
  message?: string;
}) {
  const base = "rounded-md border px-4 py-6 text-center text-sm";

  if (state === "loading") {
    return <div className={`${base} border-slate-200 bg-white text-slate-500`}>Loading…</div>;
  }

  if (state === "error") {
    return (
      <div className={`${base} border-red-200 bg-red-50 text-red-700`}>
        {message ?? "Something went wrong. Please try again."}
      </div>
    );
  }

  return (
    <div className={`${base} border-slate-200 bg-white text-slate-500`}>
      {message ?? "Nothing to show yet."}
    </div>
  );
}
