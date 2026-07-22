from django.test import TestCase
from datetime import datetime, timedelta
from .hos_simulator import HOSSimulator, split_timeline_by_day

class HOSSimulatorTestCase(TestCase):
    def setUp(self):
        self.start_time = datetime(2026, 7, 20, 6, 0, 0)
        
    def test_basic_short_trip(self):
        # 100 miles, ~2 hours driving. No rest break needed, no sleep needed.
        # Start cycle 0
        sim = HOSSimulator(self.start_time, 0.0)
        coords = [(-88.0, 44.0), (-88.1, 44.1)]
        # Assume 120 miles distance, 2 hours (7200 seconds) duration
        sim.simulate_leg(coords, 7200, 193121) # ~120 miles
        
        # Verify events
        # Should start with Pre-Trip Inspection (0.5 hours)
        # Followed by Driving (2.3 hours scaled: 2.0 * 1.15)
        self.assertEqual(len(sim.timeline), 2)
        self.assertEqual(sim.timeline[0]["description"], "Pre-Trip Inspection")
        self.assertEqual(sim.timeline[1]["description"], "Driving")
        self.assertAlmostEqual(sim.timeline[1]["duration"], 2.3)
        self.assertAlmostEqual(sim.cycle_hours_used, 2.8) # 0.5 + 2.3
        
    def test_long_trip_requiring_sleep(self):
        # 800 miles, ~15 hours driving. Needs rest break and sleep break.
        sim = HOSSimulator(self.start_time, 10.0)
        coords = [(-88.0, 44.0), (-89.0, 43.0), (-90.0, 42.0)]
        # Duration 13 hours = 46800 seconds. Scaled is 13 * 1.15 = 14.95 hours.
        sim.simulate_leg(coords, 46800, 1287480) # ~800 miles
        
        # Should include:
        # - Pre-trip (0.5 hr) (Elapsed = 0.5)
        # - Driving 7.5 hrs (Cumulative driving = 7.5, Elapsed = 8.0)
        # - 30-min break (0.5 hr) (Elapsed = 8.5)
        # - Driving 3.0 hrs (Cumulative driving = 10.5, Elapsed = 11.5)
        # - 10-hr sleep (since next chunk would exceed 11 hrs driving or 14 hrs shift)
        # - Pre-trip (0.5 hr)
        # - Driving remainder
        descriptions = [e["description"] for e in sim.timeline]
        self.assertIn("30-min Rest Break", descriptions)
        self.assertIn("Sleeper Berth (10-hr rest)", descriptions)
        
    def test_cycle_limit_requiring_restart(self):
        # Start with 68 hours already used. Only 2 hours available.
        # Try to drive 5 hours.
        sim = HOSSimulator(self.start_time, 68.0)
        coords = [(-88.0, 44.0), (-88.5, 44.5)]
        # Driving 4 hours = 14400 seconds (scaled 4.6 hours)
        sim.simulate_leg(coords, 14400, 321868) # ~200 miles
        
        descriptions = [e["description"] for e in sim.timeline]
        self.assertIn("34-hour Restart (Off-Duty)", descriptions)
        self.assertAlmostEqual(sim.cycle_hours_used, 3.6, places=1) # reset to 0 at restart, then drove remainder (3.1) + pre-trip (0.5)
        
    def test_daily_split(self):
        sim = HOSSimulator(self.start_time, 0.0)
        coords = [(-88.0, 44.0), (-88.5, 44.5)]
        sim.simulate_leg(coords, 14400, 321868)
        
        # Add 24-hr padding to end
        sim.add_event(1, 24.0, "Off-Duty Pad", "Test Loc", 44.5, -88.5)
        
        daily_logs = split_timeline_by_day(sim.timeline, self.start_time)
        
        # Verify each day's totals sum to 24.0
        for day_num, day_data in daily_logs.items():
            day_sum = sum(day_data["totals"].values())
            self.assertAlmostEqual(day_sum, 24.0, places=1)
