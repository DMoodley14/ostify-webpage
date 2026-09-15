#!/usr/bin/env python3
"""Generate the trabecular artwork on the home page.

Ostify is named for bone, and the three products are named for bone cells —
osteoblast, osteoclast, osteocyte. Trabecular bone is not a network of lines;
it is a porous solid, a continuous material threaded with voids, denser where
it carries load. That is what these draw: a field of brand-green material with
organic pores cut out of it, the pores opening up or closing down across the
frame according to a density field.

Deterministic — the same seed always produces the same artwork. Re-run after
changing anything here, and commit the resulting SVG.

    python3 tools/make-patterns.py
"""

import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "images" / "pattern"

# The site palette, deepest material first.
# Kept light: this sits beside body copy and must never compete with it.
INK = "#4A6152"
DEEP = "#6B8270"
MID = "#8CA08A"
SOFT = "#AABBA7"
PALE = "#C8D3C6"


def lerp(a, b, t):
    return a + (b - a) * t


def clamp01(v):
    return max(0.0, min(1.0, v))


def pore_path(cx, cy, r, rng, lobes=None, wobble=0.30):
    """A closed rounded blob, drawn as a cubic path through jittered points.

    Pores in bone are not circles. Perturbing the radius per control point and
    joining them with smooth curves gives a void that reads as organic without
    looking noisy.
    """
    lobes = lobes or rng.choice((5, 6, 6, 7))
    start = rng.uniform(0, math.tau)
    pts = []
    for i in range(lobes):
        a = start + math.tau * i / lobes
        rr = r * (1.0 + rng.uniform(-wobble, wobble))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))

    # Catmull-Rom through the points, converted to cubic beziers.
    d = [f"M{pts[0][0]:.0f},{pts[0][1]:.0f}"]
    n = len(pts)
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(
            f"C{c1[0]:.0f},{c1[1]:.0f} {c2[0]:.0f},{c2[1]:.0f} {p2[0]:.0f},{p2[1]:.0f}"
        )
    d.append("Z")
    return "".join(d)


def draw(name, w, h, seed, spacing, density, material=DEEP, wobble=0.30):
    """density(u) -> 0..1 across the width. 1 is dense material (small pores)."""
    rng = random.Random(seed)

    pores = []
    rows = int(h / (spacing * 0.86)) + 3
    cols = int(w / spacing) + 3
    for r in range(rows):
        for c in range(cols):
            x = (c + (0.5 if r % 2 else 0.0)) * spacing - spacing
            y = r * spacing * 0.86 - spacing
            x += rng.uniform(-0.26, 0.26) * spacing
            y += rng.uniform(-0.26, 0.26) * spacing
            t = clamp01(density(clamp01(x / w)))
            # Dense material -> small pores; sparse -> pores open out and merge.
            radius = spacing * lerp(0.56, 0.33, t) * rng.uniform(0.88, 1.12)
            pores.append((x, y, radius, t))

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" role="presentation" aria-hidden="true" '
        'preserveAspectRatio="xMidYMid slice">',
        "<defs>",
        # The material is not flat: it deepens with the density field.
        f'<linearGradient id="m{seed}" x1="0" y1="0" x2="1" y2="0">',
    ]
    for i in range(6):
        u = i / 5
        t = clamp01(density(u))
        stop = [PALE, SOFT, MID, DEEP, INK][min(4, int(t * 4.999))]
        parts.append(f'<stop offset="{u:.2f}" stop-color="{stop}"/>')
    parts.append("</linearGradient>")

    # Every pore goes into one mask, so overlapping voids merge into a single
    # continuous shape rather than stacking visible edges on one another.
    parts.append(f'<mask id="p{seed}">')
    parts.append(f'<rect width="{w}" height="{h}" fill="#fff"/>')
    for x, y, radius, t in pores:
        parts.append(f'<path d="{pore_path(x, y, radius, rng, wobble=wobble)}" fill="#000"/>')
    parts.append("</mask>")
    parts.append("</defs>")

    parts.append(f'<rect width="{w}" height="{h}" fill="#FFFFFF"/>')
    parts.append(
        f'<rect width="{w}" height="{h}" fill="url(#m{seed})" mask="url(#p{seed})"/>'
    )
    parts.append("</svg>")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.svg"
    path.write_text("\n".join(parts))
    kb = path.stat().st_size / 1024
    print(f"{path.relative_to(OUT.parent.parent)}  {len(pores)} pores, {kb:.0f} KB")


# One piece, on the home page, immediately after the three products are named.
# The field runs from open at the left to dense at the right: loose content
# becoming something that carries load.
draw("home", 2400, 940, seed=17, spacing=54, density=lambda u: u ** 1.25)
