from models import db, Allocation, Task, TaskStatus
from errors import MissingImageError


def account_update(req, note, settle_allocation=False):
    ''' this function locates a task associated with a note
    and updates the allocation record associated with the note
    the method also verifies that an image of the recept is included '''
    target_task = Task.query.filter_by(id=note.task)
    allocation = Allocation.query.filter_by(id=target_task.allocation)\
        .first_or_404()
    if note.recept:
        allocation.settle(-1 * note.recept)
    note.recept = req['recept']
    if 'image' not in req:
        raise MissingImageError
    allocation.settle(note.recept, done=settle_allocation or
                      (TaskStatus(note.end_status) in
                       [TaskStatus.COMPLETED, TaskStatus.SUBMITED]))
    db.session.commit()
    return note


def account_restore(note=None, taskid=None, list_ammount=None):
    ''' this function restores funds from a allocation to the associated
    accounts '''
    ammount = 0
    task_id = 0
    if note:
        task_id = note.task
        ammount = note.recept
        note.note += f" AMMOUNT ZEROED from {ammount}"
        note.recept = 0
    elif taskid and list_ammount:
        ammount = list_ammount
        task_id = taskid
    else:
        raise AttributeError
    target_task = Task.query.filter_by(id=task_id)
    allocation = Allocation.query.filter_by(id=target_task.allocation)\
        .first_or_404()
    allocation.settle(-1 * ammount)
    db.session.commit()
