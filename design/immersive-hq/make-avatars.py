"""Crop a square portrait of each agent's robot from their office still -> assets/avatars/<id>.jpg.

Head positions are percentages of the 16:9 still (same numbers as HEAD in index.html).
Adjust a single agent with OVERRIDE = {"id": (x%, y%, size%)} where size is the crop side as a
percentage of the image height. Usage: python make-avatars.py
"""
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
HEAD = {"evan": (67, 20), "atlas": (55, 40), "claire": (47, 42), "flow": (62, 40), "ledger": (54, 34), "midas": (51, 28),
        "snake": (48, 33), "tube": (49, 37), "cammy": (41, 37), "mark": (48, 36), "simon": (50, 36), "marie": (45, 40),
        "gatekeeper": (47, 45), "lucy": (53, 44), "sofia": (47, 38), "iris": (48, 41), "maven": (48, 42),
        "booker": (47, 40), "scout": (53, 55), "echo": (50, 34), "alice": (46, 34)}
SIZE = 30          # crop side, % of image height: head plus a little shoulder
OVERRIDE = {  # hand-centred after reviewing the first crop
    "evan": (66, 12, 38),  # close-up office, so a larger crop
    "alice": (52, 34, 30), "cammy": (45, 37, 30), "echo": (54, 34, 30), "gatekeeper": (51, 45, 30),
    "mark": (51, 36, 30), "midas": (54, 28, 30), "sofia": (50, 38, 30), "scout": (57, 42, 30),
}
OUT = HERE / "assets" / "avatars"
OUT.mkdir(parents=True, exist_ok=True)

for agent, (x, y) in HEAD.items():
    src = HERE / "assets" / f"{agent}-still.jpg"
    im = Image.open(src).convert("RGB")
    w, h = im.size
    x, y, size = OVERRIDE.get(agent, (x, y, SIZE))
    side = h * size / 100
    cx, cy = w * x / 100, h * (y + size * 0.12) / 100   # nudge down so the face sits centered
    box = [cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2]
    # keep the crop inside the image
    dx = max(0, -box[0]) - max(0, box[2] - w)
    dy = max(0, -box[1]) - max(0, box[3] - h)
    box = [box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy]
    im.crop([round(v) for v in box]).resize((192, 192), Image.LANCZOS).save(OUT / f"{agent}.jpg", quality=88)
print(f"wrote {len(HEAD)} avatars to {OUT}")
