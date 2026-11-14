import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { App } from '@/App';

export default defineContentScript({
	registration: 'runtime',
	cssInjectionMode: 'ui',

	async main(ctx) {
		let isMounted = false;

		const closeOverlay = () => {
			if (!isMounted) return;
			ui.remove();
			isMounted = false;
		};

		const ui = await createShadowRootUi(ctx, {
			name: 'frameit-overlay',
			position: 'overlay',
			zIndex: 2147483647,
			onMount: (container) => {
				// Создаем обертку для React внутри Shadow DOM
				const wrapper = document.createElement('div');
				wrapper.id = 'frameit-root';
				// Задаем тему синхронно до вставки в DOM, чтобы избежать моргания (FOUC)
				wrapper.classList.add(
					window.matchMedia('(prefers-color-scheme: dark)').matches
						? 'dark'
						: 'light',
				);
				container.append(wrapper);

				const root = ReactDOM.createRoot(wrapper);
				// Передаем wrapper в App, чтобы Portal'ы (Tooltip/Dropdown) рендерились внутри Shadow DOM
				root.render(<App portalContainer={wrapper} onClose={closeOverlay} />);
				return root;
			},
			onRemove: (root) => {
				root?.unmount();
			},
		});

		ui.mount();
		isMounted = true;

		browser.runtime.onMessage.addListener((msg) => {
			if (msg.type === 'TOGGLE_OVERLAY') {
				if (isMounted) {
					closeOverlay();
				} else {
					ui.mount();
					isMounted = true;
				}
			}
		});
	},
});
