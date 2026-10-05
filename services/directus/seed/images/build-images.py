"""Sinh bộ ảnh DEMO (máy tính cổ) cho seed — DEV-only. Chạy MỘT LẦN, ảnh đầu ra được commit.

Nguồn: Wikimedia Commons (giấy phép CC BY / CC BY-SA / CC0 / Public domain). Danh sách ảnh ở sources.json
(key → tên file Commons). Script tải bản thumbnail 1280px qua API, áp "tông giấy cũ" nhẹ (giảm bão hoà, ấm,
nền trắng → màu giấy của site, grain) rồi cắt 1200×630, và ghi CREDITS.md (tác giả/giấy phép/link) từ metadata API.

  python services/directus/seed/images/build-images.py      (cần Pillow + mạng; tôn trọng rate-limit Commons)
"""
import html, io, json, os, re, time, urllib.parse, urllib.request
from PIL import Image, ImageChops, ImageEnhance, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "retro-blog-seed/1.0 (dev demo images; local use)"}
# điểm neo cắt (x, y) khi tỉ lệ ảnh gốc khác 1.9:1 — mặc định (0.5, 0.5)
CENTER = {"vt100": (0.5, 0.3), "mac128": (0.5, 0.45), "crt-monitor": (0.5, 0.4), "ascii": (0.5, 0.05),
          "hdd": (0.5, 0.5), "retro-lab": (0.5, 0.55), "gameboy": (0.5, 0.45), "altair": (0.5, 0.5)}
# avatar: chân dung bằng đồ vật (không dùng ảnh người thật): key → nguồn
AVATARS = {"avatar-keyboard": "smk-switch", "avatar-floppy": "floppy-disks", "avatar-chip": "motherboard-2"}


def api_info(title):
    p = {"action": "query", "format": "json", "titles": title, "prop": "imageinfo", "iiprop": "url|extmetadata",
         "iiurlwidth": "1280"}
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p)
    for attempt in range(6):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60))
            return next(iter(d["query"]["pages"].values()))["imageinfo"][0]
        except Exception:
            time.sleep(8 * (attempt + 1))
    raise RuntimeError("API lỗi: " + title)


def get(url):
    for attempt in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
        except Exception:
            time.sleep(8 * (attempt + 1))
    raise RuntimeError("tải lỗi: " + url)


def strip(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def paper(im):
    """Tông giấy cũ nhẹ: bão hoà thấp, ấm, nền trắng → giấy của site, nâng đen nhẹ, grain mịn."""
    im = ImageEnhance.Color(im).enhance(0.86)
    im = ImageEnhance.Contrast(im).enhance(0.97)
    sepia = ImageOps.colorize(ImageOps.grayscale(im), black=(40, 26, 14), white=(255, 240, 214))
    im = Image.blend(im, sepia, 0.16)
    im = ImageChops.multiply(im, Image.new("RGB", im.size, (247, 243, 232)))  # trắng → màu giấy #f4f1e8
    im = im.point(lambda v: int(v * 0.96 + 6))
    grain = Image.effect_noise(im.size, 12).convert("RGB")
    return Image.blend(im, ImageChops.overlay(im, grain), 0.14)


def save(im, name, size, q, center=(0.5, 0.5)):
    im = ImageOps.fit(im, size, Image.LANCZOS, centering=center)
    path = os.path.join(HERE, name)
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)
    print(name, os.path.getsize(path) // 1024, "KB")


sources = json.load(open(os.path.join(HERE, "sources.json"), encoding="utf-8"))
credits, cache = [], {}
for s in sources:
    info = api_info(s["title"])
    m = info["extmetadata"]
    lic = strip(m.get("LicenseShortName", {}).get("value"))
    artist = strip(m.get("Artist", {}).get("value")) or "Không rõ"
    credits.append((s["key"], s["title"], lic, artist, info["descriptionurl"]))
    im = Image.open(io.BytesIO(get(info["thumburl"]))).convert("RGB")
    cache[s["key"]] = im
    save(paper(im), f"{s['key']}.jpg", (1200, 630), 72, CENTER.get(s["key"], (0.5, 0.5)))
    time.sleep(1.5)
for name, src in AVATARS.items():
    save(paper(cache[src]), f"{name}.jpg", (320, 320), 80)

with open(os.path.join(HERE, "CREDITS.md"), "w", encoding="utf-8") as f:
    f.write("# Ảnh demo — nguồn & giấy phép\n\nẢnh DEV-only, lấy từ Wikimedia Commons, đã cắt 1200×630 và chỉnh tông màu "
            "(bản gốc thuộc tác giả). Yêu cầu ghi công theo giấy phép của từng ảnh (CC BY / CC BY-SA) được đáp ứng "
            "bằng bảng dưới; CC0/Public domain không yêu cầu.\n\n| File | Tác giả | Giấy phép | Nguồn |\n|---|---|---|---|\n")
    for key, title, lic, artist, url in credits:
        f.write(f"| `{key}.jpg` | {artist[:80]} | {lic} | [{title.removeprefix('File:')[:60]}]({url}) |\n")
    f.write("\nAvatar tác giả (`avatar-*.jpg`) là bản cắt vuông từ các ảnh `smk-switch`, `floppy-disks`, `motherboard-2` ở trên.\n")
print("xong:", len(sources), "ảnh +", len(AVATARS), "avatar")
