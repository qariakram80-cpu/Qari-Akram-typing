class AutoSave {
  constructor(interval = 10000) {
    this.interval = interval;
    this.intervalId = null;
    this.isDirty = false;
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.save(), this.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  markDirty() {
    this.isDirty = true;
  }

  async save() {
    if (!this.isDirty) return;

    try {
      const transcription = transcriptionManager.getLiveTranscription();
      if (transcription) {
        await lectureHistory.saveLecture({
          title: `Auto-saved - ${new Date().toLocaleString()}`,
          transcription: transcription,
          duration: audioRecorder.getDuration()
        });
        this.isDirty = false;
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
}

const autoSave = new AutoSave();