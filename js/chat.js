/**
 * 智能问答核心模块
 * chat.js — 浙江省人工智能产业链图谱知识库问答
 *
 * 功能：知识库选择 / 上下文构建 / AI 接口调用 / 对话渲染
 * AI 接口可通过 window.AI_CONFIG 配置（见下方默认值占位符）
 */
(function () {
  "use strict";

  // ============================================================
  // AI 接口配置（请按需修改，或在页面加载前设置 window.AI_CONFIG）
  // ============================================================
  if (!window.AI_CONFIG) {
    window.AI_CONFIG = {
      // 通义千问（阿里云 DashScope）
      dashscope: {
        enabled: false,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: "YOUR_API_KEY_HERE",       // 替换为您的 DashScope API Key
        model: "qwen-plus"
      },
      // DeepSeek
      deepseek: {
        enabled: false,
        baseURL: "https://api.deepseek.com/v1",
        apiKey: "YOUR_API_KEY_HERE",       // 替换为您的 DeepSeek API Key
        model: "deepseek-chat"
      },
      // OpenAI 兼容接口
      openai: {
        enabled: false,
        baseURL: "https://api.openai.com/v1",
        apiKey: "YOUR_API_KEY_HERE",
        model: "gpt-4o"
      },
      // 本地/私有模型（OpenAI 兼容格式）
      local: {
        enabled: false,
        baseURL: "http://localhost:8000/v1",
        apiKey: "none",
        model: "local-model"
      }
    };
  }

  // ============================================================
  // DOM 引用
  // ============================================================
  const welcomeScreen = document.getElementById("welcomeScreen");
  const chatArea      = document.getElementById("chatArea");
  const messageList   = document.getElementById("messageList");
  const msgInput      = document.getElementById("msgInput");
  const sendBtn       = document.getElementById("sendBtn");
  const kbChips       = document.getElementById("kbChips");
  const clearBtn     = document.getElementById("clearChat");
  const modelSelect  = document.getElementById("modelSelect");
  const toastEl      = document.getElementById("toast");

  // ============================================================
  // 状态
  // ============================================================
  let conversationHistory = [];
  let selectedKBs = new Set(["policies","tasks","projects","scenes","meetings","research","platforms","experts","companies","news","objects"]);
  let isStreaming = false;

  // ============================================================
  // 知识库元信息（用于上下文构建和计数）
  // ============================================================
  const KB_DEFS = {
    policies:   { label:"政策库",      src: window.POLICIES_DATA,   countKey: () => (KB_DEFS.policies.src?.policies   || []).length },
    tasks:     { label:"任务库",      src: window.TASKS_DATA,       countKey: () => (KB_DEFS.tasks.src?.tasks       || []).length },
    projects:  { label:"项目库",      src: window.PROJECTS_DATA,    countKey: () => (KB_DEFS.projects.src?.projects  || []).length },
    scenes:    { label:"场景库",      src: window.SCENES_DATA,       countKey: () => (KB_DEFS.scenes.src?.meta?.count || 0) },
    meetings:  { label:"会议库",      src: null,                     countKey: () => null },
    research:  { label:"调研库",      src: null,                     countKey: () => null },
    platforms: { label:"平台库",      src: window.PLATFORMS_DATA,   countKey: () => (KB_DEFS.platforms.src?.platforms || []).length },
    experts:   { label:"专家库",      src: window.EXPERTS_DATA,     countKey: () => (KB_DEFS.experts.src?.total      || 0) },
    companies: { label:"企业库",      src: null,                     countKey: () => null },
    news:      { label:"资讯库",      src: window.NEWS_DATA,        countKey: () => (KB_DEFS.news.src?.items        || []).length },
    objects:   { label:"目标体系",    src: window.OBJECTS_DATA,     countKey: () => 1 },
    monitoring:{ label:"监测数据",    src: window.MONITORING_DATA,  countKey: () => (KB_DEFS.monitoring.src?.coverage?.periods || 0) }
  };

  // ============================================================
  // 初始化
  // ============================================================
  function init() {
    bindKBItems();
    updateKBCounts();
    updateKBChips();
    bindInput();
    bindSend();
    bindClear();
    bindSuggestions();
    bindModelSelect();
  }

  // ============================================================
  // 知识库侧栏绑定
  // ============================================================
  function bindKBItems() {
    document.querySelectorAll(".kb-item[data-kb]").forEach(item => {
      const kb = item.dataset.kb;
      const checkbox = item.querySelector('input[type="checkbox"]');

      // 初始化选中状态
      if (selectedKBs.has(kb)) {
        item.classList.add("selected");
        checkbox.checked = true;
      }

      item.addEventListener("click", e => {
        if (e.target === checkbox) return;
        checkbox.checked = !checkbox.checked;
        toggleKB(kb, checkbox.checked);
      });

      checkbox.addEventListener("change", () => {
        toggleKB(kb, checkbox.checked);
      });
    });
  }

  function toggleKB(kb, selected) {
    if (selected) {
      selectedKBs.add(kb);
    } else {
      selectedKBs.delete(kb);
    }
    const item = document.querySelector(`.kb-item[data-kb="${kb}"]`);
    if (item) item.classList.toggle("selected", selected);
    updateKBChips();
  }

  function updateKBCounts() {
    Object.keys(KB_DEFS).forEach(kb => {
      const countEl = document.getElementById(`cnt-${kb}`);
      if (!countEl) return;
      const count = KB_DEFS[kb].countKey();
      countEl.textContent = count !== null ? count : "—";
    });
  }

  function updateKBChips() {
    const chips = document.getElementById("kbChips");
    if (selectedKBs.size === Object.keys(KB_DEFS).length) {
      chips.innerHTML = '<span class="ai-kb-chip-empty">已选全部知识库</span>';
    } else if (selectedKBs.size === 0) {
      chips.innerHTML = '<span class="ai-kb-chip-empty">请至少选择一个知识库</span>';
    } else {
      chips.innerHTML = Array.from(selectedKBs)
        .map(kb => `<span class="ai-kb-chip">${KB_DEFS[kb]?.label || kb}</span>`)
        .join("");
    }
  }

  // ============================================================
  // 输入绑定
  // ============================================================
  function bindInput() {
    msgInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.ctrlKey) {
        e.preventDefault();
      }
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSend();
      }
    });
    msgInput.addEventListener("input", autoResize);
  }

  function autoResize() {
    msgInput.style.height = "auto";
    msgInput.style.height = Math.min(msgInput.scrollHeight, 160) + "px";
  }

  // ============================================================
  // 发送
  // ============================================================
  function bindSend() {
    sendBtn.addEventListener("click", handleSend);
  }

  async function handleSend() {
    const text = msgInput.value.trim();
    if (!text || isStreaming) return;
    if (selectedKBs.size === 0) {
      showToast("请至少选择一个知识库后再提问");
      return;
    }

    // 进入对话状态：消息流覆盖整个舞台，欢迎屏不再参与显示。
    chatArea.classList.add("has-conversation");

    // 清空输入
    msgInput.value = "";
    msgInput.style.height = "auto";

    // 追加用户消息
    appendMsg("user", text);
    scrollToBottom();

    // 追加 AI 占位消息（思考中）
    const aiMsgId = appendMsg("assistant", "正在思考中……", true);
    isStreaming = true;
    sendBtn.disabled = true;

    try {
      const answer = await queryAI(text);
      replaceMsg(aiMsgId, "assistant", answer);
    } catch (err) {
      replaceMsg(aiMsgId, "assistant", `【查询失败】${err.message}\n\n请检查 AI 接口配置（打开控制台查看 AI_CONFIG 说明），或稍后重试。`);
      console.error("[AI Chat] 接口调用失败：", err);
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      msgInput.focus();
    }
    scrollToBottom();
  }

  // ============================================================
  // AI 调用核心
  // ============================================================
  async function queryAI(userText) {
    const systemPrompt = buildSystemPrompt();
    const contextText = buildContext();
    const fullSystem = systemPrompt + (contextText ? "\n\n" + contextText : "");

    // 从页面选择获取模型标识
    const modelValue = modelSelect.value;

    // 构造对话历史（用于支持多轮）
    conversationHistory.push({ role: "user", content: userText });

    // 优先使用 DashScope（通义千问），其次 DeepSeek，再次 OpenAI
    const cfg = window.AI_CONFIG;
    let result = null;
    let lastError = null;

    // 策略：依次尝试，直到成功
    const strategies = [
      cfg.dashscope,
      cfg.deepseek,
      cfg.openai,
      cfg.local
    ];

    for (const strategy of strategies) {
      if (!strategy || !strategy.enabled) continue;
      try {
        const resp = await callAI({
          baseURL:    strategy.baseURL,
          apiKey:     strategy.apiKey,
          model:      strategy.model || modelValue,
          messages:   [{ role: "system", content: fullSystem }, ...conversationHistory]
        });
        conversationHistory.push({ role: "assistant", content: resp });
        return resp;
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    // 所有策略均失败：回退演示模式
    console.warn("[AI Chat] 所有 AI 接口均未配置或调用失败，启用演示模式。", lastError);
    return demoAnswer(userText);
  }

  async function callAI({ baseURL, apiKey, model, messages }) {
    const url = `${baseURL.replace(/\/$/, "")}/chat/completions`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, stream: false })
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`API 错误 ${resp.status}：${body}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  }

  // ============================================================
  // 构建系统提示词
  // ============================================================
  function buildSystemPrompt() {
    return `你是浙江省人工智能产业链图谱的智能助手，专为浙江省人工智能产业链工作专班成员提供知识问答服务。

【核心职责】
- 基于浙江省人工智能产业链图谱中的政策、任务、项目、场景、平台、专家等数据，回答工作相关问题
- 回答语言：简体中文，语气专业、简洁、可操作
- 如所查询知识库中没有相关信息，明确告知用户"暂无相关记录"
- 如信息不完整，说明依据现有数据能够回答的部分
- 如涉及多个知识库，尽可能整合跨库信息进行综合回答
- 回答时可引用具体政策名称、项目名称、数据指标等原始信息
- 如涉及时间节点、责任单位、进展状态等，优先使用库中最新数据

【回答格式】
- 优先使用结构化回答（分点、表格）
- 数字类信息标注单位
- 注明信息来源（来自哪个知识库）
- 避免重复用户问题，直接给出答案`;
  }

  // ============================================================
  // 构建上下文（将选中的知识库数据注入）
  // ============================================================
  function buildContext() {
    const sections = [];

    if (selectedKBs.has("policies")) {
      const d = window.POLICIES_DATA;
      if (d?.policies) {
        const list = d.policies.slice(0, 30).map(p =>
          `【政策】${p.name} | 类别：${p.category} | 发布单位：${p.issuer} | 发布日期：${p.date}`
        ).join("\n");
        sections.push(`## 政策库（共${d.policies.length}条，节选前30条）\n${list}`);
      }
    }

    if (selectedKBs.has("tasks")) {
      const d = window.TASKS_DATA;
      if (d?.tasks) {
        const list = d.tasks.slice(0, 30).map(t =>
          `【任务】${t.task} | 维度：${t.dimension} | 责任单位：${t.owner} | 时间节点：${t.timeNode} | 重要性：${t.importance}`
        ).join("\n");
        sections.push(`## 任务库（共${d.tasks.length}条，节选前30条）\n${list}`);
      }
    }

    if (selectedKBs.has("projects")) {
      const d = window.PROJECTS_DATA;
      if (d?.projects) {
        const list = d.projects.slice(0, 30).map(p =>
          `【项目】${p.name} | 领域：${p.field || p.category} | 建设单位：${p.builder || p.owner} | 总投资：${p.investment || "—"} | 阶段：${p.stage || "—"}`
        ).join("\n");
        sections.push(`## 项目库（共${d.projects.length}条，节选前30条）\n${list}`);
      }
    }

    if (selectedKBs.has("scenes")) {
      const d = window.SCENES_DATA;
      if (d?.scenes || d?.items) {
        const scenes = d.scenes || d.items || [];
        const list = scenes.slice(0, 20).map(s =>
          `【场景】${s.name || s.sceneName || s.title} | 领域：${s.field || s.category || s.domain} | 业主单位：${s.owner || s.builder} | 地点：${s.city || s.location}`
        ).join("\n");
        sections.push(`## 场景库（共${scenes.length}条，节选前20条）\n${list}`);
      }
    }

    if (selectedKBs.has("platforms")) {
      const d = window.PLATFORMS_DATA;
      if (d?.platforms) {
        const list = d.platforms.slice(0, 30).map(p =>
          `【平台】${p.name} | 类型：${p.type || p.category} | 城市：${p.city || p.location} | 状态：${p.status || "—"}`
        ).join("\n");
        sections.push(`## 平台库（共${d.platforms.length}条，节选前30条）\n${list}`);
      }
    }

    if (selectedKBs.has("experts")) {
      const d = window.EXPERTS_DATA;
      if (d?.members) {
        const list = d.members.map(m =>
          `【专家】${m.name || m.member} | 领域：${m.domain || m.field} | 单位：${m.org || m.organization} | 简介：${m.bio || m.intro || "—"}`
        ).join("\n");
        sections.push(`## 专家库（共${d.members.length}位）\n${list}`);
      }
    }

    if (selectedKBs.has("news")) {
      const d = window.NEWS_DATA;
      if (d?.items) {
        const list = d.items.slice(0, 20).map(n =>
          `【资讯】${n.title} | 类别：${n.category} | 来源：${n.source} | 日期：${n.date} | 摘要：${n.summary || "—"}`
        ).join("\n");
        sections.push(`## 资讯库（共${d.items.length}条，节选前20条）\n${list}`);
      }
    }

    if (selectedKBs.has("objects")) {
      const d = window.OBJECTS_DATA;
      if (d) {
        const lines = ["## 目标体系"];
        if (d.overall) {
          lines.push(`总体目标：${d.overall.vision}`);
          if (d.overall.target_2026) lines.push(`2026年目标：${d.overall.target_2026.value}（${d.overall.target_2026.desc}）`);
          if (d.overall.target_2030) lines.push(`2030年目标：${d.overall.target_2030.value}（${d.overall.target_2030.desc}）`);
        }
        if (d.dimensions) {
          d.dimensions.forEach(dim => {
            lines.push(`\n### ${dim.name}`);
            if (dim.items) {
              dim.items.forEach(item => {
                lines.push(`- ${item.name || item.label}: ${item.target_2026 || ""} / ${item.target_2030 || ""}`);
              });
            }
          });
        }
        sections.push(lines.join("\n"));
      }
    }

    if (selectedKBs.has("monitoring")) {
      const d = window.MONITORING_DATA;
      if (d) {
        const lines = ["## 统计监测数据"];
        lines.push(`统计周期：${d.coverage?.first} 至 ${d.coverage?.latest}，共 ${d.coverage?.periods} 期`);
        if (d.months?.length) {
          const latest = d.months[d.months.length - 1];
          if (latest?.province) {
            const p = latest.province;
            lines.push(`\n最新一期（${latest.month}）：`);
            lines.push(`- 企业数：${p.enterprises} 家`);
            lines.push(`- 营业收入：${(p.revenue/1000).toFixed(1)} 亿元（同比 ${p.revenueGrowth}%）`);
            lines.push(`- 研发费用：${(p.rd/1000).toFixed(1)} 亿元（同比 ${p.rdGrowth}%）`);
            lines.push(`- 用工人數：${p.employment} 人（同比 ${p.employmentGrowth}%）`);
          }
          if (latest.cities?.length) {
            lines.push(`\n各地市数据：`);
            latest.cities.slice(0, 5).forEach(c => {
              lines.push(`- ${c.name}：营收 ${(c.revenue/1000).toFixed(1)} 亿元（同比 ${c.revenueGrowth}%）`);
            });
          }
        }
        sections.push(lines.join("\n"));
      }
    }

    return sections.join("\n\n");
  }

  // ============================================================
  // 演示模式（无 API 时使用本地知识库直接匹配回复）
  // ============================================================
  function demoAnswer(userText) {
    const q = userText.toLowerCase();
    const replies = [];

    // 政策关键词
    if (/政策|支持|补贴|资金|优惠/.test(q)) {
      const d = window.POLICIES_DATA;
      if (d?.policies?.length) {
        const list = d.policies.map(p => `- ${p.name}（${p.category}，${p.date}）`).join("\n");
        replies.push(`根据政策库，当前浙江省人工智能相关政策如下：\n${list}\n\n如需了解具体政策内容，可点击政策库查看详情。`);
      }
    }

    // 项目关键词
    if (/项目|投资|建设|推进/.test(q)) {
      const d = window.PROJECTS_DATA;
      if (d?.projects?.length) {
        const list = d.projects.slice(0, 8).map(p => `- ${p.name}（${p.field || "综合"}，总投资 ${p.investment || "待填报"}）`).join("\n");
        replies.push(`根据项目库，当前在库重大项目如下：\n${list}\n\n项目数据将随进展填报持续更新。`);
      }
    }

    // 任务关键词
    if (/任务|进展|完成|推进/.test(q)) {
      const d = window.TASKS_DATA;
      if (d?.tasks?.length) {
        const byDim = {};
        d.tasks.forEach(t => { if (!byDim[t.dimension]) byDim[t.dimension] = []; byDim[t.dimension].push(t); });
        let txt = "当前任务库共 " + d.tasks.length + " 条，覆盖以下维度：\n";
        Object.keys(byDim).forEach(dim => { txt += `- ${dim}：${byDim[dim].length} 项任务\n`; });
        replies.push(txt + "\n如需查看具体任务详情，请进入任务库。");
      }
    }

    // 场景关键词
    if (/场景|应用|落地|行业/.test(q)) {
      const d = window.SCENES_DATA;
      if (d?.meta?.count || d?.scenes?.length || d?.items?.length) {
        const count = d.meta?.count || d.scenes?.length || d.items?.length;
        const fields = d.meta?.fieldCount || {};
        let txt = `场景库共有 ${count} 个典型应用场景，涵盖：\n`;
        Object.keys(fields).slice(0, 8).forEach(f => { txt += `- ${f}：${fields[f]} 个\n`; });
        replies.push(txt + "\n可进入场景库查看完整清单。");
      }
    }

    // 目标关键词
    if (/目标|营收|规模|2026|2030|8300|1.2万亿/.test(q)) {
      const d = window.OBJECTS_DATA;
      if (d) {
        let txt = "浙江省人工智能发展目标体系：\n";
        if (d.overall) {
          txt += `- 总体定位：${d.overall.vision}\n`;
          if (d.overall.target_2026) txt += `- 2026年目标：${d.overall.target_2026.value}（${d.overall.target_2026.desc}）\n`;
          if (d.overall.target_2030) txt += `- 2030年目标：${d.overall.target_2030.value}（${d.overall.target_2030.desc}）\n`;
        }
        replies.push(txt + "\n数据来源：目标体系。详细目标可查看目标体系页面。");
      }
    }

    // 监测数据关键词
    if (/营收|利润|研发|企业数|增长|同比|用工/.test(q)) {
      const d = window.MONITORING_DATA;
      if (d?.months?.length) {
        const latest = d.months[d.months.length - 1];
        if (latest?.province) {
          const p = latest.province;
          replies.push(`根据最新一期统计监测数据（${latest.month}）：\n` +
            `| 指标 | 数值 | 同比增速 |\n` +
            `|------|------|----------|\n` +
            `| 企业数 | ${p.enterprises} 家 | — |\n` +
            `| 营业收入 | ${(p.revenue/1000).toFixed(1)} 亿元 | ${p.revenueGrowth}% |\n` +
            `| 研发费用 | ${(p.rd/1000).toFixed(1)} 亿元 | ${p.rdGrowth}% |\n` +
            `| 利润总额 | ${(p.profit/1000).toFixed(1)} 亿元 | ${p.profitGrowth}% |\n` +
            `| 平均用工 | ${p.employment} 人 | ${p.employmentGrowth}% |\n\n` +
            `数据来源：统计监测。更多分地市数据可在监测页面查看。`
          );
        }
      }
    }

    // 平台关键词
    if (/平台|算力|超算|数据中心/.test(q)) {
      const d = window.PLATFORMS_DATA;
      if (d?.platforms?.length) {
        const list = d.platforms.slice(0, 8).map(p => `- ${p.name}（${p.city || p.location || "全省"}，${p.type || p.category || "公共服务平台"}）`).join("\n");
        replies.push(`当前在库公共服务平台：\n${list}\n\n详细平台信息可在平台库查看。`);
      }
    }

    // 专家关键词
    if (/专家|委员会|智库/.test(q)) {
      const d = window.EXPERTS_DATA;
      if (d?.members?.length) {
        const list = d.members.map(m => `- ${m.name || m.member}（${m.domain || m.field}，${m.org || m.organization}）`).join("\n");
        replies.push(`专家库共有 ${d.members.length} 位入库专家：\n${list}\n\n详细信息可在专家库查看。`);
      }
    }

    // 资讯关键词
    if (/新闻|动态|资讯|公告/.test(q)) {
      const d = window.NEWS_DATA;
      if (d?.items?.length) {
        const list = d.items.slice(0, 5).map(n => `- ${n.title}（${n.date}，${n.category}）`).join("\n");
        replies.push(`近期资讯动态：\n${list}\n\n更多内容可在资讯库查看。`);
      }
    }

    if (replies.length === 0) {
      const kbs = Array.from(selectedKBs).map(kb => KB_DEFS[kb]?.label || kb).join("、");
      return `您当前选定的知识库范围：${kbs}。

在上述知识库中，我未能找到与「${userText}」直接相关的内容。建议您：
1. 换一种表述方式提问
2. 调整左侧知识库范围，确保相关库已被勾选
3. 如需精准查询，可直接进入对应知识库页面浏览

如已配置 AI 接口，模型将基于知识库数据给出更精准的回答。`;
    }

    return replies.join("\n\n") + `\n\n（以上内容基于本地知识库数据直接匹配。配置 AI 接口后可获得更智能的整合分析。）`;
  }

  // ============================================================
  // 消息渲染
  // ============================================================
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function nowStr() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  }

  function appendMsg(role, content, thinking) {
    const id = "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    const isUser = role === "user";

    const html = `<div class="ai-msg ${role}" id="${id}">
      <div class="ai-msg-avatar">${isUser ? "我" : "AI"}</div>
      <div>
        <div class="ai-msg-body">${thinking ? `<div class="ai-thinking"><div class="ai-thinking-header"><div class="ai-thinking-dots"><span></span><span></span><span></span></div>正在检索知识库并生成回答…</div>${esc(content)}</div>` : renderContent(content)}</div>
        <div class="ai-msg-meta">${isUser ? "我 · " : "AI · "}${nowStr()}</div>
      </div>
    </div>`;

    messageList.insertAdjacentHTML("beforeend", html);
    return id;
  }

  function replaceMsg(id, role, content) {
    const el = document.getElementById(id);
    if (!el) return;
    const isUser = role === "user";
    el.className = `ai-msg ${role}`;
    el.innerHTML = `<div class="ai-msg-avatar">${isUser ? "我" : "AI"}</div>
      <div>
        <div class="ai-msg-body">${renderContent(content)}</div>
        <div class="ai-msg-meta">${isUser ? "我 · " : "AI · "}${nowStr()}</div>
      </div>`;
  }

  function renderContent(text) {
    if (!text) return "";
    // 简单处理 Markdown 表格
    let html = esc(text);
    // 表格
    html = html.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n)*)/g, m => {
      const lines = m.trim().split("\n");
      const header = lines[0];
      const body = lines.slice(2);
      const ths = header.split("|").filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join("");
      const rows = body.map(row => {
        const cells = row.split("|").filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:12px"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    // 分点列表
    html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul style="margin:6px 0;padding-left:20px">${m}</ul>`);
    // 标题
    html = html.replace(/^#{1,3} (.+)$/gm, (_, t) => `<strong>${t}</strong>`);
    // 加粗
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // 换行
    html = html.replace(/\n\n/g, "<br><br>");
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight;
  }

  // ============================================================
  // 快捷问题
  // ============================================================
  function bindSuggestions() {
    document.querySelectorAll(".ai-suggestion").forEach(btn => {
      btn.addEventListener("click", () => {
        msgInput.value = btn.dataset.q;
        msgInput.focus();
        handleSend();
      });
    });
  }

  // ============================================================
  // 清空对话
  // ============================================================
  function bindClear() {
    clearBtn.addEventListener("click", () => {
      if (!conversationHistory.length && messageList.children.length === 0) return;
      if (!confirm("确定要清空当前对话记录吗？")) return;
      conversationHistory = [];
      messageList.innerHTML = "";
      chatArea.classList.remove("has-conversation");
      showToast("对话已清空");
    });
  }

  // ============================================================
  // 模型选择
  // ============================================================
  function bindModelSelect() {
    modelSelect.addEventListener("change", () => {
      showToast(`已切换至：${modelSelect.options[modelSelect.selectedIndex].text}`);
    });
  }

  // ============================================================
  // Toast 提示
  // ============================================================
  let toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2500);
  }

  // ============================================================
  // 启动
  // ============================================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
