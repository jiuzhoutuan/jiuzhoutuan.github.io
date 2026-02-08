// main.js — 九州官网（双语切换 + 成员 + 考勤 + 贡献）
// 说明：
// 1) 所有页面都引用 <script src="main.js"></script>
// 2) 文案双语：HTML里用 data-i18n / data-zh / data-en（本文件负责切换）
// 3) 动态数据：成员/考勤/贡献都在这里改（改完 commit 就全站生效）

// =====================
// Language (CN/EN)
// =====================
const LANG_KEY = "jiuzhou_lang";
const SUPPORTED_LANGS = ["zh", "en"];

function getLang() {
  const saved = localStorage.getItem(LANG_KEY);
  return SUPPORTED_LANGS.includes(saved) ? saved : "zh";
}

function applyLang(lang) {
  // text nodes
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const zh = el.getAttribute("data-zh") ?? "";
    const en = el.getAttribute("data-en") ?? "";
    el.textContent = lang === "en" ? en : zh;
  });

  // placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const zh = el.getAttribute("data-zh-placeholder") ?? "";
    const en = el.getAttribute("data-en-placeholder") ?? "";
    el.placeholder = lang === "en" ? en : zh;
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

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem(LANG_KEY, lang);

  applyLang(lang);
  updateLangButtons(lang);

  // 切换语言后需要刷新动态区域
  renderMembers();
  renderAttendance();
  renderContribution();
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

// =====================
// Members (members.html)
// =====================
// 修改成员：改这个数组即可
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
  el.innerHTML = members
    .map(
      (m) => `
      <div class="member">
        <div class="name">${m.name}</div>
        <div class="role">${lang === "en" ? m.roleEn : m.roleZh}</div>
      </div>
    `
    )
    .join("");
}

// =====================
// Attendance (attendance.html)
// =====================
// 修改考勤：改 seasons 数组即可（每个赛季一组 records）
// archived=true 表示赛季结束归档（前端提示“只读”，实际是否只读取决于你是否修改数据）
const attendanceSeasons = [
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
  const tbody = document.getElementById("att-body");
  const seasonSelect = document.getElementById("att-season");
  const searchInput = document.getElementById("att-search");
  const archiveHint = document.getElementById("att-archive-hint");
  const emptyHint = document.getElementById("att-empty");

  if (!tbody || !seasonSelect || !searchInput) return;

  const lang = getLang();

  // 初始化赛季下拉（只做一次）
  if (!seasonSelect.dataset.inited) {
    attendanceSeasons.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = lang === "en" ? s.titleEn : s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.inited = "1";
    seasonSelect.value = attendanceSeasons[attendanceSeasons.length - 1].id;

    seasonSelect.addEventListener("change", renderAttendance);
    searchInput.addEventListener("input", renderAttendance);
  } else {
    // 语言切换时更新 option 文案
    [...seasonSelect.options].forEach((opt, i) => {
      const s = attendanceSeasons[i];
      if (!s) return;
      opt.textContent = lang === "en" ? s.titleEn : s.titleZh;
    });
  }

  const season = attendanceSeasons.find((s) => s.id === seasonSelect.value) ?? attendanceSeasons[0];
  const keyword = (searchInput.value || "").trim();

  if (archiveHint) {
    archiveHint.textContent = season.archived
      ? lang === "en"
        ? "Archived season (read-only)"
        : "已归档赛季（仅查阅）"
      : lang === "en"
        ? "Ongoing season"
        : "进行中赛季";
  }

  const filtered = season.records.filter((r) => !keyword || r.name.includes(keyword));

  tbody.innerHTML = filtered
    .map((r) => {
      const rate = Math.round((r.present / Math.max(1, r.total)) * 100);
      return `
        <tr>
          <td>${r.name}</td>
          <td>${r.present}/${r.total}</td>
          <td>${rate}%</td>
          <td>${lang === "en" ? r.noteEn : r.noteZh}</td>
        </tr>
      `;
    })
    .join("");

  if (emptyHint) {
    emptyHint.style.display = filtered.length ? "none" : "block";
    emptyHint.textContent =
      lang === "en"
        ? "No matching record. Try searching your in-game name."
        : "没有匹配记录。试试搜索你的游戏名。";
  }
}

