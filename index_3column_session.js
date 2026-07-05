const app = document.getElementById('app');
const topbar = document.getElementById('topbar');
const toggleTop = document.getElementById('toggleTop');
const toggleTopFromFloat = document.getElementById('toggleTopFromFloat');
const layoutToggleTop = document.getElementById('layoutToggleTop');
const floatingMenu = document.getElementById('floatingMenu');
const closeFloat = document.getElementById('closeFloat');
const worldToggleButton = document.getElementById('worldToggleButton');
const worldOverlay = document.getElementById('worldOverlay');
const closeWorldOverlay = document.getElementById('closeWorldOverlay');
const openWorldWindow = document.getElementById('openWorldWindow');
const characterToggleButton = document.getElementById('characterToggleButton');
const characterOverlay = document.getElementById('characterOverlay');
const closeCharacterOverlay = document.getElementById('closeCharacterOverlay');
const openCharacterWindow = document.getElementById('openCharacterWindow');
const tagManageButton = document.getElementById('tagManageButton');
const tagManagerWindow = document.getElementById('tagManagerWindow');
const closeTagManager = document.getElementById('closeTagManager');
const closeTagManagerFooter = document.getElementById('closeTagManagerFooter');
const settingsToggleButton = document.getElementById('settingsToggleButton');
const settingsOverlay = document.getElementById('settingsOverlay');
const closeSettingsOverlay = document.getElementById('closeSettingsOverlay');
const openSettingsWindow = document.getElementById('openSettingsWindow');
const characterFrame = document.querySelector('.character-frame');
const worldFrame = document.querySelector('.world-frame');
const playerToggleButton = document.getElementById('playerToggleButton');
const playerOverlay = document.getElementById('playerOverlay');
const closePlayerOverlay = document.getElementById('closePlayerOverlay');
const openPlayerWindow = document.getElementById('openPlayerWindow');

function closeAllOverlays() {
    worldOverlay.classList.add('hidden');
    characterOverlay.classList.add('hidden');
    tagManagerWindow.classList.add('hidden');
    settingsOverlay.classList.add('hidden');
    playerOverlay.classList.add('hidden');
    app.classList.remove('world-open', 'character-open', 'tag-manager-open', 'settings-open', 'player-open');
}

function setOverlay(open, overlay, className) {
    if (open) closeAllOverlays();
    overlay.classList.toggle('hidden', !open);
    app.classList.toggle(className, open);
}

function reloadCharacterFrame() {
    if (!characterFrame) return;
    characterFrame.src = `character.html?reload=${Date.now()}`;
}

function reloadWorldFrame() {
    if (!worldFrame) return;
    worldFrame.src = `world.html?reload=${Date.now()}`;
}

function setTopCollapsed(collapsed) {
    topbar.classList.toggle('collapsed', collapsed);
    topbar.classList.remove('menu-open');
    toggleTop.textContent = collapsed ? 'ロック' : '解除';
}

toggleTop.addEventListener('click', () => setTopCollapsed(!topbar.classList.contains('collapsed')));
topbar.addEventListener('mouseenter', () => { if (topbar.classList.contains('collapsed')) topbar.classList.add('menu-open'); });
topbar.addEventListener('mouseleave', () => topbar.classList.remove('menu-open'));
toggleTopFromFloat.addEventListener('click', () => setTopCollapsed(!topbar.classList.contains('collapsed')));
layoutToggleTop.addEventListener('click', () => floatingMenu.classList.toggle('hidden'));
closeFloat.addEventListener('click', () => floatingMenu.classList.add('hidden'));

worldToggleButton.addEventListener('click', () => {
    reloadWorldFrame();
    setOverlay(worldOverlay.classList.contains('hidden'), worldOverlay, 'world-open');
});
closeWorldOverlay.addEventListener('click', () => setOverlay(false, worldOverlay, 'world-open'));
openWorldWindow.addEventListener('click', () => window.open('world.html', 'worldCard'));

characterToggleButton.addEventListener('click', () => { reloadCharacterFrame(); setOverlay(characterOverlay.classList.contains('hidden'), characterOverlay, 'character-open'); });
closeCharacterOverlay.addEventListener('click', () => setOverlay(false, characterOverlay, 'character-open'));
openCharacterWindow.addEventListener('click', () => window.open('character.html', 'characterCard'));

