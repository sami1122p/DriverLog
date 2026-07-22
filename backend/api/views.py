from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime
from .hos_simulator import geocode_location, get_route, HOSSimulator, split_timeline_by_day, resolve_timeline_locations

@csrf_exempt
def calculate_trip(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST requests allowed"}, status=405)
        
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
        
    current_loc_str = data.get("current_location", "").strip()
    pickup_loc_str = data.get("pickup_location", "").strip()
    dropoff_loc_str = data.get("dropoff_location", "").strip()
    cycle_hours_used = float(data.get("current_cycle_used", 0.0))
    
    # Form metadata
    driver_name = data.get("driver_name", "John Doe")
    tractor_number = data.get("tractor_number", "TRK-101")
    trailer_number = data.get("trailer_number", "TRL-202")
    carrier_name = data.get("carrier_name", "Apex Logistics")
    shipping_doc = data.get("shipping_doc", "BOL-992384")
    commodity = data.get("commodity", "Paper Products")
    
    start_time_str = data.get("start_time", "")
    if start_time_str:
        try:
            # Expected format: "YYYY-MM-DDTHH:MM" or similar ISO
            # If length is 10, it's just date, so append 06:00
            if len(start_time_str) == 10:
                start_time = datetime.fromisoformat(f"{start_time_str}T06:00:00")
            else:
                start_time = datetime.fromisoformat(start_time_str.replace('Z', ''))
        except ValueError:
            start_time = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
    else:
        start_time = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
        
    if not current_loc_str or not pickup_loc_str or not dropoff_loc_str:
        return JsonResponse({"error": "current_location, pickup_location, and dropoff_location are required"}, status=400)
        
    # Geocoding
    start_lat, start_lon, start_name = geocode_location(current_loc_str)
    pickup_lat, pickup_lon, pickup_name = geocode_location(pickup_loc_str)
    dropoff_lat, dropoff_lon, dropoff_name = geocode_location(dropoff_loc_str)
    
    # Routing
    # Leg 1: Current -> Pickup
    leg1_dist, leg1_dur, leg1_coords = get_route(start_lat, start_lon, pickup_lat, pickup_lon)
    # Leg 2: Pickup -> Dropoff
    leg2_dist, leg2_dur, leg2_coords = get_route(pickup_lat, pickup_lon, dropoff_lat, dropoff_lon)
    
    # Initialize HOS Simulator
    simulator = HOSSimulator(start_time, cycle_hours_used)
    
    # Simulate Leg 1
    simulator.simulate_leg(leg1_coords, leg1_dur, leg1_dist)
    
    # Arrive at Pickup
    if simulator.elapsed_time_in_shift >= 14.0 or simulator.driving_time_in_shift >= 11.0:
        simulator.trigger_sleep_break(pickup_name, pickup_lat, pickup_lon)
        
    # Check if a pre-trip is needed before pickup
    if not simulator.shift_active:
        simulator.trigger_pre_trip(pickup_name, pickup_lat, pickup_lon)
        
    # Perform Pickup Loading
    simulator.add_event(4, 1.0, "Pickup Loading", pickup_name, pickup_lat, pickup_lon)
    
    # Check if shift limit exceeded after pickup
    if simulator.elapsed_time_in_shift >= 14.0:
        simulator.trigger_sleep_break(pickup_name, pickup_lat, pickup_lon)
        
    # Simulate Leg 2
    simulator.simulate_leg(leg2_coords, leg2_dur, leg2_dist)
    
    # Arrive at Dropoff
    if simulator.elapsed_time_in_shift >= 14.0 or simulator.driving_time_in_shift >= 11.0:
        simulator.trigger_sleep_break(dropoff_name, dropoff_lat, dropoff_lon)
        
    if not simulator.shift_active:
        simulator.trigger_pre_trip(dropoff_name, dropoff_lat, dropoff_lon)
        
    # Perform Dropoff Unloading
    simulator.add_event(4, 1.0, "Dropoff Unloading", dropoff_name, dropoff_lat, dropoff_lon)
    
    # Post-trip inspection
    simulator.trigger_post_trip(dropoff_name, dropoff_lat, dropoff_lon)
    
    # Pad with a final Off-Duty event for 24 hours to fill out the last day page
    simulator.add_event(1, 24.0, "Off-Duty (End of Trip)", dropoff_name, dropoff_lat, dropoff_lon)
    
    # Resolve stop location names at the end to minimize Nominatim API calls
    resolve_timeline_locations(simulator.timeline)
    
    # Slice continuous timeline into calendar days
    daily_logs = split_timeline_by_day(simulator.timeline, start_time)
    
    # Convert daily_logs keys to list of dictionaries for JSON serialization
    daily_logs_list = []
    for day_num in sorted(daily_logs.keys()):
        day_data = daily_logs[day_num]
        
        # Don't include days that are entirely empty / just padded Off-Duty at the end
        # unless it is the last day where the trip actually ended.
        # Let's count if there are any events other than the end-of-trip padding.
        # If it's day index > 1 and it's 24 hours of Off Duty, let's see.
        if day_num > 1 and day_data["totals"][1] >= 23.9:
            # Check if there are any other events in this day
            non_pad_events = [e for e in day_data["events"] if "End of Trip" not in e["description"]]
            if not non_pad_events:
                # Discard empty tail days
                continue
                
        daily_logs_list.append({
            "day_number": day_num,
            "date": day_data["date"],
            "events": day_data["events"],
            "totals": day_data["totals"],
            "miles": day_data["miles"]
        })
        
    # Prepare map response
    # We send back the leg coordinates for the frontend to render the route line
    route_coords = {
        "leg1": [[pt[1], pt[0]] for pt in leg1_coords], # Convert to [lat, lon] for Leaflet
        "leg2": [[pt[1], pt[0]] for pt in leg2_coords],
    }
    
    response_data = {
        "start_location": {"name": start_name, "lat": start_lat, "lon": start_lon},
        "pickup_location": {"name": pickup_name, "lat": pickup_lat, "lon": pickup_lon},
        "dropoff_location": {"name": dropoff_name, "lat": dropoff_lat, "lon": dropoff_lon},
        "route_coordinates": route_coords,
        "timeline": simulator.timeline[:-1], # Remove the 24-hr pad event from display timeline
        "daily_logs": daily_logs_list,
        "summary": {
            "total_miles": round(simulator.total_trip_miles, 1),
            "total_hours": round((simulator.current_time - start_time).total_seconds() / 3600.0 - 24.0, 2), # Exclude the 24h pad
            "final_cycle_hours": round(simulator.cycle_hours_used, 2),
        },
        "metadata": {
            "driver_name": driver_name,
            "tractor_number": tractor_number,
            "trailer_number": trailer_number,
            "carrier_name": carrier_name,
            "shipping_doc": shipping_doc,
            "commodity": commodity
        }
    }
    
    return JsonResponse(response_data)

from .models import Trip

@csrf_exempt
def save_trip(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Only POST requests allowed"}, status=405)
    try:
        data = json.loads(request.body)
        trip_data = data.get("trip_data")
        if not trip_data:
            return JsonResponse({"error": "trip_data is required"}, status=400)
            
        start_loc = trip_data.get("start_location", {}).get("name", "Unknown")
        pickup_loc = trip_data.get("pickup_location", {}).get("name", "Unknown")
        dropoff_loc = trip_data.get("dropoff_location", {}).get("name", "Unknown")
        meta = trip_data.get("metadata", {})
        summary = trip_data.get("summary", {})
        
        start_time_raw = trip_data.get("timeline", [{}])[0].get("start_time", datetime.now().isoformat())
        try:
            start_time = datetime.fromisoformat(start_time_raw.replace('Z', ''))
        except Exception:
            start_time = datetime.now()

        trip = Trip.objects.create(
            current_location=start_loc,
            pickup_location=pickup_loc,
            dropoff_location=dropoff_loc,
            current_cycle_used=summary.get("final_cycle_hours", 0.0),
            driver_name=meta.get("driver_name", "John Doe"),
            tractor_number=meta.get("tractor_number", "TRK-101"),
            trailer_number=meta.get("trailer_number", "TRL-202"),
            carrier_name=meta.get("carrier_name", "Apex Logistics"),
            shipping_doc=meta.get("shipping_doc", "BOL-1001"),
            commodity=meta.get("commodity", "General Freight"),
            start_time=start_time,
            total_miles=summary.get("total_miles", 0.0),
            total_hours=summary.get("total_hours", 0.0),
            final_cycle_hours=summary.get("final_cycle_hours", 0.0),
            full_data_json=json.dumps(trip_data)
        )
        return JsonResponse({"message": "Trip saved successfully", "id": trip.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_trips(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Only GET requests allowed"}, status=405)
    
    trips = Trip.objects.all()
    res = []
    for t in trips:
        res.append({
            "id": t.id,
            "current_location": t.current_location,
            "pickup_location": t.pickup_location,
            "dropoff_location": t.dropoff_location,
            "driver_name": t.driver_name,
            "total_miles": t.total_miles,
            "total_hours": t.total_hours,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M"),
        })
    return JsonResponse({"trips": res})

@csrf_exempt
def get_trip(request, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
        data = json.loads(trip.full_data_json)
        data["id"] = trip.id
        return JsonResponse(data)
    except Trip.DoesNotExist:
        return JsonResponse({"error": "Trip not found"}, status=404)

@csrf_exempt
def delete_trip(request, trip_id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Only DELETE requests allowed"}, status=405)
    try:
        trip = Trip.objects.get(id=trip_id)
        trip.delete()
        return JsonResponse({"message": "Trip deleted successfully"})
    except Trip.DoesNotExist:
        return JsonResponse({"error": "Trip not found"}, status=404)

