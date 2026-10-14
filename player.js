const settingError = document.getElementById("settingError");
let playerList = [];
let selectedId = null;

const playerListBody = document.getElementById("playerListBody");
const playerIdInput = document.getElementById("playerIdInput");
const playerNameInput = document.getElementById("playerNameInput");
const playerSettingInput = document.getElementById("playerSettingInput");
const tagList = document.getElementById("tagList");

let selectedIconFile = null;
let selectedStandingFile = null;

function loadplayerList() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_LIST);
        const parsed = raw ? JSON.parse(raw) : [];
        playerList = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        playerList = [];
    }

    playerList.sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

function saveplayerList() {
    localStorage.setItem(STORAGE_KEYS.PLAYER_LIST, JSON.stringify(playerList));
}

function createNewPlayer() {
    return {
        id: "new_player",
        name: "新しいプレイヤー",
        tags: [],
        setting: "",
        isPending: true,    // まだ保存していない
    };
}

function createUniqueId(baseId) {
    let id = baseId;
    let count = 2;

    while (playerList.some(player => player.id === id)) {
        id = `${baseId}_${count}`;
        count++;
    }

    return id;
}

function getSelectedPlayer() {
    return playerList.find(player => player.id === selectedId) ?? null;
}

function renderPlayerList() {
    playerListBody.innerHTML = "";

    for (const player of playerList) {
        const button = document.createElement("button");
        button.className = "player-item";
        button.textContent = player.name || player.id || "名称未設定";

        if (player.id === selectedId) {
            button.classList.add("active");
        }

        button.addEventListener("click", async () => {
            selectedId = player.id;
            renderPlayerList();

            if (player.isPending) {
                renderEditor(player);
            } else {
                await renderEditorFromServer(player.id);
            }
        });

        playerListBody.appendChild(button);
    }
}

function renderEditor(player) {
    playerIdInput.value = player.id ?? "";
    playerNameInput.value = player.name ?? "";
    playerSettingInput.value = player.setting ?? "";
    renderTags(player.tags ?? []);
    loadPlayerImages(player.id ?? "");
}

// プレイヤー設定をファイルから読んで、編集欄に出す
async function renderEditorFromServer(playerId) {
    settingError.textContent = "";
    if (!playerId) return;

    const player = playerList.find(p => p.id === playerId) ?? { id: playerId };

    try {
        const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
        const data = await postJson(API_PATHS.LOAD_PLAYER_SETTINGS, {
            base_chat_path: baseChatPath,
            player_id: playerId,
        }, "プレイヤー設定の読み込みに失敗しました。");

        renderEditor({
            id: data.player_id ?? playerId,
            name: data.player_name ?? "",
            setting: data.player_info ?? "",
            tags: player.tags ?? [],
        });
    } catch (error) {
        renderEditor({ id: playerId, name: player.name ?? "", setting: "", tags: player.tags ?? [] });
        settingError.textContent = error.message;
    }
}

// 一覧をフォルダから取り直す。取れなければ、ブラウザに残っている一覧を使う
async function reloadPlayerList() {
    try {
        await refreshSettingsList("player");
    } catch (error) {
        showToast(error.message || "一覧の取得に失敗しました", MESSAGE_TYPE.ERROR);
    }
    loadplayerList();
}

function buildImageUrl(imageType, playerId) {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    if (!baseChatPath || !playerId) return "";

    const encodedType = encodeURIComponent(imageType);
    const encodedId = encodeURIComponent(playerId);
    const encodedBasePath = encodeURIComponent(baseChatPath);

    // キャッシュ対策。保存直後に同じURLを読んでも古い画像が残らないようにする。
    const cacheBuster = Date.now();

    return getFlaskBaseUrl() + API_PATHS.LOAD_IMAGE + `/${encodedType}/${encodedId}?owner_type=player&base_chat_path=${encodedBasePath}&v=${cacheBuster}`;
}

function applyImageUrl(img, placeholder, imageUrl) {
    img.removeAttribute("src");
    img.style.display = "none";
    placeholder.style.display = "block";

    if (!imageUrl) return;

    img.onload = () => {
        img.style.display = "block";
        placeholder.style.display = "none";
    };

    // 保存済みの画像が無い場合は、初期表示のままにする
    img.onerror = () => {
        img.removeAttribute("src");
        img.style.display = "none";
        placeholder.style.display = "block";
    };

    img.src = imageUrl;
}

// 保存済みのアイコンと立ち絵をサーバーから読み込む
function loadPlayerImages(playerId) {
    selectedIconFile = null;
    selectedStandingFile = null;

    applyImageUrl(iconImg, iconPlaceholder, buildImageUrl("icon", playerId));
    applyImageUrl(standingImg, standingPlaceholder, buildImageUrl("standing", playerId));
}

function renderTags(tags) {
    tagList.innerHTML = "";

    for (const tag of tags) {
        const span = document.createElement("span");
        span.className = "tag-chip";
        span.textContent = tag;
        tagList.appendChild(span);
    }
}

const iconSelectButton = document.getElementById('iconSelectButton');
const iconFileInput = document.getElementById('iconFileInput');

const standingSelectButton = document.getElementById('standingSelectButton');
const standingFileInput = document.getElementById('standingFileInput');

iconSelectButton.addEventListener('click', () => {
    iconFileInput.click();
});

standingSelectButton.addEventListener('click', () => {
    standingFileInput.click();
});

document.getElementById("addPlayerButton").addEventListener("click", () => {
    const newPlayer = createNewPlayer();
    newPlayer.id = createUniqueId(newPlayer.id);

    playerList.push(newPlayer);
    selectedId = newPlayer.id;

    renderPlayerList();
    renderEditor(newPlayer);
});

