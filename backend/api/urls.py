from django.urls import path
from .views import calculate_trip, save_trip, list_trips, get_trip, delete_trip

urlpatterns = [
    path('calculate-trip/', calculate_trip, name='calculate_trip'),
    path('save-trip/', save_trip, name='save_trip'),
    path('trips/', list_trips, name='list_trips'),
    path('trips/<int:trip_id>/', get_trip, name='get_trip'),
    path('trips/<int:trip_id>/delete/', delete_trip, name='delete_trip'),
]

