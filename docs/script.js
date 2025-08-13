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
            BREAK_DURATION_DEFAULT: 2,
            EXTENDED_BREAK_DURATION_DEFAULT: 15,
            CYCLES_BEFORE_EXTENDED_BREAK: 4
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
        this.isExtendedBreak = false;
        
        // Ensure cycle count is always a valid positive integer
        const storedCycleCount = localStorage.getItem('cycleCount');
        this.cycleCount = storedCycleCount ? Math.max(1, parseInt(storedCycleCount) || 1) : 1;
        
        this.originalWorkDuration = 0;
        
        // Ensure break time is always a valid number between 1 and 60
        const storedBreakTime = localStorage.getItem('breakTimeMinutes');
        this.breakTimeMinutes = storedBreakTime ? Math.min(60, Math.max(1, parseInt(storedBreakTime) || this.CONSTANTS.BREAK_DURATION_DEFAULT)) : this.CONSTANTS.BREAK_DURATION_DEFAULT;
        this.breakDuration = this.breakTimeMinutes * 60 * 1000;
        
        // Ensure extended break time is always a valid number between 1 and 120
        const storedExtendedBreakTime = localStorage.getItem('extendedBreakTimeMinutes');
        this.extendedBreakTimeMinutes = storedExtendedBreakTime ? Math.min(120, Math.max(1, parseInt(storedExtendedBreakTime) || this.CONSTANTS.EXTENDED_BREAK_DURATION_DEFAULT)) : this.CONSTANTS.EXTENDED_BREAK_DURATION_DEFAULT;
        this.extendedBreakDuration = this.extendedBreakTimeMinutes * 60 * 1000;
        
        // Sound settings
        this.soundTheme = localStorage.getItem('soundTheme') || 'chime';
        this.volume = parseFloat(localStorage.getItem('volume') || '0.5');
        
        // Dark mode setting
        this.darkMode = localStorage.getItem('darkMode') === 'true' || false;
        
        // Analytics data
        this.initializeAnalytics();
        
        // Sound themes configuration
        this.SOUND_THEMES = {
            chime: {
                name: 'Classic Chime',
                frequencies: [523.25, 659.25, 783.99], // C5, E5, G5
                durations: [0.3, 0.3, 0.6],
                type: 'sine'
            },
            nature: {
                name: 'Nature Sounds',
                frequencies: [440, 554.37, 659.25], // A4, C#5, E5
                durations: [0.4, 0.4, 0.8],
                type: 'triangle'
            },
            bell: {
                name: 'Temple Bell',
                frequencies: [293.66, 369.99, 440], // D4, F#4, A4
                durations: [0.6, 0.6, 1.2],
                type: 'sine'
            },
            soft: {
                name: 'Soft Tone',
                frequencies: [349.23, 415.30, 493.88], // F4, G#4, B4
                durations: [0.5, 0.5, 1.0],
                type: 'sine'
            },
            off: {
                name: 'Silent',
                frequencies: [],
                durations: [],
                type: 'sine'
            }
        };
        
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
        this.extendedBreakTimeInput = document.getElementById('extended-break-time-input');
        this.pomodoroExtendedBreakSetting = document.getElementById('pomodoro-extended-break-setting');
        
        // Sound customization elements
        this.soundSelector = document.getElementById('sound-selector');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');
        this.volumeTestBtn = document.getElementById('volume-test-btn');
        
        // Dark mode elements
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        this.themeIcon = document.getElementById('theme-icon');
        
        // Analytics elements
        this.analyticsBtn = document.getElementById('analytics-btn');
        this.analyticsModal = document.getElementById('analytics-modal');
        this.analyticsModalOverlay = document.getElementById('analytics-modal-overlay');
        this.analyticsModalClose = document.getElementById('analytics-modal-close');
        this.exportBtn = document.getElementById('export-btn');
        this.resetStatsBtn = document.getElementById('reset-stats-btn');
        
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
        this.updateExtendedBreakTimeInput();
        this.updateBreakSettingVisibility();
        this.updateSoundSelector();
        this.updateVolumeSlider();
        this.updateDarkMode();
        
        // Handle page visibility changes to update timer when returning to tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isRunning && !this.isPaused) {
                this.updateDisplay();
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Reset plant progress (Ctrl/Cmd + Shift + R)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                if (confirm('Reset your plant progress? This will set your plant back to stage 0.')) {
                    this.plantStage = 0;
                    localStorage.setItem('plantStage', '0');
                    this.updatePlantStage();
                }
            }
            // Reset Pomodoro data (Ctrl/Cmd + Shift + P)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                if (confirm('Reset Pomodoro data? This will clear cycle count and break settings.')) {
                    this.resetPomodoroData();
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
        
        // Extended break time input listener
        this.extendedBreakTimeInput.addEventListener('input', () => this.updateExtendedBreakTimeFromInput());
        this.extendedBreakTimeInput.addEventListener('change', () => this.updateExtendedBreakTimeFromInput());
        
        // Sound customization listeners
        this.soundSelector.addEventListener('change', () => this.updateSoundTheme());
        this.volumeSlider.addEventListener('input', () => this.updateVolumeFromSlider());
        this.volumeTestBtn.addEventListener('click', () => this.testSound());
        
        // Dark mode listener
        this.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
        
        // Analytics listeners
        this.analyticsBtn.addEventListener('click', () => this.openAnalyticsModal());
        this.analyticsModalClose.addEventListener('click', () => this.closeAnalyticsModal());
        this.analyticsModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.analyticsModalOverlay) {
                this.closeAnalyticsModal();
            }
        });
        this.exportBtn.addEventListener('click', () => this.exportData());
        this.resetStatsBtn.addEventListener('click', () => this.resetStats());

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.plantModalOverlay.classList.contains('show')) {
                    this.closePlantModal();
                } else if (this.analyticsModalOverlay.classList.contains('show')) {
                    this.closeAnalyticsModal();
                }
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
        
        // Track analytics
        this.trackSession(sessionHours);
        
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
        
        // Track analytics
        this.trackSession(sessionHours);
        
        // Advance plant stage if not at maximum
        if (this.plantStage < this.CONSTANTS.PLANT_STAGES) {
            this.advancePlantStage();
            this.showCelebration();
        }
        
        // Check if this should be an extended break (every 4th cycle)
        this.isExtendedBreak = (this.cycleCount % this.CONSTANTS.CYCLES_BEFORE_EXTENDED_BREAK === 0);
        this.isBreakTime = true;
        this.duration = this.isExtendedBreak ? this.extendedBreakDuration : this.breakDuration;
        
        const breakType = this.isExtendedBreak ? 'Extended Break' : 'Break';
        const breakMessage = this.isExtendedBreak ? 
            `Work Complete! Time for an extended break! 🏖️` : 
            'Work Complete! Break time! 🎉';
        const breakDescription = this.isExtendedBreak ? 
            'Great job completing 4 cycles! Enjoy your longer break.' : 
            'Great job! Starting your break.';
        
        this.playNotification();
        this.showBrowserNotification(breakMessage, breakDescription);
        this.flashTabTitle();
        this.timerDisplay.textContent = this.isExtendedBreak ? "Extended Break Time!" : "Break Time!";
        
        document.body.className = this.isExtendedBreak ? 'timer-extended-break' : 'timer-break';
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
        this.isExtendedBreak = false;
        this.duration = this.originalWorkDuration;
        this.cycleCount = Math.max(1, (this.cycleCount || 0) + 1);
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
        if (this.soundTheme === 'off') return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const soundConfig = this.SOUND_THEMES[this.soundTheme];
            
            if (!soundConfig || soundConfig.frequencies.length === 0) return;
            
            soundConfig.frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = soundConfig.type;
                
                const startTime = audioContext.currentTime + (index * 0.2);
                const duration = soundConfig.durations[index];
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(this.volume, startTime + 0.05);
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
        if (this.soundTheme === 'off') return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Use softer chime for break-to-work transition
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
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, startTime + 0.05); // Softer for break transitions
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
            
            // Update mode text based on current state
            if (this.isBreakTime) {
                this.modeText.textContent = this.isExtendedBreak ? 'Extended Break' : 'Break Time';
            } else {
                this.modeText.textContent = 'Work Time';
            }
            
            // Ensure cycle count is a valid number and show next cycle info during extended breaks
            const safeyCycleCount = Math.max(1, parseInt(this.cycleCount) || 1);
            if (this.isExtendedBreak) {
                this.cycleCountElement.textContent = `After Cycle ${safeyCycleCount}`;
            } else {
                this.cycleCountElement.textContent = `Cycle ${safeyCycleCount}`;
            }
            
            // Update visual styling based on mode
            if (this.isExtendedBreak) {
                this.pomodoroStatus.className = 'pomodoro-status extended-break-mode';
            } else if (this.isBreakTime) {
                this.pomodoroStatus.className = 'pomodoro-status break-mode';
            } else {
                this.pomodoroStatus.className = 'pomodoro-status work-mode';
            }
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
    
    updateExtendedBreakTimeFromInput() {
        const inputValue = parseInt(this.extendedBreakTimeInput.value);
        
        if (inputValue >= 1 && inputValue <= 120) {
            this.extendedBreakTimeMinutes = inputValue;
            this.extendedBreakDuration = this.extendedBreakTimeMinutes * 60 * 1000;
            localStorage.setItem('extendedBreakTimeMinutes', this.extendedBreakTimeMinutes.toString());
        } else {
            // Reset to valid value if input is invalid
            this.extendedBreakTimeInput.value = this.extendedBreakTimeMinutes;
        }
    }
    
    updateExtendedBreakTimeInput() {
        if (this.extendedBreakTimeInput) {
            this.extendedBreakTimeInput.value = this.extendedBreakTimeMinutes;
        }
    }
    
    updateBreakSettingVisibility() {
        if (this.pomodoroBreakSetting) {
            this.pomodoroBreakSetting.style.display = this.pomodoroMode ? 'flex' : 'none';
        }
        if (this.pomodoroExtendedBreakSetting) {
            this.pomodoroExtendedBreakSetting.style.display = this.pomodoroMode ? 'flex' : 'none';
        }
    }
    
    resetPomodoroData() {
        // Reset all Pomodoro-related data
        this.pomodoroMode = false;
        this.isBreakTime = false;
        this.isExtendedBreak = false;
        this.cycleCount = 1;
        this.originalWorkDuration = 0;
        this.breakTimeMinutes = this.CONSTANTS.BREAK_DURATION_DEFAULT;
        this.breakDuration = this.breakTimeMinutes * 60 * 1000;
        this.extendedBreakTimeMinutes = this.CONSTANTS.EXTENDED_BREAK_DURATION_DEFAULT;
        this.extendedBreakDuration = this.extendedBreakTimeMinutes * 60 * 1000;
        
        // Clear localStorage
        localStorage.removeItem('pomodoroMode');
        localStorage.removeItem('cycleCount');
        localStorage.removeItem('breakTimeMinutes');
        localStorage.removeItem('extendedBreakTimeMinutes');
        
        // Update UI
        this.updatePomodoroToggle();
        this.updatePomodoroStatus();
        this.updateBreakTimeInput();
        this.updateExtendedBreakTimeInput();
        this.updateBreakSettingVisibility();
        
        console.log('Pomodoro data reset successfully');
    }
    
    updateSoundTheme() {
        this.soundTheme = this.soundSelector.value;
        localStorage.setItem('soundTheme', this.soundTheme);
    }
    
    updateVolumeFromSlider() {
        this.volume = this.volumeSlider.value / 100;
        localStorage.setItem('volume', this.volume.toString());
        this.updateVolumeDisplay();
    }
    
    updateVolumeDisplay() {
        if (this.volumeValue) {
            this.volumeValue.textContent = `${Math.round(this.volume * 100)}%`;
        }
        
        // Update volume icon based on level
        if (this.volumeSlider) {
            const volumeIcon = document.querySelector('.volume-icon');
            if (volumeIcon) {
                if (this.volume === 0) {
                    volumeIcon.textContent = '🔇';
                } else if (this.volume < 0.3) {
                    volumeIcon.textContent = '🔈';
                } else if (this.volume < 0.7) {
                    volumeIcon.textContent = '🔉';
                } else {
                    volumeIcon.textContent = '🔊';
                }
            }
        }
    }
    
    updateSoundSelector() {
        if (this.soundSelector) {
            this.soundSelector.value = this.soundTheme;
        }
    }
    
    updateVolumeSlider() {
        if (this.volumeSlider) {
            this.volumeSlider.value = Math.round(this.volume * 100);
        }
        this.updateVolumeDisplay();
    }
    
    testSound() {
        // Play a quick version of the selected sound theme
        if (this.soundTheme === 'off') {
            // Visual feedback for silent mode
            this.volumeTestBtn.style.animation = 'pulse 0.3s ease-in-out';
            setTimeout(() => {
                this.volumeTestBtn.style.animation = '';
            }, 300);
            return;
        }
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const soundConfig = this.SOUND_THEMES[this.soundTheme];
            
            if (!soundConfig || soundConfig.frequencies.length === 0) return;
            
            // Play just the first tone for testing
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = soundConfig.frequencies[0];
            oscillator.type = soundConfig.type;
            
            const duration = 0.3; // Short test duration
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
            // Visual feedback
            this.volumeTestBtn.style.animation = 'pulse 0.3s ease-in-out';
            setTimeout(() => {
                this.volumeTestBtn.style.animation = '';
            }, 300);
            
        } catch (error) {
            console.log('Sound test: ', this.SOUND_THEMES[this.soundTheme].name);
        }
    }
    
    toggleDarkMode() {
        this.darkMode = this.darkModeToggle.checked;
        localStorage.setItem('darkMode', this.darkMode.toString());
        this.applyTheme();
    }
    
    updateDarkMode() {
        if (this.darkModeToggle) {
            this.darkModeToggle.checked = this.darkMode;
        }
        this.applyTheme();
    }
    
    applyTheme() {
        if (this.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (this.themeIcon) {
                this.themeIcon.textContent = '☀️';
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (this.themeIcon) {
                this.themeIcon.textContent = '🌙';
            }
        }
    }
    
    // Analytics Methods
    initializeAnalytics() {
        // Get analytics data from localStorage
        this.analytics = JSON.parse(localStorage.getItem('analytics') || '{}');
        
        // Initialize default structure
        if (!this.analytics.sessions) this.analytics.sessions = [];
        if (!this.analytics.totalSessions) this.analytics.totalSessions = 0;
        if (!this.analytics.currentStreak) this.analytics.currentStreak = 0;
        if (!this.analytics.longestStreak) this.analytics.longestStreak = 0;
        if (!this.analytics.lastSessionDate) this.analytics.lastSessionDate = null;
        if (!this.analytics.weeklyData) this.analytics.weeklyData = {};
        
        this.saveAnalytics();
    }
    
    trackSession(sessionHours) {
        const now = new Date();
        const today = now.toDateString();
        const sessionMinutes = Math.round(sessionHours * 60);
        
        // Add session to history
        this.analytics.sessions.push({
            date: now.toISOString(),
            duration: sessionHours,
            timestamp: now.getTime()
        });
        
        // Update total sessions
        this.analytics.totalSessions++;
        
        // Update streak
        if (this.analytics.lastSessionDate) {
            const lastDate = new Date(this.analytics.lastSessionDate);
            const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) {
                // Same day, maintain streak
            } else if (daysDiff === 1) {
                // Next day, increment streak
                this.analytics.currentStreak++;
            } else {
                // Gap in sessions, reset streak
                this.analytics.currentStreak = 1;
            }
        } else {
            // First session
            this.analytics.currentStreak = 1;
        }
        
        // Update longest streak
        if (this.analytics.currentStreak > this.analytics.longestStreak) {
            this.analytics.longestStreak = this.analytics.currentStreak;
        }
        
        // Update weekly data
        const weekKey = this.getWeekKey(now);
        const dayIndex = now.getDay();
        
        if (!this.analytics.weeklyData[weekKey]) {
            this.analytics.weeklyData[weekKey] = [0, 0, 0, 0, 0, 0, 0];
        }
        
        this.analytics.weeklyData[weekKey][dayIndex] += sessionHours;
        
        // Update last session date
        this.analytics.lastSessionDate = today;
        
        this.saveAnalytics();
    }
    
    getWeekKey(date) {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toDateString();
    }
    
    saveAnalytics() {
        localStorage.setItem('analytics', JSON.stringify(this.analytics));
    }
    
    openAnalyticsModal() {
        this.updateAnalyticsDisplay();
        this.analyticsModalOverlay.classList.add('show');
        document.body.classList.add('modal-open');
    }
    
    closeAnalyticsModal() {
        this.analyticsModalOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
    
    updateAnalyticsDisplay() {
        // Update stat cards
        document.getElementById('total-sessions').textContent = this.analytics.totalSessions;
        document.getElementById('current-streak').textContent = this.analytics.currentStreak;
        document.getElementById('longest-streak').textContent = this.analytics.longestStreak;
        
        // Calculate average session duration
        const avgSessionMinutes = this.analytics.sessions.length > 0 ? 
            this.analytics.sessions.reduce((sum, session) => sum + session.duration, 0) / this.analytics.sessions.length * 60 : 0;
        document.getElementById('avg-session').textContent = Math.round(avgSessionMinutes);
        
        // Update weekly chart
        this.updateWeeklyChart();
    }
    
    updateWeeklyChart() {
        const now = new Date();
        const weekKey = this.getWeekKey(now);
        const weekData = this.analytics.weeklyData[weekKey] || [0, 0, 0, 0, 0, 0, 0];
        const maxHours = Math.max(...weekData, 1); // Prevent division by zero
        
        const dayStats = document.querySelectorAll('.day-stat');
        
        dayStats.forEach((dayStat, index) => {
            const hours = weekData[index] || 0;
            const percentage = (hours / maxHours) * 100;
            
            const dayFill = dayStat.querySelector('.day-fill');
            const dayTime = dayStat.querySelector('.day-time');
            
            dayFill.style.height = `${percentage}%`;
            dayTime.textContent = `${hours.toFixed(1)}h`;
            
            // Highlight today
            if (index === now.getDay()) {
                dayStat.style.background = 'rgba(160, 82, 45, 0.2)';
            } else {
                dayStat.style.background = 'rgba(255, 255, 255, 0.5)';
            }
        });
    }
    
    exportData() {
        const exportData = {
            analytics: this.analytics,
            totalFocusHours: this.totalFocusHours,
            plantStage: this.plantStage,
            selectedPlant: this.selectedPlant,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timer-tree-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    resetStats() {
        if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
            this.analytics = {
                sessions: [],
                totalSessions: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastSessionDate: null,
                weeklyData: {}
            };
            this.saveAnalytics();
            this.updateAnalyticsDisplay();
        }
    }

    verifyElements() {
        const requiredElements = [
            'plantSelectorBtn', 'plantModal', 'plantModalOverlay', 
            'plantModalClose', 'plantEmoji', 'stageIndicator',
            'pomodoroToggle', 'pomodoroStatus', 'modeText', 'cycleCountElement',
            'breakTimeInput', 'pomodoroBreakSetting', 'extendedBreakTimeInput', 'pomodoroExtendedBreakSetting',
            'soundSelector', 'volumeSlider', 'volumeValue', 'volumeTestBtn', 'darkModeToggle', 'themeIcon',
            'analyticsBtn', 'analyticsModal', 'analyticsModalOverlay', 'analyticsModalClose', 'exportBtn', 'resetStatsBtn'
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