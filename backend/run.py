
from flask import Flask
from flask_cors import CORS
from app import create_app, socketio

app = create_app()
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000', 'supports_credentials': True}})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)