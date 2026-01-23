# Quick Reference - Image Converter

## 📁 File Locations

| What you need | File |
|---------------|------|
| **Constants** | `js/core/constants.js` |
| **State** | `js/core/state.js` |
| **Config** | `js/core/config.js` |
| **File operations** | `js/services/FileService.js` |
| **Image conversion** | `js/services/ConversionService.js` |
| **Settings storage** | `js/services/StorageService.js` |
| **Downloads** | `js/services/DownloadService.js` |
| **Toast notifications** | `js/ui/Toast.js` |
| **File queue UI** | `js/ui/FileQueueUI.js` |
| **Crop modal** | `js/ui/CropModal.js` |
| **Main controller** | `js/controllers/AppController.js` |
| **Entry point** | `js/main.js` |

## 🔍 Quick Lookup

### Common Tasks

**Add a new constant:**
→ `js/core/constants.js`

**Add state property:**
→ `js/core/state.js`

**Add file validation:**
→ `js/services/FileService.js`

**Modify conversion logic:**
→ `js/services/ConversionService.js`

**Add UI component:**
→ Create new file in `js/ui/`

**Add event handler:**
→ `js/controllers/AppController.js`

**Change HTML:**
→ `src/index.html`

**Change styles:**
→ `src/style.css`

**Update cache:**
→ `src/sw.js`

## 🚀 Commands

```bash
# Start development server (Python)
cd src && python -m http.server 8000

# Start development server (Node)
npx http-server src

# View in browser
http://localhost:8000
```

## 🏗️ Module Pattern

```javascript
// Service (static methods)
export class MyService {
    static doSomething() { }
}

// Component (instantiated)
export class MyComponent {
    constructor(element) { }
    render() { }
}

// State (singleton)
export const myState = new MyState();
```

## 📝 Import Examples

```javascript
// Constants
import { IMAGE_FORMATS, FILE_STATUS } from '../core/constants.js';

// State
import { appState } from '../core/state.js';

// Services
import { FileService } from '../services/FileService.js';

// UI
import { Toast } from '../ui/Toast.js';
```

## 🔧 Common Operations

### Add File to Queue
```javascript
const item = FileService.createFileItem(file);
appState.addFiles([item]);
```

### Show Notification
```javascript
this.ui.toast.show('Message here');
```

### Convert Image
```javascript
const result = await ConversionService.convertImage(
    file, 
    settings, 
    editState
);
```

### Subscribe to State
```javascript
appState.subscribe((changeType, data) => {
    // React to changes
});
```

## 📊 Architecture Layers

```
┌─────────────────────────┐
│   Controllers           │  ← Event handling, orchestration
├─────────────────────────┤
│   UI Components         │  ← Rendering, user interaction
├─────────────────────────┤
│   Services              │  ← Business logic, operations
├─────────────────────────┤
│   Core (State/Config)   │  ← Foundation, shared state
└─────────────────────────┘
```

## 🎯 Best Practices

✅ Keep modules focused (single responsibility)  
✅ Use services for business logic  
✅ Use components for UI  
✅ Use state for data  
✅ Document public methods  
✅ Handle errors gracefully  

## 🐛 Debugging

**Module not found?**
- Check file path (case-sensitive!)
- Ensure server is running (not file://)

**State not updating?**
- Use appState methods
- Don't mutate directly

**UI not refreshing?**
- Check if subscribed to state changes
- Verify notify() is called

## 📖 Full Documentation

- **ARCHITECTURE.md** - Design details
- **MIGRATION_GUIDE.md** - Migration info
- **README.md** - Project overview
