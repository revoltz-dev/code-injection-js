# Code Injection

A powerful Chromium-based browser extension that lets you inject custom JavaScript into any website. Built for developers, testers, and power users who need to modify or extend the behavior of web pages.

<img width="511" height="812" alt="image" src="https://github.com/user-attachments/assets/90529a31-c32d-456f-87a4-cbf9b877ef1c" />

## 📋 Description

**Code Injection** is a Manifest V3 extension compatible with several browsers that provides a full interface to create, manage, and run custom JavaScript on specific sites. With an advanced code editor, a sync system, and multiple injection methods, this tool is great for:

- **Developers**: test changes on websites without editing the source code
- **Testers**: build custom automation and test scripts
- **Power users**: customize the browsing experience on any site
- **Researchers**: analyze and tweak how web pages behave

## ✨ Features

### 🎯 Code Injection
- **Auto-run**: scripts are injected automatically when you visit a matching site
- **Manual run**: full control over when your scripts execute
- **Multiple injection methods**: a robust system with fallbacks so the code runs even on sites with strict Content Security Policies (CSP)
- **Wildcard support**: use patterns like `*.example.com` to apply scripts across multiple subdomains

### 📝 Code Editor
- **CodeMirror integration**: professional code editor with syntax highlighting
- **Autocomplete**: smart JavaScript suggestions (can be toggled on/off)
- **Code formatting**: format your code in one click
- **Line numbers**: easier navigation in long scripts
- **Themes**: light and dark (Monokai) modes for the best visual experience

### 🗂️ Script Management
- **Management interface**: see all your scripts in an organized table
- **Search and filters**: quickly find scripts by name or domain
- **Enable/disable**: toggle scripts on and off without deleting them
- **Quick editing**: edit scripts straight from the popup or open the full editor
- **History**: see when each script was created and last updated

### 🔄 Sync
- **Data sync**: sync your scripts across devices using browser sync
- **Auto sync**: keep your data up to date automatically
- **Manual sync**: force a sync whenever you need
- **Sync status**: monitor the status and time until the next sync

### 💾 Backup & Restore
- **Export**: export all your scripts to a JSON file
- **Import**: restore scripts from a previous backup
- **Clear all**: remove every script at once (with confirmation)

### 🎨 Customization
- **Dark/Light theme**: easy toggle between themes
- **Persisted preferences**: your settings are saved automatically

## 🚀 Installation

### Manual installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/revoltz-dev/code-injection-js.git
   cd code-injection-js
   ```

2. **Open your browser and go to Extensions**
   - **Chrome/Edge/Brave**: type `chrome://extensions/` in the address bar
   - **Opera**: type `opera://extensions/` in the address bar
   - Or go to Menu → More tools → Extensions

3. **Enable Developer Mode**
   - In the top right corner, turn on the "Developer mode" toggle

4. **Load the extension**
   - Click "Load unpacked"
   - Select the project folder (`code-injection-js`)

5. **Done!**
   - The extension is installed and ready to use
   - Look for the icon in the browser's toolbar

## 📖 How to use

### Creating a script

1. **From the popup**:
   - Click the extension icon in the toolbar
   - Click "Add Script" or "Create Script"
   - Type the site's domain (e.g., `example.com` or `*.example.com`)
   - Write your JavaScript code
   - Save the script

2. **From the manager**:
   - Open the popup and click "Manage Scripts"
   - Click "Add New"
   - Fill in the fields and save

### Editing a script

- **From the popup**: click "Edit Script" while on a site with an active script
- **From the manager**: click the "Edit" button in the scripts table
- **Inline in the popup**: use the inline editor for quick edits

### Run mode

- **Automatic**: the script runs automatically when you visit the site
- **Manual**: the script only runs when you click "Run Manually"

### Managing scripts

- **Enable/disable**: use the toggle in the scripts table or in the popup
- **Search**: type in the search bar to filter scripts
- **Delete**: click the "Delete" button (with confirmation)

## 🛠️ Project structure

```
code-injection-js/
├── background.js          # Service worker (main injection logic)
├── popup.html/js          # Popup UI
├── editor.html/js         # Full script editor
├── manager.html/js        # Script manager
├── options.html/js        # Options/settings page
├── sync.js                # Sync system
├── manifest.json          # Extension manifest
├── injected-scripts/      # Scripts injected into pages
│   ├── injector.js        # Auxiliary injection script
│   └── executor.js        # Script executor
├── lib/                   # External libraries
│   └── codemirror/        # CodeMirror editor
└── images/                # Icons and images
```

## 🔧 Tech stack

- **Manifest V3**: latest extension API version
- **CodeMirror**: JavaScript code editor
- **Storage API**: local storage and sync
- **Scripting API**: script injection into web pages
- **Vanilla JavaScript**: no heavy external dependencies

## 🔒 Security & Privacy

- **Local storage**: your scripts are stored locally in the browser
- **No telemetry**: the extension does not collect or send data to external servers
- **Optional sync**: sync is opt-in and controlled by the user
- **Minimal permissions**: only the permissions strictly required to work are requested

## ⚠️ Important notes

- **Use responsibly**: injecting code into websites can change behavior in unexpected ways
- **Test first**: always test your scripts in safe environments before using in production
- **Regular backups**: back up your scripts regularly using the export feature
- **Compatibility**: some sites with very strict security policies may block injection

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
