// キャラクターカードとプレイヤー設定の共通の処理。
// どちらの画面かは URL の ?kind=player で決める（無ければキャラクター）。違うのは文言と、呼ぶAPI・保存先だけ。
const CARD_KINDS = {
    character: {
        title: "キャラクターカード",
        noun: "キャラクター",
        newId: "new_character",
        newName: "新しいキャラクター",
        listKey: STORAGE_KEYS.CHARACTER_LIST,
        loadPath: API_PATHS.LOAD_CHARACTER_SETTINGS,
        savePath: API_PATHS.SAVE_CHARACTER_SETTING,
        templatePath: API_PATHS.GET_TEMPLATE_CHARACTER_YAML,
        // サーバーとやり取りする項目名（character_id、character_name、character_info）
        field: "character",
    },
    player: {
        title: "プレイヤー設定",
        noun: "プレイヤー",
        newId: "new_player",
        newName: "新しいプレイヤー",
        listKey: STORAGE_KEYS.PLAYER_LIST,
        loadPath: API_PATHS.LOAD_PLAYER_SETTINGS,
        savePath: API_PATHS.SAVE_PLAYER_SETTING,
        templatePath: API_PATHS.GET_TEMPLATE_PLAYER_YAML,
        field: "player",
    },
};

// "character" か "player"。画像の保存先（owner_type）、一覧の取り直し、削除の種類にもそのまま使う
const cardKind = new URLSearchParams(location.search).get("kind") === "player" ? "player" : "character";
const CARD = CARD_KINDS[cardKind];

const settingError = document.getElementById("settingError");
const cardListBody = document.getElementById("cardListBody");
const idInput = document.getElementById("idInput");
const nameInput = document.getElementById("nameInput");
const settingInput = document.getElementById("settingInput");
const tagList = document.getElementById("tagList");

const iconFileInput = document.getElementById("iconFileInput");
const iconImg = document.getElementById("iconImg");
const iconPlaceholder = document.querySelector("#iconPreview .placeholder");
const standingFileInput = document.getElementById("standingFileInput");
const standingImg = document.getElementById("standingImg");
const standingPlaceholder = document.querySelector("#standingPreview .placeholder");

let cardList = [];
let selectedId = null;
let currentTags = [];   // 編集欄で付けているタグ。「登録／更新」で設定YAMLに保存する
let selectedIconFile = null;
let selectedStandingFile = null;

document.title = CARD.title;
document.getElementById("listTitle").textContent = `${CARD.noun}リスト`;
document.getElementById("idLabel").textContent = `${CARD.noun}ID`;
document.getElementById("nameLabel").textContent = `${CARD.noun}名`;
document.getElementById("settingLabel").textContent = `${CARD.noun}設定`;

// ============================================================
// 一覧
// ============================================================

