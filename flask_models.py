# Rawscripts - Screenwriting Software
# Copyright (C) Ritchie Wilson
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
from flask_utils import get_current_user_email_with_default

collaborators = db.Table('collaborators',
    db.Column('screenplay_id', db.Integer, db.ForeignKey('screenplays.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'))
)

class Screenplay(db.Model):
    __tablename__ = 'screenplays'

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String, nullable=False, unique=True)
    title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    is_trashed = db.Column(db.Boolean, default=False)
    is_hard_deleted = db.Column(db.Boolean, default=False)

    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    collaborators = db.relationship('User', secondary=collaborators,
                                    backref='read_only_screenplays')

    __table_args__= (db.Index('ix_screenplays_resource_id_updated',
                              'resource_id', db.desc('last_updated')),
                     db.Index('fk_screenplays_owner_id', 'owner_id'))

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
    def has_parent(resource_id):
        is_dup = DuplicateScript.query. \
                     filter_by(new_script=resource_id).first()
        return is_dup is not None

    @staticmethod
    def has_child(resource_id):
        child = DuplicateScript.query. \
                     filter_by(from_script=resource_id).first()
        return child is not None

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
        title_page_obj = TitlePageData.get_or_create(resource_id) if titlepage else None
        output = None
        content_type = None
        data = json.loads(latest_version.data)
        if export_format == 'txt':
            output = Text(data, title_page_obj)
            content_type = 'text/plain'
        elif export_format == 'pdf':
            output = Pdf(data, title_page_obj)
            content_type = 'application/pdf'
        if output is None:
            return None
        ascii_title = unicodedata.normalize("NFKD", screenplay.title). \
                          encode("ascii", "ignore")
        return output, ascii_title, content_type

    @staticmethod
    def add_access(resource_id, collaborators):
        # uniquify list
        collaborators = set([c.lower() for c in collaborators if c != ''])
        existing_rows = UsersScripts.get_all_by_resource_id(resource_id)
        existing_collaborators = set([row.user.lower() for row in existing_rows])
        new_collaborators = list(collaborators - existing_collaborators)

        title = Screenplay.get_title(resource_id)
        for collaborator in new_collaborators:
            obj = UsersScripts(resource_id=resource_id, permission='collab',
                               user=collaborator, title=title)
            db.session.add(obj)
            notify = ShareNotify(user=collaborator, resource_id=resource_id)
            db.session.add(notify)
        db.session.commit()
        return new_collaborators

    @staticmethod
    def remove_access(resource_id, collaborator):
        row = UsersScripts.get_by_resource_id(resource_id, user=collaborator)
        if not row or row.permission != 'collab':
            return False
        db.session.delete(row)
        UnreadNote.query.filter_by(resource_id=resource_id, user=collaborator).delete()
        ShareNotify.query.filter_by(resource_id=resource_id, user=collaborator).delete()
        db.session.commit()
        return True

    @staticmethod
    def get_users_permission(resource_id, user):
        if resource_id is None:
            return None
        return UsersScripts.get_users_permission(resource_id, user)

    @staticmethod
    def version_exists(resource_id, version):
        models = [ScriptData, ResourceVersion]
        for m in models:
            q = m.query.filter_by(resource_id=resource_id, version=version)
            if db.session.query(q.exists()).scalar():
                return True
        return False

    @staticmethod
    def delete_all(resource_id):
        screenplay = UsersScripts.get_by_resource_id(resource_id)
        if screenplay is None:
            return False
        if screenplay.permission != 'hardDelete':
            return False
        if Screenplay.has_child(resource_id):
            return False
        for row in DuplicateScript.query.filter_by(new_script=resource_id).all():
            db.session.delete(row)
        models = [ResourceVersion, TitlePageData, ScriptData, Note, UnreadNote,
                  ShareNotify, UsersScripts]
        for model in models:
            for row in model.query.filter_by(resource_id=resource_id).all():
                db.session.delete(row)
        db.session.commit()
        return True

    @staticmethod
    def count():
        return db.session.query(db.func.count(db.distinct(UsersScripts.resource_id))).first()[0]

    @staticmethod
    def get_all_hard_deleted():
        return UsersScripts.query.filter_by(permission='hardDelete').all()

    @staticmethod
    def get_all_recently_updated(date_cutoff):
        return UsersScripts.query. \
            filter(UsersScripts.last_updated > date_cutoff). \
            order_by('resource_id').all()

    @staticmethod
    def rename(resource_id, new_name):
        if new_name is None:
            return False
        for row in UsersScripts.query.filter_by(resource_id=resource_id).all():
            row.title = new_name
        db.session.commit()

    @staticmethod
    def hard_delete(resource_id):
        rows = UsersScripts.query.filter_by(resource_id=resource_id).all()
        for row in rows:
            row.permission = 'hardDelete'
        db.session.commit()

    @staticmethod
    def move_to_trash(resource_id):
        switches = {'owner': 'ownerDeleted',
                    'collab': 'collabDeletedByOwner'}
        Screenplay.switch_deletion_permissions(resource_id, switches)

    @staticmethod
    def remove_from_trash(resource_id):
        switches = {'ownerDeleted': 'owner',
                    'collabDeletedByOwner': 'collab'}
        Screenplay.switch_deletion_permissions(resource_id, switches)

    @staticmethod
    def switch_deletion_permissions(resource_id, switches):
        rows = UsersScripts.query.filter_by(resource_id=resource_id).all()
        for row in rows:
            if row.permission in switches:
                row.permission = switches[row.permission]
        db.session.commit()


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    firstUse = db.Column(db.DateTime, default=datetime.utcnow)

    username = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False, default='')
    reset_password_token = db.Column(db.String(100), nullable=False, default='')
    active = db.Column(db.Boolean)

    email = db.Column(db.String(255), nullable=False, unique=True)
    confirmed_at = db.Column(db.DateTime())
    appengine_user = db.relationship('AppengineUser', uselist=False, backref='user')
    screenplays = db.relationship('Screenplay', backref='owner')

    __table_args__= (db.Index('ix_user_username', 'username'),)

    def __init__(self, **kwargs):
        email = kwargs['email']
        for field in ['name', 'username']:
            kwargs[field] = kwargs.get(field, email)
        super(User, self).__init__(**kwargs)

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
        last_migration = ResourceVersion.get_latest_version(resource_id)
        if not last_migration:
            print "ERROR: Missing migration data. Why?:", resource_id
            return False
        last_version = last_migration.version
        data = ScriptData.query.filter_by(resource_id=resource_id). \
                   filter(ScriptData.version < last_version). \
                   with_entities(ScriptData.tag, ScriptData.export, ScriptData.version). \
                   all()
        versions_to_delete = []
        KEEP_VERSIONS = [1]
        if Screenplay.has_parent(resource_id):
            dup = DuplicateScript.query.filter_by(new_script=resource_id).first()
            KEEP_VERSIONS.append(dup.from_version + 1)
        for d in data:
            if d.tag == '' and d.export == '[[],[]]' and d.version % 100 != 0:
                if d.version not in KEEP_VERSIONS:
                    versions_to_delete.append(d.version)
        if versions_to_delete:
            ScriptData.query.filter_by(resource_id=resource_id). \
                filter(ScriptData.version.in_(versions_to_delete)). \
                delete(synchronize_session=False)
            print "DELETING", resource_id, len(versions_to_delete)
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
        for save1, save2 in zip(saves, saves[1:]):
            if save1.version == save2.version:
                return True
        return False

    @staticmethod
    def is_missing_versions(resource_id, start_from):
        saves = ScriptData.query.filter_by(resource_id=resource_id). \
                    filter(ScriptData.version >= start_from). \
                    order_by('version').with_entities(ScriptData.version).all()
        for save1, save2 in zip(saves, saves[1:]):
            if save1.version + 1 != save2.version:
                return True
        return False

    @staticmethod
    def migrate_version(resource_id, version):
        # check if this version was already migrated
        exists = ResourceVersion.query. \
                     filter_by(resource_id=resource_id, version=version).first()
        if exists:
            return True
        this_version = ScriptData.query.filter_by(resource_id=resource_id,
                                                  version=version).all()
        if len(this_version) == 0:
            print 'ERROR: No saved raw data for this version:', resource_id, version
            return False
        if len(this_version) > 1:
            print 'ERROR: Multiple saved raw data for this version:', resource_id, version
            return False
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
        return True

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
    ops = db.relationship('Op', cascade='delete,delete-orphan')
    tags = db.relationship('VersionTag', cascade='delete,delete-orphan')

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
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    permission = db.Column(db.String)
    folder = db.Column(db.String, default='?none?')

    __table_args__= (db.Index('ix_users_scripts_resource_id_updated',
                           'resource_id', db.desc('last_updated')),)

    @staticmethod
    def get_by_resource_id(resource_id, user=None):
        query = UsersScripts.query.filter_by(resource_id=resource_id)
        if user is not None:
            query = query.filter_by(user=user)
        return query.first()

    @staticmethod
    def get_all_by_resource_id(resource_id):
        return UsersScripts.query.filter_by(resource_id=resource_id).all()

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
        rows = UsersScripts.query.filter_by(resource_id=resource_id).all()
        # dumb looping is maybe best current way to handle case sensitivity
        # issues
        for row in rows:
            if row.user.lower() == user.lower():
                return row.permission
        return None

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

    @staticmethod
    def get_by_user(user):
        return Folder.query.filter_by(user=user).first()

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

    def to_dict(self, unread_msg_ids=None):
        if unread_msg_ids is None:
            unread_msg_ids = []
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
            raw_msg.append(0 if raw_msg[2] in unread_msg_ids else 1)
            msgs.append(dict(zip(msg_keys, raw_msg)))
        output['msgs'] = msgs
        return output

