export function IconFood({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M8 3v4c0 2 2 3 4 3s4-1 4-3V3M8 10v11M16 10v11M4 21h16" />
    </svg>
  );
}
