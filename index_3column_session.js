const app = document.getElementById('app');
const topbar = document.getElementById('topbar');
const toggleTop = document.getElementById('toggleTop');
const toggleTopFromFloat = document.getElementById('toggleTopFromFloat');
const layoutToggleTop = document.getElementById('layoutToggleTop');
const floatingMenu = document.getElementById('floatingMenu');
const closeFloat = document.getElementById('closeFloat');
const worldOverlay = document.getElementById('worldOverlay');
const closeWorldOverlay = document.getElementById('closeWorldOverlay');
const openWorldWindow = document.getElementById('openWorldWindow');
const characterOverlay = document.getElementById('characterOverlay');
const closeCharacterOverlay = document.getElementById('closeCharacterOverlay');
const openCharacterWindow = document.getElementById('openCharacterWindow');
const tagManagerWindow = document.getElementById('tagManagerWindow');
const closeTagManager = document.getElementById('closeTagManager');
const closeTagManagerFooter = document.getElementById('closeTagManagerFooter');
const settingsOverlay = document.getElementById('settingsOverlay');
const closeSettingsOverlay = document.getElementById('closeSettingsOverlay');
const openSettingsWindow = document.getElementById('openSettingsWindow');
const characterFrame = document.querySelector('.character-frame');
const worldFrame = document.querySelector('.world-frame');
const playerOverlay = document.getElementById('playerOverlay');
const closePlayerOverlay = document.getElementById('closePlayerOverlay');
const openPlayerWindow = document.getElementById('openPlayerWindow');

// 上部メニューボタン
const tagManageButton = document.getElementById('tagManageButton');
const worldToggleButton = document.getElementById('worldToggleButton');
const characterToggleButton = document.getElementById('characterToggleButton');
const settingsToggleButton = document.getElementById('settingsToggleButton');
const playerToggleButton = document.getElementById('playerToggleButton');
const summaryCheck = document.getElementById("summaryCheck");
const summaryServerStatus = document.getElementById("summaryServerStatus");

// メイン画面上のボタン
const worldSelectButton = document.getElementById("worldSelectButton");
const worldSelectPopup = document.getElementById("worldSelectPopup");
const closeWorldSelectPopup = document.getElementById("closeWorldSelectPopup");
const worldSelectTableBody = document.getElementById("worldSelectTableBody");
const sessionList = document.getElementById("sessionList");
const selectAllSessionsCheckbox =　document.getElementById("selectAllSessionsCheckbox");
const deleteSelectedSessionsButton =　document.getElementById("deleteSelectedSessionsButton");
const messageList = document.getElementById("messageList");
const newChatButton = document.getElementById("newChatButton");
const chatButton = document.getElementById("chatButton");
const chatScrollTopButton = document.getElementById("chatScrollTopButton");
const chatScrollBottomButton = document.getElementById("chatScrollBottomButton");

// メイン上部のボタン登録
openWorldWindow.addEventListener('click', function () {openWindowPage('world.html', 'worldCard')});
openCharacterWindow.addEventListener('click', function () {openWindowPage('character.html', 'characterCard')});
openSettingsWindow.addEventListener('click', function () {openWindowPage('settings.html', 'settingsWindow')});
openPlayerWindow.addEventListener('click', function () {openWindowPage('player.html', 'playerWindow')});

tagManageButton.addEventListener('click', () => setOverlay(tagManagerWindow.classList.contains('hidden'), tagManagerWindow, 'tag-manager-open'));
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
characterToggleButton.addEventListener('click', () => { reloadCharacterFrame(); setOverlay(characterOverlay.classList.contains('hidden'), characterOverlay, 'character-open'); });
closeCharacterOverlay.addEventListener('click', () => setOverlay(false, characterOverlay, 'character-open'));
settingsToggleButton.addEventListener('click', () => setOverlay(settingsOverlay.classList.contains('hidden'), settingsOverlay, 'settings-open'));
closeSettingsOverlay.addEventListener('click', () => setOverlay(false, settingsOverlay, 'settings-open'));
playerToggleButton.addEventListener('click', () => setOverlay(playerOverlay.classList.contains('hidden'), playerOverlay, 'player-open'));
closePlayerOverlay.addEventListener('click', () => setOverlay(false, playerOverlay, 'player-open'));
closeTagManager.addEventListener('click', () => setOverlay(false, tagManagerWindow, 'tag-manager-open'));
closeTagManagerFooter.addEventListener('click', () => setOverlay(false, tagManagerWindow, 'tag-manager-open'));
summaryCheck.addEventListener("click", checkServerHealth);

/**
 * 画面上のボタンイベント登録
 */
worldSelectButton.addEventListener("click", openWorldSelectPopup);
closeWorldSelectPopup.addEventListener("click", closeWorldSelect);
newChatButton.addEventListener("click", postNewChat);
chatButton.addEventListener("click", postChat);
sessionList.addEventListener("click", selectSession);
messageList.addEventListener("click", selectMessage);
selectAllSessionsCheckbox.addEventListener("change", changeAllSessionSelections);
deleteSelectedSessionsButton.addEventListener("click", deleteSelectedSessions);
chatScrollTopButton.addEventListener("click", () => scrollChat("top"));
chatScrollBottomButton.addEventListener("click", () => scrollChat("bottom"));
chatScrollBottomButton.addEventListener("click", () => scrollChat("bottom"));

