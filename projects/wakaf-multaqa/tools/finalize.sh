#!/bin/bash
S=$1; P=$2
python3 -I $S/build_hf.py $S $P || exit 1
cd $P
python3 -I - <<'PY'
import re
for n in ("leak-a","leak-b"):
    p=f"compositions/{n}.html"; t=open(p).read()
    t=re.sub(r'\s*tl\.fromTo\(\s*"\.hf-leak-red",.*?\);\n', '\n', t, flags=re.S)
    open(p,"w").write(t)
PY
for n in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16; do
  timeout 60 npx --yes hyperframes@0.9.16 media-treatment --project . --file index.html --selector "#v$n" --grading '{"preset":"warm-daylight","intensity":0.8,"details":{"vignette":0.1}}' --apply --json 2>/dev/null | python3 -I -c "import sys,json; d=json.loads(sys.stdin.read()); assert d.get('ok'),d" || exit 1
done
echo finalized
