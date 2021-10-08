''' this module contains the models.models used for API documentation '''
from flask_restx import fields, Api

models = Api()


# the following section is the general models for the swagger documentation

image_model = models.model('Image', {
    'id': fields.Integer(),
    'file': fields.String()
})

team_members_model = models.model('TeamMembers', {
    'team_id': fields.Integer(),
    'member_id': fields.Integer()
})

user_model = models.model('User', {
    'id': fields.Integer(),
    'username': fields.String(),
    'name': fields.String(),
    'email': fields.String(),
    'phone': fields.String(),
    'role': fields.String()
})

name = models.model('name', {
    'name': fields.String()
})

name_id = models.model('name_id', {
    'name': fields.String(),
    'id': fields.Integer()
})

list_of_users = models.model('users_list', {
    'users': fields.List(fields.Nested(user_model))
})

team_model = models.model('Team', {
    'id': fields.Integer(),
    'name': fields.String(),
    'owner': fields.Integer(),
    'description': fields.String(),
    'supervisor': fields.String()
})

list_of_teams = models.model('teams_list', {
    'teams': fields.List(fields.Nested(team_model))
})

account_model = models.model('Account', {
    'id': fields.Integer(),
    'name': fields.String(),
    'description': fields.String(),
    'owner': fields.Integer(),
    'ballance': fields.Float(),
    'allocated': fields.Float(),
    'owner_info': fields.Nested(name_id)
})

list_of_accounts = models.model('accounts', {
    'accounts': fields.List(fields.Nested(account_model))
})

sub_account_model = models.model('SubAccount', {
    'id': fields.Integer(),
    'name': fields.String(),
    'description': fields.String(),
    'ballance': fields.Float(),
    'allocated': fields.Float(),
    'main_account': fields.Integer()
})

list_of_sub_accounts = models.model('sub_accounts', {
    'sub_accounts': fields.List(fields.Nested(sub_account_model))
})

list_all_accounts = models.model('all_accounts', {
    'accounts': fields.List(fields.Nested(account_model)),
    'sub_accounts': fields.List(fields.Nested(sub_account_model))
})


allocation_model = models.model('Allocation', {
    'id': fields.Integer(),
    'account': fields.Integer(),
    'sub_account': fields.Integer(),
    'amount': fields.Float(),
    'ballance': fields.Float(),
    'description': fields.String(),
    'settled': fields.Boolean(),
    'account_allocations': fields.Nested(name),
    'sub_account_allocations': fields.Nested(name),
    'assigned_to': fields.Nested(name)
})

list_of_allocations = models.model('allocations', {
    'allocations': fields.List(fields.Nested(allocation_model))
})

task_note_model = models.model('TaskNote', {
    'id': fields.Integer(),
    'task': fields.Integer(),
    'image': fields.Integer(),
    'user': fields.Integer(),
    'note': fields.String(),
    'end_status': fields.String(enum=['created', 'assigned', 'viewed',
                                      'in_progress', 'on_hold', 'submited',
                                      'regected', 'verified', 'completed']),
    'recept': fields.Float(),
    'timestamp': fields.DateTime(),
    'creator': fields.Nested(name)
})

task_model = models.model('Task', {
    'id': fields.Integer(),
    'name': fields.String(),
    'assigner': fields.Integer(),
    'due_date': fields.DateTime(),
    'description': fields.String(),
    'status': fields.String(enum=['created', 'assigned', 'viewed',
                                  'in_progress', 'on_hold', 'submited',
                                  'regected', 'verified', 'completed']),
    'requires_verification': fields.Boolean(),
    'team': fields.Nested(team_model),
    'user': fields.Nested(user_model),
    'notes': fields.List(fields.Nested(task_note_model)),
    'assigned_user': fields.Nested(name),
    'assigned_team': fields.Nested(name),
    'budget': fields.Nested(allocation_model),
    'creator': fields.Nested(name)
})

list_of_tasks = models.model('tasks', {
    'tasks': fields.List(fields.Nested(task_model))
})


''' listed below are non database models used for specific routes '''

user_model_with_password = models.model('new_user', {
    'username': fields.String(),
    'name': fields.String(),
    'email': fields.String(),
    'phone': fields.String(),
    'role': fields.String(),
    'password': fields.String()
})

user_and_pw = models.model('username_and_password', {
    'username': fields.String(),
    'password': fields.String()
})

user_token = models.model('user_with_token', {
    'user': fields.Nested(user_model),
    'token': fields.String()
})

new_account = models.model('new_account', {
    'name': fields.String(),
    'description': fields.String(),
    'owner': fields.Integer(),
    'ballance': fields.Float(),
    'allocated': fields.Float(),
    'owner_info': fields.Nested(name_id)
})

new_sub_account = models.model('new_sub_account', {
    'name': fields.String(),
    'description': fields.String(),
    'ballance': fields.Float(),
    'allocated': fields.Float(),
    'main_account': fields.Integer()
})

new_sub_account_response = models.model('new_sub_account_response', {
    'new_sub_account': fields.Nested(sub_account_model),
    'updated_main': fields.Nested(account_model)
})

name_discription = models.model('name and description', {
    'name': fields.String(),
    'description': fields.String()
})

transfer_amount = models.model('amount', {
    'amount': fields.Float()
})

new_task = models.model('new_task', {
    'name': fields.String(),
    'assigner': fields.Integer(),
    'due_date': fields.DateTime(),
    'description': fields.String(),
    'status': fields.String(enum=['created', 'assigned', 'viewed',
                                  'in_progress', 'on_hold', 'submited',
                                  'regected', 'verified', 'completed']),
    'requires_verification': fields.Boolean(),
    'team': fields.Nested(team_model),
    'user': fields.Nested(user_model),
    'notes': fields.List(fields.Nested(task_note_model)),
    'assigned_user': fields.Nested(name),
    'assigned_team': fields.Nested(name),
    'budget': fields.Nested(allocation_model),
    'creator': fields.Nested(name)
})

new_task_note = models.model('new_task_note', {
    'image': fields.Integer(),
    'user': fields.Integer(),
    'note': fields.String(),
    'end_status': fields.String(enum=['created', 'assigned', 'viewed',
                                      'in_progress', 'on_hold', 'submited',
                                      'regected', 'verified', 'completed']),
    'recept': fields.Float(),
    'timestamp': fields.DateTime(),
    'creator': fields.Nested(name)
})

new_team = models.model('new_team', {
    'name': fields.String(),
    'owner': fields.Integer(),
    'description': fields.String(),
    'supervisor': fields.String()
})