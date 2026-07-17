const state = {
  data: null,
  effectBindings: { cape: {}, headgear: {} },
  itemFlags: { cape: {}, headgear: {} },
  itemMeta: { cape: {}, headgear: {} },
  layerPriority: {
    defaults: { mid: 100, top: 200, bottom: 300, robe: 400 },
    items: {},
  },
  previewBackgrounds: [{ id: "transparent", name: "透明", type: "checkerboard" }],
  images: new Map(),
  loadingImages: new Map(),
  loadingPartShards: new Map(),
  effectImages: new Map(),
  loadingEffectImages: new Map(),
  failedEffectImages: new Set(),
  race: "human",
  sex: "female",
  job: "novice",
  mount: "none",
  riding: false,
  secondCostume: false,
  hairstyle: "1",
  bodyColor: "0",
  hairColor: "0",
  action: "0",
  status: "stand",
  direction: 0,
  faceDirection: "center",
  headgearSlots: ["none", "none", "none"],
  cape: "none",
  frame: 0,
  playing: false,
  lastTick: 0,
  wearableFrame: 0,
  lastWearableTick: 0,
  renderFitScale: null,
  renderFitBounds: null,
  frameMs: 150,
  displaySize: "normal",
  zoom: 1,
  previewBackground: "transparent",
  backgroundColor: "#ffffff",
  customBackgroundData: "",
  backgroundOffsetX: 0,
  backgroundOffsetY: 0,
  showShadow: true,
  pngSize: 256,
  pngBackground: "current",
  pngIncludeInfo: false,
  gifDuration: 2400,
  gifBackground: "current",
  language: "zh",
  browserKind: "headgear",
  equipmentFilter: "all",
};

const DISPLAY_CANVAS_SIZE = 256;
const EFFECT_CENTER_TO_ACTOR_ANCHOR_Y = Math.round(40 * (384 / 260));
const canvas = document.getElementById("paperCanvas");
const ctx = canvas.getContext("2d");
const effectLayerBehind = document.getElementById("effectLayerBehind");
const effectLayerFront = document.getElementById("effectLayerFront");
const effectRuntime = window.NoriEffectRuntime
  ? new window.NoriEffectRuntime(effectLayerBehind, effectLayerFront)
  : null;
const renderCanvas = document.createElement("canvas");
const renderCtx = renderCanvas.getContext("2d", { willReadFrequently: true });
let activeCtx = ctx;
const statusText = document.getElementById("statusText");
const jobSelect = document.getElementById("jobSelect");
const mountSelect = document.getElementById("mountSelect");
const mountButtons = document.getElementById("mountButtons");
const hairSelect = document.getElementById("hairSelect");
const bodyColorSelect = document.getElementById("bodyColorSelect");
const hairColorSelect = document.getElementById("hairColorSelect");
const actionSelect = document.getElementById("actionSelect");
const previewWrap = document.getElementById("previewWrap");
const paperdollShadow = document.getElementById("paperdollShadow");
const shadowToggle = document.getElementById("shadowToggle");
const backgroundSelect = document.getElementById("backgroundSelect");
const backgroundColor = document.getElementById("backgroundColor");
const backgroundFile = document.getElementById("backgroundFile");
const backgroundFileButton = document.getElementById("backgroundFileButton");
const backgroundResetButton = document.getElementById("backgroundResetButton");
const zoomOutButton = document.getElementById("zoomOutButton");
const zoomInButton = document.getElementById("zoomInButton");
const zoomReadout = document.getElementById("zoomReadout");
const closetName = document.getElementById("closetName");
const saveClosetButton = document.getElementById("saveClosetButton");
const closetList = document.getElementById("closetList");
const exportClosetButton = document.getElementById("exportClosetButton");
const importClosetFile = document.getElementById("importClosetFile");
const pngDialog = document.getElementById("pngDialog");
const pngIncludeInfo = document.getElementById("pngIncludeInfo");
const cancelPngButton = document.getElementById("cancelPngButton");
const confirmPngButton = document.getElementById("confirmPngButton");
const gifDialog = document.getElementById("gifDialog");
const cancelGifButton = document.getElementById("cancelGifButton");
const confirmGifButton = document.getElementById("confirmGifButton");
const headgearSelect = document.getElementById("headgearSelect");
const capeSelect = document.getElementById("capeSelect");
const headgearFilter = document.getElementById("headgearFilter");
const capeFilter = document.getElementById("capeFilter");
const frameSlider = document.getElementById("frameSlider");
const playButton = document.getElementById("playButton");
const playButtonInline = document.getElementById("playButtonInline");
const fitButton = document.getElementById("fitButton");
const shareButton = document.getElementById("shareButton");
const saveImageButton = document.getElementById("saveImageButton");
const saveGifButton = document.getElementById("saveGifButton");
const clearButton = document.getElementById("clearButton");
const stackReadout = document.getElementById("stackReadout");
const anchorReadout = document.getElementById("anchorReadout");
const frameReadout = document.getElementById("frameReadout");
const itemSearch = document.getElementById("itemSearch");
const itemResults = document.getElementById("itemResults");
const itemBrowserCount = document.getElementById("itemBrowserCount");
const itemBrowserDialog = document.getElementById("itemBrowserDialog");
const itemBrowserContent = document.getElementById("itemBrowserContent");
const itemBrowserDetail = document.getElementById("itemBrowserDetail");
const openItemBrowserButton = document.getElementById("openItemBrowserButton");
const closeItemBrowserButton = document.getElementById("closeItemBrowserButton");
const finishItemBrowserButton = document.getElementById("finishItemBrowserButton");
const clearItemBrowserSlotButton = document.getElementById("clearItemBrowserSlotButton");
const quickFavoritePanel = document.getElementById("quickFavoritePanel");
const quickFavoriteTitle = document.getElementById("quickFavoriteTitle");
const quickFavoriteList = document.getElementById("quickFavoriteList");
const addQuickFavoriteButton = document.getElementById("addQuickFavoriteButton");
const closeQuickFavoriteButton = document.getElementById("closeQuickFavoriteButton");
const quickFavoriteButtons = [...document.querySelectorAll("[data-favorite-slot]")];
const itemBrowserSlotButtons = [...document.querySelectorAll("[data-browser-slot]")];
const itemBrowserFilterButtons = [...document.querySelectorAll("[data-browser-filter]")];
const equipmentQuickFilterButtons = [...document.querySelectorAll("[data-equipment-filter]")];
const headgearSelects = [
  document.getElementById("headgearSelect1") || headgearSelect,
  document.getElementById("headgearSelect2"),
  document.getElementById("headgearSelect3"),
].filter(Boolean);

const actionLabels = new Map([
  ["0", "A0 ↓"],
  ["1", "A1 ↙"],
  ["2", "A2 ←"],
  ["3", "A3 ↖"],
  ["4", "A4 ↑"],
  ["5", "A5 ↗"],
  ["6", "A6 →"],
  ["7", "A7 ↘"],
  ["16", "A16 坐"],
]);

const sexLabels = new Map([
  ["female", "女性"],
  ["male", "男性"],
]);

const languageOptions = {
  zh: {
    htmlLang: "zh-Hant",
    nav: {
      top: "TOP (首頁)",
      npc: "NPCs & Mobs (NPC/魔物)",
      headgear: "Headgear (頭飾)",
      capes: "Capes (披風)",
      hateffects: "Hateffects (特效)",
      paperdoll: "Paperdoll V2 (紙娃娃 V2)",
      tools: "Nori-Tools",
      about: "About (關於)",
    },
    label: {
      title: "紙娃娃 V2 (Paperdoll V2)",
      statusLoading: "載入資料中... (Loading...)",
      language: "語言 (Language)",
      background: "背景 (Background)",
      gender: "性別 (Gender)",
      job: "職業外觀 (Job Look)",
      other: "其他 (Other)",
      bodyColor: "服染 (Body Color)",
      hairStyle: "髮型 (Hairstyle)",
      hairColor: "髮色 (Hair Color)",
      costume: "服飾 (Costume)",
      cape: "肩飾 (Garment)",
      closet: "服飾庫 (Closet)",
      status: "狀態 (Pose)",
      bodyDirection: "身體方向 (Body Direction)",
      faceDirection: "臉方向 (Face Direction)",
      animation: "動畫 (Animation)",
      displaySize: "顯示大小 (Size)",
    },
    button: {
      female: "女性",
      male: "男性",
      riding: "騎乘 (Mount)",
      secondCostume: "第二服裝 (Second Costume)",
      headgear: "服飾",
      cape: "肩飾",
      stand: "立",
      sit: "坐",
      walk: "走",
      pick: "拾",
      wait: "待",
      dead: "倒",
      faceLeft: "左",
      faceCenter: "中央",
      faceRight: "右",
      compact: "縮小",
      normal: "標準",
      large: "放大",
      auto: "自動",
      stop: "停止",
      share: "連結 (Link)",
      save: "儲存 (Save)",
      clear: "清除 (Clear)",
      shareDone: "已複製",
      shareUpdatedDone: "已更新",
      clearDone: "已清除",
    },
    text: {
      none: "無",
      standard: "標準",
      filter: "篩選 ID 或名稱 (Filter ID/name)",
      itemSearch: "搜尋 ID / 名稱 / const (Search)",
      shareCopied: "分享連結已複製 (Link copied)",
      shareUpdated: "分享連結已更新到網址列 (URL updated)",
      pngSaved: "PNG 已儲存，包含背景與目前特效畫面 (PNG saved with background and effects)",
      gifSaved: "GIF 動畫已儲存 (GIF saved)",
      gifSaving: "正在製作 GIF... (Creating GIF...)",
      cleared: "穿戴已清空 (Outfit cleared)",
      noResults: "沒有符合的項目 (No matching items)",
      motion: "動態 (Motion)",
      effect: "特效 (Effect)",
      moreResults: (count) => `還有 ${count} 筆，請輸入更多關鍵字`,
      costumeNone: (index) => `服飾 ${index}：無 (Costume ${index}: None)`,
      faceDisabled: "只有立 / 坐可調整臉方向 (Stand/Sit only)",
      modeUnavailable: "目前職業沒有這個外觀 (Unavailable)",
      play: "播放動畫 (Play)",
      pause: "暫停動畫 (Pause)",
      fit: "重新置中 (Recenter)",
      shareTitle: "複製分享連結 (Copy link)",
      saveTitle: "儲存 PNG (Save PNG)",
      gifTitle: "儲存 GIF 動畫 (Save GIF)",
      clearTitle: "清空穿戴 (Clear outfit)",
    },
  },
  en: {
    htmlLang: "en",
    nav: {
      top: "TOP (首頁)",
      npc: "NPCs & Mobs (NPC/魔物)",
      headgear: "Headgear (頭飾)",
      capes: "Capes (披風)",
      hateffects: "Hateffects (特效)",
      paperdoll: "Paperdoll V2 (紙娃娃 V2)",
      tools: "Nori-Tools",
      about: "About (關於)",
    },
    label: {
      title: "Paperdoll V2 (紙娃娃 V2)",
      statusLoading: "Loading data... (載入資料中)",
      language: "Language (語言)",
      background: "Background (背景)",
      gender: "Gender (性別)",
      job: "Job Look (職業外觀)",
      other: "Other (其他)",
      bodyColor: "Body Color (服染)",
      hairStyle: "Hairstyle (髮型)",
      hairColor: "Hair Color (髮色)",
      costume: "Costume (服飾)",
      cape: "Garment (肩飾)",
      closet: "Closet (服飾庫)",
      status: "Pose (狀態)",
      bodyDirection: "Body Direction (身體方向)",
      faceDirection: "Face Direction (臉方向)",
      animation: "Animation (動畫)",
      displaySize: "Size (顯示大小)",
    },
    button: {
      female: "Female",
      male: "Male",
      riding: "Mount",
      secondCostume: "Second Costume",
      headgear: "Costume",
      cape: "Garment",
      stand: "Stand",
      sit: "Sit",
      walk: "Walk",
      pick: "Pick",
      wait: "Ready",
      dead: "Dead",
      faceLeft: "Left",
      faceCenter: "Center",
      faceRight: "Right",
      compact: "Small",
      normal: "Normal",
      large: "Large",
      auto: "Auto",
      stop: "Stop",
      share: "URL",
      save: "PNG",
      clear: "Clear",
      shareDone: "Copied",
      shareUpdatedDone: "Updated",
      clearDone: "Cleared",
    },
    text: {
      none: "None",
      standard: "Standard",
      filter: "Filter ID or name",
      itemSearch: "Search ID / name / const",
      shareCopied: "Share link copied",
      shareUpdated: "Share link updated in URL",
      pngSaved: "PNG saved with background and current effects (已包含背景與目前特效畫面)",
      gifSaved: "GIF saved (動畫已儲存)",
      gifSaving: "Creating GIF... (正在製作)",
      cleared: "Outfit cleared",
      noResults: "No matching items",
      motion: "Motion",
      effect: "Effect",
      moreResults: (count) => `${count} more results. Type more keywords.`,
      costumeNone: (index) => `Costume ${index}: None`,
      faceDisabled: "Face direction only works while standing / sitting",
      modeUnavailable: "This job does not support this look",
      play: "Play animation",
      pause: "Pause animation",
      fit: "Recenter",
      shareTitle: "Copy share link",
      saveTitle: "Save PNG",
      gifTitle: "Save GIF animation",
      clearTitle: "Clear outfit",
    },
  },
  "pt-BR": {
    htmlLang: "pt-BR",
    nav: {
      top: "TOP (首頁)",
      npc: "NPCs & Mobs (NPC/魔物)",
      headgear: "Headgear (頭飾)",
      capes: "Capes (披風)",
      hateffects: "Hateffects (特效)",
      paperdoll: "Paperdoll V2 (紙娃娃 V2)",
      tools: "Nori-Tools",
      about: "About (關於)",
    },
    label: {
      title: "Paperdoll V2 (紙娃娃 V2)",
      statusLoading: "Carregando dados... (載入資料中)",
      language: "Idioma (語言)",
      background: "Fundo (背景)",
      gender: "Gênero (性別)",
      job: "Visual da classe (職業外觀)",
      other: "Outros (其他)",
      bodyColor: "Cor da roupa (服染)",
      hairStyle: "Cabelo (髮型)",
      hairColor: "Cor do cabelo (髮色)",
      costume: "Costume (服飾)",
      cape: "Capa (肩飾)",
      closet: "Armário (服飾庫)",
      status: "Pose (狀態)",
      bodyDirection: "Direção do corpo (身體方向)",
      faceDirection: "Direção do rosto (臉方向)",
      animation: "Animação (動畫)",
      displaySize: "Tamanho (顯示大小)",
    },
    button: {
      female: "Fem.",
      male: "Masc.",
      riding: "Montaria",
      secondCostume: "Segundo traje",
      headgear: "Costume",
      cape: "Capa",
      stand: "Parar",
      sit: "Sentar",
      walk: "Andar",
      pick: "Pegar",
      wait: "Pronto",
      dead: "Morto",
      faceLeft: "Esq.",
      faceCenter: "Centro",
      faceRight: "Dir.",
      compact: "Peq.",
      normal: "Normal",
      large: "Grande",
      auto: "Auto",
      stop: "Parar",
      share: "URL",
      save: "PNG",
      clear: "Limpar",
      shareDone: "Copiado",
      shareUpdatedDone: "Atualizado",
      clearDone: "Limpo",
    },
    text: {
      none: "Nenhum",
      standard: "Padrão",
      filter: "Filtrar ID ou nome",
      itemSearch: "Buscar ID / nome / const",
      shareCopied: "Link copiado",
      shareUpdated: "Link atualizado na URL",
      pngSaved: "PNG salvo com fundo e efeitos atuais",
      gifSaved: "GIF salvo (動畫已儲存)",
      gifSaving: "Criando GIF... (正在製作)",
      cleared: "Visual limpo",
      noResults: "Nenhum item encontrado",
      motion: "Motion",
      effect: "Efeito",
      moreResults: (count) => `Mais ${count} resultados. Digite mais palavras-chave.`,
      costumeNone: (index) => `Costume ${index}: Nenhum`,
      faceDisabled: "Direção do rosto só funciona em pé / sentado",
      modeUnavailable: "Esta classe não suporta este visual",
      play: "Reproduzir animação",
      pause: "Pausar animação",
      fit: "Recentralizar",
      shareTitle: "Copiar link",
      saveTitle: "Salvar PNG",
      gifTitle: "Salvar animação GIF",
      clearTitle: "Limpar visual",
    },
  },
};

const appVersion = "20260718-paperdoll-v2-favorite-cycling-1";
const storageKey = "nori.paperdoll.state.v2";
const closetStorageKey = "nori.paperdoll.closet.v2";
const customBackgroundStorageKey = "nori.paperdoll.custom-background.v2";
const exportStorageKey = "nori.paperdoll.export.v2";
const scriptUrl = document.currentScript?.src || new URL("app.js", window.location.href).href;
const appBaseUrl = new URL(".", scriptUrl);
const hiddenJobLabelTokens = ["魔導機甲", "融合"];
const jobModeFeatures = {
  riding: true,
  secondCostume: true,
};
const directionIds = [0, 1, 2, 3, 4, 5, 6, 7];
const selectSearchLimit = 260;
const filterDebounceMs = 140;
const renderPadding = 160;
let equipmentFilterTimer = 0;
let itemBrowserSlot = "0";
let itemBrowserFilter = "all";
let itemThumbnailObserver = null;
let itemBrowserLoadObserver = null;
let itemBrowserMatches = [];
let itemBrowserRenderedCount = 0;
let itemBrowserDetailItem = null;
const itemBrowserBatchSize = 72;
const itemBrowserFavoritesKey = "nori.paperdoll.item-browser.favorites.v1";
let itemBrowserFavorites = loadItemBrowserFavorites();
const quickFavoritesStorageKey = "nori.paperdoll.quick-favorites.v2";
let quickFavoriteSlot = "headgear-0";
let quickFavorites = loadQuickFavorites();
let browserFilterTimer = 0;
let backgroundDrag = null;
const toolbarFeedbackTimers = new WeakMap();
const raceSelectionMemory = new Map();
const forceRgbaFlipYAllActionItemIds = new Set([
  668, 958, 961, 975, 976, 1005, 1038, 1039, 1040,
  1132, 1133, 1145, 1146, 1147, 1148, 1248, 1326,
  2264, 2370, 2429, 2430, 2431, 2432, 2479, 2481,
  2482, 2485, 2501, 2518, 2803, 2810,
]);
const forceRgbaFlipYA16ItemIds = new Set([1426, 1427, 1428, 1429, 1430]);
const confirmedRgbaNoFlipItemIds = new Set([2280]);
const rgbaSingleLayerEffectFlipCache = new WeakMap();
const rgbaSingleLayerEffectActionFlipCache = new WeakMap();
const displaySizeSettings = {
  compact: { scale: 0.5 },
  normal: { scale: 1 },
  large: { scale: 2 },
};
const zoomMin = 0.5;
const zoomMax = 1.5;
const zoomStep = 0.1;

const statusOffsets = new Map([
  ["stand", 0],
  ["walk", 8],
  ["sit", 16],
  ["pick", 24],
  ["wait", 32],
  ["dead", 64],
]);

const faceFrameIndexes = new Map([
  ["center", 0],
  ["left", 1],
  ["right", 2],
]);

function appUrl(path) {
  return new URL(path, appBaseUrl).toString();
}

function languagePack() {
  return languageOptions.zh;
}

function tr(section, key) {
  return languagePack()?.[section]?.[key] || languageOptions.zh?.[section]?.[key] || key;
}

function trText(key, ...args) {
  const value = tr("text", key);
  return typeof value === "function" ? value(...args) : value;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setAttr(selector, name, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(name, value);
  }
}

