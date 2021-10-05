from datetime import datetime
import os
import traceback

from flask import jsonify, request, Response, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Resource, Namespace
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename

from permissions import is_manager, is_standard, is_supervisor, is_supervisor_or_self,\
    is_member_or_management, is_manager_func
from models import Task, User, Team, Image
from models import TaskStatus, db, TaskNote
from errors import OverAllocatedError, InsufficentFundsError

from blueprints.doc_models import task_model, list_of_tasks, new_task,\
    task_note_model, new_task_note

tasks = Namespace('Tasks')


@tasks.route('/')
class NewTask(Resource):
    ''' this class handels creating new tasks and getting
    tasks assigned to you '''
    @tasks.response(200, 'tasks', list_of_tasks)
    @tasks.response(400, 'could not process request')
    @tasks.response(501, 'type error')
    @jwt_required()
    @is_supervisor
    def get(self):
        ''' this method returns a list of all tasks '''
        try:
            tasks = [task.to_dict() for task in Task.query.all()]
            # prepaire responce
            response = jsonify(tasks)
            response.status_code = 200
            # return response
            return response
        except (IntegrityError, AttributeError) as error:
            # if database or attribute error return error
            print(error)
            return Response('could not process request', status=400)
        except TypeError as error:
            print(error)
            return Response('type error', status=501)

    @tasks.response(201, 'task created', new_task)
    @tasks.response(400, 'could not precess your request')
    @tasks.response(403, 'insuficient funds')
    @tasks.response(400, 'could not process your request')
    @tasks.expect(task_model)
    @jwt_required()
    @is_supervisor
    def post(self):
        ''' this method handles creating a task object '''
        try:
            req = tasks.payload
            # create new task object with helper function
            name = req['name']
            due_date = req['due_date']
            description = req['description'] if req['description'] != '' else None
            status = req['status']
            requires_verfification = req['requires_verification']
            team = int(req['assignedTeam']) if 'assignedTeam' in req and req['assignedTeam'] != '-' and\
                req['assignedTeam'] is not None and int(req['assignedTeam']) > 0 else None
            user = int(req['assignedUser']) if 'assignedUser' in req and req['assignedUser'] != '-' and\
                req['assignedUser'] is not None and int(req['assignedUser']) > 0 else None
            allocation = {}
            if 'ballance' in req and req['ballance'] and float(req['ballance']) > 0 and\
                    is_manager_func(get_jwt_identity()['id']):
                allocation['ballance'] = float(req['ballance'])
                if 'account' in req and req['account'] is not None\
                        and req['account'] != '-' and int(req['account']) > 0:
                    allocation['account'] = int(req['account'])
                if 'sub_account' in req and req['sub_account'] is not None\
                        and req['sub_account'] != '-' and int(req['sub_account']) > 0:
                    allocation['sub_account'] = int(req['sub_account'])
            assigner = req['assigner']
            n_task = Task(name=name, due_date=due_date, description=description,
                          status=status, requires_verification=requires_verfification,
                          team=team, user=user, allocation=allocation,
                          assigner=assigner)
            # add new task to database
            db.session.add(n_task)
            db.session.commit()
            # prepaire response
            response = jsonify(n_task.to_dict())
            response.status_code = 201
            return response
        except OverAllocatedError:
            return Response('insuficient funds', status=403)
        except (IntegrityError, AttributeError, KeyError):
            # if database or attribute error encountered return error
            print(traceback.format_exc())
            return Response('could not process request', status=400)


