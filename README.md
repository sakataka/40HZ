# 40Hz Audio Sessions

This project is a browser-based React and Vite app for short "brain reset" audio sessions: 40 Hz isochronic pulses, paced-breathing guides, and masking noise. Each program is labelled by strength of evidence, and the app can optionally record before/after check-ins and run blinded self-experiments (40 Hz vs. an aperiodic sham) so the user can test what actually works for them. It is intended as a research-informed tool for general adult self-use. It is not presented as a medical device, a treatment, or a clinically validated intervention.

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

`bun run build` creates the root-relative build served by LocalWeb at
`http://40hz.localhost/`. The GitHub Pages workflow uses `bun run build:pages`
to create the `/40HZ/`-prefixed deployment build.

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

### Layout

The app has three tabs: `Listen`, `Records`, and `Settings`. The player stays available on every tab.

- On phones and narrow windows, the tabs sit in a bottom bar with a mini player above it. The mini player shows the current sound, the remaining time, and a play/stop button. Tapping it opens the full-screen player. Starting a breath guide opens the full-screen player automatically, because the guide is followed visually.
- On wide windows, the tabs sit in the top bar and the full player is pinned in a right-hand column.

The full player shows a countdown ring, the breath orb (for breath guides), the sound description and evidence label, the play/stop button, timer chips, the volume slider, and a collapsed `Tuning` section. Each mood group has its own accent color. The interface follows the system light/dark appearance. Animations are slow (breath pace or a 10-second ambient swell) and never flicker at 40 Hz. They are turned off when the system asks for reduced motion.

### Before You Start

The onboarding sheet (step 1 of 2) asks two questions before playback is enabled:

- `Sound sensitivity`: `Standard` or `Sensitive`
- `Listening setup`: `Headphones` or `Speakers`

These inputs do not attempt to model age, sex, or other demographic variables. They are only used to choose conservative starting values for volume and background noise level. Both can be changed later in `Settings`. The sheet shows the key safety warning directly and keeps the full list in a collapsible section. The full list also appears in `Settings`.

### Tone Check

After onboarding, the app opens a `Tone Check` sheet (step 2 of 2). This step compares `220 Hz` and `440 Hz` as candidate base tones.

- `Preview` plays a short sample
- `Use this tone` saves the selected base tone
- `Skip and use 220 Hz` accepts the default fallback

The tone check is a listener-preference shortcut. It is intended to help the user choose a tone that is audible without sounding overly harsh. It is not described as a research-backed optimization step.

### Listen tab

The `Listen` tab is built for "pick a sound and listen". Tapping any sound card starts it right away. While playing, tapping another card crossfades to it (keeping the running timer and volume), and tapping the playing card stops it. Nothing is measured or recorded unless the user turns recording on.

#### Suggestion for now

Two large cards at the top suggest sounds for the local time of day (morning: resonance breathing / 40 Hz, daytime: pink noise / rain, evening: cyclic sighing / ocean, late night: bedtime breathing / fire). Each suggestion plays with one tap. It is a static rule based on the clock, not a measurement.

#### Sound library

Sounds are grouped by what the listener wants right now. The evidence label of the selected sound is shown next to its description.

- `Calm down`
  - `Resonance breathing` (evidence: moderate): about 5.5 breaths per minute (4.5 s in, 6.5 s out). Pitch and loudness rise on the inhale and fall on the exhale, and an on-screen orb follows the same curve.
  - `Cyclic sighing` (evidence: moderate): a double inhale followed by a long exhale, 5 minutes by default.
  - `Ocean (synthetic)`: brown noise with a slow 9-second swell.
  - `Breeze (synthetic)`: low-passed noise with slow, irregular gusts.
- `Focus`
  - `40 Hz` (evidence: limited): `sine`-style 40 Hz modulation, 20 minutes, conservative defaults.
  - `40 Hz gentle`: the same structure with a lower starting volume.
  - `Pink noise` and `Rain (synthetic)`, which layers random droplets over pink noise.
- `Rest / sleep`
  - `Bedtime breathing` (evidence: moderate): 4 s in, 8 s out, 5 breaths per minute.
  - `Brown noise` and `Fire (synthetic)`, a low roar with occasional crackles.