function setButtonText(selector, value) {
  document.querySelectorAll(selector).forEach((button) => {
    button.textContent = value;
  });
}

function setControlLabel(controlSelector, value) {
  const control = document.querySelector(controlSelector);
  const group = control?.closest(".control-group");
  const label = Array.from(group?.children || []).find((child) => child.tagName === "LABEL");
  if (label) {
    label.textContent = value;
  }
}

function applyLanguage() {
  const pack = languagePack();
  document.documentElement.lang = pack.htmlLang || "zh-Hant";
  setText(".title-row h1", tr("label", "title"));
  setText(".brand h1", tr("label", "title"));
  setText(".stage-background-control span", tr("label", "background"));

  setControlLabel("[data-sex]", tr("label", "gender"));
  setControlLabel("#jobSelect", tr("label", "job"));
  setControlLabel("#mountSelect", tr("label", "other"));
  setControlLabel("#bodyColorSelect", tr("label", "bodyColor"));
  setControlLabel("#hairSelect", tr("label", "hairStyle"));
  setControlLabel("#hairColorSelect", tr("label", "hairColor"));
  setControlLabel("#headgearFilter", tr("label", "costume"));
  setControlLabel("#capeFilter", tr("label", "cape"));
  setControlLabel("#itemSearch", tr("label", "closet"));
  setControlLabel("[data-pose]", tr("label", "status"));
  setControlLabel("[data-action]", tr("label", "bodyDirection"));
  setControlLabel("[data-face]", tr("label", "faceDirection"));
  setControlLabel("#playButtonInline", tr("label", "animation"));
  setControlLabel("[data-display-size]", tr("label", "displaySize"));

  setButtonText("[data-sex='female']", tr("button", "female"));
  setButtonText("[data-sex='male']", tr("button", "male"));
  setButtonText("[data-mode-toggle='secondCostume']", tr("button", "secondCostume"));
  setButtonText("[data-browser-kind='headgear']", tr("button", "headgear"));
  setButtonText("[data-browser-kind='cape']", tr("button", "cape"));
  setButtonText("[data-pose='stand']", tr("button", "stand"));
  setButtonText("[data-pose='sit']", tr("button", "sit"));
  setButtonText("[data-pose='walk']", tr("button", "walk"));
  setButtonText("[data-pose='pick']", tr("button", "pick"));
  setButtonText("[data-pose='wait']", tr("button", "wait"));
  setButtonText("[data-pose='dead']", tr("button", "dead"));
  setButtonText("[data-face='left']", tr("button", "faceLeft"));
  setButtonText("[data-face='center']", tr("button", "faceCenter"));
  setButtonText("[data-face='right']", tr("button", "faceRight"));
  setButtonText("[data-display-size='compact']", tr("button", "compact"));
  setButtonText("[data-display-size='normal']", tr("button", "normal"));
  setButtonText("[data-display-size='large']", tr("button", "large"));

  setAttr("#headgearFilter", "placeholder", tr("text", "filter"));
  setAttr("#capeFilter", "placeholder", tr("text", "filter"));
  setAttr("#itemSearch", "placeholder", tr("text", "itemSearch"));
  setAttr("#backgroundSelect", "aria-label", tr("label", "background"));
  setAttr("#fitButton", "title", tr("text", "fit"));
  setAttr("#fitButton", "aria-label", tr("text", "fit"));
  setAttr("#shareButton", "title", tr("text", "shareTitle"));
  setAttr("#shareButton", "aria-label", tr("text", "shareTitle"));
  setAttr("#saveImageButton", "title", tr("text", "saveTitle"));
  setAttr("#saveImageButton", "aria-label", tr("text", "saveTitle"));
  setAttr("#saveGifButton", "title", tr("text", "gifTitle"));
  setAttr("#saveGifButton", "aria-label", tr("text", "gifTitle"));
  setAttr("#clearButton", "title", tr("text", "clearTitle"));
  setAttr("#clearButton", "aria-label", tr("text", "clearTitle"));
  setButtonText("#shareButton", tr("button", "share"));
  setButtonText("#saveImageButton", tr("button", "save"));
  setButtonText("#clearButton", tr("button", "clear"));

  document.querySelectorAll("[data-worn-slot='headgear-0'] > span").forEach((item) => {
    item.textContent = `服飾 1 (Costume)`;
  });
  document.querySelectorAll("[data-worn-slot='headgear-1'] > span").forEach((item) => {
    item.textContent = `服飾 2 (Costume)`;
  });
  document.querySelectorAll("[data-worn-slot='headgear-2'] > span").forEach((item) => {
    item.textContent = `服飾 3 (Costume)`;
  });
  document.querySelectorAll("[data-worn-slot='cape'] > span").forEach((item) => {
    item.textContent = tr("label", "cape");
  });
}

function backgroundById(id) {
  if (id === "custom-color") {
    return { id, name: "純色 (Solid Color)", type: "custom-color", value: state.backgroundColor };
  }
  if (id === "custom-image") {
    return { id, name: "自訂圖片 (Custom Image)", type: "custom-image", src: state.customBackgroundData };
  }
  return state.previewBackgrounds.find((item) => item.id === id) || state.previewBackgrounds[0];
}

function availableBackgrounds() {
  return [
    ...state.previewBackgrounds,
    { id: "custom-color", name: "純色 (Color)", type: "custom-color" },
    { id: "custom-image", name: "自訂圖片 (Image)", type: "custom-image" },
  ];
}

function syncBackgroundControls() {
  const isColor = state.previewBackground === "custom-color";
  const isImage = state.previewBackground === "custom-image";
  const draggable = ["custom-image", "texture"].includes(backgroundById(state.previewBackground)?.type);
  backgroundColor?.classList.toggle("is-hidden", !isColor);
  backgroundFileButton?.classList.toggle("is-hidden", !isImage);
  backgroundResetButton?.classList.toggle("is-hidden", !draggable);
  previewWrap?.classList.toggle("is-background-draggable", draggable);
  if (backgroundColor) {
    backgroundColor.value = state.backgroundColor;
  }
}

function backgroundPositionCss() {
  return `calc(50% + ${state.backgroundOffsetX}px) calc(50% + ${state.backgroundOffsetY}px)`;
}

function applyPreviewBackground() {
  if (!previewWrap) {
    return;
  }
  const bg = backgroundById(state.previewBackground) || { id: "transparent", type: "checkerboard" };
  previewWrap.style.backgroundColor = "";
  previewWrap.style.backgroundImage = "";
  previewWrap.style.backgroundSize = "";
  previewWrap.style.backgroundPosition = "";
  if (bg.type === "color" || bg.type === "custom-color") {
    previewWrap.style.backgroundColor = bg.value || "#fff";
    previewWrap.style.backgroundImage = "none";
  } else if (bg.type === "custom-image") {
    previewWrap.style.backgroundColor = state.backgroundColor;
    previewWrap.style.backgroundImage = bg.src ? `url(${JSON.stringify(bg.src)})` : "none";
    previewWrap.style.backgroundSize = "cover";
    previewWrap.style.backgroundPosition = backgroundPositionCss();
  } else if (bg.type === "texture" && bg.src) {
    previewWrap.style.backgroundImage = `url(${JSON.stringify(appUrl(bg.src))})`;
    previewWrap.style.backgroundSize = bg.size || "256px 256px";
    previewWrap.style.backgroundPosition = backgroundPositionCss();
  } else {
    previewWrap.style.backgroundColor = "#fff";
    previewWrap.style.backgroundImage = [
      "linear-gradient(45deg, #d9dee7 25%, transparent 25%)",
      "linear-gradient(-45deg, #d9dee7 25%, transparent 25%)",
      "linear-gradient(45deg, transparent 75%, #d9dee7 75%)",
      "linear-gradient(-45deg, transparent 75%, #d9dee7 75%)",
    ].join(", ");
    previewWrap.style.backgroundSize = "20px 20px";
    previewWrap.style.backgroundPosition = "0 0, 0 10px, 10px -10px, -10px 0";
  }
  syncBackgroundControls();
}

function resetBackgroundPosition(shouldNotify = true) {
  state.backgroundOffsetX = 0;
  state.backgroundOffsetY = 0;
  applyPreviewBackground();
  saveLocalState();
  if (shouldNotify) {
    notifyStatus("背景位置已重設 (Background position reset)");
  }
}

function startBackgroundDrag(event) {
  const bg = backgroundById(state.previewBackground);
  if (!previewWrap || !["custom-image", "texture"].includes(bg?.type) || event.button !== 0) {
    return;
  }
  event.preventDefault();
  backgroundDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: state.backgroundOffsetX,
    offsetY: state.backgroundOffsetY,
  };
  previewWrap.setPointerCapture(event.pointerId);
  previewWrap.classList.add("is-background-dragging");
}

function moveBackgroundDrag(event) {
  if (!backgroundDrag || event.pointerId !== backgroundDrag.pointerId) {
    return;
  }
  state.backgroundOffsetX = Math.max(-512, Math.min(512, Math.round(backgroundDrag.offsetX + event.clientX - backgroundDrag.startX)));
  state.backgroundOffsetY = Math.max(-512, Math.min(512, Math.round(backgroundDrag.offsetY + event.clientY - backgroundDrag.startY)));
  applyPreviewBackground();
}

function finishBackgroundDrag(event) {
  if (!backgroundDrag || event.pointerId !== backgroundDrag.pointerId) {
    return;
  }
  if (previewWrap.hasPointerCapture(event.pointerId)) {
    previewWrap.releasePointerCapture(event.pointerId);
  }
  previewWrap.classList.remove("is-background-dragging");
  backgroundDrag = null;
  saveLocalState();
}

function refreshBackgroundSelect() {
  if (!backgroundSelect) {
    applyPreviewBackground();
    return;
  }
  backgroundSelect.replaceChildren();
  for (const bg of availableBackgrounds()) {
    const option = document.createElement("option");
    option.value = bg.id;
    option.textContent = bg.name || bg.id;
    backgroundSelect.appendChild(option);
  }
  if (!availableBackgrounds().some((item) => item.id === state.previewBackground)) {
    state.previewBackground = state.previewBackgrounds[0]?.id || "transparent";
  }
  backgroundSelect.value = state.previewBackground;
  applyPreviewBackground();
}

function isDisplayableJob(job) {
  const label = job?.label || "";
  return !hiddenJobLabelTokens.some((token) => label.includes(token));
}

function displayableJobs() {
  return (state.data.jobs || []).filter((job) => (
    isDisplayableJob(job) && String(job.race || "human") === state.race
  ));
}

function displayableJobsForSex(sex = state.sex) {
  return displayableJobs().filter((job) => jobHasPartsForSex(job, sex));
}

function notifyStatus(message) {
  if (!statusText || !message) {
    return;
  }
  const current = statusText.textContent;
  statusText.textContent = message;
  window.setTimeout(() => {
    if (statusText.textContent === message) {
      draw();
    } else if (!statusText.textContent) {
      statusText.textContent = current;
    }
  }, 1200);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = appUrl(`${src}?v=${appVersion}`);
  });
}

async function ensurePartImages(partKey) {
  if (!partKey || partKey === "none") {
    return;
  }
  await ensurePartData(partKey);
  if (state.images.has(partKey)) {
    return;
  }
  if (state.loadingImages.has(partKey)) {
    await state.loadingImages.get(partKey);
    return;
  }
  const part = state.data.parts[partKey];
  if (!part) {
    return;
  }
  const loading = (async () => {
    const pools = {};
    if (part.pools) {
      await Promise.all(Object.entries(part.pools).map(async ([poolName, pool]) => {
        pools[poolName] = await loadImage(pool.sheet);
      }));
    } else {
      pools.indexed = await loadImage(part.sheet);
    }
    if (part.palette?.indexSheet) {
      pools.paletteIndex = await loadImage(part.palette.indexSheet);
    }
    state.images.set(partKey, pools);
  })();
  state.loadingImages.set(partKey, loading);
  try {
    await loading;
  } finally {
    state.loadingImages.delete(partKey);
  }
}

function partShardDescriptor(partKey) {
  const descriptors = state.data?.resourceShards?.parts || {};
  return Object.values(descriptors).find((descriptor) => (
    (descriptor.prefixes || []).some((prefix) => partKey.startsWith(prefix))
  )) || null;
}

function partShardUrl(partKey, descriptor) {
  const match = partKey.match(/_(\d+)$/);
  if (!descriptor?.path) {
    return null;
  }
  const bucketSize = Math.max(1, Number(descriptor.bucketSize) || 100);
  const bucketPad = Math.max(0, Number(descriptor.bucketPad) || 0);
  const bucket = match
    ? String(Math.floor(Number(match[1]) / bucketSize)).padStart(bucketPad, "0")
    : "misc";
  return descriptor.path.replace("{bucket}", bucket);
}

async function ensurePartIndex(partKey) {
  if (state.data.parts?.[partKey]) {
    return;
  }
  const descriptor = partShardDescriptor(partKey);
  const shardUrl = partShardUrl(partKey, descriptor);
  if (!shardUrl) {
    return;
  }
  if (!state.loadingPartShards.has(shardUrl)) {
    const loading = (async () => {
      const response = await fetch(appUrl(`${shardUrl}?v=${appVersion}`));
      if (!response.ok) {
        throw new Error(`Failed to load part shard ${shardUrl}`);
      }
      const payload = await response.json();
      Object.assign(state.data.parts, payload.parts || {});
    })();
    state.loadingPartShards.set(shardUrl, loading);
  }
  try {
    await state.loadingPartShards.get(shardUrl);
  } finally {
    state.loadingPartShards.delete(shardUrl);
  }
}

async function ensurePartData(partKey) {
  await ensurePartIndex(partKey);
  const part = state.data.parts[partKey];
  if (!part || part.actions) {
    return;
  }
  if (part.loadingData) {
    await part.loadingData;
    return;
  }
  if (!part.data) {
    return;
  }
  part.loadingData = (async () => {
    const response = await fetch(appUrl(`${part.data}?v=${appVersion}`));
    if (!response.ok) {
      throw new Error(`Failed to load ${part.data}`);
    }
    let detail;
    if (part.data.endsWith(".gz")) {
      if (!window.pako?.ungzip) {
        throw new Error("Compressed part decoder unavailable");
      }
      detail = JSON.parse(window.pako.ungzip(
        new Uint8Array(await response.arrayBuffer()),
        { to: "string" },
      ));
    } else {
      detail = await response.json();
    }
    Object.assign(part, detail);
  })();
  try {
    await part.loadingData;
  } finally {
    delete part.loadingData;
  }
}

function clampFrame() {
  const max = Math.max(0, visibleFrameCount() - 1);
  state.frame = Math.min(Math.max(0, state.frame), max);
  frameSlider.max = String(max);
  frameSlider.value = String(state.frame);
}

function currentCharacter() {
  return state.data.races?.[state.race]?.characters?.[state.sex]
    || state.data.characters[state.sex];
}

function currentFramesForPart(partKey, action = state.action) {
  if (!partKey) {
    return [];
  }
  const part = state.data.parts[partKey];
  if (!part || !part.actions) {
    return [];
  }
  const exact = part.actions[String(action)] || part.actions[action] || [];
  const actionNumber = Number(action);
  if (exact.length || actionNumber < 64 || actionNumber > 71) {
    return exact;
  }
  const fallbackAction = String(actionNumber % 8);
  return part.actions[fallbackAction] || [];
}

function currentFrames() {
  return currentFramesForPart(selectedJobBodyPartKey(), state.action);
}

function faceControlsEnabled() {
  return state.status === "stand" || state.status === "sit";
}

function faceGroupFrameCount(partKey, action = state.action) {
  if (!faceControlsEnabled()) {
    return 0;
  }
  const part = state.data?.parts?.[partKey];
  if (!part) {
    return 0;
  }
  const frames = currentFramesForPart(partKey, action);
  if (frames.length < 3 || frames.length % 3 !== 0) {
    return 0;
  }
  return frames.length / 3;
}

function partTimelineFrameCount(partKey, action = state.action) {
  const frames = currentFramesForPart(partKey, action);
  if (!frames.length) {
    return 0;
  }
  const groupSize = faceGroupFrameCount(partKey, action);
  if (groupSize) {
    return groupSize;
  }
  return frames.length;
}

function visibleFrameCount() {
  if (!state.data) {
    return 1;
  }
  if (state.status === "dead") {
    return Math.max(1, partTimelineFrameCount(selectedJobBodyPartKey(), state.action));
  }
  return Math.max(
    1,
    ...visiblePartKeys().map((partKey) => partTimelineFrameCount(partKey, state.action))
  );
}

function frameForPart(partKey, frameIndex = state.frame, action = state.action) {
  const frames = currentFramesForPart(partKey, action);
  if (!frames.length) {
    return null;
  }
  return frames[frameIndex % frames.length] || null;
}

function primaryAnchorForPart(partKey, frameIndex = state.frame, action = state.action) {
  const frame = frameForPart(partKey, frameIndex, action);
  return frame?.anchors?.[0] || null;
}

function alignedAnchorForPart(partKey, frameIndex = state.frame, partAction = state.action, bodyFrameIndex = state.frame) {
  const baseAnchor = state.data.anchor;
  const bodyAnchor = primaryAnchorForPart(selectedJobBodyPartKey(), bodyFrameIndex, state.action);
  const partAnchor = primaryAnchorForPart(partKey, frameIndex, partAction);
  if (!bodyAnchor || !partAnchor) {
    return baseAnchor;
  }
  const referenceBodyFrame = faceFrameIndex(selectedJobBodyPartKey(), 0);
  const referencePartFrame = faceFrameIndex(partKey, 0);
  const referenceBodyAnchor = primaryAnchorForPart(selectedJobBodyPartKey(), referenceBodyFrame, state.action);
  const referencePartAnchor = primaryAnchorForPart(partKey, referencePartFrame, partAction);
  let dx = bodyAnchor.x - partAnchor.x;
  let dy = bodyAnchor.y - partAnchor.y;
  if (referenceBodyAnchor && referencePartAnchor) {
    const referenceDx = referenceBodyAnchor.x - referencePartAnchor.x;
    const referenceDy = referenceBodyAnchor.y - referencePartAnchor.y;
    if (Math.hypot(dx - referenceDx, dy - referenceDy) > 10) {
      dx = referenceDx;
      dy = referenceDy;
    }
  }
  return {
    x: baseAnchor.x + dx,
    y: baseAnchor.y + dy,
  };
}

function alignedCapeAnchorForPart(partKey, frameIndex = state.frame, partAction = state.action, bodyFrameIndex = state.frame) {
  const baseAnchor = state.data.anchor;
  const bodyAnchor = primaryAnchorForPart(selectedJobBodyPartKey(), bodyFrameIndex, state.action);
  const capeAnchor = primaryAnchorForPart(partKey, frameIndex, partAction);
  const referenceBodyFrame = faceFrameIndex(selectedJobBodyPartKey(), 0);
  const referenceBodyAnchor = primaryAnchorForPart(selectedJobBodyPartKey(), referenceBodyFrame, state.action);
  const referenceCapeFrame = faceFrameIndex(partKey, 0);
  const referenceCapeAnchor = primaryAnchorForPart(partKey, referenceCapeFrame, partAction);
  const referenceDx = referenceBodyAnchor && referenceCapeAnchor
    ? referenceBodyAnchor.x - referenceCapeAnchor.x
    : 0;
  const referenceDy = referenceBodyAnchor && referenceCapeAnchor
    ? referenceBodyAnchor.y - referenceCapeAnchor.y
    : 0;
  // Mounted bodies place the rider well above the normal foot anchor. Keep that
  // intentional vertical delta so capes follow the rider instead of the mount.
  const maxReferenceDistance = state.riding ? 64 : 18;
  const referenceIsUsable = Math.hypot(referenceDx, referenceDy) <= maxReferenceDistance;
  if (!bodyAnchor || !capeAnchor) {
    return referenceIsUsable
      ? { x: baseAnchor.x + referenceDx, y: baseAnchor.y + referenceDy }
      : baseAnchor;
  }
  let dx = bodyAnchor.x - capeAnchor.x;
  let dy = bodyAnchor.y - capeAnchor.y;
  const deltaDrift = Math.hypot(dx - referenceDx, dy - referenceDy);
  if (referenceIsUsable && deltaDrift > 10) {
    dx = referenceDx;
    dy = referenceDy;
  } else if (!referenceIsUsable && Math.hypot(dx, dy) > 18) {
    return baseAnchor;
  }
  return {
    x: baseAnchor.x + dx,
    y: baseAnchor.y + dy,
  };
}

