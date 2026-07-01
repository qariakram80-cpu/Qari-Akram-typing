document.addEventListener('DOMContentLoaded', async () => {
  try {
    initializeApp();
  } catch (error) {
    console.error('App initialization error:', error);
    Notification.error('Failed to initialize app');
  }
});

function initializeApp() {
  initializeTheme();
  setupTabNavigation();
  setupRecorderControls();
  setupUploadControls();
  setupNotesControls();
  setupModals();
  setupClipboardButtons();
  loadSavedState();
}

function initializeTheme() {
  const theme = appSettings.get('theme') || 'dark';
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(`${theme}-mode`);

  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${currentTheme}-mode`);
    appSettings.set('theme', currentTheme);
  });
}

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

function setupRecorderControls() {
  const recordBtn = document.getElementById('recordBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const durationDisplay = document.getElementById('duration');
  const statusDisplay = document.getElementById('recordingStatus');
  const languageSelect = document.getElementById('languageSelect');
  const clearBtn = document.getElementById('clearTranscriptionBtn');
  const copyBtn = document.getElementById('copyTranscriptionBtn');

  let durationInterval = null;

  recordBtn.addEventListener('click', async () => {
    try {
      showLoading('Initializing microphone...');
      await audioRecorder.initialize();
      hideLoading();

      audioRecorder.start();
      audioVisualizer.setAnalyser(audioRecorder.getAnalyser());
      audioVisualizer.start();

      transcriptionManager.startLiveTranscription(languageSelect.value);

      recordBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      languageSelect.disabled = true;
      statusDisplay.textContent = 'Recording';
      statusDisplay.style.color = '#ef4444';

      durationInterval = setInterval(() => {
        const duration = audioRecorder.getDuration();
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        durationDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }, 1000);

      if (appSettings.get('autoSave')) {
        autoSave.start();
      }
    } catch (error) {
      hideLoading();
      Notification.error(error.message);
    }
  });

  pauseBtn.addEventListener('click', () => {
    audioRecorder.pause();
    transcriptionManager.pauseLiveTranscription();
    audioVisualizer.stop();
    clearInterval(durationInterval);
    pauseBtn.disabled = true;
    recordBtn.disabled = false;
    recordBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"></circle></svg><span>Resume</span>';
    statusDisplay.textContent = 'Paused';
    statusDisplay.style.color = '#f59e0b';
  });

  stopBtn.addEventListener('click', async () => {
    try {
      showLoading('Processing recording...');
      audioRecorder.stop();
      transcriptionManager.stopLiveTranscription();
      audioVisualizer.stop();
      clearInterval(durationInterval);
      autoSave.stop();

      const recordedAudio = audioRecorder.getRecordedAudio();
      const currentDuration = audioRecorder.getDuration();
      const currentLanguage = languageSelect.value;

      await lectureHistory.saveLecture({
        title: `Lecture - ${new Date().toLocaleString()}`,
        transcription: transcriptionManager.getLiveTranscription(),
        duration: currentDuration,
        language: currentLanguage,
        audio: recordedAudio
      });

      await audioRecorder.cleanup();
      hideLoading();

      recordBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      languageSelect.disabled = false;
      recordBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"></circle></svg><span>Start Recording</span>';
      durationDisplay.textContent = '00:00:00';
      statusDisplay.textContent = 'Idle';
      statusDisplay.style.color = '#10b981';

      Notification.success('Lecture saved successfully');
    } catch (error) {
      hideLoading();
      Notification.error('Failed to save lecture: ' + error.message);
    }
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all transcription text?')) {
      transcriptionManager.clearLiveTranscription();
      Notification.info('Transcription cleared');
    }
  });

  copyBtn.addEventListener('click', () => {
    const text = transcriptionManager.getLiveTranscription();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        Notification.success('Transcription copied to clipboard');
      });
    }
  });
}

function setupUploadControls() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressValue = document.getElementById('progressValue');
  const copyUploadedBtn = document.getElementById('copyUploadedBtn');
  const uploadedTranscription = document.getElementById('uploadedTranscription');

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    await handleFileUpload(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', async (e) => {
    if (e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  });

  async function handleFileUpload(file) {
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      Notification.error('Invalid file type. Please upload audio or video.');
      return;
    }

    try {
      showLoading('Processing file...');
      uploadArea.style.display = 'none';
      uploadProgress.style.display = 'block';

      const wavBlob = await transcriptionManager.processAudioFile(file);
      const language = document.getElementById('languageSelect').value;

      const transcription = await whisperTranscriber.transcribeAudio(wavBlob, language);
      transcriptionManager.setUploadedTranscription(transcription);

      uploadedTranscription.style.display = 'block';
      uploadProgress.style.display = 'none';
      hideLoading();

      Notification.success('File transcribed successfully');
    } catch (error) {
      hideLoading();
      uploadProgress.style.display = 'none';
      uploadArea.style.display = 'block';
      Notification.error('Transcription failed: ' + error.message);
    }
  }

  copyUploadedBtn.addEventListener('click', () => {
    const text = transcriptionManager.getUploadedTranscription();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        Notification.success('Uploaded transcription copied');
      });
    }
  });
}

function setupNotesControls() {
  const generateSummaryBtn = document.getElementById('generateSummaryBtn');
  const generateKeyPointsBtn = document.getElementById('generateKeyPointsBtn');
  const generateDefinitionsBtn = document.getElementById('generateDefinitionsBtn');
  const generateExamNotesBtn = document.getElementById('generateExamNotesBtn');
  const notesContent = document.getElementById('notesContent');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const exportDocxBtn = document.getElementById('exportDocxBtn');
  const exportTxtBtn = document.getElementById('exportTxtBtn');

  const getActiveTranscription = () => {
    const live = transcriptionManager.getLiveTranscription();
    return live || transcriptionManager.getUploadedTranscription();
  };

  generateSummaryBtn.addEventListener('click', async () => {
    const text = getActiveTranscription();
    if (!text) {
      Notification.error('No transcription available');
      return;
    }
    try {
      showLoading('Generating summary...');
      const summary = await notesGenerator.generateSummary(text);
      notesContent.innerHTML = marked.parse(summary);
      exportPdfBtn.disabled = false;
      exportDocxBtn.disabled = false;
      exportTxtBtn.disabled = false;
      hideLoading();
      Notification.success('Summary generated');
    } catch (error) {
      hideLoading();
      Notification.error(error.message);
    }
  });

  generateKeyPointsBtn.addEventListener('click', async () => {
    const text = getActiveTranscription();
    if (!text) {
      Notification.error('No transcription available');
      return;
    }
    try {
      showLoading('Generating key points...');
      const keyPoints = await notesGenerator.generateKeyPoints(text);
      notesContent.innerHTML = marked.parse(keyPoints);
      exportPdfBtn.disabled = false;
      exportDocxBtn.disabled = false;
      exportTxtBtn.disabled = false;
      hideLoading();
      Notification.success('Key points generated');
    } catch (error) {
      hideLoading();
      Notification.error(error.message);
    }
  });

  generateDefinitionsBtn.addEventListener('click', async () => {
    const text = getActiveTranscription();
    if (!text) {
      Notification.error('No transcription available');
      return;
    }
    try {
      showLoading('Generating definitions...');
      const definitions = await notesGenerator.generateDefinitions(text);
      notesContent.innerHTML = marked.parse(definitions);
      exportPdfBtn.disabled = false;
      exportDocxBtn.disabled = false;
      exportTxtBtn.disabled = false;
      hideLoading();
      Notification.success('Definitions generated');
    } catch (error) {
      hideLoading();
      Notification.error(error.message);
    }
  });

  generateExamNotesBtn.addEventListener('click', async () => {
    const text = getActiveTranscription();
    if (!text) {
      Notification.error('No transcription available');
      return;
    }
    try {
      showLoading('Generating exam notes...');
      const examNotes = await notesGenerator.generateExamNotes(text);
      notesContent.innerHTML = marked.parse(examNotes);
      exportPdfBtn.disabled = false;
      exportDocxBtn.disabled = false;
      exportTxtBtn.disabled = false;
      hideLoading();
      Notification.success('Exam notes generated');
    } catch (error) {
      hideLoading();
      Notification.error(error.message);
    }
  });

  exportPdfBtn.addEventListener('click', async () => {
    try {
      showLoading('Exporting to PDF...');
      const content = notesContent.innerText;
      await exportManager.exportPdf(content, 'lecture-notes');
      hideLoading();
      Notification.success('PDF exported successfully');
    } catch (error) {
      hideLoading();
      Notification.error('PDF export failed: ' + error.message);
    }
  });

  exportDocxBtn.addEventListener('click', async () => {
    try {
      showLoading('Exporting to DOCX...');
      const content = notesContent.innerText;
      await exportManager.exportDocx(content, 'lecture-notes');
      hideLoading();
      Notification.success('DOCX exported successfully');
    } catch (error) {
      hideLoading();
      Notification.error('DOCX export failed: ' + error.message);
    }
  });

  exportTxtBtn.addEventListener('click', () => {
    try {
      const content = notesContent.innerText;
      exportManager.exportTxt(content, 'lecture-notes');
      Notification.success('TXT exported successfully');
    } catch (error) {
      Notification.error('TXT export failed: ' + error.message);
    }
  });
}

function setupModals() {
  const historyToggle = document.getElementById('historyToggle');
  const settingsToggle = document.getElementById('settingsToggle');
  const historyModal = document.getElementById('historyModal');
  const settingsModal = document.getElementById('settingsModal');
  const historySearch = document.getElementById('historySearch');
  const historyList = document.getElementById('historyList');
  const closeButtons = document.querySelectorAll('.btn-close');

  historyToggle.addEventListener('click', async () => {
    historyModal.style.display = 'flex';
    await loadHistoryList();
  });

  settingsToggle.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    loadSettings();
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.target.dataset.modal;
      document.getElementById(modalId).style.display = 'none';
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target === historyModal) historyModal.style.display = 'none';
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  historySearch.addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query) {
      const results = await lectureHistory.searchLectures(query);
      displayHistoryList(results);
    } else {
      await loadHistoryList();
    }
  });
}

async function loadHistoryList() {
  try {
    const lectures = await lectureHistory.getAllLectures();
    displayHistoryList(lectures);
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

function displayHistoryList(lectures) {
  const historyList = document.getElementById('historyList');
  if (lectures.length === 0) {
    historyList.innerHTML = '<p class="placeholder">No lectures saved yet...</p>';
    return;
  }

  historyList.innerHTML = lectures.map(lecture => `
    <div class="history-item">
      <div class="history-info">
        <div class="history-title">${lecture.title}</div>
        <div class="history-date">${lectureHistory.formatDate(lecture.timestamp)}</div>
      </div>
      <div class="history-duration">${lectureHistory.formatDuration(lecture.duration)}</div>
      <div class="history-actions">
        <button class="history-action-btn" onclick="viewLecture(${lecture.id})" title="View">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="history-action-btn" onclick="editLectureName(${lecture.id})" title="Rename">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        <button class="history-action-btn" onclick="deleteLecture(${lecture.id})" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

async function viewLecture(id) {
  const lecture = await lectureHistory.getLecture(id);
  transcriptionManager.setLiveTranscription(lecture.transcription);
  document.getElementById('historyModal').style.display = 'none';
  document.querySelector('[data-tab="record"]').click();
}

async function editLectureName(id) {
  const newName = prompt('Enter new lecture name:');
  if (newName) {
    await lectureHistory.updateLecture(id, { title: newName });
    await loadHistoryList();
    Notification.success('Lecture renamed');
  }
}

async function deleteLecture(id) {
  if (confirm('Delete this lecture?')) {
    await lectureHistory.deleteLecture(id);
    await loadHistoryList();
    Notification.success('Lecture deleted');
  }
}

function loadSettings() {
  document.getElementById('autoSaveToggle').checked = appSettings.get('autoSave');
  document.getElementById('noiseSuppressionToggle').checked = appSettings.get('noiseSuppression');
  document.getElementById('echoCancellationToggle').checked = appSettings.get('echoCancellation');
  document.getElementById('autoGainToggle').checked = appSettings.get('autoGain');
  document.getElementById('defaultLanguage').value = appSettings.get('defaultLanguage');

  document.getElementById('autoSaveToggle').addEventListener('change', (e) => {
    appSettings.set('autoSave', e.target.checked);
  });
  document.getElementById('noiseSuppressionToggle').addEventListener('change', (e) => {
    appSettings.set('noiseSuppression', e.target.checked);
  });
  document.getElementById('echoCancellationToggle').addEventListener('change', (e) => {
    appSettings.set('echoCancellation', e.target.checked);
  });
  document.getElementById('autoGainToggle').addEventListener('change', (e) => {
    appSettings.set('autoGain', e.target.checked);
  });
  document.getElementById('defaultLanguage').addEventListener('change', (e) => {
    appSettings.set('defaultLanguage', e.target.value);
  });

  document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    if (confirm('Clear all lecture history?')) {
      await lectureHistory.clearAllLectures();
      await loadHistoryList();
      Notification.success('History cleared');
    }
  });

  document.getElementById('exportAllBtn').addEventListener('click', async () => {
    const data = await lectureHistory.exportAllLectures();
    exportManager.exportTxt(data, 'akram-writer-backup');
    Notification.success('Backup exported');
  });
}

function setupClipboardButtons() {
  document.getElementById('copyTranscriptionBtn').addEventListener('click', () => {
    const text = transcriptionManager.getLiveTranscription();
    if (text) {
      navigator.clipboard.writeText(text);
      Notification.success('Copied to clipboard');
    }
  });
}

function loadSavedState() {
  const defaultLanguage = appSettings.get('defaultLanguage');
  document.getElementById('languageSelect').value = defaultLanguage;
  transcriptionManager.loadLiveTranscription();
}