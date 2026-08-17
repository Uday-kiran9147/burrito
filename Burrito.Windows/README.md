# Burrito for Windows

A lightweight Windows system tray application for optimizing images and videos. Drag and drop files onto the popover to compress them as **PNG / MP4** or **WebP / WebM** with zero extra steps.

---

## Quickstart

```bash
cd Burrito.Windows
npm install
npm start
```

---

## Key Features

- **System Tray Popover**: Frameless 340x180 px dark mode flyout positioned above the taskbar tray icon (with fallback positioning for Windows 11 taskbar chevron overflow menu).
- **Pin Window (Stay Open)**: Pin button in the header toggles between *Stay Open* mode and *Auto-Hide on click outside*.
- **Drag & Drop Target Zones**:
  - **PNG / MP4**: High Quality strategy (`pngquant` + `oxipng` for images, H.264 for videos).
  - **WEBP / WEBM**: Web Optimized strategy (`cwebp` for images, VP9 for videos).
- **Quality Controls**: Sliders in Settings view for Image Quality and Video Quality (40–100).
- **Auto-Start on Login**: Optional launch on system startup setting.
- **Embedded 64-bit Binaries**: Bundled static Windows builds of `cwebp.exe`, `pngquant.exe`, `oxipng.exe`, and `ffmpeg.exe`.

---

## Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

- [Architecture Overview](docs/ARCHITECTURE.md)
- [CLI Media Compression Pipeline](docs/CLI_PIPELINE.md)
- [Development & Build Guide](docs/DEVELOPMENT.md)
