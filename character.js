const settingError = document.getElementById("settingError");
let charList = [];
let selectedId = null;

const characterListBody = document.getElementById("characterListBody");
const characterIdInput = document.getElementById("characterIdInput");
const characterNameInput = document.getElementById("characterNameInput");
const characterSettingInput = document.getElementById("characterSettingInput");
const tagList = document.getElementById("tagList");

let selectedIconFile = null;
let selectedStandingFile = null;

function loadCharList() {
    try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHARACTER_LIST);
    const parsed = raw ? JSON.parse(raw) : [];
    charList = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
    charList = [];
    }
    charList.sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

function saveCharList() {
    localStorage.setItem(STORAGE_KEYS.CHARACTER_LIST, JSON.stringify(charList));
}

function createNewCharacter() {
    return {
    id: "new_character",
    name: "新しいキャラクター",
    tags: [],
    setting: "",
    isPending: true,    // まだ保存していない
    };
}

function createUniqueId(baseId) {
    let id = baseId;
    let count = 2;
    while (charList.some(char => char.id === id)) {
    id = `${baseId}_${count}`;
    count++;
    }
    return id;
}

function getSelectedCharacter() {
    return charList.find(char => char.id === selectedId) ?? null;
}

function renderCharacterList() {
    characterListBody.innerHTML = "";
    for (const char of charList) {
    const button = document.createElement("button");
    button.className = "character-item";
    button.textContent = char.name || char.id || "名称未設定";
    if (char.id === selectedId) {
        button.classList.add("active");
    }
    button.addEventListener("click", async () => {
        selectedId = char.id;
        renderCharacterList();
        await renderEditorFromServer(char.id);
    });
    characterListBody.appendChild(button);
    }
}

function clearEditor() {
    characterIdInput.value = "";
    characterNameInput.value = "";
    characterSettingInput.value = "";
    tagList.innerHTML = "";
    clearImagePreview(iconImg, iconPlaceholder);
    clearImagePreview(standingImg, standingPlaceholder);
    selectedIconFile = null;
    selectedStandingFile = null;
}

function renderEditor(char) {
    characterIdInput.value = char.id ?? "";
    characterNameInput.value = char.name ?? "";
    characterSettingInput.value = char.setting ?? "";
    renderTags(char.tags ?? []);
    loadCharacterImages(char.id ?? "");
}

async function loadCharacterSettings(characterId) {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    const data = await postJson(API_PATHS.LOAD_CHARACTER_SETTINGS, {
        base_chat_path: baseChatPath,
        character_id: characterId,
    }, "キャラクター設定の読み込みに失敗しました。");
    return data;
}

// 一覧をフォルダから取り直す。取れなければ、ブラウザに残っている一覧を使う
async function reloadCharList() {
    try {
        await refreshSettingsList("character");
    } catch (error) {
        showToast(error.message || "一覧の取得に失敗しました", MESSAGE_TYPE.ERROR);
    }
    loadCharList();
}

