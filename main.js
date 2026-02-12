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
  // 重新渲染动态内容（下拉框/表格）
  renderMembers();
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

  // <title> 的 data-i18n 也更新（有些浏览器需要这样）
  const titleEl = document.querySelector("title[data-i18n]");
  if(titleEl){
    titleEl.textContent = lang === "en" ? titleEl.dataset.en : titleEl.dataset.zh;
  }
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
    // members 可选：如果你没有成员页也不影响
    try{
      const mem = await fetch("data/members.json");
      members = await mem.json();
    }catch(e){
      members = [];
    }

    const con = await fetch("data/contribution.json");
    contributionSeasons = await con.json();

    renderMembers();
    renderContribution();
  }catch(e){
    console.error("data load error", e);
  }
}

// =====================
// Members Render (optional)
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
// Contribution Render (new)
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

  // 事件只绑定一次
  if(!seasonSelect.dataset.bind){
    seasonSelect.addEventListener("change", renderContribution);
    searchInput.addEventListener("input", renderContribution);
    seasonSelect.dataset.bind = "1";
  }

  // 下拉框每次按语言重建（保证切换语言不坏）
  const prev = seasonSelect.value;
  seasonSelect.innerHTML = "";
  contributionSeasons.forEach(s=>{
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = lang==="en" ? s.titleEn : s.titleZh;
    seasonSelect.appendChild(opt);
  });
  // 恢复选择
  if(prev && contributionSeasons.some(s=>s.id===prev)) seasonSelect.value = prev;

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

  // 计算总分并排序（先不做制度推导，只做展示+合计）
  const computed = season.records.map(r=>({
    ...r,
    total: calcTotal(r),
  }));

  // 默认按总积分降序（你们后续制度改了也不影响）
  computed.sort((a,b)=>b.total - a.total);

  const filtered = computed.filter(r=>!keyword || (r.name || "").includes(keyword));

  body.innerHTML = filtered.map(r=>{
    const note = lang==="en" ? (r.noteEn || "") : (r.noteZh || "");
    const v = safeNum(r.violation);

    return `
      <tr>
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
