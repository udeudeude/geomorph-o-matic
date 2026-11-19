"""Independent checks of lower conduit dimensions and uncharted outlet limits."""
import copy
import json
import unittest
from pathlib import Path
from validate import validate, validate_lower_grade, validate_subfloor_relay

TILES = json.loads((Path(__file__).resolve().parents[1] / "blueprints.json").read_text())["tiles"]
RIFT = next(t for t in TILES if t["id"] == "riftwater_lock")
POSTERN = next(t for t in TILES if t["id"] == "postern_bastion")


class LowerConduitContracts(unittest.TestCase):
    def test_paired_source_and_relay_pass_independent_validation(self):
        source = validate(RIFT)
        receiver = validate(POSTERN)
        self.assertEqual(source["lower_tailrace_cells"], 16)
        self.assertEqual(receiver["lower_relay_cells"], 23)
        self.assertEqual(RIFT["hydrology"]["tailrace"]["terminus"], [6, 19])
        self.assertEqual(POSTERN["hydrology"]["subfloor_relay"]["cells"][0], [6, 0])
        # Both connect at x=6 without claiming a ninth surface doorway.
        self.assertEqual(RIFT["hydrology"]["tailrace"]["boundary_edge"]["offset"],
                         POSTERN["hydrology"]["subfloor_relay"]["entry_edge"]["offset"])

    def test_reject_unmeasured_tailwater_or_reverse_invert(self):
        for damage in ("flat", "uphill", "steep", "drowned", "no_lip", "missing"):
            with self.subTest(damage=damage):
                bad = copy.deepcopy(RIFT)
                z = bad["hydrology"]["tailrace"]["grade"]
                if damage == "flat":
                    z["inverts_ft"][1] = z["inverts_ft"][0]
                elif damage == "uphill":
                    z["inverts_ft"][1] = z["inverts_ft"][0] + .01
                elif damage == "steep":
                    z["inverts_ft"][1] -= .35
                elif damage == "drowned":
                    z["max_tailwater_ft"] = -.8
                elif damage == "no_lip":
                    z["drop_lip_ft"] = -10
                else:
                    z["inverts_ft"].pop()
                with self.assertRaises(AssertionError):
                    validate(bad)

    def test_reject_false_boundary_relay_and_unearned_discharge(self):
        for damage in ("mismatch", "missing_edge", "branched", "loop", "outfall", "grade", "lip", "unmapped", "highwater"):
            with self.subTest(damage=damage):
                bad = copy.deepcopy(POSTERN)
                m = bad["hydrology"]["subfloor_relay"]
                if damage == "mismatch":
                    m["entry_edge"]["offset"] = 12
                elif damage == "missing_edge":
                    m.pop("entry_edge")
                elif damage == "branched":
                    m["cells"][4] = [13, 4]
                elif damage == "loop":
                    m["cells"].append([11, 7])
                elif damage == "outfall":
                    m["discharge_status"] = "complete"
                elif damage == "lip":
                    m["outfall"]["exit_edge"]["offset"] = 11
                elif damage == "unmapped":
                    m["outfall"]["receiver_documentation"] = "proven"
                elif damage == "highwater":
                    m["outfall"]["water_levels_ft"]["high"] = -9
                else:
                    m["grade"]["inverts_ft"][4] = -9
                with self.assertRaises(AssertionError):
                    validate_subfloor_relay(bad)

    def test_lower_seam_requires_exact_south_boundary_not_ordinary_portal(self):
        for damage in ("offset", "interior", "missing_edge"):
            bad = copy.deepcopy(RIFT)
            m = bad["hydrology"]["tailrace"]
            if damage == "offset":
                m["boundary_edge"]["offset"] = 4
            elif damage == "interior":
                m["cells"][-1] = [11, 18]
                m["terminus"] = [11, 18]
            else:
                m.pop("boundary_edge")
            with self.subTest(damage=damage), self.assertRaises(AssertionError):
                validate(bad)


    def test_reject_collector_through_vault_and_receiver_through_toll_footing(self):
        from validate import validate_buried_foundations
        source = copy.deepcopy(RIFT)
        source["hydrology"]["tailrace"]["cells"][12] = [11, 17]
        with self.assertRaises(AssertionError):
            validate_buried_foundations(source)
        receiver = copy.deepcopy(POSTERN)
        receiver["hydrology"]["subfloor_relay"]["cells"][6] = [5, 4]
        with self.assertRaises(AssertionError):
            validate_buried_foundations(receiver)


if __name__ == "__main__":
    unittest.main()
