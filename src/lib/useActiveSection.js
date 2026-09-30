import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Keep section navigation in sync with the section nearest the top of the page.
// The hook intentionally receives only the sections represented in a navigation
// bar, so intermediate content does not make a different tab appear active.
export function useActiveSection(ids, initialId) {
  const key = ids.join('|')
  const loc = useLocation()
  const [active, setActive] = useState(ids.includes(initialId) ? initialId : ids[0])

  useEffect(() => {
    let frame = null
    const update = () => {
      frame = null
      let current = ids[0]
      const threshold = (document.querySelector('.nav-shell')?.getBoundingClientRect().height || 0) + 32
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= threshold) current = id
      }
      setActive(current)
    }
    const scheduleUpdate = () => {
      if (frame == null) frame = requestAnimationFrame(update)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [key, loc.key])

  return active
}
