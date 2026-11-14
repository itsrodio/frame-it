export default defineBackground(() => {
	browser.action.onClicked.addListener(async (tab) => {
		if (!tab.id) return;

		try {
			await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_OVERLAY' });
		} catch {
			try {
				await browser.scripting.executeScript({
					target: { tabId: tab.id },
					files: ['/content-scripts/content.js'],
				});
			} catch {
				// Cannot inject scripts into restricted pages (e.g., chrome://, edge://, Chrome Web Store)
			}
		}
	});
});
