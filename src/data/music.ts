// Content for the music pages. Text is carried over verbatim from the
// WordPress site (export of 2026-11-01) unless noted.

export const artist = {
  name: 'Caleb David Barger',
  genre: 'Indie alt rock',
  location: 'Portland, Oregon',
  pitch:
    'Building a middle ground between 90s alternative grit and the cleaner, melodic layers of 2000s indie.',
  pitchMore:
    'It’s music that skips the loud anthems in favor of a subtle, steady energy that carries a mood through to the end.',
  email: 'calebdavidbarger@gmail.com',
  // Handle from the press kit ("@CalebDavidBarger, Instagram / TikTok"). Profile URLs inferred from the handle.
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/calebdavidbarger/' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@calebdavidbarger' },
  ],
  handle: '@CalebDavidBarger',
}

export const photos = {
  live: { src: '/images/caleb-live-790.webp', small: '/images/caleb-live-395.webp', width: 790, height: 960, alt: 'Caleb David Barger singing and playing guitar on stage, black and white' },
}

export const release = {
  title: 'thisillusioned',
  status: 'Now available on all platforms',
  cover: { src: '/images/thisillusioned-1400.webp', medium: '/images/thisillusioned-700.webp', small: '/images/thisillusioned-400.webp', alt: 'thisillusioned album cover: a watercolor bruise in plum and rose on cream paper' },
  spotifyEmbed: 'https://open.spotify.com/embed/album/26MMR5y2T2M8IpN9d6Zjw9',
  links: [
    { label: 'Spotify', url: 'https://open.spotify.com/album/26MMR5y2T2M8IpN9d6Zjw9' },
    { label: 'Apple Music', url: 'https://music.apple.com/us/album/thisillusioned/1871145748' },
    { label: 'Tidal', url: 'https://tidal.com/album/491760869/u' },
    { label: 'YouTube Music', url: 'https://music.youtube.com/playlist?list=OLAK5uy_lAbw4-q0r9OXsqbmg0TSs3EUNu3FxcwFw' },
    { label: 'Deezer', url: 'https://link.deezer.com/s/32CKIszyKLvqwLOd20wuf' },
  ],
}

export const bio = {
  // About page version.
  about: [
    'Caleb David Barger builds his sound at the intersection of analog warmth and digital precision. Working from his hybrid studio in Portland, Oregon, he focuses on creating indie-rock tracks that feel expansive but grounded, balancing textured guitar layers with pop-influenced melodies.',
    'While his roots are firmly planted in the raw energy of 90s alternative, Caleb’s production style pulls from the more atmospheric indie movements of the 2000s and 2010s. His approach is less about chasing radio-ready hooks and more about treating the studio as an instrument, layering pedal chains and synth tones to find a sound that feels familiar yet distinct. The result is a cinematic, honest backdrop designed to give listeners room to think while the music does the heavy lifting of sustaining the mood.',
  ],
  // Press kit version.
  press: [
    'Caleb David Barger builds his sound using analog warmth and digital precision. Working from his Portland studio, he focuses on creating indie-rock tracks that feel expansive but grounded, balancing textured guitar layers with pop-influenced melodies and beats.',
    'While his roots are firmly planted in the raw energy of 90s alternative, Caleb’s production style pulls from the more atmospheric indie movements of the 2000s and 2010s. His approach is defined by treating the studio as an instrument, layering specific tones to find a sound that feels familiar yet distinct. The result is a cinematic, honest backdrop designed to give listeners room to think while the music does the heavy lifting of sustaining the mood.',
  ],
}

export interface Quote {
  text: string
  lead?: string
  source: string
  url?: string
  theme?: 'Atmosphere & Vocals' | 'Groove & Energy'
  on: ('home' | 'press')[]
}

export const quotes: Quote[] = [
  { text: '...dense and intimate and passionate...', source: 'Phonograph Me', url: 'https://phonographme.blogspot.com/2026/02/caleb-david-barger-numb.html', on: ['home'] },
  { text: 'I so enjoyed the nostalgic feel', source: 'Feel Good Music', on: ['home'] },
  { text: '...harmonious and captivating...', source: 'Pompey Music', on: ['home'] },
  { text: '...‘sunshine’ has that vibe of pulling up the blinds and letting the light in, but with attitude.', source: 'Rock Culture Music', on: ['home'] },
  { text: '...catchy and groovy...', source: 'Sugarcoat', on: ['home'] },
  {
    lead: '... a voice you should remember.',
    text: 'Caleb David Barger sings like smoke hovering over slightly crooked guitars. It carries the weight of those Tuesdays when you’re running on fumes but still answering emails. That stretched syllable in the chorus? That’s politeness turning into performance art. You’ll hum it during your own survival days.',
    source: 'Le Salon Indie de Mitxoda, Episode 41',
    url: 'https://mitxoda.be/',
    on: ['home'],
  },
  { text: 'Caleb David Barger sings like smoke hovering over slightly crooked guitars... You’ll hum it during your own survival days.', source: 'Mitxoda (Belgium)', theme: 'Atmosphere & Vocals', on: ['press'] },
  { text: 'A song as dense as it is intimate... gripping us with its authentic way of sounding.', source: 'Chavininha (Brazil)', theme: 'Atmosphere & Vocals', on: ['press'] },
  { text: 'Nice sunlit mood.', source: 'OldBandtee', theme: 'Atmosphere & Vocals', on: ['press'] },
  { text: 'We really liked the tight groove... strong guitar riffing is ace.', source: 'Sounds of Sam / Bolo', theme: 'Groove & Energy', on: ['press'] },
  { text: 'Really loved how rhythmic... a dynamic alt rock treat.', source: 'Lili’s Music Hub / Last Day Deaf', theme: 'Groove & Energy', on: ['press'] },
]

export const craft = {
  Gear: ['Fender American Ultra Strat', 'Fender Super Reverb', 'Wampler Tumnus Deluxe', 'BOSS BD-2W Blues Driver'],
  Production: ['Logic Pro', 'Software Processing'],
  Influences: ['90s Alt (Grunge/Grit)', '2000s Indie (Melody)'],
}
