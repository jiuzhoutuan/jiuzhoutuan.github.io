// ====== Contribution (render on contribution.html) ======
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
  const body = document.getElementById("con-body");
  const seasonSelect = document.getElementById("con-season");
  const searchInput = document.getElementById("con-search");
  const archiveHint = document.getElementById("con-archive-hint");
  const emptyHint = document.getElementById("con-empty");

  if (!body || !seasonSelect || !searchInput) return;

  // 初始化下拉（只做一次）
  if (!seasonSelect.dataset.inited) {
    contributionSeasons.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = (getLang() === "en") ? s.titleEn : s.titleZh;
      seasonSelect.appendChild(opt);
    });
    seasonSelect.dataset.inited = "1";
    seasonSelect.value = contributionSeasons[contributionSeasons.length - 1].id;

    seasonSelect.addEventListener("change", () => renderContribution());
    searchInput.addEventListener("input", () => renderContribution());
  } else {
    // 语言切换时更新 option 文案
    [...seasonSelect.options].forEach((opt, i) => {
      const s = contributionSeasons[i];
      if (!s) return;
      opt.textContent = (getLang() === "en") ? s.titleEn : s.titleZh;
    });
  }

  const lang = getLang();
  const season = contributionSeasons.find(s => s.id === seasonSelect.value) ?? contributionSeasons[0];
  const keyword = (searchInput.value || "").trim();

  if (archiveHint) {
    archiveHint.textContent = season.archived
      ? (lang === "en" ? "Archived season (read-only)" : "已归档赛季（仅查阅）")
      : (lang === "en" ? "Ongoing season" : "进行中赛季");
  }

  const filtered = season.records.filter(r => !keyword || r.name.includes(keyword));

  body.innerHTML = filtered.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.value}</td>
      <td>${lang === "en" ? r.tierEn : r.tierZh}</td>
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
