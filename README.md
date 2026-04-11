# Student Social Media Addiction Predictor

This project evaluates and predicts the severity of social media addiction among students utilizing a custom Machine Learning pipeline (Lasso Regression). It has evolved from a basic data science project into a fully functional, localized full-stack web application powered by **Flask**, **SQLite**, and **Vanilla HTML/CSS/JS** with a stunning glassmorphism interface.

## 📁 Repository Structure

The entire codebase is structured strictly by discipline for maximum scalability:

- **/frontend** - All HTML, CSS, and JS assets used to construct the user interface.
- **/backend** - The core Flask architecture (`app.py`), defining the web server APIs, alongside `db.py` handling the SQLite database (`database.sqlite`).
- **/models** - Contains all ML artifacts including the saved Lasso pipeline (`addiction_model.pkl`), custom transformers (`utils.py`), and the core exploratory/training Jupyter Notebooks (`main.ipynb` & `main_pipeline.ipynb`).
- **/data** - Hosts the raw input datasets (`Students Social Media Addiction.csv`).
- **/figures** - The designated directory to store generated Data Science charts and statistical plots.
- **/reports** - Holds generated HTML profiling reports detailing dataset metadata.
- **requirements.txt** - Contains all essential python packages required to launch the environment.
- **start.py** - The unified launch script acting as the entry point for the whole application.
- **README.md** - You are here.

## 🚀 How to Run the Application

You do not need to boot separate frontend and backend environments. Our Flask server seamlessly interfaces with the backend database and statically serves the modern UI.

1. **Install Dependencies**
   Open your terminal and install the requirements (a dedicated Virtual Environment like conda is highly recommended):
   ```bash
   pip install -r requirements.txt
   ```

2. **Launch the Full-Stack Application**
   Run the master launch script from the root directory:
   ```bash
   python start.py
   ```

3. **Explore the Web App**
   Open your browser and navigate to:
   ```text
   http://127.0.0.1:5000/
   ```
   *Note: Because the application uses an isolated internal SQLite database to store user histories, you will need to click **Sign Up** to create an account on your first launch.*

## 🧠 Generating Insights

The application supports a "Model Insights" tab directly in the UI. For the data to populate, you must first execute the Data Science notebooks or relevant metric scripts to export `.png` plots directly into the `/figures` directory. Once populated, the web app will auto-render them.

## 🔐 Privacy & Security

All inputs, hashes, and behavioral calculations are handled **strictly locally**. At no point does the application ping external cloud servers. Your generated `database.sqlite` and behavioral histories belong securely to your local machine.
