"""Generate Android mipmap icons using only Python stdlib — no dependencies."""
import struct, zlib, os

def make_png(w, h, r, g, b):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    hdr  = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    row  = b'\x00' + bytes([r, g, b] * w)
    idat = chunk(b'IDAT', zlib.compress(row * h, 9))
    iend = chunk(b'IEND', b'')
    return b'\x89PNG\r\n\x1a\n' + hdr + idat + iend

sizes = [
    ('mipmap-mdpi',    48),
    ('mipmap-hdpi',    72),
    ('mipmap-xhdpi',   96),
    ('mipmap-xxhdpi',  144),
    ('mipmap-xxxhdpi', 192),
]

base = os.path.join(os.path.dirname(__file__), '..', 'app', 'src', 'main', 'res')

for dirname, size in sizes:
    out_dir = os.path.join(base, dirname)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, 'ic_launcher.png')
    if os.path.exists(path):
        print(f'Skipping {dirname}/ic_launcher.png (already exists)')
        continue
    with open(path, 'wb') as f:
        f.write(make_png(size, size, 26, 157, 142))   # #1a9d8e teal fallback
    print(f'Created {dirname}/ic_launcher.png  ({size}x{size})')

print('All icons ready.')
