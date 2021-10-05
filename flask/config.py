import os

main_config = {}
main_config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
main_config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
main_config['SECRET_KEY'] = os.environ['SECRET_KEY']
main_config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600 #one hour
main_config['JWT_REFRESH_TOKEN_EXPIRES'] = 302400 # 1/2 week
main_config['SECURITY_PASSWORD_SALT'] = os.environ['SECURITY_PASSWORD_SALT']

test_config = {}
test_config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
test_config['SECRET_KEY'] = "THE-SECRET"
test_config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600 # one hour
test_config['JWT_REFRESH_TOKEN_EXPIRES'] = 302400 # 1/2 week
test_config['SECURITY_PASSWORD_SALT'] = 'THfjdsioE-SEasdfgoihjCRET'
test_config['TESTING'] = True
test_config['WTF_CSRF_ENABLED'] = False
test_config['DEBUG'] = False
test_config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://busTaskManager:busT752askMgasdegawe275anager1995@db:5432/busTaskManager'