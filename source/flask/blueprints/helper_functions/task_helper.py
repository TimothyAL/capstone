from models import Task, TaskStatus, Allocation, User, Team

def new_allocation(allocation):
    ''' this function is a helper function to create a new allocation object
    it takes a dict that is required to have either an account int or a
    sub_account int as well as an ammount decimal. If those keys
    are not present an attribute exception will be raised '''
    account = None
    sub_account = None
    ammount = allocation['ammount']
    description = None
    settled = False
    # if neither account or sub_account are present
    # function will raise attribute error
    if 'account' in allocation:
        account = allocation['account']
    else:
        sub_account = allocation['sub_account']
    if 'description' in allocation:
        description = allocation['description']
    new_allocation = Allocation(account=account, sub_account=sub_account,
                                ballance=ammount, description=description,
                                settled=settled)
    return new_allocation

# def create_image(image):
    