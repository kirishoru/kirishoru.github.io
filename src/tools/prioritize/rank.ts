// Ranking engine: binary insertion, then an optional check pass that
// round-robins any local window where answers contradict the order.
//
// The engine is a generator that yields one comparison at a time. `run`
// replays a list of recorded answers through it, which makes the whole
// session a pure function of (items, answers, options). Undo is "drop the
// last answer and replay"; a shareable link is just items + answers.

/** a: the first item of the pair ranks higher. b: the second does. e: about equal. */
export type Answer = 'a' | 'b' | 'e'
export type TierKind = 'single' | 'equal' | 'cycle'
export interface Tier { items: number[]; kind: TierKind }
export type Phase = 'sort' | 'check' | 'resolve'

export interface Options { check: boolean }

export interface RunResult {
  /** Next pair to ask, or null when finished. Indices into the item list. */
  next: [number, number] | null
  phase: Phase
  /** Current ranking, best first. Final when `next` is null. */
  tiers: Tier[]
  asked: number
  /** Number of items placed so far during the sort phase. */
  inserted: number
  contradictions: number
  /** Rough estimate of questions left. */
  remaining: number
}

interface Ask { pair: [number, number] }
interface State { tiers: Tier[]; phase: Phase; inserted: number; contradictions: number }

const sign = (a: Answer) => (a === 'a' ? 1 : a === 'b' ? -1 : 0)

function* engine(n: number, opts: Options, s: State): Generator<Ask, void, number> {
  // known.get("x,y") with x < y: +1 x higher, -1 y higher, 0 equal
  const known = new Map<string, number>()
  // fresh: ask even if answered before (used when resolving a contradiction,
  // so a careless earlier answer can be corrected rather than baked in).
  function* cmp(x: number, y: number, fresh = false): Generator<Ask, number, number> {
    const [lo, hi] = x < y ? [x, y] : [y, x]
    const k = `${lo},${hi}`
    let v = fresh ? undefined : known.get(k)
    if (v === undefined) {
      const r = yield { pair: [x, y] }
      v = x < y ? r : -r
      known.set(k, v)
    }
    return x < y ? v : -v
  }

  // 1. Binary insertion over tiers. Tier 0 is the top.
  s.phase = 'sort'
  if (n > 0) { s.tiers.push({ items: [0], kind: 'single' }); s.inserted = 1 }
  for (let x = 1; x < n; x++) {
    let lo = 0
    let hi = s.tiers.length
    let joined = false
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      const r = yield* cmp(x, s.tiers[mid].items[0])
      if (r > 0) hi = mid
      else if (r < 0) lo = mid + 1
      else { s.tiers[mid].items.push(x); s.tiers[mid].kind = 'equal'; joined = true; break }
    }
    if (!joined) s.tiers.splice(lo, 0, { items: [x], kind: 'single' })
    s.inserted = x + 1
  }
  if (!opts.check) return

  // 2. Check pass: tier k should beat tier k+2. Pairs already answered cost nothing.
  for (let k = 0; k + 2 < s.tiers.length; k++) {
    s.phase = 'check'
    const r = yield* cmp(s.tiers[k].items[0], s.tiers[k + 2].items[0])
    if (r > 0) continue

    // 3. Contradiction: round-robin the window of tiers k..k+2, re-asking
    //    every pair. A slip gets corrected; a genuine cycle shows up again.
    s.contradictions++
    s.phase = 'resolve'
    const win = s.tiers.slice(k, k + 3).flatMap((t) => t.items)
    const score = new Map<number, number>(win.map((i) => [i, 0]))
    for (let i = 0; i < win.length; i++) {
      for (let j = i + 1; j < win.length; j++) {
        const v = yield* cmp(win[i], win[j], true)
        if (v > 0) score.set(win[i], score.get(win[i])! + 1)
        else if (v < 0) score.set(win[j], score.get(win[j])! + 1)
        else { score.set(win[i], score.get(win[i])! + 0.5); score.set(win[j], score.get(win[j])! + 0.5) }
      }
    }
    const groups = new Map<number, number[]>()
    for (const i of win) {
      const sc = score.get(i)!
      groups.set(sc, [...(groups.get(sc) ?? []), i])
    }
    const next: Tier[] = [...groups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => {
        if (items.length === 1) return { items, kind: 'single' as const }
        let allEqual = true
        for (let i = 0; i < items.length; i++)
          for (let j = i + 1; j < items.length; j++) {
            const [lo, hi] = items[i] < items[j] ? [items[i], items[j]] : [items[j], items[i]]
            if (known.get(`${lo},${hi}`) !== 0) allEqual = false
          }
        return { items, kind: allEqual ? ('equal' as const) : ('cycle' as const) }
      })
    s.tiers.splice(k, 3, ...next)
  }
}

export function run(n: number, answers: readonly Answer[], opts: Options): RunResult {
  const s: State = { tiers: [], phase: 'sort', inserted: 0, contradictions: 0 }
  const gen = engine(n, opts, s)
  let step = gen.next()
  let i = 0
  while (!step.done) {
    if (i >= answers.length) {
      return { next: step.value.pair, phase: s.phase, tiers: s.tiers, asked: i, inserted: s.inserted, contradictions: s.contradictions, remaining: estimate(n, s, opts) }
    }
    step = gen.next(sign(answers[i++]))
  }
  return { next: null, phase: s.phase, tiers: s.tiers, asked: i, inserted: s.inserted, contradictions: s.contradictions, remaining: 0 }
}

/** Worst-case insertion questions for the items not yet placed, plus about one check per two tiers. */
function estimate(n: number, s: State, opts: Options): number {
  let left = 0
  if (s.phase === 'sort') {
    for (let t = s.tiers.length; t < n; t++) left += Math.ceil(Math.log2(t + 1))
    left = Math.max(1, left - Math.floor(left / 4))
  }
  if (opts.check) left += Math.ceil(Math.max(0, (s.phase === 'sort' ? n : s.tiers.length) - 2) / 2)
  return Math.max(1, left)
}

/** Questions needed before any checks, for the start screen. */
export function sortEstimate(n: number): number {
  let q = 0
  for (let t = 1; t < n; t++) q += Math.ceil(Math.log2(t + 1))
  return q
}
