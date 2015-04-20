import datetime
import glob
import os

from flask.ext.script import Manager
from flask.ext.migrate import Migrate, MigrateCommand

from rawscripts import app, db
from flask_models import *

migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)

def get_resource_ids():
    rows = ScriptData.query.with_entities(ScriptData.resource_id). \
           distinct().all()
    rows = [row.resource_id for row in rows]
    rows.sort()
    return rows
    # resource_ids = UsersScripts.get_all_resource_ids()
    current = datetime.utcnow()
    days_ago = current.replace(day=1)
    days_ago = current.replace(month=3)
    stuff = UsersScripts.query.filter(UsersScripts.last_updated > days_ago). \
            order_by('resource_id').all()
    resource_ids = [s.resource_id for s in stuff]
    return resource_ids

@manager.command
def thin_screenplays():
    # resource_ids = UsersScripts.get_all_resource_ids()
    checks = MigrationCheck.query.all()
    resource_ids = [check.resource_id for check in checks]
    for n, resource_id in enumerate(resource_ids):
        ScriptData.thin_raw_data(resource_id)
        print "did screenplay:", n, resource_id
    print "Done"

def migrate_screenplay(resource_id):
    if resource_id == 'Demo':
        return False
    if DuplicateScript.has_parent(resource_id):
        #print "Error: not doing duplicate scripts now:", resource_id
        return False
    latest_raw = ScriptData.get_latest_version(resource_id)
    latest_migrated = ResourceVersion.get_latest_version(resource_id)
    start_from = 1
    if latest_migrated:
        start_from = latest_migrated.version
    end_at = latest_raw.version
    if ScriptData.has_duplicate_versions(resource_id, start_from, end_at):
        print "ERROR: Has some duplicate version, so skipping:", resource_id
        return False
    if ScriptData.is_missing_versions(resource_id, start_from):
        print "ERROR: Is missing version, so skipping:", resource_id
        return False
    for version in range(start_from, end_at + 1):
        success = ScriptData.migrate_version(resource_id, version)
        if not success:
            print "Skipping", resource_id, version
            return False
    return True

@manager.command
def migrate_to_ops():
    # resource_ids = UsersScripts.get_all_resource_ids()
    resource_ids = get_resource_ids()
    print "Screenplays to check", len(resource_ids)
    for i, resource_id in enumerate(resource_ids):
        if i % 200 == 0:
            print "Starting", resource_id, 'screenplay number', i
        success = migrate_screenplay(resource_id)
        if success:
            ScriptData.thin_raw_data(resource_id)
    print "Done"

@manager.command
def _delete_duplicate_versions(resource_id, version):
    saves = ScriptData.query. \
                filter_by(resource_id=resource_id,version=version).all()
    if len(saves) != 2:
        raise Exception('There were not two saves for', resource_id, "version", version)
    first, second = saves
    if first.data != second.data:
        raise Exception("Multiple saves but different data:", resource_id, version)
    if first.tag != '' or second.tag != '':
        raise Exception("Multiple saves but they haves tags:", resource_id, version)
    if first.export != '[[],[]]' or second.export != '[[],[]]':
        raise Exception("Multiple saves but they have exports:", resource_id, version)

    obj = None
    if not first.autosave and not second.autosave:
        obj = first if first.timestamp > second.timestamp else second
    if not first.autosave:
        obj = second
    elif not second.autosave:
        obj = first
    elif first.timestamp < second.timestamp:
        obj = second
    else:
        obj = first
    db.session.delete(obj)
    db.session.commit()
    print "Deleted:", resource_id, "version:", version

@manager.command
def delete_duplicate_versions():
    resource_id= 'Z8G5m0uFo1yC9aS62Oir'
    saves = ScriptData.query.filter_by(resource_id=resource_id). \
                order_by('version').with_entities(ScriptData.version).all()
    prev_version = None
    for save in saves:
        if prev_version is None:
            prev_version = save.version
            continue
        if save.version == prev_version:
            _delete_duplicate_versions(resource_id, save.version)
        prev_version = save.version
    return False


if __name__ == "__main__":
    manager.run()
