"""Independent absolute roof-datum geometry and posture checks from raw blueprint cells."""
import json
import unittest
from pathlib import Path
from test_sheetflow_cave import occupancy,entrances,navigate,edge
TILE=next(t for t in json.loads((Path(__file__).resolve().parents[1]/"wide-blueprints.json").read_text())["tiles"] if t["id"]=="sagging_sheet")
class AbsoluteVaultTests(unittest.TestCase):
 def test_plan_registered_ceiling_and_floor_share_a_real_datum(self):
  floor=set(occupancy(TILE))
  scenario=TILE["roof_scenario"]
  s=scenario["absolute_vault"]
  levels={tuple(p):v for v,cells in TILE["terrain"]["elevations"] for p in cells}
  self.assertEqual(len(levels),8)
  roof={p:scenario["baseline_feet"] for p in floor}
  touched=set()
  for zone in s["zones"]:
   for pair in zone["cells"]:
    p=tuple(pair)
    self.assertIn(p,floor)
    self.assertNotIn(p,touched)
    touched.add(p)
    roof[p]=zone["roof_elevation_feet"]
  self.assertEqual({roof[p]-levels.get(p,0) for p in levels},{5.5,6,6.5})
  self.assertEqual(sum(roof[p]-levels.get(p,0)<6 for p in floor),1)
  low={tuple(p) for z in scenario["zones"] for p in z["cells"]}
  for x,y in floor-low:
   for q in ((x+1,y),(x,y+1)):
    if q in roof and q not in low:
     self.assertLessEqual(abs(roof[(x,y)]-roof[q]),.5)
  mouths={(x,y) for x in (0,19) for y in (4,5,14,15)}
  mouths|={(x,y) for y in (0,19) for x in (4,5,14,15)}
  for p in mouths:
   self.assertEqual(roof[p],6.5)
   self.assertEqual(levels.get(p,0),0)
 def test_stoop_is_a_physical_local_restriction_not_a_blocked_edge(self):
  floor=occupancy(TILE)
  s=TILE["roof_scenario"]
  levels={tuple(p):v for v,cells in TILE["terrain"]["elevations"] for p in cells}
  roof={p:s["baseline_feet"] for p in floor}
  for zone in s["absolute_vault"]["zones"]:
   for p in zone["cells"]:roof[tuple(p)]=zone["roof_elevation_feet"]
  for zone in s["zones"]:
   for p in zone["cells"]:roof[tuple(p)]=zone["clearance_feet"]
  blocked={edge(tuple(a),tuple(b)) for a,b in TILE["terrain"]["chokes"]}
  grade={edge(tuple(a),tuple(b)) for v in TILE["terrain"]["steps"] for a,b in [v["edge"]]}
  raised=set(levels)
  doors=entrances(TILE,floor)
  results={}
  for minimum in (6,4,2.5):
   eligible={p:v for p,v in floor.items() if roof[p]-levels.get(p,0)>=minimum}
   results[minimum]=navigate(eligible,doors,(4,0),blocked,raised,grade)
  self.assertEqual([len(results[x]) for x in (6,4,2.5)],[235,238,238])
  self.assertNotIn((17,13),results[6])
  self.assertIn((17,13),results[4])
if __name__=="__main__":unittest.main()