function scrollChat(scrollLine) {
    const chatLog = document.querySelector(".chat-log");
    if (!chatLog) return;

    var line = 0;
    if (scrollLine === "bottom") {
        line = chatLog.scrollHeight
    }
    
    chatLog.scrollTop = line;
}
window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'settings_applied') return;
    const title = document.getElementById('settingsTitle');
    if (!title) return;
    const original = title.textContent;
    title.textContent = event.data.message;
    title.style.color = '#0f7a2f';
    setTimeout(() => { title.textContent = original; title.style.color = ''; }, 2000);
});

/**
 * チャット画面で使う画像のURLを作る。
 * 新規チャット時にサーバーがセッションフォルダへ退避した画像を読むので、
 * 後からキャラクター画面で画像を変えても、進行中のチャットには影響しない。
 *
 * @param {string} imageType "icon" または "standing"
 * @param {string} characterId キャラクターID
 * @returns {string} URL。セッション未選択などで作れない場合は空文字
 */
// 選択中のセッションのプレイヤー（サーバーが /new_chat・/selected_session で返す）。発言した直後の吹き出しに使う
let currentPlayer = { character_id: "", character_name: "" };

function setCurrentPlayer(player) {
    currentPlayer = {
        character_id: (player && player.character_id) || "",
        character_name: (player && player.character_name) || "",
    };
}

// 履歴の1行がプレイヤーの発言か。サーバーが返す role で見分ける。古い履歴は role が無く、character_id が player
function isPlayerMessage(messageObj) {
    return messageObj.role === "player" || messageObj.icon_data.character_id === "player";
}

function buildSessionImageUrl(imageType, characterId) {
    const sessionId =
        localStorage.getItem(STORAGE_KEYS.SELECTED_SESSION_ID) || "";

    // システムと、古い履歴のプレイヤー（ID が player 固定だったころ）は、退避した画像を持たない。
    // 今のプレイヤーは実際のプレイヤーIDなので、セッションに退避したアイコンを出す
    if (!sessionId || !characterId || characterId === "player" || characterId === "system") {
        return "";
    }

    return getFlaskBaseUrl() + API_PATHS.SESSION_IMAGE +
        `/${encodeURIComponent(sessionId)}/${encodeURIComponent(imageType)}/${encodeURIComponent(characterId)}`;
}

/**
 * 立ち絵を初期表示へ戻す。
 */
function resetStandee() {
    const stand = document.querySelector(".standee-box");
    if (!stand) return;

    stand.classList.remove("has-image");
    stand.textContent = "発言キャラクター立ち絵";
}

/**
 * 立ち絵画像を表示する。
 *
 * @param {string} imagePath 画像パス
 * @param {string} altText 代替テキスト
 */
function showStandeeImage(imagePath, altText = "") {
    const stand = document.querySelector(".standee-box");
    if (!stand) return;

    if (!imagePath) {
        resetStandee();
        return;
    }

    const img = document.createElement("img");
    img.className = "stand-img";
    img.alt = altText;

    // 立ち絵が無いキャラクター（プレイヤー等）は初期表示へ戻す
    img.onerror = resetStandee;
    img.src = imagePath;

    /*
     * 文字や以前の画像をすべて消し、
     * 今回の画像だけを子要素として配置する。
     */
    stand.replaceChildren(img);
    stand.classList.add("has-image");
}

async function selectMessage(event) {
    const sessionId =
        localStorage.getItem(STORAGE_KEYS.SELECTED_SESSION_ID) || "";

    // セッションIDチェック
    if (!checkSessionId(sessionId)) {
        return;
    }

    // アイコンは吹き出しの外にあるので、メッセージ行から吹き出しを探す
    const rowElementMessage = event.target.closest(".message");

    if (!rowElementMessage) return;

    const rowElementBubble = rowElementMessage.querySelector(".bubble, .bubble_user");

    if (!rowElementBubble) return;

    const lineId = rowElementBubble.dataset.lineId;
    const characterId = rowElementBubble.dataset.characterId;
    const nameElement = rowElementMessage.querySelector(".name");
    const name = nameElement ? nameElement.innerText : "";

    console.log("名前", characterId);
    if (characterId === "system") {
        try {
            const resultMessage = await postJson(API_PATHS.SELECTED_MESSAGE, {
                session_id: sessionId,
                line_id: lineId,
            }, "メッセージの読み込みに失敗しました");

            console.log("返却内容", resultMessage);

            const messageList = resultMessage.message_list;
            let insertElement = rowElementMessage;

            for (const messageObj of messageList) {
                console.log("要素", messageObj);
                if (isPlayerMessage(messageObj)) {
                    insertElement = insertChatMessageByUser(
                        insertElement,
                        messageObj.line_id || "",
                        messageObj.icon_data.character_id || "",
                        messageObj.icon_data.character_name,
                        messageObj.message || "",
                        "シ"
                    );
                } else if (messageObj.icon_data.character_id === "system") {
                    insertElement = insertChatMessageBySystem(
                        insertElement,
                        messageObj.line_id || "",
                        messageObj.icon_data.character_id || "",
                        messageObj.icon_data.character_name,
                        messageObj.message || "",
                        "シ"
                    );
                } else {
                    insertElement = insertChatMessage(
                        insertElement,
                        messageObj.line_id || "",
                        messageObj.icon_data.character_id || "",
                        messageObj.icon_data.character_name,
                        messageObj.message || "",
                        "シ"
                    );
                }
            }

            rowElementMessage.remove();
        } catch (error) {
            console.error(error);

            showToast(
                error.message || "エラー発生",
                MESSAGE_TYPE.ERROR
            );
        } finally {
            if (chatButton) {
                chatButton.disabled = memoryWatch.preparing;
                chatButton.textContent = "発言";
            }
        }

        return;
    }

    if (!characterId) return;

    showStandeeImage(
        buildSessionImageUrl("standing", characterId),
        name
    );
}

