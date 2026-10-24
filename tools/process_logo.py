#!/usr/bin/env python3
"""Convert rendered logo PDF pages into transparent PNGs for the website.

page1.png: stacked logo on white background  -> pioneerhorizon-logo-dark.png (use on light bg)
page2.png: stacked logo on dark gray bg      -> pioneerhorizon-logo-light.png (use on dark bg)
"""
from PIL import Image
from collections import deque

OUT_DIR = "/Users/nil/workspace/hdgk-work/haobaowebsite/img/brand"

def flood_bg_mask(im, bg, tol, top_crop=0):
    """Return list of bytearrays (255=background) for pixels connected to the
    image border whose color is within `tol` of `bg`."""
    w, h = im.size
    px = im.load()
    mask = [bytearray(w) for _ in range(h)]
    q = deque()

    def near(c):
        return abs(c[0]-bg[0]) <= tol and abs(c[1]-bg[1]) <= tol and abs(c[2]-bg[2]) <= tol

    def push(x, y):
        if 0 <= x < w and 0 <= y < h and not mask[y][x]:
            mask[y][x] = 255
            q.append((x, y))

    y0 = top_crop
    for x in range(w):
        c = px[x, y0]
        if near(c):
            push(x, y0)
    for y in range(y0, h):
        for x in (0, w-1):
            if near(px[x, y]):
                push(x, y)

    while q:
        x, y = q.popleft()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x+dx, y+dy
            if 0 <= nx < w and y0 <= ny < h and not mask[ny][nx] and near(px[nx, ny]):
                mask[ny][nx] = 255
                q.append((nx, ny))
    return mask

def dist(c, bg):
    return max(abs(c[0]-bg[0]), abs(c[1]-bg[1]), abs(c[2]-bg[2]))

def process(src, dst, bg, tol, top_crop=0):
    im = Image.open(src).convert("RGB")
    if top_crop:
        im = im.crop((0, top_crop, im.width, im.height))
    w, h = im.size
    px = im.load()
    mask = flood_bg_mask(im, bg, tol, top_crop=0)

    out = Image.new("RGBA", (w, h))
    opx = out.load()

    # feather band: opaque pixels within `band` px of the background get
    # alpha proportional to their distance from bg (soft anti-aliased edge)
    BAND = 3
    alpha_map = [[255]*w for _ in range(h)]
    for y in range(h):
        mrow = mask[y]
        for x in range(w):
            if mrow[x]:
                continue
            near_bg = False
            for dy in range(-BAND, BAND+1):
                yy = y+dy
                if yy < 0 or yy >= h:
                    continue
                m2 = mask[yy]
                for dx in range(-BAND, BAND+1):
                    xx = x+dx
                    if 0 <= xx < w and m2[xx]:
                        near_bg = True
                        break
                if near_bg:
                    break
            if near_bg:
                d = dist(px[x, y], bg)
                a = int(max(0.0, min(1.0, d / tol)) * 255)
                alpha_map[y][x] = a

    for y in range(h):
        mrow = mask[y]
        arow = alpha_map[y]
        for x in range(w):
            if mrow[x]:
                opx[x, y] = (0, 0, 0, 0)
            else:
                r, g, b = px[x, y]
                opx[x, y] = (r, g, b, arow[x])

    # crop to content bbox with margin
    bbox = out.getbbox()
    if bbox:
        pad = 8
        l = max(0, bbox[0]-pad); t = max(0, bbox[1]-pad)
        r = min(w, bbox[2]+pad); b = min(h, bbox[3]+pad)
        out = out.crop((l, t, r, b))
    out.save(dst, optimize=True)
    print(dst, out.size)

# 1) light-background variant (navbar): white bg
process("/tmp/logo_render/page1.png", f"{OUT_DIR}/pioneerhorizon-logo-dark.png",
        bg=(255, 255, 255), tol=30)
# 2) dark-background variant (footer): gray bg; crop 3 white artifact rows
process("/tmp/logo_render/page2.png", f"{OUT_DIR}/pioneerhorizon-logo-light.png",
        bg=(80, 80, 76), tol=42, top_crop=3)
