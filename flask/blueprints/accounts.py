from os import stat
from flask import jsonify, Response
from werkzeug.wrappers import Response
from flask_restx import Resource, Namespace
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename

from errors import OverAllocatedError, InsufficentFundsError
from permissions import is_manager, is_admin, is_supervisor
from models import Account, SubAccount, db, User, Allocation
from blueprints.doc_models import list_of_accounts, account_model, new_account,\
    new_sub_account, new_sub_account_response, list_of_sub_accounts,\
    list_of_allocations, sub_account_model, name_discription, transfer_amount,\
    list_all_accounts


accounts = Namespace('Accounts')


@accounts.route('/')
class AccountBasic(Resource):
    ''' this class handles accessing summerys and creating of accounts '''
    @accounts.response(200, '', list_of_accounts)
    @accounts.response(400, 'could not process request')
    @jwt_required()
    @is_manager
    def get(self):
        ''' this method returns a list of all accounts, their ballances,
        and their discriptions '''
        try:
            account_list = [account.to_dict() for account in Account.query.all()]
            response = jsonify(account_list)
            response.status_code = 200
            return response
        except (IntegrityError):
            # if database error return error
            return Response('could not process request', status=400)

    @accounts.response(201, 'account', account_model)
    @accounts.response(400, 'could not process your request')
    @accounts.expect(new_account)
    @is_admin
    def post(self):
        ''' this method handles creating of a new account object '''
        req = accounts.payload
        new_account = {}
        try:
            # check for required info
            if not all(k in req for k in ['name', 'owner'] ):
                return Response('missing required infor to create account',
                                status=400)
            # create var to hold optional vars
            description = None
            ballance = None
            # if optional vars in req store them
            if 'description' in req:
                description = req['description']
            if 'ballance' in req:
                ballance = req['ballance']
            # create account
            new_account = Account(req['name'], req['owner'],
                                  description, ballance)
            # add new account to database prepaire responce and return
            db.session.add(new_account)
            db.session.commit()
            response = jsonify(new_account.to_dict())
            response.status_code = 201
            return response
        except (IntegrityError, AttributeError):
            # if database or attribute error encountered return error
            return Response('Could not process your request', status=400)


@accounts.route('/<int:id>')
class AccountSpecific(Resource):
    ''' this class handles the retreval of detailed account information
    as well as updating of accounts '''
    @accounts.response(202, '', account_model)
    @accounts.response(400, 'could not process your request')
    @accounts.response(400, 'insuficent funds')
    @accounts.response(404, 'the URL could not be found on the server')
    @accounts.expect(account_model)
    @jwt_required()
    @is_manager
    def patch(self, id):
        ''' this method updates the given account object '''
        try:
            req = accounts.payload
            # find the account to be updated
            account = Account.query.filter_by(id=id).first_or_404()
            # update account with present atributes
            if 'name' in req and req['name'] is not None:
                account.name = req['name']
            if 'description' in req:
                account.description = req['description']
            if 'owner' in req and req['owner'] is not None:
                account.owner = req['owner']
            if 'ballance' in req and req['ballance'] is not None:
                account.ballance = req['ballance']
            # add or subtract from ballance for adjustments
            if 'add_funds' in req and req['add_funds'] is not None:
                account.ballance += float(req['add_funds'])
            if 'subtract_funds' in req and req['subtract_funds'] is not None:
                # check that removal of funds would not leave
                # negitive ballance
                if account.ballance - account.allocated -\
                        float(req['subtract_funds']) <= 0:
                    return Response('insuficent funds', 400)
                account.ballance -= float(req['subtract_funds'])
            # commit changes
            db.session.commit()
            response = jsonify(account.to_dict())
            response.status_code = 202
            return response
        except (IntegrityError, AttributeError):
            # if database or attribute error return error
            return Response('could not process your request', status=400)

    @accounts.response(201, '', new_sub_account_response)
    @accounts.response(400, 'missing required info for new sub account')
    @accounts.response(400, 'could not process your request')
    @accounts.response(404, 'The requested URL was not found on the server.')
    @accounts.response(403, 'Not enough funds avalible')
    @accounts.expect(new_sub_account)
    @jwt_required()
    @is_manager
    def post(self, id):
        ''' this method creates a new sub account
        assocated with the main account '''
        try:
            req = accounts.payload
            # if payload doesn't have required info return error
            if not all(k in req for k in ['name', 'main_account']):
                return Response('missing required info for new sub account',
                                status=400)
            # get the main account raise error if not present
            main_account = Account.query.filter_by(id=id).first_or_404()
            # create vars for optional atribs
            description = None
            ballance = None
            if 'description' in req:
                description = req['description']
            if 'ballance' in req:
                ballance = float(req['ballance'])
            # create new account object
            new_sub = SubAccount(req['name'], id, description, ballance)
            # add new sub account to database and commit changes
            db.session.add(new_sub)
            db.session.commit()
            # prepaire respnce and return
            response = jsonify({'new_sub_account': new_sub.to_dict(),
                                'updated_main': main_account.to_dict()})
            response.status_code = 201
            return response
        except (IntegrityError, AttributeError) as error:
            # if database or attribute error encountered return error
            return Response('could not process request', status=400)
        except (OverAllocatedError):
            return Response('Not enough funds avalible', status=403)


