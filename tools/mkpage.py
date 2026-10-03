import re,json,sys
def build(path,slug,title,desc,og,crumbs,main,group,link):
    t=open('clinicians/index.html').read()
    head=t[:t.index('<main id="main" class="xp">')]; foot=t[t.index('</main>'):]
    head=re.sub(r'<title>[^<]*</title>',f'<title>{title}</title>',head)
    for pat in [r'(name="description" content=")[^"]*',r'(property="og:description" content=")[^"]*',r'(name="twitter:description" content=")[^"]*']:
        head=re.sub(pat,lambda m:m.group(1)+desc,head)
    for pat in [r'(property="og:title" content=")[^"]*',r'(name="twitter:title" content=")[^"]*']:
        head=re.sub(pat,lambda m:m.group(1)+title,head)
    head=head.replace('https://ostify.co.uk/clinicians/','https://ostify.co.uk/'+slug).replace('/images/og/clinicians.jpg','/images/og/'+og+'.jpg')
    # breadcrumbs
    items=[{"@type":"ListItem","position":1,"name":"Home","item":"https://ostify.co.uk/"}]+[{"@type":"ListItem","position":i+2,"name":n,"item":"https://ostify.co.uk/"+u} for i,(n,u) in enumerate(crumbs)]
    head=re.sub(r'"itemListElement": \[.*?\n  \]','"itemListElement": '+json.dumps(items,indent=2,ensure_ascii=False).replace('\n','\n  '),head,count=1,flags=re.S)
    head=head.replace(' aria-current="page"','').replace('<div class="nav-group is-here">','<div class="nav-group">')
    if group:
        head=head.replace(f'<div class="nav-group">\n        <button class="nav-top" type="button" aria-expanded="false" aria-controls="nav-{group}">',f'<div class="nav-group is-here">\n        <button class="nav-top" type="button" aria-expanded="false" aria-controls="nav-{group}">')
    if link:
        head=head.replace(f'<a href="{link}"><b>',f'<a href="{link}" aria-current="page"><b>').replace(f'<a href="{link}">',f'<a href="{link}" aria-current="page">')
    if slug.startswith('careers'):
        # No hiring announcement on the hiring pages themselves
        head=re.sub(r'<div class="xbar".*?</div>\n','',head,flags=re.S)
    open(path,'w').write(head+main+foot)
