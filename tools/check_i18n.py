#!/usr/bin/env python3
"""Checks that the three languages of the guide still fit together.

The guide is one hand-written page per language (index.html, de/index.html,
fr/index.html) and one strings file per language (i18n/en.js, de.js, fr.js).
They share the stylesheet and the scripts, so they must agree in everything
except the wording. This script compares them and prints what differs:

  pages    the same elements in the same order, with the same ids, classes,
           data-* keys and link targets; the head, the language links and the
           script tags as each language needs them; every id unique and every
           in-page link pointing at one; every introduced term (dfn) explained
           in the glossary of its own page; every paper link known
  strings  the same entries, the same {blanks}, lists of the same length

What may differ between the pages: all text; the wording inside the
attributes listed in PROSE_ATTRIBUTES; data-term, data-also and data-say (how
tools/generate_voice.py is to say a word); the order of
the glossary entries (each language sorts its own); and, inside one paragraph,
heading, list item or table cell, the order of links and emphasis, because
word order differs between languages. An element that carries nothing but a
lang or data-say attribute (a foreign word marked as such) is ignored altogether.

    python3 tools/check_i18n.py      # exits with 1 if anything differs

Needs only Python 3.9 or later, no packages.
"""

import difflib
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://mon3yp3nny.github.io/llm-course/'
REFERENCE = 'en'
# Per language: its page, its folder below the site's address, its locales.
LANGUAGES = {
    'en': {'page': 'index.html', 'folder': '', 'locale': 'en-GB', 'og': 'en_GB'},
    'de': {'page': 'de/index.html', 'folder': 'de/', 'locale': 'de-DE', 'og': 'de_DE'},
    'fr': {'page': 'fr/index.html', 'folder': 'fr/', 'locale': 'fr-FR', 'og': 'fr_FR'},
}

VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
# Elements that sit inside a line of text. Within their paragraph their order is free.
INLINE_TAGS = {'a', 'abbr', 'b', 'cite', 'code', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 'small', 'span', 'strong', 'sub', 'sup'}
# Pure typography, different in every language: not compared at all.
IGNORED_TAGS = {'br', 'wbr', 'sup', 'sub', 'abbr'}
# Attributes whose value is wording. Each page must have them in the same places, with its own text.
PROSE_ATTRIBUTES = {'title', 'aria-label', 'placeholder', 'alt', 'data-title', 'data-label', 'data-cpu',
                    'data-gpu', 'data-memory', 'data-empty', 'data-play', 'data-pause'}
# Attributes a language may add or leave out freely.
FREE_ATTRIBUTES = {'data-term', 'data-also', 'data-say', 'lang', 'hreflang'}

# Strings: lists that are as long as each language needs.
FREE_LISTS = {'terms.endings', 'terms.dropped', 'search.stopWords', 'search.endings'}
# Strings: entries in which a language may use any of several blanks.
OPTIONAL_BLANKS = {'units.trillions': {'n', 'billions'}}

problems = []


def problem(text):
    problems.append(text)


# Pages

class Node:
    def __init__(self, tag, attrs, line, parent):
        self.tag, self.attrs, self.line, self.parent = tag, attrs, line, parent
        self.children = []
        self.text = []

    def classes(self):
        return set((self.attrs.get('class') or '').split())

    def walk(self):
        yield self
        for child in self.children:
            yield from child.walk()

    def all_text(self):
        return re.sub(r'\s+', ' ', ''.join(self.text)).strip()

    def inside(self, class_name):
        node = self
        while node:
            if class_name in node.classes():
                return True
            node = node.parent
        return False