class UnreadNote (db.Model):
    __tablename__ = "unread_notes"

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String)
    thread_id = db.Column(db.String)
    msg_id = db.Column(db.String)
    user = db.Column(db.String)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__= (db.Index('ix_unread_notes_resource_id', 'resource_id'),
                     db.Index('ix_unread_notes_thread_id', 'thread_id'),
                     db.Index('ix_unread_notes_user', 'user'))


class TitlePageData(db.Model):
    __tablename__ = "title_page_data"

    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String, nullable=False, unique=True)
    title = db.Column(db.String)
    written_by = db.Column(db.String, nullable=False, default='')
    contact = db.Column(db.String, nullable=False, default='')

    __table_args__= (db.Index('ix_title_page_data_resource_id', 'resource_id'),)

    @staticmethod
    def get_by_resource_id(resource_id):
        return TitlePageData.query.filter_by(resource_id=resource_id).first()

    @staticmethod
    def get_or_create(resource_id):
        obj = TitlePageData.get_by_resource_id(resource_id)
        if not obj:
            obj = TitlePageData(resource_id=resource_id)
            obj.title = Screenplay.get_title(resource_id)
            db.session.add(obj)
            db.session.commit()
        return obj

    @staticmethod
    def get_fields_by_resource_id(resource_id):
        obj = TitlePageData.get_by_resource_id(resource_id)
        if not obj:
            defaults = {
                'title': Screenplay.get_title(resource_id),
                'written_by': 'Written By\n\n',
                'contact': get_current_user_email_with_default()
            }
            return defaults

        fields = [ 'title', 'written_by', 'contact' ]
        return dict((field, getattr(obj, field)) for field in fields)


class ShareNotify(db.Model):
    __tablename__ = "share_notify"

    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String, nullable=False)
    resource_id = db.Column(db.String, nullable=False)
    timeshared = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    timeopened = db.Column(db.DateTime, default=datetime.utcnow)
    opened = db.Column(db.Boolean, default=False)

    __table_args__= (db.Index('ix_share_notify_resource_id', 'resource_id'),
                     db.Index('ix_share_notify_user', 'user'))

    @staticmethod
    def get_by_email(email):
        return ShareNotify.query.filter_by(user=email).all()