async function renderEditorFromServer(characterId) {
    clearEditor();
    settingError.textContent = "";

    if (!characterId) return;

    try {
    const data = await loadCharacterSettings(characterId);
    console.log("取得結果", data);

    characterIdInput.value      = data.character_id ?? data.id ?? characterId;
    characterNameInput.value    = data.character_name ?? data.name ?? "";
    characterSettingInput.value = data.character_info ?? data.setting ?? "";
    renderTags(data.tags ?? []);

    loadCharacterImages(characterId);
    } catch (error) {
    settingError.textContent = error.message;
    characterIdInput.value = characterId;
    loadCharacterImages(characterId);
    }
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

document.getElementById("addCharacterButton").addEventListener("click", () => {
    const newChar = createNewCharacter();
    newChar.id = createUniqueId(newChar.id);
    charList.push(newChar);
    selectedId = newChar.id;
    renderCharacterList();
    renderEditor(newChar);
});

document.getElementById("saveButton").addEventListener("click", async () => {
    const idError = document.getElementById("idError");
    const nameError = document.getElementById("nameError");

    idError.textContent = "";
    nameError.textContent = "";
    settingError.textContent = "";

    let hasError = false;

    if (!characterIdInput.value.trim()) {
    idError.textContent = "必須です";
    hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(characterIdInput.value)) {
    idError.textContent = "半角英数字とアンダースコアのみ使用できます";
    hasError = true;
    }

    if (!characterNameInput.value.trim()) {
    nameError.textContent = "必須です";
    hasError = true;
    }

    if (!characterSettingInput.value.trim()) {
    settingError.textContent = "必須です";
    hasError = true;
    }

    if (hasError) return;

    let char = getSelectedCharacter();
    if (!char) {
    char = createNewCharacter();
    char.id = createUniqueId(char.id);
    charList.push(char);
    }

    const oldId = char.id;
    char.id = characterIdInput.value.trim() || oldId || "new_character";
    char.name = characterNameInput.value.trim() || "新しいキャラクター";
    char.setting = characterSettingInput.value;
    selectedId = char.id;

    const saveId = characterIdInput.value.trim() || char.id || "new_character";
    const saveName = characterNameInput.value.trim() || "新しいキャラクター";
    const saveSetting = characterSettingInput.value;

    try {
        await saveImageFile("icon", selectedIconFile, saveId);
        await saveImageFile("standing", selectedStandingFile, saveId);
        await saveCharacterSettingFile(saveId, saveName, characterSettingInput.value);
        showToast("キャラクターを保存しました", "success");
    } catch (error) {
        showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
        return;
    }

    char.id = saveId;
    char.name = saveName;
    char.setting = saveSetting;
    selectedId = char.id;

    await reloadCharList();
    selectedId = saveId;
    renderCharacterList();
    await renderEditorFromServer(selectedId);
});

document.getElementById("deleteButton").addEventListener("click", async () => {
    if (!selectedId) return;

    const char = getSelectedCharacter();

    // まだ保存していない新規は、一覧から外すだけ
    if (char?.isPending) {
        charList = charList.filter(c => c.id !== selectedId);
    } else {
        // ファイルごと消す。世界で使われていれば、サーバーが断る（世界名を通知に出す）
        const deleted = await deleteSettingWithConfirm("character", selectedId, char?.name);
        if (!deleted) return;
        loadCharList();
    }

    selectedId = null;
    renderCharacterList();
    clearEditor();
});

document.getElementById("initializeButton").addEventListener("click", async () => {
    try {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    const data = await postJson(API_PATHS.GET_TEMPLATE_CHARACTER_YAML, {
        base_chat_path: baseChatPath,
    }, "テンプレ取得失敗");

    characterSettingInput.value = data.content;
    } catch (e) {
        showToast(e.message || "サーバー接続エラー", MESSAGE_TYPE.ERROR);
    }
});

document.getElementById("tagClearButton").addEventListener("click", () => {
    const char = getSelectedCharacter();
    if (!char) return;
    char.tags = [];
    saveCharList();
    renderTags([]);
});

const iconInput = document.getElementById('iconFileInput');
const iconImg = document.getElementById('iconImg');
const iconPlaceholder = document.querySelector('#iconPreview .placeholder');
const standingInput = document.getElementById('standingFileInput');
const standingImg = document.getElementById('standingImg');
const standingPlaceholder = document.querySelector('#standingPreview .placeholder');

function clearImagePreview(img, placeholder) {
    if (img) {
    img.removeAttribute("src");
    img.classList.remove("is-visible");
    img.onload = null;
    img.onerror = null;
    }
    if (placeholder) placeholder.style.display = "block";
}

function buildImageUrl(imageType, characterId) {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    if (!baseChatPath || !characterId) return "";

    const encodedType = encodeURIComponent(imageType);
    const encodedId = encodeURIComponent(characterId);
    const encodedBasePath = encodeURIComponent(baseChatPath);

    // キャッシュ対策。保存直後に同じURLを読んでも古い画像が残らないようにする。
    const cacheBuster = Date.now();

    console.log("encodedType",encodedType);
    console.log("encodedId",encodedId);
    console.log("encodedBasePath",encodedBasePath);
    console.log("cacheBuster",cacheBuster);

    return getFlaskBaseUrl() + API_PATHS.LOAD_IMAGE + `/${encodedType}/${encodedId}?base_chat_path=${encodedBasePath}&v=${cacheBuster}`;
}

function applyImageUrl(img, placeholder, imageUrl) {
    clearImagePreview(img, placeholder);

    if (!imageUrl) return;

    img.onload = () => {
    img.classList.add("is-visible");
    if (placeholder) placeholder.style.display = "none";
    };

    img.onerror = () => {
    clearImagePreview(img, placeholder);
    };

    img.src = imageUrl;
}

function loadCharacterImages(characterId) {
    selectedIconFile = null;
    selectedStandingFile = null;

    applyImageUrl(
    iconImg,
    iconPlaceholder,
    buildImageUrl("icon", characterId)
    );

    applyImageUrl(
    standingImg,
    standingPlaceholder,
    buildImageUrl("standing", characterId)
    );
}

iconInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    openIconCropper(file);
    e.target.value = '';
});

const iconCropOverlay = document.getElementById("iconCropOverlay");
const iconCropStage = document.getElementById("iconCropStage");
const iconCropImage = document.getElementById("iconCropImage");
const iconCropZoom = document.getElementById("iconCropZoom");
const iconCropApply = document.getElementById("iconCropApply");
const iconCropCancel = document.getElementById("iconCropCancel");
const iconCropCancelTop = document.getElementById("iconCropCancelTop");

