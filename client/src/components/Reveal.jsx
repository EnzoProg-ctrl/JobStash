import { useEffect, useRef, useState } from 'react'

// Fades a part of the landing page in, rising a little, as it scrolls into
// view; scrolling back up until it drops below the screen fades it out again,
// so it plays once more on the way down. Used for the sections under the
// headline (HomePage.jsx). The look is the .reveal style in styles.css; people
// who ask their device for less motion just see everything.
//
//   <Reveal as="li" delay={120}>…</Reveal>
//
// as: which element to draw (div by default). delay: milliseconds to wait
// before fading in, so a row of items can arrive one after another.
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const element = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const target = element.current
    // An old browser without IntersectionObserver: just show it.
    if (!target || !('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    // "In view" means its top has come up past the bottom 10% of the screen,
    // so it starts once it's properly on screen, not at the very edge.
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown(true)
        // Out of view below the screen: scrolled back up past it.
        else if (entry.boundingClientRect.top > 0) setShown(false)
        // Out of view above the screen (scrolled down past it): stays shown,
        // so scrolling back up doesn't make it blink.
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    watcher.observe(target)

    // The watcher above misses jumps straight past it (the Home or End key,
    // a link to a section further down): it only speaks up when the element
    // goes in or out of view. So on every scroll (at most once a frame), also
    // check: below the screen means hidden, above it means shown.
    let frame = 0
    function check() {
      frame = 0
      const box = target.getBoundingClientRect()
      if (box.top > window.innerHeight) setShown(false)
      else if (box.bottom < 0) setShown(true)
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(check)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      watcher.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <Tag
      ref={element}
      data-reveal={shown ? 'shown' : 'hidden'}
      className={`reveal ${className}`}
      style={{ ...style, '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
