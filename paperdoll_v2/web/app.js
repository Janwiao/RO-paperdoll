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
  effectImages: new Map(),
  loadingEffectImages: new Map(),
  failedEffectImages: new Set(),
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
  previewBackground: "transparent",
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
const backgroundSelect = document.getElementById("backgroundSelect");
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
const clearButton = document.getElementById("clearButton");
const stackReadout = document.getElementById("stackReadout");
const anchorReadout = document.getElementById("anchorReadout");
const frameReadout = document.getElementById("frameReadout");
const itemSearch = document.getElementById("itemSearch");
const itemResults = document.getElementById("itemResults");
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
    },
    text: {
      none: "無",
      standard: "標準",
      filter: "篩選 ID 或名稱 (Filter ID/name)",
      itemSearch: "搜尋 ID / 名稱 / const (Search)",
      shareCopied: "分享連結已複製 (Link copied)",
      shareUpdated: "分享連結已更新到網址列 (URL updated)",
      pngSaved: "PNG 已儲存（暫不含動態特效）(PNG saved, no animated effects)",
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
    },
    text: {
      none: "None",
      standard: "Standard",
      filter: "Filter ID or name",
      itemSearch: "Search ID / name / const",
      shareCopied: "Share link copied",
      shareUpdated: "Share link updated in URL",
      pngSaved: "PNG saved (animated effects excluded)",
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
    },
    text: {
      none: "Nenhum",
      standard: "Padrão",
      filter: "Filtrar ID ou nome",
      itemSearch: "Buscar ID / nome / const",
      shareCopied: "Link copiado",
      shareUpdated: "Link atualizado na URL",
      pngSaved: "PNG salvo (sem efeitos animados)",
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
      clearTitle: "Limpar visual",
    },
  },
};

const appVersion = "20260713-paperdoll-v2-layer-priority-12";
const storageKey = "nori.paperdoll.state.v2";
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
let browserFilterTimer = 0;
const forceRgbaFlipYAllActionItemIds = new Set([
  668, 958, 961, 975, 976, 1005, 1038, 1039, 1040,
  1132, 1133, 1145, 1146, 1147, 1148, 1248, 1326,
  2264, 2370, 2429, 2430, 2431, 2432, 2479, 2481,
  2482, 2485, 2501, 2518, 2803, 2810,
]);
const forceRgbaFlipYA16ItemIds = new Set([1426, 1427, 1428, 1429, 1430]);
const confirmedRgbaNoFlipItemIds = new Set([2280]);
const rgbaSingleLayerEffectFlipCache = new WeakMap();
const displaySizeSettings = {
  compact: { scale: 0.5 },
  normal: { scale: 1 },
  large: { scale: 2 },
};

