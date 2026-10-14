function openWindowPage(src, id) {
    window.open(src, id);
}

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

/**
 * サーバーへリクエストを送り、JSONを返す。
 * HTTPエラー、または ok が true でない場合は例外を投げる。
 * 例外の message にはサーバーの message、response には返却JSONが入る。
 *
 * @param {string} path API_PATHS の値
 * @param {object} options fetch のオプション。body が FormData の場合は Content-Type を付けない
 * @param {string} fallbackMessage サーバーが message を返さなかった時のエラー文言
 */
async function requestJson(path, options = {}, fallbackMessage = "") {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${getFlaskBaseUrl()}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (!response.ok || !data.ok) {
    const message = data.message || fallbackMessage || `サーバ返却エラー: ${response.status}`;
    const error = new Error(message);
    error.response = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * JSONをPOSTして、JSONを返す。失敗時の扱いは requestJson と同じ。
 *
 * @param {string} path API_PATHS の値
 * @param {object} payload 送信する内容
 * @param {string} fallbackMessage サーバーが message を返さなかった時のエラー文言
 */
function postJson(path, payload = {}, fallbackMessage = "") {
  return requestJson(
    path,
    { method: "POST", body: JSON.stringify(payload) },
    fallbackMessage
  );
}

/**
 * TODO そのうちresultの結果で表示色変更したりするので
 * 第二引数が存在している
 * @param {} message 
 * @param {*} result 
 */
function showToast(message, result) {
  const toast = document.createElement("div");

  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "16px";
  toast.style.right = "16px";
  toast.style.padding = "10px 16px";
  // 種類で色を分ける（エラーは赤、案内は青、それ以外は緑）
  const colors = {
    [MESSAGE_TYPE.ERROR]: "#dc2626",
    [MESSAGE_TYPE.INFO]: "#2563eb",
  };
  toast.style.background = colors[result] || "#22c55e";
  toast.style.color = "#fff";
  toast.style.borderRadius = "8px";
  toast.style.zIndex = "9999";
  toast.style.fontWeight = "700";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";

  document.body.appendChild(toast);

  // エラーは文が長くなりがちなので、長めに出す
  setTimeout(() => {
    toast.remove();
  }, result === MESSAGE_TYPE.ERROR ? 5000 : 2500);
}

/**
 * 世界・キャラクター・プレイヤーの一覧を、サーバー（フォルダのYAML）から取り直して localStorage に書く。
 * 一覧を使う他の処理（世界画面の参照IDの確認など）は、今までどおり localStorage を読めばよい。
 * タグはブラウザにしか無いので、同じIDの項目から引き継ぐ。
 * 取れなかったときは例外を投げる（localStorage は書き換えない）。
 *
 * @param {"world"|"character"|"player"} kind
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function refreshSettingsList(kind) {
  const storageKey = {
    world: STORAGE_KEYS.WORLD_LIST,
    character: STORAGE_KEYS.CHARACTER_LIST,
    player: STORAGE_KEYS.PLAYER_LIST,
  }[kind];

  const data = await postJson(API_PATHS.LIST_SETTINGS, {
    base_chat_path: localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "",
    kind: kind,
  }, "一覧の取得に失敗しました");

  const current = getStorageArray(storageKey);
  const items = (data.items || []).map(item => {
    const old = current.find(c => c && c.id === item.id);
    const next = { id: item.id, name: item.name };
    if (old && Array.isArray(old.tags)) next.tags = old.tags;
    return next;
  });

  localStorage.setItem(storageKey, JSON.stringify(items));
  return items;
}

/**
 * 世界・キャラクター・プレイヤーを、確認のうえファイルごと削除し、一覧を取り直す。
 * キャラクター・プレイヤーは、使っている世界があるとサーバーが断る（その世界名が message に入る）。
 *
 * @param {"world"|"character"|"player"} kind
 * @param {string} id
 * @param {string} name 確認に出す名前
 * @returns {Promise<boolean>} 削除したら true（取りやめ・失敗は false。失敗は通知を出す）
 */
async function deleteSettingWithConfirm(kind, id, name) {
  const what = { world: "世界", character: "キャラクター", player: "プレイヤー" }[kind];
  const files = kind === "world"
    ? "世界設定のファイルが消えます（この世界のセッションは残ります）。"
    : "設定のファイルと、アイコン・立ち絵の画像が消えます。";

  if (!confirm(`${what}「${name || id}」（${id}）を削除します。\n${files}\n元に戻せません。よろしいですか？`)) {
    return false;
  }

  try {
    await postJson(API_PATHS.DELETE_SETTING, {
      base_chat_path: localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "",
      kind: kind,
      id: id,
    }, `${what}の削除に失敗しました`);
  } catch (error) {
    showToast(error.message || `${what}の削除に失敗しました`, MESSAGE_TYPE.ERROR);
    return false;
  }

  showToast(`${what}「${name || id}」を削除しました`, MESSAGE_TYPE.SUCCESS);

  try {
    await refreshSettingsList(kind);
  } catch (error) {
    showToast(error.message || "一覧の取得に失敗しました", MESSAGE_TYPE.ERROR);
  }
  return true;
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