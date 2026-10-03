"""Build the Guides and News pages from tools/content.json.

Run from the site root:  python3 tools/build_content.py
Add a guide or news post by adding an entry to content.json, then run this again.
"""
import json, re, os, sys, datetime
sys.path.insert(0, os.path.dirname(__file__))
from mkpage import build

C = json.load(open(os.path.join(os.path.dirname(__file__), 'content.json')))
CATS = ['Getting started', 'Building', 'Testing', 'Going live']

def minutes(html):
    words = len(re.sub(r'<[^>]+>', ' ', html).split())
    return max(2, round(words / 200))

def nice(d):
    return datetime.date.fromisoformat(d).strftime('%-d %B %Y')

HERO = '''<section class="xh xh--page xp">
  <div class="xh-orbs" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="xw">
    <div class="xh-copy">
      <p class="xl xl--light">{eyebrow}</p>
      <h1>{title}</h1>
      <p class="xh-lede">{lede}</p>
    </div>
  </div>
</section>
'''

# ---------- guides ----------
G = C['guides']
for i, g in enumerate(G):
    prev = G[i - 1] if i > 0 else None
    nxt = G[i + 1] if i < len(G) - 1 else None
    pager = '<nav class="xpager" aria-label="More guides">'
    pager += (f'<a class="xpager-prev" href="/guides/{prev["slug"]}/"><span>Previous</span>{prev["title"]}</a>' if prev else '<span></span>')
    pager += (f'<a class="xpager-next" href="/guides/{nxt["slug"]}/"><span>Next</span>{nxt["title"]}</a>' if nxt else '<span></span>')
    pager += '</nav>'
    main = '<main id="main" class="xp">\n<article>\n' + HERO.format(
        eyebrow=f'<a href="/guides/">Guides</a> · {g["cat"]} · {minutes(g["body"])} min read',
        title=g['title'] + '.', lede=g['lede']) + f'''
<section class="xs">
  <div class="xw xpost">
    {g["body"]}
    {pager}
  </div>
</section>
</article>
'''
    build(f'guides/{g["slug"]}/index.html', f'guides/{g["slug"]}/', f'{g["title"]} — Ostify guides',
          g['lede'] + ' A practical guide from Ostify.', 'guides',
          [('Guides', 'guides/'), (g['title'], f'guides/{g["slug"]}/')], main, 'product', None)

chips = '<button type="button" class="xchip" aria-pressed="true" data-filter="all">All</button>' + ''.join(
    f'<button type="button" class="xchip" aria-pressed="false" data-filter="{c}">{c}</button>' for c in CATS)
groups = ''
n = 0
for c in CATS:
    items = [g for g in G if g['cat'] == c]
    if not items:
        continue
    cards = ''
    for g in items:
        n += 1
        cards += f'''
        <li data-cat="{c}"><a href="/guides/{g["slug"]}/"><span class="xguide-n">{n:02d}</span><b>{g["title"]}</b><p>{g["lede"]}</p><span class="xguide-meta">{minutes(g["body"])} min read</span></a></li>'''
    groups += f'''
    <section class="xguide-group" data-cat="{c}" aria-labelledby="g-{c.lower().replace(" ", "-")}">
      <h2 id="g-{c.lower().replace(" ", "-")}">{c}</h2>
      <ol class="xguide-grid">{cards}
      </ol>
    </section>'''
idx = '<main id="main" class="xp">\n' + HERO.format(
    eyebrow='Guides', title='Build well, from the start.',
    lede='Short, practical guides for clinicians building on Ostify. For the stages themselves, see <a href="/how-it-works/">how it works</a>.') + f'''
<section class="xs">
  <div class="xw">
    <div class="xchips" role="group" aria-label="Filter guides">{chips}</div>{groups}
    <p class="xguide-ask">Missing something? <a href="/contact/">Tell us what you would like a guide on</a>.</p>
  </div>
</section>
'''
build('guides/index.html', 'guides/', 'Guides — Ostify',
      'Practical guides for clinicians building healthcare agents on Ostify, from your first agent to keeping it up to date.',
      'guides', [('Guides', 'guides/')], idx, 'product', '/guides/')

