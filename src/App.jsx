import { useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import DataGuide from './pages/DataGuide.jsx'
import RunDetail from './pages/RunDetail.jsx'
import { asset } from './lib/data.js'
import { useActiveSection } from './lib/useActiveSection.js'

const SECTIONS = [
  ['/?section=overview', 'Overview'],
  ['/?section=runs', 'Explore'],
  ['/?section=download', 'Data guide'],
  ['/?section=cite', 'Citations'],
  ['/?section=license', 'License'],
]

function ScrollToSection() {
  const loc = useLocation()
  useEffect(() => {
    const id = new URLSearchParams(loc.search).get('section') || loc.state?.scrollTo
    const frame = requestAnimationFrame(() => {
      if (id) document.getElementById(id)?.scrollIntoView()
      else window.scrollTo(0, 0)
    })
    return () => cancelAnimationFrame(frame)
  }, [loc.pathname, loc.search, loc.state, loc.key])
  return null
}

function Header() {
  const loc = useLocation()
  const section = new URLSearchParams(loc.search).get('section') || loc.state?.scrollTo || 'overview'
  const activeSection = useActiveSection(['overview', 'runs', 'download', 'cite', 'license'], section)
  const isGuide = loc.pathname === '/data-guide'
  const isRunDetail = loc.pathname.startsWith('/runs/')
  return (
    <>
      <header className="site-header">
        <div className="banner" style={{ backgroundImage: `url(${asset('banner.jpg')})` }}>
          <div className="banner-inner">
            <Link to="/" className="brand">
              <h1>UrbanEgo Dataset</h1>
            </Link>
            <div className="tagline">A Multimodal First-Person Urban Perception Dataset</div>
          </div>
        </div>
      </header>
      <div className="nav-shell">
        <nav className="mainnav" aria-label="Main navigation">
          <ul className="mainnav-list">
            {SECTIONS.map(([to, label]) => {
              const target = to.split('=')[1]
              const current = isGuide
                ? target === 'download'
                : isRunDetail ? target === 'runs' : loc.pathname === '/' && target === activeSection
              return (
                <li key={to}>
                  <Link className={current ? 'is-active' : undefined} to={to} aria-current={current ? 'location' : undefined}>{label}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page">
        <div>UrbanEgo · Instituto de Telecomunicações & Universidade de Aveiro.</div>
        <div>Basemap tiles © Esri.</div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="app">
      <ScrollToSection />
      <Header />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/data-guide" element={<DataGuide />} />
          <Route path="/runs/:id" element={<RunDetail />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
