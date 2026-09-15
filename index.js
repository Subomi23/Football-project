const baseUrl = "https://football-standings-api.vercel.app";

const pageTitle = document.querySelector("#pageTitle");
const backButton = document.querySelector(".backButton");
const errorBox = document.querySelector(".error");

const leaguesView = document.querySelector("#leaguesView");
const seasonsView = document.querySelector("#seasonsView");
const standingsView = document.querySelector("#standingsView");

let selectedLeagueId = null;
let selectedLeagueName = null;

function showError(message) {
  errorBox.querySelector("p").innerHTML = message;
  errorBox.style.display = "block";
}

function hideError() {
  errorBox.style.display = "none";
}

function showView(view) {
  leaguesView.style.display = "none";
  seasonsView.style.display = "none";
  standingsView.style.display = "none";
  view.style.display = "block";
}

// ---------- View 1: Leagues ----------

async function loadLeagues() {
  hideError();
  pageTitle.innerHTML = "Leagues";
  backButton.style.display = "none";
  leaguesView.innerHTML = `<p class="loading">Loading leagues...</p>`;
  showView(leaguesView);

  const response = await fetch(baseUrl + "/leagues");
  if (response.status !== 200) {
    showError("Could not load leagues.");
    return;
  }

  const data = await response.json();
  renderLeagues(data.data);
}

function renderLeagues(leagues) {
  leaguesView.innerHTML = leagues
    .map(
      (league) => `
      <div class="league-item" data-id="${league.id}" data-name="${league.name}">
        <img src="${league.logos.light}" />
        <span>${league.name}</span>
      </div>
    `,
    )
    .join("");
}

leaguesView.addEventListener("click", (event) => {
  const item = event.target.closest(".league-item");
  if (!item) return;

  selectedLeagueId = item.getAttribute("data-id");
  selectedLeagueName = item.getAttribute("data-name");
  loadSeasons();
});

// ---------- View 2: Seasons ----------

async function loadSeasons() {
  hideError();
  pageTitle.innerHTML = selectedLeagueName + " - Seasons";
  backButton.style.display = "block";
  seasonsView.innerHTML = `<p class="loading">Loading seasons...</p>`;
  showView(seasonsView);

  const response = await fetch(
    baseUrl + "/leagues/" + selectedLeagueId + "/seasons",
  );
  if (response.status !== 200) {
    showError("Could not load seasons for this league.");
    return;
  }

  const data = await response.json();
  renderSeasons(data.data.seasons);
}

function renderSeasons(seasons) {
  if (!seasons || seasons.length === 0) {
    seasonsView.innerHTML = `<p class="loading">No seasons available.</p>`;
    return;
  }

  seasonsView.innerHTML = seasons
    .map(
      (season) => `
      <div class="season-item" data-year="${season.year}">
        ${season.displayName || season.year}
      </div>
    `,
    )
    .join("");
}

seasonsView.addEventListener("click", (event) => {
  const item = event.target.closest(".season-item");
  if (!item) return;

  const year = item.getAttribute("data-year");
  loadStandings(year);
});

// ---------- View 3: Standings ----------

async function loadStandings(season) {
  hideError();
  pageTitle.innerHTML = selectedLeagueName + " - " + season;
  backButton.style.display = "block";
  standingsView.innerHTML = `<p class="loading">Loading standings...</p>`;
  showView(standingsView);

  const response = await fetch(
    baseUrl + "/leagues/" + selectedLeagueId + "/standings?season=" + season,
  );

  if (response.status !== 200) {
    showError("Standings not available for this season.");
    return;
  }

  const data = await response.json();
  renderStandings(data.data.standings);
}

function getStat(stats, name) {
  const stat = stats.find((s) => s.name === name);
  if (stat) {
    return stat.displayValue;
  } else {
    return "-";
  }
}

function renderStandings(standings) {
  if (!standings || standings.length === 0) {
    standingsView.innerHTML = `<p class="loading">No standings available.</p>`;
    return;
  }

  const rows = standings
    .map((entry, index) => {
      const team = entry.team;
      let logo = "";
if (team.logos && team.logos[0]) {
  logo = team.logos[0].href;
}

let stats = [];
if (entry.stats) {
  stats = entry.stats;
}

      return `
        <tr>
          <td class="rank">${index + 1}</td>
          <td class="team-cell">
            <img src="${logo}" />
            ${team.displayName || team.name}
          </td>
          <td>${getStat(stats, "gamesPlayed")}</td>
          <td>${getStat(stats, "wins")}</td>
          <td>${getStat(stats, "ties")}</td>
          <td>${getStat(stats, "losses")}</td>
           <td>${getStat(stats, "pointDifferential")}</td>
          <td>${getStat(stats, "points")}</td>
        </tr>
      `;
    })
    .join("");

  standingsView.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>GP</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
            <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ---------- Back button ----------

backButton.addEventListener("click", () => {
  if (standingsView.style.display === "block") {
    loadSeasons();
  } else {
    loadLeagues();
  }
});

// ---------- Start the app ----------

loadLeagues();
