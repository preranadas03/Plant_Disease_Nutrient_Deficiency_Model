# Plant Disease and Nutrient Deficiency Detection System

## Project Description

Plant diseases and nutrient deficiencies significantly affect crop yield and quality. This project uses a **YOLO-based deep learning model** to identify plant diseases from leaf images and estimate the corresponding nutrient deficiencies.

The application provides an easy-to-use interface built with **Streamlit**, enabling farmers, researchers, and agricultural professionals to upload leaf images and obtain disease predictions along with possible nutrient stress information.

---

## Features

* Disease detection using a trained YOLO model.
* Nutrient deficiency prediction based on disease symptoms.
* Interactive web interface using Streamlit.
* Image upload and real-time prediction.
* Fast and lightweight model.
* Suitable for precision agriculture applications.
* Easy deployment and extension.

---

## Tech Stack

* **Python**
* **YOLO (Ultralytics)**
* **Streamlit**
* **Pillow**
* **SQLite**
* **HTML**
* **CSS**

---

## Project Structure

```
Plant_Disease_Nutrient_Deficiency_Model
│
├── app.py                     # Main Streamlit application
├── nutrient_def_script.py     # Nutrient deficiency mapping
├── db.py                      # Database operations
├── server.py
├── requirements.txt
├── README.md
├── args.yaml
├── test_leaf.jpg
│
├── static/                    # CSS, images and assets
├── templates/                 # HTML templates
├── training_visuals/          # Training graphs and confusion matrices
│
├── weights/
│     ├── best.pt             # Trained YOLO model
│     └── last.pt
│
└── database.db
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/Plant_Disease_Nutrient_Deficiency_Model.git
cd Plant_Disease_Nutrient_Deficiency_Model
```

### Create a virtual environment

```bash
python -m venv myenv
```

Activate the environment:

#### Windows

```bash
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

### Run the application

```bash
streamlit run app.py
```

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

## Applications

* Smart farming
* Precision agriculture
* Crop monitoring
* Early disease diagnosis
* Agricultural advisory systems

---

## Future Scope

* Support multiple crop species.
* Add treatment and fertilizer recommendations.
* Integrate weather and soil information.
* Mobile application development.
* Cloud deployment using AWS or Azure.
* Explainable AI for prediction interpretation.
* Multi-language support for farmers.
* Integration with IoT sensors.

---

## Deep Learning Model

Model Used:

* **YOLO (Ultralytics)**

Output:

1. Plant Disease Classification
2. Nutrient Deficiency Identification

---

## Author

**Prerana Priyadarsini Das**

B.Tech Information Technology
Veer Surendra Sai University of Technology, Burla

GitHub: https://github.com/preranadas03

LinkedIn: https://linkedin.com/in/preranapriyadarsinidas/

---

## ⭐ If you found this project useful, consider giving it a star!