const statusOffsets = new Map([
  ["stand", 0],
  ["walk", 8],
  ["sit", 16],
  ["pick", 24],
  ["wait", 32],
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
  return state.previewBackgrounds.find((item) => item.id === id) || state.previewBackgrounds[0];
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
  if (bg.type === "color") {
    previewWrap.style.backgroundColor = bg.value || "#fff";
    previewWrap.style.backgroundImage = "none";
  } else if (bg.type === "texture" && bg.src) {
    previewWrap.style.backgroundImage = `url(${JSON.stringify(appUrl(bg.src))})`;
    previewWrap.style.backgroundSize = bg.size || "256px 256px";
    previewWrap.style.backgroundPosition = "center";
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
}

function refreshBackgroundSelect() {
  if (!backgroundSelect) {
    applyPreviewBackground();
    return;
  }
  backgroundSelect.replaceChildren();
  for (const bg of state.previewBackgrounds) {
    const option = document.createElement("option");
    option.value = bg.id;
    option.textContent = bg.name || bg.id;
    backgroundSelect.appendChild(option);
  }
  if (!backgroundById(state.previewBackground)) {
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
  return (state.data.jobs || []).filter(isDisplayableJob);
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
    state.images.set(partKey, pools);
  })();
  state.loadingImages.set(partKey, loading);
  try {
    await loading;
  } finally {
    state.loadingImages.delete(partKey);
  }
}

async function ensurePartData(partKey) {
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
    const detail = await response.json();
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
  return state.data.characters[state.sex];
}

function currentFramesForPart(partKey, action = state.action) {
  if (!partKey) {
    return [];
  }
  const part = state.data.parts[partKey];
  if (!part || !part.actions) {
    return [];
  }
  return part.actions[String(action)] || part.actions[action] || [];
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
  if (part.key?.startsWith("hair_")) {
    return state.hairColor;
  }
  return null;
}

function paletteImageForPart(part, image, poolName) {
  const colorId = paletteColorForPart(part);
  if (poolName !== "indexed" || !colorId || !part.palette?.base || !part.palette?.variants?.[colorId]) {
    return image;
  }
  const cacheKey = `${part.key}|${poolName}|${colorId}`;
  if (state.images.has(cacheKey)) {
    return state.images.get(cacheKey);
  }

  const basePalette = decodePalette(part.palette.base);
  const targetPalette = decodePalette(part.palette.variants[colorId]);
  const map = new Map();
  for (let index = 1; index < basePalette.length; index += 1) {
    const base = basePalette[index];
    const target = targetPalette[index];
    map.set(`${base[0]},${base[1]},${base[2]}`, target);
  }

  const swapCanvas = document.createElement("canvas");
  swapCanvas.width = image.naturalWidth || image.width;
  swapCanvas.height = image.naturalHeight || image.height;
  const swapCtx = swapCanvas.getContext("2d", { willReadFrequently: true });
  swapCtx.drawImage(image, 0, 0);
  const imageData = swapCtx.getImageData(0, 0, swapCanvas.width, swapCanvas.height);
  const pixels = imageData.data;
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

function forceRgbaFlipYForPart(part) {
  const autoEffectFlip = isRgbaSingleLayerEffectPart(part);
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
  const image = baseImage ? paletteImageForPart(part, baseImage, poolName) : null;
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
  const paddedAnchor = {
    x: anchor.x + renderPadding,
    y: anchor.y + renderPadding,
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
  return entry?.parts?.[state.sex] || null;
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
    const partKey = item?.parts?.[state.sex];
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
  return entry?.parts?.[state.sex] || null;
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
  const itemKind = kind || itemKindFor(item);
  if (itemKind === "cape") {
    return item.parts?.[state.sex] || null;
  }
  return item.parts?.[state.sex] || null;
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
  const entry = (state.data.hairstyles || []).find((item) => String(item.id) === String(state.hairstyle));
  return entry?.parts?.[state.sex] || currentCharacter().head;
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
  syncEffectLayer(effectLayerBehind, effects.filter((effect) => Boolean(effect.render_before_character)));
  syncEffectLayer(effectLayerFront, effects.filter((effect) => !effect.render_before_character));
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
    bg: state.previewBackground,
  };
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
  if (payload.bg) state.previewBackground = String(payload.bg);
}

function normalizeState() {
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
  if (!backgroundById(state.previewBackground)) {
    state.previewBackground = state.previewBackgrounds[0]?.id || "transparent";
  }
  state.language = "zh";
  ensureSelectedJobSupportsSex();
  normalizeJobModes();

  const hair = (state.data.hairstyles || []).find((item) => String(item.id) === String(state.hairstyle));
  if (!hair?.parts?.[state.sex]) {
    const fallback = (state.data.hairstyles || []).find((item) => item.parts?.[state.sex]);
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
    return entry?.parts?.[state.sex] ? String(value) : "none";
  });
  while (state.headgearSlots.length < 3) {
    state.headgearSlots.push("none");
  }
  const capeEntry = (state.data.capes || []).find((item) => String(item.id) === String(state.cape));
  if (!capeEntry?.parts?.[state.sex]) {
    state.cape = "none";
  }
}

function syncControls() {
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
  applyPreviewBackground();
  headgearSelects.forEach((select, index) => {
    select.value = state.headgearSlots[index] || "none";
  });
  capeSelect.value = state.cape;
  playButton.textContent = state.playing ? "II" : ">";
  playButton.title = state.playing ? tr("text", "pause") : tr("text", "play");
  playButton.setAttribute("aria-label", playButton.title);
  if (playButtonInline) {
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

function itemMetaFor(item, explicitKind = null) {
  if (!item) {
    return null;
  }
  const kind = explicitKind || itemKindFor(item);
  return state.itemMeta?.[kind]?.[String(item.id)] || null;
}

function itemMatchesEquipmentFilter(item, explicitKind = null) {
  const filter = state.equipmentFilter || "all";
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
    if (!itemMatchesQuery(item, cleanQuery, itemKind) || !itemMatchesEquipmentFilter(item, itemKind)) {
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
    const button = row.querySelector("button");
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
}

function browserItems() {
  return state.browserKind === "cape" ? (state.data.capes || []) : (state.data.headgear || []);
}

function itemIsSelected(item) {
  if (!item) {
    return false;
  }
  if (state.browserKind === "cape") {
    return String(state.cape) === String(item.id);
  }
  return state.headgearSlots.some((value) => String(value) === String(item.id));
}

function selectBrowserItem(item) {
  if (!item) {
    return;
  }
  if (state.browserKind === "cape") {
    state.cape = String(item.id);
  } else {
    const existing = state.headgearSlots.findIndex((value) => String(value) === String(item.id));
    if (existing >= 0) {
      state.headgearSlots[existing] = "none";
    } else {
      const empty = state.headgearSlots.findIndex((value) => !value || value === "none");
      state.headgearSlots[empty >= 0 ? empty : 0] = String(item.id);
    }
  }
  refreshEquipmentSelects();
  refreshItemBrowser();
  prepareAndDraw();
}

function refreshItemBrowser() {
  if (!itemResults) {
    return;
  }
  const query = itemSearch?.value.trim() || "";
  const items = browserItems()
    .filter((item) => itemMatchesQuery(item, query, state.browserKind))
    .filter((item) => itemMatchesEquipmentFilter(item, state.browserKind))
    .slice(0, 72);
  itemResults.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "item-empty";
    empty.textContent = trText("noResults");
    itemResults.appendChild(empty);
    return;
  }
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-card";
    button.classList.toggle("active", itemIsSelected(item));
    button.dataset.itemId = String(item.id);

    const id = document.createElement("span");
    id.className = "item-id";
    const metaInfo = itemMetaFor(item, state.browserKind);
    id.textContent = metaInfo?.primary_itemid ? `${item.id} / ${metaInfo.primary_itemid}` : String(item.id);
    const name = document.createElement("strong");
    name.textContent = shortItemName(item, state.browserKind);
    const meta = document.createElement("span");
    meta.className = "item-meta";
    const slotText = metaInfo?.slots?.length ? ` · ${metaInfo.slots.join("/")}` : "";
    meta.textContent = `${item.const || " "}${slotText}`;
    button.title = itemDisplayName(item, state.browserKind);

    const flags = itemFlagLabels(item, state.browserKind);
    if (flags.length) {
      const tagRow = document.createElement("span");
      tagRow.className = "item-tags";
      for (const flag of flags) {
        const tag = document.createElement("span");
        tag.className = `item-tag ${flag}`;
        tag.textContent = trText(flag);
        tagRow.appendChild(tag);
      }
      button.append(id, tagRow, name, meta);
    } else {
      button.append(id, name, meta);
    }
    button.addEventListener("click", () => selectBrowserItem(item));
    itemResults.appendChild(button);
  }
}

function refreshEquipmentSelects() {
  headgearSelects.forEach((select, index) => {
    fillItemSelect(select, state.data.headgear || [], state.headgearSlots[index], headgearFilter.value.trim(), trText("costumeNone", index + 1), "headgear");
  });
  fillItemSelect(capeSelect, state.data.capes || [], state.cape, capeFilter.value.trim(), trText("none"), "cape");
  refreshWornPanel();
  refreshItemBrowser();
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

function refreshColorSelects() {
  refreshColorSelect(bodyColorSelect, state.data.bodyColors || [], state.bodyColor);
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
  const activeCategory = mountCategory(selectedMountOption());
  mountButtons.querySelectorAll("[data-mount-category]").forEach((button) => {
    const category = button.dataset.mountCategory;
    const available = mounts.some((mount) => mountCategory(mount) === category);
    button.disabled = !available;
    button.classList.toggle("active", available && activeCategory === category);
    button.title = available ? "" : tr("text", "modeUnavailable");
  });
}

function refreshHairSelect() {
  hairSelect.replaceChildren();
  for (const hair of state.data.hairstyles || []) {
    if (!hair.parts?.[state.sex]) {
      continue;
    }
    const option = document.createElement("option");
    option.value = String(hair.id);
    option.textContent = hair.label;
    hairSelect.appendChild(option);
  }
  const selected = (state.data.hairstyles || []).find((hair) => String(hair.id) === String(state.hairstyle));
  if (!selected?.parts?.[state.sex] && state.data.hairstyles?.length) {
    const fallback = state.data.hairstyles.find((hair) => hair.parts?.[state.sex]);
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
  syncControls();
  draw();
  saveLocalState();
}

function setAction(action) {
  state.action = String(action);
  state.frame = 0;
  state.wearableFrame = 0;
  state.lastWearableTick = performance.now();
  prepareAndDraw();
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

async function copyShareLink() {
  const url = new URL(window.location.href);
  url.hash = stateHash();
  try {
    await navigator.clipboard.writeText(url.toString());
    notifyStatus(trText("shareCopied"));
  } catch (_) {
    window.location.hash = url.hash;
    notifyStatus(trText("shareUpdated"));
  }
}

function saveCurrentPng() {
  const link = document.createElement("a");
  const job = (selectedJob()?.label || "paperdoll").replace(/[\\/:*?"<>|]+/g, "_");
  link.download = `nori-paperdoll-${job}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  notifyStatus(trText("pngSaved"));
}

function clearWearables() {
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
  prepareAndDraw();
  notifyStatus(trText("cleared"));
}

function enableSelectWheel(select) {
  if (!select) {
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
  const response = await fetch(appUrl(`data/paperdoll.json?v=${appVersion}`));
  state.data = await response.json();
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

  refreshJobSelect();
  refreshMountSelect();
  refreshHairSelect();
  refreshColorSelects();
  refreshEquipmentSelects();
  refreshBackgroundSelect();

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
      if (activeMount && mountCategory(activeMount) === category) {
        state.mount = "none";
      } else {
        state.mount = mountOptionsForJob().find((mount) => mountCategory(mount) === category)?.key || "none";
      }
      state.riding = state.mount !== "none";
      normalizeJobModes();
      state.frame = 0;
      state.wearableFrame = 0;
      refreshMountSelect();
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
      applyPreviewBackground();
      saveLocalState();
    });
  }
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
    prepareAndDraw();
  });
  if (shareButton) {
    shareButton.addEventListener("click", () => copyShareLink());
  }
  if (saveImageButton) {
    saveImageButton.addEventListener("click", () => saveCurrentPng());
  }
  if (clearButton) {
    clearButton.addEventListener("click", () => clearWearables());
  }
  document.querySelectorAll("select").forEach((select) => enableSelectWheel(select));

  syncControls();
  await prepareAndDraw();
  window.requestAnimationFrame(tick);
}

boot().catch((error) => {
  console.error(error);
  statusText.textContent = error.message;
});
