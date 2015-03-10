from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Index, ForeignKey, asc, desc
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    firstUse = Column(DateTime)

    def __repr__(self):
       return "<User(name='%s')>" % (self.name)


class OpenIDData2(Base):
    __tablename__ = 'openIDData2'

    id = Column(Integer, primary_key=True)
    nickname = Column(String)
    email = Column(String)
    user_id = Column(String)
    federated_identity = Column(String)
    federated_provider= Column(String)
    timestamp = Column(DateTime)

    def __repr__(self):
       return "<OpenIDData2(email='%s')>" % (self.email)

class ScriptData(Base):
    __tablename__ = 'script_data'

    id = Column(Integer, primary_key=True)
    resource_id = Column(String)
    data = Column(Text)
    version = Column(Integer)
    timestamp = Column(DateTime)
    autosave = Column(Boolean)
    export = Column(String)
    tag = Column(String)

    __table_args__= (Index('ix_script_data_resource_id', "resource_id"),
                     Index('ix_script_data_timestamp', 'timestamp'))

    def __repr__(self):
       return "<ScriptData(resource_id='%s', version='%s')>" % (self.resource_id, str(self.version))

class ResourceVersion(Base):
    __tablename__ = "resource_versions"

    id = Column(Integer, primary_key=True)
    resource_id = Column(String)
    version = Column(Integer)
    timestamp = Column(DateTime)
    autosave = Column(Boolean)
    ops = relationship('Op')
    tags = relationship('VersionTag')

    __table_args__= (Index('ix_resource_versions_resource_id_version', "resource_id", asc('version')),)


class Op(Base):
    __tablename__ = "ops"

    id = Column(Integer, primary_key=True)
    action = Column(Integer) # 0: insert, 1: delete, 3: replace
    offset = Column(Integer)
    amount = Column(Integer)
    text = Column(Text)
    application_index = Column(Integer)
    resource_version_id = Column(Integer, ForeignKey('resource_versions.id'))

    __table_args__= (Index('fk_ops_resource_version_id', "resource_version_id"),)

class VersionTag(Base):
    __tablename__ = "version_tags"

    id = Column(Integer, primary_key=True)
    _type = Column(String)
    value = Column(String)
    timestamp = Column(DateTime)
    resource_version_id = Column(Integer, ForeignKey('resource_versions.id'))

    __table_args__= (Index('fk_version_tags_resource_version_id', "resource_version_id"),)


class UsersScripts(Base):
    __tablename__ = "users_scripts"

    id = Column(Integer, primary_key=True)
    user = Column(String)
    resource_id = Column(String)
    title = Column(String)
    last_updated = Column(DateTime)
    permission = Column(String)
    folder = Column(String)

    __table_args__= (Index('ix_users_scripts_resource_id_updated',
                           'resource_id', desc('last_updated')),)

class MigrationCheck(Base):
    __tablename__ = "migration_check"

    id = Column(Integer, primary_key=True)
    resource_id = Column(String)
    verified_to = Column(Integer)

    __table_args__= (Index('ix_migration_check_resource_id', 'resource_id'),)


class DuplicateScript(Base):
    __tablename__ = "duplicate_scripts"

    id = Column(Integer, primary_key=True)
    from_script = Column(String)
    new_script = Column(String)
    from_version = Column(Integer)
    __key__ = Column(String)


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True)
    user = Column(String)
    data = Column(String)
    __key__ = Column(String)