- `Exploratory` (experimental): a more pronounced `gated` pulse, hidden behind an explicit toggle.

Noise and nature sounds are rated `limited`.

The breath guides are rated highest because slow and exhale-weighted breathing has repeated human evidence. The sound only paces the breathing. The effect is attributed to the breathing, not to the sound.

#### Session controls

The player shows the time left, a single play/stop button, and session-length chips for `5 min`, `10 min`, `15 min`, `20 min`, and `30 min`. The session timer counts down during playback and stops the audio automatically when the selected duration ends. `Volume` is always visible. `Tone pitch` and `Background noise` are in the collapsed `Tuning` section.

Timer duration, listening setup, and tone checks can be changed while stopped. Volume, base tone, background noise, and (when not recording) the sound itself can be changed during playback.

The recording mode is chosen at the top of the `Records` tab: `Off` (the default), `Check-in`, or `Blind comparison`, plus an optional 60-second reaction test. While a blind comparison is selected, the `Listen` tab shows a notice instead of the suggestions and locks the library.

### Check-ins and blind comparison

Recording is off by default, so playback starts immediately. Settings saved by older versions, where check-ins were the default, are reset to off once. With `Check-in` mode, `Start` first opens a short form: `clarity`, `mood`, and `fatigue` on 0–10 sliders, and optionally a 60-second reaction-time test modelled on the brief psychomotor vigilance test (PVT-B, 1–4 s random intervals, lapses at 500 ms or more). The same form appears after the session ends or is stopped, and a result card shows the before/after change. `Play without recording` skips the form.

`Blind comparison` locks the sound to `40 Hz` and assigns each session to one of two arms without showing which:

- `active`: the normal 40 Hz sine pulse
- `sham`: pulses with the same envelope and loudness but random intervals (12.5–37.5 ms, mean 25 ms), following the random-frequency control used in Martorell et al., 2019

Arms are block-randomized in groups of four (two of each) and revealed after the post check-in. Once each arm has at least three completed sessions, the `Records` tab shows for each metric the mean improvement per arm, the difference with a Welch 95% confidence interval, and a plain verdict. Sessions stopped before the timer ends are kept but excluded from the analysis. Open-label check-ins are summarized per preset separately.

This is an n-of-1 experiment. Day-to-day variation and the audible difference between arms (the blinding is imperfect) still apply.

### Apple Watch

Browsers cannot read HealthKit, so heart data comes in through an iOS Shortcut named `40Hz Health`. The shortcut copies lines such as `HR,<ISO 8601 date>,<bpm>` and `HRV,<date>,<ms>` from the last day to the clipboard. `Import from clipboard` (or pasting into the text box) merges them into local storage. This section is in the `Records` tab. Each session then shows the mean heart rate for the 15 minutes before and during playback, plus nearby HRV. The blind comparison also gains a `heart-rate drop` metric. Step-by-step shortcut instructions are in the app. Starting a `Mind and Body` workout on the watch during playback gives dense heart-rate sampling.

### Data storage

Settings, records, and imported health samples stay in the browser's `localStorage` for that origin. The LocalWeb build and the GitHub Pages build therefore keep separate records. `Export (JSON)` and `Import` move records between them.

### Settings tab

The `Settings` tab contains:

- `Output` (headphones or speakers) and `Sound sensitivity`. Changing either picks new conservative starting values for volume and background noise.
- the current base tone and a button to run the tone check again
- the full safety list
- the collapsed `About this app and sources` section

Direct base-tone editing stays in the player's `Tuning` section so it is available without being part of the primary workflow.

### Evidence and Limits

The `About this app and sources` section in `Settings` states the current evidence position in narrow terms:

- evidence for audio-only consumer use is limited
- some EEG paradigms observed stronger 40 Hz responses in eyes-closed or low-arousal conditions
- the literature is too heterogeneous to justify age- or sex-based auto-tuning

The source list links to the studies used for this framing and labels them by scope rather than treating them as direct validation of the app.

## Research Background and Evidence

### Why this app focuses on 40 Hz