let iconCropSourceFile = null;
let iconCropObjectUrl = "";
let iconCropState = {
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
    imageStartY: 0
};

function getCropBoxRect() {
    const stageRect = iconCropStage.getBoundingClientRect();
    const size = Math.min(stageRect.width, stageRect.height) * 0.72;
    return {
    left: (stageRect.width - size) / 2,
    top: (stageRect.height - size) / 2,
    size
    };
}

function getCurrentIconScale() {
    return iconCropState.baseScale * iconCropState.zoom;
}

function constrainIconCropPosition() {
    const crop = getCropBoxRect();
    const scale = getCurrentIconScale();
    const imageWidth = iconCropState.naturalWidth * scale;
    const imageHeight = iconCropState.naturalHeight * scale;

    const minX = crop.left + crop.size - imageWidth;
    const maxX = crop.left;
    const minY = crop.top + crop.size - imageHeight;
    const maxY = crop.top;

    if (imageWidth <= crop.size) {
    iconCropState.x = crop.left + (crop.size - imageWidth) / 2;
    } else {
    iconCropState.x = Math.min(maxX, Math.max(minX, iconCropState.x));
    }

    if (imageHeight <= crop.size) {
    iconCropState.y = crop.top + (crop.size - imageHeight) / 2;
    } else {
    iconCropState.y = Math.min(maxY, Math.max(minY, iconCropState.y));
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
    const imageWidth = iconCropState.naturalWidth * scale;
    const imageHeight = iconCropState.naturalHeight * scale;

    iconCropState.x = (stageRect.width - imageWidth) / 2;
    iconCropState.y = (stageRect.height - imageHeight) / 2;

    constrainIconCropPosition();
    renderIconCropper();
}

function openIconCropper(file) {
    closeIconCropper(false);

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

function closeIconCropper(clearSource = true) {
    iconCropOverlay.classList.add("hidden");

    if (iconCropObjectUrl) {
    URL.revokeObjectURL(iconCropObjectUrl);
    iconCropObjectUrl = "";
    }

    iconCropImage.removeAttribute("src");

    if (clearSource) {
    iconCropSourceFile = null;
    }
}

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

function createCroppedIconBlob() {
    return new Promise((resolve, reject) => {
    const crop = getCropBoxRect();
    const scale = getCurrentIconScale();

    const sx = (crop.left - iconCropState.x) / scale;
    const sy = (crop.top - iconCropState.y) / scale;
    const sw = crop.size / scale;
    const sh = crop.size / scale;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
        iconCropImage,
        sx,
        sy,
        sw,
        sh,
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

iconCropApply.addEventListener("click", async () => {
    if (!iconCropSourceFile) return;

    try {
    const blob = await createCroppedIconBlob();
    const croppedFile = new File(
        [blob],
        `${iconCropSourceFile.name.replace(/\.[^.]+$/, "")}_icon.png`,
        { type: "image/png" }
    );

    selectedIconFile = croppedFile;

    const previewUrl = URL.createObjectURL(blob);
    iconImg.src = previewUrl;
    iconImg.classList.add("is-visible");
    iconPlaceholder.style.display = "none";

    closeIconCropper(false);
    iconCropSourceFile = null;
    } catch (error) {
    showToast(error.message || "エラー発生", MESSAGE_TYPE.ERROR);
    }
});

iconCropCancel.addEventListener("click", () => closeIconCropper(true));
iconCropCancelTop.addEventListener("click", () => closeIconCropper(true));

standingInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedStandingFile = file;
    standingImg.src = URL.createObjectURL(file);
    standingImg.classList.add("is-visible");
    standingPlaceholder.style.display = "none";
    e.target.value = '';
});

async function saveImageFile(imageType, file, characterId) {
    if (!file) return;

    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    const formData = new FormData();
    formData.append("base_chat_path", baseChatPath);
    formData.append("owner_type", "character");
    formData.append("owner_id", characterId);
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

async function saveCharacterSettingFile(characterId, characterName, settingText) {
    const baseChatPath = localStorage.getItem(STORAGE_KEYS.BASE_CHAT_PATH) || "";
    try {
        return await postJson(API_PATHS.SAVE_CHARACTER_SETTING, {
            base_chat_path: baseChatPath,
            character_id: characterId,
            character_name: characterName,
            content: settingText,
        }, "キャラクター設定の保存に失敗しました。");
    } catch (error) {
        settingError.textContent = error.response?.message || "エラーが発生しました";
        throw error;
    }
}

// 画面表示時呼ばれる
loadCharList();
selectedId = null;
clearEditor();
renderCharacterList();

// 一覧はフォルダの中身から作る
reloadCharList().then(renderCharacterList);