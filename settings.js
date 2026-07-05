const settingsTitle = document.getElementById("settingsTitle");
const basePathInput = document.getElementById("basePathInput");
const baseChatPathInput = document.getElementById("baseChatPathInput");
const selectBasePathButton = document.getElementById("selectBasePathButton");
const healthCheckButton = document.getElementById("healthCheckButton");
const openSystemYamlButton = document.getElementById("openSystemYamlButton");
const loadModelButton = document.getElementById("loadModelButton");
const applyButton = document.getElementById("applyButton");
const selectBaseChatPathButton = document.getElementById("selectBaseChatPathButton");
const baseChatPathMessage = document.getElementById("baseChatPathMessage");
const basePathMessage = document.getElementById("basePathMessage");
const healthMessage = document.getElementById("healthMessage");
const systemYamlMessage = document.getElementById("systemYamlMessage");
const modelLoadMessage = document.getElementById("modelLoadMessage");

function getServerDownMessage() {
  return `${getFlaskBaseUrl()} が起動してません。`;
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem(STORAGE_KEYS.BASE_PATH);
  if (saved) {
    basePathInput.value = saved;
  }

  baseChatPathInput.value = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
});

function setServerDependentButtonsEnabled(enabled) {
  selectBasePathButton.disabled = !enabled;
  openSystemYamlButton.disabled = !enabled;
  loadModelButton.disabled = !enabled;
}

function handleServerDown() {
  setServerDependentButtonsEnabled(false);
  setMessage(healthMessage, getServerDownMessage(), MESSAGE_TYPE.ERROR);
}

healthCheckButton.addEventListener("click", async () => {
  setMessage(healthMessage, "接続確認中...", MESSAGE_TYPE.INFO);

  try {
    await requestJson(API_PATHS.HEALTH, { method: "GET" });
    setServerDependentButtonsEnabled(true);
    setMessage(healthMessage, "接続成功", MESSAGE_TYPE.SUCCESS);
  } catch (_) {
    handleServerDown();
  }
});

selectBasePathButton.addEventListener("click", async () => {
  setMessage(basePathMessage, "フォルダ選択待ち...", MESSAGE_TYPE.INFO);

  try {
    const data = await requestJson(API_PATHS.SELECT_BASE_PATH, {
      method: "POST",
      body: JSON.stringify({ current_path: basePathInput.value || "" }),
    });

    if (data.base_path) {
      basePathInput.value = data.base_path;
      setMessage(basePathMessage, "ベースパスを設定しました。", MESSAGE_TYPE.SUCCESS);
    } else {
      setMessage(basePathMessage, "フォルダ選択がキャンセルされました。", MESSAGE_TYPE.INFO);
    }
  } catch (_) {
    handleServerDown();
    setMessage(basePathMessage, getServerDownMessage(), MESSAGE_TYPE.ERROR);
  }
});

selectBaseChatPathButton.addEventListener("click", async () => {
  setMessage(baseChatPathMessage, "フォルダ選択待ち...", MESSAGE_TYPE.INFO);

  try {
    const data = await requestJson(API_PATHS.SELECT_BASE_PATH, {
      method: "POST",
      body: JSON.stringify({ current_path: baseChatPathInput.value || "" }),
    });

    if (data.base_path) {
      baseChatPathInput.value = data.base_path;
      setMessage(baseChatPathMessage, "ベースチャットパスを設定しました。", MESSAGE_TYPE.SUCCESS);
    } else {
      setMessage(baseChatPathMessage, "フォルダ選択がキャンセルされました。", MESSAGE_TYPE.INFO);
    }
  } catch (_) {
    handleServerDown();
    setMessage(baseChatPathMessage, getServerDownMessage(), MESSAGE_TYPE.ERROR);
  }
});

openSystemYamlButton.addEventListener("click", async () => {
  setMessage(systemYamlMessage, "SystemSettingsYamlを開いています...", MESSAGE_TYPE.INFO);

  try {
    await requestJson(API_PATHS.OPEN_SYSTEM_YAML, {
      method: "POST",
      body: JSON.stringify({ base_path: basePathInput.value || "" }),
    });

    setMessage(systemYamlMessage, "SystemSettingsYamlを開きました。タスクバーから選択してください。", MESSAGE_TYPE.SUCCESS);
  } catch (error) {
    const data = error.response || {};
    if (data.full_path) {
      setMessage(systemYamlMessage, `ファイル読み込み失敗: ${data.full_path}`, MESSAGE_TYPE.ERROR);
      return;
    }

    if (error.status) {
      setMessage(systemYamlMessage, error.message, MESSAGE_TYPE.ERROR);
      return;
    }

    handleServerDown();
    setMessage(systemYamlMessage, getServerDownMessage(), MESSAGE_TYPE.ERROR);
  }
});

loadModelButton.addEventListener("click", async () => {
  setMessage(modelLoadMessage, "処理中...", MESSAGE_TYPE.INFO);

  try {
    await requestJson(API_PATHS.LOAD_MODEL, {
      method: "POST",
      body: JSON.stringify({ base_path: basePathInput.value || "" }),
    });

    setMessage(modelLoadMessage, "ロード完了", MESSAGE_TYPE.SUCCESS);
  } catch (error) {
    if (!error.status) {
      handleServerDown();
      setMessage(modelLoadMessage, getServerDownMessage(), MESSAGE_TYPE.ERROR);
      return;
    }

    setMessage(modelLoadMessage, error.message || "モデルロード失敗しました。", MESSAGE_TYPE.ERROR);
  }
});

applyButton.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEYS.BASE_PATH, basePathInput.value.trim());
  localStorage.setItem(STORAGE_KEYS.BASE_CHAT_PATH, baseChatPathInput.value.trim());

  window.parent.postMessage({
    type: "settings_applied",
    message: "設定　適用しました。",
  }, "*");
});