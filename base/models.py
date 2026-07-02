from django.db import models


class FoodItem(models.Model):
    name = models.CharField(max_length=200, unique=True, db_index=True)
    ingredients = models.TextField()
    calories = models.FloatField()
    protein = models.FloatField()
    carbohydrates = models.FloatField()
    fats = models.FloatField()
    fiber = models.FloatField()
    sugars = models.FloatField()
    sodium = models.FloatField()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']