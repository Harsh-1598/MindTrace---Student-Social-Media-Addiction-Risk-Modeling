const authTabs = document.querySelectorAll("[data-auth-tab]");
const authForms = {
  login: document.getElementById("login-form"),
  signup: document.getElementById("signup-form"),
};

const fakePredictRisk = (formData) => {
  const usage = Number(formData.get("usageHours")) || 0;
  const sleep = Number(formData.get("sleepHours")) || 0;
  const mentalHealth = Number(formData.get("mentalHealth")) || 0;
  const conflicts = Number(formData.get("conflicts")) || 0;
  const academicImpact = formData.get("academicImpact") === "Yes" ? 14 : 0;

  let score = 28;
  score += usage * 7.5;
  score += conflicts * 4.8;
  score += academicImpact;
  score += Math.max(0, 7 - sleep) * 6;
  score += Math.max(0, 6 - mentalHealth) * 5;
  score = Math.max(1, Math.min(100, Math.round(score)));

  let label = "Low Risk";
  let summary = "Current behavior appears relatively balanced based on the submitted indicators.";

  if (score >= 70) {
    label = "High Risk";
    summary = "The student shows several strong addiction-associated signals and may need closer attention.";
  } else if (score >= 45) {
    label = "Moderate Risk";
    summary = "The student shows mixed indicators that suggest rising dependence and should be monitored.";
  }

  return { score, label, summary };
};

const saveSession = (payload) => {
  localStorage.setItem("mindtraceUser", JSON.stringify(payload));
};

const getSession = () => {
  const stored = localStorage.getItem("mindtraceUser");
  return stored ? JSON.parse(stored) : null;
};

const clearSession = () => {
  localStorage.removeItem("mindtraceUser");
};

const switchAuthTab = (targetTab) => {
  authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authTab === targetTab));
  Object.entries(authForms).forEach(([key, form]) => {
    if (form) {
      form.classList.toggle("active", key === targetTab);
    }
  });
};

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchAuthTab(tab.dataset.authTab));
});

if (authForms.login) {
  authForms.login.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const userName = email ? String(email).split("@")[0] : "User";
    saveSession({ name: userName, email });
    window.location.href = "./predictor.html";
  });
}

if (authForms.signup) {
  authForms.signup.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveSession({
      name: data.get("name") || "User",
      email: data.get("email"),
    });
    window.location.href = "./predictor.html";
  });
}

const currentBody = document.body;
const appPage = currentBody.dataset.page;

if (appPage) {
  const session = getSession();

  if (!session) {
    window.location.href = "./index.html";
  } else {
    const nameTargets = document.querySelectorAll("#profile-name");
    nameTargets.forEach((node) => {
      node.textContent = session.name || "Guest User";
    });
  }

  document.querySelector(`[data-nav="${appPage}"]`)?.classList.add("active");

  const profileMenu = document.querySelector(".profile-menu");
  const profileTrigger = document.querySelector(".profile-trigger");
  const noticeModal = document.getElementById("notice-modal");
  const closeNotice = document.getElementById("close-notice");

  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener("click", () => {
      const isOpen = profileMenu.classList.toggle("open");
      profileTrigger.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!profileMenu.contains(event.target)) {
        profileMenu.classList.remove("open");
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll("[data-action='notice']").forEach((button) => {
    button.addEventListener("click", () => {
      noticeModal?.showModal();
      profileMenu?.classList.remove("open");
    });
  });

  closeNotice?.addEventListener("click", () => noticeModal?.close());

  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", () => {
      clearSession();
      window.location.href = "./index.html";
    });
  });
}

const predictorForm = document.getElementById("predictor-form");

if (predictorForm) {
  predictorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = fakePredictRisk(formData);

    const scoreOrb = document.getElementById("score-orb");
    const riskLabel = document.getElementById("risk-label");
    const riskSummary = document.getElementById("risk-summary");

    if (scoreOrb) {
      scoreOrb.textContent = `${result.score}%`;
    }

    if (riskLabel) {
      riskLabel.textContent = result.label;
    }

    if (riskSummary) {
      riskSummary.textContent = result.summary;
    }
  });
}
