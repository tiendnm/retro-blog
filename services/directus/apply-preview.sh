#!/usr/bin/env bash
# ============================================================================
# Retro Blog — vai PREVIEW cho máy chủ xem trước bản nháp (docs/05-cms §4).
# Idempotent: chạy lại luôn đưa về đúng trạng thái dưới đây.
#
# - Policy/Role "Preview": KHÔNG admin, KHÔNG app_access; chỉ ĐỌC (không create/update/delete) các collection hiển thị.
# - posts: đọc MỌI trạng thái (kể cả nháp) — khác Public. Field allowlist = field thin client cần (không '*').
# - User "preview@retro.example.com" mang static token DIRECTUS_PREVIEW_TOKEN (cùng giá trị với container `preview`).
#   Token này CHỈ đặt ở container preview + .env.production; không bao giờ vào site công khai.
# - Đặt preview_url cho collection posts → nút/khung Live Preview trong trang soạn bài (cần PREVIEW_URL_BASE).
# Env: DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD, DIRECTUS_PREVIEW_TOKEN (>= 32 ký tự), PREVIEW_URL_BASE (vd https://retro.tiendnm.com/preview; tuỳ chọn).
# ============================================================================
set -uo pipefail
BASE="${DIRECTUS_URL:-http://localhost:8055}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ] || [ -z "${DIRECTUS_PREVIEW_TOKEN:-}" ]; then
  # shellcheck disable=SC1090
  if [ -f "$ROOT/.env" ]; then source <(grep -E '^(ADMIN_EMAIL|ADMIN_PASSWORD|DIRECTUS_PREVIEW_TOKEN|PREVIEW_URL_BASE)=' "$ROOT/.env"); fi
fi
ADMIN_EMAIL="${ADMIN_EMAIL:?}"; ADMIN_PASSWORD="${ADMIN_PASSWORD:?}"
if [ -z "${DIRECTUS_PREVIEW_TOKEN:-}" ]; then echo "-> DIRECTUS_PREVIEW_TOKEN trống: bỏ qua vai Preview"; exit 0; fi
if [ "${#DIRECTUS_PREVIEW_TOKEN}" -lt 32 ]; then echo "DIRECTUS_PREVIEW_TOKEN phải >= 32 ký tự (openssl rand -hex 32)"; exit 1; fi

val() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const p=JSON.parse(d);let v=p.data;process.argv.slice(1).forEach(k=>{v=Array.isArray(v)?(v[0]||{})[k]:(v||{})[k]});console.log(v==null?'':v)}catch(e){console.log('')}})" "$@"; }
TOKEN=$(curl -sg -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | val access_token)
[ -z "$TOKEN" ] && { echo "LOGIN FAILED"; exit 1; }
api() { curl -sg -X "$1" "$BASE$2" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" ${3:+-d "$3"}; }

# ---- Policy + Role + Access ----
POL=$(api GET "/policies?filter[name][_eq]=Preview&fields=id" | val id)
if [ -z "$POL" ]; then
  echo "-> tạo Preview policy"
  POL=$(api POST /policies '{"name":"Preview","icon":"visibility","admin_access":false,"app_access":false}' | val id)
fi
ROLE=$(api GET "/roles?filter[name][_eq]=Preview&fields=id" | val id)
if [ -z "$ROLE" ]; then
  echo "-> tạo Preview role"
  ROLE=$(api POST /roles '{"name":"Preview","icon":"visibility"}' | val id)
fi
[ -z "$POL" ] || [ -z "$ROLE" ] && { echo "KHÔNG TẠO ĐƯỢC policy/role Preview"; exit 1; }
HAS_ACC=$(api GET "/access?filter[role][_eq]=$ROLE&filter[policy][_eq]=$POL&aggregate[count]=id" | val count id)
if [ "${HAS_ACC:-0}" = "0" ] || [ -z "$HAS_ACC" ]; then
  api POST /access "{\"role\":\"$ROLE\",\"policy\":\"$POL\"}" >/dev/null
fi

# ---- Permissions: xoá sạch rồi tạo lại (chỉ read) ----
for id in $(api GET "/permissions?filter[policy][_eq]=$POL&fields=id&limit=-1" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.map(x=>x.id).join(' '))}catch(e){}})"); do
  api DELETE "/permissions/$id" >/dev/null
done
perm() { api POST /permissions "{\"policy\":\"$POL\",\"collection\":\"$1\",\"action\":\"read\",\"fields\":$2,\"permissions\":{}}" >/dev/null; }
perm posts '["id","title","slug","previous_slugs","excerpt","body","published_at","author","category","cover","tags"]'
perm authors '["id","name","slug","bio","avatar"]'
perm categories '["id","name","slug","description"]'
perm tags '["id","name","slug"]'
perm posts_tags '["id","posts_id","tags_id"]'
perm directus_files '["id","alt","width","height"]'
perm site_settings '["site_name","description","footer_text","default_og_image"]'
echo "-> Preview permissions: chỉ read, $(api GET "/permissions?filter[policy][_eq]=$POL&aggregate[count]=id" | val count id) collection"

# ---- User mang static token ----
PU=$(api GET "/users?filter[email][_eq]=preview@retro.example.com&fields=id" | val id)
RANDPW=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
if [ -z "$PU" ]; then
  echo "-> tạo user Preview"
  PU=$(api POST /users "{\"email\":\"preview@retro.example.com\",\"password\":\"$RANDPW\",\"role\":\"$ROLE\",\"status\":\"active\",\"first_name\":\"Preview\"}" | val id)
fi
[ -z "$PU" ] && { echo "KHÔNG TẠO ĐƯỢC user Preview"; exit 1; }
# Đồng bộ role + token mỗi lần chạy (đổi token trong .env.production rồi chạy lại là đủ).
api PATCH "/users/$PU" "{\"role\":\"$ROLE\",\"status\":\"active\",\"token\":\"$DIRECTUS_PREVIEW_TOKEN\"}" >/dev/null

# ---- Live Preview: preview_url của posts ----
if [ -n "${PREVIEW_URL_BASE:-}" ]; then
  api PATCH /collections/posts "{\"meta\":{\"preview_url\":\"$PREVIEW_URL_BASE/posts/{{slug}}\"}}" >/dev/null
  echo "-> posts.preview_url = $PREVIEW_URL_BASE/posts/{{slug}}"
fi
echo "DONE"
