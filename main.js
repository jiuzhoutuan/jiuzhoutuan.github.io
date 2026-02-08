const members = [
  { name: "九州丨奉孝", role: "主力" },
  { name: "九州丨XX", role: "主力" },
  { name: "九州丨XX", role: "攻城" },
  { name: "九州丨XX", role: "管理" },
];

const el = document.getElementById("members");
if (el) {
  el.innerHTML = members.map(m => `
    <div class="member">
      <div class="name">${m.name}</div>
      <div class="role">${m.role}</div>
    </div>
  `).join("");
}
