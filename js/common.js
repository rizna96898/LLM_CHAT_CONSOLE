function getFlaskBaseUrl() {
  const input = document.getElementById("flaskBaseUrlInput");

  return (
    input?.value.trim()
    || localStorage.getItem(STORAGE_KEYS.FLASK_BASE_URL)
    || DEFAULT_FLASK_BASE_URL
  );
}

function setMessage(element, text, type = "") {
  if (!element) return;

  element.textContent = text || "";
  element.classList.remove(
    MESSAGE_TYPE.SUCCESS,
    MESSAGE_TYPE.ERROR,
    MESSAGE_TYPE.INFO
  );

  if (type) {
    element.classList.add(type);
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${getFlaskBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (!response.ok || data.ok === false) {
    const message = data.message || data.error || `サーバ返却エラー: ${response.status}`;
    const error = new Error(message);
    error.response = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

function showToast(message) {

    const toast = document.createElement("div");
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.top = "16px";
    toast.style.right = "16px";
    toast.style.padding = "10px 16px";
    toast.style.background = "#22c55e";
    toast.style.color = "#fff";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "9999";
    toast.style.fontWeight = "700";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";

    document.body.appendChild(toast);

    setTimeout(() => {
    toast.remove();
    }, 2500);
}