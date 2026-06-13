import os
import uuid
from functools import wraps
from flask import Flask, request, jsonify, send_file, url_for, session, redirect, send_from_directory
from ultralytics import YOLO
from PIL import Image
import db

# Create flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'super-secret-leafsentry-key')
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Database
db.init_db()

# Load YOLO model
MODEL_PATH = "weights/best.pt"
if os.path.exists(MODEL_PATH):
    model = YOLO(MODEL_PATH)
else:
    model = None
    print(f"WARNING: Weights file not found at {MODEL_PATH}. Prediction features will be simulated or fail.")

# Mappings & Details
mapping = {
    "Bacterial Blight": "Possible Potassium Deficiency",
    "Curl Virus": "Possible Zinc Deficiency",
    "Healthy Leaf": "No Deficiency",
    "Herbicide Growth Damage": "Nutrient Not Applicable (Chemical Injury)",
    "Leaf Hopper Jassids": "Possible Nitrogen Stress",
    "Leaf Redding": "Possible Phosphorus Deficiency",
    "Leaf Variegation": "Possible Magnesium Deficiency"
}

fertilizer = {
    "Bacterial Blight": "Apply Potassium-rich fertilizer (e.g., Muriate of Potash)",
    "Curl Virus": "Apply Zinc micronutrient spray (e.g., Zinc Sulfate)",
    "Healthy Leaf": "No fertilizer needed. Maintain standard irrigation.",
    "Herbicide Growth Damage": "Monitor chemical exposure, provide optimal irrigation and wait for recovery.",
    "Leaf Hopper Jassids": "Apply Nitrogen supplement or urea, and check for pest control measures.",
    "Leaf Redding": "Apply Phosphorus-rich fertilizer (e.g., Single Super Phosphate)",
    "Leaf Variegation": "Apply Magnesium supplement (e.g., Epsom salt foliar spray)"
}

prevention = {
    "Bacterial Blight": "Use disease-free seeds, practice crop rotation, remove infected crop debris, and avoid overhead irrigation.",
    "Curl Virus": "Control whitefly vectors using yellow sticky traps or neem oil, grow resistant cultivars, and eliminate weed hosts.",
    "Healthy Leaf": "Maintain standard soil health checks, inspect leaves regularly, and ensure balanced micronutrient fertilization.",
    "Herbicide Growth Damage": "Avoid herbicide drift from neighboring fields, use drift-reducing nozzles, and wash spraying tanks thoroughly.",
    "Leaf Hopper Jassids": "Conserve natural predators like ladybird beetles, use neem-based formulations, and avoid excess nitrogenous fertilizers.",
    "Leaf Redding": "Ensure adequate soil drainage, maintain correct soil moisture, and check soil pH levels for optimal nutrient uptake.",
    "Leaf Variegation": "Perform routine soil tests, ensure proper soil aeration, and apply organic compost to improve soil structures."
}

def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                if request.path.startswith('/api/') or request.path == '/analyze' or request.path == '/chatbot':
                    return jsonify({'error': 'Unauthorized'}), 401
                return redirect('/')
            if role and session.get('role') != role:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Forbidden'}), 403
                return redirect('/')
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Context processor to expose logged-in user profile details to all base templates
@app.context_processor
def inject_user():
    user = None
    if 'user_id' in session:
        user = db.get_user_profile(session['user_id'])
    return dict(current_user=user)

# --- REACT API ENDPOINTS ---

