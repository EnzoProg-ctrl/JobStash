// The wordmark: "Job" in navy, "Stash" in brand blue. The size comes from the
// className, so the same logo works in a header, a sidebar and a footer.
export default function Logo({ className = '' }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-primary">Job</span>
      <span className="text-brand-blue">Stash</span>
    </span>
  )
}
