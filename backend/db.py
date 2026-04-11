import sqlite3
import os
from datetime import datetime
import hashlib
import json

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.sqlite')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            gender TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Predictions table (we map the feature columns directly to maintain state)
    c.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            age REAL,
            academic_level TEXT,
            avg_daily_usage_hours REAL,
            most_used_platform TEXT,
            affects_academic_performance TEXT,
            sleep_hours_per_night REAL,
            mental_health_score REAL,
            relationship_status TEXT,
            conflicts_over_social_media REAL,
            raw_score REAL,
            percentage REAL,
            level TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_user(name, email, password, gender):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO users (name, email, password_hash, gender) VALUES (?, ?, ?, ?)",
            (name, email, hash_password(password), gender)
        )
        conn.commit()
        user_id = c.lastrowid
        return True, user_id
    except sqlite3.IntegrityError:
        return False, "Email already exists"
    finally:
        conn.close()

def authenticate_user(email, password):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, name, gender FROM users WHERE email = ? AND password_hash = ?", (email, hash_password(password)))
    user = c.fetchone()
    conn.close()
    if user:
        return True, dict(user)
    return False, "Invalid email or password"

def save_prediction(user_id, inputs, result):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO predictions (
            user_id, age, academic_level, avg_daily_usage_hours, most_used_platform,
            affects_academic_performance, sleep_hours_per_night, mental_health_score,
            relationship_status, conflicts_over_social_media,
            raw_score, percentage, level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        float(inputs['Age']),
        inputs['Academic_Level'],
        float(inputs['Avg_Daily_Usage_Hours']),
        inputs['Most_Used_Platform'],
        inputs['Affects_Academic_Performance'],
        float(inputs['Sleep_Hours_Per_Night']),
        float(inputs['Mental_Health_Score']),
        inputs['Relationship_Status'],
        float(inputs['Conflicts_Over_Social_Media']),
        result['raw_score'],
        result['percentage'],
        result['level']
    ))
    conn.commit()
    conn.close()

def get_user_history(user_id):
    conn = get_db_connection()
    c = conn.cursor()
    # Get last 10 predictions
    c.execute("SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", (user_id,))
    rows = c.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        d = dict(row)
        history.append({
            "id": d['id'],
            "date": d['created_at'],
            "inputs": {
                "Age": d['age'],
                "Academic_Level": d['academic_level'],
                "Avg_Daily_Usage_Hours": d['avg_daily_usage_hours'],
                "Most_Used_Platform": d['most_used_platform'],
                "Affects_Academic_Performance": d['affects_academic_performance'],
                "Sleep_Hours_Per_Night": d['sleep_hours_per_night'],
                "Mental_Health_Score": d['mental_health_score'],
                "Relationship_Status": d['relationship_status'],
                "Conflicts_Over_Social_Media": d['conflicts_over_social_media'],
            },
            "result": {
                "raw_score": d['raw_score'],
                "percentage": d['percentage'],
                "level": d['level']
            }
        })
    return history

def get_user(user_id):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, name, email, gender, created_at FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def update_user(user_id, name, gender):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE users SET name = ?, gender = ? WHERE id = ?", (name, gender, user_id))
    conn.commit()
    conn.close()
    return True