@tasks.route('/<int:taskid>')
class IndividualTask(Resource):
    ''' this class handles getting or updating individual tasks '''
    @tasks.response(201, 'task updated')
    @tasks.response(404, 'the requested URL could not be located')
    @tasks.response(400, 'could not process your request')
    @tasks.response(403, 'you do not have the required access for this update')
    @tasks.response(403, 'you do not have proper access to edit allocations')
    @tasks.response(400, 'please update allocation and other updates seperatly')
    @tasks.expect(task_model)
    @jwt_required()
    @is_supervisor
    def patch(self, taskid):
        ''' this method updates a tasks information '''
        try:
            requester = User.query\
                .filter_by(id=get_jwt_identity()['id'])\
                .first_or_404()
            # check to make sure supervisor is of team assigned or manager
            # retreve task
            task = Task.query.filter_by(id=taskid).first_or_404()
            updates = tasks.payload
            # create string to store note for update record
            note = f'{requester.name} updated task:: '
            # update task
            if 'name' in updates and updates['name'] is not None:
                task.name = updates['name']
                note += f"name: {updates['name']}, "
            if 'due_date' in updates and updates['due_date'] is not None:
                task.due_date = updates['due_date']
                note += f"due date: {updates['due_date']} "
            if 'description' in updates and updates['description'] is not None:
                task.description = updates['description']
                note += f"description: {updates['description']} "
            if 'status' in updates and updates['status'] is not None:
                task.status = TaskStatus(updates['status'])
                note += f"status: {updates['status']} "
            if 'requires_verification' in updates and\
                    updates['requires_verification'] is not None:
                if task.requires_verification !=\
                        updates['requires_verification']:
                    task.requires_verification = updates['requires_verification']
                    note += "requires verification: " +\
                        f"{updates['requires_verification']} "
            if 'team' in updates and updates['team']:
                team = Team.query.filter_by(id=int(updates['team']))\
                    .first_or_404()
                task.team = team.id
                task.user = None
                note += f"assigned to {team.name} "
            if 'user' in updates and updates['user']:
                user = User.query.filter_by(id=int(updates['user']))\
                    .first_or_404()
                task.user = user.id
                task.team = None
                note += f"assigned to {user.name} "
            if 'allocation' in updates and updates['allocation'] is not None\
                    and is_manager_func(get_jwt_identity()['id']):
                if task.allocation:
                    return Response('please update allocation and ' +
                                    'other updates seperatly',
                                    status=400)
                task.make_allocation(updates['allocation'])
            # create new TaskNote with note and status from updates
            #  add to session
            # commit new note and udpates
            new_note = TaskNote(task.id, requester.id, task.status, note=note)
            db.session.add(new_note)
            db.session.commit()
            return Response('task updated', 201)
        except InsufficentFundsError:
            return Response('insufficentFunds', status=403)
        except (IntegrityError, AttributeError):
            return Response('could not process request', status=400)

    @tasks.response(201, 'note appended', task_note_model)
    @tasks.response(400, 'problem with image')
    @tasks.response(403, 'insuficient access to complete task')
    @tasks.response(400, 'could not process your request')
    @tasks.response(404, 'the requested URL could not be found')
    @tasks.expect(new_task_note)
    @is_standard
    def post(self, taskid):
        ''' this method appends a note to a task object '''
        try:
            # get desired task
            task = Task.query.filter_by(id=taskid).first_or_404()
            # create task note
            status = TaskStatus(request.form.get('end_status'))
            if task.requires_verification and\
                    status in [TaskStatus.VERIFIED,
                               TaskStatus.COMPLETED]:
                if not is_manager_func(get_jwt_identity()['id']):
                    return Response('insuficient access to complete task',
                                    status=403)
                else:
                    task.requires_verification = False
            n_note = TaskNote(task.id, get_jwt_identity()['id'],
                              TaskStatus(request.form.get('end_status')))
            n_note.note = request.form.get('note')
            if status:
                task.status = status
            # if image is present save image
            if 'file' in request.files:
                file = request.files['file']
                filename = secure_filename(file.filename)
                # validate image file atribs format file name
                if '.' in filename and filename.rsplit('.', 1)[1].lower() in \
                        {'png', 'jpg', 'jpeg', 'gif'}:
                    img = Image()
                    db.session.add(img)
                    db.session.commit()
                    file.filename = f'{img.id}_{filename.replace(" ", "_")}'
                    file.save(f'/usr/src/app/mediafiles/{file.filename}')
                    # commit image to database
                    n_note.image = img.id
                    img.file = file.filename
                    if task.budget:
                        n_note.spend(float(request.form['recept']), n_note.end_status)
                    db.session.commit()
                else:
                    print('found problem with image')
                    return Response('problem with image', status=400)
            else:
                if float(request.form['recept']) > 0:
                    print('task note: ammount without image')
                    return Response('image required with recept', status=400)
                elif n_note.end_status == TaskStatus.COMPLETED and task.budget:
                    n_note.spend(0, n_note.end_status)
            # if 'recept' in request.form:
                # n_note = account_update(request.form, n_note)
            # commit data to dateabase
            db.session.add(n_note)
            db.session.commit()
            # prepare responce and return
            response = jsonify(n_note.to_dict())
            response.status_code = 201
            return response
        except InsufficentFundsError:
            return Response('insufficentFunds', status=403)
        except (IntegrityError, AttributeError) as error:
            # if database or attribute error return error
            print(error)
            return Response('could not process request', status=400)

    @tasks.response(202, 'task deleted')
    @tasks.response(404, 'the requested URL could not be found')
    @tasks.response(403, 'cannot delete task with funds associated')
    @tasks.response(400, 'could not process request')
    @is_manager
    def delete(self, taskid):
        ''' this method deletes a task '''
        try:
            # get the desired task
            task = Task.query.filter_by(id=taskid).first_or_404()
            if task.allocation and (task.budget.ballance or task.budget.ammount):
                return Response('cannot delete task with funds associated', status=403)
            notes = task.notes
            # delete each note that is associated with the task
            for note in notes:
                if note.image:
                    img = Image.query.filter_by(id=note.image).first()
                    try:
                        os.remove(img.file)
                    except FileNotFoundError:
                        print('image not found deletion will be assumed')
                    db.session.delete(img)
                db.session.delete(note)
            db.session.delete(task)
            db.session.commit()
            return Response('task deleted', 202)
        except (IntegrityError, AttributeError):
            # if database or attribute error return error
            print(traceback.format_exc())
            return Response('could not process request', status=400)


