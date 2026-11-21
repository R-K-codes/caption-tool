# Caption Tool

A web app that adds Roman Urdu and Hinglish captions to videos.
Upload a video, the app transcribes the speech, converts it to Roman script, lets you fix mistakes in an editor, and exports the video with styled captions burned in.

## What you need installed

- **Node.js** LTS, version 20.11 or newer: https://nodejs.org
- **FFmpeg** (this also installs ffprobe), added to PATH. On Windows: `winget install ffmpeg`
- **Git**
- **A free Groq API key** from the Groq console. Every person uses their own key. Never share a key and never commit it.

## Run it on Windows (easiest)

1. Clone the repository and open the folder.
2. Double-click `start.bat`.
3. The first time, it creates `backend/.env` and opens Notepad. Paste your own Groq key, save, close Notepad, then double-click `start.bat` again.
4. It installs everything, starts the backend and the frontend, and opens http://localhost:5173 in your browser.

Keep the black window open while you use the app. Close it to stop the app.

## Run it from a terminal (any system)

```
npm run setup
```

Copy `backend/.env.example` to `backend/.env` and fill in your values, then:

```
npm run dev
```

Open http://localhost:5173

## How it works

1. The browser uploads the video to the Express backend.
2. FFmpeg extracts a small audio file.
3. Whisper (through the Groq API) transcribes the speech.
4. A Groq chat model converts the text to Roman script.
5. You fix mistakes, choose a style, font, size and position in the editor.
6. FFmpeg burns the captions into the video using an .ass subtitle file.

Privacy note: the audio of every video you process is sent to Groq.

## Project structure

```
backend/
  server.js            Express server
  storage.js           reads and writes project folders
  routes/projects.js   API routes
  services/
    transcribe.js      audio extraction and Whisper call
    romanize.js        Roman script conversion
    styles.js          caption styles and .ass file builder
    exportVideo.js     FFmpeg export
  fonts/               font files and fonts.json
frontend/
  src/
    api.js             calls to the backend
    captionLogic.js    caption preview logic and style looks
    components/        upload, status and editor pages
storage/               uploaded and exported videos (not in Git)
```

### Fonts

Font files live in `backend/fonts`. `fonts.json` lists them. Each entry has `name` (shown in the app), `file`, `family` (the font's full name, used by FFmpeg) and `group`. To add a font, put the .ttf file in the folder and add an entry. Only use fonts with a licence that allows this, such as Google Fonts.

## Working as a team

Rules:

- Do not commit `.env`, videos, or anything inside `storage`.
- Do not push straight to `main`. Work on a branch and open a pull request.
- Pull the latest `main` before you start new work.

Workflow:

```
git checkout main
git pull
git checkout -b feature/short-name
```

Make your changes and test them, then:

```
git add .
git commit -m "Describe what you changed"
git push -u origin feature/short-name
```

On GitHub, open a pull request from your branch. A teammate reviews it, then it is merged. After that:

```
git checkout main
git pull
```

The repository owner adds teammates under **Settings**, then **Collaborators** on GitHub.

## Ideas to work on

- Searchable font dropdown inside the controls box
- Dark mode
- Word timestamps from Whisper for more accurate highlighting
- A spelling-consistency pass for Roman Urdu (acha and achi)
- User accounts and saved style presets
- Putting the app online

## Troubleshooting

- **npm is blocked in PowerShell:** double-click `start.bat`, or run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once.
- **FFmpeg not found:** install it, then close and reopen the terminal or restart the computer.
- **Port already in use:** another copy of the app is running. Close it and try again.
- **Transcription or conversion fails:** check the key in `backend/.env`, and check Groq's free-tier limits.
- **Exported fonts look wrong:** make sure the `backend/fonts` folder has all the files.