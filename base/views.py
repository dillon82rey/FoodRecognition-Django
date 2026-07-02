import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from .models import FoodItem
from .ML_models.food_detector import is_food
from .ML_models.food_classifier import classify_food

logger = logging.getLogger(__name__)


class IndexView(TemplateView):
    template_name = 'myapp/index.html'

class UploadView(TemplateView):
    template_name = 'myapp/upload.html'

class AnalyzingView(TemplateView):
    template_name = 'myapp/analyzing.html'

class ResultsView(TemplateView):
    template_name = 'myapp/results.html'


@csrf_exempt
def analyze_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if 'image' not in request.FILES:
        return JsonResponse({'error': 'No image uploaded'}, status=400)

    image_file = request.FILES['image']

    if not image_file.content_type.startswith('image/'):
        return JsonResponse({'error': 'File must be an image'}, status=400)

    try:
        image_bytes = image_file.read()
    except Exception as e:
        return JsonResponse({'error': f'Failed to read image: {str(e)}'}, status=400)

    # is-food detection
    try:
        is_food_result, food_confidence = is_food(image_bytes)
    except Exception as e:
        return JsonResponse({'error': f'Food detection failed: {str(e)}'}, status=500)

    if not is_food_result:
        logger.warning("No food detected in image")
        return JsonResponse({
            'error': 'no_food_detected',
            'food_confidence': food_confidence,
            'message': '🤔 This doesn\'t look like food!',
            'detail': 'The image you uploaded doesn\'t appear to contain any food. Please upload a clear photo of a meal.',
            'emoji': '🍽️',
            'tip': 'Try taking a photo from a different angle or with better lighting.'
        }, status=400)

    # food-classification
    try:
        food_name, classifier_confidence = classify_food(image_bytes)
        logger.info(f"Detected food: {food_name}, confidence: {classifier_confidence}")
    except Exception as e:
        return JsonResponse({'error': f'Food classification failed: {str(e)}'}, status=500)

    # search in database
    try:
        food_item = FoodItem.objects.get(name__iexact=food_name)
        logger.info(f"Found in DB: {food_item.name}")
    except FoodItem.DoesNotExist:
        return JsonResponse({
            'error': 'Food not found in database',
            'detected_name': food_name,
            'confidence': classifier_confidence,
            'message': 'This food is not in our database yet'
        }, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Database error: {str(e)}'}, status=500)

    analysis_type = request.POST.get('type', 'nutrition')
    weight = request.POST.get('weight', '100')


    try:
        weight_grams = float(weight) if weight else 100.0
    except ValueError:
        weight_grams = 100.0

    factor = weight_grams / 100.0


    response_data = {
        'food_name': food_item.name,
        'food_confidence': classifier_confidence,
        'weight': weight,
        'is_food_confidence': food_confidence,
    }

    #Nutrients
    response_data.update({
        'calories': round(food_item.calories * factor, 2),
        'protein': round(food_item.protein * factor, 2),
        'carbohydrates': round(food_item.carbohydrates * factor, 2),
        'fats': round(food_item.fats * factor, 2),
        'fiber': round(food_item.fiber * factor, 2),
        'sugars': round(food_item.sugars * factor, 2),
        'sodium': round(food_item.sodium * factor, 2),
    })

    #ingredients
    ingredients_list = [i.strip() for i in food_item.ingredients.split(',') if i.strip()]
    response_data['ingredients'] = ingredients_list

    logger.info(f"Response data: {response_data}")
    return JsonResponse(response_data)