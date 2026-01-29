/* =========================
   AUTH (frontend demo)
========================= */
const ALLOWED = {
  // primary
  "thshuvo22@gmail.com": { name: "Me" },
  "mahirabibha@gmail.com": { name: "My Wife" },

  // allow typo version too (so you can login even if you typed gamil)
  "thshuvo22@gamil.com": { name: "Me (typo email allowed)" }
};

const PASSWORD = "12345";

function getUser(){ return JSON.parse(localStorage.getItem("ll_user") || "null"); }

function requireAuth(){
  const u = getUser();
  if(!u) location.href = "index.html";
  if(!ALLOWED[u.email]) location.href = "index.html";
  return u;
}

function logout(){
  localStorage.removeItem("ll_user");
  location.href = "index.html";
}

/* =========================
   STORAGE
========================= */
function loadLetters(){
  return JSON.parse(localStorage.getItem("ll_letters") || "[]");
}
function saveLetters(arr){
  localStorage.setItem("ll_letters", JSON.stringify(arr));
}
function escapeHtml(str){
  return (str||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

/* =========================
   LOGIN
========================= */
function initLogin(){
  const btn = document.getElementById("loginBtn");
  const msg = document.getElementById("msg");

  btn.addEventListener("click", ()=>{
    msg.textContent = "";
    const email = document.getElementById("email").value.trim().toLowerCase();
    const pass  = document.getElementById("pass").value;

    if(!ALLOWED[email]){
      msg.textContent = "Not allowed (only you & your wife).";
      return;
    }
    if(pass !== PASSWORD){
      msg.textContent = "Wrong password.";
      return;
    }

    localStorage.setItem("ll_user", JSON.stringify({ email, name: ALLOWED[email].name }));
    location.href = "home.html";
  });
}

/* =========================
   HOME
========================= */
function initHome(){
  const u = requireAuth();
  const who = document.getElementById("whoPill");
  if(who) who.textContent = `${ALLOWED[u.email].name} • ${u.email}`;

  const letters = loadLetters();

  const inbox = letters.filter(l => l.to === canonicalEmail(u.email));
  const sent  = letters.filter(l => l.from === canonicalEmail(u.email));

  renderList("inbox", inbox);
  renderList("sent", sent);
}

function renderList(elId, list){
  const el = document.getElementById(elId);
  if(!el) return;

  if(list.length === 0){
    el.innerHTML = `<div class="mutedSmall">No letters yet.</div>`;
    return;
  }

  el.innerHTML = list
    .sort((a,b)=> b.createdAt - a.createdAt)
    .map(l => `
      <div class="item">
        <b>${escapeHtml(l.title)}</b>
        <div class="meta">
          From: ${escapeHtml(l.from)}<br/>
          To: ${escapeHtml(l.to)}<br/>
          ${new Date(l.createdAt).toLocaleString()}
        </div>
        <div class="actions">
          <a class="smallBtn" href="read.html?id=${encodeURIComponent(l.id)}">Open</a>
          <span class="locked">🔒 Locked</span>
        </div>
      </div>
    `).join("");
}

/* Normalize typo email to real one for sending/receiving logic */
function canonicalEmail(email){
  email = (email||"").toLowerCase();
  if(email === "thshuvo22@gamil.com") return "thshuvo22@gmail.com";
  return email;
}

/* =========================
   TEMPLATE DATA
========================= */
const TEMPLATES = [
  { id:"parchment", name:"Old Parchment", className:"tpl-parchment", tags:["vintage","classic","warm"], popular:10, created:4, stamp:"SEALED WITH LOVE" },
  { id:"rose",      name:"Rose Frame",    className:"tpl-rose",      tags:["romantic","pink","soft"],  popular:9,  created:6, stamp:"FOREVER YOURS" },
  { id:"seal",      name:"Wax Seal",      className:"tpl-seal",      tags:["vintage","wax","royal"],   popular:8,  created:7, stamp:"ROYAL SEAL" },
  { id:"3d",        name:"3D Love Card",  className:"tpl-3d",        tags:["3d","modern","love"],      popular:7,  created:5, stamp:"WITH ALL MY HEART" },
  { id:"ivory",     name:"Ivory Classic", className:"tpl-parchment", tags:["minimal","classic"],       popular:6,  created:8, stamp:"SINCERELY" },
  { id:"blush",     name:"Blush Note",    className:"tpl-rose",      tags:["romantic","minimal"],      popular:5,  created:9, stamp:"MY DEAREST" },
];

const CHIP_TAGS = ["all","vintage","romantic","minimal","3d","wax","classic","modern","love"];

/* =========================
   WRITE (PRO)
========================= */
let state = {
  activeTag: "all",
  search: "",
  sortBy: "popular",
  tone: "warm",
  selectedTplId: "parchment",
  fx: { hearts:true, sparkle:true, glow:true },
  grain: 55,
  depth: 70,
  tilt: 70,
  font: "font-serif"
};

function initWritePro(){
  const u = requireAuth();
  const who = document.getElementById("whoPill");
  if(who) who.textContent = `${ALLOWED[u.email].name} • ${u.email}`;

  const me = canonicalEmail(u.email);
  const wife = "mahirabibha@gmail.com";
  const hubby = "thshuvo22@gmail.com";
  const otherEmail = (me === hubby) ? wife : hubby;

  // elements
  const tplGrid   = document.getElementById("tplGrid");
  const chipRow   = document.getElementById("chipRow");
  const tplSearch = document.getElementById("tplSearch");
  const sortBy    = document.getElementById("sortBy");
  const tone      = document.getElementById("tone");

  const fxHearts  = document.getElementById("fxHearts");
  const fxSparkle = document.getElementById("fxSparkle");
  const fxGlow    = document.getElementById("fxGlow");
  const grain     = document.getElementById("grain");
  const depth     = document.getElementById("depth");
  const tilt      = document.getElementById("tilt");

  const title     = document.getElementById("title");
  const body      = document.getElementById("body");
  const sign      = document.getElementById("sign");
  const fontPick  = document.getElementById("fontPick");
  const sendBtn   = document.getElementById("sendBtn");
  const msg       = document.getElementById("msg");

  const preview   = document.getElementById("preview");
  const fxLayer   = document.getElementById("fxLayer");
  const card3d    = document.getElementById("card3d");

  // preview meta
  document.getElementById("pvTo").textContent = `To: ${otherEmail}`;
  document.getElementById("pvDate").textContent = new Date().toLocaleString();

  // chips
  chipRow.innerHTML = CHIP_TAGS.map(t => `
    <button class="chip ${t===state.activeTag?'active':''}" data-tag="${t}">
      ${t==="all" ? "All" : t[0].toUpperCase()+t.slice(1)}
    </button>
  `).join("");

  chipRow.addEventListener("click",(e)=>{
    const btn = e.target.closest(".chip");
    if(!btn) return;
    state.activeTag = btn.dataset.tag;
    [...chipRow.querySelectorAll(".chip")].forEach(c=>c.classList.toggle("active", c.dataset.tag===state.activeTag));
    renderTemplates(tplGrid);
  });

  // search/sort/tone
  tplSearch.addEventListener("input", ()=>{
    state.search = tplSearch.value.trim().toLowerCase();
    renderTemplates(tplGrid);
  });
  sortBy.addEventListener("change", ()=>{
    state.sortBy = sortBy.value;
    renderTemplates(tplGrid);
  });
  tone.addEventListener("change", ()=>{
    state.tone = tone.value;
    applyPreviewClasses(preview);
  });

  // font
  fontPick.addEventListener("change", ()=>{
    state.font = fontPick.value;
    applyPreviewClasses(preview);
  });

  // effects
  fxHearts.addEventListener("change", ()=>{ state.fx.hearts = fxHearts.checked; renderFX(fxLayer); });
  fxSparkle.addEventListener("change", ()=>{ state.fx.sparkle = fxSparkle.checked; renderFX(fxLayer); });
  fxGlow.addEventListener("change", ()=>{ state.fx.glow = fxGlow.checked; applyGlow(card3d); });

  grain.addEventListener("input", ()=>{ state.grain = +grain.value; applyGrain(preview); });
  depth.addEventListener("input", ()=>{ state.depth = +depth.value; applyDepth(preview); });
  tilt.addEventListener("input", ()=>{ state.tilt = +tilt.value; });

  // live preview
  const sync = ()=>{
    document.getElementById("pvTitle").textContent = title.value || "Your Title";
    document.getElementById("pvBody").textContent  = body.value  || "Your letter text will appear here…";
    document.getElementById("pvSign").textContent  = "— " + (sign.value || "Signature");
  };
  title.addEventListener("input", sync);
  body.addEventListener("input", sync);
  sign.addEventListener("input", sync);
  sync();

  // template pick
  tplGrid.addEventListener("click",(e)=>{
    const card = e.target.closest(".tplCard");
    if(!card) return;
    state.selectedTplId = card.dataset.tpl;
    [...tplGrid.querySelectorAll(".tplCard")].forEach(c=>c.classList.toggle("active", c.dataset.tpl===state.selectedTplId));
    applyPreviewClasses(preview);
  });

  // send
  sendBtn.addEventListener("click", ()=>{
    msg.textContent = "";
    const t = title.value.trim();
    const b = body.value.trim();
    const s = sign.value.trim();

    if(!t || !b){
      msg.textContent = "Title & body required.";
      return;
    }

    const letters = loadLetters();
    letters.push({
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
      from: me,
      to: otherEmail,
      title: t,
      body: b,
      sign: s,
      template: state.selectedTplId,
      tone: state.tone,
      font: state.font,
      fx: state.fx,
      grain: state.grain,
      depth: state.depth,
      tilt: state.tilt,
      createdAt: Date.now(),
      locked: true
    });
    saveLetters(letters);
    location.href = "home.html";
  });

  // initial
  renderTemplates(tplGrid);
  applyPreviewClasses(preview);
  applyGrain(preview);
  applyDepth(preview);
  renderFX(fxLayer);
  applyGlow(card3d);
  init3DTilt(card3d);
}

/* render templates filtered/sorted */
function renderTemplates(tplGrid){
  const filtered = TEMPLATES
    .filter(t=>{
      const tagOK = state.activeTag==="all" || t.tags.includes(state.activeTag);
      const s = state.search;
      const searchOK = !s || t.name.toLowerCase().includes(s) || t.tags.join(" ").includes(s);
      return tagOK && searchOK;
    })
    .sort((a,b)=>{
      if(state.sortBy==="popular") return b.popular - a.popular;
      if(state.sortBy==="new") return b.created - a.created;
      return a.name.localeCompare(b.name);
    });

  tplGrid.innerHTML = filtered.map(t=>`
    <div class="tplCard ${t.id===state.selectedTplId?'active':''}" data-tpl="${t.id}">
      <div class="tplPick">${t.id===state.selectedTplId ? "Selected" : "Pick"}</div>
      <div class="tplThumb ${t.className}"></div>
      <div class="tplName">${t.name}</div>
      <div class="tplTags">${t.tags.slice(0,3).map(x=>"#"+x).join(" ")}</div>
    </div>
  `).join("");

  if(filtered.length===0){
    tplGrid.innerHTML = `<div class="mutedSmall">No templates found.</div>`;
  }
}

/* apply template/tone/font to preview */
function applyPreviewClasses(previewEl){
  const tpl = TEMPLATES.find(t=>t.id===state.selectedTplId) || TEMPLATES[0];

  // clean classes
  previewEl.className = previewEl.className
    .split(" ")
    .filter(c => !c.startsWith("tpl-") && !c.startsWith("tone-") && !c.startsWith("font-"))
    .join(" ")
    .trim();

  previewEl.classList.add(tpl.className, `tone-${state.tone}`, state.font);

  const stamp = document.getElementById("pvStamp");
  if(stamp) stamp.textContent = tpl.stamp || "SEALED WITH LOVE";

  applyGrain(previewEl);
  applyDepth(previewEl);
}

/* Grain & depth */
function applyGrain(previewEl){
  const v = Math.max(0, Math.min(100, state.grain));
  const alpha = 0.02 + v/2500;
  previewEl.style.webkitMaskImage =
    `radial-gradient(circle at 30% 20%, rgba(0,0,0,${alpha}), transparent 62%),
     radial-gradient(circle at 70% 60%, rgba(0,0,0,${alpha}), transparent 68%)`;
}
function applyDepth(previewEl){
  const v = Math.max(0, Math.min(100, state.depth));
  const y = 16 + (v/100)*16;
  const blur = 30 + (v/100)*44;
  const alpha = 0.26 + (v/100)*0.18;
  previewEl.style.boxShadow = `0 ${y}px ${blur}px rgba(0,0,0,${alpha})`;
}

/* Glow */
function applyGlow(card){
  if(!card) return;
  card.style.filter = state.fx.glow ? "drop-shadow(0 0 22px rgba(255,105,180,.18))" : "none";
}

/* FX layer */
function renderFX(layer){
  if(!layer) return;
  layer.innerHTML = "";

  if(state.fx.sparkle){
    for(let i=0;i<22;i++){
      const s = document.createElement("div");
      s.className = "spark";
      const size = 2 + Math.random()*3;
      s.style.width = size+"px";
      s.style.height = size+"px";
      s.style.left = (Math.random()*100)+"%";
      s.style.top = (Math.random()*100)+"%";
      s.style.animationDelay = (Math.random()*2.5)+"s";
      s.style.opacity = (0.20 + Math.random()*0.55);
      layer.appendChild(s);
    }
  }

  if(state.fx.hearts){
    for(let i=0;i<12;i++){
      const h = document.createElement("div");
      h.className = "heart";
      h.textContent = "❤";
      h.style.left = (5 + Math.random()*90)+"%";
      h.style.bottom = (-10 - Math.random()*40)+"px";
      h.style.animationDelay = (Math.random()*3.5)+"s";
      h.style.fontSize = (14 + Math.random()*12)+"px";
      h.style.opacity = (0.18 + Math.random()*0.40);
      layer.appendChild(h);
    }
  }
}

/* REAL 3D tilt on mouse move */
function init3DTilt(card){
  if(!card) return;

  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));

  const onMove = (e)=>{
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0..1
    const y = (e.clientY - r.top)  / r.height;  // 0..1

    // save mouse pos for sheen
    card.style.setProperty("--mx", (x*100)+"%");
    card.style.setProperty("--my", (y*100)+"%");

    const strength = state.tilt / 100; // 0..1
    const rotY = ( (x - 0.5) * 14 ) * strength;
    const rotX = (-(y - 0.5) * 12 ) * strength;

    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  const onLeave = ()=>{
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "20%");
  };

  card.addEventListener("mousemove", onMove);
  card.addEventListener("mouseleave", onLeave);

  // touch support (simple)
  card.addEventListener("touchmove", (e)=>{
    const t = e.touches[0];
    if(!t) return;
    onMove({ clientX: t.clientX, clientY: t.clientY });
  }, { passive:true });
  card.addEventListener("touchend", onLeave);
}

