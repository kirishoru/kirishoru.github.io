import { test } from 'node:test'
import assert from 'node:assert/strict'
import { run, sortEstimate, type Answer } from './rank.ts'

// Drive the engine with an oracle until done.
function solve(n: number, oracle: (x: number, y: number) => Answer, check = true) {
  const answers: Answer[] = []
  for (let guard = 0; guard < 10_000; guard++) {
    const r = run(n, answers, { check })
    if (!r.next) return { ...r, answers }
    answers.push(oracle(...r.next))
  }
  throw new Error('did not terminate')
}

// Deterministic PRNG so failures are reproducible.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}
function shuffle(n: number, rand: () => number) {
  const a = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

test('consistent preferences give the exact order within the sort bound', () => {
  const rand = rng(42)
  for (let n = 1; n <= 25; n++) {
    for (let trial = 0; trial < 20; trial++) {
      const truth = shuffle(n, rand) // truth[rank] = item
      const rank = new Map(truth.map((item, r) => [item, r]))
      const r = solve(n, (x, y) => (rank.get(x)! < rank.get(y)! ? 'a' : 'b'))
      assert.deepEqual(r.tiers.map((t) => t.items[0]), truth)
      assert.ok(r.tiers.every((t) => t.items.length === 1))
      assert.equal(r.contradictions, 0)
      // Checks only ask pairs insertion skipped; total stays near the sort bound.
      assert.ok(r.asked <= sortEstimate(n) + Math.ceil(n / 2), `n=${n} asked ${r.asked}`)
    }
  }
})

test('without checks, asks at most the insertion worst case', () => {
  const rand = rng(7)
  for (const n of [10, 20]) {
    const rank = new Map(shuffle(n, rand).map((item, r) => [item, r]))
    const r = solve(n, (x, y) => (rank.get(x)! < rank.get(y)! ? 'a' : 'b'), false)
    assert.ok(r.asked <= sortEstimate(n))
  }
  assert.equal(sortEstimate(10), 25)
  assert.equal(sortEstimate(20), 69)
})

test('about-equal answers form a tie tier', () => {
  // Items 1 and 2 are equal; 0 best, 3 worst.
  const level = [0, 1, 1, 2]
  const r = solve(4, (x, y) => (level[x] === level[y] ? 'e' : level[x] < level[y] ? 'a' : 'b'))
  assert.deepEqual(r.tiers.map((t) => t.items.sort()), [[0], [1, 2], [3]])
  assert.equal(r.tiers[1].kind, 'equal')
})

test('a preference cycle is shown as a toss-up', () => {
  // Rock (0) beats scissors (2), scissors beats paper (1), paper beats rock.
  const beats = (x: number, y: number) => (x === 0 && y === 2) || (x === 2 && y === 1) || (x === 1 && y === 0)
  const r = solve(3, (x, y) => (beats(x, y) ? 'a' : 'b'))
  assert.equal(r.contradictions, 1)
  assert.equal(r.tiers.length, 1)
  assert.equal(r.tiers[0].kind, 'cycle')
  assert.deepEqual([...r.tiers[0].items].sort(), [0, 1, 2])
})

test('a wrong answer that breaks transitivity is caught and repaired', () => {
  // True order 0 > 1 > 2 > 3 > 4. The first time 2 and 4 are compared, the answer is wrong.
  // Insertion puts 4 above 2; the check 4 vs 3 contradicts; the window is re-asked.
  let slipped = false
  const r = solve(5, (x, y) => {
    const truth: Answer = x < y ? 'a' : 'b'
    if (!slipped && ((x === 4 && y === 2) || (x === 2 && y === 4))) { slipped = true; return truth === 'a' ? 'b' : 'a' }
    return truth
  })
  assert.ok(slipped)
  assert.equal(r.contradictions, 1)
  assert.deepEqual(r.tiers.map((t) => t.items[0]), [0, 1, 2, 3, 4])
})

test('a wrong answer between neighbours is consistent and cannot be detected', () => {
  // Known limit: if the slip only swaps two adjacent items, every answer agrees with the wrong order.
  let first = true
  const r = solve(5, (x, y) => {
    const truth: Answer = x < y ? 'a' : 'b'
    if (first) { first = false; return truth === 'a' ? 'b' : 'a' }
    return truth
  })
  assert.equal(r.contradictions, 0)
  assert.deepEqual(r.tiers.map((t) => t.items[0]), [1, 0, 2, 3, 4])
})

test('replay is deterministic: undo is just dropping the last answer', () => {
  const rank = [3, 0, 4, 1, 2]
  const r = solve(5, (x, y) => (rank[x] < rank[y] ? 'a' : 'b'))
  const again = run(5, r.answers.slice(0, -1), { check: true })
  assert.ok(again.next)
  assert.deepEqual(run(5, r.answers, { check: true }).tiers, r.tiers)
})
