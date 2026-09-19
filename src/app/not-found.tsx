import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-state">
      <h1>Page not found</h1>
      <p>That Cleanie page does not exist or is no longer public.</p>
      <Link href="/">Return home</Link>
    </main>
  );
}
