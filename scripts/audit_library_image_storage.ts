import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { getAllCatalogGlazes, getAllCatalogFiringImages, getAllVendorExamples } from "../src/lib/catalog";

fs.mkdirSync("output/image-storage", { recursive: true });
const read = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));
const exists = (p: string) => { try { return fs.statSync(p).isFile() && fs.statSync(p).size > 0; } catch { return false; } };
const canonical = (url: string) => { try { return new URL(url).href; } catch { return url; } };
const tracked = new Set(execFileSync("git", ["ls-files", "-z"], {encoding:"utf8", maxBuffer:20_000_000}).split("\0"));
const archive = new Map<string, Set<string>>();
const hashFiles = new Map<string, string[]>();
for (const folder of ["data/vendor-images", "public/vendor-images"]) {
  for (const file of fs.readdirSync(folder, {recursive:true}) as string[]) {
    const match = file.match(/-([a-f0-9]{10})\.[^.]+$/);
    if (match) {
      const local=path.join(folder,file).replaceAll("\\","/");
      hashFiles.set(match[1],[...(hashFiles.get(match[1])??[]),local]);
    }
  }
}
function hashedCopies(url: string) {
  return [...new Set([url,canonical(url)])].flatMap(u=>hashFiles.get(createHash("sha1").update(u).digest("hex").slice(0,10))??[]);
}
const manifestIssues: object[] = [];
function register(url: string, local: string) {
  if (!url || !local) return;
  const key = canonical(url);
  if (!archive.has(key)) archive.set(key, new Set());
  archive.get(key)!.add(local.replaceAll("\\", "/"));
}
for (const manifest of ["data/vendors/vendor-image-catalog.json", "data/vendors/mayco-combination-image-archive.json"]) {
  const rows = read(manifest);
  let downloaded = 0, present = 0;
  for (const row of rows) {
    if (row.status === "downloaded") {
      downloaded++;
      if (row.assetPath && exists(row.assetPath)) present++;
      else manifestIssues.push({manifest, assetPath:row.assetPath, remoteUrl:row.remoteUrl ?? row.resolvedUrl});
    }
    const urls=[row.remoteUrl,row.resolvedUrl,...(row.candidateUrls??[]),...(row.references??[]).map((r:any)=>r.remoteUrl)].filter(Boolean);
    for (const url of urls) {
      if(row.assetPath) register(url,row.assetPath);
      for (const local of urls.flatMap(hashedCopies)) register(url,local);
    }
  }
  console.log(JSON.stringify({manifest,entries:rows.length,claimedDownloaded:downloaded,filesPresent:present}));
}
for (const entry of read("data/external-combination-archive/manifest.json").entries) {
  const metadata = read(entry.metadataPath);
  for (const image of metadata.images ?? []) register(image.remoteUrl,path.join(path.dirname(entry.metadataPath),"images",image.fileName));
}

for (const manifest of ["data/vendors/library-image-archive.json", "data/vendors/library-image-recoveries.json"]) {
  if (!fs.existsSync(manifest)) continue;
  const data = read(manifest);
  for (const [url, entry] of Object.entries(data.entries ?? data) as [string, any][]) {
    if (entry.status === "verified" && entry.path) register(url, entry.path);
  }
}

