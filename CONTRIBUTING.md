# Contributing to Image Converter

Thank you for your interest in contributing to this privacy-first image converter! 

## 🎯 Project Philosophy

This project is built on three core principles:
1. **Privacy First** - No server uploads, all processing happens client-side
2. **Open Source** - Full transparency, auditable code
3. **Simplicity** - Focus on doing one thing really well

## 🚀 How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues. When creating a bug report, include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Browser**: Browser name and version
- **Screenshots**: If applicable

**Example:**
```
Browser: Chrome 120
OS: Windows 11

Steps:
1. Upload PNG file (1920x1080)
2. Select JPEG as output format
3. Set quality to 0.5
4. Click Convert

Expected: JPEG file downloads with compression
Actual: File size larger than original
```

### Suggesting Features

Feature requests are welcome! Please:

1. Check if the feature has already been requested
2. Explain **why** you need this feature
3. Describe the **use case**
4. Consider if it aligns with our privacy-first philosophy

**We prioritize:**
- Features that enhance privacy
- Performance improvements
- Better user experience
- Additional format support

**We typically avoid:**
- Features requiring server-side processing
- Third-party service integrations (unless privacy-preserving)
- Features that complicate the UI

### Code Contributions

#### Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/image-converter.git
   cd image-converter
   ```

3. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Run locally:**
   ```bash
   cd src
   python -m http.server 8000
   # or
   npx http-server
   ```

5. **Make your changes**

6. **Test thoroughly:**
   - Test in Chrome, Firefox, Safari
   - Test mobile responsive design
   - Test offline mode (PWA)
   - Test with various image formats

7. **Commit with clear messages:**
   ```bash
   git commit -m "Add support for AVIF format"
   ```

8. **Push and create Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```

#### Code Standards

**Architecture:**
- Follow the existing modular structure
- Place code in appropriate layers:
  - `core/` - Configuration, constants, state
  - `services/` - Business logic
  - `ui/` - UI components
  - `controllers/` - Orchestration

**Code Style:**
- Use ES6+ features
- Keep functions focused and small
- Add JSDoc comments for public methods
- Use descriptive variable names
- No external dependencies (keep it vanilla JS)

**Example:**
```javascript
/**
 * Convert image to specified format
 * @param {File} file - Source image file
 * @param {Object} settings - Conversion settings
 * @returns {Promise<string>} Data URL of converted image
 */
static async convertImage(file, settings) {
    // Implementation
}
```

#### Pull Request Guidelines

**Title Format:**
- `feat: Add AVIF format support`
- `fix: Resolve PNG compression issue`
- `docs: Update architecture documentation`
- `perf: Optimize canvas rendering`
- `refactor: Simplify conversion logic`

**Description Should Include:**
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots/GIFs if UI changed
- Any breaking changes

**Example PR Description:**
```markdown
## Changes
Added support for AVIF image format conversion

## Why
AVIF provides better compression than JPEG and WEBP for many images

## Testing
1. Upload AVIF file
2. Convert to PNG/JPEG
3. Verify output quality

## Screenshots
[Before/After comparison]

## Breaking Changes
None
```

## 🏗️ Development Guidelines

### Project Structure

```
src/
├── index.html          # Main HTML
├── style.css           # Styles
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
└── js/
    ├── main.js        # Entry point
    ├── core/          # Foundation
    ├── services/      # Business logic
    ├── ui/            # Components
    └── controllers/   # Orchestration
```

### Adding a New Feature

1. **Identify the layer**: Does it belong in a service, UI component, or controller?
2. **Create/modify files** in the appropriate directory
3. **Update constants** if needed (core/constants.js)
4. **Test thoroughly** across browsers
5. **Update documentation** (ARCHITECTURE.md if architectural change)
6. **Submit PR** with clear description

### Privacy Considerations

**Always ask:**
- Does this feature require server communication?
- Does it collect any user data?
- Does it use third-party services?
- Can it work completely offline?

**If yes to any of the above**, we need to:
- Document it clearly in PRIVACY.md
- Make it optional
- Explain to users what data is involved

## 🧪 Testing

### Manual Testing Checklist

- [ ] Upload various image formats (JPG, PNG, WEBP, GIF, BMP, HEIC)
- [ ] Test batch conversion (10+ files)
- [ ] Test quality settings for JPEG/WEBP
- [ ] Test resize functionality
- [ ] Test drag-and-drop
- [ ] Test file removal
- [ ] Test error handling (corrupted files)
- [ ] Test PWA installation
- [ ] Test offline mode
- [ ] Test on mobile devices
- [ ] Test in different browsers

### Performance Testing

- [ ] Test with large files (10MB+)
- [ ] Test with many files (50+)
- [ ] Check memory usage
- [ ] Verify no memory leaks
- [ ] Test download speeds

## 📝 Documentation

When adding features:
- Update README.md if user-facing
- Update ARCHITECTURE.md if architectural
- Add JSDoc comments to new functions
- Update this CONTRIBUTING.md if process changes

## 🤝 Code of Conduct

### Our Standards

- **Be respectful** and inclusive
- **Be patient** with newcomers
- **Be constructive** in feedback
- **Focus on the code**, not the person
- **Assume good intentions**

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing private information
- Spam or promotional content

## 💬 Questions?

- Open an issue for questions
- Tag it with `question` label
- Or reach out via [LinkedIn](https://www.linkedin.com/in/mdamansour/)

## 🎓 Learning Resources

New to contributing to open source?
- [First Contributions](https://github.com/firstcontributions/first-contributions)
- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

New to vanilla JavaScript?
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [JavaScript.info](https://javascript.info/)

## 🙏 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Thanked publicly on social media (if desired)

---

Thank you for helping make the web more privacy-friendly! 🔒
