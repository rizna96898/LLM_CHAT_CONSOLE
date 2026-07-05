const FLASK_BASE_URL = "http://127.0.0.1:5000";
async function loadTemplateToTextarea(endpoint, textareaId) {
const textarea = document.getElementById(textareaId);

if (!textarea) {
    console.error("textarea が見つかりません:", textareaId);
    return;
}

try {
    const baseChatPath = localStorage.getItem("base_chat_path") || "";

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        base_chat_path: baseChatPath
        })
    });

    const data = await res.json();

    if (!data.ok) {
        alert(data.message || "テンプレ取得失敗");
        return;
    }

    textarea.value = data.content;

    } catch (e) {
    alert("サーバー接続エラー");
    }
}

document.getElementById("initIncludePlayerYamlButton")?.addEventListener("click", () => {
loadTemplateToTextarea(
    `${FLASK_BASE_URL}/settings/get_template_world_include_player_yaml`,
    "worldIncludePlayerYaml"
);
});

document.getElementById("initGoalSettingYamlButton")?.addEventListener("click", () => {
loadTemplateToTextarea(
    `${FLASK_BASE_URL}/settings/get_template_world_goal_setting_yaml`,
    "worldGoalSettingYaml"
);
});

document.getElementById("initParameterSettingYamlButton")?.addEventListener("click", () => {
loadTemplateToTextarea(
    `${FLASK_BASE_URL}/settings/get_template_world_parameter_setting_yaml`,
    "worldParameterSettingYaml"
);
});

// let lastReflectedIncludeText = "";

function getWorldList() {
try {
    const raw = localStorage.getItem("world_list");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
} catch {
    return [];
}
}

function setError(id, message) {
const el = document.getElementById(id);
if (el) el.textContent = message || "";
}

function clearWorldErrors() {
[
    "worldIdError",
    "worldNameError",
    "includeError",
    "pastError",
    "currentError",
    "futureError",
    "purposeError"
].forEach(id => setError(id, ""));
}

function hasParticipantRows() {
const body = document.querySelector(".participant-body");
return body && body.children.length > 0;
}

async function saveWorldSetting() {
clearWorldErrors();

const baseChatPath = localStorage.getItem("base_chat_path") || "";

const worldId = document.getElementById("worldIdInput").value.trim();
const worldName = document.getElementById("worldNameInput").value.trim();

const includeStr = document.getElementById("worldIncludePlayerYaml").value;
const goalStr = document.getElementById("worldGoalSettingYaml").value;
const parameterStr = document.getElementById("worldParameterSettingYaml").value;

const startMessage = document.getElementById("startMessageInput").value;
const past = document.getElementById("pastInput").value;
const current = document.getElementById("currentInput").value;
const future = document.getElementById("futureInput").value;
const purpose = document.getElementById("purposeInput").value;
const supplement = document.getElementById("supplementInput").value;

let hasError = false;

if (!worldId) {
    setError("worldIdError", "必須です");
    hasError = true;
} else if (!/^[a-zA-Z0-9_]+$/.test(worldId)) {
    setError("worldIdError", "世界IDは半角英数字と「_」のみ使用できます。");
    hasError = true;
}

const worldList = getWorldList();
const currentSelectedWorldId = localStorage.getItem("selected_world_id") || "";

const existsOther = worldList.some(world =>
    world.id === worldId && world.id !== currentSelectedWorldId
);

if (existsOther) {
    setError("worldIdError", "既に存在しているIDです。");
    hasError = true;
}

if (!worldName) {
    setError("worldNameError", "必須です");
    hasError = true;
}

if (!includeStr.trim()) {
    setError("includeError", "登場人物が未設定です");
    hasError = true;
} else if (!hasParticipantRows()) {
    setError("includeError", "登場人物テーブルに値がありません。隣のyaml内容を反映してください。");
    hasError = true;
}

if (!past.trim()) {
    setError("pastError", "過去が未設定です");
    hasError = true;
}

if (!current.trim()) {
    setError("currentError", "現在が未設定です");
    hasError = true;
}

if (!future.trim()) {
    setError("futureError", "未来が未設定です");
    hasError = true;
}

if (!purpose.trim()) {
    setError("purposeError", "目的が未設定です");
    hasError = true;
}

var includeCheck = validateSimpleYamlText(includeStr)
if ( includeCheck.length > 0) {
    setError("includeError", includeCheck.join("\n"));
    hasError = true;
}

var goalCheck = validateSimpleYamlText(goalStr)
if ( goalCheck.length > 0) {
    setError("worldGoalError", goalCheck.join("\n"));
    hasError = true;
}

var parameterCheck = validateSimpleYamlText(parameterStr)
if ( parameterCheck.length > 0) {
    setError("worldParameterError", parameterCheck.join("\n"));
    hasError = true;
}

if (hasError) return;

const response = await fetch(`${FLASK_BASE_URL}/settings/save_world_setting`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json"
    },
    body: JSON.stringify({
    base_chat_path: baseChatPath,
    world_id: worldId,
    world_name: worldName,
    include_data: includeStr,
    goal_data: goalStr,
    parameter_data: parameterStr,
    start_message: startMessage,
    past: past,
    current: current,
    future: future,
    purpose: purpose,
    supplement: supplement
    })
});

