// Trang /search: nạp chỉ mục lần đầu cần tìm, tìm khi gõ/gửi form, vẽ kết quả bằng DOM (textContent — không innerHTML).
// Tuân CSP (script-src 'self', connect-src 'self'): không inline, không thư viện ngoài.
import { formatDate } from '../lib/format';
import { type SearchEntry, search, snippet } from '../lib/search';

const MAX_RESULTS = 50;
const DEBOUNCE_MS = 150;

let indexPromise: Promise<SearchEntry[]> | undefined;
function loadIndex(): Promise<SearchEntry[]> {
  const p = fetch('/search-index.json', { headers: { Accept: 'application/json' } }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<SearchEntry[]>;
  });
  // Lỗi mạng tạm thời → lần sau thử lại thay vì giữ mãi promise hỏng.
  p.catch(() => {
    indexPromise = undefined;
  });
  indexPromise ??= p;
  return indexPromise;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderItem(entry: SearchEntry, query: string): HTMLLIElement {
  const li = el('li', 'post-card');
  const body = el('div', 'post-card__body');
  if (entry.c) body.append(el('p', 'post-card__cat', entry.c));
  const h2 = el('h2');
  const a = el('a', undefined, entry.t);
  a.href = entry.u;
  h2.append(a);
  body.append(h2);
  const sn = snippet(entry, query);
  if (sn) body.append(el('p', undefined, sn));
  if (entry.d) body.append(el('p', 'meta', formatDate(entry.d)));
  li.append(body);
  return li;
}

function init(): void {
  const input = document.querySelector<HTMLInputElement>('#q');
  const form = document.querySelector<HTMLFormElement>('.search-form');
  const status = document.querySelector<HTMLElement>('#search-status');
  const list = document.querySelector<HTMLUListElement>('#search-results');
  if (!input || !form || !status || !list) return;

  let seq = 0; // chỉ vẽ kết quả của lần gõ mới nhất (chỉ mục tải xong muộn không đè kết quả mới hơn)
  async function run(query: string): Promise<void> {
    const mine = ++seq;
    const q = query.trim();
    list?.replaceChildren();
    if (!q) {
      if (status) status.textContent = '';
      return;
    }
    if (status) status.textContent = 'Đang tìm…';
    try {
      const hits = search(await loadIndex(), q);
      if (mine !== seq) return;
      list?.replaceChildren(...hits.slice(0, MAX_RESULTS).map((h) => renderItem(h.entry, q)));
      if (status) {
        status.textContent = hits.length
          ? `${hits.length} kết quả cho “${q}”${hits.length > MAX_RESULTS ? ` (hiện ${MAX_RESULTS} đầu tiên)` : ''}.`
          : `Không có bài nào khớp “${q}”.`;
      }
    } catch {
      if (mine === seq && status)
        status.textContent = 'Không tải được dữ liệu tìm kiếm. Thử tải lại trang.';
    }
  }

  function syncUrl(query: string): void {
    const url = new URL(location.href);
    if (query.trim()) url.searchParams.set('q', query.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }

  let timer: number | undefined;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      syncUrl(input.value);
      void run(input.value);
    }, DEBOUNCE_MS);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    syncUrl(input.value);
    void run(input.value);
  });

  const initial = new URL(location.href).searchParams.get('q') ?? '';
  input.value = initial;
  void run(initial);
}

init();
