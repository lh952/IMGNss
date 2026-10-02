(()=>{"use strict";
const PASS="333784",META="data/images.json",OWNER="lh952",REPO="IMGNss",BRANCH="main";
const CATS=["All","Logos","Posters","Certificates","NSS","College","Events","Nature","Education","Others"];
const $=id=>document.getElementById(id),state={images:[],category:"All",query:"",tab:"All",sort:localStorage.getItem("imgOrder")||"time-desc"};
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function norm(s=""){return String(s).toLocaleLowerCase("en-IN").normalize("NFKC").trim()}
function show(id){$(id).classList.remove("hidden");document.body.style.overflow="hidden"}
function close(id){$(id).classList.add("hidden");if(!document.querySelector(".modal:not(.hidden)"))document.body.style.overflow=""}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));
["viewer","uploadModal","deleteModal"].forEach(id=>{
 const modal=$(id);
 modal.addEventListener("click",e=>{
  if(e.target===modal){ if(id==="viewer")closeViewer(); else close(id); }
 });
});
window.addEventListener("keydown",e=>{if(e.key==="Escape")closeTopLayer()});
window.addEventListener("popstate",()=>closeTopLayer());
function closeTopLayer(){
 if(!$("viewer").classList.contains("hidden")){closeViewer();return}
 if(!$("uploadModal").classList.contains("hidden")){close("uploadModal");return}
 if(!$("deleteModal").classList.contains("hidden")){close("deleteModal");return}
 if(menu.classList.contains("open"))closeMenu();
}

