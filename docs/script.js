class FocusTimer {
    constructor() {
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
        
        this.timeInput = document.getElementById('time-input');
        this.unitSelector = document.getElementById('unit-selector');
        this.timerDisplay = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.plantEmoji = document.getElementById('plant-emoji');
        this.stageIndicator = document.getElementById('stage-indicator');
        this.celebrationMessage = document.getElementById('celebration-message');
        this.hiddenControls = document.getElementById('hidden-controls');
        this.totalHoursDisplay = document.getElementById('total-hours');
        this.presetButtons = document.querySelectorAll('.preset-btn');
        
        // Initialize timer with input value
        this.timeValue = parseInt(this.timeInput.value) || 25;
        this.timeUnit = this.unitSelector.value;
        this.duration = this.convertToMilliseconds(this.timeValue, this.timeUnit);
        
        this.initEventListeners();
        this.updateDisplay();
        this.updatePlantStage();
        this.updateTotalFocusDisplay();
        
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
        this.resetBtn.addEventListener('click', () => this.reset());
        this.timeInput.addEventListener('input', () => this.updateTimerFromInput());
        this.timeInput.addEventListener('change', () => this.updateTimerFromInput());
        this.unitSelector.addEventListener('change', () => this.updateTimerFromInput());
        
        // Preset button listeners
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setPresetTime(btn));
        });
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
            
            // Clear active preset button state when manually entering time
            this.presetButtons.forEach(btn => btn.classList.remove('active'));
        } else if (this.timeInput.value === '') {
            // Handle empty input gracefully
            this.timeValue = 1;
            this.duration = this.convertToMilliseconds(1, this.timeUnit);
            this.updateDisplay();
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            
            // If starting fresh (not resuming from pause)
            if (!this.startTime) {
                this.startTime = Date.now();
                this.totalPausedDuration = 0;
            } else if (this.pausedTime) {
                // Resuming from pause
                this.totalPausedDuration += Date.now() - this.pausedTime;
                this.pausedTime = null;
            }
            
            this.startBtn.textContent = 'Growing...';
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.timeInput.disabled = true;
            this.unitSelector.disabled = true;
            this.hiddenControls.classList.add('active');
            
            // Update display every 100ms for smooth countdown
            this.timer = setInterval(() => this.tick(), 100);
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
        
        this.timeValue = parseInt(this.timeInput.value);
        this.timeUnit = this.unitSelector.value;
        this.duration = this.convertToMilliseconds(this.timeValue, this.timeUnit);
        
        this.startBtn.textContent = 'Plant';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timeInput.disabled = false;
        this.unitSelector.disabled = false;
        this.hiddenControls.classList.remove('active');
        
        this.updateDisplay();
    }
    
    tick() {
        const elapsed = this.getElapsedTime();
        const remaining = Math.max(0, this.duration - elapsed);
        
        if (remaining <= 0) {
            this.complete();
        } else {
            this.updateDisplay();
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
        
        // Add session time to total focus hours
        const sessionHours = this.duration / (1000 * 60 * 60);
        this.totalFocusHours += sessionHours;
        localStorage.setItem('totalFocusHours', this.totalFocusHours.toString());
        this.updateTotalFocusDisplay();
        
        // Advance plant stage if not at maximum
        if (this.plantStage < 6) {
            this.advancePlantStage();
            this.showCelebration();
        }
        
        this.startBtn.textContent = 'Plant';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timeInput.disabled = false;
        this.unitSelector.disabled = false;
        this.hiddenControls.classList.remove('active');
        
        this.playNotification();
        this.timerDisplay.textContent = "Session Complete!";
        
        // Reset time tracking
        this.startTime = null;
        this.pausedTime = null;
        this.totalPausedDuration = 0;
        
        setTimeout(() => {
            this.reset();
        }, 3000);
    }
    
    advancePlantStage() {
        this.plantStage++;
        localStorage.setItem('plantStage', this.plantStage.toString());
        this.updatePlantStage();
    }
    
    updatePlantStage() {
        this.plantEmoji.setAttribute('data-stage', this.plantStage.toString());
        this.stageIndicator.textContent = `Stage ${this.plantStage}/6`;
        
        const appTitle = document.querySelector('.app-title');
        if (this.plantStage === 0) {
            appTitle.textContent = 'Start planting today!';
        } else if (this.plantStage === 6) {
            appTitle.textContent = 'Your tree is blooming beautifully! 🌸';
        } else {
            appTitle.textContent = `Keep growing your plant! Stage ${this.plantStage}/6`;
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
        }, 2000);
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