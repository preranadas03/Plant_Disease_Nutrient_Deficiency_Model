import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create analyses table if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            prediction TEXT NOT NULL,
            confidence REAL NOT NULL,
            nutrient TEXT NOT NULL,
            fertilizer TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER
        )
    ''')
    
    # Try adding user_id to analyses for backward compatibility
    try:
        cursor.execute('ALTER TABLE analyses ADD COLUMN user_id INTEGER')
    except sqlite3.OperationalError:
        # Column already exists
        pass

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL, -- 'farmer' or 'agronomist'
            full_name TEXT NOT NULL,
            phone TEXT,
            location TEXT,
            avatar_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create farmer profiles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farmer_profiles (
            user_id INTEGER PRIMARY KEY,
            farm_name TEXT,
            farm_size REAL,
            soil_type TEXT,
            primary_crop TEXT,
            irrigation_type TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Create agronomist profiles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agronomist_profiles (
            user_id INTEGER PRIMARY KEY,
            specialization TEXT,
            experience_years INTEGER,
            license_number TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER NOT NULL,
            agronomist_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            sender_role TEXT NOT NULL, -- 'farmer' or 'agronomist'
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (agronomist_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Create recommendations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id INTEGER NOT NULL UNIQUE,
            agronomist_id INTEGER NOT NULL,
            recommendation_text TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
            FOREIGN KEY (agronomist_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
    
    # Seed demo data if no users exist
    seed_demo_data()

def register_user(username, password, role, full_name, phone=None, location=None, avatar_url=None, profile_data=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    password_hash = generate_password_hash(password)
    
    if not avatar_url:
        if role == 'farmer':
            avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
        else:
            avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'

    try:
        cursor.execute('''
            INSERT INTO users (username, password_hash, role, full_name, phone, location, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (username, password_hash, role, full_name, phone, location, avatar_url))
        
        user_id = cursor.lastrowid
        
        profile_data = profile_data or {}
        if role == 'farmer':
            cursor.execute('''
                INSERT INTO farmer_profiles (user_id, farm_name, farm_size, soil_type, primary_crop, irrigation_type)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, 
                  profile_data.get('farm_name', 'Green Fields'), 
                  float(profile_data.get('farm_size', 10.0) or 0.0), 
                  profile_data.get('soil_type', 'Loamy'), 
                  profile_data.get('primary_crop', 'Cotton'), 
                  profile_data.get('irrigation_type', 'Drip')))
        elif role == 'agronomist':
            cursor.execute('''
                INSERT INTO agronomist_profiles (user_id, specialization, experience_years, license_number)
                VALUES (?, ?, ?, ?)
            ''', (user_id, 
                  profile_data.get('specialization', 'Crop Pathology'), 
                  int(profile_data.get('experience_years', 5) or 0), 
                  profile_data.get('license_number', 'AG-00000')))
        
        conn.commit()
        conn.close()
        return user_id
    except sqlite3.IntegrityError as e:
        print("Register user IntegrityError:", e)
        conn.close()
        return None

def authenticate_user(username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    if row and check_password_hash(row['password_hash'], password):
        return dict(row)
    return None

def get_user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    user = cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        conn.close()
        return None
        
    user_dict = dict(user)
    if user_dict['role'] == 'farmer':
        profile = cursor.execute('SELECT * FROM farmer_profiles WHERE user_id = ?', (user_id,)).fetchone()
        if profile:
            user_dict.update(dict(profile))
    elif user_dict['role'] == 'agronomist':
        profile = cursor.execute('SELECT * FROM agronomist_profiles WHERE user_id = ?', (user_id,)).fetchone()
        if profile:
            user_dict.update(dict(profile))
            
    conn.close()
    return user_dict

def update_farmer_profile(user_id, full_name, phone, location, farm_name, farm_size, soil_type, primary_crop, irrigation_type):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users 
        SET full_name = ?, phone = ?, location = ?
        WHERE id = ?
    ''', (full_name, phone, location, user_id))
    
    cursor.execute('''
        UPDATE farmer_profiles 
        SET farm_name = ?, farm_size = ?, soil_type = ?, primary_crop = ?, irrigation_type = ?
        WHERE user_id = ?
    ''', (farm_name, float(farm_size or 0), soil_type, primary_crop, irrigation_type, user_id))
    
    conn.commit()
    conn.close()

