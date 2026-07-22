from django.db import models

class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(default=0.0)
    
    driver_name = models.CharField(max_length=255, default="John Doe")
    tractor_number = models.CharField(max_length=255, default="TRK-101")
    trailer_number = models.CharField(max_length=255, default="TRL-202")
    carrier_name = models.CharField(max_length=255, default="Apex Logistics")
    shipping_doc = models.CharField(max_length=255, default="BOL-1001")
    commodity = models.CharField(max_length=255, default="General Freight")
    
    start_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    total_miles = models.FloatField(default=0.0)
    total_hours = models.FloatField(default=0.0)
    final_cycle_hours = models.FloatField(default=0.0)
    
    # Complete calculation JSON for exact 1-to-1 reloading
    full_data_json = models.TextField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Trip {self.id}: {self.current_location} -> {self.pickup_location} -> {self.dropoff_location}"
