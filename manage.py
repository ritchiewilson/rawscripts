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

@manager.command
def get_all_email_addresses():
    num_good = 0
    tot = 0
    all_emails = set([])
    from validate_email import validate_email
    for user in User.query.all():
        if not validate_email(user.name) or "http" in user.name:
            print "failed name: '" + user.name + "'"
        else:
            num_good += 1
        if user.name != user.name.lower():
            print "Bad case", user.name
        tot +=1
    print "Number good-ish:", num_good
    print "out of", tot

def concatenate(filenames, outfile_name):
    if os.path.exists(outfile_name):
        os.remove(outfile_name)
    with open(outfile_name, 'w') as outfile:
        for fname in filenames:
            with open(fname) as infile:
                for line in infile:
                    outfile.write(line)

def compile_js(page):
    all_pages = ['editor', 'scriptlist', 'titlepage']
    if page not in all_pages:
        return
    my_files = "static/js/restricted/{0}/*.js".format(page)
    temp_file = "static/js/restricted/{0}-temp.js".format(page)
    concatenate(glob.glob(my_files), temp_file)
    import closure
    import subprocess
    jar = closure.get_jar_filename()
    min_path = "static/js/min/{0}-compiled.js".format(page)
    closure_library = "static/closure-library/"
    calcdeps = closure_library + "/closure/bin/calcdeps.py"
    with open(min_path, 'w') as f:
        subprocess.call(["python", calcdeps, "-i", temp_file, "-p", closure_library, "-o", "compiled", "-c", jar, "-f", "--compilation_level=ADVANCED_OPTIMIZATIONS"], stdout=f)
    os.remove(temp_file)

def compile_css(page):
    if page not in ['editor', 'scriptlist']:
        return
    closure_css = ['menu', 'menuitem', 'menuseparator', 'common', 'toolbar',
                   'button', 'custombutton', 'autocomplete']
    if page == "editor":
        closure_css += ['dialog', 'tab', 'tabbar', 'colormenubutton',
                        'palette', 'colorpalette', 'editor/bubble',
                        'editor/dialog', 'editortoolbar']
    closure_library = "static/closure-library/"
    path = closure_library + "/closure/goog/css/{0}.css"
    fnames = [path.format(f) for f in closure_css]
    fnames.append("static/css/{0}.css".format(page))
    if not os.path.exists('static/css/min'):
        os.mkdir('static/css/min')
    concatenate(fnames, "static/css/min/{0}-all.css".format(page))

@manager.command
def compile_assets(asset_type, page):
    all_pages = ['editor', 'scriptlist', 'titlepage']
    if page not in all_pages and not page == 'all':
        return
    pages = all_pages if page == 'all' else [page]
    compile_func = compile_js if asset_type == 'js' else compile_css
    for p in pages:
        compile_func(p)

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
    resource_id= 'jQf0siJBempEUZyk3Flz'
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
