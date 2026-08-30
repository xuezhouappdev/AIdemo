(function () {
  "use strict";

  const esc = window.RenderUtils && window.RenderUtils.esc
    ? window.RenderUtils.esc
    : value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
  const NEWS_DATA = window.__constants && window.__constants.NEWS_DATA
    ? window.__constants.NEWS_DATA
    : (window.NEWS_DATA || { items: [] });
  const SCOPE_ORDER = ["全球", "全国", "浙江省"];
  const state = { scope: "", category: "", startDate: "", endDate: "", query: "", selectedId: "" };

  const allItems = Array.isArray(NEWS_DATA.items) ? NEWS_DATA.items : [];
  const el = id => document.getElementById(id);
  const timelineEl = el("newsTimeline");
  const drawerEl = el("newsDrawer");
  const modalEl = el("trendModal");

  const normalizedScope = item => {
    if (SCOPE_ORDER.includes(item.scope)) return item.scope;
    return item.category === "国家层面" ? "全国" : "浙江省";
  };
  const unique = key => [...new Set(allItems.map(item => item[key]).filter(Boolean))];
  const countBy = (items, key) => items.reduce((counts, item) => {
    const value = key === "scope" ? normalizedScope(item) : (item[key] || "未分类");
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
  const formatDate = date => {
    const text = String(date || "");
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text.slice(0, 4)}年${Number(text.slice(5, 7))}月${Number(text.slice(8, 10))}日` : "—";
  };
  const rangeLabel = () => {
    if (state.startDate && state.endDate) return `${state.startDate} 至 ${state.endDate}`;
    if (state.startDate) return `${state.startDate} 起`;
    if (state.endDate) return `截至 ${state.endDate}`;
    const dates = allItems.map(item => item.date).filter(Boolean).sort();
    return dates.length ? `${dates[0]} 至 ${dates[dates.length - 1]}` : "暂无数据";
  };
  const filteredItems = () => allItems.filter(item => {
    if (state.scope && normalizedScope(item) !== state.scope) return false;
    if (state.category && item.category !== state.category) return false;
    if (state.startDate && String(item.date) < state.startDate) return false;
    if (state.endDate && String(item.date) > state.endDate) return false;
    if (state.query) {
      const searchable = [item.title, item.summary, item.source, item.category, item.region, normalizedScope(item)].join(" ").toLowerCase();
      if (!searchable.includes(state.query)) return false;
    }
    return true;
  });

  const renderSummary = items => {
    el("newsTotalMetric").textContent = String(items.length);
    el("newsDateMetric").textContent = rangeLabel();
    el("newsScopeMetric").textContent = `${new Set(items.map(normalizedScope)).size} 个层级`;
    el("newsResultHint").textContent = `当前筛选 ${items.length} 条`;
  };

  const renderFilters = () => {
    const scopeCounts = countBy(allItems, "scope");
    el("newsScopeFilters").innerHTML = [""].concat(SCOPE_ORDER).map(scope => {
      const active = state.scope === scope ? " active" : "";
      const label = scope || "全部资讯";
      const count = scope ? (scopeCounts[scope] || 0) : allItems.length;
      return `<button class="ops-filter${active}" type="button" data-scope="${esc(scope)}">${esc(label)}<span>${count}</span></button>`;
    }).join("");
    const categories = unique("category");
    el("newsCategoryFilters").innerHTML = [""].concat(categories).map(category => {
      const active = state.category === category ? " active" : "";
      const label = category || "全部分类";
      const count = category ? allItems.filter(item => item.category === category).length : allItems.length;
      return `<button class="ops-filter${active}" type="button" data-category="${esc(category)}">${esc(label)}<span>${count}</span></button>`;
    }).join("");
    el("newsScopeFilters").querySelectorAll("[data-scope]").forEach(button => button.addEventListener("click", () => {
      state.scope = button.dataset.scope;
      render();
    }));
    el("newsCategoryFilters").querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => {
      state.category = button.dataset.category;
      render();
    }));
  };

  const itemMarkup = item => `<article class="news-record${state.selectedId === item.id ? " selected" : ""}" data-news-id="${esc(item.id)}" tabindex="0" role="button">
    <time>${esc(String(item.date || "").slice(5).replace("-", "/"))}</time>
    <div class="news-record-main">
      <div class="news-record-tags"><span class="ops-tag news-scope-tag">${esc(normalizedScope(item))}</span><span class="ops-tag">${esc(item.category || "未分类")}</span><span class="news-region">${esc(item.region || "—")}</span></div>
      <h3>${esc(item.title || "未命名资讯")}</h3>
      <p>${esc(item.summary || "暂无摘要")}</p>
      <span class="news-record-source">来源：${esc(item.source || "—")}</span>
    </div>
    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
  </article>`;

  const renderTimeline = items => {
    if (!items.length) {
      timelineEl.innerHTML = '<div class="ops-empty">当前条件下暂无资讯，请调整日期或筛选条件。</div>';
      return;
    }
    const groups = {};
    [...items].sort((a, b) => String(b.date).localeCompare(String(a.date))).forEach(item => {
      const month = String(item.date || "").slice(0, 7) || "未知日期";
      (groups[month] ||= []).push(item);
    });
    timelineEl.innerHTML = Object.entries(groups).map(([month, records]) => `<section class="news-month-group">
      <div class="news-month-title"><h2>${esc(month === "未知日期" ? month : `${month.slice(0, 4)}年${Number(month.slice(5))}月`)}</h2><span>${records.length} 条</span></div>
      ${records.map(itemMarkup).join("")}
    </section>`).join("");
    timelineEl.querySelectorAll("[data-news-id]").forEach(record => {
      const open = () => openDetail(record.dataset.newsId);
      record.addEventListener("click", open);
      record.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
    });
  };

  const openDetail = id => {
    const item = allItems.find(candidate => candidate.id === id);
    if (!item) return;
    state.selectedId = id;
    const source = item.url
      ? `<a class="ops-detail-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">查看原始来源 <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
      : "";
    drawerEl.hidden = false;
    drawerEl.innerHTML = `<div class="news-drawer-backdrop" data-close-drawer></div><aside class="news-drawer-panel" aria-label="资讯详情">
      <button type="button" class="news-close" data-close-drawer aria-label="关闭详情"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      <span class="ops-detail-kicker">${esc(normalizedScope(item))}　／　${esc(item.category || "未分类")}</span>
      <h2>${esc(item.title || "未命名资讯")}</h2>
      <p class="news-detail-summary">${esc(item.summary || "暂无摘要")}</p>
      <div class="ops-detail-fields"><div class="ops-detail-field"><span>发布日期</span><b>${esc(formatDate(item.date))}</b></div><div class="ops-detail-field"><span>资讯属地</span><b>${esc(item.region || "—")}</b></div><div class="ops-detail-field"><span>资讯范围</span><b>${esc(normalizedScope(item))}</b></div><div class="ops-detail-field"><span>信息来源</span><b>${esc(item.source || "—")}</b></div></div>${source}
    </aside>`;
    drawerEl.querySelectorAll("[data-close-drawer]").forEach(button => button.addEventListener("click", closeDetail));
    renderTimeline(filteredItems());
  };
  const closeDetail = () => { state.selectedId = ""; drawerEl.hidden = true; drawerEl.innerHTML = ""; renderTimeline(filteredItems()); };

  const distributionRows = (counts, order) => order.filter(key => counts[key]).map(key => `<li><span>${esc(key)}</span><b>${counts[key]} 条</b></li>`).join("");
  const buildTrend = items => {
    if (!items.length) return { title: "暂无可总结的资讯", content: "当前筛选条件下没有资讯记录，请调整时间范围或筛选条件后重试。" };
    const scopeCounts = countBy(items, "scope");
    const categoryCounts = countBy(items, "category");
    const orderedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const topCategory = orderedCategories[0];
    const dates = items.map(item => item.date).filter(Boolean).sort();
    const monthly = items.reduce((result, item) => { const key = String(item.date).slice(0, 7); result[key] = (result[key] || 0) + 1; return result; }, {});
    const monthRows = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => `<li><span>${esc(month)}</span><b>${count} 条</b></li>`).join("");
    return {
      title: `${formatDate(dates[0])}至${formatDate(dates[dates.length - 1])}资讯趋势总结`,
      content: `<p class="trend-lead">本次按当前筛选条件共汇集 <strong>${items.length}</strong> 条资讯，覆盖 ${Object.keys(scopeCounts).length} 个资讯范围、${Object.keys(categoryCounts).length} 类主题。其中，<strong>${esc(topCategory[0])}</strong>类资讯最多，为 <strong>${topCategory[1]}</strong> 条。</p>
      <div class="trend-grid"><section><h3>范围分布</h3><ul>${distributionRows(scopeCounts, SCOPE_ORDER)}</ul></section><section><h3>主题分布</h3><ul>${orderedCategories.map(([name, count]) => `<li><span>${esc(name)}</span><b>${count} 条</b></li>`).join("")}</ul></section><section><h3>时间走势</h3><ul>${monthRows}</ul></section></div>
      <section class="trend-conclusion"><h3>研判要点</h3><p>所选时间段内，资讯重点集中在${esc(topCategory[0])}，反映人工智能产业发展正围绕政策支撑、基础设施建设和应用落地持续推进。建议结合重点主题的连续发布情况，进一步跟踪相关政策落地、项目建设和企业协同进展。</p></section><p class="trend-note">本总结基于当前资讯库的筛选结果自动生成，仅用于工作研判参考。</p>`
    };
  };
  const openTrend = () => {
    const trend = buildTrend(filteredItems());
    modalEl.hidden = false;
    modalEl.innerHTML = `<div class="trend-modal-backdrop" data-close-trend></div><section class="trend-modal-panel" role="dialog" aria-modal="true" aria-label="趋势总结"><div class="trend-modal-head"><div><span>自动生成</span><h2>趋势总结</h2></div><button type="button" class="news-close" data-close-trend aria-label="关闭趋势总结"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><div class="trend-modal-body"><p class="trend-range">统计区间：${esc(rangeLabel())}</p><h3 class="trend-title">${esc(trend.title)}</h3>${trend.content}</div></section>`;
    modalEl.querySelectorAll("[data-close-trend]").forEach(button => button.addEventListener("click", () => { modalEl.hidden = true; modalEl.innerHTML = ""; }));
  };

  const syncControls = () => {
    el("newsStartDate").value = state.startDate;
    el("newsEndDate").value = state.endDate;
    el("newsSearch").value = state.query;
  };
  const render = () => {
    const items = filteredItems();
    renderSummary(items);
    renderFilters();
    syncControls();
    renderTimeline(items);
  };
  const applyQuerySelection = () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && allItems.some(item => item.id === id)) window.setTimeout(() => openDetail(id), 0);
  };

  document.addEventListener("DOMContentLoaded", () => {
    el("newsStartDate").addEventListener("change", event => { state.startDate = event.target.value; render(); });
    el("newsEndDate").addEventListener("change", event => { state.endDate = event.target.value; render(); });
    el("newsSearch").addEventListener("input", event => { state.query = event.target.value.trim().toLowerCase(); render(); });
    el("newsReset").addEventListener("click", () => { Object.assign(state, { scope: "", category: "", startDate: "", endDate: "", query: "" }); render(); });
    el("trendButton").addEventListener("click", openTrend);
    render();
    applyQuerySelection();
  });
})();