def update_agronomist_profile(user_id, full_name, phone, location, specialization, experience_years, license_number):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users 
        SET full_name = ?, phone = ?, location = ?
        WHERE id = ?
    ''', (full_name, phone, location, user_id))
    
    cursor.execute('''
        UPDATE agronomist_profiles 
        SET specialization = ?, experience_years = ?, license_number = ?
        WHERE user_id = ?
    ''', (specialization, int(experience_years or 0), license_number, user_id))
    
    conn.commit()
    conn.close()

def get_farmers():
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute('''
        SELECT u.id, u.username, u.full_name, u.phone, u.location, u.avatar_url,
               fp.farm_name, fp.farm_size, fp.soil_type, fp.primary_crop, fp.irrigation_type
        FROM users u
        JOIN farmer_profiles fp ON u.id = fp.user_id
        WHERE u.role = 'farmer'
    ''').fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_agronomists():
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute('''
        SELECT u.id, u.username, u.full_name, u.phone, u.location, u.avatar_url,
               ap.specialization, ap.experience_years, ap.license_number
        FROM users u
        JOIN agronomist_profiles ap ON u.id = ap.user_id
        WHERE u.role = 'agronomist'
    ''').fetchall()
    conn.close()
    return [dict(row) for row in rows]

def log_analysis(filename, prediction, confidence, nutrient, fertilizer, user_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO analyses (filename, prediction, confidence, nutrient, fertilizer, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (filename, prediction, confidence, nutrient, fertilizer, user_id))
    conn.commit()
    row_id = cursor.lastrowid
    conn.close()
    return row_id

def get_analysis_by_id(analysis_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute('SELECT * FROM analyses WHERE id = ?', (analysis_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_history(user_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id:
        rows = cursor.execute('''
            SELECT a.*, r.recommendation_text, r.timestamp as rec_timestamp, u.full_name as agronomist_name
            FROM analyses a
            LEFT JOIN recommendations r ON a.id = r.analysis_id
            LEFT JOIN users u ON r.agronomist_id = u.id
            WHERE a.user_id = ?
            ORDER BY a.timestamp DESC
        ''', (user_id,)).fetchall()
    else:
        rows = cursor.execute('''
            SELECT a.*, r.recommendation_text, r.timestamp as rec_timestamp, u.full_name as agronomist_name,
                   f.full_name as farmer_name
            FROM analyses a
            LEFT JOIN recommendations r ON a.id = r.analysis_id
            LEFT JOIN users u ON r.agronomist_id = u.id
            LEFT JOIN users f ON a.user_id = f.id
            ORDER BY a.timestamp DESC
        ''').fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_disease_counts(user_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id:
        rows = cursor.execute('''
            SELECT prediction, COUNT(*) as count 
            FROM analyses 
            WHERE user_id = ?
            GROUP BY prediction
            ORDER BY count DESC
        ''', (user_id,)).fetchall()
    else:
        rows = cursor.execute('''
            SELECT prediction, COUNT(*) as count 
            FROM analyses 
            GROUP BY prediction
            ORDER BY count DESC
        ''').fetchall()
    conn.close()
    return {row['prediction']: row['count'] for row in rows}

def get_recent_confidence(user_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id:
        rows = cursor.execute('''
            SELECT timestamp, confidence 
            FROM analyses 
            WHERE user_id = ?
            ORDER BY timestamp DESC 
            LIMIT 10
        ''', (user_id,)).fetchall()
    else:
        rows = cursor.execute('''
            SELECT timestamp, confidence 
            FROM analyses 
            ORDER BY timestamp DESC 
            LIMIT 10
        ''').fetchall()
    conn.close()
    rows.reverse()
    return [{'timestamp': row['timestamp'], 'confidence': row['confidence']} for row in rows]

def clear_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM analyses')
    cursor.execute('DELETE FROM recommendations')
    conn.commit()
    conn.close()

# Messaging Helpers
def send_message(farmer_id, agronomist_id, message, sender_role):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (farmer_id, agronomist_id, message, sender_role)
        VALUES (?, ?, ?, ?)
    ''', (farmer_id, agronomist_id, message, sender_role))
    conn.commit()
    conn.close()

