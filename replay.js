/* 知遇 · 智能客服 — 演示回放引擎
 * 全部对话为预录内容，依据仓库 README 演示流程、knowledge/demo 知识库原文
 * 与 app/s1pro/messages.py 真实话术编写；S1 Pro 场景的阶段提示、快捷回复、
 * 状态条、交接摘要均复刻完整部署中的真实交互。
 * 消息 DOM 结构复用真实前端（chat.js）：article.message.{user,assistant} > .speaker + .tool-traces + .bubble
 */
(function () {
  const $ = (id) => document.getElementById(id);

  const STAGE_TEXT = {
    understanding: '正在理解您的描述…',
    searching: '正在检索 eufy 官方排障资料…',
  };

  const SCENARIOS = {
    logistics: {
      title: '物流查询',
      user: '订单 1001 的物流到哪了？',
      tools: [{ name: 'query_logistics', label: '查询物流' }],
      answer:
        '您问的订单 1001，我帮您查到了：当前处于「派送中」，最新位置在杭州配送站，再耐心等等就快到了。\n\n说明一下：这条物流信息是演示环境的模拟数据，不代表真实业务信息；完整部署中会对接真实物流查询接口。',
    },
    returns: {
      title: '退货政策咨询',
      user: '退货政策是什么？',
      tools: [{ name: 'query_faq', label: '查询常见问题' }],
      answer:
        '这个我帮您查了店铺政策——商品签收后 7 天内且商品完好，可以申请退货。定制商品、已拆封的贴身用品不支持无理由退货；质量问题不受该例外限制。\n\n说明一下：这条回答来自 BGE-M3 向量检索召回的知识库原文《虚构演示商城政策》，不是模型凭空生成。',
    },
    shipping: {
      title: '邮费规则咨询',
      user: '邮费是多少？',
      tools: [{ name: 'query_faq', label: '查询常见问题' }],
      answer:
        '邮费的问题我帮您查了——订单实付满 99 元包邮，未满 99 元收取 8 元运费。偏远地区及大件商品不适用包邮，具体费用以结算页展示为准。\n\n顺带一提：即使您只问「邮费」两个字，语义检索也能召回「包邮 / 运费」相关知识（知识库原文《虚构演示商城政策》），不需要精确关键词命中。',
    },
    ticket: {
      title: '创建人工工单',
      user: '商品收到后发现有破损，我需要人工协助处理。',
      tools: [{ name: 'create_ticket', label: '创建人工工单' }],
      answer:
        '破损的问题我来帮您对接人工——工单已创建，编号 T-DEMO-1001。\n\n说明一下：在完整部署中，工单真实写入本地 MySQL 数据库；面向 S1 Pro 排障场景的工单台可以看到产品、问题摘要、AI 已做的排障步骤和您的反馈，人工直接接手继续处理。\n\n另外按售后手册的规则：包裹破损请保留商品、包装和面单照片，并在签收后 48 小时内提交售后申请。',
      link: { text: '查看工单进度（完整部署中可用，本演示不跳转）' },
    },

    /* 多轮场景：S1 Pro 排障（对应初赛案例二）。
       话术逐字取自 app/s1pro/messages.py（变体池中的一条），
       阶段提示 / 检索徽章 / 快捷回复 / 状态条与完整部署一致。 */
    's1pro-fix': {
      title: 'S1 Pro 排障 · 多轮',
      multi: true,
      start: 'n0',
      nodes: {
        n0: {
          user: '我的 eufy 扫地机器人 S1 Pro 不吸了，明天要请客，急着用',
          stages: ['understanding', 'searching'],
          badge: '检索到官方资料：eufy S1 Pro 吸力排查指引',
          answer: '知道您着急，我尽量少让您走弯路。咱们先从最常见的原因查起：先清理侧刷、滚刷、尘盒和过滤器。处理完您再开机试试，看看吸力回来没有？',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 已建议 1 步 · 已尝试 0 步 ｜ 阶段：等待您的反馈 ｜ 来源：eufy S1 Pro 吸力排查指引 ｜ 用户已表示着急',
          chips: [
            { label: '好了，吸力恢复了', next: 'resolved' },
            { label: '还是不行', next: 'step2' },
          ],
        },
        resolved: {
          stages: ['understanding'],
          answer: '太好了，吸力回来了！希望没耽误您明天要请客。以后每 1-2 周清理一次滚刷、尘盒和过滤器，基本不会再犯（依据见下方来源）。哪天又不给力了，直接跟我说“吸力又不行了”，咱们接着这次的记录来。',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 阶段：问题已解决 ｜ 用户已表示着急',
          chips: [{ label: '太感谢了', next: 'thanks' }],
        },
        thanks: {
          stages: ['understanding'],
          answer: '您客气了，能帮上忙就好。记得每 1-2 周清理一次滚刷和过滤器，它能一直给力。有问题随时来。',
          end: true,
        },
        step2: {
          stages: ['understanding', 'searching'],
          badge: '检索到官方资料：eufy S1 Pro 吸力排查指引',
          answer: '还没恢复，别着急，咱们一步步来。下一步：再检查刷罩胶条和尘盒泡棉密封。处理完再试试，结果告诉我。',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 已建议 2 步 · 已尝试 1 步 ｜ 阶段：等待您的反馈 ｜ 来源：eufy S1 Pro 吸力排查指引 ｜ 用户已表示着急',
          chips: [
            { label: '好了，吸力恢复了', next: 'resolved2' },
            { label: '还是不行，试来试去真烦', next: 'frustrated' },
          ],
        },
        resolved2: {
          stages: ['understanding'],
          answer: '太好了，吸力回来了！希望没耽误您明天要请客。以后每 1-2 周清理一次滚刷、尘盒和过滤器，基本不会再犯（依据见下方来源）。哪天又不给力了，直接跟我说“吸力又不行了”，咱们接着这次的记录来。',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 阶段：问题已解决 ｜ 用户已表示着急',
          chips: [{ label: '太感谢了', next: 'thanks' }],
        },
        frustrated: {
          stages: ['understanding'],
          answer: '连着试了两步还是没好，换谁都觉得泄气。我不想让您再白折腾——让人工接手吧，您试过的每一步我都记着，他们接着查就行。点下面的「可以建单」，或者说一声都可以。',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 已建议 2 步 · 已尝试 2 步 ｜ 阶段：等待建单确认 ｜ 用户已表示着急',
          chips: [
            { label: '可以建单', next: 'ticket' },
            { label: '再想想，先不建', next: 'askagain' },
          ],
        },
        askagain: {
          stages: ['understanding'],
          answer: '要不要我帮您建好工单、让人工接着跟？点下面的「可以建单」，或者说一声都行。',
          chips: [{ label: '可以建单', next: 'ticket' }],
        },
        ticket: {
          stages: ['understanding'],
          answer: '工单建好了，编号 T-DEMO-S1PRO，您的情况和试过的步骤都随单记下了。说明一下：这是演示环境里的工单，不会真的提交给安克客服。',
          handoff: '随单交接摘要（真实写入工单描述开头）：用户自述明天要请客，eufy S1 Pro（T2080）出现“吸力变弱”，已按官方资料尝试 2 步仍未解决，建议人工优先回电跟进。',
          link: '查看工单进度（完整部署中可用，本演示不跳转）',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 阶段：工单已创建 ｜ 工单：T-DEMO-S1PRO ｜ 用户已表示着急',
          end: true,
        },
      },
    },

    /* 多轮场景：转人工直通（对应初赛案例三的人工接续分支）。 */
    's1pro-human': {
      title: '转人工直通 · 多轮',
      multi: true,
      start: 'n0',
      nodes: {
        n0: {
          user: '我的 eufy 扫地机器人 S1 Pro 吸力越来越弱，别折腾了，我要找人工客服',
          stages: ['understanding'],
          answer: '好，我帮您转人工。这里的“转人工”是建一张工单，把您的记录交给人工接着跟——演示环境，不会真的提交给安克客服。您点下面的「可以建单」就行。',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 阶段：等待建单确认',
          chips: [
            { label: '可以建单', next: 'ticket' },
            { label: '再想想，先不建', next: 'ask' },
          ],
        },
        ask: {
          stages: ['understanding'],
          answer: '需要我把工单建好、交人工跟进吗？点下面的「可以建单」就行，您定。',
          chips: [{ label: '可以建单', next: 'ticket' }],
        },
        ticket: {
          stages: ['understanding'],
          answer: '工单建好了，编号 T-DEMO-S1PRO，您的情况和试过的步骤都随单记下了。说明一下：这是演示环境里的工单，不会真的提交给安克客服。',
          handoff: '随单交接摘要（真实写入工单描述开头）：eufy S1 Pro（T2080）出现“吸力变弱”，已按官方资料尝试 0 步仍未解决，建议人工优先回电跟进。',
          link: '查看工单进度（完整部署中可用，本演示不跳转）',
          status: '已确认：eufy S1 Pro (T2080) ｜ 症状：吸力变弱 ｜ 阶段：工单已创建 ｜ 工单：T-DEMO-S1PRO',
          end: true,
        },
      },
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
  const statusBar = $('s1pro-status');

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

  function addSearchBadge(view, text) {
    const badge = document.createElement('span');
    badge.className = 'tool-badge';
    badge.dataset.status = 'succeeded';
    badge.textContent = text;
    view.tools.append(badge);
    scrollDown();
  }

  function updateStatus(text) {
    if (!statusBar) return;
    if (text) {
      statusBar.textContent = text;
      statusBar.hidden = false;
    } else {
      statusBar.hidden = true;
      statusBar.textContent = '';
    }
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

  /* 多轮节点播放：阶段提示 → 检索徽章 → 逐字回复 → 状态条 → 快捷回复 */
  async function playNode(scenario, id, token) {
    const node = scenario.nodes[id];
    if (!node) return;
    if (node.user) addMessage('user', node.user);
    const view = addMessage('assistant', '');
    setRunning(true);
    view.bubble.classList.add('pending');
    for (const stage of node.stages || []) {
      view.bubble.textContent = STAGE_TEXT[stage] || '正在处理…';
      await sleep(stage === 'searching' ? 1000 : 750);
      if (token !== runToken) return;
    }
    if (node.badge) {
      addSearchBadge(view, node.badge);
      await sleep(400);
      if (token !== runToken) return;
    }
    view.bubble.classList.remove('pending');
    const done = await streamText(view, node.answer, token);
    if (!done) return;
    if (node.note) addNote(view, node.note);
    if (node.handoff) addNote(view, node.handoff);
    if (node.link) {
      const link = document.createElement('span');
      link.className = 'ticket-link';
      link.textContent = node.link;
      view.article.append(link);
    }
    if (node.status) updateStatus(node.status);
    setRunning(false);
    if (node.chips) {
      const row = document.createElement('div');
      row.className = 'quick-replies';
      for (const chip of node.chips) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quick-reply';
        button.textContent = chip.label;
        button.onclick = () => {
          row.querySelectorAll('button').forEach((b) => (b.disabled = true));
          button.classList.add('chosen');
          const nextToken = ++runToken;
          playNode(scenario, chip.next, nextToken);
        };
        row.append(button);
      }
      view.article.append(row);
      scrollDown();
    }
    if (node.end) addNote(view, '演示回放 · 阶段提示、快捷回复与回答均为预录内容', 'replay-note');
  }

  async function playScenario(key) {
    const scenario = SCENARIOS[key];
    if (!scenario) return;
    const token = ++runToken;

    welcome.hidden = true;
    messages.innerHTML = '';
    updateStatus(null);
    document.querySelectorAll('#scenarios .nav-item').forEach((b) =>
      b.classList.toggle('selected', b.dataset.scenario === key)
    );
    $('page-title').textContent = scenario.title;

    if (scenario.multi) {
      await playNode(scenario, scenario.start, token);
      return;
    }

    addMessage('user', scenario.user);
    const view = addMessage('assistant', '');
    view.bubble.classList.add('pending');
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

    view.bubble.classList.remove('pending');
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
    updateStatus(null);
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
    updateStatus(null);
    addMessage('user', text);
    input.value = '';
    syncInput();
    const view = addMessage('assistant', '');
    view.bubble.textContent =
      '这个问题超出演示回放的剧本了——左侧六个场景都准备了完整流程，点一个看看吧。';
    addNote(view, '完整部署中，这里会由模型理解你的问题并自主选择合适的业务工具。', 'replay-note');
  });

  // 关于面板
  const mask = $('about-mask');
  $('about-open').addEventListener('click', () => { mask.hidden = false; });
  $('about-close').addEventListener('click', () => { mask.hidden = true; });
  mask.addEventListener('click', (e) => { if (e.target === mask) mask.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') mask.hidden = true; });
})();
