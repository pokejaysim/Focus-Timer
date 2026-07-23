# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Timer Tree is a static React UMD web application—a calming Pomodoro timer that helps users grow virtual plants as they complete focus sessions. The app is hosted on GitHub Pages with the domain `timertree.ca`.

## Project Structure

This is a simple static web application with all production files located in the `/docs` directory:
- `index.html` - Main application shell and script loading
- `almanac/app.js` - React components, timer reducer, persistence, and alert behavior
- `almanac/overlays.js` - Stats, Garden, About, alert setup, and completion sheets
- `almanac/styles.css` - Almanac visual system and responsive design
- `almanac/dial.js` and `almanac/plant.js` - SVG visual components
- `CNAME` - GitHub Pages custom domain configuration

## Development Commands

There is no build step or package manager. Development involves:
- Direct file editing
- Testing through browser reload
- Running timer state tests with `node --test tests/timer-core.test.cjs`

## Application Architecture

### Timer reducer and React app
The timer is managed by a reducer in `docs/almanac/app.js`:

**Timer State Management:**
- Uses timestamp-based timing for background resilience
- Stops at focus/rest boundaries until the user acknowledges the transition
- Saves compatible versioned state in localStorage

**Plant Growth System:**
- Botanical plates advance through five growth stages
- Growth and statistics persist in localStorage
- Growth advances on successful focus completion

**Key Features:**
- Configurable focus, short-rest, long-rest, and cadence settings
- Three alert levels and four bell themes plus Silence
- Optional browser notifications and supported-device vibration
- Persistent acknowledgement cards at focus and rest completion
- About, Stats, and Garden sheets

**State Persistence:**
- A single versioned `tt-almanac` record stores timer settings, alert preferences, progress, and statistics

**Visual States:**
- Almanac-inspired botanical plate and timer dial
- Responsive desktop and mobile layouts
- Modal sheets for setup, completion, and supporting views

### DOM Architecture
React 18 UMD renders the component tree without a build step. Shared visual components and overlay sheets are exported on `window` and composed by `almanac/app.js`.

### Styling Architecture
CSS uses CSS custom properties (variables) for consistent theming, with a nature-inspired color palette focusing on earth tones and plant colors. Responsive design supports mobile and tablet viewports.

## Development Workflow

1. Edit files directly in the `/docs` directory
2. Test changes by opening `index.html` in a browser
3. Changes are automatically deployed via GitHub Pages when pushed to the main branch

## Technical Notes

- The timer system catches up from wall-clock timestamps but deliberately pauses at each phase boundary
- Audio notifications use Web Audio API and are primed from explicit user actions
- Browser notifications require user permission
- localStorage is used for all persistent data
