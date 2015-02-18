import datetime

from flask.ext.script import Manager

from rawscripts import app, db
from flask_models import *

manager = Manager(app)

def get_resource_ids():
    # resource_ids = UsersScripts.get_all_resource_ids()
    current = datetime.utcnow()
    days_ago = current.replace(day=13)
    stuff = UsersScripts.query.filter(UsersScripts.last_updated > days_ago). \
            order_by('resource_id').all()
    resource_ids = [s.resource_id for s in stuff]
    return resource_ids

@manager.command
def thin_screenplays():
    # resource_ids = UsersScripts.get_all_resource_ids()
    resource_ids = get_resource_ids()
    for n, resource_id in enumerate(resource_ids):
        ScriptData.thin_raw_data(resource_id)
        print "did screenplay:", n, resource_id
    print "Done"

def verify_screenplay(resource_id):
    if resource_id == 'Demo':
        return
    start_from = 1
    check = MigrationCheck.query.filter_by(resource_id=resource_id).first()
    if check:
        start_from = check.verified_to
    elif DuplicateScript.has_parent(resource_id):
        dup = DuplicateScript.query.filter_by(new_script=resource_id).first()
        start_from = max(start_from, dup.from_version + 1)
    last_save = ResourceVersion.get_latest_version(resource_id)
    if not last_save:
        print "Not migrated:", resource_id
        return
    end_at = last_save.version
    if ScriptData.has_duplicate_versions(resource_id, start_from, end_at):
        print "Script has multiple saves with same version number:", resource_id
        return

    last_verified = None

    for version in range(start_from, end_at + 1):
        if ScriptData.verify_screenplay_at_version(resource_id, version):
            last_verified = version
        else:
            print "Error checking version:", resource_id, version
            return
    print "Last verified was:", resource_id, last_verified
    if last_verified is None:
        return
    check = MigrationCheck.query.filter_by(resource_id=resource_id).first()
    if not check:
        check = MigrationCheck(resource_id=resource_id)
        db.session.add(check)
    check.verified_to = last_verified
    db.session.commit()
    if start_from != last_verified:
        print "Moved from", start_from, "to", last_verified

@manager.command
def verify_screenplays():
    # resource_ids = UsersScripts.get_all_resource_ids()
    resource_ids = get_resource_ids()
    for resource_id in resource_ids:
        verify_screenplay(resource_id)
    print "Done"

def migrate_screenplay(resource_id):
    if resource_id == 'Demo':
        return
    latest_raw = ScriptData.get_latest_version(resource_id)
    latest_migrated = ResourceVersion.get_latest_version(resource_id)
    if latest_migrated and latest_raw.version == latest_migrated.version:
        print "Already fully migrated:", resource_id
        return
    start_from = 1
    if latest_migrated:
        start_from = latest_migrated.version + 1
    else:
        first_raw = ScriptData.query.filter_by(resource_id=resource_id). \
                        order_by(db.asc('version')).first()
        if first_raw.version != 1 and not DuplicateScript.has_parent(resource_id):
            raise Exception('Screenplay has no first version, but not dup', resource_id)
        start_from = first_raw.version
    end_at = latest_raw.version
    for version in range(start_from, end_at + 1):
        ScriptData.migrate_version(resource_id, version)
    print "Migrated from version", start_from, "to", end_at

@manager.command
def migrate_to_ops():
    # resource_ids = UsersScripts.get_all_resource_ids()
    resource_ids = get_resource_ids()
    print "Screenplays to check", len(resource_ids)
    for resource_id in resource_ids:
        migrate_screenplay(resource_id)
    print "Done"

if __name__ == "__main__":
    manager.run()