async function selectSession(event) {

    const row = event.target.closest(".session-row");
    if (!row) return;

    const sessionId = row.dataset.sessionId;

    const worldId = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_ID) || "";
    
    // チェック
    if (!checkWorldId(worldId)) {
        return;
    }

    try {

        // 新規チャット（初期処理）
        const resultSession = await postJson(API_PATHS.SELECTED_SESSION, {
            session_id: sessionId,
        }, "セッションの読み込みに失敗しました");

        console.log("返却内容", resultSession);

        clearChatLog();
        setCurrentPlayer(resultSession.player);
        const messageList = resultSession.message_list;
        for (const messageObj of messageList) {
            console.log("要素", messageObj);
            if (isPlayerMessage(messageObj)) {
                appendChatMessageByUser(
                    messageObj.line_id || "",
                    messageObj.icon_data.character_id || "",
                    messageObj.icon_data.character_name,
                    messageObj.message || ""
                );
            } else if (messageObj.icon_data.character_id === "system") {
                appendChatMessageBySystem(
                    messageObj.line_id || "",
                    messageObj.icon_data.character_id || "",
                    messageObj.icon_data.character_name,
                    messageObj.message || ""
                );
            } else {
                appendChatMessage(
                    messageObj.line_id || "",
                    messageObj.icon_data.character_id || "",
                    messageObj.icon_data.character_name,
                    messageObj.message || ""
                );
            }
        }

        // 初期記憶がまだ作成中なら、終わるまで発言系のボタンを止める。失敗していたら知らせる
        watchMemoryPreparation(sessionId);

    } catch (error) {
        console.error(error);
        showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
    } finally {
        if (chatButton) {
            chatButton.disabled = memoryWatch.preparing;
            chatButton.textContent = "発言";
        }
    }
}

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

    if (selectAllSessionsCheckbox) {
        selectAllSessionsCheckbox.checked = false;
        selectAllSessionsCheckbox.indeterminate = false;
    }

    updateSelectedSessionDeleteButton();
}

/**
 * セッション更新日時を一覧表示用に分割する。
 *
 * 対応例:
 * 2026年07月11日 23:26
 * 2026年7月11日 23:26
 * 2026-07-11 23:26
 *
 * @param {string} updatedAt 更新日時
 * @returns {{ year: string, date: string }}
 */
function formatSessionUpdatedAt(updatedAt) {
    const value = String(updatedAt || "").trim();

    if (!value) {
        return {
            year: "",
            date: "",
        };
    }

    const japaneseMatch = value.match(
        /^(\d{4})年0?(\d{1,2})月0?(\d{1,2})日(?:\s+(.+))?$/
    );

    if (japaneseMatch) {
        const year = japaneseMatch[1];
        const month = Number(japaneseMatch[2]);
        const day = Number(japaneseMatch[3]);
        const time = japaneseMatch[4] || "";

        return {
            year: `${year}年`,
            date:
                `${month}月${day}日` +
                (time ? ` ${time}` : ""),
        };
    }

    const standardMatch = value.match(
        /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(.+))?$/
    );

    if (standardMatch) {
        const year = standardMatch[1];
        const month = Number(standardMatch[2]);
        const day = Number(standardMatch[3]);

        let time = standardMatch[4] || "";

        /*
         * ISO形式で秒やタイムゾーンが含まれていても、
         * 一覧上では時分までにする。
         */
        const timeMatch = time.match(/^(\d{1,2}):(\d{2})/);

        if (timeMatch) {
            time = `${timeMatch[1]}:${timeMatch[2]}`;
        }

        return {
            year: `${year}年`,
            date:
                `${month}月${day}日` +
                (time ? ` ${time}` : ""),
        };
    }

    /*
     * 想定外の形式の場合は、値を壊さず2段目に表示する。
     */
    return {
        year: "",
        date: value,
    };
}

/**
 * 選択されているセッションIDを取得する。
 *
 * @returns {string[]}
 */
function getSelectedSessionIds() {
    if (!sessionList) {
        return [];
    }

    return Array.from(
        sessionList.querySelectorAll(
            ".session-select-checkbox:checked"
        )
    )
    .map(checkbox => checkbox.value)
    .filter(sessionId => sessionId);
}

/**
 * 選択削除ボタンと全選択チェックの状態を更新する。
 */
