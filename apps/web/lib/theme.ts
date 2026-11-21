export type ThemeMode = 'light' | 'dark' | 'system'

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system']

export const THEME_STORAGE_KEY = 'site-theme'

export const THEME_COLOR = { light: '#f9fafb', dark: '#0a0a0f' } as const

export const DARK_QUERY = '(prefers-color-scheme: dark)'

export const FORCED_THEME_COLOR_ID = 'theme-color-forced'

export const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');if(m!=='light'&&m!=='dark')return;document.documentElement.dataset.theme=m;var e=document.createElement('meta');e.name='theme-color';e.id='${FORCED_THEME_COLOR_ID}';e.content=m==='dark'?'${THEME_COLOR.dark}':'${THEME_COLOR.light}';document.head.prepend(e)}catch(e){}})()`
