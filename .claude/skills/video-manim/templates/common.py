"""Shared helpers for 3D BORE math animations made with Manim.

Copy this file to projects/<id>/manim/common.py. Every math scene imports from it, so:
  - colours come from the project's design.md, never typed by hand
  - timing comes from scene/timing.js, so a note like "a beat late" re-renders, it doesn't re-write
  - numbers come from data.json
  - everything stays inside the brand's safe zones

The parsing helpers (palette, cue, figure, lint) need only Python and Node, so they work without Manim.
The scene helpers load only when Manim is installed.

Run `python common.py --selftest <project-dir>` to check the parsing against a real project.
Run `python common.py --lint <file.py> <project-dir>` to find colours that are not in design.md.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Canvas and safe zones (brand/DESIGN-VIDEO.md). 1080 x 1920, 9:16, 1 unit = 120 px.
# Manim's origin is the frame centre, +y is up.
# ---------------------------------------------------------------------------
PX_W, PX_H = 1080, 1920
FRAME_W, FRAME_H = 9.0, 16.0
PX = FRAME_W / PX_W                       # units per pixel (0.008333...)

SIDE_PX, TOP_PX, BOTTOM_PX = 64, 220, 380  # side margin, top safe zone, bottom safe zone
COPY_TOP_PX, COPY_GAP_PX = 1180, 40        # copy block starts here; keep this gap above it

X_MIN, X_MAX = -FRAME_W / 2 + SIDE_PX * PX, FRAME_W / 2 - SIDE_PX * PX
Y_MAX = FRAME_H / 2 - TOP_PX * PX                       # top of anything meaningful
Y_MIN_FULL = -FRAME_H / 2 + BOTTOM_PX * PX              # bottom, when math owns the whole scene
Y_MIN_STAGE = FRAME_H / 2 - (COPY_TOP_PX - COPY_GAP_PX) * PX  # bottom, when the copy block is shown

STAGE = dict(x_min=X_MIN, x_max=X_MAX, y_min=Y_MIN_STAGE, y_max=Y_MAX)  # 952 x 920 px
FULL = dict(x_min=X_MIN, x_max=X_MAX, y_min=Y_MIN_FULL, y_max=Y_MAX)    # 952 x 1320 px

# Stroke widths are given in screen pixels. Manim's stroke_width is not pixels, so every drawing
# helper converts through PX_PER_STROKE. First render of a film: measure a line in a still and, if the
# result is not 3 px, correct this one constant. Nothing else needs to change.
PX_PER_STROKE = 1.2
LINE_PX, FOCUS_PX, GRID_PX = 3, 5, 1       # Style A: 3 px outline, thicker for focus, hairline grid
SHADOW_PX = 10                             # Style A: hard 10 px drop shadow, no blur


# Same idea for type: Manim's font_size is not pixels. Measure the height of a capital H in a first still and
# correct this constant if the text is not the brand size. Nothing else needs to change.
FONT_SIZE_PER_PX = 0.84


def stroke(px: float) -> float:
    return px / PX_PER_STROKE


# ---------------------------------------------------------------------------
# Palette: read from the project's design.md
# ---------------------------------------------------------------------------
_HEX = r"#[0-9A-Fa-f]{6}\b"


def load_palette(design_md: str | Path) -> dict:
    """{'cobalt-surge': {50: '#EEF3FE', ...}, 'neutral': {'white': '#FFFFFF', ...}} from design.md."""
    text = Path(design_md).read_text(encoding="utf-8")
    front = text.split("---")[1] if text.startswith("---") else text
    palette: dict = {}
    for line in front.splitlines():
        m = re.match(r"\s{2}([a-z][a-z0-9-]*):\s*\{(.*)\}\s*$", line)
        if not m:
            continue
        name, body = m.group(1), m.group(2)
        stepped = re.findall(r'(\d+):\s*"(%s)"' % _HEX, body)
        named = re.findall(r'([a-z][a-z0-9-]*):\s*"(%s)"' % _HEX, body)
        if stepped:
            palette[name] = {int(k): v.upper() for k, v in stepped}
        elif named:
            palette[name] = {k: v.upper() for k, v in named}
    if not palette:
        raise ValueError(f"No colours found in {design_md}. design.md needs hex values in its front matter.")
    return palette


def allowed_colors(design_md: str | Path) -> set[str]:
    """Every hex colour anywhere in design.md. This is what the motion gate allows."""
    return {c.upper() for c in re.findall(_HEX, Path(design_md).read_text(encoding="utf-8"))}


class Brand:
    """Named access to the brand colours. Roles follow DESIGN.md and DESIGN-VIDEO.md Style A."""

    def __init__(self, design_md: str | Path):
        p = load_palette(design_md)
        self.p = p
        c, n, ch, b, ne = p["cobalt-surge"], p["midnight-navy"], p["electric-chartreuse"], p["blush-pop"], p["neutral"]
        self.white, self.void = ne["white"], ne["void-black"]
        self.cobalt, self.cobalt_50, self.cobalt_100 = c[500], c[50], c[100]
        self.cobalt_200, self.cobalt_300, self.cobalt_700, self.cobalt_800 = c[200], c[300], c[700], c[800]
        self.navy, self.navy_900 = n[500], n[900]
        self.chartreuse = ch[500]      # only on the element that moves or matters
        self.blush = b[500]            # one small spark at most
        self.fields = {"white": self.white, "cobalt": c[500], "navy": n[500], "chartreuse": ch[500]}

    def ink_on(self, field: str) -> str:
        """Text and outline colour that passes AA on a field (DESIGN.md section 3)."""
        return {"white": self.navy, "cobalt": self.white, "navy": self.white, "chartreuse": self.navy}[field]

    def grid_on(self, field: str) -> str:
        """Iso/graph grid colour per field (DESIGN-VIDEO.md 3.1)."""
        return {"white": self.cobalt_100, "cobalt": self.cobalt_300, "navy": self.cobalt_800, "chartreuse": self.cobalt_200}[field]


# ---------------------------------------------------------------------------
# Timing: read scene/timing.js, so the picture lands where the director said
# ---------------------------------------------------------------------------
def load_timing(timing_js: str | Path) -> dict:
    """timing.js is JavaScript with comments, so Node reads it. Returns {'film', 'beat', 'scenes', 'cues'}."""
    js = (
        "const vm=require('vm'),fs=require('fs');const ctx={window:{}};"
        "vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),ctx);"
        "process.stdout.write(JSON.stringify(ctx.window.TIMING))"
    )
    out = subprocess.run(["node", "-e", js, str(timing_js)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


class Clock:
    """Cue times for one scene, relative to the clip's own start (the clip begins at the scene start)."""

    def __init__(self, timing: dict, scene: str):
        if scene not in timing["scenes"]:
            raise KeyError(f'timing.js has no scene "{scene}"')
        s = timing["scenes"][scene]
        self.t = timing
        self.start, self.dur = float(s["start"]), float(s["dur"])
        self.fps = timing["film"]["fps"]
        self.beat = timing["beat"]

    def cue(self, name: str) -> float:
        """Seconds from the start of this clip. Fails loudly on a typo, like cue() in runtime.js."""
        if name not in self.t["cues"]:
            raise KeyError(f'timing.js has no cue "{name}"')
        rel = float(self.t["cues"][name]) - self.start
        if not (-1e-6 <= rel <= self.dur + 1e-6):
            raise ValueError(f'cue "{name}" is at {rel:.2f}s, outside this clip (0 to {self.dur}s)')
        return max(rel, 0.0)


