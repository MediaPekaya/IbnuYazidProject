#!/usr/bin/env python3
"""Generate index.html for the QR reel from edl.json + a word-level transcript of the edited timeline.

Usage: python3 build.py <transcript.json> <timeline-wav-dir>
Popup times are anchored to spoken words (see POPUPS), so re-running after a re-cut re-syncs everything.
"""
import json, re, sys, subprocess, os

HERE = os.path.dirname(os.path.abspath(__file__))
TR = json.load(open(sys.argv[1]))
WAVDIR = sys.argv[2]
EDL = json.load(open(os.path.join(HERE, 'edl.json')))

# ---- timeline mapping: concatenated-wav time -> composition time -------------------------------
cum = 0.0
for i, e in enumerate(EDL):
    wd = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                        f'{WAVDIR}/s{i:02d}.wav']).decode())
    e['wav0'], e['wav1'] = cum, cum + wd
    cum += wd
TEND = round(EDL[-1]['at'] + EDL[-1]['vdur'], 3)

def norm(s): return re.sub(r'[^\w-]', '', s.lower())

def T(label, word, nth=0):
    seg = next(e for e in EDL if e['label'] == label)
    hits = [w for w in TR if seg['wav0'] - 0.05 <= w['start'] < seg['wav1'] and norm(w['text']).startswith(word)]
    if len(hits) <= nth:
        raise SystemExit(f'anchor not found: {label}/{word}/{nth} in {[norm(w["text"]) for w in TR if seg["wav0"]<=w["start"]<seg["wav1"]]}')
    t = seg['at'] + (hits[nth]['start'] - seg['wav0'])
    return round(max(seg['at'], min(t, seg['at'] + seg['vdur'] - 0.3)), 3)

