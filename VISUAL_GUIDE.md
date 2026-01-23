# Visual Architecture Guide

## 📊 System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                        (index.html)                             │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                      MAIN CONTROLLER                            │
│                   (AppController.js)                            │
│  • Handles all user events                                      │
│  • Coordinates services and UI                                  │
│  • Updates state                                                │
└──────┬─────────────┬─────────────┬──────────────┬──────────────┘
       │             │             │              │
       ▼             ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   UI     │  │ SERVICES │  │  STATE   │  │  CONFIG  │
│Components│  │          │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## 🔄 Data Flow

```
User Action
    │
    ▼
Controller receives event
    │
    ▼
Controller calls Service
    │
    ▼
Service processes data
    │
    ▼
Service updates State
    │
    ▼
State notifies observers
    │
    ▼
Controller updates UI
    │
    ▼
UI renders changes
```

## 🏗️ Module Dependencies

```
                     main.js
                        │
                        ▼
                 AppController
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    Services         State          UI Components
        │               │               │
        ├─FileService   ├─constants    ├─Toast
        ├─Conversion    ├─config       ├─FileQueueUI
        ├─Storage       └─state        └─CropModal
        └─Download
```

## 📦 Core Module Structure

```
js/core/
├── constants.js
│   ├── IMAGE_FORMATS        → MIME types
│   ├── FORMAT_LABELS        → Display names
│   ├── FORMAT_EXTENSIONS    → File extensions
│   ├── FILE_STATUS          → Status enums
│   ├── CROP_RATIOS          → Aspect ratios
│   ├── DEFAULT_SETTINGS     → Config defaults
│   └── UI_CONFIG            → UI constants
│
├── state.js
│   ├── AppState class
│   │   ├── fileQueue[]      → File items
│   │   ├── editState{}      → Transformations
│   │   ├── dragState{}      → Drag & drop
│   │   └── observers[]      → Subscriptions
│   │
│   ├── Methods:
│   │   ├── subscribe()      → Listen to changes
│   │   ├── notify()         → Emit changes
│   │   ├── addFiles()       → Add to queue
│   │   ├── removeFile()     → Remove from queue
│   │   ├── updateFile()     → Update item
│   │   ├── setRotation()    → Set rotation
│   │   ├── setCropSettings()→ Set crop
│   │   └── ...
│   │
│   └── appState (singleton) → Global instance
│
└── config.js
    ├── AppConfig class
    │   ├── settings{}       → Runtime config
    │   ├── updateSetting()  → Update one
    │   └── getAllSettings() → Get all
    │
    └── appConfig (singleton)→ Global instance
```

## 🔧 Service Module Structure

```
js/services/
├── FileService.js
│   ├── isValidImage()          → Validate file
│   ├── isHEIC()                → Check HEIC
│   ├── getFormatLabel()        → Get label
│   ├── createFileItem()        → Create item
│   ├── generateThumbnail()     → Create thumbnail
│   ├── readFileAsDataURL()     → Read file
│   └── formatFileSize()        → Format size
│
├── ConversionService.js
│   ├── convertImage()          → Main conversion
│   ├── processImage()          → Process with edits
│   ├── convertToCanvas()       → Canvas conversion
│   ├── applyTransformations()  → Apply edits
│   ├── calculateResizeDimensions() → Resize logic
│   ├── createSVGWrapper()      → SVG wrapper
│   ├── createICO()             → ICO creation
│   ├── getExtension()          → Get extension
│   ├── generateFilename()      → Create filename
│   └── estimateOutputSize()    → Size estimation
│
├── StorageService.js
│   ├── saveSettings()          → Save to localStorage
│   ├── loadSettings()          → Load from localStorage
│   ├── clearSettings()         → Clear storage
│   └── isAvailable()           → Check availability
│
└── DownloadService.js
    ├── downloadFile()          → Single file download
    ├── downloadAsZip()         → ZIP download
    └── downloadResults()       → Auto-detect & download
```

## 🎨 UI Component Structure

```
js/ui/
├── Toast.js
│   ├── constructor(element)
│   ├── show(message)           → Show notification
│   └── hide()                  → Hide notification
│
├── FileQueueUI.js
│   ├── constructor(container, countElement)
│   ├── render(fileQueue)       → Render queue
│   ├── createFileItem(item)    → Create item element
│   ├── getThumbnailHTML()      → Thumbnail markup
│   ├── getStatusHTML()         → Status markup
│   ├── attachEventListeners()  → Setup events
│   ├── attachDragEvents()      → Drag & drop
│   └── clear()                 → Clear display
│
└── CropModal.js
    ├── constructor(modalElement)
    ├── init()                  → Initialize
    ├── open(file)              → Open modal
    ├── close()                 → Close modal
    ├── initializeCropBox()     → Setup crop box
    ├── setupEventListeners()   → Setup events
    ├── handleDrag()            → Drag handler
    ├── handleResize()          → Resize handler
    ├── setRatio()              → Set aspect ratio
    ├── applyAspectRatio()      → Apply ratio
    ├── updateDimensions()      → Update display
    └── applyCrop()             → Apply & close
```

## 🎮 Controller Structure

