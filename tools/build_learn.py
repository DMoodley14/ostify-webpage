"""Build the Learn pages: /learn/ and one page per module.

Run from the site root:  python3 tools/build_learn.py

A module is an entry in MODULES plus its lessons in tools/learn/<slug>.html.
The lessons' behaviour is /learn.js and their styling /learn.css; this only
wraps them in the site's header and footer. A module with no lessons file
yet is listed on /learn/ as coming soon and gets no page.

learn.js keeps progress in the browser under ostify.learn.<slug>.done, and
/learn-index.js reads the same keys to show it on /learn/.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from mkpage import build

V = '20261008c'
HERE = os.path.dirname(__file__)

MODULES = [
    {'slug': 'build', 'name': 'Build', 'title': 'Build your first agent', 'minutes': 20, 'lessons': 8,
     'lede': 'The six Build steps, and what each one does underneath: language models, retrieval, guardrails and where the data goes.',
     'desc': 'An interactive module for clinicians: build an agent on Ostify step by step, and learn how language models, retrieval, guardrails and data flows work. No account needed.'},
    {'slug': 'test', 'name': 'Test', 'title': 'Test it properly',
     'lede': 'How an agent is evaluated: what gets asked, how answers are scored, and how to read the results.'},
    {'slug': 'assure', 'name': 'Assure', 'title': 'Make the safety case',
     'lede': 'What clinical safety and data protection documents are for, and what goes in them.'},
    {'slug': 'go-live', 'name': 'Go live', 'title': 'Put it in front of people',
     'lede': 'Review, release and keeping an agent current once it is in use.'},
]

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
CSS = f'<link rel="stylesheet" href="/learn.css?v={V}">\n'


def lessons_file(m):
    return os.path.join(HERE, 'learn', m['slug'] + '.html')


cards = ''
for n, m in enumerate(MODULES, 1):
    ready = os.path.exists(lessons_file(m))
    inner = f'<span class="xguide-n">Module {n} · {m["name"]}</span><b>{m["title"]}</b><p>{m["lede"]}</p>'
    if ready:
        cards += f'''
      <li><a href="/learn/{m["slug"]}/" data-module="{m["slug"]}" data-lessons="{m["lessons"]}">{inner}<span class="xguide-meta">{m["lessons"]} lessons · {m["minutes"]} minutes</span></a></li>'''
        main = '<main id="main" class="xp">\n' + CSS + HERO.format(
            eyebrow=f'<a href="/learn/">Learn</a> · Module {n} · {m["minutes"]} minutes',
            title=m['title'] + '.', lede=m['lede'] + ' Interactive, and no account needed.') + f'''
<section class="lrn-sec">
  <div class="xw lrn" data-module="{m["slug"]}">
{open(lessons_file(m)).read()}  </div>
</section>
<script src="/learn.js?v={V}" defer></script>
'''
        os.makedirs(f'learn/{m["slug"]}', exist_ok=True)
        build(f'learn/{m["slug"]}/index.html', f'learn/{m["slug"]}/', f'{m["title"]} — Learn, Ostify', m['desc'],
              'guides', [('Learn', 'learn/'), (m['title'], f'learn/{m["slug"]}/')], main, 'product', '/learn/')
    else:
        cards += f'''
      <li><div class="lrn-soon">{inner}<span class="xguide-meta">Coming soon</span></div></li>'''

index = '<main id="main" class="xp">\n' + CSS + HERO.format(
    eyebrow='Learn', title='Learn by doing.',
    lede='Short interactive modules for clinicians, one for each stage of building an agent. No account needed.') + f'''
<section class="lrn-sec">
  <div class="xw">
    <ol class="xguide-grid lrn-mods">{cards}
    </ol>
    <p class="xguide-ask">Prefer to read? The <a href="/guides/">guides</a> cover each job in a few minutes.</p>
  </div>
</section>
<script src="/learn-index.js?v={V}" defer></script>
'''
os.makedirs('learn', exist_ok=True)
build('learn/index.html', 'learn/', 'Learn — Ostify',
      'Interactive modules for clinicians building healthcare agents on Ostify. Learn how language models, retrieval and guardrails work as you go. No account needed.',
      'guides', [('Learn', 'learn/')], index, 'product', '/learn/')
