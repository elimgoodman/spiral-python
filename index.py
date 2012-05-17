from flask import Flask, render_template, jsonify, request
from pystache import Renderer
import json
import parser

app = Flask(__name__)

@app.route('/concepts')
def concepts():
    path = "starter.json"
    f = open(path, "r")
    content = f.read()
    concepts = json.loads(content)
    return jsonify(resp=concepts)

@app.route('/')
def index():
    return render_template('editor.jinja')

if __name__ == '__main__':
    app.run(debug=True)
