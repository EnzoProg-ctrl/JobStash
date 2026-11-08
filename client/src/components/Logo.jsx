import mark from '../assets/logo-mark.svg'
import markDark from '../assets/logo-mark-dark.svg'

// The logo: the mark (the three blue shapes) and the wordmark, "Job" in navy
// and "Stash" in brand blue. The size comes from the className, and the mark is
// sized in em, so it always matches the text: the same logo works in a header,
// a sidebar and a footer.
//
// The dark theme uses its own mark (the navy shape drawn pale, so it shows on
// a navy page), and "Job" turns light with the primary colour token.
//
// wordClassName styles just the word, for example to hide it on the narrowest
// phones and keep only the mark.
export default function Logo({ className = '', wordClassName = '' }) {
  return (
    // flex, not inline-flex: as an inline box it would sit on a line of text
    // and leave room below for letters like "g", making the header taller.
    <span className={`flex items-center gap-[0.3em] font-bold tracking-tight ${className}`}>
      {/* The name is right beside it, so screen readers skip the picture. */}
      <img src={mark} alt="" aria-hidden="true" className="h-[1.15em] w-auto dark:hidden" />
      <img src={markDark} alt="" aria-hidden="true" className="hidden h-[1.15em] w-auto dark:block" />
      <span className={wordClassName}>
        <span className="text-primary">Job</span>
        <span className="text-logo-blue">Stash</span>
      </span>
    </span>
  )
}
