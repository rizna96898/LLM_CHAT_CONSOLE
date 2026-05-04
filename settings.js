const STORAGE_KEY = "base_path";
const FLASK_BASE_URL = "http://127.0.0.1:5000";
const settingsTitle = document.getElementById("settingsTitle");
const basePathInput = document.getElementById("basePathInput");
const selectBasePathButton = document.getElementById("selectBasePathButton");
const healthCheckButton = document.getElementById("healthCheckButton");
const openSystemYamlButton = document.getElementById("openSystemYamlButton");
const loadModelButton = document.getElementById("loadModelButton");
const applyButton = document.getElementById("applyButton");

const basePathMessage = document.getElementById("basePathMessage");
const healthMessage = document.getElementById("healthMessage");
const systemYamlMessage = document.getElementById("systemYamlMessage");
const modelLoadMessage = document.getElementById("modelLoadMessage");

const SERVER_DOWN_MESSAGE = `${FLASK_BASE_URL} が起動してません。`;

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    basePathInput.value = saved;
  }
});

function setMessage(element, text, type = "") {
  element.textContent = text || "";
  element.classList.remove("success", "error", "info");
  if (type) {
    element.classList.add(type);
  }
}

function setServerDependentButtonsEnabled(enabled) {
  selectBasePathButton.disabled = !enabled;
  openSystemYamlButton.disabled = !enabled;
  loadModelButton.disabled = !enabled;
}

function handleServerDown() {
  setServerDependentButtonsEnabled(false);
  setMessage(healthMessage, SERVER_DOWN_MESSAGE, "error");
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${FLASK_BASE_URL}${path}`, {
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

healthCheckButton.addEventListener("click", async () => {
  setMessage(healthMessage, "接続確認中...", "info");

  try {
    await requestJson("/health", { method: "GET" });
    setServerDependentButtonsEnabled(true);
    setMessage(healthMessage, "接続成功", "success");
  } catch (_) {
    handleServerDown();
  }
});

selectBasePathButton.addEventListener("click", async () => {
  setMessage(basePathMessage, "フォルダ選択待ち...", "info");

  try {
    const data = await requestJson("/settings/select_base_path", {
      method: "POST",
      body: JSON.stringify({ current_path: basePathInput.value || "" }),
    });

    if (data.base_path) {
      basePathInput.value = data.base_path;
      setMessage(basePathMessage, "ベースパスを設定しました。", "success");
    } else {
      setMessage(basePathMessage, "フォルダ選択がキャンセルされました。", "info");
    }
  } catch (_) {
    handleServerDown();
    setMessage(basePathMessage, SERVER_DOWN_MESSAGE, "error");
  }
});

openSystemYamlButton.addEventListener("click", async () => {
  setMessage(systemYamlMessage, "SystemSettingsYamlを開いています...", "info");

  try {
    await requestJson("/settings/open_system_yaml", {
      method: "POST",
      body: JSON.stringify({ base_path: basePathInput.value || "" }),
    });

    setMessage(systemYamlMessage, "SystemSettingsYamlを開きました。タスクバーから選択してください。", "success");
  } catch (error) {
    const data = error.response || {};
    if (data.full_path) {
      setMessage(systemYamlMessage, `ファイル読み込み失敗: ${data.full_path}`, "error");
      return;
    }

    if (error.status) {
      setMessage(systemYamlMessage, error.message, "error");
      return;
    }

    handleServerDown();
    setMessage(systemYamlMessage, SERVER_DOWN_MESSAGE, "error");
  }
});

loadModelButton.addEventListener("click", async () => {
  setMessage(modelLoadMessage, "処理中...", "info");

  try {
    await requestJson("/settings/load_model", {
      method: "POST",
      body: JSON.stringify({ base_path: basePathInput.value || "" }),
    });

    setMessage(modelLoadMessage, "ロード完了", "success");
  } catch (error) {
    if (!error.status) {
      handleServerDown();
      setMessage(modelLoadMessage, SERVER_DOWN_MESSAGE, "error");
      return;
    }

    setMessage(modelLoadMessage, error.message || "モデルロード失敗しました。", "error");
  }
});

applyButton.addEventListener("click", () => {
  const value = basePathInput.value.trim();
  localStorage.setItem(STORAGE_KEY, value);

  // 親の「設定」ラベルを取得
  const parentDoc = window.parent.document;
  const title = parentDoc.querySelector(".settings-title"); // ←クラスは実際に合わせる

  if (title) {
    const original = title.textContent;

    title.textContent = "設定　適用しました。";
    title.style.color = "#0f7a2f";

    setTimeout(() => {
      title.textContent = original;
      title.style.color = "";
    }, 2000);
  }
});

basePathInput.value = localStorage.getItem("local_llm_console_base_path") || "";
