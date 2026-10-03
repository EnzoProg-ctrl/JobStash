// The ☆ on a job card: tap to star a job as a favourite, tap again to unstar.
// It only shows the star; the page decides what starring means.
export default function FavoriteButton({ on, label, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? `Remove ${label} from favourites` : `Add ${label} to favourites`}
      title={on ? 'Remove from favourites' : 'Add to favourites'}
      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-accent hover:bg-subtle hover:text-ink"
    >
      <svg
        className={`size-5 ${on ? 'fill-amber-400 stroke-amber-600' : 'fill-none stroke-current'}`}
        viewBox="0 0 20 20"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 2.5l2.3 4.7 5.2.8-3.8 3.6.9 5.1L10 14.3l-4.6 2.4.9-5.1L2.5 8l5.2-.8z" />
      </svg>
    </button>
  )
}