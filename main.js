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
function isOfficerRole(roleZh="", roleEn=""){
  const zhKeys = ["团长","副团长","管理","指挥","统战","内政","外交"];
  const enKeys = ["Leader","Deputy","Officer","Admin","Commander"];
  return zhKeys.some(k => roleZh.includes(k)) || enKeys.some(k => roleEn.includes(k));
}

function renderMembers(){
  const officerEl = document.getElementById("members-officers");
  const listEl = document.getElementById("members-list");
  const searchEl = document.getElementById("mem-search");

  // 如果不是 members 页面，就直接退出
  if(!officerEl || !listEl) return;

  const lang = getLang();

  const officers = [];
  let normals = [];

  members.forEach(m=>{
    const roleZh = m.roleZh || "";
    const roleEn = m.roleEn || "";
    if(isOfficerRole(roleZh, roleEn)) officers.push(m);
    else normals.push(m);
  });

  // 管理层：展示职位
  officerEl.innerHTML = officers.map(m=>{
    const roleText = lang==="en" ? (m.roleEn || "") : (m.roleZh || "");
    return `
      <div class="officer-card">
        <div class="officer-name">${m.name || ""}</div>
        <div class="officer-role">${roleText}</div>
      </div>
    `;
  }).join("");

  // ✅ 搜索：只过滤普通成员
  const kw = (searchEl?.value || "").trim();
  if(kw){
    normals = normals.filter(m => (m.name || "").includes(kw));
  }

  // 普通成员：仅名字列表
  normals.sort((a,b)=> (a.name||"").localeCompare(b.name||"", "zh-Hans-CN"));

  listEl.innerHTML = `
    <ul class="member-ul">
      ${normals.map(m=>`<li class="member-li">${m.name || ""}</li>`).join("")}
    </ul>
  `;

  // ✅ 事件绑定一次
  if(searchEl && !searchEl.dataset.bind){
    searchEl.addEventListener("input", renderMembers);
    searchEl.dataset.bind = "1";
  }
}

// =====================
// Contribution Render
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

  // 计算总分
  const computed = season.records.map(r=>({
    ...r,
    total: calcTotal(r),
  }));

  // ✅ 全体排序（总积分降序）
  computed.sort((a,b)=>b.total - a.total);

  // ✅ 先把“全体Top3名单”固定下来（不受搜索影响）
  const top3Names = new Set(
    computed.slice(0,3).map(r => r.name || "")
  );

  // 再做搜索过滤（搜索只影响显示，不影响Top3归属）
  const filtered = computed.filter(r=>!keyword || (r.name || "").includes(keyword));

  body.innerHTML = filtered.map(r=>{
    const note = lang==="en" ? (r.noteEn || "") : (r.noteZh || "");
    const v = safeNum(r.violation);
    const topClass = top3Names.has(r.name || "") ? "top3" : "";

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
