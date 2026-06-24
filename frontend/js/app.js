(() => {
  const STORAGE_KEYS = {
    session: "mindtraceUser",
    predictionHistory: "mindtracePredictionHistory",
  };

  const cssStatusClasses = ["status-neutral", "status-success", "status-error"];

  const getBodyPage = () => document.body.dataset.page || "";

  const query = (selector, scope = document) => scope.querySelector(selector);
  const queryAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const readJsonStorage = (key, fallbackValue) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallbackValue;
    } catch (error) {
      return fallbackValue;
    }
  };

  const writeJsonStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getSession = () => readJsonStorage(STORAGE_KEYS.session, null);

  const saveSession = (sessionData) => {
    writeJsonStorage(STORAGE_KEYS.session, sessionData);
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.session);
  };

  const getPredictionHistory = () =>
    readJsonStorage(STORAGE_KEYS.predictionHistory, []);

  const savePredictionHistory = (history) => {
    writeJsonStorage(STORAGE_KEYS.predictionHistory, history);
  };

  const addPredictionToHistory = (predictionEntry) => {
    const currentHistory = getPredictionHistory();
    const updatedHistory = [predictionEntry, ...currentHistory].slice(0, 25);
    savePredictionHistory(updatedHistory);
  };

  const redirectTo = (path) => {
    window.location.href = path;
  };

  const setText = (element, value) => {
    if (element) {
      element.textContent = value;
    }
  };

  const setStatusBanner = (element, message, tone = "neutral") => {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.remove(...cssStatusClasses);
    element.classList.add(`status-${tone}`);
  };

  const setButtonState = (button, options) => {
    if (!button) {
      return;
    }

    button.disabled = options.disabled;
    button.textContent = options.label;
  };

  const getDisplayNameFromEmail = (email) => {
    if (!email) {
      return "User";
    }

    return String(email).split("@")[0] || "User";
  };

  const isSameCalendarDay = (dateA, dateB) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  const setActiveNavLink = (pageName) => {
    query(`[data-nav="${pageName}"]`)?.classList.add("active");
  };

  const updateProfileNameSlots = (name) => {
    queryAll("#profile-name").forEach((element) => {
      element.textContent = name;
    });
  };

  const initializeAuthTabs = () => {
    const tabs = queryAll("[data-auth-tab]");
    const forms = {
      login: query("#login-form"),
      signup: query("#signup-form"),
    };

    const activateTab = (tabName) => {
      tabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.authTab === tabName);
      });

      Object.entries(forms).forEach(([name, form]) => {
        if (form) {
          form.classList.toggle("active", name === tabName);
        }
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab.dataset.authTab));
    });
  };

  const initializeAuthForms = () => {
    const loginForm = query("#login-form");
    const signupForm = query("#signup-form");

    if (loginForm) {
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const email = String(formData.get("email") || "");

        saveSession({
          name: getDisplayNameFromEmail(email),
          email,
        });

        redirectTo("./predictor.html");
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(signupForm);

        saveSession({
          name: String(formData.get("name") || "User"),
          email: String(formData.get("email") || ""),
        });

        redirectTo("./predictor.html");
      });
    }
  };

  const initializeAuthApiStatus = async () => {
    const banner = query("#auth-api-status");

    if (!banner) {
      return;
    }

    try {
      const health = await MindTraceAPI.fetchHealth();
      setStatusBanner(
        banner,
        `Backend connected on ${MindTraceAPI.API_BASE_URL} | Model v${health.version}`,
        "success"
      );
    } catch (error) {
      setStatusBanner(
        banner,
        "Backend is not reachable right now. FastAPI pulled a disappearing act.",
        "error"
      );
    }
  };

  const initializeProtectedLayout = () => {
    const currentPage = getBodyPage();

    if (!currentPage) {
      return true;
    }

    const session = getSession();

    if (!session) {
      redirectTo("./index.html");
      return false;
    }

    updateProfileNameSlots(session.name || "Guest User");
    setActiveNavLink(currentPage);

    const profileMenu = query(".profile-menu");
    const profileTrigger = query(".profile-trigger");
    const noticeModal = query("#notice-modal");
    const closeNoticeButton = query("#close-notice");

    const closeMenu = () => {
      profileMenu?.classList.remove("open");
      profileTrigger?.setAttribute("aria-expanded", "false");
    };

    profileTrigger?.addEventListener("click", () => {
      const nowOpen = profileMenu?.classList.toggle("open");
      profileTrigger.setAttribute("aria-expanded", String(Boolean(nowOpen)));
    });

    document.addEventListener("click", (event) => {
      if (profileMenu && !profileMenu.contains(event.target)) {
        closeMenu();
      }
    });

    queryAll("[data-action='notice']").forEach((button) => {
      button.addEventListener("click", () => {
        closeMenu();
        noticeModal?.showModal();
      });
    });

    closeNoticeButton?.addEventListener("click", () => {
      noticeModal?.close();
    });

    queryAll("[data-action='logout']").forEach((button) => {
      button.addEventListener("click", () => {
        clearSession();
        redirectTo("./index.html");
      });
    });

    return true;
  };

  const renderPredictionResult = (predictionResult, healthInfo) => {
    setText(query("#score-orb"), `${predictionResult.score}%`);
    setText(query("#risk-label"), predictionResult.label);
    setText(query("#risk-summary"), predictionResult.summary);
    setText(query("#prediction-source"), "Live response from POST /predict");
    setText(query("#prediction-model"), healthInfo?.version || "Available via /health");
  };

  const initializePredictorHealthHint = async () => {
    const sourceNode = query("#prediction-source");
    const modelNode = query("#prediction-model");

    try {
      const health = await MindTraceAPI.fetchHealth();
      setText(sourceNode, "FastAPI ready for prediction requests");
      setText(modelNode, health.version || "--");
      return health;
    } catch (error) {
      setText(sourceNode, "FastAPI not reachable");
      setText(modelNode, "--");
      return null;
    }
  };

  const initializePredictorPage = () => {
    if (getBodyPage() !== "predictor") {
      return;
    }

    const form = query("#predictor-form");
    const statusBanner = query("#predictor-status");
    const submitButton = query("button[type='submit']", form);

    if (!form) {
      return;
    }

    let cachedHealth = null;

    initializePredictorHealthHint().then((health) => {
      cachedHealth = health;
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);

      setButtonState(submitButton, {
        disabled: true,
        label: "Sending to API...",
      });

      setStatusBanner(
        statusBanner,
        "Sending form data to FastAPI. Tiny internet goblins, please behave.",
        "neutral"
      );

      try {
        const predictionResult = await MindTraceAPI.submitPrediction(formData);

        if (!cachedHealth) {
          cachedHealth = await MindTraceAPI.fetchHealth().catch(() => null);
        }

        renderPredictionResult(predictionResult, cachedHealth);

        addPredictionToHistory({
          createdAt: new Date().toISOString(),
          score: predictionResult.score,
          label: predictionResult.label,
          country: String(formData.get("country") || ""),
          platform: String(formData.get("platform") || ""),
        });

        setStatusBanner(
          statusBanner,
          `Prediction loaded successfully. Current result: ${predictionResult.label}.`,
          "success"
        );
      } catch (error) {
        setStatusBanner(
          statusBanner,
          `The API said "nah" and returned: ${error.message}`,
          "error"
        );
      } finally {
        setButtonState(submitButton, {
          disabled: false,
          label: "Predict Risk",
        });
      }
    });
  };

  const renderDashboardHistory = () => {
    const history = getPredictionHistory();
    const today = new Date();
    const todayPredictions = history.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return !Number.isNaN(entryDate.getTime()) && isSameCalendarDay(entryDate, today);
    });

    const averageScore = history.length
      ? Math.round(
          history.reduce((total, entry) => total + Number(entry.score || 0), 0) / history.length
        )
      : 0;

    setText(query("#predictions-today-value"), String(todayPredictions.length));
    setText(
      query("#predictions-today-copy"),
      history.length
        ? "Calculated from prediction results saved in this browser."
        : "No saved predictions yet. The dashboard is currently surviving on vibes."
    );

    setText(query("#average-risk-value"), history.length ? `${averageScore}%` : "--");
    setText(
      query("#average-risk-copy"),
      history.length
        ? `Average made from ${history.length} stored prediction${history.length === 1 ? "" : "s"}.`
        : "Run one prediction first and this card will stop looking unemployed."
    );
  };

  const renderDashboardHealth = async () => {
    const statusValue = query("#model-status-value");
    const statusCopy = query("#model-status-copy");

    try {
      const health = await MindTraceAPI.fetchHealth();

      setText(
        statusValue,
        `${health.model_loaded ? "Online" : "Offline"} | v${health.version}`
      );

      setText(
        statusCopy,
        health.model_loaded
          ? "FastAPI is responding and the model is loaded."
          : "FastAPI is awake, but the model is not fully loaded yet."
      );
    } catch (error) {
      setText(statusValue, "Offline");
      setText(
        statusCopy,
        "Could not reach FastAPI. The dashboard knocked and nobody answered."
      );
    }
  };

  const initializeDashboardPage = () => {
    if (getBodyPage() !== "dashboard") {
      return;
    }

    renderDashboardHistory();
    renderDashboardHealth();
  };

  const initializeApp = () => {
    initializeAuthTabs();
    initializeAuthForms();
    initializeAuthApiStatus();

    const layoutReady = initializeProtectedLayout();

    if (layoutReady === false) {
      return;
    }

    initializePredictorPage();
    initializeDashboardPage();
  };

  initializeApp();
})();