function poolNameForLayer(layer) {
  return Number(layer.image_type || 0) === 1 ? "rgba" : "indexed";
}

function decodePalette(raw) {
  const bytes = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0));
  const colors = [];
  for (let index = 0; index < 256; index += 1) {
    const offset = index * 4;
    colors.push([bytes[offset], bytes[offset + 1], bytes[offset + 2]]);
  }
  return colors;
}

function paletteColorForPart(part) {
  if (part.kind === "body") {
    return state.bodyColor;
  }
  if (part.kind === "head" && (part.key?.startsWith("hair_") || part.key?.startsWith("doram_hair_"))) {
    return state.hairColor;
  }
  return null;
}

function paletteImageForPart(part, image, indexImage, poolName) {
  const colorId = paletteColorForPart(part);
  if (poolName !== "indexed" || !colorId || !part.palette?.base || !part.palette?.variants?.[colorId]) {
    return image;
  }
  const cacheKey = `${part.key}|${poolName}|${colorId}`;
  if (state.images.has(cacheKey)) {
    return state.images.get(cacheKey);
  }

  const targetPalette = decodePalette(part.palette.variants[colorId]);

  const swapCanvas = document.createElement("canvas");
  swapCanvas.width = image.naturalWidth || image.width;
  swapCanvas.height = image.naturalHeight || image.height;
  const swapCtx = swapCanvas.getContext("2d", { willReadFrequently: true });
  swapCtx.drawImage(image, 0, 0);
  const imageData = swapCtx.getImageData(0, 0, swapCanvas.width, swapCanvas.height);
  const pixels = imageData.data;
  if (indexImage) {
    const indexCanvas = document.createElement("canvas");
    indexCanvas.width = swapCanvas.width;
    indexCanvas.height = swapCanvas.height;
    const indexCtx = indexCanvas.getContext("2d", { willReadFrequently: true });
    indexCtx.drawImage(indexImage, 0, 0);
    const indices = indexCtx.getImageData(0, 0, indexCanvas.width, indexCanvas.height).data;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const paletteIndex = indices[offset];
      if (paletteIndex === 0 || pixels[offset + 3] === 0) {
        pixels[offset + 3] = 0;
        continue;
      }
      const replacement = targetPalette[paletteIndex];
      pixels[offset] = replacement[0];
      pixels[offset + 1] = replacement[1];
      pixels[offset + 2] = replacement[2];
    }
  } else {
    // Compatibility fallback for older exports that do not include an index sheet.
    const basePalette = decodePalette(part.palette.base);
    const map = new Map();
    for (let index = 1; index < basePalette.length; index += 1) {
      const base = basePalette[index];
      const target = targetPalette[index];
      map.set(`${base[0]},${base[1]},${base[2]}`, target);
    }
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (pixels[offset + 3] === 0) {
        continue;
      }
      const replacement = map.get(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      if (!replacement) {
        continue;
      }
      pixels[offset] = replacement[0];
      pixels[offset + 1] = replacement[1];
      pixels[offset + 2] = replacement[2];
    }
  }
  swapCtx.putImageData(imageData, 0, 0);
  state.images.set(cacheKey, swapCanvas);
  return swapCanvas;
}

function partItemId(part) {
  const raw = part?.itemId ?? part?.item_id;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function isRgbaSingleLayerEffectPart(part) {
  if (!part || typeof part !== "object") {
    return false;
  }
  if (rgbaSingleLayerEffectFlipCache.has(part)) {
    return rgbaSingleLayerEffectFlipCache.get(part);
  }
  const shouldFlip = ["0", "16"].every((action) => {
    const layers = part.actions?.[action]?.[0]?.layers;
    return Array.isArray(layers)
      && layers.length >= 1
      && layers.length <= 2
      && layers.every((layer) => Number(layer.image_type || 0) === 1);
  });
  rgbaSingleLayerEffectFlipCache.set(part, shouldFlip);
  return shouldFlip;
}

function isRgbaSingleLayerEffectAction(part, action) {
  if (!part || typeof part !== "object") {
    return false;
  }
  let actionCache = rgbaSingleLayerEffectActionFlipCache.get(part);
  if (!actionCache) {
    actionCache = new Map();
    rgbaSingleLayerEffectActionFlipCache.set(part, actionCache);
  }
  const actionKey = String(action);
  if (actionCache.has(actionKey)) {
    return actionCache.get(actionKey);
  }
  const frames = part.actions?.[actionKey];
  const layers = Array.isArray(frames) && frames.length ? frames[0]?.layers : null;
  const shouldFlip = Array.isArray(layers)
    && layers.length >= 1
    && layers.length <= 2
    && layers.every((layer) => Number(layer.image_type || 0) === 1);
  actionCache.set(actionKey, shouldFlip);
  return shouldFlip;
}

function forceRgbaFlipYForPart(part) {
  const autoEffectFlip = isRgbaSingleLayerEffectPart(part)
    || isRgbaSingleLayerEffectAction(part, state.action);
  if (part?.kind !== "headgear") {
    return autoEffectFlip;
  }
  const itemId = partItemId(part);
  if (itemId === null) {
    return autoEffectFlip;
  }
  if (confirmedRgbaNoFlipItemIds.has(itemId)) {
    return false;
  }
  return forceRgbaFlipYAllActionItemIds.has(itemId)
    || (forceRgbaFlipYA16ItemIds.has(itemId) && String(state.action) === "16")
    || autoEffectFlip;
}

function drawLayer(part, imagePools, layer, anchor) {
  const poolName = poolNameForLayer(layer);
  const pool = part.pools?.[poolName] || (poolName === "rgba" ? null : { cells: part.cells });
  const baseImage = imagePools?.[poolName] || (poolName === "rgba" ? null : imagePools?.indexed);
  const image = baseImage
    ? paletteImageForPart(part, baseImage, imagePools?.paletteIndex, poolName)
    : null;
  const cell = pool?.cells?.[layer.cell];
  if (!image || !cell) {
    return;
  }
  if (!cell) {
    return;
  }

  const scaleX = Number(layer.scale_x || 1);
  const scaleY = Number(layer.scale_y || 1);
  const flipX = layer.mirror || scaleX < 0;
  const flipY = (scaleY < 0) !== (poolName === "rgba" && forceRgbaFlipYForPart(part));
  const drawScaleX = Math.max(0.01, Math.abs(scaleX));
  const drawScaleY = Math.max(0.01, Math.abs(scaleY));
  const alpha = Number.isFinite(layer.color_a) ? layer.color_a / 255 : 1;

  activeCtx.save();
  activeCtx.globalAlpha = alpha;
  activeCtx.translate(anchor.x + layer.x, anchor.y + layer.y);
  if (layer.angle) {
    activeCtx.rotate((-layer.angle * Math.PI) / 180);
  }
  activeCtx.scale(flipX ? -drawScaleX : drawScaleX, flipY ? -drawScaleY : drawScaleY);
  activeCtx.drawImage(
    image,
    cell.x,
    cell.y,
    cell.w,
    cell.h,
    -cell.w / 2,
    -cell.h / 2,
    cell.w,
    cell.h,
  );
  activeCtx.restore();
}

function drawPart(partKey, frameIndex, anchor = state.data.anchor, action = state.action) {
  if (!partKey || partKey === "none") {
    return;
  }
  const part = state.data.parts[partKey];
  const imagePools = state.images.get(partKey);
  const frames = currentFramesForPart(partKey, action);
  if (!part || !imagePools || !frames.length) {
    return;
  }

  const frame = frames[frameIndex % frames.length];
  const positionOffset = part.positionOffset || {};
  const paddedAnchor = {
    x: anchor.x + renderPadding + Number(positionOffset.x || 0),
    y: anchor.y + renderPadding + Number(positionOffset.y || 0),
  };
  for (const layer of frame.layers) {
    drawLayer(part, imagePools, layer, paddedAnchor);
  }
}

function selectedHeadgearPartKey(slotIndex = 0) {
  const itemId = state.headgearSlots[slotIndex] || "none";
  if (itemId === "none") {
    return null;
  }
  const entry = state.data.headgear.find((item) => String(item.id) === String(itemId));
  return itemPartKey(entry, "headgear");
}

function headgearLayerPriority(item, slotIndex = 0) {
  const defaults = state.layerPriority?.defaults || {};
  const rule = state.layerPriority?.items?.[item?.const || item?.label || ""];
  const directionPriority = rule?.directions?.[String(state.direction)];
  if (Number.isFinite(Number(directionPriority))) {
    return { priority: Number(directionPriority), source: "direction" };
  }
  if (Number.isFinite(Number(rule?.default))) {
    return { priority: Number(rule.default), source: "item" };
  }

  const slots = state.itemMeta?.headgear?.[String(item?.id)]?.slots || [];
  const slotPriorities = [];
  if (slots.includes("中段")) slotPriorities.push(Number(defaults.mid ?? 100));
  if (slots.includes("上段")) slotPriorities.push(Number(defaults.top ?? 200));
  if (slots.includes("下段")) slotPriorities.push(Number(defaults.bottom ?? 300));
  if (slotPriorities.length) {
    return { priority: Math.max(...slotPriorities), source: "slot" };
  }
  return { priority: Number(defaults.top ?? 200), source: "input", tie: slotIndex };
}

function selectedHeadgearLayers() {
  const layers = [];
  const seen = new Set();
  state.headgearSlots.forEach((itemId, slotIndex) => {
    if (!itemId || itemId === "none") {
      return;
    }
    const item = state.data.headgear.find((candidate) => String(candidate.id) === String(itemId));
    const partKey = itemPartKey(item, "headgear");
    if (!item || !partKey || seen.has(partKey)) {
      return;
    }
    seen.add(partKey);
    const layer = headgearLayerPriority(item, slotIndex);
    layers.push({
      item,
      itemId: String(item.id),
      partKey,
      slotIndex,
      priority: layer.priority,
      source: layer.source,
      tie: layer.tie ?? slotIndex,
    });
  });
  layers.sort((left, right) => (
    left.priority - right.priority
    || left.tie - right.tie
    || left.slotIndex - right.slotIndex
  ));
  return layers;
}

function selectedHeadgearPartKeys() {
  return selectedHeadgearLayers().map((layer) => layer.partKey);
}

function selectedCapePartKey() {
  if (state.cape === "none") {
    return null;
  }
  const entry = state.data.capes.find((item) => String(item.id) === String(state.cape));
  return itemPartKey(entry, "cape");
}

function headgearEntryAt(slotIndex) {
  const itemId = state.headgearSlots[slotIndex] || "none";
  if (itemId === "none") {
    return null;
  }
  return (state.data.headgear || []).find((item) => String(item.id) === String(itemId)) || null;
}

function selectedCapeEntry() {
  if (state.cape === "none") {
    return null;
  }
  return (state.data.capes || []).find((item) => String(item.id) === String(state.cape)) || null;
}

function selectedMotionPartKeys() {
  if (!state.data) {
    return [];
  }
  const keys = [];
  state.headgearSlots.forEach((_, index) => {
    const item = headgearEntryAt(index);
    const partKey = selectedHeadgearPartKey(index);
    if (partKey && itemHasAutomaticMotion(item, "headgear") && !keys.includes(partKey)) {
      keys.push(partKey);
    }
  });
  const capeItem = selectedCapeEntry();
  const capePart = selectedCapePartKey();
  if (capePart && itemHasAutomaticMotion(capeItem, "cape") && !keys.includes(capePart)) {
    keys.push(capePart);
  }
  return keys;
}

function wearableMotionFrameCount() {
  return Math.max(
    1,
    ...selectedMotionPartKeys().map((partKey) => partTimelineFrameCount(partKey, state.action)),
  );
}

function independentWearableMotionActive() {
  return !state.playing && wearableMotionFrameCount() > 1;
}

function wearableFrameForPart(partKey) {
  if (!state.playing && selectedMotionPartKeys().includes(partKey)) {
    return state.wearableFrame;
  }
  return state.frame;
}

function selectedEffectBindings() {
  const effects = [];
  const seen = new Set();
  function addEffect(effect, sourceKind, sourceId) {
    if (!effect?.id || seen.has(String(effect.id))) {
      return;
    }
    if (state.riding && effect.ignore_riding) {
      return;
    }
    seen.add(String(effect.id));
    effects.push({ ...effect, sourceKind, sourceId });
  }

  state.headgearSlots.forEach((itemId) => {
    if (!itemId || itemId === "none") {
      return;
    }
    const binding = state.effectBindings?.headgear?.[String(itemId)];
    (binding?.effects || []).forEach((effect) => addEffect(effect, "headgear", itemId));
  });

  if (state.cape !== "none") {
    const binding = state.effectBindings?.cape?.[String(state.cape)];
    (binding?.effects || []).forEach((effect) => addEffect(effect, "cape", state.cape));
  }
  return effects;
}

function hasEquippedEffectBinding() {
  const hasHeadgearEffect = state.headgearSlots.some((itemId) => (
    itemId && itemId !== "none"
    && Boolean(state.effectBindings?.headgear?.[String(itemId)]?.effects?.length)
  ));
  const hasCapeEffect = state.cape !== "none"
    && Boolean(state.effectBindings?.cape?.[String(state.cape)]?.effects?.length);
  return hasHeadgearEffect || hasCapeEffect;
}

function partKeyForItem(item, kind = null) {
  if (!item) {
    return null;
  }
  return itemPartKey(item, kind || itemKindFor(item));
}

function itemHasEffect(item, kind = null) {
  if (!item) {
    return false;
  }
  const itemKind = kind || itemKindFor(item);
  const binding = state.effectBindings?.[itemKind]?.[String(item.id)];
  return Boolean(binding?.effects?.length || state.itemFlags?.[itemKind]?.[String(item.id)]?.effect);
}

function layerVisualSignature(layer) {
  return [
    layer.cell,
    layer.mirror,
    layer.image_type,
    layer.scale_x,
    layer.scale_y,
    layer.angle,
  ].join(":");
}

function frameVisualSignature(frame) {
  return (frame?.layers || []).map((layer) => layerVisualSignature(layer)).join("|");
}

function actionHasVisualMotion(frames) {
  if (!Array.isArray(frames) || frames.length <= 3) {
    return false;
  }
  const signatures = new Set(frames.map((frame) => frameVisualSignature(frame)));
  return signatures.size > 1;
}

function itemHasMotion(item, kind = null) {
  if (!item) {
    return false;
  }
  const itemKind = kind || itemKindFor(item);
  if (state.itemFlags?.[itemKind]?.[String(item.id)]?.motion) {
    return true;
  }
  const part = state.data?.parts?.[partKeyForItem(item, itemKind)];
  if (!part) {
    return false;
  }
  return Object.values(part.actions || {}).some((frames) => actionHasVisualMotion(frames));
}

function itemHasAutomaticMotion(item, kind = null) {
  if (!item) {
    return false;
  }
  const itemKind = kind || itemKindFor(item);
  return Boolean(state.itemFlags?.[itemKind]?.[String(item.id)]?.motion);
}

function itemFlagLabels(item, kind = null) {
  const labels = [];
  if (itemHasMotion(item, kind)) {
    labels.push("motion");
  }
  if (itemHasEffect(item, kind)) {
    labels.push("effect");
  }
  return labels;
}

function effectImageKey(effect) {
  return `${state.sex}:${effect.id}`;
}

async function ensureEffectImage(effect) {
  const key = effectImageKey(effect);
  if (state.effectImages.has(key) || state.failedEffectImages.has(key)) {
    return;
  }
  if (state.loadingEffectImages.has(key)) {
    await state.loadingEffectImages.get(key);
    return;
  }
  const src = effect.asset?.[state.sex];
  if (!src) {
    state.failedEffectImages.add(key);
    return;
  }
  const loading = loadImage(src)
    .then((image) => {
      state.effectImages.set(key, image);
    })
    .catch(() => {
      state.failedEffectImages.add(key);
    });
  state.loadingEffectImages.set(key, loading);
  try {
    await loading;
  } finally {
    state.loadingEffectImages.delete(key);
  }
}

function selectedHairPartKey() {
  const entry = hairstylesForCurrentRace().find((item) => String(item.id) === String(state.hairstyle));
  return entry?.parts?.[state.sex] || currentCharacter().head;
}

function hairstylesForCurrentRace() {
  return (state.data.hairstyles || []).filter((hair) => String(hair.race || "human") === state.race);
}

function selectedJob() {
  return displayableJobs().find((item) => item.key === state.job) || null;
}

function jobVariantForSex(job, variantName, sex = state.sex) {
  if (!job) {
    return null;
  }
  const variant = job.variants?.[variantName];
  if (variant?.parts?.[sex]) {
    return variant;
  }
  if (variantName === "normal" && job.parts?.[sex]) {
    return { parts: job.parts, resource: job.resource, label: "標準" };
  }
  return null;
}

function jobHasPartsForSex(job, sex = state.sex) {
  if (!job) {
    return false;
  }
  if (job.parts?.[sex]) {
    return true;
  }
  return Object.values(job.variants || {}).some((variant) => Boolean(variant?.parts?.[sex]));
}

function mountOptionsForJob(job = selectedJob(), sex = state.sex) {
  if (!job || !jobModeFeatures.riding) {
    return [];
  }
  const mounts = (job.mounts || []).filter((mount) => (
    mount?.key && jobVariantForSex(job, mount.variant, sex)
  ));
  if (mounts.length) {
    return mounts;
  }
  const legacy = jobVariantForSex(job, "riding", sex);
  if (!legacy) {
    return [];
  }
  return [{
    key: "job",
    label: legacy.label || "職業騎乘 (Job Mount)",
    group: "job",
    variant: "riding",
    secondVariant: jobVariantForSex(job, "secondRiding", sex) ? "secondRiding" : null,
  }];
}

function selectedMountOption(job = selectedJob()) {
  return mountOptionsForJob(job).find((mount) => mount.key === state.mount) || null;
}

function mountCategory(mount) {
  if (!mount) {
    return null;
  }
  return mount?.group === "general" ? "general" : "job";
}

function selectedJobVariantName() {
  const job = selectedJob();
  if (!job) {
    return "normal";
  }
  const mount = selectedMountOption(job);
  if (mount) {
    if (state.secondCostume && mount.secondVariant && jobVariantForSex(job, mount.secondVariant)) {
      return mount.secondVariant;
    }
    return mount.variant;
  }
  if (state.secondCostume && jobVariantForSex(job, "second")) {
    return "second";
  }
  return "normal";
}

function selectedJobVariant() {
  return jobVariantForSex(selectedJob(), selectedJobVariantName());
}

function jobSupportsRiding(job = selectedJob()) {
  if (!jobModeFeatures.riding) {
    return false;
  }
  return mountOptionsForJob(job).length > 0;
}

function jobSupportsSecondCostume(job = selectedJob()) {
  if (!jobModeFeatures.secondCostume) {
    return false;
  }
  if (!job) {
    return false;
  }
  return Boolean(
    jobVariantForSex(job, "second")
    || mountOptionsForJob(job).some((mount) => mount.secondVariant && jobVariantForSex(job, mount.secondVariant))
  );
}

function normalizeJobModes() {
  if (!jobModeFeatures.riding) {
    state.mount = "none";
    state.riding = false;
  }
  if (!jobModeFeatures.secondCostume) {
    state.secondCostume = false;
  }
  const job = selectedJob();
  const mounts = mountOptionsForJob(job);
  if (state.mount === "job" && !mounts.some((mount) => mount.key === "job")) {
    state.mount = (mounts.find((mount) => mount.group === "job") || mounts[0])?.key || "none";
  }
  if (state.mount !== "none" && !mounts.some((mount) => mount.key === state.mount)) {
    state.mount = "none";
  }
  const mount = selectedMountOption(job);
  state.riding = Boolean(mount);
  if (mount && state.secondCostume && (!mount.secondVariant || !jobVariantForSex(job, mount.secondVariant))) {
    state.secondCostume = false;
  }
  if (state.secondCostume && !mount && !jobVariantForSex(job, "second")) {
    state.secondCostume = false;
  }
}

function selectedJobPartForSex() {
  return selectedJobVariant()?.parts?.[state.sex] || null;
}

function selectedJobBodyPartKey() {
  return selectedJobPartForSex() || currentCharacter().body;
}

function supportsFaceFrame(partKey) {
  return faceGroupFrameCount(partKey, state.action) > 0;
}

function faceFrameIndex(partKey, timelineFrame = state.frame) {
  const groupSize = faceGroupFrameCount(partKey, state.action);
  if (!groupSize) {
    return timelineFrame;
  }
  const frames = currentFramesForPart(partKey, state.action);
  const requested = faceFrameIndexes.get(state.faceDirection) ?? 0;
  return Math.min((requested * groupSize) + (timelineFrame % groupSize), Math.max(0, frames.length - 1));
}

function resetRenderFitScale() {
  state.renderFitScale = null;
  state.renderFitBounds = null;
}

function actionFor(status, direction) {
  const offset = statusOffsets.get(status) ?? 0;
  return String(offset + Number(direction || 0));
}

function ensureSelectedJobSupportsSex() {
  if (selectedJobPartForSex()) {
    return;
  }
  const fallback = displayableJobsForSex().find((job) => job.parts?.[state.sex] || jobHasPartsForSex(job));
  if (fallback) {
    state.job = fallback.key;
  }
}

function drawStack(character) {
  const capePart = selectedCapePartKey();
  const headgearLayers = selectedHeadgearLayers();
  canvas.dataset.headgearLayerOrder = headgearLayers
    .map((layer) => `${layer.itemId}:${layer.priority}:${layer.source}`)
    .join(",");
  const capeBehind = state.data.capeBehindActions.includes(Number(state.direction));
  const bodyFrame = faceFrameIndex(selectedJobBodyPartKey());
  const capeFrame = faceFrameIndex(capePart, wearableFrameForPart(capePart));
  if (capePart && capeBehind) {
    drawPart(capePart, capeFrame, alignedCapeAnchorForPart(capePart, capeFrame, state.action, bodyFrame), state.action);
  }

  for (const kind of state.data.drawOrder) {
    if (kind === "headgear") {
      for (const { partKey } of headgearLayers) {
        const partFrame = faceFrameIndex(partKey, wearableFrameForPart(partKey));
        drawPart(partKey, partFrame, alignedAnchorForPart(partKey, partFrame, state.action, bodyFrame), state.action);
      }
    } else if (kind === "body") {
      drawPart(selectedJobBodyPartKey(), bodyFrame, state.data.anchor, state.action);
    } else if (kind === "head") {
      const partKey = selectedHairPartKey();
      const partFrame = faceFrameIndex(partKey);
      drawPart(partKey, partFrame, alignedAnchorForPart(partKey, partFrame, state.action, bodyFrame), state.action);
    } else {
      drawPart(character[kind], state.frame, state.data.anchor, state.action);
    }
  }

  if (capePart && !capeBehind) {
    drawPart(capePart, capeFrame, alignedCapeAnchorForPart(capePart, capeFrame, state.action, bodyFrame), state.action);
  }
}

function renderedBounds(sourceCtx, width, height) {
  const pixels = sourceCtx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[((y * width + x) * 4) + 3] === 0) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) {
    return null;
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function drawFittedRender(clear = true) {
  const bounds = renderedBounds(renderCtx, renderCanvas.width, renderCanvas.height);
  if (!bounds) {
    return;
  }
  const setting = displaySizeSettings[state.displaySize] || displaySizeSettings.normal;
  const margin = 16;
  const anchorX = state.data.anchor.x + renderPadding;
  const anchorY = state.data.anchor.y + renderPadding;
  const targetAnchorX = canvas.width / 2;
  const leftDistance = Math.max(1, anchorX - bounds.x);
  const rightDistance = Math.max(1, bounds.x + bounds.width - anchorX);
  const topDistance = Math.max(1, anchorY - bounds.y);
  const bottomDistance = Math.max(1, bounds.y + bounds.height - anchorY);
  const animating = state.playing || independentWearableMotionActive();
  const currentFitBounds = { leftDistance, rightDistance, topDistance, bottomDistance };
  if (animating && state.renderFitBounds) {
    state.renderFitBounds = {
      leftDistance: Math.max(state.renderFitBounds.leftDistance, leftDistance),
      rightDistance: Math.max(state.renderFitBounds.rightDistance, rightDistance),
      topDistance: Math.max(state.renderFitBounds.topDistance, topDistance),
      bottomDistance: Math.max(state.renderFitBounds.bottomDistance, bottomDistance),
    };
  } else {
    state.renderFitBounds = currentFitBounds;
  }
  const fitBounds = state.renderFitBounds;
  const computedFitScale = Math.min(
    1,
    (targetAnchorX - margin) / Math.max(1, fitBounds.leftDistance * setting.scale),
    (canvas.width - targetAnchorX - margin) / Math.max(1, fitBounds.rightDistance * setting.scale),
    (canvas.height - (margin * 2))
      / Math.max(1, (fitBounds.topDistance + fitBounds.bottomDistance) * setting.scale),
  );
  let fitScale = computedFitScale;
  if (animating) {
    if (state.renderFitScale === null || computedFitScale < state.renderFitScale) {
      state.renderFitScale = computedFitScale;
    }
    fitScale = state.renderFitScale;
  } else {
    state.renderFitScale = computedFitScale;
  }
  const scale = setting.scale * fitScale;
  // Bound Hateffect APNGs were exported against the original 60% character
  // anchor. Keep that verified composite baseline whenever an effect is worn.
  const hasBoundEffect = hasEquippedEffectBinding();
  const preferredAnchorY = canvas.height * (hasBoundEffect ? 0.6 : 0.74);
  canvas.dataset.anchorMode = hasBoundEffect ? "effect-legacy" : "adaptive";
  const minAnchorY = margin + (fitBounds.topDistance * scale);
  const maxAnchorY = canvas.height - margin - (fitBounds.bottomDistance * scale);
  const targetAnchorY = Math.min(
    Math.max(preferredAnchorY, minAnchorY),
    Math.max(minAnchorY, maxAnchorY),
  );
  canvas.dataset.renderScale = scale.toFixed(4);
  canvas.dataset.targetAnchorY = targetAnchorY.toFixed(2);
  previewWrap.style.setProperty(
    "--effect-anchor-y",
    `${targetAnchorY - EFFECT_CENTER_TO_ACTOR_ANCHOR_Y}px`,
  );
  previewWrap.style.setProperty("--character-anchor-y", `${targetAnchorY}px`);
  previewWrap.style.setProperty("--preview-zoom", String(state.zoom));
  const dx = Math.round(targetAnchorX - anchorX * scale);
  const dy = Math.round(targetAnchorY - anchorY * scale);
  if (clear) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    renderCanvas,
    0,
    0,
    renderCanvas.width,
    renderCanvas.height,
    dx,
    dy,
    Math.round(renderCanvas.width * scale),
    Math.round(renderCanvas.height * scale),
  );
}

