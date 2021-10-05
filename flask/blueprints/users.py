import traceback

from flask import jsonify, Response, request
from flask_restx import Resource, Namespace
from flask_jwt_extended import create_access_token
from flask_jwt_extended import create_refresh_token, decode_token
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.exc import DBAPIError, IntegrityError
from passlib.hash import sha256_crypt as crypt

from permissions import is_manager, is_supervisor, is_standard
from models import User, Team, TeamMembers, db

from blueprints.doc_models import user_model, list_of_users, user_token,\
    user_and_pw, list_of_teams, user_model_with_password


users = Namespace('Users')


@users.route('/')
class UserTasks(Resource):
    ''' this class handles updating and creating users '''
    @is_manager
    @users.response(200, 'users', list_of_users)
    @users.response(400, 'could not process request')
    def get(self):
        try:
            # get list of users prepaire as responce and send
            user_list = [user.to_dict() for user in User.query.all()]
            response = jsonify(user_list)
            response.status_code = 200
            return response
        except (IntegrityError):
            # if database error encountered return exception
            return Response('could not process request', status=400)


    @users.response(201, 'user created', user_model)
    @users.response(400, 'must include username, password, and name')
    @users.response(400, 'invalid role assignment')
    @users.response(409, 'Username already exists please select a unique Username')
    @users.response(400, 'there was a problem with your request')
    @users.expect(user_model_with_password)
    @is_manager
    def post(self):
        ''' adds a new user object to the database '''
        req = users.payload
        # check to see if required fields are present
        if all(item not in req for item in ['username', 'password', 'name']):
            print('post to users missing required atribs')
            return Response('must include username, password, and name',
                            status=400)
        try:
            # create user object with required fields
            user = User(req['username'],
                        crypt.hash(req['password']), req['name'])
            # add obtional fields that exist to user object
            if 'email' in req:
                user.email = req['email']
            if 'phone' in req:
                user.phone = req['phone']
            if 'role' in req:
                if req['role'] not in ['standard', 'supervisor', 'inactive']:
                    print('roll invalid')
                    return Response('invalid role assignment', status=400)
                user.role = User.Access(req['role'])
            # create session add user commit to database
            db.session.add(user)
            db.session.commit()
            # create and send responce
            response = jsonify(user.to_dict())
            response.status_code = 201
            return response
        except DBAPIError:
            return Response('Username already exists please select a unique Username',
                            status=409)
        except (IntegrityError, AttributeError):
            # return error if exception is encountered
            return Response('there was a problem with your request',
                            status=400)


@users.route('/login')
class Login(Resource):
    '''this class handles genterating user validation and login'''
    @users.response(203, 'user logged in', user_token)
    @users.response(403, 'invalid creadentials')
    @users.response(400, 'invalid request')
    @users.expect(user_and_pw)
    def post(self):
        ''' takes generates a user token if the user name
        and password are correct '''
        req = users.payload
        try:
            # get user from database
            user = User.query.filter_by(username=req['username']).first()
            # tests to see if the provided password matches found user
            # if no user is found will raise a key error
            # if incorect password raises an attribute error
            if user is None or not crypt.verify(req['password'],
                                                user.password):
                return Response('invalid creadentials', status=400)
            # prepare responce create token
            data = {}
            data['user'] = user.to_dict()
            data['token'] = create_access_token(identity=user.to_dict())
            response = jsonify(data)
            response.set_cookie('refresh_token',
                                create_refresh_token(identity=user.to_dict()),
                                httponly=True,
                                secure=True)
            response.status_code = 203
            # return token and user info
            return response
        except (IntegrityError, KeyError):
            # if a database error or password error is encountered returns 400
            return Response('invalid request', status=400)


@users.route('/refresh')
class Refresh(Resource):
    ''' this class handles generating refresh tokens '''
    @users.response(203, 'token updates', user_token)  # token
    @is_standard
    def get(self):
        '''generates a refresh token requires a token'''
        refresh_token = request.cookies.get('refresh_token')
        user = User.query.get(decode_token(refresh_token)
                              ['sub']['id']).to_dict()
        data = {}
        data['user'] = user
        data['token'] = create_access_token(identity=user)
        return jsonify(data)

@users.route('/logout')
class Logout(Resource):
    ''' this class handles cleanup of sessions by clearing a token '''
    def get(self):
        ''' deletes the session cookie '''
        response = Response('', status=200)
        response.delete_cookie('refresh_token')
        return response


