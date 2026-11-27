// Nút ☰ Menu cho màn hình hẹp. CSS (global.css, @media max-width 560px) chỉ thu gọn nav khi <html class="js">
// và header chưa có .is-open; ở màn rộng nút bị ẩn và nav luôn hiện.
const header = document.querySelector<HTMLElement>('.site-header');
const button = header?.querySelector<HTMLButtonElement>('.nav-toggle');

function setOpen(open: boolean): void {
  if (!header || !button) return;
  header.classList.toggle('is-open', open);
  button.setAttribute('aria-expanded', String(open));
}

if (header && button) {
  button.hidden = false;
  button.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      button.focus();
    }
  });
}
