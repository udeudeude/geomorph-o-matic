"use strict";
// Matched two-tile subfloor survey. Surface occupancy is shown as faint context;
// the lower conduit is a separate, non-walkable layer. All heights are assumptions.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {tailraceModel}=require("./tailrace");
const {doorEdges}=require("./audit");
const {relayModel,verifySubfloorLayout}=require("./subfloor-interfaces");
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
 const out=[
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 990" role="img" aria-label="Matched two-tile lower collector and assumed invert survey">',
  '<title>'+esc(upper.title)+' to '+esc(lower.title)+' | subfloor interface study</title>',
  '<rect width="1100" height="990" fill="#f5f1e8"/>',
  '<text x="74" y="46" font-size="25" font-family="Georgia,serif" fill="#263b3a">UNDERFLOOR CONNECTION / TWO-TILE STUDY</text>',
  '<text x="74" y="72" font-size="12" font-family="sans-serif" fill="#4c605c">Exact specialized lower-level seam, independent of the eight standard surface entrances.</text>',
  '<text x="74" y="126" font-size="17" font-weight="700" font-family="sans-serif" fill="#294c53">01  SUBFLOOR PLAN + UPPER FOUNDATION CONTEXT</text>',
  '<text x="520" y="126" font-size="17" font-weight="700" font-family="sans-serif" fill="#294c53">02  ASSUMED INVERT GRADE / NOT A SURVEY</text>'
 ];
 const local=(p,tileIndex)=>[(p[0]+.5)*WIDTH,(p[1]+.5+tileIndex*20)*WIDTH];
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
  out.push('</g></g>');
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
 out.push('</g><g id="lower-termination-labels" font-size="11" font-family="sans-serif" fill="#253f44">');
 const [ex,ey]=local(receiver.at(-1),1);
 out.push('<circle cx="'+ex+'" cy="'+ey+'" r="9" fill="#f8eee0" stroke="#9d582e" stroke-width="2"/>');
 out.push('<text x="'+(ex+13)+'" y="'+(ey+4)+'">Uncharted outfall</text>');
 out.push('</g></g>');
 out.push(
 '<text x="'+LEFT+'" y="938" font-size="11" font-family="sans-serif" fill="#4d5f5b">Dark blue = buried water conduit (NOT a walking route). Brown seam = matched special opening.</text>',
 '<text x="'+LEFT+'" y="958" font-size="11" font-family="sans-serif" fill="#695b49">Foundation overlaps are unverified. Neither a tunnel diameter nor a safe access shaft has been established.</text>'
 );
 const all=[...src.grade.inverts_ft,...relay.grade.inverts_ft];
 const chartX=520,chartW=26;
 const zy=z=>380+(-8-z)*70;
 out.push('<g id="longitudinal-grade-profile" font-family="sans-serif">');
 out.push('<path d="M'+chartX+','+zy(src.grade.crown_ft)+'h'+(all.length-1)*chartW+
  '" fill="none" stroke="#534c42" stroke-width="2" stroke-dasharray="7 4"/>');
 out.push('<path d="M'+chartX+','+zy(src.grade.max_tailwater_ft)+'h'+(all.length-1)*chartW+
  '" fill="none" stroke="#5196ad" stroke-width="2.5" stroke-dasharray="3 4"/>');
 out.push('<polyline points="'+all.map((z,i)=>(chartX+i*chartW)+','+zy(z)).join(" ")+
  '" fill="none" stroke="#285c67" stroke-width="4" stroke-linejoin="round"/>');
 out.push('<path id="grade-seam" data-seam-fall-ft="'+seam.seam_fall_ft.toFixed(2)+
  '" d="M'+(chartX+10*chartW)+','+zy(all[10])+'L'+(chartX+11*chartW)+','+zy(all[11])+
  '" stroke="#a0552f" stroke-width="6"/>');
 for(const [i,label] of [[0,"UPSTREAM"],[10,"SOURCE EDGE"],[11,"RELAY EDGE"],[all.length-1,"UNMAPPED OUTFALL"]]){
  const x=chartX+i*chartW,y=zy(all[i]);
  out.push('<circle cx="'+x+'" cy="'+y+'" r="4" fill="#fffaf1" stroke="#305d64" stroke-width="2"/>');
  out.push('<text x="'+x+'" y="'+(i===11?y+30:y-13)+'" text-anchor="middle" font-size="9" fill="#4c5350">'+label+'</text>');
 }
 out.push('<text x="520" y="351" font-size="11" fill="#554e42">Collector crown = '+src.grade.crown_ft+' ft (assumed)</text>');
 out.push('<text x="520" y="416" font-size="11" fill="#346b7e">Maximum tailwater = '+src.grade.max_tailwater_ft+' ft (assumed)</text>');
 out.push('<text x="520" y="738" font-size="12" fill="#304945">Source fall '+src.grade.total_fall_ft.toFixed(2)+
  ' ft / '+src.grade.horizontal_run_ft+' ft; relay fall '+relay.grade.total_fall_ft.toFixed(2)+
  ' ft / '+relay.grade.horizontal_run_ft+' ft</text>');
 out.push('<text x="520" y="762" font-size="12" fill="#304945">Seam drop '+seam.seam_fall_ft.toFixed(2)+
  ' ft. Source freeboard '+src.grade.min_freeboard_ft.toFixed(2)+
  ' ft; declared air gap '+src.grade.available_air_gap_ft.toFixed(2)+' ft.</text>');
 out.push('<text x="520" y="800" font-size="12" fill="#695b49">Vertical scale exaggerated for invert comparison.</text>');
 out.push('<text x="520" y="820" font-size="12" fill="#695b49">No discharge, flood duration, ventilation or foundation stability proven.</text>');
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
