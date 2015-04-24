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
def migrate_to_ops(direction=None):
    resource_ids = get_resource_ids()
    half = len(resource_ids) / 2
    if direction == 'fore':
        resource_ids = resource_ids[:half]
    if direction == 'back':
        resource_ids = resource_ids[::-1][:half]
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
        print 'SKIPPING: There were not two saves for', resource_id, "version", version
        return False
    first, second = saves
    if first.data != second.data:
        print "SKIPPING: Multiple saves but different data:", resource_id, version
        return False
    if first.tag != '' or second.tag != '':
        print "SKIPPING: Multiple saves but they haves tags:", resource_id, version
        return False
    def has_export(string):
        return json.loads(string) != [[],[]]
    if has_export(first.export) or has_export(second.export):
        print "SKIPPING: Multiple saves but they have exports:", resource_id, version
        return False
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
    print 'DELETING:', obj.id, obj.resource_id, obj.version
    db.session.delete(obj)
    db.session.commit()
    return True

def get_all_duplicate_script_data_versions():
    query = ScriptData.query.with_entities(ScriptData.resource_id, ScriptData.version). \
                group_by(ScriptData.resource_id, ScriptData.version).having(db.func.count() > 1)
    output = {}
    for row in query.all():
        if row.resource_id not in output:
            output[row.resource_id] = []
        output[row.resource_id].append(row.version)
    return output

@manager.command
def delete_duplicate_versions():
    dups = get_all_duplicate_script_data_versions()
    for resource_id, versions in dups.items():
        all_deleted = True
        for version in versions:
            this_deleted = _delete_duplicate_versions(resource_id, version)
            all_deleted = all_deleted and this_deleted
        if all_deleted:
            ScriptData.thin_raw_data(resource_id)
    return False


if __name__ == "__main__":
    manager.run()
