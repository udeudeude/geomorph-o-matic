"use strict";
// A dimensioned, conditional outfall lip, NOT a measured receiving watercourse.
// Water-surface elevations describe design scenarios, not computed hydraulics.
// A drowned crown means potential backwater; it does not quantify discharge.
const KEY=p=>p.join(",");
const finite=x=>typeof x==="number"&&Number.isFinite(x);
function outfallModel(relay,grade){
 if(!relay||relay.discharge_status!=="external_lip_receiver_unmapped")
  throw Error("Downstream discharge cannot be certified without the receiving channel");
 const o=relay.outfall,route=relay.cells;
 if(!o||o.kind!=="masonry_arch_lip"||
    !o.exit_edge||o.exit_edge.kind!=="subfloor_outfall"||
    !["N","E","S","W"].includes(o.exit_edge.side)||
    !Number.isInteger(o.exit_edge.offset)||o.exit_edge.offset<=0||o.exit_edge.offset>=19||
    !Array.isArray(o.at)||o.at.length!==2||!o.at.every(Number.isInteger)||
    o.receiver_documentation!=="unmapped_external_watercourse"||
    !finite(o.nominal_clear_width_ft)||o.nominal_clear_width_ft<=0||
    o.nominal_clear_width_ft>2.5)
  throw Error("Invalid or over-wide external masonry outfall");
 const p=o.exit_edge.side==="N"?[o.exit_edge.offset,0]:
    o.exit_edge.side==="S"?[o.exit_edge.offset,19]:
    o.exit_edge.side==="W"?[0,o.exit_edge.offset]:[19,o.exit_edge.offset];
 if(!Array.isArray(route)||KEY(o.at)!==KEY(p)||KEY(route.at(-1))!==KEY(p))
  throw Error("Mapped outfall lip must coincide with the final boundary conduit station");
 const a=o.water_levels_ft;
 if(!a||!finite(a.ordinary)||!finite(a.high)||
    !(grade&&Array.isArray(grade.inverts_ft)&&grade.inverts_ft.length===route.length))
  throw Error("Outfall needs two numeric water-level assumptions and matching inverts");
 const invert=grade.inverts_ft.at(-1),crown=grade.crown_ft,maximum=grade.max_tailwater_ft;
 if(!(finite(invert)&&finite(crown)&&finite(maximum)&&crown>invert&&
      a.ordinary>invert&&a.ordinary<maximum&&maximum<crown&&
      a.high>crown&&a.high>a.ordinary))
  throw Error("Outfall scenarios must distinguish ordinary flow from crown-drowning backwater");
 function state(name,water){
  return {id:name,water_surface_ft:water,submergence_above_invert_ft:Number((water-invert).toFixed(2)),
   crown_drowned:water>=crown,beyond_design_tailwater:water>maximum,
   interpretation:water>=crown?"potential_backwater":"partly_submerged_lip"};
 }
 return {at:[...p],edge:{...o.exit_edge},nominal_clear_width_ft:o.nominal_clear_width_ft,
  invert_ft:invert,crown_ft:crown,assumed_max_tailwater_ft:maximum,
  receiver_documentation:o.receiver_documentation,states:[state("ordinary",a.ordinary),state("high",a.high)],
  status:"outfall_lip_only; external receiving channel, flow capacity and backwater not verified"};
}
module.exports={outfallModel};
