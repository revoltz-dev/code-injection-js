document.addEventListener('DOMContentLoaded', () => {
  const exportDataButton = document.getElementById('export-data');
  const importDataButton = document.getElementById('import-data');
  const importFileInput = document.getElementById('import-file');
  const clearDataButton = document.getElementById('clear-data');
  const themeToggleSwitch = document.getElementById('theme-toggle');
  const themeStatus = document.getElementById('theme-status');
  const syncToggleSwitch = document.getElementById('sync-toggle');
  const syncStatus = document.getElementById('sync-status');
  const syncNowButton = document.getElementById('sync-now');
  const syncStatusButton = document.getElementById('sync-status-btn');
  const syncInfo = document.getElementById('sync-info');
  const syncInfoContent = document.getElementById('sync-info-content');

  initTheme();
  initSync();

  exportDataButton.addEventListener('click', async () => {
    try {
      const data = await chrome.storage.local.get(['scripts', 'darkMode']);
      const scripts = data.scripts || {};
      const darkMode = data.darkMode;

      const exportData = {
        version: 1,
        scripts,
        theme: darkMode,
        exportDate: Date.now()
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code-injection-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      showMessage('Dados exportados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      showMessage('Falha ao exportar dados, tente novamente.', 'error');
    }
  });

  importDataButton.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    try {
      const fileContent = await readFileAsText(file);
      const importData = JSON.parse(fileContent);

      if (!importData.scripts || typeof importData.scripts !== 'object') {
        throw new Error('Formato de dados inválido');
      }

      if (confirm('A importação irá sobrescrever os dados de scripts existentes. Tem certeza de que deseja continuar?')) {
        const dataToSave = { scripts: importData.scripts };

        const themeValue = importData.theme !== undefined ? importData.theme : importData.darkMode;
        if (themeValue !== undefined) {
          dataToSave.darkMode = themeValue;
        }

        await chrome.storage.local.set(dataToSave);

        if (themeValue !== undefined) {
          applyTheme(themeValue);
          themeToggleSwitch.checked = themeValue;
          updateThemeStatusText(themeValue);
          updateThemeHeaderButton(themeValue);
        }

        showMessage('Dados importados com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      showMessage(`Falha na importação: ${error.message}`, 'error');
    }

    importFileInput.value = '';
  });

  clearDataButton.addEventListener('click', async () => {
    if (confirm('Tem certeza de que deseja excluir todos os scripts? Esta ação não pode ser desfeita.')) {
      try {
        await chrome.storage.local.set({ scripts: {} });
        showMessage('Todos os scripts foram limpos!', 'success');
      } catch (error) {
        console.error('Erro ao limpar dados:', error);
        showMessage('Falha ao limpar dados, tente novamente.', 'error');
      }
    }
  });

  function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    document.body.appendChild(messageElement);

    setTimeout(() => {
      messageElement.style.opacity = '0';
      setTimeout(() => messageElement.remove(), 500);
    }, 3000);
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  function initTheme() {
    chrome.storage.local.get('darkMode', (data) => {
      let isDarkMode;
      if (data.darkMode === undefined) {
        isDarkMode = true;
        chrome.storage.local.set({ darkMode: true });
      } else {
        isDarkMode = data.darkMode === true;
      }
      applyTheme(isDarkMode);
      themeToggleSwitch.checked = isDarkMode;
      updateThemeStatusText(isDarkMode);
    });

    themeToggleSwitch.addEventListener('change', toggleTheme);
  }

  function updateThemeHeaderButton(isDarkMode) {
    const themeToggleBtn = document.getElementById('toggle-theme-header');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = isDarkMode ? '<span>☀️</span>' : '<span>🌙</span>';
      themeToggleBtn.title = isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    }
  }

  function applyTheme(isDark) {
    const headerIcon = document.getElementById('header-icon');

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (headerIcon) {
        headerIcon.src = 'images/code-injection[dark].png';
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (headerIcon) {
        headerIcon.src = 'images/code-injection[light].png';
      }
    }

    updateThemeHeaderButton(isDark);
  }

  function updateThemeStatusText(isDarkMode) {
    themeStatus.textContent = isDarkMode ? 'Ligado' : 'Desligado';
  }

  function toggleTheme() {
    const isDarkMode = themeToggleSwitch.checked;
    applyTheme(isDarkMode);
    updateThemeStatusText(isDarkMode);
    chrome.storage.local.set({ darkMode: isDarkMode });
    updateThemeHeaderButton(isDarkMode);
  }

  const headerIcon = document.getElementById('header-icon');
  if (headerIcon) {
    headerIcon.addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
    });
  }

  const backBtn = document.getElementById('back-header');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
    });
  }

  const themeToggleBtn = document.getElementById('toggle-theme-header');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      themeToggleSwitch.checked = !themeToggleSwitch.checked;
      toggleTheme();
    });
  }

  chrome.storage.local.get('darkMode', (data) => {
    const isDarkMode = data.darkMode !== false;
    updateThemeHeaderButton(isDarkMode);
  });

  async function initSync() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSyncStatus' });
      if (response && response.success) {
        const status = response.status;
        syncToggleSwitch.checked = status.autoSyncEnabled;
        updateSyncStatusText(status.autoSyncEnabled);
      } else {
        const data = await chrome.storage.local.get(['syncSettings']);
        const settings = data.syncSettings || { autoSync: true };
        syncToggleSwitch.checked = settings.autoSync !== false;
        updateSyncStatusText(settings.autoSync !== false);
      }
    } catch (error) {
      console.error('Erro ao inicializar sincronização:', error);
      syncToggleSwitch.checked = true;
      updateSyncStatusText(true);
    }

    syncToggleSwitch.addEventListener('change', toggleSync);
    syncNowButton.addEventListener('click', syncNow);
    syncStatusButton.addEventListener('click', showSyncStatus);
  }

  function updateSyncStatusText(isEnabled) {
    syncStatus.textContent = isEnabled ? 'Ligado' : 'Desligado';
  }

  async function toggleSync() {
    const isEnabled = syncToggleSwitch.checked;
    updateSyncStatusText(isEnabled);

    try {
      const data = await chrome.storage.local.get(['syncSettings']);
      const currentSettings = data.syncSettings || {
        autoSync: true,
        syncInterval: 10 * 60 * 1000,
        syncProvider: 'chrome'
      };

      const newSettings = {
        ...currentSettings,
        autoSync: isEnabled
      };

      await chrome.storage.local.set({ syncSettings: newSettings });

      chrome.runtime.sendMessage({
        action: 'updateSyncSettings',
        settings: newSettings
      });

      showMessage(
        isEnabled
          ? 'Sincronização automática habilitada!'
          : 'Sincronização automática desabilitada!',
        'success'
      );
    } catch (error) {
      console.error('Erro ao alterar configuração de sincronização:', error);
      showMessage('Falha ao alterar configuração de sincronização.', 'error');
      syncToggleSwitch.checked = !isEnabled;
      updateSyncStatusText(!isEnabled);
    }
  }

  async function syncNow() {
    syncNowButton.disabled = true;
    syncNowButton.textContent = 'Sincronizando...';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'syncNow' });

      if (response && response.success) {
        const result = response.result;
        let message = 'Sincronização concluída!';

        if (result.direction === 'cloud_to_local') {
          message += ` ${result.changes.scripts} script(s) baixado(s) da nuvem.`;
        } else if (result.direction === 'local_to_cloud') {
          message += ` ${result.changes.scripts} script(s) enviado(s) para a nuvem.`;
        }

        if (result.dataTooLarge) {
          message += ' (Nota: Alguns dados não foram sincronizados devido ao limite de tamanho)';
        }

        showMessage(message, 'success');
      } else {
        throw new Error(response?.error || 'Falha na sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      showMessage(`Falha na sincronização: ${error.message}`, 'error');
    } finally {
      syncNowButton.disabled = false;
      syncNowButton.textContent = 'Sincronizar Agora';
    }
  }

  async function showSyncStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSyncStatus' });

      if (response && response.success) {
        const status = response.status;
        let infoHtml = '<strong>Status da Sincronização</strong><br><br>';

        infoHtml += `Sincronização Automática: <strong>${status.autoSyncEnabled ? 'Habilitada' : 'Desabilitada'}</strong><br>`;
        infoHtml += `Provedor: <strong>${status.syncProvider || 'Chrome Sync'}</strong><br>`;

        if (status.lastSyncTime) {
          const lastSync = new Date(status.lastSyncTime);
          infoHtml += `Última Sincronização: <strong>${lastSync.toLocaleString('pt-BR')}</strong><br>`;
        } else {
          infoHtml += `Última Sincronização: <strong>Nunca</strong><br>`;
        }

        if (status.timeUntilNextSync !== null && status.autoSyncEnabled) {
          const minutes = Math.floor(status.timeUntilNextSync / 60000);
          const seconds = Math.floor((status.timeUntilNextSync % 60000) / 1000);
          infoHtml += `Próxima Sincronização: <strong>${minutes}min ${seconds}s</strong><br>`;
        }

        syncInfoContent.innerHTML = infoHtml;
        syncInfo.style.display = 'block';

        setTimeout(() => {
          syncInfo.style.display = 'none';
        }, 5000);
      } else {
        throw new Error(response?.error || 'Falha ao obter status');
      }
    } catch (error) {
      console.error('Erro ao obter status de sincronização:', error);
      showMessage(`Falha ao obter status: ${error.message}`, 'error');
    }
  }
}); 