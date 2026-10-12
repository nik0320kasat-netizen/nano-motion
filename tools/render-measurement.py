"""Render README.md into measurement.html with the site's head (pixel snippet), header and footer.
Run from the repo root after editing README.md:  python3 tools/render-measurement.py
Needs: pip install markdown"""
import re, markdown
head = open('index.html').read().split('</head>')[0]
head = re.sub(r'<title>.*?</title>', '<title>How this site is measured | Nano Motion</title>', head)
md = open('README.md').read()
body = markdown.markdown(md, extensions=['tables', 'fenced_code'])
body = body.replace('<pre>', '<pre tabindex="0">').replace('<table>', '<div class="table-wrap"><table>').replace('</table>', '</table></div>')
scripts = ''.join(f'<script src="assets/{n}.js"></script>\n' for n in ['products', 'store', 'eventlog', 'tracking', 'consent', 'layout'])
html = (head + '</head>\n<body data-page="measurement">\n<!-- Generated from README.md by tools/render-measurement.py. Edit the README, then re-run. -->\n'
        '<main class="prose doc">\n' + body + '\n</main>\n\n' + scripts + '</body>\n</html>\n')
open('measurement.html', 'w').write(html)
print('measurement.html written', len(html))
