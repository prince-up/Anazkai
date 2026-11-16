/**
 * AutoTyper - Ultra-clean, modular cross-platform keyboard typing simulator for Electron
 * Supports:
 * - macOS (AppleScript / System Events)
 * - Windows (PowerShell SendKeys / WScript.Shell)
 * - Human-like typing delay with micro-pauses for punctuation, tabs, and newlines
 * - Pause / Resume / Stop capabilities
 * - Concurrency protection
 */

const { spawn } = require('child_process');

class AutoTyper {
  constructor() {
    this.isTyping = false;
    this.isPaused = false;
    this.isStopped = false;
    this.codeToType = '';
    this.currentIndex = 0;
    this.totalChars = 0;
    this.countdownSeconds = 0;
    this.onProgressCallback = null;
    this.onStatusCallback = null;
  }

  // Extract only the code from markdown AI output
  static extractCode(text) {
    if (!text || typeof text !== 'string') return '';

    // 1. Check for standard markdown code blocks: ```lang ... ```
    const codeBlockRegex = /```(?:[a-zA-Z0-9_\-+]*)\r?\n([\s\S]*?)```/g;
    const matches = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const code = match[1].trim();
      if (code.length > 0) {
        matches.push(code);
      }
    }

    if (matches.length > 0) {
      // Return the largest code block (primary solution)
      matches.sort((a, b) => b.length - a.length);
      return matches[0];
    }

