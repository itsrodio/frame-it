import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
	manifest: {
		name: 'FrameIt',
		description:
			'Overlay customizable column, row, and pixel layout grids onto any live website.',
		permissions: ['activeTab', 'scripting'],
		action: {},
		web_accessible_resources: [
			{
				resources: ['content-scripts/*.css'],
				matches: ['<all_urls>'],
			},
		],
	},
	srcDir: 'src',
	modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
	vite: () => ({
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
	}),
});
