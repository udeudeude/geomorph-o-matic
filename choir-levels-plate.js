"use strict";
// Two related but distinctly labeled views, both built from one tested blueprint.
// The left is the playable composite; the right isolates the overhead level
// against a deliberately pale floor plan. This is NOT a surveyed section.
const fs=require("node:fs"),path=require("node:path");
const {makeSvg}=require("./render");
const {buildCells,instanceSvg}=require("./assemble");
const {verticalModel,verticalSvg}=require("./vertical");
function choirLevelsPlate(tile){
 if(!tile||tile.id!=="fallen_choir")throw Error("Choir comparison expects the Fallen Choir blueprint");
 const owner=buildCells(tile),model=verticalModel(owner,tile.terrain||{},tile.vertical||{});
 if(model.decks.size!==1||model.links.length!==2)throw Error("Expected one connected upper gallery and two access points");
 const main=makeSvg(tile);
 const composite=instanceSvg(main,"choir-main"),ghost=instanceSvg(main,"choir-ghost");
 const upper=verticalSvg(owner,tile.terrain||{},tile.vertical||{}).join("\n")
  .replace(/id="([^"]+)"/g,(_,id)=>'id="isolated-'+id+'"');
 const labels=[
  '<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="720" viewBox="0 0 1180 720" role="img" aria-label="The Fallen Choir: comparison of ground-level circulation and surviving elevated triforium">',
  '<title>The Fallen Choir | Lower circulation and surviving upper triforium</title>',
  '<rect width="1180" height="720" fill="#f5f2ea"/>',
  '<g fill="#272c29" font-family="Georgia,serif"><text x="48" y="54" font-size="29">THE FALLEN CHOIR</text>',
  '<text x="48" y="81" font-size="17">The fractured nave and surviving high gallery</text></g>',
  '<g fill="#3e4743" font-family="sans-serif" font-size="14" font-weight="700">',
  '<text x="48" y="115">I  /  COMPOSITE: LOWER ROUTES AND RAISED WALK</text>',
  '<text x="644" y="115">II  /  UPPER GALLERY ISOLATED</text></g>',
  '<g id="ground-and-upper-composite" transform="translate(48 129)">',composite,'</g>',
  '<g id="upper-floor-isolation" transform="translate(644 129)">',
  '<g opacity=".18">',ghost,'</g>',
  '<svg x="0" y="0" width="480" height="480" viewBox="0 0 480 480">',upper,'</svg></g>',
  '<g fill="#3d4743" font-family="sans-serif" font-size="14">',
  '<text x="48" y="642">Five collapsed arcade edges interrupt the lower nave.</text>',
  '<text x="644" y="642">Four upper cells and two ladders form a separate walk.</text>',
  '<text x="48" y="668" font-size="12">Schematic comparison; doors and edge portals remain at canonical locations.</text>',
  '<text x="48" y="689" font-size="12">Triforium height, fallen-masonry stability and headroom are provisional. Not a construction survey.</text>',
  '</g></svg>'
 ];
 return labels.join("\n")+"\n";
}
if(require.main===module){
 const all=JSON.parse(fs.readFileSync(path.join(__dirname,"blueprints.json"),"utf8"));
 const tile=all.tiles.find(t=>t.id==="fallen_choir");
 const dest=path.resolve(process.argv[2]||path.join(__dirname,"examples/fallen_choir_levels.svg"));
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,choirLevelsPlate(tile),"utf8");
 console.log("Two-level Choir comparison written: "+dest);
}
module.exports={choirLevelsPlate};