function loadCardList() {
    cardList = getStorageArray(CARD.listKey);
    cardList.sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

// 一覧をフォルダから取り直す。取れなければ、ブラウザに残っている一覧を使う
async function reloadCardList() {
    try {
        await refreshSettingsList(cardKind);
    } catch (error) {
        showToast(error.message || "一覧の取得に失敗しました", MESSAGE_TYPE.ERROR);
    }
    loadCardList();
}

function createUniqueId(baseId) {
    let id = baseId;
    let count = 2;
    while (cardList.some(item => item.id === id)) {
        id = `${baseId}_${count}`;
        count++;
    }
    return id;
}

function getSelectedCard() {
    return cardList.find(item => item.id === selectedId) ?? null;
}

function renderCardList() {
    cardListBody.innerHTML = "";
    for (const item of cardList) {
        const button = document.createElement("button");
        button.className = "card-item";
        button.textContent = item.name || item.id || "名称未設定";
        if (item.id === selectedId) {
            button.classList.add("active");
        }
        button.addEventListener("click", async () => {
            selectedId = item.id;
            renderCardList();
            // まだ保存していない新規は、ファイルが無いので、その場の内容を出す
            if (item.isPending) {
                renderEditor(item);
            } else {
                await renderEditorFromServer(item.id);
            }
        });
        cardListBody.appendChild(button);
    }
}

// ============================================================
// 編集欄
// ============================================================

function clearEditor() {
    idInput.value = "";
    nameInput.value = "";
    settingInput.value = "";
    renderTags([]);
    clearImagePreview(iconImg, iconPlaceholder);
    clearImagePreview(standingImg, standingPlaceholder);
    selectedIconFile = null;
    selectedStandingFile = null;
}

function renderEditor(item) {
    idInput.value = item.id ?? "";
    nameInput.value = item.name ?? "";
    settingInput.value = item.setting ?? "";
    renderTags(item.tags ?? []);
    loadImages(item.id ?? "");
}

// 設定をファイルから読んで、編集欄に出す。タグはファイルに無いので、ブラウザの一覧から出す
async function renderEditorFromServer(id) {
    clearEditor();
    settingError.textContent = "";
    if (!id) return;

    const item = cardList.find(entry => entry.id === id) ?? { id };

    try {
        const data = await postJson(CARD.loadPath, {
            base_chat_path: localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "",
            [`${CARD.field}_id`]: id,
        }, `${CARD.noun}設定の読み込みに失敗しました。`);

        renderEditor({
            id: data[`${CARD.field}_id`] ?? id,
            name: data[`${CARD.field}_name`] ?? "",
            setting: data[`${CARD.field}_info`] ?? "",
            tags: data.tags ?? [],
        });
    } catch (error) {
        renderEditor({ id, name: item.name ?? "", setting: "", tags: item.tags ?? [] });
        settingError.textContent = error.message;
    }
}

// 付けているタグを出す。タグごとの「×」で外せる（保存は「登録／更新」のとき）
function renderTags(tags) {
    currentTags = [...tags];
    tagList.innerHTML = "";
    for (const tag of currentTags) {
        const span = document.createElement("span");
        span.className = "tag-chip";
        span.textContent = tag;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "tag-chip-remove";
        remove.textContent = "×";
        remove.title = `「${tag}」を外す`;
        remove.addEventListener("click", () => renderTags(currentTags.filter(name => name !== tag)));
        span.appendChild(remove);

        tagList.appendChild(span);
    }
}

document.getElementById("addCardButton").addEventListener("click", () => {
    const item = {
        id: createUniqueId(CARD.newId),
        name: CARD.newName,
        tags: [],
        setting: "",
        isPending: true,    // まだ保存していない
    };
    cardList.push(item);
    selectedId = item.id;
    renderCardList();
    renderEditor(item);
});

document.getElementById("saveButton").addEventListener("click", async () => {
    const idError = document.getElementById("idError");
    const nameError = document.getElementById("nameError");
    idError.textContent = "";
    nameError.textContent = "";
    settingError.textContent = "";

    const saveId = idInput.value.trim();
    const saveName = nameInput.value.trim();
    let hasError = false;

    if (!saveId) {
        idError.textContent = "必須です";
        hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(saveId)) {
        idError.textContent = "半角英数字とアンダースコアのみ使用できます";
        hasError = true;
    }

    if (!saveName) {
        nameError.textContent = "必須です";
        hasError = true;
    }

    if (!settingInput.value.trim()) {
        settingError.textContent = "必須です";
        hasError = true;
    }

    if (hasError) return;

    try {
        await saveImageFile("icon", selectedIconFile, saveId);
        await saveImageFile("standing", selectedStandingFile, saveId);
        await postJson(CARD.savePath, {
            base_chat_path: localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "",
            [`${CARD.field}_id`]: saveId,
            [`${CARD.field}_name`]: saveName,
            content: settingInput.value,
            tags: currentTags,
        }, `${CARD.noun}設定の保存に失敗しました。`);
        showToast(`${CARD.noun}を保存しました`, MESSAGE_TYPE.SUCCESS);
    } catch (error) {
        settingError.textContent = error.message || "エラーが発生しました";
        showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
        return;
    }

    // 一覧は保存したファイルから取り直す（まだ保存していなかった新規も、ここで本物になる）
    await reloadCardList();
    selectedId = saveId;
    renderCardList();
    await renderEditorFromServer(saveId);
});

document.getElementById("deleteButton").addEventListener("click", async () => {
    if (!selectedId) return;

    const item = getSelectedCard();

    // まだ保存していない新規は、一覧から外すだけ
    if (item?.isPending) {
        cardList = cardList.filter(entry => entry.id !== selectedId);
    } else {
        // ファイルごと消す。世界で使われていれば、サーバーが断る（世界名を通知に出す）
        const deleted = await deleteSettingWithConfirm(cardKind, selectedId, item?.name);
        if (!deleted) return;
        loadCardList();
    }

    selectedId = null;
    renderCardList();
    clearEditor();
});

document.getElementById("initializeButton").addEventListener("click", async () => {
    try {
        const data = await postJson(CARD.templatePath, {
            base_chat_path: localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "",
        }, "テンプレ取得失敗");
        settingInput.value = data.content;
    } catch (error) {
        showToast(error.message || "サーバー接続エラー", MESSAGE_TYPE.ERROR);
    }
});

// 全削除: 付けているタグを全部外す（保存は「登録／更新」のとき）
document.getElementById("tagClearButton").addEventListener("click", () => renderTags([]));

// ============================================================
// タグ選び
// 「設定」で、タグ管理の一覧（tags/tags.yaml）をチェックボックスで並べ、付けているタグにはチェックを入れておく。
// OK で編集欄のタグにする。タグ管理から消されたタグが付いていれば、そのまま残す
// ============================================================

const tagPickerOverlay = document.getElementById("tagPickerOverlay");
const tagPickerBody = document.getElementById("tagPickerBody");

async function openTagPicker() {
    let masterTags = [];
    try {
        const result = await postJson(API_PATHS.LOAD_TAGS, {
            base_chat_path: localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "",
        }, "タグの読み込みに失敗しました");
        masterTags = Array.isArray(result.tags) ? result.tags : [];
    } catch (error) {
        showToast(error.message || "タグの読み込みに失敗しました", MESSAGE_TYPE.ERROR);
        return;
    }

    tagPickerBody.innerHTML = "";
    for (const name of masterTags) {
        const label = document.createElement("label");
        label.className = "tag-picker-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = name;
        checkbox.checked = currentTags.includes(name);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(name));
        tagPickerBody.appendChild(label);
    }
    if (!masterTags.length) {
        const empty = document.createElement("p");
        empty.className = "tag-picker-empty";
        empty.textContent = "タグがまだありません。メイン画面の「タグ」から登録してください。";
        tagPickerBody.appendChild(empty);
    }

    tagPickerOverlay.dataset.master = JSON.stringify(masterTags);
    tagPickerOverlay.classList.remove("hidden");
}

