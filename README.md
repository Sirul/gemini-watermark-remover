# Gemini Watermark Remover PWA

A high-performance, privacy-first **Progressive Web App (PWA)** to remove Gemini watermarks from AI-generated images losslessly and precisely.

Built with pure JavaScript, this tool uses a mathematically exact **Reverse Alpha Blending** algorithm to deliver pixel-perfect results directly in your browser.

## 🚀 Key Features

- ✅ **PWA Powered** - Install it on your desktop or mobile for offline use.
- ✅ **Android Share Target** - Share images directly from Gemini or your Gallery to this app for immediate processing.
- ✅ **Zero-Click Workflow** - Automatically processes shared images and copies the result to your clipboard.
- ✅ **100% Client-side** - No images are ever uploaded to a server. Your data stays on your device.
- ✅ **Mathematical Precision** - Reconstructs the original pixels using the Reverse Alpha Blending formula.

## 📸 How to Use

### On Android (PWA)
1. Install the app by adding it to your Home Screen from your browser.
2. In Gemini (or any image app), select an image and tap **Share**.
3. Select **Gemini Watermark Remover** from the share menu.
4. The app will open, remove the watermark, copy the clean image to your clipboard, and notify you when ready.

### Desktop Browser
1. Open the app.
2. Drag and drop, paste from clipboard, or click to select an image.
3. Download or copy the unwatermarked result instantly.

## ⚠️ Disclaimer

> [!WARNING]
> This tool is for personal and educational use. Modifying images may have legal implications depending on your jurisdiction. Users are responsible for ensuring compliance with applicable laws and platform terms.

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Development build with watch mode
pnpm dev

# Production build
pnpm build

# Serve the static files
pnpm serve
```

## 📜 Credits & Acknowledgments

This project is a fork and PWA transformation of the original **[Gemini Watermark Remover](https://github.com/GargantuaX/gemini-watermark-remover)** by GargantuaX.

The core algorithm is based on the **[Gemini Watermark Tool](https://github.com/allenk/GeminiWatermarkTool)** by **Allen Kuo (@allenk)**.

- **Original Algorithm & Calibrated Masks**: © 2024 Allen Kuo (Kwyshell), licensed under MIT.
- **JavaScript Port**: GargantuaX.
- **PWA & Share Target Enhancement**: Developed for a streamlined, mobile-first experience.

## 📄 License

This project is released under the **MIT License**.
