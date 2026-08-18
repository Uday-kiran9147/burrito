const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('burritoAPI', {
    processFiles: (payload) => ipcRenderer.invoke('process-files', payload),
    determineMediaType: (filePaths) => ipcRenderer.invoke('determine-media-type', filePaths),
    getAutoLaunchStatus: () => ipcRenderer.invoke('get-auto-launch-status'),
    toggleAutoLaunch: (enable) => ipcRenderer.invoke('toggle-auto-launch', enable),
    setPinned: (isPinned) => ipcRenderer.invoke('set-pinned', isPinned),
    getPinnedStatus: () => ipcRenderer.invoke('get-pinned-status')
});
