"""Repaint the misspelled words in the office photos.

The office stills are AI renders, so their screens, books and nameplates carry garbled text.
For every line listed in stills-src/fixes.py this erases the old letters (inpainting
from the surrounding pixels) and draws the correct words back in at the same size, tilt,
colour and glow. Line positions come from stills-src/ocr.json (RapidOCR, percent quads).

  python fix-stills.py            # every office in stills-src/fixes.py
  python fix-stills.py simon iris # just these

Reads stills-src/<id>-still.jpg (the untouched originals), writes assets/<id>-still.jpg.
Fix values: "text" = left aligned, "^text" = centred, ">text" = right aligned, "" = erase only.
"add" entries take an explicit quad [x1,y1, x2,y2, x3,y3, x4,y4] in percent (tl, tr, br, bl).
"""
import json, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).parent
SRC = HERE / "stills-src"
FONTS = {
    "sans": "C:/Windows/Fonts/segoeui.ttf",
    "sansb": "C:/Windows/Fonts/segoeuib.ttf",
    "semi": "C:/Windows/Fonts/seguisb.ttf",
    "caps": "C:/Windows/Fonts/bahnschrift.ttf",
}


def font(name, size):
    p = FONTS.get(name, FONTS["sans"])
    if not Path(p).exists():
        p = FONTS["sans"]
    return ImageFont.truetype(p, max(6, int(size)))


def quad_px(q, W, H):
    return np.array([[q[0] * W / 100, q[1] * H / 100], [q[2] * W / 100, q[3] * H / 100],
                     [q[4] * W / 100, q[5] * H / 100], [q[6] * W / 100, q[7] * H / 100]], np.float32)


def grow(P, gx, gy):
    """Expand a quad outward along its own axes."""
    ux = P[1] - P[0]; ux /= np.linalg.norm(ux) + 1e-6
    uy = P[3] - P[0]; uy /= np.linalg.norm(uy) + 1e-6
    d = [(-gx, -gy), (gx, -gy), (gx, gy), (-gx, gy)]
    return np.array([P[i] + ux * a + uy * b for i, (a, b) in enumerate(d)], np.float32)


def erase_and_sample(img, lab, P):
    """Mask the text pixels inside quad P (worked in a local crop for speed).

    Returns (mask crop, crop origin, text colour, ink height in px or None)."""
    H, W = img.shape[:2]
    h = np.linalg.norm(P[3] - P[0])
    ring = grow(P, h * .45, h * .40)
    x0, y0 = np.floor(ring.min(0)).astype(int); x1, y1 = np.ceil(ring.max(0)).astype(int)
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W, x1 + 1), min(H, y1 + 1)
    o = np.float32([x0, y0])
    L = lab[y0:y1, x0:x1]; I = img[y0:y1, x0:x1]
    hh, ww = L.shape[:2]
    inner = grow(P, h * .12, h * .10) - o
    m_in = np.zeros((hh, ww), np.uint8); cv2.fillPoly(m_in, [inner.astype(np.int32)], 255)
    m_ring = np.zeros((hh, ww), np.uint8); cv2.fillPoly(m_ring, [(ring - o).astype(np.int32)], 255)
    m_ring[m_in > 0] = 0
    if not (m_in > 0).any():
        return np.zeros((hh, ww), np.uint8), o, np.array([230, 230, 230]), None
    bg_lab = np.median(L[m_ring > 0], axis=0) if (m_ring > 0).any() else np.median(L[m_in > 0], axis=0)
    dist = np.linalg.norm(L - bg_lab, axis=2)
    inside = m_in > 0
    thr = max(14.0, np.percentile(dist[inside], 55))
    txt = (dist > thr) & inside
    ink = None
    if txt.any():
        core = txt & (dist >= np.percentile(dist[txt], 70))
        col = np.median(I[core], axis=0)
        m_box = np.zeros((hh, ww), np.uint8); cv2.fillPoly(m_box, [(P - o).astype(np.int32)], 255)
        ys, xs = np.nonzero(txt & (m_box > 0))
        if len(xs) > 20:
            uy = (P[3] - P[0]) / (np.linalg.norm(P[3] - P[0]) + 1e-6)
            v = (np.stack([xs, ys], 1).astype(np.float32) + o - P[0]) @ uy
            hist = np.convolve(np.bincount(np.clip(v, 0, None).astype(int)), np.ones(2) / 2, mode="same")
            pk = int(np.argmax(hist)); lim = hist[pk] * .12; t = b_ = pk
            while t > 0 and hist[t - 1] >= lim: t -= 1
            while b_ < len(hist) - 1 and hist[b_ + 1] >= lim: b_ += 1
            ink = float(b_ + 1 - t)
    else:
        col = np.array([230, 230, 230])
    mask = txt.astype(np.uint8) * 255
    k = max(2, int(h * .10))
    mask = cv2.dilate(mask, np.ones((k, k), np.uint8)) & m_in
    return mask, o, col, ink


