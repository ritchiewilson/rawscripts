import difflib
import json
import string
from datetime import datetime
from StringIO import StringIO
import unicodedata
import random

from lxml import etree
from flask_user import UserMixin

from rawscripts import app, db
from export import Text, Pdf


class Screenplay:
    @staticmethod
    def create(title, user, data=None):
        if data is None:
            data = '[["Fade In:",1],["Int. ",0]]'
        resource_id = Screenplay.create_unique_resource_id()
        screenplay = UsersScripts(resource_id=resource_id, user=user,
                                  title=title, last_updated=datetime.utcnow(),
                                  permission='owner', folder='?none?')
        db.session.add(screenplay)
        script_data = ScriptData(resource_id=resource_id, data=data, version=1,
                                 export='[[],[]]', tag='', autosave=False,
                                 timestamp=datetime.utcnow())
        db.session.add(script_data)
        db.session.commit()
        return screenplay

    @staticmethod
    def get_title(resource_id):
        return UsersScripts.get_title(resource_id)

    @staticmethod
    def duplicate(resource_id, version, user):
        data = ScriptData.get_content_for_version(resource_id, version)
        title = UsersScripts.get_title(resource_id)
        new_title = "Copy of " + title
        new_resource_id = Screenplay.create_unique_resource_id()
        new_script_data = ScriptData(resource_id=new_resource_id,
                                     data=data,
                                     version=version + 1,
                                     export="[[],[]]",
                                     tag='',
                                     autosave=False,
                                     timestamp=datetime.utcnow())
        db.session.add(new_script_data)
        dup = DuplicateScript(new_script=new_resource_id,
                              from_script=resource_id,
                              from_version=version)
        db.session.add(dup)
        user_script = UsersScripts(user=user,
                                   title=new_title,
                                   resource_id=new_resource_id,
                                   last_updated=datetime.utcnow(),
                                   permission='owner',
                                   folder='?none?')
        db.session.add(user_script)
        db.session.commit()
        return user_script

    @staticmethod
    def get_latest_version_number(resource_id):
        latest = ScriptData.query.filter_by(resource_id=resource_id). \
                     with_entities(ScriptData.version). \
                     order_by(db.desc('version')).first()
        return latest[0]

    @staticmethod
    def create_unique_resource_id():
        chars = string.uppercase + string.lowercase + string.digits
        resource_id = None
        while resource_id is None:
            _id = ''.join(random.sample(chars, 20))
            if UsersScripts.get_by_resource_id(_id) is None:
                resource_id = _id
        return resource_id

    @staticmethod
    def export_to_file(resource_id, export_format, titlepage=False):
        screenplay = UsersScripts.query. \
                         filter_by(resource_id=resource_id).first()
        latest_version = ScriptData.get_latest_version(resource_id)
        if not latest_version:
            return None
        output = None
        content_type = None
        data = json.loads(latest_version.data)
        if export_format == 'txt':
            output = Text(data, None)
            content_type = 'text/plain'
        elif export_format == 'pdf':
            output = Pdf(data, None)
            content_type = 'application/pdf'
        if output is None:
            return None
        ascii_title = unicodedata.normalize("NFKD", screenplay.title). \
                          encode("ascii", "ignore")
        return output, ascii_title, content_type


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    firstUse = db.Column(db.DateTime)

    username = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False, default='')
    reset_password_token = db.Column(db.String(100), nullable=False, default='')
    active = db.Column(db.Boolean)

    email = db.Column(db.String(255), nullable=False, unique=True)
    confirmed_at = db.Column(db.DateTime())
    appengine_user = db.relationship('AppengineUser', uselist=False, backref='user')

    __table_args__= (db.Index('ix_user_username', 'username'),)

    def __init__(self, name=None, firstUse=None, username=None, password=None,
                 reset_password_token=None, active=False, email=None,
                 confirmed_at=None):
        self.name = name if name else email
        self.firstUse = firstUse if firstUse else datetime.utcnow()
        self.username = username if username else email
        self.password = password
        self.reset_password_token = reset_password_token
        self.active = active
        self.email = email
        self.confirmed_at = confirmed_at

    def __repr__(self):
       return "<User(name='%s')>" % (self.name)


