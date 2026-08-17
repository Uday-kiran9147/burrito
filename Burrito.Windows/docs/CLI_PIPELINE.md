# CLI Media Compression Pipeline

Burrito relies on 4 industry-standard open-source CLI tools to perform fast, high-ratio compression for images and videos on Windows.

## Binary Executables (`bin/`)

| Binary | Tool | Purpose | Source |
| :--- | :--- | :--- | :--- |
| `cwebp.exe` | WebP Encoder | Converts images to WebP | Google WebP Releases |
| `pngquant.exe` | Lossy PNG Compressor | Quantizes PNG color palettes | pngquant.org |
| `oxipng.exe` | Lossless PNG Optimizer | Re-compresses PNG IDAT chunks | oxipng GitHub Releases |
| `ffmpeg.exe` | Video Transcoder | Compresses video to MP4 & WebM | FFmpeg / Gyan Builds |

---

## Strategy & Flag Mappings

### 1. WebP Compression (`cwebp.exe`)
- **Strategy**: `webOptimized`
- **Output**: `<parent_folder>/Optimized Files/<original_name>.webp`
- **CLI Flags**:
  ```bash
  cwebp.exe -q <imageQuality> -m 6 -mt <input_path> -o <output_path>
  ```
  - `-q <imageQuality>`: Quality level (40 to 100, default 80).
  - `-m 6`: Maximum compression effort mode.
  - `-mt`: Multi-threaded processing.

### 2. PNG Optimization (`pngquant.exe` + `oxipng.exe`)
- **Strategy**: `highQuality`
- **Output**: `<parent_folder>/Optimized Files/<original_name>.png`
- **Stage 1 (`pngquant.exe`)**:
  ```bash
  pngquant.exe --quality=<min>-<max> --speed 1 --strip --force <input_path> --output <output_path>
  ```
  - `--quality=<pngMin>-<pngMax>`: Calculated as `pngMax = imageQuality`, `pngMin = max(0, pngMax - 15)`.
  - `--speed 1`: Maximum quantization effort.
  - `--strip`: Strips metadata bloat.
  - *Fallback*: If quality target cannot be met, copies original file to output path for oxipng pass.
- **Stage 2 (`oxipng.exe`)**:
  ```bash
  oxipng.exe -o 4 --strip safe <output_path>
  ```
  - `-o 4`: Level 4 lossless optimization effort.
  - `--strip safe`: Removes safe metadata chunks.

### 3. Video Transcoding (`ffmpeg.exe`)
- **Strategy**: `highQuality` -> MP4 (H.264), `webOptimized` -> WebM (VP9)
- **Quality Formula**:
  $$\text{CRF} = \text{Math.round}\left(32 - \frac{\text{videoQuality} - 40}{60.0} \times 14\right)$$
  *(Maps Quality 40-100 to CRF 32-18)*
- **MP4 Flags**:
  ```bash
  ffmpeg.exe -i <input> -vcodec libx264 -crf <crf> -pix_fmt yuv420p -movflags +faststart -y <output>
  ```
- **WebM Flags**:
  ```bash
  ffmpeg.exe -i <input> -vcodec libvpx-vp9 -crf <crf> -b:v 0 -y <output>
  ```
