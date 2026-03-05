const STORAGE_KEY = "fest-hackathon-demo-v1";

const initialState = {
  registrations: [],
  teams: [],
  scores: {},
  payments: []
};

const state = loadState();

// Smooth scroll navigation active link highlighting
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

function highlightNavOnScroll() {
  let current = '';
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop - 100) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', highlightNavOnScroll);
window.addEventListener('load', highlightNavOnScroll);

document.getElementById("registrationForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const college = document.getElementById("regCollege").value.trim();
  const eventName = document.getElementById("regEvent").value;
  const regMessage = document.getElementById("regMessage");

  if (!eventName) {
    regMessage.className = "status warn";
    regMessage.textContent = "Please select an event.";
    return;
  }

  if (state.registrations.some((item) => item.email === email)) {
    regMessage.className = "status warn";
    regMessage.textContent = "This email is already registered.";
    return;
  }

  const id = "REG-" + String(Date.now()).slice(-6);
  state.registrations.push({ name, email, college, eventName, id });
  persistAndRender();

  regMessage.className = "status ok";
  regMessage.textContent = `Registered ${name} successfully. ID: ${id}`;
  event.target.reset();
});

document.getElementById("teamForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const teamName = document.getElementById("teamName").value.trim();
  const teamEvent = document.getElementById("teamEvent").value;
  const memberName = document.getElementById("memberName").value.trim();
  const teamMessage = document.getElementById("teamMessage");

  if (!teamEvent) {
    teamMessage.className = "status warn";
    teamMessage.textContent = "Select event before adding members.";
    return;
  }

  let team = state.teams.find((entry) => entry.name.toLowerCase() === teamName.toLowerCase());
  if (!team) {
    team = { name: teamName, eventName: teamEvent, members: [] };
    state.teams.push(team);
  }

  const duplicate = team.members.some((member) => member.toLowerCase() === memberName.toLowerCase());
  if (duplicate) {
    teamMessage.className = "status warn";
    teamMessage.textContent = "Member already exists in this team.";
    return;
  }

  team.members.push(memberName);
  state.scores[team.name] = state.scores[team.name] || 0;
  persistAndRender();

  teamMessage.className = "status ok";
  teamMessage.textContent = `${memberName} added to ${team.name}.`;
  event.target.reset();
});

document.querySelectorAll("[data-points]").forEach((button) => {
  button.addEventListener("click", () => {
    const teamName = document.getElementById("scoreTeam").value;
    const points = Number(button.dataset.points);

    if (!teamName) {
      return;
    }

    state.scores[teamName] = (state.scores[teamName] || 0) + points;
    if (state.scores[teamName] < 0) {
      state.scores[teamName] = 0;
    }

    persistAndRender();
  });
});

document.getElementById("paymentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const participant = document.getElementById("payParticipant").value;
  const amount = Number(document.getElementById("payAmount").value);
  const method = document.getElementById("payMethod").value;
  const paymentMessage = document.getElementById("paymentMessage");

  if (!participant) {
    paymentMessage.className = "status warn";
    paymentMessage.textContent = "Register at least one participant first.";
    return;
  }

  const txnId = "TXN-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const orderId = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  state.payments.unshift({
    txnId,
    orderId,
    participant,
    amount,
    method,
    status: "SUCCESS"
  });

  persistAndRender();

  paymentMessage.className = "status ok";
  paymentMessage.textContent = `Payment success via ${method}. Txn: ${txnId}, Order: ${orderId}`;
  event.target.reset();
  document.getElementById("payAmount").value = 499;
});

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderRegistrations();
  renderTeams();
  renderScores();
  renderScoreTeamOptions();
  renderParticipantsForPayment();
  renderPayments();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return JSON.parse(JSON.stringify(initialState));
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      registrations: parsed.registrations || [],
      teams: parsed.teams || [],
      scores: parsed.scores || {},
      payments: parsed.payments || []
    };
  } catch (_error) {
    return JSON.parse(JSON.stringify(initialState));
  }
}

function renderRegistrations() {
  const tbody = document.getElementById("regTableBody");
  tbody.innerHTML = "";

  if (state.registrations.length === 0) {
    tbody.innerHTML = "<tr><td colspan='3'>No registrations yet.</td></tr>";
    return;
  }

  state.registrations.forEach((item) => {
    tbody.innerHTML += `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.eventName)}</td><td>${escapeHtml(item.id)}</td></tr>`;
  });
}

function renderTeams() {
  const tbody = document.getElementById("teamTableBody");
  tbody.innerHTML = "";

  if (state.teams.length === 0) {
    tbody.innerHTML = "<tr><td colspan='3'>No teams yet.</td></tr>";
    return;
  }

  state.teams.forEach((team) => {
    tbody.innerHTML += `<tr><td>${escapeHtml(team.name)}</td><td>${escapeHtml(team.eventName)}</td><td>${team.members.length}</td></tr>`;
  });
}

function renderScoreTeamOptions() {
  const select = document.getElementById("scoreTeam");
  const names = state.teams.map((team) => team.name);

  if (names.length === 0) {
    select.innerHTML = "<option value=''>No teams available</option>";
    return;
  }

  const previous = select.value;
  select.innerHTML = names
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");

  if (names.includes(previous)) {
    select.value = previous;
  }
}

function renderScores() {
  const tbody = document.getElementById("scoreTableBody");
  const teams = state.teams.map((team) => team.name);
  teams.forEach((name) => {
    if (state.scores[name] === undefined) {
      state.scores[name] = 0;
    }
  });

  const rows = teams
    .map((name) => ({ name, score: state.scores[name] || 0 }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  tbody.innerHTML = "";
  if (rows.length === 0) {
    tbody.innerHTML = "<tr><td colspan='3'>Create teams to start live scoring.</td></tr>";
  } else {
    rows.forEach((row, index) => {
      tbody.innerHTML += `<tr><td>#${index + 1}</td><td>${escapeHtml(row.name)}</td><td>${row.score}</td></tr>`;
    });
  }

  const now = new Date().toLocaleTimeString();
  document.getElementById("lastUpdated").textContent = `Last updated: ${now}`;
  document.getElementById("leaderBoard").textContent = rows[0]
    ? `Current leader: ${rows[0].name} (${rows[0].score} pts)`
    : "Current leader: --";
}

function renderParticipantsForPayment() {
  const select = document.getElementById("payParticipant");
  const options = state.registrations.map((entry) => ({
    label: `${entry.name} (${entry.id})`,
    value: entry.name
  }));

  if (options.length === 0) {
    select.innerHTML = "<option value=''>No participants available</option>";
    return;
  }

  select.innerHTML = options
    .map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
    .join("");
}

function renderPayments() {
  const tbody = document.getElementById("paymentTableBody");
  tbody.innerHTML = "";

  if (state.payments.length === 0) {
    tbody.innerHTML = "<tr><td colspan='4'>No transactions yet.</td></tr>";
    return;
  }

  state.payments.forEach((item) => {
    tbody.innerHTML += `<tr><td>${escapeHtml(item.txnId)}</td><td>${escapeHtml(item.participant)}</td><td>INR ${item.amount}</td><td>${escapeHtml(item.status)}</td></tr>`;
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

persistAndRender();