@tasks.route('/team/<int:id>')
class TaskTeam(Resource):
    '''this class handles updating and viewing a teams tasks'''
    @tasks.response(200, 'tasks', list_of_tasks)  # returns a list of tasks
    @tasks.response(400, 'could not process your request')
    @tasks.response(404, 'could not locate the target team')
    @tasks.response(403, 'Access denyed')
    @jwt_required()
    @is_standard
    def get(self, id):
        ''' this method returns a list of all
         the tasks associated with a team '''
        try:
            if not is_member_or_management(get_jwt_identity()['id'], id):
                return Response('Access denyed', status=403)
            # get all acctive tasks associated with the team
            team = Team.query.filter_by(id=id).first_or_404()
            task_list = [task.to_dict() for task in team.tasks]
            # prepare resonce and return
            response = jsonify(task_list)
            response.status_code = 200
            return response
        except (AttributeError, IntegrityError):
            # if attribute or database error encountered return error
            print(traceback.format_exc())
            return Response('could not process your request', status=400)


@tasks.route('/user/<int:id>')
class UserTasks(Resource):
    ''' This class handles getting the tasks assigned to an individual '''
    @tasks.response(203, 'tasks', list_of_tasks)
    @tasks.response(403, 'invalid access for this request')
    @tasks.response(400, 'could not process request')
    @tasks.response(500, 'typeError on backend')
    @jwt_required()
    @is_standard
    def get(self, id):
        ''' this method returns a list of all tasks
        assigned to an individual '''
        try:
            # get task from database if exists return to front end
            if not is_supervisor_or_self(get_jwt_identity()['id'], id):
                return Response('cannot view annother users tasks', status=403)
            user = User.query.filter_by(id=id).first_or_404()
            tasks = []
            for task in user.tasks:
                tasks.append(task.to_dict())
            response = jsonify(tasks)
            response.status_code = 203
            return response
        except(IntegrityError, AttributeError) as error:
            # if database or attribute error return error
            print(error)
            return Response('could not process request', status=400)
        except TypeError as error:
            print(error)
            return Response('typeError on backend', status=500)


@tasks.route('/image/<int:imageID>')
class TaskNoteImage(Resource):
    ''' this class returns the image file associated with a task note '''
    @tasks.response(404, 'the requested url was not found on the server')
    @tasks.response(404, 'could not find image')
    @is_standard
    def get(self, imageID):
        try:
            image = Image.query.filter_by(id=imageID).first_or_404()
            return send_file(f'/usr/src/app/mediafiles/{image.file}')
        except(KeyError, AttributeError):
            print(traceback.format_exc())
            return Response('could not find image', status=404)