```
js/controllers/AppController.js
├── constructor()
│   ├── initializeDOM()         → Get DOM elements
│   ├── initializeUI()          → Create UI components
│   ├── loadSettings()          → Load saved settings
│   ├── setupEventListeners()   → Attach handlers
│   └── setupStateObservers()   → Subscribe to state
│
├── File Operations
│   ├── addFiles()              → Add to queue
│   ├── removeFile()            → Remove file
│   ├── retryFile()             → Retry failed
│   └── clearQueue()            → Clear all
│
├── Conversion
│   └── processBatch()          → Convert all files
│
├── Settings Handlers
│   ├── handleFormatChange()    → Format changed
│   ├── handleQualityChange()   → Quality changed
│   ├── handleResizeToggle()    → Resize toggled
│   ├── handleWidthInput()      → Width changed
│   ├── handleHeightInput()     → Height changed
│   └── toggleAspectLock()      → Lock/unlock aspect
│
├── Edit Operations
│   ├── rotate()                → Rotate image
│   ├── flipHorizontal()        → Flip H
│   ├── flipVertical()          → Flip V
│   ├── openCropModal()         → Open crop UI
│   └── applyCrop()             → Apply crop
│
├── UI Updates
│   ├── updateQueueUI()         → Update queue display
│   ├── updateConvertButton()   → Update button text
│   ├── updateEditIndicators()  → Update edit buttons
│   └── updateEstimates()       → Update size estimates
│
├── Drag & Drop
│   ├── handleDragOver()        → Drag over
│   ├── handleFileDrop()        → File dropped
│   ├── handleDragStart()       → Drag started
│   └── handleDrop()            → Reorder drop
│
└── Utilities
    ├── saveSettings()          → Persist settings
    ├── loadSettings()          → Load settings
    ├── resetApp()              → Reset to initial
    └── showPreview()           → Preview conversion
```

## 🔗 Event Flow Example

### Example: User Uploads Files

```
1. User drops files
        ↓
2. handleFileDrop() in AppController
        ↓
3. addFiles() in AppController
        ↓
4. FileService.createFileItem() for each file
        ↓
5. FileService.generateThumbnail() (async)
        ↓
6. appState.addFiles(items)
        ↓
7. State notifies observers
        ↓
8. updateQueueUI() in AppController
        ↓
9. FileQueueUI.render(queue)
        ↓
10. UI updated with new files
```

### Example: User Converts Images

```
1. User clicks Convert
        ↓
2. processBatch() in AppController
        ↓
3. Get settings from appConfig
        ↓
4. Get editState from appState
        ↓
5. Loop through each file:
    ├─ ConversionService.convertImage()
    ├─ appState.updateFile() (progress)
    └─ Update UI
        ↓
6. DownloadService.downloadResults()
        ↓
7. Toast notification
```

## 🎯 Separation of Concerns

```
┌─────────────────────────────────────────┐
│         WHAT EACH LAYER KNOWS           │
├─────────────────────────────────────────┤
│ UI Components:                          │
│   ✓ DOM manipulation                    │
│   ✓ Event handling (internal)           │
│   ✗ Business logic                      │
│   ✗ State management                    │
├─────────────────────────────────────────┤
│ Services:                               │
│   ✓ Business logic                      │
│   ✓ Data transformation                 │
│   ✗ DOM access                          │
│   ✗ State management                    │
├─────────────────────────────────────────┤
│ State:                                  │
│   ✓ Data storage                        │
│   ✓ Change notification                 │
│   ✗ Business logic                      │
│   ✗ UI updates                          │
├─────────────────────────────────────────┤
│ Controller:                             │
│   ✓ Orchestration                       │
│   ✓ Event routing                       │
│   ✓ Coordinates all layers              │
│   ✓ Knows about everything              │
└─────────────────────────────────────────┘
```

## 🚀 Key Benefits Visualization

```
OLD ARCHITECTURE (script.js - 1406 lines)
┌────────────────────────────────────────┐
│                                        │
│  Everything in one giant file          │
│                                        │
│  • Hard to find bugs 🐛               │
│  • Difficult to test 🧪               │
│  • Merge conflicts 💥                 │
│  • Can't reuse code ♻️                │
│                                        │
└────────────────────────────────────────┘

NEW ARCHITECTURE (11 focused modules)
┌──────────┬──────────┬──────────┬──────────┐
│  Core    │ Services │    UI    │Controller│
│          │          │          │          │
│ • Clear  │ • Testable│• Reusable│• Focused│
│ • Simple │ • Isolated│• Clean   │• Simple │
│          │          │          │          │
└──────────┴──────────┴──────────┴──────────┘

Benefits:
✓ Easy to find and fix bugs
✓ Simple to add features
✓ Team collaboration friendly
✓ Each module is testable
✓ Professional structure
```

## 📖 Learning Path

```
Beginner → Intermediate → Advanced
    ↓           ↓            ↓
Read        Modify       Create
README      existing     new
    ↓       modules      features
    ↓           ↓            ↓
Follow      Add          Design
Quick       simple       new
Reference   features     modules
```

Start here: **QUICK_REFERENCE.md** → **ARCHITECTURE.md** → **Code**
