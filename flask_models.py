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
    def thin_raw_data(resource_id):
        check = MigrationCheck.query.filter_by(resource_id=resource_id).first()
        if not check:
            return
        last_version = check.verified_to - 3
        data = ScriptData.query.filter_by(resource_id=resource_id). \
                   with_entities(ScriptData.tag, ScriptData.export, ScriptData.version). \
                   all()
        versions_to_delete = []
        for d in data:
            if d.tag == '' and d.export == '[[],[]]' and d.version % 250 != 0:
                if d.version < last_version:
                    versions_to_delete.append(d.version)
        if versions_to_delete:
            ScriptData.query.filter_by(resource_id=resource_id). \
                filter(ScriptData.version.in_(versions_to_delete)). \
                delete(synchronize_session=False)
        db.session.commit()
        db.session.expire_all()

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
