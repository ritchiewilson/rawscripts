from Crypto.Cipher import AES
import requests
import base64
import json
import time
import sys
from datetime import datetime

from flask.ext.script import Manager
from flask.ext.migrate import Migrate, MigrateCommand

from rawscripts import app, db
from flask_models import *

manager = Manager(app)


URL = 'http://www.rawscripts.com/fetchdb'
START_TIME = None
PASSWORD = None
IV = None

def fetch(params):
    r = requests.get(URL, params=params)
    text = r.text
    if text.startswith('Missing'):
        raise Exception(text)
    ciphertext = base64.b64decode(r.text)
    obj = AES.new(PASSWORD, AES.MODE_CBC, IV)
    plaintext = obj.decrypt(ciphertext)
    return plaintext[plaintext.index('@') + 1:]


def commit_users(data, session):
    last_time = None
    for line in data.split('\n'):
        if len(line) == 0:
            continue
        email, timestamp = line.split(',')
        firstUse = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        user = User(name=email, firstUse=firstUse)
        session.add(user)
        last_time = firstUse
    session.commit()
    return last_time

def commit_open_id_data2(data, session):
    last_time = None
    for line in data.split('\n'):
        if len(line) == 0:
            continue
        nickname, email, user_id, federated_identity, federated_provider, timestamp = line.split(',')
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        open_id = OpenIDData2(nickname=nickname,
                              email=email,
                              user_id=user_id,
                              federated_identity=federated_identity,
                              federated_provider=federated_provider,
                              timestamp=timestamp)
        session.add(open_id)
        last_time = timestamp
    session.commit()
    return last_time

def commit_script_data(data, session):
    last_time = None
    lines = json.loads(data)
    ids = {}
    for resource_id, script_data, version, timestamp, autosave, export, tag in lines:
        version = int(version)
        if len(timestamp) == 19:
            # one row in whole database is missing milliseconds...
            timestamp += ".000000"
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        autosave = bool(int(autosave))
        obj = ScriptData(resource_id=resource_id,
                         data=script_data,
                         version=version,
                         timestamp=timestamp,
                         autosave=autosave,
                         export=export,
                         tag=tag)
        session.add(obj)
        last_time = timestamp
        ids[resource_id] = True

    session.commit()
    return last_time

def commit_users_scripts(data, session):
    last_time = None
    lines = json.loads(data)
    for user, resource_id, title, timestamp, permission, folder in lines:
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        row = session.query(UsersScripts).filter_by(resource_id=resource_id). \
                  filter_by(user=user, permission=permission).first()
        if row:
            row.last_updated = timestamp
        else:
            obj = UsersScripts(user=user,
                               resource_id=resource_id,
                               title=title,
                               last_updated=timestamp,
                               permission=permission,
                               folder=folder)
            session.add(obj)
        last_time = timestamp
    session.commit()
    return last_time

def commit_blog(data, session):
    last_time = None
    lines = json.loads(data)
    for data, title, timestamp in lines:
        if len(timestamp) == 19:
            timestamp += ".000000"
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        obj = BlogDB(data=data, title=title, timestamp=timestamp)
        session.add(obj)
        last_time = timestamp
    session.commit()
    return last_time

def fetch_all_users():
    fetch_by_timestamps('Users', User, 'firstUse', commit_users)

def fetch_all_openid2():
    fetch_by_timestamps('OpenID2', OpenIDData2, 'timestamp',
                        commit_open_id_data2)

def fetch_all_users_scripts():
    fetch_by_timestamps('UsersScripts', UsersScripts, 'last_updated',
                        commit_users_scripts, USERS_PER_REQUEST=500)

def fetch_all_blog_posts():
    fetch_by_timestamps('BlogDB', BlogDB, 'timestamp',
                        commit_blog)

def fetch_all_duplicate_scripts():
    print "Fetching DuplicateScripts"
    params = {'table': 'DuplicateScripts'}
    data = fetch(params)
    for line in data.split('\n'):
        if line == '':
            continue
        __key__, from_script, new_script, from_version = line.split(',')
        from_version = int(from_version)
        exists = db.session.query(DuplicateScript). \
                     filter_by(new_script=new_script).first()
        if exists:
            continue
        dup = DuplicateScript(from_script=from_script,
                              new_script=new_script,
                              from_version=from_version,
                              __key__=__key__)
        db.session.add(dup)
    db.session.commit()


def fetch_all_folders():
    print "Fetching folders"
    params = {'table': 'Folders'}
    data = fetch(params)
    lines = json.loads(data)
    for  __key__, user, data in lines:
        obj = db.session.query(Folder). \
                     filter_by(user=user).first()
        if not obj:
            obj = Folder(user=user, data=data, __key__=__key__)
            db.session.add(obj)
        obj.data = data
    db.session.commit()

def fetch_all_script_data():
    fetch_by_timestamps('ScriptData', ScriptData, 'timestamp',
                        commit_script_data)

def fetch_by_timestamps(table, model, timestamp_field, parsing_func, USERS_PER_REQUEST=40):
    global START_TIME
    session = db.session
    all_found = False
    while not all_found:
        if START_TIME is None:
            start = "2000-01-01T01:00:00.000000"
            timestamp = getattr(model, timestamp_field)
            last_user = session.query(model).order_by(db.desc(timestamp)).first()
            if last_user is not None:
                start = getattr(last_user, timestamp_field).isoformat()
            START_TIME = start
        print "Fetching", table, "starting from:", START_TIME
        params = {'table': table,
                  'start_time': START_TIME,
                  'limit': USERS_PER_REQUEST
        }
        data = fetch(params)
        if len(data) == 0:
            break
        last_time = parsing_func(data, session)
        if last_time is None:
            break
        START_TIME = last_time.isoformat()
        time.sleep(1)
    print "Completed fetching", table


@manager.command
def fetch_all(password, iv):
    global PASSWORD
    global IV
    global START_TIME
    PASSWORD = password
    IV = iv
    fetch_all_users()
    START_TIME = None
    fetch_all_openid2()
    START_TIME = None
    fetch_all_users_scripts()
    START_TIME = None
    fetch_all_duplicate_scripts()
    START_TIME = None
    fetch_all_script_data()
    START_TIME = None
    fetch_all_folders()
    START_TIME = None
    fetch_all_blog_posts()

if __name__ == "__main__":
    manager.run()