function syncEffectLayer(layer, effects) {
  if (!layer) {
    return;
  }
  const key = effects.map((effect) => `${state.sex}:${effect.id}`).join("|");
  if (layer.dataset.effectKey !== key) {
    layer.dataset.effectKey = key;
    const nodes = [];
    for (const effect of effects) {
      const src = effect.asset?.[state.sex];
      if (!src) {
        continue;
      }
      const image = document.createElement("img");
      image.alt = "";
      image.decoding = "async";
      image.dataset.effectId = String(effect.id);
      image.title = effect.const || `effect ${effect.id}`;
      image.addEventListener("error", () => {
        image.remove();
      }, { once: true });
      image.src = appUrl(`${src}?v=${appVersion}`);
      nodes.push(image);
    }
    layer.replaceChildren(...nodes);
  }

}

function renderEffectLayers() {
  const effects = selectedEffectBindings();
  const behind = effects.filter((effect) => Boolean(effect.render_before_character));
  const front = effects.filter((effect) => !effect.render_before_character);
  if (effectRuntime) {
    effectRuntime.sync({ behind, front, sex: state.sex, resolveUrl: appUrl, version: appVersion });
    return;
  }
  syncEffectLayer(effectLayerBehind, behind);
  syncEffectLayer(effectLayerFront, front);
}

function draw() {
  if (!state.data) {
    return;
  }

  clampFrame();
  canvas.dataset.characterFrame = String(state.frame);
  canvas.dataset.wearableFrame = String(state.wearableFrame);
  canvas.dataset.characterPlaying = String(state.playing);
  canvas.dataset.wearableMotion = String(independentWearableMotionActive());
  renderCanvas.width = canvas.width + renderPadding * 2;
  renderCanvas.height = canvas.height + renderPadding * 2;
  renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
  renderCtx.imageSmoothingEnabled = false;

  const character = currentCharacter();
  ensureSelectedJobSupportsSex();
  activeCtx = renderCtx;
  drawStack(character);
  activeCtx = ctx;
  drawFittedRender(true);
  renderEffectLayers();

  const bodyPart = selectedJobBodyPartKey();
  const hairPart = selectedHairPartKey();
  const bodyFrames = currentFramesForPart(bodyPart, state.action);
  const bodyFrame = faceFrameIndex(bodyPart);
  const anchors = bodyFrames[bodyFrame]?.anchors || [];
  const anchorText = anchors.length ? anchors.map((a) => `${a.x},${a.y}`).join(" | ") : "none";
  const stack = state.data.drawOrder
    .flatMap((kind) => {
      if (kind === "headgear") {
        return selectedHeadgearPartKeys();
      }
      if (kind === "body") {
        return bodyPart;
      }
      if (kind === "head") {
        return hairPart;
      }
      return character[kind];
    })
    .filter(Boolean);
  const capePart = selectedCapePartKey();
  if (capePart) {
    const capeBehind = state.data.capeBehindActions.includes(Number(state.direction));
    if (capeBehind) {
      stack.unshift(capePart);
    } else {
      stack.push(capePart);
    }
  }
  for (const effect of selectedEffectBindings()) {
    stack.push(`effect_${effect.id}`);
  }
  stackReadout.textContent = stack.join(" -> ");
  anchorReadout.textContent = anchorText;
  frameReadout.textContent = `${state.frame + 1} / ${visibleFrameCount()}`;
  const variantName = selectedJobVariantName();
  const modeLabels = [];
  const mount = selectedMountOption();
  if (mount) {
    modeLabels.push(mount.label || tr("button", "riding"));
  }
  if (variantName === "second" || variantName === "secondRiding") {
    modeLabels.push(tr("button", "secondCostume"));
  }
  const jobLabel = `${selectedJob()?.label || tr("label", "job")}${modeLabels.length ? ` ${modeLabels.join(" ")}` : ""}`;
  const statusLabel = (state.data.statuses || []).find((item) => item.key === state.status)?.label || state.status;
  const directionLabel = (state.data.directions || []).find((item) => Number(item.id) === Number(state.direction))?.label || state.direction;
  statusText.textContent = `${tr("button", state.sex) || sexLabels.get(state.sex) || state.sex} ${jobLabel} ${statusLabel} ${directionLabel}`;
}

function statePayload() {
  return {
    race: state.race,
    sex: state.sex,
    job: state.job,
    mount: state.mount,
    ride: state.riding ? "1" : "0",
    second: state.secondCostume ? "1" : "0",
    hair: state.hairstyle,
    bodyColor: state.bodyColor,
    hairColor: state.hairColor,
    status: state.status,
    dir: String(state.direction),
    face: state.faceDirection,
    headgear: state.headgearSlots.join(","),
    cape: state.cape,
    size: state.displaySize,
    zoom: String(state.zoom),
    bg: state.previewBackground,
    bgColor: state.backgroundColor,
    bgX: String(state.backgroundOffsetX),
    bgY: String(state.backgroundOffsetY),
    shadow: state.showShadow ? "1" : "0",
  };
}

function rememberRaceSelection() {
  raceSelectionMemory.set(state.race, {
    job: state.job,
    mount: state.mount,
    secondCostume: state.secondCostume,
    hairstyle: state.hairstyle,
    bodyColor: state.bodyColor,
    hairColor: state.hairColor,
    headgearSlots: [...state.headgearSlots],
    cape: state.cape,
  });
}

function restoreRaceSelection(race) {
  const remembered = raceSelectionMemory.get(race);
  if (!remembered) {
    return false;
  }
  state.job = remembered.job;
  state.mount = remembered.mount;
  state.secondCostume = remembered.secondCostume;
  state.hairstyle = remembered.hairstyle;
  state.bodyColor = remembered.bodyColor;
  state.hairColor = remembered.hairColor;
  state.headgearSlots = [...remembered.headgearSlots];
  state.cape = remembered.cape;
  return true;
}

function stateHash() {
  const params = new URLSearchParams(statePayload());
  return `#${params.toString()}`;
}

function saveLocalState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(statePayload()));
  } catch (_) {}
}

function readLocalState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch (_) {
    return null;
  }
}

function readHashState() {
  if (!window.location.hash || window.location.hash.length < 2) {
    return null;
  }
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (!params.has("sex") && !params.has("job") && !params.has("headgear")) {
    return null;
  }
  return Object.fromEntries(params.entries());
}

function applyStatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return;
  }
  if (payload.race) state.race = String(payload.race);
  if (payload.sex) state.sex = String(payload.sex);
  if (payload.job) state.job = String(payload.job);
  if (payload.mount) {
    state.mount = String(payload.mount);
  } else if (payload.ride !== undefined) {
    state.mount = String(payload.ride) === "1" || String(payload.ride) === "true" ? "job" : "none";
  }
  state.riding = state.mount !== "none";
  if (payload.second !== undefined) state.secondCostume = String(payload.second) === "1" || String(payload.second) === "true";
  if (payload.hair) state.hairstyle = String(payload.hair);
  if (payload.bodyColor) state.bodyColor = String(payload.bodyColor);
  if (payload.hairColor) state.hairColor = String(payload.hairColor);
  if (payload.status) state.status = String(payload.status);
  if (payload.dir !== undefined) state.direction = Number(payload.dir);
  if (payload.face) state.faceDirection = String(payload.face);
  if (payload.headgear !== undefined) {
    state.headgearSlots = String(payload.headgear).split(",").slice(0, 3);
    while (state.headgearSlots.length < 3) {
      state.headgearSlots.push("none");
    }
  }
  if (payload.cape) state.cape = String(payload.cape);
  if (payload.size) state.displaySize = String(payload.size);
  if (payload.zoom !== undefined) state.zoom = Number(payload.zoom);
  if (payload.bg) state.previewBackground = String(payload.bg);
  if (payload.bgColor && /^#[0-9a-f]{6}$/i.test(String(payload.bgColor))) {
    state.backgroundColor = String(payload.bgColor);
  }
  if (payload.bgX !== undefined) state.backgroundOffsetX = Number(payload.bgX);
  if (payload.bgY !== undefined) state.backgroundOffsetY = Number(payload.bgY);
  if (payload.shadow !== undefined) {
    state.showShadow = String(payload.shadow) === "1" || String(payload.shadow) === "true";
  }
}

function normalizeState() {
  if (!state.data.races?.[state.race]) {
    state.race = "human";
  }
  if (!state.data.characters[state.sex]) {
    state.sex = "female";
  }
  if (!statusOffsets.has(state.status)) {
    state.status = "stand";
  }
  if (!directionIds.includes(Number(state.direction))) {
    state.direction = 0;
  }
  state.action = actionFor(state.status, state.direction);
  if (!faceFrameIndexes.has(state.faceDirection)) {
    state.faceDirection = "center";
  }
  if (!displaySizeSettings[state.displaySize]) {
    state.displaySize = "normal";
  }
  if (!Number.isFinite(state.zoom)) {
    state.zoom = 1;
  }
  state.zoom = Math.min(zoomMax, Math.max(zoomMin, Math.round(state.zoom * 10) / 10));
  if (!Number.isFinite(state.backgroundOffsetX)) state.backgroundOffsetX = 0;
  if (!Number.isFinite(state.backgroundOffsetY)) state.backgroundOffsetY = 0;
  state.backgroundOffsetX = Math.max(-512, Math.min(512, Math.round(state.backgroundOffsetX)));
  state.backgroundOffsetY = Math.max(-512, Math.min(512, Math.round(state.backgroundOffsetY)));
  if (!availableBackgrounds().some((item) => item.id === state.previewBackground)) {
    state.previewBackground = state.previewBackgrounds[0]?.id || "transparent";
  }
  state.language = "zh";
  ensureSelectedJobSupportsSex();
  normalizeJobModes();

  const raceHairstyles = hairstylesForCurrentRace();
  const hair = raceHairstyles.find((item) => String(item.id) === String(state.hairstyle));
  if (!hair?.parts?.[state.sex]) {
    const fallback = raceHairstyles.find((item) => item.parts?.[state.sex]);
    if (fallback) {
      state.hairstyle = String(fallback.id);
    }
  }

  const colorExists = (items, value) => (items || []).some((item) => String(item.id) === String(value));
  if (!colorExists(state.data.bodyColors, state.bodyColor)) {
    state.bodyColor = "0";
  }
  if (!colorExists(state.data.hairColors, state.hairColor)) {
    state.hairColor = "0";
  }

  state.headgearSlots = state.headgearSlots.slice(0, 3).map((value, index) => {
    const entry = (state.data.headgear || []).find((item) => String(item.id) === String(value));
    return itemPartKey(entry, "headgear") ? String(value) : "none";
  });
  while (state.headgearSlots.length < 3) {
    state.headgearSlots.push("none");
  }
  const capeEntry = (state.data.capes || []).find((item) => String(item.id) === String(state.cape));
  if (!itemPartKey(capeEntry, "cape")) {
    state.cape = "none";
  }
}

