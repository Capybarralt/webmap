# -*- coding: utf-8 -*-
from flask import render_template, flash, redirect, url_for, request, jsonify
from app import app, db
from app.forms import LoginForm, RegistrationForm, EditingForm, MainForm, choices
from flask_login import current_user, login_user, logout_user, login_required
from app.models import User, Classifier, Field, Feature
from werkzeug.urls import url_parse
from wtforms import StringField
import json

# Main page: map and form for redacting features
@app.route('/')
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    form = EditingForm()
    d = []
    l = []
    for feature in Feature.query.all():
        if feature.geojson:
            s = json.loads(feature.geojson[40:len(feature.geojson)-2])

            print(type(s))
            s['properties'] = {}
            s['properties']['class'] = feature.name_class
            s['properties']['name'] = feature.name
            print(type(s['properties']))
            print(s)

            #if s['geometry']['type']=='Point':
            l.append(s['id'])
            s = json.dumps(s)
            d.append(json.loads(s) )
    #l = json.dumps(l)

    dd = json.dumps(d)
    #print(dd)


    if form.validate_on_submit():
        feature = Feature(
            geojson=form.new_coordinates.data,
            #geojson_2=form.new_coordinates.data,
            name_class=form.type.data,
            name=form.name.data,
        )
        db.session.add(feature)
        db.session.commit()
    return render_template("index.html", title='Home Page', form = form, d=dd, list=l)

# Page of authorization. If the user is not logged in to the whole theme,
# then he automatically goes here
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('login.html', title='Sign In', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

# Page of Registration
@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)

# Page of classifier. At the moment, you can create a new class, view the fields
# of an existing class and get to the editing page of the selected class
@app.route('/classification', methods=['GET', 'POST'])
def classification():
    form = MainForm()
    if form.validate_on_submit():
        new_class = Classifier(name=form.name.data)
        db.session.add(new_class)
        for field in form.fields.data:
            new_field = Field(**field)
            new_class.fields.append(new_field)
        db.session.commit()
    classifier = Classifier.query
    return render_template(
        'classifier.html',
        form=form,
        classifier=classifier,
        choices=choices,
    )

# Class edit page. We need to think about how to optimize editing.
@app.route('/<class_id>', methods=['GET', 'POST'])
def show_class(class_id):
    """Show the details of a classifier_example."""
    classifier_example = Classifier.query.filter_by(id=class_id).first()
    form = MainForm()
    d = {}
    i = 0
    for field in classifier_example.fields:
        d[i] = [field.field_type, field.field_name]
        i += 1
    dd = json.dumps(d)
    if form.validate_on_submit():
        classifier_example.name = form.name.data
        for field in classifier_example.fields:
            db.session.delete(field)
        for field in form.fields.data:
            new_field = Field(**field)
            classifier_example.fields.append(new_field)
        db.session.commit()
    return render_template(
        'show.html',
        classifier_example=classifier_example,
        choices=choices,
        form=form,
        d=dd,
        len=len(d),
    )
