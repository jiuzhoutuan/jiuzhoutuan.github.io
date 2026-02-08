// main.js — 九州官网（双语切换稳定版）
const LANG_KEY = "jiuzhou_lang";
const SUPPORTED_LANGS = ["zh", "en"];

function getLang() {
  const saved = localStorage.getItem(LANG_KEY);
  return SUPPORTED_LANGS.includes(saved) ? saved : "zh";
}

function applyLang(lang) {
  // 文本切换
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const zh = el.getAttribute("data-zh");
    const en = el.getAttribute("data-en");
    if (zh == null || en == null) return; // 没配齐就跳过
    el.textContent = (lang === "en") ? en : zh;
  });

  // placeholder 切换
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const zh = el.getAttribute("data-zh-placeholder");
    const en = el.getAttribute("data-en-placeholder");
    if (zh == null || en == null) return;
    el.placeholder = (lang === "en") ? en : zh;
  });
}

function updateLangButtons(lang) {
  const btnZh = document.getElementById("btn-zh");
  const btnEn = document.getElementById("btn-en");
  if (!btnZh || !btnEn) return;

  btnZh.classList.toggle("active", lang === "zh");
  btnEn.classList.toggle("active", lang === "en");
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang);
  updateLangButtons(lang);

  // 动态区域刷新（如果页面有对应容器就渲染）
  renderMembers?.();
  renderAttendance?.();
  renderContribution?.();
}

function bindLangButtons() {
  const btnZh = document.getElementById("btn-zh");
  const btnEn = document.getElementById("btn-en");

  // 如果这个页面没有语言按钮，就不报错
  if (!btnZh || !btnEn) {
    console.warn("[i18n] No language buttons found on this page.");
    return;
  }

  btnZh.addEventListener("click", () => setLang("zh"));
  btnEn.addEventListener("click", () => setLang("en"));
}

// =====================
// Demo data + renderers
// （有对应页面容器才会执行）
// =====================

const members = [
  { name: "九州丨奉孝", roleZh: "主力", roleEn: "Core" },
  { name: "九州丨子龙", roleZh: "管理", roleEn: "Staff" },
];

function renderMembers() {
  const el = document.getElementById("members");
  if (!el) return;
  const lang = getLang();
  el.innerHTML = members.map(m => `
    <div class="member">
      <div class="name">${m.name}</div>
      <div class="role">${lang === "en" ? m.roleEn : m.roleZh}</div>
    </div>
  `).join("");
}

const attendanceSeasons = [
  {
    id: "S2-2026",
    titleZh: "S2 赛季（进行中）",
    titleEn: "Season S2 (Ongoing)",
    archived: false,
    records: [
      { name: "九州丨奉孝", present: 6, total: 7, noteZh: "优秀", noteEn: "Excellent" },
      { name: "九州丨子龙", present: 5, total: 7, noteZh: "正常", noteEn: "Normal" },
    ],
  }
];

