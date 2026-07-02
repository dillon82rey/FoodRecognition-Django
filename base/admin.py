from django.contrib import admin
from .models import FoodItem


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'calories',
        'protein',
        'carbohydrates',
        'fats',
        'fiber',
        'sugars',
        'sodium'
    )
    search_fields = ('name', 'ingredients')

    list_filter = ('name',)

    ordering = ('name',)

    list_per_page = 20

    readonly_fields = ('id',)

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('name', 'ingredients')
        }),
        ('مقادیر تغذیه‌ای (به ازای ۱۰۰ گرم)', {
            'fields': (
                'calories',
                'protein',
                'carbohydrates',
                'fats',
                'fiber',
                'sugars',
                'sodium'
            )
        }),
    )

    list_editable = (
        'calories',
        'protein',
        'carbohydrates',
        'fats',
        'fiber',
        'sugars',
        'sodium'
    )

    actions = ['duplicate_selected', 'clear_nutrition_data']

    def duplicate_selected(self, request, queryset):
        """کپی کردن آیتم‌های انتخاب‌شده"""
        for obj in queryset:
            obj.pk = None
            obj.name = f"{obj.name}_copy"
            obj.save()
        self.message_user(request, f"{queryset.count()} آیتم با موفقیت کپی شدند.")

    duplicate_selected.short_description = "کپی کردن آیتم‌های انتخاب‌شده"

    def clear_nutrition_data(self, request, queryset):
        """پاک کردن مقادیر تغذیه‌ای آیتم‌های انتخاب‌شده"""
        count = queryset.update(
            calories=0,
            protein=0,
            carbohydrates=0,
            fats=0,
            fiber=0,
            sugars=0,
            sodium=0
        )
        self.message_user(request, f"{count} آیتم به‌روزرسانی شدند.")

    clear_nutrition_data.short_description = "پاک کردن مقادیر تغذیه‌ای"

    def get_queryset(self, request):
        """بهینه‌سازی کوئری‌ها"""
        return super().get_queryset(request).select_related()

    class Media:
        css = {
            'all': ('admin/css/custom_admin.css',)
        }