function closeTagPicker() {
    tagPickerOverlay.classList.add("hidden");
}

function applyTagPicker() {
    const masterTags = JSON.parse(tagPickerOverlay.dataset.master || "[]");
    const checked = [...tagPickerBody.querySelectorAll("input[type=checkbox]:checked")].map(box => box.value);
    // タグ管理に無いタグ（消されたもの）は、付いたまま残す
    const kept = currentTags.filter(tag => !masterTags.includes(tag));
    renderTags([...kept, ...checked]);
    closeTagPicker();
}

document.getElementById("tagSettingButton").addEventListener("click", openTagPicker);
document.getElementById("tagPickerApply").addEventListener("click", applyTagPicker);
document.getElementById("tagPickerCancel").addEventListener("click", closeTagPicker);
document.getElementById("tagPickerCancelTop").addEventListener("click", closeTagPicker);

// ============================================================
// 画像（アイコンと立ち絵）
// ============================================================

function clearImagePreview(img, placeholder) {
    img.removeAttribute("src");
    img.classList.remove("is-visible");
    img.onload = null;
    img.onerror = null;
    placeholder.style.display = "block";
}

function showImagePreview(img, placeholder, src) {
    img.src = src;
    img.classList.add("is-visible");
    placeholder.style.display = "none";
}

function buildImageUrl(imageType, id) {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    if (!baseChatPath || !id) return "";

    // v はキャッシュ対策。保存直後に同じURLを読んでも古い画像が残らないようにする
    return getFlaskBaseUrl() + API_PATHS.LOAD_IMAGE
        + `/${encodeURIComponent(imageType)}/${encodeURIComponent(id)}`
        + `?owner_type=${cardKind}&base_chat_path=${encodeURIComponent(baseChatPath)}&v=${Date.now()}`;
}

