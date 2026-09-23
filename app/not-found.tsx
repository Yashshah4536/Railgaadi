import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center bg-[--bg] px-4">
      <p className="text-6xl mb-4">🚂</p>
      <h1 className="text-2xl font-black mb-2">Train not found</h1>
      <p className="text-[--text-muted] mb-6 text-center">
        The train number you&apos;re looking for doesn&apos;t exist or the link is broken.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-[--radius-lg] text-sm font-semibold text-white"
        style={{ background: "var(--color-brand)" }}
      >
        Back to search
      </Link>
    </main>
  );
}
