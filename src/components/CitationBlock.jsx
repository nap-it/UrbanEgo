import { useState } from 'react'

export default function CitationBlock({ title, label, citation }) {
  const [status, setStatus] = useState('')

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation)
      setStatus('Copied.')
    } catch {
      setStatus('Copy unavailable. Select the citation below to copy it.')
    }
  }

  return (
    <div className="citation-block">
      <div className="citation-heading">
        <h3>{title}</h3>
        <button className="btn" type="button" onClick={copyCitation} aria-label={`Copy BibTeX: ${title}`}>
          Copy BibTeX
        </button>
      </div>
      <pre className="cite" aria-label={label}>{citation}</pre>
      <p className="copy-status" role="status">{status}</p>
    </div>
  )
}
