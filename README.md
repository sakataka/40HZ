# 40Hz Audio Sessions

This project is a browser-based React and Vite app for generating 40 Hz isochronic audio sessions. It is intended as a research-informed listening tool for general adult self-use. It is not presented as a medical device, a treatment, or a clinically validated intervention.

## Getting Started

### Environment

- [Bun](https://bun.sh/) for package management and scripts
- A current desktop or mobile browser with Web Audio support

### Install and run

```bash
bun install
bun run dev
```

The development server runs at `http://localhost:5173/` by default.

### Build and test

```bash
bun run test
bun run build
```

### Basic runtime notes

- Audio playback starts only after a user gesture, which is required by browser audio policies.
- Preferences are stored locally in `localStorage`.
- Some mobile browsers may not keep playback stable while the screen is locked or the tab is heavily backgrounded.
- The current app uses audio only. It does not include visual stimulation.

### Safety and scope

- This app does not claim clinical benefit.
- It is written for general adult self-use, not supervised medical use.
- Users should stop if they notice discomfort, dizziness, or headache.
- Volume should remain at the lowest level that is clearly audible and comfortable.

## Features and Screen Walkthrough

### Opening screen

The first screen provides a short summary of the current session state. It shows:

- the fixed pulse rate at `40 Hz`
- the current session length
- the selected listening mode
- the selected listening setup

The hero text deliberately keeps the framing narrow. It states that the app uses conservative defaults informed by limited human EEG and acceptability findings, together with a brief listening check.

### Before You Start

The onboarding modal asks two questions before playback is enabled:

- `Sound sensitivity`: `Standard` or `Sensitive`
- `Listening setup`: `Headphones` or `Speakers`

These inputs do not attempt to model age, sex, or other demographic variables. They are only used to choose conservative starting values for volume, fade length, and background noise level. The modal also presents the app's safety limitations before the user proceeds.

### Tone Check

After onboarding, the app opens a `Tone Check` modal. This step compares `220 Hz` and `440 Hz` as candidate base tones.

- `Preview` plays a short sample
- `Use this tone` saves the selected base tone
- `Skip and use 220 Hz` accepts the default fallback

The tone check is a listener-preference shortcut. It is intended to help the user choose a tone that is audible without sounding overly harsh. It is not described as a research-backed optimization step.

### Main player controls

The main control panel is organized around simple playback controls.

#### Listening modes

The app exposes two primary modes and one optional exploratory mode:

- `Recommended`
  Uses `sine`-style modulation with a standard 20-minute session and conservative starting defaults.
- `Gentle`
  Keeps the same general structure but lowers the starting volume and lengthens the fades.
- `Exploratory`
  Uses a more pronounced `gated` pulse style and is hidden behind an explicit toggle.

The main UI presents `Recommended` and `Gentle` as the default choices. `Exploratory` is available for comparison but is not treated as the standard recommendation.

#### Session controls

The player shows:

- `Time left`
- `Start session`
- `Stop`
- session-length chips for `10 min`, `20 min`, and `30 min`

The session timer counts down during playback and stops the audio automatically when the selected duration ends.

#### Listening guidance

The `Best Practices` card keeps the guidance narrow and conditional:

- begin in a quiet environment
- keep the first session short
- keep the volume clearly audible but comfortable
- if comfortable, users may try listening with their eyes closed because some EEG studies reported stronger 40 Hz responses in lower-arousal conditions

This guidance is presented as optional listening advice, not as a guaranteed way to improve outcomes.

#### Basic controls

Three sliders remain visible in the main control area:

- `Volume`
- `Fade`
- `Background noise`

`Fade` updates both fade-in and fade-out together. `Background noise` adjusts the generated pink-noise bed mixed behind the pulsed tone.

### Advanced settings

The advanced section is collapsed by default. It contains:

- `Base tone (advanced)`
- a short explanation that the app does not auto-adjust by age or sex
- a button to run the tone check again

This keeps direct base-tone editing available without making it part of the primary workflow.

### Evidence and Limits

The final panel states the current evidence position in narrow terms:

- evidence for audio-only consumer use is limited
- some EEG paradigms observed stronger 40 Hz responses in eyes-closed or low-arousal conditions
- the literature is too heterogeneous to justify age- or sex-based auto-tuning

The source list links to the studies used for this framing and labels them by scope rather than treating them as direct validation of the app.

## Technical Background and Logic

### Audio generation

The audio path is centered on [src/audio/engine.ts](/Users/sakataka/40Hz/src/audio/engine.ts). The app creates an `AudioContext`, loads an `AudioWorklet`, and routes the generated signal through a master `GainNode` before playback.

At runtime, the engine:

- sets a fixed `pulseHz` value of `40`
- applies the selected base tone through `carrierHz`
- switches between `sine` and `gated` modulation styles
- mixes in generated background noise
- uses fade-in and fade-out ramps to reduce abrupt starts and stops

If playback is already active, setting changes are pushed into the running graph instead of creating a second audio context.

### Default derivation

The default-setting logic lives in [src/lib/settings.ts](/Users/sakataka/40Hz/src/lib/settings.ts).

`deriveSessionSettings()` combines three inputs:

- `RecommendationProfile`
- `UserContext`
- `CalibrationResult`

From those values it derives:

- session duration
- starting volume
- fade length
- noise level
- modulation style
- selected base tone

The rules are intentionally simple. They are conservative usability heuristics rather than an attempt to infer a physiologically optimal setting for a given person.

### Session management and persistence

[src/features/session/useSession.ts](/Users/sakataka/40Hz/src/features/session/useSession.ts) coordinates the app state.

It is responsible for:

- onboarding completion state
- tone-check completion state
- session start and stop
- countdown updates while running
- automatic stop when the timer reaches zero
- recalculating remaining time when the tab becomes visible again
- saving preferences to `localStorage`

The hook also keeps the currently active settings synchronized with the audio engine so that volume, fade, base tone, and noise changes can be applied while playback is running.

### Data model

The main types are defined in `src/features/session/types.ts`.

- `RecommendationProfile`
  Describes the app's named listening modes, including label, summary text, modulation style, and duration.
- `UserContext`
  Stores `soundSensitivity` and `outputMode` from onboarding.
- `CalibrationResult`
  Stores the selected base tone, whether the tone check was skipped, and when it was completed.
- `SessionSettings`
  Stores the active session configuration, including the fixed `40 Hz` pulse, base tone, fades, background noise level, duration, and modulation style.

### Evidence framing

The app is best described as research-informed. It is not clinically validated, and the literature cited in the UI does not establish a standard audio-only consumer protocol.

In practical terms, this means:

- the fixed `40 Hz` pulse is the central design choice
- the default modes are simplified listening presets, not treatment modes
- the tone check is a preference step, not an optimization procedure
- age- and sex-based auto-tuning is omitted because the literature is not sufficiently consistent for product use

This approach keeps the implementation aligned with the current evidence limits while still providing a usable listening tool.
