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
        setting: ""
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

        button.addEventListener("click", () => {
            selectedId = player.id;
            renderPlayerList();
            renderEditor(getSelectedPlayer());
        });

        playerListBody.appendChild(button);
    }
}

function clearEditor() {
    playerIdInput.value = "";
    playerNameInput.value = "";
    playerSettingInput.value = "";
    tagList.innerHTML = "";
}

function renderEditor(player) {
    playerIdInput.value = player.id ?? "";
    playerNameInput.value = player.name ?? "";
    playerSettingInput.value = player.setting ?? "";
    renderTags(player.tags ?? []);
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

    saveplayerList();
    loadplayerList();
    selectedId = saveId;
    renderPlayerList();
    renderEditor(getSelectedPlayer() ?? createNewPlayer());
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

        const res = await fetch(getFlaskBaseUrl() + API_PATHS.GET_TEMPLATE_PLAYER_YAML, {
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
            showToast(data.message || "テンプレ取得失敗", MESSAGE_TYPE.ERROR);
            return;
        }

        playerSettingInput.value = data.content;

    } catch (e) {
        showToast(e || "サーバー接続エラー", MESSAGE_TYPE.ERROR);
    }
});

document.getElementById("tagClearButton").addEventListener("click", () => {
    const player = getSelectedPlayer();
    if (!player) return;

    player.tags = [];
    saveplayerList();
    renderTags([]);
});

loadplayerList();

if (playerList.length > 0) {
    selectedId = playerList[0].id;
    renderEditor(playerList[0]);
} else {
    selectedId = null;
    clearEditor();
}

renderPlayerList();

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

    formData.append(STORAGE_KEYS.BASE_CHAT_PATH, baseChatPath);
    formData.append("player_id", playerId);
    formData.append("image_type", imageType);
    formData.append("file", file);

    const response = await fetch(getFlaskBaseUrl() + API_PATHS.SAVE_IMAGE, {
        method: "POST",
        body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
        settingError.textContent = data.message || "エラーが発生しました";
        throw new Error(data.message || `${imageType}画像の保存に失敗しました。`);
    }

    return data;
}

async function savePlayerSettingFile(playerId, playerName, settingText) {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";

    const response = await fetch(getFlaskBaseUrl() + API_PATHS.SAVE_PLAYER_SETTING, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            base_chat_path: baseChatPath,
            player_id: playerId,
            player_name: playerName,
            content: settingText
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
        settingError.textContent = data.message || "エラーが発生しました";
        throw new Error(data.message || "プレイヤー設定の保存に失敗しました。");
    }

    return data;
}