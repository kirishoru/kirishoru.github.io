import { run, sortEstimate, type Answer, type RunResult } from './rank.ts'
import './prioritize.css'

// The whole session lives in the URL hash, so a link restores it exactly.
interface Session { q: string; items: string[]; ans: Answer[]; check: boolean }
const DEFAULT_Q = 'Which do you prefer?'

function readHash(): Session | null {
  try {
    const raw = new URLSearchParams(location.hash.slice(1)).get('s')
    if (!raw) return null
    const s = JSON.parse(raw) as { q?: string; i?: string[]; a?: string; c?: number }
    if (!Array.isArray(s.i) || s.i.length < 2) return null
    return {
      q: s.q || DEFAULT_Q,
      items: s.i.map(String),
      ans: [...(s.a ?? '')].filter((c): c is Answer => c === 'a' || c === 'b' || c === 'e'),
      check: s.c !== 0,
    }
  } catch {
    return null
  }
}
function writeHash(s: Session | null) {
  const h = s ? '#' + new URLSearchParams({ s: JSON.stringify({ q: s.q, i: s.items, a: s.ans.join(''), c: s.check ? 1 : 0 }) }) : ''
  history.replaceState(null, '', location.pathname + location.search + h)
}

const app = document.querySelector<HTMLDivElement>('#app')!
let session: Session | null = readHash()
let draft = { text: '', q: '', check: true }
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function parseItems(text: string) {
  const seen = new Set<string>()
  return text.split('\n').map((l) => l.trim()).filter((l) => l && !seen.has(l.toLowerCase()) && seen.add(l.toLowerCase()))
}

function render() {
  if (!session) return renderSetup()
  const r = run(session.items.length, session.ans, { check: session.check })
  if (r.next) renderQuestion(session, r)
  else renderResult(session, r)
}

function renderSetup() {
  const items = parseItems(draft.text)
  const n = items.length
  app.innerHTML = `
    <p class="intro">List the options, one per line. You'll compare them two at a time, and the tool builds the ranking.</p>
    <form class="setup">
      <label class="stack">Question <input name="q" placeholder="${DEFAULT_Q}" value="${esc(draft.q)}"></label>
      <label class="stack">Options <textarea name="items" rows="8" placeholder="Tacos&#10;Ramen&#10;Pizza">${esc(draft.text)}</textarea></label>
      <label class="check"><input type="checkbox" name="check" ${draft.check ? 'checked' : ''}> Check for contradictions <span>a few extra questions; catches slips and real toss-ups</span></label>
      <div class="row">
        <button type="submit" class="primary" ${n < 2 ? 'disabled' : ''}>Start</button>
        <span class="muted">${n < 2 ? 'Add at least two options.' : `${n} options, at most ${sortEstimate(n)} questions${draft.check ? ' plus a few checks' : ''}.`}</span>
      </div>
    </form>`
  const form = app.querySelector('form')!
  form.addEventListener('input', () => {
    draft = { text: form.items.value, q: form.q.value, check: form.check.checked }
    const k = parseItems(draft.text).length
    const btn = form.querySelector<HTMLButtonElement>('button')!
    btn.disabled = k < 2
    form.querySelector('.row .muted')!.textContent = k < 2 ? 'Add at least two options.' : `${k} options, at most ${sortEstimate(k)} questions${draft.check ? ' plus a few checks' : ''}.`
  })
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const list = parseItems(form.items.value)
    if (list.length < 2) return
    session = { q: form.q.value.trim() || DEFAULT_Q, items: list, ans: [], check: form.check.checked }
    writeHash(session)
    render()
  })
}

