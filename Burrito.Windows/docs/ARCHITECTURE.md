# Burrito Windows Architecture

Burrito for Windows is built as a lightweight, high-performance system tray application using **Electron** and **Node.js child process execution**.

## System Overview

```
+-----------------------------------------------------------------------+
|                              ELECTRON APP                             |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |                     Tray Icon (Notification Area)                |  |
|  +-----------------------------------------------------------------+  |
|                                  |                                    |
|                                  v                                    |
|  +-----------------------------------------------------------------+  |
|  |                 Popover Window (340x180 px frameless)          |  |
|  |                                                                 |  |
|  |   [Header: Title | Pin Toggle | Settings]                       |  |
|  |   +---------------------------------------------------------+   |  |
|  |   | PNG / MP4 Target Zone    | WEBP / WEBM Target Zone       |   |  |
|  |   +---------------------------------------------------------+   |  |
|  |   [Fluid Background Canvas & Processing Animated Overlay]       |  |
|  +-----------------------------------------------------------------+  |
|                                  |                                    |
|                             IPC Bridge                                |
|                                  v                                    |
|  +-----------------------------------------------------------------+  |
|  |                  CLI Processor Execution Module                  |  |
|  +-----------------------------------------------------------------+  |
|               /              |               \               \        |
|              v               v                v               v       |
|       cwebp.exe       pngquant.exe       oxipng.exe       ffmpeg.exe  |
+-----------------------------------------------------------------------+
```

## Module Breakdown

### 1. Main Process (`src/main/main.js`)
- Manages Electron application lifecycle and system tray icon.
- Handles popover window creation (340x180 px, frameless, translucent dark theme).
- Calculates popover coordinates relative to the system tray notification icon, with fallback handling for Windows 11 taskbar chevron overflow menu.
- Controls window pinning behavior (`set-pinned` IPC) to prevent auto-hide on click outside.

### 2. Preload Bridge (`src/preload/preload.js`)
- Exposes context-isolated IPC channels via `window.burritoAPI`:
  - `processFiles({ filePaths, strategy, settings })`
  - `determineMediaType(filePaths)`
  - `setPinned(isPinned)`
  - `getAutoLaunchStatus()` / `toggleAutoLaunch(enable)`

### 3. Renderer UI (`src/renderer/`)
- `index.html`: Frameless popover layout structure.
- `style.css`: Glassmorphic dark styling, fluid animations, dashed drop zone borders, and fanned card stacks.
- `renderer.js`: Handles HTML5 drag & drop, dynamic zone label switching (`PNG / MP4` vs `WEBP / WEBM`), ambient canvas animation, and settings persistence in `localStorage`.

### 4. CLI Execution Engine (`src/main/processor.js`)
- Resolves static 64-bit Windows binary executables located in `bin/` (or `process.resourcesPath/bin` when packaged).
- Spawns background subprocesses asynchronously without blocking the UI thread.
- Writes compressed media into an `Optimized Files/` subfolder next to source files.
- Computes overall compression savings percentage.
