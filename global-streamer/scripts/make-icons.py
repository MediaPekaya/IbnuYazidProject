"""Jana set ikon daripada logo sumber: python3 scripts/make-icons.py <logo.png>
Menghasilkan renderer/assets/* (favicon, PWA, apple-touch, logo) dan build/icon.ico (Windows)."""
import sys, os
from PIL import Image
src = sys.argv[1]
root = os.path.join(os.path.dirname(__file__), '..')
A = os.path.join(root, 'renderer', 'assets'); B = os.path.join(root, 'build')
os.makedirs(A, exist_ok=True); os.makedirs(B, exist_ok=True)
im = Image.open(src).convert('RGBA')
im = im.crop(im.getbbox())           # buang ruang lutsinar di tepi
def fit(img, size, pad=0.0, bg=None):
    s = int(size * (1 - 2 * pad))
    r = img.copy(); r.thumbnail((s, s), Image.LANCZOS)
    c = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    c.alpha_composite(r, ((size - r.width) // 2, (size - r.height) // 2))
    return c
DARK = (4, 7, 15, 255)
fit(im, 512).save(f'{A}/logo-512.png', optimize=True)
fit(im, 192).save(f'{A}/logo-192.png', optimize=True)
fit(im, 96).save(f'{A}/logo-96.png', optimize=True)
fit(im, 48).save(f'{A}/favicon-48.png', optimize=True)
fit(im, 32).save(f'{A}/favicon-32.png', optimize=True)
fit(im, 16).save(f'{A}/favicon-16.png', optimize=True)
fit(im, 180, 0.06, DARK).convert('RGB').save(f'{A}/apple-touch-icon.png', optimize=True)   # iOS: tanpa lutsinar
fit(im, 512, 0.14, DARK).convert('RGB').save(f'{A}/icon-maskable-512.png', optimize=True)  # Android: zon selamat 80%
fit(im, 192, 0.14, DARK).convert('RGB').save(f'{A}/icon-maskable-192.png', optimize=True)
sizes = [16, 24, 32, 48, 64, 128, 256]
ico = [fit(im, s) for s in sizes]
ico[-1].save(f'{A}/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[])  # laman web: kecil
big = fit(im, 256)
big.save(f'{B}/icon.ico', format='ICO', sizes=[(s, s) for s in sizes])  # Windows (pemasang + .exe + pintasan)
fit(im, 512).save(f'{B}/icon.png', optimize=True)
# kad kongsi sosial 1200x630
og = Image.new('RGBA', (1200, 630), DARK)
l = fit(im, 560); og.alpha_composite(l, (320, 35))
og.convert('RGB').save(f'{A}/og-image.png', optimize=True)
print('ok')
