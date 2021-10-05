from flask import jsonify, Response
from flask_restx import Resource, Api, Namespace
from sqlalchemy.exc import IntegrityError

import traceback

from permissions import is_manager, is_standard
from models import db, Team, User
from blueprints.doc_models import list_of_teams, team_model, new_team,\
    list_of_users

api = Api()


teams = Namespace('Teams')


@teams.route('/')
class Teams(Resource):
    '''This class handles retreving a list of teams'''
    @teams.response(200, 'teams', list_of_teams)  # list of team objects
    @teams.response(400, 'could not process request')
    @is_manager
    def get(self):
        ''' this method returns a list of all the teams and
        their discriptions '''
        try:
            # get all teams id name and description
            team_list = [team.to_dict() for team in Team.query.all()]
            # prepare and send response
            response = jsonify(team_list)
            response.status_code = 200
            return response
        except (IntegrityError):
            # if database error encountered return error
            return Response('could not process request', status=400)

    @teams.response(201, 'team created', new_team)
    @teams.response(400, 'missing requirements or invalid owner')
    @teams.response(404, 'the URL could not be located on the server')
    @teams.response(400, 'could not process request')
    @teams.expect(team_model)
    @is_manager
    def post(self):
        '''this method creates a new team object'''
        req = teams.payload
        try:
            # check to make sure all required fields in req else return error
            if not all(i in req for i in ['name', 'owner']) and\
                    User.query.filter_by(id=req['owner']).first_or_404().role not in\
                    [User.Access.ADMIN, User.Access.MANAGER,
                     User.Access.SUPERVISOR]:
                print(f"the request was missing info: {req}")
                return Response('missing requirements or invalid owner',
                                status=400)
            # create new team object from req
            new_team = Team(req['name'], req['owner'])
            # add optional filds
            if 'description' in req and req['description']:
                new_team.description = req['description']
            # add new team to session and commit
            db.session.add(new_team)
            db.session.commit()
            # prepare response and send
            response = jsonify(new_team.to_dict())
            response.status_code = 201
            return response
        except (IntegrityError, AttributeError)as error:
            # if database or attibute error encountered return error
            print(f"encountered an error, {error}")
            return Response('could not process request', status=400)


@teams.route('/<int:id>')
class TeamIndividual(Resource):
    @teams.response(201, 'team updated', team_model)  # returns an updated team object
    @teams.response(404, 'the requested URL could not be found on the server')
    @teams.response(400, 'could not process request')
    @teams.expect(team_model)
    @is_manager
    def patch(self, id):
        ''' this method is for updating a team object '''
        req = teams.payload
        try:
            # get team object
            team = Team.query.filter_by(id=id).first_or_404()
            # update team object
            if 'name' in req and req['name'] is not None:
                team.name = req['name']
            if 'owner' in req and req['owner'] is not None:
                new_owner = User.query.filter_by(id=req['owner'])\
                    .first_or_404()
                team.owner = new_owner.id
            if 'description' in req and req['description'] is not None:
                team.description = req['description']
            # commit changes
            db.session.commit()
            # prepare response and return
            response = jsonify(team.to_dict())
            response.status_code = 201
            return response
        except (IntegrityError, AttributeError):
            # if database or attribute error encountered return error
            return Response('could not process request', status=400)


@teams.route('/<int:id>/members')
class TeamUpdate(Resource):
    ''' this class is used to update team roster '''
    @teams.response(200, 'team members', list_of_users)
    @teams.response(404, 'the requested URL could not be located on the server')
    @teams.response(400, 'could not process request')
    @is_manager
    def get(self, id):
        ''' this method is used to get a list of all the members
        on a given team '''
        try:
            # verify team exists
            team = Team.query.filter_by(id=id).first_or_404()
            # query the teammembers table for members
            members = [usr.to_dict() for usr in team.member_list]
            # return list of members
            response = jsonify(members)
            response.status_code = 200
            return response
        except (IntegrityError, AttributeError):
            # if database or attribute error return error
            print(traceback.format_exc())
            return Response('could not process request', status=400)
