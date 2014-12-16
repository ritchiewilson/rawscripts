from google.appengine.api import users
from google.appengine.ext import db


def gcu():
    """
    Get current user. This is just the email string, lower cased.
    """
    user = users.get_current_user().email().lower()
    if user == 'mwap.cw@gmail.com':
        user = 'mwap.cw@googlemail.com'
    return user


def permission (resource_id):
    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(1000)
    user = gcu()
    p = False
    for i in results:
        if i.permission == 'owner' or i.permission == 'ownerDeleted' or i.permission == 'collab':
            if i.user == user or users.is_current_user_admin():
                p = i.title
                break
    return p

def ownerPermission (resource_id):
    q = db.GqlQuery("SELECT * FROM UsersScripts "+
                    "WHERE resource_id='"+resource_id+"'")
    results = q.fetch(1000)
    user = gcu()
    p = False
    for i in results:
        if i.permission == 'owner' or i.permission == 'ownerDeleted':
            if i.user == user:
                p = i.title
    return p
