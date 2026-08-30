(function () {
  "use strict";

  const esc = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

  const modules = {
    overview: { title: "工作台总览", desc: "集中查看任务、项目、平台和场景等基础台账。" },
    tasks: {
      title: "任务调度", desc: "数据来源：app/data/tasks.js。展示重点任务的责任分工、时间节点和预期目标。", source: "tasks.js",
      columns: [
        ["编号", row => row.id], ["重点任务", row => row.task, "long"], ["所属维度", row => row.dimension], ["任务分组", row => row.group],
        ["牵头单位", row => row.owner], ["配合单位", row => row.co, "long"], ["时间节点", row => row.timeNode || row.time], ["调研时间", row => row.researchTime], ["重要性", row => row.importance || "—"], ["预期目标", row => row.target, "long"]
      ], status: () => "跟踪中"
    },
    projects: {
      title: "项目调度", desc: "数据来源：app/data/projects.js。展示重大项目建设、投资和主体信息。", source: "projects.js",
      columns: [
        ["序号", row => row["序号"]], ["项目名称", row => row["项目名称"], "long"], ["大类", row => row["大类"]], ["领域", row => row["领域"]], ["建设地点", row => row["建设地点"]], ["起止年限", row => row["起止年限"]],
        ["项目业主", row => row["项目业主"]], ["建设性质", row => row["建设性质"]], ["总投资（亿元）", row => row["总投资"]], ["截至2025年底完成投资（亿元）", row => row["截至2025年底完成投资"]], ["2026年计划投资（亿元）", row => row["2026年计划投资"]], ["项目分组", row => row["分组"]]
      ], status: row => row["建设性质"] || "已入库"
    },
    platforms: {
      title: "平台调度", desc: "数据来源：app/data/platforms.js。展示人工智能平台建设内容、投资和最新进展。", source: "platforms.js",
      columns: [
        ["编号", row => row.id], ["平台名称", row => row.name, "long"], ["平台类别", row => row.category], ["建设单位", row => row.organization, "long"], ["总投资（亿元）", row => row.investment === "\\" ? "—" : row.investment], ["建设内容", row => row.content, "long"], ["最新进展", row => row.progress, "long"]
      ], status: () => "进展已填报"
    },
    scenes: {
      title: "场景遴选", desc: "数据来源：app/data/scenes.js。展示已收录人工智能应用场景及其业主、地点和主管部门。", source: "scenes.js",
      columns: [
        ["序号", row => row["序号"]], ["场景名称", row => row["场景名称"], "long"], ["场景领域", row => row["场景领域"], "long"], ["业主单位", row => row["业主单位"], "long"], ["所在地点", row => row["所在地点"]], ["主管部门", row => row["主管部门"], "long"], ["场景说明", row => row["场景说明"], "long"], ["备注", row => row["备注"] || "—"]
      ], status: () => "已收录"
    },
    meetings: {
      title: "会议管理", desc: "会议计划、议题纪要和督办事项管理功能正在建设中。", source: "news.js", placeholder: "会议管理功能正在开发",
      columns: [["标题", row => row.title, "long"], ["类别", row => row.category], ["来源", row => row.source], ["日期", row => row.date], ["摘要", row => row.summary, "long"]], status: () => "已发布"
    },
    research: {
      title: "调研管理", desc: "调研计划、走访记录和成果归集管理功能正在建设中。", source: "tasks.js", placeholder: "调研管理功能正在开发",
      columns: [["编号", row => row.id], ["调研专题", row => row.task, "long"], ["所属维度", row => row.dimension], ["牵头单位", row => row.owner], ["配合单位", row => row.co, "long"], ["调研时间", row => row.researchTime], ["时间节点", row => row.timeNode || row.time], ["预期目标", row => row.target, "long"]], status: () => "已纳入"
    }
  };

  const content = document.getElementById("workbenchContent");
  const navItems = [...document.querySelectorAll(".admin-nav")];

  function getRecords(key) {
    if (key === "tasks") return window.TASKS_DATA?.tasks || [];
    if (key === "projects") return window.PROJECTS_DATA?.projects || [];
    if (key === "platforms") return Array.isArray(window.PLATFORMS_DATA) ? window.PLATFORMS_DATA : window.PLATFORMS_DATA?.platforms || [];
    if (key === "scenes") return window.SCENES_DATA?.items || window.SCENES_DATA?.scenes || [];
    if (key === "meetings") return (window.NEWS_DATA?.items || []).filter(row => row.category === "活动会议");
    if (key === "research") return (window.TASKS_DATA?.tasks || []).filter(row => row.researchTime);
    return [];
  }

  function status(value) {
    const text = String(value || "已入库");
    const cls = text.includes("待") || text.includes("谋划") ? "todo" : text.includes("评审") ? "warn" : "";
    return `<span class="wb-status ${cls}">${esc(text)}</span>`;
  }

  function heading(module) {
    return `<div class="content-heading"><div><h2>${esc(module.title)}</h2><p>${esc(module.desc)}</p></div></div>`;
  }

  function overview() {
    const demoRows = [
      ["重点任务", "人工智能公共算力资源统筹", "省发展改革委", "正常推进"],
      ["重大项目", "省级行业大模型创新平台建设", "省经信厅", "待更新"],
      ["应用场景", "制造业质量检测智能化改造", "省经信厅", "评审中"],
      ["会议督办", "算力资源统筹调度专题会", "省人工智能办公室", "待办理"]
    ];
    content.innerHTML = `${heading({ title: "工作台总览", desc: "集中处理任务、项目、场景、会议和调研事项。" })}
      <div class="wb-metrics"><div class="wb-metric"><strong>128</strong><span>在库任务与项目</span></div><div class="wb-metric"><strong>16</strong><span>本周待办理事项</span></div><div class="wb-metric"><strong>7</strong><span>待更新进展</span></div><div class="wb-metric"><strong>92%</strong><span>按期办理率</span></div></div>
      <section class="wb-panel"><div class="wb-panel-head"><h3>近期办理事项</h3><span>按更新时间排序</span></div><table class="wb-table"><thead><tr><th>事项类型</th><th>事项名称</th><th>责任单位</th><th>当前状态</th></tr></thead><tbody>${demoRows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${status(row[3])}</td></tr>`).join("")}</tbody></table></section>`;
  }

  function getListColumns(key, columns) {
    const indexes = {
      tasks: [0, 1, 2, 6, 7],
      projects: [0, 1, 3, 4, 6, 7, 8],
      platforms: [0, 1, 2, 3, 4],
      scenes: [0, 1, 2, 3, 4],
      meetings: [0, 1, 2, 3],
      research: [0, 1, 2, 3, 5]
    };
    return (indexes[key] || []).map(index => columns[index]);
  }

  function openDetail(module, row) {
    const layer = document.createElement("div");
    layer.className = "wb-detail-layer";
    layer.innerHTML = `<section class="wb-detail" role="dialog" aria-modal="true" aria-label="${esc(module.title)}详情"><header class="wb-detail-head"><div><p>${esc(module.title)}</p><h3>记录详情</h3></div><button class="wb-close" type="button" aria-label="关闭">×</button></header><dl class="wb-detail-list">${module.columns.map(([label, read]) => `<div><dt>${esc(label)}</dt><dd>${esc(read(row) || "—")}</dd></div>`).join("")}</dl></section>`;
    document.body.appendChild(layer);
    const close = () => layer.remove();
    layer.querySelector(".wb-close").addEventListener("click", close);
    layer.addEventListener("click", event => { if (event.target === layer) close(); });
  }

  function moduleView(key) {
    const module = modules[key];
    if (module.placeholder) {
      content.innerHTML = `${heading(module)}<section class="wb-panel wb-placeholder" role="status"><span class="wb-placeholder-icon" aria-hidden="true"><span></span></span><strong>正在开发</strong><p>${esc(module.placeholder)}</p></section>`;
      return;
    }
    const records = getRecords(key);
    const detailColumns = module.columns;
    const columns = getListColumns(key, detailColumns);
    const statuses = [...new Set(records.map(row => module.status(row)).filter(Boolean))];
    content.innerHTML = `${heading(module)}<section class="wb-panel"><div class="wb-toolbar"><input id="wbSearch" placeholder="搜索${esc(module.title)}记录"><select id="wbStatus"><option value="">全部状态</option>${statuses.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join("")}</select></div><div class="wb-table-wrap"><table class="wb-table wb-table-detail"><thead><tr>${columns.map(([label]) => `<th>${esc(label)}</th>`).join("")}<th>状态</th><th>操作</th></tr></thead><tbody id="wbRows"></tbody></table></div></section>`;
    const render = () => {
      const query = document.getElementById("wbSearch").value.trim().toLowerCase();
      const filter = document.getElementById("wbStatus").value;
      const visible = records.filter(row => {
        const values = detailColumns.map(([, read]) => read(row)).join(" ").toLowerCase();
        return (!query || values.includes(query)) && (!filter || module.status(row) === filter);
      });
      document.getElementById("wbRows").innerHTML = visible.map((row, index) => `<tr>${columns.map(([, read]) => `<td title="${esc(read(row))}">${esc(read(row) || "—")}</td>`).join("")}<td>${status(module.status(row))}</td><td><button class="wb-detail-trigger" type="button" data-record-index="${index}">查看详情</button></td></tr>`).join("") || `<tr><td colspan="${columns.length + 2}" class="wb-empty">暂无符合条件的记录</td></tr>`;
      document.querySelectorAll(".wb-detail-trigger").forEach(button => button.addEventListener("click", () => openDetail(module, visible[Number(button.dataset.recordIndex)])));
    };
    render();
    document.getElementById("wbSearch").addEventListener("input", render);
    document.getElementById("wbStatus").addEventListener("change", render);
  }

  function openForm(module) {
    const fields = module.formFields || module.fields;
    const layer = document.createElement("div");
    layer.className = "wb-form-layer open";
    layer.innerHTML = `<form class="wb-form"><div class="wb-form-head"><h3>${module.action ? esc(module.action) : "新建" + esc(module.title) + "记录"}</h3><button type="button" class="wb-close" aria-label="关闭">×</button></div><div class="wb-fields">${fields.map((field, index) => {
      const multiline = field.includes("简述") || field.includes("事项") || field.includes("目标") || field.includes("成效");
      const date = field.includes("时间") || field.includes("月份") || field.includes("节点");
      const number = field.includes("投资");
      const control = number ? '<input type="number" min="0" step="0.01" placeholder="0.00" required>' : date ? (field.includes("月份") ? '<input type="month" required>' : '<input type="date" required>') : multiline ? `<textarea placeholder="填写${esc(field)}" required></textarea>` : `<input placeholder="填写${esc(field)}" required>`;
      return `<div class="wb-field ${multiline ? "full" : ""}"><label>${esc(field)}</label>${control}</div>`;
    }).join("")}</div><div class="wb-form-actions"><button type="button" class="cancel">取消</button><button class="submit">提交记录</button></div></form>`;
    document.body.appendChild(layer);
    const close = () => layer.remove();
    layer.querySelector(".wb-close").addEventListener("click", close);
    layer.querySelector(".cancel").addEventListener("click", close);
    layer.addEventListener("click", event => { if (event.target === layer) close(); });
    layer.querySelector("form").addEventListener("submit", event => { event.preventDefault(); close(); showToast("记录已提交，等待后台校验"); });
  }

  function showToast(message) {
    let toast = document.querySelector(".wb-toast");
    if (!toast) { toast = document.createElement("div"); toast.className = "wb-toast"; document.body.appendChild(toast); }
    toast.textContent = message; toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function chatView() {
    content.innerHTML = `<section class="wb-chat-panel">
        <div class="wb-chat-main">
          <div class="wb-chat-welcome" id="chatWelcome"><div class="wb-chat-icon">AI</div><h3>欢迎使用智能问答</h3><p>请勾选知识库范围后，输入需要查询的问题。</p><div class="wb-chat-suggestions"><button data-chat-question="浙江省人工智能近期有哪些重点支持政策？">近期重点支持政策</button><button data-chat-question="重大项目推进情况如何？">重大项目进展</button><button data-chat-question="应用场景落地情况最好的领域是哪些？">场景落地情况</button><button data-chat-question="产业链图谱的核心节点企业有哪些？">核心节点企业</button></div></div>
          <div class="wb-chat-messages" id="chatMessages" hidden></div>
        </div>
        <div class="wb-chat-input">
          <div class="wb-chat-kb" id="chatKb"><label><input type="checkbox" class="kb-check" value="all" checked> 全部知识库</label><label><input type="checkbox" class="kb-check" value="policies" checked> 政策库</label><label><input type="checkbox" class="kb-check" value="tasks" checked> 任务库</label><label><input type="checkbox" class="kb-check" value="projects" checked> 项目库</label><label><input type="checkbox" class="kb-check" value="scenes" checked> 场景库</label><label><input type="checkbox" class="kb-check" value="platforms" checked> 平台库</label><label><input type="checkbox" class="kb-check" value="experts" checked> 专家库</label><label><input type="checkbox" class="kb-check" value="news" checked> 资讯库</label><label><input type="checkbox" class="kb-check" value="objects" checked> 目标体系</label><label class="kb-extra"><input type="checkbox" class="kb-check" value="monitoring"> 统计监测</label></div>
          <div class="wb-chat-row"><textarea id="chatInput" placeholder="输入问题，例如：杭州人工智能算力平台建设进展如何？" rows="1" maxlength="2000"></textarea><button id="sendChat" type="button" aria-label="发送问题">↑</button></div>
          <div class="wb-chat-hint">按 Ctrl＋Enter 发送 · <button id="clearChat" type="button" style="background:none;border:none;color:#2674d6;cursor:pointer;font:inherit;padding:0">清空对话</button></div>
        </div>
      </section>`;

    const input = document.getElementById("chatInput");
    const messages = document.getElementById("chatMessages");
    const welcome = document.getElementById("chatWelcome");
    const datasets = {
      policies: window.POLICIES_DATA?.policies || [], tasks: window.TASKS_DATA?.tasks || [], projects: window.PROJECTS_DATA?.projects || [],
      scenes: window.SCENES_DATA?.scenes || window.SCENES_DATA?.items || [], platforms: Array.isArray(window.PLATFORMS_DATA) ? window.PLATFORMS_DATA : window.PLATFORMS_DATA?.platforms || [],
      experts: window.EXPERTS_DATA?.members || [], news: window.NEWS_DATA?.items || [], objects: window.OBJECTS_DATA ? [window.OBJECTS_DATA] : [], monitoring: window.MONITORING_DATA?.months || []
    };
    const labels = { policies: "政策库", tasks: "任务库", projects: "项目库", scenes: "场景库", platforms: "平台库", experts: "专家库", news: "资讯库", objects: "目标体系", monitoring: "统计监测" };
    const getSelected = () => [...document.querySelectorAll(".kb-check:checked")].map(el => el.value);
    const showMessage = (role, text) => { messages.insertAdjacentHTML("beforeend", `<div class="wb-chat-message ${role}"><span class="wb-chat-avatar">${role === "user" ? "我" : "AI"}</span><div>${esc(text).replace(/\n/g, "<br>")}</div></div>`); messages.scrollTop = messages.scrollHeight; };
    const answer = question => {
      const selected = getSelected();
      const q = question.toLowerCase();
      const responses = [];
      if (selected.includes("policies") && /政策|支持|补贴|资金|优惠/.test(q)) { const list = datasets.policies.slice(0, 5).map(item => `－ ${item.name}（${item.date}）`).join("\n"); if (list) responses.push(`根据政策库，相关政策包括：\n${list}`); }
      if (selected.includes("projects") && /项目|投资|建设|推进/.test(q)) { const list = datasets.projects.slice(0, 5).map(item => `－ ${item.name}（${item.field || item.category || "综合"}）`).join("\n"); if (list) responses.push(`根据项目库，在库重点项目包括：\n${list}`); }
      if (selected.includes("tasks") && /任务|进展|完成|推进/.test(q)) { const list = datasets.tasks.slice(0, 5).map(item => `－ ${item.task}（责任单位：${item.owner}）`).join("\n"); if (list) responses.push(`根据任务库，相关重点任务包括：\n${list}`); }
      if (selected.includes("scenes") && /场景|应用|落地|行业/.test(q)) { responses.push(`场景库目前收录 ${datasets.scenes.length} 个应用场景。可在"场景遴选"模块进一步筛选查看。`); }
      if (selected.includes("platforms") && /平台|算力|超算|数据中心/.test(q)) { const list = datasets.platforms.slice(0, 5).map(item => `－ ${item.name}（${item.city || item.location || "全省"}）`).join("\n"); if (list) responses.push(`根据平台库，相关平台包括：\n${list}`); }
      if (selected.includes("experts") && /专家|委员会|智库/.test(q)) { responses.push(`专家库当前收录 ${datasets.experts.length} 位专家，可按领域和单位进一步查询。`); }
      if (selected.includes("news") && /新闻|动态|资讯|公告/.test(q)) { const list = datasets.news.slice(0, 5).map(item => `－ ${item.title}（${item.date}）`).join("\n"); if (list) responses.push(`近期资讯动态：\n${list}`); }
      if (selected.includes("objects") && /目标|2026|2030|规模/.test(q)) { const overall = window.OBJECTS_DATA?.overall; if (overall) responses.push(`目标体系总体定位：${overall.vision || "暂无相关记录"}`); }
      if (selected.includes("monitoring") && /营收|研发|企业数|增长|同比/.test(q)) { const latest = datasets.monitoring.at(-1); if (latest?.province) responses.push(`最新一期统计监测数据（${latest.month}）：企业数 ${latest.province.enterprises} 家，营业收入 ${(latest.province.revenue / 1000).toFixed(1)} 亿元。`); }
      return responses.length ? `${responses.join("\n\n")}\n\n信息来源：${selected.map(key => labels[key]).join("、")}。` : `在当前选择的知识库中，暂无与"${question}"直接匹配的记录。请调整知识库范围或更换查询表述。`;
    };
    const send = () => { const question = input.value.trim(); if (!question) return; welcome.hidden = true; messages.hidden = false; showMessage("user", question); input.value = ""; window.setTimeout(() => showMessage("assistant", answer(question)), 220); };
    document.getElementById("sendChat").addEventListener("click", send);
    input.addEventListener("keydown", event => { if (event.key === "Enter" && event.ctrlKey) { event.preventDefault(); send(); } });
    document.querySelectorAll("[data-chat-question]").forEach(button => button.addEventListener("click", () => { input.value = button.dataset.chatQuestion; send(); }));
    document.getElementById("clearChat").addEventListener("click", () => { messages.innerHTML = ""; messages.hidden = true; welcome.hidden = false; input.focus(); });
    document.querySelectorAll(".kb-check[value='all']").forEach(allCheck => {
      allCheck.addEventListener("change", () => { document.querySelectorAll(".kb-check:not([value='all'])").forEach(el => el.checked = allCheck.checked); });
    });
    document.querySelectorAll(".kb-check:not([value='all'])").forEach(el => {
      el.addEventListener("change", () => { if (!el.checked) { const all = document.querySelector(".kb-check[value='all']"); if (all) all.checked = false; } });
    });
  }

  function render(key) {
    navItems.forEach(item => item.classList.toggle("active", item.dataset.module === key));
    if (key === "chat") { chatView(); return; }
    if (key === "overview") overview(); else moduleView(key);
  }

  navItems.forEach(item => item.addEventListener("click", () => {
    const key = item.dataset.module;
    history.replaceState(null, "", `#${key}`);
    render(key);
  }));
  const initialModule = location.hash.slice(1);
  render(modules[initialModule] ? initialModule : "overview");
}());
