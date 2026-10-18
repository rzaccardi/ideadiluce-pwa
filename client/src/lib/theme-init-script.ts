/**
 * Script inline (beforeInteractive) per evitare flash di tema al primo paint.
 * Allinea tema e luci prodotto: preferenza salvata → altrimenti prefers-color-scheme.
 * Scrive anche data-lights così lo store può allinearsi senza aspettare un round-trip React.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=window.localStorage;var lights=s.getItem('ideadiluce:product-lights');var dark;if(lights==='1')dark=true;else if(lights==='0')dark=false;else{var t=s.getItem('ideadiluce:theme')||s.getItem('idl-theme');if(t==='dark')dark=true;else if(t==='light')dark=false;else dark=window.matchMedia('(prefers-color-scheme: dark)').matches}var root=document.documentElement;root.dataset.theme=dark?'dark':'light';root.dataset.lights=dark?'on':'off';root.style.colorScheme=dark?'dark':'light'}catch(e){}})();`
