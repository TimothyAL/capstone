import datetime
import enum
import traceback
from typing import Mapping

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin

from errors import OverAllocatedError, InsufficentFundsError

db = SQLAlchemy()


class Image(db.Model, SerializerMixin):
    __tablename__ = 'images'

    id = db.Column(db.Integer, primary_key=True)
    file = db.Column(db.String(), unique=True)

    def __init__(self):
        pass


class TeamMembers(db.Model, SerializerMixin):
    __tablename__ = 'team_members'
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    __table_args__ = (db.UniqueConstraint('team_id', 'member_id', name='team_assignment'),)



class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    class Access(enum.Enum):
        INACTIVE = 'inactive'
        STANDARD = 'standard'
        SUPERVISOR = 'supervisor'
        MANAGER = 'manager'
        ADMIN = 'admin'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(), nullable=False, unique=True)
    password = db.Column(db.String(), nullable=False)
    name = db.Column(db.String(), nullable=False)
    email = db.Column(db.String())
    phone = db.Column(db.String())
    role = db.Column(db.Enum(Access), nullable=False)
    # picture = db.Column(db.Integer, db.ForeignKey('images.id'))
    teams = db.relationship('Team', secondary='team_members',
                            backref='member_list', lazy="dynamic")


    serialize_only = ('id', 'username', 'name', 'email', 'phone', 'role')

    def __init__(self, username, password, name=None, email=None,
                 phone=None, role=Access.INACTIVE):
        self.username = username
        self.password = password
        self.name = name
        self.email = email
        self.phone = phone
        self.role = role


class Team(db.Model, SerializerMixin):
    __tablename__ = 'teams'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), nullable=False, unique=True)
    owner = db.Column(db.Integer, db.ForeignKey('users.id'))
    description = db.Column(db.String())
    supervisor = db.relationship('User', foreign_keys=[owner], backref='supervised_teams', lazy='joined')

    serialize_only = ('id', 'name', 'owner', 'description', 'supervisor.name')

    def __init__(self, name, owner, description=''):
        self.name = name
        self.owner = owner
        self.description = description


class Account(db.Model, SerializerMixin):
    __tablename__ = 'accounts'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), nullable=False, unique=True)
    description = db.Column(db.String())
    owner = db.Column(db.Integer, db.ForeignKey('users.id'))
    ballance = db.Column(db.Float, nullable=False)
    allocated = db.Column(db.Float, nullable=False)
    owner_info = db.relationship('User', backref='account_owner', lazy=True)
    sub_accounts = db.relationship('SubAccount', backref='accounts_sub_accounts', lazy='dynamic')
    transactions = db.relationship('Allocation', backref='account_allocations', lazy='joined')

    serialize_only = ('id', 'name', 'description', 'owner', 'ballance', 'allocated', 'owner_info.id', 'owner_info.name')

    def __init__(self, name, owner, description='', ballance=0, allocated=0):
        self.name = name
        self.description = description
        self.owner = owner
        self.ballance = ballance
        self.allocated = allocated

    def add_to_allocation(self, ammount):
        ammount = float(ammount)
        if ammount > self.ballance - self.allocated:
            raise OverAllocatedError
        self.allocated += ammount
        db.session.commit()

    def remove_from_allocation(self, ammount):
        ammount = float(ammount)
        self.allocated -= ammount
        db.session.commit()

    def settle_allocation(self, ammount):
        ammount = float(ammount)
        self.ballance -= ammount
        self.allocated -= ammount
        db.session.commit()


class SubAccount(db.Model, SerializerMixin):
    __tablename__ = 'sub_accounts'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), unique=True, nullable=False)
    description = db.Column(db.String())
    ballance = db.Column(db.Float, nullable=False)
    allocated = db.Column(db.Float, nullable=False)
    main_account = db.Column(db.Integer, db.ForeignKey('accounts.id'),
                             nullable=False)
    transactions = db.relationship('Allocation', backref='sub_account_allocations', lazy='joined')

    serialize_only = ('id', 'name', 'description', 'ballance', 'allocated', 'main_account')

    def __init__(self, name, main_account, description='',
                 ballance=0):
        self.name = name
        self.description = description
        self.main_account = main_account
        self.ballance = 0
        self.allocated = 0
        self.transfer_in(ballance)

    def add_to_allocation(self, ammount):
        ammount = float(ammount)
        if ammount > self.ballance - self.allocated:
            raise OverAllocatedError
        self.allocated += ammount
        db.session.commit()

    def remove_from_allocation(self, ammount):
        ammount = float(ammount)
        if ammount > self.allocated:
            raise OverAllocatedError
        self.allocated -= ammount
        db.session.commit()

    def settle_allocation(self, ammount):
        ammount = float(ammount)
        if ammount > self.allocated:
            raise OverAllocatedError
        self.ballance -= ammount
        self.allocated -= ammount
        main_account = Account.query.filter_by(id=self.main_account)\
            .first_or_404()
        main_account.settle_allocation(ammount)
        db.session.commit()

    def transfer_in(self, ammount):
        ammount = float(ammount)
        main_account = Account.query.filter_by(id=self.main_account)\
            .first_or_404()
        main_account.add_to_allocation(ammount)
        self.ballance += ammount
        db.session.commit()

    def release_funds(self, ammount):
        ammount = float(ammount)
        main_account = Account.query.filter_by(id=self.main_account)\
            .first_or_404()
        if ammount > self.ballance - self.allocated:
            raise InsufficentFundsError
        main_account.remove_from_allocation(ammount)
        self.ballance -= ammount
        db.session.commit()



