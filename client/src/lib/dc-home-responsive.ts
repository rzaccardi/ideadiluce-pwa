/** Responsive home layout — allinea il template desktop al mock mobile via CSS. */
export const DC_HOME_RESPONSIVE_CSS = `
[data-dc-static-root][data-dc-home] {
  --dc-home-chrome-top: 52px;
}

@media (max-width: 1023px) {
  [data-dc-static-root][data-dc-home] {
    display: flex;
    flex-direction: column;
  }

  /* Search sticky sotto header, prima dell'hero */
  [data-dc-static-root][data-dc-home] [data-dc-section="search"] {
    order: -1;
    position: sticky;
    top: var(--dc-home-chrome-top);
    z-index: 20;
    border-bottom: 1px solid #e4e3de;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="search"] > div {
    max-width: none !important;
    padding: 0 16px 12px !important;
    text-align: left !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="search"] > div > div:nth-child(1),
  [data-dc-static-root][data-dc-home] [data-dc-section="search"] > div > div:nth-child(2),
  [data-dc-static-root][data-dc-home] [data-dc-section="search"] > div > div:nth-child(4) {
    display: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="search"] > div > div:nth-child(3) {
    gap: 8px !important;
    padding: 6px 6px 6px 14px !important;
    border-radius: 8px !important;
    box-shadow: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="search"] > div > div:nth-child(3) > span:first-child {
    font-size: 13.5px !important;
    text-align: left !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="search"] > div > div:nth-child(3) > span:last-child {
    font-size: 13px !important;
    padding: 9px 16px !important;
    border-radius: 6px !important;
    flex-shrink: 0;
  }

  /* Sezioni desktop-only nascoste su mobile */
  [data-dc-static-root][data-dc-home] [data-dc-section="sockets"],
  [data-dc-static-root][data-dc-home] [data-dc-section="rooms"],
  [data-dc-static-root][data-dc-home] [data-dc-section="brands"],
  [data-dc-static-root][data-dc-home] [data-dc-section="guides"],
  [data-dc-static-root][data-dc-home] [data-dc-section="professionals"],
  [data-dc-static-root][data-dc-home] [data-dc-section="expressions"],
  [data-dc-static-root][data-dc-home] [data-dc-section="blog"],
  [data-dc-static-root][data-dc-home] [data-dc-section="newsletter"],
  [data-dc-static-root][data-dc-home] [data-dc-section="trust"],
  [data-dc-static-root][data-dc-home] [data-dc-section="embedded-footer"] {
    display: none !important;
  }

  /* Hero impilato */
  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] {
    display: grid !important;
    grid-template-columns: 1fr !important;
    border-bottom: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child {
    padding: 34px 22px 32px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child > div[style*="radial-gradient"] {
    top: -60px !important;
    right: -50px !important;
    width: 300px !important;
    height: 300px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child > div:last-child {
    max-width: none !important;
    margin-left: 0 !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child > div:last-child > div:nth-child(1) {
    font-size: 10.5px !important;
    margin-bottom: 14px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child > div:last-child > div:nth-child(2) {
    font-size: 31px !important;
    margin-bottom: 12px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child > div:last-child > div:nth-child(3) {
    font-size: 14.5px !important;
    line-height: 1.5 !important;
    margin-bottom: 20px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child > div:last-child > a {
    font-size: 14.5px !important;
    padding: 13px 20px !important;
    border-radius: 4px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:first-child > div:last-child > div:nth-child(5) {
    font-size: 10.5px !important;
    margin-top: 22px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:last-child {
    padding: 34px 22px 32px !important;
    border-left: none !important;
    border-bottom: 1px solid #ededea !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:last-child > div > div:nth-child(1) {
    font-size: 10.5px !important;
    margin-bottom: 14px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:last-child > div > div:nth-child(2) {
    font-size: 28px !important;
    margin-bottom: 12px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:last-child > div > div:nth-child(3) {
    font-size: 14.5px !important;
    line-height: 1.5 !important;
    margin-bottom: 20px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:last-child > div > a {
    font-size: 14.5px !important;
    padding: 13px 20px !important;
    border-radius: 6px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:last-child > div > div:last-child {
    gap: 6px !important;
    margin-top: 20px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="hero"] > div:last-child > div > div:last-child > span {
    font-size: 11px !important;
    padding: 5px 10px !important;
  }

  /* Scegli come cercare */
  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div {
    max-width: none !important;
    padding: 28px 18px 22px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(1) {
    font-size: 20px !important;
    margin-bottom: 14px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(2) {
    display: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) {
    grid-template-columns: 1fr 1fr !important;
    gap: 11px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div {
    padding: 15px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div > div:nth-child(1) {
    font-size: 14.5px !important;
    margin-bottom: 5px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div > div:nth-child(2) {
    font-size: 12px !important;
    line-height: 1.4 !important;
    margin-bottom: 10px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div > div:nth-child(3) {
    font-size: 12.5px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div:last-child {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    grid-template-rows: auto auto !important;
    align-items: center !important;
    gap: 0 12px !important;
    padding: 16px 17px !important;
    margin-top: 0 !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div:last-child > div:nth-child(1) {
    grid-column: 1 !important;
    grid-row: 1 !important;
    font-size: 14.5px !important;
    margin-bottom: 3px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div:last-child > div:nth-child(2) {
    grid-column: 1 !important;
    grid-row: 2 !important;
    font-size: 12px !important;
    margin-bottom: 0 !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="paths"] > div > div:nth-child(3) > div:last-child > div:nth-child(3) {
    grid-column: 2 !important;
    grid-row: 1 / span 2 !important;
    font-size: 12.5px !important;
    white-space: nowrap !important;
    align-self: center !important;
  }

  /* Arredo showcase */
  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div {
    max-width: none !important;
    padding: 28px 18px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div[style*="radial-gradient"] {
    top: 20px !important;
    left: -50px !important;
    width: 260px !important;
    height: 260px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:first-child {
    margin-bottom: 18px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:first-child > div > div:nth-child(1) {
    font-size: 10.5px !important;
    margin-bottom: 9px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:first-child > div > div:nth-child(2) {
    font-size: 24px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:first-child > div > div:nth-child(3) {
    display: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:first-child > a {
    font-size: 12.5px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:last-child {
    grid-template-columns: 1fr 1fr !important;
    gap: 14px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:last-child img {
    margin-bottom: 11px !important;
    border-radius: 3px;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:last-child > div > div:nth-child(2) {
    font-size: 10px !important;
    margin-bottom: 3px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:last-child > div > div:nth-child(3) {
    font-size: 17px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:last-child > div > div:nth-child(4) {
    font-size: 11.5px !important;
    margin: 3px 0 6px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="design-showcase"] > div:last-child > div:last-child > div > div:nth-child(5) {
    font-size: 14px !important;
  }

  /* Tecnica showcase */
  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div {
    max-width: none !important;
    padding: 28px 18px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:first-child {
    margin-bottom: 16px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:first-child > div > div:nth-child(1) {
    font-size: 10.5px !important;
    margin-bottom: 9px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:first-child > div > div:nth-child(2) {
    font-size: 21px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:first-child > div > div:nth-child(3) {
    display: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:first-child > a {
    font-size: 12.5px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child {
    grid-template-columns: 1fr 1fr !important;
    gap: 12px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div {
    padding: 12px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:first-child {
    font-size: 10.5px !important;
    margin-bottom: 8px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div img {
    margin-bottom: 10px !important;
    border-radius: 5px;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:nth-child(3) {
    font-size: 9.5px !important;
    margin-bottom: 3px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:nth-child(4) {
    font-size: 12px !important;
    line-height: 1.3 !important;
    margin-bottom: 9px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:nth-child(5) {
    gap: 4px !important;
    margin-bottom: 10px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:nth-child(5) > span {
    font-size: 9.5px !important;
    padding: 2px 6px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:last-child > span:first-child {
    font-size: 14.5px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:last-child > span:last-child {
    font-size: 0 !important;
    padding: 6px 11px !important;
    min-width: 28px;
    text-align: center;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="technical-showcase"] > div > div:last-child > div > div:last-child > span:last-child::after {
    content: '+';
    font-size: 11px;
    font-weight: 700;
  }

  /* Consulenza */
  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div {
    max-width: none !important;
    padding: 30px 22px !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 20px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:first-child {
    max-width: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:first-child > div:nth-child(1) {
    font-size: 10.5px !important;
    margin-bottom: 12px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:first-child > div:nth-child(2) {
    font-size: 25px !important;
    margin-bottom: 11px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:first-child > div:nth-child(3) {
    font-size: 14px !important;
    line-height: 1.5 !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:last-child {
    width: 100% !important;
    gap: 10px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:last-child > a {
    font-size: 14.5px !important;
    padding: 14px !important;
    border-radius: 6px !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:last-child > a:nth-child(3) {
    display: none !important;
  }

  [data-dc-static-root][data-dc-home] [data-dc-section="consult"] > div > div:last-child > a:nth-child(2) {
    padding: 13px !important;
  }
}
`
