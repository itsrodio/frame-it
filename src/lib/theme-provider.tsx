import {
	createContext,
	type ReactNode,
	useContext,
	useLayoutEffect,
	useState,
} from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
	children: ReactNode;
	defaultTheme?: Theme;
	container: HTMLElement;
}

interface ThemeProviderState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: 'system',
	setTheme: () => null,
});

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	container,
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);

	useLayoutEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const applyTheme = () => {
			container.classList.remove('light', 'dark');

			const resolvedTheme =
				theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;

			container.classList.add(resolvedTheme);
		};

		applyTheme();

		if (theme === 'system') {
			mediaQuery.addEventListener('change', applyTheme);
			return () => mediaQuery.removeEventListener('change', applyTheme);
		}
	}, [theme, container]);

	return (
		<ThemeProviderContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
