# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Timer Tree is a vanilla JavaScript web application - a calming focus timer that helps users grow virtual plants as they complete focus sessions. The app is hosted on GitHub Pages with the domain `timertree.ca`.

## Project Structure

This is a simple static web application with all files located in the `/docs` directory:
- `index.html` - Main application file with complete HTML structure
- `script.js` - Core application logic implemented as a single `FocusTimer` class
- `styles.css` - Complete CSS styling with responsive design and animations
- `CNAME` - GitHub Pages custom domain configuration

## Development Commands

Since this is a vanilla JavaScript project with no build system, there are no specific build, test, or lint commands. Development involves:
- Direct file editing
- Testing through browser reload
- No package manager or dependencies

## Application Architecture

### Core Class: `FocusTimer`
The entire application is built around a single ES6 class (`FocusTimer`) that manages:

**Timer State Management:**
- Uses timestamp-based timing for background resilience
- Tracks `startTime`, `pausedTime`, `totalPausedDuration`
- Handles pause/resume functionality properly

**Plant Growth System:**
- 6 different plant types (classic, flower, cactus, bamboo, fruit, rose)
- Each plant has 7 growth stages (stages 0-6)
- Plant progress persists in localStorage
- Growth advances on successful timer completion

**Key Features:**
- Configurable timer duration (seconds, minutes, hours)
- Preset time buttons (30s, 5m, 25m, 45m, 1h, 1.5h, 2h)
- Progress tracking with visual progress bar
- Browser notifications and audio notifications
- Total focus time tracking (persistent in localStorage)
- Plant selection modal with 6 plant varieties
- Keyboard shortcuts (Ctrl/Cmd + Shift + R to reset plant progress)

**State Persistence:**
- `plantStage` - Current plant growth stage
- `totalFocusHours` - Cumulative focus time
- `selectedPlant` - Currently selected plant type

**Visual States:**
- Dynamic background colors based on timer state (running/paused/completed)
- Timer display animations and state indicators
- Plant growth celebrations and animations

### DOM Architecture
The application uses direct DOM manipulation with element references stored as class properties. No frameworks or libraries are used - everything is vanilla JavaScript with modern ES6+ features.

### Styling Architecture
CSS uses CSS custom properties (variables) for consistent theming, with a nature-inspired color palette focusing on earth tones and plant colors. Responsive design supports mobile and tablet viewports.

## Development Workflow

1. Edit files directly in the `/docs` directory
2. Test changes by opening `index.html` in a browser
3. Changes are automatically deployed via GitHub Pages when pushed to the main branch

## Technical Notes

- The timer system is resilient to background tab switching and uses `visibilitychange` events
- Audio notifications use Web Audio API with graceful fallback
- Browser notifications require user permission
- All animations use CSS keyframes for performance
- localStorage is used for all persistent data