"use strict";
// Architectural row profiles over independently navigable floor surfaces.
// Horizontal coordinates are canonical (2.5 feet per half-cell); vertical
// distances are scaled using an explicit, *assumed* floor separation.
const {verticalModel}=require("./vertical");
const STEP=24;
const xy=p=>p.split(",").map(Number);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const fmt=n=>Number(n.toFixed(2)).toString();
function measuredSection(owner,terrain={},vertical={},{row=10,feetPerLevel=10,title="Geological section"}={}){
 if(!Number.isInteger(row)||row<1||row>18)throw Error("Profile row must be interior");
 if(typeof feetPerLevel!=="number"||!Number.isFinite(feetPerLevel)||feetPerLevel<=0||feetPerLevel>50)
  throw Error("Invalid assumed feet per level");
 const model=verticalModel(owner,terrain,vertical),levels=new Set([0]);
 for(const z of model.base.heights.values())levels.add(z);
 for(const deck of model.decks.values())levels.add(deck.level);
 const above=Math.max(...levels),below=Math.min(...levels);
 // A half cell is 2.5 feet; use the same scale in both section directions.
 const pixelsPerFoot=STEP/2.5,band=feetPerLevel*pixelsPerFoot;
 const left=90,top=75,right=35,bottom=90;
 const width=left+20*STEP+right,height=top+(above-below)*band+bottom;
 const Y=z=>top+(above-z)*band,X=x=>left+x*STEP;
 const out=[
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+fmt(width)+' '+fmt(height)+'" role="img" aria-label="'+esc(title)+'">',
  '<title>'+esc(title)+'</title>',
  '<rect width="'+fmt(width)+'" height="'+fmt(height)+'" fill="#faf8f2"/>',
  '<text x="'+left+'" y="28" font-family="Georgia,serif" font-size="20" fill="#292b28">'+esc(title)+'</text>',
  '<text x="'+left+'" y="48" font-family="sans-serif" font-size="11" fill="#585d58">Idealized profile, row '+row+' | Plan exact; vertical separation assumed '+feetPerLevel+' feet per level</text>',
  '<g id="section-datums" fill="none" stroke="#c5c3b8" stroke-width=".8" stroke-dasharray="3 6">'
 ];
 for(let z=below;z<=above;z++){
  out.push('<path d="M'+X(0)+' '+fmt(Y(z))+'H'+X(20)+'"/>');
 }
 out.push('</g><g id="section-level-labels" font-family="sans-serif" font-size="12" fill="#514b43" text-anchor="end">');
 for(let z=below;z<=above;z++){
  const label=z===0?"0":(z>0?"+":"")+z;
  out.push('<text x="'+(left-12)+'" y="'+fmt(Y(z)+4)+'">'+label+' ('+fmt(z*feetPerLevel)+' ft)</text>');
 }
 out.push('</g><g id="section-vertical-scale" fill="none" stroke="#514b43" stroke-width="1.5">');
 if(above>below){
  out.push('<path d="M38 '+fmt(Y(below))+'V'+fmt(Y(below+1))+' M32 '+fmt(Y(below))+'h12 M32 '+fmt(Y(below+1))+'h12"/>',
   '<text x="12" y="'+fmt((Y(below)+Y(below+1))/2)+'" font-family="sans-serif" font-size="10" fill="#514b43" stroke="none">'+fmt(feetPerLevel)+' ft</text>');
 }
 out.push('</g><g id="section-floor-surfaces" fill="none" stroke="#414842" stroke-width="4" stroke-linecap="square">');
 for(const [p,n] of model.nodes){
  if(n.deck)continue;
  const [x,y]=xy(n.at);
  if(y===row)out.push('<path d="M'+X(x)+' '+fmt(Y(n.level))+'h'+STEP+'" data-node="'+esc(p)+'"/>');
 }
 out.push('</g><g id="section-overhead-surfaces" fill="none" stroke="#997246" stroke-width="7">');
 for(const [p,n] of model.nodes){
  if(!n.deck)continue;
  const [x,y]=xy(n.at);if(y!==row)continue;
  out.push('<path d="M'+X(x)+' '+fmt(Y(n.level))+'h'+STEP+'" data-deck="'+esc(n.deck)+'"/>');
 }
 out.push('</g><g id="section-water" fill="#86b8c3" fill-opacity=".64">');
 for(const p of model.base.water){const [x,y]=xy(p);if(y!==row)continue;
  const z=model.base.heights.get(p)||0;
  // The blue band is a symbol, not an invented depth measurement.
  out.push('<rect x="'+X(x)+'" y="'+fmt(Y(z)+3)+'" width="'+STEP+'" height="9"/>');
 }
 out.push('</g><g id="section-bridges" fill="none" stroke="#a17842" stroke-width="5">');
 for(const p of model.base.bridges){const [x,y]=xy(p);if(y!==row)continue;
  const z=model.base.heights.get(p)||0;
  out.push('<path d="M'+X(x)+' '+fmt(Y(z)-2)+'h'+STEP+'"/>');
 }
 out.push('</g><g id="section-vertical-links" fill="none" stroke="#51423b" stroke-width="2" stroke-dasharray="5 4">');
 for(const link of model.links){const [x,y]=xy(link.at);if(y!==row)continue;
  const mx=X(x+.5),mid=(Y(link.from)+Y(link.to))/2;
  out.push('<path d="M'+fmt(mx)+' '+fmt(Y(link.from))+'V'+fmt(Y(link.to))+'"/>',
   '<text x="'+fmt(mx+7)+'" y="'+fmt(mid-4)+'" fill="#51423b" stroke="none" font-family="sans-serif" font-size="10">'+(link.kind==="ladder"?"L":"S")+'</text>');
 }
 out.push('</g><g id="section-distance-ruler" font-family="sans-serif" fill="#5a5e59" font-size="10" text-anchor="middle">');
 for(let x=0;x<=20;x+=2){
  out.push('<path d="M'+X(x)+' '+fmt(Y(below)+25)+'v7" stroke="#747a73" stroke-width="1"/>',
   '<text x="'+X(x)+'" y="'+fmt(Y(below)+46)+'">'+fmt(x*2.5)+' ft</text>');
 }
 out.push('</g>',
  '<text x="'+left+'" y="'+fmt(height-26)+'" font-family="sans-serif" font-size="11" fill="#555b58">Dark = existing floor | Ochre = stacked deck | Blue = symbolic water | L/S = ladder/stair</text>',
  '<text x="'+left+'" y="'+fmt(height-10)+'" font-family="sans-serif" font-size="10" fill="#666">Vertical dimensions and water depth are not surveyed; unmodeled roofs and cave ceilings are omitted.</text>',
  '</svg>');
 return out.join("\n")+"\n";
}
if(require.main===module){
 const fs=require("node:fs"),path=require("node:path");
 const {buildCells}=require("./assemble");
 const tiles=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8")).tiles;
 const tile=tiles.find(t=>t.id==="riftwater_lock");
 const target=path.resolve(process.argv[2]||path.join(__dirname,"examples/riftwater_profile.svg"));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,measuredSection(buildCells(tile),tile.terrain,tile.vertical,{title:tile.title+" | Longitudinal profile"}));
 console.log("Architectural profile written: "+target);
}
module.exports={measuredSection};