class AppengineUser(db.Model):
    __tablename__ = 'appengine_users'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    name = db.Column(db.String)
    firstUse = db.Column(db.DateTime)
    verification_token = db.Column(db.String)
    verified_email = db.Column(db.String)
    verified = db.Column(db.Boolean)
    unsubscribe_token = db.Column(db.String)
    unsubscribed = db.Column(db.Boolean)
    reminder_sent = db.Column(db.Integer)

    def __init__(self, name, firstUse, verification_token, verified_email,
                 verified, unsubscribe_token, unsubscribed, reminder_sent):
        self.name = name
        self.firstUse = firstUse
        self.verification_token = verification_token
        self.verified_email = verified_email
        self.verified = verified
        self.unsubscribe_token = unsubscribe_token
        self.unsubscribed = unsubscribed
        self.reminder_sent = reminder_sent


class OpenIDData2(db.Model):
    __tablename__ = 'openIDData2'

    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String)
    email = db.Column(db.String)
    user_id = db.Column(db.String)
    federated_identity = db.Column(db.String)
    federated_provider= db.Column(db.String)
    timestamp = db.Column(db.DateTime)

    def __repr__(self):
       return "<OpenIDData2(email='%s')>" % (self.email)

class ScriptData(db.Model):
    __tablename__ = 'script_data'

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String)
    data = db.Column(db.Text)
    version = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    autosave = db.Column(db.Boolean)
    export = db.Column(db.String, default="[[],[]]")
    tag = db.Column(db.String, default='')

    __table_args__= (db.Index('ix_script_data_resource_id_version',
                              "resource_id", db.asc('version')),
                     db.Index('ix_script_data_timestamp', 'timestamp'))

    @staticmethod
    def get_latest_version(resource_id):
        latest = ScriptData.query.filter_by(resource_id=resource_id). \
                     order_by(db.desc('version')).first()
        return latest

    @staticmethod
    def get_version(resource_id, version):
        s = ScriptData.query. \
                filter_by(resource_id=resource_id, version=version).first()
        return s

    @staticmethod
    def thin_raw_data(resource_id):
        check = MigrationCheck.query.filter_by(resource_id=resource_id).first()
        if not check:
            return
        # don't delete first save if duplicated from another script
        from_version = -1
        dup = DuplicateScript.query.filter_by(new_script=resource_id).first()
        if dup:
            from_version = dup.from_version
        last_version = check.verified_to
        data = ScriptData.query.filter_by(resource_id=resource_id). \
                   filter(ScriptData.version < last_version). \
                   with_entities(ScriptData.tag, ScriptData.export, ScriptData.version). \
                   all()
        versions_to_delete = []
        for d in data:
            if d.tag == '' and d.export == '[[],[]]' and d.version % 250 != 0:
                if d.version != from_version + 1:
                    versions_to_delete.append(d.version)
        if versions_to_delete:
            ScriptData.query.filter_by(resource_id=resource_id). \
                filter(ScriptData.version.in_(versions_to_delete)). \
                delete(synchronize_session=False)
        db.session.commit()
        db.session.expire_all()

    @staticmethod
    def get_content_for_version(resource_id, version):
        if version == 0:
            return ''
        # get most recent full save
        prev_string = ''
        prev_version = 0
        full_save = ScriptData.query.filter_by(resource_id=resource_id). \
                        filter(ScriptData.version <= version). \
                        order_by(db.desc('version')).first()
        if full_save:
            prev_string = full_save.data
            prev_version = full_save.version
        elif DuplicateScript.has_parent(resource_id):
            dup = DuplicateScript.query. \
                      filter_by(new_script=resource_id).first()
            if dup.from_version <= version:
                prev_string = ScriptData.get_content_for_version(dup.from_script,
                                                                 dup.from_version)
                prev_version = dup.from_version
            else:
                return ScriptData.get_content_for_version(dup.from_script, version)

        saves = ResourceVersion.query.filter_by(resource_id=resource_id).\
                    filter(ResourceVersion.version > prev_version). \
                    filter(ResourceVersion.version <= version). \
                    order_by('version').options(db.subqueryload('ops')).all()
        for save in saves:
            prev_string = ScriptData.apply_ops(prev_string, save.ops)
        return prev_string

    @staticmethod
    def get_html_for_version(resource_id, version):
        v = ['s','a','c','d','p','t']
        raw_data = ScriptData.get_content_for_version(resource_id, version)
        j = json.loads(raw_data)
        s = StringIO()
        for text, line_format in j:
            node = etree.Element('p', CLASS=v[line_format])
            node.text = text
            s.write(etree.tostring(node))
        return s.getvalue()

    @staticmethod
    def verify_screenplay_at_version(resource_id, version):
        prev = ScriptData.get_content_for_version(resource_id, version - 1)
        ops = ResourceVersion.query.filter_by(resource_id=resource_id,
                                              version=version).first().ops
        new_string = ScriptData.apply_ops(prev, ops)
        expected = ScriptData.get_content_for_version(resource_id, version)
        return new_string == expected

    @staticmethod
    def apply_ops(string, ops):
        _ops = sorted(ops, key=lambda op: op.application_index)
        for op in _ops:
            tag = ["insert", "delete", "replace"][op.action]
            if tag == "delete":
                string = string[:op.offset] + string[op.offset + op.amount:]
            if tag == "insert":
                string = string[:op.offset] + op.text + string[op.offset:]
            if tag == "replace":
                string = string[:op.offset] + op.text + string[op.offset + op.amount:]
        return string

    @staticmethod
    def has_duplicate_versions(resource_id, start_from, end_at):
        saves = ScriptData.query.filter_by(resource_id=resource_id). \
                    filter(ScriptData.version >= start_from). \
                    filter(ScriptData.version <= end_at). \
                    order_by('version').with_entities(ScriptData.version).all()
        for save in saves:
            if save.version != start_from:
                return True
            start_from += 1
        return False

    @staticmethod
    def migrate_version(resource_id, version):
        # check if this version was already migrated
        exists = ResourceVersion.query. \
                     filter_by(resource_id=resource_id, version=version).first()
        if exists:
            return
        this_version = ScriptData.query.filter_by(resource_id=resource_id,
                                                  version=version).all()
        if len(this_version) == 0:
            raise Exception('No saved raw data for this version:',
                            resource_id, version)
        if len(this_version) > 1:
            raise Exception('Multiple saved raw data for this version:',
                            resource_id, version)
        this_version = this_version[0]
        rv = ResourceVersion(resource_id=resource_id,
                             version=version,
                             timestamp=this_version.timestamp,
                             autosave=bool(this_version.autosave))
        prev_string = ScriptData.get_content_for_version(resource_id, version-1)
        new_string = this_version.data
        opcodes = ScriptData.get_opcodes(prev_string, new_string)
        application_index = 0
        for tag, i1, i2, j1, j2 in reversed(opcodes):
            if tag == "equal":
                continue
            op = Op(offset=i1, application_index=application_index)
            op.action = ["insert", "delete", "replace"].index(tag)
            if tag == "delete":
                op.amount = (i2 - i1)
            elif tag == "insert":
                op.text = new_string[j1:j2]
            elif tag == "replace":
                op.amount = (i2 - i1)
                op.text = new_string[j1:j2]
            rv.ops.append(op)
            application_index += 1
        ScriptData.save_tags(this_version, rv)
        db.session.add(rv)
        db.session.commit()

    @staticmethod
    def save_tags(snapshot, resource_version):
        # save all the email, export, and user defined tags
        if snapshot.tag is not None and snapshot.tag != '':
            tag = VersionTag(_type='user',
                             value=snapshot.tag,
                             timestamp=resource_version.timestamp)
            resource_version.tags.append(tag)

        def save_tag(entry, _type):
            value = entry[0]
            timestamp = entry[1]
            if len(timestamp) == 19:
                timestamp += ".000000"
            timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
            tag = VersionTag(_type=_type,
                             value=value,
                             timestamp=timestamp)
            resource_version.tags.append(tag)
        if snapshot.export == '':
            return
        emails, exports = json.loads(snapshot.export)
        for email in emails:
            save_tag(email, 'email')
        for export in exports:
            save_tag(export, 'export')

    @staticmethod
    def get_diff_strings_and_offset(string0, string1):
        offset = 0
        diff_string0, diff_string1 = string0, string1

        while diff_string0 and diff_string1 and \
              diff_string0[:1000] == diff_string1[:1000]:
            diff_string0 = diff_string0[990:]
            diff_string1 = diff_string1[990:]
            offset += 990

        while diff_string0 and diff_string1 and \
              diff_string0[-1000:] == diff_string1[-1000:]:
            diff_string0 = diff_string0[:-990]
            diff_string1 = diff_string1[:-990]

        return diff_string0, diff_string1, offset

    @staticmethod
    def get_opcodes(string0, string1):
        if string0 == string1:
            return []
        diff_string0, diff_string1, offset = \
            ScriptData.get_diff_strings_and_offset(string0, string1)

        diff = difflib.SequenceMatcher(None, diff_string0, diff_string1)
        opcodes = diff.get_opcodes()
        # add offset in case we only needed to diff second half of texts
        opcodes = [(tag, i1 + offset, i2 + offset, j1 + offset, j2 + offset) for
                   tag, i1, i2, j1, j2 in opcodes]
        # only the first opcode should have changed. make sure they start from 0
        if opcodes[0][0] == 'equal':
            f = opcodes[0]
            opcodes[0] = (f[0], 0, f[2], 0, f[4])
        return opcodes

    def __repr__(self):
       return "<ScriptData(resource_id='%s', version='%s')>" % (self.resource_id, str(self.version))

