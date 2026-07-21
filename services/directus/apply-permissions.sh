#!/usr/bin/env bash
# ============================================================================
# Retro Blog — cấu hình Roles / Policies / Permissions cho Directus 11.
# QUY TRÌNH TÁI LẬP (Sprint 2 Phase 2) — KHÔNG thao tác thủ công.
# Chạy sau khi Directus healthy & schema đã apply:  pnpm permissions:apply
# Idempotent: bỏ qua phần đã cấu hình.
#
# - Admin  : Administrator role sẵn có (full).
# - Editor : policy app_access + CRUD posts/authors/categories/directus_files;
#            KHÔNG quản trị users/roles/policies.
# - Public : read-only; posts lọc status=published AND published_at <= $NOW;
#            field allowlist (KHÔNG '*') → không tự lộ field nội bộ tương lai.
# ============================================================================
set -uo pipefail
BASE="${DIRECTUS_URL:-http://localhost:8055}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$ROOT/.env" ]; then source <(grep -E '^(ADMIN_EMAIL|ADMIN_PASSWORD)=' "$ROOT/.env"); fi
ADMIN_EMAIL="${ADMIN_EMAIL:?}"; ADMIN_PASSWORD="${ADMIN_PASSWORD:?}"

val() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const p=JSON.parse(d);let v=p.data;process.argv.slice(1).forEach(k=>{v=Array.isArray(v)?(v[0]||{})[k]:(v||{})[k]});console.log(v==null?'':v)}catch(e){console.log('')}})" "$@"; }
TOKEN=$(curl -sg -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | val access_token)
[ -z "$TOKEN" ] && { echo "LOGIN FAILED"; exit 1; }
# -g/--globoff: BẮT BUỘC. curl mặc định coi [ ] là URL-globbing → làm hỏng mọi
# query filter[...] của Directus (trả rỗng, exit 3). Không có -g → idempotency sai.
api() { curl -sg -X "$1" "$BASE$2" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" ${3:+-d "$3"}; }

# ---- Public policy id (động) ----
# Public = access-row có role NULL và user NULL (định nghĩa của Directus 11).
# Lưu ý: KHÔNG dùng filter[role][_null]=true trên /access — operator _null trên
# M2O của /access không lọc đúng (trả rỗng). Quét toàn bộ /access rồi tìm row.
PUB=$(api GET "/access?fields=policy,role,user&limit=-1" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const r=JSON.parse(d).data.find(x=>x.role==null&&x.user==null);process.stdout.write(r?r.policy:'')}catch(e){}})")
[ -z "$PUB" ] && { echo "PUBLIC POLICY NOT FOUND"; exit 1; }
echo "public policy: $PUB"

# ---- PUBLIC permissions (idempotent) ----
HAS_PUB=$(api GET "/permissions?filter[policy][_eq]=$PUB&filter[collection][_eq]=posts&aggregate[count]=id" | val count id)
if [ "${HAS_PUB:-0}" = "0" ] || [ -z "$HAS_PUB" ]; then
  echo "-> tạo Public read permissions"
  # FIELD ALLOWLIST — CHỈ field cần cho hợp đồng 03d. KHÔNG dùng '*': field nội bộ
  # thêm về sau sẽ KHÔNG tự động lộ ra Public API (Sprint 2 Phase 3 — bảo mật).
  # posts: rule status=published AND published_at<=$NOW + allowlist (không có 'status').
  api POST /permissions "{\"policy\":\"$PUB\",\"collection\":\"posts\",\"action\":\"read\",\"fields\":[\"id\",\"title\",\"slug\",\"excerpt\",\"body\",\"published_at\",\"author\",\"category\",\"cover\"],\"permissions\":{\"_and\":[{\"status\":{\"_eq\":\"published\"}},{\"published_at\":{\"_lte\":\"\$NOW\"}}]}}" >/dev/null
  # authors/categories: dữ liệu tham chiếu để render (không lộ bio/description/parent).
  api POST /permissions "{\"policy\":\"$PUB\",\"collection\":\"authors\",\"action\":\"read\",\"fields\":[\"id\",\"name\",\"slug\",\"avatar\"],\"permissions\":{}}" >/dev/null
  api POST /permissions "{\"policy\":\"$PUB\",\"collection\":\"categories\",\"action\":\"read\",\"fields\":[\"id\",\"name\",\"slug\"],\"permissions\":{}}" >/dev/null
  # directus_files: chỉ id (dựng URL /assets/<id>) + alt (a11y).
  api POST /permissions "{\"policy\":\"$PUB\",\"collection\":\"directus_files\",\"action\":\"read\",\"fields\":[\"id\",\"alt\"],\"permissions\":{}}" >/dev/null
  echo "   done public"
else
  echo "-> Public permissions đã có, bỏ qua"
fi

# ---- EDITOR policy + role + access + permissions (idempotent) ----
ED_ROLE=$(api GET "/roles?filter[name][_eq]=Editor&fields=id" | val id)
if [ -z "$ED_ROLE" ]; then
  echo "-> tạo Editor policy/role"
  ED_POL=$(api POST /policies '{"name":"Editor","icon":"edit","admin_access":false,"app_access":true}' | val id)
  ED_ROLE=$(api POST /roles '{"name":"Editor","icon":"edit"}' | val id)
  api POST /access "{\"role\":\"$ED_ROLE\",\"policy\":\"$ED_POL\"}" >/dev/null
  for c in posts authors categories directus_files; do
    for a in create read update delete; do
      api POST /permissions "{\"policy\":\"$ED_POL\",\"collection\":\"$c\",\"action\":\"$a\",\"fields\":[\"*\"]}" >/dev/null
    done
  done
  echo "   Editor policy=$ED_POL role=$ED_ROLE"
else
  echo "-> Editor role đã có ($ED_ROLE), bỏ qua"
fi
echo "DONE"
