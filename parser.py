import re

path = "starter.spiral"

f = open(path, "r")

content = f.read()

def strip_comments(c):
    return re.sub(r'^\s*;.+\n', '', c, flags=re.MULTILINE)

def strip_newlines(c):
    return re.sub(r'\n', '', c, flags=re.MULTILINE)

def get_concepts(c):
    return re.findall(r'concept (\w+)\s*{-\s*(.*?)-}', c, flags=re.MULTILINE | re.DOTALL) 

def get_statements(c):
    return map(lambda s: s.strip(), re.findall(r'([^;]+);', c))

def parse_definition(d):
    d = d.strip()

    what = None
    r_primitive = r'^([a-z]+)'
    r_primitive_param = r'^[a-z]+\((.+)\)'

    primitive = re.findall(r_primitive, d)
    if primitive:
        what = {
            'type': 'Primitive',
            'value': primitive[0]
        }
        primitive_param = re.findall(r_primitive_param, d)
        if primitive_param:
            what['params'] = primitive_param[0].split(',')

    return what

content = strip_comments(content)
content = strip_newlines(content)
concepts = get_concepts(content)
for name, inner in concepts:
    statements = get_statements(inner)
    for statement in statements:
        statement = strip_newlines(statement);
        matched = re.findall(r'([A-Z]\w+\s*)=(.+)', statement)[0]
        (identifier, definition) = matched

        def_parsed = parse_definition(definition)
        print def_parsed

