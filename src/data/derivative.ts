// Derivative content. Quoted lines are carried over verbatim from
// derivativetheband.com (EasyWP backup of 2026-11-01) or Bandcamp.

export const band = {
  name: 'Derivative',
  tagline: '…like, the band.',
  location: 'Portland, Oregon',
  // Bandcamp bio.
  bio: 'Portland-based Alt-Garage Rock band that slides into punk and other genres.',
  // Events page.
  status: 'We’re taking a break to focus on recording right now…but we’ll be back doing live shows before you know it.',
  // Contact page.
  contactPitch: 'wanna book us for gigs? tell us you think we’re rad? ask us esoteric questions about the nature of existence?',
  email: 'derivativetheband@gmail.com',
  links: [
    { label: 'Bandcamp', url: 'https://derivativetheband.bandcamp.com/' },
    { label: 'Spotify', url: 'https://open.spotify.com/artist/1tfRbAj5CkZsepfkY6L8fb' },
    { label: 'YouTube', url: 'https://www.youtube.com/@derivativetheband' },
    { label: 'Instagram', url: 'https://www.instagram.com/derivativetheband/' },
    { label: 'Facebook', url: 'https://www.facebook.com/derivativetheband' },
  ],
  instagram: 'https://www.instagram.com/derivativetheband/',
  spotifyEmbed: 'https://open.spotify.com/embed/artist/1tfRbAj5CkZsepfkY6L8fb',
}

// Stated by Caleb, 2026-11-01.
export const members = [
  { name: 'Caleb David Barger', role: 'Guitar and vocals' },
  { name: 'Ryan Arana', role: 'Guitar' },
  { name: 'Shaun Winters', role: 'Bass' },
  { name: 'Brandon Allen', role: 'Drums' },
]

export const releases = [
  {
    title: 'The Villains',
    year: 2026,
    kind: '2-track release',
    tracks: ['The Villains', 'I Thought You Should Know'],
    url: 'https://derivativetheband.bandcamp.com/album/the-villains',
    cover: '/derivative/the-villains-600.webp',
  },
  {
    title: 'Nothing Left',
    year: 2022,
    kind: 'Single',
    url: 'https://derivativetheband.bandcamp.com/track/nothing-left',
  },
]

// No per-photo captions or descriptions (Caleb, 2026-11-01); every photo shares one neutral alt text.
// Photos by Tim Ward (EXIF Artist / Copyright: timwardphotography.com), shoot dated 2025-03-29 by filename.
export const photoCredit = { name: 'Tim Ward', url: 'https://timwardphotography.com/' }
const P = (id: string, orient: 'h' | 'v') => ({ id, orient, alt: 'Derivative performing live', src: `/derivative/photos/${id}-1600.webp`, small: `/derivative/photos/${id}-800.webp` })
export const photos = [
  P('0028', 'h'),
  P('0049', 'v'),
  P('0039', 'h'),
  P('0055', 'v'),
  P('0036', 'v'),
  P('0072', 'h'),
  P('0077', 'v'),
  P('0018', 'v'),
  P('0062', 'v'),
  P('0102', 'h'),
]

// From the show flyers in the WordPress uploads.
export const shows = [
  { date: '2025-04-04', venue: 'The Firkin Tavern', address: '1937 SE 11th Ave, Portland', with: ['5 To A Hill', 'Sassy Blackbirds'], flyer: '/derivative/flyers/2025-04-04-firkin.webp' },
  { date: '2025-03-29', venue: 'Shanghai Tunnel', address: '211 SW Ankeny, Portland', with: ['Dirty Bodies', 'Perfectly Normal'], flyer: '/derivative/flyers/2025-03-29-shanghai-tunnel.webp' },
  { date: '2025-03-01', venue: 'Misfits Bar + Lounge', address: '2530 NE 82nd, Portland', with: ['Last Romantix', 'bad', 'Break Window'], presenter: 'sad times productions', flyer: '/derivative/flyers/2025-03-01-misfits.webp' },
]