settingsToggleButton.addEventListener('click', () => setOverlay(settingsOverlay.classList.contains('hidden'), settingsOverlay, 'settings-open'));
closeSettingsOverlay.addEventListener('click', () => setOverlay(false, settingsOverlay, 'settings-open'));
openSettingsWindow.addEventListener('click', () => window.open('settings.html', 'settingsWindow'));

playerToggleButton.addEventListener('click', () => setOverlay(playerOverlay.classList.contains('hidden'), playerOverlay, 'player-open'));
closePlayerOverlay.addEventListener('click', () => setOverlay(false, playerOverlay, 'player-open'));
openPlayerWindow.addEventListener('click', () => window.open('player.html', 'playerWindow'));

tagManageButton.addEventListener('click', () => setOverlay(tagManagerWindow.classList.contains('hidden'), tagManagerWindow, 'tag-manager-open'));
closeTagManager.addEventListener('click', () => setOverlay(false, tagManagerWindow, 'tag-manager-open'));
closeTagManagerFooter.addEventListener('click', () => setOverlay(false, tagManagerWindow, 'tag-manager-open'));

window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'settings_applied') return;
    const title = document.getElementById('settingsTitle');
    if (!title) return;
    const original = title.textContent;
    title.textContent = event.data.message;
    title.style.color = '#0f7a2f';
    setTimeout(() => { title.textContent = original; title.style.color = ''; }, 2000);
});

const worldSelectButton = document.getElementById("worldSelectButton");
const worldSelectPopup = document.getElementById("worldSelectPopup");
const closeWorldSelectPopup = document.getElementById("closeWorldSelectPopup");
const worldSelectTableBody = document.getElementById("worldSelectTableBody");
const sessionList = document.getElementById("sessionList");
const newChatButton = document.getElementById("newChatButton");

function getWorldList() {
    try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WORLD_LIST) || "[]");
    } catch {
    return [];
    }
}

function getSessionList() {
    try {
    return JSON.parse(localStorage.getItem("session_list") || "[]");
    } catch {
    return [];
    }
}

function saveSessionList(sessions) {
    localStorage.setItem("session_list", JSON.stringify(Array.isArray(sessions) ? sessions : []));
}

function upsertSessionList(session) {
    if (!session || !session.session_id) return getSessionList();

    const sessions = getSessionList();
    const index = sessions.findIndex(item => item.session_id === session.session_id);

    if (index >= 0) {
    sessions[index] = { ...sessions[index], ...session };
    } else {
    sessions.unshift(session);
    }

    saveSessionList(sessions);
    return sessions;
}

function updateSummaryWorld() {
    const scenario = document.querySelector("#summaryScenario");
    if (!scenario) return;

    const selectedWorldName = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_NAME) || "";
    scenario.textContent = "選択中世界: " + (selectedWorldName || "未選択");
}

function applySelectedSession(session) {
    if (!session) return;

    const sessionId = session.session_id || session.id || "";
    const sessionName =
    session.display_name ||
    session.name ||
    session.session_name ||
    "";

    if (sessionId) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SESSION_ID, sessionId);
    }

    localStorage.setItem("selected_session_name", sessionName);

    // 世界ID/世界名は「世界選択」で管理する。
    // セッション選択・新規チャットでは上書きしない。
    updateSummaryWorld();
}

function buildSessionFromNewChatResult(result, fallbackWorldId, fallbackWorldName) {
    const sessionId = result.session_id || result.selected_session_id || "";
    const worldId = result.world_id || fallbackWorldId || "";
    const worldName = result.world_name || fallbackWorldName || "";
    const displayName =
    result.session_name ||
    result.selected_session_name ||
    result.display_name ||
    worldName ||
    "名称未設定";

    return {
    session_id: sessionId,
    world_id: worldId,
    world_name: worldName,
    display_name: displayName,
    updated_at: result.updated_at || ""
    };
}

function clearSessionList() {
    if (!sessionList) return;
    sessionList.innerHTML = "";
}