# ---- icons ---------------------------------------------------------------------------------------
IC = {
 'qr': '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
 'grid': '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
 'download': '<path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v3h16v-3"/>',
 'save': '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
 'scan': '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16"/>',
 'link': '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
 'pencil': '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
 'swap': '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
 'ruler': '<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M6 8v3M10 8v4.5M14 8v3M18 8v4.5"/>',
 'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5"/>',
 'bolt': '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 'search': '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 'down': '<path d="M12 4v14m0 0l-6.5-6.5M12 18l6.5-6.5"/>',
}
def svg(name, cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">{IC[name]}</svg>'

# ---- popup plan ----------------------------------------------------------------------------------
# kind: icon | stat | chips.  Each appears at its anchor word and shrinks away when the next one arrives.
P = []
def add(**k): P.append(k)
add(t=0.0,  kind='icon', icon='qr',   title='QR Generator<br>Percuma!', sub='Tanpa iklan. Tanpa limit.')
add(t=T('hook','iklan'),     kind='stat', num=0, suffix='', title='Iklan', sub='Langsung tiada')
add(t=T('hook','limit'),     kind='stat', num=0, suffix='', title='Limit', sub='Scan sepuas hati')
add(t=T('intro','generate'), kind='icon', icon='qr',   title='Sistem Generate QR', sub='Aku bina sendiri')
add(t=T('dashboard','dashboard'), kind='icon', icon='grid', title='Dashboard', sub='Tempat cipta &amp; simpan QR')
add(t=T('dashboard','template'),  kind='stat', num=12, suffix='', title='Template', sub='Pilih design siap pakai', ticks=6)
add(t=T('design','shop'), kind='chips', title='Butang contoh', count=True,
    chips=[('Shop Now', T('design','shop')), ('Order Now', T('design','order')), ('Play Video', T('design','play'))])
add(t=T('design','warna'), kind='swatch', title='Pilih warna', sub='Teks, kotak &amp; bulatan',
    sw=['#6D4AFF', '#E8368F', '#12B5B0'])
add(t=T('link','link'), kind='chips', title='Letak apa-apa link', count=True,
    chips=[('Affiliate', T('link','affiliate')), ('Media Sosial', T('link','media')), ('Apps', T('link','apps')), ('Website', T('link','website'))])
add(t=T('size','size'),  kind='icon', icon='ruler', title='Pilih saiz', sub='Ikut kegunaan kau')
add(t=T('format','jpeg'), kind='chips', title='Format', count=True,
    chips=[('JPEG', T('format','jpeg')), ('PNG', T('format','png')), ('PDF', T('format','pdf'))])
add(t=T('download','muat'), kind='icon', icon='download', title='Muat turun terus', sub='Satu klik je')
add(t=T('download','dashboard'), kind='icon', icon='save', title='Simpan ke dashboard', sub='Boleh edit bila-bila')
add(t=T('scan','scan'), kind='icon', icon='scan', title='Bila scan...', sub='Tiada iklan tengah-tengah')
add(t=T('scan','link', 0), kind='icon', icon='link', title='Terus ke link kau', sub='Ikut link yang kau letak')
add(t=T('edit1','edit'), kind='icon', icon='pencil', title='Edit balik', sub='Bila-bila masa')
add(t=T('edit2','tukar'), kind='icon', icon='swap', title='Tukar design lain', sub='Ikut kreativiti kau')
add(t=T('free','free'), kind='stat', num=100, suffix='%', title='Percuma', sub='Tiada caj apa-apa', ticks=5)
add(t=T('cta','account'), kind='icon', icon='user', title='Buat akaun je', sub='Ingat password. Siap!')

# Make sure appear times are strictly increasing with a sensible gap.
for i in range(1, len(P)):
    if P[i]['t'] < P[i-1]['t'] + 0.9:
        P[i]['t'] = round(P[i-1]['t'] + 0.9, 3)
        for c in range(len(P[i].get('chips', []))):
            n, tc = P[i]['chips'][c]; P[i]['chips'][c] = (n, max(tc, P[i]['t'] + 0.35))
for i, p in enumerate(P):
    p['exit'] = P[i+1]['t'] if i + 1 < len(P) else TEND
    p['id'] = f'pk{i:02d}'

TQ = round(TEND + 0.4, 3)          # QR card pops in
HOLD = 5.4                          # fully static QR time (>= 5 s)
TOTAL = round(TQ + 0.7 + HOLD, 2)
RISER_LEN = 3.67

# ---- HTML ----------------------------------------------------------------------------------------
def card_html(p):
    pid = p['id']
    if p['kind'] == 'icon':
        return (f'<div class="card" id="{pid}-c"><div class="bubble" id="{pid}-b">{svg(p["icon"])}</div>'
                f'<div class="txt" id="{pid}-t"><div class="ttl">{p["title"]}</div><div class="sub">{p["sub"]}</div></div></div>')
    if p['kind'] == 'stat':
        return (f'<div class="card" id="{pid}-c"><div class="num" id="{pid}-n">{0}{p["suffix"]}</div>'
                f'<div class="txt" id="{pid}-t"><div class="ttl">{p["title"]}</div><div class="sub">{p["sub"]}</div></div></div>')
    if p['kind'] == 'swatch':
        sw = ''.join(f'<span class="sw" id="{pid}-s{j}" style="background:{c}"></span>' for j, c in enumerate(p['sw']))
        return (f'<div class="card" id="{pid}-c"><div class="swrow" id="{pid}-b">{sw}</div>'
                f'<div class="txt" id="{pid}-t"><div class="ttl">{p["title"]}</div><div class="sub">{p["sub"]}</div></div></div>')
    cols = ['#6D4AFF', '#E8368F', '#12B5B0', '#F59E0B']
    ch = ''.join(f'<span class="chip" id="{pid}-h{j}" style="background:{cols[j%4]}">{n}</span>' for j, (n, _) in enumerate(p['chips']))
    return (f'<div class="card chips" id="{pid}-c"><div class="chead"><div class="ttl small" id="{pid}-t">{p["title"]}</div>'
            f'<div class="badge" id="{pid}-n">0</div></div><div class="chiprow">{ch}</div></div>')

pops = '\n'.join(
    f'    <div id="{p["id"]}" class="clip pk" data-start="{p["t"]}" data-duration="{round(p["exit"] - p["t"] + 0.4, 3)}" '
    f'data-track-index="3" data-layout-allow-overlap>{card_html(p)}</div>' for p in P)

videos = '\n'.join(
    f'      <video id="v{i:02d}" class="clip scr" src="assets/video/{e["clip"]}" data-start="{e["at"]}" data-duration="{e["vdur"]}" '
    f'data-track-index="1" data-has-audio="true" playsinline></video>' for i, e in enumerate(EDL))

# ---- audio (sfx) ---------------------------------------------------------------------------------
A = []   # (kind, start, dur, vol)
def pop_at(t, vol=0.5):   A.append(('pop',  max(0, t - 0.12 + 0.033), 0.72, vol))
def tick_at(t, vol=0.4):  A.append(('tick', max(0, t - 0.073 + 0.033), 0.37, vol))
def whoosh_at(t, vol=0.26): A.append(('whoosh', max(0, t - 0.16 + 0.07), 0.575, vol))

JS = []
def js(s): JS.append(s)

for p in P:
    i, t, ex, pid = P.index(p), p['t'], p['exit'], p['id']
    js(f'tl.fromTo("#{pid}-c",{{scale:.5,y:70,opacity:0,transformOrigin:"50% 100%"}},{{scale:1,y:0,opacity:1,duration:.6,ease:"back.out(2.4)"}},{t});')
    if p['kind'] in ('icon', 'swatch'):
        js(f'tl.fromTo("#{pid}-b",{{scale:0,rotation:-28}},{{scale:1,rotation:0,duration:.55,ease:"back.out(3.2)"}},{t+.1:.3f});')
    js(f'tl.fromTo("#{pid}-t",{{x:44,opacity:0}},{{x:0,opacity:1,duration:.42,ease:"power3.out"}},{t+.16:.3f});')
    pop_at(t, 0.5 if i else 0.0)   # first card is on screen at frame 0: no sound
    if p['kind'] == 'swatch':
        for j in range(len(p['sw'])):
            ts = t + .35 + j * .22
            js(f'tl.fromTo("#{pid}-s{j}",{{scale:0}},{{scale:1,duration:.4,ease:"back.out(3)"}},{ts:.3f});')
            pop_at(ts, 0.22)
    if p['kind'] == 'stat':
        n = p['num']
        if n:
            js(f'(function(){{var o={{v:0}},el=document.getElementById("{pid}-n");'
               f'tl.to(o,{{v:{n},duration:.9,ease:"power2.out",onUpdate:function(){{el.textContent=Math.round(o.v)+"{p["suffix"]}";}}}},{t+.2:.3f});}})();')
            k = p.get('ticks', 5)
            for j in range(k):
                tick_at(t + .2 + 0.9 * (1 - (1 - (j + 1) / k) ** 0.5) , 0.32)
        js(f'tl.fromTo("#{pid}-n",{{scale:.4}},{{scale:1,duration:.5,ease:"back.out(3)"}},{t+.1:.3f});')
    if p['kind'] == 'chips':
        for j, (name, tc) in enumerate(p['chips']):
            tc = max(tc, t + 0.3)
            js(f'tl.fromTo("#{pid}-h{j}",{{scale:.2,y:20,opacity:0}},{{scale:1,y:0,opacity:1,duration:.42,ease:"back.out(3.2)"}},{tc:.3f});')
            js(f'(function(){{var el=document.getElementById("{pid}-n");tl.set(el,{{textContent:"{j+1}"}},{tc:.3f});'
               f'tl.fromTo(el,{{scale:1.5}},{{scale:1,duration:.3,ease:"back.out(3)"}},{tc:.3f});}})();')
            tick_at(tc, 0.4)
    js(f'tl.fromTo("#{pid}-c",{{scale:1,y:0,opacity:1}},{{scale:.45,y:-46,opacity:0,duration:.3,ease:"power2.in",immediateRender:false}},{ex:.3f});')
    whoosh_at(ex, 0.22)

# link pill: arrows bob, pill breathes (explicit loops, no repeat:-1)
k = 0.0
while k + 0.9 <= TEND:
    js(f'tl.to(".arr",{{y:12,duration:.45,ease:"sine.inOut"}},{k:.2f});tl.to(".arr",{{y:0,duration:.45,ease:"sine.inOut"}},{k+.45:.2f});')
    k += 0.9
k = 1.5
while k + 1.6 <= TEND:
    js(f'tl.to("#pill",{{scale:1.025,duration:.8,ease:"sine.inOut"}},{k:.2f});tl.to("#pill",{{scale:1,duration:.8,ease:"sine.inOut"}},{k+.8:.2f});')
    k += 3.2
k = 0.4
while k + 1.0 <= TEND:
    js(f'tl.set("#caret",{{opacity:0}},{k:.2f});tl.set("#caret",{{opacity:1}},{k+.5:.2f});')
    k += 1.0

# end card
js(f'tl.fromTo("#vcard",{{scale:1,opacity:1}},{{scale:.88,opacity:0,duration:.4,ease:"power2.in",immediateRender:false}},{TEND:.3f});')
whoosh_at(TEND + 0.05, 0.25)
js(f'tl.fromTo("#scan-h",{{y:30,opacity:0}},{{y:0,opacity:1,duration:.45,ease:"power3.out"}},{TEND+.15:.3f});')
js(f'tl.fromTo("#qrcard",{{scale:.55,y:80,opacity:0,transformOrigin:"50% 100%"}},{{scale:1,y:0,opacity:1,duration:.7,ease:"back.out(2)"}},{TQ});')
pop_at(TQ + 0.05, 0.5)
A.append(('riser', TQ - RISER_LEN + 0.28, RISER_LEN, 0.34))
for j in range(3):
    pass
# stop the bobbing arrows during the static QR hold
js(f'tl.set(".arr",{{y:0}},{TEND+0.1:.2f});')

SRC = {'pop': 'assets/sfx/pop.mp3', 'tick': 'assets/sfx/click-soft.mp3', 'whoosh': 'assets/sfx/whoosh-short.mp3', 'riser': 'assets/sfx/riser-short.mp3'}
lane = {'pop': 5, 'tick': 6, 'whoosh': 7, 'riser': 8}
audio = []
for n, (kd, st, du, vol) in enumerate(sorted(A, key=lambda a: a[1])):
    if vol <= 0: continue
    audio.append(f'    <audio id="sfx{n:02d}-{kd}" class="clip" src="{SRC[kd]}" data-start="{st:.3f}" data-duration="{du}" data-volume="{vol}" data-track-index="{lane[kd]}"></audio>')
audio = '\n'.join(audio)

html = open(os.path.join(HERE, 'template.html')).read()
html = (html.replace('{{TOTAL}}', str(TOTAL)).replace('{{VIDEOS}}', videos).replace('{{POPUPS}}', pops)
            .replace('{{AUDIO}}', audio).replace('{{JS}}', '\n      '.join(JS)).replace('{{TEND}}', str(TEND))
            .replace('{{TQ}}', str(TQ)).replace('{{ICON_SEARCH}}', svg('search', 'ic search')).replace('{{ICON_DOWN}}', svg('down', 'ic arr'))
            .replace('{{MUSIC_DUR}}', str(TOTAL)))
open(os.path.join(HERE, 'index.html'), 'w').write(html)
print('popups', len(P), 'sfx', len(audio.splitlines()), 'TEND', TEND, 'TOTAL', TOTAL)
for p in P: print(f'{p["t"]:7.2f} -> {p["exit"]:7.2f}  {p["id"]} {p["kind"]:6} {p.get("title","")}')
