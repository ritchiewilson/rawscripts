from wtforms.validators import ValidationError

def length_password_validator(form, field):
    password = field.data
    if len(password) < 8:
        raise ValidationError('Password must have at least 8 characters')
