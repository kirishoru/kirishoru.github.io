import { run, sortEstimate, type Answer, type RunResult } from './rank.ts'


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

const estimateText = (n: number, check: boolean) =>
  n < 2 ? 'Add at least two options.' : `${n} options, at most ${sortEstimate(n)} questions${check ? ' plus a few checks' : ''}.`

function renderSetup() {
  const n = parseItems(draft.text).length
  app.innerHTML = `
    <form class="card bg-base-100 shadow-sm rise"><div class="card-body gap-5">
      <fieldset class="fieldset">
        <legend class="fieldset-legend text-sm">Question</legend>
        <input name="q" class="input w-full" placeholder="${DEFAULT_Q}" value="${esc(draft.q)}">
        <p class="label">Optional. Shown above every comparison.</p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend text-sm">Options</legend>
        <textarea name="items" rows="8" class="textarea w-full text-base leading-relaxed" placeholder="Tacos&#10;Ramen&#10;Pizza">${esc(draft.text)}</textarea>
        <p class="label">One per line. Duplicates are ignored.</p>
      </fieldset>
      <label class="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="check" class="toggle toggle-primary mt-0.5" ${draft.check ? 'checked' : ''}>
        <span><span class="font-medium">Check for contradictions</span><br><span class="text-sm text-base-content/60">A few extra questions that catch slips and real toss-ups.</span></span>
      </label>
      <div class="card-actions items-center justify-between border-t border-base-300 pt-5">
        <span class="text-sm text-base-content/60" data-est>${estimateText(n, draft.check)}</span>
        <button type="submit" class="btn btn-primary" ${n < 2 ? 'disabled' : ''}>Start ranking</button>
      </div>
    </div></form>`
  const form = app.querySelector('form')!
  form.addEventListener('input', () => {
    draft = { text: form.items.value, q: form.q.value, check: form.check.checked }
    const k = parseItems(draft.text).length
    form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled = k < 2
    form.querySelector('[data-est]')!.textContent = estimateText(k, draft.check)
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
  const phase = r.phase === 'sort'
    ? `<span class="badge badge-soft badge-primary">Placing ${r.inserted + 1} of ${s.items.length}</span>`
    : r.phase === 'check'
      ? '<span class="badge badge-soft badge-accent">Checking the order</span>'
      : '<span class="badge badge-soft badge-secondary">Rechecking a contradiction</span>'
  const choice = (i: number, key: string) => `
    <button data-pick="${i}" class="group card bg-base-100 shadow-sm border-2 border-base-300 hover:border-primary hover:shadow-lg hover:-translate-y-0.5 focus-visible:border-primary outline-none transition cursor-pointer">
      <div class="card-body items-center justify-center text-center min-h-28 sm:min-h-40 gap-3">
        <span class="text-xl sm:text-2xl font-bold break-words">${esc(s.items[i])}</span>
        <kbd class="kbd kbd-sm opacity-50 group-hover:opacity-100">${key}</kbd>
      </div>
    </button>`
  app.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        ${phase}
        <span class="text-sm text-base-content/60 tabular-nums">Question ${r.asked + 1} · about ${r.remaining} to go</span>
      </div>
      <progress class="progress progress-primary w-full" value="${r.asked}" max="${total}"></progress>
      <h2 class="text-xl sm:text-2xl font-bold text-center">${esc(s.q)}</h2>
      <div class="grid sm:grid-cols-2 gap-4 rise">${choice(left, '←')}${choice(right, '→')}</div>
      <div class="flex justify-center gap-2 flex-wrap">
        <button class="btn btn-outline btn-sm" data-pick="equal"><kbd class="kbd kbd-xs">↓</kbd>About equal</button>
        <button class="btn btn-ghost btn-sm" data-undo ${s.ans.length ? '' : 'disabled'}><kbd class="kbd kbd-xs">U</kbd>Undo</button>
        <button class="btn btn-ghost btn-sm" data-reset>Start over</button>
      </div>
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
      const label = t.items.length > 1 ? `${rank}–${rank + t.items.length - 1}` : String(rank).padStart(2, '0')
      const top = rank === 1
      rank += t.items.length
      const note = t.kind === 'equal' ? '<span class="badge badge-soft badge-neutral">tied</span>' : t.kind === 'cycle' ? '<span class="badge badge-soft badge-warning">toss-up</span>' : ''
      return `<li class="list-row items-center">
        <div class="text-3xl font-extralight tabular-nums ${top ? 'text-primary' : 'opacity-40'} min-w-12">${label}</div>
        <div class="text-lg font-semibold leading-relaxed">${t.items.map((i) => esc(s.items[i])).join('<br>')}</div>
        <div>${note}</div>
      </li>`
    })
    .join('')
  const cycles = r.tiers.some((t) => t.kind === 'cycle')
  app.innerHTML = `
    <div class="space-y-6 rise">
      <div class="flex items-end justify-between gap-3 flex-wrap">
        <h2 class="text-xl sm:text-2xl font-bold">${esc(s.q)}</h2>
        <span class="text-sm text-base-content/60">${r.asked} questions${s.check ? ` · ${r.contradictions} contradiction${r.contradictions === 1 ? '' : 's'} rechecked` : ''}</span>
      </div>
      <ul class="list bg-base-100 rounded-box shadow-sm">${rows}</ul>
      ${cycles ? '<div role="alert" class="alert alert-warning alert-soft"><span>A toss-up means your answers went in a circle (A over B, B over C, C over A) even after rechecking. That usually means the options are close, or you value them for different reasons.</span></div>' : ''}
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-primary" data-copy>Copy link</button>
        <button class="btn btn-ghost" data-undo><kbd class="kbd kbd-xs">U</kbd>Undo last answer</button>
        <button class="btn btn-ghost" data-edit>Edit options</button>
        <button class="btn btn-ghost" data-reset>Start over</button>
      </div>
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
