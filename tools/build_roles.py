"""Build the Work with us pages from Markdown files in roles/.

Run from the site root:  python3 tools/build_roles.py
Each roles/<slug>.md becomes /careers/<slug>/. Files starting with "_" are skipped,
and roles with "status: closed" are left off the site.
"""
import glob, html, json, os, re, shutil, sys, datetime
from urllib.parse import quote
import markdown

sys.path.insert(0, os.path.dirname(__file__))
from mkpage import build

EMAIL = 'info@ostify.co.uk'

def read(path):
    text = open(path, encoding='utf-8').read()
    meta, body = {}, text
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', text, re.S)
    if m:
        for line in m.group(1).splitlines():
            line = re.split(r'\s+#', line, 1)[0].rstrip()
            if ':' in line:
                k, v = line.split(':', 1)
                meta[k.strip()] = v.strip()
        body = m.group(2)
    meta['slug'] = os.path.splitext(os.path.basename(path))[0]
    meta['html'] = markdown.markdown(body, extensions=['sane_lists'])
    return meta

roles = [read(p) for p in sorted(glob.glob('roles/*.md')) if not os.path.basename(p).startswith('_')]
open_roles = sorted([r for r in roles if r.get('status', 'open').lower() == 'open'],
                    key=lambda r: (int(r.get('order', 100)), r.get('title', '')))

HERO = '''<section class="xh xh--page xp">
  <div class="xh-orbs" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="xw">
    <div class="xh-copy">
      <p class="xl xl--light">{eyebrow}</p>
      <h1>{title}</h1>
      <p class="xh-lede">{lede}</p>
      <div class="xh-cta">{cta}</div>
    </div>
  </div>
</section>
'''

def mailto(title):
    return f'mailto:{EMAIL}?subject=' + quote(title)

def cta(r, label):
    # Roles with an "apply" link (e.g. an application form) send people there; others open an email
    if r.get('apply'):
        return f'<a class="xb xb--light" href="{html.escape(r["apply"])}">Apply now</a>'
    return f'<a class="xb xb--light" href="{mailto(r["title"])}">{label}</a>'

def facts(r):
    rows = [(k.title(), r[k]) for k in ('type', 'commitment', 'location', 'pay') if r.get(k)]
    return ''.join(f'<div><dt>{html.escape(k)}</dt><dd>{html.escape(v)}</dd></div>' for k, v in rows)

# Remove pages for roles that no longer exist or are closed
for d in glob.glob('careers/*/'):
    slug = os.path.basename(os.path.normpath(d))
    if slug not in {r['slug'] for r in open_roles}:
        shutil.rmtree(d)

for r in open_roles:
    t = html.escape(r['title'])
    main = '<main id="main" class="xp">\n<article>\n' + HERO.format(
        eyebrow='<a href="/careers/">Work with us</a>', title=t + '.', lede=html.escape(r.get('summary', '')),
        cta=cta(r, 'Apply or ask a question')) + f'''
<section class="xs">
  <div class="xw xrole">
    <dl class="xrole-facts">{facts(r)}</dl>
    <div class="xpost">
      {r["html"]}
      <p class="xpost-cta">{cta(r, 'Get in touch')}</p>
      <p class="xpost-back"><a href="/careers/">All roles</a></p>
    </div>
  </div>
</section>
</article>
'''
    os.makedirs(f'careers/{r["slug"]}', exist_ok=True)
    build(f'careers/{r["slug"]}/index.html', f'careers/{r["slug"]}/', f'{r["title"]} — Work with us — Ostify',
          r.get('summary', ''), 'careers', [('Work with us', 'careers/'), (r['title'], f'careers/{r["slug"]}/')],
          main, 'company', None)

if open_roles:
    cards = ''.join(f'''
      <li><a href="/careers/{r["slug"]}/"><span class="xnews-row">{"".join(f'<span class="xnews-tag">{html.escape(r[k])}</span>' for k in ("type",) if r.get(k))}<span class="xrole-meta">{" · ".join(html.escape(r[k]) for k in ("commitment", "location") if r.get(k))}</span></span><b>{html.escape(r["title"])}</b><p>{html.escape(r.get("summary", ""))}</p><span class="xnews-more">See the role <span aria-hidden="true">→</span></span></a></li>''' for r in open_roles)
    listing = f'<ol class="xroles-list">{cards}\n    </ol>'
else:
    listing = '<p class="xroles-none">There are no open roles right now. If you would like to work with us, <a href="mailto:' + EMAIL + '">tell us about yourself</a>.</p>'

n = len(open_roles)
idx = '<main id="main" class="xp">\n' + HERO.format(
    eyebrow='Work with us', title='Help clinicians build what their patients need.',
    lede='Ostify is early-stage and growing. ' + (f'We have {n} open role{"s" if n != 1 else ""}.' if n else 'There are no open roles right now, but we are always glad to hear from people.'),
    cta='<a class="xb xb--light" href="#roles">See open roles</a><a class="xb xb--ghost" href="/company/">Read the story</a>') + f'''
<section class="xs" id="roles" aria-labelledby="roles-title">
  <div class="xw">
    <header class="xs-head">
      <p class="xl">Open roles</p>
      <div><h2 id="roles-title">Where you could fit.</h2></div>
    </header>
    {listing}
    <p class="xnews-follow">Do not see the right role? <a href="mailto:{EMAIL}?subject=Working%20with%20Ostify">Tell us what you would bring</a>.</p>
  </div>
</section>

<section class="xs xs--paper" aria-labelledby="background-title">
  <div class="xw">
    <header class="xs-head">
      <p class="xl">Background</p>
      <div><h2 id="background-title">Where Ostify is today.</h2></div>
    </header>
    <div class="xstory">
      <p>Ostify lets clinicians build safe, tested AI agents from their own approved content, without writing code. The platform is built and working, and it is led by a doctor who is also a software engineer.</p>
      <p>We are part of Microsoft for Startups, and we are now bringing Ostify to the first clinicians and services ready to build. It is a good moment to join: the product is in place, and the people who join now will shape how the company grows.</p>
      <p>We are based in the UK and work mostly remotely, with regular time together in London.</p>
      <p>To find out more, read <a href="/company/">why we built Ostify</a> and <a href="/how-it-works/">how it works</a>.</p>
    </div>
  </div>
</section>
'''
build('careers/index.html', 'careers/', 'Work with us — Ostify',
      'Work with Ostify: open roles at an early-stage company helping clinicians build safe, tested healthcare agents.',
      'careers', [('Work with us', 'careers/')], idx, 'company', '/careers/')

# Sitemap: replace all careers entries with the current set
sm = open('sitemap.xml').read()
sm = re.sub(r'<url><loc>https://ostify\.co\.uk/careers/[^<]*</loc>[^\n]*\n', '', sm)
today = datetime.date.today().isoformat()
add = ''.join(f'<url><loc>https://ostify.co.uk/{u}</loc><lastmod>{today}</lastmod></url>\n'
              for u in ['careers/'] + [f'careers/{r["slug"]}/' for r in open_roles])
open('sitemap.xml', 'w').write(sm.replace('</urlset>', add + '</urlset>'))
print(f'built {n} open role(s)')
