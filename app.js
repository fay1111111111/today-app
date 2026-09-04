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
    views.forEach((v) => $('view-' + v).classList.toggle('active', v === name));
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    if (name === 'today') renderToday();
    if (name === 'tree') renderTree();
    if (name === 'dream') renderDreams();
    if (name === 'year') renderYear();
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
    $('treeTeaserText').textContent = list.length
      ? `你的树今天长了 ${list.length} 片叶子`
      : (total ? '你的树在等今天的一片新叶' : '你的树还是一颗种子，等你留下第一句');
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
    if (milestone || firstOfDay || Math.random() < 0.15) return '未来的你，会看到今天的你。';
    if (r.type === 'dream') return '梦会在「梦境」里等你。';
    if (r.type === 'photo') return '这张照片挂到了树上，是一朵花。';
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

  /* ---------------- 我的树 ---------------- */
  function treeEmoji(days, total) {
    if (total === 0) return '🌰';
    if (days < 3) return '🌱';
    if (days < 7) return '🌿';
    if (records.some((r) => r.image) && days >= 14) return '🌸';
    return '🌳';
  }
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }
  function renderTree() {
    const svg = $('treeSvg');
    const total = records.length;
    const days = new Set(records.map((r) => dayKey(new Date(r.createdAt)))).size;
    const photos = records.filter((r) => r.image).length;
    const moods = records.filter((r) => r.type === 'mood').length;
    $('statDays').textContent = days;
    $('statLeaves').textContent = total;
    $('statBlossoms').textContent = photos;
    $('statFruits').textContent = moods;
    $('treeSubtitle').textContent = total === 0 ? '还是一颗种子。留下第一句，它就会发芽。'
      : days < 7 ? '刚刚发芽，别急。' : days < 30 ? '已经能看出树的样子了。' : '一棵慢慢长大的树。';

    const W = 320, H = 380, groundY = 330;
    let out = `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f1e7"/><stop offset="1" stop-color="#ece5d6"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky)" rx="24"/>
    <ellipse cx="160" cy="${groundY + 12}" rx="120" ry="14" fill="#d9cfb8" opacity=".7"/>`;

    if (total === 0) {
      out += `<ellipse cx="160" cy="${groundY}" rx="9" ry="7" fill="#8b6b4a"/>
              <text x="160" y="${groundY - 26}" text-anchor="middle" font-size="12" fill="#a1988c">一颗种子</text>`;
      svg.innerHTML = out; return;
    }

    const stage = Math.min(1, days / 45);              // 0~1 生长进度
    const trunkH = 40 + stage * 150;                    // 树干高度
    const topY = groundY - trunkH;
    const trunkW = 4 + stage * 14;
    out += `<path d="M ${160 - trunkW / 2} ${groundY} Q ${160 - trunkW / 3} ${groundY - trunkH / 2} ${160 - trunkW / 6} ${topY} L ${160 + trunkW / 6} ${topY} Q ${160 + trunkW / 3} ${groundY - trunkH / 2} ${160 + trunkW / 2} ${groundY} Z" fill="#8b6b4a"/>`;

    // 枝
    if (days >= 3) {
      out += `<path d="M 160 ${topY + trunkH * .35} q -30 -20 -50 -45" stroke="#8b6b4a" stroke-width="${2 + stage * 4}" fill="none" stroke-linecap="round"/>
              <path d="M 160 ${topY + trunkH * .5} q 30 -20 48 -50" stroke="#8b6b4a" stroke-width="${2 + stage * 4}" fill="none" stroke-linecap="round"/>`;
    }

    // 树冠：叶 = 记录
    const rx = 34 + Math.min(total, 150) * 0.55 + stage * 30;
    const ry = rx * 0.78;
    const cx = 160, cy = topY - ry * 0.55;
    const GREENS = ['#4f7a5a', '#6b9a6d', '#3f6b4c', '#8ab08a', '#5d8a63'];
    const sorted = records.slice().sort((a, b) => a.createdAt - b.createdAt);
    const items = sorted.slice(-150);
    let leaves = '', blossoms = '', fruits = '';
    items.forEach((r) => {
      const rnd = seeded(r.id);
      const ang = rnd() * Math.PI * 2, rad = Math.sqrt(rnd());
      const x = cx + Math.cos(ang) * rx * rad;
      const y = cy + Math.sin(ang) * ry * rad;
      const s = 6 + rnd() * 6;
      if (r.image) blossoms += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s * .7).toFixed(1)}" fill="#e9a3b4"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s * .25).toFixed(1)}" fill="#fff6f8"/>`;
      else if (r.type === 'mood') fruits += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s * .6).toFixed(1)}" fill="#c9553f"/>`;
      else if (r.type === 'dream') leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${s.toFixed(1)}" ry="${(s * .6).toFixed(1)}" transform="rotate(${(rnd() * 90 - 45).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#9db6c4" opacity=".9"/>`;
      else leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${s.toFixed(1)}" ry="${(s * .6).toFixed(1)}" transform="rotate(${(rnd() * 90 - 45).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${GREENS[Math.floor(rnd() * GREENS.length)]}" opacity=".92"/>`;
    });
    out += leaves + blossoms + fruits;

    // 今天新长的叶子做一个小标注
    const todayN = todayRecords().length;
    if (todayN) out += `<text x="160" y="${H - 14}" text-anchor="middle" font-size="12" fill="#3f6b4c">今天长了 ${todayN} 片新叶</text>`;
    svg.innerHTML = out;
  }

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

  /* ---------------- 我的一年 ---------------- */
  function renderYear() {
    const y = new Date().getFullYear();
    const list = records.filter((r) => new Date(r.createdAt).getFullYear() === y);
    $('yearTitle').textContent = `我的 ${y}`;
    const days = new Set(list.map((r) => dayKey(new Date(r.createdAt)))).size;
    $('yStatCount').textContent = list.length;
    $('yStatDays').textContent = days;
    $('yStatPhotos').textContent = list.filter((r) => r.image).length;
    $('yStatDreams').textContent = list.filter((r) => r.type === 'dream').length;
    $('yearSubtitle').textContent = list.length ? `这一年，你已经留下了 ${list.length} 个片刻。` : '这一年还是空白的，从今天开始。';

    const months = Array(12).fill(0);
    list.forEach((r) => months[new Date(r.createdAt).getMonth()]++);
    const max = Math.max(1, ...months);
    const nowM = new Date().getMonth();
    $('yearMonths').innerHTML = months.map((n, i) =>
      `<div class="month"><div class="month-bar ${i === nowM ? 'now' : ''}" style="height:${Math.max(4, (n / max) * 80)}%" title="${n} 条"></div><div class="month-label">${i + 1}</div></div>`
    ).join('');

    const seasons = { 春: 0, 夏: 0, 秋: 0, 冬: 0 };
    list.forEach((r) => { seasons[solarTerm(new Date(r.createdAt)).season]++; });
    const icons = { 春: '🌱', 夏: '🌻', 秋: '🍂', 冬: '❄️' };
    $('yearSeasons').innerHTML = Object.keys(seasons).map((k) =>
      `<div class="season"><i>${icons[k]}</i><b>${k}</b><span>${seasons[k]} 条</span></div>`
    ).join('');

    const left = Math.ceil((new Date(y, 11, 31) - new Date()) / 86400000);
    $('yearBookSub').textContent = left > 0 ? `离年底还有 ${left} 天。现在，先继续留下今天。` : '这一年到了，可以合上书了。';
  }

  /* ---------------- 启动 ---------------- */
  const initial = location.hash.replace('#', '');
  showView(views.includes(initial) ? initial : 'today');
  // 跨过午夜时自动刷新日期
  setInterval(renderHead, 60 * 1000);
})();