// 保存済みの画像を出す。無ければ（読めなければ）初期表示のまま
function applyImageUrl(img, placeholder, imageUrl) {
    clearImagePreview(img, placeholder);
    if (!imageUrl) return;

    img.onload = () => {
        img.classList.add("is-visible");
        placeholder.style.display = "none";
    };
    img.onerror = () => clearImagePreview(img, placeholder);
    img.src = imageUrl;
}

function loadImages(id) {
    selectedIconFile = null;
    selectedStandingFile = null;
    applyImageUrl(iconImg, iconPlaceholder, buildImageUrl("icon", id));
    applyImageUrl(standingImg, standingPlaceholder, buildImageUrl("standing", id));
}

async function saveImageFile(imageType, file, id) {
    if (!file) return;

    const formData = new FormData();
    formData.append("base_chat_path", localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "");
    formData.append("owner_type", cardKind);
    formData.append("owner_id", id);
    formData.append("image_type", imageType);
    formData.append("file", file);

    return requestJson(
        API_PATHS.SAVE_IMAGE,
        { method: "POST", body: formData },
        `${imageType}画像の保存に失敗しました。`
    );
}

document.getElementById("iconSelectButton").addEventListener("click", () => iconFileInput.click());
document.getElementById("standingSelectButton").addEventListener("click", () => standingFileInput.click());

// アイコンは、切り抜きウィンドウで正方形にしてから使う
iconFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    openIconCropper(file);
    event.target.value = "";
});

standingFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    selectedStandingFile = file;
    showImagePreview(standingImg, standingPlaceholder, URL.createObjectURL(file));
    event.target.value = "";
});

// ============================================================
// アイコンの切り抜きウィンドウ
// ============================================================

const iconCropOverlay = document.getElementById("iconCropOverlay");
const iconCropStage = document.getElementById("iconCropStage");
const iconCropImage = document.getElementById("iconCropImage");
const iconCropZoom = document.getElementById("iconCropZoom");

let iconCropSourceFile = null;
let iconCropObjectUrl = "";
const iconCropState = {
    naturalWidth: 0,
    naturalHeight: 0,
    baseScale: 1,
    zoom: 1,
    x: 0,
    y: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    imageStartX: 0,
    imageStartY: 0,
};

// 切り抜き枠（ステージの中央、短い辺の72%の正方形）。person_card.css の .crop-frame と同じ計算
function getCropBoxRect() {
    const stageRect = iconCropStage.getBoundingClientRect();
    const size = Math.min(stageRect.width, stageRect.height) * 0.72;
    return {
        left: (stageRect.width - size) / 2,
        top: (stageRect.height - size) / 2,
        size,
    };
}

function getCurrentIconScale() {
    return iconCropState.baseScale * iconCropState.zoom;
}

// 画像が切り抜き枠からはみ出さない（枠に隙間ができない）位置に収める
function constrainIconCropPosition() {
    const crop = getCropBoxRect();
    const scale = getCurrentIconScale();
    const imageWidth = iconCropState.naturalWidth * scale;
    const imageHeight = iconCropState.naturalHeight * scale;

    if (imageWidth <= crop.size) {
        iconCropState.x = crop.left + (crop.size - imageWidth) / 2;
    } else {
        iconCropState.x = Math.min(crop.left, Math.max(crop.left + crop.size - imageWidth, iconCropState.x));
    }

    if (imageHeight <= crop.size) {
        iconCropState.y = crop.top + (crop.size - imageHeight) / 2;
    } else {
        iconCropState.y = Math.min(crop.top, Math.max(crop.top + crop.size - imageHeight, iconCropState.y));
    }
}

function renderIconCropper() {
    const scale = getCurrentIconScale();
    iconCropImage.style.width = `${iconCropState.naturalWidth * scale}px`;
    iconCropImage.style.height = `${iconCropState.naturalHeight * scale}px`;
    iconCropImage.style.transform = `translate(${iconCropState.x}px, ${iconCropState.y}px)`;
}

function initializeIconCropPosition() {
    const stageRect = iconCropStage.getBoundingClientRect();
    const crop = getCropBoxRect();

    // 正方形の切り抜き枠を画像で必ず覆うため、containではなくcover寄りの初期倍率にする。
    iconCropState.baseScale = Math.max(
        crop.size / iconCropState.naturalWidth,
        crop.size / iconCropState.naturalHeight
    );
    iconCropState.zoom = 1;
    iconCropZoom.value = "1";

    const scale = getCurrentIconScale();
    iconCropState.x = (stageRect.width - iconCropState.naturalWidth * scale) / 2;
    iconCropState.y = (stageRect.height - iconCropState.naturalHeight * scale) / 2;

    constrainIconCropPosition();
    renderIconCropper();
}

