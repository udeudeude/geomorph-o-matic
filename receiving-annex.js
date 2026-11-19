"use strict";
// Specialty exterior receiving reach: NOT an interchangeable 20x20 dungeon tile.
// Its bank, apron, desilting pocket and elevated service bridge are studies,
// NOT proven energy dissipation or a certified downstream connection.
const {outfallModel}=require("./outfall-envelope");
const DIRS=["N","E","S","W"];
const opposite={N:"S",E:"W",S:"N",W:"E"};
const key=p=>p.join(",");
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&key(a)===key(b);
function turnEdge(edge,turn){
 if(!Number.isInteger(turn)||turn<0||turn>3||!DIRS.includes(edge.side))
  throw Error("Invalid lower-level quarter turn");
 let p=edge.side==="N"?[edge.offset,0]:edge.side==="S"?[edge.offset,19]:
       edge.side==="W"?[0,edge.offset]:[19,edge.offset];
 for(let i=0;i<turn;i++)p=[19-p[1],p[0]];
 const side=p[1]===0?"N":p[0]===19?"E":p[1]===19?"S":"W";
 return {side,offset:side==="N"||side==="S"?p[0]:p[1]};
}
function validateReceivingAnnex(spec,lip){
 if(!spec||spec.schema_version!==1||
    spec.kind!=="specialist_exterior_receiving_reach"||
    spec.status!=="conceptual_reach_downstream_river_unmapped"||
    spec.source_tile!=="postern_bastion"||spec.level!==-1)
  throw Error("Receiving annex must remain a specialty conditional design");
 if(!spec.entry_edge||spec.entry_edge.kind!=="subfloor_outfall"||
    spec.entry_edge.side!=="W"||spec.entry_edge.offset!==9||
    !spec.exit_edge||spec.exit_edge.kind!=="open_watercourse"||
    spec.exit_edge.side!=="E"||spec.exit_edge.offset!==9)
  throw Error("Receiving reach interfaces must match authored opposite boundaries");
 if(!lip||lip.edge.kind!=="subfloor_outfall"||
    lip.edge.side!=="E"||lip.edge.offset!==9||!finite(lip.invert_ft)||
    !Array.isArray(lip.states)||lip.states.length!==2)
  throw Error("Receiving annex requires an actual Postern masonry lip");
 const pts=spec.stations,z=spec.bed_ft;
 if(!Array.isArray(pts)||pts.length!==20||!Array.isArray(z)||z.length!==pts.length)
  throw Error("Receiving channel needs 20 ordered planar and vertical stations");
 const used=new Set();
 for(let i=0;i<pts.length;i++){
  const p=pts[i];
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||
     p.some(v=>v<0||v>19)||used.has(key(p))||
     !finite(z[i])||(i&&!(z[i]<z[i-1]&&z[i-1]-z[i]<=.25)))
   throw Error("Receiving channel must be an ordered downhill, non-self-crossing route");
  used.add(key(p));
  if(i&&Math.abs(p[0]-pts[i-1][0])+Math.abs(p[1]-pts[i-1][1])!==1)
   throw Error("Disconnected receiving reach");
 }
 if(!same(pts[0],[0,9])||!same(pts.at(-1),[19,9])||
    !(lip.invert_ft>z[0]&&lip.invert_ft-z[0]<=.25))
  throw Error("Unmatched or uphill masonry-to-apron seam");
 const allowed=["masonry_throat","stone_apron","desilting_pocket","rocky_receiving_bed"];
 if(!Array.isArray(spec.reaches)||spec.reaches.length!==allowed.length)
  throw Error("Every receiving treatment must be represented");
 let next=0,prevWidth=0;
 for(let i=0;i<spec.reaches.length;i++){
  const r=spec.reaches[i];
  if(!r||r.id!==allowed[i]||r.first!==next||
     !Number.isInteger(r.last)||r.last<r.first||r.last>=pts.length||
     !finite(r.clear_width_ft)||r.clear_width_ft<2||r.clear_width_ft>7.5||
     r.clear_width_ft<prevWidth||typeof r.construction!=="string")
   throw Error("Overlapping, missing or abruptly contracted channel treatment");
  next=r.last+1;prevWidth=r.clear_width_ft;
 }
 if(next!==pts.length||spec.reaches[0].clear_width_ft!==lip.nominal_clear_width_ft)
  throw Error("Receiving route width must open from the masonry clear span");
 const pocket=spec.desilting_pocket,terrace=spec.upper_terrace;
 if(!pocket||!same(pocket.at,[10,9])||pocket.extra_depth_ft!==1||
    !same(pocket.service_landing,[10,7])||
    !terrace||!Array.isArray(terrace.path)||terrace.path.length<10||
    !same(terrace.path[0],[15,0])||!same(terrace.path.at(-1),pocket.service_landing))
  throw Error("Desilting pocket must have a specifically authored service approach");
 const dry=new Set();
 for(let i=0;i<terrace.path.length;i++){
  const p=terrace.path[i];
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||
     p.some(v=>v<0||v>19)||dry.has(key(p))||used.has(key(p))||
     (i&&Math.abs(p[0]-terrace.path[i-1][0])+Math.abs(p[1]-terrace.path[i-1][1])!==1))
   throw Error("Dry terrace must be an uninterrupted walkable path clear of water");
  dry.add(key(p));
 }
 const b=terrace.bridge;
 if(!b||b.at_x!==12||b.from_y!==7||b.to_y!==11||
    !finite(b.deck_ft)||b.deck_ft<=spec.receiving_levels_ft.high)
  throw Error("Inspection bridge must clear the assumed flood water surface");
 const w=spec.receiving_levels_ft;
 if(!w||!finite(w.ordinary)||!finite(w.high)||
    w.ordinary!==lip.states[0].water_surface_ft||
    w.high!==lip.states[1].water_surface_ft||
    !finite(spec.bank_top_ft)||spec.bank_top_ft<=w.high||
    w.ordinary<=z.at(-1)||w.high<=w.ordinary||
    !String(spec.evidence_level).includes("no measured"))
  throw Error("Receiving levels, banks or engineering uncertainty are inconsistent");
 return {source_seam_drop_ft:Number((lip.invert_ft-z[0]).toFixed(2)),
   receiving_run_ft:(pts.length-1)*2.5,
   receiving_drop_ft:Number((z[0]-z.at(-1)).toFixed(2)),
   source_ordinary_crown_drowned:lip.states[0].crown_drowned,
   source_high_crown_drowned:lip.states[1].crown_drowned,
   assumed_high_water_bank_freeboard_ft:Number((spec.bank_top_ft-w.high).toFixed(2)),
   service_path_cells:terrace.path.length,
   statuses:["receiving reach authored","river beyond east boundary not mapped",
    "no demonstrated hydraulic capacity or scour protection"]};
}
function verifyAnnexPair(spec,lip,sourceTurn=0,annexTurn=0){
 const audit=validateReceivingAnnex(spec,lip);
 const source=turnEdge(lip.edge,sourceTurn),annex=turnEdge(spec.entry_edge,annexTurn);
 if(source.side!==opposite[annex.side]||source.offset!==annex.offset)
  throw Error("Rotated outfall annex interfaces do not mate");
 return {...audit,side:source.side,offset:source.offset,
  necessary_annex_position:source.side==="E"?[1,0]:source.side==="W"?[-1,0]:
    source.side==="N"?[0,-1]:[0,1]};
}
function modelFromBlueprint(data,spec){
 const t=data.tiles.find(t=>t.id===spec.source_tile);
 if(!t)throw Error("Postern Bastion missing");
 const r=t.hydrology.subfloor_relay;
 return {model:outfallModel(r,{inverts_ft:r.grade.inverts_ft,
  crown_ft:r.grade.crown_ft,max_tailwater_ft:r.grade.max_tailwater_ft}),
  tile:t};
}
module.exports={turnEdge,validateReceivingAnnex,verifyAnnexPair,modelFromBlueprint};
