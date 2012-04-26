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

content = strip_comments(content)
content = strip_newlines(content)
concepts = get_concepts(content)
for name, inner in concepts:
    statements = get_statements(inner)
    print statements