# ---------------------------------------------------------------------------
# Data: every number shown comes from data.json, or is computed from numbers that do
# ---------------------------------------------------------------------------
def load_figures(data_json: str | Path) -> dict:
    d = json.loads(Path(data_json).read_text(encoding="utf-8"))
    return {f["id"]: f for f in d.get("figures", [])}


def figure(figures: dict, fid: str) -> dict:
    if fid not in figures:
        raise KeyError(f'data.json has no figure "{fid}". Add it with a source, or do not show it.')
    return figures[fid]


# ---------------------------------------------------------------------------
# Lint: colours in the .py must be in design.md (the HyperFrames gate cannot see inside a video)
# ---------------------------------------------------------------------------
_MANIM_NAMES = re.compile(
    r"\b(?:WHITE|BLACK|GRAY|GREY|RED|GREEN|BLUE|YELLOW|ORANGE|PURPLE|PINK|TEAL|GOLD|MAROON|"
    r"(?:LIGHT|DARK|PURE)_[A-Z]+|(?:RED|GREEN|BLUE|YELLOW|TEAL|PURPLE|GOLD|MAROON|GRAY)_[A-E])\b"
)


def lint_colors(py_file: str | Path, design_md: str | Path) -> list[str]:
    """Problems found in a scene file. Empty list means clean."""
    src = re.sub(r"#(?![0-9A-Fa-f]{6}\b).*$", "", Path(py_file).read_text(encoding="utf-8"), flags=re.M)
    ok = allowed_colors(design_md)
    errs = []
    for c in sorted({m.upper() for m in re.findall(_HEX, src)}):
        if c not in ok:
            errs.append(f"{c} is not in design.md")
    for n in sorted(set(_MANIM_NAMES.findall(src))):
        errs.append(f"Manim's named colour {n} is not a brand colour. Use Brand().<role> instead")
    return errs