function renderQuestion(s: Session, r: RunResult) {
  const [x, y] = r.next!
  // Alternate sides so the newer item isn't always on the left.
  const flip = s.ans.length % 2 === 1
  const [left, right] = flip ? [y, x] : [x, y]
  const total = r.asked + r.remaining
  const phaseNote = r.phase === 'sort' ? `Placing option ${r.inserted + 1} of ${s.items.length}` : r.phase === 'check' ? 'Checking the order' : 'Rechecking a contradiction'
  app.innerHTML = `
    <div class="progress" aria-hidden="true"><div style="width:${Math.round((100 * r.asked) / total)}%"></div></div>
    <p class="muted small">${phaseNote}. Question ${r.asked + 1}, about ${r.remaining} to go.</p>
    <h2 class="q">${esc(s.q)}</h2>
    <div class="pair">
      <button class="choice" data-pick="${left}"><kbd>←</kbd>${esc(s.items[left])}</button>
      <button class="choice" data-pick="${right}"><kbd>→</kbd>${esc(s.items[right])}</button>
    </div>
    <div class="row center">
      <button class="ghost" data-pick="equal"><kbd>↓</kbd>About equal</button>
      <button class="ghost" data-undo ${s.ans.length ? '' : 'disabled'}><kbd>U</kbd>Undo</button>
      <button class="ghost" data-reset>Start over</button>
    </div>`
  const answer = (pick: string) => {
    const a: Answer = pick === 'equal' ? 'e' : Number(pick) === x ? 'a' : 'b'
    s.ans.push(a)
    writeHash(s)
    render()
  }
  app.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.pick!)))
  bindCommon(s)
  onKey = (k) => {
    if (k === 'ArrowLeft') answer(String(left))
    else if (k === 'ArrowRight') answer(String(right))
    else if (k === 'ArrowDown') answer('equal')
    else if (k === 'u' || k === 'U') undo(s)
  }
}

function renderResult(s: Session, r: RunResult) {
  let rank = 1
  const rows = r.tiers
    .map((t) => {
      const label = t.items.length > 1 ? `${rank}–${rank + t.items.length - 1}` : String(rank)
      rank += t.items.length
      const note = t.kind === 'equal' ? '<span class="tag">tied</span>' : t.kind === 'cycle' ? '<span class="tag warn">toss-up</span>' : ''
      return `<li><span class="rank">${label}</span><span class="names">${t.items.map((i) => esc(s.items[i])).join('<br>')}</span>${note}</li>`
    })
    .join('')
  const cycles = r.tiers.some((t) => t.kind === 'cycle')
  app.innerHTML = `
    <h2 class="q">${esc(s.q)}</h2>
    <ol class="ranking">${rows}</ol>
    <p class="muted small">${r.asked} questions${s.check ? `, ${r.contradictions} contradiction${r.contradictions === 1 ? '' : 's'} rechecked` : ''}.</p>
    ${cycles ? '<p class="note">A toss-up means your answers went in a circle (A over B, B over C, C over A) even after rechecking. That usually means they are close, or you value them for different reasons.</p>' : ''}
    <div class="row">
      <button class="primary" data-copy>Copy link</button>
      <button class="ghost" data-undo><kbd>U</kbd>Undo last answer</button>
      <button class="ghost" data-edit>Edit options</button>
      <button class="ghost" data-reset>Start over</button>
    </div>`
  bindCommon(s)
  app.querySelector('[data-copy]')!.addEventListener('click', async (e) => {
    const b = e.currentTarget as HTMLButtonElement
    try { await navigator.clipboard.writeText(location.href); b.textContent = 'Copied' } catch { b.textContent = 'Copy failed' }
  })
  app.querySelector('[data-edit]')!.addEventListener('click', () => {
    draft = { text: s.items.join('\n'), q: s.q === DEFAULT_Q ? '' : s.q, check: s.check }
    session = null
    writeHash(null)
    render()
  })
  onKey = (k) => { if (k === 'u' || k === 'U') undo(s) }
}

function undo(s: Session) {
  if (!s.ans.length) return
  s.ans.pop()
  writeHash(s)
  render()
}

function bindCommon(s: Session) {
  app.querySelector('[data-undo]')?.addEventListener('click', () => undo(s))
  app.querySelector('[data-reset]')?.addEventListener('click', () => {
    session = null
    draft = { text: '', q: '', check: true }
    writeHash(null)
    render()
  })
}

let onKey: ((k: string) => void) | null = null
document.addEventListener('keydown', (e) => {
  if (!session || e.metaKey || e.ctrlKey || e.altKey) return
  if ((e.target as HTMLElement).closest('input, textarea')) return
  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'u', 'U'].includes(e.key)) { e.preventDefault(); onKey?.(e.key) }
})
window.addEventListener('hashchange', () => { session = readHash(); render() })

render()