function normalizeSessionList(rawSessions) {
    if (!Array.isArray(rawSessions)) return [];

    const selectedWorldId = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_ID) || "";
    const selectedWorldName = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_NAME) || "";

    return rawSessions
    .filter(session => session && typeof session === "object")
    .map(session => {
        const sessionId =
        session.session_id ||
        session.id ||
        "";

        const displayName =
        session.display_name ||
        session.name ||
        session.session_name ||
        "名称未設定";

        return {
        ...session,
        session_id: sessionId,
        display_name: displayName,
        world_id: session.world_id || selectedWorldId,
        world_name: session.world_name || selectedWorldName,
        updated_at: session.updated_at || ""
        };
    })
    .filter(session => session.session_id);
}

function renderSessionList(sessions, selectedSessionId) {
    clearSessionList();

    if (!Array.isArray(sessions) || sessions.length === 0) {
    return;
    }

    sessions.forEach(session => {
    const row = document.createElement("div");
    row.className = "session-row";
    row.dataset.sessionId = session.session_id || "";

    if (selectedSessionId && session.session_id === selectedSessionId) {
        row.classList.add("active");
    }

    const iconText = session.world_name ? session.world_name.slice(0, 1) : "世";
    const displayName = session.display_name || "名称未設定";
    const updatedAt = session.updated_at || "";

    row.innerHTML = `
        <div class="session-name">
        <span class="session-icon">${iconText}</span>
        <span>${displayName}</span>
        </div>

        <span>${updatedAt}</span>

        <div style="display:flex; gap:4px;">
        <button
            class="session-detail"
            type="button"
            title="session_id: ${session.session_id || ""}\nクリックでコピー"
        >
            i
        </button>

        <button
            class="session-delete"
            type="button"
            title="削除"
        >
            ×
        </button>
        </div>
    `;

    row.addEventListener("click", () => {
        document.querySelectorAll(".session-row.active").forEach(activeRow => {
        activeRow.classList.remove("active");
        });
        row.classList.add("active");

        // セッション選択では、現使用セッションだけ更新する。
        // 世界ID/世界名は世界選択時の値を維持する。
        localStorage.setItem(STORAGE_KEYS.SELECTED_SESSION_ID, session.session_id || "");
        localStorage.setItem("selected_session_name", displayName);

        updateSummaryWorld();
    });

    const deleteButton = row.querySelector(".session-delete");
    const detailButton = row.querySelector(".session-detail");

    if (detailButton) {
        detailButton.addEventListener("click", async event => {
        event.stopPropagation();

        const sessionId = session.session_id || "";

        if (!sessionId) {
            return;
        }

        try {
            await navigator.clipboard.writeText(sessionId);

            detailButton.textContent = "✓";

            setTimeout(() => {
            detailButton.textContent = "i";
            }, 1000);

        } catch (error) {
            console.error(error);
            showToast(error || "コピーに失敗しました", MESSAGE_TYPE.ERROR);
        }
        });
    }
    if (deleteButton) {
        deleteButton.addEventListener("click", async event => {
        event.stopPropagation();

        const sessionId = session.session_id || "";
        if (!sessionId) return;

        if (!confirm(`${displayName} を削除しますか？`)) {
            return;
        }

        try {
            await deleteSession(sessionId);

            const sessions = getSessionList().filter(item => {
            return item.session_id !== sessionId;
            });

            saveSessionList(sessions);

            const selectedSessionId = localStorage.getItem(STORAGE_KEYS.SELECTED_SESSION_ID) || "";

            if (selectedSessionId === sessionId) {
            localStorage.removeItem(STORAGE_KEYS.SELECTED_SESSION_ID);
            localStorage.removeItem("selected_session_name");
            resetMainView();
            updateSummaryWorld();
            }

            renderSessionList(sessions, localStorage.getItem(STORAGE_KEYS.SELECTED_SESSION_ID) || "");

        } catch (error) {
            console.error(error);
            showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
        }
        });
    }

    sessionList.appendChild(row);

    });
}

async function postWorldStart(world) {
    const response = await fetch(getFlaskBaseUrl() + API_PATHS.WORLD_START, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        world_id: world.id,
        world_name: world.name,
    }),
    });

    const result = await response.json();

    if (!response.ok || result.result !== "ok") {
    throw new Error(result.message || "world_start に失敗しました");
    }
    return result;
}

