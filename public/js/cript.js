// public/js/cript.js
document.addEventListener("DOMContentLoaded", function () {
  // 1) Grab the elements using the IDs and classes actually in your HTML
  const toggleBtn            = document.getElementById("toggleSimBtn");
  const togglePage           = document.querySelector(".toggle-page");
  const toggleContent        = document.querySelector(".toggle-content");
  const simOptions           = document.querySelectorAll(".sim-option");
  const selectedSimInput     = document.getElementById("selectedSim");
  const stopSelectedSimInput = document.getElementById("stopSelectedSim");
  const startForm            = document.getElementById("startForm");
  const stopForm             = document.getElementById("stopForm");

  // 1 — Open/close the SIM-selection overlay
  if (toggleBtn && togglePage && toggleContent) {
    toggleBtn.addEventListener("click", e => {
      e.preventDefault();
      togglePage.style.display = "flex";
    });
    // click outside content closes it
    togglePage.addEventListener("click", () => {
      togglePage.style.display = "none";
    });
    // prevent clicks inside the white box from closing it
    toggleContent.addEventListener("click", e => {
      e.stopPropagation();
    });
  } else {
    console.error("cript.js: toggleSimBtn or toggle page/content missing");
  }

  // 2 — SIM-option selection
  if (simOptions.length > 0) {
    // load previous or default
    let selectedSim = localStorage.getItem("selectedSim") ||
                      simOptions[0].querySelector("input[name=sim]").value;

    function applySelection() {
      simOptions.forEach(opt => {
        const radio = opt.querySelector('input[name="sim"]');
        const active = radio && radio.value === selectedSim;
        opt.classList.toggle("active", active);
        if (radio) radio.checked = active;
      });
    }
    applySelection();

    simOptions.forEach(option => {
      option.addEventListener("click", () => {
        const radio = option.querySelector('input[name="sim"]');
        if (!radio) return;
        selectedSim = radio.value;
        localStorage.setItem("selectedSim", selectedSim);
        applySelection();
        togglePage.style.display = "none";
      });
    });

    // 3 — Inject into forms before submit
    if (startForm && selectedSimInput) {
      startForm.addEventListener("submit", () => {
        selectedSimInput.value = selectedSim;
      });
    }
    if (stopForm && stopSelectedSimInput) {
      stopForm.addEventListener("submit", () => {
        stopSelectedSimInput.value = selectedSim;
      });
    }
  } else {
    console.error("cript.js: no .sim-option elements found");
  }

  // 4 — Green-ball status logic (optional)
  const greenBalls = document.querySelectorAll(".green-ball");
  if (greenBalls.length) {
    let sim1Active = localStorage.getItem("sim1Active") === "true";
    let sim2Active = localStorage.getItem("sim2Active") === "true";

    function updateAllGreenBalls() {
      greenBalls.forEach(ball => {
        const slot = ball.dataset.slot;
        let active = false;
        if (slot === "1") active = sim1Active;
        else if (slot === "2") active = sim2Active;
        else if (slot === "forward") active = sim1Active || sim2Active;
        ball.classList.toggle("active", active);
        ball.classList.toggle("red-shadow", sim1Active && sim2Active);
      });
    }
    updateAllGreenBalls();

    if (startForm) {
      startForm.addEventListener("submit", () => {
        if (localStorage.getItem("selectedSim") === "SIM 1") {
          sim1Active = true;
          localStorage.setItem("sim1Active", "true");
        } else {
          sim2Active = true;
          localStorage.setItem("sim2Active", "true");
        }
        updateAllGreenBalls();
      });
    }
    if (stopForm) {
      stopForm.addEventListener("submit", () => {
        if (localStorage.getItem("selectedSim") === "SIM 1") {
          sim1Active = false;
          localStorage.setItem("sim1Active", "false");
        } else {
          sim2Active = false;
          localStorage.setItem("sim2Active", "false");
        }
        updateAllGreenBalls();
      });
    }
  }
});
