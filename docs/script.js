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
        
        // Focus mode setting
        this.focusMode = localStorage.getItem('focusMode') === 'true' || false;
        
        // Tag system
        this.sessionTags = JSON.parse(localStorage.getItem('sessionTags') || '[]');
        this.currentTag = localStorage.getItem('currentTag') || '';
        this.selectedTagColor = '#A0522D';
        
        // Motivational messages system
        this.motivationalMessages = {
            sessionComplete: [
                "🎉 Fantastic work! You're building great focus habits.",
                "✨ Another session done! Your dedication is paying off.",
                "🚀 Excellent focus! You're crushing your goals today.",
                "🌟 Well done! Every session brings you closer to mastery.",
                "💪 Great job staying focused! Your consistency is inspiring.",
                "🎯 Session complete! You're developing incredible discipline.",
                "🌱 Amazing focus! Watch yourself grow with each session.",
                "🏆 Outstanding work! Your focus skills are getting stronger."
            ],
            breakComplete: [
                "☕ Break's over! Ready to tackle the next challenge?",
                "🌊 Refreshed and ready? Let's dive back into focused work!",
                "⚡ Recharged! Time to channel that energy into productivity.",
                "🌅 Break complete! Fresh mind, fresh focus ahead.",
                "🔋 Batteries recharged! Let's make this next session count.",
                "🎪 Break time over! Back to the focused action!",
                "💫 Mind refreshed! Ready to create something amazing?"
            ],
            goalAchieved: [
                "🎯 Daily goal smashed! You're unstoppable today!",
                "👑 Goal achieved! You're building a legendary focus streak.",
                "🏆 Mission accomplished! Your dedication is truly impressive.",
                "💎 Daily target hit! You're forging habits of excellence.",
                "🌟 Goal crushed! Your consistency is your superpower.",
                "🚀 Target achieved! You're on fire with your focus!",
                "⭐ Daily goal complete! You're becoming a focus master!"
            ],
            plantGrowth: [
                "🌱 Your plant grew! Just like your focus skills!",
                "🌿 Growth unlocked! Your dedication is bearing fruit.",
                "🌳 Plant level up! You're cultivating greatness.",
                "🌺 Beautiful progress! Your focus garden is blooming.",
                "🌸 New growth achieved! Your persistence is inspiring.",
                "🍃 Plant evolved! Your focus journey continues to flourish.",
                "🌾 Growth milestone! You're nurturing excellence."
            ],
            encouragement: [
                "💪 You've got this! Every moment of focus counts.",
                "🌟 Stay strong! Great things are built one session at a time.",
                "🎯 Keep going! Your future self will thank you.",
                "⚡ Power through! You're stronger than any distraction.",
                "🌊 Ride the wave of focus! You're in your element.",
                "🔥 On fire! Your concentration is your secret weapon.",
                "✨ Believe in yourself! Focus is your pathway to success."
            ]
        };
        
        // Daily goal system
        this.dailyGoal = parseFloat(localStorage.getItem('dailyGoal') || '2');
        this.goalStreak = parseInt(localStorage.getItem('goalStreak') || '0');
        this.bestGoalStreak = parseInt(localStorage.getItem('bestGoalStreak') || '0');
        this.goalsAchieved = parseInt(localStorage.getItem('goalsAchieved') || '0');
        this.lastGoalDate = localStorage.getItem('lastGoalDate') || null;
        
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
        
        // Keyboard hints element
        this.keyboardHints = document.getElementById('keyboard-hints');
        
        // Tag system elements
        this.tagSelector = document.getElementById('session-tag-select');
        this.tagAddBtn = document.getElementById('tag-add-btn');
        this.tagModal = document.getElementById('tag-modal');
        this.tagModalOverlay = document.getElementById('tag-modal-overlay');
        this.tagModalClose = document.getElementById('tag-modal-close');
        this.newTagName = document.getElementById('new-tag-name');
        this.colorOptions = document.getElementById('color-options');
        this.tagCreateBtn = document.getElementById('tag-create-btn');
        this.tagCancelBtn = document.getElementById('tag-cancel-btn');
        
        // Daily goal system elements
        this.dailyGoalDisplay = document.getElementById('daily-goal-display');
        this.goalEditBtn = document.getElementById('goal-edit-btn');
        this.goalModal = document.getElementById('goal-modal');
        this.goalModalOverlay = document.getElementById('goal-modal-overlay');
        this.goalModalClose = document.getElementById('goal-modal-close');
        this.dailyGoalInput = document.getElementById('daily-goal-input');
        this.goalPresetBtns = document.querySelectorAll('.goal-preset-btn');
        this.goalSaveBtn = document.getElementById('goal-save-btn');
        this.goalCancelBtn = document.getElementById('goal-cancel-btn');
        this.goalProgressFill = document.getElementById('goal-progress-fill');
        this.todayHours = document.getElementById('today-hours');
        this.goalHoursDisplay = document.getElementById('goal-hours-display');
        this.dailyGoalHours = document.getElementById('daily-goal-hours');
        this.streakCount = document.getElementById('streak-count');
        
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
        this.applyFocusMode();
        this.initializeTagSystem();
        this.initializeDailyGoals();
        this.updateDailyGoalDisplay();
        
        // Show keyboard hints on first visit
        if (!localStorage.getItem('keyboardHintsShown')) {
            setTimeout(() => {
                this.showKeyboardHints();
                localStorage.setItem('keyboardHintsShown', 'true');
            }, 2000);
        }
        
        // Handle page visibility changes to update timer when returning to tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isRunning && !this.isPaused) {
                this.updateDisplay();
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore shortcuts when user is typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Space bar - Start/Pause timer
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.isRunning && !this.isPaused) {
                    this.start();
                } else if (this.isRunning) {
                    this.pause();
                } else if (this.isPaused) {
                    this.start();
                }
                return;
            }
            
            // R key - Reset timer
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                this.reset();
                return;
            }
            
            // S key - Skip session
            if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                this.skip();
                return;
            }
            
            // Number keys 1-7 - Preset times
            const numberKey = parseInt(e.key);
            if (numberKey >= 1 && numberKey <= 7) {
                e.preventDefault();
                const presetBtns = Array.from(this.presetButtons);
                if (presetBtns[numberKey - 1]) {
                    this.setPresetTime(presetBtns[numberKey - 1]);
                }
                return;
            }
            
            // F key - Toggle full screen focus mode
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                this.toggleFocusMode();
                return;
            }
            
            // ? key - Show/hide keyboard shortcuts
            if (e.key === '?') {
                e.preventDefault();
                this.toggleKeyboardHints();
                return;
            }
            
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
        
        // Break time input listener - only validate when user finishes editing
        this.breakTimeInput.addEventListener('blur', () => this.updateBreakTimeFromInput());
        this.breakTimeInput.addEventListener('change', () => this.updateBreakTimeFromInput());
        
        // Extended break time input listener - only validate when user finishes editing
        this.extendedBreakTimeInput.addEventListener('blur', () => this.updateExtendedBreakTimeFromInput());
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
        
        // Tag system listeners
        this.tagAddBtn.addEventListener('click', () => this.openTagModal());
        this.tagModalClose.addEventListener('click', () => this.closeTagModal());
        this.tagModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.tagModalOverlay) {
                this.closeTagModal();
            }
        });
        this.tagCreateBtn.addEventListener('click', () => this.createTag());
        this.tagCancelBtn.addEventListener('click', () => this.closeTagModal());
        this.tagSelector.addEventListener('change', () => this.selectTag());
        
        // Daily goal system listeners
        this.goalEditBtn.addEventListener('click', () => this.openGoalModal());
        this.goalModalClose.addEventListener('click', () => this.closeGoalModal());
        this.goalModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.goalModalOverlay) {
                this.closeGoalModal();
            }
        });
        this.goalSaveBtn.addEventListener('click', () => this.saveGoal());
        this.goalCancelBtn.addEventListener('click', () => this.closeGoalModal());
        this.goalPresetBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setGoalPreset(btn));
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.plantModalOverlay.classList.contains('show')) {
                    this.closePlantModal();
                } else if (this.analyticsModalOverlay.classList.contains('show')) {
                    this.closeAnalyticsModal();
                } else if (this.tagModalOverlay.classList.contains('show')) {
                    this.closeTagModal();
                } else if (this.goalModalOverlay.classList.contains('show')) {
                    this.closeGoalModal();
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
            
            // Add progress animation when starting
            this.addProgressAnimation();
            
            // Show contextual encouraging message (occasionally)
            if (Math.random() < 0.3) { // 30% chance to show message
                setTimeout(() => {
                    const encouragingMessage = this.getContextualMessage();
                    this.showBrowserNotification('Focus Time! 🎯', encouragingMessage);
                }, 5000); // Show after 5 seconds of focus
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
        
        // Check daily goal achievement
        this.checkGoalAchievement(sessionHours);
        this.updateDailyGoalDisplay();
        
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
        
        // Show motivational browser notification
        const motivationalMessage = this.getRandomMessage('sessionComplete');
        this.showBrowserNotification('Focus Session Complete! 🎉', motivationalMessage);
        
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
        
        // Check daily goal achievement
        this.checkGoalAchievement(sessionHours);
        this.updateDailyGoalDisplay();
        
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
        
        // Show motivational break completion message
        const breakMessage = this.getRandomMessage('breakComplete');
        this.showBrowserNotification('Break Complete! 🌱', breakMessage);
        
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
        const randomMessage = this.getRandomMessage('plantGrowth');
        const celebrationText = this.celebrationMessage.querySelector('.celebration-text');
        celebrationText.textContent = randomMessage;
        
        // Show celebration message with animation
        this.celebrationMessage.classList.add('show');
        
        // Add enhanced celebration effects
        this.addCelebrationEffects();
        
        setTimeout(() => {
            this.celebrationMessage.classList.remove('show');
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
        const timeString = `${displayMinutes}:${displaySeconds}`;
        
        this.timerDisplay.textContent = timeString;
        
        // Update browser tab title with timer
        this.updateTabTitle(timeString);
    }
    
    updateTabTitle(timeString) {
        if (this.isRunning || this.isPaused) {
            const status = this.isPaused ? '⏸️' : 
                          this.isBreakTime ? (this.isExtendedBreak ? '🏖️' : '☕') : '🌱';
            const modeText = this.isBreakTime ? 
                           (this.isExtendedBreak ? 'Extended Break' : 'Break') : 
                           'Focus';
            document.title = `${status} ${timeString} - ${modeText} | Timer Tree`;
        } else {
            document.title = this.originalTitle;
        }
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
        
        // Update active state with animation
        this.presetButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Add selection animation
        this.addSelectionAnimation(button);
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
        
        // Allow any positive integer between 1 and 60
        if (!isNaN(inputValue) && inputValue >= 1 && inputValue <= 60) {
            this.breakTimeMinutes = inputValue;
            this.breakDuration = this.breakTimeMinutes * 60 * 1000;
            localStorage.setItem('breakTimeMinutes', this.breakTimeMinutes.toString());
        } else if (this.breakTimeInput.value === '' || this.breakTimeInput.value === '0') {
            // Handle empty input or zero - set to minimum valid value
            this.breakTimeMinutes = 1;
            this.breakDuration = this.breakTimeMinutes * 60 * 1000;
            this.breakTimeInput.value = this.breakTimeMinutes;
            localStorage.setItem('breakTimeMinutes', this.breakTimeMinutes.toString());
        } else if (!isNaN(inputValue) && inputValue > 60) {
            // If value is too high, set to maximum
            this.breakTimeMinutes = 60;
            this.breakDuration = this.breakTimeMinutes * 60 * 1000;
            this.breakTimeInput.value = this.breakTimeMinutes;
            localStorage.setItem('breakTimeMinutes', this.breakTimeMinutes.toString());
        }
        // Don't reset for other invalid inputs to allow user to continue typing
    }
    
    updateBreakTimeInput() {
        if (this.breakTimeInput) {
            this.breakTimeInput.value = this.breakTimeMinutes;
        }
    }
    
    updateExtendedBreakTimeFromInput() {
        const inputValue = parseInt(this.extendedBreakTimeInput.value);
        
        // Allow any positive integer between 1 and 120
        if (!isNaN(inputValue) && inputValue >= 1 && inputValue <= 120) {
            this.extendedBreakTimeMinutes = inputValue;
            this.extendedBreakDuration = this.extendedBreakTimeMinutes * 60 * 1000;
            localStorage.setItem('extendedBreakTimeMinutes', this.extendedBreakTimeMinutes.toString());
        } else if (this.extendedBreakTimeInput.value === '' || this.extendedBreakTimeInput.value === '0') {
            // Handle empty input or zero - set to minimum valid value
            this.extendedBreakTimeMinutes = 1;
            this.extendedBreakDuration = this.extendedBreakTimeMinutes * 60 * 1000;
            this.extendedBreakTimeInput.value = this.extendedBreakTimeMinutes;
            localStorage.setItem('extendedBreakTimeMinutes', this.extendedBreakTimeMinutes.toString());
        } else if (!isNaN(inputValue) && inputValue > 120) {
            // If value is too high, set to maximum
            this.extendedBreakTimeMinutes = 120;
            this.extendedBreakDuration = this.extendedBreakTimeMinutes * 60 * 1000;
            this.extendedBreakTimeInput.value = this.extendedBreakTimeMinutes;
            localStorage.setItem('extendedBreakTimeMinutes', this.extendedBreakTimeMinutes.toString());
        }
        // Don't reset for other invalid inputs to allow user to continue typing
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
    
    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        localStorage.setItem('focusMode', this.focusMode.toString());
        this.applyFocusMode();
    }
    
    applyFocusMode() {
        if (this.focusMode) {
            document.body.classList.add('focus-mode');
            // Hide settings and other UI elements in focus mode
            document.querySelector('.timer-settings')?.classList.add('hidden-in-focus');
            document.querySelector('.preset-buttons')?.classList.add('hidden-in-focus');
            document.querySelector('.analytics-section')?.classList.add('hidden-in-focus');
            document.querySelector('.total-focus-display')?.classList.add('hidden-in-focus');
            document.querySelector('.info-button')?.classList.add('hidden-in-focus');
        } else {
            document.body.classList.remove('focus-mode');
            // Show settings and other UI elements when exiting focus mode
            document.querySelector('.timer-settings')?.classList.remove('hidden-in-focus');
            document.querySelector('.preset-buttons')?.classList.remove('hidden-in-focus');
            document.querySelector('.analytics-section')?.classList.remove('hidden-in-focus');
            document.querySelector('.total-focus-display')?.classList.remove('hidden-in-focus');
            document.querySelector('.info-button')?.classList.remove('hidden-in-focus');
        }
    }
    
    toggleKeyboardHints() {
        if (this.keyboardHints) {
            this.keyboardHints.classList.toggle('show');
        }
    }
    
    showKeyboardHints() {
        if (this.keyboardHints) {
            this.keyboardHints.classList.add('show');
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideKeyboardHints();
            }, 5000);
        }
    }
    
    hideKeyboardHints() {
        if (this.keyboardHints) {
            this.keyboardHints.classList.remove('show');
        }
    }
    
    // Tag System Methods
    initializeTagSystem() {
        // Add default tags if none exist
        if (this.sessionTags.length === 0) {
            this.sessionTags = [
                { name: 'Work', color: '#A0522D', id: 'work' },
                { name: 'Study', color: '#8FBC8F', id: 'study' },
                { name: 'Creative', color: '#DDA0DD', id: 'creative' }
            ];
            this.saveSessionTags();
        }
        
        this.updateTagSelector();
        this.setupColorOptionHandlers();
    }
    
    updateTagSelector() {
        if (!this.tagSelector) return;
        
        // Clear existing options except "No tag"
        this.tagSelector.innerHTML = '<option value="">No tag</option>';
        
        // Add tag options
        this.sessionTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            option.textContent = tag.name;
            option.style.color = tag.color;
            this.tagSelector.appendChild(option);
        });
        
        // Set current selection
        this.tagSelector.value = this.currentTag;
    }
    
    setupColorOptionHandlers() {
        if (!this.colorOptions) return;
        
        const colorOptionElements = this.colorOptions.querySelectorAll('.color-option');
        colorOptionElements.forEach(option => {
            option.addEventListener('click', () => {
                colorOptionElements.forEach(el => el.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedTagColor = option.dataset.color;
            });
        });
        
        // Select first color by default
        if (colorOptionElements.length > 0) {
            colorOptionElements[0].classList.add('selected');
            this.selectedTagColor = colorOptionElements[0].dataset.color;
        }
    }
    
    openTagModal() {
        if (this.tagModalOverlay) {
            this.tagModalOverlay.classList.add('show');
            document.body.classList.add('modal-open');
            if (this.newTagName) {
                this.newTagName.focus();
            }
        }
    }
    
    closeTagModal() {
        if (this.tagModalOverlay) {
            this.tagModalOverlay.classList.remove('show');
            document.body.classList.remove('modal-open');
            // Clear form
            if (this.newTagName) this.newTagName.value = '';
            // Reset color selection
            this.setupColorOptionHandlers();
        }
    }
    
    createTag() {
        const tagName = this.newTagName?.value.trim();
        if (!tagName) {
            alert('Please enter a tag name.');
            return;
        }
        
        // Check for duplicate names
        if (this.sessionTags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
            alert('A tag with this name already exists.');
            return;
        }
        
        // Create new tag
        const newTag = {
            name: tagName,
            color: this.selectedTagColor,
            id: tagName.toLowerCase().replace(/[^a-z0-9]/g, '-')
        };
        
        this.sessionTags.push(newTag);
        this.saveSessionTags();
        this.updateTagSelector();
        this.closeTagModal();
        
        // Auto-select the new tag
        this.currentTag = newTag.id;
        this.tagSelector.value = newTag.id;
        localStorage.setItem('currentTag', this.currentTag);
    }
    
    selectTag() {
        if (!this.tagSelector) return;
        
        this.currentTag = this.tagSelector.value;
        localStorage.setItem('currentTag', this.currentTag);
    }
    
    saveSessionTags() {
        localStorage.setItem('sessionTags', JSON.stringify(this.sessionTags));
    }
    
    getCurrentTagInfo() {
        if (!this.currentTag) return null;
        return this.sessionTags.find(tag => tag.id === this.currentTag);
    }
    
    // Daily Goal System Methods
    initializeDailyGoals() {
        // Reset streak if it's a new day and yesterday's goal wasn't met
        this.checkGoalStreak();
    }
    
    checkGoalStreak() {
        const today = new Date().toDateString();
        
        if (this.lastGoalDate && this.lastGoalDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (this.lastGoalDate === yesterdayString) {
                // Check if yesterday's goal was met
                const yesterdayHours = this.getHoursForDate(yesterdayString);
                if (yesterdayHours < this.dailyGoal) {
                    // Goal not met, reset streak
                    this.goalStreak = 0;
                    localStorage.setItem('goalStreak', '0');
                }
            } else {
                // Gap in usage, reset streak
                this.goalStreak = 0;
                localStorage.setItem('goalStreak', '0');
            }
        }
    }
    
    getHoursForDate(dateString) {
        if (!this.analytics.sessions) return 0;
        
        return this.analytics.sessions
            .filter(session => {
                const sessionDate = new Date(session.date).toDateString();
                return sessionDate === dateString;
            })
            .reduce((total, session) => total + session.duration, 0);
    }
    
    getTodayHours() {
        const today = new Date().toDateString();
        return this.getHoursForDate(today);
    }
    
    updateDailyGoalDisplay() {
        if (!this.dailyGoalDisplay) return;
        
        const todayHours = this.getTodayHours();
        const progressPercentage = Math.min(100, (todayHours / this.dailyGoal) * 100);
        const isGoalAchieved = todayHours >= this.dailyGoal;
        
        // Update display elements
        if (this.todayHours) this.todayHours.textContent = todayHours.toFixed(1);
        if (this.goalHoursDisplay) this.goalHoursDisplay.textContent = this.dailyGoal.toString();
        if (this.dailyGoalHours) this.dailyGoalHours.textContent = this.dailyGoal.toString();
        if (this.streakCount) this.streakCount.textContent = this.goalStreak.toString();
        
        // Update progress bar
        if (this.goalProgressFill) {
            this.goalProgressFill.style.width = `${progressPercentage}%`;
        }
        
        // Update achieved state
        if (isGoalAchieved) {
            this.dailyGoalDisplay.classList.add('achieved');
        } else {
            this.dailyGoalDisplay.classList.remove('achieved');
        }
    }
    
    checkGoalAchievement(sessionHours) {
        const todayHours = this.getTodayHours();
        const today = new Date().toDateString();
        
        // Check if this session pushes us over the goal
        if (todayHours >= this.dailyGoal && this.lastGoalDate !== today) {
            this.goalStreak++;
            this.goalsAchieved++;
            this.lastGoalDate = today;
            
            // Update best streak
            if (this.goalStreak > this.bestGoalStreak) {
                this.bestGoalStreak = this.goalStreak;
                localStorage.setItem('bestGoalStreak', this.bestGoalStreak.toString());
            }
            
            // Save progress
            localStorage.setItem('goalStreak', this.goalStreak.toString());
            localStorage.setItem('goalsAchieved', this.goalsAchieved.toString());
            localStorage.setItem('lastGoalDate', this.lastGoalDate);
            
            // Show celebration
            this.showGoalAchievement();
        }
    }
    
    showGoalAchievement() {
        // Add achievement animation
        this.dailyGoalDisplay.classList.add('achieved');
        
        // Show motivational browser notification
        const goalMessage = this.getRandomMessage('goalAchieved');
        this.showBrowserNotification(
            '🎯 Daily Goal Achieved!',
            `${goalMessage} Streak: ${this.goalStreak} days!`
        );
        
        // Play celebration sound
        this.playNotification();
    }
    
    openGoalModal() {
        if (this.goalModalOverlay) {
            this.goalModalOverlay.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Update modal with current values
            if (this.dailyGoalInput) {
                this.dailyGoalInput.value = this.dailyGoal.toString();
            }
            
            // Update stats
            document.getElementById('current-goal-streak').textContent = `${this.goalStreak} days`;
            document.getElementById('best-goal-streak').textContent = `${this.bestGoalStreak} days`;
            document.getElementById('goals-achieved-count').textContent = this.goalsAchieved.toString();
            
            // Update preset button states
            this.updateGoalPresetButtons();
        }
    }
    
    closeGoalModal() {
        if (this.goalModalOverlay) {
            this.goalModalOverlay.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }
    
    setGoalPreset(button) {
        const hours = parseFloat(button.dataset.hours);
        if (this.dailyGoalInput) {
            this.dailyGoalInput.value = hours.toString();
        }
        this.updateGoalPresetButtons(hours);
    }
    
    updateGoalPresetButtons(selectedHours = null) {
        const currentGoal = selectedHours || this.dailyGoal;
        this.goalPresetBtns.forEach(btn => {
            const btnHours = parseFloat(btn.dataset.hours);
            if (btnHours === currentGoal) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    saveGoal() {
        const newGoal = parseFloat(this.dailyGoalInput?.value || '2');
        
        if (newGoal < 0.5 || newGoal > 12) {
            alert('Please enter a goal between 0.5 and 12 hours.');
            return;
        }
        
        this.dailyGoal = newGoal;
        localStorage.setItem('dailyGoal', this.dailyGoal.toString());
        
        this.updateDailyGoalDisplay();
        this.closeGoalModal();
    }
    
    // Enhanced Visual Feedback Methods
    addSelectionAnimation(element) {
        if (!element) return;
        
        // Add ripple effect
        element.classList.add('success-ripple');
        setTimeout(() => {
            element.classList.remove('success-ripple');
        }, 600);
    }
    
    addProgressAnimation() {
        if (this.progressBar) {
            this.progressBar.classList.add('active');
            setTimeout(() => {
                this.progressBar.classList.remove('active');
            }, 1000);
        }
        
        if (this.goalProgressFill && this.goalProgressFill.parentElement) {
            this.goalProgressFill.parentElement.classList.add('active');
            setTimeout(() => {
                this.goalProgressFill.parentElement.classList.remove('active');
            }, 1000);
        }
    }
    
    addCelebrationEffects() {
        // Add celebration animation to plant
        if (this.plantEmoji) {
            this.plantEmoji.style.animation = 'growthPulse 0.8s ease-in-out';
            setTimeout(() => {
                this.plantEmoji.style.animation = '';
            }, 800);
        }
        
        // Add success ripple to start button
        if (this.startBtn) {
            this.addSelectionAnimation(this.startBtn);
        }
        
        // Add particle effect to celebration message
        if (this.celebrationMessage) {
            this.celebrationMessage.style.animation = 'celebrationShake 0.8s ease-in-out';
            setTimeout(() => {
                this.celebrationMessage.style.animation = '';
            }, 800);
        }
    }
    
    addLoadingState(element, duration = 2000) {
        if (!element) return;
        
        element.classList.add('loading');
        setTimeout(() => {
            element.classList.remove('loading');
        }, duration);
    }
    
    // Motivational Messages Methods
    getRandomMessage(category) {
        const messages = this.motivationalMessages[category] || this.motivationalMessages.encouragement;
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    getContextualMessage() {
        const now = new Date();
        const hour = now.getHours();
        const todayHours = this.getTodayHours();
        const isGoalClose = todayHours >= (this.dailyGoal * 0.8);
        
        // Time-based messages
        if (hour < 12) {
            if (Math.random() < 0.3) return "🌅 Good morning! Ready to seize the day with focused work?";
        } else if (hour < 17) {
            if (Math.random() < 0.3) return "☀️ Afternoon focus session! You're making great progress.";
        } else if (hour < 21) {
            if (Math.random() < 0.3) return "🌆 Evening productivity! Wrapping up the day strong.";
        }
        
        // Goal-based messages
        if (isGoalClose && Math.random() < 0.4) {
            return "🎯 You're so close to your daily goal! Keep pushing!";
        }
        
        // Streak-based messages
        if (this.goalStreak >= 3 && Math.random() < 0.3) {
            return `🔥 ${this.goalStreak} days strong! Your streak is impressive!`;
        }
        
        return this.getRandomMessage('encouragement');
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
        const tagInfo = this.getCurrentTagInfo();
        
        // Add session to history
        this.analytics.sessions.push({
            date: now.toISOString(),
            duration: sessionHours,
            timestamp: now.getTime(),
            tag: this.currentTag,
            tagName: tagInfo?.name || null,
            tagColor: tagInfo?.color || null
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