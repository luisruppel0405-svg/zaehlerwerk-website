import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { calculatePrice } from '../src/pricing.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);
const pages=walk(dist).filter(f=>f.endsWith('.html'));
let references=0;
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'Duplicate ID in '+file);
 assert.equal([...html.matchAll(/<h1(?:\s[^>]*)?>/g)].length,1,'H1 in '+file);
 assert(/<html lang="de">/.test(html),'Page language');
 assert(/<meta name="viewport"/.test(html),'Viewport');
 assert(/<title>[^<]+<\/title>/.test(html),'Page title');
 assert(!/Produktkonzept|Beispieldaten|EINTRAGEN|meterflow-staging|mailto:info@/.test(html),'Stale launch copy in '+file);
 for(const match of html.matchAll(/\b(?:href|src)="([^"]*)"/g)){
  const value=match[1];
  if(!value||/^(https?:|mailto:|tel:|data:)/.test(value))continue;
  const url=new URL(value,'https://site.test'+(path.relative(dist,file).replace(/index\.html$/,'')||'/'));
  let target=value.startsWith('#')?file:path.join(dist,decodeURIComponent(url.pathname));
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  assert(fs.existsSync(target),'Broken local reference '+value+' in '+file);
  if(url.hash&&target.endsWith('.html')){
    const targetHtml=fs.readFileSync(target,'utf8');
    assert(targetHtml.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),'Broken anchor '+value);
  }
  references++;
 }
 for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(json);
 for(const img of html.matchAll(/<img\b([^>]+)>/g))assert(/\balt="/.test(img[1]),'Missing image alt');
}
const cases=[
 [1,2900,19],[100,2900,19],[152,2900,19],[153,2907,19],
 [300,5700,19],[500,9500,19],[501,7515,15],
 [2000,30000,15],[2001,24012,12],[5000,60000,12]
];
for(const [n,total,rate]of cases){
 const p=calculatePrice(n);
 assert.equal(p.monthlyCents,total);assert.equal(p.rateCents,rate);assert.equal(p.custom,false);
 const a=calculatePrice(n,'annual');
 assert.equal(a.annualCents,Math.round(total*12*.9));
 assert.equal(a.displayCents,a.annualCents/12);
}
assert.equal(calculatePrice(5001).custom,true);
for(const n of ['',0,-1,1.2,'abc',1000001,Infinity])assert.equal(calculatePrice(n),null);
assert.equal(calculatePrice(300,'invalid'),null);
const contact=fs.readFileSync(path.join(dist,'kontakt/index.html'),'utf8');
assert(contact.includes('class="button" disabled>Anfrage senden'));
assert(contact.includes('Ihre Nachricht ist bei uns angekommen.'));
assert(contact.includes('class="hp-field"'),'Spamschutz-Feld fehlt');
const js=fs.readFileSync(path.join(dist,'main.js'),'utf8');
// Das Formular sendet serverseitig; gespeichert wird im Browser nur die
// Design-Auswahl. Beides steht so in der Datenschutzerklärung.
assert(js.includes("fetch('/api/kontakt'"),'Kontakt-Endpunkt fehlt');
assert(!/sessionStorage|document\.cookie/.test(js),'Unerwarteter Browser-Speicher');
assert(!/localStorage\.(get|set)Item\((?!'zw-theme')/.test(js),'Unerwarteter localStorage-Schluessel');
// Die Seite ist veröffentlicht und soll gefunden werden.
assert(fs.readFileSync(path.join(dist,'robots.txt'),'utf8').includes('Allow: /'),'Suchmaschinen ausgesperrt');
const size=walk(dist).reduce((sum,f)=>sum+fs.statSync(f).size,0);
console.log('PASS: '+pages.length+' pages, '+references+' internal references, structured metadata, pricing tier/minimum/yearly boundaries, contact safeguards.');
console.log('Static payload including all original screenshots: '+Math.round(size/1024)+' KiB.');