class Allocation(db.Model, SerializerMixin):
    __tablename__ = 'allocations'

    id = db.Column(db.Integer, primary_key=True)
    account = db.Column(db.Integer, db.ForeignKey('accounts.id'))
    sub_account = db.Column(db.Integer, db.ForeignKey('sub_accounts.id'))
    ammount = db.Column(db.Float, nullable=False)
    ballance = db.Column(db.Float, nullable=False)
    description = db.Column(db.String())
    settled = db.Column(db.Boolean(), nullable=False)

    serialize_only = ('id', 'account', 'sub_account', 'ammount', 'ballance', 'description', 'settled',
                      'account_allocations.name', 'sub_account_allocations.name', 'assigned_to.name')

    def __init__(self, account=None, sub_account=None, ammount=0,
                 ballance=0, description='', settled=False):
        self.account = account
        self.sub_account = sub_account
        self.ammount = ammount
        self.ballance = ballance
        self.description = description
        self.settled = settled
        target_account = {}
        if account:
            target_account = Account.query.filter_by(id=account)\
                .first_or_404()
        else:
            target_account = SubAccount.query.filter_by(id=sub_account)\
                .first_or_404()
        target_account.add_to_allocation(ballance)

    def settle(self, ammount, done=False):
        target = {}
        if self.account:
            target = Account.query.filter_by(id=self.account)\
                .first_or_404()
        else:
            target = SubAccount.query.filter_by(id=self.sub_account)\
                .first_or_404()
        if self.ballance < ammount:
            raise InsufficentFundsError
        target.settle_allocation(ammount)
        self.ammount += ammount
        self.ballance -= ammount
        if done:
            self.settled = True
            if self.ballance:
                target.remove_from_allocation(self.ballance)
                self.ballance = 0
        db.session.commit()


class TaskStatus(enum.Enum):
    CREATED = 'created'
    ASSIGNED = 'assigned'
    VIEWED = 'viewed'
    INPROGRESS = 'in_progress'
    ONHOLD = 'on_hold'
    SUBMITED = 'submited'
    REJECTED = 'regected'
    VERIFIED = 'verified'
    COMPLETED = 'completed'


class Task(db.Model, SerializerMixin):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), nullable=False)
    assigner = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    allocation = db.Column(db.Integer, db.ForeignKey('allocations.id'))
    due_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String())
    status = db.Column(db.Enum(TaskStatus), nullable=False)
    requires_verification = db.Column(db.Boolean(), nullable=False)
    team = db.Column(db.Integer, db.ForeignKey('teams.id'))
    user = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes = db.relationship('TaskNote', backref='listed_task', lazy='joined')
    creator = db.relationship('User', foreign_keys=[assigner], backref='created_tasks', lazy='joined')
    assigned_user = db.relationship('User', foreign_keys=[user], backref='tasks', lazy='joined')
    assigned_team = db.relationship('Team', foreign_keys=[team], backref='tasks', lazy='joined')
    budget = db.relationship('Allocation', backref='assigned_to', lazy='joined')

    serialize_only = ('id', 'name', 'assigner', 'description', 'status',
                      'requires_verification', 'team', 'user', 'due_date', 'notes',
                      'creator.name', 'assigned_user.name', 'assigned_team.name', 'budget')

    def make_allocation(self, allocate):
        ''' this method creates an allocation object assigned to self '''
        account = None
        sub_account = None
        if 'account' in allocate:
            account = allocate['account']
        else:
            sub_account = allocate['sub_account']
        new_allocation = Allocation(account, sub_account, ammount=0,
                                    ballance=allocate['ballance'])
        db.session.add(new_allocation)
        db.session.commit()
        self.allocation = new_allocation.id

    def __init__(self, name=None, assigner=None, due_date=None, allocation=None,
                 description='', status=TaskStatus.CREATED,
                 requires_verification=False, team=None, user=None):
        self.name = name
        self.assigner = assigner
        self.due_date = due_date
        self.description = description
        self.status = TaskStatus(status)
        self.requires_verification = requires_verification
        self.team=team
        self.user=user
        if allocation:
            self.make_allocation(allocation)




class TaskNote(db.Model, SerializerMixin):
    __tablename__ = 'task_notes'

    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    image = db.Column(db.Integer, db.ForeignKey('images.id'))
    user = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.String(), nullable=False)
    end_status = db.Column(db.Enum(TaskStatus), nullable=False)
    recept = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, nullable=False)
    creator = db.relationship('User', backref='created_notes', lazy='joined')
    picture = db.relationship('Image', backref='note_image', lazy='joined')

    serialize_only = ('id', 'task', 'image', 'user', 'note', 'end_status', 'recept', 'timestamp', 'creator.name')

    def spend(self,ammount, status):
        task = Task.query.filter_by(id=self.task).first()
        allocation = task.budget
        done = False
        if status == TaskStatus.COMPLETED:
            done = True
        allocation.settle(ammount, done)
        self.recept = ammount
        db.session.commit()


    def __init__(self, task, user, end_status, image=None, recept=0, note=''):
        self.timestamp = datetime.datetime.utcnow()
        self.task = task
        self.user = user
        self.end_status = end_status
        self.image = image
        if recept > 0:
            self.spend(recept)
        else:
            self.recept = 0
        self.note = note
