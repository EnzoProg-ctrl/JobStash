import mark from '../assets/logo-mark.svg'

// The logo: the mark (the three blue shapes) and the wordmark, "Job" in navy
// and "Stash" in brand blue. The size comes from the className, and the mark is
// sized in em, so it always matches the text: the same logo works in a header,
// a sidebar and a footer.
export default function Logo({ className = '' }) {
  return (
    // flex, not inline-flex: as an inline box it would sit on a line of text
    // and leave room below for letters like "g", making the header taller.
    <span className={`flex items-center gap-[0.3em] font-bold tracking-tight ${className}`}>
      {/* The name is right beside it, so screen readers skip the picture. */}
      <img src={mark} alt="" aria-hidden="true" className="h-[1.15em] w-auto" />
      <span>
        <span className="text-primary">Job</span>
        <span className="text-brand-blue">Stash</span>
      </span>
    </span>
  )
}