async function startNewChatBySessionId(sessionId) {

    const response = await fetch(getFlaskBaseUrl() + API_PATHS.NEW_CHAT, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        session_id: sessionId,
    }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== "ok") {
    throw new Error(result.message || "new_chat に失敗しました");
    }

    return result;
}

async function startSessionByWorld(world) {
    const result = await postWorldStart(world);

    resetMainView();

    const worldId = result.world_id || world.id || "";
    const worldName = result.world_name || world.name || "";
    const sessions = Array.isArray(result.sessions) ? result.sessions : [];

    localStorage.setItem(STORAGE_KEYS.SELECTED_WORLD_ID, worldId);
    localStorage.setItem(STORAGE_KEYS.SELECTED_WORLD_NAME, worldName);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_SESSION_ID);
    localStorage.removeItem("selected_session_name");

    updateSummaryWorld();

    const normalizedSessions = normalizeSessionList(sessions);
    saveSessionList(normalizedSessions);
    renderSessionList(normalizedSessions, "");

    showToast("世界を選択しました。\n新規チャットを押すか、セッション一覧から選択して続きを開始してください。", MESSAGE_TYPE.SUCCESS);

    return result;
}

async function postNewChat() {
    const basePath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH)
    const worldId = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_ID) || "";
    const worldName = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_NAME) || "";
    
    if (!worldId) {
        showToast("先に世界を選択してください", MESSAGE_TYPE.INFO);
        return;
    }

    if (newChatButton) {
    newChatButton.disabled = true;
    newChatButton.textContent = "作成中";
    }

    try {
    const response = await fetch(getFlaskBaseUrl() + API_PATHS.CHAT_STARTUP, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        base_path: basePath,
        world_id: worldId,
        }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== "ok") {
        throw new Error(result.message || "新規セッション作成に失敗しました");
    }

    const session = buildSessionFromNewChatResult(result, worldId, worldName);

    if (!session.session_id) {
        throw new Error("session_id が返ってきませんでした");
    }

    applySelectedSession(session);

    const sessions = Array.isArray(result.sessions)
        ? normalizeSessionList(result.sessions)
        : upsertSessionList(session);

    if (Array.isArray(result.sessions)) {
        saveSessionList(sessions);
    }

    renderSessionList(sessions, session.session_id);
    resetMainView();
    applySelectedSession(session);

    const responseNewChat = await fetch(getFlaskBaseUrl() + API_PATHS.NEW_CHAT, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        session_id: session.session_id
        }),
    });

    const resultNewChat = await responseNewChat.json();

    if (responseNewChat.ok && resultNewChat.status === "ok") {
        console.log("返却内容", resultNewChat);

        resetMainView();

        appendChatMessage(
        "シナリオ開始",
        resultNewChat.start_message || "",
        "始"
        );
    }

    } catch (error) {
        console.error(error);
        showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
    } finally {
        if (newChatButton) {
            newChatButton.disabled = false;
            newChatButton.textContent = "新規チャット";
        }
    }
}

