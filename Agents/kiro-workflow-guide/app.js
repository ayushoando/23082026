(() => {
  const data = window.GUIDE_DATA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[character]);
  const tags = (values) => values.map((value) => `<span>${escapeHtml(value)}</span>`).join('');

  $('#rules-grid').innerHTML = data.rules.map((item) => `<article class="rule-card searchable" data-search="${escapeHtml(item.search)}"><span class="rule-number">${item.number}</span><h3>${item.title}</h3><p>${item.text}</p></article>`).join('');
  $('#skills-grid').innerHTML = data.skills.map((item) => `<article class="info-card searchable" data-search="${escapeHtml(item.search)}"><div class="card-icon ${item.tone}">${item.icon}</div><div class="card-meta">${item.meta}</div><h3>${item.name}</h3><p>${item.text}</p><code>${item.command}</code></article>`).join('');
  $('#specs-grid').innerHTML = data.specs.map((item) => `<article class="info-card searchable" data-search="${escapeHtml(item.search)}"><div class="card-icon ${item.tone}">${item.icon}</div><div class="card-meta">${item.meta}</div><h3>${item.name}</h3><p>${item.text}</p><code>${item.command}</code></article>`).join('');
  $('#powers-grid').innerHTML = data.powers.map((item) => `<article class="power-row searchable" data-search="${escapeHtml(item.search)}"><div class="power-symbol ${item.tone}">${item.symbol}</div><div class="power-body"><div class="card-meta">${item.meta}</div><h3>${item.name}</h3><p>${item.text}</p><div class="tag-row">${tags(item.tags)}</div></div></article>`).join('');
  $('#commands-grid').innerHTML = data.commands.map((item) => `<article class="command-card searchable" data-search="${escapeHtml(item.search)}"><div class="command-card-heading"><span class="terminal-mark">${item.icon}</span><h3>${item.title}</h3></div><pre data-copy><code>${escapeHtml(item.code)}</code></pre><p>${item.text}</p></article>`).join('');
  $('#ops-grid').innerHTML = Object.entries(data.opsGroups).map(([group, commands]) => `<div><h4>${group} <span class="group-count">(${commands.length})</span></h4><p class="chips">${commands.map((command) => `<code>${command}</code>`).join('')}</p></div>`).join('') + '<p class="registry-note">This registry was captured from <code>pnpm run ops:list</code>. Re-run that command for the authoritative live list.</p>';
  $('#workflow-grid').innerHTML = data.workflow.map(([title, text, search], index) => `<article class="timeline-item searchable" data-search="${escapeHtml(search)}"><div class="timeline-marker">${String(index + 1).padStart(2, '0')}</div><div><h3>${title}</h3><p>${text}</p></div></article>`).join('');
  $('#recipes-grid').innerHTML = data.recipes.map(([label, title, steps, search]) => `<article class="recipe-card searchable" data-search="${escapeHtml(search)}"><span class="recipe-label">${label}</span><h3>${title}</h3><ol>${steps.map((step) => `<li>${step}</li>`).join('')}</ol></article>`).join('');
  $('#source-grid').innerHTML = data.sources.map(([name, href, text, kind]) => `<article class="source-card searchable" data-search="${escapeHtml(`${name} ${href} ${text} ${kind}`)}"><span class="source-kind">${kind}</span><h3>${name}</h3><p>${text}</p><a href="${href}">${href.startsWith('#') ? 'Jump to section' : 'Open source'} ↗</a></article>`).join('');
  $('#source-summary').textContent = `${data.sources.length} sources · ${data.specs.length} spec paths · ${data.powers.length} powers · ${Object.values(data.opsGroups).flat().length} ops`;
  $('#source-count').textContent = `${data.sources.length} source entries mapped · ${data.skills.length} skills · ${data.specs.length} spec paths · ${data.powers.length} powers`;

  const searchInput = $('#guide-search');
  const searchCount = $('#search-count');
  const searchable = () => $$('.searchable');
  const applySearch = () => {
    const term = searchInput.value.trim().toLowerCase();
    let visible = 0;
    searchable().forEach((element) => {
      const matches = !term || (element.dataset.search || element.textContent).toLowerCase().includes(term);
      element.classList.toggle('is-hidden', !matches);
      element.classList.toggle('search-match', Boolean(term && matches));
      if (matches) visible += 1;
    });
    searchCount.textContent = term ? `${visible} matching sections` : 'Showing all sections';
  };
  searchInput.addEventListener('input', applySearch);
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); searchInput.focus(); }
    if (event.key === 'Escape') { searchInput.value = ''; applySearch(); searchInput.blur(); }
  });

  const menu = $('#side-nav');
  $('#menu-toggle').addEventListener('click', () => { const open = menu.classList.toggle('open'); $('#menu-toggle').setAttribute('aria-expanded', String(open)); });
  $$('.nav-link').forEach((link) => link.addEventListener('click', () => { menu.classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); }));
  const sections = $$('main section[id]');
  const navLinks = $$('.nav-link');
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-18% 0px -70% 0px' });
  sections.forEach((section) => observer.observe(section));

  const root = document.documentElement;
  const savedTheme = localStorage.getItem('oando-guide-theme');
  if (savedTheme === 'dark') root.dataset.theme = 'dark';
  $('#theme-toggle').addEventListener('click', () => { const next = root.dataset.theme === 'dark' ? 'light' : 'dark'; if (next === 'light') delete root.dataset.theme; else root.dataset.theme = 'dark'; localStorage.setItem('oando-guide-theme', next); });
  $$('[data-copy]').forEach((block) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'copy-button'; button.textContent = 'Copy'; block.appendChild(button); button.addEventListener('click', async () => { await navigator.clipboard.writeText($('code', block).textContent); button.textContent = 'Copied'; setTimeout(() => { button.textContent = 'Copy'; }, 1200); }); });
})();