type Row = {category:string; id:string; brand:string; label:string; url:string|null|undefined};
const glazes = getAllCatalogGlazes();
const byId = new Map(glazes.map(g=>[g.id,g]));
const rows: Row[] = glazes.map(g=>({category:"Glaze primary images",id:g.id,brand:g.brand??"Unknown",label:`${g.code??""} ${g.name}`,url:g.imageUrl}));
for (const [id,images] of getAllCatalogFiringImages()) for(const image of images) rows.push({category:"Glaze firing images",id:image.id,brand:byId.get(id)?.brand??"Unknown",label:`${byId.get(id)?.code??id} ${image.label}`,url:image.imageUrl});
for(const example of getAllVendorExamples()) {
  rows.push({category:"Combination result images",id:example.id,brand:example.sourceVendor,label:example.title,url:example.imageUrl});
  for(const layer of example.layers) if(layer.sourceImageUrl) rows.push({category:"Combination layer reference images",id:layer.id,brand:example.sourceVendor,label:`${example.title}: ${layer.glazeName}`,url:layer.sourceImageUrl});
}
// Preserve source images retained by earlier vendor imports, even when the current UI uses another image.
const currentUrls = new Set(rows.map(row => row.url));
for (const manifest of ["data/vendors/vendor-image-catalog.json", "data/vendors/mayco-combination-image-archive.json"]) {
  for (const [index, entry] of read(manifest).entries()) {
    const url = entry.resolvedUrl || entry.remoteUrl;
    if (!url || currentUrls.has(url)) continue;
    currentUrls.add(url);
    rows.push({category:"Archived vendor source images",id:`${manifest}:${index}`,brand:entry.brand ?? "Vendor archive",label:entry.code ?? entry.assetPath ?? url,url});
  }
}
const results = rows.map(row=>{
  const url=row.url?.trim()??"";
  const remote=/^https?:\/\//i.test(url);
  const publicPath=url.startsWith("/")&&!url.startsWith("//")?`public${decodeURIComponent(url.split(/[?#]/)[0])}`:null;
  const candidates = [...new Set([...(archive.get(canonical(url))??[]),...hashedCopies(url)])];
  const copies = candidates.filter(exists);
  if(publicPath&&exists(publicPath)) copies.unshift(publicPath);
  return {...row,url,delivery:!url?"no-image":remote?"remote":publicPath?(exists(publicPath)?"local":"missing-local-file"):"other",localCopies:[...new Set(copies)],trackedCopies:copies.filter(p=>tracked.has(p)),missingArchiveFiles:candidates.filter(p=>!exists(p))};
});
const summarise=(entries:typeof results)=>({references:entries.length,servedLocally:entries.filter(r=>r.delivery==="local").length,servedRemotely:entries.filter(r=>r.delivery==="remote").length,missingLocalFiles:entries.filter(r=>r.delivery==="missing-local-file").length,noImage:entries.filter(r=>r.delivery==="no-image").length,withVerifiedLocalCopy:entries.filter(r=>r.localCopies.length).length,withoutVerifiedLocalCopy:entries.filter(r=>!r.localCopies.length).length,withTrackedLocalCopy:entries.filter(r=>r.trackedCopies.length).length});
const categories=Object.fromEntries([...new Set(results.map(r=>r.category))].map(c=>[c,summarise(results.filter(r=>r.category===c))]));
const byBrand=Object.fromEntries([...new Set(results.map(r=>r.brand))].sort().map(b=>[b,summarise(results.filter(r=>r.brand===b))]));
const report={generatedAt:new Date().toISOString(),scope:"Runtime bundled catalogue and archive manifests; hosted user uploads are excluded from counts.",categories,byBrand,manifestIssues,results};
fs.writeFileSync("output/image-storage/audit.json",JSON.stringify(report,null,2));
const csvValue=(v:unknown)=>'"'+String(v??"").replaceAll('"','""')+'"';
fs.writeFileSync("output/image-storage/missing-local-copies.csv",["Category,Brand,Label,URL,Missing archive paths",...results.filter(r=>!r.localCopies.length).map(r=>[r.category,r.brand,r.label,r.url,r.missingArchiveFiles.join("; ")].map(csvValue).join(","))].join("\n"));
fs.writeFileSync("output/image-storage/summary.md",`# Image storage audit\n\n${report.scope}\n\n| Image category | References | Served locally | Served remotely | Local copy verified | No local copy verified |\n|---|---:|---:|---:|---:|---:|\n`+Object.entries(categories).map(([c,s])=>`| ${c} | ${s.references} | ${s.servedLocally} | ${s.servedRemotely} | ${s.withVerifiedLocalCopy} | ${s.withoutVerifiedLocalCopy} |`).join("\n")+`\n\n${manifestIssues.length} archive entries marked downloaded point to missing or empty files. Counts are image references, not unique photos. Remote URLs were not downloaded or checked for availability.\n`);
console.log(JSON.stringify({categories,byBrand,missingArchiveEntries:manifestIssues.length,missingLocalPaths:results.filter(r=>r.delivery==="missing-local-file"),noImages:results.filter(r=>r.delivery==="no-image").map(r=>({brand:r.brand,label:r.label}))},null,2));
