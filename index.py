from flask import Flask, render_template, jsonify, request
from pystache import Renderer

import parser

app = Flask(__name__)

@app.route('/concepts')
def concepts():
    path = "starter.spiral"
    f = open(path, "r")
    content = f.read()
    concepts = parser.get_concepts_from_text(content)
    return jsonify(resp=concepts)

@app.route('/')
def index():
    return render_template('editor.jinja')

if __name__ == '__main__':
    app.run(debug=True)