const menu=$("sideMenu"),back=$("menuBackdrop");
function openMenu(){menu.classList.add("open");menu.setAttribute("aria-hidden","false");$("menuBtn").setAttribute("aria-expanded","true");back.classList.remove("hidden")}
function closeMenu(){menu.classList.remove("open");menu.setAttribute("aria-hidden","true");$("menuBtn").setAttribute("aria-expanded","false");back.classList.add("hidden")}
$("menuBtn").onclick=openMenu;$("menuClose").onclick=closeMenu;back.onclick=closeMenu;
$("openUpload").onclick=()=>{closeMenu();show("uploadModal")};$("openDelete").onclick=()=>{closeMenu();renderDeleteList();show("deleteModal")};
$("normalMode").onclick=()=>setMode("normal");$("darkMode").onclick=()=>setMode("dark");
function setMode(m){document.body.classList.toggle("dark",m==="dark");localStorage.setItem("imgMode",m)}
setMode(localStorage.getItem("imgMode")||"normal");
function api(path,opt={}){return fetch("https://api.github.com"+path,{...opt,headers:{"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(opt.headers||{})}})}
async function err(r){let b="";try{let j=await r.json();b=j.message||JSON.stringify(j)}catch{}throw Object.assign(new Error(r.status+" "+r.statusText+(b?" — "+b:"")),{status:r.status})}
function raw(path){return "https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/"+BRANCH+"/"+path}
function fmtDate(v){if(!v)return"";let d=new Date(v);return isNaN(d)?"":d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function sortImages(a){return [...a].sort((x,y)=>{if(state.sort==="name-asc")return norm(x.name||"").localeCompare(norm(y.name||""));if(state.sort==="name-desc")return norm(y.name||"").localeCompare(norm(x.name||""));let A=new Date(x.uploadedAt||0).getTime(),B=new Date(y.uploadedAt||0).getTime();return state.sort==="time-asc"?A-B:B-A})}
function renderCats(){ $("cats").innerHTML=CATS.map(c=>'<button class="cat '+(c===state.category?"active":"")+'" data-cat="'+esc(c)+'">'+esc(c)+"</button>").join("");document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;renderCats();render()})}
function searchable(x){return norm([x.name,x.title,x.category,x.keywords,x.uploadedAt,fmtDate(x.uploadedAt)].filter(Boolean).join(" "))}
function filtered(){let q=norm(state.query);let arr=state.images.filter(x=>(state.category==="All"||x.category===state.category)&&(!q||searchable(x).includes(q)));return sortImages(arr)}
function render(){let arr=filtered();if(state.tab==="Activity")arr=sortImages(state.images.filter(x=>!state.query||searchable(x).includes(norm(state.query)))).slice(0,50);$("empty").classList.toggle("hidden",arr.length>0);$("activityBar").classList.toggle("hidden",state.tab!=="Activity");$("activityBar").textContent=state.tab==="Activity"?"Showing recent image activity (newest uploads first).":"";$("gallery").innerHTML=arr.map(x=>'<article class="card" data-path="'+esc(x.path)+'"><img loading="lazy" src="'+esc(x.url||raw(x.path))+'" alt="Image"><div class="card-date">'+esc(fmtDate(x.uploadedAt)||"Date unavailable")+"</div></article>").join("");document.querySelectorAll(".card").forEach(c=>c.onclick=()=>openViewer(state.images.findIndex(x=>x.path===c.dataset.path)))}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));render()});
$("search").oninput=e=>{state.query=e.target.value;render()};$("sortOrder").value=state.sort;$("sortOrder").onchange=e=>{state.sort=e.target.value;localStorage.setItem("imgOrder",state.sort);render()};
let viewerIndex=-1;
function openViewer(i){
 let x=state.images[i]; if(!x)return;
 viewerIndex=i;
 $("viewerImg").src=x.url||raw(x.path);
 $("viewerTitle").textContent=x.title||x.name||"Image";
 $("viewerMeta").textContent=fmtDate(x.uploadedAt)||"";
 $("viewerCategory").textContent=x.category||"Others";
 $("downloadStatus").textContent=""; $("downloadStatus").className="download-status";
 $("downloadBtn").onclick=()=>downloadImage(x);
 $("openOriginalBtn").onclick=()=>window.open(x.url||raw(x.path),"_blank","noopener");
 $("viewerDeleteBtn").onclick=()=>{closeViewer();renderDeleteList(i);show("deleteModal");};
 show("viewer");
}
function closeViewer(){if(!$("viewer").classList.contains("hidden"))close("viewer");viewerIndex=-1}
async function downloadImage(x){let btn=$("downloadBtn"),load=$("viewerLoading"),st=$("downloadStatus");btn.disabled=true;load.classList.remove("hidden");try{let r=await fetch(x.url||raw(x.path),{mode:"cors",cache:"no-store"});if(!r.ok)throw Error();let blob=await r.blob(),name=(x.name||"image.jpg").replace(/[^a-zA-Z0-9._-]+/g,"-"),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);st.textContent="✓ Download started.";st.className="download-status ok"}catch(e){st.textContent="Direct download was blocked by the browser. Opening the original image…";st.className="download-status error";window.open(x.url||raw(x.path),"_blank","noopener")}finally{load.classList.add("hidden");btn.disabled=false}}
async function loadImages(){try{let r=await fetch(META+"?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error("Could not load image catalogue ("+r.status+")");let d=await r.json();state.images=Array.isArray(d)?d:[];renderCats();render()}catch(e){state.images=[];renderCats();render();console.error(e)}}
function status(id,msg,type){let e=$(id);e.textContent=msg;e.className="status show "+type}
function progress(n,t){$("progress").style.width=n+"%";$("progressPercent").textContent=Math.round(n)+"%";$("progressText").textContent=t}
function b64(file){return new Promise((res,rej)=>{let f=new FileReader();f.onprogress=e=>e.lengthComputable&&progress(5+e.loaded/e.total*15,"Reading images…");f.onload=()=>res(String(f.result).split(",")[1]);f.onerror=()=>rej(Error("Could not read image"));f.readAsDataURL(file)})}
function put(url,body,token,onProgress){return new Promise((res,rej)=>{let x=new XMLHttpRequest();x.open("PUT",url);x.setRequestHeader("Accept","application/vnd.github+json");x.setRequestHeader("Content-Type","application/json");x.setRequestHeader("Authorization","Bearer "+token);x.setRequestHeader("X-GitHub-Api-Version","2022-11-28");x.upload.onprogress=e=>e.lengthComputable&&onProgress(e.loaded/e.total);x.onerror=()=>rej(Error("Network error"));x.onload=()=>{let d={};try{d=JSON.parse(x.responseText||"{}")}catch{};if(x.status>=200&&x.status<300)res(d);else rej(Object.assign(Error(x.status+" "+x.statusText+(d.message?" — "+d.message:"")),{status:x.status}))};x.send(JSON.stringify(body))})}
async function getMeta(token){let r=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+META+"?ref="+BRANCH,{headers:{Authorization:"Bearer "+token}});if(!r.ok)await err(r);let d=await r.json(),s=(d.content||"").replace(/\s/g,"");let bin=atob(s),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));let items=[];try{items=JSON.parse(new TextDecoder().decode(bytes))}catch{}return{items:Array.isArray(items)?items:[],sha:d.sha}}
function encodeUtf8(s){let b=new TextEncoder().encode(s),bin="";for(let i=0;i<b.length;i+=0x8000)bin+=String.fromCharCode(...b.subarray(i,i+0x8000));return btoa(bin)}
$("file").onchange=()=>{$("fileInfo").textContent=$("file").files.length?Array.from($("file").files).map(f=>f.name).join(" • "):"No files selected"};
$("uploadForm").onsubmit=async e=>{e.preventDefault();let pass=$("password").value,token=$("token").value.trim(),files=Array.from($("file").files);if(pass!==PASS)return status("uploadStatus","Wrong password.","err");if(!token||!files.length)return status("uploadStatus","Enter the password, token and select at least one image.","err");if(files.some(f=>!f.type.startsWith("image/")||f.size>25*1024*1024))return status("uploadStatus","Every file must be an image under 25 MB.","err");$("uploadBtn").disabled=true;try{let rr=await api("/repos/"+OWNER+"/"+REPO,{headers:{Authorization:"Bearer "+token}});if(!rr.ok)await err(rr);let meta=await getMeta(token),newItems=[],total=files.length;for(let i=0;i<files.length;i++){let f=files[i];status("uploadStatus","Uploading "+(i+1)+" of "+total+"…","info");let b=await b64(f),safe=f.name.replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-120),path="images/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"-"+safe;await put("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+path,{message:"Add image: "+f.name,content:b,branch:BRANCH},token,p=>progress(20+(i+p)/total*65,"Uploading "+(i+1)+" of "+total+"…"));newItems.push({name:f.name,title:$("title").value.trim()||f.name.replace(/\.[^.]+$/,""),category:$("category").value,keywords:$("keywords").value.trim(),url:raw(path),path,uploadedAt:new Date().toISOString()})}progress(90,"Saving catalogue…");let items=[...newItems,...meta.items],body={message:"Update image catalogue",content:encodeUtf8(JSON.stringify(items,null,2)+"\n"),branch:BRANCH,sha:meta.sha};await put("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+META,body,token,p=>progress(90+p*10,"Saving catalogue…"));progress(100,"Upload complete");status("uploadStatus","✓ "+total+" image(s) uploaded successfully.","ok");$("token").value="";await loadImages();setTimeout(()=>close("uploadModal"),900)}catch(e){status("uploadStatus",(e.status===401?"Invalid or expired token. ":e.status===403?"Token needs Contents: Read and write permission. ":"")+e.message,"err")}finally{$("uploadBtn").disabled=false}};
function renderDeleteList(preselect=-1){let l=$("deleteList");l.innerHTML=state.images.length?state.images.map((x,i)=>'<div class="delete-row"><input type="checkbox" class="del-check" value="'+i+'" '+(i===preselect?"checked":"")+"/><img src="'+esc(x.url||raw(x.path))+'" alt=""><label>'+esc(x.name||"Image")+'<small> • '+esc(fmtDate(x.uploadedAt)||"")+"</small></label></div>").join(""):'<div class="muted">No images available.</div>'}
$("deleteForm").onsubmit=async e=>{e.preventDefault();let pass=$("deletePassword").value,token=$("deleteToken").value.trim(),idx=Array.from(document.querySelectorAll(".del-check:checked")).map(x=>+x.value);if(pass!==PASS)return status("deleteStatus","Wrong password.","err");if(!token||!idx.length)return status("deleteStatus","Enter the password, token and select at least one image.","err");if(!confirm("Delete "+idx.length+" selected image(s)? This cannot be undone."))return;$("deleteBtn").disabled=true;try{let meta=await getMeta(token),selected=idx.map(i=>state.images[i]).filter(Boolean);for(let i=0;i<selected.length;i++){let x=selected[i];status("deleteStatus","Deleting "+(i+1)+" of "+selected.length+"…","info");let fr=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+x.path+"?ref="+BRANCH,{headers:{Authorization:"Bearer "+token}});if(!fr.ok)await err(fr);let fd=await fr.json();let dr=await api("/repos/"+OWNER+"/"+REPO+"/contents/"+x.path,{method:"DELETE",headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"},body:JSON.stringify({message:"Delete image: "+x.name,sha:fd.sha,branch:BRANCH})});if(!dr.ok)await err(dr);
 state.images=state.images.filter(item=>item.path!==x.path);
 renderCats();render();renderDeleteList();
 }
 let gone=new Set(selected.map(x=>x.path)),remaining=meta.items.filter(x=>!gone.has(x.path));await put("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+META,{message:"Update image catalogue after deletion",content:encodeUtf8(JSON.stringify(remaining,null,2)+"\n"),branch:BRANCH,sha:meta.sha},token,()=>{});status("deleteStatus","✓ Selected image(s) deleted successfully.","ok");$("deletePassword").value="";$("deleteToken").value="";await loadImages();setTimeout(()=>close("deleteModal"),900)}catch(e){status("deleteStatus",(e.status===401?"Invalid or expired token. ":e.status===403?"Token needs Contents: Read and write permission. ":"")+e.message,"err")}finally{$("deleteBtn").disabled=false}};
loadImages();
})();