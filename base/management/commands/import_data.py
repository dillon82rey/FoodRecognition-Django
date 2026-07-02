import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from base.models import FoodItem
from django.db import transaction


class Command(BaseCommand):
    help = 'Import food data from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            default='base/data/food3.csv',
            help='Path to the CSV file'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        csv_path = options['csv']


        if not os.path.isabs(csv_path):
            csv_path = os.path.join(settings.BASE_DIR, csv_path)

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'File not found: {csv_path}'))
            return

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                count = 0
                updated_count = 0

                for row in reader:
                    name = row['label'].strip()


                    food, created = FoodItem.objects.update_or_create(
                        name=name,
                        defaults={
                            'ingredients': row['ingredients'].strip(),
                            'calories': float(row['calories']),
                            'protein': float(row['protein']),
                            'carbohydrates': float(row['carbohydrates']),
                            'fats': float(row['fats']),
                            'fiber': float(row['fiber']),
                            'sugars': float(row['sugars']),
                            'sodium': float(row['sodium']),
                        }
                    )

                    if created:
                        count += 1
                        self.stdout.write(f'➕ Added: {name}')
                    else:
                        updated_count += 1
                        self.stdout.write(f'🔄 Updated: {name}')

                self.stdout.write(
                    self.style.SUCCESS(f'\n✅ Successfully imported {count} new food items')
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Updated {updated_count} existing food items')
                )
                self.stdout.write(
                    self.style.SUCCESS(f'📊 Total foods in database: {FoodItem.objects.count()}')
                )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {str(e)}'))