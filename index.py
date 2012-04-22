from flask import Flask, render_template, jsonify, request
from pystache import Renderer

app = Flask(__name__)

class Model(object):
    def __init__(self, name, fields):
        self.name = name
        self.fields = fields

    def toDict(self):
        return dict(self.__dict__, **{
            "fields": [f.toDict() for f in self.fields]
        })

class Field(object):
    def __init__(self, name):
        self.name = name

    def toDict(self):
        return self.__dict__

class Serializer(object):
    def __init__(self, name, template, is_active):
        self.name = name
        self.template = template
        self.is_active = is_active

    def toDict(self):
        return self.__dict__

@app.route('/models')
def models():
    models = [Model("User", [Field("foo")])]
    return jsonify(resp=[m.toDict() for m in models])

@app.route('/serializers')
def serializers():
    tmpl = """
class {{name}}(object):
    def __init__(self{{#fields}}, {{name}}{{/fields}}):
        {{#fields}}
        self.{{name}} = {{name}}
        {{/fields}}
    """
    ss = [Serializer('model-to-py', tmpl, True)]
    return jsonify(resp=[s.toDict() for s in ss])

@app.route('/write', methods=['POST'])
def write():
    f = open("/tmp/tmp.py", "w")
    output = ""
    r = Renderer()
    for model in request.json['models']:
        for serializer in request.json['serializers']:
            output += r.render(serializer['template'], model)
    f.write(output)
    f.close()
    return jsonify(success=True)

@app.route('/')
def index():
    return render_template('index.jinja')

if __name__ == '__main__':
    app.run(debug=True)
