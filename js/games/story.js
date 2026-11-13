// Story Time: 8 short interactive picture stories starring our cast. Level N = story N.
//
// How a page works (same for every page, so it's always obvious what to do):
//  1. The picture shows what the words say, and the words are always on screen in a storybook panel.
//  2. The page is read aloud; the sentence being read is highlighted. (If the tablet can't speak,
//     the pacing still works because the app waits long enough to read each sentence.)
//  3. When the reading ends, ONE thing to do appears: a big pulsing ▶ to turn the page,
//     or two big picture buttons to choose what happens next. Sparkly ✨ things in the picture
//     can be tapped for a wiggle and a little line. 🔊 reads the page again.
//  4. At the end there is one picture question, then the celebration.
import { character, CAST } from '../characters.js';

const BG = {
  grass: 'linear-gradient(#9FDCFF 0 58%, #7ED17E 58%)',
  lake: 'linear-gradient(#9FDCFF 0 45%, #7ED17E 45% 60%, #4FB3E8 60%)',
  hill: 'radial-gradient(ellipse 70% 55% at 50% 100%, #6CC46C 0 99%, transparent 100%), linear-gradient(#BDE7FF, #E8F7FF)',
  beach: 'linear-gradient(#8FD3FF 0 40%, #2E9FE0 40% 62%, #F7D794 62%)',
  sea: 'linear-gradient(#5ED0F0, #1E6FB8)',
  seabed: 'linear-gradient(#5ED0F0 0, #1E6FB8 80%, #E8C98A 80%)',
  home: 'linear-gradient(#FFE7C2 0 68%, #C98B5A 68%)',
  park: 'linear-gradient(#BDE7FF 0 62%, #8ED47F 62%)',
  sunset: 'linear-gradient(#FFB8D9 0, #FFE3A8 60%, #8ED47F 60%)',
  garden: 'linear-gradient(#BDE7FF 0 52%, #8ED47F 52%)',
  windy: 'linear-gradient(#A9D6F5 0 55%, #86C97A 55%)',
  party: 'linear-gradient(#FFE0F0 0 70%, #E8B07A 70%)',
  rain: 'linear-gradient(#7D8BA6 0 62%, #5F7A62 62%)',
  rainbow: 'linear-gradient(#CDEBFF 0 60%, #8ED47F 60%)',
  track: 'linear-gradient(#BDE7FF 0 46%, #8ED47F 46% 58%, #E8875A 58% 84%, #8ED47F 84%)',
};

