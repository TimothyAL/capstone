''' this class contains deffinititons and
descriptions of custom exceptions '''


class MissingImageError(BaseException):
    pass

class OverAllocatedError(BaseException):
    pass

class InsufficentFundsError(BaseException):
    pass