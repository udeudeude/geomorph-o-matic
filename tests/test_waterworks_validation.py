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

    def test_partitions_reject_short_circuits_and_closed_shutter_bypass(self):
        tile = copy.deepcopy(self.tile)
        tile["hydrology"]["channels"].append([3, 6])
        tile["hydrology"]["channels"].append([2, 6])
        tile["hydrology"]["outlet"] = [3, 6]
        cells = dict(self.cells)
        cells[(3, 6)] = cells[(2, 6)] = "turbine"
        cells[(2, 5)] = cells[(3, 5)] = "turbine"
        tile["hydrology"]["stages"] = [{
            "id": "release", "add_water": [[3, 5]],
            "gate_states": {"sluice": "open"}, "surface_level": 1
        }]
        # First baseline tests valid under separate masonry partitions.
        tile["terrain"]["barriers"] = [[[2, 5], [2, 6]], [[3, 5], [3, 6]]]
        # The subchannel endpoint becomes disconnected when its only top access is partitioned.
        with self.assertRaises(AssertionError):
            validate_waterworks(tile, cells)
        # The actual Riftwater partitions allow each shutter to fill only its own pocket.
        tiles = json.loads((ROOT / "blueprints.json").read_text())["tiles"]
        rift = next(t for t in tiles if t["id"] == "riftwater_lock")
        self.assertEqual(validate(rift)["hydraulic_partitions"], 2)
        for corrupt in ("no_partitions", "gate_overlap", "wrong_first_gate"):
            bad = copy.deepcopy(rift)
            if corrupt == "no_partitions":
                bad["terrain"]["barriers"] = []
                # Each isolated shutter would now wet all three pockets.
                with self.assertRaises(AssertionError):
                    validate(bad)
                continue
            if corrupt == "gate_overlap":
                bad["terrain"]["barriers"][0] = [[9, 10], [9, 11]]
            else:
                bad["hydrology"]["stages"][0]["gate_states"] = {"east_shutter": "open"}
            with self.assertRaises(AssertionError):
                validate(bad)

    def test_real_riftwater_blueprint_passes_independent_full_validation(self):
        tiles = json.loads((ROOT / "blueprints.json").read_text())["tiles"]
        result = validate(next(t for t in tiles if t["id"] == "riftwater_lock"))
        self.assertEqual(result["engineered_channel_cells"], 9)
        self.assertEqual(result["sluice_controls"], 3)

    def test_lower_tailrace_requires_single_directed_route_and_one_drop_per_gate(self):
        tiles = json.loads((ROOT / "blueprints.json").read_text())["tiles"]
        rift = next(t for t in tiles if t["id"] == "riftwater_lock")
        report = validate(rift)
        self.assertEqual(report["lower_tailrace_cells"], 10)
        self.assertEqual(report["lower_tailrace_pickups"], 3)
        for kind in ("missing_drop", "headwater_bypass", "loop", "jump",
                     "false_level", "backflow", "wrong_outfall", "boundary"):
            bad = copy.deepcopy(rift)
            spec = bad["hydrology"]["tailrace"]
            if kind == "missing_drop":
                spec["pickups"].pop()
            elif kind == "headwater_bypass":
                spec["pickups"][0] = [10, 10]
            elif kind == "loop":
                spec["cells"].append([11, 17])
            elif kind == "jump":
                spec["cells"].pop(5)
            elif kind == "false_level":
                spec["level"] = 0
            elif kind == "backflow":
                spec["hydraulic_separation"] = "open_pipe"
            elif kind == "wrong_outfall":
                spec["terminus"] = [10, 18]
            elif kind == "boundary":
                spec["cells"][5] = [0, 13]
            with self.subTest(kind=kind), self.assertRaises(AssertionError):
                validate(bad)



if __name__ == "__main__":
    unittest.main()
