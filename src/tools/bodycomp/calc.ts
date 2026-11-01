// Body composition math. Pure functions, metric internally (kg, mm, years).
//
// Body density: Jackson & Pollock skinfold equations.
// Body fat: Siri, %BF = 495 / density - 450.
// Resting energy: Katch-McArdle, BMR = 370 + 21.6 * lean mass (kg).

export type Sex = 'male' | 'female'
export type Protocol = 'jp3' | 'jp7'
export type Site =
  | 'chest' | 'abdominal' | 'thigh' | 'triceps'
  | 'subscapular' | 'suprailiac' | 'midaxillary'

export const SITE_LABELS: Record<Site, string> = {
  chest: 'Chest',
  abdominal: 'Abdominal',
  thigh: 'Thigh',
  triceps: 'Triceps',
  subscapular: 'Subscapular',
  suprailiac: 'Suprailiac',
  midaxillary: 'Midaxillary',
}

const SEVEN: Site[] = ['chest', 'midaxillary', 'triceps', 'subscapular', 'abdominal', 'suprailiac', 'thigh']

export const SITES: Record<Sex, Record<Protocol, Site[]>> = {
  male: { jp3: ['chest', 'abdominal', 'thigh'], jp7: SEVEN },
  // The 2016 app summed chest + abdominal + thigh here; the published protocol is below.
  female: { jp3: ['triceps', 'suprailiac', 'thigh'], jp7: SEVEN },
}

// [a, b, c, d] in density = a - b*S + c*S^2 - d*age
const COEFFS: Record<Sex, Record<Protocol, [number, number, number, number]>> = {
  male: {
    jp3: [1.10938, 0.0008267, 0.0000016, 0.0002574],
    jp7: [1.112, 0.00043499, 0.00000055, 0.00028826],
  },
  female: {
    jp3: [1.0994921, 0.0009929, 0.0000023, 0.0001392],
    jp7: [1.097, 0.00046971, 0.00000056, 0.00012828],
  },
}

export const ACTIVITY = [
  { id: 'sedentary', label: 'Sedentary', factor: 1.2 },
  { id: 'light', label: 'Light: 1-3 days/wk', factor: 1.375 },
  { id: 'moderate', label: 'Moderate: 3-5 days/wk', factor: 1.55 },
  { id: 'very', label: 'Very active: 6-7 days/wk', factor: 1.725 },
  { id: 'extra', label: 'Extra: hard daily training', factor: 1.9 },
] as const
export type ActivityId = (typeof ACTIVITY)[number]['id']

export interface Inputs {
  sex: Sex
  protocol: Protocol
  age: number
  weightKg: number
  skinfolds: Partial<Record<Site, number>>
  activity: ActivityId
}

export interface Result {
  sum: number
  density: number
  bodyFatPct: number
  fatKg: number
  leanKg: number
  bmr: number
  tdee: number
}

export const LB_PER_KG = 2.20462262185

export function sumSkinfolds(sex: Sex, protocol: Protocol, skinfolds: Partial<Record<Site, number>>): number {
  return SITES[sex][protocol].reduce((total, site) => {
    const v = skinfolds[site]
    if (v === undefined || !Number.isFinite(v) || v <= 0) throw new Error(`Missing ${SITE_LABELS[site]} measurement`)
    return total + v
  }, 0)
}

export function bodyDensity(sex: Sex, protocol: Protocol, sum: number, age: number): number {
  const [a, b, c, d] = COEFFS[sex][protocol]
  return a - b * sum + c * sum * sum - d * age
}

export const siri = (density: number): number => 495 / density - 450

export const katchMcArdle = (leanKg: number): number => 370 + 21.6 * leanKg

export function compute(i: Inputs): Result {
  if (!(i.age > 0)) throw new Error('Enter age')
  if (!(i.weightKg > 0)) throw new Error('Enter weight')
  const sum = sumSkinfolds(i.sex, i.protocol, i.skinfolds)
  const density = bodyDensity(i.sex, i.protocol, sum, i.age)
  const bodyFatPct = siri(density)
  if (!(bodyFatPct > 0 && bodyFatPct < 70)) throw new Error('Result out of range; check measurements')
  const fatKg = (i.weightKg * bodyFatPct) / 100
  const leanKg = i.weightKg - fatKg
  const bmr = katchMcArdle(leanKg)
  const factor = ACTIVITY.find((a) => a.id === i.activity)!.factor
  return { sum, density, bodyFatPct, fatKg, leanKg, bmr, tdee: bmr * factor }
}