Interest in `40 Hz` stimulation comes from a broader line of work on gamma-band activity, especially in Alzheimer's disease and related cognitive-aging research. In that literature, the central idea is not that `40 Hz` audio has an established consumer-use protocol, but that `40 Hz` sensory stimulation is a plausible research target for neural entrainment.

For this app, the practical takeaway is narrow:

- `40 Hz` is kept fixed as the pulse rate
- the app treats that choice as the main research-informed parameter
- the app does not claim that the remaining settings are clinically optimized

### What this app actually borrows from the literature

The current design is based on a small number of limited, human-facing reference points rather than a mature clinical standard.

#### 1. Human EEG entrainment work

[Han et al., 2023](https://pubmed.ncbi.nlm.nih.gov/37007205/) compared several auditory entrainment conditions in humans and reported that, within that experiment, a `40 Hz` sinusoidal sound in the closed-eye condition produced the strongest prefrontal `40 Hz` neural response among the tested conditions.

That study informs two parts of the app:

- the default `Recommended` mode uses a `sine`-style modulation profile
- the evidence panel notes the eyes-closed result without treating it as a guarantee of a stronger or more useful effect

The app does not treat this paper as proof of clinical benefit. It uses it only as a narrow cue for a conservative default mode.

#### 2. Human clinical interest in sensory gamma stimulation

[Chan et al., 2022](https://pubmed.ncbi.nlm.nih.gov/36454969/) is relevant because it helped establish human clinical interest in daily `40 Hz` sensory stimulation in mild Alzheimer's disease. That study focused on combined light and sound, not an audio-only consumer listening tool.

For this reason, the app uses that literature only as background context:

- it supports the claim that `40 Hz` sensory stimulation is an active human research area
- it does not justify treatment claims for this app
- it does not justify treating audio-only settings in this app as clinically validated

This distinction matters because the stronger human interventional literature is weighted toward audiovisual protocols and disease-specific cohorts rather than general adult audio-only use.

#### 3. Acceptability and comfort data for sound-based use

[Wang et al., 2024](https://pubmed.ncbi.nlm.nih.gov/38402805/) is useful mainly as an acceptability reference. In older adults with mild cognitive impairment, the study reported that raw `40 Hz` sound could be uncomfortable, while music-based variants were generally easier to tolerate.

That does not provide a direct parameter rule for this app, but it does support a cautious product stance:

- the app starts from relatively low volume defaults
- the `Gentle` mode keeps a softer entry point
- low starting volume is treated as a comfort feature rather than an evidence-backed treatment setting

In other words, the app borrows the comfort lesson, not a claim of efficacy.

#### 4. Variability across age and related factors

[Mockevičius et al., 2026](https://pubmed.ncbi.nlm.nih.gov/41671727/) reviewed developmental and aging trajectories of `40 Hz` auditory steady-state responses across the human lifespan. The practical implication for this app is that response patterns are not simple enough to support a product-ready age rule.

This is part of the reason the app does **not**:

- auto-adjust settings by age
- auto-adjust settings by sex
- present the base-tone choice as a physiological optimization step

Instead, the app uses a simple tone check and conservative defaults.

### What the app does not claim

The literature used here does not establish a standard audio-only consumer protocol. It also does not support strong claims about immediate cognitive benefit for general users of this app.

The README therefore keeps several boundaries explicit:

- this app is research-informed, not clinically validated
- the presets are listening presets, not treatment modes
- the tone check is a preference step, not a biomarker-driven calibration
- comfort settings such as low starting volume are usability choices, not evidence-backed therapeutic parameters

### How to read the source list in the app

The source list is intended to show where the app's framing comes from, not to imply direct validation of the product.

In practical terms:

- the EEG entrainment paper informs the default pulse style and the eyes-closed note in the evidence panel
- the audiovisual Alzheimer's study supports the broader research relevance of `40 Hz` sensory stimulation
- the acceptability study supports a more conservative comfort posture for sound-based use
- the lifespan review supports the decision to avoid demographic auto-tuning

This is the level at which the app uses the literature. It is better understood as a conservative synthesis of limited evidence than as a direct implementation of any single published protocol.
