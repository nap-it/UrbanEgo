import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import RunDetail from './pages/RunDetail.jsx'
import { LINKS, asset } from './lib/data.js'

const SECTIONS = [
  ['overview', 'Overview'],
  ['demo', 'Demo'],
  ['data', 'Data & Format'],
  ['detections', 'Detections'],
  ['runs', 'Runs'],
  ['download', 'Download'],
  ['cite', 'Citation'],
]

function Header() {
  const navigate = useNavigate()
  const loc = useLocation()
  const goto = (id) => {
    if (loc.pathname === '/') document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    else navigate('/', { state: { scrollTo: id } })
  }
  return (
    <header className="site-header">
      <div className="banner" style={{ backgroundImage: `url(${asset('banner2.jpg')})` }}>
        <div className="banner-inner">
          <Link to="/" className="brand">
            <h1>UrbanEgo Dataset</h1>
          </Link>
          <div className="tagline">A wearable HoloLens&nbsp;2 dataset for vulnerable-road-user research in urban environments</div>
        </div>
      </div>
      <nav className="mainnav">
        {SECTIONS.map(([id, label]) => (
          <button key={id} onClick={() => goto(id)}>{label}</button>
        ))}
        <a href={LINKS.paper} target="_blank" rel="noreferrer">Paper</a>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page">
        <div>UrbanEgo · Instituto de Telecomunicações & Universidade de Aveiro · Aveiro Tech City Living Lab.</div>
        <div>Basemap tiles © Esri.</div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/runs/:id" element={<RunDetail />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
