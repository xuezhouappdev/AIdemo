(function () {
  "use strict";

  const esc = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const page = document.body.dataset.opsPage;
  const cityMap = "../assets/浙江省人工智能地市布局图_优势领域连线总图.svg";
  const datasets = {
    meetings: {
      mark: "MEET", title: "会议管理", subtitle: "MEETING MANAGEMENT",
      description: "归集专题会议议题、纪要、督办事项和办理状态，形成会前准备、会中决策、会后督办的闭环管理。",
      metrics: [["12", "年度会议议题"], ["8", "待督办事项"], ["92%", "按期办结率"]],
      filters: ["全部会议", "省级专题会议", "部门协调会议", "地市工作会议"],
      fields: ["会议名称", "会议类型", "召开时间", "牵头单位", "办理状态"],
      items: [
        { name: "人工智能高质量发展工作专班第二次会议", type: "省级专题会议", date: "2026－08－21", owner: "省人工智能办公室", status: "纪要待发", detail: "审议重点项目、场景遴选和要素保障事项，明确相关责任分工及办理时限。" },
        { name: "算力资源统筹调度专题会", type: "部门协调会议", date: "2026－08－14", owner: "省发展改革委", status: "督办中", detail: "研究省级算力调度平台纳管、资源供给和重点主体服务保障安排。" },
        { name: "人工智能应用场景供需对接会", type: "省级专题会议", date: "2026－07－30", owner: "省经信厅", status: "已办结", detail: "围绕制造、医疗、文旅等领域梳理需求清单与供给能力，形成后续对接计划。" },
        { name: "地市人工智能工作推进调度会", type: "地市工作会议", date: "2026－07－18", owner: "省人工智能办公室", status: "已办结", detail: "调度各地一市一方案编制进展，汇总特色赛道、重点项目和需省级协调事项。" }
      ]
    },
    research: {
      mark: "RE", title: "调研管理", subtitle: "RESEARCH MANAGEMENT",
      description: "集中管理专题调研计划、走访记录、问题清单和研究成果，为决策调度提供依据。",
      metrics: [["16", "年度调研课题"], ["37", "已走访主体"], ["11", "待研究问题"]],
      filters: ["全部调研", "算力与数据", "模型与应用", "产业生态"],
      fields: ["调研专题", "研究方向", "进展阶段", "牵头单位", "成果状态"],
      items: [
        { name: "人工智能算力资源统筹利用情况调研", type: "算力与数据", date: "实地走访", owner: "省发展改革委", status: "报告编制", detail: "梳理算力布局、供需匹配、调度机制及重点主体服务需求，形成政策建议。" },
        { name: "高质量数据集建设与流通应用调研", type: "算力与数据", date: "材料汇集", owner: "省数据局", status: "问题研究", detail: "围绕重点行业数据集建设、合规流通和场景使用，形成问题清单与典型案例。" },
        { name: "人工智能赋能制造业专项调研", type: "模型与应用", date: "实地走访", owner: "省经信厅", status: "持续推进", detail: "聚焦研发设计、生产制造、供应链协同等环节，识别可复制的人工智能应用模式。" },
        { name: "人工智能人才与开源生态调研", type: "产业生态", date: "座谈交流", owner: "省科技厅", status: "成果归集", detail: "了解人才引育、开源社区、创新平台和企业服务体系建设情况。" }
      ]
    },
    companies: {
      mark: "CO", title: "企业库", subtitle: "ENTERPRISE DIRECTORY",
      description: "按核心赛道、地区和能力标签归集重点企业，支撑招商服务、供需对接与产业运行监测。",
      metrics: [["58", "示例重点企业"], ["5", "核心产业赛道"], ["11", "地市覆盖"]],
      filters: ["全部企业", "算力基础", "数据服务", "模型研发", "应用解决方案", "生态服务"],
      fields: ["企业名称", "所属赛道", "所在地区", "能力标签", "服务状态"],
      items: [
        { name: "杭州智算科技有限公司", type: "算力基础", date: "杭州", owner: "智算服务、调度平台", status: "重点服务", detail: "提供人工智能训练与推理算力服务，具备资源调度、模型适配和运维保障能力。" },
        { name: "宁波工业智能研究院有限公司", type: "应用解决方案", date: "宁波", owner: "工业视觉、设备预测", status: "持续跟踪", detail: "面向制造企业开展质量检测、设备运维和生产调度等人工智能应用服务。" },
        { name: "湖州时空数据技术有限公司", type: "数据服务", date: "湖州", owner: "时空数据、数据治理", status: "重点服务", detail: "围绕地理信息与时空数据提供数据治理、数据集建设和应用开发服务。" },
        { name: "温州具身智能创新中心", type: "模型研发", date: "温州", owner: "机器人模型、场景训练", status: "持续跟踪", detail: "开展具身智能模型、训练数据和重点场景验证，服务轻工制造与商贸物流。" }
      ]
    }
  };

  function platformData() {
    return {
      mark: "OPS", title: "平台调度", subtitle: "PLATFORM DISPATCH",
      summaryLabel: "1+6+1 人工智能重大生产力布局",
      description: "人工智能xlc｜行业应用基地｜中阿合作应用中心",
      metrics: () => [[String((window.PLATFORMS_DATA || []).length), "已归集平台"], ["5", "覆盖重点维度"], ["月度", "调度更新频率"]],
      filters: ["全部平台", "算力", "数据", "模型", "应用", "生态"],
      fields: ["平台名称", "所属领域", "建设主体", "投资规模", "建设状态"],
      items: (window.PLATFORMS_DATA || []).map(item => ({ name: item.name, type: item.category || "其他", date: item.organization || "待补充", owner: item.investment && item.investment !== "\\" ? `${item.investment}亿元` : "待补充", status: "持续调度", detail: item.progress || item.content || "暂无进展信息。" }))
    };
  }

  function header(data) {
    return `<header class="ops-header"><div class="ops-title"><span class="ops-mark">${esc(data.mark)}</span><div><small>${esc(data.subtitle)}</small><h1>${esc(data.title)}</h1></div></div><nav class="ops-crumb" aria-label="面包屑导航"><a href="../index.html">工作推进总览</a><span>／</span><strong>${esc(data.title)}</strong></nav></header>`;
  }

  function projectOverview(data) {
    const items = data.items || [];
    const sum = field => items.reduce((total, item) => total + (Number(item.raw?.[field]) || 0), 0);
    const rawGroups = field => items.reduce((groups, item) => {
      const name = item.raw?.[field] || "未分类";
      groups[name] = groups[name] || { name, count: 0, investment: 0 };
      groups[name].count += 1;
      groups[name].investment += Number(item.raw?.总投资) || 0;
      return groups;
    }, {});
    const categories = Object.values(rawGroups("大类"));
    const statuses = Object.values(rawGroups("建设性质"));
    const maxCount = Math.max(...categories.map(item => item.count), 1);
    const maxInvestment = Math.max(...categories.map(item => item.investment), 1);
    const money = value => Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
    return `<section class="project-overview" aria-label="项目运行概览">
      <header class="project-overview-head"><div><span>PROJECT OVERVIEW</span><h2>项目运行概览</h2></div><p>项目规模、投资结构与建设状态</p></header>
      <div class="project-kpis">
        <button class="project-kpi active" type="button" data-project-overview-clear><strong>${items.length}</strong><span>项目总数</span></button>
        <div class="project-kpi"><strong>${money(sum("总投资"))}<em>亿元</em></strong><span>总投资</span></div>
        <div class="project-kpi"><strong>${money(sum("2026年计划投资"))}<em>亿元</em></strong><span>2026年计划投资</span></div>
        <div class="project-kpi"><strong>${money(sum("截至2025年底完成投资"))}<em>亿元</em></strong><span>截至2025年底完成投资</span></div>
        <button class="project-kpi" type="button" data-project-overview-status="在建"><strong>${statuses.find(item => item.name === "在建")?.count || 0}</strong><span>在建项目</span></button>
        <button class="project-kpi" type="button" data-project-overview-status="新建及谋划"><strong>${statuses.filter(item => ["新建", "谋划"].includes(item.name)).reduce((total, item) => total + item.count, 0)}</strong><span>新建及谋划项目</span></button>
      </div>
      <div class="project-analysis">
        <section class="project-analysis-section"><header><h3>项目分类分布</h3><span>按数量统计</span></header><div class="project-category-list">${categories.map(item => `<button type="button" data-project-overview-category="${esc(item.name)}"><span>${esc(item.name)}</span><i><b style="width:${Math.max(item.count / maxCount * 100, 8)}%"></b></i><strong>${item.count}</strong></button>`).join("")}</div></section>
        <section class="project-analysis-section"><header><h3>投资结构</h3><span>按总投资统计</span></header><div class="project-investment-list">${categories.map(item => `<button type="button" data-project-overview-category="${esc(item.name)}"><span>${esc(item.name)}</span><i><b style="width:${Math.max(item.investment / maxInvestment * 100, 8)}%"></b></i><strong>${money(item.investment)}<small>亿元</small></strong></button>`).join("")}</div></section>
        <section class="project-analysis-section project-status-section"><header><h3>建设状态</h3><span>点击筛选台账</span></header><div class="project-status-list">${statuses.map(item => `<button type="button" data-project-overview-status="${esc(item.name)}"><strong>${item.count}</strong><span>${esc(item.name)}</span></button>`).join("")}</div></section>
      </div>
    </section>`;
  }

  function renderList(data) {
    const filters = data.filters.map((item, index) => `<button type="button" class="ops-filter${index === 0 ? " active" : ""}" data-filter="${esc(item)}">${esc(item)}</button>`).join("");
    const metricValues = typeof data.metrics === "function" ? data.metrics() : (data.metrics || []);
    const metrics = metricValues.map(([value, label]) => `<div class="ops-metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join("");
    const summaryIntro = data.description ? `<div class="ops-summary-intro"><span>${esc(data.summaryLabel || "工作模块")}</span><p>${esc(data.description)}</p></div>` : "";
    const projectPage = page === "projects";
    const overview = projectPage ? projectOverview(data) : "";
    const summary = projectPage ? "" : `<section class="ops-summary">${summaryIntro}${metrics}</section>`;
    document.body.innerHTML = `${header(data)}<main class="ops-shell">${overview}${summary}<section class="ops-workspace"><aside class="ops-side"><header class="ops-side-head"><h2>分类筛选</h2><span>FILTER</span></header><div class="ops-filter-list">${filters}</div></aside><section class="ops-main"><header class="ops-main-head"><h2>${esc(data.title)}台账</h2><span id="opsCount"></span></header><div class="ops-toolbar"><input class="ops-search" id="opsSearch" type="search" placeholder="搜索名称、主体或关键词"><button type="button" class="ops-refresh" id="opsRefresh">重置筛选</button></div><div class="ops-table"><div class="ops-row head"><span>序号</span>${data.fields.map(field => `<span>${esc(field)}</span>`).join("")}<span></span></div><div id="opsRows"></div></div></section></section></main><div class="ops-detail-layer" id="opsDetail" aria-live="polite" hidden></div>`;
    let activeFilter = data.filters[0];
    let projectStatus = "";
    let query = "";
    const rows = document.getElementById("opsRows");
    const count = document.getElementById("opsCount");
    const detail = document.getElementById("opsDetail");
    const comingSoon = ["meetings", "research"].includes(page);
    const matchesProjectStatus = item => {
      if (!projectStatus) return true;
      if (projectStatus === "新建及谋划") return ["新建", "谋划"].includes(item.status);
      return item.status === projectStatus;
    };
    const visibleItems = () => comingSoon ? [] : data.items.filter(item =>
      (activeFilter === data.filters[0] || item.type === activeFilter) &&
      matchesProjectStatus(item) &&
      `${item.name}${item.type}${item.date}${item.owner}${item.status}${item.detail}${Object.values(item.extra || {}).join("")}`.toLowerCase().includes(query.toLowerCase())
    );
    const projectHistory = item => {
      if (page !== "projects") return "";
      try {
        const store = JSON.parse(localStorage.getItem("projectDispatchStore") || "{}");
        const records = store.byProjectId?.[String(item.id)] || [];
        if (!records.length) return '<p class="ops-history-empty">暂无月度调度记录。</p>';
        return `<h3>历史调度记录</h3><div class="ops-history">${records.slice(0, 6).map(record => `<div><b>${esc(record.month || "—")}</b><span>${esc(record.phase || "—")}</span><p>${esc(record.progressNote || "—")}</p></div>`).join("")}</div>`;
      } catch (error) { return ""; }
    };
    const closeDetail = () => {
      detail.hidden = true;
      detail.innerHTML = "";
      document.body.classList.remove("ops-detail-open");
    };
    const showDetail = item => {
      const extra = Object.entries(item.extra || {}).map(([label, value]) => `<div class="ops-detail-field"><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join("");
      const policyLink = item.extra?.["政策文件"] ? `<a class="ops-detail-link" href="${esc(item.extra["政策文件"])}" target="_blank" rel="noopener"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i>浏览政策文件</a>` : "";
      const isPolicy = page === "policies";
      const detailContent = `<span class="ops-detail-kicker">${esc(data.title)}详情</span><h2 id="opsDetailTitle">${esc(item.name)}</h2><div class="ops-detail-meta">${esc(item.type)}　·　${esc(item.date)}　·　${esc(item.status)}</div><div class="ops-detail-fields">${extra}</div><h3>摘要说明</h3><p>${esc(item.detail)}</p>${policyLink}${projectHistory(item)}`;
      detail.className = `ops-detail-layer ${isPolicy ? "ops-detail-modal" : "ops-detail-drawer"}`;
      detail.innerHTML = `<div class="ops-detail-backdrop" data-close-detail></div><section class="ops-detail-panel" role="dialog" aria-modal="true" aria-labelledby="opsDetailTitle"><header class="ops-detail-head"><span>${isPolicy ? "政策文件详情" : `${esc(data.title)}详情`}</span><button class="ops-detail-close" type="button" aria-label="关闭详情"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header><div class="ops-detail-body">${detailContent}</div></section>`;
      detail.hidden = false;
      document.body.classList.add("ops-detail-open");
      detail.querySelectorAll("[data-close-detail], .ops-detail-close").forEach(button => button.addEventListener("click", closeDetail));
      detail.querySelector(".ops-detail-close").focus();
    };
    const renderRows = () => {
      const items = visibleItems();
      count.textContent = comingSoon ? "功能建设中" : `共 ${items.length} 条`;
      rows.innerHTML = items.length ? items.map((item, index) => `<div class="ops-row" data-index="${index}" tabindex="0"><span class="ops-id">${String(index + 1).padStart(2, "0")}</span><span><span class="ops-name">${esc(item.name)}</span><span class="ops-sub">${esc(item.detail)}</span></span><span><span class="ops-tag">${esc(item.type)}</span></span><span>${esc(item.date)}</span><span>${esc(item.owner)}</span><span>${esc(item.status)}</span><span class="ops-arrow">›</span></div>`).join("") : (comingSoon ? '<div class="ops-empty-state"><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i><strong>正在开发</strong><span>该功能正在建设中，后续将接入正式台账数据。</span></div>' : '<p class="ops-empty">未检索到匹配记录。</p>');
      [...rows.querySelectorAll(".ops-row")].forEach((row, index) => {
        row.addEventListener("click", () => showDetail(items[index]));
        row.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showDetail(items[index]); } });
      });
    };
    const syncProjectOverviewState = () => {
      if (!projectPage) return;
      document.querySelectorAll("[data-project-overview-category]").forEach(button => button.classList.toggle("active", button.dataset.projectOverviewCategory === activeFilter));
      document.querySelectorAll("[data-project-overview-status]").forEach(button => button.classList.toggle("active", button.dataset.projectOverviewStatus === projectStatus));
      document.querySelector("[data-project-overview-clear]")?.classList.toggle("active", activeFilter === data.filters[0] && !projectStatus);
    };
    document.querySelectorAll(".ops-filter").forEach(button => button.addEventListener("click", () => { activeFilter = button.dataset.filter; document.querySelectorAll(".ops-filter").forEach(item => item.classList.toggle("active", item === button)); syncProjectOverviewState(); renderRows(); }));
    document.querySelectorAll("[data-project-overview-category]").forEach(button => button.addEventListener("click", () => {
      const target = [...document.querySelectorAll(".ops-filter")].find(item => item.dataset.filter === button.dataset.projectOverviewCategory);
      target?.click();
    }));
    document.querySelectorAll("[data-project-overview-status]").forEach(button => button.addEventListener("click", () => {
      projectStatus = projectStatus === button.dataset.projectOverviewStatus ? "" : button.dataset.projectOverviewStatus;
      syncProjectOverviewState();
      renderRows();
    }));
    document.querySelector("[data-project-overview-clear]")?.addEventListener("click", () => {
      projectStatus = "";
      document.querySelector(`.ops-filter[data-filter="${data.filters[0]}"]`)?.click();
    });
    document.getElementById("opsSearch").addEventListener("input", event => { query = event.target.value.trim(); renderRows(); });
    document.getElementById("opsRefresh").addEventListener("click", () => { activeFilter = data.filters[0]; projectStatus = ""; query = ""; document.getElementById("opsSearch").value = ""; document.querySelectorAll(".ops-filter").forEach((button, index) => button.classList.toggle("active", index === 0)); syncProjectOverviewState(); renderRows(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !detail.hidden) closeDetail(); });
    syncProjectOverviewState();
    renderRows();
  }

  function resourceData() {
    const configs = {
      policies: {
        mark: "POL", title: "政策体系", subtitle: "POLICY DIRECTORY",
        summaryLabel: "1+5+N 政策体系",
        description: "总纲政策｜五大领域｜N项配套",
        metrics: () => [[String((window.POLICIES_DATA?.policies || []).length), "已归集政策"], [String(new Set((window.POLICIES_DATA?.policies || []).map(item => item.category)).size), "重点领域"], [String((window.POLICIES_DATA?.policies || []).filter(item => item.pdfUrl).length), "可浏览文件"]],
        source: () => (window.POLICIES_DATA?.policies || []).map(item => ({
          id: item.id, name: item.name, type: item.category || "未分类", date: item.issuer || "—",
          owner: item.department || "—", status: item.date || "—", detail: `政策发布于${item.date || "—"}，发文层级为${item.issuer || "—"}。`,
          extra: item.pdfUrl ? { "政策文件": item.pdfUrl } : {}
        })),
        filters: () => ["全部政策", ...new Set((window.POLICIES_DATA?.policies || []).map(item => item.category).filter(Boolean))],
        fields: ["政策名称", "所属领域", "发文层级", "责任部门", "发文时间"]
      },
      tasks: {
        mark: "TASK", title: "重点任务", subtitle: "KEY TASK DIRECTORY",
        description: "按所属领域归集重点任务清单，集中展示责任单位、协同单位、时间节点和预期目标。",
        metrics: () => [[String((window.TASKS_DATA?.tasks || []).length), "重点任务"], [String((window.TASKS_DATA?.dimensions || []).length), "重点领域"], [String((window.TASKS_DATA?.tasks || []).filter(item => item.importance).length), "重点关注任务"]],
        source: () => (window.TASKS_DATA?.tasks || []).map(item => ({
          id: item.id, name: item.task || "未命名任务", type: item.dimension || "未分类", date: item.owner || "—",
          owner: item.co || "—", status: item.timeNode || item.time || "—",
          detail: item.target ? `预期目标：${item.target}` : "暂无目标说明。",
          extra: { "重点任务": item.group || "—", "重要程度": item.importance || "未标记" }
        })),
        filters: () => ["全部任务", ...new Set((window.TASKS_DATA?.dimensions || []).filter(Boolean))],
        fields: ["任务内容", "所属领域", "责任单位", "协同单位", "时间节点"]
      },
      projects: {
        mark: "PROJ", title: "重大项目", subtitle: "MAJOR PROJECT DIRECTORY",
        description: "按所属领域归集重大项目，展示建设地点、投资计划、项目业主和建设性质等基础信息。",
        metrics: () => { const items = window.PROJECTS_DATA?.projects || []; return [[String(items.length), "重大项目"], [String(new Set(items.map(item => item.大类)).size), "重点领域"], [`${items.reduce((sum, item) => sum + (Number(item.总投资) || 0), 0).toFixed(2)}`, "总投资（亿元）"]]; },
        source: () => (window.PROJECTS_DATA?.projects || []).map(item => ({
          id: item.序号, name: item.项目名称 || "未命名项目", type: item.大类 || "未分类", date: item.建设地点 || "—",
          owner: item.项目业主 || "—", status: item.建设性质 || "—",
          detail: `总投资：${item.总投资 ?? "—"} 亿元；2026年计划投资：${item["2026年计划投资"] ?? "—"} 亿元。`,
          extra: { "细分赛道": item.领域 || "—", "起止年限": item.起止年限 || "—", "截至2025年底完成投资": item["截至2025年底完成投资"] ?? "—" }, raw: item
        })),
        filters: () => ["全部项目", ...new Set((window.PROJECTS_DATA?.projects || []).map(item => item.大类).filter(Boolean))],
        fields: ["项目名称", "所属领域", "建设地点", "项目业主", "建设性质"]
      },
      scenes: {
        mark: "SCN", title: "应用场景", subtitle: "SCENARIO DIRECTORY",
        description: "按场景领域和地市归集人工智能应用场景，支持场景供需信息浏览和详情查看。",
        metrics: () => { const items = window.SCENES_DATA?.items || []; return [[String(items.length), "应用场景"], [String(new Set(items.map(item => item.category?.main || "其他")).size), "场景领域"], [String(new Set(items.map(item => item.地市 || item.所在地点).filter(Boolean)).size), "覆盖地市"]]; },
        source: () => (window.SCENES_DATA?.items || []).map(item => ({
          id: item.序号, name: item.场景名称 || "未命名场景", type: item.category?.main || "其他", date: item.地市 || item.所在地点 || "—",
          owner: item.业主单位 || "—", status: item.主管部门 || "—", detail: item.场景说明 || "暂无场景说明。",
          extra: { "原始场景领域": item.场景领域 || "—", "所在地点": item.所在地点 || "—", "备注": item.备注 || "—" }
        })),
        filters: () => ["全部场景", ...new Set((window.SCENES_DATA?.items || []).map(item => item.category?.main || "其他"))],
        fields: ["场景名称", "场景领域", "地市", "业主单位", "主管部门"]
      }
    };
    const config = configs[page];
    if (!config) return null;
    return { ...config, items: config.source(), filters: config.filters() };
  }

  function renderResource(data) {
    renderList(data);
  }

  function renderIndustryChain() {
    const data = { mark: "CHAIN", title: "产业链图", subtitle: "AI INDUSTRY CHAIN", description: "以五大维度统筹展示人工智能产业链关键环节、支撑要素和应用方向。", metrics: [["5", "核心维度"], ["20", "重点环节"], ["11", "地市协同"]] };
    const nodes = [["算力基础", "智算中心、芯片适配、算力调度、绿色供能"], ["数据资源", "高质量数据集、数据治理、合规流通、可信空间"], ["模型能力", "基础模型、垂类模型、智能体、测评工具"], ["应用场景", "制造、医疗、文旅、治理、科研等行业应用"], ["创新生态", "企业培育、人才引育、开源社区、标准服务"]];
    document.body.innerHTML = `${header(data)}<main class="ops-shell"><section class="ops-summary"><div class="ops-summary-intro"><span>产业链总览</span><p>${data.description}</p></div>${data.metrics.map(([value, label]) => `<div class="ops-metric"><strong>${value}</strong><span>${label}</span></div>`).join("")}</section><section class="ops-main" style="margin-top:14px"><header class="ops-main-head"><h2>人工智能产业链工作图</h2><span>按五维协同推进</span></header><div class="ops-chain">${nodes.map(([title, desc]) => `<article class="ops-chain-node"><strong>${title}</strong><span>${desc}</span></article>`).join("")}</div></section></main>`;
  }

  function renderCityPlans() {
    const data = { mark: "CITY", title: "地市方案", subtitle: "CITY PLANS", description: "围绕“一市一方案、一域一特色”，展示全省人工智能产业发展重点与协同关系。", metrics: [["11", "设区市"], ["5", "优势维度"], ["一市一策", "推进机制"]] };
    document.body.innerHTML = `${header(data)}<main class="ops-shell"><section class="ops-summary"><div class="ops-summary-intro"><span>地市协同</span><p>${data.description}</p></div>${data.metrics.map(([value, label]) => `<div class="ops-metric"><strong>${value}</strong><span>${label}</span></div>`).join("")}</section><section class="ops-main" style="margin-top:14px"><header class="ops-main-head"><h2>浙江省人工智能地市布局</h2><span>优势领域连线总图</span></header><div class="ops-map"><img src="${cityMap}" alt="浙江省人工智能地市布局图"></div></section></main>`;
  }

  if (page === "platforms") renderList(platformData());
  else if (["policies", "tasks", "projects", "scenes"].includes(page)) renderResource(resourceData());
  else if (page === "industry-chain") renderIndustryChain();
  else if (page === "city-plans") renderCityPlans();
  else if (datasets[page]) renderList(datasets[page]);
}());
