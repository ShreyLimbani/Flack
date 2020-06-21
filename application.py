import os
import datetime
from flask import Flask, render_template, session, request, url_for, redirect, jsonify
from flask_socketio import SocketIO, emit
import requests, json
from flask_session import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.sql import func

# Import table definitions.
from models import *

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Check for environment variable
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is not set")

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.secret_key='1q2w3e4r'

# Tell Flask what SQLAlchemy databas to use.
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

#This solves Javascript Cache Issues
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Link the Flask app with the database (no Flask app is actually being run yet).
db.init_app(app)


@app.route("/")
def index():
    return render_template('index.html')


@app.route("/login", methods=["POST"])
def login():

    #Check for credentials
    username = request.form.get('username')
    user = User.query.filter_by(username = username).first()
    if user is None:
        return jsonify({"success":False, "message": "Username or Password Incorrect"})

    else:
        if user.password == request.form.get('password'):
            user_dict = {}
            user_dict['username'] = user.username
            user_dict['id'] = user.id
            user_dict['display_name'] = user.display_name
            return jsonify({"success":True, "user": user_dict})
        else:
            return jsonify({"success":False, "message": "Username or Password Incorrect"})


@app.route("/logout", methods=["POST"])
def logout():
    session.pop("username",None)
    return jsonify({"success":True})


@app.route('/signup', methods=["POST"])
def signup():
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    display_name = request.form.get('display_name')

    try:
        user = User(first_name=first_name,last_name=last_name,username=username,email=email,password=password, display_name=display_name)
        db.session.add(user)
        db.session.commit()
        user = User.query.filter_by(username = username).first()
        print(user.id)
        print(user.display_name)
        return jsonify({"success":True, "user_id":user.id,"display_name":user.display_name})
    except:
        return jsonify({"success":False, "message": "Server Error Try Again Later."})


@app.route('/channel/new', methods=["POST"])
def new_channel():
    title = request.form.get('title')
    desc = request.form.get('desc')
    user_id = request.form.get('user_id')
    words = title.split()
    url = "-".join(words).lower()
    channel = Channel(title = title, description=desc, creation_date = datetime.date.today(), created_by = user_id, url = url)
    db.session.add(channel)
    db.session.commit()
    return jsonify({'success':True, 'url':url})


@app.route('/channel/join', methods=["POST"])
def join_channel():
    url = request.form.get('url')
    channel = Channel.query.filter_by(url=url).first()
    print(channel)
    channel_id = channel.id
    user_id = request.form.get('user_id')
    user_channel = User_Channel(user_id = user_id , channel_id = channel_id)
    db.session.add(user_channel)
    db.session.commit()
    print("done")
    return jsonify({'success':True, 'channel_id':channel_id})


@app.route('/channel')
def dashboard():
    return render_template('dashboard.html')

@app.route('/channel/<int:channel_id>')
def dashboard1(channel_id):
    return render_template('dashboard.html')

@socketio.on("send message")
def send(message_details):
    message_text = message_details["message-text"]
    channel_id = message_details["channel-id"]
    display_name = message_details["display-name"]
    user_id = message_details["user-id"]
    print("Send Message")
    try:
        new_message = Message(message_text=message_text, channel_id=channel_id, user_id=user_id,message_time=datetime.datetime.now())
        db.session.add(new_message)
        db.session.commit()
        this_message = db.session.query(Message.id).order_by(Message.id.desc()).limit(1)
        message = {"success":True,"message_text":message_text,"display_name":display_name,"channel_id":channel_id,"message_id":this_message[0].id}
    except:
        message = {"success":False}
    emit("receive message", message, broadcast=True)


@socketio.on("delete message")
def delete(message_details):
    message_id = message_details["id"]
    message = Message.query.get(message_id)
    print(message)
    return_message = {"id":message_id}
    db.session.delete(message)
    db.session.commit()
    emit("remove message",return_message,broadcast=True)


@app.route('/fetch-messages', methods=["POST"])
def fetch_messages():
    channel_id = request.form.get('channel_id')
    messages = db.session.query(Message.message_text,User.display_name
        ,func.to_char(Message.message_time, 'DD-MM-YYYY hh24:mi'), Message.id
        ).filter(Message.user_id == User.id, Message.channel_id == channel_id).order_by(Message.id).all()
    return jsonify(messages)
    

@app.route('/fetch-channels', methods=["POST"])
def fetch_channels():
    user_id = request.form.get('user_id')
    channels = db.session.query(Channel.id, Channel.title, Channel.description
                ).filter(Channel.id == User_Channel.channel_id,User_Channel.user_id == user_id).all()
    return jsonify(channels)

@app.route('/get-channels', methods=["POST"])
def get_channels():
    channels = db.session.query(Channel.title).all()
    return jsonify(channels)