@app.route('/api/session-check', methods=['GET'])
def api_session_check():
    if 'user_id' in session:
        user_profile = db.get_user_profile(session['user_id'])
        if user_profile:
            return jsonify({'logged_in': True, 'user': user_profile})
    return jsonify({'logged_in': False})

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Missing username or password.'}), 400
        
    user = db.authenticate_user(username, password)
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        session['full_name'] = user['full_name']
        user_profile = db.get_user_profile(user['id'])
        return jsonify({'status': 'success', 'user': user_profile})
    else:
        return jsonify({'error': 'Invalid username or password.'}), 401

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    full_name = data.get('full_name')
    phone = data.get('phone')
    location = data.get('location')
    
    if not username or not password or not role or not full_name:
        return jsonify({'error': 'Missing required registration fields.'}), 400
        
    profile_data = {}
    if role == 'farmer':
        profile_data['farm_name'] = data.get('farm_name', 'Green Fields')
        profile_data['farm_size'] = data.get('farm_size', 10.0)
        profile_data['soil_type'] = data.get('soil_type', 'Loamy')
        profile_data['primary_crop'] = data.get('primary_crop', 'Cotton')
        profile_data['irrigation_type'] = data.get('irrigation_type', 'Drip')
    elif role == 'agronomist':
        profile_data['specialization'] = data.get('specialization', 'Crop Pathology')
        profile_data['experience_years'] = data.get('experience_years', 5)
        profile_data['license_number'] = data.get('license_number', 'AG-00000')
        
    user_id = db.register_user(
        username=username,
        password=password,
        role=role,
        full_name=full_name,
        phone=phone,
        location=location,
        profile_data=profile_data
    )
    
    if user_id:
        session['user_id'] = user_id
        session['username'] = username
        session['role'] = role
        session['full_name'] = full_name
        user_profile = db.get_user_profile(user_id)
        return jsonify({'status': 'success', 'user': user_profile})
    else:
        return jsonify({'error': 'Username already exists. Please choose another one.'}), 400

@app.route('/api/logout', methods=['POST', 'GET'])
def api_logout():
    session.clear()
    return jsonify({'status': 'success'})

@app.route('/api/profile', methods=['POST'])
@login_required()
def api_profile():
    user_id = session['user_id']
    role = session['role']
    data = request.json or {}
    
    full_name = data.get('full_name')
    phone = data.get('phone')
    location = data.get('location')
    
    if not full_name:
        return jsonify({'error': 'Full name is required.'}), 400
        
    if role == 'farmer':
        farm_name = data.get('farm_name')
        farm_size = data.get('farm_size')
        soil_type = data.get('soil_type')
        primary_crop = data.get('primary_crop')
        irrigation_type = data.get('irrigation_type')
        
        db.update_farmer_profile(user_id, full_name, phone, location, farm_name, farm_size, soil_type, primary_crop, irrigation_type)
    elif role == 'agronomist':
        specialization = data.get('specialization')
        experience_years = data.get('experience_years')
        license_number = data.get('license_number')
        
        db.update_agronomist_profile(user_id, full_name, phone, location, specialization, experience_years, license_number)
        
    user_profile = db.get_user_profile(user_id)
    return jsonify({'status': 'success', 'user': user_profile})

@app.route('/api/agronomist/dashboard', methods=['GET'])
@login_required('agronomist')
def api_agronomist_dashboard():
    farmers = db.get_farmers()
    total_farmers = len(farmers)
    all_diagnoses = db.get_history()
    unreviewed_diagnoses = sum(1 for d in all_diagnoses if not db.get_recommendation_by_analysis(d['id']))
    
    return jsonify({
        'farmers': farmers,
        'total_farmers': total_farmers,
        'unreviewed_diagnoses': unreviewed_diagnoses
    })

@app.route('/api/agronomist/farmer/<int:farmer_id>', methods=['GET'])
@login_required('agronomist')
def api_agronomist_farmer(farmer_id):
    farmer = db.get_user_profile(farmer_id)
    if not farmer or farmer.get('role') != 'farmer':
        return jsonify({'error': 'Farmer not found.'}), 404
        
    history = db.get_history(farmer_id)
    messages = db.get_messages(farmer_id, session['user_id'])
    
    return jsonify({
        'farmer': farmer,
        'history': history,
        'messages': messages
    })

@app.route('/api/consultation', methods=['GET'])
@login_required('farmer')
def api_consultation():
    agronomists = db.get_agronomists()
    assigned_agronomist_id = request.args.get('agronomist_id')
    
    if not assigned_agronomist_id and agronomists:
        assigned_agronomist_id = agronomists[0]['id']
        
    agronomist = None
    messages = []
    history = []
    if assigned_agronomist_id:
        agronomist = db.get_user_profile(int(assigned_agronomist_id))
        messages = db.get_messages(session['user_id'], int(assigned_agronomist_id))
        history = db.get_history(session['user_id'])
        
    return jsonify({
        'agronomists': agronomists,
        'agronomist': agronomist,
        'messages': messages,
        'history': history
    })

# --- REACT SPA ROUTING INTEGRATION ---

