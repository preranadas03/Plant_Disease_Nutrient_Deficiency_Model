import streamlit as st
from ultralytics import YOLO
from PIL import Image

st.set_page_config(layout="wide")

model = YOLO("weights/best.pt")

mapping = {

"Bacterial Blight":
"Possible Potassium Deficiency",

"Curl Virus":
"Possible Zinc Deficiency",

"Healthy Leaf":
"No Deficiency",

"Herbicide Growth Damage":
"Nutrient Not Applicable (Chemical Injury)",

"Leaf Hopper Jassids":
"Possible Nitrogen Stress",

"Leaf Redding":
"Possible Phosphorus Deficiency",

"Leaf Variegation":
"Possible Magnesium Deficiency"

}

fertilizer = {

"Bacterial Blight":
"Apply Potassium-rich fertilizer",

"Curl Virus":
"Apply Zinc micronutrient spray",

"Healthy Leaf":
"No fertilizer needed",

"Herbicide Growth Damage":
"Monitor chemical exposure",

"Leaf Hopper Jassids":
"Apply Nitrogen supplement",

"Leaf Redding":
"Apply Phosphorus fertilizer",

"Leaf Variegation":
"Apply Magnesium supplement"

}

st.title("Plant Disease and Nutrient Deficiency Detection")

# Sidebar
st.sidebar.title("Project Info")
st.sidebar.write("AI-Based Plant Disease and Nutrient Deficiency Detection using YOLOv8")
st.sidebar.subheader("Diseases Identified")
diseases = [
"Bacterial Blight",
"Curl Virus",
"Healthy Leaf",
"Herbicide Growth Damage",
"Leaf Hopper Jassids",
"Leaf Redding",
"Leaf Variegation"
]
for d in diseases:
    st.sidebar.write(f"• {d}")

uploaded = st.file_uploader("Upload Leaf Image")

if uploaded:

    img=Image.open(uploaded)
    img.save("temp.jpg")

    results=model("temp.jpg")

    pred=results[0].names[results[0].probs.top1]

    confidence=float(results[0].probs.top1conf)*100

    nutrient=mapping.get(pred,"Unknown")

    c1,c2=st.columns(2)

    with c1:
        st.image(img)

    with c2:
        st.subheader("Disease Prediction")
        st.success(pred)

        # st.subheader("Confidence")
        # st.progress(int(confidence))
        # st.write(f"{confidence:.2f}%")

        st.subheader("Nutrient Deficiency")
        st.warning(nutrient)

        st.subheader("Recommended Fertilizer")
        st.info(fertilizer[pred])