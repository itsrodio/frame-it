import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { Button } from '@/components/ui/button';

export default defineContentScript({
	matches: ['<all_urls>'],
	cssInjectionMode: 'ui',

	async main(ctx) {
		const ui = await createShadowRootUi(ctx, {
			name: 'frame-it-root',
			position: 'inline',
			anchor: 'body',
			append: 'last',
			onMount: (container) => {
				const root = ReactDOM.createRoot(container);
				root.render(
					<div className="fixed bottom-4 right-4 z-[2147483647]">
						<Button
							variant="default"
							onClick={() => console.log('frame-it triggered')}
						>
							Toggle Grid
						</Button>
					</div>,
				);
				return root;
			},
			onRemove: (root) => {
				root?.unmount();
			},
		});

		ui.mount();
	},
});
