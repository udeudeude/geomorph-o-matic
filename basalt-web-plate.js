"use strict";
// Interpretive plan / lateral transect plate: the exposed bedrock band is
// registered to occupied plan cells. Vault silhouette is deliberately unscaled.
const fs=require("node:fs"),path=require("node:path");
const {makeSvg}=require("./render");
const {auditRibs}=require("./cave-rock-ribs");
const escape=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const f=n=>Number(n.toFixed(2));
const NAMES={
 western_distributary_web:"WESTERN DISTRIBUTARY",
 eastern_distributary_web:"EASTERN DISTRIBUTARY"
};
function samplePanel(sample,label,y){
 if(sample.rock_half_cells!==2||sample.floor_flanks.length!==2||
    sample.rock_cells.length!==2)throw Error("Basalt rock-web plate requires two continuous solid cells");
 const x=651,width=554,height=236,cell=66,left=112,baseY=160;
 const rockStart=left+cell,rockWidth=sample.rock_half_cells*cell,rockEnd=rockStart+rockWidth;
 const total=rockWidth+2*cell;
 const top=56;
 const out=[
 '<g id="rib-section-'+sample.id+'" transform="translate('+x+' '+y+')" font-family="sans-serif">',
 '<rect width="'+width+'" height="'+height+'" fill="#faf7ef" stroke="#aeb0a7"/>',
 '<text x="17" y="24" font-family="Georgia,serif" font-weight="bold" font-size="15" fill="#29352f">'+label+'  '+escape(NAMES[sample.id])+'</text>',
 '<text x="17" y="42" font-size="10.5" fill="#6a6c66">REGISTERED HORIZONTAL ROCK BAND  /  ROOF FORM IS HYPOTHETICAL</text>',
 '<rect x="'+left+'" y="'+top+'" width="'+total+'" height="118" fill="#e3dfd2" stroke="#5d625e" stroke-width="1"/>',
 '<rect x="'+rockStart+'" y="'+top+'" width="'+rockWidth+'" height="118" fill="#4a5350" stroke="#303a36" stroke-width="1.5"/>',
 '<path d="M'+f(left+4)+','+f(top+109)+'Q'+f(left+cell/2)+','+f(top+38)+' '+f(left+cell-4)+','+f(top+109)+'" fill="none" stroke="#454d48" stroke-width="2" stroke-dasharray="4 3"/>',
 '<path d="M'+f(rockEnd+4)+','+f(top+109)+'Q'+f(rockEnd+cell/2)+','+f(top+37)+' '+f(rockEnd+cell-4)+','+f(top+109)+'" fill="none" stroke="#454d48" stroke-width="2" stroke-dasharray="4 3"/>',
 '<rect x="'+f(left+8)+'" y="'+f(top+103)+'" width="'+f(cell-16)+'" height="10" fill="#f7f1e2" stroke="#6d736e"/>',
 '<rect x="'+f(rockEnd+8)+'" y="'+f(top+103)+'" width="'+f(cell-16)+'" height="10" fill="#f7f1e2" stroke="#6d736e"/>',
 '<g fill="#fff8e8" text-anchor="middle"><text x="'+f(rockStart+rockWidth/2)+'" y="'+f(top+49)+'" font-size="18" font-family="Georgia,serif">'+sample.rock_plan_thickness_feet+' ft</text>',
 '<text x="'+f(rockStart+rockWidth/2)+'" y="'+f(top+66)+'" font-size="10">SOLID ROCK</text></g>',
 '<g fill="#384640" text-anchor="middle" font-size="9"><text x="'+f(left+cell/2)+'" y="'+f(top+96)+'">PASSAGE</text><text x="'+f(rockEnd+cell/2)+'" y="'+f(top+96)+'">PASSAGE</text></g>',
 '<path d="M'+rockStart+','+(top+129)+'v9 m0,-6H'+rockEnd+'m0,-6v9" fill="none" stroke="#45514b" stroke-width="1.2"/>',
 '<text x="'+f(rockStart+rockWidth/2)+'" y="'+(top+151)+'" text-anchor="middle" font-size="10" fill="#344139">Measured from plan cells, not geological survey</text>',
 '<text x="17" y="225" font-size="9.6" fill="#6b6e67">Dashed arch: speculative section only. No measured ceiling, depth or bearing capacity.</text>',
 '</g>'
 ];
 return out.join("\n");
}
function plate(tile){
 if(tile.id!=="basalt_rift")throw Error("Basalt Rift plate cannot silently attach to another cave");
 const web=auditRibs(tile).sections;
 const a=web.find(s=>s.id==="western_distributary_web");
 const b=web.find(s=>s.id==="eastern_distributary_web");
 if(!a||!b||a.rock_plan_thickness_feet!==5||b.rock_plan_thickness_feet!==5||
    a.floor_flanks[0].join()!=="6,9"||b.floor_flanks[1].join()!=="15,9")
  throw Error("Basalt section traces must correspond to the canonical plan");
 const master=makeSvg(tile);
 const nested=master.replace(/^<svg\b[^>]*>/,
  '<svg x="83" y="149" width="480" height="480" viewBox="0 0 480 480" role="group" aria-label="Canonical Basalt Rift plan">');
 const line=(s,label)=>{
  const yy=(s.rock_cells[0][1]+.5)*24;
  const x1=(s.floor_flanks[0][0]+.5)*24,x2=(s.floor_flanks[1][0]+.5)*24;
  return '<path data-rock-cut="'+s.id+'" d="M'+x1+','+yy+'H'+x2+'" fill="none" stroke="#a35434" stroke-width="3.2" stroke-dasharray="7 4"/>'+
  '<g fill="#a35434" stroke="#faf7ed" stroke-width="2"><circle cx="'+x1+'" cy="'+yy+'" r="6"/><circle cx="'+x2+'" cy="'+yy+'" r="6"/></g>'+
  '<text x="'+f((x1+x2)/2)+'" y="'+f(yy-10)+'" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#943f29" font-weight="bold">'+label+'</text>';
 };
 const marks='<svg x="83" y="149" width="480" height="480" viewBox="0 0 480 480" aria-label="Registered rock-web transects">'+
  '<g id="bedrock-transects">'+line(a,"A")+line(b,"B")+'</g></svg>';
 return [
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 820" width="16in" height="10.25in" role="img" aria-label="Basalt Rift original plan and interpretive rock-web transects">',
 '<title>The Basalt Rift | Rock webs between upper distributaries</title>',
 '<rect width="1280" height="820" fill="#eae8df"/>',
 '<path d="M40 102H1240 M40 702H1240" fill="none" stroke="#7d837c"/>',
 '<text x="42" y="51" font-family="Georgia,serif" font-size="31" fill="#2e3833">THE BASALT RIFT</text>',
 '<text x="43" y="76" font-family="sans-serif" font-size="12.5" letter-spacing="1.5" fill="#656b64">VOLCANIC DISTRIBUTARIES  /  PLAN-REGISTERED ROCK WEBS  /  STUDY 02</text>',
 '<text x="83" y="135" font-family="Georgia,serif" font-size="19" fill="#2e3933">01  Canonical dungeon plan</text>',
 '<text x="651" y="135" font-family="Georgia,serif" font-size="19" fill="#2e3933">02  Horizontal transects with hypothetical vault sketches</text>',
 '<rect x="72" y="138" width="502" height="502" fill="#f8f6ed" stroke="#aab0a7"/>',
 nested,marks,samplePanel(a,"A–A",154),samplePanel(b,"B–B",421),
 '<g font-family="sans-serif" fill="#525b54" font-size="11">',
 '<path d="M83 657h96 M83 651v12 M131 651v12 M179 651v12" fill="none" stroke="#36413b" stroke-width="2"/>',
 '<text x="83" y="677">0</text><text x="131" y="677" text-anchor="middle">5</text><text x="179" y="677" text-anchor="end">10 ft</text>',
 '<text x="211" y="671">Plan scale only; ceiling sketches are not vertically scaled.</text>',
 '</g>',
 '<text x="41" y="734" font-family="Georgia,serif" font-size="17" fill="#28352f">WHY THE ROCK MATTERS</text>',
 '<text x="41" y="760" font-family="sans-serif" font-size="12" fill="#4c574f">Two volcanic distributaries bend around actual 5-foot plan rock webs. A breached web would create a different walking route.</text>',
 '<text x="41" y="784" font-family="sans-serif" font-size="11.5" fill="#6d625b">Fictional cartography. Ceiling span, roof thickness, lava-flow sequence and rock strength require separate evidence; no structural certification.</text>',
 '</svg>'
 ].join("\n")+"\n";
}
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const dest=path.resolve(process.argv[2]||path.join(__dirname,"examples/basalt_rift_webs.svg"));
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,plate(data.tiles.find(t=>t.id==="basalt_rift")),"utf8");
 console.log("Wrote "+dest);
}
module.exports={plate,samplePanel};
