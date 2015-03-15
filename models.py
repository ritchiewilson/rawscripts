from google.appengine.ext import db
from google.appengine.api import users

class NewUserCounting(db.Model):
    month = db.IntegerProperty()
    year = db.IntegerProperty()
    count = db.IntegerProperty(default=0)

class SpellingData (db.Model):
    resource_id = db.StringProperty()
    wrong = db.TextProperty()
    ignore = db.TextProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)

class ShareDB (db.Model):
    name = db.StringProperty()
    resource_id = db.StringProperty()
    fromPage = db.StringProperty()

class ShareNotify (db.Model):
    user= db.StringProperty()
    resource_id = db.StringProperty()
    timeshared = db.DateTimeProperty()
    timeopened = db.DateTimeProperty()
    opened = db.BooleanProperty()

class LastUpdatedEtag (db.Model):
    name = db.StringProperty()
    etag = db.StringProperty()
    resource_id = db.StringProperty()

class Users (db.Model):
    name = db.StringProperty()
    firstUse = db.DateTimeProperty(auto_now_add=True)
    verification_token = db.StringProperty()
    verified_email = db.StringProperty()
    verified = db.BooleanProperty()

class Notes (db.Model):
    resource_id = db.StringProperty()
    thread_id=db.StringProperty()
    updated = db.DateTimeProperty(auto_now_add=True)
    data = db.TextProperty()
    row = db.IntegerProperty()
    col = db.IntegerProperty()

class NotesNotify (db.Model):
    resource_id = db.StringProperty()
    thread_id = db.StringProperty()
    user = db.StringProperty()
    new_notes= db.IntegerProperty()

class UnreadNotes (db.Model):
    resource_id = db.StringProperty()
    thread_id = db.StringProperty()
    user = db.StringProperty()
    msg_id = db.StringProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)

class ScriptData (db.Model):
    resource_id = db.StringProperty()
    data = db.TextProperty()
    version = db.IntegerProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)
    autosave = db.IntegerProperty()
    export = db.StringProperty()
    tag = db.StringProperty()

class TitlePageData (db.Model):
    resource_id = db.StringProperty()
    title = db.StringProperty()
    authorOne = db.StringProperty()
    authorTwo = db.StringProperty()
    authorTwoChecked = db.StringProperty()
    authorThree  = db.StringProperty()
    authorThreeChecked  = db.StringProperty()
    based_on  = db.StringProperty()
    based_onChecked  = db.StringProperty()
    address = db.StringProperty()
    addressChecked = db.StringProperty()
    phone = db.StringProperty()
    phoneChecked = db.StringProperty()
    cell = db.StringProperty()
    cellChecked = db.StringProperty()
    email = db.StringProperty()
    emailChecked = db.StringProperty()
    registered = db.StringProperty()
    registeredChecked = db.StringProperty()
    other = db.StringProperty()
    otherChecked = db.StringProperty()

class UsersScripts (db.Model):
    user = db.StringProperty()
    resource_id = db.StringProperty()
    title = db.StringProperty()
    last_updated = db.DateTimeProperty()
    permission = db.StringProperty()
    folder = db.StringProperty()

class DuplicateScripts (db.Model):
    new_script = db.StringProperty()
    from_script = db.StringProperty()
    from_version = db.IntegerProperty()

class Folders (db.Model):
    data = db.StringProperty()
    user = db.StringProperty()

class UsersSettings(db.Model):
    autosave = db.BooleanProperty()
    owned_notify = db.StringProperty()
    shared_notify = db.StringProperty()

class YahooOAuthTokens (db.Model):
    t = db.TextProperty()

class BlogDB (db.Model):
    data = db.TextProperty()
    title = db.StringProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)

class OpenIDData2(db.Model):
    nickname = db.StringProperty()
    email = db.StringProperty()
    user_id = db.StringProperty()
    federated_identity = db.StringProperty()
    federated_provider = db.StringProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)

class ResourceVersion(db.Model):
    resource_id = db.StringProperty()
    version = db.IntegerProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)
    autosave = db.BooleanProperty()

    @staticmethod
    def get_last_version_number(resource_id):
        query = ResourceVersion.all()
        query.filter('resource_id =', resource_id)
        query.order('-version')
        latest = query.get(projection=('version',))
        if latest is None:
            return 0
        return latest.version


class Op(db.Model):
    resource_version = db.ReferenceProperty(ResourceVersion,
                                            collection_name="ops")
    action = db.IntegerProperty() # 0: insert, 1: delete, 3: replace
    offset = db.IntegerProperty()
    amount = db.IntegerProperty()
    text = db.TextProperty()
    application_index = db.IntegerProperty()

class VersionTag(db.Model):
    resource_version = db.ReferenceProperty(ResourceVersion,
                                            collection_name="tags")
    _type = db.StringProperty()
    value = db.StringProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)

class MigrationCheck(db.Model):
    resource_id = db.StringProperty()
    diffing = db.BooleanProperty()
    checking = db.BooleanProperty()
    correct = db.BooleanProperty()
    text =  db.StringProperty()

class VersionErrors(db.Model):
    resource_id = db.StringProperty()
    version =  db.IntegerProperty()
    next_version = db.IntegerProperty()
    one_tagged = db.BooleanProperty()
    both_tagged = db.BooleanProperty()
