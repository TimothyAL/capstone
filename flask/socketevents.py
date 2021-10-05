import functools

from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import disconnect, emit
from jwt.exceptions import DecodeError

from models import User
from app import socketio


def requires_authentication(function):
    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        refresh_token = request.cookies.get('refresh_token')
        try:
            user = User.query.get(decode_token(refresh_token)
                                  ['identity']['id'])
        except DecodeError:
            disconnect()
            return False
        if (user.role == User.Access.INACTIVE):
            disconnect()
            return False
        return function(*args, **kwargs)


@requires_authentication
@socketio.on('connect')
def on_connect():
    pass
