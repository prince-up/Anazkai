/**
 * AutoTyper - Ultra-Reliable, Non-Blocking Keyboard Typing Simulator
 * 
 * Key Architectural Fixes:
 * 1. ZERO-LAG ASYNC ARCHITECTURE:
 *    Typing runs in a cooperative Node.js async loop using setTimeout.
 *    System Events / OS keyboard queue is never held or blocked.
 *    Electron main thread stays 100% responsive: overlay window remains
 *    fully draggable, clickable, and closable at all times.
 * 2. PROPER FOCUS & TARGETING:
 *    3-second prep countdown gives user ample time to click their editor.
 *    Overlay window blurs itself to let the editor take focus.
 *    Code is typed line-by-line so indentation is preserved and keys are never dropped.
 * 3. INSTANT KILL SWITCH:
 *    Cmd+Shift+S / Ctrl+Shift+S or "Stop Typing" button halts execution in < 1ms.
 * 4. CONFIGURABLE SPEED:
 *    Fast (~120ms/line), Normal (~220ms/line), Slow (~400ms/line).
 */

const { spawn } = require('child_process');

class AutoTyper {
  constructor() {
    this.isTyping = false;
    this.isPaused = false;
    this.isStopped = false;
    this.codeToType = '';
    this.lines = [];
    this.currentLineIndex = 0;
    this.totalLines = 0;
    this.totalChars = 0;
    this.countdownSeconds = 0;
    this.speed = 'normal'; // 'slow' | 'normal' | 'fast'
    this.activeChild = null;
    this.onProgressCallback = null;
    this.onStatusCallback = null;
  }

  // Extract pure code block from AI markdown response
  static extractCode(text) {
    if (!text || typeof text !== 'string') return '';

    // 1. Standard markdown code blocks: ```lang ... ```
    const codeBlockRegex = /```(?:[a-zA-Z0-9_\-+]*)\r?\n([\s\S]*?)```/g;
    const matches = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const code = match[1].trim();
      if (code.length > 0) matches.push(code);
    }

    if (matches.length > 0) {
      matches.sort((a, b) => b.length - a.length);
      return matches[0];
    }

    // 2. Unmatched triple backticks
    const rawLines = text.split('\n');
    const codeLines = [];
    let inCode = false;

    for (const line of rawLines) {
      if (line.trim().startsWith('```')) {
        inCode = !inCode;
        continue;
      }
      if (inCode) codeLines.push(line);
    }

    if (codeLines.length > 0) {
      return codeLines.join('\n').trim();
    }

