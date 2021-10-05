import os

from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from passlib.hash import sha256_crypt

from app import create_flask_app, socketio
# from config import main_config
from models import db, User
import socketevents

app = create_flask_app()

migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)


@manager.command
def create_admin():
    # return if admin exists else create admin
    if User.query.filter_by(username=os.environ['DEFAULT_USER']).first():
        return
    admin = User(os.environ['DEFAULT_USER'],
                 sha256_crypt.hash(os.environ['DEFAULT_PASSWORD']),
                 'admin',
                 'test@test.com',
                 '0000000000',
                 User.Access('admin'))
    db.session.add(admin)
    db.session.commit()


@manager.command
def run():
    socketio.run(app, host='0.0.0.0', port=5000, use_reloader=True, debug=True)

if __name__ == '__main__':
    manager.run()
