/**
 * Script inline (beforeInteractive) per evitare flash di tema al primo paint.
 * Allinea tema e luci prodotto: preferenza salvata → altrimenti prefers-color-scheme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=window.localStorage;var lights=s.getItem('ideadiluce:product-lights');var dark;if(lights==='1')dark=true;else if(lights==='0')dark=false;else{var t=s.getItem('ideadiluce:theme')||s.getItem('idl-theme');if(t==='dark')dark=true;else if(t==='light')dark=false;else dark=window.matchMedia('(prefers-color-scheme: dark)').matches}document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light'}catch(e){}})();`