const data = await response.json().catch(() => ({}));

if (!response.ok || data.ok === false) {
    alert(data.message || "世界設定の保存に失敗しました。");
    return;
}

alert(data.message || "世界設定を保存しました。");
pendingWorldList = pendingWorldList.filter(
    world => world.id !== worldId
);
upsertWorldList(worldId, worldName);
renderWorldList();
localStorage.setItem("selected_world_id", worldId);
}

document.getElementById("saveWorldButton")?.addEventListener("click", saveWorldSetting);

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

    // 「- 項目: 内容」形式を許可する
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

    const [key, value] = checkLine.split(":");

    if (!key.trim()) {
    errors.push(`${lineNo}行目: 項目名が空です`);
    return;
    }

    // 「世界の登場人物:」みたいな親項目は許可する
    // なので value が空でもエラーにしない
});

return errors;
}

const WORLD_LIST_STORAGE_KEY = "world_list";

function loadWorldList() {
try {
    const raw = localStorage.getItem(WORLD_LIST_STORAGE_KEY);
    if (!raw) return [];

    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    return list
    .filter(world => world && typeof world === "object")
    .sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")));
} catch (e) {
    console.error("world_list の読み込みに失敗しました", e);
    return [];
}
}

function saveWorldList(worldList) {
localStorage.setItem(WORLD_LIST_STORAGE_KEY, JSON.stringify(worldList));
}

function addWorld() {
const worldList = [...loadWorldList(), ...pendingWorldList];

let newId = "new_world";
let count = 1;

while (worldList.some(world => world.id === newId)) {
    count++;
    newId = `new_world_${count}`;
}

const newWorld = {
    id: newId,
    name: "新しい世界",
    isPending: true
};

pendingWorldList.push(newWorld);

renderWorldList();
selectWorld(newId);
}

function deleteWorld() {
const worldId = document
    .getElementById("worldIdInput")
    ?.value
    ?.trim();

if (!worldId) {
    return;
}

const worldList = loadWorldList();

const nextList = worldList.filter(
    world => world.id !== worldId
);

saveWorldList(nextList);

renderWorldList();

clearWorldForm();
}

async function loadWorldSettingsFromServer(worldId) {
console.log("loadWorldSettingsFromServer呼ばれた", worldId);
if (!worldId) return;

try {
    const response = await fetch(`${FLASK_BASE_URL}/settings/load_world_settings`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        base_chat_path: localStorage.getItem("base_chat_path") || "",
        world_id: worldId
    })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
    alert(data.message || "世界設定の読み込みに失敗しました。");
    return;
    }

    applyWorldSettings(data);
} catch (error) {
    console.error("世界設定の読み込みに失敗しました", error);
    alert("サーバー接続エラー");
}
}

function getWorldSettingValue(data, ...keys) {
for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) {
    return String(data[key]);
    }
}
return "";
}

function setTextareaValue(id, value) {
const textarea = document.getElementById(id);
if (textarea) textarea.value = value || "";
}

