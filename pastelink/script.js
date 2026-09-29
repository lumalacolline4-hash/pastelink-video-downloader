(function () {
  'use strict';

  // DOM Elements
  const themeToggleBtn = document.getElementById('theme-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  const videoUrlInput = document.getElementById('video-url') || document.getElementById('urlInput');
  const pasteBtn = document.getElementById('paste-btn');
  const downloaderForm = document.getElementById('downloader-form');
  const getVideoBtn = document.getElementById('get-video-btn');
  const detectionStatus = document.getElementById('detection-status');
  const platformChips = document.querySelectorAll('.plat-chip');
  const sampleBtns = document.querySelectorAll('.sample-btn');

  const resultSection = document.getElementById('result-section') || document.getElementById('result');
  const resultThumbnail = document.getElementById('result-thumbnail');
  const resultTitle = document.getElementById('result-title');
  const resultCreator = document.getElementById('result-creator');
  const resultPlatform = document.getElementById('result-platform');
  const formatContainer = document.getElementById('format-options-container');
  const downloadNowBtn = document.getElementById('download-now-btn');
  const downloadFeedback = document.getElementById('download-feedback');

  let currentSelectedFormat = null;
  let activeData = null;

  // Theme Switcher
  const savedTheme = localStorage.getItem('pastelink_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('pastelink_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
  }

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  // Pure Platform Detector (No hardcoded sample checks)
  function detectPlatform(url) {
    try {
      let clean = url.trim();
      if (!clean) return 'unknown';

      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      const parsed = new URL(clean);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
      if (host.includes('tiktok.com')) return 'tiktok';
      if (host.includes('instagram.com') || host.includes('instagr.am')) return 'instagram';
      if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com')) return 'facebook';

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // Pure YouTube ID Extractor (Strict Regex)
  function getYouTubeVideoId(url) {
    try {
      let clean = url.trim();
      if (!clean) return null;

      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      
      const match = clean.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  function cleanYouTubeUrl(url) {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
  }

  function getPlatformIcon(platform) {
    const icons = { youtube: '▶️', tiktok: '♪', instagram: '◎', facebook: 'f', unknown: '🔗' };
    return icons[platform] || icons.unknown;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
  }

  function updateDetectionUI() {
    const inputVal = videoUrlInput ? videoUrlInput.value.trim() : '';
    if (!inputVal) {
      if (detectionStatus) {
        detectionStatus.innerHTML = '<span class="hint-text">Paste a supported link above to analyze.</span>';
      }
      platformChips.forEach((chip) => chip.classList.remove('active'));
      return;
    }

    const platform = detectPlatform(inputVal);

    platformChips.forEach((chip) => {
      const chipPlat = (chip.getAttribute('data-plat') || '').toLowerCase();
      chip.classList.toggle('active', platform !== 'unknown' && chipPlat === platform);
    });

    if (platform !== 'unknown') {
      const icon = getPlatformIcon(platform);
      let extra = '';
      if (platform === 'youtube') {
        const videoId = getYouTubeVideoId(inputVal);
        if (videoId) extra = ` <span style="font-size:11px; opacity:0.8; font-family:monospace;">(ID: ${videoId})</span>`;
      }

      if (detectionStatus) {
        detectionStatus.innerHTML = `<span class="status-detected">✓ Detected Platform: <strong>${icon} ${platform.toUpperCase()}</strong>${extra}</span>`;
      }
    } else if (detectionStatus) {
      detectionStatus.innerHTML = '<span class="status-error">⚠ Unsupported link. Enter a valid YouTube, TikTok, Instagram, or Facebook link.</span>';
    }
  }

  if (videoUrlInput) {
    videoUrlInput.addEventListener('input', updateDetectionUI);
    videoUrlInput.addEventListener('paste', () => setTimeout(updateDetectionUI, 50));
  }

  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            videoUrlInput.value = text;
            updateDetectionUI();
          }
        }
      } catch {
        videoUrlInput.focus();
      }
    });
  }

  sampleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        videoUrlInput.value = url;
        updateDetectionUI();
      }
    });
  });

  async function processUrl() {
    const rawInput = (videoUrlInput ? videoUrlInput.value : '').trim();
    if (!rawInput) {
      if (detectionStatus) detectionStatus.innerHTML = '<span class="status-error">Please enter a video URL.</span>';
      return;
    }

    const platform = detectPlatform(rawInput);
    if (platform === 'unknown') {
      if (detectionStatus) detectionStatus.innerHTML = '<span class="status-error">Unsupported platform URL.</span>';
      return;
    }

    const targetUrl = platform === 'youtube' ? cleanYouTubeUrl(rawInput) : rawInput;

    if (getVideoBtn) {
      getVideoBtn.disabled = true;
      getVideoBtn.innerHTML = 'Loading...';
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 20000);

    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(targetUrl)}&_t=${Date.now()}`, {
        cache: 'no-store',
        signal: abortController.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(errorJson?.error || 'Unable to fetch video details.');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      activeData = { ...data, url: targetUrl };
      renderResult(activeData, platform);
    } catch (error) {
      clearTimeout(timeoutId);
      const isAbort = error.name === 'AbortError' || abortController.signal.aborted;
      const errorMsg = isAbort ? 'Request timed out, please try again.' : error.message;

      if (detectionStatus) detectionStatus.innerHTML = `<span class="status-error">${escapeHtml(errorMsg)}</span>`;
      if (resultSection) resultSection.style.display = 'none';
    } finally {
      if (getVideoBtn) {
        getVideoBtn.disabled = false;
        getVideoBtn.innerHTML = 'Get Video';
      }
    }
  }

  function renderResult(data, platform) {
    if (!resultSection) return;

    if (resultThumbnail) resultThumbnail.src = data.thumbnail || '';
    if (resultTitle) resultTitle.textContent = data.title || 'Untitled Video';
    if (resultCreator) resultCreator.textContent = data.author || `@${platform}`;
    if (resultPlatform) resultPlatform.textContent = `${getPlatformIcon(platform)} ${platform.toUpperCase()}`;

    const formats = data.formats || [];
    currentSelectedFormat = formats[0] || null;

    if (formatContainer) {
      formatContainer.innerHTML = formats.map((format, idx) => `
        <button type="button" class="format-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">
          <div class="format-top">
            <span class="quality-badge">${escapeHtml(format.ext || 'MP4')}</span>
          </div>
          <div class="format-name">${escapeHtml(format.quality)}</div>
          <div class="format-res">${escapeHtml(format.size || 'Direct Stream')}</div>
        </button>
      `).join('');

      const btns = formatContainer.querySelectorAll('.format-btn');
      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          btns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const idx = parseInt(btn.getAttribute('data-index') || '0', 10);
          currentSelectedFormat = formats[idx] || null;
          if (downloadNowBtn && currentSelectedFormat) {
            downloadNowBtn.textContent = `Download ${currentSelectedFormat.quality}`;
          }
        });
      });
    }

    if (downloadNowBtn && currentSelectedFormat) {
      downloadNowBtn.textContent = `Download ${currentSelectedFormat.quality}`;
    }

    resultSection.style.display = 'block';
  }

  if (downloaderForm) {
    downloaderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      processUrl();
    });
  }

  if (downloadNowBtn) {
    downloadNowBtn.addEventListener('click', async () => {
      if (!currentSelectedFormat || !currentSelectedFormat.url) {
        if (downloadFeedback) {
          downloadFeedback.textContent = 'Please select a valid format.';
          downloadFeedback.className = 'download-feedback error';
        }
        return;
      }

      const origText = downloadNowBtn.textContent;
      downloadNowBtn.disabled = true;
      downloadNowBtn.textContent = 'Preparing Universal Media...';
      if (downloadFeedback) {
        downloadFeedback.textContent = 'Processing and verifying universal media stream...';
        downloadFeedback.className = 'download-feedback';
      }

      try {
        const res = await fetch(currentSelectedFormat.url);
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || ct.includes('application/json')) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Download failed (HTTP ${res.status}).`);
        }

        const blob = await res.blob();
        if (blob.size < 1000) {
          throw new Error('Downloaded stream was incomplete.');
        }

        const safeTitle = (activeData?.title || 'video').replace(/[^a-zA-Z0-9_\- ]/g, '_').trim().slice(0, 50);
        const filename = `${safeTitle || 'video'}.${currentSelectedFormat.ext || 'mp4'}`;
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);

        if (downloadFeedback) {
          downloadFeedback.textContent = '✓ Download completed! Compatible with all media players.';
          downloadFeedback.className = 'download-feedback success';
        }
      } catch (err) {
        console.warn('Download error:', err);
        if (downloadFeedback) {
          downloadFeedback.textContent = err.message || 'Download failed. Please try another quality or link.';
          downloadFeedback.className = 'download-feedback error';
        }
      } finally {
        downloadNowBtn.disabled = false;
        downloadNowBtn.textContent = origText;
      }
    });
  }

  // Modals & FAQ Accordion
  const noAdsBtn = document.getElementById('no-ads-btn');
  const noAdsModal = document.getElementById('no-ads-modal');
  const closeNoAdsBtn = document.getElementById('close-no-ads');
  const confirmNoAdsBtn = document.getElementById('confirm-no-ads');

  if (noAdsBtn && noAdsModal) {
    noAdsBtn.addEventListener('click', () => (noAdsModal.style.display = 'flex'));
  }
  if (closeNoAdsBtn && noAdsModal) {
    closeNoAdsBtn.addEventListener('click', () => (noAdsModal.style.display = 'none'));
  }
  if (confirmNoAdsBtn && noAdsModal) {
    confirmNoAdsBtn.addEventListener('click', () => (noAdsModal.style.display = 'none'));
  }
  if (noAdsModal) {
    noAdsModal.addEventListener('click', (e) => {
      if (e.target === noAdsModal) noAdsModal.style.display = 'none';
    });
  }

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach((i) => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
})();