@accounts.route('/<int:id>/sub')
class SubAccount_Management(Resource):
    ''' this class handles retreving info about '''
    @accounts.response(200, '', list_of_sub_accounts)
    @accounts.response(400, 'could not process request')
    @is_manager
    def get(self, id):
        ''' this method returns a list of all the sub accounts associated
        with the main account including description and ballance '''
        try:
            # get all sub accounts for given account
            account = Account.query.filter_by(id=id).first_or_404()
            sub_account_list = [account.to_dict() for
                                account in
                                account.sub_accounts.all()]
            # prepaire responce and return
            response = jsonify(sub_account_list)
            response.status_code = 200
            return response
        except (IntegrityError, AttributeError) as error:
            # if database or attribute error return error
            return Response('could not process request', status=401)


@accounts.route('/<int:id>/transactions')
class SubAccount_transactions(Resource):
    ''' this class handles getting transactions for an account '''
    @accounts.response(200, 'accounts', list_of_allocations)
    @accounts.response(400, 'could not process your request')
    @is_manager
    def get(self, id):
        ''' this method returns a list of all transactions on an account '''
        try:
            # check to make sure sub account object exists
            account = Account.query.filter_by(id=id).first_or_404()
            # get transactions
            transactions = [allocation.to_dict() for allocation in
                                account.transactions]
            response = jsonify(transactions)
            response.status_code = 200
            return response
        except (IntegrityError, AttributeError) as error:
            return Response('could not process your request', status=400)


@accounts.route('/sub/<int:id>')
class SubAccountManagement(Resource):
    ''' this class handles updating specific sub accounts '''
    @accounts.response(201, '', sub_account_model)
    @accounts.response(400, 'could not process your request')
    @accounts.response(404, 'The requested URL was not found on the server')
    @accounts.expect(name_discription)
    @is_manager
    def patch(self, id):
        ''' this method handles editing a sub account '''
        try:
            req = accounts.payload
            # get target account or raise error if it doesn't exist
            sub_account = SubAccount.query.filter_by(id=id).first_or_404()
            # adjust other attributes if present
            if 'name' in req and req['name'] is not None:
                sub_account.name = req['name']
            if 'description' in req and req['description'] is not None:
                sub_account.description = req['description']
            # commit changes
            db.session.commit()
            # prepare and return sub account
            response = jsonify(sub_account.to_dict())
            response.status_code = 201
            return response
        except (IntegrityError, AttributeError):
            # if database or attribute error return error
            return Response('could not process your request', status=400)


