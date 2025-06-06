class FocusTimer {
    constructor() {
        this.seconds = 0;
        this.totalSeconds = 0;
        this.initialTotalSeconds = 0;
        this.isRunning = false;
        this.timer = null;
        
        this.plantStage = parseInt(localStorage.getItem('plantStage') || '0');
        this.totalFocusHours = parseFloat(localStorage.getItem('totalFocusHours') || '0');
        
        this.minutesInput = document.getElementById('minutes-input');
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
        this.minutes = parseInt(this.minutesInput.value) || 25;
        this.totalSeconds = this.minutes * 60;
        this.initialTotalSeconds = this.totalSeconds;
        
        this.initEventListeners();
        this.updateDisplay();
        this.updatePlantStage();
        this.updateTotalFocusDisplay();
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.minutesInput.addEventListener('input', () => this.updateTimerFromInput());
        this.minutesInput.addEventListener('change', () => this.updateTimerFromInput());
        
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
        
        const inputMinutes = parseInt(this.minutesInput.value);
        if (inputMinutes >= 1 && inputMinutes <= 120) {
            this.minutes = inputMinutes;
            this.seconds = 0;
            this.totalSeconds = this.minutes * 60;
            this.initialTotalSeconds = this.totalSeconds;
            this.updateDisplay();
            
            // Clear active preset button state when manually entering time
            this.presetButtons.forEach(btn => btn.classList.remove('active'));
        } else if (this.minutesInput.value === '') {
            // Handle empty input gracefully
            this.minutes = 1;
            this.seconds = 0;
            this.totalSeconds = 60;
            this.initialTotalSeconds = this.totalSeconds;
            this.updateDisplay();
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.totalSeconds = this.minutes * 60 + this.seconds;
            this.initialTotalSeconds = this.totalSeconds;
            
            this.startBtn.textContent = 'Growing...';
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.minutesInput.disabled = true;
            this.hiddenControls.classList.add('active');
            
            this.timer = setInterval(() => this.tick(), 1000);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timer);
            
            this.startBtn.textContent = 'Continue';
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
    }
    
    reset() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        this.minutes = parseInt(this.minutesInput.value);
        this.seconds = 0;
        this.totalSeconds = this.minutes * 60;
        this.initialTotalSeconds = this.totalSeconds;
        
        this.startBtn.textContent = 'Plant';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.minutesInput.disabled = false;
        this.hiddenControls.classList.remove('active');
        
        this.updateDisplay();
    }
    
    tick() {
        if (this.totalSeconds > 0) {
            this.totalSeconds--;
            this.minutes = Math.floor(this.totalSeconds / 60);
            this.seconds = this.totalSeconds % 60;
            this.updateDisplay();
        } else {
            this.complete();
        }
    }
    
    complete() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        // Add session time to total focus hours
        const sessionHours = this.initialTotalSeconds / 3600;
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
        this.minutesInput.disabled = false;
        this.hiddenControls.classList.remove('active');
        
        this.playNotification();
        this.timerDisplay.textContent = "Complete!";
        
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
            appTitle.textContent = 'Your majestic tree is complete! 🌴';
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
        const displayMinutes = this.minutes.toString().padStart(2, '0');
        const displaySeconds = this.seconds.toString().padStart(2, '0');
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
        
        const minutes = parseInt(button.dataset.minutes);
        this.minutesInput.value = minutes;
        this.minutes = minutes;
        this.seconds = 0;
        this.totalSeconds = minutes * 60;
        this.initialTotalSeconds = this.totalSeconds;
        this.updateDisplay();
        
        // Update active state
        this.presetButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    
    updateTotalFocusDisplay() {
        // Display with one decimal place
        this.totalHoursDisplay.textContent = this.totalFocusHours.toFixed(1);
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
        0% { transform: translateX(-50%) scale(1); }
        25% { transform: translateX(-50%) scale(1.1); }
        50% { transform: translateX(-50%) scale(1.2); }
        75% { transform: translateX(-50%) scale(1.1); }
        100% { transform: translateX(-50%) scale(1); }
    }
`;
document.head.appendChild(style);