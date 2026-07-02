import os
import cv2
import numpy as np
from tensorflow import keras

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model/my_model.h5')

#ایجاد مدل
model = keras.models.load_model(MODEL_PATH)


def is_food(image_bytes):
    """
    ورودی: بایت‌های تصویر (خوانده شده از request.FILES)
    خروجی: (boolean, confidence_percent)
        - boolean: True اگر غذا باشد، False اگر غیرغذا باشد
        - confidence_percent: عدد بین 0 تا 100 (احتمال غیرغذا بودن در خروجی مدل)

    منطق مشابه فایل دوم Flask (که از my_model.h5 استفاده می‌کند):
        - اگر احتمال < 50 باشد → غذا
        - اگر احتمال >= 50 باشد → غیرغذا
    """
    try:
        # تبدیل بایت به آرایه OpenCV
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("تصویر قابل خواندن نیست")

        # پیش‌پردازش
        img = cv2.resize(img, (64, 64))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)

        # پیش‌بینی
        prediction = model.predict(img, verbose=0)

        prob_non_food = float(prediction[0][0])
        prob_food = 1 - prob_non_food


        is_food_result = prob_non_food < 0.6


        confidence = prob_food * 100 if is_food_result else prob_non_food * 100

        return is_food_result, round(confidence, 2)

    except Exception as e:

        print(f"Error in food_detector: {e}")
        return False, 0.0