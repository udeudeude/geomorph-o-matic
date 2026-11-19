"use strict";
// Authored interpretive cave profiles coupled to canonical floor, water and ramps.
// They are dungeon design diagrams, emphatically NOT measured cave surveys.
const fs=require("node:fs");
const path=require("node:path");
const {shapeCells}=require("./geometry");
const CUTS=Object.freeze([
 {id:"A",axis:"y",fixed:10,from:7,to:12,ends:["N","S"],
  title:"THE DROWNED CROSSING",detail:"stream incision / plank crossing",
  ceiling:[13,14,15,14,12,11]},
 {id:"B",axis:"x",fixed:4,from:12,to:18,ends:["W","E"],
  title:"THE LEANING GALLERY",detail:"abandoned high tube / eastern descent",
  ceiling:[16,17,19,19,18,17,12]}
]);
const pos=p=>p.join(",");
const edge=(a,b)=>[pos(a),pos(b)].sort().join("|");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const f=n=>Number(n.toFixed(2));

function occupiedFloor(tile){
 const owner=new Map();
 for(const [id,,shape] of tile.rooms){
  for(const p of shapeCells(shape)){
   const k=pos(p);if(owner.has(k))throw Error("Overlapping section footprint: "+k);
   owner.set(k,id);
  }
 }
 for(const route of tile.routes){
  for(let i=1;i<route.points.length;i++){
   const [x,y]=route.points[i-1],[xx,yy]=route.points[i];
   if(x!==xx&&y!==yy)throw Error("Diagonal profile route");
   for(let a=Math.min(x,xx);a<=Math.max(x,xx);a++)
    for(let b=Math.min(y,yy);b<=Math.max(y,yy);b++){
     const k=pos([a,b]);
     if(a<0||a>=20||b<0||b>=20||owner.has(k)&&owner.get(k)!=="hall")
      throw Error("Profile route crosses chamber or boundary: "+k);
     owner.set(k,"hall");
    }
  }
 }
 return owner;
}
function profileSamples(tile,cut){
 if(!cut||!["x","y"].includes(cut.axis)||!Number.isInteger(cut.fixed)||
    !Number.isInteger(cut.from)||!Number.isInteger(cut.to)||cut.from>=cut.to||
    !Array.isArray(cut.ceiling)||cut.ceiling.length!==cut.to-cut.from+1||
    cut.ceiling.some(h=>!Number.isFinite(h)||h<9||h>24))
  throw Error("Invalid section cut or illustrative ceiling profile");
 const owner=occupiedFloor(tile);
 const terrain=tile.terrain||{},water=new Set((terrain.water||[]).map(pos));
 const bridges=new Set((terrain.bridges||[]).map(pos)),levels=new Map();
 for(const [height,cells] of terrain.elevations||[])
  for(const p of cells){const k=pos(p);if(levels.has(k))throw Error("Overlapping section levels");levels.set(k,height);}
 const ramps=new Set((terrain.ramps||[]).map(e=>edge(...e)));
 const samples=[];
 for(let n=cut.from;n<=cut.to;n++){
  const p=cut.axis==="y"?[cut.fixed,n]:[n,cut.fixed],k=pos(p);
  if(!owner.has(k))throw Error("Section traverses solid rock: "+k);
  const level=levels.get(k)||0;
  if(!Number.isInteger(level)||level<0||level>2)throw Error("Unsupported illustrative vertical level");
  if(bridges.has(k)&&!water.has(k))throw Error("Section bridge must cross water");
  samples.push({p,key:k,level,wet:water.has(k),bridge:bridges.has(k),ceiling:cut.ceiling[n-cut.from]});
 }
 const slopes=[];
 for(let i=0;i<samples.length-1;i++){
  const a=samples[i],b=samples[i+1];
  if(a.level!==b.level){
   if(Math.abs(a.level-b.level)!==1||!ramps.has(edge(a.p,b.p)))
    throw Error("Section elevation jumps without canonical ramp: "+a.key+" to "+b.key);
   slopes.push([i,i+1]);
  }
 }
 return {cut,samples,slopes,lengthFeet:f(samples.length*2.5)};
}
function auditScouredProfiles(tile){
 if(tile.id!=="scoured_siphon")throw Error("The Scoured Siphon must use its own cut registration");
 const a=profileSamples(tile,CUTS[0]),b=profileSamples(tile,CUTS[1]);
 if(a.samples.filter(s=>s.wet).length!==1||
    a.samples.filter(s=>s.bridge).map(s=>s.key).join()!=="10,9")
  throw Error("A-A must intersect the actual one-cell bridged stream");
 if(b.slopes.length!==1||b.samples[5].key!=="17,4"||b.samples[5].level!==1||
    b.samples[6].key!=="18,4"||b.samples[6].level!==0)
  throw Error("B-B must end at the modeled eastern gallery ramp");
 return {tile:tile.id,sections:2,water_crossings:1,bridge_crossings:1,
  section_a_cells:a.samples.length,section_b_cells:b.samples.length,
  section_b_ramp_edges:b.slopes.length,
  vertical_dimensions:"illustrative, not measured"};
}
function profileDrawing(profile){
 const {cut,samples,slopes}=profile,step=58,x0=52,y0=187;
 const total=step*samples.length;
 const xp=i=>x0+i*step,ceilY=i=>y0-samples[i].ceiling*7;
 const parts=['<g id="profile-'+cut.id+'" font-family="Georgia,serif">',
  '<rect x="1" y="1" width="554" height="238" rx="3" fill="#fbf8ef" stroke="#c9c2b3"/>',
  '<text x="18" y="28" font-size="15" font-weight="bold" fill="#2d3430">'+esc(cut.id)+'–'+esc(cut.id)+'  '+esc(cut.title)+'</text>',
  '<text x="18" y="45" font-family="sans-serif" font-size="10.7" fill="#65675e">'+esc(cut.detail)+'</text>'];
 // Roof: a curved, jointed illustrative passage ceiling; never a surveyed line.
 let roof='M'+f(x0)+','+f(ceilY(0))+' ';
 for(let i=0;i<samples.length;i++){
  const x=xp(i),next=xp(i+1),y=ceilY(i);
  roof+='Q'+f(x+step*.33)+','+f(y-4+(i%2)*5)+' '+f(x+step*.65)+','+f(y+2)+' ';
  roof+='L'+f(next)+','+f(i+1<samples.length?ceilY(i+1):y)+' ';
 }
 let roofFill='M'+x0+',12H'+f(x0+total)+'V'+f(ceilY(samples.length-1));
 for(let i=samples.length-1;i>=0;i--)roofFill+='L'+f(xp(i))+','+f(ceilY(i));
 roofFill+='Z';
 parts.push('<path d="'+roofFill+'" fill="#ddd7c9" fill-opacity=".42" stroke="none"/>');
 parts.push('<path d="'+roof+'" fill="none" stroke="#333c37" stroke-width="3" stroke-linejoin="round"/>');
 // Each occupied half-cell represents 2.5 feet along the cut.
 for(let i=0;i<samples.length;i++){
  const s=samples[i],x=xp(i),floor=y0-s.level*35+(s.wet?19:0);
  parts.push('<path d="M'+f(x)+','+f(floor)+'H'+f(x+step)+'V217H'+f(x)+'Z" fill="#d3cdc0" stroke="none"/>');
  if(s.wet){
   const waterTop=y0-s.level*35;
   parts.push('<path d="M'+f(x)+','+f(waterTop)+'H'+f(x+step)+'V'+f(floor)+'H'+f(x)+'Z" fill="#a8c3c4" stroke="none"/>');
   parts.push('<path d="M'+f(x)+','+f(waterTop)+'q12,-3 24,0t24,0" fill="none" stroke="#5c8f91" stroke-width="1.5"/>');
  }else{
   parts.push('<path d="M'+f(x)+','+f(floor)+'H'+f(x+step)+'" stroke="#464944" stroke-width="2.2"/>');
  }
  if(s.bridge){
   parts.push('<path d="M'+f(x-3)+','+f(y0-7)+'H'+f(x+step+3)+'" stroke="#68523b" stroke-width="4"/>');
   parts.push('<path d="M'+f(x+7)+','+f(y0-5)+'v10 m'+f(step-14)+',-10v10" stroke="#68523b" stroke-width="2"/>');
   parts.push('<text x="'+f(x+step/2)+'" y="'+f(y0-22)+'" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#554638">BRIDGE</text>');
  }
  // Sparse bedding traces below the floor, outside the accessible passage.
  for(let j=0;j<2;j++){
   const y=f(Math.max(floor+10,198)+j*7);
   if(y<216)parts.push('<path d="M'+f(x+9+j*5)+','+y+'l18,-4" fill="none" stroke="#979185" stroke-width=".75"/>');
  }
 }
 for(const [i,j] of slopes){
  const a=samples[i],b=samples[j];
  parts.push('<path d="M'+f(xp(i)+step*.5)+','+f(y0-a.level*35)+'L'+f(xp(j)+step*.5)+','+f(y0-b.level*35)+'" fill="none" stroke="#75573d" stroke-width="3" stroke-linecap="round"/>');
  parts.push('<text x="'+f(xp(i)+step)+'" y="'+f(y0-48)+'" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#75573d">RAMP</text>');
 }
 parts.push('<path d="M'+x0+','+y0+'H'+f(x0+total)+'" fill="none" stroke="#878d85" stroke-width=".8" stroke-dasharray="5 5"/>');
 parts.push('<text x="25" y="188" font-family="sans-serif" font-size="10" fill="#777d73">0</text>');
 parts.push('<text x="'+f(x0)+'" y="231" font-family="sans-serif" font-size="10" fill="#60645c">'+esc(cut.ends[0])+'</text>');
 parts.push('<text x="'+f(x0+total)+'" y="231" text-anchor="end" font-family="sans-serif" font-size="10" fill="#60645c">'+esc(cut.ends[1])+'</text>');
 parts.push('</g>');
 return parts.join("\n");
}
function sectionPlateSvg(tile,planSvg){
 auditScouredProfiles(tile);
 if(typeof planSvg!=="string"||!/^<svg\b/.test(planSvg)||!planSvg.trimEnd().endsWith("</svg>"))
  throw Error("Expected a complete canonical SVG dungeon plan");
 const nested=planSvg.replace(/^<svg\b[^>]*>/,
  '<svg x="74" y="158" width="500" height="500" viewBox="0 0 480 480" role="group" aria-label="Canonical dungeon plan">');
 const mark=[
  '<svg x="74" y="158" width="500" height="500" viewBox="0 0 480 480" aria-hidden="true">',
  '<g id="section-cuts" fill="none" stroke="#8b4d3b" stroke-width="2.1" stroke-dasharray="6 5">',
  '<path data-cut="A" d="M252,180V300"/><path data-cut="B" d="M300,108H444"/></g>',
  '<g fill="#fff9ec" stroke="#8b4d3b" stroke-width="2">',
  '<circle cx="252" cy="173" r="11"/><circle cx="252" cy="307" r="11"/>',
  '<circle cx="291" cy="108" r="11"/><circle cx="453" cy="108" r="11"/></g>',
  '<g fill="#793e30" font-size="13" font-family="sans-serif" font-weight="bold" text-anchor="middle">',
  '<text x="252" y="177">A</text><text x="252" y="311">A</text>',
  '<text x="291" y="112">B</text><text x="453" y="112">B</text></g></svg>'
 ].join("\n");
 const profiles=CUTS.map((cut,i)=>
   '<g transform="translate(643 '+(i===0?155:419)+')">'+profileDrawing(profileSamples(tile,cut))+'</g>').join("\n");
 return [
 '<svg xmlns="http://www.w3.org/2000/svg" width="16in" height="10.25in" viewBox="0 0 1280 820" role="img" aria-label="Scoured Siphon plan and interpretive geological profiles">',
 '<title>The Scoured Siphon | Plan and interpretive cave sections</title>',
 '<rect width="1280" height="820" fill="#eee9df"/>',
 '<path d="M42,103H1238 M42,716H1238" stroke="#6f7068" stroke-width="1"/>',
 '<text x="43" y="52" font-family="Georgia,serif" font-size="32" fill="#2b342f">THE SCOURED SIPHON</text>',
 '<text x="44" y="78" font-family="sans-serif" font-size="13" letter-spacing="1.5" fill="#665f54">ORIGINAL CAVE GEOMORPH   /   PLAN + INTERPRETIVE PROFILES   /   STUDY 01</text>',
 '<text x="72" y="137" font-family="Georgia,serif" font-size="21" fill="#333a34">01  Plan and section traces</text>',
 '<text x="643" y="137" font-family="Georgia,serif" font-size="21" fill="#333a34">02  Passage morphology</text>',
 '<rect x="65" y="149" width="518" height="518" fill="#faf8f1" stroke="#b6b1a7"/>',
 nested,mark,profiles,
 '<g font-family="sans-serif" font-size="12" fill="#49534e">',
 '<path d="M74,684H174" stroke="#353a36" stroke-width="4"/><path d="M74,680V688 M124,680V688 M174,680V688" stroke="#353a36" stroke-width="1"/>',
 '<text x="74" y="703">0</text><text x="124" y="703" text-anchor="middle">5</text><text x="174" y="703" text-anchor="end">10 ft</text>',
 '<text x="646" y="690">A–A intersects the one-cell stream crossing and bridge. B–B follows the raised gallery to its eastern ramp.</text>',
 '</g>',
 '<text x="44" y="745" font-family="Georgia,serif" font-size="16" fill="#303831">READING THE DRAWING</text>',
 '<text x="44" y="771" font-family="sans-serif" font-size="12" fill="#515a54">Plan traces, flooded cell, bridge and gallery descent are derived from the same canonical geometry as the modular tile.</text>',
 '<text x="44" y="791" font-family="sans-serif" font-size="12" fill="#6a6157">Ceiling silhouettes, water depth, clearances and vertical scaling are illustrative; no measured cave survey or structural assessment.</text>',
 '</svg>'
 ].join("\n")+"\n";
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const tile=data.tiles.find(t=>t.id==="scoured_siphon");
 const {makeSvg}=require("./render");
 const destination=path.resolve(process.argv[2]||path.join(__dirname,"examples/scoured_siphon_profiles.svg"));
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.writeFileSync(destination,sectionPlateSvg(tile,makeSvg(tile)),"utf8");
 console.log("Wrote "+destination+"; "+JSON.stringify(auditScouredProfiles(tile)));
}
module.exports={CUTS,occupiedFloor,profileSamples,auditScouredProfiles,sectionPlateSvg};
