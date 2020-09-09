from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, SelectField, Form, IntegerField, FieldList, FormField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo
from app.models import User, Classifier

# List of types of information fields for the classifier
choices=[
    ('StringField', 'String'),
    ('IntegerField', 'Integer'),
    ('DateTimeField', 'Date Time')
]

# Form of authorization
class LoginForm(FlaskForm):
    username = StringField('Имя пользователя', validators=[DataRequired()])
    password = PasswordField('Пароль', validators=[DataRequired()])
    submit = SubmitField('Войти')

# Form of Registration
class RegistrationForm(FlaskForm):
    username = StringField('Имя пользователя', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Пароль', validators=[DataRequired()])
    password2 = PasswordField(
        'Повторите пароль', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Зарегестрировать')

    # checking user existence
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Имя уже занято')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Адресс уже используется')

# Not necessary, but still in use. Replace with automatically collected
class EditingForm(FlaskForm):
    new_coordinates = StringField('Новые координаты')
    old_coordinates = StringField('Старые координаты')
    types = Classifier.query.all()
    choices = []
    for example in types:
        choices.append((example.name, example.name))
    type = SelectField('Класс', choices=choices)
    name = StringField('Название', validators=[DataRequired()])
    submit = SubmitField('Сохранить')

# Used to automatically add fields
class FieldForm(Form):
    """Subform.
    CSRF is disabled for this subform (using `Form` as parent class) because
    it is never used by itself.
    """
    field_name = StringField('Навзание поля', validators=[DataRequired()])
    field_type = SelectField('Тип поля', choices=choices)

class MainForm(FlaskForm):
    """Parent form."""
    name = StringField('Название', validators=[DataRequired()])
    fields = FieldList(
        FormField(FieldForm),
        min_entries=0,
        max_entries=20
    )
