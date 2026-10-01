(() => {
"use strict";

const PASS = "333784";
const META = "data/images.json";
const CATS = ["All","Logos","Posters","Certificates","NSS","College","Events","Nature","Education","Others"];

const $ = id => document.getElementById(id);
const state = { images: [], category: "All", query: "" };

function esc(s="") {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function showModal(id){ $(id).classList.remove("hidden"); document.body.style.overflow="hidden"; }
function closeModal(id){ $(id).classList.add("hidden"); if(document.querySelectorAll(".modal:not(.hidden)").length===0) document.body.style.overflow=""; }
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
$("openUpload").addEventListener("click",()=>showModal("uploadModal"));

function api(path, options={}) {
  return fetch("https://api.github.com" + path, {
    ...options,
    headers: {
      "Accept":"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28",
      ...(options.headers||{})
    }
  });
}
async function responseError(r) {
  let body="";
  try { const j=await r.json(); body=j.message||JSON.stringify(j); } catch {}
  const msg = `${r.status} ${r.statusText}${body ? " — "+body : ""}`;
  const e = new Error(msg); e.status=r.status; throw e;
}
async function jsonGet(owner,repo,path,token) {
  const r=await api(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}?ref=${encodeURIComponent(localStorage.getItem("libBranch")||"main")}`,{
    headers:{Authorization:`Bearer ${token}`}
  });
  if(!r.ok) await responseError(r);
  return r.json();
}
function setProgress(n,text) {
  $("progress").style.width = `${Math.max(0,Math.min(100,n))}%`;
  $("progressPercent").textContent = `${Math.round(n)}%`;
  $("progressText").textContent = text;
}
function status(msg,type="info") {
  const el=$("uploadStatus");
  el.textContent=msg; el.className=`status show ${type}`;
}
function formatBytes(n){
  if(!Number.isFinite(n)) return "";
  const u=["B","KB","MB","GB"]; let i=0;
  while(n>=1024&&i<u.length-1){n/=1024;i++}
  return `${n.toFixed(i?1:0)} ${u[i]}`;
}
function loadSaved(){
  $("owner").value=localStorage.getItem("libOwner")||"";
  $("repo").value=localStorage.getItem("libRepo")||"";
  $("branch").value=localStorage.getItem("libBranch")||"main";
}
loadSaved();

$("file").addEventListener("change",()=>{
  const f=$("file").files[0];
  $("fileInfo").textContent=f ? `${f.name} • ${formatBytes(f.size)} • ${f.type||"unknown type"}` : "No file selected";
  if(f && f.size>25*1024*1024) status("This image is over 25 MB. Please choose a smaller image.","err");
  else if(f) status("File selected. Ready to upload.","info");
});

function renderCats(){
  $("cats").innerHTML=CATS.map(c=>`<button class="cat ${c===state.category?"active":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;renderCats();render();});
}
function render(){
  const q=normalizeText(state.query);
  const arr=state.images.filter(x=>{
    const text=normalizeText([x.title,x.category,x.keywords,x.name].filter(Boolean).join(" "));
    return (state.category==="All"||x.category===state.category) && (!q||text.includes(q));
  });
  $("empty").classList.toggle("hidden",arr.length>0);
  $("gallery").innerHTML=arr.map((x,i)=>`
    <article class="card" data-index="${state.images.indexOf(x)}">
      <img loading="lazy" src="${esc(x.url)}" alt="${esc(x.title||x.name||"Image")}" onerror="this.style.opacity=.35">
      <div class="card-body"><div class="card-title">${esc(x.title||x.name||"Untitled")}</div>
      <div class="card-meta">${esc(x.category||"Others")}</div></div>
    </article>`).join("");
  document.querySelectorAll(".card").forEach(c=>c.onclick=()=>openViewer(Number(c.dataset.index)));
}
function normalizeText(v=""){return String(v).toLocaleLowerCase("en-IN").normalize("NFKC").trim();}
function openViewer(i){const x=state.images[i];if(!x)return;$("viewerImg").src=x.url;$("viewerImg").alt=x.title||"Image";$("viewerTitle").textContent=x.title||x.name||"Image";$("viewerMeta").textContent=x.keywords?`Keywords: ${x.keywords}`:(x.name||"");$("viewerCategory").textContent=x.category||"Others";$("downloadStatus").textContent="";$("downloadStatus").className="download-status";$("downloadBtn").onclick=()=>downloadImage(x);$("openOriginalBtn").onclick=()=>window.open(x.url,"_blank","noopener");showModal("viewer");}
async function downloadImage(x){const btn=$("downloadBtn"),loading=$("viewerLoading"),st=$("downloadStatus");btn.disabled=true;loading.classList.remove("hidden");st.textContent="Preparing your download…";try{const r=await fetch(x.url,{mode:"cors",cache:"no-store"});if(!r.ok)throw new Error();const blob=await r.blob();const ext=(x.name||"image.jpg").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";const safe=(x.title||"image").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)||"image";const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=`${safe}.${ext}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);st.textContent="✓ Download started. Check your Downloads folder.";st.className="download-status ok";}catch(e){st.textContent="Browser blocked direct download. Opening original image…";st.className="download-status error";window.open(x.url,"_blank","noopener");}finally{loading.classList.add("hidden");btn.disabled=false;}}
$("search").addEventListener("input",e=>{state.query=e.target.value;render();});

async function loadImages(){
  try{
    const r=await fetch(`${META}?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok) throw new Error(`Could not load ${META} (${r.status})`);
    const data=await r.json();
    state.images=Array.isArray(data)?data:[];
    renderCats(); render();
  }catch(e){
    state.images=[]; renderCats(); render();
    status("Gallery data could not be loaded: "+e.message,"err");
  }
}

function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const fr=new FileReader();
    fr.onprogress=e=>{
      if(e.lengthComputable) setProgress(10+(e.loaded/e.total)*20,`Reading image… ${Math.round(e.loaded/e.total*100)}%`);
    };
    fr.onload=()=>resolve(String(fr.result).split(",")[1]);
    fr.onerror=()=>reject(new Error("Browser could not read this image."));
    fr.readAsDataURL(file);
  });
}
function putJsonXHR(url, body, token, onProgress){
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open("PUT",url,true);
    xhr.setRequestHeader("Accept","application/vnd.github+json");
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("Authorization",`Bearer ${token}`);
    xhr.setRequestHeader("X-GitHub-Api-Version","2022-11-28");
    xhr.upload.onprogress=e=>{
      if(e.lengthComputable) onProgress(e.loaded/e.total);
    };
    xhr.onerror=()=>reject(new Error("Network error. Check your internet connection or GitHub access."));
    xhr.ontimeout=()=>reject(new Error("GitHub request timed out."));
    xhr.timeout=180000;
    xhr.onload=()=>{
      let data={}; try{data=JSON.parse(xhr.responseText||"{}")}catch{}
      if(xhr.status>=200&&xhr.status<300) resolve(data);
      else reject(Object.assign(new Error(`${xhr.status} ${xhr.statusText}${data.message?" — "+data.message:""}`),{status:xhr.status}));
    };
    xhr.send(JSON.stringify(body));
  });
}
async function getMeta(owner,repo,branch,token){
  const r=await api(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${META}?ref=${encodeURIComponent(branch)}`,{
    headers:{Authorization:`Bearer ${token}`}
  });
  if(r.status===404) return {items:[],sha:null};
  if(!r.ok) await responseError(r);
  const d=await r.json();
  const clean=(d.content||"").replace(/\s/g,"");
  let items=[];
  try{items=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(clean),c=>c.charCodeAt(0))))}catch{}
  return {items:Array.isArray(items)?items:[],sha:d.sha||null};
}
function rawUrl(owner,repo,branch,path){
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

$("uploadForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const btn=$("uploadBtn"); if(btn.disabled)return;
  const password=$("password").value;
  const owner=$("owner").value.trim();
  const repo=$("repo").value.trim();
  const branch=$("branch").value.trim()||"main";
  const token=$("token").value.trim();
  const title=$("title").value.trim();
  const category=$("category").value;
  const keywords=$("keywords").value.trim();
  const file=$("file").files[0];

  if(password!==PASS){status("Wrong upload password.","err");return;}
  if(!owner||!repo||!token||!title||!file){status("Please fill all required fields and choose an image.","err");return;}
  if(!file.type.startsWith("image/")){status("Please select an image file.","err");return;}
  if(file.size>25*1024*1024){status("Image is over 25 MB. Use a smaller/compressed image.","err");return;}

  btn.disabled=true; $("password").disabled=true; $("token").disabled=true;
  setProgress(3,"Checking GitHub repository…"); status("Connecting to GitHub…","info");

  try{
    const repoR=await api(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,{headers:{Authorization:`Bearer ${token}`}});
    if(!repoR.ok) await responseError(repoR);
    const repoData=await repoR.json();
    if(repoData.private){throw new Error("This repository is private. The public library needs a public repository so visitors can view raw images.");}
    localStorage.setItem("libOwner",owner); localStorage.setItem("libRepo",repo); localStorage.setItem("libBranch",branch);

    setProgress(8,"Reading image…");
    const base64=await fileToBase64(file);

    const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").slice(-120);
    const unique=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const path=`images/${unique}-${safeName}`;

    setProgress(32,"Uploading image to GitHub…");
    const imageResult=await putJsonXHR(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`,
      {message:`Add image: ${title}`,content:base64,branch},
      token,
      p=>setProgress(32+p*48,`Uploading image… ${Math.round(p*100)}%`)
    );

    setProgress(82,"Updating image catalogue…");
    let meta=await getMeta(owner,repo,branch,token);
    const item={
      name:file.name,title,category,keywords,url:rawUrl(owner,repo,branch,path),
      path,sha:imageResult.content?.sha||null,
      uploadedAt:new Date().toISOString()
    };
    const items=[item,...meta.items];
    const bytes=new TextEncoder().encode(JSON.stringify(items,null,2)+"\n");
    let binary=""; const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    const content=btoa(binary);

    await putJsonXHR(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${META}`,
      {message:`Update image catalogue: ${title}`,content,branch,...(meta.sha?{sha:meta.sha}:{})},
      token,
      p=>setProgress(82+p*14,`Saving catalogue… ${Math.round(p*100)}%`)
    );

    setProgress(100,"Upload complete!");
    status("✓ Image uploaded successfully. Refreshing gallery…","ok");
    $("token").value="";
    $("file").value="";
    $("fileInfo").textContent="No file selected";
    await loadImages();
    setTimeout(()=>closeModal("uploadModal"),900);
  }catch(err){
    console.error(err);
    let msg=err.message||String(err);
    if(err.status===401) msg+="\n\nToken is invalid/expired, or GitHub rejected it.";
    if(err.status===403) msg+="\n\nCheck that the fine-grained token has access to this repository and Contents: Read and write permission.";
    if(err.status===404) msg+="\n\nCheck owner, repository name, branch, and token repository access.";
    if(err.status===409) msg+="\n\nThe catalogue changed at the same time. Please try the upload again once.";
    status("Upload failed:\n"+msg,"err");
    setProgress(0,"Upload stopped");
  }finally{
    btn.disabled=false; $("password").disabled=false; $("token").disabled=false;
  }
});

loadImages();
})();