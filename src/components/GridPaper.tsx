export function GridPaper() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: "#f4ecd8",
        backgroundImage: `
          linear-gradient(rgba(120, 110, 95, 0.22) 1px, transparent 1px),
          linear-gradient(90deg, rgba(120, 110, 95, 0.22) 1px, transparent 1px)
        `,
        backgroundSize: "28px 28px",
        backgroundPosition: "-1px -1px",
      }}
    />
  );
}
