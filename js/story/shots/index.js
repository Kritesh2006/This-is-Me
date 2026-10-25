/* The film, in order. */
import { nepal, leaving } from './nepal.js';
import { flight } from './flight.js';
import { usa, ohioCali } from './street.js';
import { build } from './build.js';
import { ending } from './ending.js';

export const SHOTS = [
  { title: 'Kathmandu', run: nepal },          // tap lanterns to release memories
  { title: 'Leaving home', run: leaving },     // hold to leave; the city lets go
  { title: 'The flight', run: flight },        // steer through rings, night to dawn
  { title: 'United States', run: usa },        // walk the rain toward the light → WELCOME TO THE USA
  { title: 'Ohio → California', run: ohioCali }, // snow, route unavailable, the world recolours
  { title: 'North Carolina', run: build },     // build the projects, light the city
  { title: 'Today', run: ending, noSkip: true },
];
