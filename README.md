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
- the app mentions eyes-closed listening only as an optional listening tip, not as a guarantee of a stronger or more useful effect

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
- fades are treated as comfort features rather than evidence-backed treatment settings

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
- comfort settings such as fades and low starting volume are usability choices, not evidence-backed therapeutic parameters

### How to read the source list in the app

The source list is intended to show where the app's framing comes from, not to imply direct validation of the product.

In practical terms:

- the EEG entrainment paper informs the default pulse style and the optional eyes-closed note
- the audiovisual Alzheimer's study supports the broader research relevance of `40 Hz` sensory stimulation
- the acceptability study supports a more conservative comfort posture for sound-based use
- the lifespan review supports the decision to avoid demographic auto-tuning

This is the level at which the app uses the literature. It is better understood as a conservative synthesis of limited evidence than as a direct implementation of any single published protocol.