def is_caps(t):
    letters = [c for c in t if c.isalpha()]
    return bool(letters) and sum(c.isupper() for c in letters) / len(letters) > .8


def latin(s):
    s = "".join(ch for ch in s if ord(ch) < 0x250)
    return s if any(ch.isalpha() for ch in s) else ""


def draw_text(canvas, P, text, color, align, style, ink, proxy=""):
    """Render text into an RGBA layer and warp it onto quad P, matching the old letters' size and baseline."""
    if not text:
        return canvas
    Wq = float(np.linalg.norm(P[1] - P[0])); Hq = float(np.linalg.norm(P[3] - P[0]))
    S = 3  # supersample
    caps = text.upper() == text and any(c.isalpha() for c in text)
    fname = style.get("font") or ("semi" if caps else "sans")
    proxy = latin(proxy) or text
    old_caps = is_caps(proxy)
    f100 = font(fname, 100)
    pb = f100.getbbox("H" if old_caps else "Hg")
    if style.get("fit"):
        size = Hq * S * (0.80 if caps else 0.86)
    else:
        size = S * style.get("_heff", Hq) * ink[old_caps]
    size *= style.get("scale", 1.0)

    def measure(sz, tr):
        ff = font(fname, sz)
        return ff, sum(ff.getlength(ch) for ch in text) + tr * (len(text) - 1)

    track = size * style.get("ls", 0)
    f, tw = measure(size, track)
    x0 = max(0.0, (1 - ink[old_caps]) * Hq / 2) * S if (align == "l" and not style.get("fit")) else 0.0  # the detector pads its box by about this much
    target = Wq * S - x0
    grow_max = style.get("grow", 1.35 if align == "l" else 1.0)
    if tw > target and grow_max > 1:
        # let a longer phrase run a little past the old word instead of shrinking it
        g = min(grow_max, (tw + x0) / (Wq * S))
        P = P.copy(); P[1] += (P[1] - P[0]) * (g - 1); P[2] += (P[2] - P[3]) * (g - 1)
        Wq *= g; target = Wq * S - x0
    if style.get("track") and caps and tw < target:
        track = min((target - tw) / max(1, len(text) - 1), size * .35)
        f, tw = measure(size, track)
    sx = 1.0
    if tw > target * 1.02:
        sx = max(.8, target * 1.02 / tw)
        if tw * sx > target * 1.04:
            size *= (target * 1.04) / (tw * sx)
            f, tw = measure(size, track)
    pad = int(Hq * S * .8)
    full_w = Wq * S
    layer = Image.new("RGBA", (int(max(tw, full_w) / min(sx, 1) + pad * 2), int(Hq * S + pad * 2)), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    scale = size / 100
    # centre the old word's ink box on the detector box, then draw on that baseline
    y = pad + (Hq * S - (pb[3] - pb[1]) * scale) / 2 - pb[1] * scale
    if align == "c":
        x = pad + full_w / 2 / sx - tw / 2
    elif align == "r":
        x = pad + (full_w - x0) / sx - tw
    else:
        x = pad + x0 / sx
    rgb = tuple(int(c) for c in color[::-1])
    cx = x
    for ch in text:
        d.text((cx, y), ch, font=f, fill=rgb + (255,))
        cx += f.getlength(ch) + track
    if sx != 1.0:
        layer = layer.resize((max(1, int(layer.width * sx)), layer.height), Image.LANCZOS)
    glow = style.get("glow", .55)
    if glow:
        g = layer.filter(ImageFilter.GaussianBlur(size * .16))
        a = np.array(g); a[..., 3] = (a[..., 3] * glow).astype(np.uint8)
        layer = Image.alpha_composite(Image.fromarray(a), layer)
    L = np.array(layer)
    pw = pad * sx
    src = np.float32([[pw, pad], [pw + full_w, pad], [pw + full_w, pad + Hq * S], [pw, pad + Hq * S]])
    # warp only into the patch of the photo the layer lands on
    corners = cv2.perspectiveTransform(np.float32([[[0, 0], [L.shape[1], 0], [L.shape[1], L.shape[0]], [0, L.shape[0]]]]),
                                       cv2.getPerspectiveTransform(src, P))[0]
    Hh, Ww = canvas.shape[:2]
    bx0, by0 = np.maximum(0, np.floor(corners.min(0)).astype(int)); bx1, by1 = np.minimum([Ww, Hh], np.ceil(corners.max(0)).astype(int) + 1)
    if bx1 <= bx0 or by1 <= by0:
        return canvas
    M = cv2.getPerspectiveTransform(src, P - np.float32([bx0, by0]))
    warped = cv2.warpPerspective(L, M, (int(bx1 - bx0), int(by1 - by0)), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0))
    a = warped[..., 3:4].astype(np.float32) / 255
    region = canvas[by0:by1, bx0:bx1].astype(np.float32)
    canvas[by0:by1, bx0:bx1] = (region * (1 - a) + warped[..., :3][..., ::-1].astype(np.float32) * a).astype(np.uint8)
    return canvas


