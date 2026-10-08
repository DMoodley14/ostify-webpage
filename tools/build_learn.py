"""Build /learn/ from tools/learn.html.

Run from the site root:  python3 tools/build_learn.py
The lessons are in tools/learn.html; their behaviour is /learn.js and their
styling /learn.css. This only wraps them in the site's header and footer.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from mkpage import build

V = '20261008a'
body = open(os.path.join(os.path.dirname(__file__), 'learn.html')).read()

main = f'''<main id="main" class="xp">
<link rel="stylesheet" href="/learn.css?v={V}">
<section class="xh xh--page xp">
  <div class="xh-orbs" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="xw">
    <div class="xh-copy">
      <p class="xl xl--light">Learn · Module 1 · 20 minutes</p>
      <h1>Build your first agent.</h1>
      <p class="xh-lede">The six Build steps, and what each one does underneath: language models, retrieval, guardrails and where the data goes. Interactive, and no account needed.</p>
    </div>
  </div>
</section>

<section class="lrn-sec">
  <div class="xw lrn">
{body}  </div>
</section>
<script src="/learn.js?v={V}" defer></script>
'''

os.makedirs('learn', exist_ok=True)
build('learn/index.html', 'learn/', 'Learn: build your first agent — Ostify',
      'An interactive module for clinicians: build an agent on Ostify step by step, and learn how language models, retrieval, guardrails and data flows work. No account needed.',
      'guides', [('Learn', 'learn/')], main, 'product', None)
