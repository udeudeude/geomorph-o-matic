"""Independent, data-level checks for the Scoured Siphon interpretive cut plate."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TILE = next(t for t in json.loads((ROOT / "blueprints.json").read_text())["tiles"]
            if t["id"] == "scoured_siphon")


def occupied(tile):
    cells = set()
    for _, _, shape in tile["rooms"]:
        for y, x1, x2 in shape["rows"]:
            cells.update((x, y) for x in range(x1, x2 + 1))
    for route in tile["routes"]:
        for (x1, y1), (x2, y2) in zip(route["points"], route["points"][1:]):
            if x1 != x2 and y1 != y2:
                raise ValueError("Section cannot trust diagonal hall")
            cells.update((x, y) for x in range(min(x1, x2), max(x1, x2) + 1)
                         for y in range(min(y1, y2), max(y1, y2) + 1))
    return cells


class ProfileCorrespondence(unittest.TestCase):
    def test_both_section_lines_are_walkable_in_canonical_data(self):
        cells = occupied(TILE)
        self.assertTrue(all((10, y) in cells for y in range(7, 13)))
        self.assertTrue(all((x, 4) in cells for x in range(12, 19)))

    def test_bridge_and_water_actually_intersect_first_cut(self):
        water = {tuple(p) for p in TILE["terrain"]["water"]}
        bridge = {tuple(p) for p in TILE["terrain"]["bridges"]}
        crossed = {(10, y) for y in range(7, 13)}
        self.assertEqual(crossed & water, {(10, 9)})
        self.assertEqual(crossed & bridge, {(10, 9)})
        self.assertTrue(bridge <= water)

    def test_gallery_cut_ends_at_real_raised_to_ground_ramp(self):
        heights = {}
        for level, points in TILE["terrain"]["elevations"]:
            for p in points:
                self.assertNotIn(tuple(p), heights)
                heights[tuple(p)] = level
        self.assertEqual([heights.get((x, 4), 0) for x in range(12, 19)],
                         [1, 1, 1, 1, 1, 1, 0])
        ramps = {frozenset(map(tuple, edge)) for edge in TILE["terrain"]["ramps"]}
        self.assertIn(frozenset({(17, 4), (18, 4)}), ramps)

    def test_referenced_floor_cuts_do_not_change_modular_edge_mouths(self):
        floor = occupied(TILE)
        boundary = {(x, y) for x, y in floor if x in (0, 19) or y in (0, 19)}
        self.assertEqual(boundary,
                         {(4, 0), (15, 0), (4, 19), (15, 19),
                          (0, 4), (0, 15), (19, 4), (19, 15)})


if __name__ == "__main__":
    unittest.main()
