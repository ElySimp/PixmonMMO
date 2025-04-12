from flask import Flask, render_template, request, redirect, session, url_for
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = 'pixmon_secret_key'
client = MongoClient(os.getenv("MONGO_URI"))
db = client["pixmon"]
users = db["users"]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user = users.find_one({"username": username, "password": password})
        if user:
            session["user"] = username
            return redirect("/home")
        else:
            return "Login failed."
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if users.find_one({"username": username}):
            return "Username already exists."
        users.insert_one({"username": username, "password": password})
        return redirect("/login")
    return render_template("register.html")

@app.route("/home")
def home():
    if "user" not in session:
        return redirect("/login")
    return render_template("home.html", username=session["user"])

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True)