function syncControls() {
  document.querySelectorAll("[data-race]").forEach((button) => {
    button.classList.toggle("active", button.dataset.race === state.race);
  });
  document.querySelectorAll("[data-sex]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sex === state.sex);
  });
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.action) === Number(state.direction));
  });
  document.querySelectorAll("[data-pose]").forEach((button) => {
    button.classList.toggle("active", button.dataset.pose === state.status);
  });
  document.querySelectorAll("[data-face]").forEach((button) => {
    const enabled = faceControlsEnabled();
    button.classList.toggle("active", button.dataset.face === state.faceDirection);
    button.disabled = !enabled;
    button.title = enabled ? "" : tr("text", "faceDisabled");
  });
  document.querySelectorAll("[data-display-size]").forEach((button) => {
    button.classList.toggle("active", button.dataset.displaySize === state.displaySize);
  });
  document.querySelectorAll("[data-mode-toggle]").forEach((button) => {
    const mode = button.dataset.modeToggle;
    const enabled = mode === "secondCostume" && jobSupportsSecondCostume();
    const active = mode === "secondCostume" && state.secondCostume;
    button.classList.toggle("active", Boolean(active));
    button.disabled = !enabled;
    button.title = enabled ? "" : tr("text", "modeUnavailable");
  });
  document.querySelectorAll("[data-browser-kind]").forEach((button) => {
    button.classList.toggle("active", button.dataset.browserKind === state.browserKind);
  });
  equipmentQuickFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.equipmentFilter === state.equipmentFilter);
  });
  syncItemBrowserControls();
  actionSelect.value = state.action;
  jobSelect.value = state.job;
  if (mountSelect) {
    mountSelect.value = state.mount;
  }
  hairSelect.value = state.hairstyle;
  if (bodyColorSelect) {
    bodyColorSelect.value = state.bodyColor;
  }
  if (hairColorSelect) {
    hairColorSelect.value = state.hairColor;
  }
  if (backgroundSelect) {
    backgroundSelect.value = state.previewBackground;
  }
  if (shadowToggle) {
    shadowToggle.checked = state.showShadow;
  }
  if (paperdollShadow) {
    paperdollShadow.classList.toggle("is-hidden", !state.showShadow);
    paperdollShadow.classList.toggle("is-riding", state.riding);
  }
  if (zoomReadout) {
    zoomReadout.value = `${Math.round(state.zoom * 100)}%`;
    zoomReadout.textContent = zoomReadout.value;
  }
  if (zoomOutButton) {
    zoomOutButton.disabled = state.zoom <= zoomMin;
  }
  if (zoomInButton) {
    zoomInButton.disabled = state.zoom >= zoomMax;
  }
  applyPreviewBackground();
  headgearSelects.forEach((select, index) => {
    select.value = state.headgearSlots[index] || "none";
  });
  capeSelect.value = state.cape;
  playButton.textContent = state.playing ? "II" : ">";
  playButton.disabled = state.status === "dead";
  playButton.title = state.playing ? tr("text", "pause") : tr("text", "play");
  playButton.setAttribute("aria-label", playButton.title);
  if (playButtonInline) {
    playButtonInline.disabled = state.status === "dead";
    playButtonInline.classList.toggle("active", state.playing);
    playButtonInline.textContent = state.playing ? tr("button", "stop") : tr("button", "auto");
  }
  clampFrame();
  applyLanguage();
  refreshWornPanel();
}

function itemMatchesQuery(item, query, explicitKind = null) {
  if (!query) {
    return true;
  }
  const meta = itemMetaFor(item, explicitKind);
  const text = [
    String(item.id),
    item.label || "",
    item.const || "",
    meta?.display_name || "",
    meta?.primary_itemid || "",
    ...(meta?.itemids || []),
    ...(meta?.names || []),
    ...(meta?.slots || []),
  ].join(" ").toLowerCase();
  return text.includes(query.toLowerCase());
}

function itemKindFor(item) {
  if (!item) {
    return null;
  }
  if (state.data.capes?.some((candidate) => String(candidate.id) === String(item.id))) {
    return "cape";
  }
  return "headgear";
}

function itemPartKey(item, explicitKind = null) {
  if (!item) {
    return null;
  }
  if (state.race === "doram") {
    const directPart = item.doramParts?.[state.sex];
    if (directPart) {
      return directPart;
    }
    const resource = selectedJobVariant()?.resource || selectedJob()?.resource;
    return item.doramParts?.[resource]?.[state.sex] || null;
  }
  return item.parts?.[state.sex] || null;
}

function itemSupportedForCurrentCharacter(item, explicitKind = null) {
  return Boolean(itemPartKey(item, explicitKind));
}

function itemMetaFor(item, explicitKind = null) {
  if (!item) {
    return null;
  }
  const kind = explicitKind || itemKindFor(item);
  return state.itemMeta?.[kind]?.[String(item.id)] || null;
}

function itemMatchesEquipmentFilter(item, explicitKind = null, explicitFilter = null) {
  const filter = explicitFilter || state.equipmentFilter || "all";
  if (filter === "all") {
    return true;
  }
  const kind = explicitKind || itemKindFor(item);
  if (filter === "motion") {
    return itemHasMotion(item, kind);
  }
  if (filter === "effect") {
    return itemHasEffect(item, kind);
  }
  if (filter === "favorite") {
    return isItemBrowserFavorite(item, kind);
  }
  if (filter === "cape") {
    return kind === "cape";
  }
  if (kind !== "headgear") {
    return false;
  }
  const slotByFilter = {
    top: "上段",
    mid: "中段",
    low: "下段",
  };
  const slot = slotByFilter[filter];
  return Boolean(slot && (itemMetaFor(item, kind)?.slots || []).includes(slot));
}

function itemOptionLabel(item, explicitKind = null) {
  const meta = itemMetaFor(item, explicitKind);
  const itemid = meta?.primary_itemid ? ` #${meta.primary_itemid}` : "";
  const name = meta?.display_name || item.label || item.const || "未命名";
  const slots = meta?.slots?.length ? ` [${meta.slots.join("/")}]` : "";
  const flags = itemFlagLabels(item, explicitKind).map((label) => `[${label}]`).join("");
  return `${item.id}${itemid} - ${name}${slots}${flags}`;
}

function fillItemSelect(select, items, selectedValue, query, noneLabel = "無", itemKind = null) {
  const previous = selectedValue || "none";
  const cleanQuery = query.trim();
  const limit = cleanQuery ? selectSearchLimit : Infinity;
  let matchedCount = 0;
  let appendedCount = 0;
  select.replaceChildren();

  const noneOption = document.createElement("option");
  noneOption.value = "none";
  noneOption.textContent = noneLabel;
  select.appendChild(noneOption);

  let hasSelected = previous === "none";
  for (const item of items) {
    if (!itemSupportedForCurrentCharacter(item, itemKind)
      || !itemMatchesQuery(item, cleanQuery, itemKind)
      || !itemMatchesEquipmentFilter(item, itemKind)) {
      continue;
    }
    matchedCount += 1;
    if (appendedCount >= limit && String(item.id) !== String(previous)) {
      continue;
    }
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = itemOptionLabel(item, itemKind);
    option.title = itemDisplayName(item, itemKind);
    select.appendChild(option);
    appendedCount += 1;
    if (String(item.id) === String(previous)) {
      hasSelected = true;
    }
  }

  if (!hasSelected) {
    const item = items.find((candidate) => String(candidate.id) === String(previous));
    if (item) {
      const option = document.createElement("option");
      option.value = String(item.id);
      option.textContent = itemOptionLabel(item, itemKind);
      option.title = itemDisplayName(item, itemKind);
      select.appendChild(option);
    }
  }
  if (Number.isFinite(limit) && matchedCount > appendedCount) {
    const moreOption = document.createElement("option");
    moreOption.disabled = true;
    moreOption.textContent = trText("moreResults", matchedCount - appendedCount);
    select.appendChild(moreOption);
  }
  select.value = previous;
}

function scheduleEquipmentFilterRefresh() {
  window.clearTimeout(equipmentFilterTimer);
  equipmentFilterTimer = window.setTimeout(() => {
    refreshEquipmentSelects();
  }, filterDebounceMs);
}

function scheduleItemBrowserRefresh() {
  window.clearTimeout(browserFilterTimer);
  browserFilterTimer = window.setTimeout(() => {
    refreshItemBrowser();
  }, filterDebounceMs);
}

function itemDisplayName(item, explicitKind = null) {
  if (!item) {
    return trText("none");
  }
  const meta = itemMetaFor(item, explicitKind);
  const names = meta?.names?.length ? ` / ${meta.names.join(" / ")}` : "";
  return `${itemOptionLabel(item, explicitKind)}${names}`;
}

function shortItemName(item, explicitKind = null) {
  if (!item) {
    return trText("none");
  }
  const meta = itemMetaFor(item, explicitKind);
  return meta?.display_name || item.label || item.const || String(item.id);
}

function refreshWornPanel() {
  document.querySelectorAll("[data-worn-slot]").forEach((row) => {
    const slot = row.dataset.wornSlot;
    const button = row.querySelector("[data-clear-slot]");
    if (!button) {
      return;
    }
    let item = null;
    let kind = null;
    if (slot === "cape") {
      item = selectedCapeEntry();
      kind = "cape";
    } else if (slot?.startsWith("headgear-")) {
      item = headgearEntryAt(Number(slot.split("-")[1] || 0));
      kind = "headgear";
    }
    button.textContent = item ? shortItemName(item, kind) : trText("none");
    button.title = item ? itemDisplayName(item, kind) : trText("none");
    row.classList.toggle("is-filled", Boolean(item));
  });
  syncQuickFavoriteButtons();
  if (quickFavoritePanel && !quickFavoritePanel.hidden) {
    renderQuickFavoritePanel();
  }
}

function showToolbarButtonFeedback(button, feedbackKey, defaultKey) {
  if (!button) {
    return;
  }
  window.clearTimeout(toolbarFeedbackTimers.get(button));
  button.textContent = `✓ ${tr("button", feedbackKey)}`;
  button.classList.add("is-confirmed");
  button.setAttribute("aria-live", "polite");
  const timer = window.setTimeout(() => {
    button.textContent = tr("button", defaultKey);
    button.classList.remove("is-confirmed");
    button.removeAttribute("aria-live");
    toolbarFeedbackTimers.delete(button);
  }, 1600);
  toolbarFeedbackTimers.set(button, timer);
}

function loadQuickFavorites() {
  const result = { "headgear-0": [], "headgear-1": [], "headgear-2": [], cape: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(quickFavoritesStorageKey) || "null");
    if (!saved || typeof saved !== "object") {
      return result;
    }
    for (const slot of Object.keys(result)) {
      result[slot] = Array.isArray(saved[slot])
        ? [...new Set(saved[slot].map(String).filter((id) => id && id !== "none"))]
        : [];
    }
  } catch (_error) {
    // Keep an empty in-memory list when storage is unavailable.
  }
  return result;
}

function saveQuickFavorites() {
  try {
    localStorage.setItem(quickFavoritesStorageKey, JSON.stringify(quickFavorites));
  } catch (_error) {
    // Favorites remain available for the current session when storage is unavailable.
  }
}

function quickFavoriteSlotLabel(slot = quickFavoriteSlot) {
  return {
    "headgear-0": "服飾 1",
    "headgear-1": "服飾 2",
    "headgear-2": "服飾 3",
    cape: "肩飾",
  }[slot] || "服飾";
}

function quickFavoriteKind(slot = quickFavoriteSlot) {
  return slot === "cape" ? "cape" : "headgear";
}

function currentQuickFavoriteItem(slot = quickFavoriteSlot) {
  if (slot === "cape") {
    return selectedCapeEntry();
  }
  return headgearEntryAt(Number(slot.split("-")[1] || 0));
}

function quickFavoriteItem(itemId, slot = quickFavoriteSlot) {
  const items = quickFavoriteKind(slot) === "cape" ? (state.data?.capes || []) : (state.data?.headgear || []);
  return items.find((item) => String(item.id) === String(itemId)) || null;
}

function setQuickFavoriteItem(itemId, slot = quickFavoriteSlot) {
  if (slot === "cape") {
    state.cape = String(itemId);
  } else {
    state.headgearSlots[Number(slot.split("-")[1] || 0)] = String(itemId);
  }
  state.wearableFrame = 0;
  state.lastWearableTick = performance.now();
  refreshEquipmentSelects();
  prepareAndDraw();
}

function syncQuickFavoriteButtons() {
  quickFavoriteButtons.forEach((button) => {
    const slot = button.dataset.favoriteSlot;
    const count = quickFavorites[slot]?.length || 0;
    button.classList.toggle("active", count > 0);
    button.textContent = count > 0 ? "★" : "☆";
    button.title = count > 0
      ? `${quickFavoriteSlotLabel(slot)} 單件最愛；方向鍵快速切換 ${count} 件收藏`
      : `${quickFavoriteSlotLabel(slot)} 單件最愛`;
    button.setAttribute("aria-expanded", String(Boolean(
      quickFavoritePanel && !quickFavoritePanel.hidden && quickFavoriteSlot === slot
    )));
  });
}

function cycleQuickFavoriteItem(button, direction) {
  const slot = button.dataset.favoriteSlot;
  const entries = (quickFavorites[slot] || [])
    .map((itemId) => quickFavoriteItem(itemId, slot))
    .filter((item) => item && itemSupportedForCurrentCharacter(item, quickFavoriteKind(slot)));
  if (!entries.length) return;
  const currentId = String(currentQuickFavoriteItem(slot)?.id || "none");
  const currentIndex = entries.findIndex((item) => String(item.id) === currentId);
  const nextIndex = currentIndex < 0
    ? (direction > 0 ? 0 : entries.length - 1)
    : (currentIndex + direction + entries.length) % entries.length;
  const nextItem = entries[nextIndex];
  setQuickFavoriteItem(nextItem.id, slot);
  notifyStatus(`${quickFavoriteSlotLabel(slot)}：${shortItemName(nextItem, quickFavoriteKind(slot))}`);
}

function renderQuickFavoritePanel() {
  if (!quickFavoritePanel || !quickFavoriteTitle || !quickFavoriteList || !addQuickFavoriteButton || !state.data) {
    return;
  }
  const current = currentQuickFavoriteItem();
  const ids = quickFavorites[quickFavoriteSlot] || [];
  const currentSaved = Boolean(current && ids.includes(String(current.id)));
  quickFavoriteTitle.textContent = `${quickFavoriteSlotLabel()} 單件最愛 (Favorites)`;
  addQuickFavoriteButton.disabled = !current || currentSaved;
  addQuickFavoriteButton.textContent = currentSaved
    ? "目前服飾已收藏 (Saved)"
    : "加入目前服飾 (Add Current)";
  quickFavoriteList.replaceChildren();
  const entries = ids.map((id) => quickFavoriteItem(id)).filter(Boolean);
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "quick-favorite-empty";
    empty.textContent = "尚未加入單件最愛";
    quickFavoriteList.appendChild(empty);
    return;
  }
  for (const item of entries) {
    const row = document.createElement("div");
    row.className = "quick-favorite-item";
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "quick-favorite-apply";
    applyButton.textContent = shortItemName(item, quickFavoriteKind());
    applyButton.title = itemDisplayName(item, quickFavoriteKind());
    applyButton.classList.toggle("active", String(current?.id) === String(item.id));
    applyButton.disabled = !itemSupportedForCurrentCharacter(item, quickFavoriteKind());
    applyButton.addEventListener("click", () => setQuickFavoriteItem(item.id));
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "quick-favorite-remove";
    removeButton.textContent = "×";
    removeButton.title = "移除最愛";
    removeButton.setAttribute("aria-label", `從單件最愛移除 ${shortItemName(item, quickFavoriteKind())}`);
    removeButton.addEventListener("click", () => {
      quickFavorites[quickFavoriteSlot] = ids.filter((id) => String(id) !== String(item.id));
      saveQuickFavorites();
      syncQuickFavoriteButtons();
      renderQuickFavoritePanel();
    });
    row.append(applyButton, removeButton);
    quickFavoriteList.appendChild(row);
  }
}

function openQuickFavoritePanel(slot) {
  if (!quickFavoritePanel) {
    return;
  }
  quickFavoriteSlot = slot;
  quickFavoritePanel.hidden = false;
  renderQuickFavoritePanel();
  syncQuickFavoriteButtons();
}

function closeQuickFavoritePanel() {
  if (quickFavoritePanel) {
    quickFavoritePanel.hidden = true;
  }
  syncQuickFavoriteButtons();
}

function addCurrentQuickFavorite() {
  const item = currentQuickFavoriteItem();
  if (!item) {
    return;
  }
  const ids = quickFavorites[quickFavoriteSlot] || [];
  if (!ids.includes(String(item.id))) {
    quickFavorites[quickFavoriteSlot] = [...ids, String(item.id)];
    saveQuickFavorites();
  }
  syncQuickFavoriteButtons();
  renderQuickFavoritePanel();
}

function browserItems() {
  const items = state.browserKind === "cape" ? (state.data.capes || []) : (state.data.headgear || []);
  return items.filter((item) => itemSupportedForCurrentCharacter(item, state.browserKind));
}

function loadItemBrowserFavorites() {
  try {
    const values = JSON.parse(localStorage.getItem(itemBrowserFavoritesKey) || "[]");
    return new Set(Array.isArray(values) ? values.map(String) : []);
  } catch (_error) {
    return new Set();
  }
}

function saveItemBrowserFavorites() {
  try {
    localStorage.setItem(itemBrowserFavoritesKey, JSON.stringify([...itemBrowserFavorites]));
  } catch (_error) {
    // Favorites remain available for the current session when storage is unavailable.
  }
}

function itemBrowserFavoriteKey(item, kind = state.browserKind) {
  return `${kind}:${item?.id}`;
}

function isItemBrowserFavorite(item, kind = state.browserKind) {
  return Boolean(item && itemBrowserFavorites.has(itemBrowserFavoriteKey(item, kind)));
}

function toggleItemBrowserFavorite(item, kind = state.browserKind) {
  const key = itemBrowserFavoriteKey(item, kind);
  if (itemBrowserFavorites.has(key)) {
    itemBrowserFavorites.delete(key);
  } else {
    itemBrowserFavorites.add(key);
  }
  saveItemBrowserFavorites();
  if (itemBrowserFilter === "favorite") {
    refreshItemBrowser();
    return;
  }
  const card = [...itemResults.querySelectorAll(".item-card")]
    .find((candidate) => candidate.dataset.itemId === String(item.id) && candidate.dataset.itemKind === kind);
  const button = card?.querySelector(".item-favorite");
  if (button) {
    const active = isItemBrowserFavorite(item, kind);
    button.classList.toggle("active", active);
    button.textContent = active ? "★" : "☆";
  }
}

function itemIsSelected(item) {
  if (!item) {
    return false;
  }
  if (itemBrowserSlot === "cape") {
    return String(state.cape) === String(item.id);
  }
  return String(state.headgearSlots[Number(itemBrowserSlot)] || "none") === String(item.id);
}

function selectBrowserItem(item) {
  if (!item) {
    return;
  }
  if (itemBrowserSlot === "cape") {
    state.cape = String(item.id);
  } else {
    state.headgearSlots[Number(itemBrowserSlot)] = String(item.id);
  }
  refreshEquipmentSelects();
  syncItemBrowserSelection();
  prepareAndDraw();
}

function closeItemBrowserDetail() {
  itemBrowserDetailItem = null;
  itemBrowserDialog?.classList.remove("has-detail");
  itemBrowserContent?.classList.remove("has-detail");
  if (itemBrowserDetail) {
    itemBrowserDetail.hidden = true;
    itemBrowserDetail.replaceChildren();
  }
  itemResults?.querySelectorAll(".item-info.active").forEach((button) => button.classList.remove("active"));
}

function appendItemDetailRow(container, label, value) {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) {
    return;
  }
  const row = document.createElement("div");
  row.className = "item-detail-row";
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = Array.isArray(value) ? value.join(" / ") : String(value);
  row.append(term, description);
  container.appendChild(row);
}

