// Popup script for extension popup
document.addEventListener('DOMContentLoaded', async () => {
    const elements = {
        newTabBtn: document.getElementById('newTabBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        status: document.getElementById('status')
    };

    // Check if API key is configured
    const settings = await chrome.storage.sync.get(['unsplashApiKey']);
    if (settings.unsplashApiKey) {
        elements.status.textContent = 'API key configured ✓';
    }

    // Event listeners
    elements.newTabBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://newtab/' });
        window.close();
    });

    elements.refreshBtn.addEventListener('click', async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        if (currentTab.url.includes('newtab')) {
            chrome.tabs.reload(currentTab.id);
            elements.status.textContent = 'Tab refreshed!';
        } else {
            elements.status.textContent = 'Please open a new tab first';
        }
        
        setTimeout(() => window.close(), 1000);
    });

    elements.settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });
});