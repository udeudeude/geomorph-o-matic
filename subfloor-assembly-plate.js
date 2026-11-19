"use strict";
// Matched two-tile subfloor survey. Surface occupancy is shown as faint context;
// the lower conduit is a separate, non-walkable layer. All heights are assumptions.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {tailraceModel}=require("./tailrace");
const {doorEdges}=require("./audit");
const {relayModel,verifySubfloorLayout}=require("./subfloor-interfaces");
const {requireBuriedFoundationClearance}=require("./foundation-clearance");
const WIDTH=19,LEFT=74,TOP=153;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function makeSubfloorAssemblyPlate(layout,data){
 if(layout.rows.length!==2||layout.rows.some(row=>row.length!==1)||
    layout.rows.some(row=>row[0].turn!==0))
  throw Error("Technical hydraulic plate requires the authored north-south zero-turn pair");
 const {rows,matched_seams}=verifySubfloorLayout(layout,data);
 if(matched_seams.length!==1)throw Error("Technical plate needs precisely one graded subfloor seam");
 const upper=rows[0][0].tile,lower=rows[1][0].tile;
 const src=tailraceModel(buildCells(upper),doorEdges(upper),upper.hydrology,upper.terrain||{});
 const relay=relayModel(lower);
 if(!src||!relay)throw Error("Hydraulic plate requires a releasing tile above its receiver");
 const seam=matched_seams[0];
 const structural=[requireBuriedFoundationClearance(upper),requireBuriedFoundationClearance(lower)];
 const nearbyCount=structural.reduce((sum,a)=>sum+a.adjacent.length,0);
 const out=[
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 990" role="img" aria-label="Matched two-tile lower collector and assumed invert survey">',
  '<title>'+esc(upper.title)+' to '+esc(lower.title)+' | subfloor interface study</title>',
  '<rect width="1280" height="990" fill="#f5f1e8"/>',
  '<text x="74" y="46" font-size="25" font-family="Georgia,serif" fill="#263b3a">UNDERFLOOR CONNECTION / TWO-TILE STUDY</text>',
  '<text x="74" y="72" font-size="12" font-family="sans-serif" fill="#4c605c">Exact specialized lower-level seam, independent of the eight standard surface entrances.</text>',
  '<text x="74" y="126" font-size="17" font-weight="700" font-family="sans-serif" fill="#294c53">01  SUBFLOOR / FOUNDATION PLAN</text>',
  '<text x="520" y="126" font-size="17" font-weight="700" font-family="sans-serif" fill="#294c53">02  INVERT GRADE / NOT SURVEYED</text>'
 ];
 const local=(p,tileIndex)=>[(p[0]+.5)*WIDTH,(p[1]+.5+tileIndex*20)*WIDTH];
 out.push('<g id="subfloor-plan-orientation" fill="none" stroke="#35575e" stroke-width="1.8">'+
  '<path d="M88 112V89l-6 8 M88 89l6 8"/><text x="80" y="85" fill="#35575e" stroke="none" font-size="11" font-family="sans-serif">N</text>'+
  '<path d="M380 105h38 M380 100v10 M418 100v10"/><text x="380" y="96" fill="#35575e" stroke="none" font-size="10" font-family="sans-serif">5 ft</text></g>');
 out.push('<g id="subfloor-two-tile-plan" transform="translate('+LEFT+' '+TOP+')">');
 for(let tileIndex=0;tileIndex<2;tileIndex++){
  const t=tileIndex===0?upper:lower,owner=buildCells(t);
  out.push('<g data-tile="'+esc(t.id)+'" transform="translate(0 '+(tileIndex*20*WIDTH)+')">');
  out.push('<rect width="'+20*WIDTH+'" height="'+20*WIDTH+'" fill="#d8d5cc" stroke="#3b4d4b" stroke-width="2"/>');
  out.push('<g id="foundation-context-'+tileIndex+'" opacity=".66">');
  for(const [key,zone] of owner){
   const [x,y]=key.split(",").map(Number);
   out.push('<rect x="'+x*WIDTH+'" y="'+y*WIDTH+'" width="'+WIDTH+'" height="'+WIDTH+
    '" fill="'+(zone==="hall"?"#f9f6ef":"#e4d5bd")+'"/>');
  }
  out.push('</g><g fill="none" stroke="#8c9189" stroke-width=".6" opacity=".35">');
  for(let i=1;i<20;i++){
   out.push('<path d="M'+i*WIDTH+',0v'+20*WIDTH+' M0,'+i*WIDTH+'h'+20*WIDTH+'"/>');
  }
  const labelY=tileIndex===1?342:9;
  out.push('</g><rect x="9" y="'+labelY+'" width="197" height="22" rx="3" fill="#f8f5ee" opacity=".96"/>'+
   '<text x="16" y="'+(labelY+15)+'" font-size="11" fill="#244d55" font-weight="700" font-family="sans-serif">'+
   esc(t.title.toUpperCase())+' / LEVEL -1</text></g>');
 }
 out.push('<g id="lower-level-centerlines" fill="none" stroke="#1d6274" stroke-linecap="round" stroke-linejoin="round" stroke-width="8">');
 const source=src.cells.map(k=>k.split(",").map(Number));
 const receiver=relay.cells.map(k=>k.split(",").map(Number));
 const draw=(cells,dy,label)=>'<polyline data-lower-run="'+label+'" points="'+
  cells.map(p=>local(p,dy).join(",")).join(" ")+'"/>';
 out.push(draw(source,0,"releasing-collector"));
 out.push(draw(receiver,1,"receiving-relay"));
 const end=local(source.at(-1),0),start=local(receiver[0],1);
 out.push('<path id="matched-subfloor-seam" data-seam-offset="'+seam.offset+
  '" data-level="-1" d="M'+end.join(",")+'L'+start.join(",")+'" stroke="#a0552f" stroke-width="10"/>');
 out.push('</g><g id="subfloor-direction-arrows" stroke="#f7f4ed" stroke-width="2.5" fill="none">');
 for(const [cells,dy] of [[source,0],[receiver,1]]){
  for(let i=1;i<cells.length;i+=3){
   const [x1,y1]=local(cells[i-1],dy),[x2,y2]=local(cells[i],dy);
   out.push('<path d="M'+x1+','+y1+'L'+x2+','+y2+'"/>');
  }
 }
 out.push('</g><g id="foundation-adjacency-flags" fill="#f5f1e8" stroke="#a16038" stroke-width="1.8">');
 structural.forEach((assessment,which)=>{
  assessment.adjacent.forEach(mark=>{
   const [x,y]=mark.at.split(",").map(Number),[X,Y]=local([x,y],which);
   out.push('<circle data-near-foundation="'+which+':'+mark.at+'" cx="'+X+'" cy="'+Y+'" r="3.8"><title>Plan adjacency to '+esc(mark.rooms.join(", "))+'; actual foundation clearance unverified</title></circle>');
  });
 });
 out.push('</g><g id="lower-termination-labels" font-size="11" font-family="sans-serif" fill="#253f44">');
 const [ex,ey]=local(receiver.at(-1),1);
 out.push('<circle cx="'+ex+'" cy="'+ey+'" r="9" fill="#f8eee0" stroke="#9d582e" stroke-width="2"/>');
 out.push('<g id="mapped-outfall-lip" data-boundary="'+relay.outfall.edge.side+':'+relay.outfall.edge.offset+'">'+
  '<path d="M'+(ex-5)+','+(ey-10)+'v20 M'+(ex+5)+','+(ey-10)+'v20" stroke="#a0552f" stroke-width="3"/>'+
  '<title>2-foot nominal masonry outlet lip; external receiving channel unmapped</title></g>');
 out.push('<text x="'+(ex+13)+'" y="'+(ey+4)+'">Outfall lip / exterior uncharted</text>');
 out.push('</g></g>');
 out.push(
 '<text x="'+LEFT+'" y="938" font-size="11" font-family="sans-serif" fill="#4d5f5b">Dark blue = buried water conduit (NOT a walking route). Brown seam = matched special opening.</text>',
 '<text x="'+LEFT+'" y="958" font-size="11" font-family="sans-serif" fill="#695b49">Direct room-footprint overlaps: 0. Adjacent stations: '+nearbyCount+'. Orange rings: unverified setbacks, NOT proven clearances.</text>'
 );
 const all=[...src.grade.inverts_ft,...relay.grade.inverts_ft];
 const chartX=520,chartW=16,sourceEdge=source.length-1,relayEdge=source.length;
 const zy=z=>380+(-8-z)*70;
 out.push('<g id="longitudinal-grade-profile" font-family="sans-serif">');
 out.push('<path d="M'+chartX+','+zy(src.grade.crown_ft)+'h'+(all.length-1)*chartW+
  '" fill="none" stroke="#534c42" stroke-width="2" stroke-dasharray="7 4"/>');
 out.push('<path d="M'+chartX+','+zy(src.grade.max_tailwater_ft)+'h'+(all.length-1)*chartW+
  '" fill="none" stroke="#5196ad" stroke-width="2.5" stroke-dasharray="3 4"/>');
 out.push('<polyline points="'+all.map((z,i)=>(chartX+i*chartW)+','+zy(z)).join(" ")+
  '" fill="none" stroke="#285c67" stroke-width="4" stroke-linejoin="round"/>');
 out.push('<path id="grade-seam" data-seam-fall-ft="'+seam.seam_fall_ft.toFixed(2)+
  '" d="M'+(chartX+sourceEdge*chartW)+','+zy(all[sourceEdge])+'L'+(chartX+relayEdge*chartW)+','+zy(all[relayEdge])+
  '" stroke="#a0552f" stroke-width="6"/>');
 for(const [i,label] of [[0,"UPSTREAM"],[sourceEdge,"SOURCE EDGE"],[relayEdge,"RELAY EDGE"],[all.length-1,"OUTFALL LIP"]]){
  const x=chartX+i*chartW,y=zy(all[i]);
  out.push('<circle cx="'+x+'" cy="'+y+'" r="4" fill="#fffaf1" stroke="#305d64" stroke-width="2"/>');
  out.push('<text x="'+x+'" y="'+(i===relayEdge?y+30:y-13)+'" text-anchor="'+(i===all.length-1?"end":"middle")+'" font-size="9" fill="#4c5350">'+label+'</text>');
 }
 const outfall=relay.outfall,tipX=chartX+(all.length-1)*chartW;
 out.push('<g id="receiving-water-scenarios" font-family="sans-serif">');
 for(const state of outfall.states){
  const yy=zy(state.water_surface_ft),high=state.crown_drowned;
  out.push('<path data-receiver-state="'+state.id+'" d="M'+(tipX-14)+','+yy+'h53" fill="none" stroke="'+
   (high?'#a2543b':'#3a879c')+'" stroke-width="3" stroke-dasharray="'+(high?'9 3':'4 4')+'"/>');
 }
 out.push('<text x="875" y="316" font-size="11" fill="#99543d">High external water -7.50 ft: crown drowned</text>');
 out.push('<text x="875" y="470" font-size="11" fill="#397989">Ordinary external water -9.00 ft: partly submerged</text>');
 out.push('</g>');
 out.push('<text x="520" y="351" font-size="11" fill="#554e42">Collector crown = '+src.grade.crown_ft+' ft (assumed)</text>');
 out.push('<text x="520" y="416" font-size="11" fill="#346b7e">Maximum tailwater = '+src.grade.max_tailwater_ft+' ft (assumed)</text>');
 out.push('<text x="520" y="738" font-size="12" fill="#304945">Source fall '+src.grade.total_fall_ft.toFixed(2)+
  ' ft / '+src.grade.horizontal_run_ft+' ft; relay fall '+relay.grade.total_fall_ft.toFixed(2)+
  ' ft / '+relay.grade.horizontal_run_ft+' ft</text>');
 out.push('<text x="520" y="762" font-size="12" fill="#304945">Seam drop '+seam.seam_fall_ft.toFixed(2)+
  ' ft. Source freeboard '+src.grade.min_freeboard_ft.toFixed(2)+
  ' ft; declared air gap '+src.grade.available_air_gap_ft.toFixed(2)+' ft.</text>');
 out.push('<text x="520" y="800" font-size="12" fill="#695b49">Vertical scale exaggerated for invert comparison.</text>');
 out.push('<text x="520" y="820" font-size="12" fill="#695b49">No discharge, high-water backflow, exterior riverbed or foundation stability proven.</text>');
 out.push('</g></svg>');
 return out.join("\n")+"\n";
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const layout=JSON.parse(fs.readFileSync(path.join(__dirname,"examples/subfloor_pair.json"),"utf8"));
 const target=path.resolve(process.argv[2]||path.join(__dirname,"examples/subfloor_pair_plate.svg"));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,makeSubfloorAssemblyPlate(layout,data));
 console.log("Graded two-tile lower conduit plate written: "+target);
}
module.exports={makeSubfloorAssemblyPlate};
