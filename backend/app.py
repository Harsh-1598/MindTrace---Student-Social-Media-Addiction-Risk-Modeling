import os
import sys
import pandas as pd
import joblib
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sklearn import set_config
from sklearn import config_context

# Add models directory to path so it can import utils
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models'))
sys.path.insert(0, MODELS_DIR)

import db
from utils import IQRClipper

set_config(transform_output="pandas")

# Initialize database
db.init_db()

# Create Flask app that statically serves the frontend folder
FRONTEND_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='/')
CORS(app)  # Might not be strictly needed since we serve frontend, but safe to keep

# Define model path
MODEL_PATH = os.path.join(MODELS_DIR, "addiction_model.pkl")
model = None

try:
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Failed to load the model from {MODEL_PATH}: {e}")

# ================= SERVER STATIC FRONTEND =================

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_proxy(path):
    if os.path.exists(os.path.join(FRONTEND_FOLDER, path)):
        return app.send_static_file(path)
    return "Not Found", 404

# Serve figures seamlessly
@app.route('/figures/<path:filename>')
def serve_figures(filename):
    figures_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'figures'))
    return send_from_directory(figures_dir, filename)

# ================= API ENDPOINTS =================

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.json
    required = ['name', 'email', 'password', 'gender']
    if not all(k in data for k in required):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    success, result = db.create_user(data['name'], data['email'], data['password'], data['gender'])
    if success:
        return jsonify({"success": True, "token": result, "user": {"name": data['name']}})
    else:
        return jsonify({"success": False, "message": result}), 400

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.json
    success, result = db.authenticate_user(data.get('email'), data.get('password'))
    if success:
        return jsonify({"success": True, "token": result['id'], "user": {"name": result['name']}})
    else:
        return jsonify({"success": False, "message": result}), 401

@app.route('/api/user/<int:user_id>', methods=['GET', 'PUT'])
def api_user(user_id):
    if request.method == 'GET':
        user = db.get_user(user_id)
        if user:
            return jsonify({"success": True, "user": {"name": user['name'], "email": user['email'], "gender": user['gender']}})
        return jsonify({"success": False, "message": "User not found"}), 404
        
    elif request.method == 'PUT':
        data = request.json
        success = db.update_user(user_id, data.get('name'), data.get('gender'))
        if success:
            return jsonify({"success": True})
        return jsonify({"success": False, "message": "Failed to update"}), 500

@app.route('/api/history/<int:user_id>', methods=['GET'])
def api_get_history(user_id):
    history = db.get_user_history(user_id)
    return jsonify({"success": True, "history": history})

@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model failed to load on the server."}), 500

    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
            
        user = db.get_user(user_id)
        if not user:
            return jsonify({"error": "User not found in local database."}), 404

        # Expected fields minus Gender (we get gender from DB)
        expected_keys = [
            "Age", "Academic_Level", "Avg_Daily_Usage_Hours", 
            "Most_Used_Platform", "Affects_Academic_Performance", 
            "Sleep_Hours_Per_Night", "Mental_Health_Score", 
            "Relationship_Status", "Conflicts_Over_Social_Media"
        ]
        
        # Missing keys validation
        missing_keys = [key for key in expected_keys if key not in data]
        if missing_keys:
            return jsonify({"error": f"Missing expected inputs: {', '.join(missing_keys)}"}), 400

        # Construct dataframe inserting Gender from DB!
        new_student = pd.DataFrame([{
            "Age": float(data['Age']),
            "Gender": user['gender'],  # Automatically injected
            "Academic_Level": data['Academic_Level'],
            "Avg_Daily_Usage_Hours": float(data['Avg_Daily_Usage_Hours']),
            "Most_Used_Platform": data['Most_Used_Platform'],
            "Affects_Academic_Performance": data['Affects_Academic_Performance'],
            "Sleep_Hours_Per_Night": float(data['Sleep_Hours_Per_Night']),
            "Mental_Health_Score": float(data['Mental_Health_Score']),
            "Relationship_Status": data['Relationship_Status'],
            "Conflicts_Over_Social_Media": float(data['Conflicts_Over_Social_Media'])
        }])

        # Predict using thread-safe context
        with config_context(transform_output="pandas"):
            raw = model.predict(new_student)[0]
        
        raw_clipped = min(max(raw, 2.0), 9.0)
        percentage = (raw_clipped - 2) / 7 * 100
        percentage_clipped = min(max(percentage, 0.0), 100.0)

        if percentage_clipped < 40:
            level = "Healthy"
        elif percentage_clipped < 70:
            level = "Moderate"
        else:
            level = "High Risk"

        result = {
            "success": True,
            "raw_score": float(f"{raw_clipped:.2f}"),
            "percentage": float(f"{percentage_clipped:.2f}"),
            "level": level
        }
        
        # Save to SQLite asynchronously (or sync is fine here since it's local)
        db.save_prediction(user_id, data, result)

        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # use_reloader=False prevents restarting randomly. 
    # Threaded=True explicitly helps with concurrency.
    app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=False, threaded=True)
