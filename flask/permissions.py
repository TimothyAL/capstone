from functools import wraps

from flask import Response
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import User, Team


@jwt_required
def is_admin(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = User.query.get(get_jwt_identity()['id'])
        if not user.role == User.Access.ADMIN:
            return Response('requires administrator access', status=403)
        return func(*args, **kwargs)
    return wrapper

def is_admin_func(id):
        user = User.query.filter_by(id=id).first_or_404()
        if user.role == User.Access.ADMIN:
            return True
        return False

def is_admin_or_self(requester_id, target_id):
    if requester_id == target_id:
        return True
    user = User.query.filter_by(id=requester_id).first_or_404()
    if user.role == User.Access.ADMIN:
        return True
    return False


@jwt_required
def is_manager(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = User.query.get(get_jwt_identity()['id'])
        if user.role not in [User.Access.ADMIN, User.Access.MANAGER]:
            return Response('requires manager or better acccess', status=403)
        return func(*args, **kwargs)
    return wrapper

def is_manager_func(id):
        user = User.query.filter_by(id=id).first_or_404()
        if user.role in [User.Access.ADMIN, User.Access.MANAGER]:
            return True
        return False

def is_manager_or_self(requester_id, target_id):
    if requester_id == target_id:
        return True
    user = User.query.filter_by(id=requester_id).first_or_404()
    if user.role in [User.Access.ADMIN, User.Access.MANAGER]:
        return True
    return False


@jwt_required
def is_supervisor(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = User.query.get(get_jwt_identity()['id'])
        if user.role not in [User.Access.ADMIN, User.Access.MANAGER,
                             User.Access.SUPERVISOR]:
            return Response('requires supervisor access or better', status=403)
        return func(*args, **kwargs)
    return wrapper

def is_supervisor_func(id):
        user = User.query.filter_by(id=id).first_or_404()
        if user.role in [User.Access.ADMIN, User.Access.MANAGER,
                         User.Access.SUPERVISOR]:
            return True
        return False

def is_supervisor_or_self(requester_id, target_id):
    if requester_id == target_id:
        return True
    user = User.query.filter_by(id=requester_id).first_or_404()
    if user.role in [User.Access.ADMIN, User.Access.MANAGER,
                     User.Access.SUPERVISOR]:
        return True
    return False


@jwt_required
def is_standard(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = User.query.get(get_jwt_identity()['id'])
        if user.role == User.Access.INACTIVE:
            return Response('requires active account', status=403)
        return func(*args, **kwargs)
    return wrapper


def is_self(requester_id, target_id):
    if requester_id == target_id:
        return True
    return False


def is_member_or_management(requester_id, team_id):
    user = User.query.filter_by(id=requester_id).first_or_404()
    if user.role in [User.Access.ADMIN, User.Access.MANAGER,
                     User.Access.SUPERVISOR]:
        return True
    for current_team in user.teams.all():
        if team_id == current_team.id:
            return True
    return False