// =====================
// Contribution (contribution.html)
// =====================
// 修改贡献：改 contributionSeasons 数组即可
const contributionSeasons = [
  {
    id: "S1-2026",
    titleZh: "S1 赛季（2026）",
    titleEn: "Season S1 (2026)",
    archived: true,
    records: [
      { name: "九州丨奉孝", value: 1200, tierZh: "A", tierEn: "A", noteZh: "稳定输出", noteEn: "Consistent" },
      { name: "九州丨子龙", value: 860, tierZh: "B", tierEn: "B", noteZh: "正常", noteEn: "Normal" },
      { name: "九州丨XX", value: 300, tierZh: "C", tierEn: "C", noteZh: "需提升", noteEn: "Needs improvement" },
    ],
  },
  {
    id: "S2-2026",
    titleZh: "S2 赛季（进行中）",
    titleEn: "Season S2 (Ongoing)",
    archived: false,
    records: [
      { name: "九州丨奉孝", value: 420, tierZh: "A", tierEn: "A", noteZh: "优秀", noteEn: "Excellent" },
      { name: "九州丨子龙", value: 260, tierZh: "B", tierEn: "B", noteZh: "正常", noteEn: "Normal" },
      { name: "九州丨XX", value: 90, tierZh: "C", tierEn: "C", noteZh: "待改进", noteEn: "Improve" },
    ],
  },
];

function renderContribution() {
  const tbody = document.getElementById("con-body");
  const seasonSelect = document.getElementById("con-season");
  const searchInput = document.getElementById("con-search");
  const archiveHint = document.getElementById("con-archive-hint");
  const emptyHint = document.getElementById("con-empty");

  if (!tbody || !seasonSelect || !searchInput) return;

  const lang = getLang();

  // 初始化赛季下拉（只做一次）
  if (!seasonSelect.dataset.inited) {
    contributionSeasons.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = lang === "en" ? s.titleEn : s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.inited = "1";
    seasonSelect.value = contributionSeasons[contributionSeasons.length - 1].id;

    seasonSelect.addEventListener("change", renderContribution);
    searchInput.addEventListener("input", renderContribution);
  } else {
    // 语言切换时更新 option 文案
    [...seasonSelect.options].forEach((opt, i) => {
      const s = contributionSeasons[i];
      if (!s) return;
      opt.textContent = lang === "en" ? s.titleEn : s.titleZh;
    });
  }

  const season = contributionSeasons.find((s) => s.id === seasonSelect.value) ?? contributionSeasons[0];
  const keyword = (searchInput.value || "").trim();

  if (archiveHint) {
    archiveHint.textContent = season.archived
      ? lang === "en"
        ? "Archived season (read-only)"
        : "已归档赛季（仅查阅）"
      : lang === "en"
        ? "Ongoing season"
        : "进行中赛季";
  }

  const filtered = season.records.filter((r) => !keyword || r.name.includes(keyword));

  tbody.innerHTML = filtered
    .map(
      (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${r.value}</td>
        <td>${lang === "en" ? r.tierEn : r.tierZh}</td>
        <td>${lang === "en" ? r.noteEn : r.noteZh}</td>
      </tr>
    `
    )
    .join("");

  if (emptyHint) {
    emptyHint.style.display = filtered.length ? "none" : "block";
    emptyHint.textContent =
      lang === "en"
        ? "No matching record. Try searching your in-game name."
        : "没有匹配记录。试试搜索你的游戏名。";
  }
}

// =====================
// Init
// =====================
document.addEventListener("DOMContentLoaded", () => {
  initLang();
  renderMembers();
  renderAttendance();
  renderContribution();
});