@app.route('/api/stats')
@login_required()
def get_stats():
    user_id = session['user_id'] if session['role'] == 'farmer' else None
    disease_counts = db.get_disease_counts(user_id)
    recent_confidence = db.get_recent_confidence(user_id)
    return jsonify({
        'disease_counts': disease_counts,
        'recent_confidence': recent_confidence
    })

@app.route('/api/history')
@login_required()
def api_history():
    user_id = session['user_id'] if session['role'] == 'farmer' else None
    history = db.get_history(user_id)
    return jsonify({'history': history})

@app.route('/analyze', methods=['POST'])
@login_required('farmer')
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Save image with unique filename
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(filepath)

    if model:
        # Run YOLO inference
        results = model(filepath)
        pred_class = results[0].names[results[0].probs.top1]
        confidence = float(results[0].probs.top1conf) * 100
    else:
        # Fallback simulated logic if model is not loaded
        pred_class = "Healthy Leaf"
        confidence = 95.0

    # Get details
    nutrient_val = mapping.get(pred_class, "Unknown")
    fertilizer_val = fertilizer.get(pred_class, "Unknown")
    prevention_val = prevention.get(pred_class, "No specific recommendations.")

    # Save to SQLite db linked to current farmer
    log_id = db.log_analysis(unique_filename, pred_class, round(confidence, 2), nutrient_val, fertilizer_val, session['user_id'])

    return jsonify({
        'id': log_id,
        'image_url': url_for('static', filename=f'uploads/{unique_filename}'),
        'prediction': pred_class,
        'confidence': round(confidence, 2),
        'nutrient': nutrient_val,
        'fertilizer': fertilizer_val,
        'prevention': prevention_val
    })

# --- AGRONOMIST PORTAL ROUTES ---

@app.route('/api/recommendation', methods=['POST'])
@login_required('agronomist')
def save_recommendation():
    data = request.json or {}
    analysis_id = data.get('analysis_id')
    recommendation_text = data.get('recommendation_text', '').strip()
    
    if not analysis_id or not recommendation_text:
        return jsonify({'error': 'Missing analysis ID or recommendation text.'}), 400
        
    success = db.add_recommendation(analysis_id, session['user_id'], recommendation_text)
    if success:
        return jsonify({'status': 'success', 'message': 'Expert recommendation saved.'})
    return jsonify({'error': 'Failed to save recommendation.'}), 500

# --- CHAT & CONSULTATION ROUTES ---

@app.route('/api/messages', methods=['GET', 'POST'])
@login_required()
def handle_messages():
    if request.method == 'POST':
        data = request.json or {}
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'error': 'Message text is empty'}), 400
            
        if session['role'] == 'farmer':
            sender_role = data.get('sender_role', 'farmer')
            agronomist_id = data.get('agronomist_id')
            if not agronomist_id:
                return jsonify({'error': 'No agronomist specified'}), 400
            db.send_message(session['user_id'], int(agronomist_id), message, sender_role)
        else:
            farmer_id = data.get('farmer_id')
            if not farmer_id:
                return jsonify({'error': 'No farmer specified'}), 400
            db.send_message(int(farmer_id), session['user_id'], message, 'agronomist')
            
        return jsonify({'status': 'success'})
        
    else:
        # GET messages
        if session['role'] == 'farmer':
            agronomist_id = request.args.get('agronomist_id')
            if not agronomist_id:
                return jsonify({'error': 'No agronomist specified'}), 400
            messages = db.get_messages(session['user_id'], int(agronomist_id))
        else:
            farmer_id = request.args.get('farmer_id')
            if not farmer_id:
                return jsonify({'error': 'No farmer specified'}), 400
            messages = db.get_messages(int(farmer_id), session['user_id'])
            
        return jsonify({'messages': messages})

