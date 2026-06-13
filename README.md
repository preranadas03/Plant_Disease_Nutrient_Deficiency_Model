# Plant Disease and Nutrient Deficiency Detection System

## Project Description

Plant diseases and nutrient deficiencies significantly affect crop yield and quality. This project utilizes a **YOLOv8-based deep learning model** to identify plant diseases from cotton leaf images and map them to their corresponding nutrient deficiencies and fertilizer treatments.

The application is structured as a modern **React SPA (Single Page Application)** frontend built with **Vite**, backed by a robust **Flask JSON API** server that handles databases, user roles, simulated AI chatbot assistance, and direct agronomist consultation channels. A lightweight **Streamlit application** is also provided for quick leaf diagnostics.

---

## Features

- **YOLOv8 Leaf Diagnosis:** Real-time classification of cotton leaf conditions with confidence tracking.
- **Nutrient & Fertilizer Mapping:** Maps detected disease symptoms to matching nutrient stresses and recommended treatments.
- **Modern React Single Page Application (SPA):** A premium glassmorphic UI built with React, Vite, Bootstrap 5, and custom CSS Theme:
  - **Role-Based Access Control:** Separate registration/dashboards for **Farmers** (scan uploads, telemetry profiles, history) and **Agronomists** (review cases, issue official prescriptions).
  - **Expert Consultation Hub:** Instant chat system connecting farmers directly with extension agents and agricultural researchers.
  - **"Leafy" Context-Aware Chatbot:** Interactive assistant providing HTML-formatted soil suggestions, weather advisories, and historical analysis insights.
  - **Dynamic Chart.js Analytics:** Interactive dashboard graphing diagnostic patterns and classification statistics.
  - **Automated PDF Report Generation:** Instantly downloads formal PDF advisories with scanned images, confidence rates, standard prevention strategies, and custom expert opinions.
- **Streamlit Interface:** A fast, lightweight alternative for direct leaf uploads and single-image inference.
- **Secure Data Store:** Powered by an SQLite database for history logging and profile telemetry.

---

## Tech Stack

- **Backend API:** Flask (Python)
- **Frontend SPA:** React (JS), Vite, Bootstrap 5, Custom CSS Theme
- **Deep Learning Model:** YOLOv8 (Ultralytics)
- **Web Dashboards:** Streamlit (alternative interface)
- **Database Management:** SQLite
- **Visualization:** Chart.js, react-chartjs-2
- **Document Engine:** ReportLab (PDF generation)
- **Image Processing:** Pillow

---

## Project Structure

```
Plant_Disease_Nutrient_Deficiency_Model
│
├── server.py                  # Main Flask API Server & Asset Host
├── app.py                     # Main Streamlit application (preview mode)
├── nutrient_def_script.py     # Nutrient deficiency mapping logic
├── db.py                      # Database schema, helper functions, and demo seed data
├── requirements.txt           # Python dependencies
├── README.md                  # Project documentation
├── args.yaml                  # YOLOv8 hyperparameters
├── test_leaf.jpg              # Sample leaf image for testing
├── database.db                # SQLite database (auto-generated)
│
├── frontend/                  # React Frontend Source Directory
│     ├── package.json         # Node.js dependencies & scripts
│     ├── vite.config.js       # Vite build & proxy configurations
│     └── src/                 # React components & pages
│           ├── main.jsx       # Mount entry point
│           ├── App.jsx        # Routing structure & auth wrapper
│           ├── index.css      # Custom visual styling & variables
│           ├── components/    # Custom components (Sidebar, ChatbotWidget, Toast)
│           └── pages/         # Page modules (Dashboard, ConsultationHub, etc.)
│
├── static/                    # Backend static asset folder
│     └── dist/                # Production React build directory (Vite output)
│           ├── index.html     # React index root
│           └── assets/        # Compiled JS and CSS bundle files
│
└── weights/                   # YOLOv8 weight configurations
      ├── best.pt              # Best-trained YOLO model
      └── last.pt              # Last training checkpoint
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/preranadas03/Plant_Disease_Nutrient_Deficiency_Model.git
cd Plant_Disease_Nutrient_Deficiency_Model
```

### 2. Backend Environment & Setup

Create a virtual environment:

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

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 3. Frontend Setup & Build

Navigate to the `frontend/` directory and install JavaScript packages:

```bash
cd frontend
npm install --prefer-offline
```

Build the production React SPA assets. The production output will be generated inside `../static/dist/` where Flask hosts it:

```bash
npm run build
```

---

## Running the Application

### 1. Flask Web Application (Full Featured Portal)

To start the Flask backend API and serve the React Single Page Application:

```bash
# Return to root directory if in frontend
cd ..
python server.py
```

Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser.

> [!NOTE]
> The database automatically seeds with a demo account:
>
> - **Username:** `farmer1` | **Password:** `password` (Farmer View)
> - **Username:** `agronomist1` | **Password:** `password` (Agronomist View)

For local frontend development with Hot Module Replacement (HMR) and backend proxies:

```bash
cd frontend
npm run dev
```

Open the development URL shown in the terminal (usually `http://localhost:5173`).

### 2. Streamlit Interface (Simple Classifier)

To run the lightweight single-page Streamlit dashboard:

```bash
streamlit run app.py
```

Open **[http://localhost:8501](http://localhost:8501)** in your browser.

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
