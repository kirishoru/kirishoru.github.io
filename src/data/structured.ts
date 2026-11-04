// schema.org structured data (JSON-LD) describing Caleb and his projects,
// so search engines can tie kirishoru.com to his profiles elsewhere.
import { artist, release } from './music.ts'
import { band, members } from './derivative.ts'
import { project as btn, releases as btnReleases } from './betterthenever.ts'

const SITE = 'https://kirishoru.com'
const person = `${SITE}/#person`

export const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': person,
      name: artist.name,
      url: `${SITE}/`,
      image: `${SITE}/images/caleb-live-790.jpg`,
      description: `${artist.pitch} ${artist.pitchMore}`,
      jobTitle: 'Musician',
      homeLocation: { '@type': 'Place', name: artist.location },
      email: `mailto:${artist.email}`,
      sameAs: artist.profiles,
      memberOf: [{ '@id': `${SITE}/derivative/#band` }, { '@id': `${SITE}/better-the-never/#project` }],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: artist.name,
      about: { '@id': person },
      publisher: { '@id': person },
    },
    {
      '@type': 'MusicAlbum',
      name: release.title,
      byArtist: { '@id': person },
      image: `${SITE}/images/thisillusioned-1200.jpg`,
      sameAs: release.links.map((l) => l.url),
    },
    {
      '@type': 'MusicGroup',
      '@id': `${SITE}/derivative/#band`,
      name: band.name,
      url: `${SITE}/derivative/`,
      genre: ['Alternative rock', 'Garage rock', 'Punk'],
      foundingLocation: { '@type': 'Place', name: band.location },
      member: members.map((m) => (m.name === artist.name ? { '@id': person } : { '@type': 'Person', name: m.name })),
      sameAs: [...band.links.map((l) => l.url), 'https://derivativetheband.com/'],
    },
    {
      '@type': 'MusicGroup',
      '@id': `${SITE}/better-the-never/#project`,
      name: btn.name,
      url: `${SITE}/better-the-never/`,
      member: { '@id': person },
      sameAs: [...btn.links.map((l) => l.url), 'https://betterthenever.net/'],
      album: btnReleases.map((r) => ({ '@type': 'MusicAlbum', name: r.title, datePublished: r.date, sameAs: r.links[0].url })),
    },
  ],
}
