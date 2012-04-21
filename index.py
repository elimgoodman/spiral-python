from flask import Flask, render_template, jsonify
app = Flask(__name__)

@app.route('/models')
def models():
    return jsonify(models=[{"foo": "bar"}])

@app.route('/serializers')
def models():
    return jsonify(serializers=[{"foo": "bar"}])

@app.route('/write', methods=['POST'])
def models():
    return jsonify(success=True)

@app.route('/')
def index():
    return render_template('index.jinja')

if __name__ == '__main__':
    app.run(debug=True)
