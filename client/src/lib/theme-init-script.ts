/** Script inline (beforeInteractive) per evitare flash di tema al primo paint. Segue `prefers-color-scheme`. */
export const THEME_INIT_SCRIPT = `(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})();`
