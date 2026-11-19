"""Independent Python checks guard against invalid environment metadata."""
import unittest
from validate import validate_terrain

class TerrainValidationTests(unittest.TestCase):
    def setUp(self):
        self.cells={(x,y):'hall' for x in range(7) for y in range(6)}
        self.tile={'id':'unit','terrain':{}}

    def check_invalid(self, spec):
        self.tile['terrain']=spec
        with self.assertRaises(AssertionError):
            validate_terrain(self.tile,self.cells)

    def test_empty_is_backward_compatible(self):
        self.assertEqual(validate_terrain(self.tile,self.cells)['water_cells'],0)

    def test_water_and_bridge_must_agree(self):
        self.check_invalid({'bridges':[[2,2]]})
        self.check_invalid({'water':[[2,2],[2,2]]})
        self.check_invalid({'water':[[22,3]]})

    def test_levels_and_ramps_are_actual_connections(self):
        self.check_invalid({'elevations':[[1,[[2,2]]],[2,[[2,2]]]]})
        self.check_invalid({'ramps':[[[2,2],[4,2]]]})
        self.check_invalid({'elevations':[[2,[[2,2]]]],'ramps':[[[1,2],[2,2]]]})

    def test_no_portal_flooding_or_cliff_edges(self):
        self.check_invalid({'water':[[4,0]]})
        self.check_invalid({'elevations':[[1,[[4,0]]]]})

    def test_bridges_are_straight_and_reachable(self):
        self.check_invalid({'water':[[2,2],[3,2],[3,3]],'bridges':[[2,2],[3,2],[3,3]]})
        self.tile['terrain']={'water':[[2,2],[2,3]],'bridges':[[2,2],[2,3]]}
        self.assertEqual(validate_terrain(self.tile,self.cells)['bridges'],2)

if __name__=='__main__':
    unittest.main()