# --- UPGRADED CHATBOT ROUTE ---
@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json or {}
    message = data.get('message', '').strip().lower()
    
    # 1. Fetch logged-in user profile & history context
    user_context = ""
    farmer_profile = None
    recent_diagnoses = []
    
    if 'user_id' in session and session.get('role') == 'farmer':
        farmer_profile = db.get_user_profile(session['user_id'])
        recent_diagnoses = db.get_history(session['user_id'])

    # 2. State-aware / Context-aware responses
    response = None
    
    # Keyword analysis
    if 'hello' in message or 'hi' in message or 'greetings' in message or 'hey' in message:
        name = farmer_profile['full_name'] if farmer_profile else "Guest Farmer"
        response = f"Hello {name}! I am Leafy, your cotton health assistant. "
        if farmer_profile:
            response += f"I see you manage **{farmer_profile['farm_name']}** with {farmer_profile['soil_type']} soil. "
            if recent_diagnoses:
                last_diag = recent_diagnoses[0]
                response += f"Your last leaf diagnosis detected **{last_diag['prediction']}** ({last_diag['confidence']}% confidence). "
                response += "How can I help you support your crops today?"
            else:
                response += "You haven't uploaded any leaf scans yet. Would you like assistance on running your first YOLOv8 diagnosis?"
        else:
            response += "How can I help you today? You can ask me about cotton leaf diseases, nutrient deficiencies, or soil maintenance."

    elif 'profile' in message or 'my farm' in message or 'my soil' in message:
        if farmer_profile:
            response = (
                f"### 🌾 Your Farm Profile Telemetry\n\n"
                f"- **Farmer Name**: {farmer_profile['full_name']}\n"
                f"- **Farm Name**: {farmer_profile['farm_name']}\n"
                f"- **Size**: {farmer_profile['farm_size']} Acres\n"
                f"- **Soil Matrix**: {farmer_profile['soil_type']} Soil\n"
                f"- **Irrigation System**: {farmer_profile['irrigation_type']}\n\n"
                f"Since you are farming on **{farmer_profile['soil_type']}** soil using **{farmer_profile['irrigation_type']}**, "
                f"it's important to monitor drainage. High clay content can retain water, making crops prone to waterlogging which triggers *Leaf Redding* (Phosphorus stress). "
                f"Sandy soils drain fast, necessitating potassium replenishment to prevent *Bacterial Blight*."
            )
        else:
            response = "You are currently chatting as a Guest. Please register or log in to customize recommendations based on your farm telemetry."

    elif 'last diagnosis' in message or 'recent' in message or 'my last scan' in message:
        if recent_diagnoses:
            last_diag = recent_diagnoses[0]
            rec = db.get_recommendation_by_analysis(last_diag['id'])
            
            response = (
                f"### 🔍 Analysis Report: Sample #{last_diag['id']}\n\n"
                f"- **Condition Detected**: **{last_diag['prediction']}**\n"
                f"- **AI Confidence Score**: {last_diag['confidence']}%\n"
                f"- **Nutrient Status**: {last_diag['nutrient']}\n"
                f"- **Standard Treatment**: {last_diag['fertilizer']}\n\n"
            )
            if rec:
                response += (
                    f"🟢 **Verified Expert Recommendation from {rec['agronomist_name']}**:\n"
                    f"> *\"{rec['recommendation_text']}\"* (Issued: {rec['timestamp']})"
                )
            else:
                response += "⚠️ *Note: No agronomist has reviewed this diagnosis yet. You can contact an expert via the Consultation panel.*"
        else:
            response = "I couldn't find any historical diagnostics logged on your account. Upload a leaf scan on the Dashboard to get started!"

    elif 'weather' in message or 'temperature' in message or 'rain' in message:
        if farmer_profile:
            response = (
                f"### 🌤️ Telemetry Weather Advisory: {farmer_profile['location']}\n\n"
                f"- **Current Temp**: 29°C\n"
                f"- **Conditions**: Scattered Clouds\n"
                f"- **Relative Humidity**: 62%\n\n"
                f"💡 **Agronomy Tip**: The current humidity levels are **optimal (62%)** for applying foliar sprays (like Zinc Sulfate or Epsom salts). "
                f"Make sure to apply treatments early in the morning or late evening to prevent leaf scorching. Do not spray if rainfall is forecasted within 4 hours."
            )
        else:
            response = "Current standard farm temperature is 29°C with optimal spray humidity (62%). Soil moisture is stable."

    elif 'blight' in message or 'bacterial' in message:
        response = (
            "### 🦠 Bacterial Blight (Potassium Stress)\n\n"
            "Bacterial Blight causes angular, water-soaked spots on cotton leaves that eventually turn dark brown or black. "
            "It is closely linked to **Potassium (K) deficiency**, which weakens the plant's cell walls.\n\n"
            "**Treatment Plan**:\n"
            "1. Apply Potassium-rich fertilizer (e.g., Muriate of Potash) immediately.\n"
            "2. Avoid overhead sprinkler irrigation as splashing water spreads the bacteria.\n"
            "3. Clean all agricultural implements to prevent cross-contamination between fields."
        )

    elif 'curl' in message or 'virus' in message:
        response = (
            "### 🌀 Cotton Leaf Curl Virus (Zinc Stress)\n\n"
            "Leaf Curl Virus leads to leaves twisting upward/downward and thickening of leaf veins. "
            "It is highly correlated with **Zinc deficiency** and transmitted by Whiteflies.\n\n"
            "**Immediate Action**:\n"
            "- Spray foliar Zinc Sulfate (0.5% solution) mixed with lime.\n"
            "- Monitor and control Whitefly vectors using yellow sticky traps or organic neem oil sprays.\n"
            "- Eradicate alternate weed hosts in adjacent field boundaries."
        )

    elif 'redding' in message or 'red leaf' in message:
        response = (
            "### 🍁 Leaf Redding (Phosphorus Stress)\n\n"
            "Leaf margins turning purplish-red while main veins remain green indicate **Phosphorus deficiency** "
            "or structural stress from cold, waterlogged soils.\n\n"
            "**Correction Measures**:\n"
            "- Apply Single Super Phosphate (SSP) or Diammonium Phosphate (DAP).\n"
            "- Ensure deep soil drainage to avoid water accumulation, which blocks phosphorus uptake.\n"
            "- Check soil pH; highly acidic or highly alkaline soils bind phosphorus."
        )

    elif 'variegation' in message or 'yellowing' in message:
        response = (
            "### 🍂 Leaf Variegation (Magnesium Stress)\n\n"
            "Yellowing or chlorosis between green leaf veins signifies **Magnesium deficiency**.\n\n"
            "**Resolution**:\n"
            "- Foliar spray with Epsom salt (Magnesium Sulfate) at 1% concentration.\n"
            "- Incorporate dolomite limestone in soil if pH is low.\n"
            "- Maintain balanced potassium fertilization, as excessive potassium inhibits magnesium absorption."
        )

    elif 'agronomist' in message or 'consult' in message or 'doctor' in message or 'help' in message:
        response = (
            "👩‍🌾 **Consultation Assistance**\n\n"
            "Would you like to speak directly with our certified crop expert? "
            "You can head to the **Consultation Hub** in the sidebar to review the profile of our active agronomists (like **Dr. Sarah Jenkins**), "
            "exchange direct messages, and get personalized recommendations for your leaf diagnostics."
        )

    elif 'soil' in message:
        soil = farmer_profile['soil_type'] if farmer_profile else 'Loamy'
        response = (
            f"### 🧪 Soil Health Management: {soil} Soil\n\n"
            f"Your farm profile specifies **{soil}** soil. Cotton flourishes in deep, well-aerated soils with pH between 6.0 and 8.0.\n\n"
            f"- **Water Management**: If your soil is clay-heavy, monitor drainage. Sandy soils require split fertilizer applications to avoid leaching.\n"
            f"- **Macro Elements**: Conduct soil chemistry tests once every crop cycle to balance Nitrogen, Phosphorus, and Potassium ratios."
        )

    # General agriculture checks
    if not response:
        agri_terms = ['plant', 'cotton', 'leaf', 'crop', 'agriculture', 'farm', 'grow', 'water', 'drainage', 'fertilizer', 'urea', 'potash']
        if any(term in message for term in agri_terms):
            response = (
                "That sounds like a general agricultural query. To assist you best, could you specify a leaf symptom "
                "or ask me about standard actions? Alternatively, click one of the quick options below!"
            )
        else:
            response = (
                "I'm Leafy, your cotton health assistant! I couldn't quite match that topic. "
                "You can ask me about: \n"
                "- 'My farm profile' or 'soil status'\n"
                "- 'My last diagnosis' details\n"
                "- Symptoms and treatments of 'Bacterial Blight', 'Leaf Redding', 'Curl Virus', or 'Leaf Variegation'\n"
                "- Or type 'agronomist' to learn how to contact an expert."
            )

    return jsonify({'response': response})