function renderAttendance() {
  const tbody = document.getElementById("att-body");
  const seasonSelect = document.getElementById("att-season");
  const searchInput = document.getElementById("att-search");
  const archiveHint = document.getElementById("att-archive-hint");
  const emptyHint = document.getElementById("att-empty");
  if (!tbody || !seasonSelect || !searchInput) return;

  const lang = getLang();

  if (!seasonSelect.dataset.inited) {
    attendanceSeasons.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = (lang === "en") ? s.titleEn : s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.inited = "1";
    seasonSelect.value = attendanceSeasons[attendanceSeasons.length - 1].id;
    seasonSelect.addEventListener("change", renderAttendance);
    searchInput.addEventListener("input", renderAttendance);
  } else {
    [...seasonSelect.options].forEach((opt, i) => {
      const s = attendanceSeasons[i];
      if (!s) return;
      opt.textContent = (lang === "en") ? s.titleEn : s.titleZh;
    });
  }

  const season = attendanceSeasons.find(s => s.id === seasonSelect.value) ?? attendanceSeasons[0];
  if (archiveHint) {
    archiveHint.textContent = season.archived
      ? (lang === "en" ? "Archived season (read-only)" : "已归档赛季（仅查阅）")
      : (lang === "en" ? "Ongoing season" : "进行中赛季");
  }

  const keyword = (searchInput.value || "").trim();
  const filtered = season.records.filter(r => !keyword || r.name.includes(keyword));

  tbody.innerHTML = filtered.map(r => {
    const rate = Math.round((r.present / Math.max(1, r.total)) * 100);
    return `
      <tr>
        <td>${r.name}</td>
        <td>${r.present}/${r.total}</td>
        <td>${rate}%</td>
        <td>${lang === "en" ? r.noteEn : r.noteZh}</td>
      </tr>
    `;
  }).join("");

  if (emptyHint) {
    emptyHint.style.display = filtered.length ? "none" : "block";
    emptyHint.textContent = (lang === "en")
      ? "No matching record."
      : "没有匹配记录。";
  }
}

const contributionSeasons = [
  {
    id: "S2-2026",
    titleZh: "S2 赛季（进行中）",
    titleEn: "Season S2 (Ongoing)",
    archived: false,
    records: [
      { name: "九州丨奉孝", value: 420, tierZh: "A", tierEn: "A", noteZh: "优秀", noteEn: "Excellent" },
      { name: "九州丨子龙", value: 260, tierZh: "B", tierEn: "B", noteZh: "正常", noteEn: "Normal" },
    ],
  }
];

function renderContribution() {
  const tbody = document.getElementById("con-body");
  const seasonSelect = document.getElementById("con-season");
  const searchInput = document.getElementById("con-search");
  const archiveHint = document.getElementById("con-archive-hint");
  const emptyHint = document.getElementById("con-empty");
  if (!tbody || !seasonSelect || !searchInput) return;

  const lang = getLang();

  if (!seasonSelect.dataset.inited) {
    contributionSeasons.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = (lang === "en") ? s.titleEn : s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.inited = "1";
    seasonSelect.value = contributionSeasons[contributionSeasons.length - 1].id;
    seasonSelect.addEventListener("change", renderContribution);
    searchInput.addEventListener("input", renderContribution);
  } else {
    [...seasonSelect.options].forEach((opt, i) => {
      const s = contributionSeasons[i];
      if (!s) return;
      opt.textContent = (lang === "en") ? s.titleEn : s.titleZh;
    });
  }

  const season = contributionSeasons.find(s => s.id === seasonSelect.value) ?? contributionSeasons[0];
  if (archiveHint) {
    archiveHint.textContent = season.archived
      ? (lang === "en" ? "Archived season (read-only)" : "已归档赛季（仅查阅）")
      : (lang === "en" ? "Ongoing season" : "进行中赛季");
  }

  const keyword = (searchInput.value || "").trim();
  const filtered = season.records.filter(r => !keyword || r.name.includes(keyword));

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.value}</td>
      <td>${lang === "en" ? r.tierEn : r.tierZh}</td>
      <td>${lang === "en" ? r.noteEn : r.noteZh}</td>
    </tr>
  `).join("");

  if (emptyHint) {
    emptyHint.style.display = filtered.length ? "none" : "block";
    emptyHint.textContent = (lang === "en")
      ? "No matching record."
      : "没有匹配记录。";
  }
}

// =====================
// Boot
// =====================
document.addEventListener("DOMContentLoaded", () => {
  try {
    const lang = getLang();
    console.log("[i18n] init with lang =", lang);

    bindLangButtons();
    applyLang(lang);
    updateLangButtons(lang);

    renderMembers();
    renderAttendance();
    renderContribution();

    console.log("[i18n] ready");
  } catch (e) {
    console.error("[i18n] fatal error:", e);
  }
});
