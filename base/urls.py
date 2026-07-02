from django.urls import path
from . import views

app_name = 'myapp'

urlpatterns = [

    path('', views.IndexView.as_view(), name='home'),
    path('upload/', views.UploadView.as_view(), name='upload'),
    path('analyzing/', views.AnalyzingView.as_view(), name='analyzing'),
    path('results/', views.ResultsView.as_view(), name='results'),

    # API
    path('api/analyze/', views.analyze_image, name='analyze_api'),
]