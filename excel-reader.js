/* Pembaca XLSX lokal untuk format Rekap Laporan Mingguan Listrik PT LAPI.
   Tanpa server/CDN: XML Office Open XML dibaca memakai API browser, tidak mengeksekusi macro/formula. */
(() => {
 'use strict';
 const MONTH_MAP={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,jul:7,agustus:8,agt:8,september:9,sept:9,oktober:10,okt:10,november:11,novmber:11,nov:11,desember:12,des:12};
 const sheetMonth=name => {
   const n=String(name).toLowerCase().replace(/['’]\d\d/g,'').trim();
   return MONTH_MAP[n] || MONTH_MAP[n.replace(/[^a-z]/g,'')] || null;
 };
 const norm=s=>String(s??'').toLowerCase().replace(/\u00a0/g,' ').replace(/&/g,' dan ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const colIndex=s=>{let n=0;for(const ch of s)n=n*26+ch.charCodeAt(0)-64;return n-1};
 const xmlDoc=str=>{const doc=new DOMParser().parseFromString(str,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Struktur XML Excel tidak valid.');return doc};
 const nodeText=(node,tag)=>node?.getElementsByTagName(tag)[0]?.textContent??'';
 const cellValue=(cell,strings)=>{
   const kind=cell.getAttribute('t');if(kind==='e')return null;
   let value=nodeText(cell,'v');
   if(kind==='inlineStr')return nodeText(cell,'is');
   if(kind==='s')return strings[Number(value)]??'';
   if(kind==='str'||kind==='d')return value;
   if(value==='')return null;
   const n=Number(value);return Number.isFinite(n)?n:value;
 };
 const parseRows=(xml,strings)=>{
   const doc=xmlDoc(xml),rows=[];
   for(const row of doc.getElementsByTagName('row')){
     const i=Number(row.getAttribute('r'))-1;
     if(!Number.isInteger(i)||i<0)continue;
     const cells=new Map();
     for(const cell of row.getElementsByTagName('c')){
       const ref=cell.getAttribute('r')||'',m=ref.match(/^([A-Z]+)/);
       if(!m)continue;
       const value=cellValue(cell,strings);
       if(value!==null&&value!=='')cells.set(colIndex(m[1]),value);
     }
     if(cells.size)rows[i]=cells;
   }
   return rows;
 };
 const text=val=>String(val??'').trim();
 const number=val=>{if(typeof val==='number')return Number.isFinite(val)&&val>=0?val:null;if(typeof val==='string'&&/^\d+(?:\.\d+)?$/.test(val.trim())){const n=Number(val.trim());return Number.isFinite(n)&&n>=0?n:null}return null;};
 const hour=val=>{
   if(typeof val==='number'&&Number.isFinite(val)&&val>=0&&val<=1){const h=Math.round(val*24);return Math.abs(h/24-val)<0.00005?h:null}
   if(typeof val==='string'){const m=val.trim().match(/^(\d{1,2})(?:[:.]00)?\s*(?:WIB)?$/i);if(m){const h=+m[1];return h>=0&&h<=24?h:null}}
   return null;
 };
 const readDay=(raw,month,year)=>{
   // Wajib ada nomor hari eksplisit; label tanggal palsu / sisa template diabaikan.
   const val=text(raw).toLowerCase(),m=val.match(/(?:^|[^\d])(\d{1,2})(?=\s|\D|$)/);
   if(!m)return null;
   const day=Number(m[1]);if(day<1||day>31)return null;
   const explicitYear=val.match(/20\d\d/);
   if(explicitYear&&Number(explicitYear[0])!==year)return null;
   for(const [label,mnum] of Object.entries(MONTH_MAP)){
     if(new RegExp('\\b'+label+'\\b','i').test(val)&&mnum!==month)return null;
   }
   const dt=new Date(year,month-1,day);
   if(dt.getFullYear()!==year||dt.getMonth()+1!==month||dt.getDate()!==day)return null;
   return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 };
 const getYear=(name,index,rows)=>{
   const explicit=String(name).match(/['’](\d\d)\b/);
   if(explicit)return 2000+Number(explicit[1]);
   // Ambil tahun dominan dari judul atau label tanggal, bukan dari urutan sheet saja.
   // Ini juga mendukung laporan tahun baru, tanpa harus memodifikasi aplikasi.
   const counts=new Map(),month=sheetMonth(name);
   for(const row of rows){if(!row)continue;
     for(const [col,value] of row){if(typeof value!=='string'||col>260)continue;
       const y=value.match(/\b(20\d{2})\b/);if(!y)continue;
       const lower=value.toLowerCase(),months=Object.keys(MONTH_MAP).filter(w=>new RegExp('\\b'+w+'\\b','i').test(lower));
       if(months.length&&month&&!months.some(w=>MONTH_MAP[w]===month))continue;
       const yr=Number(y[1]);counts.set(yr,(counts.get(yr)||0)+1);
     }
   }
   if(counts.size)return Array.from(counts).sort((a,b)=>b[1]-a[1])[0][0];
   return index<=10?2026:2025;
 };
 const readFile=async file=>{
   if(!file||!(/\.xlsx$/i.test(file.name)))throw Error('Pilih berkas Excel .xlsx, bukan .xls atau .csv.');
   if(file.size>35*1024*1024)throw Error('File Excel terlalu besar (maksimal 35 MB).');
   if(!('DecompressionStream' in window))throw Error('Browser tidak mendukung pembacaan XLSX lokal. Gunakan Chrome/Edge/Firefox versi terbaru.');
   const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer),view=new DataView(buffer);
   const u16=offset=>view.getUint16(offset,true),u32=offset=>view.getUint32(offset,true);
   let eocd=-1;
   for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(u32(i)===0x06054b50){eocd=i;break}
   if(eocd<0)throw Error('File bukan ZIP/XLSX yang valid.');
   const count=u16(eocd+10),offset=u32(eocd+16),files=new Map();let p=offset;
   if(count>3000||offset>=bytes.length)throw Error('Arsip Excel tidak valid atau terlalu kompleks.');
   const decoder=new TextDecoder('utf-8');
   for(let i=0;i<count;i++){
     if(p+46>bytes.length||u32(p)!==0x02014b50)throw Error('Struktur ZIP Excel rusak.');
     const method=u16(p+10),compressed=u32(p+20),size=u32(p+24),len=u16(p+28),extra=u16(p+30),comment=u16(p+32),local=u32(p+42);
     const name=decoder.decode(bytes.subarray(p+46,p+46+len));p+=46+len+extra+comment;
     if(!/^xl\//.test(name))continue;
     if(size>45*1024*1024)throw Error('Sheet Excel terlalu besar untuk dibaca aman.');
     files.set(name,{method,compressed,size,local});
   }
   const load=async name=>{
     const entry=files.get(name);if(!entry)throw Error(`Bagian XLSX tidak ditemukan: ${name}`);
     const pos=entry.local;
     if(pos+30>bytes.length||u32(pos)!==0x04034b50)throw Error('Header file XLSX rusak.');
     const start=pos+30+u16(pos+26)+u16(pos+28),end=start+entry.compressed;
     if(end>bytes.length)throw Error('Ukuran data XLSX tidak valid.');
     if(entry.method===0)return decoder.decode(bytes.subarray(start,end));
     if(entry.method!==8)throw Error('Metode kompresi XLSX tidak didukung.');
     const stream=new Blob([bytes.subarray(start,end)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
     const data=await new Response(stream).arrayBuffer();
     if(data.byteLength>45*1024*1024||data.byteLength!==entry.size)throw Error('Ukuran hasil ekstraksi Excel tidak sesuai.');
     return decoder.decode(data);
   };
   let shared=[];
   if(files.has('xl/sharedStrings.xml')){
     const doc=xmlDoc(await load('xl/sharedStrings.xml'));
     shared=Array.from(doc.getElementsByTagName('si'),n=>n.textContent||'');
   }
   const workbook=xmlDoc(await load('xl/workbook.xml'));
   const rels=xmlDoc(await load('xl/_rels/workbook.xml.rels'));
   const links=new Map(Array.from(rels.getElementsByTagName('Relationship'),e=>[e.getAttribute('Id'),e.getAttribute('Target')]));
   const sheets=Array.from(workbook.getElementsByTagName('sheet'),e=>({name:e.getAttribute('name'),id:e.getAttribute('r:id')||e.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')}));
   const content=[];
   for(let i=0;i<sheets.length;i++){
     const sh=sheets[i],ref=links.get(sh.id);if(!ref)continue;
     let path=ref.replace(/^\//,'').replace(/^\.\//,'');
     if(!path.startsWith('xl/'))path='xl/'+path;
     if(!files.has(path))continue;
     const rows=parseRows(await load(path),shared);
     content.push({name:sh.name,index:i,year:getYear(sh.name,i,rows),month:sheetMonth(sh.name),rows});
   }
   return content;
 };
 function extract(sheets,panels){
   const byName=new Map();
   for(const panel of panels)byName.set(norm(panel.name),panel);
   const readings=new Map(),snapshots=new Map(),unknown=new Set(),unitIssues=new Set(),dateIssues=new Set();
   const issues={unreadable:0,duplicate:0,skippedDates:0,matchedPanels:new Set(),readings:0,snapshots:0};
   for(const sh of sheets){
     const {rows,year,month}=sh;
     if(!month){dateIssues.add(sh.name+' (bulan tidak dikenali)');continue}
     let tableCount=0;
     for(let i=0;i<rows.length;i++){
       const hdr=rows[i];if(!hdr||norm(hdr.get(0))!=='no'||!norm(hdr.get(1)).includes('lokasi'))continue;
       tableCount++;
       const dateCells=rows[i+1],times=rows[i+2];
       if(!dateCells)continue;
       const starts=Array.from(hdr.entries()).filter(([col,v])=>col>=3&&norm(v).includes('tanggal')).map(([col])=>col).sort((a,b)=>a-b);
       const hasHourly=!!(starts.length&&times&&starts.some((start,j)=>{
         const end=j+1<starts.length?starts[j+1]:Infinity;
         return Array.from(times.entries()).some(([col,val])=>col>=start&&col<end&&hour(val)!==null);
       }));
       if(hasHourly){
         for(let j=0;j<starts.length;j++){
           const start=starts[j],end=j+1<starts.length?starts[j+1]:Infinity,date=readDay(dateCells.get(start),month,year);
           if(!date){issues.skippedDates++;continue}
           const timeCols=Array.from(times.entries()).filter(([col,v])=>col>=start&&col<end&&hour(v)!==null).map(([col,v])=>[col,hour(v)]);
           if(!timeCols.length)continue;
           for(let r=i+3;r<rows.length;r++){
             const row=rows[r];if(!row)continue;
             if(norm(row.get(0))==='no')break;
             const panelName=text(row.get(1));if(!panelName||norm(panelName)==='kw total')continue;
             const panel=byName.get(norm(panelName))||(norm(panelName)==='pabel pac hormon'?byName.get('panel pac hormon'):null);if(!panel){unknown.add(panelName);continue}
             issues.matchedPanels.add(panel.id);
             const unit=text(row.get(2)).toUpperCase();
             // Tidak membuang pembacaan karena satuan berbeda: simpan satuan sumber per tanggal-panel.
             // Hal ini penting pada PUTR 3 (MWh di Excel, tetapi label panel historis GWh).
             const excelUnit=['KWH','MWH','GWH'].includes(unit)?unit:null;
             if(excelUnit&&panel.unit!=='UNKNOWN'&&excelUnit!==panel.unit)unitIssues.add(`${panelName} (${sh.name}: ${excelUnit} ≠ label lama ${panel.unit})`);
             const measurements=[],unreadable=[];
             for(const [col,h] of timeCols){const value=row.get(col);if(value===undefined)continue;
               const n=number(value);
               if(n!==null)measurements.push([h,n]);
               else if(text(value))unreadable.push(text(value).slice(0,130));
             }
             if(!measurements.length)continue;
             const key=date+'|'+panel.id,prev=readings.get(key),hm=new Map(prev?.r||[]);
             // Beda satuan pada tanggal-panel sama harus ditinjau, tidak digabung sebagai satu angka.
             if(prev?.unit&&excelUnit&&prev.unit!==excelUnit){unitIssues.add(`${panelName} ${date}: ${prev.unit} berbeda dari ${excelUnit}; jangan gabungkan secara otomatis`);continue;}
             for(const [h,v] of measurements){if(hm.has(h)&&hm.get(h)!==v)issues.duplicate++;else hm.set(h,v)}
             readings.set(key,{date,panelId:panel.id,r:Array.from(hm.entries()).sort((a,b)=>a[0]-b[0]),unit:excelUnit||prev?.unit||null,src:sh.name,unreadable:[...new Set([...(prev?.unreadable||[]),...unreadable])].slice(0,30)});
             issues.unreadable+=unreadable.length;
           }
         }
       }
       else if(year===2025&&month>=7&&month<=10){
         // Layout arsip mingguan: D:I = MG 1..5/akhir bulan.
         // Pada Oktober terdapat tabel harian kedua di kanan; cukup baca arsip kiri.
         const dateLabels=rows[i+1];if(!dateLabels)continue;
         const dates=[];
         for(let col=3;col<=8;col++){
           const m=text(dateLabels.get(col)).match(/(?:tgl|tanggal)\s*(\d{1,2})/i);
           if(m){const date=readDay(m[1],month,year);if(date)dates.push([col,Number(m[1])]);}
         }
         if(!dates.length)continue;
         for(let r=i+3;r<rows.length;r++){
           const row=rows[r];if(!row)continue;
           if(norm(row.get(0))==='no')break;
           const name=text(row.get(1));if(!name||norm(name)==='kw total')continue;
           const panel=byName.get(norm(name))||(norm(name)==='pabel pac hormon'?byName.get('panel pac hormon'):null);if(!panel){unknown.add(name);continue}
           issues.matchedPanels.add(panel.id);
           const unit=text(row.get(2)).toUpperCase()||panel.unit;
           for(const [col,day] of dates){const val=number(row.get(col));if(val===null)continue;
             const key=`${year}-${String(month).padStart(2,'0')}|${panel.id}|${day}`;
             snapshots.set(key,{year,month,day,panelId:panel.id,value:val,unit,raw:val,src:sh.name});
           }
         }
       }
     }
     if(!tableCount)dateIssues.add(sh.name+' (tabel tidak dikenali)');
   }
   issues.readings=readings.size;issues.snapshots=snapshots.size;
   return {readings:Array.from(readings.values()),snapshots:Array.from(snapshots.values()),sheets:sheets.map(s=>s.name),unknown:Array.from(unknown),unitIssues:Array.from(unitIssues),dateIssues:Array.from(dateIssues),stats:{...issues,matchedPanels:issues.matchedPanels.size}};
 }
 window.LapiExcelReader={readFile,extract};
})();
