class Activity (db.Model):
	activity = db.StringProperty()
	user = db.StringProperty()
	resource_id = db.StringProperty()
	timestamp = db.DateTimeProperty(auto_now_add=True)
	mobile = db.BooleanProperty()
	size = db.IntegerProperty()
	title = db.StringProperty()
	new_notes = db.StringProperty()
	autosave = db.BooleanProperty()
	thread_id = db.StringProperty()
	