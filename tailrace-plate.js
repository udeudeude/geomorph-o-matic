"use strict";
// Technical two-level hydraulic plate, not a full plan of walkable dungeon.
// It intentionally crops to the works; an explicit design-assumption legend
// prevents the lower gallery from masquerading as surveyed geology.
const fs=require("node:fs"),path=require("node:path");
const {buildCells}=require("./assemble");
const {doorEdges}=require("./audit");
const {tailraceModel}=require("./tailrace");
const {waterwayModel}=require("./waterworks");
const {gateModel}=require("./hydraulic-control");
const S=34,X0=6,Y0=7;
const xy=p=>p.split(",").map(Number);
const esc=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const px=x=>(x-X0)*S,py=y=>(y-Y0)*S;
const center=p=>{const [x,y]=xy(p);return [px(x+.5),py(y+.5)]};
function makeTailracePlate(tile){
 const owner=buildCells(tile),doors=doorEdges(tile),h=tile.hydrology||{};
 const low=tailraceModel(owner,doors,h,tile.terrain||{});
 if(!low)throw Error("Technical lower-tailrace plate requires authored lower drainage");
 const upper=waterwayModel(owner,doors,h,tile.terrain||{}),gates=gateModel(owner,doors,h.gates||[]);
 const out=[
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 675" role="img" aria-label="Two-level hydraulic works technical plate">',
  '<title>'+esc(tile.title)+' | Controlled underfloor drainage study</title>',
  '<rect width="1080" height="675" fill="#f5f1e8"/>',
  '<text x="66" y="43" font-family="Georgia,serif" font-size="25" fill="#293837">'+esc(tile.title)+' / LOWER RACE</text>',
  '<text x="66" y="69" font-family="sans-serif" font-size="13" fill="#515d5a">Plan coordinates: 2.5 feet per half-cell. Panels crop tile columns 6–15 and rows 7–18.</text>',
  '<text x="66" y="100" font-family="sans-serif" font-size="16" font-weight="700" fill="#344846">01   UPPER SLUICE CHANNEL · level 0</text>',
  '<text x="590" y="100" font-family="sans-serif" font-size="16" font-weight="700" fill="#344846">02   SUBFLOOR TAILRACE · assumed level −1</text>',
  '<defs><marker id="downstream-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#315e6c"/></marker></defs>'
 ];
 function panel(left,id){
  out.push('<g id="'+id+'" transform="translate('+left+' 143)">');
  out.push('<rect x="0" y="0" width="'+(10*S)+'" height="'+(12*S)+'" fill="#fffcf4" stroke="#5b655f" stroke-width="1.8"/>');
  out.push('<g stroke="#dbd7cc" stroke-width=".8" fill="none">');
  for(let i=1;i<10;i++)out.push('<path d="M'+i*S+',0V'+12*S+'"/>');
  for(let i=1;i<12;i++)out.push('<path d="M0,'+i*S+'H'+10*S+'"/>');
  out.push('</g>');
 }
 panel(66,"upper-hydraulic-plan");
 out.push('<g id="upper-water-and-sumps">');
 const wet=new Set((tile.terrain?.water||[]).map(p=>p.join(",")));
 for(const p of [...upper.canal].sort()){
  const [x,y]=xy(p);
  out.push('<rect x="'+px(x)+'" y="'+py(y)+'" width="'+S+'" height="'+S+
   '" fill="'+(wet.has(p)?"#9fc8d0":"#e9ded0")+'" stroke="#748481" stroke-width="1.1"/>');
 }
 out.push('</g><g id="upper-masonry-partitions" stroke="#3c4541" stroke-width="4">');
 for(const e of [...upper.partitions].sort()){
  const [a,b]=e.split("|").map(xy);
  const x=a[0]!==b[0]?Math.max(a[0],b[0]):a[0];
  const y=a[1]!==b[1]?Math.max(a[1],b[1]):a[1];
  out.push('<path d="M'+px(x)+','+py(y)+(a[0]!==b[0]?'v'+S:'h'+S)+'"/>');
 }
 out.push('</g><g id="upper-shutters" stroke="#343b39" stroke-width="4">');
 for(const gate of h.gates||[]){
  const a=gate.a,b=gate.b,horizontal=a[1]!==b[1];
  const x=horizontal?a[0]:Math.max(a[0],b[0]);
  const y=horizontal?Math.max(a[1],b[1]):a[1];
  out.push('<path data-gate="'+esc(gate.id)+'" d="M'+px(x)+','+py(y)+(horizontal?'h'+S:'v'+S)+'"/>');
 }
 out.push('</g><g id="upper-drain-pickups">');
 for(const p of [...low.pickups].sort()){
  const [x,y]=center(p);
  out.push('<g data-drop="'+p+'"><circle cx="'+x+'" cy="'+y+'" r="9" fill="#fdfbf5" stroke="#315e6c" stroke-width="2"/>'+
   '<path d="M'+(x-5)+','+(y-3)+'l5,7 5,-7" stroke="#315e6c" stroke-width="2" fill="none"/></g>');
 }
 const [ix,iy]=center(upper.inlet);
 out.push('<text x="'+(ix+8)+'" y="'+(iy-10)+'" font-size="15" font-family="sans-serif" font-weight="700" fill="#315e6c">I</text>');
 out.push('</g></g>');
 panel(586,"subfloor-collection-plan");
 out.push('<g id="subfloor-directed-tailrace" fill="none" stroke="#315e6c" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">');
 const points=low.cells.map(p=>center(p).join(",")).join(" ");
 out.push('<polyline points="'+points+'" data-level="-1" data-direction="toward-terminus"/>');
 out.push('</g><g id="subfloor-flow-arrows" fill="none" stroke="#315e6c" stroke-width="2.2" marker-end="url(#downstream-arrow)">');
 for(let i=0;i<low.cells.length-1;i+=2){
  const [x1,y1]=center(low.cells[i]),[x2,y2]=center(low.cells[i+1]);
  out.push('<path d="M'+x1+','+y1+'L'+x2+','+y2+'"/>');
 }
 out.push('</g><g id="lower-discharge-shafts" font-family="sans-serif" font-size="12" text-anchor="middle">');
 const initial=Object.entries(low.gatePickups);
 for(const [gate,p] of initial){
  const [x,y]=center(p),letter=gate.startsWith("west")?"W":gate.startsWith("center")?"C":"E";
  out.push('<g data-drain-from="'+esc(gate)+'"><circle cx="'+x+'" cy="'+y+'" r="12" fill="#fffdf6" stroke="#315e6c" stroke-width="2.2"/>'+
   '<text x="'+x+'" y="'+(y+4)+'" fill="#315e6c" font-weight="700">'+letter+'</text></g>');
 }
 const [tx,ty]=center(low.terminus);
 out.push('<g id="lower-tailrace-terminus" data-continuation="unmapped"><rect x="'+(tx-13)+'" y="'+(ty-13)+'" width="26" height="26" fill="#f4e6c9" stroke="#315e6c" stroke-width="2"/>'+
  '<text x="'+tx+'" y="'+(ty+4)+'" fill="#315e6c" font-weight="700">T</text></g>');
 out.push('</g></g>');
 out.push(
  '<text x="66" y="585" font-family="sans-serif" font-size="12" fill="#444d49">Filled blue: existing headwater. Tan: initially dry sumps. Thick bars: closed shutters and full-height partitions.</text>',
  '<text x="66" y="609" font-family="sans-serif" font-size="12" fill="#444d49">W / C / E: separate vertical drop shafts from west / center / east shutter pockets; T: uncharted onward outfall.</text>',
  '<text x="66" y="637" font-family="sans-serif" font-size="12" fill="#685c4c">Lower level, shaft clearances, invert elevations, channel grade, roof structure and hydraulic discharge are design assumptions.</text>',
  '<text x="66" y="655" font-family="sans-serif" font-size="11" fill="#685c4c">Free-fall vented drops assume an unsurcharged tailrace; no reverse flow modeled. All eight surface exits remain unchanged.</text>',
  '</svg>');
 return out.join("\n")+"\n";
}
if(require.main===module){
 const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8")).tiles;
 const tile=tiles.find(t=>t.id==="riftwater_lock");
 const target=path.resolve(process.argv[2]||path.join(__dirname,"examples/riftwater_tailrace_plate.svg"));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,makeTailracePlate(tile));
 console.log("Tailrace technical plate written: "+target);
}
module.exports={makeTailracePlate};
