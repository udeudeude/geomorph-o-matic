"""Adversarial, separately implemented Python construction contract."""
import copy
import json
import unittest
from pathlib import Path
from validate import validate

DATA=json.loads((Path(__file__).resolve().parents[1]/'blueprints.json').read_text())
SOURCE=next(t for t in DATA['tiles'] if t['id']=='riftwater_lock')
RECEIVER=next(t for t in DATA['tiles'] if t['id']=='postern_bastion')


class MaintenanceEngineeringTests(unittest.TestCase):
    def test_authored_sluice_drives_and_four_bend_cleanouts(self):
        a=validate(SOURCE)
        b=validate(RECEIVER)
        self.assertEqual(a['maintenance_drives'],3)
        self.assertEqual(a['inspection_covers'],2)
        self.assertEqual(b['inspection_covers'],2)
        self.assertEqual(a['service_spurs_ft'],7.5)
        self.assertGreater(b['floor_cells'],0)

    def test_reject_unrecorded_bore(self):
        bad=copy.deepcopy(SOURCE)
        bad['hydrology']['transmissions'][2]['bored_at'].pop()
        with self.assertRaises(AssertionError):
            validate(bad)

    def test_reject_shared_mechanism_route(self):
        bad=copy.deepcopy(SOURCE)
        bad['hydrology']['transmissions'][0]['path'][1]=[11,14]
        with self.assertRaises(AssertionError):
            validate(bad)

    def test_reject_lost_bend_access(self):
        bad=copy.deepcopy(RECEIVER)
        bad['hydrology']['subfloor_relay']['inspections'].pop()
        with self.assertRaises(AssertionError):
            validate(bad)

    def test_reject_access_through_uncarved_stone(self):
        bad=copy.deepcopy(RECEIVER)
        bad['routes']=[r for r in bad['routes'] if r['id']!='north_service_cleanout_niche']
        with self.assertRaises(AssertionError):
            validate(bad)

    def test_reject_control_obstructing_service_cover(self):
        bad=copy.deepcopy(SOURCE)
        bad['hydrology']['tailrace']['inspections'][0]['surface']=[11,14]
        bad['hydrology']['tailrace']['inspections'][0]['branch']=[[11,14]]
        with self.assertRaises(AssertionError):
            validate(bad)


if __name__=='__main__':
    unittest.main()
