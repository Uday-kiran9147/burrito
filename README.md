<div align="center">
<img 
  src="https://github.com/user-attachments/assets/50862f8a-7826-4d07-9ecd-5281216e5982" 
  width="2000" 
  style="border-radius: 30px;" 
/>
</div>


### Burrito

A lightweight macOS menu bar and Windows system tray app for optimizing images and videos. Drag and drop files onto the popover to compress them as **PNG / MP4** or **WebP / WebM**, no extra steps.

https://github.com/user-attachments/assets/de94b2fd-c711-46d1-b790-6626954f07af

## Download & Installation

### macOS
**Option 1** — Grab the latest `.dmg` from [GitHub Releases](https://github.com/SwishHQ/burrito/releases).

**Option 2** — Install via the command line:

```bash
curl -L -o Burrito.dmg \
  https://github.com/SwishHQ/burrito/releases/latest/download/Burrito.dmg
open Burrito.dmg
```

Then drag **Burrito.app** into your Applications folder.

> Requires **macOS 15.6** or later.

---

### Windows

1. Navigate to `Burrito.Windows/`
2. Install dependencies & download CLI binaries:
   ```bash
   cd Burrito.Windows
   npm install
   npm run download-binaries
   ```
3. Start the application:
   ```bash
   npm start
   ```

> Automated script downloads 64-bit static Windows binaries for `cwebp.exe`, `pngquant.exe`, `oxipng.exe`, and `ffmpeg.exe` into `Burrito.Windows/bin/`.


---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/Burrito.git
   ```
3. **For macOS**: Open `Burrito.xcodeproj` in Xcode (15+).
4. **For Windows**: Navigate to `Burrito.Windows/` and run `npm start`.
5. Create a new branch for your change:
   ```bash
   git checkout -b my-feature
   ```
6. Make your changes and verify the build succeeds.
7. **Commit** with a clear message and **push** your branch:
   ```bash
   git push origin my-feature
   ```
8. Open a **Pull Request** against `main`.

### Guidelines

- Keep PRs focused — one feature or fix per PR.
- Match the existing UI & compression behavior across platforms.


## License

MIT License



Built with 💚 by Swish Design 
