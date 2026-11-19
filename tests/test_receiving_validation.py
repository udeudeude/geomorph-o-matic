"""Mutation-resistant independent check of the exterior receiving reach."""
import copy
import json
import unittest
from pathlib import Path
from receiving_validation import verify_receiver
BASE = Path(__file__).resolve().parents[1]
DATA = json.loads((BASE / "blueprints.json").read_text())
ANNEX = json.loads((BASE / "examples/receiving_annex.json").read_text())
class ReceivingValidationTests(unittest.TestCase):
    def test_matched_but_unfinished(self):
        result = verify_receiver(DATA, ANNEX)
        self.assertEqual(result["mapped_stations"], 20)
        self.assertTrue(result["unverified_downstream"])
    def test_reject_invalid_geometry_and_water(self):
        def changed(edit):
            a=copy.deepcopy(ANNEX);edit(a);return a
        tests = [
            lambda a:a["stations"].__setitem__(9,[9,8]),
            lambda a:a["bed_ft"].__setitem__(3,a["bed_ft"][2]),
            lambda a:a["reaches"][1].__setitem__("first",5),
            lambda a:a["reaches"][2].__setitem__("clear_width_ft",2),
            lambda a:a["upper_terrace"]["path"].__setitem__(7,[9,9]),
            lambda a:a["receiving_levels_ft"].__setitem__("high",-8),
            lambda a:a["upper_terrace"]["bridge_access"].pop(),
            lambda a:a["upper_terrace"]["south_footpath"].__setitem__(1,[12,9]),
            lambda a:a["desilting_pocket"]["inspection_steps"].__setitem__(1,[10,9]),
            lambda a:a.__setitem__("status","built"),
            lambda a:a["entry_edge"].__setitem__("offset",4)
        ]
        for t in tests:
            with self.subTest(edit=t), self.assertRaises((AssertionError,ValueError)):
                verify_receiver(DATA,changed(t))
if __name__ == "__main__":
    unittest.main()
