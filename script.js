function getUnitFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("unit") || "all";
}

let currentUnit = getUnitFromUrl();
let currentSearch = "";
let questions = [];

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"]/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[m]));
}

async function loadQuestions() {
  try {
    const res = await fetch("data.json");
    questions = await res.json();
    renderQuestions();
    setupJump();
    setupSearch();
  } catch (e) {
    const grid = document.getElementById("questionGrid");
    if (grid) {
      grid.innerHTML = `<div class="question-card"><div class="card-body">Failed to load data.json</div></div>`;
    }
    console.error(e);
  }
}

function getFilteredQuestions() {
  let filtered = currentUnit === "all"
    ? [...questions]
    : questions.filter(q => String(q.unit) === String(currentUnit));

  if (currentSearch.trim()) {
    const s = currentSearch.toLowerCase();
    filtered = filtered.filter(q =>
      (q.text || "").toLowerCase().includes(s) ||
      (q.answer || "").toLowerCase().includes(s) ||
      (q.stepByStep || "").toLowerCase().includes(s) ||
      (q.options || []).join(" ").toLowerCase().includes(s)
    );
  }
  return filtered;
}

function renderQuestions() {
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const visibleCount = document.getElementById("visibleCount");
  const questionGrid = document.getElementById("questionGrid");

  if (!questionGrid) return;

  const filtered = getFilteredQuestions();

  pageTitle.textContent = currentUnit === "all" ? "All Unit Questions" : `Unit ${currentUnit} Questions`;
  pageSubtitle.textContent = "Reveal answer, step-by-step solution, and image-based diagrams inside cards.";
  visibleCount.textContent = `${filtered.length} questions visible`;

  if (!filtered.length) {
    questionGrid.innerHTML = `<div class="question-card"><div class="card-body">No questions found.</div></div>`;
    return;
  }

  questionGrid.innerHTML = filtered.map(q => `
    <div class="question-card" id="q-${q.id}">
      <div class="card-top">
        <div class="left-badges">
          <span class="pill">Q${q.id}</span>
          <span class="pill">Unit ${q.unit}</span>
        </div>
        <span class="status-pill ${q.solved ? 'solved' : 'unsolved'}" id="status-${q.id}">
          ${q.solved ? 'Solved' : 'Unsolved'}
        </span>
      </div>

      <div class="card-body">
        <div class="question-text">${escapeHtml(q.text)}</div>

        ${(q.options && q.options.length) ? `
          <div class="options">
            ${q.options.map(opt => `<span class="option">${escapeHtml(opt)}</span>`).join("")}
          </div>
        ` : ""}

        <div class="card-actions">
          <button class="show-btn" data-id="${q.id}">Show Answer</button>
        </div>

        <div class="answer-box" id="answer-${q.id}">
          <div class="answer-title">Answer & Step-by-Step</div>
          <div class="answer-main">${escapeHtml(q.answer || "Refer notes / derive")}</div>
          <div class="steps">${escapeHtml(q.stepByStep || "")}</div>
          ${q.image ? `<div class="diagram"><img src="${q.image}" alt="Solution image for question ${q.id}"></div>` : ""}
        </div>
      </div>
    </div>
  `).join("");

  attachRevealHandlers();
}

function attachRevealHandlers() {
  document.querySelectorAll(".show-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      toggleAnswer(id);
    });
  });
}

function toggleAnswer(id) {
  const question = questions.find(q => q.id === id);
  if (!question) return;

  const box = document.getElementById(`answer-${id}`);
  const status = document.getElementById(`status-${id}`);
  if (!box) return;

  const opening = !box.classList.contains("show");

  if (opening) {
    question.solved = true;
    if (status) {
      status.textContent = "Solved";
      status.classList.remove("unsolved");
      status.classList.add("solved");
    }
    box.classList.add("show");
    setTimeout(() => {
      document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  } else {
    box.classList.remove("show");
  }
}

function setupJump() {
  const jumpBtn = document.getElementById("jumpBtn");
  const jumpInput = document.getElementById("jumpInput");
  if (!jumpBtn || !jumpInput) return;

  jumpBtn.addEventListener("click", () => {
    const id = parseInt(jumpInput.value);
    if (isNaN(id)) return;

    const found = questions.find(q => q.id === id);
    if (!found) {
      alert("Question not found");
      return;
    }

    if (currentUnit !== "all" && String(found.unit) !== String(currentUnit)) {
      window.location.href = `unit.html?unit=${found.unit}#q-${id}`;
      return;
    }

    const target = document.getElementById(`q-${id}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("highlight-q");
      setTimeout(() => target.classList.remove("highlight-q"), 1600);
    }
  });

  jumpInput.addEventListener("keydown", e => {
    if (e.key === "Enter") jumpBtn.click();
  });
}

function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value;
    renderQuestions();
  });
}

loadQuestions();