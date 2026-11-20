"""Independent cut audit from source cells; zero reliance on generated SVG or Node code."""
import unittest
from test_wide_authored_vaults import TILES,independent_roof
from test_sheetflow_cave import occupancy,edge

CUTS={"braided_lava":(9,6,11),"sagging_sheet":(12,14,18),"split_spine":(4,7,13)}
class TransverseSectionIndependentTests(unittest.TestCase):
 def test_every_sample_is_real_adjacent_floor_with_a_common_z(self):
  for name,(row,left,right) in CUTS.items():
   tile=TILES[name]
   cells=set(occupancy(tile))
   samples=[(x,row) for x in range(left,right+1)]
   self.assertTrue(all(p in cells for p in samples),(name,samples))
   if name=="sagging_sheet":
    roof={p:tile["roof_scenario"]["baseline_feet"] for p in cells}
    for zone in tile["roof_scenario"]["absolute_vault"]["zones"]:
     roof.update((tuple(p),zone["roof_elevation_feet"]) for p in zone["cells"])
    floor={tuple(p):float(z) for z,group in tile["terrain"]["elevations"] for p in group}
   else:
    _,roof,_,_=independent_roof(tile)
    floor={}
   self.assertTrue(all(roof[p]-floor.get(p,0)>=2.5 for p in samples))
   self.assertTrue(all(abs(roof[a]-roof[b])<=.5 for a,b in zip(samples,samples[1:])))
 def test_lava_bench_profile_has_only_two_real_stair_thresholds(self):
  tile=TILES["sagging_sheet"]
  row,left,right=CUTS["sagging_sheet"]
  cells=[(x,row) for x in range(left,right+1)]
  elevations={tuple(p):float(z) for z,group in tile["terrain"]["elevations"] for p in group}
  self.assertEqual([elevations.get(p,0) for p in cells],[0,1,1,1,0])
  stairs={edge(tuple(a),tuple(b)) for stair in tile["terrain"]["steps"] for a,b in [stair["edge"]]}
  changes={edge(a,b) for a,b in zip(cells,cells[1:]) if elevations.get(a,0)!=elevations.get(b,0)}
  self.assertEqual(changes,stairs & {edge(a,b) for a,b in zip(cells,cells[1:])})
  self.assertEqual(len(changes),2)
if __name__=="__main__":unittest.main()
