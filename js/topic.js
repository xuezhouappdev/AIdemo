(function () {
  "use strict";
  const dimensions = ["算力", "数据", "模型", "应用", "生态"];
  const config = {
    算力: { mark: "C", subtitle: "COMPUTE TOPIC", resource: "platforms" },
    数据: { mark: "D", subtitle: "DATA TOPIC" },
    模型: { mark: "M", subtitle: "MODEL TOPIC" },
    应用: { mark: "A", subtitle: "APPLICATION TOPIC", resource: "scenes" },
    生态: { mark: "E", subtitle: "ECOSYSTEM TOPIC" }
  };
  const params = new URLSearchParams(location.search);
  const dimension = dimensions.includes(params.get("dim")) ? params.get("dim") : "算力";
  const esc = value => String(value ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const items = {
    news: (window.NEWS_DATA?.items || []).filter(item => item.dimensions?.includes(dimension)).map(item => ({ name: item.title, type: item.category, meta: `${item.date}　·　${item.region}　·　${item.source}`, detail: item.summary, extra: { "资讯范围": item.scope, "来源": item.source } })),
    policies: (window.POLICIES_DATA?.policies || []).filter(item => item.category === dimension).map(item => ({ name: item.name, type: item.category, meta: `${item.date}　·　${item.issuer}`, detail: `责任部门：${item.department || "—"}`, extra: { "发文层级": item.issuer, "责任部门": item.department, "发文时间": item.date } })),
    tasks: (window.TASKS_DATA?.tasks || []).filter(item => item.dimension === dimension).map(item => ({ name: item.task, type: item.group || "重点任务", meta: `${item.owner || "—"}　·　${item.timeNode || item.time || "—"}`, detail: item.target || "暂无目标说明。", extra: { "责任单位": item.owner, "协同单位": item.co, "重要程度": item.importance } })),
    projects: (window.PROJECTS_DATA?.projects || []).filter(item => item.大类 === dimension).map(item => ({ name: item.项目名称, type: item.领域, meta: `${item.建设地点}　·　${item.项目业主}`, detail: `总投资：${item.总投资 ?? "—"} 亿元；建设性质：${item.建设性质 || "—"}。`, extra: { "起止年限": item.起止年限, "项目业主": item.项目业主, "计划投资": item["2026年计划投资"] } })),
    scenes: (window.SCENES_DATA?.items || []).map(item => ({ name: item.场景名称, type: item.category?.main || "应用场景", meta: `${item.地市 || item.所在地点 || "—"}　·　${item.业主单位 || "—"}`, detail: item.场景说明, extra: { "场景领域": item.场景领域, "主管部门": item.主管部门, "所在地点": item.所在地点 } })),
    platforms: (window.PLATFORMS_DATA || []).filter(item => item.category === dimension).map(item => ({ name: item.name, type: item.category, meta: `${item.organization || "—"}　·　${item.investment && item.investment !== "\\" ? `${item.investment} 亿元` : "投资待补充"}`, detail: item.progress || item.content, extra: { "建设单位": item.organization, "建设内容": item.content } }))
  };
  const sections = [
    { key: "news", title: "专题资讯", mark: "NEWS" },
    { key: "policies", title: "政策支撑", mark: "POLICY" },
    { key: "tasks", title: "重点任务", mark: "TASK" },
    { key: "projects", title: "重大项目", mark: "PROJECT" }
  ];
  if (config[dimension].resource === "scenes") sections.push({ key: "scenes", title: "应用场景", mark: "SCENE" });
  if (config[dimension].resource === "platforms") sections.push({ key: "platforms", title: "算力平台", mark: "PLATFORM" });
  function header() { return `<header class="ops-header topic-header"><div class="ops-title topic-title"><span class="ops-mark" aria-hidden="true">${esc(config[dimension].mark)}</span><div><small>${esc(config[dimension].subtitle)}</small><h1>${dimension}专题</h1></div></div><nav class="ops-crumb" aria-label="面包屑导航"><a href="../index.html">工作推进总览</a><span>／</span><strong>${dimension}专题</strong></nav></header>`; }
  function nav() { return `<nav class="topic-nav" aria-label="五维专题导航">${dimensions.map(item => `<a class="${item === dimension ? "active" : ""}" href="topic.html?dim=${encodeURIComponent(item)}">${item}<small>${item === dimension ? "当前专题" : "进入专题"}</small></a>`).join("")}</nav>`; }
  function card(item, index) { return `<button class="topic-card" type="button" data-key="${esc(item.key)}" data-index="${index}"><span class="topic-card-index">${String(index + 1).padStart(2, "0")}</span><span class="topic-card-content"><strong>${esc(item.name)}</strong><small>${esc(item.meta)}</small><span>${esc(item.detail)}</span></span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`; }
  function section(section) { const records = items[section.key].map((item, index) => ({ ...item, key: section.key })); return `<section class="topic-section" id="topic-${section.key}"><header class="topic-section-head"><div><span>${section.mark}</span><h2>${section.title}</h2></div><b>${records.length} 条</b></header><div class="topic-cards">${records.length ? records.slice(0, 6).map(card).join("") : `<div class="topic-empty" role="status"><span class="topic-empty-icon" aria-hidden="true"><i class="fa-solid fa-box-archive"></i></span><strong>正在归集</strong><span>该类专题数据正在整理，将在完成核验后展示。</span></div>`}</div>${records.length > 6 ? `<button class="topic-more" type="button" data-expand="${section.key}">查看全部 ${records.length} 条</button>` : ""}</section>`; }
  function showDetail(item) { const layer = document.getElementById("topicDetail"); layer.innerHTML = `<div class="topic-detail-backdrop" data-close></div><section class="topic-detail-panel" role="dialog" aria-modal="true" aria-labelledby="topicDetailTitle"><header><span>${dimension}专题详情</span><button type="button" data-close aria-label="关闭详情"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header><div><small class="topic-detail-type">${esc(item.type)}</small><h2 id="topicDetailTitle">${esc(item.name)}</h2><p>${esc(item.detail)}</p><div class="topic-detail-fields">${Object.entries(item.extra || {}).map(([key, value]) => `<dl><dt>${esc(key)}</dt><dd>${esc(value)}</dd></dl>`).join("")}</div></div></section>`; layer.hidden = false; document.body.classList.add("topic-detail-open"); layer.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", closeDetail)); layer.querySelector("button[data-close]").focus(); }
  function closeDetail() { document.getElementById("topicDetail").hidden = true; document.body.classList.remove("topic-detail-open"); }
  function render() { const counts = sections.map(section => `<div class="ops-metric"><strong>${items[section.key].length}</strong><span>${section.title}</span></div>`).join(""); document.body.innerHTML = `${header()}<main class="ops-shell topic-shell">${nav()}<section class="topic-overview"><div><span>专题工作台</span><h2>专题概览</h2></div>${counts}</section><div class="topic-toolbar"><strong>专题卡片</strong><input id="topicSearch" type="search" placeholder="搜索专题名称、单位或关键词" aria-label="搜索专题数据"></div><div id="topicSections">${sections.map(section).join("")}</div></main><div id="topicDetail" class="topic-detail" hidden></div>`; bind(); }
  function bind() { const search = document.getElementById("topicSearch"); const allCards = () => [...document.querySelectorAll(".topic-card")]; search.addEventListener("input", () => { const query = search.value.trim().toLowerCase(); allCards().forEach(card => card.hidden = !card.textContent.toLowerCase().includes(query)); }); document.querySelectorAll(".topic-card").forEach(card => card.addEventListener("click", () => showDetail(items[card.dataset.key][Number(card.dataset.index)]))); document.querySelectorAll("[data-expand]").forEach(button => button.addEventListener("click", () => { const section = sections.find(item => item.key === button.dataset.expand); const container = button.previousElementSibling; container.innerHTML = items[section.key].map((item, index) => card({ ...item, key: section.key }, index)).join(""); button.remove(); container.querySelectorAll(".topic-card").forEach(card => card.addEventListener("click", () => showDetail(items[card.dataset.key][Number(card.dataset.index)]))); })); document.addEventListener("keydown", event => { if (event.key === "Escape") closeDetail(); }); }
  render();
}());