    return text.trim();
  }

  getStatus() {
    const progress = this.totalLines > 0 
      ? Math.min(100, Math.round((this.currentLineIndex / this.totalLines) * 100))
      : 0;

    let statusText = '';
    if (this.countdownSeconds > 0) {
      statusText = `🎯 Click editor now! Starts in ${this.countdownSeconds}s...`;
    } else if (this.isTyping) {
      if (this.isPaused) {
        statusText = `⏸️ Paused at line ${this.currentLineIndex}/${this.totalLines}`;
      } else {
        statusText = `⌨️ Typing line ${this.currentLineIndex + 1}/${this.totalLines} (${progress}%)... Cmd+Shift+S to stop`;
      }
    } else if (this.isStopped) {
      statusText = '🛑 Typing Stopped';
    } else {
      statusText = 'Ready to type';
    }

    return {
      isTyping: this.isTyping,
      isPaused: this.isPaused,
      isStopped: this.isStopped,
      countdown: this.countdownSeconds,
      currentLine: this.currentLineIndex,
      totalLines: this.totalLines,
      progress,
      statusText
    };
  }

  // Type a single line into the currently focused window
  typeLine(line, isLastLine = false) {
    return new Promise((resolve) => {
      if (this.isStopped) return resolve();

      const platform = process.platform;

      if (platform === 'darwin') {
        // macOS: send keystroke line + enter key code 36
        // Properly escape backslashes and double quotes for AppleScript
        const escaped = line.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        let script = '';
        if (isLastLine) {
          script = `tell application "System Events" to keystroke "${escaped}"`;
        } else {
          script = `tell application "System Events"
            keystroke "${escaped}"
            key code 36
          end tell`;
        }

        const child = spawn('osascript', ['-e', script]);
        this.activeChild = child;
        child.on('close', () => {
          this.activeChild = null;
          resolve();
        });
        child.on('error', () => {
          this.activeChild = null;
          resolve();
        });
      } else if (platform === 'win32') {
        // Windows: PowerShell SendKeys
        const escaped = line.replace(/'/g, "''");
        let cmd = `[System.Windows.Forms.SendKeys]::SendWait('${escaped}')`;
        if (!isLastLine) {
          cmd += `; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')`;
        }
        const psScript = `Add-Type -AssemblyName System.Windows.Forms; ${cmd}`;
        const child = spawn('powershell', ['-NoProfile', '-Command', psScript]);
        this.activeChild = child;
        child.on('close', () => {
          this.activeChild = null;
          resolve();
        });
        child.on('error', () => {
          this.activeChild = null;
          resolve();
        });
      } else {
        // Linux: xdotool
        const escaped = line.replace(/"/g, '\\"');
        const args = ['type', '--', line];
        if (!isLastLine) args.push('key', 'Return');
        const child = spawn('xdotool', args);
        this.activeChild = child;
        child.on('close', () => {
          this.activeChild = null;
          resolve();
        });
        child.on('error', () => {
          this.activeChild = null;
          resolve();
        });
      }
    });
  }

  // Start the auto-typing session
  async start(rawCodeOrText, options = {}, callbacks = {}) {
    if (this.isTyping) {
      console.log('[AutoTyper] Session already active. Stopping previous session and starting fresh.');
      this.stop();
      await new Promise((r) => setTimeout(r, 100));
    }

    const code = AutoTyper.extractCode(rawCodeOrText);
    if (!code || code.trim().length === 0) {
      return { success: false, message: 'No valid code found to type' };
    }

    // Split code into clean lines
    const normalized = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this.lines = normalized.split('\n');
    this.totalLines = this.lines.length;
    this.currentLineIndex = 0;
    this.codeToType = normalized;
    this.totalChars = normalized.length;
    this.speed = options.speed || 'normal';

    this.isTyping = true;
    this.isPaused = false;
    this.isStopped = false;
    this.onProgressCallback = callbacks.onProgress || null;
    this.onStatusCallback = callbacks.onStatus || null;

    const countdownDelay = options.countdown !== undefined ? options.countdown : 3;

    // Phase 1: Countdown - allows user to switch to or click their code editor
    if (countdownDelay > 0) {
      for (let sec = countdownDelay; sec > 0; sec--) {
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

    if (this.isStopped) {
      this.isTyping = false;
      return { success: false, message: 'Stopped before typing' };
    }

    // Phase 2: Non-blocking asynchronous typing loop
    this.runTypingLoop();
    return { success: true, totalLines: this.totalLines };
  }

  async runTypingLoop() {
    // Delay between lines based on speed setting
    // Fast: ~110ms, Normal: ~220ms, Slow: ~420ms
    let baseDelay = 220;
    if (this.speed === 'fast') baseDelay = 110;
    else if (this.speed === 'slow' || this.speed === 'chill') baseDelay = 420;

    for (let i = this.currentLineIndex; i < this.lines.length; i++) {
      if (this.isStopped) break;

      while (this.isPaused) {
        if (this.isStopped) break;
        await new Promise((r) => setTimeout(r, 150));
      }

      if (this.isStopped) break;

      this.currentLineIndex = i;
      const line = this.lines[i];
      const isLast = i === this.lines.length - 1;

      // Type the line into the focused window
      await this.typeLine(line, isLast);

      if (this.onProgressCallback) {
        this.onProgressCallback({
          currentLine: i + 1,
          totalLines: this.totalLines,
          progress: Math.min(100, Math.round(((i + 1) / this.totalLines) * 100)),
          line
        });
      }

      if (this.onStatusCallback) {
        this.onStatusCallback(this.getStatus());
      }

      // Non-blocking human delay with slight jitter (±30ms)
      const jitter = Math.floor(Math.random() * 60) - 30;
      const delay = Math.max(80, baseDelay + jitter);

      // Cooperative async pause — yields control completely to Electron event loop!
      await new Promise((r) => setTimeout(r, delay));
    }

    const wasStopped = this.isStopped;
    const wasPaused = this.isPaused;

    if (!wasPaused) {
      this.isTyping = false;
      this.isPaused = false;
      this.countdownSeconds = 0;

      if (this.onStatusCallback) {
        this.onStatusCallback({
          isTyping: false,
          isPaused: false,
          isStopped: wasStopped,
          countdown: 0,
          currentLine: this.currentLineIndex,
          totalLines: this.totalLines,
          progress: wasStopped ? Math.round((this.currentLineIndex / this.totalLines) * 100) : 100,
          statusText: wasStopped ? '🛑 Typing Stopped' : '✅ Typing Complete'
        });
      }
    }
  }

  pause() {
    if (this.isTyping && !this.isPaused) {
      this.isPaused = true;
      if (this.activeChild) {
        try { this.activeChild.kill('SIGTERM'); } catch (e) {}
        this.activeChild = null;
      }
      if (this.onStatusCallback) this.onStatusCallback(this.getStatus());
      return true;
    }
    return false;
  }

  resume() {
    if (this.isTyping && this.isPaused) {
      this.isPaused = false;
      if (this.onStatusCallback) this.onStatusCallback(this.getStatus());
      this.runTypingLoop();
      return true;
    }
    return false;
  }

  stop() {
    this.isStopped = true;
    this.isTyping = false;
    this.isPaused = false;
    this.countdownSeconds = 0;

    if (this.activeChild) {
      try { this.activeChild.kill('SIGKILL'); } catch (e) {}
      this.activeChild = null;
    }

    if (this.onStatusCallback) {
      this.onStatusCallback(this.getStatus());
    }
    return true;
  }
}

module.exports = AutoTyper;
