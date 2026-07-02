
import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model/food_classifier.pt')


CLASS_NAMES = [
    'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
    'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
    'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
    'ceviche', 'cheese_plate', 'cheesecake', 'chicken_curry', 'chicken_quesadilla',
    'chicken_wings', 'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder',
    'club_sandwich', 'crab_cakes', 'creme_brulee', 'croque_madame', ' ',
    'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict',
    'escargots', 'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras',
    'french_fries', 'french_onion_soup', 'french_toast', 'fried_calamari',
    'fried_rice', 'frozen_yogurt', 'garlic_bread', 'gnocchi', 'greek_salad',
    'grilled_cheese_sandwich', 'grilled_salmon', 'guacamole', 'gyoza', 'hamburger',
    'hot_and_sour_soup', 'hot_dog', 'huevos_rancheros', 'hummus', 'ice_cream',
    'lasagna', 'lobster_bisque', 'lobster_roll_sandwich', 'macaroni_and_cheese',
    'macarons', 'miso_soup', 'mussels', 'nachos', 'omelette', 'onion_rings',
    'oysters', 'pad_thai', 'paella', 'pancakes', 'panna_cotta', 'peking_duck',
    'pho', 'pizza', 'pork_chop', 'poutine', 'prime_rib', 'pulled_pork_sandwich',
    'ramen', 'ravioli', 'red_velvet_cake', 'risotto', 'samosa', 'sashimi',
    'scallops', 'seaweed_salad', 'shrimp_and_grits', 'spaghetti_bolognese',
    'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake',
    'sushi', 'tacos', 'takoyaki', 'tiramisu', 'tuna_tartare', 'waffles'
]


def get_model():
    """
    ایجاد مدل با همان معماری که در commons.py و food-101.ipynb استفاده شده است
    """

    model = models.densenet201(pretrained=True)

    # تنظیم لایه
    model.classifier = nn.Sequential(
        nn.Linear(1920, 1024),
        nn.LeakyReLU(),
        nn.Linear(1024, 101)  # 101 کلاس
    )

    return model


def get_tensor(image_bytes):
    """
    تبدیل بایت‌های تصویر به تنسور PyTorch
    دقیقاً مانند تابع get_tensor در commons.py
    """
    my_transforms = transforms.Compose([
        transforms.Resize(255),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return my_transforms(image).unsqueeze(0)


try:
    print("Loading food classifier model...")

    # ایجاد مدل
    model = get_model()

    # بارگذاری وزن‌ها
    state_dict = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
    model.load_state_dict(state_dict, strict=False)
    model.eval()

    print(f"✓ Food classifier model loaded successfully!")
    print(f"  - Classes: {len(CLASS_NAMES)}")
    print(f"  - Model: DenseNet201")

except Exception as e:
    print(f"✗ Error loading food classifier model: {e}")
    model = None


def classify_food(image_bytes):
    """
    ورودی: بایت‌های تصویر
    خروجی: (food_name, confidence_percent)
    """
    if model is None:
        print("Model not loaded!")
        return "unknown", 0.0

    try:

        tensor = get_tensor(image_bytes)


        with torch.no_grad():
            outputs = model(tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, idx = torch.max(probabilities, 1)

        food_name = CLASS_NAMES[idx.item()]
        confidence_percent = float(confidence.item()) * 100

        return food_name, round(confidence_percent, 2)

    except Exception as e:
        print(f"Error in classify_food: {e}")
        return "unknown", 0.0


def test_model(image_path):
    """
    تست مدل با یک فایل تصویر
    """
    with open(image_path, 'rb') as f:
        image_bytes = f.read()

    food_name, confidence = classify_food(image_bytes)
    print(f"Predicted: {food_name} (Confidence: {confidence}%)")
    return food_name, confidence


if __name__ == "__main__":
    test_path = "image.jpg"
    if os.path.exists(test_path):
        test_model(test_path)