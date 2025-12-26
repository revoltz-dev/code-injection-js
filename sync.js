let autoSyncEnabled = true;
let syncIntervalId = null;
let lastSyncTime = 0;
const DEFAULT_SYNC_INTERVAL = 10 * 60 * 1000;

async function initSync() {
  console.log('Inicializando módulo de sincronização...');

  const settings = await getSyncSettings();
  autoSyncEnabled = settings.autoSync;

  if (autoSyncEnabled) {
    startAutoSync(settings.syncInterval);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateSyncSettings') {
      handleSyncSettingsUpdate(message.settings);
      sendResponse({ success: true });
      return false;
    } else if (message.action === 'syncNow') {
      syncData()
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    } else if (message.action === 'getSyncStatus') {
      getSyncStatus()
        .then(status => sendResponse({ success: true, status }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    return false;
  });

  if (autoSyncEnabled) {
    setTimeout(() => syncData(), 5000);
  }
}

function handleSyncSettingsUpdate(settings) {
  console.log('Configurações de sincronização atualizadas:', settings);
  autoSyncEnabled = settings.autoSync;

  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }

  if (autoSyncEnabled) {
    startAutoSync(settings.syncInterval);
  }
}

function startAutoSync(interval = DEFAULT_SYNC_INTERVAL) {
  const syncInterval = Math.max(interval, 60000);

  console.log(`Configurando sincronização automática, intervalo: ${syncInterval}ms`);

  syncIntervalId = setInterval(() => {
    syncData().catch(error => {
      console.error('Erro na sincronização automática:', error);
    });
  }, syncInterval);
}

async function getSyncSettings() {
  const data = await chrome.storage.local.get(['syncSettings']);
  const defaultSettings = {
    autoSync: true,
    syncInterval: DEFAULT_SYNC_INTERVAL,
    syncProvider: 'chrome',
    lastSyncTime: 0
  };

  return data.syncSettings || defaultSettings;
}

async function saveSyncSettings(settings) {
  return chrome.storage.local.set({
    syncSettings: {
      ...await getSyncSettings(),
      ...settings
    }
  });
}

async function getSyncStatus() {
  const settings = await getSyncSettings();
  const now = Date.now();

  return {
    autoSyncEnabled: autoSyncEnabled,
    lastSyncTime: settings.lastSyncTime,
    nextSyncTime: autoSyncEnabled ? (settings.lastSyncTime + settings.syncInterval) : null,
    timeUntilNextSync: autoSyncEnabled ? Math.max(0, (settings.lastSyncTime + settings.syncInterval) - now) : null,
    syncProvider: settings.syncProvider
  };
}

async function syncData() {
  console.log('Iniciando sincronização de dados...');

  try {
    const settings = await getSyncSettings();
    const provider = settings.syncProvider;

    let result;
    if (provider === 'chrome') {
      result = await syncWithChromeSync();
    } else {
      throw new Error(`Provedor de sincronização não suportado: ${provider}`);
    }

    await saveSyncSettings({
      lastSyncTime: Date.now()
    });

    console.log('Sincronização de dados concluída:', result);
    return result;
  } catch (error) {
    console.error('Falha na sincronização de dados:', error);
    throw error;
  }
}

async function syncWithChromeSync() {
  const localData = await chrome.storage.local.get(['scripts', '_disabledScripts', 'darkMode']);
  const cloudData = await chrome.storage.sync.get(['scripts', '_disabledScripts', 'theme', 'lastSyncTimestamp']);

  const localTimestamp = (await chrome.storage.local.get(['lastSyncTimestamp'])).lastSyncTimestamp || 0;
  const cloudTimestamp = cloudData.lastSyncTimestamp || 0;

  const mergeResult = {
    direction: null,
    changes: {
      scripts: 0,
      disabled_scripts: 0
    }
  };

  let mergedScripts = {};
  let mergedDisabledScripts = {};

  if (cloudTimestamp > localTimestamp) {
    console.log('Dados da nuvem atualizados, sincronizando da nuvem para local');
    mergeResult.direction = 'cloud_to_local';

    mergedScripts = { ...(localData.scripts || {}), ...(cloudData.scripts || {}) };
    mergedDisabledScripts = { ...(localData._disabledScripts || {}), ...(cloudData._disabledScripts || {}) };

    mergeResult.changes.scripts = Object.keys(cloudData.scripts || {}).length;
    mergeResult.changes.disabled_scripts = Object.keys(cloudData._disabledScripts || {}).length;

    const localDataToSave = {
      scripts: mergedScripts,
      _disabledScripts: mergedDisabledScripts,
      lastSyncTimestamp: Date.now()
    };

    const themeValue = cloudData.theme !== undefined ? cloudData.theme : cloudData.darkMode;
    if (themeValue !== undefined) {
      localDataToSave.darkMode = themeValue;
    }

    await chrome.storage.local.set(localDataToSave);
  } else {
    console.log('Dados locais atualizados ou primeira sincronização, sincronizando do local para a nuvem');
    mergeResult.direction = 'local_to_cloud';

    mergedScripts = localData.scripts || {};
    mergedDisabledScripts = localData._disabledScripts || {};

    mergeResult.changes.scripts = Object.keys(mergedScripts).length;
    mergeResult.changes.disabled_scripts = Object.keys(mergedDisabledScripts).length;

    try {
      const dataToSync = {
        scripts: mergedScripts,
        _disabledScripts: mergedDisabledScripts
      };

      if (localData.darkMode !== undefined) {
        dataToSync.theme = localData.darkMode;
      }

      const dataStr = JSON.stringify(dataToSync);

      if (dataStr.length > 100000) {
        console.warn('Dados muito grandes, excedendo limite de armazenamento de sincronização do Chrome, sincronizando apenas lista de scripts desabilitados');
        const minimalData = {
          _disabledScripts: mergedDisabledScripts,
          lastSyncTimestamp: Date.now()
        };
        if (localData.darkMode !== undefined) {
          minimalData.theme = localData.darkMode;
        }
        await chrome.storage.sync.set(minimalData);
        mergeResult.dataTooLarge = true;
      } else {
        await chrome.storage.sync.set({
          ...dataToSync,
          lastSyncTimestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Falha ao salvar no armazenamento de sincronização do Chrome:', error);
      if (error.message.includes('QUOTA_BYTES')) {
        const minimalData = {
          _disabledScripts: mergedDisabledScripts,
          lastSyncTimestamp: Date.now()
        };
        if (localData.darkMode !== undefined) {
          minimalData.theme = localData.darkMode;
        }
        await chrome.storage.sync.set(minimalData);
        mergeResult.dataTooLarge = true;
      } else {
        throw error;
      }
    }
  }

  return mergeResult;
}

const CodeInjectionSync = {
  init: initSync,
  syncNow: syncData,
  getStatus: getSyncStatus,
  getSettings: getSyncSettings,
  saveSettings: saveSyncSettings
};

if (typeof self !== 'undefined') {
  self.CodeInjectionSync = CodeInjectionSync;
}
if (typeof window !== 'undefined') {
  window.CodeInjectionSync = CodeInjectionSync;
} 