# References

The one place for every video reference, used by all films.

- **Downloaded videos:** put them in this folder, not in a subfolder. `.mp4`, `.mov`, `.webm`, `.mkv`, `.m4v` and `.avi` all work.
- **URLs:** add them to `urls.txt`, one per line. Notes go on their own line, starting with `#`.

Git ignores the videos. It keeps this file, `urls.txt` and the written studies.

## How films use it

A brief that doesn't name a reference draws on this whole folder. `node tools/video.mjs new` records the folder's current contents in `projects/<id>/references.json`, so clips you add later only reach new films.

The reference job studies each video once and saves what it finds in `studies/<name>/study.md`. Later films reuse that study. For each film, it then picks what fits: at most one clip sets the pace, some supply one technique for one place, and the rest are skipped.

To steer a film, set `reference` in its brief:

| In the brief | What happens |
|---|---|
| Nothing | Draws on this whole folder |
| `reference: none` | Uses the house style |
| A list using `from: my-clip.mp4` and a `why` | Uses only those videos from this folder |

## Good to know

- **Disk space:** videos stay here and aren't copied into projects, but this folder still takes up disk. A URL downloads once at up to 720p, into its study folder. Frames are deleted once a study is written.
- **Replacing a video:** to study a changed video again under the same name, delete its folder in `studies/`.
- **Rights:** films take pacing and technique from these videos, never their footage, characters, branding or music.