function showItemBrowserDetail(item, kind = state.browserKind) {
  if (!itemBrowserDetail || !item) {
    return;
  }
  itemBrowserDetailItem = { item, kind };
  itemBrowserDialog?.classList.add("has-detail");
  itemBrowserDetail.hidden = false;
  itemBrowserContent?.classList.add("has-detail");
  itemBrowserDetail.replaceChildren();

  const head = document.createElement("header");
  const title = document.createElement("strong");
  title.textContent = "物品資訊 (Item Details)";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "item-detail-close";
  close.textContent = "×";
  close.title = "關閉資訊 (Close details)";
  close.setAttribute("aria-label", close.title);
  close.addEventListener("click", closeItemBrowserDetail);
  head.append(title, close);

  const thumb = document.createElement("div");
  thumb.className = "item-detail-thumb";
  const image = document.createElement("img");
  const paths = itemThumbnailPaths(item, kind);
  image.src = paths.primary;
  image.alt = "";
  image.addEventListener("error", () => {
    if (!image.dataset.fallbackUsed) {
      image.dataset.fallbackUsed = "1";
      image.src = paths.fallback;
      return;
    }
    image.hidden = true;
  });
  thumb.appendChild(image);

  const name = document.createElement("h3");
  name.textContent = shortItemName(item, kind);
  const meta = itemMetaFor(item, kind) || {};
  const flags = itemFlagLabels(item, kind);
  const tags = document.createElement("div");
  tags.className = "item-detail-tags";
  for (const flag of flags) {
    const tag = document.createElement("span");
    tag.className = `item-tag ${flag}`;
    tag.textContent = trText(flag);
    tags.appendChild(tag);
  }
  for (const slot of meta.slots || []) {
    const tag = document.createElement("span");
    tag.className = "item-tag slot";
    tag.textContent = slot;
    tags.appendChild(tag);
  }

  const details = document.createElement("dl");
  details.className = "item-detail-list";
  appendItemDetailRow(details, "View ID", item.id);
  appendItemDetailRow(details, "Item ID", meta.itemids?.length ? meta.itemids : meta.primary_itemid);
  appendItemDetailRow(details, "Const", meta.const || item.const);
  appendItemDetailRow(details, "Sprite", meta.sprite);
  appendItemDetailRow(details, "名稱 (Names)", meta.names);

  const actions = document.createElement("div");
  actions.className = "item-detail-actions";
  const equip = document.createElement("button");
  equip.type = "button";
  equip.className = "primary";
  equip.textContent = "套用 (Equip)";
  equip.addEventListener("click", () => selectBrowserItem(item));
  actions.appendChild(equip);
  if (meta.detail_url) {
    const link = document.createElement("a");
    link.href = meta.detail_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Divine Pride";
    actions.appendChild(link);
  }

  itemBrowserDetail.append(head, thumb, name);
  if (tags.childElementCount) {
    itemBrowserDetail.appendChild(tags);
  }
  itemBrowserDetail.append(details, actions);
  itemResults?.querySelectorAll(".item-info").forEach((button) => {
    button.classList.toggle(
      "active",
      button.closest(".item-card")?.dataset.itemId === String(item.id)
        && button.closest(".item-card")?.dataset.itemKind === kind,
    );
  });
}

const ITEM_THUMBNAIL_BASE = "paperdoll_v2/web/thumbnails";

function itemThumbnailPaths(item, kind = state.browserKind) {
  const id = encodeURIComponent(String(item.id));
  const sex = state.sex === "male" ? "male" : "female";
  if (kind === "cape") {
    const otherSex = sex === "male" ? "female" : "male";
    return {
      primary: `${ITEM_THUMBNAIL_BASE}/capes/${sex}/a0/${id}.png`,
      fallback: `${ITEM_THUMBNAIL_BASE}/capes/${otherSex}/a0/${id}.png`,
    };
  }
  return {
    primary: `${ITEM_THUMBNAIL_BASE}/headgear/plain/a0/${id}.png`,
    fallback: `${ITEM_THUMBNAIL_BASE}/headgear/${sex}/a0/${id}.png`,
  };
}

function observeItemThumbnails() {
  itemThumbnailObserver?.disconnect();
  const images = [...itemResults.querySelectorAll("img[data-src]")];
  const loadThumbnail = (image) => {
    image.src = image.dataset.src;
    image.removeAttribute("data-src");
  };
  if (!("IntersectionObserver" in window)) {
    images.forEach(loadThumbnail);
    return;
  }
  itemThumbnailObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      itemThumbnailObserver.unobserve(entry.target);
      loadThumbnail(entry.target);
    }
  }, { root: itemResults, rootMargin: "120px" });
  images.forEach((image) => itemThumbnailObserver.observe(image));
}

function createItemBrowserCard(item) {
  const kind = state.browserKind;
  const card = document.createElement("div");
  card.className = "item-card";
  card.classList.toggle("active", itemIsSelected(item));
  card.dataset.itemId = String(item.id);
  card.dataset.itemKind = kind;
  card.tabIndex = 0;
  card.setAttribute("role", "button");

  const favorite = document.createElement("button");
  favorite.type = "button";
  favorite.className = "item-favorite";
  favorite.classList.toggle("active", isItemBrowserFavorite(item, kind));
  favorite.textContent = favorite.classList.contains("active") ? "★" : "☆";
  favorite.title = "收藏 (Favorite)";
  favorite.setAttribute("aria-label", "收藏物品");
  favorite.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleItemBrowserFavorite(item, kind);
  });

  const info = document.createElement("button");
  info.type = "button";
  info.className = "item-info";
  info.textContent = "ⓘ";
  info.title = "物品資訊 (Item details)";
  info.setAttribute("aria-label", info.title);
  info.addEventListener("click", (event) => {
    event.stopPropagation();
    if (itemBrowserDetailItem?.kind === kind && String(itemBrowserDetailItem.item?.id) === String(item.id)) {
      closeItemBrowserDetail();
      return;
    }
    showItemBrowserDetail(item, kind);
  });

  const thumb = document.createElement("span");
  thumb.className = "item-thumb";
  const thumbImage = document.createElement("img");
  const thumbPaths = itemThumbnailPaths(item, kind);
  thumbImage.dataset.src = thumbPaths.primary;
  thumbImage.dataset.fallback = thumbPaths.fallback;
  thumbImage.alt = "";
  thumbImage.loading = "lazy";
  thumbImage.addEventListener("error", () => {
    if (!thumbImage.dataset.fallbackUsed && thumbImage.dataset.fallback) {
      thumbImage.dataset.fallbackUsed = "1";
      thumbImage.src = thumbImage.dataset.fallback;
      return;
    }
    thumbImage.hidden = true;
  });
  thumb.appendChild(thumbImage);

  const id = document.createElement("span");
  id.className = "item-id";
  const metaInfo = itemMetaFor(item, kind);
  id.textContent = metaInfo?.primary_itemid ? `${item.id} / ${metaInfo.primary_itemid}` : String(item.id);
  const name = document.createElement("strong");
  name.textContent = shortItemName(item, kind);
  const meta = document.createElement("span");
  meta.className = "item-meta";
  const slotText = metaInfo?.slots?.length ? ` · ${metaInfo.slots.join("/")}` : "";
  meta.textContent = `${item.const || " "}${slotText}`;
  card.title = itemDisplayName(item, kind);

  const content = [favorite, info, thumb, id];
  const flags = itemFlagLabels(item, kind);
  if (flags.length) {
    const tagRow = document.createElement("span");
    tagRow.className = "item-tags";
    for (const flag of flags) {
      const tag = document.createElement("span");
      tag.className = `item-tag ${flag}`;
      tag.textContent = trText(flag);
      tagRow.appendChild(tag);
    }
    content.push(tagRow);
  }
  content.push(name, meta);
  card.append(...content);
  card.addEventListener("click", () => selectBrowserItem(item));
  card.addEventListener("keydown", (event) => {
    if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }
    event.preventDefault();
    selectBrowserItem(item);
  });
  return card;
}

function syncItemBrowserSelection() {
  itemResults?.querySelectorAll(".item-card").forEach((card) => {
    const selected = itemBrowserSlot === "cape"
      ? String(state.cape) === card.dataset.itemId
      : String(state.headgearSlots[Number(itemBrowserSlot)] || "none") === card.dataset.itemId;
    card.classList.toggle("active", selected);
  });
}

function updateItemBrowserCount() {
  if (itemBrowserCount) {
    itemBrowserCount.textContent = `顯示 ${itemBrowserRenderedCount} / ${itemBrowserMatches.length}`;
  }
}

function appendItemBrowserBatch() {
  itemBrowserLoadObserver?.disconnect();
  itemResults.querySelector(".item-load-more")?.remove();
  const end = Math.min(itemBrowserRenderedCount + itemBrowserBatchSize, itemBrowserMatches.length);
  const fragment = document.createDocumentFragment();
  for (const item of itemBrowserMatches.slice(itemBrowserRenderedCount, end)) {
    fragment.appendChild(createItemBrowserCard(item));
  }
  itemResults.appendChild(fragment);
  itemBrowserRenderedCount = end;
  updateItemBrowserCount();
  observeItemThumbnails();

  if (itemBrowserRenderedCount >= itemBrowserMatches.length) {
    return;
  }
  const more = document.createElement("button");
  more.type = "button";
  more.className = "item-load-more";
  more.textContent = "載入更多 (Load more)";
  more.addEventListener("click", appendItemBrowserBatch);
  itemResults.appendChild(more);
  if (!("IntersectionObserver" in window)) {
    return;
  }
  itemBrowserLoadObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      appendItemBrowserBatch();
    }
  }, { root: itemResults, rootMargin: "180px" });
  itemBrowserLoadObserver.observe(more);
}

function refreshItemBrowser() {
  if (!itemResults || !itemBrowserDialog?.open) {
    return;
  }
  const query = itemSearch?.value.trim() || "";
  itemBrowserMatches = browserItems()
    .filter((item) => itemMatchesQuery(item, query, state.browserKind))
    .filter((item) => itemMatchesEquipmentFilter(item, state.browserKind, itemBrowserFilter))
    .sort((left, right) => Number(isItemBrowserFavorite(right, state.browserKind)) - Number(isItemBrowserFavorite(left, state.browserKind)));
  itemBrowserRenderedCount = 0;
  itemThumbnailObserver?.disconnect();
  itemBrowserLoadObserver?.disconnect();
  itemResults.replaceChildren();
  itemResults.scrollTop = 0;
  updateItemBrowserCount();
  if (!itemBrowserMatches.length) {
    closeItemBrowserDetail();
    const empty = document.createElement("p");
    empty.className = "item-empty";
    empty.textContent = trText("noResults");
    itemResults.appendChild(empty);
    return;
  }
  appendItemBrowserBatch();
  if (itemBrowserDetailItem) {
    const detailStillVisible = itemBrowserMatches.some((candidate) => (
      String(candidate.id) === String(itemBrowserDetailItem.item?.id)
    ));
    if (detailStillVisible && itemBrowserDetailItem.kind === state.browserKind) {
      showItemBrowserDetail(itemBrowserDetailItem.item, itemBrowserDetailItem.kind);
    } else {
      closeItemBrowserDetail();
    }
  }
}

function syncItemBrowserControls() {
  itemBrowserSlotButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.browserSlot === itemBrowserSlot);
  });
  itemBrowserFilterButtons.forEach((button) => {
    const filter = button.dataset.browserFilter || "all";
    button.classList.toggle("active", filter === itemBrowserFilter);
    button.disabled = itemBrowserSlot === "cape" && ["top", "mid", "low"].includes(filter);
  });
}

function setItemBrowserSlot(slot) {
  itemBrowserSlot = slot === "cape" ? "cape" : String(Math.min(2, Math.max(0, Number(slot) || 0)));
  state.browserKind = itemBrowserSlot === "cape" ? "cape" : "headgear";
  if (itemBrowserDetailItem?.kind !== state.browserKind) {
    closeItemBrowserDetail();
  }
  if (itemBrowserSlot === "cape" && ["top", "mid", "low"].includes(itemBrowserFilter)) {
    itemBrowserFilter = "all";
  }
  syncItemBrowserControls();
  refreshItemBrowser();
}

function clearItemBrowserSlot() {
  if (itemBrowserSlot === "cape") {
    state.cape = "none";
  } else {
    state.headgearSlots[Number(itemBrowserSlot)] = "none";
  }
  refreshEquipmentSelects();
  syncItemBrowserSelection();
  prepareAndDraw();
}

function openItemBrowser() {
  if (!itemBrowserDialog || itemBrowserDialog.open) {
    return;
  }
  setItemBrowserSlot(itemBrowserSlot);
  itemBrowserDialog.showModal();
  refreshItemBrowser();
  window.setTimeout(() => itemSearch?.focus(), 0);
}

function refreshEquipmentSelects() {
  headgearSelects.forEach((select, index) => {
    fillItemSelect(select, state.data.headgear || [], state.headgearSlots[index], headgearFilter.value.trim(), trText("costumeNone", index + 1), "headgear");
  });
  fillItemSelect(capeSelect, state.data.capes || [], state.cape, capeFilter.value.trim(), trText("none"), "cape");
  refreshWornPanel();
}

function refreshColorSelect(select, items, value) {
  if (!select) {
    return;
  }
  select.disabled = false;
  select.replaceChildren();
  for (const item of items || []) {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.label;
    select.appendChild(option);
  }
  select.value = value;
}

function bodyColorOptionsForCurrentPart() {
  const allColors = state.data.bodyColors || [];
  const part = state.data.parts?.[selectedJobBodyPartKey()];
  const variants = part?.palette?.variants || {};
  const available = new Set(Object.keys(variants).map(String));
  if (part?.palette?.base) {
    available.add("0");
  }
  if (!available.size) {
    return allColors.filter((item) => String(item.id) === "0");
  }
  return allColors.filter((item) => available.has(String(item.id)));
}

function normalizeBodyColorForCurrentPart() {
  const options = bodyColorOptionsForCurrentPart();
  if (!options.some((item) => String(item.id) === String(state.bodyColor))) {
    state.bodyColor = String(options[0]?.id ?? "0");
    return true;
  }
  return false;
}

function refreshColorSelects() {
  refreshColorSelect(bodyColorSelect, bodyColorOptionsForCurrentPart(), state.bodyColor);
  refreshColorSelect(hairColorSelect, state.data.hairColors || [], state.hairColor);
}

function refreshJobSelect() {
  jobSelect.replaceChildren();
  const categoryOrder = [
    "初心者",
    "一轉",
    "二轉",
    "進階二轉",
    "三轉",
    "四轉",
    "擴充一轉",
    "擴充二轉",
    "擴充四轉",
    "其他",
  ];
  const jobs = displayableJobsForSex();
  const jobCategories = new Set(jobs.map((job) => job.category || "其他"));
  const groups = new Map();
  for (const category of categoryOrder) {
    if (!jobCategories.has(category)) {
      continue;
    }
    const group = document.createElement("optgroup");
    group.label = category;
    groups.set(category, group);
    jobSelect.appendChild(group);
  }
  for (const job of jobs) {
    const category = job.category || "其他";
    if (!groups.has(category)) {
      const group = document.createElement("optgroup");
      group.label = category;
      groups.set(category, group);
      jobSelect.appendChild(group);
    }
    const option = document.createElement("option");
    option.value = job.key;
    option.textContent = `${category} - ${job.label}`;
    groups.get(category).appendChild(option);
  }
  if (!selectedJob() && jobs.length) {
    state.job = jobs[0].key;
  }
  ensureSelectedJobSupportsSex();
  jobSelect.value = state.job;
}

function refreshMountSelect() {
  if (!mountSelect) {
    return;
  }
  normalizeJobModes();
  mountSelect.replaceChildren();
  const none = document.createElement("option");
  none.value = "none";
  none.textContent = "無 (None)";
  mountSelect.appendChild(none);

  const groupLabels = {
    job: "職業騎乘 (Job Mount)",
    general: "通用坐騎 (General Mount)",
    special: "機甲／特殊載具 (Special Vehicle)",
  };
  const groups = new Map();
  for (const mount of mountOptionsForJob()) {
    const groupKey = mount.group || "general";
    let group = groups.get(groupKey);
    if (!group) {
      group = document.createElement("optgroup");
      group.label = groupLabels[groupKey] || groupLabels.general;
      groups.set(groupKey, group);
      mountSelect.appendChild(group);
    }
    const option = document.createElement("option");
    option.value = mount.key;
    option.textContent = mount.label || mount.key;
    group.appendChild(option);
  }
  mountSelect.value = state.mount;
  mountSelect.disabled = mountOptionsForJob().length === 0;
  refreshMountButtons();
}

function refreshMountButtons() {
  if (!mountButtons) {
    return;
  }
  const mounts = mountOptionsForJob();
  const activeMount = selectedMountOption();
  const activeCategory = mountCategory(activeMount);
  mountButtons.querySelectorAll("[data-mount-category]").forEach((button) => {
    const category = button.dataset.mountCategory;
    const categoryMounts = mounts.filter((mount) => mountCategory(mount) === category);
    const available = categoryMounts.length > 0;
    button.disabled = !available;
    button.classList.toggle("active", available && activeCategory === category);
    if (!available) {
      button.title = tr("text", "modeUnavailable");
      return;
    }
    if (categoryMounts.length > 1) {
      const labels = categoryMounts.map((mount) => mount.label || mount.key).join(" → ");
      button.title = `點擊依序切換：${labels} → 關閉`;
      button.setAttribute("aria-label", button.title);
      return;
    }
    button.title = activeMount === categoryMounts[0]
      ? `${categoryMounts[0].label || categoryMounts[0].key}；再次點擊關閉`
      : categoryMounts[0].label || "";
    button.setAttribute("aria-label", button.title || button.textContent);
  });
}

function refreshHairSelect() {
  hairSelect.replaceChildren();
  const hairstyles = hairstylesForCurrentRace();
  for (const hair of hairstyles) {
    if (!hair.parts?.[state.sex]) {
      continue;
    }
    const option = document.createElement("option");
    option.value = String(hair.id);
    option.textContent = hair.label;
    hairSelect.appendChild(option);
  }
  const selected = hairstyles.find((hair) => String(hair.id) === String(state.hairstyle));
  if (!selected?.parts?.[state.sex] && hairstyles.length) {
    const fallback = hairstyles.find((hair) => hair.parts?.[state.sex]);
    if (fallback) {
      state.hairstyle = String(fallback.id);
    }
  }
  hairSelect.value = state.hairstyle;
}

function visiblePartKeys() {
  const keys = [selectedJobBodyPartKey(), selectedHairPartKey(), ...selectedHeadgearPartKeys()];
  const capePart = selectedCapePartKey();
  if (capePart) {
    keys.push(capePart);
  }
  return keys.filter(Boolean);
}

async function prepareAndDraw() {
  resetRenderFitScale();
  await Promise.all(visiblePartKeys().map((partKey) => ensurePartImages(partKey)));
  normalizeBodyColorForCurrentPart();
  refreshColorSelects();
  syncControls();
  draw();
  saveLocalState();
}

async function setAction(action) {
  state.action = String(action);
  state.frame = 0;
  state.wearableFrame = 0;
  state.lastWearableTick = performance.now();
  await prepareAndDraw();
  if (state.status === "dead" && !state.playing) {
    state.frame = Math.max(0, visibleFrameCount() - 1);
    state.wearableFrame = state.frame;
    syncControls();
    draw();
    saveLocalState();
  }
}

function setStatus(status) {
  state.status = status;
  if (!faceControlsEnabled()) {
    state.faceDirection = "center";
  }
  setAction(actionFor(state.status, state.direction));
}

function setDirection(direction) {
  state.direction = Number(direction);
  setAction(actionFor(state.status, state.direction));
}

function advanceAnimationFrame() {
  const frameCount = visibleFrameCount();
  if (frameCount <= 1) {
    return false;
  }
  if (state.status === "dead" && state.frame >= frameCount - 1) {
    state.playing = false;
    return true;
  }
  state.frame = (state.frame + 1) % frameCount;
  return true;
}

