// A circle with the signed-in person's initials, in the dashboard's top bar
// (AppHeader.jsx) and on the landing page (HomePage.jsx). Hovering it shows
// which account is signed in; screen readers hear the same.
export default function UserAvatar({ user, className = '' }) {
  return (
    <span
      title={`Signed in as ${user.email}`}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-subtle font-semibold text-ink ${className}`}
    >
      <span aria-hidden="true">{initials(user)}</span>
      <span className="sr-only">Signed in as {user.email}</span>
    </span>
  )
}

// "Lorenzo Centeno" -> "LC", from the name Google shares at sign-in; without a
// name, the first letter of the email address.
function initials(user) {
  const name = (user.user_metadata?.full_name || user.user_metadata?.name || '').trim()
  const words = name.split(/\s+/).filter(Boolean)
  const first = (word) => Array.from(word)[0] ?? ''
  const letters = words.length > 1
    ? first(words[0]) + first(words[words.length - 1])
    : first(words[0] || user.email || '?')
  return letters.toUpperCase()
}
