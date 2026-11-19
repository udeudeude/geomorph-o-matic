"""Independent waterworks contract tests. No JavaScript geometry assumptions."""
import copy
import json
import unittest
from pathlib import Path
from validate import validate, validate_waterworks

ROOT = Path(__file__).resolve().parents[1]


class WaterworksValidationTests(unittest.TestCase):
    def setUp(self):
        self.cells = {(2, 5): "turbine", (3, 5): "turbine",
                      (4, 5): "hall"}
        self.tile = {
            "id": "fixture",
            "terrain": {"water": [[2, 5]]},
            "hydrology": {
                "channels": [[2, 5], [3, 5]],
                "intake": [2, 5], "outlet": [3, 5],
                "gates": [{
                    "id": "sluice", "kind": "sluice", "default": "closed",
                    "a": [2, 5], "b": [3, 5]
                }],
                "controls": [{
                    "id": "crank", "gate": "sluice",
                    "kind": "handwheel", "at": [4, 5]
                }]
            }
        }

    def test_valid_channel_and_dry_control(self):
        result = validate_waterworks(self.tile, self.cells)
        self.assertEqual(result["engineered_channel_cells"], 2)
        self.assertEqual(result["sluice_controls"], 1)

    def test_reject_duplicate_and_unbounded_channel(self):
        for extra in ([3, 5], [17, 17]):
            tile = copy.deepcopy(self.tile)
            tile["hydrology"]["channels"].append(extra)
            with self.assertRaises(AssertionError):
                validate_waterworks(tile, self.cells)

    def test_reject_uncontrolled_shutter_or_flooded_control(self):
        for change in (
            lambda t: t["hydrology"].update({"controls": []}),
            lambda t: t["hydrology"]["controls"][0].update({"at": [2, 5]}),
            lambda t: t["hydrology"]["gates"][0].update({"b": [4, 5]}),
        ):
            tile = copy.deepcopy(self.tile)
            change(tile)
            with self.assertRaises(AssertionError):
                validate_waterworks(tile, self.cells)

    def test_masonry_boundary_requires_explicit_culvert(self):
        tile = copy.deepcopy(self.tile)
        cells = dict(self.cells)
        cells[(3, 5)] = "hall"
        with self.assertRaises(AssertionError):
            validate_waterworks(tile, cells)
        tile["hydrology"]["culverts"] = [[[2, 5], [3, 5]]]
        self.assertEqual(validate_waterworks(tile, cells)["engineered_channel_cells"], 2)

    def test_real_riftwater_blueprint_passes_independent_full_validation(self):
        tiles = json.loads((ROOT / "blueprints.json").read_text())["tiles"]
        result = validate(next(t for t in tiles if t["id"] == "riftwater_lock"))
        self.assertEqual(result["engineered_channel_cells"], 9)
        self.assertEqual(result["sluice_controls"], 3)


if __name__ == "__main__":
    unittest.main()
