/* app.js — portfolio boot */
import { renderPortfolio, wirePortfolio } from './portfolio.js';

document.querySelectorAll('[data-year]').forEach((n) => (n.textContent = new Date().getFullYear()));
renderPortfolio();
wirePortfolio();
