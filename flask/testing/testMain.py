import enum
import io
import json
import os
import unittest

from flask.globals import request

from passlib.hash import sha256_crypt

from app import create_flask_app
from config import test_config
from models import db, Image, TeamMembers, Team, User,\
    Account, SubAccount, Allocation, TaskStatus, Task,\
    TaskNote


class Method(enum.Enum):
    DELETE = 'delete'
    GET = 'get'
    PATCH = 'patch'
    POST = 'post'
    PUT = 'put'


class BasicTests(unittest.TestCase):

    def setUp(self):
        app = create_flask_app()

        with app.app_context():
            db.drop_all()
            db.create_all()
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        username = os.environ['DEFAULT_USER']
        password = os.environ['DEFAULT_PASSWORD']
        admin = User(username, sha256_crypt.hash(password),
                     'admin', 'email', 'phone', User.Access.ADMIN)
        db.session.add(admin)
        db.session.commit()

        self.DEFAULT_USER = admin
        self.DEFAULT_TOKEN =\
            f'Bearer {self.login(username, password).get_json()["token"]}'

    def tearDown(self):
        self.app_context.pop()

    def request(self, url, method=Method.GET, headers={}, data={}, content_type='application/json'):
        if method is Method.DELETE:
            return self.app.delete(url, follow_redirects=True, headers=headers)
        if method is Method.GET:
            return self.app.get(url, follow_redirects=True, headers=headers)
        if method is Method.PATCH:
            return self.app.patch(url, data=data, follow_redirects=True, content_type=content_type, headers=headers)
        if method is Method.PUT:
            return self.app.put(url, data=data, follow_redirects=True, content_type=content_type, headers=headers)
        if method is Method.POST:
            return self.app.post(url, data=data, follow_redirects=True, content_type=content_type, headers=headers)


    ''' the following methods are the user drivers '''

    def login(self, username, password):
        data = json.dumps({'username': username, 'password': password})
        return self.request('/api/users/login', Method.POST, {}, data)
    
    def create_user(self, token, username, password, name=None, email=None,
                    phone=None, role='inactive'):
        data = json.dumps({'username': username, 'name':name, 'password': password,
                'email': email, 'phone': phone, 'role': role})
        headers = {'Authorization': token}
        return self.request('/api/users', Method.POST, headers, data)
    
    def modify_user(self, token, id, role=None, password=None, name=None,
                    email=None, phone=None):
        data = json.dumps({'name': name, 'role': role, 'password':password, 'email': email,
                'phone': phone})
        headers = {'Authorization': token}
        return self.request(f'/api/users/{id}', Method.PATCH, headers, data)

    def add_user_to_team(self, token, user_id, team_id):
        headers = {"Authorization": token}
        return self.request(f'/api/users/{user_id}/teams/{team_id}',
                            Method.POST, headers)

    def remove_user_from_team(self, token, user_id, team_id):
        headers = {"Authorization": token}
        return self.request(f'/api/users/{user_id}/teams/{team_id}',
                            Method.DELETE, headers)

    def get_all_users(self, token):
        headers = {'Authorization': token}
        return self.request('/api/users/', Method.GET, headers)

    def logout(self):
        return self.request('/api/users/logout', Method.GET)

    def get_user_teams(self, token, user_id):
        headers = {'Authorization': token}
        return self.request(f'/api/users/{user_id}/teams', Method.GET, headers)

    
    ''' the following methods are the account drivers '''

    def get_accounts(self, token):
        headers = {'Authorization': token}
        return self.request(f'/api/accounts/', headers=headers)

    def create_account(self, token, name, owner, description=None,
                       ballance=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'owner': owner, 'description': description,
                'ballance': ballance})
        return self.request(f'/api/accounts/', Method.POST, headers, data)

    def edit_account(self, token, account_id, name=None, description=None,
                     owner=None, ballance=None, add_funds=None,
                     subtract_funds=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'description': description, 'owner': owner,
                'ballance': ballance, 'add_funds': add_funds,
                'subtract_funds': subtract_funds})
        return self.request(f'/api/accounts/{account_id}', Method.PATCH,
                            headers, data)

    def create_sub_account(self, token, account_id, name, description=None,
                           ballance=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'main_account': account_id,
                'description': description, 'ballance': ballance})
        return self.request(f'/api/accounts/{account_id}', Method.POST, headers,
                            data)

    def get_account_transactions(self, token, account_id):
        headers = {'Authorization': token}
        return self.request(f'api/accounts/{account_id}/transactions',
                            Method.GET, headers)

    def get_associated_sub_accounts(self, token, account_id):
        headers = {'Authorization': token}
        return self.request(f'/api/accounts/{account_id}/sub',
                            Method.GET, headers)

    def update_sub_account(self, token, account_id,
                           name=None, description=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'description': description})
        return self.request(f'/api/accounts/sub/{account_id}', Method.PATCH,
                            headers, data)

    def allocate_funds(self, token, account_id, amount):
        headers = {'Authorization': token}
        data = json.dumps({'amount': amount})
        return self.request(f'/api/accounts/sub/{account_id}/allocate',
                            Method.POST, headers, data)

    def deallocate_funds(self, token, account_id, amount):
        headers = {'Authorization': token}
        data = json.dumps({'amount': amount})
        return self.request(f'/api/accounts/sub/{account_id}/deallocate',
                            Method.POST, headers, data)

    def get_sub_account_transactions(self, token, account_id):
        headers = {'Authorization': token}
        return self.request(f'/api/accounts/sub/{account_id}/transactions',
                            Method.GET, headers)

    def get_accounts_and_subs(self, token):
        headers = {'Authorization': token}
        return self.request('/api/accounts/load/', Method.GET, headers)


    ''' the following methods are the teams drivers '''

    def get_teams(self, token):
        headers = {'Authorization': token}
        return self.request('/api/teams/', Method.GET, headers)

    def create_team(self, token, name, owner, description=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'owner': owner, 'description': description})
        return self.request('/api/teams/', Method.POST, headers, data)

    def edit_team(self, token, team_id, name=None,
                  owner=None, description=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'owner': owner, 'description': description})
        return self.request(f'/api/teams/{team_id}',
                            Method.PATCH, headers, data)

    def get_team_members(self, token, team_id):
        headers = {'Authorization': token}
        return self.request(f'/api/teams/{team_id}/members',
                            Method.GET, headers)


    ''' the following methods are the task drivers '''

    def get_tasks(self, token):
        headers = {'Authorization': token}
        return self.request('/api/tasks/', Method.GET, headers)

    def create_task(self, token, name, due_date, description=None, status=None,
                    requires_verification=None, team=None, user=None,
                    ballance=None, account=None, sub_account=None,
                    assigner=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'due_date': due_date, 'description': description,
                'status': status, 'requires_verification':requires_verification,
                'assignedTeam': team, 'assignedUser': user,
                'ballance': ballance, 'account': account,
                'sub_account': sub_account, 'assigner': assigner})
        return self.request('/api/tasks/', Method.POST, headers, data)

    def get_team_tasks(self, token, team_id):
        headers = {'Authorization': token}
        return self.request(f'/api/tasks/team/{team_id}', Method.GET,headers)

    def edit_task(self, token, task_id, name=None, due_date=None,
                  description=None, status=None, requires_verification=None,
                  team=None, user=None, allocation=None):
        headers = {'Authorization': token}
        data = json.dumps({'name': name, 'due_date': due_date, 'description': description,
                'status': status,
                'requires_verification': requires_verification, 'team': team,
                'user': user, 'allocation': allocation})
        return self.request(f'/api/tasks/{task_id}',
                            Method.PATCH, headers, data)

    def add_note_with_image(self, token, task_id, end_status,
                            note, filename, recept):
        headers = {'Authorization': token}
        data = {'end_status': end_status, 'note': note,
                'file': (io.BytesIO(b'someData'), filename), 'recept': recept}
        return self.request(f'/api/tasks/{task_id}', Method.POST, headers,
                            data, 'multipart/form-data')

    def add_note_without_image(self, token, task_id, end_status,
                            note, recept=None):
        headers = {'Authorization': token}
        data = {'end_status': end_status, 'note': note, 'recept': recept}
        return self.request(f'/api/tasks/{task_id}', Method.POST, headers, data, 'multipart/form-data')

    def delete_task(self, token, task_id):
        headers = {'Authorization': token}
        return self.request(f'/api/tasks/{task_id}', Method.DELETE, headers)

    def get_user_assigned_tasks(self, token, user_id):
        headers = {'Authorization': token}
        return self.request(f'/api/tasks/user/{user_id}', Method.GET, headers)

    def get_image(self, token, imageID):
        headers = {'Authorization': token}
        return self.request(f'/api/tasks/image/{imageID}', Method.GET, headers)