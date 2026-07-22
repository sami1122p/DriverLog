import os
import requests
import urllib.parse
from datetime import datetime, timedelta
import math

# Fallback geocoding database for reliability and speed
MOCK_GEOCODE_DB = {
    "green bay, wi": (44.5192, -88.0198),
    "fond du lac, wi": (43.7730, -88.4470),
    "paw paw, il": (41.6886, -88.9837),
    "edwardsville, il": (38.8114, -89.9531),
    "chicago, il": (41.8781, -87.6298),
    "new york, ny": (40.7128, -74.0060),
    "los angeles, ca": (34.0522, -118.2437),
    "seattle, wa": (47.6062, -122.3321),
    "miami, fl": (25.7617, -80.1918),
    "dallas, tx": (32.7767, -96.7970),
    "denver, co": (39.7392, -104.9903),
    "atlanta, ga": (33.7490, -84.3880),
    "richmond, va": (37.5407, -77.4360),
    "fredericksburg, va": (38.3032, -77.4605),
    "baltimore, md": (39.2904, -76.6122),
    "philadelphia, pa": (39.9526, -75.1652),
    "cherry hill, nj": (39.9268, -75.0246),
    "newark, nj": (40.7357, -74.1724),
}

# Reverse database
MOCK_REVERSE_DB = {
    (44.5192, -88.0198): "Green Bay, WI",
    (43.7730, -88.4470): "Fond du Lac, WI",
    (41.6886, -88.9837): "Paw Paw, IL",
    (38.8114, -89.9531): "Edwardsville, IL",
    (41.8781, -87.6298): "Chicago, IL",
    (40.7128, -74.0060): "New York, NY",
    (34.0522, -118.2437): "Los Angeles, CA",
    (47.6062, -122.3321): "Seattle, WA",
    (25.7617, -80.1918): "Miami, FL",
    (32.7767, -96.7970): "Dallas, TX",
    (39.7392, -104.9903): "Denver, CO",
    (33.7490, -84.3880): "Atlanta, GA",
    (37.5407, -77.4360): "Richmond, VA",
    (38.3032, -77.4605): "Fredericksburg, VA",
    (39.2904, -76.6122): "Baltimore, MD",
    (39.9526, -75.1652): "Philadelphia, PA",
    (39.9268, -75.0246): "Cherry Hill, NJ",
    (40.7357, -74.1724): "Newark, NJ",
}

# Cache to avoid calling API multiple times for the same lat/lon in a request
geocode_cache = {}

def geocode_location(query):
    """
    Geocodes a location query to (lat, lon, location_name).
    Tries Nominatim API first, falls back to MOCK_GEOCODE_DB.
    """
    clean_query = query.strip().lower()
    
    if clean_query in geocode_cache:
        return geocode_cache[clean_query]
        
    # Try mock DB exact match
    if clean_query in MOCK_GEOCODE_DB:
        lat, lon = MOCK_GEOCODE_DB[clean_query]
        name = query.strip()
        for k, v in MOCK_GEOCODE_DB.items():
            if v == (lat, lon):
                name = k.title()
                break
        res = (lat, lon, name)
        geocode_cache[clean_query] = res
        return res
        
    # Try Nominatim API
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
        headers = {"User-Agent": "FleetLogELDDashboard/1.0 (admin@fleetlogeld.org)"}
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200 and len(res.json()) > 0:
            data = res.json()[0]
            lat = float(data["lat"])
            lon = float(data["lon"])
            display_name = data.get("display_name", query)
            parts = display_name.split(",")
            if len(parts) >= 2:
                display_name = f"{parts[0].strip()}, {parts[1].strip()}"
                if len(parts) >= 3 and parts[2].strip().replace(" ", "").isalpha():
                    display_name += f", {parts[2].strip()}"
            result = (lat, lon, display_name)
            geocode_cache[clean_query] = result
            return result
    except Exception as e:
        print(f"Geocoding failed for {query}: {e}")
        
    # Try fuzzy matching mock DB
    for k, coords in MOCK_GEOCODE_DB.items():
        if k in clean_query or clean_query in k:
            res = (coords[0], coords[1], k.title())
            geocode_cache[clean_query] = res
            return res
            
    return 41.8781, -87.6298, f"{query} (Est)"