@users.route('/<int:userid>')
class UserSpecific(Resource):
    @users.response(200, 'user updated', user_model)  # returns a user object
    @users.response(404, 'the requested URL could not be located on the server')
    @users.response(403, 'cannot edit user')
    @users.response(403, '')
    @users.response(403, 'cannot edit your own role')
    @users.response(403, 'must be admin to create an admin')
    @users.response(403, 'must be manager to promote to this role')
    @users.response(403, 'you cannot demote an admin')
    @users.response(403, 'you do not have the rights to carry out this permotion')
    @users.response(403, 'you can not demote someone who outranks you')
    @users.response(403, 'you do not have access to perform this request')
    @users.response(403, 'you do not have access to demote this user')
    @users.response(403, 'you do not have access to change this users password')
    @users.response(400, 'could not process request')
    @users.expect(user_model)
    @is_standard
    def patch(self, userid):
        ''' this method is used to update a user object '''
        try:
            # get user for update
            user = User.query.filter_by(id=userid).first_or_404()
            # get requester object
            requester = User.query.filter_by(id=get_jwt_identity()['id']).\
                first_or_404()
            # test to make sure that user is self or manager
            if user.id != requester.id and requester.role not in\
                    [User.Access.ADMIN, User.Access.MANAGER,
                     User.Access.SUPERVISOR]:
                return Response('cannot edit user', status=403)
            req = users.payload
            if 'role' in req and req['role'] is not None and\
                    User.Access(req['role']) != user.role:
                # test permissions for role update.
                # user or supervisor cannot change role
                # only admins can create admin
                # requesters cannot change roles for users that have a higer
                # level of access then themselves
                if user.id == requester.id or requester.role not in\
                        [User.Access.ADMIN, User.Access.MANAGER]:
                    return Response("cannot edit your own role", status=403)
                elif user.role == User.Access.ADMIN and user.id != requester.id:
                    return Response('only an admin can edit their own role', status=403)
                if User.Access(req['role']) == User.Access.ADMIN and\
                        requester.role != User.Access.ADMIN:
                    return Response('must be admin to create an admin', status=403)
                if User.Access(req['role']) == User.Access.MANAGER:
                    if requester.role not in\
                            [User.Access.MANAGER, User.Access.ADMIN]:
                        return Response('must be a manager to' +
                                        ' promote to this role', status=403)
                    if user.role == User.Access.ADMIN:
                        return Response('you cannot demote an admin')
                if User.Access(req['role']) == User.Access.SUPERVISOR:
                    if requester.role not in [User.Access.ADMIN,
                                              User.Access.MANAGER]:
                        return Response('you do not have the' +
                                        ' rights to carry out this permotion',status=403)
                    if user.role == User.Access.MANAGER and\
                            requester.role != User.Access.ADMIN:
                        return Response('you cannot demote someone' +
                                        ' that outranks you', status=403)
                if User.Access(req['role']) in [User.Access.STANDARD,
                                                User.Access.INACTIVE]:
                    if requester.role not in [User.Access.ADMIN,
                                              User.Access.MANAGER]:
                        return Response('you do not have the access' +
                                        ' to perform this request')
                    if user.role == User.Access.MANAGER and\
                            requester.role != User.Access.ADMIN:
                        return Response('you do not have access' +
                                        ' to demote this user', status=403)
                user.role = User.Access(req['role'])
            if 'password' in req and req['password']:
                # only self manager or admin can reset password
                if user.id != requester.id and\
                        requester.role not in\
                        [User.Access.ADMIN, User.Access.MANAGER]:
                    return Response('you do not have access to' +
                                    'change this users password', status=403)
                # if requester can change password store it's hash
                user.password = crypt.hash(req['password'])
            # update other atributes if present
            if 'name' in req and req['name'] is not None:
                user.name = req['name']
            if 'email' in req and req['email'] is not None:
                user.email = req['email']
            if 'phone' in req and req['phone'] is not None:
                user.phone = req['phone']
            # commit changes
            db.session.commit()
            # prepare response and send
            response = jsonify(user.to_dict())
            response.status_code = 200
            return response
        except (IntegrityError, AttributeError):
            traceback.format_exc()
            # if database or attribute error encountered return error
            return Response('could not process request', status=400)


@users.route('/<int:userId>/teams')
class UserTeams(Resource):
    '''this class handles retreval of teams assignment'''
    @users.response(200, 'teams', list_of_teams)
    @users.response(400, 'could not process request')
    @is_supervisor
    def get(self, userId):
        '''this method returns a list of all teams that user belongs to'''
        try:
            user = User.query.filter_by(id=userId).first()
            # get all teams that user is part of
            teams_list = [team.to_dict() for team in user.teams.all()]
            # prepaire response and send
            response = {}
            response = jsonify(teams_list)
            response.status_code = 200
            return response
        except (IntegrityError):
            # if database error encountered return error
            return Response('could not process request', status=400)

@users.route('/<int:userID>/teams/<int:teamID>')
class UserTeamsDelete(Resource):
    @users.response(201, 'assignment created')
    @users.response(400, 'could not process request')
    @users.response(404, 'the requested URL could not be found on the server')
    @users.response(409, 'Username already exists please select a unique Username')
    @is_manager
    def post(self, userID, teamID):
        ''' this method adds a user to a team '''
        try:
            # get requested user if not found return error
            user = User.query.filter_by(id=userID).first_or_404()
            # get team assignment is part of return error if not found
            team = Team.query.filter_by(id=teamID).first_or_404()
            # create assignment
            user.teams.append(team)
            # add new assignment to session and commit to database
            db.session.commit()
            return Response('assignment created', status=200)
        except DBAPIError:
            db.session.rollback()
            return Response('Username already exists please select a unique Username',
                            status=409)
        except (IntegrityError, AttributeError):
            # if database or missing attribute error return error
            return Response('could not process request', status=400)

    @users.response(500, 'could not process request')
    @users.response(404, 'the requested URL could not be found on the server')
    @users.response(200, 'relation deleted')
    @is_manager
    def delete(self, userID, teamID):
        ''' this method removes a user from a team '''
        req = users.payload
        try:
            # get the requested user if not found return error
            user = User.query.filter_by(id=userID).first_or_404()
            # verify user is assigned to team
            team = user.teams.filter_by(id=teamID).first_or_404()
            # get the association
            association = TeamMembers.query.filter_by(team_id=team.id, member_id=user.id).first_or_404()
            # delete the association
            db.session.delete(association)
            db.session.commit()
            return Response('relation deleted', status=200)
        except(IntegrityError) as error:
            print(error)
            return Response('could not process request', status=500)
