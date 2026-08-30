/**
 * @file state.js  全局状态总线
 * @description
 *   把原 render.js 里的散落变量统一收口到 window.__state，避免模块拆分后
 *   闭包共享变量的脆弱性。所有业务脚本（home.js / drawer.js / list-page.js /
 *   ticker.js）都通过 IIFE 内部 const state = (window.__state ||= {...}) 拿引用。
 *
 *   写入约定：
 *     - 业务模块只在自身职责内修改 state 字段
 *     - 跨模块联动（如"抽屉关闭后重绘首页"）通过 RenderAPI 上的方法触发
 *     - 持久化字段（progressStore）由 utils.js 提供的 load/save 函数处理
 *
 *   加载顺序：data/*.js → state.js → utils.js → 业务模块
 */

(function () {
  "use strict";

  /**
   * @typedef {Object} ProgressStore
   * @property {Record<string, {progress:number,note:string,updatedAt:string}>} byTask
   */

  /**
   * @typedef {Object} TaskFilter
   * @property {string} dimension
   * @property {string} importance
   * @property {string} search
   */

  /**
   * @typedef {Object} ListSortState
   * @property {string} key
   * @property {1|-1} direction
   */

  /**
   * @typedef {Object} AppState
   * @property {string} currentDimension        当前首页矩阵维度（"all" 或 "算力"/"数据" 等）
   * @property {Object|null} activeTask         抽屉当前打开的任务
   * @property {ProgressStore} progressStore    任务进度（持久化到 localStorage）
   * @property {string[]} selectedTaskColumns   抽屉表格显示列
   * @property {ListSortState} taskSort         抽屉排序状态
   * @property {string} importanceFilterValue   抽屉"重要性"筛选值
   */

  const STORAGE_KEY = "progressStore";

  /** @returns {ProgressStore} */
  const loadProgress = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { byTask: {} };
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && parsed.byTask
        ? parsed
        : { byTask: {} };
    } catch (err) {
      console.warn("[state] loadProgress 解析失败，重置存储", err);
      return { byTask: {} };
    }
  };

  /** @param {ProgressStore} store */
  const saveProgress = store => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn("[state] saveProgress 写入失败", err);
    }
  };

  /** 业务模块用 getState() / patchState() 读写，避免直读 window.__state。*/
  const listeners = new Set();
  const getState = () => window.__state;
  const patchState = (patch) => {
    Object.assign(window.__state, patch);
    listeners.forEach(fn => {
      try { fn(window.__state); } catch (e) { console.error(e); }
    });
  };

  /**
   * @param {(state: AppState) => void} fn
   * @returns {() => void} 取消订阅
   */
  const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  /**
   * @typedef {Object} PageRoute
   * @property {string} title
   * @property {string} section
   * @property {string} eyebrow
   * @property {string} parent
   */

  /**
   * @typedef {Object} RailItem
   * @property {string} name
   * @property {string[]} desc
   * @property {boolean} interactive
   */

  /**
   * @typedef {Object} RailBlock
   * @property {string} label
   * @property {RailItem[]} items
   */

  /**
   * @typedef {Object} RailData
   * @property {string} version
   * @property {RailBlock} leftRail
   * @property {RailBlock} rightRail
   */

  /**
   * @typedef {Object} MechData
   * @property {string} version
   * @property {string[]} chain
   * @property {string[]} topics
   * @property {string} paradigm
   */

  /**
   * @typedef {Object} NewsItem
   * @property {string} date
   * @property {string} title
   * @property {string} source
   * @property {string[]} tags
   */

  /**
   * @typedef {Object} NewsData
   * @property {NewsItem[]} items
   */

  /**
   * @typedef {Object} SceneCityOrder
   * @property {string} value
   * @property {number} rank
   */

  const RAIL_DATA = window.RAIL_DATA || { version: "", leftRail: { label: "", items: [] }, rightRail: { label: "", items: [] } };
  const MECH_DATA = window.MECHANISM_DATA || { version: "", chain: [], topics: [], paradigm: "" };
  const NEWS_DATA = window.NEWS_DATA || { items: [] };

  /** @type {AppState} */
  const initial = {
    currentDimension: "all",
    activeTask: null,
    progressStore: loadProgress(),
    selectedTaskColumns: ["task", "dimension", "owner", "co", "timeNode", "importance"],
    taskSort: { key: "", direction: 1 },
    importanceFilterValue: "",
  };

  /**
   * @typedef {Object} PageRoute
   * @property {string} href
   * @property {string} title
   * @property {string} eyebrow
   */

  /**
   * 矩阵行标签 → 跳转 URL。值为 undefined 表示当前不可跳转。
   * @type {Record<string, PageRoute>}
   */
  const PAGE_ROUTES = {
    "政策体系":  { href: "pages/policies.html", title: "政策体系",     eyebrow: "POLICY SYSTEM" },
    "重点任务":  { href: "pages/tasks.html",    title: "重点任务清单", eyebrow: "KEY TASKS" },
    "重大项目":  { href: "pages/projects.html", title: "重大项目",     eyebrow: "FLAGSHIP PROJECTS" },
    "应用场景":  { href: "pages/scene.html",    title: "典型场景地图", eyebrow: "SCENE MAP" },
    "机制专题":  { href: "pages/mechanism.html",title: "推进机制专题", eyebrow: "WORK MECHANISM" },
  };

  /**
   * @typedef {Object} SceneCity
   * @property {string} name
   * @property {string[]} aliases
   */

  /** 浙江省 11 个地级市，用于场景列表地点排序。 @type {SceneCity[]} */
  const SCENE_CITY_ORDER = [
    { name: "杭州市", aliases: ["杭州市", "杭州"] },
    { name: "宁波市", aliases: ["宁波市", "宁波"] },
    { name: "温州市", aliases: ["温州市", "温州"] },
    { name: "嘉兴市", aliases: ["嘉兴市", "嘉兴"] },
    { name: "湖州市", aliases: ["湖州市", "湖州"] },
    { name: "绍兴市", aliases: ["绍兴市", "绍兴"] },
    { name: "金华市", aliases: ["金华市", "金华"] },
    { name: "衢州市", aliases: ["衢州市", "衢州"] },
    { name: "舟山市", aliases: ["舟山市", "舟山"] },
    { name: "台州市", aliases: ["台州市", "台州"] },
    { name: "丽水市", aliases: ["丽水市", "丽水"] },
  ];

  window.__state = initial;
  window.__constants = {
    PAGE_ROUTES,
    RAIL_DATA,
    MECH_DATA,
    NEWS_DATA,
    SCENE_CITY_ORDER,
  };
  window.RenderState = { getState, patchState, subscribe, loadProgress, saveProgress };
})();
