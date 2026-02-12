// =====================
// Global State
// =====================
const LANG_KEY = "jiuzhou_lang";

let members = [];
let contributionSeasons = [];

// =====================
// Language
// =====================
function getLang(){
  return localStorage.getItem(LANG_KEY) || "zh";
}

function setLang(lang){
  localStorage.setItem(LANG_KEY, lang);
  applyLang();
  updateLangButtons();
  renderMembers();
  renderContribution();
}

function applyLang(){
  const lang = getLang();

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    el.textContent = lang === "en" ? el.dataset.en : el.dataset.zh;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    el.placeholder = lang === "en"
      ? el.dataset.enPlaceholder
      : el.dataset.zhPlaceholder;
  });

  const titleEl = document.querySelector("title[data-i18n]");
  if(titleEl){
    titleEl.textContent = lang === "en"
      ? titleEl.dataset.en
      : titleEl.dataset.zh;
  }
}

function updateLangButtons(){
  const lang = getLang();
  document.getElementById("btn-zh")?.classList.toggle("active", lang==="zh");
  document.getElementById("btn-en")?.classList.toggle("active", lang==="en");
}

function initLang(){
  applyLang();
  updateLangButtons();

  document.getElementById("btn-zh")?.addEventListener("click", ()=>setLang("zh"));
  document.getElementById("btn-en")?.addEventListener("click", ()=>setLang("en"));
}

// =====================
// Load JSON Data
// =====================
async function loadData(){
  try{
    try{
      const mem = await fetch("data/members.json");
      members = await mem.json();
    }catch(e){
      members = [];
    }

    try{
      const con = await fetch("data/contribution.json");
      contributionSeasons = await con.json();
    }catch(e){
      contributionSeasons = [];
    }

    renderMembers();
    renderContribution();
  }catch(e){
    console.error("Data load error", e);
  }
}

// =====================
// Members Render
// =====================

// 角色判断
function isOfficer(roleZh="", roleEn=""){
  return ["团长","副团长","管理","指挥"].some(k => roleZh.includes(k))
      || ["Leader","Deputy","Officer","Commander"].some(k => roleEn.includes(k));
}

function isRoadTeam(roleZh="", roleEn=""){
  return roleZh.includes("铺路") || roleEn.toLowerCase().includes("road");
}

function renderMembers(){
  const officerEl = document.getElementById("members-officers");
  const roadEl = document.getElementById("members-roadteam");
  const listEl = document.getElementById("members-list");
  const searchEl = document.getElementById("mem-search");

  // 如果不是成员页，直接跳过
  if(!officerEl && !roadEl && !listEl) return;

  const lang = getLang();

  const officers = [];
  const roadTeam = [];
  let normals = [];

  members.forEach(m=>{
    const roleZh = m.roleZh || "";
    const roleEn = m.roleEn || "";

    if(isOfficer(roleZh, roleEn)){
      officers.push(m);
    }else if(isRoadTeam(roleZh, roleEn)){
      roadTeam.push(m);
    }else{
      normals.push(m);
    }
  });

  // ===== 管理层 =====
  if(officerEl){
    officerEl.innerHTML = officers.map(m=>{
      const roleText = lang==="en" ? (m.roleEn || "") : (m.roleZh || "");
      return `
        <div class="officer-card">
          <div class="officer-name">${m.name || ""}</div>
          <div class="officer-role">${roleText}</div>
        </div>
      `;
    }).join("");
  }

  // ===== 铺路队（仅展示） =====
  if(roadEl){
    roadEl.innerHTML = roadTeam.map(m=>{
      const roleText = lang==="en" ? (m.roleEn || "") : (m.roleZh || "");
      return `
        <div class="officer-card">
          <div class="officer-name">${m.name || ""}</div>
          <div class="officer-role">${roleText}</div>
        </div>
      `;
    }).join("");
  }

  // ===== 普通成员（搜索） =====
  if(searchEl){
    const kw = searchEl.value.trim();
    if(kw){
      normals = normals.filter(m => (m.name || "").includes(kw));
    }

    if(!searchEl.dataset.bind){
      searchEl.addEventListener("input", renderMembers);
      searchEl.dataset.bind = "1";
    }
  }

  normals.sort((a,b)=>
    (a.name||"").localeCompare(b.name||"", "zh-Hans-CN")
  );

  if(listEl){
    listEl.innerHTML = `
      <ul class="member-ul">
        ${normals.map(m=>`<li class="member-li">${m.name || ""}</li>`).join("")}
      </ul>
    `;
  }
}

// =====================
// Contribution Render（保持你现有逻辑）
// =====================
function safeNum(x){
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function calcTotal(r){
  return (
    safeNum(r.road) +
    safeNum(r.city) +
    safeNum(r.merit) +
    safeNum(r.flip) +
    safeNum(r.violation) +
    safeNum(r.special)
  );
}

function renderContribution(){
  const body = document.getElementById("con-body");
  const seasonSelect = document.getElementById("con-season");
  const searchInput = document.getElementById("con-search");
  const archiveHint = document.getElementById("con-archive-hint");

  if(!body || !seasonSelect || !searchInput) return;

  const lang = getLang();

  if(!seasonSelect.dataset.bind){
    seasonSelect.addEventListener("change", renderContribution);
    searchInput.addEventListener("input", renderContribution);
    seasonSelect.dataset.bind = "1";
  }

  const prev = seasonSelect.value;
  seasonSelect.innerHTML = "";
  contributionSeasons.forEach(s=>{
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = lang==="en" ? s.titleEn : s.titleZh;
    seasonSelect.appendChild(opt);
  });
  if(prev) seasonSelect.value = prev;

  const season = contributionSeasons.find(s=>s.id===seasonSelect.value) || contributionSeasons[0];
  if(!season){
    body.innerHTML = "";
    if(archiveHint) archiveHint.textContent = "";
    return;
  }

  if(archiveHint){
    archiveHint.textContent = season.archived
      ? (lang==="en" ? "Archived season" : "已归档赛季")
      : (lang==="en" ? "Ongoing season" : "进行中赛季");
  }

  const keyword = searchInput.value.trim();

  const computed = season.records.map(r=>({
    ...r,
    total: calcTotal(r),
  })).sort((a,b)=>b.total - a.total);

  const filtered = computed.filter(r=>!keyword || (r.name || "").includes(keyword));

  body.innerHTML = filtered.map((r, idx)=>{
    const note = lang==="en" ? (r.noteEn || "") : (r.noteZh || "");
    const v = safeNum(r.violation);
    const rank = idx + 1;
    const topClass = rank <= 3 ? "top3" : "";

    return `
      <tr class="${topClass}">
        <td>${r.name || ""}</td>
        <td>${safeNum(r.road)}</td>
        <td>${safeNum(r.city)}</td>
        <td>${safeNum(r.merit)}</td>
        <td>${safeNum(r.flip)}</td>
        <td style="${v<0 ? "color:rgba(178,31,31,.9);font-weight:700;" : ""}">${v}</td>
        <td>${safeNum(r.special)}</td>
        <td style="font-weight:800;">${r.total}</td>
        <td>${note}</td>
      </tr>
    `;
  }).join("");
}

// =====================
// Init
// =====================
document.addEventListener("DOMContentLoaded", ()=>{
  initLang();
  loadData();
});
