# Plant Disease and Nutrient Deficiency Detection System

## Project Description

Plant diseases and nutrient deficiencies significantly affect crop yield and quality. This project utilizes a **YOLOv8-based deep learning model** to identify plant diseases from cotton leaf images and map them to their corresponding nutrient deficiencies and fertilizer treatments.

The application has been expanded from a standalone classification script into a full-scale digital agricultural portal. It features a robust **Flask web application** (complete with databases, user roles, chatbot assistance, and expert consultation channels) alongside a lightweight **Streamlit application** for quick leaf diagnostics.

---

## Features

- **YOLOv8 Leaf Diagnosis:** Real-time classification of cotton leaf conditions with confidence tracking.
- **Nutrient & Fertilizer Mapping:** Maps detected disease symptoms to matching nutrient stresses and recommended treatments.
- **Flask Web Application:** Comprehensive multi-page portal utilizing:
  - **Role-Based Access Control:** Separate registration/dashboards for **Farmers** (scan uploads, telemetry profiles, history) and **Agronomists** (review cases, issue official prescriptions).
  - **Expert Consultation Hub:** Instant chat system connecting farmers directly with extension agents and agricultural researchers.
  - **"Leafy" Context-Aware Chatbot:** Interactive assistant providing tailored soil suggestions, weather advisories, and historical analysis insights.
  - **Dynamic Chart.js Analytics:** Interactive dashboard graphing diagnostic patterns and classification statistics.
  - **Automated PDF Report Generation:** Instantly downloads formal PDF advisories with scanned images, confidence rates, standard prevention strategies, and custom expert opinions.
- **Streamlit Interface:** A fast, lightweight alternative for direct leaf uploads and single-image inference.
- **Secure Data Store:** Powered by an SQLite database for history logging and profile telemetry.

---

## Tech Stack

- **Core Language:** Python
- **Deep Learning Model:** YOLOv8 (Ultralytics)
- **Web Frameworks:** Flask & Streamlit
- **Database Management:** SQLite
- **Frontend Components:** Bootstrap 5, HTML5, Vanilla CSS, Chart.js (Data Visualization)
- **Document Engine:** ReportLab (PDF generation)
- **Image Processing:** Pillow

---

## Project Structure

```
Plant_Disease_Nutrient_Deficiency_Model
│
├── server.py                  # Main Flask Web Portal server
├── app.py                     # Main Streamlit application (preview mode)
├── nutrient_def_script.py     # Nutrient deficiency mapping logic
├── db.py                      # Database schema, helper functions, and demo seed data
├── requirements.txt           # Package dependencies
├── README.md                  # Project documentation
├── args.yaml                  # YOLOv8 hyperparameters
├── test_leaf.jpg              # Sample leaf image for testing
├── database.db                # SQLite database (auto-generated)
│
├── static/                    # Frontend styling, assets, and uploads
│     ├── css/                 # Custom stylesheet (style.css)
│     ├── js/                  # Interactivity script (main.js)
│     └── uploads/             # Stores uploaded diagnostic images
│
├── templates/                 # HTML templates for the Flask application
│     ├── base.html            # Main base structure
│     ├── index.html           # Farmer dashboard & scan upload
│     ├── agronomist_dashboard.html # Agronomist list of farmers
│     ├── agronomist_farmer.html    # Detailed farmer inspection & recommendation tool
│     ├── consultation.html    # Direct chat portal
│     ├── profile.html         # Farm telemetry & bio editor
│     ├── login.html           # Authentication pages
│     └── register.html
│
├── training_visuals/          # Training graphs, confusion matrices, and metrics
│
└── weights/                   # YOLOv8 weight configurations
      ├── best.pt              # Best-trained YOLO model
      └── last.pt              # Last training checkpoint
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/preranadas03/Plant_Disease_Nutrient_Deficiency_Model.git
cd Plant_Disease_Nutrient_Deficiency_Model
```

### Create a virtual environment

```bash
python -m venv myenv
```

Activate the environment:

#### Windows (PowerShell / Command Prompt)

```powershell
myenv\Scripts\activate
```

#### Linux / Mac

```bash
source myenv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

---

## Running the Application

### 1. Flask Web Application (Full Featured Portal)

To run the primary web portal containing databases, user accounts, PDF reports, agronomist consultation, and the "Leafy" chatbot:

```bash
python server.py
```

Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser.

> [!NOTE]
> The database automatically seeds with a demo account:
>
> - **Username:** `farmer1` | **Password:** `password` (Farmer View)
> - **Username:** `agronomist1` | **Password:** `password` (Agronomist View)

### 2. Streamlit Interface (Simple Classifier)

To run the lightweight single-page Streamlit dashboard:

```bash
streamlit run app.py
```

Open **[http://localhost:8501](http://localhost:8501)** in your browser.

---

## 📷 Screenshots

### Home Page

Add screenshot here:

```
screenshots/image1.png
```

### Prediction Result

Add screenshot here:

```
screenshots/image5.png
```

---

## Deep Learning Model

Model Used:

- **YOLOv8 Classification (Ultralytics)**

Mapped Classes:

1. Bacterial Blight (Potassium Stress)
2. Curl Virus (Zinc Stress)
3. Healthy Leaf (No Deficiency)
4. Herbicide Growth Damage (Chemical Injury)
5. Leaf Hopper Jassids (Nitrogen Stress)
6. Leaf Redding (Phosphorus Stress)
7. Leaf Variegation (Magnesium Stress)

---

## Applications

- Smart farming & crop health monitoring
- Precision agricultural consulting
- Early crop disease diagnostic analysis
- Extension agent advisory tools
- Farm-level nutrient replenishment

---

## Future Scope

- Support multiple crop species and varieties.
- Deeper integration with hyper-local weather APIs.
- Native mobile application wrapper (Android & iOS).
- Cloud deployment using AWS, GCP, or Azure.
- Integration with IoT soil moisture & NPK sensors.
- Multi-language support to assist localized farming regions.

---

## Author

**Prerana Priyadarsini Das**

B.Tech Information Technology
Veer Surendra Sai University of Technology, Burla

GitHub: [github.com/preranadas03](https://github.com/preranadas03)

LinkedIn: [linkedin.com/in/preranapriyadarsinidas/](https://linkedin.com/in/preranapriyadarsinidas/)

---

## ⭐ If you found this project useful, consider giving it a star!