/*
  Story format
  - pages: { id: { bg, items, text:[sentences], next | choice | end } }
  - item: { c: character | e: emoji, x, y (centre, % of scene), s (width, % of scene), mood, say, flip }
  - choice: { cue, options: [{ e | c, label, go, set:{ var: value } }] }
  - Text and items can use {var} placeholders set by choices (story.defaults gives fallbacks).
    If a var holds a character key, {var} becomes the name. {Var} capitalises.
*/
const STORIES = [
  /* 1 ------------------------------------------------------------------ */
  {
    title: "Mango's Big Picnic", lesson: 'sharing',
    defaults: { friend: 'zuzu' },
    cover: { bg: 'grass', items: [{ c: 'mango', x: 42, y: 55, s: 36, mood: 'cheer' }, { e: '🧺', x: 74, y: 72, s: 20 }, { e: '🎂', x: 18, y: 76, s: 14 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'home', items: [{ c: 'mango', x: 35, y: 55, s: 34, say: 'I love picnics!' }, { e: '🧺', x: 68, y: 72, s: 20, say: 'So much food!' }, { e: '🎂', x: 86, y: 48, s: 13, say: 'Yum yum!' }],
        text: ['Mango the cat packed a big picnic basket.', 'Apples, sandwiches, and one yummy cake!'], next: 'p1b' },
      p1b: { bg: 'grass', items: [{ c: 'mango', x: 40, y: 55, s: 32, mood: 'cheer', say: 'La la la!' }, { e: '🦋', x: 70, y: 30, s: 10, say: 'Flutter flutter!' }, { e: '☀️', x: 88, y: 14, s: 11 }],
        text: ['Mango set off, humming a happy song.', 'A butterfly danced along too.'], next: 'p2' },
      p2: { bg: 'park', items: [{ c: 'mango', x: 50, y: 52, s: 32, mood: 'think' }, { e: '🏞️', x: 17, y: 35, s: 18, say: 'Splish splash!' }, { e: '⛰️', x: 83, y: 35, s: 20, say: 'So high!' }],
        text: ['Where should Mango have the picnic?', 'By the sparkly lake, or up the tall hill?'],
        choice: { cue: 'The lake, or the hill? Tap one!', options: [
          { e: '🏞️', label: 'The lake', go: 'p3a', set: { friend: 'zuzu' } },
          { e: '⛰️', label: 'The hill', go: 'p3b', set: { friend: 'bo' } },
        ] } },
      p3a: { bg: 'lake', items: [{ c: 'mango', x: 30, y: 50, s: 28 }, { c: 'zuzu', x: 70, y: 72, s: 26, mood: 'cheer', say: 'Hello Mango!' }, { e: '🦆', x: 90, y: 56, s: 11, say: 'Quack quack!' }],
        text: ['Mango sat by the sparkly lake.', 'Splash! Zuzu popped out of the water.', '"Hello Mango! I am so hungry," said Zuzu.'], next: 'p4' },
      p3b: { bg: 'hill', items: [{ c: 'mango', x: 30, y: 62, s: 28 }, { c: 'bo', x: 68, y: 58, s: 26, mood: 'cheer', say: 'Beep boop! Hello!' }, { e: '🪁', x: 84, y: 20, s: 14, say: 'Whoosh!' }],
        text: ['Mango climbed up the tall hill.', 'Whoosh! Bo was flying a kite.', '"Hello Mango! I am so hungry," said Bo.'], next: 'p4' },
      p4: { bg: 'park', items: [{ c: 'mango', x: 30, y: 55, s: 28, mood: 'think' }, { c: '{friend}', x: 72, y: 55, s: 26, say: 'That cake looks yummy!' }, { e: '🎂', x: 51, y: 74, s: 13, say: 'Yum!' }],
        text: ['Mango looked at the cake. It looked SO yummy.', 'Should Mango keep the cake, or share it with {Friend}?'],
        choice: { cue: 'Keep it, or share it? Tap one!', options: [
          { e: '🙅', label: 'Keep it', go: 'p5a', set: { shared: 'no' } },
          { e: '🤝', label: 'Share it', go: 'p5b', set: { shared: 'yes' } },
        ] } },
      p5a: { bg: 'park', items: [{ c: 'mango', x: 34, y: 55, s: 30, mood: 'think', say: 'My tummy feels funny.' }, { c: '{friend}', x: 72, y: 55, s: 24, mood: 'think' }, { e: '🍰', x: 52, y: 76, s: 9 }],
        text: ['Mango ate the whole cake, all alone.', "Oof! Mango's tummy felt funny, and eating alone was not much fun.", '"Next time, I will share," said Mango.'], next: 'p6' },
      p5b: { bg: 'park', items: [{ c: 'mango', x: 34, y: 55, s: 28, mood: 'cheer', say: 'Here you go!' }, { c: '{friend}', x: 70, y: 55, s: 26, mood: 'cheer', say: 'Thank you, Mango!' }, { e: '🍰', x: 50, y: 74, s: 9 }, { e: '🍰', x: 58, y: 78, s: 9 }],
        text: ['Mango cut the cake into pieces.', '"Here you go, {Friend}!" said Mango.', '{Friend} smiled a great big smile. Sharing felt warm and happy!'], next: 'p6' },
      p6: { bg: 'park', items: [{ c: 'mango', x: 20, y: 55, s: 22, mood: 'cheer' }, { c: '{friend}', x: 46, y: 55, s: 22, mood: 'cheer' }, { c: 'tumble', x: 75, y: 58, s: 24, mood: 'cheer', say: 'Strawberries for everyone!' }, { e: '🍓', x: 62, y: 82, s: 9, say: 'Juicy!' }],
        text: ['Just then, Tumble came along with a big bag of strawberries to share.', 'Everyone sat together and had the best picnic ever!'], next: 'p7' },
      p7: { bg: 'sunset', items: [{ c: 'mango', x: 28, y: 54, s: 26, mood: 'cheer' }, { c: '{friend}', x: 52, y: 56, s: 22, mood: 'cheer' }, { c: 'tumble', x: 75, y: 58, s: 22, mood: 'cheer' }, { e: '❤️', x: 52, y: 18, s: 11, say: 'Sharing is caring!' }],
        text: ['Mango, {Friend} and Tumble agreed: sharing makes picnics much more fun!', 'The end.'], end: true },
    },
    quiz: { q: 'Who brought the strawberries?', answer: 'tumble', options: [{ c: 'tumble' }, { c: 'bo' }, { c: 'zuzu' }] },
  },
  /* 2 ------------------------------------------------------------------ */
  {
    title: 'Tumble Is Brave', lesson: 'being brave',
    defaults: { place: 'coral reef' },
    cover: { bg: 'beach', items: [{ c: 'tumble', x: 40, y: 72, s: 36, mood: 'cheer' }, { e: '🌊', x: 78, y: 45, s: 18 }, { e: '🐚', x: 80, y: 84, s: 10 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'beach', items: [{ c: 'tumble', x: 35, y: 74, s: 28, say: 'I love the beach!' }, { e: '🐚', x: 70, y: 84, s: 9, say: 'A pretty shell!' }, { e: '🦀', x: 86, y: 78, s: 11, say: 'Snip snap!' }, { e: '☀️', x: 86, y: 14, s: 11 }],
        text: ['Tumble the turtle loved the beach.', 'But the big blue sea looked very, very big.'], next: 'p2' },
      p2: { bg: 'beach', items: [{ c: 'tumble', x: 30, y: 76, s: 26, mood: 'sleep', say: 'I am a little bit scared.' }, { c: 'zuzu', x: 70, y: 46, s: 22, mood: 'cheer', say: 'Come and swim, Tumble!' }, { e: '🌊', x: 46, y: 46, s: 11 }],
        text: ['Zuzu waved from the water. "Come and swim, Tumble!"', 'But Tumble felt scared, and hid inside the shell.'], next: 'p3' },
      p3: { bg: 'beach', items: [{ c: 'tumble', x: 35, y: 74, s: 28, mood: 'think' }, { c: 'zuzu', x: 72, y: 46, s: 20, say: 'You can do it!' }],
        text: ['How can Tumble feel braver?', "Take a big deep breath, or hold Zuzu's hand?"],
        choice: { cue: 'A deep breath, or hold hands? Tap one!', options: [
          { e: '🌬️', label: 'Deep breath', go: 'p4a', set: { trick: 'took a deep breath' } },
          { e: '🤝', label: 'Hold hands', go: 'p4b', set: { trick: "held Zuzu's hand" } },
        ] } },
      p4a: { bg: 'beach', items: [{ c: 'tumble', x: 40, y: 72, s: 30, mood: 'sleep', say: 'In... and out.' }, { e: '💨', x: 62, y: 60, s: 11, say: 'Whoooo!' }],
        text: ['Tumble took a big deep breath. In... and out.', "In... and out. Tumble's heart felt calm and slow."], next: 'p5' },
      p4b: { bg: 'beach', items: [{ c: 'tumble', x: 38, y: 72, s: 28, say: 'Thank you, Zuzu.' }, { c: 'zuzu', x: 62, y: 66, s: 24, mood: 'cheer', say: "I've got you!" }, { e: '❤️', x: 50, y: 38, s: 9 }],
        text: ['Zuzu held out a wiggly arm.', 'Tumble held on tight. Together felt much less scary.'], next: 'p5' },
      p5: { bg: 'sea', items: [{ c: 'tumble', x: 45, y: 52, s: 32, mood: 'cheer', say: 'I can swim!' }, { e: '🫧', x: 22, y: 30, s: 9, say: 'Pop!' }, { e: '🫧', x: 78, y: 24, s: 7, say: 'Pop pop!' }],
        text: ['One small step. Then another. Splash!', 'Tumble was in the water... and Tumble could swim!'], next: 'p6' },
      p6: { bg: 'sea', items: [{ c: 'tumble', x: 50, y: 40, s: 26, mood: 'think' }, { e: '🪸', x: 18, y: 76, s: 16, say: 'So colourful!' }, { e: '🚢', x: 82, y: 76, s: 18, say: 'Creak!' }],
        text: ['Under the water there were so many things to see!', 'What should Tumble explore first? The colourful coral reef, or the old sunken ship?'],
        choice: { cue: 'The coral reef, or the old ship? Tap one!', options: [
          { e: '🪸', label: 'The reef', go: 'p7a', set: { place: 'coral reef' } },
          { e: '🚢', label: 'The ship', go: 'p7b', set: { place: 'old sunken ship' } },
        ] } },
      p7a: { bg: 'seabed', items: [{ c: 'tumble', x: 30, y: 45, s: 26, mood: 'cheer' }, { e: '🪸', x: 78, y: 74, s: 18, say: 'Welcome to the reef!' }, { e: '🐠', x: 58, y: 24, s: 10, say: 'Blub blub!' }, { e: '🐟', x: 16, y: 76, s: 9, say: 'Hello!' }],
        text: ['Tumble swam to the coral reef.', 'Pink coral, orange fish and blue fish! It was beautiful.'], next: 'p8' },
      p7b: { bg: 'seabed', items: [{ c: 'tumble', x: 30, y: 45, s: 26, mood: 'cheer' }, { e: '🚢', x: 72, y: 70, s: 26, say: 'Creak, creak!' }, { e: '💎', x: 84, y: 84, s: 8, say: 'Sparkle!' }, { e: '🐚', x: 60, y: 86, s: 8, say: 'Ooh, shiny!' }],
        text: ['Tumble peeked inside the old ship.', 'There was a treasure chest full of shiny shells!'], next: 'p8' },
      p8: { bg: 'sunset', items: [{ c: 'tumble', x: 40, y: 62, s: 28, mood: 'cheer', say: 'I did it!' }, { c: 'zuzu', x: 66, y: 62, s: 22, mood: 'cheer' }, { e: '⭐', x: 52, y: 18, s: 11, say: 'Brave Tumble!' }],
        text: ['Back on the beach, Tumble told everyone about the {place}.', "Tumble {trick} and was brave. Being brave doesn't mean you are not scared. It means you try anyway!", 'The end.'], end: true },
    },
    quiz: { q: 'Who helped Tumble be brave?', answer: 'zuzu', options: [{ c: 'zuzu' }, { c: 'mango' }, { c: 'bo' }] },
  },
  /* 3 ------------------------------------------------------------------ */
  {
    title: 'Bo Tries Again', lesson: 'trying again',
    defaults: { topper: 'star', toppericon: '⭐' },
    cover: { bg: 'home', items: [{ c: 'bo', x: 36, y: 56, s: 34, mood: 'cheer' }, { e: '🟥', x: 72, y: 80, s: 14 }, { e: '🟧', x: 72, y: 62, s: 11 }, { e: '⭐', x: 72, y: 46, s: 11 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'home', items: [{ c: 'bo', x: 35, y: 55, s: 32, mood: 'cheer', say: "Beep boop! Let's build!" }, { e: '🧱', x: 70, y: 80, s: 11, say: 'Clack!' }, { e: '🧱', x: 82, y: 80, s: 11, say: 'Clonk!' }],
        text: ['Bo the robot wanted to build the tallest tower in the whole world!'], next: 'p2' },
      p2: { bg: 'home', items: [{ c: 'bo', x: 32, y: 55, s: 30, mood: 'think', say: 'Oh no!' }, { e: '🧱', x: 62, y: 84, s: 10 }, { e: '🧱', x: 76, y: 82, s: 10 }, { e: '🧱', x: 88, y: 86, s: 10, say: 'Crash!' }, { e: '💥', x: 75, y: 56, s: 13, say: 'Boom!' }],
        text: ['Bo stacked one, two, three blocks...', 'CRASH! The tower fell down.'], next: 'p3' },
      p3: { bg: 'home', items: [{ c: 'bo', x: 45, y: 55, s: 32, mood: 'think', say: 'Hmm...' }],
        text: ['"Oh no," beeped Bo.', 'Should Bo give up, or try again?'],
        choice: { cue: 'Give up, or try again? Tap one!', options: [
          { e: '😢', label: 'Give up', go: 'p4a' },
          { e: '💪', label: 'Try again', go: 'p4b' },
        ] } },
      p4a: { bg: 'home', items: [{ c: 'bo', x: 30, y: 58, s: 26, mood: 'sleep' }, { c: 'mango', x: 68, y: 58, s: 26, mood: 'cheer', say: 'You can do it, Bo!' }],
        text: ['Bo sat down sadly.', 'Then Mango came by. "Everybody falls down sometimes. Let\'s try again together!"'], next: 'p5' },
      p4b: { bg: 'home', items: [{ c: 'bo', x: 45, y: 52, s: 34, mood: 'cheer', say: 'I will try again!' }, { e: '💪', x: 72, y: 34, s: 11 }],
        text: ['Bo stood up tall.', '"Beep boop! I will try again!"'], next: 'p5' },
      p5: { bg: 'home', items: [{ c: 'bo', x: 30, y: 55, s: 28, say: 'Big ones at the bottom!' }, { e: '🟥', x: 70, y: 80, s: 17, say: 'Big!' }, { e: '🟧', x: 70, y: 62, s: 13, say: 'Middle!' }, { e: '🟨', x: 70, y: 48, s: 9, say: 'Small!' }],
        text: ['This time, Bo put the big blocks at the bottom...', '...and the small blocks on top.'], next: 'p6' },
      p6: { bg: 'home', items: [{ c: 'bo', x: 30, y: 55, s: 28, mood: 'think' }, { e: '🟥', x: 70, y: 80, s: 17 }, { e: '🟧', x: 70, y: 62, s: 13 }, { e: '🟨', x: 70, y: 48, s: 9 }, { e: '❓', x: 70, y: 32, s: 9 }],
        text: ['What should go on the very top?', 'A shiny star, or a flag?'],
        choice: { cue: 'A star, or a flag? Tap one!', options: [
          { e: '⭐', label: 'A star', go: 'p7', set: { topper: 'star', toppericon: '⭐' } },
          { e: '🚩', label: 'A flag', go: 'p7', set: { topper: 'flag', toppericon: '🚩' } },
        ] } },
      p7: { bg: 'home', items: [{ c: 'bo', x: 30, y: 55, s: 28, mood: 'cheer', say: 'I did it!' }, { e: '🟥', x: 70, y: 80, s: 17 }, { e: '🟧', x: 70, y: 62, s: 13 }, { e: '🟨', x: 70, y: 48, s: 9 }, { e: '{toppericon}', x: 70, y: 32, s: 11, say: 'Ta-da!' }],
        text: ['Up, up, up went the tower...', '...and on top, a shiny {topper}! It was the tallest tower ever!'], next: 'p8' },
      p8: { bg: 'sunset', items: [{ c: 'bo', x: 40, y: 58, s: 30, mood: 'cheer', say: 'Never give up!' }, { c: 'mango', x: 68, y: 60, s: 22, mood: 'cheer' }, { e: '{toppericon}', x: 86, y: 22, s: 10 }],
        text: ['When things go wrong, you can always try again.', 'The end.'], end: true },
    },
    quiz: { q: 'What did Bo build?', answer: 'tower', options: [{ e: '🏰', key: 'tower' }, { e: '🚗', key: 'car' }, { e: '🍰', key: 'cake' }] },
  },
  /* 4 ------------------------------------------------------------------ */
  {
    title: 'Zuzu and the Little Fish', lesson: 'kindness',
    defaults: { ride: 'swam super fast' },
    cover: { bg: 'sea', items: [{ c: 'zuzu', x: 40, y: 55, s: 34, mood: 'cheer' }, { e: '🐠', x: 74, y: 40, s: 14 }, { e: '🫧', x: 76, y: 18, s: 9 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'seabed', items: [{ c: 'zuzu', x: 40, y: 45, s: 30, mood: 'cheer', say: 'Ready or not, here I come!' }, { e: '🪸', x: 82, y: 78, s: 13, say: "Can't find me!" }, { e: '🫧', x: 68, y: 22, s: 7, say: 'Pop!' }],
        text: ['Deep in the sea, Zuzu the octopus was playing hide and seek.'], next: 'p2' },
      p2: { bg: 'seabed', items: [{ c: 'zuzu', x: 34, y: 45, s: 28, mood: 'think', say: "What's wrong, little fish?" }, { e: '🐠', x: 70, y: 50, s: 13, say: "I can't find my mummy!", flip: true }, { e: '💧', x: 76, y: 36, s: 5 }],
        text: ['Then Zuzu heard a tiny sob.', 'A little fish was crying. "I can\'t find my mummy!"'], next: 'p3' },
      p3: { bg: 'seabed', items: [{ c: 'zuzu', x: 34, y: 45, s: 28, say: 'I will help you!' }, { e: '🐠', x: 60, y: 45, s: 11, flip: true }, { e: '🌿', x: 14, y: 76, s: 13 }, { e: '🪨', x: 86, y: 76, s: 15 }],
        text: ['"Don\'t worry, I will help you," said Zuzu.', 'Where should they look? In the seaweed, or by the big rocks?'],
        choice: { cue: 'The seaweed, or the rocks? Tap one!', options: [
          { e: '🌿', label: 'The seaweed', go: 'p4a' },
          { e: '🪨', label: 'The rocks', go: 'p4b' },
        ] } },
      p4a: { bg: 'seabed', items: [{ e: '🌿', x: 18, y: 62, s: 18, say: 'Wiggle wiggle!' }, { e: '🌿', x: 82, y: 62, s: 18, say: 'Swish!' }, { c: 'zuzu', x: 46, y: 45, s: 26 }, { e: '🐠', x: 64, y: 40, s: 9, flip: true }],
        text: ['They swam through the tall, wavy seaweed. Wiggle, wiggle!', 'But there was no mummy fish.'], next: 'p5' },
      p4b: { bg: 'seabed', items: [{ e: '🪨', x: 74, y: 72, s: 22 }, { e: '🦀', x: 72, y: 84, s: 11, say: 'Zzz... snore...' }, { c: 'zuzu', x: 34, y: 45, s: 26 }, { e: '🐠', x: 52, y: 40, s: 9, flip: true }],
        text: ['They looked behind the big grey rocks.', 'Just a sleepy crab! "Zzz," said the crab.'], next: 'p5' },
      p5: { bg: 'seabed', items: [{ c: 'zuzu', x: 26, y: 45, s: 24 }, { e: '🐠', x: 44, y: 38, s: 9, flip: true }, { c: 'tumble', x: 72, y: 50, s: 26, mood: 'cheer', say: 'Over by the coral!' }],
        text: ['Then Tumble swam by.', '"I saw a big fish calling for her baby, over by the coral!"'], next: 'p6' },
      p6: { bg: 'seabed', items: [{ c: 'zuzu', x: 26, y: 45, s: 24, mood: 'think' }, { e: '🐠', x: 44, y: 38, s: 9, flip: true }, { c: 'tumble', x: 70, y: 52, s: 24, say: 'Hop on!' }],
        text: ['The coral was far away.', "How should they get there? Swim super fast, or ride on Tumble's back?"],
        choice: { cue: "Swim fast, or ride on Tumble? Tap one!", options: [
          { e: '🚀', label: 'Swim fast', go: 'p7a', set: { ride: 'swam super fast' } },
          { c: 'tumble', label: 'Ride Tumble', go: 'p7b', set: { ride: "rode on Tumble's back" } },
        ] } },
      p7a: { bg: 'sea', items: [{ c: 'zuzu', x: 40, y: 50, s: 26, mood: 'cheer', say: 'Zoom!' }, { e: '🐠', x: 62, y: 46, s: 10, flip: true, say: 'Wheee!' }, { e: '💨', x: 20, y: 52, s: 10 }],
        text: ['Zuzu and the little fish swam as fast as they could. Zoom, zoom!'], next: 'p8' },
      p7b: { bg: 'sea', items: [{ c: 'tumble', x: 45, y: 58, s: 30, mood: 'cheer', say: 'Hold on tight!' }, { c: 'zuzu', x: 42, y: 30, s: 18, mood: 'cheer' }, { e: '🐠', x: 58, y: 30, s: 8, flip: true, say: 'Wheee!' }],
        text: ['Zuzu and the little fish climbed onto Tumble\'s back.', 'Off they went, gliding through the water. Wheee!'], next: 'p8' },
      p8: { bg: 'seabed', items: [{ e: '🐟', x: 64, y: 45, s: 20, say: 'Thank you, Zuzu!', flip: true }, { e: '🐠', x: 50, y: 52, s: 9, say: 'Mummy!' }, { c: 'zuzu', x: 24, y: 48, s: 24, mood: 'cheer' }, { e: '❤️', x: 56, y: 20, s: 9 }, { e: '🪸', x: 86, y: 80, s: 14 }],
        text: ['They {ride} all the way to the coral.', '"Mummy!" The little fish swam into a big hug.', '"Thank you, Zuzu!"'], next: 'p9' },
      p9: { bg: 'sea', items: [{ c: 'zuzu', x: 38, y: 50, s: 28, mood: 'cheer', say: 'Helping feels good!' }, { c: 'tumble', x: 68, y: 56, s: 22, mood: 'cheer' }, { e: '🐠', x: 55, y: 20, s: 7 }, { e: '🐟', x: 64, y: 22, s: 11 }],
        text: ['Being kind and helping others makes everyone happy.', 'The end.'], end: true },
    },
    quiz: { q: 'Who was lost?', answer: 'fish', options: [{ e: '🐠', key: 'fish' }, { e: '🦀', key: 'crab' }, { c: 'bo' }] },
  },
  /* 5 ------------------------------------------------------------------ */
  {
    title: "Mango's Lost Hat", lesson: 'kindness',
    defaults: { looked: 'flower garden', helper: 'bo' },
    cover: { bg: 'garden', items: [{ c: 'mango', x: 42, y: 58, s: 34, mood: 'cheer' }, { e: '👒', x: 42, y: 22, s: 16 }, { e: '🌻', x: 80, y: 72, s: 12 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'garden', items: [{ c: 'mango', x: 40, y: 60, s: 30, mood: 'cheer', say: 'I love my hat!' }, { e: '👒', x: 40, y: 26, s: 15, say: 'So pretty!' }, { e: '🌻', x: 80, y: 72, s: 12 }],
        text: ['Mango had a favourite hat: a straw hat with a red ribbon.', 'Mango wore it everywhere!'], next: 'p2' },
      p2: { bg: 'windy', items: [{ c: 'mango', x: 30, y: 60, s: 28, mood: 'think', say: 'Come back, hat!' }, { e: '💨', x: 55, y: 34, s: 13, say: 'Whoooosh!' }, { e: '👒', x: 82, y: 14, s: 12 }],
        text: ['One windy day... WHOOSH!', "The wind blew Mango's hat right off. Up, up and away!"], next: 'p3' },
      p3: { bg: 'park', items: [{ c: 'mango', x: 50, y: 54, s: 30, mood: 'think' }, { e: '🌻', x: 16, y: 72, s: 14, say: 'Flowers!' }, { e: '🦆', x: 84, y: 72, s: 13, say: 'Quack!' }],
        text: ['Oh no! Where should Mango look first?', 'In the flower garden, or by the duck pond?'],
        choice: { cue: 'The flower garden, or the duck pond? Tap one!', options: [
          { e: '🌻', label: 'The garden', go: 'p4a', set: { looked: 'flower garden' } },
          { e: '🦆', label: 'The pond', go: 'p4b', set: { looked: 'duck pond' } },
        ] } },
      p4a: { bg: 'garden', items: [{ c: 'mango', x: 30, y: 58, s: 26, mood: 'think' }, { e: '🌻', x: 60, y: 70, s: 14 }, { e: '🌷', x: 78, y: 74, s: 11 }, { e: '🐝', x: 70, y: 36, s: 9, say: 'Bzzz! No hat here!' }],
        text: ['Mango looked behind the sunflowers and under the tulips.', 'A busy bee buzzed by. But no hat!'], next: 'p5' },
      p4b: { bg: 'lake', items: [{ c: 'mango', x: 28, y: 50, s: 26, mood: 'think' }, { e: '🦆', x: 66, y: 74, s: 13, say: 'Quack! Not here!' }, { e: '🦆', x: 84, y: 70, s: 10 }],
        text: ['Mango looked all around the duck pond.', 'The ducks said quack, but there was no hat!'], next: 'p5' },
      p5: { bg: 'park', items: [{ c: 'mango', x: 50, y: 56, s: 30, mood: 'sleep' }, { c: 'bo', x: 16, y: 58, s: 18, say: 'Beep?' }, { c: 'zuzu', x: 84, y: 60, s: 18, say: 'Hello?' }],
        text: ['Mango felt sad. "I need some help," said Mango.', 'Who should Mango ask for help? Bo, or Zuzu?'],
        choice: { cue: 'Bo, or Zuzu? Tap one!', options: [
          { c: 'bo', label: 'Bo', go: 'p6a', set: { helper: 'bo' } },
          { c: 'zuzu', label: 'Zuzu', go: 'p6b', set: { helper: 'zuzu' } },
        ] } },
      p6a: { bg: 'park', items: [{ c: 'bo', x: 52, y: 52, s: 30, mood: 'cheer', say: 'Beep beep! Hat detected!' }, { c: 'mango', x: 20, y: 58, s: 22 }, { e: '📡', x: 76, y: 22, s: 10, say: 'Beep!' }],
        text: ['Bo stretched a long antenna up, up, up. Beep beep!', '"My hat finder says... look in the big tree!"'], next: 'p7' },
      p6b: { bg: 'park', items: [{ c: 'zuzu', x: 52, y: 52, s: 30, mood: 'cheer', say: 'I can see it!' }, { c: 'mango', x: 20, y: 58, s: 22 }, { e: '👀', x: 76, y: 24, s: 10 }],
        text: ['Zuzu stretched her long arms up, up, up.', '"I can see something red in the big tree!"'], next: 'p7' },
      p7: { bg: 'park', items: [{ e: '🌳', x: 60, y: 42, s: 44 }, { e: '👒', x: 60, y: 30, s: 13, say: 'Found it!' }, { e: '🐣', x: 58, y: 25, s: 6, say: 'Cheep cheep!' }, { c: 'mango', x: 18, y: 62, s: 20, mood: 'cheer' }, { c: '{helper}', x: 88, y: 64, s: 18 }],
        text: ['In the big tree, they found the hat!', 'But inside the hat were three baby birds, snug and cosy.'], next: 'p8' },
      p8: { bg: 'park', items: [{ c: 'mango', x: 30, y: 56, s: 28, mood: 'think' }, { e: '🌳', x: 72, y: 42, s: 36 }, { e: '👒', x: 72, y: 32, s: 11 }, { e: '🐦', x: 86, y: 20, s: 9, say: 'Tweet! Thank you!' }],
        text: ['The baby birds were using the hat as a nest.', 'Mango smiled. "You can keep it, little birds."'], next: 'p9' },
      p9: { bg: 'sunset', items: [{ c: 'mango', x: 34, y: 56, s: 28, mood: 'cheer', say: 'Being kind feels good!' }, { c: '{helper}', x: 66, y: 56, s: 26, mood: 'cheer' }, { e: '❤️', x: 50, y: 18, s: 10 }],
        text: ['{Helper} gave Mango a big hug.', "Mango didn't find the hat in the {looked}, but found something better: a kind heart.", 'The end.'], end: true },
    },
    quiz: { q: 'Where did they find the hat?', answer: 'tree', options: [{ e: '🌳', key: 'tree' }, { e: '🛏️', key: 'bed' }, { e: '🌊', key: 'sea' }] },
  },
  /* 6 ------------------------------------------------------------------ */
  {
    title: "Bo's Birthday Surprise", lesson: 'teamwork',
    defaults: { flavour: 'chocolate', cakeicon: '🍫', deco: 'balloons', decoicon: '🎈' },
    cover: { bg: 'party', items: [{ c: 'bo', x: 40, y: 56, s: 34, mood: 'cheer' }, { e: '🎂', x: 76, y: 72, s: 16 }, { e: '🎈', x: 78, y: 26, s: 12 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'park', items: [{ c: 'mango', x: 24, y: 56, s: 24, mood: 'cheer', say: 'Shh!' }, { c: 'zuzu', x: 50, y: 56, s: 22, mood: 'cheer', say: "It's a secret!" }, { c: 'tumble', x: 76, y: 60, s: 22, mood: 'cheer', say: 'Hee hee!' }],
        text: ['Shh! Mango, Zuzu and Tumble had a secret.', "Tomorrow was Bo's birthday, and they wanted to make a surprise party!"], next: 'p2' },
      p2: { bg: 'home', items: [{ c: 'mango', x: 30, y: 54, s: 28, mood: 'think' }, { e: '🍫', x: 66, y: 46, s: 12, say: 'Chocolate!' }, { e: '🍓', x: 84, y: 46, s: 12, say: 'Strawberry!' }, { e: '🥣', x: 74, y: 78, s: 13 }],
        text: ['First, they needed a birthday cake.', 'Should it be a chocolate cake, or a strawberry cake?'],
        choice: { cue: 'Chocolate, or strawberry? Tap one!', options: [
          { e: '🍫', label: 'Chocolate', go: 'p3', set: { flavour: 'chocolate', cakeicon: '🍫' } },
          { e: '🍓', label: 'Strawberry', go: 'p3', set: { flavour: 'strawberry', cakeicon: '🍓' } },
        ] } },
      p3: { bg: 'home', items: [{ c: 'mango', x: 22, y: 54, s: 24, mood: 'cheer' }, { c: 'zuzu', x: 46, y: 56, s: 22, mood: 'cheer', say: 'Stir, stir, stir!' }, { e: '🎂', x: 74, y: 70, s: 18, say: 'Yummy!' }, { e: '{cakeicon}', x: 86, y: 44, s: 10 }],
        text: ['Mango and Zuzu mixed and stirred and baked.', 'Ta-da! A yummy {flavour} birthday cake!'], next: 'p4' },
      p4: { bg: 'party', items: [{ c: 'tumble', x: 50, y: 56, s: 30, mood: 'think' }, { e: '🎈', x: 18, y: 30, s: 12, say: 'Pop!' }, { e: '🎊', x: 82, y: 30, s: 12, say: 'Swish!' }],
        text: ['Next, Tumble made the room look beautiful.', 'Should Tumble hang up balloons, or colourful streamers?'],
        choice: { cue: 'Balloons, or streamers? Tap one!', options: [
          { e: '🎈', label: 'Balloons', go: 'p5', set: { deco: 'balloons', decoicon: '🎈' } },
          { e: '🎊', label: 'Streamers', go: 'p5', set: { deco: 'streamers', decoicon: '🎊' } },
        ] } },
      p5: { bg: 'party', items: [{ c: 'tumble', x: 50, y: 60, s: 28, mood: 'cheer', say: 'So pretty!' }, { e: '{decoicon}', x: 16, y: 22, s: 11 }, { e: '{decoicon}', x: 36, y: 14, s: 10 }, { e: '{decoicon}', x: 66, y: 16, s: 10 }, { e: '{decoicon}', x: 86, y: 24, s: 11, say: 'Wheee!' }],
        text: ['Tumble hung {deco} everywhere. Red ones, blue ones, yellow ones!', 'The room looked like a rainbow.'], next: 'p6' },
      p6: { bg: 'party', items: [{ e: '🛋️', x: 50, y: 72, s: 46 }, { c: 'mango', x: 34, y: 52, s: 16, mood: 'think' }, { c: 'zuzu', x: 50, y: 50, s: 15, mood: 'think', say: 'Shh!' }, { c: 'tumble', x: 66, y: 54, s: 16, mood: 'think' }],
        text: ['Then everyone hid behind the sofa.', 'Shh... here comes Bo!'], next: 'p7' },
      p7: { bg: 'party', items: [{ e: '🚪', x: 20, y: 52, s: 22 }, { c: 'bo', x: 44, y: 56, s: 28, mood: 'think', say: 'Hello? Anybody?' }, { e: '🛋️', x: 80, y: 74, s: 30 }],
        text: ['Bo rolled in. "Hello? Where is everybody?"'], next: 'p8' },
      p8: { bg: 'party', items: [{ c: 'bo', x: 50, y: 56, s: 26, mood: 'cheer', say: 'Beep boop! Thank you!' }, { c: 'mango', x: 20, y: 60, s: 20, mood: 'cheer' }, { c: 'zuzu', x: 80, y: 60, s: 18, mood: 'cheer' }, { e: '{decoicon}', x: 24, y: 18, s: 10 }, { e: '{decoicon}', x: 76, y: 18, s: 10 }, { e: '🎂', x: 50, y: 86, s: 12, say: 'Make a wish!' }],
        text: ['"SURPRISE! Happy birthday, Bo!"', 'Bo\'s lights flashed with joy. "Beep boop! Best surprise ever!"'], next: 'p9' },
      p9: { bg: 'sunset', items: [{ c: 'bo', x: 30, y: 56, s: 24, mood: 'cheer' }, { c: 'tumble', x: 56, y: 60, s: 22, mood: 'cheer' }, { c: 'mango', x: 80, y: 58, s: 20, mood: 'cheer' }, { e: '{cakeicon}', x: 52, y: 18, s: 10, say: 'Yum!' }],
        text: ['They ate {flavour} cake and danced under the {deco}.', 'Working together for a friend is the best present of all.', 'The end.'], end: true },
    },
    quiz: { q: 'Whose birthday was it?', answer: 'bo', options: [{ c: 'bo' }, { c: 'mango' }, { c: 'tumble' }] },
  },
  /* 7 ------------------------------------------------------------------ */
  {
    title: "Zuzu's Rainy Day", lesson: 'making the best of things',
    defaults: { fun: 'blanket fort', after: 'jumped in puddles' },
    cover: { bg: 'rain', items: [{ c: 'zuzu', x: 40, y: 58, s: 32, mood: 'happy' }, { e: '☔', x: 74, y: 40, s: 16 }, { e: '🌧️', x: 20, y: 18, s: 14 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'home', items: [{ c: 'zuzu', x: 38, y: 54, s: 30, mood: 'cheer', say: 'Beach day! Hooray!' }, { e: '🪣', x: 70, y: 76, s: 12, say: 'For sandcastles!' }, { e: '🏖️', x: 82, y: 34, s: 14 }],
        text: ['Zuzu was so excited. Today was beach day!', 'Zuzu packed a bucket and spade.'], next: 'p2' },
      p2: { bg: 'rain', items: [{ c: 'zuzu', x: 40, y: 58, s: 28, mood: 'think', say: 'Oh no!' }, { e: '🌧️', x: 20, y: 16, s: 14, say: 'Pitter patter!' }, { e: '🌧️', x: 72, y: 12, s: 14 }, { e: '💧', x: 80, y: 60, s: 6 }],
        text: ['But then... pitter patter, pitter patter.', 'It started to rain. Lots and lots of rain.'], next: 'p3' },
      p3: { bg: 'home', items: [{ c: 'zuzu', x: 30, y: 56, s: 26, mood: 'sleep', say: 'I wanted to go to the beach.' }, { c: 'mango', x: 70, y: 56, s: 26, mood: 'cheer', say: "Let's have fun inside!" }],
        text: ['"Oh no," said Zuzu. "Now we can\'t go to the beach."', 'Mango came over. "Let\'s have fun inside instead!"'], next: 'p4' },
      p4: { bg: 'home', items: [{ c: 'zuzu', x: 30, y: 56, s: 24, mood: 'think' }, { c: 'mango', x: 70, y: 56, s: 24 }, { e: '⛺', x: 50, y: 26, s: 12 }, { e: '🎶', x: 90, y: 22, s: 10 }],
        text: ['What should they do inside?', 'Build a cosy blanket fort, or have a silly dance party?'],
        choice: { cue: 'A blanket fort, or a dance party? Tap one!', options: [
          { e: '⛺', label: 'Blanket fort', go: 'p5a', set: { fun: 'blanket fort' } },
          { e: '💃', label: 'Dance party', go: 'p5b', set: { fun: 'dance party' } },
        ] } },
      p5a: { bg: 'home', items: [{ e: '⛺', x: 50, y: 58, s: 44 }, { c: 'zuzu', x: 42, y: 66, s: 14, mood: 'cheer' }, { c: 'mango', x: 58, y: 66, s: 14, mood: 'cheer' }, { e: '🔦', x: 82, y: 78, s: 9, say: 'Click! Torch on!' }, { e: '📚', x: 18, y: 80, s: 10, say: 'Story time!' }],
        text: ['They draped blankets over the chairs.', 'Inside the fort, they read stories with a torch. So cosy!'], next: 'p6' },
      p5b: { bg: 'party', items: [{ c: 'zuzu', x: 36, y: 54, s: 28, mood: 'cheer', say: 'Wiggle wiggle!' }, { c: 'mango', x: 68, y: 56, s: 24, mood: 'cheer', say: 'Shake shake!' }, { e: '🎶', x: 52, y: 18, s: 11, say: 'La la la!' }],
        text: ['They put on happy music.', 'Zuzu danced with all eight arms! Wiggle, wiggle, wiggle!'], next: 'p6' },
      p6: { bg: 'rainbow', items: [{ e: '🌈', x: 50, y: 30, s: 40, say: 'Hello, rainbow!' }, { e: '☀️', x: 86, y: 14, s: 11 }, { c: 'zuzu', x: 32, y: 72, s: 20, mood: 'cheer' }, { c: 'mango', x: 66, y: 72, s: 18, mood: 'cheer' }],
        text: ['After a while, the rain stopped.', 'Out came the sun... and a big, beautiful rainbow!'], next: 'p7' },
      p7: { bg: 'rainbow', items: [{ e: '🌈', x: 50, y: 24, s: 30 }, { c: 'zuzu', x: 50, y: 66, s: 24, mood: 'think' }, { e: '💦', x: 16, y: 80, s: 12 }, { e: '🎨', x: 84, y: 76, s: 12 }],
        text: ['What should they do now?', 'Jump in the puddles, or paint the rainbow?'],
        choice: { cue: 'Puddles, or painting? Tap one!', options: [
          { e: '💦', label: 'Splash!', go: 'p8a', set: { after: 'jumped in puddles' } },
          { e: '🎨', label: 'Paint it', go: 'p8b', set: { after: 'painted the rainbow' } },
        ] } },
      p8a: { bg: 'rainbow', items: [{ c: 'zuzu', x: 34, y: 56, s: 26, mood: 'cheer', say: 'SPLOSH!' }, { c: 'mango', x: 68, y: 58, s: 22, mood: 'cheer', say: 'Splish!' }, { e: '💦', x: 34, y: 86, s: 12 }, { e: '💦', x: 68, y: 86, s: 12 }],
        text: ['Splish! Splash! SPLOSH!', 'They jumped in every puddle they could find.'], next: 'p9' },
      p8b: { bg: 'home', items: [{ c: 'zuzu', x: 28, y: 56, s: 24, mood: 'cheer', say: 'Look at my rainbow!' }, { e: '🖼️', x: 64, y: 42, s: 24 }, { e: '🌈', x: 64, y: 42, s: 14 }, { e: '🎨', x: 86, y: 78, s: 11, say: 'Splodge!' }],
        text: ['They painted the rainbow: red, orange, yellow, green, blue and purple!', "Zuzu's painting was the brightest of all."], next: 'p9' },
      p9: { bg: 'sunset', items: [{ c: 'zuzu', x: 36, y: 56, s: 28, mood: 'cheer', say: 'Best day ever!' }, { c: 'mango', x: 66, y: 58, s: 22, mood: 'cheer' }, { e: '🌈', x: 52, y: 16, s: 16 }],
        text: ['"Today was the best day," said Zuzu. "We had a {fun}, and then we {after}!"', 'Even rainy days can be happy days.', 'The end.'], end: true },
    },
    quiz: { q: 'What came out after the rain?', answer: 'rainbow', options: [{ e: '🌈', key: 'rainbow' }, { e: '⛄', key: 'snowman' }, { e: '🌙', key: 'moon' }] },
  },
  /* 8 ------------------------------------------------------------------ */
  {
    title: "Tumble's Big Race", lesson: 'kindness is better than winning',
    defaults: { warmup: 'stretched' },
    cover: { bg: 'track', items: [{ c: 'tumble', x: 40, y: 64, s: 32, mood: 'cheer' }, { e: '🏁', x: 76, y: 46, s: 14 }, { e: '🏆', x: 78, y: 18, s: 11 }] },
    start: 'p1',
    pages: {
      p1: { bg: 'track', items: [{ c: 'tumble', x: 18, y: 66, s: 20, mood: 'cheer', say: 'Hooray, sports day!' }, { c: 'bo', x: 42, y: 64, s: 20, mood: 'cheer', say: 'Beep! I am fast!' }, { c: 'mango', x: 66, y: 64, s: 20, mood: 'cheer', say: 'Me too!' }, { e: '🏁', x: 88, y: 46, s: 11 }],
        text: ['It was sports day in the park!', 'Tumble, Bo and Mango were all in the big race.'], next: 'p2' },
      p2: { bg: 'park', items: [{ c: 'tumble', x: 46, y: 58, s: 32, mood: 'think', say: 'I will do my best!' }, { e: '🧘', x: 16, y: 40, s: 12 }, { e: '🦘', x: 84, y: 40, s: 12 }],
        text: ['"I am not very fast," said Tumble. "But I will do my best."', 'How should Tumble get ready? Stretch, or jump about?'],
        choice: { cue: 'Stretch, or jump? Tap one!', options: [
          { e: '🧘', label: 'Stretch', go: 'p3a', set: { warmup: 'stretched' } },
          { e: '🦘', label: 'Jump about', go: 'p3b', set: { warmup: 'jumped about' } },
        ] } },
      p3a: { bg: 'park', items: [{ c: 'tumble', x: 46, y: 56, s: 32, mood: 'sleep', say: 'Stretch... and relax.' }, { e: '⬆️', x: 72, y: 30, s: 9 }],
        text: ['Tumble stretched up high and down low.', 'Stretch... and relax. Ready!'], next: 'p4' },
      p3b: { bg: 'park', items: [{ c: 'tumble', x: 46, y: 50, s: 32, mood: 'cheer', say: 'Boing boing!' }, { e: '💫', x: 72, y: 26, s: 10 }],
        text: ['Tumble jumped up and down. Boing, boing, boing!', 'Wiggle those legs. Ready!'], next: 'p4' },
      p4: { bg: 'track', items: [{ c: 'zuzu', x: 84, y: 40, s: 16, mood: 'cheer', say: 'Ready, steady, GO!' }, { c: 'bo', x: 54, y: 68, s: 18, mood: 'cheer' }, { c: 'mango', x: 34, y: 68, s: 18, mood: 'cheer' }, { c: 'tumble', x: 14, y: 70, s: 18 }, { e: '💨', x: 66, y: 70, s: 8 }],
        text: ['Zuzu waved the flag. "Ready, steady, GO!"', 'Bo zoomed! Mango dashed! Tumble walked... step, step, step.'], next: 'p5' },
      p5: { bg: 'track', items: [{ c: 'mango', x: 52, y: 70, s: 20, mood: 'think', say: 'Ouch, my knee!' }, { c: 'tumble', x: 24, y: 70, s: 20, mood: 'think' }, { c: 'bo', x: 86, y: 66, s: 14, mood: 'cheer' }],
        text: ['Suddenly, Mango tripped and fell down. "Ouch, my knee!"', 'Should Tumble keep going, or stop and help Mango?'],
        choice: { cue: 'Keep going, or help Mango? Tap one!', options: [
          { e: '🏃', label: 'Keep going', go: 'p6a' },
          { e: '🤝', label: 'Help Mango', go: 'p6b' },
        ] } },
      p6a: { bg: 'track', items: [{ c: 'tumble', x: 66, y: 68, s: 20, mood: 'think', say: 'My friend needs me.' }, { c: 'mango', x: 34, y: 70, s: 20, mood: 'think' }],
        text: ['Tumble took a few more steps... then stopped.', '"My friend needs me," said Tumble, and went back to help.'], next: 'p7' },
      p6b: { bg: 'track', items: [{ c: 'tumble', x: 34, y: 68, s: 22, mood: 'cheer', say: 'Are you okay?' }, { c: 'mango', x: 60, y: 68, s: 20, mood: 'happy' }, { e: '🩹', x: 70, y: 84, s: 8, say: 'All better!' }],
        text: ['Tumble stopped straight away. "Are you okay, Mango?"', 'Tumble helped Mango up and put a plaster on the sore knee.'], next: 'p7' },
      p7: { bg: 'track', items: [{ c: 'tumble', x: 46, y: 68, s: 20, mood: 'cheer' }, { c: 'mango', x: 64, y: 68, s: 20, mood: 'cheer', say: 'Thank you, Tumble!' }, { e: '🏁', x: 88, y: 50, s: 12, say: 'Finish line!' }],
        text: ['Mango and Tumble walked to the finish line together.', 'Step, step, step... they crossed the line side by side!'], next: 'p8' },
      p8: { bg: 'park', items: [{ c: 'tumble', x: 40, y: 56, s: 26, mood: 'cheer' }, { c: 'mango', x: 66, y: 58, s: 22, mood: 'cheer' }, { c: 'bo', x: 14, y: 60, s: 18, mood: 'cheer', say: 'Hooray for Tumble!' }, { c: 'zuzu', x: 88, y: 62, s: 16, mood: 'cheer' }, { e: '🏆', x: 52, y: 18, s: 11, say: 'Kindest friend award!' }],
        text: ['Bo crossed the line first, but everyone cheered the loudest for Tumble.', '"You are the kindest friend," said Mango.'], next: 'p9' },
      p9: { bg: 'sunset', items: [{ c: 'tumble', x: 40, y: 60, s: 28, mood: 'cheer', say: 'I did my best!' }, { c: 'mango', x: 66, y: 60, s: 22, mood: 'cheer' }, { e: '❤️', x: 52, y: 18, s: 10 }],
        text: ['Tumble {warmup}, did a best try, and helped a friend.', 'Being kind is more important than winning.', 'The end.'], end: true },
    },
    quiz: { q: 'Who fell down in the race?', answer: 'mango', options: [{ c: 'mango' }, { c: 'bo' }, { c: 'zuzu' }] },
  },
];

const STYLE = `
body.st-active .caption{display:none!important}
.st-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;flex:1;min-height:0;justify-content:center}
.st-scene{position:relative;container-type:inline-size;width:min(100%, calc((100vh - 320px) * 1.6));aspect-ratio:16/10;border-radius:24px;overflow:hidden;box-shadow:0 6px 0 rgba(0,0,0,.12);flex:none}
.st-item{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;line-height:1;animation:stbob 3.2s ease-in-out infinite}
.st-item svg{width:100%;height:auto;display:block}
.st-item .em{line-height:1}
.st-item.tap{cursor:pointer}
.st-item .spark{position:absolute;right:-8%;top:-8%;font-size:clamp(14px,2.6cqw,26px);animation:stspark 1.4s ease-in-out infinite;pointer-events:none;opacity:0;transition:opacity .4s}
.st-scene.ready .st-item .spark{opacity:1}
@keyframes stspark{0%,100%{transform:scale(.7) rotate(0)}50%{transform:scale(1.15) rotate(20deg)}}
@keyframes stbob{0%,100%{margin-top:0}50%{margin-top:-0.6cqw}}
.st-wig{animation:stwig .6s}
@keyframes stwig{0%,100%{transform:translate(-50%,-50%) rotate(0)}25%{transform:translate(-50%,-60%) rotate(-10deg) scale(1.12)}50%{transform:translate(-50%,-50%) rotate(8deg)}75%{transform:translate(-50%,-55%) rotate(-4deg)}}
.st-in{animation:stin .45s ease-out}
@keyframes stin{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}
.st-bar{display:flex;align-items:center;gap:12px;width:min(100%, 1000px)}
.st-text{flex:1;min-width:0;background:#FFFDF6;border:3px solid #F1E3C4;border-radius:22px;padding:10px 18px;font-size:clamp(19px,2.6vw,27px);line-height:1.35;color:#9A8FAE;text-align:left;font-weight:800}
.st-text span{transition:color .2s, background .2s;border-radius:8px;padding:0 3px}
.st-text span.now{color:var(--ink);background:#FFE9C2}
.st-text span.read{color:var(--ink)}
.st-text .ttl{display:block;color:var(--ink);font-size:1.25em;font-weight:900}
.st-btn{width:clamp(76px,10vw,100px);height:clamp(76px,10vw,100px);border-radius:50%;color:#fff;font-size:clamp(36px,5.6vw,52px);box-shadow:var(--shadow);display:grid;place-items:center;flex:none;transition:transform .12s, opacity .3s}
.st-next{background:#3BB273}
.st-next.wait{opacity:.0;pointer-events:none}
.st-next.go{animation:stpulse 1.1s ease-in-out infinite}
@keyframes stpulse{0%,100%{transform:scale(1);box-shadow:0 6px 0 rgba(0,0,0,.15),0 0 0 0 rgba(59,178,115,.6)}50%{transform:scale(1.08);box-shadow:0 6px 0 rgba(0,0,0,.15),0 0 0 16px rgba(59,178,115,0)}}
.st-replay{background:#fff;color:var(--ink);width:clamp(60px,8vw,76px);height:clamp(60px,8vw,76px);font-size:clamp(28px,4vw,36px)}
.st-start{width:auto;padding:0 34px;border-radius:50px;font-size:clamp(28px,4.4vw,40px);gap:10px;display:flex}
.st-btn:active,.st-opt:active{transform:scale(.92)}
.st-choices{display:flex;gap:14px;flex:none}
.st-opt{min-width:clamp(110px,15vw,160px);padding:8px 12px;border-radius:26px;background:#fff;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:2px;border:4px solid #FFD23F;animation:stpulse2 1.3s ease-in-out infinite}
@keyframes stpulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.st-opt .em{font-size:clamp(52px,8vw,76px);line-height:1.1}
.st-opt .lb{font-size:clamp(16px,2.2vw,22px);color:var(--ink)}
.st-opt svg{width:clamp(70px,10vw,100px);height:auto}
.st-quiz{display:flex;gap:clamp(14px,3vw,30px);justify-content:center;flex-wrap:wrap}
.st-quiz .st-opt{min-width:clamp(130px,20vw,200px);animation:none;border-color:#fff}
.st-quiz .st-opt .em{font-size:clamp(70px,11vw,110px)}
.st-quiz .st-opt svg{width:clamp(100px,15vw,150px)}
@media (orientation: portrait){
  .st-scene{width:min(100%, calc((100vh - 470px) * 1.6))}
  .st-bar{flex-wrap:wrap;justify-content:center}
  .st-text{flex:1 1 100%;order:0}
  .st-replay{order:1}.st-next,.st-choices{order:2}
}
`;

export default function start(ctx) {
  const { stage } = ctx;
  const story = STORIES[Math.max(0, Math.min(STORIES.length - 1, (ctx.level || 1) - 1))];
  ctx.hideMascot();
  let alive = true, token = 0, pageNo = 0;
  const live = tk => alive && tk === token;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const vars = { ...(story.defaults || {}) };

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);
  document.body.classList.add('st-active');

  // Longest path through the story, for the progress dots.
  const depth = (id, seen = new Set()) => {
    const p = story.pages[id];
    if (!p || seen.has(id)) return 0;
    seen.add(id);
    const nexts = p.end ? [] : p.choice ? p.choice.options.map(o => o.go) : [p.next];
    return 1 + Math.max(0, ...nexts.map(n => depth(n, new Set(seen))));
  };
  const total = depth(story.start) + 1; // + the question at the end
  ctx.dots(total);

  const name = k => CAST[k]?.name || k;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function fill(text) {
    return text.replace(/\{(\w+)\}/g, (m, k) => {
      const key = k.toLowerCase();
      if (!(key in vars)) return m;
      const v = CAST[vars[key]] ? name(vars[key]) : vars[key];
      return k[0] === k[0].toUpperCase() ? cap(v) : v;
    });
  }

  function itemEl(it, onTap) {
    const d = document.createElement('div');
    d.className = 'st-item' + (it.say ? ' tap' : '');
    d.style.left = it.x + '%'; d.style.top = it.y + '%'; d.style.width = it.s + '%';
    d.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
    if (it.c) {
      d.innerHTML = character(fill(it.c), { mood: it.mood || 'happy' });
    } else {
      d.innerHTML = `<span class="em" style="font-size:${it.s * 0.9}cqw">${fill(it.e)}</span>`;
    }
    if (it.flip) d.firstElementChild.style.transform = 'scaleX(-1)';
    if (it.say) {
      d.insertAdjacentHTML('beforeend', '<span class="spark">✨</span>');
      d.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (!d.closest('.st-scene').classList.contains('ready')) return; // wait until the page has been read
        d.classList.remove('st-wig'); void d.offsetWidth; d.classList.add('st-wig');
        ctx.sfx.pop();
        onTap && onTap(fill(it.say));
      });
    }
    return d;
  }

  function sceneEl(scene, onTap) {
    const box = document.createElement('div');
    box.className = 'st-scene';
    box.style.background = BG[scene.bg] || BG.grass;
    for (const it of scene.items) box.appendChild(itemEl(it, onTap));
    return box;
  }

  function layout(scene, onTap) {
    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'st-wrap st-in';
    const sc = sceneEl(scene, onTap);
    const bar = document.createElement('div');
    bar.className = 'st-bar';
    wrap.append(sc, bar);
    stage.appendChild(wrap);
    return { sc, bar };
  }

  // Read sentences one at a time, highlighting each. Resolves false if the page changed.
  async function narrate(spans, tk) {
    spans.forEach(s => s.classList.remove('now', 'read'));
    for (const s of spans) {
      if (!live(tk)) return false;
      s.classList.add('now');
      await ctx.say(s.textContent);
      if (!live(tk)) return false;
      s.classList.remove('now'); s.classList.add('read');
      await wait(250);
    }
    return live(tk);
  }

  /* ---------- Cover ---------- */
  function cover() {
    const tk = ++token;
    const { sc, bar } = layout(story.cover, null);
    sc.classList.add('ready');
    bar.innerHTML = `<div class="st-text"><span class="ttl">${story.title}</span><span class="read">A story about ${story.lesson}.</span></div>
      <button class="st-btn st-next st-start go" aria-label="Start the story">▶<span style="font-size:.7em">Start</span></button>`;
    bar.querySelector('.st-start').onclick = () => { ctx.sfx.tap(); page(story.start); };
    const line = `Story time! ${story.title}. Tap the green button to start!`;
    ctx.setInstruction(line);
    ctx.say(line);
    void tk;
  }

  /* ---------- A page ---------- */
  async function page(id) {
    let cur = ++token; // changes when the page is read again with 🔊
    const tk = cur;
    const pg = story.pages[id];
    pageNo++;
    ctx.progress(pageNo - 1);
    const sentences = pg.text.map(fill);
    const { sc, bar } = layout(pg, line => ctx.say(line));
    bar.innerHTML = `
      <button class="st-btn st-replay" aria-label="Read it again">🔊</button>
      <div class="st-text">${sentences.map(s => `<span>${s}</span>`).join(' ')}</div>
      ${pg.choice ? '<div class="st-choices"></div>' : `<button class="st-btn st-next wait" aria-label="${pg.end ? 'Finish' : 'Next page'}">${pg.end ? '★' : '▶'}</button>`}`;
    const spans = [...bar.querySelectorAll('.st-text span')];
    const next = bar.querySelector('.st-next');
    const choices = bar.querySelector('.st-choices');
    const hasProps = pg.items.some(it => it.say);

    const ready = async () => {
      sc.classList.add('ready');
      if (pg.choice) {
        choices.innerHTML = '';
        for (const o of pg.choice.options) {
          const b = document.createElement('button');
          b.className = 'st-opt';
          b.innerHTML = (o.c ? character(o.c, { mood: 'cheer' }) : `<span class="em">${o.e}</span>`) + `<span class="lb">${o.label}</span>`;
          b.onclick = async () => {
            if (!live(cur)) return;
            token++; // lock this page
            ctx.sfx.good();
            ctx.bounce(b);
            Object.assign(vars, o.set || {});
            await ctx.say(`${o.label}!`);
            if (alive) page(o.go);
          };
          choices.appendChild(b);
        }
        const cue = pg.choice.cue || 'Tap one!';
        ctx.setInstruction(cue);
        await ctx.say(cue);
      } else {
        next.classList.remove('wait');
        next.classList.add('go');
        let cue = '';
        if (pageNo <= 2) cue = hasProps ? 'Tap the sparkly things, or tap the green arrow to turn the page!' : 'Tap the green arrow to turn the page!';
        else if (pg.end) cue = 'Tap the star!';
        ctx.setInstruction(cue || sentences.join(' '));
        if (cue && live(cur)) ctx.say(cue);
      }
    };

    bar.querySelector('.st-replay').onclick = async () => {
      if (!live(cur)) return;
      const mine = cur = ++token; // restart reading on this same page
      const ok = await narrate(spans, mine);
      if (ok) ready();
    };
    if (next) next.onclick = () => {
      if (!live(cur) || next.classList.contains('wait')) return;
      ctx.sfx.tap();
      if (pg.end) quiz(); else page(pg.next);
    };

    await wait(350);
    if (!live(tk)) return;
    const ok = await narrate(spans, tk);
    if (ok) ready();
  }

  /* ---------- Question at the end ---------- */
  function quiz() {
    const tk = ++token;
    pageNo++;
    ctx.progress(total - 1);
    const q = story.quiz;
    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'st-wrap st-in';
    wrap.innerHTML = `<div class="st-bar" style="justify-content:center"><button class="st-btn st-replay" aria-label="Ask again">🔊</button>
      <div class="st-text" style="text-align:center"><span class="read">❓ ${q.q}</span></div></div>
      <div class="st-quiz"></div>`;
    stage.appendChild(wrap);
    const box = wrap.querySelector('.st-quiz');
    const ask = `${q.q} Tap the right picture!`;
    let misses = 0, solved = false;
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    for (const o of opts) {
      const key = o.c || o.key;
      const b = document.createElement('button');
      b.className = 'st-opt';
      b.innerHTML = o.c ? character(o.c) : `<span class="em">${o.e}</span>`;
      b.onclick = async () => {
        if (solved || !live(tk)) return;
        if (key === q.answer) {
          solved = true;
          ctx.right(b);
          ctx.progress(total);
          const what = o.c ? name(o.c) : key;
          await ctx.say(`Yes! ${cap(what)}! Well done. The end!`);
          if (alive) ctx.finish(3);
        } else {
          misses++;
          ctx.wrong(b, 'Not quite. Try again!');
          if (misses >= 2) [...box.children].forEach(x => { if (x._key === q.answer) x.classList.add('hint'); });
        }
      };
      b._key = key;
      box.appendChild(b);
    }
    wrap.querySelector('.st-replay').onclick = () => ctx.say(ask);
    ctx.setInstruction(ask);
    ctx.say(ask);
  }

  cover();
  return () => {
    alive = false; token++;
    style.remove();
    document.body.classList.remove('st-active');
  };
}
