import os

from flask import Flask
from flask_cors import CORS
from flask_restx import Api, Resource
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

from config import test_config, main_config

socketio = SocketIO()


def create_flask_app():
    # Initialize an instance of Flask RestPlus API
    api = Api(doc="/swaggerui/",
              authorizations={'apikey': {'type': 'apiKey',
                                         'in': 'header',
                                         'name': 'token'}})
    app = Flask(__name__)  # Initialize Flask
    CORS(app)

    if os.environ['MAIN_CONFIG'] == '1':
        app.config.update(main_config)
    else:
        app.config.update(test_config)

    from models import db
    db.init_app(app)

    api.init_app(app, version='0.1', endpoint='/api',
                 title='Task and Budget tracking and management')

    from blueprints.users import users
    api.add_namespace(users, '/api/users')

    # TODO: convert paths into namespaces

    from blueprints.doc_models import models as acc_mod
    api.models = acc_mod.models

    # import teams routes and register
    from blueprints.teams import teams
    api.add_namespace(teams, '/api/teams')

    # import tasks routes and register
    from blueprints.tasks import tasks
    api.add_namespace(tasks, '/api/tasks')

    # import accounts routes and register
    from blueprints.accounts import accounts
    api.add_namespace(accounts, '/api/accounts')

    # import loader route and register
    # from blueprints.load import loader
    # api.add_namespace(loader, '/api/load')

    JWTManager(app)

    # socketio.init_app(app,
    #                   cors_allowed_origins=os.getenv('FRONTEND_URL',
    #                                                  default='http://localhost'))

    return app


if __name__ == '__main__':
    app = create_flask_app()
    app.run()