def reverse_geocode(lat, lon):
    """
    Converts coordinates to a City, State string.
    """
    # Check mock DB (using small tolerance)
    for coords, name in MOCK_REVERSE_DB.items():
        if math.isclose(coords[0], lat, abs_tol=0.01) and math.isclose(coords[1], lon, abs_tol=0.01):
            return name
            
    # Call Nominatim
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {"User-Agent": "FleetLogELDDashboard/1.0 (admin@fleetlogeld.org)"}
        res = requests.get(url, headers=headers, timeout=3)
        if res.status_code == 200:
            data = res.json()
            address = data.get("address", {})
            city = address.get("city") or address.get("town") or address.get("village") or address.get("hamlet") or address.get("suburb")
            state = address.get("state") or address.get("region")
            if city and state:
                state_code = state[:2].upper()
                return f"{city}, {state_code}"
            elif city:
                return city
            display_name = data.get("display_name", "")
            parts = display_name.split(",")
            if len(parts) >= 2:
                return f"{parts[0].strip()}, {parts[1].strip()}"
            return "Route Stop"
    except Exception as e:
        print(f"Reverse geocode failed: {e}")
        
    return f"{lat:.2f}, {lon:.2f}"

def get_route(start_lat, start_lon, end_lat, end_lon):
    """
    Calls OSRM to get driving route geometry, distance, and duration.
    """
    try:
        url = f"https://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson&steps=true"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                route = data["routes"][0]
                distance = route["distance"] # in meters
                duration = route["duration"] # in seconds
                geometry = route["geometry"] # geojson geometry (LineString)
                return distance, duration, geometry["coordinates"]
    except Exception as e:
        print(f"Routing failed: {e}")
        
    # Mock route fallback (straight line)
    dlat = math.radians(end_lat - start_lat)
    dlon = math.radians(end_lon - start_lon)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(start_lat)) * math.cos(math.radians(end_lat)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance_meters = 6371000 * c
    duration_seconds = distance_meters / 22.35
    
    num_points = 20
    coords = []
    for i in range(num_points):
        t = i / (num_points - 1)
        lat = start_lat + (end_lat - start_lat) * t
        lon = start_lon + (end_lon - start_lon) * t
        coords.append([lon, lat])
        
    return distance_meters, duration_seconds, coords

class HOSSimulator:
    def __init__(self, start_time, initial_cycle_hours):
        self.current_time = start_time
        self.initial_cycle_hours = initial_cycle_hours
        self.cycle_hours_used = initial_cycle_hours
        
        # Shift variables
        self.driving_time_in_shift = 0.0
        self.elapsed_time_in_shift = 0.0
        self.driving_since_last_break = 0.0
        self.shift_active = False
        
        self.fuel_miles = 0.0
        self.total_trip_miles = 0.0
        self.timeline = [] # List of events
        
    def add_event(self, status, duration_hours, description, location_name, lat, lon):
        start = self.current_time
        end = start + timedelta(hours=duration_hours)
        
        event = {
            "status": status,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "duration": round(duration_hours, 2),
            "description": description,
            "location": location_name, # Might be empty, resolved at the end
            "lat": lat,
            "lon": lon,
            "trip_miles": round(self.total_trip_miles, 1)
        }
        self.timeline.append(event)
        
        # Update clocks
        if status in [3, 4]:
            self.cycle_hours_used += duration_hours
            if self.shift_active:
                self.elapsed_time_in_shift += duration_hours
            if status == 3:
                self.driving_time_in_shift += duration_hours
                self.driving_since_last_break += duration_hours
        else: # OFF/SB
            if self.shift_active:
                self.elapsed_time_in_shift += duration_hours
                
        self.current_time = end
        
    def trigger_pre_trip(self, location, lat, lon):
        self.shift_active = True
        self.elapsed_time_in_shift = 0.0
        self.driving_time_in_shift = 0.0
        self.driving_since_last_break = 0.0
        self.add_event(4, 0.5, "Pre-Trip Inspection", location, lat, lon)
        
    def trigger_post_trip(self, location, lat, lon):
        self.add_event(4, 0.5, "Post-Trip Inspection", location, lat, lon)
        self.shift_active = False
        
    def trigger_sleep_break(self, location, lat, lon):
        self.add_event(2, 10.0, "Sleeper Berth (10-hr rest)", location, lat, lon)
        self.driving_time_in_shift = 0.0
        self.elapsed_time_in_shift = 0.0
        self.driving_since_last_break = 0.0
        self.shift_active = False
        
    def trigger_rest_break(self, location, lat, lon):
        self.add_event(1, 0.5, "30-min Rest Break", location, lat, lon)
        self.driving_since_last_break = 0.0
        
    def trigger_restart_break(self, location, lat, lon):
        self.add_event(1, 34.0, "34-hour Restart (Off-Duty)", location, lat, lon)
        self.cycle_hours_used = 0.0
        self.driving_time_in_shift = 0.0
        self.elapsed_time_in_shift = 0.0
        self.driving_since_last_break = 0.0
        self.shift_active = False

    def trigger_fueling(self, location, lat, lon):
        self.add_event(4, 0.5, "Fueling truck", location, lat, lon)
        self.fuel_miles = 0.0

    def simulate_leg(self, coords, duration_seconds, distance_meters):
        if not coords:
            return
            
        total_leg_miles = (distance_meters / 1609.34)
        total_leg_hours = (duration_seconds / 3600.0) * 1.15 # Scale for commercial trucks
        
        if total_leg_hours == 0:
            return
            
        avg_speed = total_leg_miles / total_leg_hours
        n_coords = len(coords)
        hours_driven_on_leg = 0.0
        
        # Guard limit to prevent infinite loops
        iterations = 0
        max_iterations = 100
        
        while hours_driven_on_leg < total_leg_hours and iterations < max_iterations:
            iterations += 1
            
            if not self.shift_active:
                idx = min(int((hours_driven_on_leg / total_leg_hours) * n_coords), n_coords - 1)
                lon, lat = coords[idx]
                self.trigger_pre_trip("", lat, lon) # Geocode later
                
            rem_leg_hours = total_leg_hours - hours_driven_on_leg
            
            # Find the most limiting HOS constraint
            limits = []
            
            # 1. 11-hour driving limit
            avail_driving_shift = max(11.0 - self.driving_time_in_shift, 0.0)
            limits.append((avail_driving_shift, "11hr_limit"))
            
            # 2. 14-hour shift limit
            avail_shift_hours = max(14.0 - self.elapsed_time_in_shift, 0.0)
            limits.append((avail_shift_hours, "14hr_limit"))
            
            # 3. 8-hour driving since last break limit
            avail_before_break = max(8.0 - self.driving_since_last_break, 0.0)
            limits.append((avail_before_break, "8hr_break"))
            
            # 4. 70-hour cycle limit
            avail_cycle = max(70.0 - self.cycle_hours_used, 0.0)
            limits.append((avail_cycle, "70hr_limit"))
            
            # 5. Fueling limit (1000 miles limit)
            avail_fuel_miles = max(1000.0 - self.fuel_miles, 0.0)
            avail_fuel_hours = avail_fuel_miles / avg_speed if avg_speed > 0 else 999
            limits.append((avail_fuel_hours, "fuel_limit"))
            
            limit_hours, limit_reason = min(limits, key=lambda x: x[0])
            
            # If any limit is 0 (or near 0), we must trigger the stop immediately without driving
            if limit_hours < 0.02:
                idx_stop = min(int((hours_driven_on_leg / total_leg_hours) * n_coords), n_coords - 1)
                lon_stop, lat_stop = coords[idx_stop]
                
                # Check which limit we hit
                if self.cycle_hours_used >= 69.9:
                    self.trigger_restart_break("", lat_stop, lon_stop)
                elif self.driving_time_in_shift >= 10.9 or self.elapsed_time_in_shift >= 13.9:
                    self.trigger_sleep_break("", lat_stop, lon_stop)
                elif self.driving_since_last_break >= 7.9:
                    self.trigger_rest_break("", lat_stop, lon_stop)
                elif self.fuel_miles >= 995.0:
                    self.trigger_fueling("", lat_stop, lon_stop)
                else:
                    self.trigger_sleep_break("", lat_stop, lon_stop)
                continue
                
            drive_chunk = min(rem_leg_hours, limit_hours)
            
            if drive_chunk > 0:
                pct_after = (hours_driven_on_leg + drive_chunk) / total_leg_hours
                idx = min(int(pct_after * n_coords), n_coords - 1)
                lon, lat = coords[idx]
                
                chunk_miles = drive_chunk * avg_speed
                self.total_trip_miles += chunk_miles
                self.fuel_miles += chunk_miles
                
                self.add_event(3, drive_chunk, "Driving", "", lat, lon)
                hours_driven_on_leg += drive_chunk

def resolve_timeline_locations(timeline):
    """
    Reverse-geocodes stop locations in the timeline at the very end of the request.
    This avoids making duplicate API calls during the simulation loop and makes the execution super fast.
    """
    # Keep track of coordinates we have already reverse geocoded to save calls
    resolved_locations = {}
    
    for event in timeline:
        lat, lon = event["lat"], event["lon"]
        coord_key = (round(lat, 3), round(lon, 3))
        
        # If event has a preset location (e.g. pickup, dropoff, start), keep it
        if event["location"]:
            resolved_locations[coord_key] = event["location"]
            continue
            
        if coord_key not in resolved_locations:
            resolved_locations[coord_key] = reverse_geocode(lat, lon)
            
        event["location"] = resolved_locations[coord_key]

def split_timeline_by_day(timeline, start_date):
    """
    Slices the continuous event timeline into calendar days (midnight to midnight).
    Returns a dictionary keyed by day index (1, 2, 3...) containing events for that day.
    Each day starts at 00:00 and ends at 24:00 (summing to exactly 24.0 hours).
    """
    days = {}
    base_midnight = datetime(start_date.year, start_date.month, start_date.day)
    
    for event in timeline:
        ev_start = datetime.fromisoformat(event["start_time"])
        ev_end = datetime.fromisoformat(event["end_time"])
        
        current_ev_start = ev_start
        
        while current_ev_start < ev_end:
            day_offset = (current_ev_start - base_midnight).days
            day_idx = day_offset + 1
            
            next_midnight = base_midnight + timedelta(days=day_offset + 1)
            slice_end = min(ev_end, next_midnight)
            slice_duration = (slice_end - current_ev_start).total_seconds() / 3600.0
            
            if day_idx not in days:
                days[day_idx] = {
                    "date": (base_midnight + timedelta(days=day_offset)).strftime("%Y-%m-%d"),
                    "events": [],
                    "totals": {1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0},
                    "miles": 0.0
                }
                
            day_start_dt = base_midnight + timedelta(days=day_offset)
            rel_start_minutes = (current_ev_start - day_start_dt).total_seconds() / 60.0
            rel_end_minutes = (slice_end - day_start_dt).total_seconds() / 60.0
            
            sliced_event = {
                "status": event["status"],
                "start_time": current_ev_start.isoformat(),
                "end_time": slice_end.isoformat(),
                "duration": round(slice_duration, 2),
                "rel_start_minutes": round(rel_start_minutes, 1),
                "rel_end_minutes": round(rel_end_minutes, 1),
                "description": event["description"],
                "location": event["location"],
                "lat": event["lat"],
                "lon": event["lon"]
            }
            
            days[day_idx]["events"].append(sliced_event)
            days[day_idx]["totals"][event["status"]] += slice_duration
            
            if event["status"] == 3:
                full_duration = (ev_end - ev_start).total_seconds() / 3600.0
                if full_duration > 0:
                    fraction = slice_duration / full_duration
                    days[day_idx]["miles"] += round(fraction * (event["duration"] * 55.0), 1)
            
            current_ev_start = slice_end
            
    # Normalize totals to sum to exactly 24.0 hours
    for d_idx, d_data in days.items():
        total_sum = sum(d_data["totals"].values())
        if not math.isclose(total_sum, 24.0, abs_tol=0.05):
            largest_status = max(d_data["totals"], key=d_data["totals"].get)
            diff = 24.0 - total_sum
            d_data["totals"][largest_status] = round(d_data["totals"][largest_status] + diff, 2)
            
        for k in d_data["totals"]:
            d_data["totals"][k] = round(d_data["totals"][k], 2)
            
        d_data["miles"] = round(d_data["miles"], 1)
            
    return days