# ---------- news ----------
N = sorted(C['news'], key=lambda x: x['date'], reverse=True)
for p in N:
    if p.get('keep'):
        continue
    main = '<main id="main" class="xp">\n<article>\n' + HERO.format(
        eyebrow=f'<a href="/news/">News</a> · <time datetime="{p["date"]}">{nice(p["date"])}</time>',
        title=p['title'] + '.', lede=p['lede']) + f'''
<section class="xs">
  <div class="xw xpost">
    {p["body"]}
    <p class="xpost-back"><a href="/news/">All news</a></p>
  </div>
</section>
</article>
'''
    path = f'news/{p["slug"]}/index.html'
    build(path, f'news/{p["slug"]}/', f'{p["title"]} — Ostify', p['lede'], 'news',
          [('News', 'news/'), (p['title'], f'news/{p["slug"]}/')], main, 'company', None)
    s = open(path).read()
    ld = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": p['title'], "datePublished": p['date'],
          "image": "https://ostify.co.uk/images/og/news.jpg",
          "author": {"@type": "Organization", "name": "Ostify", "url": "https://ostify.co.uk/"},
          "publisher": {"@type": "Organization", "name": "Ostify", "logo": {"@type": "ImageObject", "url": "https://ostify.co.uk/favicon-512.png"}},
          "mainEntityOfPage": f"https://ostify.co.uk/news/{p['slug']}/"}
    s = s.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    s = s.replace('<link rel="icon" href="/favicon.ico"', '<script type="application/ld+json">\n' + json.dumps(ld, indent=2) + '\n</script>\n<link rel="icon" href="/favicon.ico"', 1)
    open(path, 'w').write(s)

tags = sorted({p['tag'] for p in N})
nchips = '<button type="button" class="xchip" aria-pressed="true" data-filter="all">All</button>' + ''.join(
    f'<button type="button" class="xchip" aria-pressed="false" data-filter="{t}">{t}</button>' for t in tags)
first, rest = N[0], N[1:]
feat = f'''<a class="xnews-feature" href="/news/{first["slug"]}/" data-cat="{first["tag"]}"><span class="xnews-row"><span class="xnews-tag">{first["tag"]}</span><time datetime="{first["date"]}">{nice(first["date"])}</time></span><b>{first["title"]}</b><p>{first["lede"]}</p><span class="xnews-more">Read more <span aria-hidden="true">→</span></span></a>'''
lis = ''.join(f'''
      <li data-cat="{p["tag"]}"><a href="/news/{p["slug"]}/"><span class="xnews-row"><span class="xnews-tag">{p["tag"]}</span><time datetime="{p["date"]}">{nice(p["date"])}</time></span><b>{p["title"]}</b><p>{p["lede"]}</p></a></li>''' for p in rest)
nidx = '<main id="main" class="xp">\n' + HERO.format(
    eyebrow='News', title='What is new at Ostify.',
    lede='Product updates, announcements and what we are working on next.') + f'''
<section class="xs">
  <div class="xw">
    <div class="xchips" role="group" aria-label="Filter news">{nchips}</div>
    {feat}
    <ol class="xnews-list">{lis}
    </ol>
    <p class="xnews-follow">For smaller updates, <a href="https://www.linkedin.com/company/ostify/" target="_blank" rel="noopener">follow Ostify on LinkedIn</a>.</p>
  </div>
</section>
'''
build('news/index.html', 'news/', 'News — Ostify',
      'Product updates, announcements and news from Ostify, the platform for building your own healthcare agents.',
      'news', [('News', 'news/')], nidx, 'company', '/news/')

# ---------- sitemap ----------
sm = open('sitemap.xml').read()
today = datetime.date.today().isoformat()
urls = [f'guides/{g["slug"]}/' for g in G] + [f'news/{p["slug"]}/' for p in N]
add = ''.join(f'<url><loc>https://ostify.co.uk/{u}</loc><lastmod>{today}</lastmod></url>\n' for u in urls if f'/{u}<' not in sm)
open('sitemap.xml', 'w').write(sm.replace('</urlset>', add + '</urlset>'))
print(f'built {len(G)} guides and {len(N)} news items')
