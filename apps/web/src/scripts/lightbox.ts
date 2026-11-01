// Lightbox xem ảnh trong thân bài: bấm ảnh → hộp thoại toàn màn hình (<dialog> modal).
// Tuân CSP (script-src/style-src 'self'): không inline style trong HTML, không thư viện ngoài
// (đặt transform qua CSSOM — `el.style.x = …` — không bị CSP chặn như thuộc tính style="…").
// Điều khiển: Esc/✕/bấm nền để đóng; ←/→ hoặc nút để chuyển ảnh; Enter/Space trên ảnh để mở.
// Zoom: nút −/+/100%, phím + − 0, lăn chuột, nhấp đúp (hoặc chạm đúp), chụm 2 ngón; kéo để di chuyển khi đã phóng.

import { RESET, type ZoomState, clampPan, zoomAt } from '../lib/zoom';

const FULL_WIDTH = 2000;
const BUTTON_STEP = 1.5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const TAP_SLOP = 8; // px: dịch ít hơn mức này vẫn tính là "chạm", không phải kéo

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

/** querySelector có kiểm tra: thiếu phần tử → lỗi rõ ràng thay vì null âm thầm. */
function q<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`lightbox: thiếu ${selector}`);
  return el;
}

function init(): void {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('.prose img'));
  if (images.length === 0 || typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Xem ảnh');
  dialog.innerHTML = `
    <button type="button" class="lightbox__btn lightbox__close" aria-label="Đóng">✕</button>
    <div class="lightbox__tools" role="group" aria-label="Phóng to / thu nhỏ">
      <button type="button" class="lightbox__btn lightbox__zoom-out" aria-label="Thu nhỏ">−</button>
      <button type="button" class="lightbox__btn lightbox__zoom-reset" aria-label="Về kích thước vừa khung">100%</button>
      <button type="button" class="lightbox__btn lightbox__zoom-in" aria-label="Phóng to">+</button>
    </div>
    <button type="button" class="lightbox__btn lightbox__prev" aria-label="Ảnh trước">‹</button>
    <figure class="lightbox__figure">
      <div class="lightbox__stage"><img class="lightbox__img" alt="" draggable="false" /></div>
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button type="button" class="lightbox__btn lightbox__next" aria-label="Ảnh sau">›</button>`;
  document.body.append(dialog);

  const stage = q<HTMLElement>(dialog, '.lightbox__stage');
  const big = q<HTMLImageElement>(dialog, '.lightbox__img');
  const caption = q<HTMLElement>(dialog, '.lightbox__caption');
  const prev = q<HTMLButtonElement>(dialog, '.lightbox__prev');
  const next = q<HTMLButtonElement>(dialog, '.lightbox__next');
  const zoomOut = q<HTMLButtonElement>(dialog, '.lightbox__zoom-out');
  const zoomIn = q<HTMLButtonElement>(dialog, '.lightbox__zoom-in');
  const zoomReset = q<HTMLButtonElement>(dialog, '.lightbox__zoom-reset');
  let index = 0;
  let opener: HTMLImageElement | null = null;
  let st: ZoomState = RESET;

  // ---- Zoom / pan ----
  function apply(target: ZoomState, animate = false): void {
    st = clampPan(target, big.offsetWidth, big.offsetHeight, stage.clientWidth, stage.clientHeight);
    big.classList.toggle('is-animating', animate);
    big.style.transform = st.s === 1 ? '' : `translate(${st.x}px, ${st.y}px) scale(${st.s})`;
    stage.classList.toggle('is-zoomed', st.s > 1);
    zoomReset.textContent = `${Math.round(st.s * 100)}%`;
    zoomOut.disabled = st.s <= 1;
  }

  /** Toạ độ con trỏ tính từ tâm khung xem. */
  function fromCenter(clientX: number, clientY: number): [number, number] {
    const r = stage.getBoundingClientRect();
    return [clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2)];
  }

  function zoomBy(factor: number, clientX?: number, clientY?: number, animate = false): void {
    const [px, py] = clientX === undefined ? [0, 0] : fromCenter(clientX, clientY ?? 0);
    apply(zoomAt(st, factor, px, py), animate);
  }

  zoomIn.addEventListener('click', () => zoomBy(BUTTON_STEP, undefined, undefined, true));
  zoomOut.addEventListener('click', () => zoomBy(1 / BUTTON_STEP, undefined, undefined, true));
  zoomReset.addEventListener('click', () => apply(RESET, true));

  stage.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    },
    { passive: false },
  );

  // Con trỏ: 1 ngón/chuột → kéo (khi đã phóng) hoặc chạm đúp; 2 ngón → chụm.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;
  let downAt = { x: 0, y: 0, t: 0 };
  let moved = false;
  let lastTap = { x: 0, y: 0, t: 0 };

  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      moved = false;
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      moved = true; // không tính là chạm
    }
    stage.classList.toggle('is-dragging', st.s > 1);
  });

  stage.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > TAP_SLOP) moved = true;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && dist > 0) {
        zoomBy(dist / pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      pinchDist = dist;
    } else if (pointers.size === 1 && st.s > 1) {
      apply({ s: st.s, x: st.x + dx, y: st.y + dy });
    }
  });

  function endPointer(e: PointerEvent): void {
    if (!pointers.delete(e.pointerId)) return;
    pinchDist = 0;
    stage.classList.remove('is-dragging');
    if (pointers.size > 0 || moved || e.type === 'pointercancel') return;
    // Chạm đúp: phóng tới DOUBLE_TAP_SCALE tại điểm chạm, hoặc về vừa khung nếu đang phóng.
    const now = performance.now();
    if (
      now - lastTap.t < DOUBLE_TAP_MS &&
      Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30
    ) {
      if (st.s > 1) apply(RESET, true);
      else zoomBy(DOUBLE_TAP_SCALE, e.clientX, e.clientY, true);
      lastTap = { x: 0, y: 0, t: 0 };
    } else {
      lastTap = { x: e.clientX, y: e.clientY, t: now };
    }
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  big.addEventListener('transitionend', () => big.classList.remove('is-animating'));

  // ---- Chuyển ảnh / mở / đóng ----
  function show(i: number): void {
    index = (i + images.length) % images.length;
    const img = images[index];
    apply(RESET);
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
  q<HTMLElement>(dialog, '.lightbox__close').addEventListener('click', () => dialog.close());
  // Bấm vùng nền (ngoài ảnh/nút) → đóng.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') zoomBy(BUTTON_STEP, undefined, undefined, true);
    else if (e.key === '-' || e.key === '_') zoomBy(1 / BUTTON_STEP, undefined, undefined, true);
    else if (e.key === '0') apply(RESET, true);
    else if (images.length >= 2 && e.key === 'ArrowLeft') show(index - 1);
    else if (images.length >= 2 && e.key === 'ArrowRight') show(index + 1);
  });
  // Esc khi đang phóng: về vừa khung trước, Esc lần nữa mới đóng.
  dialog.addEventListener('cancel', (e) => {
    if (st.s > 1) {
      e.preventDefault();
      apply(RESET, true);
    }
  });
  dialog.addEventListener('close', () => {
    apply(RESET);
    pointers.clear();
    big.removeAttribute('src');
    opener?.focus();
  });
}

init();
