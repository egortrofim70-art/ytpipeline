#!/usr/bin/env bash
# tts_order.sh — voice every input/sec/<key>.txt listed in input/sec/ORDER with a Lumean template.
# Keeps at most 6 orders in flight (Lumean allows 7), downloads <key>.mp3 + <key>.csv (char alignment) as each completes.
#   TEMPLATE=<uuid> [OVERRIDE='{"tts_settings":{...}}'] bash tts_order.sh
set -u
cd "$(dirname "$0")/input/sec"
set -a; . /home/user/ytpipeline/.env; set +a
TEMPLATE=${TEMPLATE:?template id}; OVERRIDE=${OVERRIDE:-}
declare -A ID
pending=($(cat ORDER)); inflight=()
order() {
  local k=$1 body
  body=$(python3 -c 'import json,sys; b={"template_id":sys.argv[1],"input_text":open(sys.argv[2],encoding="utf-8").read().strip()}; o=sys.argv[3]
if o: b["config_override"]=json.loads(o)
print(json.dumps(b,ensure_ascii=False))' "$TEMPLATE" "$k.txt" "$OVERRIDE")
  curl -s -X POST "$LUMEAN_BASE_URL/orders" -H "X-API-KEY: $LUMEAN_API_KEY" -H "Content-Type: application/json" -d "$body" | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("data") or {}).get("id") or "")'
}
fetch() {
  local k=$1 r=$2
  echo "$r" > "$k.order.json"
  python3 -c 'import json,sys; d=json.load(open(sys.argv[1]))["data"]["result"] or {}; [print(p) for p in d.get("files",[])+d.get("service_files",[]) if p.endswith((".mp3","alignment.csv"))]' "$k.order.json" | while read -r path; do
    url=$(curl -s -X POST "$LUMEAN_BASE_URL/storage/url" -H "X-API-KEY: $LUMEAN_API_KEY" -H "Content-Type: application/json" -d "{\"path\":\"$path\"}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["url"])')
    curl -s -o "$k.${path##*.}" "$url"
  done
  echo "done $k"
}
while [ ${#pending[@]} -gt 0 ] || [ ${#inflight[@]} -gt 0 ]; do
  while [ ${#pending[@]} -gt 0 ] && [ ${#inflight[@]} -lt 6 ]; do
    k=${pending[0]}; id=$(order "$k")
    if [ -z "$id" ]; then break; fi
    ID[$k]=$id; inflight+=("$k"); pending=("${pending[@]:1}"); echo "ordered $k $id"
  done
  still=()
  for k in "${inflight[@]}"; do
    r=$(curl -s "$LUMEAN_BASE_URL/orders/${ID[$k]}" -H "X-API-KEY: $LUMEAN_API_KEY")
    st=$(echo "$r" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["status"])' 2>/dev/null)
    case "$st" in completed|partially_completed) fetch "$k" "$r" ;; failed|cancelled) echo "FAILED $k"; ;; *) still+=("$k") ;; esac
  done
  inflight=("${still[@]+"${still[@]}"}")
  sleep 12
done
echo "all done"; ls *.mp3 | wc -l
