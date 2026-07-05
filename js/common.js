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

  if (!response.ok || data.ok === false || data.status === "error") {
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

function getStorageArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setTextareaValue(id, value) {
  const textarea = document.getElementById(id);
  if (textarea) textarea.value = value || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message || "";
}

function validateSimpleYamlText(text) {
  const errors = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const trimmed = line.trim();

    if (trimmed === "") return;
    if (trimmed.startsWith("#")) return;

    if (line.includes("\t")) {
      errors.push(`${lineNo}行目: タブは使えません`);
      return;
    }

    let checkLine = trimmed;

    if (checkLine.startsWith("- ")) {
      checkLine = checkLine.slice(2).trim();
    }

    const colonCount = (checkLine.match(/:/g) || []).length;

    if (colonCount === 0) {
      errors.push(`${lineNo}行目: 「項目: 内容」の形にしてください`);
      return;
    }

    if (colonCount >= 2) {
      errors.push(`${lineNo}行目: 「:」は1行に1つまでにしてください`);
      return;
    }

    const [key] = checkLine.split(":");

    if (!key.trim()) {
      errors.push(`${lineNo}行目: 項目名が空です`);
    }
  });

  return errors;
}

function parseKeyValue(line, lineNo, errors) {
  const colonCount = (line.match(/:/g) || []).length;

  if (colonCount !== 1) {
    errors.push(`${lineNo}行目: 「項目: 内容」の形にしてください`);
    return null;
  }

  const [key, value] = line.split(":");

  if (!key.trim()) {
    errors.push(`${lineNo}行目: 項目名が空です`);
    return null;
  }

  return {
    key: key.trim(),
    value: value.trim(),
  };
}