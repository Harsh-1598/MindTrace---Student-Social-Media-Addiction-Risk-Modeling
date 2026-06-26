const MindTraceAPI = (() => {
  const API_BASE_URL = window.MINDTRACE_API_BASE_URL || "http://127.0.0.1:8000";

  const createDefaultHeaders = () => ({
    "Content-Type": "application/json",
  });

  const readJsonResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return null;
    }

    return response.json();
  };

  const formatValidationErrors = (detailList) =>
    detailList
      .map((item) => {
        const fieldPath = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "field";
        return `${fieldPath}: ${item.msg}`;
      })
      .join(" | ");

  const getErrorMessage = (payload, statusCode) => {
    if (Array.isArray(payload?.detail)) {
      return formatValidationErrors(payload.detail);
    }

    if (typeof payload?.detail === "string") {
      return payload.detail;
    }

    return `API request failed with status ${statusCode}.`;
  };

  const requestJson = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...createDefaultHeaders(),
        ...(options.headers || {}),
      },
    });

    const payload = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, response.status));
    }

    return payload;
  };

  const toNumber = (value) => Number(value);

  const buildPredictionPayload = (formData) => ({
    Age: toNumber(formData.get("age")),
    Gender: String(formData.get("gender")),
    Academic_Level: String(formData.get("academicLevel")),
    Avg_Daily_Usage_Hours: toNumber(formData.get("usageHours")),
    Most_Used_Platform: String(formData.get("platform")),
    Affects_Academic_Performance: String(formData.get("academicImpact")),
    Sleep_Hours_Per_Night: toNumber(formData.get("sleepHours")),
    Mental_Health_Score: toNumber(formData.get("mentalHealth")),
    Relationship_Status: String(formData.get("relationshipStatus")),
    Conflicts_Over_Social_Media: toNumber(formData.get("conflicts")),
  });

  const normalizePredictionScore = (apiResponse) => {
    const rawScore = apiResponse?.["The prediction is"];
    const numericScore = Number(rawScore);

    if (!Number.isFinite(numericScore)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numericScore)));
  };

  const buildRiskMessage = (score) => {
    if (score >= 70) {
      return {
        label: "High Risk",
        summary:
          "This one is giving strong dependency vibes. The score suggests the student may need closer support and follow-up.",
      };
    }

    if (score >= 45) {
      return {
        label: "Moderate Risk",
        summary:
          "Not full red-alert mode, but definitely not chill either. The pattern suggests growing dependence worth watching.",
      };
    }

    return {
      label: "Low Risk",
      summary:
        "Things look comparatively balanced right now. The submitted signals do not point to strong addiction risk.",
    };
  };

  const fetchHealth = () => requestJson("/health", { method: "GET" });
  const fetchPlatforms = () => requestJson("/metadata/platforms", { method: "GET" });

  const submitPrediction = async (formData) => {
    const requestBody = buildPredictionPayload(formData);
    const apiResponse = await requestJson("/predict", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const score = normalizePredictionScore(apiResponse);
    const riskCopy = buildRiskMessage(score);

    return {
      score,
      label: riskCopy.label,
      summary: riskCopy.summary,
      payloadSent: requestBody,
      rawResponse: apiResponse,
    };
  };

  return {
    API_BASE_URL,
    buildPredictionPayload,
    buildRiskMessage,
    fetchHealth,
    fetchPlatforms,
    normalizePredictionScore,
    submitPrediction,
  };
})();
