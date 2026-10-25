/* chapters.js — the order of the story. Each chapter uses a different mechanic. */
import { nepal, leaving } from './scenes/home.js';
import { flight } from './scenes/flight.js';
import { usa } from './scenes/usa.js';
import { garage } from './scenes/garage.js';
import { ohio, reroute, arrive, finalDrive, ending } from './scenes/roads.js';
import { build } from './scenes/build.js';

export const CHAPTERS = [
  { title: 'Nepal', run: nepal },              // explore a room, tap objects
  { title: 'Leaving home', run: leaving },     // pack, then press and hold
  { title: 'The flight', run: flight },        // drag the plane across the map
  { title: 'United States', run: usa },        // hold to walk, signs stop you
  { title: 'The car', run: garage },           // customize
  { title: 'Ohio', run: ohio },                // drive through snow
  { title: 'Rerouting', run: reroute },        // route fails, world transforms into California
  { title: 'North Carolina', run: arrive },   // the dark stretch, then arrival
  { title: 'Building', run: build },           // build projects, unlock abilities
  { title: 'The road', run: finalDrive },      // drive with what you built
  { title: 'Today', run: ending, noSkip: true },
];