function openWorldSelectPopup() {
    const worlds = getWorldList();

    worldSelectTableBody.innerHTML = "";

    worlds.forEach(world => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${world.id}</td>
        <td>${world.name}</td>
    `;

    tr.addEventListener("click", async () => {
        try {
            worldSelectPopup.classList.add("hidden");
            await startSessionByWorld(world);
        } catch (error) {
            showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
        }
    });

    worldSelectTableBody.appendChild(tr);
    });

    worldSelectPopup.classList.remove("hidden");
}

worldSelectButton.addEventListener("click", openWorldSelectPopup);

if (newChatButton) {
    newChatButton.addEventListener("click", postNewChat);
}

closeWorldSelectPopup.addEventListener("click", () => {
    worldSelectPopup.classList.add("hidden");
});
function resetMainView() {
    const chatLog = document.querySelector(".chat-log");
    const standeeBox = document.querySelector(".standee-box");
    const worldList = document.querySelector(".world-list");
    const parameterStrip = document.querySelector(".parameter-strip");
    const chatInput = document.querySelector(".chat-input");
    const scenario = document.querySelector("#summaryScenario");
    const server = document.querySelector("#summaryServer");
    const serverStatus = document.querySelector("#summaryServerStatus");
    const character = document.querySelector("#summaryCharacter");
    const llm = document.querySelector("#summaryLlm");
    const summaryImage = document.querySelector("#summaryImage");
    const summaryImageStatus = document.querySelector("#summaryImageStatus");

    if (chatLog) chatLog.innerHTML = "";
    if (standeeBox) standeeBox.innerHTML = "発言キャラクター立ち絵";
    if (worldList) {
    worldList.innerHTML = `
        <div class="image-stage">
        <div class="image-box">
            返信画像<br>
            ここに小さめプレビューや生成状態を置いても良さそうです。
        </div>
        </div>
    `;
    }
    if (parameterStrip) parameterStrip.innerHTML = "キャラパラメータ枠<br />喋ったキャラと連動 / 世界カードON/OFF指定";
    if (chatInput) chatInput.value = "";
    if (scenario) scenario.innerHTML  = "選択中世界: ";
    if (server) server.innerHTML  = "サーバー： ";
    if (serverStatus) serverStatus.innerHTML  = "－確認待ち";
    if (llm) llm.innerHTML  = "使用モデル: Qwen3.6-35B-A3B-UD-Q3_K_XL.gguf";
    if (summaryImage) summaryImage.innerHTML  = "画像作成中: ";
    if (summaryImageStatus) summaryImageStatus.innerHTML  = "－確認待ち";
}

function appendChatMessage(name, text, avatarText = "") {
    const chatLog = document.querySelector(".chat-log");
    if (!chatLog) return;

    const message = document.createElement("div");
    message.className = "message";

    message.innerHTML = `
    <div class="avatar"></div>
    <div class="bubble">
        <div class="name"></div>
        <div class="message-text"></div>
    </div>
    `;

    message.querySelector(".avatar").textContent = avatarText || name.slice(0, 1);
    message.querySelector(".name").textContent = name;
    message.querySelector(".message-text").textContent = text || "";

    chatLog.appendChild(message);
    chatLog.scrollTop = chatLog.scrollHeight;
}

async function deleteSession(sessionId) {

    if (!sessionId) return;

    const response = await fetch(getFlaskBaseUrl() + API_PATHS.DELETE_SESSION, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        session_id: sessionId,
    }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== "ok") {
    throw new Error(result.message || "セッション削除に失敗しました");
    }

    return result;
}

async function initializeMainViewFromLocalStorage() {
    resetMainView();

    const selectedWorldId = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_ID) || "";
    const selectedWorldName = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_NAME) || "";

    console.log("select", selectedWorldId);
    updateSummaryWorld();

    clearSessionList();

    // 世界選択をしていない場合は、サーバーへ問い合わせない。
    if (!selectedWorldId) {
    saveSessionList([]);
    return;
    }

    try {
    const response = await fetch(getFlaskBaseUrl() + API_PATHS.LOAD_SESSION_LIST, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        world_id: selectedWorldId
        })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.status === "error" || result.ok === false) {
        console.error(result.message || "セッション一覧の読み込みに失敗しました");
        saveSessionList([]);
        clearSessionList();
        return;
    }

    const sessions = normalizeSessionList(
        result.sessions ||
        result.session_list ||
        result.list ||
        result
    );

    saveSessionList(sessions);

    // 初期選択はしないので、第2引数は空文字にする。
    renderSessionList(sessions, "");

    } catch (error) {
    console.error(error);
    saveSessionList([]);
    clearSessionList();
    }
}

initializeMainViewFromLocalStorage();

const summaryCheck = document.getElementById("summaryCheck");
const summaryServerStatus = document.getElementById("summaryServerStatus");

async function checkServerHealth() {

    summaryServerStatus.textContent = "確認中...";
    summaryServerStatus.className = "status-wait";

    try {
    const response = await fetch(getFlaskBaseUrl() + API_PATHS.HEALTH);

    if (!response.ok) {
        throw new Error("health request failed");
    }

    const result = await response.json();

    if (result.status === "ok") {
        summaryServerStatus.textContent = "●接続中";
        summaryServerStatus.className = "status-ok";
    } else {
        summaryServerStatus.textContent = "×未接続";
        summaryServerStatus.className = "status-error";
    }

    } catch (error) {
    console.error(error);

    summaryServerStatus.textContent = "×未接続";
    summaryServerStatus.className = "status-error";
    }
}

summaryCheck.addEventListener("click", checkServerHealth);