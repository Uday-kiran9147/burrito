const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Resolves binary executable path in both development and packaged asar environments.
 */
function getBinaryPath(binaryName) {
    const isAsar = __dirname.includes('app.asar');
    const baseDir = isAsar
        ? path.join(process.resourcesPath, 'bin')
        : path.join(__dirname, '..', '..', 'bin');
    
    return path.join(baseDir, binaryName);
}

function runProcess(executablePath, args) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(executablePath)) {
            return reject(new Error(`Binary missing: ${path.basename(executablePath)}`));
        }

        const child = spawn(executablePath, args, { windowsHide: true });
        let stderr = '';

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (err) => {
            reject(err);
        });

        child.on('close', (code) => {
            if (code === 0 || code === null) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}: ${stderr}`));
            }
        });
    });
}

function isVideoFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.mpeg', '.mpg', '.m4v'];
    return videoExtensions.includes(ext);
}

function determineTargetFormat(filePath, strategy) {
    const isVideo = isVideoFile(filePath);
    if (strategy === 'highQuality') {
        return isVideo ? 'mp4' : 'png';
    } else {
        return isVideo ? 'webm' : 'webp';
    }
}

async function processSingleFile(filePath, strategy, settings) {
    const originalStats = fs.statSync(filePath);
    const originalSize = originalStats.size;

    const parentDir = path.dirname(filePath);
    const optimizedDir = path.join(parentDir, 'Optimized Files');
    if (!fs.existsSync(optimizedDir)) {
        fs.mkdirSync(optimizedDir, { recursive: true });
    }

    const originalName = path.basename(filePath, path.extname(filePath));
    const targetFormat = determineTargetFormat(filePath, strategy);

    const imageQuality = settings.imageQuality ?? 80;
    const videoQuality = settings.videoQuality ?? 80;

    if (targetFormat === 'mp4' || targetFormat === 'webm') {
        const ffmpegPath = getBinaryPath('ffmpeg.exe');
        const finalPath = path.join(optimizedDir, `${originalName}.${targetFormat}`);
        const crf = Math.round(32 - ((videoQuality - 40) / 60.0) * 14);

        const args = targetFormat === 'mp4'
            ? ['-i', filePath, '-vcodec', 'libx264', '-crf', `${crf}`, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', finalPath]
            : ['-i', filePath, '-vcodec', 'libvpx-vp9', '-crf', `${crf}`, '-b:v', '0', '-y', finalPath];

        await runProcess(ffmpegPath, args);

        if (fs.existsSync(finalPath)) {
            const optimizedSize = fs.statSync(finalPath).size;
            return { originalSize, optimizedSize };
        } else {
            throw new Error('CONVERSION FAILED');
        }
    } else if (targetFormat === 'webp') {
        const cwebpPath = getBinaryPath('cwebp.exe');
        const finalPath = path.join(optimizedDir, `${originalName}.webp`);

        const args = ['-q', `${Math.round(imageQuality)}`, '-m', '6', '-mt', filePath, '-o', finalPath];
        await runProcess(cwebpPath, args);

        if (fs.existsSync(finalPath)) {
            const optimizedSize = fs.statSync(finalPath).size;
            return { originalSize, optimizedSize };
        } else {
            throw new Error('CONVERSION FAILED');
        }
    } else {
        // PNG Processing: pngquant + oxipng
        const pngquantPath = getBinaryPath('pngquant.exe');
        const finalPath = path.join(optimizedDir, `${originalName}.png`);

        const pngMax = Math.round(imageQuality);
        const pngMin = Math.max(0, pngMax - 15);

        const pngquantArgs = [
            `--quality=${pngMin}-${pngMax}`,
            '--speed', '1',
            '--strip',
            '--force',
            filePath,
            '--output', finalPath
        ];

        try {
            await runProcess(pngquantPath, pngquantArgs);
        } catch (err) {
            if (!fs.existsSync(finalPath)) {
                fs.copyFileSync(filePath, finalPath);
            }
        }

        if (!fs.existsSync(finalPath)) {
            throw new Error('OPTIMIZATION FAILED');
        }

        // STEP 2: oxipng
        const oxipngPath = getBinaryPath('oxipng.exe');
        if (fs.existsSync(oxipngPath)) {
            try {
                const oxipngArgs = ['-o', '4', '--strip', 'safe', finalPath];
                await runProcess(oxipngPath, oxipngArgs);
            } catch (err) {
                console.warn('oxipng warning:', err.message);
            }
        }

        const optimizedSize = fs.statSync(finalPath).size;
        return { originalSize, optimizedSize };
    }
}

async function processFiles(filePaths, strategy, settings) {
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    for (const filePath of filePaths) {
        const result = await processSingleFile(filePath, strategy, settings);
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;
    }

    let savingsPercentage = 0;
    if (totalOriginalSize > 0) {
        const savings = (totalOriginalSize - totalOptimizedSize) / totalOriginalSize;
        savingsPercentage = Math.max(0, Math.round(savings * 100));
    }

    return {
        success: true,
        savingsPercentage,
        totalOriginalSize,
        totalOptimizedSize
    };
}

module.exports = {
    processFiles,
    isVideoFile
};