@accounts.route('/sub/<int:id>/allocate')
class SubAccount_add_allocation(Resource):
    ''' this class handles transfering funds from the main account '''
    @accounts.response(201, '', sub_account_model)
    @accounts.response(400, 'missing amount to transfer')
    @accounts.response(400, 'could not process your request')
    @accounts.response(422, 'funds not avalible')
    @accounts.response(404, 'The requested URL was not found on the server.')
    @accounts.expect(transfer_amount)
    @is_manager
    def post(self, id):
        ''' this method allocates funds from the
        main account to the sub account '''
        try:
            # get sub account object
            account = SubAccount.query.filter_by(id=id).first_or_404()
            # get request body
            req = accounts.payload
            # return error if amount to allocate not present
            if 'amount' not in req:
                return Response('missing amount to transfer', status=400)
            # call update function
            account.transfer_in(req['amount'])
            # prepare sucsessfull responce
            response = jsonify(account.to_dict())
            response.status_code = 201
            # return responce
            return response
        except OverAllocatedError:
            return Response('funds not avalible', status=422)
        except (IntegrityError, AttributeError):
            # if database or attribute error encountered return error
            return Response('could not process your request', status=400)
            

@accounts.route('/sub/<int:id>/deallocate')
class SubAccount_release_allocation(Resource):
    ''' this class handles transfering funds to the main account '''
    @accounts.response(201, '', sub_account_model)
    @accounts.response(400, 'missing amount to transfer')
    @accounts.response(400, 'could not process your request')
    @accounts.response(404, 'the requested URL was not found on the server')
    @accounts.response(422, 'funds not avalible')
    @accounts.expect(transfer_amount)
    @is_manager
    def post(self, id):
        ''' this method releases funds from the sub account to
        the main account '''
        try:
            # get sub account object
            account = SubAccount.query.filter_by(id=id).first_or_404()
            # get request body
            req = accounts.payload
            # return error if amount to deallocate not present
            if 'amount' not in req:
                return Response('missing amount to transfer', status=400)
            # call update function
            account.release_funds(req['amount'])
            # prepare sucsessfull responce
            response = jsonify(account.to_dict())
            response.status_code = 201
            # return responce
            return response
        except InsufficentFundsError:
            return Response('funds not avalible', status=422)
        except (IntegrityError, AttributeError):
            # if database or attribute error encountered return error
            return Response('could not process your request', status=400)


@accounts.route('/sub/<int:id>/transactions')
class SubAccount_transactions(Resource):
    ''' this class handles getting transactions for a sub account '''
    @accounts.response(200, 'transactions', list_of_allocations)
    @accounts.response(400, 'could not process your request')
    @accounts.response(404, 'the requested url could not be located on the server')
    @is_manager
    def get(self, id):
        ''' this method returns a list of all transactions on a sub account '''
        try:
            # check to make sure sub account object exists
            account = SubAccount.query.filter_by(id=id).first_or_404()
            # get transactions
            transactions = [allocation.to_dict() for allocation in
                                account.transactions]
            response = jsonify(transactions)
            response.status_code = 200
            return response
        except (IntegrityError, AttributeError) as error:
            return Response('could not process your request', status=400)


@accounts.route('/load/')
class LoadAccounts(Resource):
    ''' this class loads all accounts to the front end for task creation '''
    @accounts.response(200, 'accounts', list_all_accounts)
    @accounts.response(400, 'could not process request')
    @is_supervisor
    def get(self):
        ''' this method returns a list of accounts
        and a list of sub_accounts '''
        try:
            accounts = [account.to_dict() for account in Account.query.all()]
            sub_accounts = [sub_account.to_dict()
                            for sub_account in SubAccount.query.all()]
            response = {}
            response['accounts'] = accounts
            response['sub_accounts'] = sub_accounts
            response = jsonify(response)
            response.status_code = 200
            return response
        except (IntegrityError) as error:
            return Response("could not process request", status=400)
