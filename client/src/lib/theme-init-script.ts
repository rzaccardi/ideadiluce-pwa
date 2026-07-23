import {
  IDEADILUCE_THEME_KEY,
  LEGACY_STORAGE_KEYS,
} from '@/lib/storage-keys'

/** Script inline (beforeInteractive) per evitare flash di tema al primo paint. Solo `light` (nero) e `dark` (scuro). */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(IDEADILUCE_THEME_KEY)});if(!t){var l=${JSON.stringify(LEGACY_STORAGE_KEYS[IDEADILUCE_THEME_KEY])};for(var i=0;i<l.length;i++){var v=localStorage.getItem(l[i]);if(v!=null){t=v;localStorage.setItem(${JSON.stringify(IDEADILUCE_THEME_KEY)},v);localStorage.removeItem(l[i]);break}}}if(t==='classic'){t='light';localStorage.setItem(${JSON.stringify(IDEADILUCE_THEME_KEY)},'light')}if(t==='dark'){document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'}else{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}}catch(e){}})();`