function advanceWearableFrame() {
  const frameCount = wearableMotionFrameCount();
  if (frameCount <= 1) {
    state.wearableFrame = 0;
    return false;
  }
  state.wearableFrame = (state.wearableFrame + 1) % frameCount;
  return true;
}

function togglePlayback() {
  if (state.status === "dead") {
    return;
  }
  if (!state.playing && state.status === "dead" && state.frame >= visibleFrameCount() - 1) {
    state.frame = -1;
    state.wearableFrame = 0;
  }
  state.playing = !state.playing;
  state.lastTick = performance.now();
  if (state.playing) {
    advanceAnimationFrame();
    prepareAndDraw();
    return;
  }
  syncControls();
  draw();
  saveLocalState();
}

function tick(timestamp) {
  let shouldDraw = false;
  let shouldSyncControls = false;
  if (state.playing && timestamp - state.lastTick >= state.frameMs) {
    if (advanceAnimationFrame()) {
      state.lastTick = timestamp;
      shouldDraw = true;
      shouldSyncControls = true;
    }
  }
  if (independentWearableMotionActive() && timestamp - state.lastWearableTick >= state.frameMs) {
    if (advanceWearableFrame()) {
      state.lastWearableTick = timestamp;
      shouldDraw = true;
    }
  }
  if (shouldDraw) {
    if (shouldSyncControls) {
      syncControls();
    }
    draw();
  }
  window.requestAnimationFrame(tick);
}

function setZoom(value) {
  state.zoom = Math.min(zoomMax, Math.max(zoomMin, Math.round(Number(value) * 10) / 10));
  syncControls();
  draw();
  saveLocalState();
}

async function imageFromSource(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  if (image.decode) {
    await image.decode();
  } else {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
  }
  return image;
}

async function setCustomBackgroundFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await imageFromSource(sourceUrl);
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const work = document.createElement("canvas");
    work.width = Math.max(1, Math.round(image.naturalWidth * scale));
    work.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const workCtx = work.getContext("2d");
    workCtx.drawImage(image, 0, 0, work.width, work.height);
    state.customBackgroundData = work.toDataURL("image/webp", 0.86);
    localStorage.setItem(customBackgroundStorageKey, state.customBackgroundData);
    state.previewBackground = "custom-image";
    state.backgroundOffsetX = 0;
    state.backgroundOffsetY = 0;
    if (backgroundSelect) {
      backgroundSelect.value = state.previewBackground;
    }
    applyPreviewBackground();
    saveLocalState();
    notifyStatus("自訂背景已載入 (Custom background loaded)");
  } catch (error) {
    console.error(error);
    notifyStatus("無法讀取背景圖片 (Unable to load image)");
  } finally {
    URL.revokeObjectURL(sourceUrl);
    if (backgroundFile) {
      backgroundFile.value = "";
    }
  }
}

function readCloset() {
  try {
    const saved = JSON.parse(localStorage.getItem(closetStorageKey) || "[]");
    return Array.isArray(saved) ? saved.slice(0, 24) : [];
  } catch (_) {
    return [];
  }
}

function writeCloset(items) {
  try {
    localStorage.setItem(closetStorageKey, JSON.stringify(items.slice(0, 24)));
    return true;
  } catch (error) {
    console.error(error);
    notifyStatus("衣櫃儲存失敗 (Closet storage failed)");
    return false;
  }
}

function defaultClosetName() {
  const equipped = [
    ...state.headgearSlots.map((_, index) => headgearEntryAt(index)),
    selectedCapeEntry(),
  ].filter(Boolean);
  if (equipped.length) {
    return shortItemName(equipped[0], equipped[0] === selectedCapeEntry() ? "cape" : "headgear");
  }
  return selectedJob()?.label || "紙娃娃穿搭";
}

function refreshCloset() {
  if (!closetList) {
    return;
  }
  const saved = readCloset();
  if (!saved.length) {
    const empty = document.createElement("span");
    empty.className = "closet-empty";
    empty.textContent = "尚未收藏穿搭 (No saved looks)";
    closetList.replaceChildren(empty);
    return;
  }
  const rows = saved.map((entry) => {
    const row = document.createElement("div");
    row.className = "closet-row";
    const load = document.createElement("button");
    load.type = "button";
    load.className = "closet-load";
    load.dataset.closetLoad = entry.id;
    load.textContent = entry.name || "未命名穿搭";
    load.title = "套用穿搭 (Apply Look)";
    const manage = document.createElement("select");
    manage.className = "closet-manage";
    manage.dataset.closetManage = entry.id;
    manage.dataset.noWheel = "true";
    manage.title = "管理穿搭 (Manage Look)";
    manage.setAttribute("aria-label", `${manage.title}: ${load.textContent}`);
    for (const [value, label] of [
      ["", "⋯"],
      ["overwrite", "覆蓋 (Overwrite)"],
      ["rename", "重新命名 (Rename)"],
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      manage.appendChild(option);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "closet-remove";
    remove.dataset.closetRemove = entry.id;
    remove.textContent = "×";
    remove.title = "刪除穿搭 (Delete Look)";
    remove.setAttribute("aria-label", `${remove.title}: ${load.textContent}`);
    row.append(load, manage, remove);
    return row;
  });
  closetList.replaceChildren(...rows);
}

function saveCurrentLook() {
  const items = readCloset();
  const typedName = closetName?.value.trim();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: typedName || defaultClosetName(),
    state: statePayload(),
  });
  writeCloset(items);
  if (closetName) {
    closetName.value = "";
  }
  refreshCloset();
  notifyStatus("穿搭已收藏 (Look saved)");
}

function overwriteClosetLook(id) {
  const items = readCloset();
  const entry = items.find((item) => item.id === id);
  if (!entry) {
    return;
  }
  entry.state = statePayload();
  if (writeCloset(items)) {
    refreshCloset();
    notifyStatus(`已覆蓋：${entry.name} (Look overwritten)`);
  }
}

function renameClosetLook(id) {
  const items = readCloset();
  const entry = items.find((item) => item.id === id);
  if (!entry) {
    return;
  }
  const nextName = window.prompt("新的穿搭名稱 (New look name)", entry.name || "");
  if (nextName === null) {
    return;
  }
  const normalized = nextName.trim().slice(0, 32);
  if (!normalized) {
    notifyStatus("穿搭名稱不可空白 (Look name is required)");
    return;
  }
  entry.name = normalized;
  if (writeCloset(items)) {
    refreshCloset();
    notifyStatus(`已重新命名：${normalized} (Look renamed)`);
  }
}

async function applyClosetLook(id) {
  const entry = readCloset().find((item) => item.id === id);
  if (!entry?.state) {
    return;
  }
  state.playing = false;
  applyStatePayload(entry.state);
  normalizeState();
  refreshJobSelect();
  refreshMountSelect();
  refreshHairSelect();
  refreshColorSelects();
  refreshEquipmentSelects();
  refreshBackgroundSelect();
  await prepareAndDraw();
  notifyStatus(`已套用：${entry.name} (Look applied)`);
}

function removeClosetLook(id) {
  writeCloset(readCloset().filter((item) => item.id !== id));
  refreshCloset();
  notifyStatus("穿搭已刪除 (Look deleted)");
}