function openIconCropper(file) {
    closeIconCropper();

    iconCropSourceFile = file;
    iconCropObjectUrl = URL.createObjectURL(file);
    iconCropImage.src = iconCropObjectUrl;
    iconCropOverlay.classList.remove("hidden");

    iconCropImage.onload = () => {
        iconCropState.naturalWidth = iconCropImage.naturalWidth;
        iconCropState.naturalHeight = iconCropImage.naturalHeight;
        initializeIconCropPosition();
    };
}

function closeIconCropper() {
    iconCropOverlay.classList.add("hidden");

    if (iconCropObjectUrl) {
        URL.revokeObjectURL(iconCropObjectUrl);
        iconCropObjectUrl = "";
    }

    iconCropImage.removeAttribute("src");
    iconCropSourceFile = null;
}

// 拡大しても、切り抜き枠の中心に見えている所が動かないようにする
iconCropZoom.addEventListener("input", () => {
    const oldScale = getCurrentIconScale();
    const crop = getCropBoxRect();
    const centerX = crop.left + crop.size / 2;
    const centerY = crop.top + crop.size / 2;
    const imagePointX = (centerX - iconCropState.x) / oldScale;
    const imagePointY = (centerY - iconCropState.y) / oldScale;

    iconCropState.zoom = Number(iconCropZoom.value);

    const newScale = getCurrentIconScale();
    iconCropState.x = centerX - imagePointX * newScale;
    iconCropState.y = centerY - imagePointY * newScale;

    constrainIconCropPosition();
    renderIconCropper();
});

iconCropStage.addEventListener("pointerdown", (event) => {
    iconCropState.dragging = true;
    iconCropState.dragStartX = event.clientX;
    iconCropState.dragStartY = event.clientY;
    iconCropState.imageStartX = iconCropState.x;
    iconCropState.imageStartY = iconCropState.y;
    iconCropStage.setPointerCapture(event.pointerId);
});

iconCropStage.addEventListener("pointermove", (event) => {
    if (!iconCropState.dragging) return;

    iconCropState.x = iconCropState.imageStartX + (event.clientX - iconCropState.dragStartX);
    iconCropState.y = iconCropState.imageStartY + (event.clientY - iconCropState.dragStartY);

    constrainIconCropPosition();
    renderIconCropper();
});

iconCropStage.addEventListener("pointerup", (event) => {
    iconCropState.dragging = false;
    iconCropStage.releasePointerCapture(event.pointerId);
});

iconCropStage.addEventListener("pointercancel", () => {
    iconCropState.dragging = false;
});

// 切り抜き枠の中を、512x512 の PNG にする
function createCroppedIconBlob() {
    return new Promise((resolve, reject) => {
        const crop = getCropBoxRect();
        const scale = getCurrentIconScale();

        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;

        canvas.getContext("2d").drawImage(
            iconCropImage,
            (crop.left - iconCropState.x) / scale,
            (crop.top - iconCropState.y) / scale,
            crop.size / scale,
            crop.size / scale,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("アイコン画像の切り抜きに失敗しました。"));
                return;
            }
            resolve(blob);
        }, "image/png");
    });
}

document.getElementById("iconCropApply").addEventListener("click", async () => {
    if (!iconCropSourceFile) return;

    try {
        const blob = await createCroppedIconBlob();
        selectedIconFile = new File(
            [blob],
            `${iconCropSourceFile.name.replace(/\.[^.]+$/, "")}_icon.png`,
            { type: "image/png" }
        );
        showImagePreview(iconImg, iconPlaceholder, URL.createObjectURL(blob));
        closeIconCropper();
    } catch (error) {
        showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
    }
});

document.getElementById("iconCropCancel").addEventListener("click", closeIconCropper);
document.getElementById("iconCropCancelTop").addEventListener("click", closeIconCropper);

// ============================================================
// 画面を開いたとき
// ============================================================

loadCardList();
clearEditor();
renderCardList();

// 一覧はフォルダの中身から作る
reloadCardList().then(renderCardList);