def get_messages(farmer_id, agronomist_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute('''
        SELECT * FROM messages 
        WHERE farmer_id = ? AND agronomist_id = ?
        ORDER BY timestamp ASC
    ''', (farmer_id, agronomist_id)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Recommendation Helpers
def add_recommendation(analysis_id, agronomist_id, recommendation_text):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO recommendations (analysis_id, agronomist_id, recommendation_text)
            VALUES (?, ?, ?)
        ''', (analysis_id, agronomist_id, recommendation_text))
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print("DB Error adding recommendation:", e)
        conn.close()
        return False

def get_recommendation_by_analysis(analysis_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute('''
        SELECT r.*, u.full_name as agronomist_name, ap.specialization
        FROM recommendations r
        JOIN users u ON r.agronomist_id = u.id
        LEFT JOIN agronomist_profiles ap ON u.id = ap.user_id
        WHERE r.analysis_id = ?
    ''', (analysis_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

# Database Seeding
def seed_demo_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear out old demo accounts to keep names/roles aligned with UI cards
    cursor.execute("SELECT id FROM users WHERE username IN ('farmer1', 'agronomist1')")
    demo_user_ids = [row['id'] for row in cursor.fetchall()]
    
    if demo_user_ids:
        placeholders = ','.join('?' for _ in demo_user_ids)
        cursor.execute(f"DELETE FROM users WHERE id IN ({placeholders})", demo_user_ids)
        cursor.execute(f"DELETE FROM farmer_profiles WHERE user_id IN ({placeholders})", demo_user_ids)
        cursor.execute(f"DELETE FROM agronomist_profiles WHERE user_id IN ({placeholders})", demo_user_ids)
        cursor.execute(f"DELETE FROM analyses WHERE user_id IN ({placeholders})", demo_user_ids)
        cursor.execute(f"DELETE FROM messages WHERE farmer_id IN ({placeholders}) OR agronomist_id IN ({placeholders})", demo_user_ids + demo_user_ids)
        cursor.execute(f"DELETE FROM recommendations WHERE agronomist_id IN ({placeholders})", demo_user_ids)
        conn.commit()

    print("Seeding demo database tables with sample profiles, diagnostics, and chats...")
    conn.close()

    # Ensure demo assets exist in static/uploads directory so they do not return 404
    import shutil
    uploads_dir = os.path.join('static', 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    for img_name in ['blight.png', 'healthy.png', 'redding.png', 'variegation.png']:
        src = os.path.join('static', 'images', img_name)
        dst = os.path.join(uploads_dir, img_name)
        if os.path.exists(src):
            try:
                shutil.copy(src, dst)
            except Exception as e:
                print(f"Error copying {img_name}: {e}")
    
    # 1. Register Demo Farmer
    farmer_id = register_user(
        username='farmer1',
        password='password',
        role='farmer',
        full_name='John Doe',
        phone='+1 (555) 019-2834',
        location='Lubbock, Texas (Field #2)',
        avatar_url='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
        profile_data={
            'farm_name': 'West Texas Cotton Farms',
            'farm_size': 120.5,
            'soil_type': 'Loamy',
            'primary_crop': 'Cotton',
            'irrigation_type': 'Center Pivot'
        }
    )

    # 2. Register Demo Agronomist
    agronomist_id = register_user(
        username='agronomist1',
        password='password',
        role='agronomist',
        full_name='Dr. Sarah Jenkins',
        phone='+1 (555) 014-9988',
        location='Texas A&M AgriLife Extension',
        avatar_url='https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
        profile_data={
            'specialization': 'Crop Pathology & Soil Health',
            'experience_years': 8,
            'license_number': 'AG-847293'
        }
    )

    # 3. Add Some Demo Historical Diagnoses for John Doe
    id_blight = log_analysis(
        filename='blight.png',
        prediction='Bacterial Blight',
        confidence=88.4,
        nutrient='Possible Potassium Deficiency',
        fertilizer='Apply Potassium-rich fertilizer (e.g., Muriate of Potash)',
        user_id=farmer_id
    )
    
    id_healthy = log_analysis(
        filename='healthy.png',
        prediction='Healthy Leaf',
        confidence=96.5,
        nutrient='No Deficiency',
        fertilizer='No fertilizer needed. Maintain standard irrigation.',
        user_id=farmer_id
    )

    # 4. Add Agronomist expert recommendation for the Blight diagnosis
    add_recommendation(
        analysis_id=id_blight,
        agronomist_id=agronomist_id,
        recommendation_text=(
            "Hi John, I reviewed this leaf sample. The angular lesions suggest this is indeed "
            "Bacterial Blight. It has likely been aggravated by the recent heavy humidity. "
            "Please apply 45 lbs/acre of Muriate of Potash (K2O) as soon as soil conditions permit. "
            "Avoid overhead irrigation for the next 10 days to restrict pathogen propagation."
        )
    )

    # 5. Seed Chat Messages between John and Dr. Sarah
    send_message(farmer_id, agronomist_id, "Hello Dr. Jenkins! I've uploaded a cotton leaf sample showing dark patches. Could you review it?", 'farmer')
    send_message(farmer_id, agronomist_id, "Hi John, yes! I see it in your history. It looks like Bacterial Blight. I will write up an official recommendation with instructions.", 'agronomist')
    send_message(farmer_id, agronomist_id, "Thank you! I see your recommendation now. I'll get the fertilizer ready.", 'farmer')

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
