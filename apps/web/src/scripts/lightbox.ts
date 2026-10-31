// Lightbox xem ảnh trong thân bài: bấm ảnh → hộp thoại toàn màn hình (<dialog> modal).
// Tuân CSP (script-src/style-src 'self'): không inline style, không thư viện ngoài.
// Điều khiển: Esc/✕/bấm nền để đóng; ←/→ hoặc nút để chuyển ảnh; Enter/Space trên ảnh để mở.

const FULL_WIDTH = 2000;

function fullSrc(img: HTMLImageElement): string {
  // Asset Directus: xin bản webp lớn qua transform; URL khác: dùng nguyên.
  try {
    const url = new URL(img.currentSrc || img.src, location.href);
    if (!/\/assets\/[0-9a-f-]{36}$/i.test(url.pathname)) return url.href;
    url.search = `?width=${FULL_WIDTH}&quality=85&format=webp`;
    return url.href;
  } catch {
    return img.src;
  }
}

function init(): void {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('.prose img'));
  if (images.length === 0 || typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Xem ảnh');
  dialog.innerHTML = `
    <button type="button" class="lightbox__btn lightbox__close" aria-label="Đóng">✕</button>
    <button type="button" class="lightbox__btn lightbox__prev" aria-label="Ảnh trước">‹</button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="" />
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button type="button" class="lightbox__btn lightbox__next" aria-label="Ảnh sau">›</button>`;
  document.body.append(dialog);

  const big = dialog.querySelector<HTMLImageElement>('.lightbox__img')!;
  const caption = dialog.querySelector<HTMLElement>('.lightbox__caption')!;
  const prev = dialog.querySelector<HTMLButtonElement>('.lightbox__prev')!;
  const next = dialog.querySelector<HTMLButtonElement>('.lightbox__next')!;
  let index = 0;
  let opener: HTMLImageElement | null = null;

  function show(i: number): void {
    index = (i + images.length) % images.length;
    const img = images[index];
    big.classList.add('is-loading');
    big.onload = () => big.classList.remove('is-loading');
    big.src = fullSrc(img);
    big.alt = img.alt;
    caption.textContent = img.alt
      ? `${img.alt} (${index + 1}/${images.length})`
      : `${index + 1}/${images.length}`;
    const single = images.length < 2;
    prev.hidden = single;
    next.hidden = single;
  }

  function open(i: number): void {
    opener = images[i];
    show(i);
    if (!dialog.open) dialog.showModal();
  }

  images.forEach((img, i) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.classList.add('zoomable');
    img.addEventListener('click', () => open(i));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dialog.querySelector('.lightbox__close')!.addEventListener('click', () => dialog.close());
  // Bấm vùng nền (ngoài ảnh/nút) → đóng.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (e) => {
    if (images.length < 2) return;
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('close', () => {
    big.removeAttribute('src');
    opener?.focus();
  });
}

init();
