"""Independent validation of a natural cave, unframed thresholds and honest dry routes."""
import copy
import json
import unittest
from pathlib import Path
from validate import validate,validate_terrain,validate_vertical,footprint

DATA=json.loads((Path(__file__).resolve().parents[1]/"blueprints.json").read_text())
CAVE=next(t for t in DATA["tiles"] if t["id"]=="hollow_causeway")

def floor(tile):
    occupied={}
    for name,_,shape in tile["rooms"]:
        for p in footprint(shape):
            assert p not in occupied
            occupied[p]=name
    for route in tile["routes"]:
        for a,b in zip(route["points"],route["points"][1:]):
            for x in range(min(a[0],b[0]),max(a[0],b[0])+1):
                for y in range(min(a[1],b[1]),max(a[1],b[1])+1):
                    assert occupied.get((x,y),"hall")=="hall"
                    occupied[(x,y)]="hall"
    return occupied

class HollowCausewayTests(unittest.TestCase):
    def setUp(self):
        self.tile=copy.deepcopy(CAVE)
        self.occupied=floor(self.tile)

    def test_cave_survives_full_independent_validation(self):
        outcome=validate(self.tile)
        self.assertEqual(outcome["rooms"],6)
        self.assertEqual(outcome["water_cells"],13)
        self.assertEqual(outcome["bridges"],1)
        self.assertEqual(outcome["stacked_floor_cells"],3)
        self.assertEqual(outcome["vertical_connections"],2)

    def test_open_passages_are_explicit_and_safely_checked(self):
        openings=[entry for entry in self.tile["doors"] if entry[3]=="opening"]
        self.assertEqual(len(openings),10)
        self.tile["doors"][0][2]=17
        with self.assertRaises(AssertionError):
            validate(self.tile)

    def test_water_not_just_decorative_and_arch_stays_in_room(self):
        self.tile["terrain"]["bridges"].append([8,8])
        with self.assertRaises(AssertionError):
            validate_terrain(self.tile,self.occupied)
        self.tile=copy.deepcopy(CAVE)
        self.tile["vertical"]["decks"][0]["cells"].append([13,8])
        with self.assertRaises(AssertionError):
            validate_vertical(self.tile,self.occupied)

if __name__=="__main__":
    unittest.main()
