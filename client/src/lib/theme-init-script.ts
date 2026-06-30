import {
  IDEADILUCE_THEME_KEY,
  LEGACY_STORAGE_KEYS,
} from '@/lib/storage-keys'

/** Script inline (beforeInteractive) per evitare flash di tema al primo paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(IDEADILUCE_THEME_KEY)});if(!t){var l=${JSON.stringify(LEGACY_STORAGE_KEYS[IDEADILUCE_THEME_KEY])};for(var i=0;i<l.length;i++){var v=localStorage.getItem(l[i]);if(v!=null){t=v;localStorage.setItem(${JSON.stringify(IDEADILUCE_THEME_KEY)},v);localStorage.removeItem(l[i]);break}}}if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t==='dark'?'dark':'light'}else if(t==='classic'){delete document.documentElement.dataset.theme;document.documentElement.style.colorScheme='light'}else{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}}catch(e){}})();`
