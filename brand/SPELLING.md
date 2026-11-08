# Spelling for narration

Narration is in Indonesian, so the voice reads every word with Indonesian sounds. English words, brand names and model codes come out wrong unless the script spells them the way they should sound.

These rules apply to `projects/<id>/voice/script.txt` only. **On screen, write names normally**: the logo and captions still say "3D BORE", not "tri di bo re".

## Brand

| Written | Say it as | Why |
|---|---|---|
| 3D | `tri di` | English "three D", in Indonesian spelling |
| BORE | `bo re` | Two syllables. It is short for the founder's name, not the English word "bore" |
| 3D BORE | `tri di bo re` | |

Never put the founder's full name in a film.

## Model names and codes

Spell English letter and digit sounds in Indonesian spelling, one digit at a time.

| Written | Say it as |
|---|---|
| MG90S | `em ji nain ziro es` |
| MG996R | `em ji nain nain siks ar` |

Letters: A `ei`, B `bi`, C `si`, D `di`, E `i`, F `ef`, G `ji`, H `eich`, I `ai`, J `jei`, K `kei`, L `el`, M `em`, N `en`, O `o`, P `pi`, Q `kyu`, R `ar`, S `es`, T `ti`, U `yu`, V `vi`, W `dabelyu`, X `eks`, Y `wai`, Z `zed`.

Digits: 0 `ziro`, 1 `wan`, 2 `tu`, 3 `tri`, 4 `for`, 5 `faif`, 6 `siks`, 7 `seven`, 8 `eit`, 9 `nain`.

Only the letter and digit spellings in the tables above have been confirmed by ear. Treat the rest as a starting point and check the transcript.

## Words to leave out

| Word | What to do |
|---|---|
| MIT (the licence) | Don't say it. Neither "MIT" nor "em ai ti" came out right. Show the licence on screen instead |
| Store and marketplace names | Don't say or show them. Credit prices generically |

## Numbers

Numbers that are spoken as quantities ("90 persen") follow the brief's `language` and `data.json`, not these rules. Use the digit-by-digit spelling only for codes and model names.

## Adding a rule

When a word comes out wrong in a voice, add a row here with the spelling that fixed it, once the person confirms it sounds right. Results vary by voice, so after generating, read `voice/transcript.json` and listen for these words.
