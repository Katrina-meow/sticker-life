export function IconStudy({ className = "h-4 w-4" }: { className?: string }) {
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
      <path d="M4 6l8-3 8 3v13l-8 3-8-3V6z" />
      <path d="M12 3v17" />
    </svg>
  );
}
