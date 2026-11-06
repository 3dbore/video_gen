# Finding more skills

The workspace needs nothing from this list. Skills run with your agent's full permissions, so read one before installing it, and put it in `.claude/skills/` for this project only.

| Source | What it is | Note |
|---|---|---|
| [awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills) | A long index of video skills | Its SAFE and CAUTION labels aren't explained, so don't rely on them |
| [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) | A Remotion and cloud-GPU toolkit, MIT | `video-design` here comes from it. The rest assumes Remotion |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | The motion taste skill, MIT | Already installed here as `motion-design` |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Official Remotion skills | Only useful if you add Remotion |
| [nateherkai/hyperframes-student-kit](https://github.com/nateherkai/hyperframes-student-kit) | A HyperFrames starter kit | Named in the article; not inspected |
| [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics) | Motion graphics skills | Named in the article; not inspected |
| [howseen-ai/claude-motion-design](https://github.com/howseen-ai/claude-motion-design) | Motion design skills | Named in the article; not inspected |
| [Mort1d/motion-graphics-skills](https://github.com/Mort1d/motion-graphics-skills) | An index of motion skills | Named in the article; not inspected |

HyperFrames' own registry of about 450 blocks is covered by `/hyperframes-registry`. Its install command, `hyperframes add`, copies a block's source into the composition.

To add a new skill to the pipeline, say which job it serves in that job's `SKILL.md`. The job's output file and gate stay the same.