function applyWorldSettings(data) {
clearWorldErrors();
clearParticipantTable();

console.log("中身", data);

worldIdInput.value = data.world_id;
worldNameInput.value = data.world_name;

setTextareaValue(
    "worldIncludePlayerYaml",
    getWorldSettingValue(data, "登場人物", "characters", "world_include_player_yaml")
);
setTextareaValue(
    "worldGoalSettingYaml",
    getWorldSettingValue(data, "シナリオの目標", "goal_target", "world_goal_setting_yaml")
);
setTextareaValue(
    "pastInput",
    getWorldSettingValue(data, "過去", "past")
);
setTextareaValue(
    "currentInput",
    getWorldSettingValue(data, "現在", "now")
);
setTextareaValue(
    "futureInput",
    getWorldSettingValue(data, "未来", "future")
);
setTextareaValue(
    "worldParameterSettingYaml",
    getWorldSettingValue(data, "シナリオパラメータ", "scenario_parameter", "world_parameter_setting_yaml")
);
setTextareaValue(
    "purposeInput",
    getWorldSettingValue(data, "目的", "purpose")
);
setTextareaValue(
    "supplementInput",
    getWorldSettingValue(data, "補足", "supplement")
);
console.log(data);
setTextareaValue(
    "startMessageInput",
    getWorldSettingValue(data, "開始メッセージ", "start_message")
);

}

async function selectWorld(worldId) {
console.log("selectWorld呼ばれた", worldId);
const worldList = [...loadWorldList(), ...pendingWorldList];
const world = worldList.find(item => item.id === worldId);
if (!world) return;

document.getElementById("worldIdInput").value = world.id || "";
document.getElementById("worldNameInput").value = world.name || "";

localStorage.setItem("selected_world_id", world.id || "");
renderWorldList();

if (world.isPending) {
    clearWorldEditorContents();
    return;
}

await loadWorldSettingsFromServer(world.id || "");
}

function clearWorldForm() {
const worldIdInput = document.getElementById("worldIdInput");
const worldNameInput = document.getElementById("worldNameInput");

if (worldIdInput) worldIdInput.value = "";
if (worldNameInput) worldNameInput.value = "";
}

function initWorldPageForDisplay() {

clearWorldForm();
clearWorldEditorContents();
clearParticipantTable();

renderWorldList();
}

window.addEventListener("DOMContentLoaded", () => {
initWorldPageForDisplay();

const addButton = document.getElementById("worldAddButton");
if (addButton) {
    addButton.addEventListener("click", addWorld);
}

const deleteButton = document.getElementById("worldDeleteButton");
if (deleteButton) {
    deleteButton.addEventListener("click", deleteWorld);
}
});

window.addEventListener("pageshow", () => {
initWorldPageForDisplay();
});

function clearWorldEditorContents() {
document.getElementById("worldIncludePlayerYaml").value = "";
document.getElementById("worldGoalSettingYaml").value = "";
document.getElementById("worldParameterSettingYaml").value = "";
document.getElementById("startMessageInput").value = "";
document.getElementById("pastInput").value = "";
document.getElementById("currentInput").value = "";
document.getElementById("futureInput").value = "";
document.getElementById("purposeInput").value = "";
document.getElementById("supplementInput").value = "";
clearWorldErrors();
}

function upsertWorldList(worldId, worldName) {
const worldList = loadWorldList();

const nextList = worldList.filter(world =>
    (world.id || world.world_id) !== worldId
);

nextList.push({
    id: worldId,
    name: worldName
});

saveWorldList(nextList);
}

let pendingWorldList = [];

function renderWorldList() {
const worldListEl = document.getElementById("worldList");
if (!worldListEl) return;

const savedList = loadWorldList();

const worldList = [...savedList, ...pendingWorldList]
    .sort((a, b) =>
    String(a.id || "").localeCompare(String(b.id || ""))
    );

worldListEl.innerHTML = "";

worldList.forEach(world => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "scenario-item";

    if (world.isPending) {
    button.classList.add("pending-item");
    }

    if (world.id === localStorage.getItem("selected_world_id")) {
    button.classList.add("active");
    }

    button.textContent = world.name || world.id || "名称未設定";

    button.addEventListener("click", async () => {
    await selectWorld(world.id);
    });

    worldListEl.appendChild(button);
});
}
document.getElementById("reflectParticipantsButton")
?.addEventListener("click", reflectParticipantsFromYaml);

