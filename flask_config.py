import os

class Config(object):
    DEBUG = False
    TESTING = False
    CSRF_ENABLED = True
    SECRET_KEY = 'this-really-needs-to-be-changed'
    SERVER_NAME = os.getenv('SERVER_NAME', '')
    MAIL_DEFAULT_SENDER = 'test@example.com'

    USER_AFTER_LOGOUT_ENDPOINT = ''
    USER_ENABLE_USERNAME = False
    USER_ENABLE_CHANGE_USERNAME = False
    USER_AFTER_CONFIRM_ENDPOINT = 'scriptlist'
    USER_APP_NAME = 'Rawscripts'


class ProductionConfig(Config):
    DEBUG = False


class StagingConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'dummy')

    MAIL_USERNAME = 'noreply@rawscripts.com'
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'password')
    MAIL_DEFAULT_SENDER = '"Rawscripts" <noreply@rawscripts.com>'
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 465
    MAIL_USE_SSL = True

class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///rawscripts.db'
    SERVER_NAME = 'localhost:5000'
    TESTING = True


class MigrationConfig(DevelopmentConfig):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///rawscripts-migration.db'
