# Image Converter - Open Source & Privacy-First 🎨

> **The only open-source batch image converter that never uploads your files.**

A modern, client-side batch image converter built with privacy as the #1 priority. All processing happens locally in your browser—your images never touch a server.

🌐 **Live Demo:** [https://image-converter.amansour.me/](https://image-converter.amansour.me/)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 🔒 Privacy First

Unlike other converters that upload your files to servers, this tool processes everything **locally in your browser**:
- ✅ **Zero uploads** - Files never leave your device
- ✅ **Open source** - Fully auditable code
- ✅ **Offline capable** - Works without internet
- ✅ **No tracking** - Your files, your privacy

## ✨ Features

- 🔄 **Batch Conversion** - Convert hundreds of images at once
- 🎨 **Multiple Formats** - JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, ICO, HEIC
- 💾 **Quality Control** - Adjustable compression for lossy formats
- 📐 **Optional Resize** - Create uniform thumbnails or profile pictures
- 📦 **ZIP Download** - Automatic ZIP for batch conversions
- 🎯 **Drag & Drop** - Easy file upload and reordering
- 💨 **Lightning Fast** - No server uploads, instant processing
- 📱 **PWA Ready** - Install as a desktop/mobile app
- 🌐 **Offline Support** - Works without internet
- 🆓 **Completely Free** - No limits, no ads, no upsells

## 🎯 Why This Project?

**Convert images to any format. That's it. Done right.**

Unlike bloated editors and cloud converters, this tool focuses on the ONE thing users need most: converting image formats quickly and **privately**. No unnecessary features, no server uploads, no confusion—just smooth batch conversion that respects your privacy.

## 🏗️ Technical Architecture

This project demonstrates modern web development practices with a **modular, scalable architecture**.

### Project Structure
```
src/
├── index.html          # Main application
├── style.css           # Styling
├── manifest.json       # PWA configuration
├── sw.js              # Service Worker (offline support)
└── js/
    ├── main.js        # Application entry point
    ├── core/          # Application foundation
    │   ├── constants.js    # App constants
    │   ├── config.js       # Configuration
    │   └── state.js        # State management (Observer pattern)
    ├── services/      # Business logic layer
    │   ├── FileService.js      # File operations
    │   ├── ConversionService.js # Image processing
    │   ├── StorageService.js    # LocalStorage
    │   └── DownloadService.js   # File downloads
    ├── ui/            # UI component layer
    │   ├── Toast.js        # Notifications
    │   ├── FileQueueUI.js  # File list display
    │   └── CropModal.js    # Crop interface
    └── controllers/   # Orchestration layer
        └── AppController.js # Main controller
```

### Key Design Patterns
- ✅ **Observer Pattern** - Reactive state management
- ✅ **Service Layer** - Separated business logic
- ✅ **Component Pattern** - Reusable UI components
- ✅ **MVC-inspired** - Clear separation of concerns

**Read More:**
- 📖 [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture documentation
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 61+, Firefox 60+, Safari 11+)
- Local web server (for ES6 modules)

### Running Locally

**Option 1: Python**
```bash
cd src
python -m http.server 8000
```

**Option 2: Node.js**
```bash
npx http-server src
```

**Option 3: VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

Navigate to `http://localhost:8000`

## �️ Technical Implementation

### Technologies Used

- **Vanilla JavaScript** - ES6+ modules, no framework dependencies
- **HTML5 Canvas API** - Client-side image processing
- **Web APIs** - FileReader, Blob, URL, DragEvent
- **JSZip** - ZIP file generation for batch downloads
- **heic2any** - HEIC/HEIF format support
- **Service Worker** - Offline functionality and caching
- **LocalStorage** - Settings persistence

### How It Works

1. **File Upload**: Files are read using FileReader API into browser memory
2. **Processing**: HTML5 Canvas API handles all image manipulation
3. **Conversion**: Canvas `toDataURL()` generates the converted image
4. **Download**: Blob URLs trigger direct downloads, no server involved

### Privacy Architecture

```
User Device
├── Browser Memory (files loaded here)
├── Canvas API (processing happens here)
└── Download (files saved here)

❌ NO external servers
❌ NO file uploads
❌ NO tracking
```

## 🚀 Development

### Adding New Features

**Example: Adding a brightness filter**

1. **Create service** (`js/services/FilterService.js`):
```javascript
export class FilterService {
    static adjustBrightness(imageData, value) {
        // Implementation
    }
}
```

2. **Update controller** (`js/controllers/AppController.js`):
```javascript
import { FilterService } from '../services/FilterService.js';

applyBrightness() {
    const result = FilterService.adjustBrightness(imageData, 1.2);
    this.ui.toast.show('Brightness adjusted!');
}
```

3. **Add UI** (in `index.html`):
```html
<button id="brightnessBtn">Brightness</button>
```

The modular architecture makes feature additions straightforward.

### Code Organization Principles

1. **Services** - Pure logic, no DOM access
2. **UI Components** - Reusable, self-contained
3. **Controllers** - Orchestrate services and UI
4. **Core** - Shared state and configuration

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Deep dive into the architecture
  - Design patterns used
  - Module responsibilities
  - Data flow diagrams
  - Extension guidelines

- **[PRIVACY.md](PRIVACY.md)** - Privacy policy and technical details
  - How your privacy is protected
  - What data is stored locally
  - Open source transparency

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
  - How to report bugs
  - How to suggest features
  - How to submit code
  - Code standards and PR process

## 🌟 Key Features

### Why This Architecture?
### Architecture Highlights

**From Monolithic to Modular:**
- Before: Single 1,406-line file
- After: 11+ focused modules (~100-200 lines each)

**Benefits:**
- ✅ Easy to find and fix bugs
- ✅ Simple to add new features
- ✅ Testable in isolation
- ✅ Professional and scalable
- ✅ Self-documenting structure

**Implemented Patterns:**

1. **Observer Pattern** - State Management
   - Centralized state with automatic UI updates
   - Clean separation of data and presentation
   - Reactive architecture

2. **Service Layer Pattern**
   - Business logic isolated from UI
   - Reusable across the application
   - Easy to test and maintain

3. **Component Pattern**
   - Reusable UI components (Toast, FileQueue, CropModal)
   - Encapsulated behavior
   - Clear interfaces

4. **No Build Step Required**
   - Native ES6 modules
   - Works directly in browser
   - Fast development cycle

## 🎯 Use Cases

- 📸 **Photographers** - Batch resize and convert photos for clients
- 🎨 **Designers** - Quick format conversions for different platforms
- 📱 **App Developers** - Create icons (ICO format) and assets
- 🌐 **Web Developers** - Optimize images for web (WEBP conversion)
- 👥 **Privacy-Conscious Users** - Convert sensitive images without cloud upload
- 🏢 **Businesses** - Process documents and images securely

## 🔒 Privacy & Security

This project demonstrates privacy-first development:

- ✅ **100% Client-Side Processing** - All operations in browser
- ✅ **Zero Server Communication** - Files never leave your device
- ✅ **No Tracking** - No analytics on file operations
- ✅ **No Account Required** - Use immediately, no sign-up
- ✅ **Offline Capable** - Full functionality without internet
- ✅ **Open Source** - Fully auditable code

Read [PRIVACY.md](PRIVACY.md) for technical details.

## 🚀 Deployment

### As Static Website
The `src` folder can be deployed to any static hosting:
- GitHub Pages
- Netlify / Vercel
- Cloudflare Pages
- AWS S3
- Any web server

### As PWA (Progressive Web App)
Users can install as a desktop/mobile app:
1. Visit the website in a supported browser
2. Click "Install" prompt
3. Use as a native application

## 📱 Browser Support

- ✅ Chrome 61+ (ES6 modules)
- ✅ Firefox 60+
- ✅ Safari 11+
- ✅ Edge 79+ (Chromium)
- ✅ Opera 48+

**Note:** Requires ES6 module support. For older browsers, use a bundler like webpack or Vite.

## 🤝 Contributing

Contributions are welcome! This project demonstrates clean architecture and modern patterns.

**Before contributing:**
1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand the design
3. Check existing issues for what needs help
4. Follow the established patterns and conventions

**Good first issues:**
- Add new image format support
- Improve error handling
- Add unit tests
- Enhance accessibility
- Performance optimizations

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Free to use, modify, and distribute.

## 🙏 Acknowledgments

- **JSZip** - Client-side ZIP file generation
- **heic2any** - HEIC/HEIF format conversion
- Web standards (Canvas API, Service Workers, etc.)

## 👨‍💻 Author

**Mohammed Amansour**
- LinkedIn: [mdamansour](https://www.linkedin.com/in/mdamansour/)
- Website: [amansour.me](https://image-converter.amansour.me/)

## 📊 Project Stats

- **Architecture**: Modular MVC-inspired
- **Language**: Vanilla JavaScript (ES6+)
- **Dependencies**: 2 (JSZip, heic2any)
- **Lines of Code**: ~1,500 (well-organized)
- **Bundle Size**: None (no build step)

---

**Built to demonstrate modern web architecture, privacy-first development, and clean code principles** 🚀