class TreeBuilder(HTMLParser):
    """Turns a page into a tree of its elements, each with the line it starts on."""

    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name = name
        self.root = Node('#document', {}, 0, None)
        self.open = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {key: (value if value is not None else '') for key, value in attrs},
                    self.getpos()[0], self.open[-1])
        self.open[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.open.append(node)

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        if self.open[-1].tag != tag:
            problem(f'{self.name}:{self.getpos()[0]}: </{tag}> closes <{self.open[-1].tag}> '
                    f'opened on line {self.open[-1].line}')
            if not any(node.tag == tag for node in self.open[1:]):
                return
            while self.open[-1].tag != tag:
                self.open.pop()
        self.open.pop()

    def handle_data(self, data):
        # Text counts for the element it is in and for everything around that.
        for node in self.open[1:]:
            node.text.append(data)


def read_page(lang):
    name = LANGUAGES[lang]['page']
    builder = TreeBuilder(name)
    builder.feed((ROOT / name).read_text(encoding='utf-8'))
    for node in builder.open[1:]:
        problem(f'{name}:{node.line}: <{node.tag}> is never closed')
    return builder.root


def find(root, tag=None, **attrs):
    return [node for node in root.walk()
            if (tag is None or node.tag == tag) and all(node.attrs.get(key.replace('_', '-')) == value
                                                        for key, value in attrs.items())]


def page_link(href):
    """True for a link to another page of the site, such as the film: its path differs from folder to folder."""
    return bool(href) and not href.startswith('#') and '://' not in href and not href.startswith('mailto:')


def signature(node):
    """What must be the same about an element in every language."""
    parts = [node.tag]
    for key in sorted(node.attrs):
        if key in FREE_ATTRIBUTES or (node.tag == 'script' and key == 'src'):
            continue
        if key in PROSE_ATTRIBUTES:
            parts.append(f'{key}="…"' if node.attrs[key].strip() else f'{key}=""')
        elif key == 'class':
            parts.append('class="' + ' '.join(sorted(node.classes())) + '"')
        elif key == 'href' and node.tag == 'a' and page_link(node.attrs[key]):
            # The same page from every language, whatever the way there.
            parts.append('href="→ ' + node.attrs[key].split('#')[0].rsplit('/', 1)[-1] + '"')
        else:
            parts.append(f'{key}="{node.attrs[key]}"')
    return ' '.join(parts)


def ignored(node):
    only_marks_language = node.tag in INLINE_TAGS and node.attrs and set(node.attrs) <= {'lang', 'data-say'}
    return node.tag in IGNORED_TAGS or only_marks_language or 'languages' in node.classes()


def skeleton(node, depth=0):
    """The page as lines to compare, each with the line of the page it came from."""
    lines = [('  ' * depth + signature(node), node.line)]
    inline, blocks = [], []

    def sort_out(children):
        for child in children:
            if ignored(child):
                # What a language mark wraps still counts.
                if 'languages' not in child.classes():
                    sort_out(child.children)
            elif child.tag in INLINE_TAGS:
                inline.append(signature(child))
                sort_out(child.children)
            else:
                blocks.append(child)

    sort_out(node.children)
    if inline:
        lines.append(('  ' * (depth + 1) + 'in the text: ' + ', '.join(sorted(inline)), node.line))
    parts = [skeleton(child, depth + 1) for child in blocks]
    # Each language sorts its glossary by its own alphabet.
    if node.tag == 'dl' and node.inside('glossary'):
        parts.sort(key=lambda part: [text for text, _ in part])
    for part in parts:
        lines.extend(part)
    return lines


def compare_skeletons(pages):
    reference = skeleton(find(pages[REFERENCE], 'body')[0])
    reference_name = LANGUAGES[REFERENCE]['page']
    for lang, page in pages.items():
        if lang == REFERENCE:
            continue
        name = LANGUAGES[lang]['page']
        other = skeleton(find(page, 'body')[0])
        matcher = difflib.SequenceMatcher(None, [text for text, _ in reference], [text for text, _ in other],
                                          autojunk=False)
        differences = [code for code in matcher.get_opcodes() if code[0] != 'equal']
        for _, a1, a2, b1, b2 in differences[:25]:
            lines = [f'{name} differs from {reference_name} in structure:']
            lines += [f'    {reference_name}:{line}:  {text.strip()}' for text, line in reference[a1:a2][:8]]
            if a2 - a1 > 8:
                lines.append(f'    … and {a2 - a1 - 8} more lines of {reference_name}')
            lines += [f'    {name}:{line}:  {text.strip()}' for text, line in other[b1:b2][:8]]
            if b2 - b1 > 8:
                lines.append(f'    … and {b2 - b1 - 8} more lines of {name}')
            if a1 == a2:
                lines.append(f'    (only in {name}, after {reference_name}:{reference[a1 - 1][1]})')
            if b1 == b2:
                lines.append(f'    (missing in {name}, after {name}:{other[b1 - 1][1]})')
            problem('\n'.join(lines))
        if len(differences) > 25:
            problem(f'{name}: {len(differences) - 25} further differences in structure not shown')


def check_head(lang, page):
    name = LANGUAGES[lang]['page']
    here = SITE + LANGUAGES[lang]['folder']
    up = '../' if LANGUAGES[lang]['folder'] else ''

    def expect(what, found, wanted):
        if found != wanted:
            problem(f'{name}: {what} is {found!r}, expected {wanted!r}')

    html = find(page, 'html')
    expect('<html lang>', html[0].attrs.get('lang') if html else None, lang)
    head = find(page, 'head')[0]
    expect('rel=canonical', [node.attrs.get('href') for node in find(head, 'link', rel='canonical')], [here])
    alternates = {node.attrs.get('hreflang'): node.attrs.get('href') for node in find(head, 'link', rel='alternate')}
    wanted = {code: SITE + info['folder'] for code, info in LANGUAGES.items()}
    wanted['x-default'] = SITE + LANGUAGES[REFERENCE]['folder']
    expect('rel=alternate hreflang links', alternates, wanted)
    expect('og:url', [node.attrs.get('content') for node in find(head, 'meta', property='og:url')], [here])
    expect('og:locale', [node.attrs.get('content') for node in find(head, 'meta', property='og:locale')],
           [LANGUAGES[lang]['og']])
    expect('og:locale:alternate',
           sorted(node.attrs.get('content') for node in find(head, 'meta', property='og:locale:alternate')),
           sorted(info['og'] for code, info in LANGUAGES.items() if code != lang))
    expect('stylesheet', [node.attrs.get('href') for node in find(head, 'link', rel='stylesheet')], [up + 'style.css', up + 'film.css'])
    for what, nodes in [('<title>', find(head, 'title')),
                        ('meta description', find(head, 'meta', name='description')),
                        ('og:title', find(head, 'meta', property='og:title')),
                        ('og:description', find(head, 'meta', property='og:description'))]:
        if len(nodes) != 1 or not (nodes[0].all_text() or nodes[0].attrs.get('content', '').strip()):
            problem(f'{name}: {what} is missing or empty')

    # The scripts of the English page, from this page's folder and with this language's strings and recordings.
    reference_scripts = [node.attrs['src'] for node in find(pages[REFERENCE], 'script') if 'src' in node.attrs]
    wanted_scripts = [up + src.replace(f'i18n/{REFERENCE}.js', f'i18n/{lang}.js')
                               .replace(f'audio/{REFERENCE}/', f'audio/{lang}/')
                               .replace(f'audio/film/{REFERENCE}.js', f'audio/film/{lang}.js') for src in reference_scripts]
    expect('script tags', [node.attrs['src'] for node in find(page, 'script') if 'src' in node.attrs], wanted_scripts)
    for src in wanted_scripts:
        if not (ROOT / name).parent.joinpath(src).resolve().exists():
            problem(f'{name}: script {src} does not exist')

    # The language links: relative, with the file name, so they also work from disk.
    links = [node for nav in find(page) if 'languages' in nav.classes() for node in find(nav, 'a')]
    found = [(node.attrs.get('lang'), node.attrs.get('hreflang'), node.attrs.get('href'), node.attrs.get('aria-current'))
             for node in links]
    wanted_links = []
    for code, info in LANGUAGES.items():
        href = 'index.html' if code == lang else up + info['folder'] + 'index.html'
        wanted_links.append((code, code, href, 'true' if code == lang else None))
    expect('language links (lang, hreflang, href, aria-current)', found, wanted_links)


def term_key(text):
    return re.sub(r'\s+', ' ', text.strip().lower())


def without_endings(word, endings):
    # The same rule as withoutEndings() in app.js.
    stems = []
    for ending in endings:
        stem = word[:-len(ending)] if word.endswith(ending) else ''
        if len(stem) >= 3 and stem[-1] != word[-1] and stem not in stems:
            stems.append(stem)
    return stems


def check_terms(lang, page, strings):
    """Every dfn must find its glossary entry the way addTermTooltips() in app.js does."""
    name = LANGUAGES[lang]['page']
    terms = strings.get('terms', {}) if isinstance(strings, dict) else {}
    spellings = {}
    for dt in find(page, 'dt'):
        if not dt.inside('glossary'):
            continue
        key = term_key(dt.all_text())
        also = [term_key(part) for part in dt.attrs.get('data-also', '').split(',') if part.strip()]
        for spelling in [key, *without_endings(key, terms.get('dropped', [])), *also]:
            spellings.setdefault(spelling, key)
        dd = dt.parent.children[dt.parent.children.index(dt) + 1:]
        if not dd or dd[0].tag != 'dd' or not dd[0].children or dd[0].children[0].tag != 'a':
            problem(f'{name}:{dt.line}: glossary entry "{dt.all_text()}" needs a dd whose first element is its link')

    def known(text):
        spelling = term_key(text)
        return spelling in spellings or any(stem in spellings for stem in without_endings(spelling, terms.get('endings', [])))

    for dfn in find(page, 'dfn'):
        if not (dfn.inside('step') or dfn.inside('alt-path')):
            continue
        text = dfn.attrs.get('data-term') or dfn.all_text()
        if not known(text):
            hint = 'data-term' if 'data-term' in dfn.attrs else 'its text'
            problem(f'{name}:{dfn.line}: <dfn> "{dfn.all_text()}" has no glossary entry ({hint} "{text}" matches no dt); '
                    'name the entry in data-term, or list this form in data-also on the dt')


def check_links(lang, page, paper_keys, strings):
    name = LANGUAGES[lang]['page']
    ids = {}
    for node in page.walk():
        if 'id' in node.attrs:
            if node.attrs['id'] in ids:
                problem(f'{name}:{node.line}: id "{node.attrs["id"]}" is already used on line {ids[node.attrs["id"]]}')
            ids[node.attrs['id']] = node.line
    for node in find(page, 'a'):
        href = node.attrs.get('href', '')
        if href.startswith('#') and href[1:] not in ids:
            problem(f'{name}:{node.line}: link to {href}, but no element has that id')
        if page_link(href) and not (ROOT / name).parent.joinpath(href.split('#')[0]).resolve().is_file():
            problem(f'{name}:{node.line}: link to {href}, but there is no such page')
        key = node.attrs.get('data-paper')
        if key is not None and key not in paper_keys:
            problem(f'{name}:{node.line}: data-paper="{key}" is not in papers.js')
        if key is not None and isinstance(strings, dict) and key not in strings.get('papers', {}):
            problem(f'{name}:{node.line}: data-paper="{key}" has no summary in i18n/{lang}.js')
    manifest = ROOT / 'audio' / lang / 'manifest.js'
    if manifest.exists():
        for key in re.findall(r'^\s*"([^"]+)":', manifest.read_text(encoding='utf-8'), re.M):
            if key not in ids:
                problem(f'audio/{lang}/manifest.js: recording "{key}" has no element with that id in {name}')


# Strings

class LiteralReader:
    """Reads the object literal of a strings file: strings, numbers, lists and nested objects."""

    def __init__(self, text, name):
        self.text, self.name, self.at = text, name, 0

    def fail(self, what):
        line = self.text.count('\n', 0, self.at) + 1
        raise ValueError(f'{self.name}:{line}: {what}')

    def skip(self):
        while True:
            match = re.compile(r'\s+|//[^\n]*|/\*.*?\*/', re.S).match(self.text, self.at)
            if not match:
                return
            self.at = match.end()

    def take(self, char):
        self.skip()
        if self.text[self.at:self.at + 1] != char:
            self.fail(f'expected "{char}"')
        self.at += 1

    def peek(self):
        self.skip()
        return self.text[self.at:self.at + 1]

    def string(self):
        quote = self.text[self.at]
        self.at += 1
        out = []
        escapes = {'n': '\n', 't': '\t', 'r': '\r', '0': '\0'}
        while True:
            if self.at >= len(self.text):
                self.fail('text is not closed')
            char = self.text[self.at]
            if char == quote:
                self.at += 1
                return ''.join(out)
            if char == '\\':
                following = self.text[self.at + 1]
                if following == 'u':
                    out.append(chr(int(self.text[self.at + 2:self.at + 6], 16)))
                    self.at += 6
                    continue
                out.append(escapes.get(following, following))
                self.at += 2
                continue
            if quote == '`' and self.text.startswith('${', self.at):
                self.fail('a strings file holds data only: use a {blank}, not ${...}')
            out.append(char)
            self.at += 1

    def value(self):
        char = self.peek()
        if char == '{':
            return self.object()
        if char == '[':
            self.at += 1
            items = []
            while self.peek() != ']':
                items.append(self.value())
                if self.peek() == ',':
                    self.at += 1
            self.at += 1
            return items
        if char in '\'"`':
            return self.string()
        match = re.compile(r'-?\d+(\.\d+)?|true|false|null').match(self.text, self.at)
        if not match:
            self.fail('a strings file holds data only: expected a text, a number, a list or a group')
        self.at = match.end()
        return match.group()

    def object(self):
        self.take('{')
        entries = {}
        while self.peek() != '}':
            if self.peek() in '\'"':
                key = self.string()
            else:
                match = re.compile(r'[A-Za-z_$][\w$]*').match(self.text, self.at)
                if not match:
                    self.fail('expected the name of an entry')
                key, self.at = match.group(), match.end()
            if key in entries:
                self.fail(f'entry "{key}" appears twice')
            self.take(':')
            entries[key] = self.value()
            if self.peek() == ',':
                self.at += 1
        self.at += 1
        return entries


def read_strings(lang):
    name = f'i18n/{lang}.js'
    text = (ROOT / name).read_text(encoding='utf-8')
    start = re.search(r'^const STRINGS = ', text, re.M)
    if not start:
        problem(f'{name}: no "const STRINGS = " found')
        return None
    reader = LiteralReader(text, name)
    reader.at = start.end()
    try:
        strings = reader.value()
        reader.take(';')
        reader.skip()
        if reader.at != len(text):
            reader.fail('nothing may follow the strings')
    except ValueError as error:
        problem(str(error))
        return None
    return strings


def flatten(value, path=''):
    """Every entry by its dotted name, as t() in i18n.js addresses it."""
    if path in FREE_LISTS:
        return {path: value}
    if isinstance(value, dict):
        items = value.items()
    elif isinstance(value, list):
        items = enumerate(value)
    else:
        return {path: value}
    flat = {}
    for key, child in items:
        flat.update(flatten(child, f'{path}.{key}' if path else str(key)))
    return flat


def blanks(text):
    return set(re.findall(r'\{(\w+)\}', text))


def check_strings(all_strings):
    reference = flatten(all_strings[REFERENCE])
    for lang, strings in all_strings.items():
        name = f'i18n/{lang}.js'
        flat = flatten(strings)
        if strings.get('lang') != lang or strings.get('locale') != LANGUAGES[lang]['locale']:
            problem(f'{name}: lang and locale must be "{lang}" and "{LANGUAGES[lang]["locale"]}"')
        for key in reference:
            if key not in flat:
                problem(f'{name}: entry "{key}" is missing (i18n/{REFERENCE}.js has it)')
        for key in flat:
            if key not in reference:
                problem(f'{name}: entry "{key}" is not in i18n/{REFERENCE}.js')
        if [key for key in flat if key in reference] != [key for key in reference if key in flat]:
            problem(f'{name}: the entries are not in the same order as in i18n/{REFERENCE}.js')
        for key, text in flat.items():
            if key in FREE_LISTS:
                if not isinstance(text, list) or not all(isinstance(item, str) for item in text):
                    problem(f'{name}: "{key}" must be a list of words')
                continue
            if not isinstance(text, str) or not text.strip():
                problem(f'{name}: entry "{key}" is empty or not a text')
                continue
            if key not in reference or not isinstance(reference[key], str):
                continue
            used, wanted = blanks(text), blanks(reference[key])
            if key in OPTIONAL_BLANKS:
                if not used or not used <= OPTIONAL_BLANKS[key]:
                    problem(f'{name}: "{key}" may use the blanks {sorted(OPTIONAL_BLANKS[key])}, it uses {sorted(used)}')
            elif used != wanted:
                problem(f'{name}: "{key}" has the blanks {sorted(used)}, i18n/{REFERENCE}.js has {sorted(wanted)}\n'
                        f'    {REFERENCE}: {reference[key]}\n    {lang}: {text}')
            if lang != 'en' and '"' in text:
                problem(f'{name}: "{key}" uses straight quotation marks; use the marks of the language\n    {text}')
            # French sets a narrow no-break space before these marks.
            unspaced = re.search(r'[^  ][;!?]|[^  ]:(?=\s|$)', text) if lang == 'fr' else None
            if unspaced:
                problem(f'{name}: "{key}" needs a narrow no-break space (U+202F) before "{unspaced.group()[-1]}"\n    {text}')


# All together

pages = {}


def main():
    all_strings = {lang: read_strings(lang) for lang in LANGUAGES}
    if all(isinstance(strings, dict) for strings in all_strings.values()):
        check_strings(all_strings)

    for lang in LANGUAGES:
        pages[lang] = read_page(lang)
    paper_keys = set(re.findall(r'^  (\w+): \{', (ROOT / 'papers.js').read_text(encoding='utf-8'), re.M))
    for lang, page in pages.items():
        check_head(lang, page)
        check_terms(lang, page, all_strings[lang])
        check_links(lang, page, paper_keys, all_strings[lang])
    compare_skeletons(pages)

    if problems:
        print('\n'.join(problems))
        print(f'\n{len(problems)} problem{"" if len(problems) == 1 else "s"} found.')
        sys.exit(1)
    counts = ', '.join(f'{LANGUAGES[lang]["page"]} {sum(1 for _ in page.walk()) - 1} elements' for lang, page in pages.items())
    entries = len(flatten(all_strings[REFERENCE]))
    print(f'The three languages fit together: {counts}; {entries} string entries each.')


if __name__ == '__main__':
    main()
