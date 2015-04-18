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