function updateSelectedSessionDeleteButton() {
    if (!sessionList) {
        return;
    }

    const checkboxes = Array.from(
        sessionList.querySelectorAll(
            ".session-select-checkbox"
        )
    );

    const selectedCheckboxes = checkboxes.filter(
        checkbox => checkbox.checked
    );

    const selectedCount = selectedCheckboxes.length;

    if (deleteSelectedSessionsButton) {
        deleteSelectedSessionsButton.disabled =
            selectedCount === 0;

        deleteSelectedSessionsButton.textContent =
            selectedCount > 0
                ? `選択削除（${selectedCount}）`
                : "選択削除";
    }

    if (selectAllSessionsCheckbox) {
        selectAllSessionsCheckbox.checked =
            checkboxes.length > 0 &&
            selectedCount === checkboxes.length;

        selectAllSessionsCheckbox.indeterminate =
            selectedCount > 0 &&
            selectedCount < checkboxes.length;

        selectAllSessionsCheckbox.disabled =
            checkboxes.length === 0;
    }
}

/**
 * ヘッダーのチェック状態を全行へ反映する。
 *
 * @param {Event} event changeイベント
 */
function changeAllSessionSelections(event) {
    const checked = event.target.checked;

    const checkboxes = sessionList.querySelectorAll(
        ".session-select-checkbox"
    );

    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
    });

    updateSelectedSessionDeleteButton();
}

/**
 * 選択されたセッションを削除する。
 */
