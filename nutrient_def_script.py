from ultralytics import YOLO

# Load model
model = YOLO("weights/best.pt")

# Disease → nutrient mapping
disease_to_nutrient = {
    "Bacterial Blight": "Possible Potassium Deficiency",
    "Curl Virus": "Possible Zinc Deficiency",
    "Healthy Leaf": "No Deficiency",
    "Herbicide Growth Damage": "Nutrient not applicable (chemical injury)",
    "Leaf Hopper Jassids": "Possible Nitrogen Stress",
    "Leaf Redding": "Possible Phosphorus Deficiency",
    "Leaf Variegation": "Possible Magnesium Deficiency"
}

# Predict image
results = model("test_leaf.jpg")

# Top class
pred_class = results[0].names[results[0].probs.top1]

# Confidence
confidence = float(results[0].probs.top1conf) * 100

# Nutrient
nutrient = disease_to_nutrient.get(pred_class, "Unknown")

print("Detected Disease:", pred_class)
print("Confidence:", f"{confidence:.2f}%")
print("Deficient Nutrient:", nutrient)