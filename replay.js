/* 知遇 · 智能客服 — 演示回放引擎
 * 全部对话为预录内容，依据仓库 README 演示流程与 knowledge/demo 知识库原文编写。
 * 消息 DOM 结构复用真实前端（chat.js）：article.message.{user,assistant} > .speaker + .tool-traces + .bubble
 */
(function () {
  const $ = (id) => document.getElementById(id);

  const SCENARIOS = {
    logistics: {
      title: '物流查询',
      user: '订单 1001 的物流到哪了？',
      tools: [{ name: 'query_logistics', label: '查询物流' }],
      answer:
        '模拟数据：订单 1001 当前处于「派送中」，最新位置为杭州配送站。\n\n需要说明的是，物流信息来自演示环境的随机模拟数据，不代表真实业务信息。在完整部署中，这里会对接真实物流查询接口。',
    },
    returns: {
      title: '退货政策咨询',
      user: '退货政策是什么？',
      tools: [{ name: 'query_faq', label: '查询常见问题' }],
      answer:
        '根据知识库《虚构演示商城政策》：\n\n商品签收后 7 天内且商品完好，可申请退货。定制商品、已拆封的贴身用品不支持无理由退货；质量问题不受该例外限制。\n\n这条回答来自 BGE-M3 向量检索召回的知识库原文，不是模型凭空生成。',
    },
    shipping: {
      title: '邮费规则咨询',
      user: '邮费是多少？',
      tools: [{ name: 'query_faq', label: '查询常见问题' }],
      answer:
        '根据知识库《虚构演示商城政策》：\n\n订单实付满 99 元包邮，未满 99 元收取 8 元运费。偏远地区及大件商品不适用包邮，具体费用以结算页展示为准。\n\n即使你只问「邮费」，语义检索也能召回「包邮 / 运费」相关知识，不需要精确关键词命中。',
    },
    ticket: {
      title: '创建人工工单',
      user: '商品收到后发现有破损，我需要人工协助处理。',
      tools: [{ name: 'create_ticket', label: '创建人工工单' }],
      answer:
        '已为你创建人工工单，工单号 T-DEMO-1001。\n\n在完整部署中，工单会真实写入本地 MySQL 数据库，人工客服可以在工单台看到产品、问题摘要、AI 已做的排障步骤和你的反馈，直接接手继续处理。\n\n按照售后手册规则：包裹破损请保留商品、包装和面单照片，并在签收后 48 小时内提交售后申请。',
      link: { text: '查看工单进度（完整部署中可用，本演示不跳转）' },
    },
  };

  const TOOL_STATUS = { running: '查询中', succeeded: '已完成' };
  const TYPE_INTERVAL = 26;
  let runToken = 0; // 递增使进行中的回放失效

  const scrollArea = $('scroll-area');
  const messages = $('messages');
  const welcome = $('welcome');
  const input = $('message');
  const sendBtn = $('send');
  const stopBtn = $('stop');

  function scrollDown() {
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }

  function addMessage(role, text) {
    const article = document.createElement('article');
    article.className = `message ${role}`;
    const label = document.createElement('div');
    label.className = 'speaker';
    label.textContent = role === 'user' ? '你' : '知遇';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (text) bubble.textContent = text;
    const tools = document.createElement('div');
    tools.className = 'tool-traces';
    article.append(label, tools, bubble);
    messages.append(article);
    scrollDown();
    return { article, bubble, tools };
  }

  function addNote(view, text, cls) {
    const el = document.createElement('div');
    el.className = 'message-note' + (cls ? ' ' + cls : '');
    el.textContent = text;
    view.article.append(el);
    scrollDown();
  }

  function setBadge(view, label, status) {
    view.tools.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = 'tool-badge';
    badge.dataset.status = status;
    badge.textContent = `${label} · ${TOOL_STATUS[status]}`;
    view.tools.append(badge);
    scrollDown();
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function streamText(view, text, token) {
    view.bubble.textContent = '';
    let acc = '';
    for (const ch of text) {
      if (token !== runToken) return false;
      acc += ch;
      view.bubble.textContent = acc;
      if (acc.length % 3 === 0) scrollDown();
      await sleep(TYPE_INTERVAL);
    }
    scrollDown();
    return true;
  }

  async function playScenario(key) {
    const scenario = SCENARIOS[key];
    if (!scenario) return;
    const token = ++runToken;

    welcome.hidden = true;
    messages.innerHTML = '';
    document.querySelectorAll('#scenarios .nav-item').forEach((b) =>
      b.classList.toggle('selected', b.dataset.scenario === key)
    );
    $('page-title').textContent = scenario.title;

    addMessage('user', scenario.user);
    const view = addMessage('assistant', '');
    view.bubble.textContent = '正在思考…';

    setRunning(true);
    await sleep(650);
    if (token !== runToken) return;

    for (const tool of scenario.tools) {
      setBadge(view, tool.label, 'running');
      view.bubble.textContent = '正在查询…';
      await sleep(1100);
      if (token !== runToken) return;
      setBadge(view, tool.label, 'succeeded');
      await sleep(350);
      if (token !== runToken) return;
    }

    const done = await streamText(view, scenario.answer, token);
    if (!done) return;

    if (scenario.link) {
      const link = document.createElement('span');
      link.className = 'ticket-link';
      link.textContent = scenario.link.text;
      view.article.append(link);
    }
    addNote(view, '演示回放 · 工具事件与回答为预录内容', 'replay-note');
    setRunning(false);
  }

  function setRunning(running) {
    sendBtn.hidden = running;
    stopBtn.hidden = !running;
    input.disabled = running;
    if (!running) syncInput();
  }

  function syncInput() {
    sendBtn.disabled = input.value.trim().length === 0;
  }

  function reset() {
    runToken++;
    messages.innerHTML = '';
    welcome.hidden = false;
    $('page-title').textContent = '客服对话';
    document.querySelectorAll('#scenarios .nav-item').forEach((b) => b.classList.remove('selected'));
    setRunning(false);
    scrollDown();
  }

  // 事件绑定
  document.querySelectorAll('[data-scenario]').forEach((btn) => {
    btn.addEventListener('click', () => playScenario(btn.dataset.scenario));
  });
  $('new-chat').addEventListener('click', reset);
  stopBtn.addEventListener('click', () => { runToken++; setRunning(false); });

  input.addEventListener('input', syncInput);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) $('composer').requestSubmit();
    }
  });
  $('composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    runToken++;
    welcome.hidden = true;
    addMessage('user', text);
    input.value = '';
    syncInput();
    const view = addMessage('assistant', '');
    view.bubble.textContent =
      '这个演示环境只准备了左侧四个场景的完整流程，点一个看看吧。';
    addNote(view, '完整部署中，这里会由模型理解你的问题并自主选择合适的业务工具。', 'replay-note');
  });

  // 关于面板
  const mask = $('about-mask');
  $('about-open').addEventListener('click', () => { mask.hidden = false; });
  $('about-close').addEventListener('click', () => { mask.hidden = true; });
  mask.addEventListener('click', (e) => { if (e.target === mask) mask.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') mask.hidden = true; });
})();
