class FocusTimer {
    constructor() {
        // Constants
        this.CONSTANTS = {
            FOCUS_TIME_DEFAULT: 25,
            UNIT_DEFAULT: 'minutes',
            UPDATE_INTERVAL: 100,
            COMPLETION_DELAY: 3000,
            FLASH_TITLE_DURATION: 10,
            NOTIFICATION_AUTO_CLOSE: 10000,
            PLANT_STAGES: 6,
            CELEBRATION_DURATION: 2000,
            BREAK_DURATION_DEFAULT: 2
        };

        // Plant types with their growth stages
        this.PLANT_TYPES = {
            classic: {
                name: 'Classic Tree',
                stages: ['🌰', '🌱', '🪴', '🌾', '🌲', '🌳', '🌸'],
                description: 'Acorn to mighty oak'
            },
            flower: {
                name: 'Flower Garden',
                stages: ['🌰', '🌱', '🌿', '🌼', '🌻', '🌺', '🌸'],
                description: 'Beautiful blooms'
            },
            cactus: {
                name: 'Desert Cactus',
                stages: ['🌰', '🌵', '🌵', '🌵', '🌵', '🌵', '🌼'],
                description: 'Desert survivor'
            },
            bamboo: {
                name: 'Bamboo Forest',
                stages: ['🌰', '🌱', '🎋', '🎋', '🎋', '🎋', '🌸'],
                description: 'Zen growth'
            },
            fruit: {
                name: 'Fruit Tree',
                stages: ['🌰', '🌱', '🌿', '🌳', '🍎', '🍎', '🍎'],
                description: 'Sweet rewards'
            },
            rose: {
                name: 'Rose Garden',
                stages: ['🌰', '🌱', '🌿', '🥀', '🌹', '🌹', '🌹'],
                description: 'Elegant beauty'
            }
        };
        
        // Timer state using timestamps for background resilience
        this.startTime = null;
        this.pausedTime = null;
        this.totalPausedDuration = 0;
        this.duration = 0; // Total duration in milliseconds
        
        this.isRunning = false;
        this.isPaused = false;
        this.timer = null;
        
        this.plantStage = parseInt(localStorage.getItem('plantStage') || '0');
        this.totalFocusHours = parseFloat(localStorage.getItem('totalFocusHours') || '0');
        this.selectedPlant = localStorage.getItem('selectedPlant') || 'classic';
        
        // Pomodoro Mode state
        this.pomodoroMode = localStorage.getItem('pomodoroMode') === 'true' || false;
        this.isBreakTime = false;
        this.cycleCount = parseInt(localStorage.getItem('cycleCount') || '1');
        this.originalWorkDuration = 0;
        this.breakTimeMinutes = parseInt(localStorage.getItem('breakTimeMinutes') || this.CONSTANTS.BREAK_DURATION_DEFAULT.toString());
        this.breakDuration = this.breakTimeMinutes * 60 * 1000;
        
        // Store original page title
        this.originalTitle = document.title;
        
        // Request notification permission on load
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        this.timeInput = document.getElementById('time-input');
        this.unitSelector = document.getElementById('unit-selector');
        this.timerDisplay = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.skipBtn = document.getElementById('skip-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.plantEmoji = document.getElementById('plant-emoji');
        this.stageIndicator = document.getElementById('stage-indicator');
        this.celebrationMessage = document.getElementById('celebration-message');
        this.hiddenControls = document.getElementById('hidden-controls');
        this.totalHoursDisplay = document.getElementById('total-hours');
        this.presetButtons = document.querySelectorAll('.preset-btn');
        this.progressBar = document.getElementById('progress-bar');
        
        // Plant selector elements
        this.plantSelectorBtn = document.getElementById('plant-selector-btn');
        this.plantModal = document.getElementById('plant-modal');
        this.plantModalOverlay = document.getElementById('plant-modal-overlay');
        this.plantModalClose = document.getElementById('plant-modal-close');
        this.plantOptions = document.querySelectorAll('.plant-option');
        
        // Pomodoro Mode elements
        this.pomodoroToggle = document.getElementById('pomodoro-toggle');
        this.pomodoroStatus = document.getElementById('pomodoro-status');
        this.modeText = document.getElementById('mode-text');
        this.cycleCountElement = document.getElementById('cycle-count');
        this.breakTimeInput = document.getElementById('break-time-input');
        this.pomodoroBreakSetting = document.getElementById('pomodoro-break-setting');
        
        // Initialize timer with input value
        this.timeValue = parseInt(this.timeInput.value) || this.CONSTANTS.FOCUS_TIME_DEFAULT;
        this.timeUnit = this.unitSelector.value;
        this.duration = this.convertToMilliseconds(this.timeValue, this.timeUnit);
        
        this.initEventListeners();
        this.updateDisplay();
        this.updateProgressBar();
        this.updatePlantStage();
        this.updateTotalFocusDisplay();
        this.updatePlantSelectorButton();
        this.updatePlantOptionsSelection();
        this.updatePomodoroToggle();
        this.updatePomodoroStatus();
        this.updateBreakTimeInput();
        this.updateBreakSettingVisibility();
        
        // Handle page visibility changes to update timer when returning to tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isRunning && !this.isPaused) {
                this.updateDisplay();
            }
        });
        
        // Add keyboard shortcut to reset plant progress (Ctrl/Cmd + Shift + R)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                if (confirm('Reset your plant progress? This will set your plant back to stage 0.')) {
                    this.plantStage = 0;
                    localStorage.setItem('plantStage', '0');
                    this.updatePlantStage();
                }
            }
        });
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.skipBtn.addEventListener('click', () => this.skip());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.timeInput.addEventListener('input', () => this.updateTimerFromInput());
        this.timeInput.addEventListener('change', () => this.updateTimerFromInput());
        this.unitSelector.addEventListener('change', () => this.updateTimerFromInput());
        
        // Preset button listeners
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setPresetTime(btn));
        });

        // Plant selector listeners
        this.plantSelectorBtn.addEventListener('click', () => this.openPlantModal());
        this.plantModalClose.addEventListener('click', () => this.closePlantModal());
        this.plantModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.plantModalOverlay) {
                this.closePlantModal();
            }
        });

        // Plant option listeners
        this.plantOptions.forEach(option => {
            option.addEventListener('click', () => this.selectPlant(option.dataset.plant));
        });

        // Pomodoro Mode toggle listener
        this.pomodoroToggle.addEventListener('change', () => this.togglePomodoroMode());
        
        // Break time input listener
        this.breakTimeInput.addEventListener('input', () => this.updateBreakTimeFromInput());
        this.breakTimeInput.addEventListener('change', () => this.updateBreakTimeFromInput());

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.plantModalOverlay.classList.contains('show')) {
                this.closePlantModal();
            }
        });

        // Verify all elements exist
        this.verifyElements();
    }
    
    updateTimerFromInput() {
        // Don't update timer while it's running
        if (this.isRunning) {
            return;
        }
        
        const inputValue = parseInt(this.timeInput.value);
        const unit = this.unitSelector.value;
        
        if (inputValue >= 1) {
            this.timeValue = inputValue;
            this.timeUnit = unit;
            this.duration = this.convertToMilliseconds(this.timeValue, this.timeUnit);
            this.updateDisplay();
            this.updateProgressBar();
            
            // Update original work duration if in Pomodoro mode and not currently in break
            if (this.pomodoroMode && !this.isBreakTime) {
                this.originalWorkDuration = this.duration;
            }
            
            // Clear active preset button state when manually entering time
            this.presetButtons.forEach(btn => btn.classList.remove('active'));
        } else if (this.timeInput.value === '') {
            // Handle empty input gracefully
            this.timeValue = 1;
            this.duration = this.convertToMilliseconds(1, this.timeUnit);
            this.updateDisplay();
            this.updateProgressBar();
            
            // Update original work duration if in Pomodoro mode and not currently in break
            if (this.pomodoroMode && !this.isBreakTime) {
                this.originalWorkDuration = this.duration;
            }
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            
            // Store original work duration for Pomodoro mode (only when starting work, not break)
            if (this.pomodoroMode && !this.isBreakTime) {
                this.originalWorkDuration = this.duration;
            }
            
            // If starting fresh (not resuming from pause)
            if (!this.startTime) {
                this.startTime = Date.now();
                this.totalPausedDuration = 0;
            } else if (this.pausedTime) {
                // Resuming from pause
                this.totalPausedDuration += Date.now() - this.pausedTime;
                this.pausedTime = null;
            }
            
            const buttonText = this.isBreakTime ? 'On Break...' : 'Growing...';
            this.startBtn.textContent = buttonText;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.timeInput.disabled = true;
            this.unitSelector.disabled = true;
            this.hiddenControls.classList.add('active');
            
            // Add visual state
            this.timerDisplay.classList.add('running');
            this.timerDisplay.classList.remove('paused', 'completed');
            
            if (this.pomodoroMode) {
                document.body.className = this.isBreakTime ? 'timer-break' : 'timer-running';
            } else {
                document.body.className = 'timer-running';
            }
            
            // Update display every 100ms for smooth countdown
            this.timer = setInterval(() => this.tick(), this.CONSTANTS.UPDATE_INTERVAL);
        }
    }
    
    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.isRunning = false;
            this.pausedTime = Date.now();
            clearInterval(this.timer);
            
            this.startBtn.textContent = 'Continue';
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            
            // Add visual state
            this.timerDisplay.classList.add('paused');
            this.timerDisplay.classList.remove('running', 'completed');
            document.body.className = 'timer-paused';
        }
    }
    
    skip() {
        if (this.isRunning || this.isPaused) {
            if (confirm('Skip the current timer session? This will complete the session and advance your plant growth.')) {
                this.complete();
            }
        }
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timer);
        
        // Reset all time tracking
        this.startTime = null;
        this.pausedTime = null;
        this.totalPausedDuration = 0;
        
        if (this.pomodoroMode) {
            // Reset to work mode and original duration
            this.isBreakTime = false;
            if (this.originalWorkDuration) {
                this.duration = this.originalWorkDuration;
            } else {
                this.timeValue = parseInt(this.timeInput.value);
                this.timeUnit = this.unitSelector.value;
                this.duration = this.convertToMilliseconds(this.timeValue, this.timeUnit);
            }
            this.cycleCount = 1;
            localStorage.setItem('cycleCount', '1');
        } else {
            this.timeValue = parseInt(this.timeInput.value);
            this.timeUnit = this.unitSelector.value;
            this.duration = this.convertToMilliseconds(this.timeValue, this.timeUnit);
        }
        
        this.startBtn.textContent = 'Plant';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timeInput.disabled = false;
        this.unitSelector.disabled = false;
        this.hiddenControls.classList.remove('active');
        
        // Reset visual state
        this.timerDisplay.classList.remove('running', 'paused', 'completed');
        document.body.className = '';
        
        this.updateDisplay();
        this.updateProgressBar();
        this.updatePomodoroStatus();
    }
    
    tick() {
        const elapsed = this.getElapsedTime();
        const remaining = Math.max(0, this.duration - elapsed);
        
        if (remaining <= 0) {
            this.complete();
        } else {
            this.updateDisplay();
            this.updateProgressBar();
        }
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        
        const now = this.isPaused ? this.pausedTime : Date.now();
        return now - this.startTime - this.totalPausedDuration;
    }
    
    complete() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timer);
        
        if (this.pomodoroMode) {
            this.handlePomodoroComplete();
        } else {
            this.handleNormalComplete();
        }
    }
    
    handleNormalComplete() {
        // Add session time to total focus hours
        const sessionHours = this.duration / (1000 * 60 * 60);
        this.totalFocusHours += sessionHours;
        localStorage.setItem('totalFocusHours', this.totalFocusHours.toString());
        this.updateTotalFocusDisplay();
        
        // Advance plant stage if not at maximum
        if (this.plantStage < this.CONSTANTS.PLANT_STAGES) {
            this.advancePlantStage();
            this.showCelebration();
        }
        
        this.startBtn.textContent = 'Plant';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timeInput.disabled = false;
        this.unitSelector.disabled = false;
        this.hiddenControls.classList.remove('active');
        
        // Add completion visual state
        this.timerDisplay.classList.add('completed');
        this.timerDisplay.classList.remove('running', 'paused');
        document.body.className = 'timer-completed';
        
        this.playNotification();
        this.showBrowserNotification();
        this.flashTabTitle();
        this.timerDisplay.textContent = "Session Complete!";
        
        // Reset time tracking
        this.startTime = null;
        this.pausedTime = null;
        this.totalPausedDuration = 0;
        
        setTimeout(() => {
            this.reset();
            document.title = this.originalTitle;
            document.body.className = '';
        }, this.CONSTANTS.COMPLETION_DELAY);
    }
    
    handlePomodoroComplete() {
        if (this.isBreakTime) {
            // Break completed, start work session
            this.transitionToWork();
        } else {
            // Work completed, start break session
            this.transitionToBreak();
        }
    }
    
    transitionToBreak() {
        // Add session time to total focus hours
        const sessionHours = this.duration / (1000 * 60 * 60);
        this.totalFocusHours += sessionHours;
        localStorage.setItem('totalFocusHours', this.totalFocusHours.toString());
        this.updateTotalFocusDisplay();
        
        // Advance plant stage if not at maximum
        if (this.plantStage < this.CONSTANTS.PLANT_STAGES) {
            this.advancePlantStage();
            this.showCelebration();
        }
        
        this.isBreakTime = true;
        this.duration = this.breakDuration;
        
        this.playNotification();
        this.showBrowserNotification('Work Complete! Break time! 🎉', 'Great job! Starting your break.');
        this.flashTabTitle();
        this.timerDisplay.textContent = "Break Time!";
        
        document.body.className = 'timer-break';
        this.updatePomodoroStatus();
        
        // Reset time tracking and automatically start break
        this.startTime = null;
        this.pausedTime = null;
        this.totalPausedDuration = 0;
        
        setTimeout(() => {
            this.startBreakTimer();
        }, this.CONSTANTS.COMPLETION_DELAY);
    }
    
    transitionToWork() {
        this.isBreakTime = false;
        this.duration = this.originalWorkDuration;
        this.cycleCount++;
        localStorage.setItem('cycleCount', this.cycleCount.toString());
        
        this.playChimeSound();
        this.showBrowserNotification('Break Complete! Back to work! 🌱', 'Ready for another focus session.');
        this.flashTabTitle();
        this.timerDisplay.textContent = "Back to Work!";
        
        document.body.className = 'timer-work';
        this.updatePomodoroStatus();
        
        // Reset time tracking and automatically start work
        this.startTime = null;
        this.pausedTime = null;
        this.totalPausedDuration = 0;
        
        setTimeout(() => {
            this.startWorkTimer();
        }, this.CONSTANTS.COMPLETION_DELAY);
    }
    
    startBreakTimer() {
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.totalPausedDuration = 0;
        
        this.startBtn.textContent = 'On Break...';
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.timeInput.disabled = true;
        this.unitSelector.disabled = true;
        this.hiddenControls.classList.add('active');
        
        this.timerDisplay.classList.add('running');
        this.timerDisplay.classList.remove('paused', 'completed');
        document.body.className = 'timer-break';
        
        this.timer = setInterval(() => this.tick(), this.CONSTANTS.UPDATE_INTERVAL);
    }
    
    startWorkTimer() {
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.totalPausedDuration = 0;
        
        this.startBtn.textContent = 'Growing...';
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.timeInput.disabled = true;
        this.unitSelector.disabled = true;
        this.hiddenControls.classList.add('active');
        
        this.timerDisplay.classList.add('running');
        this.timerDisplay.classList.remove('paused', 'completed');
        document.body.className = 'timer-running';
        
        this.timer = setInterval(() => this.tick(), this.CONSTANTS.UPDATE_INTERVAL);
    }
    
    advancePlantStage() {
        this.plantStage++;
        localStorage.setItem('plantStage', this.plantStage.toString());
        this.updatePlantStage();
    }
    
    updatePlantStage() {
        this.plantEmoji.setAttribute('data-stage', this.plantStage.toString());
        this.stageIndicator.textContent = `Stage ${this.plantStage}/${this.CONSTANTS.PLANT_STAGES + 1}`;
        
        // Update plant emoji based on selected plant type and current stage
        const currentPlant = this.PLANT_TYPES[this.selectedPlant];
        const currentStage = Math.min(this.plantStage, currentPlant.stages.length - 1);
        
        // Directly set the emoji content
        this.plantEmoji.textContent = currentPlant.stages[currentStage];
        
        const appTitle = document.querySelector('.app-title');
        const plantName = currentPlant.name;
        
        if (this.plantStage === 0) {
            appTitle.textContent = `Start growing your ${plantName} today!`;
        } else if (this.plantStage === this.CONSTANTS.PLANT_STAGES) {
            appTitle.textContent = `Your ${plantName.toLowerCase()} is fully grown! 🌸`;
        } else {
            appTitle.textContent = `Keep growing your ${plantName.toLowerCase()}! Stage ${this.plantStage}/${this.CONSTANTS.PLANT_STAGES + 1}`;
        }
    }
    
    showCelebration() {
        const messages = [
            'Your plant grew! 🎉',
            'Great progress! 🌱',
            'Keep it growing! ✨',
            'Amazing focus! 🚀',
            'Plant power! 💪',
            'Growth achieved! 🌿'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const celebrationText = this.celebrationMessage.querySelector('.celebration-text');
        celebrationText.textContent = randomMessage;
        
        // Show celebration message with animation
        this.celebrationMessage.classList.add('show');
        
        // Add growth animation to plant
        this.plantEmoji.style.animation = 'growthPulse 0.8s ease-in-out';
        
        setTimeout(() => {
            this.celebrationMessage.classList.remove('show');
            this.plantEmoji.style.animation = '';
        }, this.CONSTANTS.CELEBRATION_DURATION);
    }
    
    updateDisplay() {
        let totalSeconds;
        
        if (this.isRunning || this.isPaused) {
            const elapsed = this.getElapsedTime();
            const remaining = Math.max(0, this.duration - elapsed);
            totalSeconds = Math.ceil(remaining / 1000);
        } else {
            totalSeconds = Math.ceil(this.duration / 1000);
        }
        
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const displayMinutes = minutes.toString().padStart(2, '0');
        const displaySeconds = seconds.toString().padStart(2, '0');
        this.timerDisplay.textContent = `${displayMinutes}:${displaySeconds}`;
    }
    
    updateProgressBar() {
        if (!this.progressBar) return;
        
        let progressPercentage = 0;
        
        if (this.isRunning || this.isPaused) {
            const elapsed = this.getElapsedTime();
            progressPercentage = Math.min(100, (elapsed / this.duration) * 100);
        } else {
            progressPercentage = 0;
        }
        
        this.progressBar.style.setProperty('--progress-width', `${progressPercentage}%`);
    }
    
    playNotification() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a pleasant 3-tone chime sequence
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
            const durations = [0.3, 0.3, 0.6];
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const startTime = audioContext.currentTime + (index * 0.2);
                const duration = durations[index];
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });
        } catch (error) {
            // Fallback for browsers that don't support Web Audio API
            console.log('Timer completed! 🎉');
        }
    }
    
    setPresetTime(button) {
        // Don't change time while timer is running
        if (this.isRunning) {
            return;
        }
        
        const minutes = parseFloat(button.dataset.minutes);
        // Handle different preset types
        if (minutes < 1) {
            // Convert to seconds for times less than 1 minute
            this.timeInput.value = Math.round(minutes * 60);
            this.unitSelector.value = 'seconds';
            this.timeUnit = 'seconds';
            this.timeValue = Math.round(minutes * 60);
        } else if (minutes >= 60) {
            // Convert to hours for times 60 minutes or more
            this.timeInput.value = minutes / 60;
            this.unitSelector.value = 'hours';
            this.timeUnit = 'hours';
            this.timeValue = minutes / 60;
        } else {
            // Keep as minutes
            this.timeInput.value = minutes;
            this.unitSelector.value = 'minutes';
            this.timeUnit = 'minutes';
            this.timeValue = minutes;
        }
        this.duration = this.convertToMilliseconds(this.timeValue, this.timeUnit);
        this.updateDisplay();
        this.updateProgressBar();
        
        // Update original work duration if in Pomodoro mode and not currently in break
        if (this.pomodoroMode && !this.isBreakTime) {
            this.originalWorkDuration = this.duration;
        }
        
        // Update active state
        this.presetButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    
    updateTotalFocusDisplay() {
        // Display with one decimal place
        this.totalHoursDisplay.textContent = this.totalFocusHours.toFixed(1);
    }
    
    convertToMilliseconds(value, unit) {
        switch(unit) {
            case 'seconds':
                return value * 1000;
            case 'minutes':
                return value * 60 * 1000;
            case 'hours':
                return value * 60 * 60 * 1000;
            default:
                return value * 60 * 1000; // Default to minutes
        }
    }
    
    showBrowserNotification(title = 'Focus Timer Complete! 🎉', body = 'Great job! Your focus session is complete.') {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌱</text></svg>',
                requireInteraction: true,
                tag: 'focus-timer'
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), this.CONSTANTS.NOTIFICATION_AUTO_CLOSE);
        }
    }
    
    playChimeSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a gentle bell-like chime sequence for break-to-work transition
            const frequencies = [880, 1174.66, 1396.91]; // A5, D6, F6 (pleasing chime)
            const durations = [0.4, 0.4, 0.8];
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                const startTime = audioContext.currentTime + (index * 0.3);
                const duration = durations[index];
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });
        } catch (error) {
            // Fallback for browsers that don't support Web Audio API
            console.log('Break complete! Back to work! 🌱');
        }
    }
    
    flashTabTitle() {
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            document.title = flashCount % 2 === 0 ? '🎉 Timer Complete!' : '⏰ Session Done!';
            flashCount++;
            
            if (flashCount >= this.CONSTANTS.FLASH_TITLE_DURATION) {
                clearInterval(flashInterval);
                document.title = this.originalTitle;
            }
        }, 500);
    }

    // Plant selection methods
    openPlantModal() {
        this.plantModalOverlay.classList.add('show');
        document.body.classList.add('modal-open');
    }

    closePlantModal() {
        this.plantModalOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }

    selectPlant(plantType) {
        if (this.PLANT_TYPES[plantType]) {
            this.selectedPlant = plantType;
            localStorage.setItem('selectedPlant', plantType);
            
            // Reset plant stage to 0 when selecting a new plant
            this.plantStage = 0;
            localStorage.setItem('plantStage', '0');
            
            this.updatePlantStage();
            this.updatePlantSelectorButton();
            this.updatePlantOptionsSelection();
            this.closePlantModal();
            
            // Show a brief plant switch animation
            this.plantEmoji.style.animation = 'growthPulse 0.6s ease-in-out';
            setTimeout(() => {
                this.plantEmoji.style.animation = '';
            }, 600);
        }
    }

    updatePlantSelectorButton() {
        const currentPlant = this.PLANT_TYPES[this.selectedPlant];
        const iconElement = this.plantSelectorBtn.querySelector('.plant-selector-icon');
        const textElement = this.plantSelectorBtn.querySelector('.plant-selector-text');
        
        if (iconElement && textElement) {
            // Show the current stage emoji or the final stage as preview
            const previewStage = Math.min(this.plantStage, currentPlant.stages.length - 1);
            iconElement.textContent = currentPlant.stages[previewStage];
            textElement.textContent = currentPlant.name;
        }
    }

    updatePlantOptionsSelection() {
        this.plantOptions.forEach(option => {
            if (option.dataset.plant === this.selectedPlant) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    togglePomodoroMode() {
        this.pomodoroMode = this.pomodoroToggle.checked;
        localStorage.setItem('pomodoroMode', this.pomodoroMode.toString());
        
        if (this.pomodoroMode) {
            // Reset to work mode when enabling and set original work duration
            this.isBreakTime = false;
            this.cycleCount = 1;
            localStorage.setItem('cycleCount', '1');
            this.originalWorkDuration = this.duration; // Set to current duration
        } else {
            // Clear Pomodoro state when disabling
            this.isBreakTime = false;
            this.cycleCount = 1;
            this.originalWorkDuration = 0;
        }
        
        this.updatePomodoroStatus();
        this.updateBreakSettingVisibility();
    }
    
    updatePomodoroToggle() {
        if (this.pomodoroToggle) {
            this.pomodoroToggle.checked = this.pomodoroMode;
        }
    }
    
    updatePomodoroStatus() {
        if (!this.pomodoroStatus || !this.modeText || !this.cycleCountElement) return;
        
        if (this.pomodoroMode) {
            this.pomodoroStatus.style.display = 'block';
            this.modeText.textContent = this.isBreakTime ? 'Break Time' : 'Work Time';
            this.cycleCountElement.textContent = `Cycle ${this.cycleCount}`;
            
            // Update visual styling based on mode
            this.pomodoroStatus.className = this.isBreakTime ? 'pomodoro-status break-mode' : 'pomodoro-status work-mode';
        } else {
            this.pomodoroStatus.style.display = 'none';
        }
    }

    updateBreakTimeFromInput() {
        const inputValue = parseInt(this.breakTimeInput.value);
        
        if (inputValue >= 1 && inputValue <= 60) {
            this.breakTimeMinutes = inputValue;
            this.breakDuration = this.breakTimeMinutes * 60 * 1000;
            localStorage.setItem('breakTimeMinutes', this.breakTimeMinutes.toString());
        } else {
            // Reset to valid value if input is invalid
            this.breakTimeInput.value = this.breakTimeMinutes;
        }
    }
    
    updateBreakTimeInput() {
        if (this.breakTimeInput) {
            this.breakTimeInput.value = this.breakTimeMinutes;
        }
    }
    
    updateBreakSettingVisibility() {
        if (this.pomodoroBreakSetting) {
            this.pomodoroBreakSetting.style.display = this.pomodoroMode ? 'flex' : 'none';
        }
    }

    verifyElements() {
        const requiredElements = [
            'plantSelectorBtn', 'plantModal', 'plantModalOverlay', 
            'plantModalClose', 'plantEmoji', 'stageIndicator',
            'pomodoroToggle', 'pomodoroStatus', 'modeText', 'cycleCountElement',
            'breakTimeInput', 'pomodoroBreakSetting'
        ];
        
        requiredElements.forEach(element => {
            if (!this[element]) {
                console.warn(`Element ${element} not found. Plant selection or Pomodoro mode may not work properly.`);
            }
        });

        if (this.plantOptions.length === 0) {
            console.warn('No plant options found. Plant selection modal may be empty.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FocusTimer();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes grow {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes growthPulse {
        0% { transform: scale(1); }
        25% { transform: scale(1.1); }
        50% { transform: scale(1.2); }
        75% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);