#!/usr/bin/env python3
"""Génère les icônes PNG de Focal dans ../icons : icon-192, icon-512, maskable-512, apple-touch-icon (180).

Dessin : fond nuit (#0C0B0A), anneau de progression aux trois quarts dans l'accent du thème Nuit, point central.
Aucune transparence : iOS préfère des icônes opaques et applique lui-même son masque arrondi.
"""
import math
import os

from PIL import Image, ImageDraw

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons"))
SIZE = 1024
SS = 4  # suréchantillonnage pour des bords nets
BG = (12, 11, 10)


def oklch_to_rgb(L, C, h):
    a = C * math.cos(math.radians(h))
    b = C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def gam(c):
        c = max(0.0, min(1.0, c))
        return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055

    return tuple(round(gam(c) * 255) for c in (r, g, bb))


ACCENT = oklch_to_rgb(0.84, 0.13, 75)


def draw(shrink=0.0):
    """shrink : réduction du motif (0.0 = normal, 0.06 = version maskable avec marge de sécurité)."""
    s = SIZE * SS
    img = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(img)
    cx = cy = s / 2
    r = s * (0.30 - shrink)
    w = s * 0.075
    box = (cx - r - w / 2, cy - r - w / 2, cx + r + w / 2, cy + r + w / 2)
    # piste
    d.ellipse(box, outline=(34, 32, 30), width=int(w))
    # arc : de midi, dans le sens horaire, jusqu'à 9 h (trois quarts)
    d.arc(box, start=-90, end=180, fill=ACCENT, width=int(w))
    for ang in (-90, 180):
        x = cx + r * math.cos(math.radians(ang))
        y = cy + r * math.sin(math.radians(ang))
        d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=ACCENT)
    # point central
    cr = s * 0.06
    d.ellipse((cx - cr, cy - cr, cx + cr, cy + cr), fill=ACCENT)
    return img.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    base = draw()
    base.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "icon-512.png"), optimize=True)
    base.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, "icon-192.png"), optimize=True)
    base.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, "apple-touch-icon.png"), optimize=True)
    draw(shrink=0.06).resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "maskable-512.png"), optimize=True)
    print("icônes écrites dans", OUT, "accent", ACCENT)


if __name__ == "__main__":
    main()
