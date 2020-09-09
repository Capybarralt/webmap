from datetime import datetime
from app import db, login
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from flask import request
from werkzeug.urls import url_parse

# Table of users
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))

    def __repr__(self):
        return '<User {}>'.format(self.username)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Table of classes. Not full. Need correcting
class Classifier(db.Model):
    """Stores classifier."""
    __tablename__ = 'classifier'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20))

# Tables of information fields for classes
class Field(db.Model):
    """Stores fields of a classifier_example."""
    __tablename__ = 'fields'

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classifier.id'))

    field_name = db.Column(db.String(100))
    field_type = db.Column(db.String(20))

    # Relationship
    classifier_example = db.relationship(
        'Classifier',
        backref=db.backref('fields', lazy='dynamic', collection_class=list)
    )

class Feature(db.Model):
    __tablename__ = 'features'

    id = db.Column(db.Integer, primary_key=True)
    geojson = db.Column(db.String(255))
    #geojson_2 = db.Column(db.String(255))
    name_class = db.Column(db.String(20))
    name = db.Column(db.String(20))

@login.user_loader
def load_user(id):
    return User.query.get(int(id))
