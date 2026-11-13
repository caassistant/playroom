import bubbles from './bubbles.js';
import sorter from './sorter.js';
import memory from './memory.js';
import colouring from './colouring.js';
import words from './wordbuilder.js';
import rocket from './rocket.js';
import blockdrop from './blockdrop.js';
import maze from './maze.js';
import rumble from './rumble.js';
import racer from './racer.js';
import bricks from './bricks.js';

import snake from './snake.js';
import hop from './hop.js';
import whack from './whack.js';
import space from './space.js';
import jumper from './jumper.js';
import paddle from './paddle.js';
import tracing from './tracing.js';
import shop from './shop.js';
import clock from './clock.js';
import robot from './robot.js';
import music from './music.js';
import jigsaw from './jigsaw.js';
import story from './story.js';
import homes from './homes.js';

// modes: which child level sees the game ('little' = 3–4, 'big' = 5–7)
export const GAMES = [
  { id: 'bubbles',   title: 'Bubble Pop',    icon: '🫧', mascot: 'zuzu',   color: '#2EC4B6', bg: 'linear-gradient(#BDF1FF,#E6FAFF)', modes: ['little', 'big'], maxLevel: 20, start: bubbles },
  { id: 'sorter',    title: 'Shape Sorter',  icon: '🔺', mascot: 'tumble', color: '#3BB273', bg: '#EFFBEF', modes: ['little', 'big'], maxLevel: 20, start: sorter },
  { id: 'memory',    title: 'Memory Match',  icon: '🧠', mascot: 'mango',  color: '#FF9F1C', bg: '#FFF4E0', modes: ['little', 'big'], maxLevel: 20, start: memory },
  { id: 'colouring', title: 'Colouring',     icon: '🖍️', mascot: 'mango',  color: '#FF7EB6', bg: '#FFF0F6', modes: ['little', 'big'], maxLevel: 16, start: colouring },
  { id: 'words',     title: 'Word Builder',  icon: '🔤', mascot: 'bo',     color: '#3A86FF', bg: '#EEF4FF', modes: ['big'],           maxLevel: 30, start: words },
  { id: 'rocket',    title: 'Maths Rocket',  icon: '🚀', mascot: 'bo',     color: '#8E6CEF', bg: 'linear-gradient(#1E2A5A,#4B3F8F)', modes: ['little', 'big'], maxLevel: 30, dark: true, start: rocket },
  { id: 'tracing', title: 'Letter Tracing', icon: '✏️', mascot: 'bo', color: '#FF9F1C', bg: '#FFF4E0', modes: ['little', 'big'], maxLevel: { little: 25, big: 30 }, start: tracing },
  { id: 'shop', title: 'Rand Shop', icon: '💰', mascot: 'mango', color: '#3BB273', bg: '#EFFBEF', modes: ['big'], maxLevel: 20, start: shop },
  { id: 'clock', title: 'What\'s the Time?', icon: '🕐', mascot: 'tumble', color: '#2EC4B6', bg: '#E6FAF7', modes: ['big'], maxLevel: 20, start: clock },
  { id: 'robot', title: 'Robot Path', icon: '🤖', mascot: 'bo', color: '#3A86FF', bg: '#EEF4FF', modes: ['little', 'big'], maxLevel: 30, start: robot },
  { id: 'music', title: 'Music Maker', icon: '🎵', mascot: 'zuzu', color: '#8E6CEF', bg: '#F3EFFF', modes: ['little', 'big'], maxLevel: 20, start: music },
  { id: 'jigsaw', title: 'Jigsaws', icon: '🧩', mascot: 'tumble', color: '#FF5A5F', bg: '#FFF1F0', modes: ['little', 'big'], maxLevel: 24, start: jigsaw },
  { id: 'story', title: 'Story Time', icon: '📖', mascot: 'mango', color: '#FF7EB6', bg: '#FFF0F6', modes: ['little', 'big'], maxLevel: 8, start: story },
  { id: 'homes', title: 'Animal Homes', icon: '🌍', mascot: 'tumble', color: '#3BB273', bg: '#EFFBEF', modes: ['little', 'big'], maxLevel: 20, start: homes },
  // ---- Arcade (our own games in classic arcade styles) ----
  { id: 'racer',     title: 'Turbo Track',   icon: '🏎️', mascot: 'bo',     arcade: true, bg: '#1E1838', dark: true, modes: ['little', 'big'], maxLevel: 20, start: racer },
  { id: 'maze',      title: 'Maze Muncher',  icon: '🐟', mascot: 'mango',  arcade: true, bg: '#1E1838', dark: true, modes: ['little', 'big'], maxLevel: 20, start: maze },
  { id: 'bricks',    title: 'Brick Bounce',  icon: '🧱', mascot: 'zuzu',   arcade: true, bg: '#1E1838', dark: true, modes: ['little', 'big'], maxLevel: 30, start: bricks },
  { id: 'blockdrop', title: 'Block Drop',    icon: '🟪', mascot: 'tumble', arcade: true, bg: '#1E1838', dark: true, modes: ['big'],           maxLevel: 20, start: blockdrop },
  { id: 'rumble',    title: 'Robo Rumble',   icon: '🥊', mascot: 'bo',     arcade: true, bg: '#1E1838', dark: true, modes: ['big'],           maxLevel: 20, start: rumble },
  { id: 'snake', title: 'Snake Trail', icon: '🐛', mascot: 'tumble', arcade: true, dark: true, bg: '#1E1838', modes: ['little', 'big'], maxLevel: 20, start: snake },
  { id: 'hop', title: 'Hop Across', icon: '🐸', mascot: 'tumble', arcade: true, dark: true, bg: '#1E1838', modes: ['little', 'big'], maxLevel: 20, start: hop },
  { id: 'whack', title: 'Pop-Up Pals', icon: '🔨', mascot: 'mango', arcade: true, dark: true, bg: '#1E1838', modes: ['little', 'big'], maxLevel: 20, start: whack },
  { id: 'space', title: 'Space Defenders', icon: '👾', mascot: 'bo', arcade: true, dark: true, bg: '#1E1838', modes: ['big'], maxLevel: 20, start: space },
  { id: 'jumper', title: 'Jump Island', icon: '🏝️', mascot: 'mango', arcade: true, dark: true, bg: '#1E1838', modes: ['little', 'big'], maxLevel: 20, start: jumper },
  { id: 'paddle', title: 'Paddle Pals', icon: '🏓', mascot: 'zuzu', arcade: true, dark: true, bg: '#1E1838', modes: ['little', 'big'], maxLevel: 15, start: paddle },
];