class ResourceVersion(db.Model):
    __tablename__ = "resource_versions"

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String)
    version = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime)
    autosave = db.Column(db.Boolean)
    ops = db.relationship('Op')
    tags = db.relationship('VersionTag')

    __table_args__= (db.Index('ix_resource_versions_resource_id_version', "resource_id", db.asc('version')),)

    @staticmethod
    def get_latest_version(resource_id):
        latest = ResourceVersion.query.filter_by(resource_id=resource_id). \
                     order_by(db.desc('version')).first()
        return latest

    @staticmethod
    def get_historical_metadata(resource_id, version=None):
        query = ResourceVersion.query.filter_by(resource_id=resource_id). \
                order_by(db.desc('version'))
        if version is not None:
            query = query.filter(ResourceVersion.version <= version)
        query = query.limit(1000)
        return query.all()

    def get_exports_and_tags(self):
        exports = []
        saved_tag = ''
        for tag in self.tags:
            if tag._type == 'email':
                exports.append([tag.value, str(tag.timestamp)])
            if tag._type == 'user':
                saved_tag = tag.value
        return json.dumps([exports, []]), saved_tag


class Op(db.Model):
    __tablename__ = "ops"

    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.Integer) # 0: insert, 1: delete, 3: replace
    offset = db.Column(db.Integer)
    amount = db.Column(db.Integer)
    text = db.Column(db.Text)
    application_index = db.Column(db.Integer)
    resource_version_id = db.Column(db.Integer, db.ForeignKey('resource_versions.id'))

    __table_args__= (db.Index('fk_ops_resource_version_id', "resource_version_id"),)

