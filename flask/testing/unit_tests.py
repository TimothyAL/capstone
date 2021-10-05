import os
from testing.testMain import BasicTests
from models import User

class AppTests(BasicTests):
    
    def test_if_test(self):
        test = 1
        self.assertEquals(1, test)

    def test_login(self):
        test = self.login(os.environ['DEFAULT_USER'], os.environ['DEFAULT_PASSWORD'])
        self.assertEqual(test.status_code, 203)

        test = self.login('Admin', 'Not Admin Password')
        self.assertEqual(test.status_code, 400)

        test = self.login('non existent user', 'password')
        self.assertEqual(test.status_code, 400)

        test = self.login('', '')
        self.assertEqual(test.status_code, 400)

    def test_create_user(self):
        test = self.create_user\
            (self.DEFAULT_TOKEN, 'anewusername', 'anewpassword', 'anewname',
             'anewemail', 'anewphone', 'standard')
        self.assertEqual(test.status_code, 201)

        test = self.create_user('anewusername', 'apassword', 'anewname')
        self.assertEqual(test.status_code, 409)

    def test_modify_user(self):
        user = self.create_user\
            (self.DEFAULT_TOKEN, 'anewusername', 'anewpassword', 'anewname',
             'anewemail', 'anewphone', 'standard')
        user_info = user.get_json()
        user2 = self.create_user\
            (self.DEFAULT_TOKEN, 'anewusername2', 'anewpassword2', 'anewname2',
             'anewemail', 'anewphone', 'standard')
        test = self.modify_user\
            (self.DEFAULT_TOKEN, user_info['id'], 'inactive',
             'password', 'email', 'phone')
        self.assertEqual(test.status_code, 200)

        user = self.login('anewusername', 'password')
        user_info = user.get_json()
        test = self.modify_user\
            (f'Bearer {user_info["token"]}', user2.get_json()['id'], 'inactive',
             'password', 'email', 'phone')
        self.assertEqual(test.status_code, 403)

    def test_add_and_remove_user_from_team(self):
        user = self.create_user\
            (self.DEFAULT_TOKEN, 'anewusername', 'anewpassword', 'anewname',
             'anewemail', 'anewphone', 'standard')
        user_info = user.get_json()
        team = self.create_team(self.DEFAULT_TOKEN, 'ateam',
                                self.DEFAULT_USER.id)
        team_info = team.get_json()
        test = self.add_user_to_team(self.DEFAULT_TOKEN, user_info['id'],
                                     team_info['id'])
        self.assertEqual(test.status_code, 200)
        
        test = self.add_user_to_team(self.DEFAULT_TOKEN, user_info['id'],
                                     team_info['id'])
        self.assertEqual(test.status_code, 409)

        test = self.remove_user_from_team(self.DEFAULT_TOKEN, user_info['id'],
                                          team_info['id'])

    def test_get_all_users(self):
        test = self.get_all_users(self.DEFAULT_TOKEN)
        self.assertEqual(test.status_code, 200)
        self.assertEqual(len(test.get_json()), 1)

    def test_logout(self):
        test = self.logout()
        self.assertEqual(test.status_code, 200)

    def test_accounts(self):
        account = self.create_account\
            (self.DEFAULT_TOKEN, 'account', self.DEFAULT_USER.id,
            'description', 50000)
        self.assertEqual(account.status_code, 201)
        account_info = account.get_json()

        sub_account = self.create_sub_account\
            (self.DEFAULT_TOKEN, account_info['id'], 'sub_account',
             'description', 4000)
        self.assertEqual(sub_account.status_code, 201)
        sub_account2 = self.create_sub_account\
            (self.DEFAULT_TOKEN, account_info['id'], 'sub_account2',
             'description', 400000)
        self.assertEqual(sub_account2.status_code, 403)

        test = self.get_accounts(self.DEFAULT_TOKEN)
        self.assertEqual(test.status_code, 200)
        self.assertEqual(len(test.get_json()), 1)

        test = self.edit_account(self.DEFAULT_TOKEN, account_info['id'],
                                 'changedaccount', 'changedescription',
                                 ballance=4100)
        self.assertEqual(test.status_code, 202)

        test = self.edit_account(self.DEFAULT_TOKEN, account_info['id'],
                                 subtract_funds=1000)
        self.assertEqual(test.status_code, 400)

        test = self.edit_account(self.DEFAULT_TOKEN, account_info['id'],
                                 subtract_funds=50)
        self.assertEqual(test.status_code, 202)

        test = self.edit_account(self.DEFAULT_TOKEN, account_info['id'],
                                 add_funds=1000)
        self.assertEqual(test.status_code, 202)

        test = self.get_associated_sub_accounts(self.DEFAULT_TOKEN,
                                                account_info['id'])
        self.assertEqual(len(test.get_json()), 1)
        self.assertEqual(test.status_code, 200)

    def test_sub_account(self):
        account = self.create_account\
            (self.DEFAULT_TOKEN, 'account', self.DEFAULT_USER.id,
            'description', 50000)
        account_info = account.get_json()

        sub_account = self.create_sub_account\
            (self.DEFAULT_TOKEN, account_info['id'], 'sub_account',
             'description', 4000)
        self.assertEqual(sub_account.status_code, 201)
        sub_account_info = sub_account.get_json()

        test = self.update_sub_account\
            (self.DEFAULT_TOKEN, sub_account_info['new_sub_account']['id'], 'achangedname', '')
        self.assertEqual(test.status_code, 201)

        test = self.allocate_funds\
            (self.DEFAULT_TOKEN, sub_account_info['new_sub_account']['id'], 10000000000)
        self.assertEqual(test.status_code, 422)

        test = self.allocate_funds\
            (self.DEFAULT_TOKEN, sub_account_info['new_sub_account']['id'], 1)
        self.assertEqual(test.status_code, 201)

        test = self.deallocate_funds\
            (self.DEFAULT_TOKEN, sub_account_info['new_sub_account']['id'], 1)
        self.assertEqual(test.status_code, 201)

        test = self.deallocate_funds\
            (self.DEFAULT_TOKEN, sub_account_info['new_sub_account']['id'], 10000000000)
        self.assertEqual(test.status_code, 422)

        test = self.get_accounts_and_subs(self.DEFAULT_TOKEN)
        test_info = test.get_json()
        self.assertEqual(test.status_code, 200)
        self.assertEqual(len(test_info['accounts']), 1)
        self.assertEqual(len(test_info['sub_accounts']), 1)

    def test_teams(self):
        team = self.create_team\
            (self.DEFAULT_TOKEN, 'team', self.DEFAULT_USER.id, 'description')
        self.assertEqual(team.status_code, 201)
        team_info = team.get_json()

        test = self.edit_team\
            (self.DEFAULT_TOKEN, team_info['id'], 'aRenamedTeam',
             description='aRediscribedTeam')
        self.assertEqual(test.status_code, 201)

        self.add_user_to_team(self.DEFAULT_TOKEN, self.DEFAULT_USER.id,
                              team_info['id'])
        test = self.get_team_members(self.DEFAULT_TOKEN, team_info['id'])
        self.assertEqual(test.status_code, 200)
        self.assertEqual(len(test.get_json()), 1)

        test = self.get_user_teams(self.DEFAULT_TOKEN, self.DEFAULT_USER.id)
        self.assertEqual(test.status_code, 200)

        test = self.get_teams(self.DEFAULT_TOKEN)
        self.assertEqual(test.status_code, 200)

    def test_tasks(self):
        team = self.create_team\
            (self.DEFAULT_TOKEN, 'team', self.DEFAULT_USER.id, 'description')
        account = self.create_account\
            (self.DEFAULT_TOKEN, 'account', self.DEFAULT_USER.id,
            'description', 50000)
        account_info = account.get_json()
        sub_account = self.create_sub_account\
            (self.DEFAULT_TOKEN, account_info['id'], 'sub_account',
             'description', 4000)
        sub_account_info = sub_account.get_json()

        task1noBallance = self.create_task\
            (self.DEFAULT_TOKEN, 'task1', '01 Jan 1970 00:00:00 GMT', 'discribetask1',
            'created', False, team.get_json()['id'], assigner=self.DEFAULT_USER.id)
        self.assertEqual(task1noBallance.status_code, 201)

        task2noBallance = self.create_task\
            (self.DEFAULT_TOKEN, 'task2', '01 Jan 1970 00:00:00 GMT', 'discribetask2',
            'created', False, user=self.DEFAULT_USER.id,
            assigner=self.DEFAULT_USER.id)
        self.assertEqual(task2noBallance.status_code, 201)

        task3Ballance = self.create_task\
            (self.DEFAULT_TOKEN, 'task3', '01 Jan 1970 00:00:00 GMT', 'discribetask3',
            'created', False, user=self.DEFAULT_USER.id,
            assigner=self.DEFAULT_USER.id,
            ballance=1, account=account_info['id'])
        self.assertEqual(task3Ballance.status_code, 201)

        task4Ballance = self.create_task\
            (self.DEFAULT_TOKEN, 'task4', '01 Jan 1970 00:00:00 GMT', 'discribetask4',
            'created', False, user=self.DEFAULT_USER.id,
            assigner=self.DEFAULT_USER.id,
            ballance=1, sub_account=sub_account.get_json()['new_sub_account']['id'])
        self.assertEqual(task4Ballance.status_code, 201)

        task5Ballance = self.create_task\
            (self.DEFAULT_TOKEN, 'task5', '01 Jan 1970 00:00:00 GMT', 'discribetask5',
            'created', False, user=self.DEFAULT_USER.id,
            assigner=self.DEFAULT_USER.id,
            ballance=10000000, account=account_info['id'])
        self.assertEqual(task5Ballance.status_code, 403)

        task6Ballance = self.create_task\
            (self.DEFAULT_TOKEN, 'task6', '01 Jan 1970 00:00:00 GMT', 'discribetask6',
            'created', False, user=self.DEFAULT_USER.id,
            assigner=self.DEFAULT_USER.id,
            ballance=100000000, sub_account=sub_account_info['new_sub_account']['id'])
        self.assertEqual(task6Ballance.status_code, 403)

        test = self.get_team_tasks(self.DEFAULT_TOKEN, team.get_json()['id'])
        self.assertEqual(test.status_code, 200)
        self.assertEqual(len(test.get_json()), 1)

        test = self.edit_task\
            (self.DEFAULT_TOKEN, task1noBallance.get_json()['id'],
             'rename', '01 Jan 1970 00:00:00 GMT', 'newDiscription', 'viewed', True,
             team.get_json()['id'])
        self.assertEqual(test.status_code, 201)

        user = self.create_user\
            (self.DEFAULT_TOKEN, 'anewusername', 'anewpassword', 'anewname',
             'anewemail', 'anewphone', 'standard')
        test = self.edit_task\
            (self.DEFAULT_TOKEN, task4Ballance.get_json()['id'],
             'rename', '01 Jan 1970 00:00:00 GMT', 'newDiscription', 'viewed', True,
             user = user.get_json()['id'])
        self.assertEqual(test.status_code, 201)

        user_token = self.login('anewusername', 'anewpassword').get_json()
        test = self.add_note_without_image\
            (f'Bearer {user_token["token"]}', task1noBallance.get_json()['id'], 'viewed', 
            'a note', 0)
        self.assertEqual(test.status_code, 201)

        test = self.add_note_without_image\
            (f'Bearer {user_token["token"]}', task1noBallance.get_json()['id'], 'viewed',
            'a note', 200)
        self.assertEqual(test.status_code, 400)

        test = self.add_note_without_image\
            (f'Bearer {user_token["token"]}', task4Ballance.get_json()['id'], 'completed',
            'a note')
        self.assertEqual(test.status_code, 403)

        image = self.add_note_with_image\
            (f'Bearer {user_token["token"]}', task4Ballance.get_json()['id'], 'viewed',
            'a note', 'image.jpg', .5)
        self.assertEqual(image.status_code, 201)

        test = self.get_image(self.DEFAULT_TOKEN, image.get_json()['image'])
        self.assertEqual(test.status_code, 200)

        test = self.add_note_with_image\
            (f'Bearer {user_token["token"]}', task4Ballance.get_json()['id'], 'viewed',
            'a note', 'image.doc', .25)
        self.assertEqual(test.status_code, 400)

        test = self.add_note_with_image\
            (f'Bearer {user_token["token"]}', task4Ballance.get_json()['id'], 'viewed',
            'a note', 'image.jpg', 10)
        self.assertEqual(test.status_code, 403)

        test = self.delete_task(self.DEFAULT_TOKEN, task1noBallance.get_json()['id'])
        self.assertEqual(test.status_code, 202)

        test = self.delete_task(self.DEFAULT_TOKEN, task4Ballance.get_json()['id'])
        self.assertEqual(test.status_code, 403)

        test = self.get_account_transactions(self.DEFAULT_TOKEN, account_info['id'])
        self.assertEquals(test.status_code, 200)

        test = self.get_sub_account_transactions(self.DEFAULT_TOKEN, sub_account_info['new_sub_account']['id'])
        self.assertEquals(test.status_code, 200)

    def test_get_user_assigned_tasks(self):
        self.create_task\
            (self.DEFAULT_TOKEN, 'task1', '01 Jan 1970 00:00:00 GMT', 'discribetask1',
            'created', False, user=self.DEFAULT_USER.id,
            assigner=self.DEFAULT_USER.id)
        self.create_task\
            (self.DEFAULT_TOKEN, 'task2', '01 Jan 1970 00:00:00 GMT', 'discribetask2',
            'created', False, user=self.DEFAULT_USER.id,
            assigner=self.DEFAULT_USER.id)

        test = self.get_user_assigned_tasks\
            (self.DEFAULT_TOKEN, self.DEFAULT_USER.id)
        self.assertEqual(len(test.get_json()), 2)

        test = self.get_tasks(self.DEFAULT_TOKEN)
        self.assertEqual(len(test.get_json()), 2)

    