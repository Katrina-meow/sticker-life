export function IconTag({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12V5a1 1 0 011-1h7l10 10-7 7-10-10z" />
      <circle cx="8.5" cy="8.5" r="1.2" />
    </svg>
  );
}