async function deleteSelectedSessions() {
    const selectedSessionIds =
        getSelectedSessionIds();

    if (selectedSessionIds.length === 0) {
        return;
    }

    const confirmMessage =
        `${selectedSessionIds.length}件のセッションを削除しますか？`;

    if (!confirm(confirmMessage)) {
        return;
    }

    deleteSelectedSessionsButton.disabled = true;
    deleteSelectedSessionsButton.textContent = "削除中";

    const deletedSessionIds = [];
    const failedSessionIds = [];

    const result = await deleteSession(selectedSessionIds);
    
    console.log("削除実施後");
    if (result.ok) {
        console.log("分岐通過後");
        // セッションリスト全体から選択中のセッションを外したもの
        // ここでは予定
        const sessions = getSessionList().filter(session => {
            return !result.deleted_session_ids.includes(
                session.session_id
            );
        });

        saveSessionList(sessions);

        const selectedSessionId =
            localStorage.getItem(
                STORAGE_KEYS.SELECTED_SESSION_ID
            ) || "";

        /*
        * 現在開いているセッションが削除対象だった場合は、
        * 選択状態とチャット表示を解除する。
        */
        if (result.deleted_session_ids.includes(selectedSessionId)) {
            localStorage.removeItem(
                STORAGE_KEYS.SELECTED_SESSION_ID
            );

            localStorage.removeItem(
                "selected_session_name"
            );

            resetMainView();
            updateSummaryWorld();
        }

        renderSessionList(
            sessions,
            localStorage.getItem(
                STORAGE_KEYS.SELECTED_SESSION_ID
            ) || ""
        );

        if (failedSessionIds.length > 0) {
            showToast(
                `${result.deleted_session_ids.length}件削除しました。` +
                `${result.failed_session_ids.length}件は削除できませんでした。`,
                MESSAGE_TYPE.ERROR
            );

            return;
        }

        showToast(
            `${result.deleted_session_ids.length}件のセッションを削除しました。`,
            MESSAGE_TYPE.SUCCESS
        );
    } else {
        showToast(
            "サーバー処理通信エラー",
            MESSAGE_TYPE.ERROR
        );
    }
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

function renderSessionList(
    sessions,
    selectedSessionId
) {
    clearSessionList();

    if (
        !Array.isArray(sessions) ||
        sessions.length === 0
    ) {
        updateSelectedSessionDeleteButton();
        return;
    }

    sessions.forEach(session => {
        const row =
            document.createElement("div");

        row.className = "session-row";
        row.dataset.sessionId =
            session.session_id || "";

        if (
            selectedSessionId &&
            session.session_id === selectedSessionId
        ) {
            row.classList.add("active");
        }

        const iconText =
            session.world_name
                ? session.world_name.slice(0, 1)
                : "世";

        const displayName =
            session.display_name ||
            "名称未設定";

        const updatedAt =
            formatSessionUpdatedAt(
                session.updated_at || ""
            );

        row.innerHTML = `
            <label
                class="session-select-cell"
                title="削除対象として選択"
            >
                <input
                    class="session-select-checkbox"
                    type="checkbox"
                    value="${session.session_id || ""}"
                />
            </label>

            <div class="session-name">
                <span class="session-icon">
                    ${iconText}
                </span>

                <span
                    class="session-display-name"
                    title="${displayName}"
                >
                    ${displayName}
                </span>
            </div>

            <div class="session-updated-at">
                <span class="session-updated-year">
                    ${updatedAt.year}
                </span>

                <span class="session-updated-date">
                    ${updatedAt.date}
                </span>
            </div>

            <button
                class="session-detail"
                type="button"
                title="session_id: ${session.session_id || ""}\nクリックでコピー"
            >
                i
            </button>
        `;

        /*
         * 行のクリックでは、現在使用するセッションを選択する。
         */
        row.addEventListener("click", () => {
            document
                .querySelectorAll(".session-row.active")
                .forEach(activeRow => {
                    activeRow.classList.remove("active");
                });

            row.classList.add("active");

            localStorage.setItem(
                STORAGE_KEYS.SELECTED_SESSION_ID,
                session.session_id || ""
            );

            localStorage.setItem(
                "selected_session_name",
                displayName
            );

            updateSummaryWorld();
        });

        const selectCheckbox =
            row.querySelector(
                ".session-select-checkbox"
            );

        const detailButton =
            row.querySelector(".session-detail");

        /*
         * チェックボックス操作時に、
         * セッション選択の行クリックを発生させない。
         */
        if (selectCheckbox) {
            selectCheckbox.addEventListener(
                "click",
                event => {
                    event.stopPropagation();
                }
            );

            selectCheckbox.addEventListener(
                "change",
                () => {
                    updateSelectedSessionDeleteButton();
                }
            );
        }

        /*
         * session_idのコピー。
         */
        if (detailButton) {
            detailButton.addEventListener(
                "click",
                async event => {
                    event.stopPropagation();

                    const sessionId =
                        session.session_id || "";

                    if (!sessionId) {
                        return;
                    }

                    try {
                        await navigator.clipboard.writeText(
                            sessionId
                        );

                        detailButton.textContent = "✓";

                        setTimeout(() => {
                            detailButton.textContent = "i";
                        }, 1000);

                    } catch (error) {
                        console.error(error);

                        showToast(
                            error.message ||
                            "コピーに失敗しました",
                            MESSAGE_TYPE.ERROR
                        );
                    }
                }
            );
        }

        sessionList.appendChild(row);
    });

    updateSelectedSessionDeleteButton();
}

async function postWorldStart(world) {
    const result = await postJson(API_PATHS.WORLD_START, {
        world_id: world.id,
        world_name: world.name,
    }, "world_start に失敗しました");
    return result;
}

async function startNewChatBySessionId(sessionId) {

    const result = await postJson(API_PATHS.NEW_CHAT, {
        session_id: sessionId,
    }, "new_chat に失敗しました");

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

function checkWorldId(world) {
    if (!world) {
        showToast("先に世界を選択してください", MESSAGE_TYPE.INFO);
        return false;
    }
    return true;
}

function checkSessionId(session) {
    if (!session) {
        showToast("セッションIDが取得できませんでした。<br/>セッションリストから選択してください", MESSAGE_TYPE.INFO);
        return false;
    }
    return true;
}

function changeButtonName(button) {
    if (button) {
        button.disabled = true;
        button.textContent = "作成中";
    }
}

async function startUp(worldId) {
    const basePath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH);
    const worldName = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_NAME) || "";
    try {
        const result = await postJson(API_PATHS.CHAT_STARTUP, {
            base_chat_path: basePath,
            world_id: worldId,
        }, "新規セッション作成に失敗しました");

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

        return session;
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

async function postNewChat() {
    const worldId = localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_ID) || "";

    console.log(
        "[新規チャット押下] 世界ID:",
        worldId,
        "キー名:",
        STORAGE_KEYS.SELECTED_WORLD_ID
    );

    console.log(
        "[新規チャット押下] LocalStorage全体:",
        { ...localStorage }
    );

    // チェック
    if (!checkWorldId(worldId)) {
        return;
    }
    // ボタン名変更
    changeButtonName(newChatButton);

    try {

        // 初期処理前準備
        const session = await startUp(worldId);

        // 新規チャット（初期処理）
        const resultNewChat = await postJson(API_PATHS.NEW_CHAT, {
            session_id: session.session_id,
        }, "new_chat に失敗しました");

        console.log("返却内容", resultNewChat);

        clearChatLog();
        setCurrentPlayer(resultNewChat.player);

        appendChatMessage(
            resultNewChat.line_id || "",
            resultNewChat.icon_data.character_id,
            resultNewChat.icon_data.character_name,
            resultNewChat.message || ""
        );

        // 裏で初期記憶を作っている。終わるまで発言系のボタンを止め、進み具合を出す
        watchMemoryPreparation(session.session_id);

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

async function postChat() {
    const sessionId = localStorage.getItem(STORAGE_KEYS.SELECTED_SESSION_ID) || "";
    // チェック
    if (!checkSessionId(sessionId)) {
        return;
    }

    const inputElement = document.querySelector(".chat-input")
    const message = inputElement.value;
    // TODO 未入力の場合警告
    if (message !== "") {
        // ボタン名変更
        changeButtonName(chatButton);

        // playerの発言を先に反映（行番号は、サーバーが返してから入れる）
        appendChatMessageByUser(
            "",
            currentPlayer.character_id || "user",
            currentPlayer.character_name || "ユーザ",
            message
        );
        const userMessageElement = document.querySelector(".chat-log")?.lastElementChild;

        try {

            inputElement.value = ""

            // 新規チャット（初期処理）
            const resultChat = await postJson(API_PATHS.CHAT, {
                session_id: sessionId,
                message: message,
            }, "発言に失敗しました");

            console.log("返却内容", resultChat);

            const userBubble = userMessageElement?.querySelector(".bubble_user");
            if (userBubble && resultChat.player_line_id) {
                userBubble.dataset.lineId = resultChat.player_line_id;
            }

            // 返事と、あれば掛け合い（キャラクター同士の1往復）を、順に吹き出しにする。
            // messages が無い古いサーバーなら、今までどおり返事1件だけ
            const replies = Array.isArray(resultChat.messages) && resultChat.messages.length > 0
                ? resultChat.messages
                : [resultChat];

            for (const reply of replies) {
                appendChatMessage(
                    reply.line_id || "",
                    reply.icon_data.character_id,
                    reply.icon_data.character_name,
                    reply.message || "",
                );
            }

            // 裏でキャラクターの記憶を更新している。終わるまで発言を止め、進み具合を出す。
            // 最初の問い合わせが返るまでの間も押せないよう、先に止めておく（更新中でなければ、問い合わせで戻る）
            setSendButtonsLocked(true);
            watchMemoryPreparation(sessionId);

        } catch (error) {
            console.error(error);
            showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);

            // 失敗した発言は履歴に残らないので、画面からも消し、入力欄に戻す（待っている間に打った文は後ろに残す）
            userMessageElement?.remove();
            const typed = inputElement.value;
            inputElement.value = typed ? `${message}\n${typed}` : message;
        } finally {
            if (chatButton) {
                chatButton.disabled = memoryWatch.preparing;
                chatButton.textContent = "発言";
            }
        }
    } else {

    }

}

async function openWorldSelectPopup() {
    // 一覧はフォルダの中身から作る。取れなければ、ブラウザに残っている一覧を使う
    try {
        await refreshSettingsList("world");
    } catch (error) {
        showToast(error.message || "一覧の取得に失敗しました", MESSAGE_TYPE.ERROR);
    }

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

function closeWorldSelect() {
    worldSelectPopup.classList.add("hidden");
}

// ============================================================
// 初期記憶の進み具合
// 新規チャットのあと、サーバーは裏で初期記憶（世界の記憶とキャラクターの記憶）を作る。
// 発言のあとも、裏でキャラクターの記憶を更新する（after）。どちらも、
// 作っている間は発言を止め、プログレスバーを出す。終われば（成否を問わず）ボタンを戻し、
// 失敗していたらその旨を出す。状態は /session_status で1秒ごとに問い合わせる。
// ============================================================
const MEMORY_POLL_INTERVAL_MS = 1000;
const MEMORY_STAGE_NAMES = { world: "世界の記憶", character: "キャラクターの記憶" };

// 見張る裏の処理。new_chat は新規チャットの初期記憶、after は発言のあとの記憶の更新
const MEMORY_WATCH_STAGES = {
    new_chat: {
        running: "初期記憶を作成中",
        failed: (stage) => `初期記憶の作成に失敗しました（${stage}）。新規チャットを押し直してください。`,
        done: "初期記憶ができました",
    },
    after: {
        running: "記憶を更新中",
        failed: (stage) => `記憶の更新に失敗しました（${stage}）。記憶は前のままです。`,
        done: "",   // 発言のたびに出るので、終わったときの通知は出さない
    },
};

const memoryWatch = {
    sessionId: "",      // 見張っているセッション
    timer: null,
    preparing: false,   // true の間は発言を止める
    sawRunning: false,  // 作成中を一度でも見たか（終わったときに知らせるかどうか）
};

function setSendButtonsLocked(locked) {
    memoryWatch.preparing = locked;

    for (const button of [chatButton]) {
        if (!button) continue;
        button.disabled = locked;
        button.title = locked ? "初期記憶を作成中です。終わるまでお待ちください" : "";
    }
}

/**
 * 入力欄の上の表示を切り替える。
 *
 * @param {"running"|"error"|"hidden"} mode
 * @param {string} text 表示する文
 * @param {number} done 終わった段階の数（running のとき）
 * @param {number} total 全段階の数（running のとき）
 * @param {string} detail マウスを載せたときに出す詳細
 */
function showMemoryProgress(mode, text = "", done = 0, total = 0, detail = "") {
    const box = document.getElementById("memoryProgress");
    const label = document.getElementById("memoryProgressLabel");
    const bar = document.getElementById("memoryProgressBar");
    if (!box || !label || !bar) return;

    box.classList.toggle("hidden", mode === "hidden");
    box.classList.toggle("is-error", mode === "error");
    label.textContent = text;
    box.title = detail;

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    bar.style.width = `${percent}%`;
}

function stopMemoryWatch() {
    if (memoryWatch.timer) {
        clearTimeout(memoryWatch.timer);
    }
    memoryWatch.timer = null;
    memoryWatch.sessionId = "";
    memoryWatch.sawRunning = false;
}

function watchMemoryPreparation(sessionId) {
    stopMemoryWatch();
    if (!sessionId) return;

    memoryWatch.sessionId = sessionId;
    pollMemoryStatus(sessionId);
}

async function pollMemoryStatus(sessionId) {
    // 別のセッションに切り替わっていたら、何もしない
    if (memoryWatch.sessionId !== sessionId) return;

    let result;
    try {
        result = await postJson(API_PATHS.SESSION_STATUS, {
            session_id: sessionId,
        }, "セッションの状態を取得できませんでした");
    } catch (error) {
        // 状態が取れない（古いセッション、サーバーが止まった など）。止めずに使えるようにする
        console.error(error);
        if (memoryWatch.sessionId === sessionId) {
            stopMemoryWatch();
            setSendButtonsLocked(false);
            showMemoryProgress("hidden");
        }
        return;
    }

    if (memoryWatch.sessionId !== sessionId) return;

    const watched = MEMORY_WATCH_STAGES[result.complete_stage];
    const progress = result.progress || {};

    // 作成中・更新中
    if (watched && result.status === "processing") {
        memoryWatch.sawRunning = true;
        setSendButtonsLocked(true);

        const total = Number(progress.total) || 0;
        const done = Math.min(Number(progress.done) || 0, total);
        const step = total > 0 ? `（${done}/${total}）` : "";
        showMemoryProgress("running", `${watched.running}: ${progress.label || "準備中"} ${step}`, done, total);

        memoryWatch.timer = setTimeout(() => pollMemoryStatus(sessionId), MEMORY_POLL_INTERVAL_MS);
        return;
    }

    // 終わった（成否は問わずボタンは戻す）
    setSendButtonsLocked(false);

    if (watched && result.status === "error") {
        const stage = MEMORY_STAGE_NAMES[result.error_stage] || "記憶";
        const text = watched.failed(stage);
        showMemoryProgress("error", text, 0, 0, result.error_message || "");
        if (memoryWatch.sawRunning) {
            showToast(text, MESSAGE_TYPE.ERROR);
        }
    } else {
        showMemoryProgress("hidden");
        if (memoryWatch.sawRunning && watched && watched.done) {
            showToast(watched.done, MESSAGE_TYPE.SUCCESS);
        }
    }

    stopMemoryWatch();
}

function resetMainView() {
    setCurrentPlayer(null);
    stopMemoryWatch();
    setSendButtonsLocked(false);
    showMemoryProgress("hidden");

    const chatLog = document.querySelector(".chat-log");
    const worldList = document.querySelector(".world-list");
    const parameterStrip =
        document.querySelector(".parameter-strip");
    const chatInput = document.querySelector(".chat-input");

    const scenario =
        document.querySelector("#summaryScenario");
    const server =
        document.querySelector("#summaryServer");
    const serverStatus =
        document.querySelector("#summaryServerStatus");
    const llm =
        document.querySelector("#summaryLlm");
    const summaryImage =
        document.querySelector("#summaryImage");
    const summaryImageStatus =
        document.querySelector("#summaryImageStatus");

    if (chatLog) {
        chatLog.innerHTML = "";
    }

    resetStandee();

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

    if (parameterStrip) {
        parameterStrip.innerHTML =
            "キャラパラメータ枠<br />" +
            "喋ったキャラと連動 / 世界カードON/OFF指定";
    }

    if (chatInput) {
        chatInput.value = "";
    }

    if (scenario) {
        scenario.innerHTML = "選択中世界: ";
    }

    if (server) {
        server.innerHTML = "サーバー： ";
    }

    if (serverStatus) {
        serverStatus.innerHTML = "－確認待ち";
    }

    if (llm) {
        llm.innerHTML =
            "使用モデル: Qwen3.6-35B-A3B-UD-Q3_K_XL.gguf";
    }

    if (summaryImage) {
        summaryImage.innerHTML = "画像作成中: ";
    }

    if (summaryImageStatus) {
        summaryImageStatus.innerHTML = "－確認待ち";
    }
}

function clearChatLog() {
    const chatLog =
        document.querySelector(".chat-log");
    const parameterStrip =
        document.querySelector(".parameter-strip");
    const chatInput =
        document.querySelector(".chat-input");

    if (chatLog) {
        chatLog.innerHTML = "";
    }

    resetStandee();

    if (parameterStrip) {
        parameterStrip.innerHTML =
            "キャラパラメータ枠<br />" +
            "喋ったキャラと連動 / 世界カードON/OFF指定";
    }

    if (chatInput) {
        chatInput.value = "";
    }
}

function createChatMessage(chatObject, rowData, lineId, id, name, text, classId) {
    console.log(rowData);

    const message = document.createElement("div");
    message.className = "message";
    message.dataset.lineId = id;

    message.innerHTML = chatObject;

    const avatar = message.querySelector(".avatar");
    const bubble = message.querySelector(classId);
    const img = message.querySelector(".avatar-img");
    const avatarTextElement = message.querySelector(".avatar-text");

    img.alt = name;

    img.onload = () => {
        avatar.style.border = "none";
        avatar.style.background = "transparent";
    };

    // 画像が無い場合は頭文字を表示
    const showInitial = () => {
        img.style.display = "none";
        avatarTextElement.style.display = "flex";
        avatarTextElement.textContent =
            (name || "？").substring(0, 1);
    };

    img.onerror = showInitial;

    const iconUrl = buildSessionImageUrl("icon", id);

    if (iconUrl) {
        img.src = iconUrl;
    } else {
        showInitial();
    }

    bubble.dataset.lineId = lineId;
    bubble.dataset.characterId = id;
    message.querySelector(".name").textContent = name;
    message.querySelector(".message-text").textContent = text || "";
    
    return message;
}
function insertChatMessage(rowData, lineId, id, name, text) {

    const classId = ".bubble";
    const message = createChatMessage(BASE_CHAT_OBJECT, rowData, lineId, id, name, text, classId);
    rowData.insertAdjacentElement("afterend", message)
    rowData.scrollTop = rowData.scrollHeight;

    return message
}
function insertChatMessageBySystem(rowData, lineId, id, name, text) {

    const classId = ".bubble"
    const message = createChatMessage(BASE_CHAT_OBJECT, rowData, lineId, id, name, text, classId);
    rowData.insertAdjacentElement("afterend", message)
    rowData.scrollTop = rowData.scrollHeight;
    return message
}
function insertChatMessageByUser(rowData, lineId, id, name, text) {
    const classId = ".bubble_user";
    const message = createChatMessage(BASE_CHAT_OBJECT_USER, rowData, lineId, id, name, text, classId);
    rowData.insertAdjacentElement("afterend", message)
    rowData.scrollTop = rowData.scrollHeight;
    return message
}

function appendChatMessage(lineId, id, name, text) {
    const chatLog = document.querySelector(".chat-log");
    if (!chatLog) return;

    const classId = ".bubble";
    const message = createChatMessage(BASE_CHAT_OBJECT, chatLog, lineId, id, name, text, classId);

    chatLog.appendChild(message);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function appendChatMessageBySystem(lineId, id, name, text) {
    const chatLog = document.querySelector(".chat-log");
    if (!chatLog) return;

    const classId = ".bubble";
    const message = createChatMessage(BASE_CHAT_OBJECT, chatLog, lineId, id, name, text, classId);

    chatLog.appendChild(message);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function appendChatMessageByUser(lineId, id, name, text) {
    const chatLog = document.querySelector(".chat-log");
    if (!chatLog) return;

    const classId = ".bubble_user";
    const message = createChatMessage(BASE_CHAT_OBJECT_USER, chatLog, lineId, id, name, text, classId);

    chatLog.appendChild(message);
    chatLog.scrollTop = chatLog.scrollHeight;
}

async function deleteSession(sessionIds) {

    const result = await postJson(API_PATHS.DELETE_SESSION, {
        session_ids: sessionIds,
    }, "セッション削除に失敗しました");

    console.log("削除結果", result);

    return result;
}

async function initializeMainViewFromLocalStorage() {
    resetMainView();

    const selectedWorldId =
        localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_ID) || "";

    const selectedWorldName =
        localStorage.getItem(STORAGE_KEYS.SELECTED_WORLD_NAME) || "";

    console.log(
        "[初期表示] 世界ID:",
        selectedWorldId,
        "キー名:",
        STORAGE_KEYS.SELECTED_WORLD_ID
    );

    console.log("select", selectedWorldId);
    updateSummaryWorld();

    clearSessionList();

    // 世界選択をしていない場合は、サーバーへ問い合わせない。
    if (!selectedWorldId) {
        saveSessionList([]);
        return;
    }

    try {
    const result = await postJson(API_PATHS.LOAD_SESSION_LIST, {
        world_id: selectedWorldId,
    }, "セッション一覧の読み込みに失敗しました");

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

async function checkServerHealth() {

    summaryServerStatus.textContent = "確認中...";
    summaryServerStatus.className = "status-wait";

    try {
        // 正常（status: ok）なら接続中。それ以外は例外になり、下の catch で振り分ける
        await requestJson(API_PATHS.HEALTH, { method: "GET" });

        summaryServerStatus.textContent = "●接続中";
        summaryServerStatus.className = "status-ok";
        summaryServerStatus.title = "";

    } catch (error) {
        console.error(error);

        if (error.response?.status === "ng") {
            // サーバーは起動しているが、異常がある
            summaryServerStatus.textContent = "▲異常";
            summaryServerStatus.className = "status-warn";
            summaryServerStatus.title = error.message || "";
            showToast("サーバーに異常があります: " + (error.message || ""), MESSAGE_TYPE.ERROR);
            return;
        }

        // 応答が無い（サーバーが止まっている、接続先が違う）
        summaryServerStatus.textContent = "×未接続";
        summaryServerStatus.className = "status-error";
        summaryServerStatus.title = "";
    }
}

const chatInput = document.querySelector(".chat-input");
const log = document.querySelector(".chat-log");

chatInput.addEventListener("keydown", (event) => {

    switch (event.key) {
        case "PageUp":
            event.preventDefault();
            log.scrollBy({ top: -log.clientHeight, behavior: "smooth" });
            break;

        case "PageDown":
            event.preventDefault();
            log.scrollBy({ top: log.clientHeight, behavior: "smooth" });
            break;

        case "Home":
            event.preventDefault();
            log.scrollTo({ top: 0, behavior: "smooth" });
            break;

        case "End":
            event.preventDefault();
            log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
            break;

        case "Enter":
            // Shift または Ctrl が押されていたら改行
            if (event.shiftKey || event.ctrlKey) {
                return;
            }
            // Enterのみ送信
            event.preventDefault();
            document.getElementById("chatButton").click();
    }
});

// 初期処理
initializeMainViewFromLocalStorage();
// サーバー確認
checkServerHealth();