def run(agent, spec, ocr):
    src = SRC / f"{agent}-still.jpg"
    img = cv2.imread(str(src))
    H, W = img.shape[:2]
    rows = ocr.get(agent, [])
    jobs = []
    for k, v in (spec.get("fix") or {}).items():
        if v is None:
            continue
        r = rows[int(k)]
        if isinstance(v, dict):
            jobs.append((v.get("q", r["q"]), v["t"], v, r["t"], None if "q" in v else int(k)))
        else:
            jobs.append((r["q"], v, {}, r["t"], int(k)))
    for a in spec.get("add") or []:
        jobs.append((a["q"], a["t"], {"fit": True, **a}, "", None))  # hand-placed boxes are drawn tight to the letters
    style_all = spec.get("style", {})
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    # photo-wide ratio of letter height to detector box height (the detector pads its boxes)
    # glyph size as a share of the detector's box height; the detector pads boxes differently per photo
    k = {True: .80, False: .86, **{c == "caps": v for c, v in spec.get("k", {}).items()}}
    # lines in one column of one panel share a size: use the median box height of the column
    hs = [float(np.linalg.norm(quad_px(r["q"], W, H)[3] - quad_px(r["q"], W, H)[0])) for r in rows]
    parent = list(range(len(rows)))
    def root(i):
        while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for i, a_ in enumerate(rows):
        for j in range(i + 1, len(rows)):
            b2 = rows[j]
            if abs(a_["q"][0] - b2["q"][0]) < .7 and abs(a_["q"][1] - b2["q"][1]) < 12 and min(hs[i], hs[j]) / max(hs[i], hs[j], 1) > .6:
                parent[root(i)] = root(j)
    groups = {}
    for i in range(len(rows)): groups.setdefault(root(i), []).append(hs[i])
    heff = {i: float(np.median(groups[root(i)])) for i in range(len(rows))}
    plans = []
    full = np.zeros((H, W), np.uint8)
    for q, v, st, proxy, ri in jobs:
        P = quad_px(q, W, H)
        mask, o, col, _ = erase_and_sample(img, lab, P)
        y0, x0 = int(o[1]), int(o[0]); full[y0:y0 + mask.shape[0], x0:x0 + mask.shape[1]] |= mask
        align = "l"
        if v and v[0] in "^>":
            align = "c" if v[0] == "^" else "r"; v = v[1:]
        st = {**style_all, **st}
        if ri is not None:
            st["_heff"] = heff[ri]
        plans.append((P, v, col, k, proxy or v, align, st))
    out = cv2.inpaint(img, full, 5, cv2.INPAINT_TELEA)
    for P, v, col, k_, proxy, align, st in plans:
        if st.get("fill"):
            # flat panel colour under the text (for plaques where inpainting leaves glow smears)
            c = st["fill"].lstrip("#"); bgr = (int(c[4:6], 16), int(c[2:4], 16), int(c[0:2], 16))
            m = np.zeros(out.shape[:2], np.uint8); cv2.fillPoly(m, [P.astype(np.int32)], 255)
            m = cv2.GaussianBlur(m, (0, 0), max(1.5, float(np.linalg.norm(P[3] - P[0])) * .15)).astype(np.float32)[..., None] / 255
            out[:] = (out * (1 - m) + np.array(bgr, np.float32) * m).astype(np.uint8)
    for P, v, col, ink, proxy, align, st in plans:
        if st.get("color"):
            c = st["color"].lstrip("#"); col = np.array([int(c[4:6], 16), int(c[2:4], 16), int(c[0:2], 16)])
        else:
            # lift the sampled colour a touch so repainted words read crisply
            col = np.clip(col.astype(np.float32) * 1.06 + 6, 0, 255)
        draw_text(out, P, v, col, align, st, ink, proxy)
    dst = HERE / "assets" / f"{agent}-still.jpg"
    cv2.imwrite(str(dst), out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    print(f"{agent}: {len(plans)} lines repainted -> {dst.relative_to(HERE)}")


if __name__ == "__main__":
    import importlib.util
    spec = importlib.util.spec_from_file_location("fixes", SRC / "fixes.py")
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    fixes = mod.FIX
    ocr = json.loads((SRC / "ocr.json").read_text(encoding="utf-8"))
    for agent in (sys.argv[1:] or fixes.keys()):
        run(agent, fixes[agent], ocr)
