import { ACTIVITY, LB_PER_KG, SITES, SITE_LABELS, compute, type ActivityId, type Protocol, type Sex, type Site } from './calc.ts'
import './bodycomp.css'

type Unit = 'imperial' | 'metric'

interface State {
  unit: Unit
  sex: Sex
  protocol: Protocol
  age: string
  weight: string // in the current unit
  activity: ActivityId
  skinfolds: Partial<Record<Site, string>>
}

const KEY = 'bodycomp:v1'
const defaults: State = { unit: 'imperial', sex: 'male', protocol: 'jp3', age: '', weight: '', activity: 'moderate', skinfolds: {} }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
}

const state = load()
const app = document.querySelector<HTMLDivElement>('#app')!

const fmt = (n: number, d = 1) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
const massUnit = () => (state.unit === 'metric' ? 'kg' : 'lb')
const toKg = (v: number) => (state.unit === 'metric' ? v : v / LB_PER_KG)
const fromKg = (kg: number) => (state.unit === 'metric' ? kg : kg * LB_PER_KG)

function segmented<T extends string>(name: string, value: T, options: [T, string][]) {
  return `<div class="seg" role="radiogroup" aria-label="${name}">${options
    .map(([v, label]) => `<button type="button" role="radio" data-${name}="${v}" aria-checked="${v === value}">${label}</button>`)
    .join('')}</div>`
}

function render() {
  const sites = SITES[state.sex][state.protocol]
  app.innerHTML = `
    <div class="units">${segmented<Unit>('unit', state.unit, [['imperial', 'lb'], ['metric', 'kg']])}</div>
    <p class="intro">Estimates body fat from skinfold caliper measurements (Jackson-Pollock), then resting and daily calories from lean mass (Katch-McArdle).</p>
    <form class="grid" autocomplete="off">
      <fieldset>
        <legend>You</legend>
        <label>Sex ${segmented<Sex>('sex', state.sex, [['male', 'Male'], ['female', 'Female']])}</label>
        <label>Age <span class="field"><input name="age" type="number" inputmode="decimal" min="1" value="${state.age}"><span>yr</span></span></label>
        <label>Weight <span class="field"><input name="weight" type="number" inputmode="decimal" min="1" step="0.1" value="${state.weight}"><span>${massUnit()}</span></span></label>
        <label>Activity
          <select name="activity">${ACTIVITY.map((a) => `<option value="${a.id}" ${a.id === state.activity ? 'selected' : ''}>${a.label}</option>`).join('')}</select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Skinfolds</legend>
        <label>Method ${segmented<Protocol>('protocol', state.protocol, [['jp3', '3-site'], ['jp7', '7-site']])}</label>
        ${sites
          .map((s) => `<label>${SITE_LABELS[s]} <span class="field"><input name="site:${s}" type="number" inputmode="decimal" min="0" step="0.5" value="${state.skinfolds[s] ?? ''}"><span>mm</span></span></label>`)
          .join('')}
      </fieldset>
    </form>
    <section class="results" aria-live="polite"></section>
  `
  renderResults()
}

function renderResults() {
  const out = app.querySelector<HTMLElement>('.results')!
  const skinfolds: Partial<Record<Site, number>> = {}
  for (const [k, v] of Object.entries(state.skinfolds)) if (v !== '' && v !== undefined) skinfolds[k as Site] = Number(v)
  try {
    const r = compute({
      sex: state.sex, protocol: state.protocol, age: Number(state.age), weightKg: toKg(Number(state.weight)),
      skinfolds, activity: state.activity,
    })
    const fatPct = Math.min(100, Math.max(0, r.bodyFatPct))
    out.innerHTML = `
      <div class="stats">
        <div><span>Body fat</span><strong>${fmt(r.bodyFatPct)}%</strong></div>
        <div><span>Fat mass</span><strong>${fmt(fromKg(r.fatKg))} ${massUnit()}</strong></div>
        <div><span>Lean mass</span><strong>${fmt(fromKg(r.leanKg))} ${massUnit()}</strong></div>
        <div><span>Resting (BMR)</span><strong>${fmt(r.bmr, 0)} kcal</strong></div>
        <div><span>Daily (TDEE)</span><strong>${fmt(r.tdee, 0)} kcal</strong></div>
      </div>
      <div class="bar" role="img" aria-label="${fmt(r.bodyFatPct)}% fat, ${fmt(100 - r.bodyFatPct)}% lean">
        <div class="fat" style="width:${fatPct}%"></div><div class="lean"></div>
      </div>
      <p class="fine">Skinfold sum ${fmt(r.sum)} mm, body density ${r.density.toFixed(4)} g/cm³.</p>`
  } catch (e) {
    out.innerHTML = `<p class="hint">${(e as Error).message}.</p>`
  }
}

app.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b) return
  const { unit, sex, protocol } = b.dataset
  if (unit && unit !== state.unit) {
    const w = Number(state.weight)
    if (state.weight !== '' && w > 0) {
      state.weight = String(Math.round((unit === 'metric' ? w / LB_PER_KG : w * LB_PER_KG) * 10) / 10)
    }
    state.unit = unit as Unit
  } else if (sex) state.sex = sex as Sex
  else if (protocol) state.protocol = protocol as Protocol
  else return
  save()
  render()
})

app.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement | HTMLSelectElement
  if (t.name.startsWith('site:')) state.skinfolds[t.name.slice(5) as Site] = t.value
  else if (t.name === 'age') state.age = t.value
  else if (t.name === 'weight') state.weight = t.value
  else if (t.name === 'activity') state.activity = t.value as ActivityId
  save()
  renderResults()
})

render()
