"""Independent source-to-report validation for the three unfinished wide caves."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def source():
    return {t["id"]: t for t in json.loads((ROOT / "wide-blueprints.json").read_text())["tiles"]}


def occupied(tile):
    cells = set()
    for _, _, shape in tile["rooms"]:
        for y, x1, x2 in shape["rows"]:
            cells.update((x, y) for x in range(x1, x2 + 1))
    for route in tile["routes"]:
        for a, b in zip(route["points"], route["points"][1:]):
            ax, ay = a
            bx, by = b
            assert ax == bx or ay == by, "Cannot infer diagonal floor"
            for x in range(min(ax, bx), max(ax, bx) + 1):
                for y in range(min(ay, by), max(ay, by) + 1):
                    cells.add((x, y))
    return cells


def physical_floor(tile, cell):
    for height, cells in tile.get("terrain", {}).get("elevations", []):
        if list(cell) in cells:
            return height
    return 0


def stair_edges(tile):
    return {
        frozenset(tuple(p) for p in step["edge"]): step
        for step in tile.get("terrain", {}).get("steps", [])
    }


class WideGeologyIndependentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # The reports are rebuilt, so stale checked-in output cannot pass.
        for program in ("wide-rock-webs.js", "wide-absolute-walking-profiles.js"):
            subprocess.run(["node", program], cwd=ROOT, check=True, capture_output=True, text=True)
        cls.tiles = source()
        cls.webs = json.loads((ROOT / "reports/wide-rock-webs.json").read_text())
        cls.profiles = json.loads((ROOT / "reports/wide-absolute-walking-profiles.json").read_text())

    def test_every_reported_rock_web_is_real_and_exactly_one_rock_cell_wide(self):
        self.assertEqual(set(self.tiles), {t["tile"] for t in self.webs["tiles"]})
        for report in self.webs["tiles"]:
            tile = self.tiles[report["tile"]]
            floor = occupied(tile)
            self.assertEqual(report["source_floor_cells"], len(floor))
            self.assertEqual(report["narrow_web_cross_sections"], len(report["cross_sections"]))
            for rock in report["cross_sections"]:
                x, y = rock["rock_cell"]
                self.assertNotIn((x, y), floor)
                self.assertTrue(2 <= x <= 17 and 2 <= y <= 17)
                banks = [tuple(p) for p in rock["opposite_floor_cells"]]
                self.assertTrue(all(p in floor for p in banks))
                self.assertEqual(rock["rock_web_plan_width_feet"], 2.5)
                if rock["axis"] == "east-west":
                    self.assertEqual(banks, [(x-1, y), (x+1, y)])
                else:
                    self.assertEqual(banks, [(x, y-1), (x, y+1)])
                d = rock["walking_bypass_half_cells"]
                if d is not None:
                    self.assertGreaterEqual(d, 2)
                    self.assertEqual(rock["walking_bypass_feet"], d * 2.5)

    def test_absolute_routes_are_occupied_and_floor_heights_are_independent(self):
        self.assertEqual(set(self.tiles), {p["tile"] for p in self.profiles["profiles"]})
        for profile in self.profiles["profiles"]:
            tile = self.tiles[profile["tile"]]
            floor = occupied(tile)
            samples = profile["stations"]
            self.assertEqual(samples[0]["cell"], [4, 0])
            self.assertEqual(samples[0]["roof_z_feet"], 6.5)
            self.assertEqual(profile["route_length_feet"], (len(samples)-1)*2.5)
            steps = stair_edges(tile)
            actual_steps = []
            for i, p in enumerate(samples):
                at = tuple(p["cell"])
                self.assertIn(at, floor)
                self.assertEqual(p["floor_z_feet"], physical_floor(tile, at))
                self.assertAlmostEqual(p["local_clearance_feet"], p["roof_z_feet"]-p["floor_z_feet"])
                self.assertGreaterEqual(p["local_clearance_feet"], 2.5)
                if i:
                    prev = tuple(samples[i-1]["cell"])
                    self.assertEqual(abs(prev[0]-at[0])+abs(prev[1]-at[1]), 1)
                    self.assertNotIn(
                        frozenset((prev, at)),
                        {frozenset(tuple(x) for x in e) for e in tile.get("terrain", {}).get("chokes", [])},
                    )
                    rise = abs(p["floor_z_feet"]-samples[i-1]["floor_z_feet"])
                    step = steps.get(frozenset((prev, at)))
                    if rise:
                        self.assertIsNotNone(step)
                        self.assertEqual(step["rise_feet"], rise)
                    if step:
                        actual_steps.append((i, step))
            self.assertEqual(profile["real_stair_crossings"], len(actual_steps))
            self.assertEqual({c["after_station"] for c in profile["stair_crossings"]},
                             {i for i, _ in actual_steps})

    def test_sheetflow_end_is_actual_stooped_and_reached_via_stairs(self):
        sheet = next(p for p in self.profiles["profiles"] if p["tile"] == "sagging_sheet")
        self.assertEqual(sheet["endpoints"]["end"], [17, 13])
        self.assertEqual(sheet["ascent_feet"], 1)
        self.assertEqual(sheet["stations"][-1]["roof_z_feet"], 6.5)
        self.assertEqual(sheet["stations"][-1]["local_clearance_feet"], 5.5)
        self.assertGreaterEqual(sheet["real_stair_crossings"], 1)


if __name__ == "__main__":
    unittest.main()