document.getElementById("saveButton").addEventListener("click", async () => {
    const idError = document.getElementById("idError");
    const nameError = document.getElementById("nameError");

    idError.textContent = "";
    nameError.textContent = "";
    settingError.textContent = "";

    let hasError = false;

    if (!playerIdInput.value.trim()) {
        idError.textContent = "必須です";
        hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(playerIdInput.value)) {
        idError.textContent = "半角英数字とアンダースコアのみ使用できます";
        hasError = true;
    }

    if (!playerNameInput.value.trim()) {
        nameError.textContent = "必須です";
        hasError = true;
    }

    if (!playerSettingInput.value.trim()) {
        settingError.textContent = "必須です";
        hasError = true;
    }

    if (hasError) {
        return;
    }

    let player = getSelectedPlayer();

    if (!player) {
        player = createNewPlayer();
        player.id = createUniqueId(player.id);
        playerList.push(player);
    }

    const oldId = player.id;

    player.id = playerIdInput.value.trim() || oldId || "new_player";
    player.name = playerNameInput.value.trim() || "新しいプレイヤー";
    player.setting = playerSettingInput.value;

    selectedId = player.id;

    const saveId = playerIdInput.value.trim() || player.id || "new_player";
    const saveName = playerNameInput.value.trim() || "新しいプレイヤー";
    const saveSetting = playerSettingInput.value;

    try {
        await saveImageFile("icon", selectedIconFile, saveId);
        await saveImageFile("standing", selectedStandingFile, saveId);
        await savePlayerSettingFile(saveId, saveName, playerSettingInput.value);
        showToast("プレイヤーを保存しました", "success");
    } catch (error) {
        showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
        return;
    }

    player.id = saveId;
    player.name = saveName;
    player.setting = saveSetting;
    selectedId = player.id;

    await reloadPlayerList();
    selectedId = saveId;
    renderPlayerList();
    await renderEditorFromServer(saveId);
});

document.getElementById("deleteButton").addEventListener("click", () => {
    if (!selectedId) return;

    playerList = playerList.filter(player => player.id !== selectedId);
    selectedId = playerList[0]?.id ?? null;

    saveplayerList();
    renderPlayerList();

    const nextPlayer = getSelectedPlayer();
    renderEditor(nextPlayer ?? createNewPlayer());
});

document.getElementById("initializeButton").addEventListener("click", async () => {
    try {
        const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";

        const data = await postJson(API_PATHS.GET_TEMPLATE_PLAYER_YAML, {
            base_chat_path: baseChatPath,
        }, "テンプレ取得失敗");

        playerSettingInput.value = data.content;

    } catch (e) {
        showToast(e.message || "サーバー接続エラー", MESSAGE_TYPE.ERROR);
    }
});

document.getElementById("tagClearButton").addEventListener("click", () => {
    const player = getSelectedPlayer();
    if (!player) return;

    player.tags = [];
    saveplayerList();
    renderTags([]);
});

const iconInput = document.getElementById('iconFileInput');
const iconPreview = document.getElementById('iconPreview');

const standingInput = document.getElementById('standingFileInput');
const standingPreview = document.getElementById('standingPreview');

const iconImg = document.getElementById('iconImg');
const iconPlaceholder = document.querySelector('#iconPreview .placeholder');

iconInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedIconFile = file;

    iconImg.src = URL.createObjectURL(file);
    iconImg.style.display = "block";
    iconPlaceholder.style.display = "none";

    e.target.value = '';
});

const standingImg = document.getElementById('standingImg');
const standingPlaceholder = document.querySelector('#standingPreview .placeholder');

standingInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedStandingFile = file;

    standingImg.src = URL.createObjectURL(file);
    standingImg.style.display = "block";
    standingPlaceholder.style.display = "none";

    e.target.value = '';
});

async function saveImageFile(imageType, file, playerId) {
    if (!file) return;

    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    const formData = new FormData();

    formData.append("base_chat_path", baseChatPath);
    formData.append("owner_type", "player");
    formData.append("owner_id", playerId);
    formData.append("image_type", imageType);
    formData.append("file", file);

    try {
        return await requestJson(
            API_PATHS.SAVE_IMAGE,
            { method: "POST", body: formData },
            `${imageType}画像の保存に失敗しました。`
        );
    } catch (error) {
        settingError.textContent = error.response?.message || "エラーが発生しました";
        throw error;
    }
}

async function savePlayerSettingFile(playerId, playerName, settingText) {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";

    try {
        return await postJson(API_PATHS.SAVE_PLAYER_SETTING, {
            base_chat_path: baseChatPath,
            player_id: playerId,
            player_name: playerName,
            content: settingText,
        }, "プレイヤー設定の保存に失敗しました。");
    } catch (error) {
        settingError.textContent = error.response?.message || "エラーが発生しました";
        throw error;
    }
}

function clearEditor() {
    selectedId = null;

    playerIdInput.value = "";
    playerNameInput.value = "";
    playerSettingInput.value = "";
    tagList.innerHTML = "";

    selectedIconFile = null;
    selectedStandingFile = null;

    iconImg.removeAttribute("src");
    iconImg.style.display = "none";
    iconPlaceholder.style.display = "block";

    standingImg.removeAttribute("src");
    standingImg.style.display = "none";
    standingPlaceholder.style.display = "block";

    renderPlayerList();
}

async function initPlayerPageForDisplay() {
    loadplayerList();
    clearEditor();

    await reloadPlayerList();
    renderPlayerList();
}

initPlayerPageForDisplay();