/* =========================
   READ
========================= */
function initRead(){
  const u = requireAuth();
  const who = document.getElementById("whoPill");
  if(who) who.textContent = `${ALLOWED[u.email].name} • ${canonicalEmail(u.email)}`;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const letters = loadLetters();
  const l = letters.find(x => x.id === id);

  const view = document.getElementById("letterView");
  if(!l || !view){
    if(view) view.innerHTML = "<div class='mutedSmall'>Letter not found.</div>";
    return;
  }

  const me = canonicalEmail(u.email);
  if(l.to !== me && l.from !== me){
    view.innerHTML = "<div class='mutedSmall'>Not allowed.</div>";
    return;
  }

  // apply style (template/tone/font)
  const tpl = TEMPLATES.find(t=>t.id===l.template) || TEMPLATES[0];
  const tone = `tone-${l.tone || "warm"}`;
  const font = l.font || "font-serif";

  view.className = `letter ${tpl.className} ${tone} ${font}`;

  view.innerHTML = `
    <div class="letterMeta">
      <div class="toLine"><b>To:</b> ${escapeHtml(l.to)}</div>
      <div class="stamp">${escapeHtml((tpl.stamp || "SEALED WITH LOVE"))}</div>
    </div>

    <h2 class="letterTitle">${escapeHtml(l.title)}</h2>
    <div class="letterBody">${escapeHtml(l.body)}</div>

    <div class="letterFooter">
      <div class="signature">— ${escapeHtml(l.sign || "")}</div>
      <div class="date">${new Date(l.createdAt).toLocaleString()} • 🔒 Locked</div>
    </div>
  `;

  // effects layer on read
  const fxLayer = document.getElementById("fxLayerRead");
  if(fxLayer){
    state.fx = l.fx || { hearts:true, sparkle:true, glow:true };
    renderFX(fxLayer);
  }

  // 3d tilt on read
  const card = document.getElementById("card3dRead");
  if(card){
    state.tilt = l.tilt ?? 70;
    applyGlow(card);
    init3DTilt(card);
  }
}
