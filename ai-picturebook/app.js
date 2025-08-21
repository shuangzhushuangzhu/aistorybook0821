(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const entryPanel = '#panel-entry';
  const viewerPanel = '#panel-viewer';
  const input = '#topic-input';
  const btnGenerate = '#btn-generate';
  const btnBack = '#btn-back';
  const btnPrev = '#btn-prev';
  const btnNext = '#btn-next';
  const btnTtsSel = '#btn-tts';
  const stageSel = '#stage';
  const progressSel = '#progress-label';
  const toastSel = '#toast';

  let entry, viewer, topicInput, generateBtn, backBtn, prevBtn, nextBtn, btnTts, stage, progressLabel, toast;

  function cache() {
    entry = $(entryPanel); viewer = $(viewerPanel);
    topicInput = $(input); generateBtn = $(btnGenerate);
    backBtn = $(btnBack); prevBtn = $(btnPrev); nextBtn = $(btnNext); btnTts = $(btnTtsSel);
    stage = $(stageSel); progressLabel = $(progressSel); toast = $(toastSel);
  }

  let pages = [];
  let currentIndex = 0;

  function createIllustrationDataUrl(topic, pageNum) {
    const w = 1200, h = 800;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#FFF2CC'/>
      <stop offset='100%' stop-color='#F9D7B5'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <g>
    <circle cx='200' cy='150' r='80' fill='#F39A3B' opacity='0.25'/>
    <circle cx='1030' cy='640' r='120' fill='#E17F17' opacity='0.18'/>
    <rect x='120' y='500' width='240' height='140' rx='24' fill='#8C624A' opacity='0.12'/>
  </g>
  <g font-family='Segoe UI, PingFang SC, Arial' fill='#5B2B14'>
    <text x='60' y='120' font-size='64' font-weight='700'>${escapeXml(topic)}</text>
    <text x='60' y='200' font-size='36' opacity='0.8'>第 ${pageNum} 页</text>
  </g>
</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function escapeXml(s) {
    return s.replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[ch]));
  }

  function showToast(message, ms = 1600) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.hidden = true), ms);
  }

  function switchPanel(showViewer) {
    entry.hidden = !!showViewer;
    viewer.hidden = !showViewer;
  }

  function updateProgress() {
    progressLabel.textContent = `${currentIndex + 1} / ${pages.length}`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = currentIndex === pages.length - 1 ? '完成' : '下一页';
  }

  function mountPages() {
    stage.innerHTML = '';
    pages.forEach((p, idx) => {
      const pageEl = document.createElement('article');
      pageEl.className = 'page' + (idx === 0 ? ' current' : '');
      pageEl.setAttribute('aria-roledescription', 'page');
      pageEl.dataset.index = String(idx);

      const art = document.createElement('div');
      art.className = 'art';
      const img = document.createElement('img');
      img.alt = p.alt;
      img.src = p.image;
      art.appendChild(img);

      const caption = document.createElement('div');
      caption.className = 'caption';
      caption.textContent = p.text;

      pageEl.appendChild(art);
      pageEl.appendChild(caption);
      stage.appendChild(pageEl);
    });

    updateProgress();
  }

  function goTo(index) {
    if (index < 0 || index >= pages.length) return;
    const current = stage.querySelector('.page.current');
    const target = stage.querySelector(`.page[data-index="${index}"]`);
    if (!target || current === target) return;

    const dir = index > currentIndex ? 'right' : 'left';
    current.classList.remove('current');
    current.classList.add(`exit-${dir}`);
    target.classList.add('current');

    setTimeout(() => {
      current.classList.remove('exit-left', 'exit-right');
    }, 380);

    currentIndex = index;
    updateProgress();
    stopTtsIfSpeaking();
  }

  function next() {
    if (currentIndex >= pages.length - 1) {
      switchPanel(false);
      showToast('已返回首页');
      return;
    }
    goTo(currentIndex + 1);
  }
  function prev() { goTo(currentIndex - 1); }

  // --- TTS ---
  let ttsUtterance = null;
  function speak(text) {
    if (!('speechSynthesis' in window)) {
      showToast('当前浏览器不支持朗读');
      return;
    }
    stopTtsIfSpeaking();
    ttsUtterance = new SpeechSynthesisUtterance(text);
    ttsUtterance.lang = 'zh-CN';
    ttsUtterance.rate = 1.0;
    ttsUtterance.pitch = 1.0;
    ttsUtterance.onend = () => setTtsPressed(false);
    window.speechSynthesis.speak(ttsUtterance);
    setTtsPressed(true);
  }
  function stopTtsIfSpeaking() {
    try {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    setTtsPressed(false);
  }
  function setTtsPressed(isPressed) {
    if (!btnTts) return;
    btnTts.setAttribute('aria-pressed', String(isPressed));
    btnTts.textContent = isPressed ? '⏹' : '🔊';
  }

  function bindGestures() {
    let startX = 0, startY = 0, deltaX = 0, isTouching = false;
    stage.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; deltaX = 0; isTouching = true;
    }, {passive:true});
    stage.addEventListener('touchmove', (e) => {
      if (!isTouching) return;
      deltaX = e.touches[0].clientX - startX;
    }, {passive:true});
    stage.addEventListener('touchend', () => {
      if (!isTouching) return; isTouching = false;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) next(); else prev();
      }
    });
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (viewer.hidden) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  // 使用配置文件中的火山引擎配置
  const VOLCENGINE_CONFIG = window.VOLCENGINE_CONFIG || {
    accessKey: 'YOUR_ACCESS_KEY',
    secretKey: 'YOUR_SECRET_KEY',
    apiEndpoint: 'https://ark.cn-beijing.volces.com',
    imageModel: 'doubao-seed-1-6-250615',
    textModel: 'doubao-seed-1-6-250615'
  };



  // 调用火山引擎图片生成 API
  async function generateImage(prompt, pageNum) {
    try {
      // 构建适合儿童绘本的提示词
      const imagePrompt = `儿童绘本风格插画，${prompt}，第${pageNum}页，温馨可爱，色彩丰富，卡通风格，适合儿童阅读，高质量插画，明亮色彩，可爱角色，童话风格`;
      
      const requestBody = {
        model: VOLCENGINE_CONFIG.imageModel,
        prompt: imagePrompt,
        response_format: "url",
        size: `${VOLCENGINE_CONFIG.imageConfig.width}x${VOLCENGINE_CONFIG.imageConfig.height}`,
        guidance_scale: VOLCENGINE_CONFIG.imageConfig.guidance_scale,
        num_inference_steps: VOLCENGINE_CONFIG.imageConfig.num_inference_steps,
        watermark: VOLCENGINE_CONFIG.imageConfig.watermark,
        negative_prompt: VOLCENGINE_CONFIG.imageConfig.negative_prompt
      };

      console.log(`[图片生成] 第${pageNum}页 - 发送请求:`, {
        url: `${VOLCENGINE_CONFIG.apiEndpoint}/api/v3/images/generations`,
        model: VOLCENGINE_CONFIG.imageModel,
        prompt: imagePrompt,
        size: requestBody.size
      });

      const response = await fetch(`${VOLCENGINE_CONFIG.apiEndpoint}/api/v3/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VOLCENGINE_CONFIG.accessKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`[图片生成] 第${pageNum}页 - 响应状态:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[图片生成] 第${pageNum}页 - HTTP错误:`, response.status, errorText);
        throw new Error(`图片生成失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[图片生成] 第${pageNum}页 - 响应数据:`, data);
      
      // 检查响应格式并返回图片URL
      if (data.data && data.data.length > 0 && data.data[0].url) {
        console.log(`[图片生成] 第${pageNum}页 - 成功获取图片URL:`, data.data[0].url);
        return data.data[0].url;
      } else if (data.data && data.data.length > 0 && data.data[0].b64_json) {
        // 如果返回的是base64格式
        console.log(`[图片生成] 第${pageNum}页 - 成功获取base64图片`);
        return `data:image/png;base64,${data.data[0].b64_json}`;
      } else {
        console.error(`[图片生成] 第${pageNum}页 - 响应格式错误:`, data);
        throw new Error('图片生成响应格式错误');
      }
    } catch (error) {
      console.error(`[图片生成] 第${pageNum}页 - 错误详情:`, error);
      showToast(`第${pageNum}页图片生成失败，使用默认插画`);
      // 降级到本地占位图
      return createIllustrationDataUrl(prompt, pageNum);
    }
  }

  // 调用火山引擎文本生成 API
  async function generateStoryText(topic, pageNum) {
    try {
      const prompt = `请为儿童绘本《${topic}》的第${pageNum}页写一段温馨有趣的文案，要求：
1. 语言简单易懂，适合儿童阅读
2. 长度控制在50字以内
3. 内容积极向上，富有想象力
4. 与主题"${topic}"相关`;

      const requestBody = {
        model: VOLCENGINE_CONFIG.textModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: VOLCENGINE_CONFIG.textConfig?.max_tokens || 200,
        temperature: VOLCENGINE_CONFIG.textConfig?.temperature || 0.7,
        top_p: VOLCENGINE_CONFIG.textConfig?.top_p || 0.9
      };

      console.log(`[文本生成] 第${pageNum}页 - 发送请求:`, {
        url: `${VOLCENGINE_CONFIG.apiEndpoint}/api/v3/chat/completions`,
        model: VOLCENGINE_CONFIG.textModel,
        prompt: prompt
      });

      const response = await fetch(`${VOLCENGINE_CONFIG.apiEndpoint}/api/v3/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VOLCENGINE_CONFIG.accessKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`[文本生成] 第${pageNum}页 - 响应状态:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[文本生成] 第${pageNum}页 - HTTP错误:`, response.status, errorText);
        throw new Error(`文本生成失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[文本生成] 第${pageNum}页 - 响应数据:`, data);
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const generatedText = data.choices[0].message.content.trim();
        console.log(`[文本生成] 第${pageNum}页 - 成功生成文本:`, generatedText);
        return generatedText;
      } else {
        console.error(`[文本生成] 第${pageNum}页 - 响应格式错误:`, data);
        throw new Error('文本生成响应格式错误');
      }
    } catch (error) {
      console.error(`[文本生成] 第${pageNum}页 - 错误详情:`, error);
      showToast(`第${pageNum}页文本生成失败，使用默认文案`);
      // 降级到本地文案
      return generateCaption(topic, pageNum);
    }
  }

  function bindUI() {
    $$('.suggest-list li').forEach((li) => {
      li.addEventListener('click', () => {
        topicInput.value = li.dataset.topic || li.textContent.trim();
      });
    });

    generateBtn.addEventListener('click', async () => {
      const topic = (topicInput.value || '').trim() || '神秘的空白故事';
      
      // 显示加载状态
      generateBtn.disabled = true;
      generateBtn.textContent = '生成中...';
      showToast('正在生成绘本，请稍候...');

      try {
        // 并行生成所有页面内容
        const pagePromises = Array.from({ length: 6 }).map(async (_, i) => {
          const pageNum = i + 1;
          const [imageUrl, text] = await Promise.all([
            generateImage(topic, pageNum),
            generateStoryText(topic, pageNum)
          ]);
          
          return {
            image: imageUrl,
            text: text,
            alt: `${topic} - 第${pageNum}页插画`
          };
        });

        pages = await Promise.all(pagePromises);
        currentIndex = 0;
        mountPages();
        switchPanel(true);
        showToast('绘本生成完成！');
      } catch (error) {
        console.error('生成失败:', error);
        showToast('生成失败，请重试');
      } finally {
        // 恢复按钮状态
        generateBtn.disabled = false;
        generateBtn.textContent = '生成绘本';
      }
    });

    backBtn.addEventListener('click', () => switchPanel(false));
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    btnTts.addEventListener('click', () => {
      const currentPage = stage.querySelector('.page.current .caption');
      const text = currentPage ? currentPage.textContent.trim() : '';
      if (!text) return;
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        stopTtsIfSpeaking();
      } else {
        speak(text);
      }
    });
  }

  function generateCaption(topic, idx) {
    const sentences = [
      `${topic} 的第一天，主角发现一张会发光的地图。`,
      `地图把他带到一扇会说话的门前。`,
      `门提出了一个小小的谜题，主角机智地解开了。`,
      `一道金色的风轻轻吹来，把道路铺成了星光。`,
      `朋友们在旅途中相互帮助，心也变得更勇敢。`,
      `他们终于明白：真正的宝藏，是一起经历的故事。`
    ];
    return sentences[(idx - 1) % sentences.length];
  }

  function init() {
    cache();
    bindUI();
    bindGestures();
    bindKeys();
  }
  document.addEventListener('DOMContentLoaded', init);
})();



