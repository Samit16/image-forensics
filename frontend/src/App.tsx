import { type ChangeEvent, type DragEvent, useEffect, useMemo, useState } from 'react'
import './App.css'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type Report = { id: string; originalFilename: string; mimeType: string; fileSizeBytes: number; exif: Record<string, JsonValue>; steganography: { flagged: boolean; score: number; method: string }; createdAt: string }
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '')
const humanFileSize = (bytes: number) => { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}` }
const displayValue = (value: JsonValue): string => value === null ? 'Not available' : Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? Object.entries(value).map(([key, item]) => `${key}: ${displayValue(item)}`).join(' · ') : String(value)
const metadataEntries = (
  exif: Record<string, JsonValue> | null | undefined
) =>
  Object.entries(exif ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );
function findingSummary(report: Report) {const gps = Boolean(
  report.exif?.latitude ??
  report.exif?.GPSLatitude ??
  report.exif?.GPSLatitudeRef ??
  report.exif?.longitude ??
  report.exif?.GPSLongitude
); const timestamp = Boolean(report.exif?.DateTimeOriginal ?? report.exif?.CreateDate ?? report.exif?.timestamp); const device = Boolean(report.exif?.Make ?? report.exif?.Model ?? report.exif?.device); const findings = [gps ? 'Location coordinates are embedded in this image.' : null, timestamp ? 'A capture time is embedded in this image.' : null, device ? 'Camera or device information is embedded in this image.' : null].filter(Boolean); return findings.length ? findings : ['No common location, capture-time, or device fields were found.'] }

function App() {
  const [file, setFile] = useState<File | null>(null); const [dragging, setDragging] = useState(false); const [isAnalyzing, setIsAnalyzing] = useState(false); const [isLoadingHistory, setIsLoadingHistory] = useState(true); const [error, setError] = useState<string | null>(null); const [reports, setReports] = useState<Report[]>([]); const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]); useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  async function request(path: string, options?: RequestInit) {
    let response: Response
    try {
  response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      'ngrok-skip-browser-warning': 'true',
    },
  });
} catch {
      throw new Error('The API could not be reached. Check that the tunnel and API are running.')
    }
    const isJson = response.headers.get('content-type')?.includes('application/json')
    if (!isJson) {
      throw new Error('The configured API URL did not return an API response. If you use ngrok, restart the tunnel and update VITE_API_BASE_URL in .env.local.')
    }
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || 'The service could not complete that request.')
    return data
  }
  async function loadReports() { setIsLoadingHistory(true); try { const data = await request('/reports'); if (!Array.isArray(data)) throw new Error('The API returned an invalid report-history response.'); setReports(data as Report[]) } catch (requestError) { setReports([]); setError(requestError instanceof Error ? requestError.message : 'Could not load report history.') } finally { setIsLoadingHistory(false) } }
  useEffect(() => { void loadReports() }, [])
  function chooseFile(candidate?: File) { if (!candidate) return; if (!candidate.type.startsWith('image/')) { setError('Choose an image file (such as JPEG, PNG, or WebP).'); return }; setError(null); setFile(candidate) }
  function onDrop(event: DragEvent<HTMLLabelElement>) { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]) }
  async function analyze() { if (!file) return; setIsAnalyzing(true); setError(null); try { const formData = new FormData(); formData.append('image', file); const report = await request('/analyze', { method: 'POST', body: formData }) as Report; setSelectedReport(report); setReports((current) => [report, ...current.filter(({ id }) => id !== report.id)]) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not analyze this image.') } finally { setIsAnalyzing(false) } }
  async function openReport(id: string) { setError(null); try { setSelectedReport(await request(`/reports/${id}`) as Report) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not open this report.') } }
  const entries = selectedReport ? metadataEntries(selectedReport.exif) : []
  return <main className="shell"><header className="topbar"><a className="brand" href="#top" aria-label="Reveal home"><span className="brand-mark">R</span><span>REVEAL</span></a><p className="eyebrow">Image privacy inspector</p><a className="history-link" href="#history">Report archive <span aria-hidden="true">↓</span></a></header>
    <section className="intro" id="top"><p className="kicker">What your image carries</p><h1>Look beneath<br /><em>the pixels.</em></h1><p className="intro-copy">Upload an image to inspect the metadata it shares and review a cautious statistical signal for possible hidden data.</p></section>
    <section className="workspace" aria-label="Image analysis"><div className="upload-panel"><div className="panel-heading"><span className="step">01</span><h2>Choose an image</h2></div><label className={`dropzone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><input type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0])} />{previewUrl ? <img src={previewUrl} alt="Selected image preview" /> : <><span className="drop-icon" aria-hidden="true">↥</span><strong>Drop an image here</strong><span>or browse from your device</span></>}{file && <span className="file-tag">{file.name} · {humanFileSize(file.size)}</span>}</label><div className="upload-actions"><p>Images are processed in memory. No image file is saved by this interface.</p><button className="primary" disabled={!file || isAnalyzing} onClick={analyze}>{isAnalyzing ? 'Inspecting image…' : 'Inspect image'} <span aria-hidden="true">→</span></button></div>{error && <div className="error" role="alert">{error}</div>}</div><aside className="scope-card"><p className="kicker">What we inspect</p><div><span>01</span><p><strong>Metadata exposure</strong>Device, location and capture details embedded in the file.</p></div><div><span>02</span><p><strong>Pixel-pattern signal</strong>A limited LSB statistical check, described as a signal—not proof.</p></div><p className="scope-note">A result helps you decide what to review. It does not establish intent or hidden content.</p></aside></section>
    {selectedReport && <section className="report" aria-live="polite"><div className="report-header"><div><p className="kicker">Analysis complete</p><h2>{selectedReport.originalFilename}</h2><p className="muted">{humanFileSize(selectedReport.fileSizeBytes)} · {selectedReport.mimeType} · {new Date(selectedReport.createdAt).toLocaleString()}</p></div><span className="report-id">Report {selectedReport.id.slice(-6)}</span></div><div className="findings"><article><p className="kicker">Privacy findings</p><h3>{findingSummary(selectedReport).at(0)?.startsWith('No') ? 'No common privacy fields found' : 'Details worth reviewing'}</h3><ul>{findingSummary(selectedReport).map((finding) => <li key={finding}>{finding}</li>)}</ul></article><article className={selectedReport.steganography.flagged ? 'signal signal-alert' : 'signal'}><p className="kicker">Hidden-data signal</p><h3>{selectedReport.steganography.flagged ? 'A pattern merits a closer look' : 'No elevated pattern signal'}</h3><p>{selectedReport.steganography.flagged ? 'This LSB distribution is statistically unusual enough to flag for further review. It is not evidence that data is hidden.' : 'This check did not find an elevated LSB pattern. That does not rule out hidden content.'}</p><small>{selectedReport.steganography.method}</small></article></div><div className="metadata"><div className="metadata-heading"><p className="kicker">Embedded metadata</p><h3>{entries.length ? `${entries.length} fields discovered` : 'No readable metadata discovered'}</h3></div>{entries.length ? <dl>{entries.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{displayValue(value)}</dd></div>)}</dl> : <p className="empty-copy">This file did not expose EXIF fields that the service could read.</p>}</div></section>}
    <section className="history" id="history"><div className="section-heading"><div><p className="kicker">Stored reports</p><h2>Recent inspections</h2></div><button className="text-button" onClick={() => void loadReports()} disabled={isLoadingHistory}>Refresh</button></div>{error && <div className="error" role="alert">{error}</div>}{isLoadingHistory ? <p className="empty-copy">Loading reports…</p> : reports.length ? <div className="report-list">{reports.map((report) => <button key={report.id} className="report-row" onClick={() => void openReport(report.id)}><span className={report.steganography.flagged ? 'status-dot alert' : 'status-dot'} aria-label={report.steganography.flagged ? 'Pattern flagged' : 'No elevated pattern'}></span><span className="report-name">{report.originalFilename}<small>{new Date(report.createdAt).toLocaleDateString()} · {humanFileSize(report.fileSizeBytes)}</small></span><span className="report-summary">{Object.keys(report.exif ?? {}).length ? `${Object.keys(report.exif ?? {}).length} metadata fields` : 'No readable metadata'}</span><span aria-hidden="true">→</span></button>)}</div> : <p className="empty-copy">Your completed image inspections will appear here.</p>}</section><footer><span>REVEAL / image privacy inspector</span><span>Heuristic results are signals for review, not verdicts.</span></footer></main>
}
export default App
