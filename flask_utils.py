from functools import wraps

from flask import request, Response, redirect, url_for, abort
from flask_user import current_user
from wtforms.validators import ValidationError


def length_password_validator(form, field):
    password = field.data
    if len(password) < 8:
        raise ValidationError('Password must have at least 8 characters')

def get_current_user_email_with_default():
    user = 'test@example.com'
    if current_user.is_authenticated():
        user = current_user.name
    return user

def resource_access(allow_collab=False, string_response=None):
    def decorator(func):
        @wraps(func)
        def decorated_function(*args, **kwargs):
            from flask_models import Screenplay
            resource_id = None
            if request.method == 'POST':
                resource_id = request.form.get('resource_id', None)
            elif request.method == 'GET':
                resource_id = request.args.get('resource_id', None)
            user = current_user.email
            permission = Screenplay.get_users_permission(resource_id, user)
            allowable_permissions = ['owner', 'ownerDeleted']
            if allow_collab:
                allowable_permissions.append('collab')
            if permission is None or permission not in allowable_permissions:
                return abort(403)
            return func(*args, **kwargs)
        return decorated_function
    return decorator
