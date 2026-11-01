import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compute, sumSkinfolds, bodyDensity, siri, katchMcArdle, LB_PER_KG } from './calc.ts'

const near = (a: number, b: number, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`)

// Regression: reproduce the 2016 app's own test comments (age 20, every site 10 mm).
test('legacy uniform cases reproduce 2016 results', () => {
  near(siri(bodyDensity('male', 'jp7', 70, 20)), 8.98)
  near(siri(bodyDensity('male', 'jp3', 30, 20)), 7.96)
  near(siri(bodyDensity('female', 'jp7', 70, 20)), 15.09)
  near(siri(bodyDensity('female', 'jp3', 30, 20)), 13.05)
})

// Non-uniform measurements so a wrong site list changes the sum.
const folds = { chest: 5, abdominal: 30, thigh: 25, triceps: 20, subscapular: 12, suprailiac: 15, midaxillary: 9 }

test('women 3-site uses triceps, suprailiac, thigh', () => {
  assert.equal(sumSkinfolds('female', 'jp3', folds), 60)
})

test('men 3-site uses chest, abdominal, thigh', () => {
  assert.equal(sumSkinfolds('male', 'jp3', folds), 60 - 20 - 15 + 5 + 30) // 5 + 30 + 25
})

test('7-site sums all seven', () => {
  assert.equal(sumSkinfolds('female', 'jp7', folds), 116)
  assert.equal(sumSkinfolds('male', 'jp7', folds), 116)
})

test('missing site throws', () => {
  assert.throws(() => sumSkinfolds('female', 'jp3', { triceps: 10, thigh: 10 }), /Suprailiac/)
})

test('Katch-McArdle', () => {
  near(katchMcArdle(60), 1666)
})

test('full compute, women 3-site', () => {
  // S = 60, age 30: D = 1.0994921 - 0.0009929*60 + 0.0000023*3600 - 0.0001392*30
  const D = 1.0994921 - 0.059574 + 0.00828 - 0.004176
  const bf = 495 / D - 450
  const r = compute({ sex: 'female', protocol: 'jp3', age: 30, weightKg: 65, skinfolds: folds, activity: 'moderate' })
  near(r.density, D, 1e-9)
  near(r.bodyFatPct, bf, 1e-9)
  near(r.fatKg + r.leanKg, 65, 1e-9)
  near(r.bmr, 370 + 21.6 * (65 * (1 - bf / 100)), 1e-9)
  near(r.tdee, r.bmr * 1.55, 1e-9)
})

test('unit constant', () => {
  near(100 / LB_PER_KG, 45.359, 0.001)
})
