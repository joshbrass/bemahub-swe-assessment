import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <p className="text-slate-600">
        Assessment environment. Start with the tasks in <code>docs/</code>.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li><Link className="text-blue-600 underline" href="/courses">Courses (Task 1)</Link></li>
        <li><Link className="text-blue-600 underline" href="/login">Sign in (Task 2)</Link></li>
        <li><Link className="text-blue-600 underline" href="/earnings">Earnings &amp; withdrawal (Tasks 2-3)</Link></li>
      </ul>
    </div>
  );
}
