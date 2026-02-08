// ====== Language (CN/EN) ======
const LANG_KEY = "jiuzhou_lang";
const supported = ["zh", "en"];

function getLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (supported.includes(saved)) return saved;
  return "zh";
}

function setLang(lang) {
  if (!supported.includes(lang)) return;
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang);
  updateLangButtons(lang);
  // 某些页面需要随语言刷新内容
  renderMembers();
  renderAttendance();
}

function applyLang(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const zh = el.getAttribute("data-zh") ?? "";
    const en = el.getAttribute("data-en") ?? "";
    el.textContent = (lang === "en") ? en : zh;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const zh = el.getAttribute("data-zh-placeholder") ?? "";
    const en = el.getAttribute("data-en-placeholder") ?? "";
    el.placeholder = (lang === "en") ? en : zh;
  });
}

function updateLangButtons(lang) {
  const btnZh = document.getElementById("btn-zh");
  const btnEn = document.getElementById("btn-en");
  if (btnZh && btnEn) {
    btnZh.classList.toggle("active", lang === "zh");
    btnEn.classList.toggle("active", lang === "en");
  }
}

function initLang() {
  const lang = getLang();
  applyLang(lang);
  updateLangButtons(lang);

  const btnZh = document.getElementById("btn-zh");
  const btnEn = document.getElementById("btn-en");
  if (btnZh) btnZh.addEventListener("click", () => setLang("zh"));
  if (btnEn) btnEn.addEventListener("click", () => setLang("en"));
}

// ====== Members (render on members.html) ======
const members = [
  { name: "九州丨奉孝", roleZh: "主力", roleEn: "Core" },
  { name: "九州丨子龙", roleZh: "管理", roleEn: "Staff" },
  { name: "九州丨XX", roleZh: "攻城", roleEn: "Siege" },
  { name: "九州丨XX", roleZh: "主力", roleEn: "Core" },
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

// ====== Attendance (render on attendance.html) ======
// 这是 demo 数据：你之后可以每赛季维护一份 records；赛季结束就标 archived: true
const seasons = [
  {
    id: "S1-2026",
    titleZh: "S1 赛季（2026）",
    titleEn: "Season S1 (2026)",
    archived: true,
    records: [
      { name: "九州丨奉孝", present: 18, total: 20, noteZh: "稳定", noteEn: "Consistent" },
      { name: "九州丨子龙", present: 16, total: 20, noteZh: "偶尔缺勤", noteEn: "Occasional absence" },
      { name: "九州丨XX", present: 10, total: 20, noteZh: "需关注", noteEn: "Needs attention" },
    ],
  },
  {
    id: "S2-2026",
    titleZh: "S2 赛季（进行中）",
    titleEn: "Season S2 (Ongoing)",
    archived: false,
    records: [
      { name: "九州丨奉孝", present: 6, total: 7, noteZh: "优秀", noteEn: "Excellent" },
      { name: "九州丨子龙", present: 5, total: 7, noteZh: "正常", noteEn: "Normal" },
      { name: "九州丨XX", present: 3, total: 7, noteZh: "待改进", noteEn: "Improve" },
    ],
  },
];

function renderAttendance() {
  const tableBody = document.getElementById("att-body");
  const seasonSelect = document.getElementById("att-season");
  const searchInput = document.getElementById("att-search");
  const archiveHint = document.getElementById("att-archive-hint");
  const emptyHint = document.getElementById("att-empty");

  if (!tableBody || !seasonSelect || !searchInput) return;

  // 初始化下拉（只做一次）
  if (!seasonSelect.dataset.inited) {
    seasons.forEach((s, idx) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.dataset.idx = String(idx);
      opt.textContent = (getLang() === "en") ? s.titleEn : s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.inited = "1";

    // 默认选最近（最后一个）
    seasonSelect.value = seasons[seasons.length - 1].id;

    seasonSelect.addEventListener("change", () => renderAttendance());
    searchInput.addEventListener("input", () => renderAttendance());
  } else {
    // 语言切换时更新 option 文案
    [...seasonSelect.options].forEach((opt, i) => {
      const s = seasons[i];
      if (!s) return;
      opt.textContent = (getLang() === "en") ? s.titleEn : s.titleZh;
    });
  }

  const lang = getLang();
  const season = seasons.find(s => s.id === seasonSelect.value) ?? seasons[0];
  const keyword = (searchInput.value || "").trim();

  // 归档提示
  if (archiveHint) {
    archiveHint.textContent = season.archived
      ? (lang === "en" ? "Archived season (read-only)" : "已归档赛季（仅查阅）")
      : (lang === "en" ? "Ongoing season" : "进行中赛季");
  }

  const filtered = season.records.filter(r => {
    if (!keyword) return true;
    return r.name.includes(keyword);
  });

  tableBody.innerHTML = filtered.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.present}/${r.total}</td>
      <td>${Math.round((r.present / Math.max(1, r.total)) * 100)}%</td>
      <td>${lang === "en" ? r.noteEn : r.noteZh}</td>
    </tr>
  `).join("");

  if (emptyHint) {
    emptyHint.style.display = filtered.length ? "none" : "block";
    emptyHint.textContent = lang === "en"
      ? "No matching record. Try searching your in-game name."
      : "没有匹配记录。试试搜索你的游戏名。";
  }
}

// ====== Init ======
document.addEventListener("DOMContentLoaded", () => {
  initLang();
  renderMembers();
  renderAttendance();
});
