from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String)
    email = db.Column(db.String, nullable=False)
    username = db.Column(db.String, nullable = False)
    password = db.Column(db.String, nullable=False)
    display_name = db.Column(db.String, nullable=False)
    messages = db.relationship("Message", lazy = True)


class Channel(db.Model):
    __tablename__ = "channels"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String)
    creation_date = db.Column(db.Date, nullable = False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id") ,nullable=False)
    url = db.Column(db.String, nullable=False)
    participants = db.relationship("User", backref="Channel", lazy=True)
    messages = db.relationship("Message", lazy = True)


class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message_text = db.Column(db.TEXT, nullable=False)
    channel_id = db.Column(db.Integer, db.ForeignKey("channels.id"), nullable=False)
    message_time = db.Column(db.TIMESTAMP, nullable = False)


class User_Channel(db.Model):
    __tablename__ = "user_channels"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    channel_id = db.Column(db.Integer, db.ForeignKey("channels.id"), nullable=False)

    channels = db.relationship("Channel", backref="User_Channel", lazy=True)