import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'food_AI.settings')
import django
django.setup()

from base.ML_models.food_classifier import classify_food


with open('images.jpeg', 'rb') as f:
    image_bytes = f.read()

food_name, confidence = classify_food(image_bytes)
print(f"Food: {food_name}")
print(f"Confidence: {confidence}%")