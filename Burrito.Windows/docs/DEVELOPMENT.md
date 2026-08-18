# Burrito Windows Development & Build Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher (v24 recommended)
- **npm**: v9.0.0 or higher
- **PowerShell**: 5.1+ (for binary setup script)

---

## Getting Started

1. Navigate to the Windows directory:
   ```bash
   cd Burrito.Windows
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Ensure Windows CLI binaries are present in `bin/`:
   ```bash
   npm run download-binaries
   ```

4. Launch the application in development mode:
   ```bash
   npm start
   ```

---

## Directory Structure

```
Burrito.Windows/
├── assets/                  # App icons (PNG / ICO)
├── bin/                     # 64-bit static Windows executables (cwebp, pngquant, oxipng, ffmpeg)
├── docs/                    # Architecture & pipeline documentation
├── scripts/                 # PowerShell utility scripts
├── src/
│   ├── main/                # Main process & CLI execution engine
│   ├── preload/             # Secure IPC bindings
│   └── renderer/            # Popover UI markup, styles, & state
├── package.json             # App manifest & build configuration
└── README.md                # Quickstart & overview
```

---

## Building Executable Installer

To package Burrito into a standalone Windows installer (`.exe`) via `electron-builder`:

```bash
npm run build
```

The output installer will be generated in `dist/`.
