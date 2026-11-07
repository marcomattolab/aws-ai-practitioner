# AWS AI Practitioner Exam Trainer (aws-ai-ng)

An offline-first exam trainer for the **AWS Certified AI Practitioner (AIF-C01)** certification, built as an Angular 22 standalone PWA.

> Live demo: <https://marcomattolab.github.io/aws-ai-practitioner/>

## Features

- **Practice mode** — drill the full question bank or focus only on the questions you got wrong.
- **Exam simulation** — configurable number of questions (default: 65) and pass threshold (default: 70%), with a 90-minute timer and a scaled score (0–1000), just like the real exam.
- **Question palette & review** — jump between questions, mark items for review, and track unanswered questions.
- **Results & review** — see your score (percentage + scaled score), pass/fail outcome, and a breakdown of the questions you missed.
- **Progress tracking** — stats and answer history are stored locally in the browser (localStorage).
- **Offline-ready PWA** — installable and cache-first thanks to the Angular service worker.
- **Sounds** — audio feedback throughout the app.

## Tech stack

- [Angular 22](https://angular.dev/) (standalone components, signals)
- Angular Material & Angular CDK
- RxJS
- Angular Service Worker (PWA)
- TypeScript
- [Vitest](https://vitest.dev/) for testing
- Prettier

## Getting started

### Prerequisites

- Node.js 22+
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm start
```

Open <http://localhost:4200>.

### Build

```bash
npm run build
```

The production output is generated in `dist/aws-ai-ng/browser/`.

### Test

```bash
npm test
```

## Question bank

Exam questions are stored in [`public/questions.json`](public/questions.json). Each question includes the options, correct answer, discussion, and community vote data.

## GitHub Flow & deployment

The repository uses [GitHub Actions](.github/workflows/deploy.yml) to automatically build and publish the app to **GitHub Pages** on every push to `main`.

- **Branch:** `main`
- **Workflow:** `.github/workflows/deploy.yml`
- **Trigger:** push to `main` (plus manual runs via `workflow_dispatch`)

The build runs with `--base-href /aws-ai-practitioner/` and publishes the `dist/aws-ai-ng/browser/` folder.

The site is served at:

```
https://marcomattolab.github.io/aws-ai-practitioner/
```

> **One-time setup:** in the GitHub repository, go to **Settings → Pages** and set the **Source** to **GitHub Actions**.

## Project structure

```
src/
  app/
    components/
      home-screen/       # Landing screen & mode selection
      exam-setup/        # Exam configuration (questions, pass threshold)
      practice-screen/   # Practice mode
      exam-screen/       # Timed exam simulation
      results-screen/    # Score & pass/fail summary
      review-screen/     # Review of wrong answers
    core/
      models/            # TypeScript interfaces (Question, ExamResult, ...)
      services/          # Question, Exam and Sound services
  main.ts                # App bootstrap
public/
  questions.json         # Question bank
  manifest.json          # PWA manifest
```
