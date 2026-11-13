# Kids' game design: the rules we follow

These rules come from research and guidance on designing apps for young children: Nielsen Norman Group studies of children's UX, Google's *Designing for Kids* guidance, and Sesame Workshop's touch-tablet research. Each one notes how Playroom applies it.

| # | Best practice | Why | How Playroom does it |
|---|---|---|---|
| 1 | **Huge touch targets** (≈ 75–90 px for ages 3–5) with forgiving hit areas | Young children tap inaccurately and often just miss the edge of a target | Buttons are 72–130 px. Sorter buckets accept drops *near* them, not only on them |
| 2 | **Spoken instructions, nothing to read** | Pre-readers can't use text. Instructions must be in words a child understands | Every instruction is spoken. The 🔊 button repeats it |
| 3 | **Start audio from a tap** | Browsers block sound until the user taps. NN/g saw kids miss instructions because of this | Tapping your profile unlocks sound and voice |
| 4 | **Immediate, obvious feedback** | Under-6s miss subtle feedback, and kids expect a response the moment they touch | Every tap gives a sound, a bounce or a wobble, and the mascot reacts |
| 5 | **No failure, no punishment** | Harsh "wrong" sounds and game-overs cause frustration and quitting | A soft "boop" and a wobble only. No lives, no timers, no losing |
| 6 | **Errorless learning + hints** | Keeps 3-year-olds succeeding while they learn | After 2 misses, the right answer glows |
| 7 | **Short rounds (3–5 items)** | Attention spans are short | Each game is about 2–4 minutes, then a celebration |
| 8 | **Big, joyful rewards** | Celebration motivates, especially for little ones | Confetti, ⭐ stars, and balloons to pop at the end of every game |
| 9 | **Adaptive difficulty in narrow age bands** | A 3-year-old and a 6-year-old need very different challenges | Separate Little/Big modes, and levels go up with ⭐⭐⭐ |
| 10 | **Consistent navigation** | Kids learn one layout and reuse it | 🏠 is always top-left, 🔊 next to it, stars top-right |
| 11 | **Parent gate on settings** | Stops kids changing settings or getting lost | Hold for 3 seconds (hard for a 3-year-old, easy for an adult) |
| 12 | **No dark patterns** | No ads, upsells, streak guilt or "come back" nagging | None of these exist in the app |
| 13 | **Healthy screen time** | Gentle limits work better than sudden cut-offs | Optional daily limit. A sleepy character says "Time for a rest!" and the current game finishes first |
| 14 | **Privacy** | Children's data should never leave the device | No network, no accounts. Progress is saved only on the tablet |
| 15 | **Playtest with your own kids** | The research says to test with real children in narrow age bands | Watch them play. What they skip or find hard tells us what to change next |

## Sources
- [Nielsen Norman Group: Children's UX and cognition](https://www.nngroup.com/articles/kids-cognition/)
- [Google: Designing engaging apps for kids](https://developers.google.com/building-for-kids/designing-engaging-apps)
- [UXmatters: Designing user experiences for children](https://www.uxmatters.com/mt/archives/2010/05/designing-user-experiences-for-children.php)
- [UserTesting: UX for kids' products](https://www.usertesting.com/blog/ux-for-kids)
- [The Communication Initiative: summary of Sesame Workshop's touch-tablet research](https://sb.comminit.com/node/9311454)
- Character design: [omer-metin/skills-for-antigravity: character-design skill](https://github.com/omer-metin/skills-for-antigravity) (three-read rule, shape language, distinct silhouettes)