function reflectParticipantsFromYaml() {
setError("includeError", "");
clearParticipantTable();

const yamlText = document.getElementById("worldIncludePlayerYaml").value;

const result = parseWorldParticipantsYaml(yamlText);

if (!result.ok) {
    setError("includeError", result.errors.join("\n"));
    return;
}

const checked = validateParticipants(result.items);

if (!checked.ok) {
    setError("includeError", checked.errors.join("\n"));
    return;
}

renderParticipantTable(checked.rows);
}

function clearParticipantTable() {
const body = document.querySelector(".participant-body");
if (body) body.innerHTML = "";
}

function parseWorldParticipantsYaml(text) {
const errors = [];
const lines = text.split(/\r?\n/);

let inRoot = false;
let current = null;
const items = [];

lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) return;

    if (rawLine.includes("\t")) {
    errors.push(`${lineNo}行目: タブは使えません`);
    return;
    }

    if (line === "世界の登場人物:") {
    inRoot = true;
    return;
    }

    if (!inRoot) {
    errors.push(`${lineNo}行目: 先頭に「世界の登場人物:」が必要です`);
    return;
    }

    if (line.startsWith("- ")) {
    if (current) items.push(current);
    current = {};

    const rest = line.slice(2).trim();
    if (rest) {
        const kv = parseKeyValue(rest, lineNo, errors);
        if (kv) current[kv.key] = kv.value;
    }
    return;
    }

    if (!current) {
    errors.push(`${lineNo}行目: 配列「- 参照種別: ...」から開始してください`);
    return;
    }

    const kv = parseKeyValue(line, lineNo, errors);
    if (kv) current[kv.key] = kv.value;
});

if (current) items.push(current);

if (!inRoot) {
    errors.push("世界の登場人物: がありません");
}

return {
    ok: errors.length === 0,
    errors,
    items
};
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
    value: value.trim()
};
}
function validateParticipants(items) {
const errors = [];
const rows = [];

const playerList = getStorageArray("player_list");
const charList = getStorageArray("char_list");

items.forEach((item, index) => {
    const no = index + 1;

    const refType = item["参照種別"];
    const refId = item["参照ID"];
    const displayName = item["表示名"];
    const role = item["役割"];

    if (!refType) {
    errors.push(`${no}件目: 参照種別がありません`);
    return;
    }

    if (refType === "null") {
    return;
    }

    if (refType === "player") {
    const player = playerList.find(p => p.id === refId);

    if (!refId || refId === "null") {
        errors.push(`${no}件目: player の参照IDがありません`);
        return;
    }

    if (!player) {
        errors.push(`${no}件目: player_list に存在しない参照IDです: ${refId}`);
        return;
    }

    rows.push({
        name: player.name || player.display_name || refId,
        role: role || "player"
    });
    return;
    }

    if (refType === "character") {
    const char = charList.find(c => c.id === refId);

    if (!refId || refId === "null") {
        errors.push(`${no}件目: character の参照IDがありません`);
        return;
    }

    if (!char) {
        errors.push(`${no}件目: char_list に存在しない参照IDです: ${refId}`);
        return;
    }

    rows.push({
        name: char.name || char.display_name || refId,
        role: role || "main"
    });
    return;
    }

    if (refType === "inline") {
    if (!displayName || displayName === "null") {
        errors.push(`${no}件目: inline は表示名が必須です`);
        return;
    }

    if (!["sub", "mob"].includes(role)) {
        errors.push(`${no}件目: inline の役割は sub または mob のみです`);
        return;
    }

    rows.push({
        name: displayName,
        role: role
    });
    return;
    }

    errors.push(`${no}件目: 参照種別は player / character / inline / null のみです`);
});

return {
    ok: errors.length === 0,
    errors,
    rows
};
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
function renderParticipantTable(rows) {
const body = document.querySelector(".participant-body");
if (!body) return;

body.innerHTML = "";

rows.forEach(row => {
    const div = document.createElement("div");
    div.className = "participant-row";

    div.innerHTML = `
    <div>${escapeHtml(row.name)}</div>
    <div>${escapeHtml(row.role)}</div>
    `;

    body.appendChild(div);
});
}

function escapeHtml(value) {
return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// window.resetWorldPageOnOpen = resetWorldPageOnOpen;