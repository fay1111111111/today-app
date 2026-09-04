/* ============================================================
   「今天」 —— 打开就进入今天
   纯前端、本地存储（localStorage），无需后端。
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- 工具 ---------------- */
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtTime = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtDate = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}月${d.getDate()}日`; };
  const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  let toastTimer;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* ---------------- 节气 ---------------- */
  // 2026 年节气日期（北京时间）；其余年份沿用作近似（误差 ±1 天）
  const TERMS = [
    ['小寒', 1, 5, '冬', '寒气渐重，日子慢下来。'],
    ['大寒', 1, 20, '冬', '一年最冷，也是最靠近春天的时候。'],
    ['立春', 2, 4, '春', '风开始变软，新的一年从这里长出来。'],
    ['雨水', 2, 18, '春', '雨落下来，土壤在醒。'],
    ['惊蛰', 3, 5, '春', '雷声一响，沉睡的东西都动了。'],
    ['春分', 3, 20, '春', '昼夜平分，万物均衡。'],
    ['清明', 4, 5, '春', '天清地明，适合怀念，也适合出发。'],
    ['谷雨', 4, 20, '春', '雨生百谷，该种的都种下了。'],
    ['立夏', 5, 5, '夏', '绿意变浓，日子开始热闹起来。'],
    ['小满', 5, 21, '夏', '籽粒渐满，未满，正好。'],
    ['芒种', 6, 5, '夏', '有芒的谷物该收，该种的要赶紧种。'],
    ['夏至', 6, 21, '夏', '白昼最长的一天，光多得用不完。'],
    ['小暑', 7, 7, '夏', '热起来了，蝉声一片。'],
    ['大暑', 7, 23, '夏', '一年最热，万物都在用力生长。'],
    ['立秋', 8, 7, '秋', '暑气未消，但风里已经有了别的东西。'],
    ['处暑', 8, 23, '秋', '暑气止于此，早晚开始凉了。'],
    ['白露', 9, 7, '秋', '草木渐收，天气转凉。'],
    ['秋分', 9, 23, '秋', '昼夜再一次平分，然后夜慢慢变长。'],
    ['寒露', 10, 8, '秋', '露水凉了，叶子开始换颜色。'],
    ['霜降', 10, 23, '秋', '初霜落下，秋天走到最深处。'],
    ['立冬', 11, 7, '冬', '万物收藏，该休息了。'],
    ['小雪', 11, 22, '冬', '天气渐冷，第一场雪也许快来了。'],
    ['大雪', 12, 7, '冬', '雪盛，夜长，适合安静。'],
    ['冬至', 12, 21, '冬', '最长的一夜过去，光就会回来。'],
  ];
  function solarTerm(date) {
    const y = date.getFullYear();
    let cur = TERMS[TERMS.length - 1];
    for (const t of TERMS) {
      const start = new Date(y, t[1] - 1, t[2]);
      if (date >= start) cur = t;
    }
    return { name: cur[0], season: cur[3], note: cur[4] };
  }
  // 卡片上的节气标签：临近下一个节气（7 天内）时写成「白露前」
  function termLabel(date) {
    const y = date.getFullYear();
    const cur = solarTerm(date);
    for (const t of TERMS) {
      const start = new Date(y, t[1] - 1, t[2]);
      const diff = (start - date) / 86400000;
      if (diff > 0 && diff <= 7) return `${t[0]}前 · ${t[3]}`;
    }
    return `${cur.name} · ${cur.season}`;
  }

  /* ---------------- 今日一问 ---------------- */
  const QUESTIONS = [
    '你现在正在经历人生的什么季节？',
    '今天有什么事情，其实不值得你继续用力？',
    '如果没有人知道，你还会做这件事吗？',
    '你最近有什么正在慢慢放下？',
    '今天有哪一刻，你是真的在场的？',
    '有什么事，是你一直想做却一直没开始的？',
    '最近让你安静下来的，是什么？',
    '如果今天可以重来一次，你会改一件什么小事？',
    '你身体今天在告诉你什么？',
    '有谁，是你今天想到却没有联系的？',
    '你最近为什么事情熬了夜？值得吗？',
    '今天有没有一个瞬间，你觉得"就是这样"？',
    '你现在的生活，有多少是自己选的？',
    '有什么东西，你已经很久没有认真看过了？',
    '今天你对谁说了"没事"，其实是有事的？',
    '如果一年后的你在看这句话，你想告诉他什么？',
    '最近有什么小小的、没人注意的进步？',
    '你今天走过的路上，有什么是第一次看见的？',
    '有什么习惯，是你其实想悄悄戒掉的？',
    '现在这个阶段，你最需要的是什么？',
    '今天有什么让你觉得"还好有它"？',
    '最近一次真正开怀大笑，是因为什么？',
    '你在等一个什么样的信号？',
    '有什么话，你说给别人听，其实是想说给自己？',
    '如果今天是一种天气，会是什么？',
    '你最近在害怕什么，又在期待什么？',
    '有什么是你现在拥有，而三年前的你很想要的？',
    '今天的你，比昨天多知道了一件什么事？',
    '如果给今天起一个名字，你会叫它什么？',
    '此刻，你最想被谁理解？',
  ];
  function dayOfYear(d) {
    return Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 86400000);
  }

  /* ---------------- 记录类型 ---------------- */
  const TYPES = {
    voice: { icon: '🎙', label: '说一句', ph: '说完了，也可以在这里改一改。' },
    photo: { icon: '📷', label: '拍一张', ph: '给这张照片留一句话（可不写）。' },
    text: { icon: '✍️', label: '写一句', ph: '想到什么，直接扔进来。' },
    dream: { icon: '🌙', label: '记个梦', ph: '还记得多少，就写多少。' },
    idea: { icon: '💡', label: '一个想法', ph: '别管成不成立，先留下来。' },
    mood: { icon: '❤️', label: '此刻的心情', ph: '此刻，你是什么感觉？' },
  };

  /* ---------------- 存储 ---------------- */
  const KEY = 'today-records-v1';
  let records = [];
  try { records = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { records = []; }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(records)); }
    catch (e) { toast('本地空间满了，照片太多。'); }
  }

  /* ---------------- 本地"整理" ----------------
     用户负责"留下"，AI 负责"理解"。
     MVP 阶段不接模型，用规则默默建立结构：
       时间段 · 主题 · 情绪(状态) · 地点 · 关键词 · 关联 · 梦中元素
     用户只看到很轻的一层；完整结构存在 record.tidy 里，
     是四季 / 照片树 / 年度总结 / 梦境分析的数据基础。
     将来接模型：只替换 tidy() 这一处。
  ------------------------------------------------ */
  const MOOD_WORDS = [
    ['累', '疲惫'], ['疲惫', '疲惫'], ['困', '疲惫'], ['开心', '开心'], ['高兴', '开心'], ['快乐', '开心'],
    ['难过', '难过'], ['伤心', '难过'], ['想哭', '难过'], ['焦虑', '焦虑'], ['紧张', '焦虑'], ['担心', '焦虑'],
    ['生气', '生气'], ['烦', '烦躁'], ['平静', '平静'], ['安静', '平静'], ['放松', '放松'], ['轻松', '放松'],
    ['孤独', '孤独'], ['一个人', '孤独'], ['感动', '感动'], ['期待', '期待'], ['害怕', '害怕'],
    ['迷茫', '迷茫'], ['不知道', '困惑'], ['为什么', '困惑'], ['满足', '满足'], ['温暖', '温暖'],
    ['兴奋', '兴奋'], ['没那么糟', '释然'], ['也没什么', '释然'], ['也没啥', '释然'], ['算了', '释然'],
    ['跑了', '放松'], ['跑步', '放松'], ['散步', '放松'], ['松下来', '放松'], ['紧绷', '紧绷'],
  ];
  const REFLECT_RE = /突然觉得|突然想到|其实|可能.*不是|不是.*而是|我发现|原来|也许我/;
  const THEMES = [
    [/辞职|离职|换工作|要不要|选择|未来|想做|人生|方向/, '人生选择'],
    [/工作|上班|开会|老板|同事|项目|加班|公司|下班/, '工作'],
    [/妈|爸|家人|父母|孩子|爷爷|奶奶|老公|老婆|女儿|儿子/, '家人'],
    [/朋友|同学|聚会|闺蜜|哥们/, '朋友'],
    [/身体|头疼|感冒|睡不着|失眠|医院|生病|胃/, '身体'],
    [/钱|工资|花了|买了|房租|房贷|涨/, '钱'],
    [/学|读书|看书|课程|考试/, '学习'],
    [/我可能|我其实|我自己|我是不是|我好像|自己/, '自我认知'],
    [/情绪|心情|感觉|觉得/, '情绪'],
  ];
  const PLACES = [
    [/下班.{0,6}(路|途|回家)|回家路上|路上|地铁|公交|开车|车上/, '路上'],
    [/公司|办公室|开会|工位/, '公司'],
    [/家里|在家|沙发|床上|厨房|阳台/, '家里'],
    [/学校|教室|图书馆/, '学校'],
    [/医院/, '医院'],
    [/咖啡|咖啡馆|星巴克/, '咖啡馆'],
    [/公园|河边|海边|山上/, '户外'],
  ];
  const KEYWORDS = [
    [/开会|会议/, '会议'], [/跑了|跑步/, '跑步'], [/夕阳|日落/, '夕阳'], [/下班/, '下班'], [/辞职|离职/, '辞职'],
    [/咖啡/, '咖啡'], [/下雨|雨/, '雨'], [/雪/, '雪'], [/月亮|月光/, '月亮'], [/星星/, '星星'], [/海/, '海'], [/风/, '风'],
    [/猫/, '猫'], [/狗/, '狗'], [/睡觉|睡/, '睡觉'], [/早起/, '早起'], [/晚饭|晚餐/, '晚饭'], [/午饭|午餐/, '午饭'],
    [/散步|走了走/, '散步'], [/音乐|歌/, '音乐'], [/电影/, '电影'], [/看书|读书|一本书/, '书'], [/旅行|旅游/, '旅行'],
    [/机场|飞机/, '机场'], [/火车|高铁/, '火车'], [/花/, '花'], [/树/, '树'], [/秋天/, '秋天'], [/夏天/, '夏天'],
    [/冬天/, '冬天'], [/春天/, '春天'], [/生日/, '生日'], [/周末/, '周末'], [/假期|放假/, '假期'], [/加班/, '加班'],
    [/面试/, '面试'], [/考试/, '考试'], [/搬家/, '搬家'], [/公司/, '公司'], [/聊了|聊天/, '聊天'],
  ];
  const DREAM_ELEMS = [
    [/房子|房间|屋子|楼/, '🏠', '房子'], [/找|寻找|找不到/, '🔍', '寻找'], [/停电|黑|暗|夜/, '🌑', '黑暗'],
    [/一个人|某个人|有人|他|她/, '👤', '某个人'], [/水|海|河|湖|游泳|淹/, '🌊', '水'], [/飞|飘|天上/, '🕊', '飞翔'],
    [/追|跑|逃/, '🏃', '追逐'], [/考试|考场|试卷/, '📝', '考试'], [/掉|坠|摔|跌/, '⬇️', '坠落'],
    [/死|去世|葬/, '🕯', '死亡'], [/妈|爸|家人|奶奶|爷爷/, '👨‍👩‍👧', '家人'], [/车|开车|公交|地铁|火车/, '🚗', '车'],
    [/学校|教室|老师|同学/, '🏫', '学校'], [/猫|狗|动物|鸟|蛇/, '🐾', '动物'], [/迷路|走不出|找不到路/, '🧭', '迷路'],
    [/牙|掉牙/, '🦷', '牙齿'], [/门|钥匙|锁/, '🔑', '门与钥匙'], [/说话|喊|叫|声音/, '💬', '声音'],
    [/小时候|童年|以前的/, '🧸', '童年'], [/雨|下雨|雪/, '🌧', '天气'], [/光|亮|太阳/, '☀️', '光'],
  ];
  const CHAT_RE = /帮我想想|你觉得呢|你怎么看|我也不知道为什么|不知道为什么|怎么办|为什么会这样|你说呢/;
  const WHO = [
    [/妈|爸|父母|家人|爷爷|奶奶|女儿|儿子|孩子/, '家人'], [/老公|老婆|男朋友|女朋友|爱人/, '伴侣'],
    [/朋友|闺蜜|哥们|同学/, '朋友'], [/同事|老板|领导|客户/, '同事'], [/一个人|独自|自己一个/, '一个人'],
  ];
  const TURN_RE = /但是|但|又觉得|后来|然后|之后|结果|不过/;

  function timeOfDay(d) {
    const h = d.getHours();
    if (h < 5) return '深夜'; if (h < 9) return '清晨'; if (h < 11) return '上午';
    if (h < 14) return '中午'; if (h < 17) return '下午'; if (h < 19) return '傍晚';
    if (h < 23) return '夜里'; return '深夜';
  }

  function tidy(text, type, opts) {
    opts = opts || {};
    const now = opts.at ? new Date(opts.at) : new Date();
    // 原话尽量保留：只收多余空白、去掉语音开头的"嗯/呃"、补一个句号
    let t = (text || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    t = t.replace(/^(嗯+|呃+|那个|就是说)[，,、 ]*/, '');
    if (t && !/[。！？!?…”」）)]$/.test(t)) t += '。';

    const themes = [];
    for (const [re, label] of THEMES) { if (re.test(t) && !themes.includes(label)) themes.push(label); if (themes.length >= 3) break; }
    if (type === 'dream' && !themes.includes('梦')) themes.unshift('梦');

    // 状态：按在原话里出现的先后排序（这样"烦 → 放松"的方向才对）
    const found = [];
    const NEG_MOODS = ['疲惫', '难过', '焦虑', '生气', '烦躁', '孤独', '害怕', '迷茫', '困惑', '紧绷'];
    for (const [w, label] of MOOD_WORDS) {
      const i = t.indexOf(w);
      if (i < 0) continue;
      // "没那么焦虑了 / 不烦了"：否定的负面情绪 → 松下来
      const before = t.slice(Math.max(0, i - 4), i);
      const negated = /不再|没那么|不那么|没有|不|没/.test(before);
      const finalLabel = negated ? (NEG_MOODS.includes(label) ? '松下来' : null) : label;
      if (finalLabel && !found.some((x) => x.label === finalLabel)) found.push({ label: finalLabel, i });
    }
    found.sort((a, b) => a.i - b.i);
    const moods = found.slice(0, 2).map((x) => x.label);
    const feltCount = moods.length;
    if (moods.length < 2 && REFLECT_RE.test(t) && !moods.includes('反思')) moods.push('反思');
    if (opts.mood && !moods.includes(opts.mood)) moods.unshift(opts.mood);

    let place = '';
    for (const [re, label] of PLACES) { if (re.test(t)) { place = label; break; } }

    const keywords = KEYWORDS.filter(([re]) => re.test(t)).map(([, k]) => k).slice(0, 4);

    const dreamElements = type === 'dream'
      ? DREAM_ELEMS.filter(([re]) => re.test(t)).slice(0, 6).map(([, icon, label]) => ({ icon, label }))
      : [];

    let who = '';
    for (const [re, label] of WHO) { if (re.test(t)) { who = label; break; } }
    // 状态里有没有"转折"：烦躁 → 放松
    const turn = feltCount >= 2 && TURN_RE.test(t);

    let summary = '';
    if (t.length > 40) {
      const first = t.split(/[。！？!?…]/)[0];
      summary = first.length > 4 && first.length < t.length ? first : t.slice(0, 24) + '…';
    }
    const likeDream = type !== 'dream' && /梦到|做了.{0,4}梦|梦见|梦里/.test(t);
    const tags = themes.filter((x) => x !== '情绪').concat(likeDream ? ['像一个梦'] : []);
    const wantsChat = CHAT_RE.test(t);
    return { text: t, summary, tags, themes, moods, turn, place, who, keywords, dreamElements, wantsChat, timeOfDay: timeOfDay(now) };
  }

  /* ---------------- 关联：把用户自己说过的话重新放到一起 ----------------
     不下结论。只找过去 90 天里主题相同的记录（梦只和梦中元素/主题相同的比）。
     用户可以让某条记录"不关联"，或让某类主题"不分析"。
  ------------------------------------------------------------------------ */
  const MUTE_KEY = 'today-muted-themes-v1';
  let mutedThemes = [];
  try { mutedThemes = JSON.parse(localStorage.getItem(MUTE_KEY) || '[]'); } catch (e) { mutedThemes = []; }
  function persistMuted() { localStorage.setItem(MUTE_KEY, JSON.stringify(mutedThemes)); }
  function isMuted(r) {
    const th = (r.tidy && r.tidy.themes) || [];
    return th.some((x) => mutedThemes.includes(x));
  }

  function weekKey(ts) {
    const d = new Date(ts); d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // 周一为 0
    d.setDate(d.getDate() - day);
    return d.getTime();
  }

  function findRelated(r) {
    if (r.noLink || isMuted(r)) return { items: [], streakWeeks: 0, theme: '' };
    const th = ((r.tidy && r.tidy.themes) || []).filter((x) => x !== '情绪' && x !== '梦');
    const elems = ((r.tidy && r.tidy.dreamElements) || []).map((e) => e.label);
    const since = r.createdAt - 90 * 86400000;
    const items = [];
    for (const o of records) {
      if (o.id === r.id || o.noLink || o.createdAt >= r.createdAt || o.createdAt < since) continue;
      const ot = (o.tidy && o.tidy.themes) || [];
      const oe = ((o.tidy && o.tidy.dreamElements) || []).map((e) => e.label);
      let hit = '';
      if (r.type === 'dream') {
        hit = elems.find((x) => oe.includes(x)) || th.find((x) => ot.includes(x)) || '';
      } else {
        hit = th.find((x) => ot.includes(x)) || '';
      }
      if (hit) items.push({ r: o, theme: hit });
    }
    items.sort((a, b) => b.r.createdAt - a.r.createdAt);
    // 连续几周都在说类似的事
    const weeks = new Set(items.map((x) => weekKey(x.r.createdAt)));
    weeks.add(weekKey(r.createdAt));
    let streak = 0, w = weekKey(r.createdAt);
    while (weeks.has(w)) { streak++; w -= 7 * 86400000; }
    const theme = items.length ? (items[0].theme) : '';
    return { items: items.slice(0, 6), streakWeeks: streak, theme };
  }

  /* ---------------- 视图切换 ---------------- */
  const views = ['today', 'tree', 'dream', 'year'];
  function showView(name) {
    if (name !== 'tree') stopReplay();
    views.forEach((v) => $('view-' + v).classList.toggle('active', v === name));
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    if (name === 'today') renderToday();
    if (name === 'tree' && !treeReplaying) renderTree();
    if (name === 'dream') renderDreams();
    if (name === 'year') { calPage = new Date().getMonth(); renderYear(); }
    $('view-' + name).scrollTop = 0;
  }
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

  /* ---------------- 首页渲染 ---------------- */
  function renderHead() {
    const now = new Date();
    $('todayDate').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    $('todayWeek').textContent = WEEK[now.getDay()];
    const t = solarTerm(now);
    $('todayTerm').textContent = `${t.name} · ${t.season}`;
    $('todayTermNote').textContent = t.note;
    $('questionText').textContent = QUESTIONS[dayOfYear(now) % QUESTIONS.length];
  }

  function todayRecords() {
    const k = dayKey(new Date());
    return records.filter((r) => dayKey(new Date(r.createdAt)) === k).sort((a, b) => a.createdAt - b.createdAt);
  }

  function renderToday() {
    renderHead();
    const list = todayRecords();
    const box = $('timeline');
    $('timelineTitle').textContent = list.length ? '今天已经留下' : '今日';
    if (!list.length) {
      box.innerHTML = `<div class="empty"><b>今天还没有留下什么。</b>有什么想留给未来的自己？</div>`;
    } else {
      box.innerHTML = list.map(entryHTML).join('');
    }
    // 树的彩蛋
    const total = records.length;
    const days = new Set(records.map((r) => dayKey(new Date(r.createdAt)))).size;
    $('treeTeaserEmoji').textContent = treeEmoji(days, total);
    $('treeTeaserText').textContent = !total
      ? '一颗种子，等你留下第一句'
      : total < 3 ? '它发芽了'
      : total < 10 ? '已经是一棵小树苗'
      : (list.length ? '今天又留下了一点' : '去看看它长成什么样了');
  }

  function entryHTML(r) {
    const type = TYPES[r.type] || TYPES.text;
    const isQuote = r.type === 'text' || r.type === 'voice';
    const icon = r.type === 'idea' ? '💭' : type.icon;
    const showIcon = r.type !== 'text';
    const text = r.text ? (isQuote ? `“${r.text}”` : r.text) : (r.type === 'photo' ? '' : '');
    return `<div class="entry" data-id="${r.id}">
      <div class="entry-time">${fmtTime(r.createdAt)}</div>
      <div class="entry-body">
        ${text || showIcon ? `<div class="entry-text ${isQuote ? 'quote' : ''}">${showIcon ? `<span class="entry-icon">${icon}</span>` : ''}${esc(text)}</div>` : ''}
        ${r.image ? `<img class="entry-img" src="${r.image}" alt="" loading="lazy" />` : ''}
        ${r.tidy && r.tidy.tags && r.tidy.tags.length ? `<div class="entry-tidy">${r.tidy.tags.map((x) => '#' + x).join(' ')}</div>` : ''}
      </div>
    </div>`;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  $('timeline').addEventListener('click', (e) => {
    const el = e.target.closest('.entry');
    if (el) openDetail(el.dataset.id);
  });
  $('dreamList').addEventListener('click', (e) => {
    const el = e.target.closest('.dream');
    if (el) openDetail(el.dataset.id);
  });
  $('treeTeaser').addEventListener('click', () => showView('tree'));
  $('questionAnswer').addEventListener('click', () => {
    openCapture('input');
    $('capText').placeholder = $('questionText').textContent;
  });

  /* ---------------- 弹层通用 ---------------- */
  function openSheet(id) { $(id).classList.add('open'); }
  function closeSheet(id) { $(id).classList.remove('open'); }
  document.querySelectorAll('.sheet-mask').forEach((m) => {
    m.addEventListener('click', (e) => { if (e.target === m) closeSheet(m.id); });
  });

  /* ============================================================
     记一下：万能捕捉器
     三个动作：① 扔进来 → ② AI 轻轻整理 → ③ 留下来（记录完成卡）
     ============================================================ */
  const MOODS = ['平静', '开心', '累', '烦', '难过', '焦虑', '兴奋', '孤独', '期待', '说不清'];
  const cap = $('capture');
  let capPane = 'input';
  let capPhoto = null;     // 照片模式里选中的图
  let capMood = null;      // 心情模式里选中的词
  let editingId = null;    // 「改一改」时正在改的那条
  let cardId = null;       // 当前完成卡对应的记录

  function showPane(name) {
    capPane = name;
    cap.querySelectorAll('.cap-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
    cap.scrollTop = 0;
  }
  function openCapture(mode, preset) {
    cap.classList.add('open');
    editingId = null;
    if (mode === 'dream') { $('capDreamText').value = ''; $('capDreamLive').textContent = ''; showPane('dream'); setTimeout(() => $('capDreamText').focus(), 200); return; }
    if (mode === 'mood') { openMood(); return; }
    if (mode === 'photo' && preset && preset.image) { openPhoto(preset.image); return; }
    $('capText').value = (preset && preset.text) || '';
    $('capText').placeholder = '写下此刻……';
    $('capLive').textContent = '';
    showPane('input');
    if (!(preset && preset.noFocus)) setTimeout(() => $('capText').focus(), 200);
  }
  function closeCapture() {
    stopVoice();
    cap.classList.remove('open');
    $('capText').blur();
    editingId = null; cardId = null;
  }
  $('captureClose').addEventListener('click', () => {
    const hasText = capPane === 'input' && $('capText').value.trim() && !editingId;
    if (hasText && !confirm('这句还没留下，直接离开？')) return;
    closeCapture();
    renderToday();
    if ($('view-tree').classList.contains('active')) renderTree();
  });

  // 首页四个快捷入口
  document.querySelectorAll('.quick').forEach((b) => {
    b.addEventListener('click', () => {
      const type = b.dataset.type;
      if (type === 'photo') { $('photoInput').click(); return; }
      if (type === 'dream') { openCapture('dream'); return; }
      if (type === 'voice') { openCapture('input', { noFocus: true }); toast(SR ? '按住 🎙 开始说' : '这个浏览器不支持语音，直接写吧'); return; }
      openCapture('input');
    });
  });

  // 捕捉页里的三个快捷入口
  cap.querySelectorAll('.cap-quick-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const m = b.dataset.mode;
      if (m === 'photo') { $('photoInput').click(); return; }
      if (m === 'dream') openCapture('dream');
      if (m === 'mood') openMood();
    });
  });

  /* ---- ① 直接写 / 直接说 ---- */
  $('capDone').addEventListener('click', () => {
    const text = $('capText').value.trim();
    if (!text) { $('capText').focus(); toast('写一句，或者按住说'); return; }
    finish(guessType(text), text, null, null);
  });
  $('capText').addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') $('capDone').click();
  });
  function guessType(text) {
    if (/梦到|做了.{0,4}梦|梦见|梦里/.test(text)) return 'dream';
    if (/突然想到|想到一件事|一个想法|我觉得可以|要不要试试|也许真正|我可能.*不是/.test(text)) return 'idea';
    return 'text';
  }

  /* ---- 照片 ---- */
  $('photoInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const src = await compressImage(file, 1000, 0.8);
      cap.classList.add('open');
      openPhoto(src);
    } catch (err) { toast('这张图片读不出来'); }
  });
  function openPhoto(src) {
    capPhoto = src;
    $('capPhotoImg').src = src;
    $('capPhotoText').value = '';
    showPane('photo');
  }
  $('capPhotoRetake').addEventListener('click', () => $('photoInput').click());
  $('capPhotoSave').addEventListener('click', () => {
    // 照片本身就是记录，不强迫写描述
    const text = $('capPhotoText').value.trim();
    finish('photo', text, capPhoto, null);
    capPhoto = null;
  });
  function compressImage(file, max, q) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /* ---- 梦境 ---- */
  $('capDreamDone').addEventListener('click', () => {
    const text = $('capDreamText').value.trim();
    if (!text) { $('capDreamText').focus(); toast('想起什么，就说什么'); return; }
    finish('dream', text, null, null);
  });

  /* ---- 心情 ---- */
  function openMood() {
    capMood = null;
    $('capMoodText').value = '';
    $('capMoodSave').disabled = true;
    $('capMoods').innerHTML = MOODS.map((m) => `<button class="mood-chip ${m === '说不清' ? 'vague' : ''}" data-mood="${m}">${m}</button>`).join('');
    showPane('mood');
  }
  $('capMoods').addEventListener('click', (e) => {
    const b = e.target.closest('.mood-chip');
    if (!b) return;
    capMood = b.dataset.mood;
    $('capMoods').querySelectorAll('.mood-chip').forEach((x) => x.classList.toggle('on', x === b));
    $('capMoodSave').disabled = false;
  });
  $('capMoodSave').addEventListener('click', () => {
    if (!capMood) return;
    const text = $('capMoodText').value.trim() || capMood + '。';
    finish('mood', text, null, capMood);
  });

  /* ---- ② 整理 + ③ 留下：一步完成，然后给用户看卡 ---- */
  function finish(type, text, image, mood) {
    let r;
    if (editingId) {
      r = records.find((x) => x.id === editingId);
      if (r) {
        const t = tidy(text, type, { at: r.createdAt, mood: r.mood });
        r.type = type; r.text = t.text;
        r.tidy = Object.assign({}, r.tidy, packTidy(t));
        persist();
      }
      editingId = null;
    }
    if (!r) r = commit(type, text, image, mood);
    showCard(r);
  }

  function packTidy(t) {
    return {
      summary: t.summary, tags: t.tags, themes: t.themes, moods: t.moods, turn: t.turn, place: t.place, who: t.who,
      keywords: t.keywords, dreamElements: t.dreamElements, timeOfDay: t.timeOfDay, wantsChat: t.wantsChat,
    };
  }

  function commit(type, rawText, image, mood) {
    const at = Date.now();
    const t = tidy(rawText, type, { at, mood });
    const r = {
      id: at.toString(36) + Math.random().toString(36).slice(2, 6),
      type, text: t.text, image: image || null, mood: mood || null,
      tidy: packTidy(t),
      followupQ: null, followup: null, noLink: false,
      createdAt: at,
    };
    records.push(r);
    persist();
    renderToday();
    return r;
  }

  /* ============================================================
     记录完成卡
     原始的我（原话）+ AI 轻轻整理后的我（主题 · 状态 · 关键词）+ 关联 + 当时
     同一个渲染函数也用于时间轴里点开一条旧记录。
     ============================================================ */
  const TYPE_LABEL = { idea: '💭 想法', text: '✍️ 今天', voice: '🎙 说的', mood: '❤️ 心情', photo: '📷 照片', dream: '🌙 梦' };

  function cardHTML(r, opts) {
    opts = opts || {};
    const t = r.tidy || {};
    const d = new Date(r.createdAt);
    const isDream = r.type === 'dream';
    const dateStr = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} · ${fmtTime(r.createdAt)}`;
    const muted = isMuted(r);
    const rel = findRelated(r);

    // 原话：字号随长度微调
    const len = (r.text || '').length;
    const qClass = len <= 14 ? 'short' : len > 60 ? 'long' : '';
    const quote = r.text ? `<p class="card-quote ${qClass}">“${esc(r.text)}”</p>` : '';

    // 「当时」：默认只露一行，点开才展开
    const when = [];
    when.push(`<div><span>🕰</span>${t.timeOfDay || timeOfDay(d)} ${fmtTime(r.createdAt)}</div>`);
    when.push(`<div><span>🌿</span>${termLabel(d)}</div>`);
    if (t.place) when.push(`<div><span>📍</span>${esc(t.place)}</div>`);
    if (t.moods && t.moods.length) when.push(`<div><span>❤️</span>${esc(t.moods.join(' · '))}</div>`);
    if (t.who) when.push(`<div><span>👤</span>${esc(t.who)}</div>`);
    if (r.image) when.push(`<div><span>📷</span>有一张照片</div>`);
    if (r.mood) when.push(`<div><span>😊</span>${esc(r.mood)}</div>`);

    let html = '';
    if (r.image) html += `<div class="card-photo"><img src="${r.image}" alt="" /></div>`;
    html += `<div class="card-when">
        <div>
          <div class="card-time">${dateStr}</div>
          <div class="card-term">${isDream ? '🌙 ' : ''}${termLabel(d)}</div>
        </div>
        <button class="card-when-more" data-act="when">查看当时 →</button>
      </div>
      <div class="card-when-grid">${when.join('')}</div>`;

    // 类型 + 原话
    let typeLabel = TYPE_LABEL[r.type] || TYPE_LABEL.text;
    if (isDream) {
      const tod = t.timeOfDay || timeOfDay(d);
      typeLabel = tod === '清晨' || tod === '上午' ? '昨晚的梦' : tod === '深夜' ? '刚才的梦' : '一个梦';
    }
    html += `<div class="card-type">${typeLabel}</div>${quote}`;

    if (muted) {
      html += `<div class="card-sep"></div><div class="card-muted">这类内容，你选择了不让 AI 整理。只保留原话。</div>`;
      return html;
    }

    if (isDream) {
      html += `<div class="card-sep"></div>`;
      if (t.dreamElements && t.dreamElements.length) {
        html += `<div class="card-row"><div class="card-label">梦里出现</div><div class="card-elems">${
          t.dreamElements.map((e) => `<div class="card-elem"><span>${e.icon}</span>${esc(e.label)}</div>`).join('')}</div></div>`;
      }
      const WAKE = ['平静', '有些焦虑', '开心', '失落', '说不清'];
      html += `<div class="card-row"><div class="card-label">醒来时</div><div class="card-wake">${
        WAKE.map((w) => `<button class="mood-chip ${t.wake === w ? 'on' : ''}" data-wake="${w}">${w}</button>`).join('')}</div></div>`;
      // 留给未来的你：不解梦，只数数
      const futureLine = dreamFutureLine(r);
      if (futureLine) {
        html += `<div class="card-future-you"><div class="card-label">🌙 留给未来的你</div><p>${futureLine}</p>`;
        const real = rel.items.filter((x) => x.r.type !== 'dream');
        const past = rel.items.filter((x) => x.r.type === 'dream');
        if (real.length) html += `<button class="card-related-more" data-act="rel">看看它和现实中的哪些记录有关 →</button>
          <div class="card-rel-list hidden">${real.map(relItem).join('')}</div>`;
        else if (past.length) html += `<button class="card-related-more" data-act="rel">看看之前类似的梦 →</button>
          <div class="card-rel-list hidden">${past.map(relItem).join('')}</div>`;
        html += `</div>`;
      }
      return html;
    }

    // AI 轻整理：最多三层——主题 / 状态 / 关键词
    const themes = (t.themes || []).filter((x) => x !== '情绪').slice(0, 3);
    const moods = (t.moods || []).slice(0, 2);
    const kws = (t.keywords || []).filter((k) => !themes.includes(k)).slice(0, 4);
    if (themes.length || moods.length || kws.length) {
      html += `<div class="card-sep"></div><div class="card-label">AI 帮你记下了</div>`;
      if (themes.length) html += `<div class="card-line">${themes.map(esc).join('<span class="sep">·</span>')}</div>`;
      if (moods.length) {
        const joiner = t.turn && moods.length === 2 ? '<span class="arrow">→</span>' : '<span class="sep">·</span>';
        html += `<div class="card-row"><div class="card-label">${r.image ? '今日状态' : '此刻的状态'}</div><div class="card-line">${moods.map(esc).join(joiner)}</div></div>`;
      }
      if (kws.length) html += `<div class="card-kw">${kws.map(esc).join('<i>/</i>')}</div>`;
    }

    // 关联：把用户自己说过的话重新放到一起，不下结论
    if (rel.items.length) {
      const shown = rel.items.slice(0, 2), rest = rel.items.slice(2);
      html += `<div class="card-related">
        <div class="card-related-title">🌿 这句话，也许和你之前的一些记录有关</div>
        ${shown.map(relItem).join('')}
        <div class="card-rel-list hidden">${rest.map(relItem).join('')}</div>
        ${rel.streakWeeks >= 2 ? `<div class="card-streak">你已经连续 ${rel.streakWeeks} 周记录了类似的想法。</div>` : ''}
        ${rest.length ? `<button class="card-related-more" data-act="rel">查看全部 ${rel.items.length} 条关联 →</button>` : ''}
      </div>`;
    }
    return html;
  }

  function relItem(x) {
    const d = new Date(x.r.createdAt);
    const text = x.r.text || (x.r.image ? '（一张照片）' : '');
    return `<div class="card-rel" data-rel="${x.r.id}">
      <div class="card-rel-date">${d.getMonth() + 1}月${d.getDate()}日</div>
      <div class="card-rel-text">“${esc(text)}”</div>
    </div>`;
  }

  function dreamFutureLine(r) {
    const y = new Date(r.createdAt).getFullYear();
    const dreams = records.filter((x) => x.type === 'dream' && new Date(x.createdAt).getFullYear() === y && x.createdAt <= r.createdAt);
    const elems = (r.tidy && r.tidy.dreamElements) || [];
    let best = null;
    for (const e of elems) {
      const n = dreams.filter((x) => ((x.tidy && x.tidy.dreamElements) || []).some((k) => k.label === e.label)).length;
      if (!best || n > best.n) best = { label: e.label, n };
    }
    if (best && best.n >= 2) return `这是你今年记录的第 ${best.n} 个「${esc(best.label)}」主题的梦。`;
    if (dreams.length === 1) return '这是你今年留下的第一个梦。';
    return `这是你今年留下的第 ${dreams.length} 个梦。`;
  }

  // 卡片内的交互：查看当时 / 展开关联 / 醒来时 / 点关联记录
  function bindCard(box, r) {
    box.onclick = (e) => {
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'when') {
        const g = box.querySelector('.card-when-grid');
        g.classList.toggle('open');
        act.textContent = g.classList.contains('open') ? '收起' : '查看当时 →';
        return;
      }
      if (act && act.dataset.act === 'rel') {
        box.querySelector('.card-rel-list').classList.remove('hidden');
        act.remove();
        return;
      }
      const wake = e.target.closest('[data-wake]');
      if (wake) {
        r.tidy.wake = wake.dataset.wake;
        box.querySelectorAll('[data-wake]').forEach((x) => x.classList.toggle('on', x === wake));
        persist();
        return;
      }
      const rel = e.target.closest('[data-rel]');
      if (rel) openDetail(rel.dataset.rel);
    };
  }

  /* ---- 完成卡（记完之后看到的） ---- */
  function showCard(r) {
    cardId = r.id;
    const box = $('cardBox');
    box.className = 'card' + (r.type === 'dream' ? ' dream' : '');
    box.innerHTML = cardHTML(r);
    bindCard(box, r);

    // 「留给未来」：不每次都说，只在特殊时刻说
    $('cardFuture').textContent = futureLine(r);

    // AI 不抢戏：只有用户明确邀请才出现对话入口
    const t = r.tidy || {};
    $('cardChat').innerHTML = t.wantsChat && r.type !== 'dream' && !isMuted(r) && !r.followup ? `
      <div class="chat-offer">
        我先帮你记下来了。<br/>如果你愿意，我们也可以一起看看，为什么今天特别强烈。
        <div class="chat-offer-actions">
          <button class="chat-yes" id="chatYes">好</button>
          <button class="chat-no" id="chatNo">先这样</button>
        </div>
      </div>` : '';
    if ($('chatYes')) {
      $('chatYes').addEventListener('click', () => openChat(r));
      $('chatNo').addEventListener('click', () => { $('cardChat').innerHTML = ''; });
    }
    $('cardNoLink').textContent = r.noLink ? '已不关联' : '不关联这条记录';
    $('cardMute').hidden = !((t.themes || []).some((x) => x !== '情绪'));
    showPane('card');
  }

  function futureLine(r) {
    const total = records.length;
    const todayN = todayRecords().length;
    const daysBefore = new Set(records.filter((x) => x.id !== r.id).map((x) => dayKey(new Date(x.createdAt)))).size;
    const milestone = total === 1 || [7, 30, 100, 365].includes(total);
    const firstOfDay = todayN === 1 && daysBefore >= 3;
    if (total === 1) return '去「我的树」看一眼。它发芽了。';
    if (milestone || firstOfDay || Math.random() < 0.15) return '未来的你，会看到今天的你。';
    if (r.type === 'dream') return '梦会在「梦境」里等你。';
    if (r.type === 'photo') return '这张照片在树上开成了一朵花。';
    return '';
  }

  // 对话模式（MVP：一次只问一个问题，答案作为补充存进这条记录）
  const FOLLOWUPS = {
    '工作': '今天是哪一刻，让这个念头特别强烈？',
    '人生选择': '如果不考虑后果，你此刻最想选哪一边？',
    '家人': '这件事里，你最想被理解的是什么？',
    '身体': '身体最近还给过你什么提醒？',
    '自我认知': '这个发现，你是第一次意识到吗？',
    'default': '如果要给这个念头找一个起点，你觉得是从什么时候开始的？',
  };
  function openChat(r) {
    const theme = (r.tidy.themes || []).find((x) => FOLLOWUPS[x]) || 'default';
    $('cardChat').innerHTML = `
      <div class="chat-offer">
        <p class="chat-q">${FOLLOWUPS[theme]}</p>
        <textarea class="chat-answer" id="chatAnswer" rows="3" placeholder="想到什么说什么，不用完整。"></textarea>
        <p class="chat-note">回答会作为补充，和这条记录一起留下。</p>
      </div>`;
    $('chatAnswer').focus();
    $('chatAnswer').addEventListener('input', () => {
      r.followup = $('chatAnswer').value.trim() || null;
      r.followupQ = r.followup ? FOLLOWUPS[theme] : null;
      persist();
    });
  }

  $('cardEdit').addEventListener('click', () => {
    const r = records.find((x) => x.id === cardId);
    if (!r) return;
    editingId = r.id;
    if (r.type === 'dream') { $('capDreamText').value = r.text; showPane('dream'); $('capDreamText').focus(); }
    else { $('capText').value = r.text; showPane('input'); $('capText').focus(); }
  });
  $('cardNoLink').addEventListener('click', () => {
    const r = records.find((x) => x.id === cardId);
    if (!r) return;
    r.noLink = !r.noLink;
    persist();
    showCard(r);
    toast(r.noLink ? '这条不会和其他记录关联' : '已恢复关联');
  });
  $('cardMute').addEventListener('click', () => {
    const r = records.find((x) => x.id === cardId);
    if (!r) return;
    const th = (r.tidy.themes || []).filter((x) => x !== '情绪');
    if (!th.length) return;
    const on = !isMuted(r);
    if (on) th.forEach((x) => { if (!mutedThemes.includes(x)) mutedThemes.push(x); });
    else mutedThemes = mutedThemes.filter((x) => !th.includes(x));
    persistMuted();
    $('cardMute').textContent = on ? '恢复 AI 分析这类内容' : '不希望 AI 分析这类内容';
    showCard(r);
    toast(on ? `以后「${th.join('、')}」相关内容只保留原话` : '已恢复整理');
  });
  $('cardAgain').addEventListener('click', () => openCapture('input'));
  $('cardHome').addEventListener('click', () => { closeCapture(); showView('today'); });

  /* ---------------- 详情：时间轴里点开一条，就是同一张卡 ---------------- */
  let detailId = null;
  function openDetail(id) {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    detailId = id;
    const box = $('detailCard');
    box.className = 'card card-in-sheet' + (r.type === 'dream' ? ' dream' : '');
    let html = cardHTML(r);
    if (r.followup) html += `<div class="card-sep"></div><div class="card-label">补充 · ${esc(r.followupQ || '')}</div><div class="card-line">${esc(r.followup)}</div>`;
    box.innerHTML = html;
    bindCard(box, r);
    openSheet('detailSheet');
  }
  $('detailClose').addEventListener('click', () => closeSheet('detailSheet'));
  $('detailDelete').addEventListener('click', () => {
    if (!detailId) return;
    if (!confirm('删掉这一条？删了就找不回来了。')) return;
    records = records.filter((x) => x.id !== detailId);
    persist();
    closeSheet('detailSheet');
    renderToday(); renderDreams(); renderTree(); renderYear();
    toast('已删掉');
  });

  /* ---------------- 语音（按住说） ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, recActive = false, recFinal = '', recInterim = '';
  let recTarget = null;  // { onLive(text), onEnd(text) }

  function startVoice(target) {
    if (!SR) { toast('这个浏览器不支持语音，直接写吧'); return false; }
    if (recActive) return true;
    rec = new SR();
    rec.lang = 'zh-CN';
    rec.interimResults = true;
    rec.continuous = true;
    recFinal = ''; recInterim = ''; recTarget = target;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const s = e.results[i][0].transcript;
        if (e.results[i].isFinal) recFinal += s; else interim += s;
      }
      recInterim = interim;
      if (recTarget && recTarget.onLive) recTarget.onLive(recFinal + recInterim);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') toast('需要允许使用麦克风');
      else if (e.error !== 'aborted' && e.error !== 'no-speech') toast('没听清，再试一次');
    };
    rec.onend = () => {
      recActive = false;
      const text = (recFinal + recInterim).trim();
      const tg = recTarget; recTarget = null;
      if (tg && tg.onEnd) tg.onEnd(text);
    };
    try { rec.start(); recActive = true; } catch (e) { recActive = false; return false; }
    return true;
  }
  function stopVoice() { if (rec && recActive) { try { rec.stop(); } catch (e) { /* noop */ } } }

  // 按住说话：绑定到一个按钮 + 一个 textarea + 一个实时预览区
  function bindHoldToTalk(btnId, labelId, textareaId, liveId) {
    const btn = $(btnId), label = $(labelId), ta = $(textareaId), live = $(liveId);
    if (!SR) { btn.disabled = true; label.textContent = '此浏览器不支持语音'; return; }
    let base = '';
    const down = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      base = ta.value.trim();
      const ok = startVoice({
        onLive: (t) => { live.textContent = t; },
        onEnd: (t) => {
          btn.classList.remove('listening'); label.textContent = '按住说一说'; live.textContent = '';
          if (t) ta.value = base ? base + (/[。！？!?]$/.test(base) ? '' : '，') + t : t;
          else toast('没听清，再说一次？');
        },
      });
      if (ok) { btn.classList.add('listening'); label.textContent = '松开完成'; }
    };
    const up = () => { if (recActive) { label.textContent = '正在整理…'; stopVoice(); } };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  bindHoldToTalk('capVoice', 'capVoiceLabel', 'capText', 'capLive');
  bindHoldToTalk('capDreamVoice', 'capDreamVoiceLabel', 'capDreamText', 'capDreamLive');

  /* 首页大按钮：点击 → 进入捕捉页；长按 → 直接说，松开进确认卡 */
  (function bigButton() {
    const btn = $('bigRecord');
    let timer = null, longPressed = false, pointerDown = false;
    const LONG = 380;
    function down(e) {
      if (e.button !== undefined && e.button !== 0) return;
      pointerDown = true; longPressed = false;
      btn.classList.add('pressing');
      timer = setTimeout(() => {
        longPressed = true;
        if (!SR) { toast('这个浏览器不支持语音，点一下直接写'); return; }
        $('voiceLive').textContent = '';
        $('voiceHint').textContent = '正在听……松开完成';
        $('voiceOverlay').classList.add('open');
        const ok = startVoice({
          onLive: (t) => { $('voiceLive').textContent = t; },
          onEnd: (t) => {
            $('voiceOverlay').classList.remove('open');
            if (t) { cap.classList.add('open'); editingId = null; const g = guessType(t); finish(g === 'text' ? 'voice' : g, t, null, null); }
            else toast('没听清，再说一次？');
          },
        });
        if (!ok) $('voiceOverlay').classList.remove('open');
      }, LONG);
    }
    function up() {
      if (!pointerDown) return;
      pointerDown = false;
      clearTimeout(timer);
      btn.classList.remove('pressing');
      if (longPressed) {
        if (recActive) { $('voiceHint').textContent = '正在整理…'; stopVoice(); }
        else $('voiceOverlay').classList.remove('open');
      } else {
        openCapture('input');
      }
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', () => { if (pointerDown && !longPressed) { clearTimeout(timer); pointerDown = false; btn.classList.remove('pressing'); } });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    $('voiceOverlay').addEventListener('pointerup', up);
    $('bigRecordHint').textContent = SR ? '长按说话 · 点击写下' : '点击写下';
  })();

  /* ---------------- 我的树 ----------------
     种子 → 嫩芽 → 小树苗 → 小树 → 成树
     少数据 = 年轻（嫩绿、体量小），不是萧条。
     AI 判断类型，程序长树。没有记录时只有一颗种子。
  ------------------------------------------------ */
  function treeEmoji(_days, total) {
    if (total === 0) return '种';
    if (total < 3) return '芽';
    if (total < 10) return '苗';
    return '木';
  }
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }

  const CX = 180;

  // 小树苗：短、嫩、左右不对称
  const SAPLING_RECIPES = [
    { t: 0.38, side: -1, dx: -56, dy: -22, c1x: -18, c1y: 6,  c2x: -40, c2y: -8,  w: 2.0 },
    { t: 0.58, side:  1, dx:  50, dy: -28, c1x:  16, c1y: -6, c2x:  36, c2y: -16, w: 1.8 },
    { t: 0.78, side: -1, dx: -22, dy: -36, c1x: -4,  c1y: -14, c2x: -12, c2y: -26, w: 1.5 },
  ];
  // 成树：更长、更弯、有树冠。不要对称圣诞树。
  const BRANCH_RECIPES = [
    { t: 0.26, side: -1, dx: -102, dy: -36, c1x: -30, c1y: 6,   c2x: -72, c2y: -14, w: 2.2 },
    { t: 0.46, side: -1, dx: -88,  dy: -96, c1x: -18, c1y: -30, c2x: -56, c2y: -68, w: 1.9 },
    { t: 0.20, side:  1, dx:  86,  dy: -20, c1x:  30, c1y: 10,  c2x:  62, c2y: -2,  w: 1.8 },
    { t: 0.38, side:  1, dx: 114,  dy: -52, c1x:  36, c1y: -2,  c2x:  82, c2y: -24, w: 2.1 },
    { t: 0.64, side: -1, dx: -64,  dy: -118,c1x: -10, c1y: -38, c2x: -36, c2y: -84, w: 1.8 },
    { t: 0.56, side:  1, dx:  78,  dy: -102,c1x:  20, c1y: -26, c2x:  52, c2y: -68, w: 1.7 },
    { t: 0.80, side: -1, dx: -30,  dy: -126,c1x: -4,  c1y: -44, c2x: -16, c2y: -90, w: 1.6 },
    { t: 0.76, side:  1, dx:  40,  dy: -132,c1x:  10, c1y: -46, c2x:  24, c2y: -94, w: 1.55 },
    { t: 0.34, side: -1, dx: -58,  dy: -24, c1x: -20, c1y: 8,   c2x: -40, c2y: -8,  w: 1.45 },
    { t: 0.70, side:  1, dx:  54,  dy: -78, c1x:  16, c1y: -20, c2x:  36, c2y: -52, w: 1.4 },
    { t: 0.50, side:  1, dx:  48,  dy: -44, c1x:  18, c1y: -4,  c2x:  34, c2y: -24, w: 1.35 },
    { t: 0.88, side: -1, dx:  10,  dy: -102,c1x:  2,  c1y: -34, c2x:  8,  c2y: -72, w: 1.5 },
  ];

  function cubicPt(a, b, c, d, t) {
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    };
  }
  function cubicD(a, b, c, d, t) {
    const u = 1 - t;
    return {
      x: 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x),
      y: 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y),
    };
  }
  function cubicPath(a, b, c, d) {
    return `M ${a.x} ${a.y} C ${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`;
  }

  function groundY(stage) {
    return { seed: 286, sprout: 332, seedling: 378, young: 448, growing: 490, canopy: 504, full: 508 }[stage] || 500;
  }

  function growthStage(n) {
    if (n <= 0) return 'seed';
    if (n <= 2) return 'sprout';
    if (n < 10) return 'seedling';
    if (n < 30) return 'young';
    if (n < 60) return 'growing';
    if (n < 100) return 'canopy';
    return 'full';
  }

  function stageSpec(stage, season) {
    const tender = ['#b7d492', '#c5dea8', '#a8c984', '#d0e6b4'];
    const by = {
      春: ['#9ec07a', '#b3d090', '#86b068', '#c4dea4'],
      夏: ['#5f8754', '#7e9d6c', '#4e7348', '#93b07e'],
      秋: ['#c5b36a', '#d8c888', '#9aaa62', '#c4a060', '#b7c47a', '#8f9d5c'],
      冬: ['#8a9a78', '#9aaa86', '#7a8a6c'],
    };
    const specs = {
      seed:     { branches: 0,  len: 0,    trunkH: 0,   baseW: 0,   topW: 0,   leafMax: 0,  bloomMax: 0, fruitMax: 0, foliage: 0,  colors: tender, young: true },
      sprout:   { branches: 0,  len: 0,    trunkH: 78,  baseW: 2.4, topW: 1.6, leafMax: 2,  bloomMax: 1, fruitMax: 0, foliage: 0,  colors: tender, young: true },
      seedling: { branches: 2,  len: 1,    trunkH: 108, baseW: 3.4, topW: 1.8, leafMax: 10, bloomMax: 3, fruitMax: 2, foliage: 3,  colors: tender, young: true },
      young:    { branches: 5,  len: 1,    trunkH: 168, baseW: 4.4, topW: 2.0, leafMax: 22, bloomMax: 5, fruitMax: 3, foliage: 4,  colors: tender, young: true },
      growing:  { branches: 8,  len: 1,    trunkH: 228, baseW: 7.2, topW: 2.8, leafMax: 36, bloomMax: 8, fruitMax: 5, foliage: 8,  colors: by[season], young: false },
      canopy:   { branches: 10, len: 1,    trunkH: 268, baseW: 9.0, topW: 3.2, leafMax: 48, bloomMax: 12, fruitMax: 7, foliage: 11, colors: by[season], young: false },
      full:     { branches: 12, len: 1,    trunkH: 298, baseW: 11,  topW: 3.6, leafMax: 64, bloomMax: 16, fruitMax: 9, foliage: 14, colors: by[season], young: false },
    };
    return specs[stage];
  }

  function nodeKind(r) {
    if (r.type === 'dream') return 'dream';
    if (r.image) return 'photo';
    const th = (r.tidy && r.tidy.themes) || [];
    const who = (r.tidy && r.tidy.who) || '';
    const text = r.text || '';
    if (/第一次|结婚|出生|毕业|搬家|离职|辞职|分手|求婚|离世|去世/.test(text)) return 'event';
    if (r.type === 'idea' && th.includes('人生选择')) return 'event';
    if (who === '家人' || who === '伴侣') return 'event';
    if (th.includes('人生选择') || /梦想|想做的事|如果不用考虑/.test(text)) return 'goal';
    return 'thought';
  }

  let treeYear = new Date().getFullYear();
  let treeNodes = [];
  let treeGrown = false;
  let treeReplayTimer = null;
  let treeReplayRaf = 0;
  let treeReplaying = false;
  let lastTreeStage = '';
  let liveTree = null;

  function yearRecords(y, until) {
    const end = until == null ? Date.now() : until;
    return records.filter((r) => new Date(r.createdAt).getFullYear() === y && r.createdAt <= end)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  function themeCount(list) {
    const c = {};
    list.forEach((r) => ((r.tidy && r.tidy.themes) || []).forEach((t) => {
      if (t === '情绪' || t === '梦') return;
      c[t] = (c[t] || 0) + 1;
    }));
    return Object.keys(c).filter((k) => c[k] >= 3);
  }

  function makeBranch(recipe, gy, trunkH, len) {
    const scale = Math.max(0.42, trunkH / 248) * (0.62 + (len || 1) * 0.38);
    const lean = recipe.side * (1.8 + recipe.t * 3.2);
    const a = { x: CX + lean, y: gy - trunkH * recipe.t };
    const b = { x: a.x + recipe.c1x * scale, y: a.y + recipe.c1y * scale };
    const c = { x: a.x + recipe.c2x * scale, y: a.y + recipe.c2y * scale };
    const d = { x: a.x + recipe.dx * scale, y: a.y + recipe.dy * scale };
    return { a, b, c, d, w: recipe.w * (trunkH > 180 ? 1.25 : 0.95) * (0.8 + scale * 0.45) };
  }

  function placeNode(r, i, branches, len, trunkH, gy) {
    const rnd = seeded(r.id);
    const onTrunk = !branches.length || (trunkH && rnd() < 0.18);
    if (onTrunk && trunkH) {
      const t = 0.28 + rnd() * 0.62;
      const side = rnd() > 0.5 ? 1 : -1;
      return {
        id: 'n_' + r.id, type: nodeKind(r), date: dayKey(new Date(r.createdAt)),
        month: new Date(r.createdAt).getMonth(), relatedRecordId: r.id, record: r,
        x: CX + side * (8 + rnd() * 10), y: gy - trunkH * t,
        rot: side * (40 + rnd() * 50), size: 8.5 + rnd() * 3.2, i,
      };
    }
    const br = branches[Math.floor(rnd() * branches.length)] || branches[0];
    const t = 0.28 + rnd() * Math.max(0.2, len * 0.65);
    const tt = Math.min(t, Math.max(0.2, len * 0.92));
    const p = cubicPt(br.a, br.b, br.c, br.d, tt);
    const d = cubicD(br.a, br.b, br.c, br.d, tt);
    const L = Math.hypot(d.x, d.y) || 1;
    const side = rnd() > 0.5 ? 1 : -1;
    const off = 5 + rnd() * 9;
    return {
      id: 'n_' + r.id, type: nodeKind(r), date: dayKey(new Date(r.createdAt)),
      month: new Date(r.createdAt).getMonth(), relatedRecordId: r.id, record: r,
      x: p.x + (-d.y / L) * off * side, y: p.y + (d.x / L) * off * side,
      rot: (Math.atan2(d.y, d.x) * 180) / Math.PI + (rnd() - 0.5) * 36,
      size: 8.2 + rnd() * 3.6, i,
    };
  }

  function pick(arr, max) {
    if (arr.length <= max) return arr;
    const step = arr.length / max;
    return Array.from({ length: max }, (_, k) => arr[Math.floor(k * step)]);
  }

  function leafMark(n, color) {
    const s = n.size;
    return `<g class="node" data-nid="${n.id}" style="--i:${n.i}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)}) rotate(${n.rot.toFixed(0)})">
      <path d="M0 ${(-s).toFixed(1)} C ${(s * .74).toFixed(1)} ${(-s * .18).toFixed(1)} ${(s * .5).toFixed(1)} ${(s * .4).toFixed(1)} 0 ${s.toFixed(1)} C ${(-s * .5).toFixed(1)} ${(s * .4).toFixed(1)} ${(-s * .74).toFixed(1)} ${(-s * .18).toFixed(1)} 0 ${(-s).toFixed(1)}Z" fill="${color}"/>
    </g>`;
  }
  function flowerMark(n, night, asBud) {
    const s = Math.max(asBud ? 5.5 : night ? 7.5 : 8.5, n.size * (asBud ? 0.5 : 0.82));
    const fill = night ? '#8a91b4' : asBud ? '#e0c8b4' : '#e8d3c4';
    if (asBud) {
      return `<g class="node" data-nid="${n.id}" style="--i:${n.i}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})">
        <ellipse rx="${(s * 0.62).toFixed(1)}" ry="${(s * 1.05).toFixed(1)}" fill="${fill}" opacity=".95"/>
        <path d="M0 ${(-s).toFixed(1)} L0 ${(s * 0.15).toFixed(1)}" stroke="#8fb56e" stroke-width="0.8"/>
      </g>`;
    }
    let p = '';
    for (let k = 0; k < 5; k++) {
      const a = ((k * 72 - 90) * Math.PI) / 180;
      const px = Math.cos(a) * s * 0.62;
      const py = Math.sin(a) * s * 0.62;
      p += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(s * 0.38).toFixed(1)}" ry="${(s * 0.2).toFixed(1)}" transform="rotate(${(k * 72).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})" fill="${fill}" opacity="${night ? .8 : .92}"/>`;
    }
    return `<g class="node" data-nid="${n.id}" style="--i:${n.i}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})">${p}<circle r="${(s * 0.18).toFixed(1)}" fill="${night ? '#eceaf4' : '#f0e6d6'}"/></g>`;
  }
  function fruitMark(n, mature) {
    const s = n.size * (mature ? 0.62 : 0.5);
    const fill = mature ? '#a86a42' : '#c4a06a';
    return `<g class="node" data-nid="${n.id}" style="--i:${n.i}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})">
      <ellipse cx="0" cy="${(s * .12).toFixed(1)}" rx="${s.toFixed(1)}" ry="${(s * 1.12).toFixed(1)}" fill="${fill}" opacity=".92"/>
      <path d="M0 ${(-s).toFixed(1)} C 2 ${(-s - 3).toFixed(1)} 3 ${(-s - 1).toFixed(1)} 1 ${(-s + 1).toFixed(1)}" fill="none" stroke="#7a9a62" stroke-width="0.7"/>
    </g>`;
  }
  function goalMark(n) {
    return `<g class="node" data-nid="${n.id}" style="--i:${n.i}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})">
      <path d="M0 5 C -1 -2 1 -8 0 -14" fill="none" stroke="#7da35a" stroke-width="1.15" stroke-linecap="round"/>
      <ellipse cx="0" cy="-16" rx="2.4" ry="3.2" fill="#b5d492"/>
    </g>`;
  }
  function budMark(x, y, i) {
    return `<ellipse class="bud" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2" ry="2.6" fill="#8fb56e" opacity=".8" style="--i:${i}"/>`;
  }

  function soilSVG(gy, moist, compact) {
    const rx = compact ? 54 : moist ? 72 : 102;
    const grass = moist ? `
      <path d="M ${CX - 20} ${gy - 1} Q ${CX - 22} ${gy - 9} ${CX - 17} ${gy - 14}" fill="none" stroke="#b5d492" stroke-width="0.8" stroke-linecap="round" opacity=".55"/>
      <path d="M ${CX + 16} ${gy} Q ${CX + 19} ${gy - 7} ${CX + 14} ${gy - 11}" fill="none" stroke="#a8c984" stroke-width="0.7" stroke-linecap="round" opacity=".45"/>
    ` : '';
    return `<g id="g-soil" pointer-events="none">
      <ellipse cx="${CX}" cy="${gy + 5}" rx="${rx}" ry="${compact ? 10 : 13}" fill="#e6dcc8"/>
      <ellipse cx="${CX - 4}" cy="${gy + 2}" rx="${rx * 0.55}" ry="6" fill="#d8ccb6" opacity=".7"/>
      ${moist ? `<ellipse cx="${CX + 6}" cy="${gy + 4}" rx="16" ry="3.5" fill="#cfc3aa" opacity=".4"/>` : ''}
      ${grass}
    </g>`;
  }

  function seedSVG(gy) {
    return `<g id="g-seed" class="seed-hit">
      <ellipse cx="${CX}" cy="${gy - 11}" rx="7.8" ry="10.4" fill="#6b5340"/>
      <path d="M ${CX} ${gy - 21.2} Q ${CX + 2.2} ${gy - 11} ${CX} ${gy - 0.8}" fill="none" stroke="#8d7560" stroke-width="0.55" opacity=".55"/>
      <ellipse cx="${CX - 2.4}" cy="${gy - 14}" rx="2.4" ry="3.2" fill="#cbb89a" opacity=".38"/>
      <ellipse cx="${CX}" cy="${gy - 20.4}" rx="1.6" ry="1.1" fill="#5a4534"/>
    </g>`;
  }

  function sproutSVG(list, gy) {
    const n0 = list[0];
    const nid = n0 ? 'n_' + n0.id : '';
    const nid2 = list[1] ? 'n_' + list[1].id : nid;
    if (n0) {
      treeNodes = list.map((r, i) => ({
        id: 'n_' + r.id, type: nodeKind(r), date: dayKey(new Date(r.createdAt)),
        month: new Date(r.createdAt).getMonth(), relatedRecordId: r.id, record: r, i,
      }));
    }
    const h = list.length >= 2 ? 88 : 74;
    const third = list.length >= 2 ? `
      <g class="node" data-nid="${nid2}" transform="translate(${CX + 2} ${gy - h - 10}) rotate(-8)">
        <path d="M0 -8 C 6 -2 5 5 0 9 C -5 5 -6 -2 0 -8Z" fill="#c5dea8"/>
      </g>` : '';
    return `
      <g id="g-seed">
        <ellipse cx="${CX - 9}" cy="${gy - 5}" rx="6.2" ry="5.2" fill="#6b5340" transform="rotate(-26 ${CX - 9} ${gy - 5})"/>
        <ellipse cx="${CX + 9}" cy="${gy - 4}" rx="6.4" ry="5" fill="#5e4938" transform="rotate(28 ${CX + 9} ${gy - 4})"/>
      </g>
      <path class="shoot-stroke" pathLength="1" d="M ${CX} ${gy - 5} C ${CX - 4} ${gy - 28} ${CX + 3} ${gy - 52} ${CX} ${gy - h}" fill="none" stroke="#7da35a" stroke-width="2.5" stroke-linecap="round"/>
      <g id="g-cotyledon">
        <g class="node" data-nid="${nid}" transform="translate(${CX - 13} ${gy - h + 6}) rotate(-52)">
          <path d="M0 -12 C 9 -3 8 7 0 13 C -8 7 -9 -3 0 -12Z" fill="#b5d492"/>
        </g>
        <g class="node" data-nid="${nid}" transform="translate(${CX + 14} ${gy - h + 10}) rotate(48)">
          <path d="M0 -11 C 8 -3 7 6 0 12 C -7 6 -8 -3 0 -11Z" fill="#a8c984"/>
        </g>
        ${third}
      </g>`;
  }

  function trunkPath(gy, h, baseW, topW) {
    const top = gy - h;
    return `M ${CX - baseW} ${gy}
      C ${CX - baseW * 1.35} ${gy - h * .28} ${CX - topW * 2.2} ${gy - h * .62} ${CX - topW - 1} ${top}
      L ${CX + topW + 2} ${top}
      C ${CX + topW * 2.4} ${gy - h * .58} ${CX + baseW * 1.4} ${gy - h * .26} ${CX + baseW} ${gy} Z`;
  }

  function trunkSVG(gy, spec) {
    const h = spec.trunkH;
    const spine = `M ${CX} ${gy} C ${CX - 7} ${gy - h * 0.36} ${CX + 8} ${gy - h * 0.68} ${CX + 1} ${gy - h}`;
    if (spec.young) {
      return `<g id="g-trunk">
        <path d="${spine}" fill="none" stroke="transparent" stroke-width="18"/>
        <path class="shoot-stroke" pathLength="1" d="${spine}" fill="none" stroke="#8a7358" stroke-width="${spec.baseW}" stroke-linecap="round"/>
      </g>`;
    }
    return `<g id="g-trunk">
      <path d="${trunkPath(gy, h, spec.baseW, spec.topW)}" fill="url(#treeInk)"/>
    </g>`;
  }

  function foliageSVG(branches, spec, season) {
    const nPer = spec.foliage || 0;
    if (!nPer || !branches.length) return '';
    const thin = (season === '冬' && !spec.young) ? 0.5 : 1;
    let html = '<g id="g-foliage" pointer-events="none">';
    branches.forEach((br, bi) => {
      const count = Math.max(1, Math.round(nPer * thin));
      for (let k = 0; k < count; k++) {
        const rnd = seeded('fo-' + bi + '-' + k);
        const t = 0.28 + rnd() * 0.7;
        const p = cubicPt(br.a, br.b, br.c, br.d, t);
        const d = cubicD(br.a, br.b, br.c, br.d, t);
        const L = Math.hypot(d.x, d.y) || 1;
        const side = rnd() > 0.5 ? 1 : -1;
        const off = 5 + rnd() * (spec.young ? 11 : 18);
        const x = p.x + (-d.y / L) * off * side;
        const y = p.y + (d.x / L) * off * side;
        const s = (spec.young ? 7.5 : 8.5) + rnd() * (spec.young ? 3.5 : 6);
        const rot = (Math.atan2(d.y, d.x) * 180) / Math.PI + (rnd() - 0.5) * 48;
        const col = spec.colors[(bi + k) % spec.colors.length];
        html += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})" opacity="${(0.72 + rnd() * 0.22).toFixed(2)}">
          <path d="M0 ${(-s).toFixed(1)} C ${(s * .72).toFixed(1)} ${(-s * .2).toFixed(1)} ${(s * .48).toFixed(1)} ${(s * .38).toFixed(1)} 0 ${s.toFixed(1)} C ${(-s * .48).toFixed(1)} ${(s * .38).toFixed(1)} ${(-s * .72).toFixed(1)} ${(-s * .2).toFixed(1)} 0 ${(-s).toFixed(1)}Z" fill="${col}"/>
        </g>`;
      }
    });
    return html + '</g>';
  }

  function twigPath(br, k, len) {
    const t = 0.4 + (k % 3) * 0.16;
    const p = cubicPt(br.a, br.b, br.c, br.d, Math.min(t, len * 0.9));
    const d = cubicD(br.a, br.b, br.c, br.d, t);
    const L = Math.hypot(d.x, d.y) || 1;
    const side = k % 2 ? 1 : -1;
    const tw = 24 + (k % 4) * 8;
    const ex = p.x + (-d.y / L) * side * tw + (d.x / L) * tw * 0.35;
    const ey = p.y + (d.x / L) * side * tw + (d.y / L) * tw * 0.35;
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${((p.x + ex) / 2 + side * 3).toFixed(1)} ${((p.y + ey) / 2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  function renderTree(opts) {
    opts = opts || {};
    const svg = $('treeSvg');
    if (!svg) return;
    const y = treeYear;
    const now = new Date();
    const when = opts.until ? new Date(opts.until) : now;
    const season = solarTerm(when).season;
    const list = yearRecords(y, opts.until);
    const n = list.length;
    const stage = growthStage(n);
    const spec = stageSpec(stage, season);
    const gy = groundY(stage);
    const longThemes = themeCount(list);
    const extra = Math.min(2, longThemes.length);
    let branchN = spec.branches + extra;
    if (stage === 'seedling') branchN = Math.min(3, (n >= 5 ? 3 : 2) + extra);
    if (stage === 'young') branchN = Math.min(5, Math.max(5, branchN));
    branchN = Math.min(BRANCH_RECIPES.length, branchN);
    const hasGoal = list.some((r) => nodeKind(r) === 'goal') || longThemes.includes('人生选择');
    let recipes = stage === 'seedling'
      ? SAPLING_RECIPES.slice(0, branchN)
      : BRANCH_RECIPES.slice(0, branchN);
    if (hasGoal && stage !== 'seedling' && recipes.length >= 4) {
      recipes = recipes.slice();
      recipes[recipes.length - 1] = BRANCH_RECIPES[7];
    }
    const branches = recipes.map((rp) => makeBranch(rp, gy, spec.trunkH, spec.len));
    const days = new Set(list.map((r) => dayKey(new Date(r.createdAt)))).size;

    $('treeYearLabel').textContent = String(y);
    const view = $('view-tree');
    if (view) view.dataset.stage = stage;

    const lead = $('treeLead');
    const capture = $('treeCapture');
    const replay = $('treeReplay');
    const recBtn = $('treeRecords');
    if (stage === 'seed') {
      lead.textContent = '';
      $('treeDays').textContent = y > now.getFullYear() ? '这一年还没有开始。' : '这是你这一年的开始。';
      capture.hidden = false;
      replay.hidden = true;
      recBtn.hidden = true;
    } else if (stage === 'sprout') {
      lead.textContent = '你留下了第一件事。';
      $('treeDays').textContent = '它开始生长了。';
      capture.hidden = false;
      replay.hidden = false;
      recBtn.hidden = false;
    } else if (stage === 'seedling') {
      lead.textContent = '你已经留下了几段时间。';
      $('treeDays').textContent = '';
      capture.hidden = true;
      replay.hidden = false;
      recBtn.hidden = false;
    } else if (stage === 'young') {
      lead.textContent = '主干在慢慢变粗。';
      $('treeDays').textContent = '';
      capture.hidden = true;
      replay.hidden = false;
      recBtn.hidden = false;
    } else {
      lead.textContent = '这一年，你留下的一切，都在这里生长。';
      const note = season === '冬' && !spec.young ? '它在休息。枝上还有芽。'
        : season === '秋' && !spec.young ? '有些叶子开始换颜色。' : '';
      $('treeDays').textContent = note;
      capture.hidden = true;
      replay.hidden = false;
      recBtn.hidden = false;
    }

    const years = Array.from(new Set(records.map((r) => new Date(r.createdAt).getFullYear()).concat([now.getFullYear()]))).sort();
    $('treeYears').hidden = stage === 'seed' && years.length <= 1;
    $('treeYears').innerHTML = years.map((yy) =>
      `<button type="button" class="tree-year-btn ${yy === y ? 'on' : ''}" data-ty="${yy}">${yy}</button>`
    ).join('') + `<button type="button" class="tree-year-btn ghost" data-ty="${now.getFullYear() + 1}">${now.getFullYear() + 1}</button>`;

    treeNodes = [];
    const stem = spec.young ? '#7da35a' : '#4a433a';
    let plant = soilSVG(gy, spec.young, stage === 'seed' || stage === 'sprout');

    if (stage === 'seed') {
      plant += seedSVG(gy);
    } else if (stage === 'sprout') {
      plant += sproutSVG(list, gy);
    } else {
      const thoughts = [], photos = [], dreams = [], events = [], goals = [];
      list.forEach((r, i) => {
        const node = placeNode(r, i, branches, spec.len, spec.trunkH, gy);
        if (node.type === 'photo') photos.push(node);
        else if (node.type === 'dream') dreams.push(node);
        else if (node.type === 'event') events.push(node);
        else if (node.type === 'goal') goals.push(node);
        else thoughts.push(node);
      });
      const blooms = pick(photos, spec.bloomMax);
      const nights = pick(dreams, Math.min(8, spec.bloomMax));
      const fruits = pick(events, spec.fruitMax);
      const goalNodes = pick(goals, 6);
      const taken = new Set(blooms.concat(nights, fruits, goalNodes).map((x) => x.id));
      let leavesArr = thoughts.concat(
        photos.filter((x) => !taken.has(x.id)),
        dreams.filter((x) => !taken.has(x.id)),
        events.filter((x) => !taken.has(x.id)),
        goals.filter((x) => !taken.has(x.id))
      );
      leavesArr = pick(leavesArr, spec.leafMax);
      if (season === '冬' && !spec.young) leavesArr = leavesArr.filter((_, i) => i % 3 !== 2);
      treeNodes = leavesArr.concat(blooms, nights, fruits, goalNodes);

      const twigN = spec.young ? 0 : 2;
      const twigs = twigN
        ? branches.map((br, i) => Array.from({ length: twigN }, (_, k) =>
            `<path class="br-stroke" pathLength="1" d="${twigPath(br, i * 2 + k, spec.len)}" stroke-width="${Math.max(0.75, br.w * 0.42)}"/>`
          ).join('')).join('')
        : '';

      plant += `${trunkSVG(gy, spec)}
      <g id="g-branches" fill="none" stroke="${stem}" stroke-linecap="round">
        ${branches.map((br, i) => `<path class="br-stroke" pathLength="1" style="--i:${i}" d="${cubicPath(br.a, br.b, br.c, br.d)}" stroke-width="${br.w}"/>`).join('')}
        ${twigs}
      </g>
      ${foliageSVG(branches, spec, season)}`;

      let leaves = '', bloom = '';
      leavesArr.forEach((nd) => { leaves += leafMark(nd, spec.colors[nd.i % spec.colors.length]); });
      goalNodes.forEach((nd) => { leaves += goalMark(nd); });
      blooms.forEach((nd) => { bloom += flowerMark(nd, false, spec.young); });
      nights.forEach((nd) => { bloom += flowerMark(nd, true, false); });
      fruits.forEach((nd) => { bloom += fruitMark(nd, !spec.young && season === '秋'); });
      if (season === '冬' && !spec.young) {
        branches.forEach((br, i) => {
          const p = cubicPt(br.a, br.b, br.c, br.d, 0.94);
          bloom += budMark(p.x, p.y, i);
        });
      }
      plant += `<g id="g-leaves">${leaves}</g><g id="g-bloom">${bloom}</g>`;
    }

    svg.innerHTML = `<defs>
        <linearGradient id="treeInk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#3d3830"/><stop offset=".55" stop-color="#5a5146"/><stop offset="1" stop-color="#3a352e"/>
        </linearGradient>
        <radialGradient id="dawn" cx="50%" cy="62%" r="48%">
          <stop offset="0" stop-color="#f8f3e6" stop-opacity=".95"/><stop offset="1" stop-color="#f4efe6" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="360" height="540" fill="url(#dawn)" pointer-events="none"/>
      ${plant}`;

    svg.classList.remove('tree-grow', 'tree-replaying', 'tree-month');
    if (opts.grow) {
      lastTreeStage = stage;
      treeGrown = true;
      svg.classList.add('tree-grow');
    } else if (opts.replay) {
      lastTreeStage = stage;
    } else {
      const shouldGrow = !opts.skipGrow && (lastTreeStage !== stage || !treeGrown);
      lastTreeStage = stage;
      if (shouldGrow) {
        svg.classList.add('tree-grow');
        treeGrown = true;
        setTimeout(() => svg.classList.remove('tree-grow'), stage === 'sprout' ? 2500 : 2100);
      }
    }
  }

  function openTreeMemory(nid) {
    const n = treeNodes.find((x) => x.id === nid);
    const r = n && (n.record || records.find((x) => x.id === n.relatedRecordId));
    if (!r) return;
    const d = new Date(r.createdAt);
    const season = solarTerm(d).season;
    const kind = n.type === 'photo' ? '一张照片' : n.type === 'dream' ? '一个梦' : n.type === 'event' ? '一个重要时刻' : n.type === 'goal' ? '一个一直在长的念头' : '一个想法';
    const icon = n.type === 'dream' ? '梦' : n.type === 'event' ? '此刻' : n.type === 'photo' ? '照片' : n.type === 'goal' ? '方向' : '想法';
    let extra = '';
    if (n.type === 'dream') {
      const yy = d.getFullYear();
      const dreams = records.filter((x) => x.type === 'dream' && new Date(x.createdAt).getFullYear() === yy && x.createdAt <= r.createdAt);
      const elems = ((r.tidy && r.tidy.dreamElements) || []).map((e) => e.label);
      let best = 0, label = '';
      elems.forEach((lb) => {
        const c = dreams.filter((x) => ((x.tidy && x.tidy.dreamElements) || []).some((k) => k.label === lb)).length;
        if (c > best) { best = c; label = lb; }
      });
      if (best >= 3) extra = `<p class="mem-kind">这是你今年第 ${best} 次梦到类似的场景。</p>`;
      else if (best >= 2) extra = `<p class="mem-kind">这是你今年记录的第 ${best} 个与「${esc(label)}」相似的梦。</p>`;
    }
    $('memBody').innerHTML = `
      <div class="mem-kicker">${icon}</div>
      <div class="mem-date">${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日</div>
      <div class="mem-kind">${season}</div>
      ${r.image ? `<img class="mem-photo" src="${r.image}" alt="" />` : ''}
      ${r.text ? `<p class="mem-quote">“${esc(r.text)}”</p>` : ''}
      ${extra}
      <button type="button" class="mem-go" data-open="${r.id}">查看这一天</button>`;
    openSheet('memSheet');
  }

  function openYearMe() {
    const y = treeYear;
    const list = yearRecords(y);
    if (!list.length) { toast('先留下今天。'); return; }
    const photos = list.filter((r) => r.image).length;
    const dreams = list.filter((r) => r.type === 'dream').length;
    const events = list.filter((r) => nodeKind(r) === 'event').length;
    const kw = {};
    list.forEach((r) => ((r.tidy && r.tidy.themes) || []).forEach((t) => {
      if (t === '情绪' || t === '梦') return;
      kw[t] = (kw[t] || 0) + 1;
    }));
    const top = Object.keys(kw).sort((a, b) => kw[b] - kw[a]).slice(0, 5);
    $('memBody').innerHTML = `
      <div class="mem-kicker">这一年的你</div>
      <div class="mem-date">${y}</div>
      <div class="mem-stats">
        你留下了<br/>
        ${list.length} 段记录<br/>
        ${photos} 张照片<br/>
        ${dreams} 个梦<br/>
        ${events} 件重要的事
      </div>
      ${top.length ? `<div class="mem-kicker">今年反复出现的词</div><div class="mem-kws">${top.map((k) => `<span class="mem-kw">${esc(k)}</span>`).join('')}</div>` : ''}
      <button type="button" class="mem-go" id="memToYear">看看这一年发生了什么</button>`;
    openSheet('memSheet');
  }

  const DAY = 86400000;
  function easeOut(t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return 1 - Math.pow(1 - t, 2.15);
  }
  function progressAt(now, start, end) {
    if (now <= start) return 0;
    if (now >= end) return 1;
    return easeOut((now - start) / Math.max(1, end - start));
  }
  function mixHex(a, b, u) {
    const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const A = p(a), B = p(b);
    const h = (n) => Math.round(n).toString(16).padStart(2, '0');
    return '#' + h(A[0] + (B[0] - A[0]) * u) + h(A[1] + (B[1] - A[1]) * u) + h(A[2] + (B[2] - A[2]) * u);
  }
  function seasonAt(ts) {
    const doy = dayOfYear(new Date(ts));
    const keys = [
      { d: 0, pal: ['#8a9a78', '#9aaa86', '#7a8a6c'], bg: '#efeae4' },
      { d: 50, pal: ['#b7d492', '#c5dea8', '#a8c984'], bg: '#f6f1e6' },
      { d: 130, pal: ['#6a8a5c', '#7e9d6c', '#587850'], bg: '#f3efe3' },
      { d: 230, pal: ['#c5b36a', '#d8c888', '#9aaa62'], bg: '#f3ebe0' },
      { d: 310, pal: ['#8a9a78', '#9aaa86', '#7a8a6c'], bg: '#efeae4' },
      { d: 366, pal: ['#8a9a78', '#9aaa86', '#7a8a6c'], bg: '#efeae4' },
    ];
    let i = 0;
    while (i < keys.length - 1 && doy > keys[i + 1].d) i++;
    const a = keys[i], b = keys[i + 1];
    const u = (doy - a.d) / Math.max(1, b.d - a.d);
    return {
      pal: a.pal.map((c, k) => mixHex(c, b.pal[k % b.pal.length], u)),
      bg: mixHex(a.bg, b.bg, u),
    };
  }
  function heightForCount(n) {
    const pts = [[0, 0], [1, 48], [2, 72], [3, 100], [9, 118], [10, 150], [29, 176], [30, 210], [59, 240], [60, 264], [99, 288], [140, 300], [220, 310]];
    if (n <= 0) return 0;
    for (let i = 1; i < pts.length; i++) {
      if (n <= pts[i][0]) {
        const a = pts[i - 1], b = pts[i];
        return a[1] + (b[1] - a[1]) * ((n - a[0]) / (b[0] - a[0]));
      }
    }
    return pts[pts.length - 1][1];
  }
  function trunkHAt(t, list) {
    let h = 0;
    for (let i = 0; i < list.length; i++) {
      const v = heightForCount(i) + (heightForCount(i + 1) - heightForCount(i)) * progressAt(t, list[i].createdAt, list[i].createdAt + 22 * DAY);
      if (v > h) h = v;
    }
    return h;
  }
  function branchUnlockN(i) {
    if (i < 2) return 3;
    if (i < 5) return 10;
    if (i < 8) return 30;
    if (i < 10) return 60;
    return 100;
  }

  function buildTimeMap(y, list) {
    const start = new Date(y, 0, 1).getTime();
    const end = new Date(y, 11, 31, 12, 0, 0).getTime();
    const nDays = Math.round((end - start) / DAY) + 1;
    const hits = new Uint8Array(nDays);
    list.forEach((r) => {
      const i = Math.max(0, Math.min(nDays - 1, Math.floor((new Date(r.createdAt).setHours(0, 0, 0, 0) - start) / DAY)));
      hits[i] = Math.min(3, hits[i] + 1);
    });
    const grow = new Uint8Array(nDays);
    for (let i = 0; i < nDays; i++) {
      if (!hits[i]) continue;
      for (let k = 0; k <= 18 && i + k < nDays; k++) grow[i + k] = 1;
    }
    const w = new Float64Array(nDays);
    let total = 0;
    for (let i = 0; i < nDays; i++) {
      let x = hits[i] >= 2 ? 0.92 : hits[i] ? 0.64 : grow[i] ? 0.17 : 0.03;
      w[i] = x;
      total += x;
    }
    const prefix = new Float64Array(nDays + 1);
    for (let i = 0; i < nDays; i++) prefix[i + 1] = prefix[i] + w[i];
    const duration = Math.min(72, Math.max(42, total * 0.72));
    return { start, end, nDays, w, prefix, total, duration };
  }
  function dateFromElapsed(map, sec) {
    const u = Math.min(map.total, (sec / map.duration) * map.total);
    let lo = 0, hi = map.nDays;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (map.prefix[mid] < u) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo) - 1;
    const span = map.w[i] || 0.03;
    const frac = span ? (u - map.prefix[i]) / span : 0;
    return map.start + (i + frac) * DAY;
  }

  function mountLiveTree(y) {
    const svg = $('treeSvg');
    const list = yearRecords(y);
    const n = list.length;
    const stage = growthStage(n);
    const spec = stageSpec(stage, '夏');
    const gy = 500;
    const extra = Math.min(2, themeCount(list).length);
    let branchN = spec.branches + extra;
    if (stage === 'seedling') branchN = Math.min(3, (n >= 5 ? 3 : 2) + extra);
    if (stage === 'young') branchN = 5;
    branchN = Math.min(BRANCH_RECIPES.length, branchN);
    const recipes = stage === 'seedling' ? SAPLING_RECIPES.slice(0, branchN) : BRANCH_RECIPES.slice(0, branchN);
    const branches = recipes.map((rp, i) => {
      const geo = makeBranch(rp, gy, spec.trunkH, 1);
      const need = branchUnlockN(i);
      const rec = list[need - 1];
      const birth = rec ? rec.createdAt : list[list.length - 1].createdAt;
      return { geo, birth, grow: 24 * DAY, i };
    });
    const nodes = [];
    list.forEach((r, i) => {
      const node = placeNode(r, i, branches.map((b) => b.geo), 1, spec.trunkH, gy);
      const br = branches[Math.min(branches.length - 1, Math.floor(i / Math.max(1, n / Math.max(1, branches.length))))] || branches[0];
      const start = Math.max(r.createdAt, (br ? br.birth : r.createdAt) + 6 * DAY);
      nodes.push({
        node, r, kind: nodeKind(r),
        birth: r.createdAt,
        start,
        grow: (nodeKind(r) === 'photo' ? 16 : 13) * DAY,
        colorI: i,
      });
    });
    treeNodes = nodes.map((x) => x.node);

    const spine = `M ${CX} ${gy} C ${CX - 8} ${gy - spec.trunkH * 0.36} ${CX + 9} ${gy - spec.trunkH * 0.68} ${CX + 1} ${gy - spec.trunkH}`;
    let brHtml = '';
    branches.forEach((br, i) => {
      brHtml += `<path id="lv-br-${i}" class="lv-br" pathLength="1" d="${cubicPath(br.geo.a, br.geo.b, br.geo.c, br.geo.d)}" fill="none" stroke="#5a5146" stroke-width="${br.geo.w}" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>`;
    });
    let ndHtml = '';
    nodes.forEach((it, i) => {
      const nd = it.node;
      if (it.kind === 'photo') ndHtml += `<g id="lv-nd-${i}" class="node lv-nd" data-nid="${nd.id}" transform="translate(${nd.x.toFixed(1)} ${nd.y.toFixed(1)}) scale(0)">${flowerMark(nd, false, false).replace(/<g[^>]*>/, '').replace(/<\/g>$/, '')}</g>`;
      else if (it.kind === 'dream') ndHtml += `<g id="lv-nd-${i}" class="node lv-nd" data-nid="${nd.id}" transform="translate(${nd.x.toFixed(1)} ${nd.y.toFixed(1)}) scale(0)">${flowerMark(nd, true, false).replace(/<g[^>]*>/, '').replace(/<\/g>$/, '')}</g>`;
      else if (it.kind === 'event') ndHtml += `<g id="lv-nd-${i}" class="node lv-nd" data-nid="${nd.id}" transform="translate(${nd.x.toFixed(1)} ${nd.y.toFixed(1)}) scale(0)">${fruitMark(nd, true).replace(/<g[^>]*>/, '').replace(/<\/g>$/, '')}</g>`;
      else ndHtml += `<g id="lv-nd-${i}" class="node lv-nd" data-nid="${nd.id}" transform="translate(${nd.x.toFixed(1)} ${nd.y.toFixed(1)}) rotate(${nd.rot.toFixed(0)}) scale(0)"><path class="lv-leaf" d="M0 ${(-nd.size).toFixed(1)} C ${(nd.size * .74).toFixed(1)} ${(-nd.size * .18).toFixed(1)} ${(nd.size * .5).toFixed(1)} ${(nd.size * .4).toFixed(1)} 0 ${nd.size.toFixed(1)} C ${(-nd.size * .5).toFixed(1)} ${(nd.size * .4).toFixed(1)} ${(-nd.size * .74).toFixed(1)} ${(-nd.size * .18).toFixed(1)} 0 ${(-nd.size).toFixed(1)}Z" fill="#b7d492"/></g>`;
    });

    svg.innerHTML = `<defs>
        <linearGradient id="treeInk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#3d3830"/><stop offset=".55" stop-color="#5a5146"/><stop offset="1" stop-color="#3a352e"/>
        </linearGradient>
      </defs>
      <g id="g-soil" pointer-events="none">
        <ellipse cx="${CX}" cy="${gy + 6}" rx="88" ry="13" fill="#e6dcc8"/>
        <ellipse cx="${CX - 4}" cy="${gy + 2}" rx="48" ry="6" fill="#d8ccb6" opacity=".7"/>
      </g>
      <g id="g-seed" opacity="1">
        <ellipse cx="${CX}" cy="${gy - 11}" rx="7.8" ry="10.4" fill="#6b5340"/>
        <ellipse cx="${CX - 2.4}" cy="${gy - 14}" rx="2.4" ry="3.2" fill="#cbb89a" opacity=".38"/>
      </g>
      <g id="g-trunk">
        <path id="lv-spine" pathLength="1" d="${spine}" fill="none" stroke="#8a7358" stroke-width="${Math.max(2.4, spec.baseW)}" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>
        <g id="lv-fillg">
          <path id="lv-trunkfill" d="${trunkPath(gy, spec.trunkH, spec.baseW, spec.topW)}" fill="url(#treeInk)" opacity="0"/>
        </g>
      </g>
      <g id="g-branches">${brHtml}</g>
      <g id="g-leaves">${ndHtml}</g>`;

    liveTree = {
      list, spec, gy, finalH: spec.trunkH,
      spine: $('lv-spine'),
      fill: $('lv-trunkfill'),
      fillg: $('lv-fillg'),
      seed: $('g-seed'),
      branches: branches.map((br, i) => Object.assign(br, { el: $('lv-br-' + i) })),
      nodes: nodes.map((it, i) => Object.assign(it, { el: $('lv-nd-' + i), leaf: document.querySelector('#lv-nd-' + i + ' .lv-leaf') })),
    };
    applyLiveTree(new Date(y, 0, 1).getTime());
  }

  function applyLiveTree(t) {
    const L = liveTree;
    if (!L) return;
    const h = trunkHAt(t, L.list);
    const tp = L.finalH ? Math.min(1, h / L.finalH) : 0;
    if (L.spine) L.spine.setAttribute('stroke-dashoffset', (1 - tp).toFixed(4));
    if (L.fill) L.fill.style.opacity = tp > 0.22 ? String(Math.min(1, (tp - 0.22) / 0.35)) : '0';
    if (L.fillg) L.fillg.style.transform = `scaleY(${Math.max(0.0001, tp)})`;
    if (L.seed) L.seed.style.opacity = String(tp < 0.12 ? 1 : Math.max(0, 1 - (tp - 0.12) / 0.18));
    L.branches.forEach((br) => {
      if (!br.el) return;
      const p = progressAt(t, br.birth, br.birth + br.grow);
      br.el.setAttribute('stroke-dashoffset', (1 - p).toFixed(4));
    });
    const pal = seasonAt(t).pal;
    L.nodes.forEach((it) => {
      if (!it.el) return;
      let p = progressAt(t, it.start, it.start + it.grow);
      if (t < it.birth) p = 0;
      let sc, op;
      if (p <= 0) { sc = 0; op = 0; }
      else if (p < 0.28) { sc = 0.18 + p * 0.9; op = 0.45 + p; }
      else if (p < 0.7) { sc = 0.43 + (p - 0.28) * 0.9; op = 0.75; }
      else { sc = 0.81 + (p - 0.7) * 0.63; op = 0.75 + (p - 0.7) * 0.25; }
      const rot = it.node.rot || 0;
      it.el.setAttribute('transform', `translate(${it.node.x.toFixed(1)} ${it.node.y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${sc.toFixed(3)})`);
      it.el.style.opacity = String(Math.max(0, Math.min(1, op)));
      if (it.leaf) it.leaf.setAttribute('fill', pal[it.colorI % pal.length]);
    });
    $('view-tree').style.background = seasonAt(t).bg;
  }

  function stopReplay() {
    if (treeReplayTimer) { clearTimeout(treeReplayTimer); treeReplayTimer = null; }
    if (treeReplayRaf) { cancelAnimationFrame(treeReplayRaf); treeReplayRaf = 0; }
    treeReplaying = false;
    liveTree = null;
    const label = $('treeReplayLabel');
    if (label) { label.hidden = true; label.innerHTML = ''; }
    const axis = $('treeAxis');
    if (axis) axis.hidden = true;
    const view = $('view-tree');
    if (view) {
      view.classList.remove('is-replaying');
      view.style.background = '';
    }
  }

  function replayDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function setReplayLabel(date, note) {
    const el = $('treeReplayLabel');
    el.hidden = false;
    el.innerHTML = (date ? `<span class="rl-date">${date}</span>` : '') + (note ? `<span class="rl-note">${note}</span>` : '');
  }

  function openReplayEnd() {
    const y = treeYear;
    const list = yearRecords(y);
    const photos = list.filter((r) => r.image).length;
    const dreams = list.filter((r) => r.type === 'dream').length;
    const events = list.filter((r) => nodeKind(r) === 'event').length;
    $('memBody').innerHTML = `
      <p class="mem-quote">这一年，你留下了很多东西。</p>
      <p class="mem-kind">它们最后，长成了今天的你。</p>
      <div class="mem-stats">
        记录 ${list.length}<br/>
        照片 ${photos}<br/>
        梦境 ${dreams}<br/>
        重要时刻 ${events}
      </div>
      <button type="button" class="mem-go" id="memToYear">看看这一年</button>`;
    openSheet('memSheet');
  }

  function replayYear() {
    if (treeReplayTimer) { clearTimeout(treeReplayTimer); treeReplayTimer = null; }
    if (treeReplayRaf) { cancelAnimationFrame(treeReplayRaf); treeReplayRaf = 0; }
    const y = treeYear;
    const list = yearRecords(y);
    if (!list.length) { toast('先留下今天，它才会开始长。'); return; }
    treeReplaying = true;
    $('view-tree').classList.add('is-replaying');
    const axis = $('treeAxis');
    axis.hidden = false;
    $('treeAxisMonths').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => `<span>${m}月</span>`).join('');
    const map = buildTimeMap(y, list);
    const jan1 = map.start;
    const span = map.end - jan1;
    mountLiveTree(y);
    const t0 = performance.now();
    let lastDay = -1;
    const tick = (now) => {
      if (!treeReplaying) return;
      const sec = (now - t0) / 1000;
      if (sec >= map.duration) {
        applyLiveTree(map.end);
        $('treeAxisNeedle').style.left = '100%';
        $('treeAxisDate').textContent = replayDate(map.end);
        setReplayLabel(replayDate(map.end), '');
        treeReplayRaf = 0;
        treeReplayTimer = setTimeout(() => {
          treeReplaying = false;
          $('view-tree').classList.remove('is-replaying');
          const axis = $('treeAxis');
          if (axis) axis.hidden = true;
          const label = $('treeReplayLabel');
          if (label) label.hidden = true;
          if ($('view-tree').classList.contains('active')) openReplayEnd();
        }, 2000);
        return;
      }
      const t = dateFromElapsed(map, sec);
      applyLiveTree(t);
      const pct = Math.max(0, Math.min(1, (t - jan1) / span));
      $('treeAxisNeedle').style.left = (pct * 100).toFixed(2) + '%';
      const d = new Date(t);
      const day = d.getDate() + d.getMonth() * 32;
      if (day !== lastDay) {
        lastDay = day;
        const text = replayDate(t);
        $('treeAxisDate').textContent = text;
        setReplayLabel(text, '');
      }
      treeReplayRaf = requestAnimationFrame(tick);
    };
    treeReplayRaf = requestAnimationFrame(tick);
  }

  const DEMO_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIABAPXq3AAAACH5BAEKAAEALAAAAAABAAEAAAICRAEAOw==';
  const DEMO_YEAR = [
    [1, 8, 'text', '新的一年，先把这句话留下来。'],
    [1, 22, 'mood', '还是有一点紧。', { mood: '紧绷' }],
    [2, 4, 'text', '立春了，风开始变软。'],
    [2, 14, 'text', '一个人吃饭，其实也没有那么糟。'],
    [2, 27, 'dream', '梦见自己一直在找一个车站。'],
    [3, 3, 'text', '下班路上忽然觉得，其实也没那么糟。'],
    [3, 8, 'photo', '那天去了海边。', { photo: true }],
    [3, 10, 'text', '把这句话留给明年的自己。'],
    [3, 17, 'idea', '也许我真正想做的事情，和现在的工作没有关系。'],
    [3, 21, 'text', '朋友来了，坐到很晚。'],
    [3, 28, 'mood', '松下来一点。', { mood: '放松' }],
    [4, 2, 'text', '开始认真想搬家的事。'],
    [4, 6, 'photo', '窗台上的第一片新叶。', { photo: true }],
    [4, 11, 'text', '加班到很晚，走在路上听到蝉。'],
    [4, 15, 'idea', '如果不用考虑钱，我可能想做点自己的东西。'],
    [4, 20, 'text', '给妈妈打了电话。'],
    [4, 27, 'dream', '又梦到很大的房子，灯一盏盏灭掉。'],
    [5, 4, 'text', '跑了三公里，身体先回来了。'],
    [5, 9, 'photo', '傍晚的河堤。', { photo: true }],
    [5, 13, 'text', '工作还是那些工作，人好像变了一点。'],
    [5, 18, 'dream', '梦见自己在水下说话。'],
    [5, 24, 'text', '突然不想解释了。'],
    [5, 30, 'mood', '平静。', { mood: '平静' }],
    [6, 3, 'text', '连续开会，脑子里只剩下嗡嗡声。'],
    [6, 5, 'text', '中午一个人坐在楼梯间。'],
    [6, 6, 'text', '把要说的话写在备忘录里，又删掉。'],
    [6, 7, 'idea', '要不要离开，这个问题又来了。'],
    [6, 8, 'text', '晚上走路回家，风是热的。'],
    [6, 9, 'photo', '便利店灯光。', { photo: true }],
    [6, 14, 'text', '朋友说：你看起来没以前那么急。'],
    [6, 21, 'text', '夏至。白昼长得用不完。'],
    [6, 28, 'dream', '梦见列车开过旧房子。'],
    [7, 4, 'photo', '第一次去了这里。', { photo: true }],
    [7, 8, 'text', '把手机放下，坐了很久。'],
    [7, 15, 'text', '旅行里最安静的一个下午。'],
    [7, 19, 'photo', '晚上的山。', { photo: true }],
    [7, 26, 'text', '回来以后，房间小了一点。'],
    [8, 2, 'idea', '也许方向比速度重要。'],
    [8, 9, 'text', '立秋了，风里有别的东西。'],
    [8, 14, 'text', '和爸爸聊了很短的一句话。'],
    [8, 20, 'mood', '说不清。', { mood: '说不清' }],
    [8, 25, 'text', '重新开始这件事，其实没有那么可怕。'],
    [8, 31, 'dream', '梦见自己把一封信放进河里。'],
    [9, 4, 'text', '白露。草木渐收。'],
    [9, 7, 'text', '把桌上的东西收了一半。'],
    [9, 12, 'photo', '旧相机里翻出一张照片。', { photo: true }],
    [9, 16, 'idea', '我想要的自由，也许只是自己的节奏。'],
    [9, 21, 'text', '秋分前后，睡得更好一点。'],
    [9, 27, 'text', '工作告一段落，没有想象中轻松。'],
    [10, 3, 'text', '叶子开始换颜色。'],
    [10, 9, 'photo', '窗边的光。', { photo: true }],
    [10, 14, 'text', '有些关系，就停在这里也好。'],
    [10, 18, 'dream', '梦见车站终于出现了，却没有上车。'],
    [10, 24, 'text', '第一次把“明年”说出口。'],
    [10, 30, 'mood', '释然。', { mood: '释然' }],
    [11, 5, 'text', '天黑得更早，人慢下来。'],
    [11, 12, 'text', '把这一年写过的话又看了一遍。'],
    [11, 19, 'idea', '原来我已经走了这么远。'],
    [11, 27, 'text', '小雪。还没有下雪。'],
    [12, 4, 'text', '把想做的事列在纸上，没有划掉。'],
    [12, 11, 'photo', '今年最后一次出门很远。', { photo: true }],
    [12, 16, 'dream', '梦见种子在抽屉里发芽。'],
    [12, 21, 'text', '冬至。最长的一夜过去，光就会回来。'],
    [12, 26, 'text', '把这句话留给明年的自己。'],
    [12, 31, 'idea', '这一年结束了。我还在。'],
  ];

  function fillDemoYear() {
    const y = 2026;
    records = records.filter((r) => !r._demo);
    DEMO_YEAR.forEach((row, i) => {
      const m = row[0], d = row[1], type = row[2], text = row[3], extra = row[4] || {};
      const at = new Date(y, m - 1, d, 8 + (i % 10), 10 + (i % 40)).getTime();
      const t = tidy(text, type, { at, mood: extra.mood });
      records.push({
        id: 'demo_' + y + '_' + i,
        type, text: t.text, image: extra.photo ? DEMO_PIXEL : null, mood: extra.mood || null,
        tidy: packTidy(t),
        followupQ: null, followup: null, noLink: false,
        createdAt: at, _demo: true,
      });
    });
    records.sort((a, b) => a.createdAt - b.createdAt);
    persist();
    treeYear = y;
    lastTreeStage = '';
    treeGrown = false;
    renderToday(); renderDreams(); renderTree(); renderYear();
    toast('这一年已经填好。可以看它怎么长出来。');
  }

  $('treeSvg').addEventListener('click', (e) => {
    const node = e.target.closest('[data-nid]');
    if (node && node.dataset.nid) { openTreeMemory(node.dataset.nid); return; }
    if (e.target.closest('#g-trunk')) { openYearMe(); return; }
    if (e.target.closest('#g-seed') && !yearRecords(treeYear).length) openCapture('input');
  });
  $('treeBack').addEventListener('click', () => showView('today'));
  $('treeToYear').addEventListener('click', () => showView('year'));
  $('treeRecords').addEventListener('click', () => showView('year'));
  $('treeReplay').addEventListener('click', replayYear);
  $('treeDemo').addEventListener('click', fillDemoYear);
  $('treeCapture').addEventListener('click', () => openCapture('input'));
  $('treeYears').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ty]');
    if (!b) return;
    if (treeReplaying) stopReplay();
    const yy = +b.dataset.ty;
    if (yy > new Date().getFullYear()) { toast('这一年还没有开始。'); return; }
    treeYear = yy;
    treeGrown = false;
    lastTreeStage = '';
    renderTree();
  });
  $('memClose').addEventListener('click', () => closeSheet('memSheet'));
  $('memBody').addEventListener('click', (e) => {
    if (e.target.id === 'memToYear') { closeSheet('memSheet'); showView('year'); return; }
    const id = e.target.dataset && e.target.dataset.open;
    if (!id) return;
    closeSheet('memSheet');
    openDetail(id);
  });

  /* ---------------- 梦境 ---------------- */
  function renderDreams() {
    const list = records.filter((r) => r.type === 'dream').sort((a, b) => b.createdAt - a.createdAt);
    const box = $('dreamList');
    if (!list.length) {
      box.innerHTML = `<div class="dream-empty">还没有留下梦境。<br/>下次醒来，别急着起床。<br/><button id="dreamAdd">🌙 记个梦</button></div>`;
      $('dreamAdd').addEventListener('click', () => openCapture('dream'));
      return;
    }
    box.innerHTML = list.map((r) => {
      const d = new Date(r.createdAt);
      return `<div class="dream" data-id="${r.id}">
        <div class="dream-date">${d.getFullYear()}年${fmtDate(r.createdAt)} · ${solarTerm(d).name} · ${fmtTime(r.createdAt)}</div>
        <div class="dream-text">${esc(r.text || '（没有文字，只有一张图）')}</div>
        ${r.image ? `<img class="entry-img" src="${r.image}" alt="" />` : ''}
      </div>`;
    }).join('');
  }

  /* ---------------- 生命日历 ---------------- */
  const CN_MONTH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const CALM = ['平静', '放松', '满足', '温暖', '释然', '松下来', '开心', '期待'];
  const ANXIOUS = ['焦虑', '烦躁', '疲惫', '难过', '害怕', '迷茫', '困惑', '紧绷', '孤独', '生气'];
  const calYear = new Date().getFullYear();
  let calPage = new Date().getMonth(); // 0–11 月，12 = 这一年
  let calFlipping = false;

  function recordsInRange(start, end) {
    return records.filter((r) => r.createdAt >= start && r.createdAt < end);
  }
  function monthBounds(y, m) {
    return [new Date(y, m, 1).getTime(), new Date(y, m + 1, 1).getTime()];
  }
  function byDay(list) {
    const map = {};
    list.forEach((r) => {
      const k = dayKey(new Date(r.createdAt));
      (map[k] || (map[k] = [])).push(r);
    });
    return map;
  }
  function dayKind(list) {
    if (!list || !list.length) return { icon: '', kind: '', busy: false, important: false };
    const important = list.some((r) => {
      const th = (r.tidy && r.tidy.themes) || [];
      return r.type === 'idea' || th.includes('人生选择');
    });
    const hasDream = list.some((r) => r.type === 'dream');
    const hasPhoto = list.some((r) => r.image);
    const hasMood = list.some((r) => r.type === 'mood');
    let icon = '💭', kind = 'idea';
    if (hasMood) { icon = '❤️'; kind = 'mood'; }
    if (hasPhoto) { icon = '📷'; kind = 'photo'; }
    if (hasDream) { icon = '🌙'; kind = 'dream'; }
    if (important) { icon = '✦'; kind = 'idea'; }
    return { icon, kind, busy: list.length >= 3, important };
  }
  function monthStats(list) {
    const photos = list.filter((r) => r.image).length;
    const dreams = list.filter((r) => r.type === 'dream').length;
    const ideas = list.filter((r) => r.type === 'idea' || r.type === 'text' || r.type === 'voice').length;
    const moods = list.filter((r) => r.type === 'mood').length;
    const n = list.length;
    let skin = 'mixed';
    if (!n) skin = 'blank';
    else if (photos / n >= 0.35) skin = 'photo';
    else if (dreams / n >= 0.22) skin = 'dream';
    else if (moods / n >= 0.28) skin = 'mood';
    else if (ideas / n >= 0.55) skin = 'idea';
    const kwCount = {};
    list.forEach((r) => {
      const t = r.tidy || {};
      (t.themes || []).concat(t.keywords || []).forEach((k) => {
        if (k === '情绪' || k === '梦') return;
        kwCount[k] = (kwCount[k] || 0) + 1;
      });
    });
    const keywords = Object.keys(kwCount).sort((a, b) => kwCount[b] - kwCount[a]).slice(0, 3);
    let calm = 0, anxious = 0;
    list.forEach((r) => {
      ((r.tidy && r.tidy.moods) || []).concat(r.mood ? [r.mood] : []).forEach((m) => {
        if (CALM.includes(m)) calm++;
        if (ANXIOUS.includes(m)) anxious++;
      });
    });
    const spec = (calm + anxious) ? anxious / (calm + anxious) : 0.5;
    // 这个月最常被想起来的一句：被关联最多的原话，否则取最长的想法
    let quote = '';
    const texts = list.filter((r) => r.text && r.type !== 'dream').sort((a, b) => (b.text || '').length - (a.text || '').length);
    if (texts.length) {
      let best = texts[0], bestN = -1;
      texts.forEach((r) => {
        const nRel = findRelated(r).items.length;
        if (nRel > bestN) { bestN = nRel; best = r; }
      });
      quote = best.text;
    }
    return { n, photos, dreams, ideas, moods, skin, keywords, spec, quote };
  }

  function renderYear() {
    renderCalPage();
    bindCalGestures();
  }

  function renderCalPage() {
    const page = $('calPage');
    if (!page) return;
    const dots = $('calDots');
    dots.innerHTML = Array.from({ length: 13 }, (_, i) =>
      `<span class="cal-dot-i ${i === 12 ? 'year' : ''} ${i === calPage ? 'on' : ''}"></span>`
    ).join('');
    $('calPrev').disabled = calPage <= 0;
    $('calNext').disabled = calPage >= 12;
    $('calFlipHint').textContent = calPage === 12 ? '这一年' : (calPage === 11 ? '再翻，就是这一年' : '翻一页');
    page.innerHTML = calPage === 12 ? yearEndHTML() : monthHTML(calYear, calPage);
    page.className = 'cal-page' + (calPage < 12 ? ' skin-' + monthStats(recordsInRange(...monthBounds(calYear, calPage))).skin : '');
    page.scrollTop = 0;
  }

  function monthHTML(y, m) {
    const [a, b] = monthBounds(y, m);
    const list = recordsInRange(a, b);
    const days = byDay(list);
    const mid = new Date(y, m, 15);
    const term = solarTerm(mid);
    const first = new Date(y, m, 1);
    const start = (first.getDay() + 6) % 7;
    const dim = new Date(y, m + 1, 0).getDate();
    const todayK = dayKey(new Date());
    const now = new Date();
    const isFutureMonth = y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth());

    const wds = ['一', '二', '三', '四', '五', '六', '日'].map((w) => `<div class="cal-wd">${w}</div>`).join('');
    let cells = '';
    for (let i = 0; i < start; i++) cells += `<div></div>`;
    for (let d = 1; d <= dim; d++) {
      const k = `${y}-${pad(m + 1)}-${pad(d)}`;
      const items = days[k] || [];
      const mark = dayKind(items);
      const isToday = k === todayK;
      const future = new Date(y, m, d) > now && !isToday;
      const cls = [
        'cal-cell',
        items.length ? 'has' : '',
        isToday ? 'today' : '',
        mark.kind ? 'kind-' + mark.kind : '',
        mark.busy ? 'kind-busy' : '',
      ].filter(Boolean).join(' ');
      cells += `<button type="button" class="${cls}" data-day="${k}" ${future && !items.length ? 'disabled' : ''}>
        <span class="cal-num">${d}</span>
        <span class="cal-mark">${mark.icon}</span>
        ${mark.busy ? '<span class="cal-leaf"></span>' : ''}
      </button>`;
    }

    const st = monthStats(list);
    let moon = '';
    if (!list.length) {
      moon = `<div class="cal-empty-month">${isFutureMonth ? '这个月还没到来。' : '这个月还是空白的。<br/>留下第一句，格子里就会长出东西。'}</div>`;
    } else {
      const specPct = Math.round(st.spec * 100);
      moon = `<section class="cal-moon">
        <div class="cal-moon-title">🌿 你的${CN_MONTH[m]}</div>
        ${st.keywords.length ? `<div class="cal-moon-label">关键词</div><div class="cal-moon-kws">${st.keywords.map(esc).join('<span class="sep">·</span>')}</div>` : ''}
        <div class="cal-moon-label">情绪</div>
        <div class="cal-spectrum"><span>平静</span><div class="cal-track"><div class="cal-dot" style="left:${specPct}%"></div></div><span>焦虑</span></div>
        <div class="cal-moon-counts">已留下 ${st.n} 个瞬间<br/>${st.photos} 张照片 · ${st.dreams} 个梦 · ${st.ideas} 个想法</div>
        ${st.quote ? `<div class="cal-quote-box"><div class="cal-moon-label">这个月，你最常想起的一句话</div><p>“${esc(st.quote)}”</p></div>` : ''}
      </section>`;
    }

    return `<header class="cal-head">
        <h1 class="cal-month">${CN_MONTH[m]}</h1>
        <div class="cal-term">${term.name}  ·  ${term.season}</div>
        <div class="cal-head-note">${y} · ${term.note}</div>
      </header>
      <div class="cal-grid">${wds}${cells}</div>
      ${moon}`;
  }

  function yearEndHTML() {
    const y = calYear;
    const list = records.filter((r) => new Date(r.createdAt).getFullYear() === y);
    const photos = list.filter((r) => r.image);
    const dreams = list.filter((r) => r.type === 'dream');
    const ideas = list.filter((r) => r.type === 'idea' || r.type === 'text');
    const days = new Set(list.map((r) => dayKey(new Date(r.createdAt)))).size;
    const now = new Date();
    const ended = now.getFullYear() > y || (now.getFullYear() === y && now.getMonth() === 11 && now.getDate() >= 31);
    const left = Math.max(0, Math.ceil((new Date(y, 11, 31) - now) / 86400000));

    const seasonOf = (r) => solarTerm(new Date(r.createdAt)).season;
    const seasons = ['春', '夏', '秋', '冬'].map((s) => {
      const rs = list.filter((r) => seasonOf(r) === s);
      const ph = rs.filter((r) => r.image).length;
      const dr = rs.filter((r) => r.type === 'dream').length;
      const icons = { 春: '🌱', 夏: '☀️', 秋: '🍂', 冬: '❄️' };
      const rich = ph >= 8 ? 'photo-rich' : dr >= 4 ? 'dream-rich' : '';
      return `<div class="life-season ${rich}"><i>${icons[s]}</i><b>${s}</b><span class="ph">${ph}</span><span>张照片 · ${rs.length} 条</span></div>`;
    }).join('');

    const treeLine = list.length === 0 ? '树还是一颗种子。'
      : days < 30 ? '一棵刚刚发芽的树。' : '🌳 我的' + y + '生命树';

    return `<div class="life-year">
      <div class="life-year-sub">一年 · 365 天</div>
      <h1 class="life-year-title">我的 ${y}</h1>
      <p class="life-year-sub">${ended ? '这一年结束了。' : `这一年还在继续 · 还有 ${left} 天`}</p>
      <div class="life-seasons">${seasons}</div>
      <div class="life-tree-line">${treeLine}</div>
      <div class="life-stats">
        这一年，你留下了<br/>
        <em>${list.length}</em> 条记录<br/>
        ${photos.length} 张照片 · ${dreams.length} 个梦 · ${ideas.length} 个想法
      </div>
      <div class="life-products">
        <div class="life-prod"><b>📅 年度生命日历</b><span>十二个月，长成自己的样子</span></div>
        <div class="life-prod"><b>📖 年度照片书</b><span>${photos.length ? photos.length + ' 张可以装订的页' : '照片会成为书页'}</span></div>
        <div class="life-prod"><b>🌳 年度生命树</b><span>每一次留下，都在树上</span></div>
        <div class="life-prod"><b>🌙 年度梦境集</b><span>${dreams.length ? dreams.length + ' 个梦，留给未来的你' : '梦会在这里汇成一册'}</span></div>
      </div>
      <button class="life-book-btn" id="lifeBookBtn">${ended ? '生成《我的 ' + y + '》' : '看看正在长成的这一年'}</button>
      <p class="life-book-note">你留下什么，时间就长成什么样。<br/>实体书会在以后到来，现在先继续留下今天。</p>
    </div>`;
  }

  function flipCal(dir) {
    if (calFlipping) return;
    const next = calPage + dir;
    if (next < 0 || next > 12) return;
    calFlipping = true;
    const page = $('calPage');
    page.classList.add(dir > 0 ? 'flip-out-next' : 'flip-out-prev');
    setTimeout(() => {
      calPage = next;
      renderCalPage();
      page.classList.add(dir > 0 ? 'flip-in-next' : 'flip-in-prev');
      calFlipping = false;
    }, 220);
  }

  $('calPrev').addEventListener('click', () => flipCal(-1));
  $('calNext').addEventListener('click', () => flipCal(1));
  $('calDots').addEventListener('click', (e) => {
    const i = [...$('calDots').children].indexOf(e.target);
    if (i < 0 || i === calPage || calFlipping) return;
    const dir = i > calPage ? 1 : -1;
    calFlipping = true;
    const page = $('calPage');
    page.classList.add(dir > 0 ? 'flip-out-next' : 'flip-out-prev');
    setTimeout(() => {
      calPage = i;
      renderCalPage();
      page.classList.add(dir > 0 ? 'flip-in-next' : 'flip-in-prev');
      calFlipping = false;
    }, 220);
  });

  $('calPage').addEventListener('click', (e) => {
    const cell = e.target.closest('[data-day]');
    if (cell) { openDay(cell.dataset.day); return; }
    if (e.target.id === 'lifeBookBtn') {
      toast('这一年的书，会在年底为你装订。');
    }
  });

  function openDay(k) {
    const list = records.filter((r) => dayKey(new Date(r.createdAt)) === k).sort((a, b) => a.createdAt - b.createdAt);
    const [y, m, d] = k.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    $('daySheetTitle').textContent = `${m}月${d}日`;
    $('daySheetTerm').textContent = termLabel(date);
    const box = $('daySheetList');
    if (!list.length) {
      box.innerHTML = `<div class="empty"><b>这一天还没有留下什么。</b></div>`;
    } else {
      box.innerHTML = list.map(entryHTML).join('');
    }
    openSheet('daySheet');
  }
  $('daySheetClose').addEventListener('click', () => closeSheet('daySheet'));
  $('daySheetList').addEventListener('click', (e) => {
    const el = e.target.closest('.entry');
    if (el) openDetail(el.dataset.id);
  });

  let calGestBound = false;
  function bindCalGestures() {
    if (calGestBound) return;
    calGestBound = true;
    const stage = $('calStage');
    let y0 = 0, t0 = 0, tracking = false;
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, .cal-moon, .life-products')) return;
      tracking = true; y0 = e.clientY; t0 = Date.now();
    });
    stage.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dy = e.clientY - y0, dt = Date.now() - t0;
      if (dt > 600) return;
      if (dy < -48) flipCal(1);
      else if (dy > 48) flipCal(-1);
    });
    stage.addEventListener('pointercancel', () => { tracking = false; });
  }

  /* ---------------- 启动 ---------------- */
  const initial = location.hash.replace('#', '');
  showView(views.includes(initial) ? initial : 'today');
  // 跨过午夜时自动刷新日期
  setInterval(renderHead, 60 * 1000);
})();