class VersionTag(db.Model):
    __tablename__ = "version_tags"

    id = db.Column(db.Integer, primary_key=True)
    _type = db.Column(db.String)
    value = db.Column(db.String)
    timestamp = db.Column(db.DateTime)
    resource_version_id = db.Column(db.Integer, db.ForeignKey('resource_versions.id'))

    __table_args__= (db.Index('fk_version_tags_resource_version_id', "resource_version_id"),)


class UsersScripts(db.Model):
    __tablename__ = "users_scripts"

    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String)
    resource_id = db.Column(db.String)
    title = db.Column(db.String)
    last_updated = db.Column(db.DateTime)
    permission = db.Column(db.String)
    folder = db.Column(db.String)

    __table_args__= (db.Index('ix_users_scripts_resource_id_updated',
                           'resource_id', db.desc('last_updated')),)

    @staticmethod
    def get_by_resource_id(resource_id):
        return UsersScripts.query.filter_by(resource_id=resource_id).first()

    @staticmethod
    def get_all_resource_ids():
        rows = UsersScripts.query.with_entities(UsersScripts.resource_id). \
                   distinct().all()
        rows = [row.resource_id for row in rows]
        return rows

    @staticmethod
    def get_users_permission(resource_id, user):
        # this check is just for the EOV in the editor window
        if resource_id == 'Demo':
            return 'owner'
        row = UsersScripts.query.filter_by(resource_id=resource_id,
                                           user=user).first()
        if row is None:
            return None
        return row.permission

    @staticmethod
    def get_all_collaborators(resource_id):
        collabs = UsersScripts.query.with_entities(UsersScripts.user). \
                  filter_by(resource_id=resource_id, permission='collab').all()
        collabs = [c.user for c in collabs]
        return collabs

    @staticmethod
    def get_title(resource_id):
        row = UsersScripts.query. \
              filter_by(resource_id=resource_id, permission='owner').first()
        return row.title


