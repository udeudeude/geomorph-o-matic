"""Independent dimensional checks for the sheetflow's unresolved raised bench.

The canonical elevation index is unitless. These are deliberately alternate
vertical hypotheses, not survey results or accessibility certifications.
"""
import json
import unittest
from pathlib import Path
from test_sheetflow_cave import occupancy

ROOT = Path(__file__).resolve().parents[1]
TILES = {t["id"]: t for t in json.loads((ROOT/"wide-blueprints.json").read_text())["tiles"]}
RISES = (0.25, 0.5, 1, 2)


class BenchDatumIndependentTests(unittest.TestCase):
    def test_three_real_grade_transitions_join_eight_raised_cells(self):
        tile = TILES["sagging_sheet"]
        occupied = occupancy(tile)
        levels = {
            tuple(p): level for level, points in tile["terrain"]["elevations"] for p in points
        }
        self.assertEqual(len(levels), 8)
        transitions = tile["terrain"]["steps"]
        self.assertEqual(len(transitions), 3)
        self.assertFalse(tile["terrain"].get("ramps"))
        for item in transitions:
            self.assertEqual(item["rise_feet"], 1)
            self.assertEqual(item["risers"], 2)
            self.assertEqual(item["rise_feet"]/item["risers"], 0.5)
            self.assertEqual(2.5/item["risers"], 1.25)
            a, b = item["edge"]
            a, b = tuple(a), tuple(b)
            self.assertIn(a, occupied)
            self.assertIn(b, occupied)
            self.assertEqual(abs(a[0]-b[0])+abs(a[1]-b[1]), 1)
            self.assertEqual(abs(levels.get(a, 0)-levels.get(b, 0)), 1)
        self.assertEqual(len({tuple(p) for item in transitions for p in item["edge"] if tuple(p) in levels}), 3)

    def test_grade_and_crown_options_do_not_disguise_levels_as_measured_feet(self):
        tile = TILES["sagging_sheet"]
        baseline = tile["roof_scenario"]["baseline_feet"]
        self.assertEqual(baseline, 6.5)
        self.assertEqual([100*rise/2.5 for rise in RISES], [10, 20, 40, 80])
        self.assertEqual([baseline-rise for rise in RISES], [6.25, 6, 5.5, 4.5])
        self.assertEqual([100*rise/2.5 <= 12.5 for rise in RISES],
                         [True, False, False, False])
        raised = {tuple(p) for level, points in tile["terrain"]["elevations"] for p in points}
        low_roof = {tuple(p) for zone in tile["roof_scenario"]["zones"] for p in zone["cells"]}
        self.assertFalse(raised & low_roof)

    def test_every_cave_mouth_remains_on_original_floor_level(self):
        offsets = (4, 5, 14, 15)
        mouths = {(n, y) for n in offsets for y in (0, 19)}
        mouths |= {(x, n) for x in (0, 19) for n in offsets}
        for tile in TILES.values():
            raised = {tuple(p) for level, points in tile.get("terrain", {}).get("elevations", []) for p in points}
            self.assertFalse(raised & mouths, tile["id"])


if __name__ == "__main__":
    unittest.main()
