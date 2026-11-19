"""Independent cave-symbol and collapse validation, deliberately separate from JavaScript."""
import copy
import json
import unittest
from pathlib import Path

from validate import validate, validate_terrain, footprint


def floor(tile):
    occupied = {}
    for name, _, shape in tile["rooms"]:
        for position in footprint(shape):
            assert position not in occupied
            occupied[position] = name
    for route in tile["routes"]:
        for a, b in zip(route["points"], route["points"][1:]):
            for x in range(min(a[0], b[0]), max(a[0], b[0]) + 1):
                for y in range(min(a[1], b[1]), max(a[1], b[1]) + 1):
                    assert occupied.get((x, y), "hall") == "hall"
                    occupied[(x, y)] = "hall"
    return occupied

DATA = json.loads((Path(__file__).resolve().parents[1] / "blueprints.json").read_text())
CAVE = next(tile for tile in DATA["tiles"] if tile["id"] == "hollow_causeway")


class CaveIllustrationTests(unittest.TestCase):
    def setUp(self):
        self.tile = copy.deepcopy(CAVE)
        self.cells = floor(self.tile)

    def test_breakdown_and_deposits_have_independent_structural_validation(self):
        result = validate(self.tile)
        self.assertEqual(result["cave_choke_edges"], 1)
        self.assertEqual(result["cave_detail_cells"], 12)
        self.assertEqual(result["bridges"], 1)
        self.assertEqual(result["water_cells"], 13)

    def test_mutated_breakdown_edges_rejected(self):
        bad = (
            [[[5, 10], [5, 11]], [[5, 11], [5, 10]]],
            [[[5, 10], [7, 10]]],
            [[[8, 9], [9, 9]]],
            [[[4, 0], [4, 1]]],
        )
        for chokes in bad:
            with self.subTest(chokes=chokes), self.assertRaises(AssertionError):
                self.tile["terrain"]["chokes"] = chokes
                validate_terrain(self.tile, self.cells)

    def test_geology_cannot_occupy_water_ladder_or_duplicate_floor(self):
        bad = (
            {"gravel": [[8, 9]]},
            {"breakdown": [[4, 0]]},
            {"flowstone": [[8, 8]]},
            {"scallops": [[2, 18]]},
            {"gravel": [[3, 13], [3, 13]]},
            {"nonexistent": [[3, 13]]},
        )
        for details in bad:
            with self.subTest(details=details), self.assertRaises(AssertionError):
                self.tile = copy.deepcopy(CAVE)
                self.tile["cave_details"] = details
                validate_terrain(self.tile, self.cells)


if __name__ == "__main__":
    unittest.main()