# ---------------------------------------------------------------------------
# Scene helpers (need Manim)
# ---------------------------------------------------------------------------
try:
    from manim import (  # type: ignore
        Animation, Line, Mobject, Scene, ThreeDScene, VGroup, VMobject, config,
        Text, MathTex, Tex, Rectangle, DOWN, RIGHT, linear, smooth, ValueTracker,
    )

    def set_canvas(draft: bool = False) -> None:
        """Call once at import, before any Scene is built. Draft renders at half size, same layout."""
        config.pixel_width, config.pixel_height = (540, 960) if draft else (PX_W, PX_H)
        config.frame_width, config.frame_height = FRAME_W, FRAME_H
        config.frame_rate = 30            # match timing.js film.fps
        config.disable_caching = True      # deterministic, no stale partial movies

    def require_font(name: str = "Geom") -> None:
        """Fail loudly if Geom is not installed. Pango falls back silently, and a fallback ships a wrong font."""
        import manimpango
        if name not in manimpango.list_fonts():
            raise RuntimeError(f'Font "{name}" is not installed on this machine. Install Geom before rendering.')

    def hard_shadow(m: "Mobject", color: str, px: float = SHADOW_PX) -> "VGroup":
        """Style A shadow: an offset copy, no blur. Returns shadow+object so they move together."""
        s = m.copy().set_stroke(width=0).set_fill(color, opacity=1)
        s.shift(RIGHT * px * PX + DOWN * px * PX)
        return VGroup(s, m)

    def label(txt: str, brand: Brand, field: str, px: int = 28, weight: str = "NORMAL", color: str | None = None) -> "Text":
        """Brand text: Geom, sentence case. px is the brand type size (H3 36, body 26...).
        On a phone nothing goes below 28 px (the floor in /video-motion), so the default is 28."""
        return Text(txt, font="Geom", weight=weight, color=color or brand.ink_on(field), font_size=px * FONT_SIZE_PER_PX)

    def fit_in(m: "Mobject", box: dict) -> "Mobject":
        """Scale down (never up) so m fits the box, then keep it inside."""
        w, h = box["x_max"] - box["x_min"], box["y_max"] - box["y_min"]
        if m.width > w:
            m.scale_to_fit_width(w)
        if m.height > h:
            m.scale_to_fit_height(h)
        return m

    def inside(m: "Mobject", box: dict, tol: float = 1e-3) -> bool:
        return (m.get_left()[0] >= box["x_min"] - tol and m.get_right()[0] <= box["x_max"] + tol
                and m.get_bottom()[1] >= box["y_min"] - tol and m.get_top()[1] <= box["y_max"] + tol)

    class BoreScene(Scene):
        """Base for every math scene. Subclasses set FIELD, SCENE and use self.clock / self.brand."""
        FIELD = "navy"          # which brand field this scene sits on: white, cobalt, navy, chartreuse
        SCENE = ""              # the scene id in timing.js
        BOX = STAGE             # STAGE with the copy block, FULL when math owns the scene
        PROJECT = Path(".")     # set to the project folder

        def setup(self):
            require_font("Geom")
            self.brand = Brand(self.PROJECT / "design.md")
            self.clock = Clock(load_timing(self.PROJECT / "scene" / "timing.js"), self.SCENE)
            self.figures = load_figures(self.PROJECT / "data.json")
            self.camera.background_color = self.brand.fields[self.FIELD]

        def hold_until(self, cue: str) -> None:
            """Wait, without drawing, until the named cue. A negative gap means the beat before it is too long."""
            gap = self.clock.cue(cue) - self.time
            if gap < -1 / self.clock.fps:
                raise RuntimeError(f'Already {-gap:.2f}s past cue "{cue}". Shorten the beat before it.')
            if gap > 0:
                self.wait(gap)

        def play_to(self, cue: str, *anims, **kw) -> None:
            """Play animations so they finish exactly on the cue."""
            run = self.clock.cue(cue) - self.time
            if run <= 0:
                raise RuntimeError(f'Cue "{cue}" is not after the current time ({self.time:.2f}s).')
            self.play(*anims, run_time=run, **kw)

        def finish(self) -> None:
            """Hold the last frame to the scene's full length, so the clip is exactly dur seconds."""
            rest = self.clock.dur - self.time
            if rest < -1 / self.clock.fps:
                raise RuntimeError(f"Scene runs {-rest:.2f}s too long for its slot in timing.js.")
            if rest > 0:
                self.wait(rest)

        def check_margins(self, *mobs) -> None:
            """Call at the start, the end and the worst mid-transition frame of every beat."""
            for m in mobs:
                if not inside(m, self.BOX):
                    raise RuntimeError(f"{m} leaves the safe area {self.BOX}")

except ImportError:  # Manim not installed: parsing helpers above still work
    pass


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--selftest":
        proj = Path(sys.argv[2])
        b = Brand(proj / "design.md")
        print("fields:", b.fields)
        print("ink on navy:", b.ink_on("navy"), "| grid on cobalt:", b.grid_on("cobalt"))
        t = load_timing(proj / "scene" / "timing.js")
        first = next(iter(t["scenes"]))
        clk = Clock(t, first)
        print(f'scene "{first}": start {clk.start}s, dur {clk.dur}s, fps {clk.fps}, beat {clk.beat}s')
        print("stage px:", round((STAGE["x_max"] - STAGE["x_min"]) / PX), "x", round((STAGE["y_max"] - STAGE["y_min"]) / PX))
        print("full  px:", round((FULL["x_max"] - FULL["x_min"]) / PX), "x", round((FULL["y_max"] - FULL["y_min"]) / PX))
        print("figures:", list(load_figures(proj / "data.json")))
    elif len(sys.argv) >= 4 and sys.argv[1] == "--lint":
        problems = lint_colors(sys.argv[2], Path(sys.argv[3]) / "design.md")
        print("\n".join(problems) if problems else "clean")
        sys.exit(1 if problems else 0)
    else:
        print(__doc__)