@app.route('/api/clear-history', methods=['POST'])
@login_required()
def clear_history():
    db.clear_history()
    return jsonify({'status': 'success', 'message': 'History cleared successfully.'})

@app.route('/download-report/<int:analysis_id>')
@login_required()
def download_report(analysis_id):
    analysis = db.get_analysis_by_id(analysis_id)
    if not analysis:
        return "Analysis not found", 404

    # Authorization check: Farmers can only download their own reports
    if session['role'] == 'farmer' and analysis['user_id'] != session['user_id']:
        return "Unauthorized access to report", 403

    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    pdf_filename = f"report_{analysis_id}.pdf"
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename)

    # Create document
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    styles = getSampleStyleSheet()

    # Define custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#2E7D32'),
        spaceAfter=15
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=25
    )
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1B5E20'),
        spaceBefore=15,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['BodyText'],
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#333333')
    )
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor('#1B5E20')
    )
    meta_value_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#333333')
    )

    # Document Title
    story.append(Paragraph("Leaf Analysis & Diagnosis Report", title_style))
    
    # Retrieve user information if present
    farmer_name = "Guest"
    farmer_info = ""
    if analysis['user_id']:
        farmer = db.get_user_profile(analysis['user_id'])
        if farmer:
            farmer_name = farmer['full_name']
            farmer_info = f"  |  Farmer: {farmer_name} ({farmer['farm_name']})"
            
    story.append(Paragraph(f"Generated on: {analysis['timestamp']}{farmer_info}  |  Record ID: #{analysis['id']}", subtitle_style))

    # Add leaf image if available
    img_filepath = os.path.join('static', 'uploads', analysis['filename'])
    if os.path.exists(img_filepath):
        try:
            # Resize image dynamically to fit well in the PDF
            img = Image.open(img_filepath)
            w, h = img.size
            aspect = h / w
            pdf_w = 200
            pdf_h = 200 * aspect
            story.append(Paragraph("Analyzed Leaf Sample", section_title_style))
            story.append(RLImage(img_filepath, width=pdf_w, height=pdf_h))
            story.append(Spacer(1, 15))
        except Exception as e:
            print("Error adding image to PDF:", e)

    # Results Table
    story.append(Paragraph("Diagnosis Overview", section_title_style))
    
    prev_text = prevention.get(analysis['prediction'], "No specific recommendations.")
    
    # Check if agronomist has recommendations
    rec = db.get_recommendation_by_analysis(analysis_id)
    rec_text = "No agronomist advice yet."
    if rec:
        rec_text = f"Expert Recommendation from {rec['agronomist_name']}: {rec['recommendation_text']}"

    data = [
        [Paragraph("Detected Condition", meta_label_style), Paragraph(analysis['prediction'], meta_value_style)],
        [Paragraph("Confidence Score", meta_label_style), Paragraph(f"{analysis['confidence']}%", meta_value_style)],
        [Paragraph("Nutrient Status", meta_label_style), Paragraph(analysis['nutrient'], meta_value_style)],
        [Paragraph("Actionable Treatment", meta_label_style), Paragraph(analysis['fertilizer'], meta_value_style)],
        [Paragraph("Prevention Strategy", meta_label_style), Paragraph(prev_text, meta_value_style)],
        [Paragraph("Agronomist Feedback", meta_label_style), Paragraph(rec_text, meta_value_style)]
    ]

    t = Table(data, colWidths=[150, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F4F6F4')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ('LINEBELOW', (0,-1), (-1,-1), 1.5, colors.HexColor('#2E7D32')),
    ]))
    story.append(t)
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("Disclaimer: This diagnosis is generated by an automated artificial intelligence model. Please cross-verify with local agronomists or laboratory testing for high-value agricultural decisions.", ParagraphStyle('Disclaimer', parent=styles['Italic'], fontSize=8.5, textColor=colors.HexColor('#777777'))))

    # Build PDF
    doc.build(story)

    return send_file(pdf_path, as_attachment=True, download_name=f"leaf_report_{analysis_id}.pdf")

# Catch-all route to serve React Single Page Application (SPA)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Avoid hijacking API and system routes
    if path.startswith('api/') or path == 'analyze' or path == 'chatbot' or path.startswith('download-report') or path.startswith('static/'):
        return "Not Found", 404
    try:
        return send_from_directory(os.path.join('static', 'dist'), 'index.html')
    except Exception:
        return "React app has not been compiled yet. Please run 'npm run build' inside the 'frontend/' folder."

if __name__ == '__main__':
    # Start the server on port 5000
    app.run(debug=True, port=5000)

