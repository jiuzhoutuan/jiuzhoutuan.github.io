// =====================
// Global State
// =====================
const LANG_KEY = "jiuzhou_lang";

let members = [];
let attendanceSeasons = [];
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
  renderAttendance();
  renderContribution();
}

function applyLang(){
  const lang = getLang();

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    el.textContent = lang === "en" ? el.dataset.en : el.dataset.zh;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    el.placeholder = lang === "en" ? el.dataset.enPlaceholder : el.dataset.zhPlaceholder;
  });
}

function updateLangButtons(){
  const lang = getLang();
  const zh = document.getElementById("btn-zh");
  const en = document.getElementById("btn-en");
  if(!zh || !en) return;

  zh.classList.toggle("active", lang==="zh");
  en.classList.toggle("active", lang==="en");
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
    const mem = await fetch("data/members.json");
    members = await mem.json();

    const att = await fetch("data/attendance.json");
    attendanceSeasons = await att.json();

    const con = await fetch("data/contribution.json");
    contributionSeasons = await con.json();

    renderMembers();
    renderAttendance();
    renderContribution();
  }catch(e){
    console.error("data load error", e);
  }
}

// =====================
// Members Render
// =====================
function renderMembers(){
  const el = document.getElementById("members");
  if(!el) return;

  const lang = getLang();

  el.innerHTML = members.map(m=>`
    <div class="member">
      <div class="name">${m.name}</div>
      <div class="role">${lang==="en"?m.roleEn:m.roleZh}</div>
    </div>
  `).join("");
}

// =====================
// Attendance Render
// =====================
function renderAttendance(){
  const body = document.getElementById("att-body");
  const seasonSelect = document.getElementById("att-season");
  const searchInput = document.getElementById("att-search");
  const archiveHint = document.getElementById("att-archive-hint");

  if(!body || !seasonSelect || !searchInput) return;

  const lang = getLang();

  if(!seasonSelect.dataset.init){
    attendanceSeasons.forEach(s=>{
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = lang==="en"?s.titleEn:s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.init = "1";
    seasonSelect.addEventListener("change", renderAttendance);
    searchInput.addEventListener("input", renderAttendance);
  }

  const season = attendanceSeasons.find(s=>s.id===seasonSelect.value) || attendanceSeasons[0];

  archiveHint.textContent = season.archived
    ? (lang==="en"?"Archived season":"已归档赛季")
    : (lang==="en"?"Ongoing season":"进行中赛季");

  const keyword = searchInput.value.trim();

  const filtered = season.records.filter(r=>!keyword || r.name.includes(keyword));

  body.innerHTML = filtered.map(r=>{
    const rate = Math.round(r.present/r.total*100);
    return `
      <tr>
        <td>${r.name}</td>
        <td>${r.present}/${r.total}</td>
        <td>${rate}%</td>
        <td>${lang==="en"?r.noteEn:r.noteZh}</td>
      </tr>
    `;
  }).join("");
}

// =====================
// Contribution Render
// =====================
function renderContribution(){
  const body = document.getElementById("con-body");
  const seasonSelect = document.getElementById("con-season");
  const searchInput = document.getElementById("con-search");
  const archiveHint = document.getElementById("con-archive-hint");

  if(!body || !seasonSelect || !searchInput) return;

  const lang = getLang();

  if(!seasonSelect.dataset.init){
    contributionSeasons.forEach(s=>{
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = lang==="en"?s.titleEn:s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.init = "1";
    seasonSelect.addEventListener("change", renderContribution);
    searchInput.addEventListener("input", renderContribution);
  }

  const season = contributionSeasons.find(s=>s.id===seasonSelect.value) || contributionSeasons[0];

  archiveHint.textContent = season.archived
    ? (lang==="en"?"Archived season":"已归档赛季")
    : (lang==="en"?"Ongoing season":"进行中赛季");

  const keyword = searchInput.value.trim();
  const filtered = season.records.filter(r=>!keyword || r.name.includes(keyword));

  body.innerHTML = filtered.map(r=>`
    <tr>
      <td>${r.name}</td>
      <td>${r.value}</td>
      <td>${lang==="en"?r.tierEn:r.tierZh}</td>
      <td>${lang==="en"?r.noteEn:r.noteZh}</td>
    </tr>
  `).join("");
}

// =====================
// Init
// =====================
document.addEventListener("DOMContentLoaded", ()=>{
  initLang();
  loadData();
});