class MigrationCheck(db.Model):
    __tablename__ = "migration_check"

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String)
    verified_to = db.Column(db.Integer)

    __table_args__= (db.Index('ix_migration_check_resource_id', 'resource_id'),)


class DuplicateScript(db.Model):
    __tablename__ = "duplicate_scripts"

    id = db.Column(db.Integer, primary_key=True)
    from_script = db.Column(db.String)
    new_script = db.Column(db.String)
    from_version = db.Column(db.Integer)
    __key__ = db.Column(db.String)

    @staticmethod
    def has_parent(resource_id):
        is_dup = DuplicateScript.query. \
                     filter_by(new_script=resource_id).first()
        return is_dup is not None


class Folder(db.Model):
    __tablename__ = "folders"

    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String)
    data = db.Column(db.String)
    __key__ = db.Column(db.String)

class Blog(db.Model):
    __tablename__ = "blog"

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.Text)
    title = db.Column(db.String)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    path = db.Column(db.String)

    def get_url(self):
        url = "http://" + app.config['SERVER_NAME']
        return url + "/blog/" + self.path

    def get_path_from_title(self):
        exclude = set(string.punctuation)
        path = ''.join(ch for ch in self.title if ch not in exclude)
        path = path.replace(" ","-").lower()
        return path

    def get_date_string(self):
        return self.timestamp.strftime('%b %d, %Y')


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String, nullable=False)
    thread_id = db.Column(db.String, nullable=False)
    updated = db.Column(db.DateTime, default=datetime.utcnow)
    data = db.Column(db.Text)
    row = db.Column(db.Integer)
    col = db.Column(db.Integer)

    __table_args__= (db.Index('ix_notes_resource_id', 'resource_id'),
                     db.Index('ix_notes_thread_id', 'thread_id'))

    @staticmethod
    def get_by_resource_id(resource_id):
        return Note.query.filter_by(resource_id=resource_id).all()

    @staticmethod
    def get_by_thread_id(thread_id):
        return Note.query.filter_by(thread_id=thread_id).first()

    def to_dict(self):
        # TODO: support for read and unread mssages
        output = {
            'row': self.row,
            'col': self.col,
            'thread_id': self.thread_id
        }
        msg_keys = ['text', 'user', 'msg_id', 'readBool']
        raw_msgs = json.loads(self.data)
        msgs = []
        for raw_msg in raw_msgs:
            raw_msg.append(1)
            msgs.append(dict(zip(msg_keys, raw_msg)))
        output['msgs'] = msgs
        return output
