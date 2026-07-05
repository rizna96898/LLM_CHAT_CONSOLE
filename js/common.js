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