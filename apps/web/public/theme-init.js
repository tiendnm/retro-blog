// Đặt theme TRƯỚC khi trang vẽ ra (tránh chớp màu). Nạp chặn trong <head>, là file ngoài nên hợp CSP script-src 'self'.
// Danh sách hợp lệ = THEMES trong src/scripts/theme.ts trừ DEFAULT_THEME ("platinum": bộ màu ở :root, không đặt thuộc tính).
(function () {
  // Báo "có JS" sớm để CSS thu gọn menu mobile ngay từ lần vẽ đầu (không chớp). Không JS → menu luôn hiện đủ.
  document.documentElement.classList.add('js');
  try {
    var ok = ['mono', 'green', 'dos', 'amber', 'blueprint', 'amiga', 'paper'];
    var t = localStorage.getItem('retro-theme');
    if (ok.indexOf(t) !== -1) {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {
    /* localStorage bị chặn: giữ theme mặc định */
  }
})();
