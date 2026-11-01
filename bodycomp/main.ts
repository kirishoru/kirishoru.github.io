import { ACTIVITY, LB_PER_KG, SITES, SITE_LABELS, compute, type ActivityId, type Protocol, type Sex, type Site } from './calc.ts'


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
  return `<div class="join" role="radiogroup" aria-label="${name}">${options
    .map(([v, label]) => `<button type="button" role="radio" data-${name}="${v}" aria-checked="${v === value}" class="btn btn-sm join-item ${v === value ? 'btn-primary' : 'btn-ghost border-base-300'}">${label}</button>`)
    .join('')}</div>`
}

const row = (label: string, control: string) => `<div class="flex items-center justify-between gap-4"><span class="text-sm font-medium">${label}</span>${control}</div>`
const num = (name: string, value: string, unit: string, step = '1') =>
  `<label class="input input-sm w-36"><input name="${name}" type="number" inputmode="decimal" min="0" step="${step}" value="${value}" class="text-right"><span class="text-base-content/50 w-6">${unit}</span></label>`

function render() {
  const sites = SITES[state.sex][state.protocol]
  app.innerHTML = `
    <form autocomplete="off" class="space-y-6">
      <div class="flex justify-end">${segmented<Unit>('unit', state.unit, [['imperial', 'lb'], ['metric', 'kg']])}</div>
      <div class="grid gap-6 md:grid-cols-2">
        <section class="card bg-base-100 shadow-sm"><div class="card-body gap-4">
          <h2 class="card-title">You</h2>
          ${row('Sex', segmented<Sex>('sex', state.sex, [['male', 'Male'], ['female', 'Female']]))}
          ${row('Age', num('age', state.age, 'yr'))}
          ${row('Weight', num('weight', state.weight, massUnit(), '0.1'))}
          ${row('Activity', `<select name="activity" class="select select-sm w-52">${ACTIVITY.map((a) => `<option value="${a.id}" ${a.id === state.activity ? 'selected' : ''}>${a.label}</option>`).join('')}</select>`)}
        </div></section>
        <section class="card bg-base-100 shadow-sm"><div class="card-body gap-4">
          <h2 class="card-title">Skinfolds</h2>
          ${row('Method', segmented<Protocol>('protocol', state.protocol, [['jp3', '3-site'], ['jp7', '7-site']]))}
          ${sites.map((site) => row(SITE_LABELS[site], num(`site:${site}`, state.skinfolds[site] ?? '', 'mm', '0.5'))).join('')}
        </div></section>
      </div>
    </form>
    <section class="results mt-8" aria-live="polite"></section>
  `
  renderResults(true)
}

let lastOk = false
function renderResults(animate = false) {
  const out = app.querySelector<HTMLElement>('.results')!
  const skinfolds: Partial<Record<Site, number>> = {}
  for (const [k, v] of Object.entries(state.skinfolds)) if (v !== '' && v !== undefined) skinfolds[k as Site] = Number(v)
  try {
    const r = compute({
      sex: state.sex, protocol: state.protocol, age: Number(state.age), weightKg: toKg(Number(state.weight)),
      skinfolds, activity: state.activity,
    })
    const fatPct = Math.min(100, Math.max(0, r.bodyFatPct))
    const stat = (title: string, value: string, desc = '') =>
      `<div class="stat"><div class="stat-title">${title}</div><div class="stat-value text-2xl sm:text-3xl tabular-nums">${value}</div>${desc ? `<div class="stat-desc">${desc}</div>` : ''}</div>`
    const fresh = animate || !lastOk
    out.innerHTML = `
      <div class="card bg-base-100 shadow-sm ${fresh ? 'rise' : ''}"><div class="card-body gap-6">
        <div class="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div>
            <h2 class="card-title mb-2">Composition</h2>
            <div class="stats stats-vertical sm:stats-horizontal w-full bg-base-200">
              ${stat('Body fat', `${fmt(r.bodyFatPct)}%`, 'of body weight')}
              ${stat('Fat mass', `${fmt(fromKg(r.fatKg))}`, massUnit())}
              ${stat('Lean mass', `${fmt(fromKg(r.leanKg))}`, massUnit())}
            </div>
          </div>
          <div>
            <h2 class="card-title mb-2">Energy</h2>
            <div class="stats stats-vertical sm:stats-horizontal w-full bg-base-200">
              ${stat('Resting', fmt(r.bmr, 0), 'kcal/day (BMR)')}
              ${stat('Daily', fmt(r.tdee, 0), 'kcal/day (TDEE)')}
            </div>
          </div>
        </div>
        <div>
          <div class="flex h-3 rounded-full overflow-hidden bg-base-300" role="img" aria-label="${fmt(r.bodyFatPct)}% fat, ${fmt(100 - r.bodyFatPct)}% lean">
            <div class="bg-secondary transition-all duration-500" style="width:${fatPct}%"></div>
            <div class="bg-primary flex-1 transition-all duration-500"></div>
          </div>
          <div class="flex justify-between text-xs mt-2 text-base-content/60">
            <span><span class="inline-block size-2 rounded-full bg-secondary mr-1"></span>Fat ${fmt(r.bodyFatPct)}%</span>
            <span>Lean ${fmt(100 - r.bodyFatPct)}%<span class="inline-block size-2 rounded-full bg-primary ml-1"></span></span>
          </div>
          <p class="text-xs text-base-content/50 mt-3">Skinfold sum ${fmt(r.sum)} mm, body density ${r.density.toFixed(4)} g/cm³.</p>
        </div>
      </div></div>`
    lastOk = true
  } catch (e) {
    out.innerHTML = `<div role="alert" class="alert alert-soft">${(e as Error).message}.</div>`
    lastOk = false
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
