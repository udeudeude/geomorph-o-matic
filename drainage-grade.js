"use strict";
// Dimensioned *assumption envelope*, not a discharge or structural simulation.
// Units are feet relative to the surface floor datum. Negative is lower.
// A successful check does not prove the air break remains vented in a flood.
function finite(n){return typeof n==="number"&&Number.isFinite(n)}
function gradeProfile(cells,grade,{pickups=[],vented=false}={}){
 if(!grade||Array.isArray(grade)||typeof grade!=="object"||
    !Array.isArray(cells)||cells.length<2||
    !Array.isArray(grade.inverts_ft)||grade.inverts_ft.length!==cells.length||
    !grade.inverts_ft.every(finite)||
    !finite(grade.crown_ft)||!finite(grade.max_tailwater_ft))
  throw Error("Lower race needs a complete numeric invert and tailwater envelope");
 const z=grade.inverts_ft,falls=[];
 for(let i=1;i<z.length;i++){
  const fall=z[i-1]-z[i];
  // All adjacent stations are spaced 2.5 feet in plan. A steeper
  // descent needs an explicitly drawn drop structure, not a flat polyline.
  if(!(fall>0&&fall<=0.25))throw Error("Lower race inverts must descend without an unmodeled drop");
  falls.push(fall);
 }
 const deepest=Math.min(...z),highest=Math.max(...z);
 if(!(grade.crown_ft>highest && grade.max_tailwater_ft>highest &&
     grade.crown_ft-grade.max_tailwater_ft>=0.5))
  throw Error("Lower tailwater submerges the crown or lies below the channel invert");
 let airGap=null;
 if(vented){
  if(!finite(grade.drop_lip_ft)||!finite(grade.minimum_air_gap_ft)||
     grade.minimum_air_gap_ft<2||grade.drop_lip_ft<=grade.crown_ft)
   throw Error("Vented drop must stand above collector crown");
  airGap=grade.drop_lip_ft-grade.max_tailwater_ft;
  if(airGap<grade.minimum_air_gap_ft)throw Error("Tailwater defeats the declared vented air break");
  if(!Array.isArray(pickups)||!pickups.length)throw Error("Vented collector needs an upper pickup");
 }
 return {
  inverts_ft:[...z],crown_ft:grade.crown_ft,
  max_tailwater_ft:grade.max_tailwater_ft,
  min_freeboard_ft:grade.crown_ft-grade.max_tailwater_ft,
  minimum_air_gap_ft:vented?grade.minimum_air_gap_ft:null,
  available_air_gap_ft:airGap,
  total_fall_ft:z[0]-z[z.length-1],
  horizontal_run_ft:(z.length-1)*2.5,
  percent_grade:100*(z[0]-z[z.length-1])/((z.length-1)*2.5),
  deepest_invert_ft:deepest
 };
}
function gradeAtSeam(upstream,downstream){
 const a=upstream.inverts_ft.at(-1),b=downstream.inverts_ft[0];
 if(!(a>b && a-b<=0.25))throw Error("Matched seam must descend downstream without a drop step");
 if(downstream.max_tailwater_ft>upstream.max_tailwater_ft)
  throw Error("Downstream relay assumes higher backwater than upstream free-fall check");
 return {seam_fall_ft:a-b,source_invert_ft:a,relay_invert_ft:b};
}
module.exports={gradeProfile,gradeAtSeam};
