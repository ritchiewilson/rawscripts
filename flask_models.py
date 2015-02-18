import difflib
import json
from datetime import datetime

from rawscripts import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    firstUse = db.Column(db.DateTime)

    def __repr__(self):
       return "<User(name='%s')>" % (self.name)


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
    timestamp = db.Column(db.DateTime)
    autosave = db.Column(db.Boolean)
    export = db.Column(db.String)
    tag = db.Column(db.String)

    __table_args__= (db.Index('ix_script_data_resource_id', "resource_id"),
                     db.Index('ix_script_data_timestamp', 'timestamp'))

    @staticmethod
    def get_latest_version(resource_id):
        latest = ScriptData.query.filter_by(resource_id=resource_id). \
                     order_by(db.desc('version')).first()
        return latest

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
            timestamp = datetime.strptime(entry[1], "%Y-%m-%d %H:%M:%S.%f")
            tag = VersionTag(_type=_type,
                             value=value,
                             timestamp=timestamp)
            resource_version.tags.append(tag)
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
    def get_all_resource_ids():
        rows = UsersScripts.query.with_entities(UsersScripts.resource_id). \
                   distinct().all()
        rows = [row.resource_id for row in rows]
        return rows


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