function exportClosetJson() {
  const payload = {
    format: "nori-paperdoll-closet",
    version: 2,
    exportedAt: new Date().toISOString(),
    looks: readCloset(),
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "nori-paperdoll-closet.json";
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  notifyStatus("衣櫃 JSON 已匯出 (Closet exported)");
}

function sanitizeImportedLook(entry, index) {
  if (!entry || typeof entry !== "object" || !entry.state || typeof entry.state !== "object") {
    return null;
  }
  const name = String(entry.name || `匯入穿搭 ${index + 1}`).trim().slice(0, 32);
  return {
    id: String(entry.id || `import-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`),
    name: name || `匯入穿搭 ${index + 1}`,
    state: { ...entry.state },
  };
}

async function importClosetJson(file) {
  if (!file) {
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const source = Array.isArray(parsed) ? parsed : parsed?.looks;
    if (!Array.isArray(source)) {
      throw new Error("Invalid closet JSON");
    }
    const imported = source.map(sanitizeImportedLook).filter(Boolean);
    if (!imported.length) {
      throw new Error("No valid looks");
    }
    const merged = [...imported, ...readCloset()];
    const seen = new Set();
    const unique = merged.filter((entry) => {
      if (seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
    if (writeCloset(unique)) {
      refreshCloset();
      notifyStatus(`已匯入 ${imported.length} 套穿搭 (Looks imported)`);
    }
  } catch (error) {
    console.error(error);
    notifyStatus("衣櫃 JSON 格式不正確 (Invalid closet JSON)");
  } finally {
    if (importClosetFile) {
      importClosetFile.value = "";
    }
  }
}

function drawCover(exportCtx, image, width, height, offsetX = 0, offsetY = 0) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  exportCtx.drawImage(
    image,
    ((width - drawWidth) / 2) + offsetX,
    ((height - drawHeight) / 2) + offsetY,
    drawWidth,
    drawHeight,
  );
}

async function drawExportBackground(exportCtx, width, height, mode = "current", outputScale = 1) {
  if (mode === "transparent") {
    return;
  }
  const bg = backgroundById(state.previewBackground);
  if (!bg || bg.type === "checkerboard") {
    return;
  }
  if (bg.type === "color" || bg.type === "custom-color") {
    exportCtx.fillStyle = bg.value || state.backgroundColor;
    exportCtx.fillRect(0, 0, width, height);
    return;
  }
  if (bg.type === "custom-image") {
    exportCtx.fillStyle = state.backgroundColor;
    exportCtx.fillRect(0, 0, width, height);
    if (bg.src) {
      drawCover(
        exportCtx,
        await imageFromSource(bg.src),
        width,
        height,
        state.backgroundOffsetX * outputScale,
        state.backgroundOffsetY * outputScale,
      );
    }
    return;
  }
  if (bg.type === "texture" && bg.src) {
    const image = await imageFromSource(appUrl(bg.src));
    const sizes = String(bg.size || "256px 256px").match(/[0-9.]+/g) || [256, 256];
    const tileWidth = (Number(sizes[0]) || 256) * outputScale;
    const tileHeight = (Number(sizes[1] || sizes[0]) || Number(sizes[0]) || 256) * outputScale;
    const centerX = ((width - tileWidth) / 2) + (state.backgroundOffsetX * outputScale);
    const centerY = ((height - tileHeight) / 2) + (state.backgroundOffsetY * outputScale);
    const startX = centerX % tileWidth - tileWidth;
    const startY = centerY % tileHeight - tileHeight;
    for (let y = startY; y < height; y += tileHeight) {
      for (let x = startX; x < width; x += tileWidth) {
        exportCtx.drawImage(image, x, y, tileWidth, tileHeight);
      }
    }
  }
}

async function drawEffectLayerForExport(exportCtx, layer, originRect, outputScale = 1) {
  for (const image of layer?.querySelectorAll("img, canvas") || []) {
    try {
      if (image.decode) {
        await image.decode();
      }
      const rect = image.getBoundingClientRect();
      exportCtx.save();
      exportCtx.globalAlpha = Number(getComputedStyle(image).opacity || 1);
      exportCtx.globalCompositeOperation = image.dataset.composite === "plus-lighter" ? "lighter" : "source-over";
      exportCtx.drawImage(
        image,
        (rect.left - originRect.left) * outputScale,
        (rect.top - originRect.top) * outputScale,
        rect.width * outputScale,
        rect.height * outputScale,
      );
      exportCtx.restore();
    } catch (error) {
      console.warn("Effect frame could not be exported", error);
    }
  }
}

function drawShadowForExport(exportCtx, originRect, outputScale = 1) {
  if (!state.showShadow || !paperdollShadow || paperdollShadow.classList.contains("is-hidden")) {
    return;
  }
  const rect = paperdollShadow.getBoundingClientRect();
  const centerX = (rect.left - originRect.left + rect.width / 2) * outputScale;
  const centerY = (rect.top - originRect.top + rect.height / 2) * outputScale;
  const radiusX = rect.width * outputScale / 2;
  const radiusY = rect.height * outputScale / 2;
  exportCtx.save();
  exportCtx.translate(centerX, centerY);
  exportCtx.scale(radiusX, radiusY);
  exportCtx.beginPath();
  exportCtx.arc(0, 0, 1, 0, Math.PI * 2);
  exportCtx.fillStyle = "rgba(26, 32, 44, 0.28)";
  exportCtx.fill();
  exportCtx.restore();
}

async function composeStageExport(stageSize, backgroundMode, includeInfo = false) {
  const outputScale = stageSize / previewWrap.clientWidth;
  const infoHeight = includeInfo ? 74 * outputScale : 0;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = stageSize;
  exportCanvas.height = stageSize + infoHeight;
  const exportCtx = exportCanvas.getContext("2d", { willReadFrequently: true });
  const wrapRect = previewWrap.getBoundingClientRect();
  const originRect = {
    left: wrapRect.left + previewWrap.clientLeft,
    top: wrapRect.top + previewWrap.clientTop,
  };
  await drawExportBackground(exportCtx, stageSize, stageSize, backgroundMode, outputScale);
  await drawEffectLayerForExport(exportCtx, effectLayerBehind, originRect, outputScale);
  drawShadowForExport(exportCtx, originRect, outputScale);
  const canvasRect = canvas.getBoundingClientRect();
  exportCtx.imageSmoothingEnabled = false;
  exportCtx.drawImage(
    canvas,
    (canvasRect.left - originRect.left) * outputScale,
    (canvasRect.top - originRect.top) * outputScale,
    canvasRect.width * outputScale,
    canvasRect.height * outputScale,
  );
  await drawEffectLayerForExport(exportCtx, effectLayerFront, originRect, outputScale);
  if (includeInfo) {
    drawPngInformation(exportCtx, stageSize, outputScale);
  }
  return exportCanvas;
}

async function copyShareLink() {
  const url = new URL(window.location.href);
  url.hash = stateHash();
  try {
    await navigator.clipboard.writeText(url.toString());
    notifyStatus(trText("shareCopied"));
    showToolbarButtonFeedback(shareButton, "shareDone", "share");
  } catch (_) {
    window.location.hash = url.hash;
    notifyStatus(trText("shareUpdated"));
    showToolbarButtonFeedback(shareButton, "shareUpdatedDone", "share");
  }
}

function truncateCanvasText(exportCtx, text, maxWidth) {
  if (exportCtx.measureText(text).width <= maxWidth) {
    return text;
  }
  let value = text;
  while (value.length > 1 && exportCtx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}…`;
}

function drawPngInformation(exportCtx, stageSize, outputScale) {
  const infoTop = stageSize;
  const infoHeight = 74 * outputScale;
  const padding = 10 * outputScale;
  const maxWidth = stageSize - (padding * 2);
  const costumeNames = state.headgearSlots.map((_, index) => {
    const item = headgearEntryAt(index);
    return item ? shortItemName(item, "headgear") : trText("none");
  });
  const cape = selectedCapeEntry();
  const jobName = selectedJob()?.label || tr("label", "job");
  const sexName = tr("button", state.sex) || sexLabels.get(state.sex) || state.sex;
  exportCtx.fillStyle = "rgba(255, 255, 255, 0.94)";
  exportCtx.fillRect(0, infoTop, stageSize, infoHeight);
  exportCtx.strokeStyle = "#d7dee8";
  exportCtx.lineWidth = Math.max(1, outputScale);
  exportCtx.beginPath();
  exportCtx.moveTo(0, infoTop + 0.5);
  exportCtx.lineTo(stageSize, infoTop + 0.5);
  exportCtx.stroke();
  exportCtx.fillStyle = "#172033";
  exportCtx.font = `600 ${12 * outputScale}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  exportCtx.fillText(truncateCanvasText(exportCtx, `${sexName} · ${jobName}`, maxWidth), padding, infoTop + (20 * outputScale));
  exportCtx.font = `${10 * outputScale}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  exportCtx.fillStyle = "#516078";
  exportCtx.fillText(
    truncateCanvasText(exportCtx, `服飾 (Costume): ${costumeNames.join(" / ")}`, maxWidth),
    padding,
    infoTop + (40 * outputScale),
  );
  exportCtx.fillText(
    truncateCanvasText(exportCtx, `披肩 (Garment): ${cape ? shortItemName(cape, "cape") : trText("none")}`, maxWidth),
    padding,
    infoTop + (58 * outputScale),
  );
}

function saveExportSettings() {
  try {
    localStorage.setItem(exportStorageKey, JSON.stringify({
      size: state.pngSize,
      background: state.pngBackground,
      includeInfo: state.pngIncludeInfo,
    }));
  } catch (_) {}
}

function loadExportSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(exportStorageKey) || "null");
    if ([256, 512].includes(Number(saved?.size))) state.pngSize = Number(saved.size);
    if (["current", "transparent"].includes(saved?.background)) state.pngBackground = saved.background;
    state.pngIncludeInfo = Boolean(saved?.includeInfo);
  } catch (_) {}
}

function syncPngDialog() {
  document.querySelectorAll("[data-png-size]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.pngSize) === state.pngSize);
  });
  document.querySelectorAll("[data-png-background]").forEach((button) => {
    button.classList.toggle("active", button.dataset.pngBackground === state.pngBackground);
  });
  if (pngIncludeInfo) {
    pngIncludeInfo.checked = state.pngIncludeInfo;
  }
}

function openPngDialog() {
  syncPngDialog();
  if (pngDialog?.showModal) {
    pngDialog.showModal();
  } else {
    saveCurrentPng().catch(console.error);
  }
}

async function saveCurrentPng() {
  const stageSize = state.pngSize;
  const exportCanvas = await composeStageExport(stageSize, state.pngBackground, state.pngIncludeInfo);
  const link = document.createElement("a");
  const job = (selectedJob()?.label || "paperdoll").replace(/[\\/:*?"<>|]+/g, "_");
  link.download = `nori-paperdoll-${job}.png`;
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
  saveExportSettings();
  notifyStatus(trText("pngSaved"));
}

function syncGifDialog() {
  document.querySelectorAll("[data-gif-duration]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.gifDuration) === state.gifDuration);
  });
  document.querySelectorAll("[data-gif-background]").forEach((button) => {
    button.classList.toggle("active", button.dataset.gifBackground === state.gifBackground);
  });
}

function openGifDialog() {
  syncGifDialog();
  gifDialog?.showModal();
}

async function saveCurrentGif() {
  const sampleMs = 100;
  const frameCount = Math.max(1, Math.round(state.gifDuration / sampleMs));
  const saved = {
    frame: state.frame,
    wearableFrame: state.wearableFrame,
    playing: state.playing,
    renderFitScale: state.renderFitScale,
    renderFitBounds: state.renderFitBounds ? { ...state.renderFitBounds } : null,
  };
  saveGifButton.disabled = true;
  notifyStatus(trText("gifSaving"));

  try {
    await effectRuntime?.waitUntilSettled(8000);
    const hasNativeEffect = Boolean(document.querySelector(".effect-runtime-fallback"));
    effectRuntime?.beginCapture();
    state.playing = true;
    state.renderFitScale = null;
    state.renderFitBounds = null;

    const characterFrameCount = Math.max(1, visibleFrameCount());
    for (let index = 0; index < characterFrameCount; index += 1) {
      state.frame = index;
      state.wearableFrame = index;
      draw();
    }

    const rgbaFrames = [];
    for (let index = 0; index < frameCount; index += 1) {
      const elapsed = index * sampleMs;
      state.frame = Math.floor(elapsed / state.frameMs) % characterFrameCount;
      state.wearableFrame = state.frame;
      draw();
      effectRuntime?.captureAt(elapsed);
      const frameCanvas = await composeStageExport(256, state.gifBackground, false);
      rgbaFrames.push(frameCanvas.getContext("2d").getImageData(0, 0, 256, 256).data);
      if (hasNativeEffect && index < frameCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, sampleMs));
      }
    }

    const { GIFEncoder, quantize, applyPalette } = await import(appUrl("vendor/gifenc.esm.js"));
    const gif = GIFEncoder();
    const transparentOutput = state.gifBackground === "transparent";
    for (const rgba of rgbaFrames) {
      const format = transparentOutput ? "rgba4444" : "rgb565";
      const palette = quantize(rgba, 256, transparentOutput
        ? { format, oneBitAlpha: 8, clearAlpha: true }
        : { format });
      const indexed = applyPalette(rgba, palette, format);
      const transparentIndex = transparentOutput
        ? palette.findIndex((color) => color.length > 3 && color[3] === 0)
        : -1;
      gif.writeFrame(indexed, 256, 256, {
        palette,
        delay: sampleMs,
        repeat: 0,
        transparent: transparentIndex >= 0,
        transparentIndex: Math.max(0, transparentIndex),
        dispose: 2,
      });
    }
    gif.finish();
    const blobUrl = URL.createObjectURL(new Blob([gif.bytes()], { type: "image/gif" }));
    const link = document.createElement("a");
    const job = (selectedJob()?.label || "paperdoll").replace(/[\\/:*?"<>|]+/g, "_");
    link.download = `nori-paperdoll-${job}.gif`;
    link.href = blobUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    notifyStatus(trText("gifSaved"));
  } finally {
    effectRuntime?.endCapture();
    state.frame = saved.frame;
    state.wearableFrame = saved.wearableFrame;
    state.playing = saved.playing;
    state.renderFitScale = saved.renderFitScale;
    state.renderFitBounds = saved.renderFitBounds;
    saveGifButton.disabled = false;
    syncControls();
    draw();
  }
}

async function clearWearables() {
  state.headgearSlots = ["none", "none", "none"];
  state.cape = "none";
  state.wearableFrame = 0;
  state.bodyColor = "0";
  state.hairColor = "0";
  state.equipmentFilter = "all";
  if (headgearFilter) {
    headgearFilter.value = "";
  }
  if (capeFilter) {
    capeFilter.value = "";
  }
  if (itemSearch) {
    itemSearch.value = "";
  }
  refreshEquipmentSelects();
  refreshColorSelects();
  await prepareAndDraw();
  notifyStatus(trText("cleared"));
  showToolbarButtonFeedback(clearButton, "clearDone", "clear");
}

function enableSelectWheel(select) {
  if (!select || select.dataset.noWheel === "true") {
    return;
  }
  select.addEventListener("wheel", (event) => {
    if (select.disabled || select.options.length <= 1) {
      return;
    }
    event.preventDefault();
    const direction = event.deltaY > 0 ? 1 : -1;
    let nextIndex = select.selectedIndex;
    for (let step = 0; step < select.options.length; step += 1) {
      nextIndex += direction;
      if (nextIndex < 0 || nextIndex >= select.options.length) {
        return;
      }
      if (!select.options[nextIndex].disabled) {
        select.selectedIndex = nextIndex;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
    }
  }, { passive: false });
}

async function boot() {
  let response = null;
  try {
    response = await fetch(appUrl(`data/paperdoll.bootstrap.json?v=${appVersion}`));
  } catch (error) {
    console.warn("Resource bootstrap request failed; falling back to full manifest", error);
  }
  if (!response?.ok) {
    console.warn("Resource bootstrap unavailable; falling back to full manifest");
    response = await fetch(appUrl(`data/paperdoll.json?v=${appVersion}`));
  }
  if (!response.ok) {
    throw new Error("Paperdoll manifest unavailable");
  }
  state.data = await response.json();
  state.data.parts ||= {};
  try {
    const effectResponse = await fetch(appUrl(`data/effect_bindings.json?v=${appVersion}`));
    if (effectResponse.ok) {
      state.effectBindings = await effectResponse.json();
    }
  } catch (error) {
    console.warn("Effect bindings unavailable", error);
  }
  try {
    const itemMetaResponse = await fetch(appUrl(`data/item_meta.json?v=${appVersion}`));
    if (itemMetaResponse.ok) {
      state.itemMeta = await itemMetaResponse.json();
    }
  } catch (error) {
    console.warn("Item metadata unavailable", error);
  }
  try {
    const itemFlagsResponse = await fetch(appUrl(`data/item_flags.json?v=${appVersion}`));
    if (itemFlagsResponse.ok) {
      state.itemFlags = await itemFlagsResponse.json();
    }
  } catch (error) {
    console.warn("Item flags unavailable", error);
  }
  try {
    const layerPriorityResponse = await fetch(appUrl(`data/layer_priority.json?v=${appVersion}`));
    if (layerPriorityResponse.ok) {
      state.layerPriority = await layerPriorityResponse.json();
    }
  } catch (error) {
    console.warn("Layer priority unavailable", error);
  }
  try {
    const backgroundResponse = await fetch(appUrl(`data/preview_backgrounds.json?v=${appVersion}`));
    if (backgroundResponse.ok) {
      state.previewBackgrounds = await backgroundResponse.json();
    }
  } catch (error) {
    console.warn("Preview backgrounds unavailable", error);
  }
  try {
    state.customBackgroundData = localStorage.getItem(customBackgroundStorageKey) || "";
  } catch (_) {
    state.customBackgroundData = "";
  }
  loadExportSettings();
  canvas.width = DISPLAY_CANVAS_SIZE;
  canvas.height = DISPLAY_CANVAS_SIZE;
  renderCanvas.width = state.data.canvas.width;
  renderCanvas.height = state.data.canvas.height;

  for (const action of state.data.actions) {
    const option = document.createElement("option");
    option.value = String(action);
    option.textContent = actionLabels.get(String(action)) || `A${action}`;
    actionSelect.appendChild(option);
  }

  applyStatePayload(readLocalState());
  applyStatePayload(readHashState());
  normalizeState();
  rememberRaceSelection();

  refreshJobSelect();
  refreshMountSelect();
  refreshHairSelect();
  refreshColorSelects();
  refreshEquipmentSelects();
  refreshBackgroundSelect();
  refreshCloset();

  document.querySelectorAll("[data-race]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextRace = button.dataset.race || "human";
      if (nextRace === state.race || !state.data.races?.[nextRace]) {
        return;
      }
      rememberRaceSelection();
      state.race = nextRace;
      if (!restoreRaceSelection(nextRace)) {
        state.job = displayableJobsForSex()[0]?.key || state.job;
        state.hairstyle = String(hairstylesForCurrentRace().find((hair) => hair.parts?.[state.sex])?.id || "1");
        state.mount = "none";
        state.secondCostume = false;
        state.headgearSlots = ["none", "none", "none"];
        state.cape = "none";
      }
      state.riding = state.mount !== "none";
      state.frame = 0;
      state.wearableFrame = 0;
      normalizeState();
      rememberRaceSelection();
      refreshJobSelect();
      refreshMountSelect();
      refreshHairSelect();
      refreshEquipmentSelects();
      refreshItemBrowser();
      prepareAndDraw();
    });
  });

  document.querySelectorAll("[data-sex]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sex = button.dataset.sex;
      state.frame = 0;
      state.wearableFrame = 0;
      ensureSelectedJobSupportsSex();
      normalizeJobModes();
      refreshMountSelect();
      refreshHairSelect();
      state.headgearSlots = state.headgearSlots.map((value, index) => (
        value !== "none" && !selectedHeadgearPartKey(index) ? "none" : value
      ));
      if (state.cape !== "none" && !selectedCapePartKey()) {
        state.cape = "none";
      }
      refreshEquipmentSelects();
      refreshItemBrowser();
      prepareAndDraw();
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => setDirection(button.dataset.action));
  });
  document.querySelectorAll("[data-pose]").forEach((button) => {
    button.addEventListener("click", () => setStatus(button.dataset.pose));
  });
  document.querySelectorAll("[data-face]").forEach((button) => {
    button.addEventListener("click", () => {
      state.faceDirection = button.dataset.face || "center";
      prepareAndDraw();
    });
  });
  document.querySelectorAll("[data-display-size]").forEach((button) => {
    button.addEventListener("click", () => {
      state.displaySize = button.dataset.displaySize || "normal";
      prepareAndDraw();
    });
  });
  document.querySelectorAll("[data-mode-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      if (button.dataset.modeToggle === "secondCostume") {
        const enabling = !state.secondCostume;
        state.secondCostume = enabling;
        const mount = selectedMountOption();
        if (enabling && mount && (!mount.secondVariant || !jobVariantForSex(selectedJob(), mount.secondVariant))) {
          state.mount = "none";
          state.riding = false;
        }
      }
      normalizeJobModes();
      refreshMountSelect();
      state.frame = 0;
      prepareAndDraw();
    });
  });
  document.querySelectorAll("[data-browser-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      state.browserKind = button.dataset.browserKind || "headgear";
      if (itemSearch) {
        itemSearch.value = "";
      }
      syncControls();
      refreshItemBrowser();
    });
  });
  openItemBrowserButton?.addEventListener("click", openItemBrowser);
  closeItemBrowserButton?.addEventListener("click", () => itemBrowserDialog?.close());
  finishItemBrowserButton?.addEventListener("click", () => itemBrowserDialog?.close());
  clearItemBrowserSlotButton?.addEventListener("click", clearItemBrowserSlot);
  itemBrowserSlotButtons.forEach((button) => {
    button.addEventListener("click", () => setItemBrowserSlot(button.dataset.browserSlot || "0"));
  });
  itemBrowserFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      itemBrowserFilter = button.dataset.browserFilter || "all";
      syncItemBrowserControls();
      refreshItemBrowser();
    });
  });
  itemBrowserDialog?.addEventListener("click", (event) => {
    if (event.target === itemBrowserDialog) {
      itemBrowserDialog.close();
    }
  });
  equipmentQuickFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.equipmentFilter = button.dataset.equipmentFilter || "all";
      if (["top", "mid", "low"].includes(state.equipmentFilter)) {
        state.browserKind = "headgear";
      } else if (state.equipmentFilter === "cape") {
        state.browserKind = "cape";
      }
      refreshEquipmentSelects();
      syncControls();
      if (state.equipmentFilter === "cape") {
        capeSelect.focus();
      }
    });
  });
  quickFavoriteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const slot = button.dataset.favoriteSlot;
      if (!quickFavoritePanel.hidden && quickFavoriteSlot === slot) {
        closeQuickFavoritePanel();
      } else {
        openQuickFavoritePanel(slot);
      }
    });
    button.addEventListener("keydown", (event) => {
      const direction = {
        ArrowUp: -1,
        ArrowLeft: -1,
        ArrowDown: 1,
        ArrowRight: 1,
      }[event.key];
      if (!direction) return;
      event.preventDefault();
      cycleQuickFavoriteItem(button, direction);
    });
  });
  addQuickFavoriteButton?.addEventListener("click", addCurrentQuickFavorite);
  closeQuickFavoriteButton?.addEventListener("click", closeQuickFavoritePanel);
  document.querySelectorAll("[data-clear-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      const slot = button.dataset.clearSlot;
      if (slot === "cape") {
        state.cape = "none";
      } else if (slot?.startsWith("headgear-")) {
        state.headgearSlots[Number(slot.split("-")[1] || 0)] = "none";
      }
      refreshEquipmentSelects();
      prepareAndDraw();
    });
  });

  actionSelect.addEventListener("change", () => setAction(actionSelect.value));
  jobSelect.addEventListener("change", () => {
    state.job = jobSelect.value;
    state.mount = "none";
    state.riding = false;
    state.frame = 0;
    ensureSelectedJobSupportsSex();
    normalizeJobModes();
    refreshMountSelect();
    refreshEquipmentSelects();
    prepareAndDraw();
  });
  if (mountSelect) {
    mountSelect.addEventListener("change", () => {
      state.mount = mountSelect.value || "none";
      state.riding = state.mount !== "none";
      normalizeJobModes();
      state.frame = 0;
      state.wearableFrame = 0;
      refreshMountSelect();
      refreshEquipmentSelects();
      prepareAndDraw();
    });
  }
  if (mountButtons) {
    mountButtons.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mount-category]");
      if (!button || button.disabled) {
        return;
      }
      const category = button.dataset.mountCategory;
      const activeMount = selectedMountOption();
      const categoryMounts = mountOptionsForJob().filter((mount) => mountCategory(mount) === category);
      if (activeMount && mountCategory(activeMount) === category && categoryMounts.length > 1) {
        const activeIndex = categoryMounts.findIndex((mount) => mount.key === activeMount.key);
        state.mount = categoryMounts[activeIndex + 1]?.key || "none";
      } else if (activeMount && mountCategory(activeMount) === category) {
        state.mount = "none";
      } else {
        state.mount = categoryMounts[0]?.key || "none";
      }
      state.riding = state.mount !== "none";
      normalizeJobModes();
      state.frame = 0;
      state.wearableFrame = 0;
      refreshMountSelect();
      refreshEquipmentSelects();
      prepareAndDraw();
    });
  }
  hairSelect.addEventListener("change", () => {
    state.hairstyle = hairSelect.value;
    state.frame = 0;
    prepareAndDraw();
  });
  if (bodyColorSelect) {
    bodyColorSelect.addEventListener("change", () => {
      state.bodyColor = bodyColorSelect.value;
      prepareAndDraw();
    });
  }
  if (hairColorSelect) {
    hairColorSelect.addEventListener("change", () => {
      state.hairColor = hairColorSelect.value;
      prepareAndDraw();
    });
  }
  headgearSelects.forEach((select, index) => {
    select.addEventListener("change", () => {
      state.headgearSlots[index] = select.value;
      state.wearableFrame = 0;
      state.lastWearableTick = performance.now();
      prepareAndDraw();
    });
  });
  headgearFilter.addEventListener("input", () => {
    scheduleEquipmentFilterRefresh();
  });
  if (itemSearch) {
    itemSearch.addEventListener("input", () => scheduleItemBrowserRefresh());
  }
  capeSelect.addEventListener("change", () => {
    state.cape = capeSelect.value;
    state.wearableFrame = 0;
    state.lastWearableTick = performance.now();
    prepareAndDraw();
  });
  capeFilter.addEventListener("input", () => {
    scheduleEquipmentFilterRefresh();
  });
  if (backgroundSelect) {
    backgroundSelect.addEventListener("change", () => {
      state.previewBackground = backgroundSelect.value;
      state.backgroundOffsetX = 0;
      state.backgroundOffsetY = 0;
      applyPreviewBackground();
      saveLocalState();
    });
  }
  if (backgroundColor) {
    backgroundColor.addEventListener("input", () => {
      state.backgroundColor = backgroundColor.value;
      applyPreviewBackground();
      saveLocalState();
    });
  }
  if (shadowToggle) {
    shadowToggle.addEventListener("change", () => {
      state.showShadow = shadowToggle.checked;
      syncControls();
      saveLocalState();
    });
  }
  if (backgroundFile) {
    backgroundFile.addEventListener("change", () => setCustomBackgroundFile(backgroundFile.files?.[0]));
  }
  if (backgroundResetButton) {
    backgroundResetButton.addEventListener("click", () => resetBackgroundPosition());
  }
  if (previewWrap) {
    previewWrap.addEventListener("pointerdown", startBackgroundDrag);
    previewWrap.addEventListener("pointermove", moveBackgroundDrag);
    previewWrap.addEventListener("pointerup", finishBackgroundDrag);
    previewWrap.addEventListener("pointercancel", finishBackgroundDrag);
  }
  if (zoomOutButton) {
    zoomOutButton.addEventListener("click", () => setZoom(state.zoom - zoomStep));
  }
  if (zoomInButton) {
    zoomInButton.addEventListener("click", () => setZoom(state.zoom + zoomStep));
  }
  if (saveClosetButton) {
    saveClosetButton.addEventListener("click", () => saveCurrentLook());
  }
  if (closetName) {
    closetName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveCurrentLook();
      }
    });
  }
  if (closetList) {
    closetList.addEventListener("click", (event) => {
      const load = event.target.closest("[data-closet-load]");
      const remove = event.target.closest("[data-closet-remove]");
      if (load) {
        applyClosetLook(load.dataset.closetLoad);
      } else if (remove) {
        removeClosetLook(remove.dataset.closetRemove);
      }
    });
    closetList.addEventListener("change", (event) => {
      const manage = event.target.closest("[data-closet-manage]");
      if (!manage || !manage.value) {
        return;
      }
      if (manage.value === "overwrite") {
        overwriteClosetLook(manage.dataset.closetManage);
      } else if (manage.value === "rename") {
        renameClosetLook(manage.dataset.closetManage);
      }
      manage.value = "";
    });
  }
  if (exportClosetButton) {
    exportClosetButton.addEventListener("click", () => exportClosetJson());
  }
  if (importClosetFile) {
    importClosetFile.addEventListener("change", () => importClosetJson(importClosetFile.files?.[0]));
  }
  document.querySelectorAll("[data-png-size]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pngSize = Number(button.dataset.pngSize) === 512 ? 512 : 256;
      syncPngDialog();
    });
  });
  document.querySelectorAll("[data-png-background]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pngBackground = button.dataset.pngBackground === "transparent" ? "transparent" : "current";
      syncPngDialog();
    });
  });
  if (pngIncludeInfo) {
    pngIncludeInfo.addEventListener("change", () => {
      state.pngIncludeInfo = pngIncludeInfo.checked;
    });
  }
  if (cancelPngButton) {
    cancelPngButton.addEventListener("click", () => pngDialog?.close());
  }
  if (confirmPngButton) {
    confirmPngButton.addEventListener("click", () => {
      pngDialog?.close();
      saveCurrentPng().catch((error) => {
        console.error(error);
        notifyStatus("PNG 儲存失敗 (PNG export failed)");
      });
    });
  }
  document.querySelectorAll("[data-gif-duration]").forEach((button) => {
    button.addEventListener("click", () => {
      state.gifDuration = Number(button.dataset.gifDuration) || 2400;
      syncGifDialog();
    });
  });
  document.querySelectorAll("[data-gif-background]").forEach((button) => {
    button.addEventListener("click", () => {
      state.gifBackground = button.dataset.gifBackground || "current";
      syncGifDialog();
    });
  });
  cancelGifButton?.addEventListener("click", () => gifDialog?.close());
  confirmGifButton?.addEventListener("click", () => {
    gifDialog?.close();
    saveCurrentGif().catch((error) => {
      console.error(error);
      notifyStatus("GIF 儲存失敗 (GIF export failed)");
    });
  });
  frameSlider.addEventListener("input", () => {
    state.playing = false;
    state.frame = Number(frameSlider.value);
    syncControls();
    draw();
  });
  playButton.addEventListener("click", () => {
    togglePlayback();
  });
  if (playButtonInline) {
    playButtonInline.addEventListener("click", () => {
      togglePlayback();
    });
  }
  fitButton.addEventListener("click", () => {
    state.displaySize = "normal";
    state.zoom = 1;
    prepareAndDraw();
  });
  if (shareButton) {
    shareButton.addEventListener("click", () => copyShareLink());
  }
  if (saveImageButton) {
    saveImageButton.addEventListener("click", () => openPngDialog());
  }
  saveGifButton?.addEventListener("click", () => openGifDialog());
  if (clearButton) {
    clearButton.addEventListener("click", () => clearWearables());
  }
  document.querySelectorAll("select").forEach((select) => enableSelectWheel(select));

  syncControls();
  await prepareAndDraw();
  if (state.status === "dead" && !state.playing) {
    state.frame = Math.max(0, visibleFrameCount() - 1);
    state.wearableFrame = state.frame;
    syncControls();
    draw();
  }
  window.requestAnimationFrame(tick);
}

boot().catch((error) => {
  console.error(error);
  statusText.textContent = error.message;
});
