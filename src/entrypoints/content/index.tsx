import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { App } from '@/App';
import { loadExtensionSettings } from '@/lib/settings-storage';

declare global {
  interface Window {
    __frameItInjected?: boolean;
  }
}

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'ui',

  async main(ctx) {
    if (window.__frameItInjected) return;
    window.__frameItInjected = true;

    await loadExtensionSettings();

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
        // Create React wrapper inside Shadow DOM
        const wrapper = document.createElement('div');
        wrapper.id = 'frameit-root';
        // Set the theme synchronously before insertion into the DOM to avoid a flash of unstyled content (FOUC).
        wrapper.classList.add(
          window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light',
        );
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);
        // Pass the wrapper to App so Portals (Tooltip/Popover/Select/DropdownMenu) render inside the Shadow DOM.
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
      if (msg?.type === 'TOGGLE_OVERLAY') {
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
