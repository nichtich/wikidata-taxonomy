# -*- coding: utf-8 -*-
# Sphinx document generator configuration file for node projects

from __future__ import unicode_literals
from recommonmark.parser import CommonMarkParser
import json
import datetime
import sphinx_rtd_theme

# use Markdown in README.md
source_parsers = { '.md': CommonMarkParser }
source_suffix = '.md'
master_doc = 'README'
exclude_patterns = ['**/*', '.*']

# all images are online because npmjs.com does not host them
suppress_warnings = ['image.nonlocal_uri']

# get settings from package.json
package = json.load(open('package.json'))
project = package['name']
version = package['version']
release = package['version']
author = package['author']
copyright = '%s, %s' % (datetime.datetime.now().year, author)

# default options for HTML and LaTeX
highlight_language = 'none'
html_theme = 'sphinx_rtd_theme'
html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]
latex_documents = [
    (master_doc, master_doc+'.tex',
    '%s Documentation' % project, author, 'manual')
]

# nasty hack to import arbitrary settings from package.json
conf = package.get('conf.py') or []
for key, value in conf.items():
    exec("%s=%s" % (key,repr(value)))
