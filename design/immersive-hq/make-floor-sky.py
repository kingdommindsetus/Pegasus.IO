"""Build the two images that make the Employee Floor window feel alive.

assets/floor-sky-mask.png  - the open sky in the city window (white = sky), so clouds pass
                             behind the skyscrapers and window frames, never in front.
assets/floor-clouds.png    - a soft, horizontally tileable band of sunset clouds that the
                             page drifts slowly across that mask.
Run: python make-floor-sky.py   (reads stills-src/floor-still.jpg)
"""
from pathlib import Path
import cv2
import numpy as np

HERE = Path(__file__).parent
WIN = (37.4, 45.6, 58.4, 62.0)  # window glass, percent of the frame: x0, y0, x1, y1

img = cv2.imread(str(HERE / "stills-src" / "floor-still.jpg"))
H, W = img.shape[:2]
x0, y0, x1, y1 = int(WIN[0] * W / 100), int(WIN[1] * H / 100), int(WIN[2] * W / 100), int(WIN[3] * H / 100)
crop = img[y0:y1, x0:x1]
lab = cv2.cvtColor(cv2.GaussianBlur(crop, (3, 3), 0), cv2.COLOR_BGR2LAB).astype(np.float32)
h, w = lab.shape[:2]
mask = np.zeros((h, w), np.float32)
# walk down each column from the top of the glass; the sky changes smoothly, so the first sharp
# jump in colour is the skyline (or a window frame) and everything below it stays solid
L = lab[..., 0]
colL = np.median(L[3:h // 3], axis=0)
frame = colL < np.convolve(colL, np.ones(15) / 15, mode="same") - 9  # dark mullions
start = int(h * .08)
for x in range(w):
    if frame[x]:
        continue
    for y in range(start, h - 2):
        if np.linalg.norm(lab[y + 2, x] - lab[y - 2, x]) > 16:
            mask[start:y - 1, x] = 1
            break
    else:
        mask[start:, x] = 1
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 2), np.float32))
mask = cv2.GaussianBlur(mask, (0, 0), 1.2)
cv2.imwrite(str(HERE / "assets" / "floor-sky-mask.png"), (mask * 255).astype(np.uint8))

# tileable sunset clouds: fractal noise stretched wide, lit warm from below
rng = np.random.default_rng(7)
CW, CH = 1024, 256
acc = np.zeros((CH, CW), np.float32)
amp, tot = 1.0, 0.0
for octave in range(6):
    gx, gy = 4 * 2 ** octave, 2 * 2 ** octave
    g = rng.random((gy + 1, gx)).astype(np.float32)
    g = np.concatenate([g, g[:, :1]], axis=1)  # wrap horizontally
    layer = cv2.resize(g, (CW + CW // gx, CH), interpolation=cv2.INTER_CUBIC)[:, :CW]
    acc += amp * layer; tot += amp; amp *= .5
n = acc / tot
band = np.exp(-((np.linspace(0, 1, CH)[:, None] - .5) / .32) ** 2)  # thicker in the middle of the band
a = np.clip((n - .48) * 3.2, 0, 1) * band
a = cv2.GaussianBlur(a, (0, 0), 2.5)
t = np.linspace(0, 1, CH)[:, None]
col = np.empty((CH, CW, 3), np.float32)  # BGR: cool lavender tops, peach undersides
col[..., 0] = 235 - 95 * t
col[..., 1] = 190 - 20 * t
col[..., 2] = 225 + 25 * t
rgba = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
cv2.imwrite(str(HERE / "assets" / "floor-clouds.png"), rgba)
print("mask", mask.shape, "sky share", round(float((mask > .5).mean()), 2))