    // 2. Check for unmatched triple backticks
    const lines = text.split('\n');
    const codeLines = [];
    let inCode = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCode = !inCode;
        continue;
      }
      if (inCode) {
        codeLines.push(line);
      }
    }

    if (codeLines.length > 0) {
      return codeLines.join('\n').trim();
    }

    // Fallback: return raw text if no markdown formatting
    return text.trim();
  }

  getStatus() {
    return {
      isTyping: this.isTyping,
      isPaused: this.isPaused,
      countdown: this.countdownSeconds,
      currentIndex: this.currentIndex,
      totalChars: this.totalChars,
      progress: this.totalChars > 0 ? Math.round((this.currentIndex / this.totalChars) * 100) : 0
    };
  }

  // Send a single character or token into the currently active external window
  async sendChar(char) {
    return new Promise((resolve) => {
      const platform = process.platform;

      if (platform === 'darwin') {
        // macOS AppleScript simulation
        let script = '';
        if (char === '\n') {
          script = 'tell application "System Events" to key code 36';
        } else if (char === '\t') {
          script = 'tell application "System Events" to key code 48';
        } else if (char === '"') {
          script = 'tell application "System Events" to keystroke quote';
        } else if (char === '\\') {
          script = 'tell application "System Events" to keystroke "\\\\"';
        } else {
          const escaped = char.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          script = `tell application "System Events" to keystroke "${escaped}"`;
        }

        const child = spawn('osascript', ['-e', script]);
        child.on('close', () => resolve());
        child.on('error', () => resolve());
      } else if (platform === 'win32') {
        // Windows PowerShell SendKeys simulation
        let key = char;
        if (char === '\n') key = '{ENTER}';
        else if (char === '\t') key = '{TAB}';
        else if (char === ' ') key = ' ';
        else if (['+', '^', '%', '~', '(', ')', '{', '}', '[', ']'].includes(char)) {
          key = `{${char}}`;
        }

        const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${key.replace(/'/g, "''")}')`;
        const child = spawn('powershell', ['-NoProfile', '-Command', psScript]);
        child.on('close', () => resolve());
        child.on('error', () => resolve());
      } else {
        // Linux xdotool fallback
        const child = spawn('xdotool', ['type', '--', char]);
        child.on('close', () => resolve());
        child.on('error', () => resolve());
      }
    });
  }

  // Start auto-typing with countdown delay
  async start(rawCodeOrText, options = {}, callbacks = {}) {
    if (this.isTyping) {
      console.log('[AutoTyper] Already typing. Stop current session first.');
      return { success: false, message: 'Already typing' };
    }

    const code = AutoTyper.extractCode(rawCodeOrText);
    if (!code || code.trim().length === 0) {
      return { success: false, message: 'No valid code found to type' };
    }

    this.codeToType = code;
    this.totalChars = code.length;
    this.currentIndex = 0;
    this.isTyping = true;
    this.isPaused = false;
    this.isStopped = false;
    this.onProgressCallback = callbacks.onProgress || null;
    this.onStatusCallback = callbacks.onStatus || null;

    const delaySeconds = options.countdown !== undefined ? options.countdown : 2;

    // Countdown before typing starts so user can focus editor / LeetCode
    if (delaySeconds > 0) {
      this.countdownSeconds = delaySeconds;
      if (this.onStatusCallback) this.onStatusCallback(this.getStatus());

      for (let sec = delaySeconds; sec > 0; sec--) {
        if (this.isStopped) {
          this.isTyping = false;
          return { success: false, message: 'Cancelled during countdown' };
        }
        this.countdownSeconds = sec;
        if (this.onStatusCallback) this.onStatusCallback(this.getStatus());
        await new Promise((r) => setTimeout(r, 1000));
      }
      this.countdownSeconds = 0;
      if (this.onStatusCallback) this.onStatusCallback(this.getStatus());
    }

    // Run typing loop asynchronously
    this.runTypingLoop(options);
    return { success: true, totalChars: this.totalChars };
  }

  async runTypingLoop(options = {}) {
    const minDelay = options.minDelay || 25;
    const maxDelay = options.maxDelay || 55;

    for (let i = this.currentIndex; i < this.codeToType.length; i++) {
      if (this.isStopped) {
        break;
      }

      while (this.isPaused) {
        if (this.isStopped) break;
        await new Promise((r) => setTimeout(r, 200));
      }

      if (this.isStopped) break;

      this.currentIndex = i;
      const char = this.codeToType[i];

      await this.sendChar(char);

      if (this.onProgressCallback) {
        this.onProgressCallback({
          currentIndex: i + 1,
          totalChars: this.totalChars,
          progress: Math.round(((i + 1) / this.totalChars) * 100),
          char
        });
      }

      // Humanized delay calculation
      let delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      // Realistic programmer pauses
      if (char === '\n') {
        delay += Math.floor(Math.random() * 80) + 40; // pause on newlines
      } else if (char === ';' || char === '{' || char === '}') {
        delay += Math.floor(Math.random() * 50) + 20; // pause after statements
      } else if (char === ' ') {
        delay += Math.floor(Math.random() * 20); // slight variance on words
      }

      await new Promise((r) => setTimeout(r, delay));
    }

    const wasStopped = this.isStopped;
    this.isTyping = false;
    this.isPaused = false;
    this.isStopped = false;
    this.countdownSeconds = 0;

    if (this.onStatusCallback) {
      this.onStatusCallback({
        isTyping: false,
        isPaused: false,
        countdown: 0,
        currentIndex: this.currentIndex,
        totalChars: this.totalChars,
        progress: wasStopped ? Math.round((this.currentIndex / this.totalChars) * 100) : 100,
        finished: !wasStopped
      });
    }
  }

  pause() {
    if (this.isTyping && !this.isPaused) {
      this.isPaused = true;
      if (this.onStatusCallback) this.onStatusCallback(this.getStatus());
      return true;
    }
    return false;
  }

  resume() {
    if (this.isTyping && this.isPaused) {
      this.isPaused = false;
      if (this.onStatusCallback) this.onStatusCallback(this.getStatus());
      return true;
    }
    return false;
  }

  stop() {
    this.isStopped = true;
    this.isTyping = false;
    this.isPaused = false;
    this.countdownSeconds = 0;
    if (this.onStatusCallback) this.onStatusCallback(this.getStatus());
    return true;
  }
}

module.exports = AutoTyper;
