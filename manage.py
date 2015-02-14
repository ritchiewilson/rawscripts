from flask.ext.script import Manager

from rawscripts import app, db
from flask_models import *

manager = Manager(app)


@manager.command
def thin_screenplays():
    resource_ids = UsersScripts.get_all_resource_ids()
    for n, resource_id in enumerate(resource_ids):
        ScriptData.thin_raw_data(resource_id)
        print "did screenplay:", n, resource_id
    print "Done"

if __name__ == "__main__":
    manager.run()
