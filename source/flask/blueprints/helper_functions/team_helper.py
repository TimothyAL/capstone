from models import User, TeamMembers


def validate_supervisor(super_id, user_id):
    User.query.filter_by(id=super_id).first_or_404()
    User.query.filter_by(id=user_id).first_or_404()
    super_teams = TeamMembers.query\
        .filter(member=super_id,
                status=TeamMembers.MemberStatus.SUPERVISOR)\
        .get_or_404()
    user_teams = TeamMembers.query\
        .filter(member=user_id)\
        .get_or_404()
    for x in super_teams:
        for y in user_teams:
            if x.team == y.team:
                return True
    return False
