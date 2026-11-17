import { config } from './config.js';
import { content, projects, experience, education, skillGroups, languages } from './content.js';
import { icon, heroRadar, projectVisual } from './visuals.js';

const readPreference = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Optional preference storage. */ } };
let lang = readPreference('jy-lang', 'fr') === 'en' ? 'en' : 'fr';
let theme = readPreference('jy-theme', 'light') === 'dark' ? 'dark' : 'light';
let filter = 'all';
let catalogExpanded = false;
let activeSection = '';
let observer;
let contactPending = false;
let toastTimer;
let lastProjectTrigger;
const app = document.querySelector('#app');
const ids = ['about', 'projects', 'journey', 'contact'];
const filterIds = ['all', 'signal', 'embedded', 'software', 'lab'];
const escape = (value) => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const lines = value => escape(value).replaceAll('\n', '<br>');
const t = () => content[lang];
const isAvailable = () => new Date() <= new Date(`${config.availability.end}T23:59:59Z`);
const cvUrl = () => `${config.cv}${config.cv.endsWith('.html') ? `?lang=${lang}` : ''}`;
const external = 'target="_blank" rel="noopener noreferrer"';

function timeline(items) {
  return items.map(item => `<article class="timeline-item"><div class="timeline-date">${escape(item.date[lang])}${item.end && new Date() >= new Date(item.start) && new Date() <= new Date(item.end) ? `<span class="current-label">${t().current}</span>` : ''}</div><div class="timeline-content"><div class="timeline-heading"><h3>${escape(item.company)}</h3><span>${escape(item.place[lang])}</span></div><h4>${escape(item[lang].title)}</h4><p>${escape(item[lang].description)}</p></div></article>`).join('');
}
function selectedProjects(selectedFilter = filter) {
  return projects.filter(project => selectedFilter === 'all' || (selectedFilter === 'lab' ? project.kind === 'lab' : project.category === selectedFilter));
}
function catalogSummary() {
  const selected = selectedProjects();
  const labs = selected.filter(project => project.kind === 'lab').length;
  const main = selected.length - labs;
  const projectText = main === 1 ? t().projectOne : t().projectsOnly.replace('{count}', main);
  const labText = labs === 1 ? t().labOne : t().labsOnly.replace('{count}', labs);
  if (!main) return labText;
  if (!labs) return projectText;
  return t().projectResults.replace('{projects}', projectText).replace('{labs}', labText);
}
function projectBadges(project) {
  return `<div class="project-badges"><span class="project-kind ${project.kind === 'lab' ? 'kind-lab' : ''}">${escape(t().projectTypes[project.kind || 'project'])}</span>${project.status ? `<span class="project-status">${escape(t().projectStatuses[project.status])}</span>` : ''}</div>`;
}
function projectCards(items) {
  return items.map(project => {
    const data = project[lang];
    const detailLabel = project.kind === 'lab' ? t().detailsLab : t().details;
    const period = project.year === 'Polytech Sorbonne' ? 'POLYTECH' : project.year;
    return `<article aria-labelledby="project-title-${project.id}" class="project-card ${project.featured && filter === 'all' ? 'project-featured' : ''} ${project.kind === 'lab' ? 'project-lab' : ''}"><button class="project-open" data-project="${project.id}" aria-label="${escape(`${detailLabel} : ${data.subtitle}`)}"><span class="project-art art-${project.visual}"><span class="project-no">${String(projects.indexOf(project) + 1).padStart(2, '0')}</span>${projectVisual(project.visual, `-${project.id}`)}<span class="project-arrow">${icon('diagonal')}</span></span><span class="project-body"><span class="project-meta"><span>${escape(data.subtitle)}</span><span>${escape(period)}</span></span><span id="project-title-${project.id}" class="project-card-title">${escape(data.title)}</span><span class="project-description">${escape(data.description)}</span><span class="tags">${(data.tags || project.tags).map(tag => `<span>${escape(tag)}</span>`).join('')}</span></span></button>${projectBadges(project)}</article>`;
  }).join('');
}
function catalogContent() {
  const selected = selectedProjects();
  const main = selected.filter(project => project.kind !== 'lab');
  const labs = selected.filter(project => project.kind === 'lab');
  const initialCount = filter === 'all' ? Math.min(5, main.length) : main.length;
  const extra = main.slice(initialCount);
  const visibleCount = catalogExpanded ? main.length : initialCount;
  return `${main.length ? `<section class="catalog-main" aria-labelledby="catalog-main-title"><div class="catalog-group-heading"><h3 id="catalog-main-title">${t().projectsHeading}</h3><span>${String(main.length).padStart(2, '0')}</span></div><div class="project-grid">${projectCards(main.slice(0, initialCount))}</div>${extra.length ? `<div id="more-projects" class="project-grid project-grid-extra" ${catalogExpanded ? '' : 'hidden'}>${projectCards(extra)}</div><div class="catalog-expansion"><p class="project-progress" aria-live="polite">${t().projectsShowing.replace('{visible}', visibleCount).replace('{total}', main.length)}</p><button class="button catalog-toggle" data-action="toggle-projects" aria-expanded="${catalogExpanded}" aria-controls="more-projects">${catalogExpanded ? t().showFewerProjects : t().showMoreProjects.replace('{count}', extra.length)}${icon(catalogExpanded ? 'arrow' : 'plus')}</button></div>` : ''}</section>` : ''}${labs.length ? `<section class="catalog-labs" aria-labelledby="catalog-labs-title"><div class="catalog-group-heading"><h3 id="catalog-labs-title">${t().labsHeading}</h3><span>${String(labs.length).padStart(2, '0')}</span></div><p class="catalog-labs-intro">${t().labsIntro}</p><div class="lab-grid">${projectCards(labs)}</div></section>` : ''}`;
}

function render() {
  const text = t();
  const form = document.querySelector('#contact-form');
  const draft = form ? Object.fromEntries(new FormData(form)) : {};
  document.documentElement.lang = lang;
  document.documentElement.dataset.theme = theme;
  document.title = lang === 'fr' ? 'Johan Yang — Ingénierie, signal & code' : 'Johan Yang — Engineering, signals & code';
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#171c1b' : '#f7f7f2';
  app.innerHTML = `
    <header class="header"><div class="container header-inner"><a href="#" class="brand" aria-label="Johan Yang — ${lang === 'fr' ? 'Accueil' : 'Home'}">johan yang<span class="brand-dot">.</span></a>
      <nav class="desktop-nav" aria-label="${lang === 'fr' ? 'Navigation principale' : 'Main navigation'}">${ids.map((id,i)=>`<a href="#${id}" ${activeSection === id ? 'aria-current="location"' : ''}>${text.nav[i]}</a>`).join('')}</nav>
      <div class="header-actions"><button class="language-button" data-action="language" aria-label="${lang === 'fr' ? 'Switch to English' : 'Passer en français'}"><span ${lang === 'fr' ? 'class="selected"' : ''}>FR</span><span class="language-divider">/</span><span ${lang === 'en' ? 'class="selected"' : ''}>EN</span></button><button class="icon-button theme-button" data-action="theme" aria-label="${text.theme}">${icon(theme === 'light' ? 'moon' : 'sun')}</button><a href="${cvUrl()}" ${external} class="cv-button">${text.resume} ${icon('diagonal')}</a><button class="icon-button mobile-toggle" data-action="menu" aria-expanded="false" aria-controls="mobile-nav" aria-label="${text.menu}">${icon('menu')}</button></div>
    </div><nav id="mobile-nav" class="mobile-nav" hidden aria-label="${lang === 'fr' ? 'Navigation mobile' : 'Mobile navigation'}">${ids.map((id,i)=>`<a href="#${id}">${text.nav[i]} ${icon('diagonal')}</a>`).join('')}</nav></header>
    <main id="main">
      <section class="hero container" aria-labelledby="hero-title"><div class="hero-copy">
        <a class="availability" href="#contact"><i class="status-dot"></i>${isAvailable() ? text.available : text.contactGeneral}${icon('diagonal')}</a>
        <p class="eyebrow hero-eyebrow">${text.eyebrow}</p>
        <h1 id="hero-title">${text.hero[0]}<br>${text.hero[1]}<br><span>${text.hero[2]}</span></h1>
        <p class="hero-intro">${text.intro}</p>
        <div class="hero-actions"><a class="button button-primary" href="#projects">${text.explore}${icon('arrow')}</a><a class="text-link" href="${cvUrl()}" ${external}>${icon('download')}${text.download}</a></div>
        <div class="hero-location">${icon('pin')}<span>${text.location}</span><span class="japan-flag" aria-hidden="true"></span></div>
      </div><div class="hero-art">${heroRadar(text)}</div>
      <div class="hero-baseline"><span>${text.heroNote}</span><a href="#about">${text.scroll}${icon('down')}</a></div></section>
      <div class="specialties"><div class="container">${text.fields.map(f=>`<span>${icon('plus')}${f}</span>`).join('')}</div></div>
      <section id="about" class="section container about-section" aria-labelledby="about-title"><div><p class="eyebrow">${text.aboutLabel}</p><h2 id="about-title">${lines(text.aboutTitle)}</h2><div class="about-education"><span class="university-mark" aria-hidden="true">P<span>S</span></span><div><strong>${text.university}</strong><span>${text.degree} · ${text.specialty}</span></div></div></div><div class="about-copy"><p>${text.aboutText}</p><p>${text.aboutMore}</p><a class="text-link" href="#journey">${text.aboutLink}${icon('arrow')}</a><div class="journey-cities"><span>Paris</span><i></i><span>Xi’an</span><i></i><span class="city-current">Kyoto <span class="status-dot"></span></span></div></div></section>
      <section id="projects" class="projects-section section" aria-labelledby="projects-title"><div class="container"><div class="section-heading"><div><p class="eyebrow">${text.projectLabel}</p><h2 id="projects-title">${lines(text.projectTitle)}</h2></div><p>${text.projectIntro}</p></div><div class="project-toolbar"><div class="filters" role="group" aria-label="${lang === 'fr' ? 'Filtrer les projets' : 'Filter projects'}">${filterIds.map((id,i)=>`<button data-filter="${id}" aria-pressed="${filter===id}">${text.filters[i]}<span>${selectedProjects(id).length}</span></button>`).join('')}</div><span class="project-counter" aria-live="polite">${catalogSummary()}</span></div><div id="project-catalog">${catalogContent()}</div></div></section>
      <section id="journey" class="section container journey-section" aria-labelledby="journey-title"><div class="journey-intro"><p class="eyebrow">${text.journeyLabel}</p><h2 id="journey-title">${lines(text.journeyTitle)}</h2><p>${text.journeyIntro}</p><div class="journey-coordinate" aria-hidden="true"><span>48.85° N · 2.35° E</span><span>34.34° N · 108.94° E</span><span>35.01° N · 135.76° E <i class="status-dot"></i></span></div><a class="text-link" href="${cvUrl()}" ${external}>${text.download}${icon('diagonal')}</a></div><div class="timelines"><h3 class="timeline-label">${text.experience}<span>01—02</span></h3>${timeline(experience)}<h3 class="timeline-label education-label">${text.education}<span>01—03</span></h3>${timeline(education)}</div></section>
      <section id="skills" class="section skills-section" aria-labelledby="skills-title"><div class="container"><div class="section-heading"><div><p class="eyebrow">${text.skillsLabel}</p><h2 id="skills-title">${text.skillsTitle}</h2></div><p>${text.skillsIntro}</p></div><div class="skills-grid">${skillGroups.map((g,i)=>`<article class="skill-group"><div class="skill-top">${icon(g.icon)}<span>0${i+1}</span></div><h3>${g[lang]}</h3><div class="tags">${g.items.map(item=>`<span>${escape(item)}</span>`).join('')}</div></article>`).join('')}</div><div class="languages"><span class="languages-heading">${icon('globe')}${lang === 'fr' ? 'Et pour échanger' : 'And to connect'}</span>${languages[lang].map(([name,level])=>`<span>${name}<small>${level}</small></span>`).join('')}</div></div></section>
      <section class="beyond container"><div><p class="eyebrow">${text.beyondLabel}</p><h2>${text.beyondTitle}</h2><p>${text.beyondText}</p></div><div class="interest-list">${text.interests.map((name,i)=>`<span><i aria-hidden="true">${['↗', '◎', '✳', '⌘'][i]}</i>${name}</span>`).join('')}</div></section>
      <section id="contact" class="section contact-section" aria-labelledby="contact-title"><div class="container contact-grid"><div><p class="eyebrow">${text.contactLabel}</p><h2 id="contact-title">${lines(text.contactTitle)}</h2><p class="contact-intro">${isAvailable() ? text.contactIntro : text.contactGeneral}</p><div class="email-row"><a href="mailto:${config.email}">${config.email}</a><button class="icon-button" data-action="copy" aria-label="${text.copy}">${icon('copy')}</button></div><div class="social-links"><a href="${config.linkedin}" ${external}>${icon('linkedin')}LinkedIn${icon('diagonal')}</a>${config.github ? `<a href="${escape(config.github)}" ${external}>${icon('github')}GitHub${icon('diagonal')}</a>` : ''}<a href="${cvUrl()}" ${external}>${text.resume}${icon('diagonal')}</a></div><span class="contact-availability"><i class="status-dot"></i>${isAvailable() ? text.available : text.contactGeneral}</span></div>
      <form id="contact-form"><div class="form-row"><div class="field"><label for="contact-name">${text.contactName}</label><input id="contact-name" name="name" autocomplete="name" placeholder="${text.contactNamePlaceholder}" required minlength="2" maxlength="100" value="${escape(draft.name || '')}"></div><div class="field"><label for="contact-email">${text.contactAddress}</label><input id="contact-email" name="email" type="email" autocomplete="email" placeholder="${text.contactAddressPlaceholder}" required maxlength="254" value="${escape(draft.email || '')}"></div></div><div class="field"><label for="contact-message">${text.contactMessage}</label><textarea id="contact-message" name="message" rows="5" placeholder="${text.contactPlaceholder}" required minlength="10" maxlength="3000">${escape(draft.message || '')}</textarea></div><div class="honeypot" aria-hidden="true"><label for="company-website">Website</label><input id="company-website" name="website" tabindex="-1" autocomplete="off"></div><button class="button button-primary contact-submit" type="submit" ${contactPending ? 'disabled' : ''}>${contactPending ? text.sending : config.contactEndpoint ? text.contactSubmitApi : text.contactSubmit}${icon('diagonal')}</button><p class="form-note">${config.contactEndpoint ? text.contactNoteApi : text.contactNote}</p><p id="contact-status" class="form-status" role="status" aria-live="polite"></p></form></div></section>
    </main><footer class="footer container"><a class="brand" href="#">johan yang<span class="brand-dot">.</span></a><span>© ${new Date().getFullYear()} Johan Yang · ${text.footer}</span><a href="#" class="back-top" aria-label="${text.backTop}">${icon('arrow')}</a></footer>
    <dialog id="project-dialog" aria-labelledby="dialog-title"><div class="dialog-content"></div></dialog><div class="toast" role="status" aria-live="polite"></div>`;
  observeSections();
  document.querySelector('#project-dialog').addEventListener('close', () => { document.body.classList.remove('modal-open'); lastProjectTrigger?.focus(); });
  document.querySelector('#project-dialog').addEventListener('click', event => { if(event.target === event.currentTarget) event.currentTarget.close(); });
}
function observeSections() {
  observer?.disconnect();
  if (!('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      activeSection = entry.target.id;
      document.querySelectorAll('.desktop-nav a').forEach(link => {
        if (link.hash === `#${activeSection}`) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-20% 0px -60% 0px', threshold: 0});
  ids.forEach(id => observer.observe(document.getElementById(id)));
}
function showProject(id, trigger) {
  const project = projects.find(p=>p.id === id);
  if(!project) return;
  lastProjectTrigger = trigger;
  const data = project[lang], text=t();
  document.querySelector('.dialog-content').innerHTML = `<button class="icon-button dialog-close" data-action="close-dialog" aria-label="${text.close}" autofocus>${icon('close')}</button><div class="dialog-art art-${project.visual}">${projectVisual(project.visual,'-dialog')}</div><div class="dialog-body">${projectBadges(project)}<p class="eyebrow">${escape(data.subtitle)}</p><h2 id="dialog-title">${escape(data.title)}</h2><p class="dialog-context">${escape(data.context)}</p><h3>${text.projectChallenge}</h3><p>${escape(data.goal)}</p><h3>${text.projectWork}</h3><ul>${data.work.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>${data.note ? `<aside class="project-note"><h3>${text.projectNote}</h3><p>${escape(data.note)}</p></aside>` : ''}<h3>${text.projectStack}</h3><div class="tags">${project.stack.map(item=>`<span>${escape(item)}</span>`).join('')}</div>${project.repository ? `<a class="button project-source" href="${escape(project.repository)}" ${external}>${icon('github')}${text.projectRepository}${icon('diagonal')}</a>` : ''}${project.references?.length ? `<div class="project-references"><h3>${text.projectReferences}</h3>${project.references.map(reference => `<a class="text-link" href="${escape(reference.url)}" ${external}>${escape(reference[lang])}${icon('diagonal')}</a>`).join('')}</div>` : ''}<p class="dialog-disclaimer">${text.projectDisclaimer}</p></div>`;
  document.body.classList.add('modal-open');
  document.querySelector('#project-dialog').showModal();
}
function closeMenu() {
  const toggle = document.querySelector('[data-action="menu"]');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label',t().menu);
  toggle.innerHTML = icon('menu');
  document.querySelector('#mobile-nav').hidden = true;
}
function toast(message) {
  clearTimeout(toastTimer);
  const el = document.querySelector('.toast');
  el.textContent = message; el.classList.add('visible');
  toastTimer = setTimeout(()=>el.classList.remove('visible'),3500);
}
document.addEventListener('click', async event => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.closest('.mobile-nav') && target.matches('a')) closeMenu();
  if(target.dataset.project) showProject(target.dataset.project, target);
  if(target.dataset.filter && filterIds.includes(target.dataset.filter)) {
    filter = target.dataset.filter;
    catalogExpanded = false;
    document.querySelector('#project-catalog').innerHTML = catalogContent();
    document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
    document.querySelector('.project-counter').textContent = catalogSummary();
  }
  switch(target.dataset.action) {
    case 'toggle-projects': {
      catalogExpanded = !catalogExpanded;
      const main = selectedProjects().filter(project => project.kind !== 'lab');
      document.querySelector('#more-projects').hidden = !catalogExpanded;
      target.setAttribute('aria-expanded', String(catalogExpanded));
      target.innerHTML = `${catalogExpanded ? t().showFewerProjects : t().showMoreProjects.replace('{count}', main.length - 5)}${icon(catalogExpanded ? 'arrow' : 'plus')}`;
      document.querySelector('.project-progress').textContent = t().projectsShowing.replace('{visible}', catalogExpanded ? main.length : 5).replace('{total}', main.length);
      break;
    }
    case 'language': {
      const y = scrollY; lang = lang === 'fr' ? 'en' : 'fr'; savePreference('jy-lang',lang); render(); window.scrollTo({top:y,behavior:'instant'}); document.querySelector('[data-action="language"]').focus({preventScroll:true}); break;
    }
    case 'theme':
      theme = theme === 'light' ? 'dark' : 'light'; savePreference('jy-theme',theme); document.documentElement.dataset.theme=theme; target.innerHTML=icon(theme==='light'?'moon':'sun'); document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#171c1b':'#f7f7f2'; break;
    case 'menu': {
      const open = target.getAttribute('aria-expanded') !== 'true'; target.setAttribute('aria-expanded',String(open)); target.setAttribute('aria-label',open?t().close:t().menu); target.innerHTML=icon(open?'close':'menu'); document.querySelector('#mobile-nav').hidden=!open; break;
    }
    case 'close-dialog': document.querySelector('#project-dialog').close(); break;
    case 'copy':
      try { await navigator.clipboard.writeText(config.email); toast(t().copied); } catch { toast(t().copyFailed); } break;
  }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape') closeMenu();});
matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
document.addEventListener('submit', async event => {
  if(event.target.id !== 'contact-form') return;
  event.preventDefault();
  if(contactPending) return;
  const data=Object.fromEntries(new FormData(event.target));
  data.name=data.name.trim(); data.email=data.email.trim(); data.message=data.message.trim();
  const status=()=>document.querySelector('#contact-status');
  status().classList.remove('error');
  if(data.name.length<2 || data.message.length<10) { status().textContent=lang==='fr'?'Indiquez un nom (2 caractères minimum) et un message (10 caractères minimum).':'Enter a name (at least 2 characters) and a message (at least 10 characters).'; status().classList.add('error'); return; }
  if(data.website) return;
  if(!config.contactEndpoint) {
    const subject = lang === 'fr' ? `Contact portfolio — ${data.name}` : `Portfolio enquiry — ${data.name}`;
    const body=`${data.message}\n\n${data.name}\n${data.email}`;
    window.location.href=`mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status().textContent=t().contactOpening; return;
  }
  contactPending=true;
  const button=()=>document.querySelector('.contact-submit');
  button().disabled=true; button().textContent=t().sending;
  try {
    const response=await fetch(config.contactEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error('Contact failed');
    const result=await response.json();
    if(result.ok!==true) throw new Error('Unexpected response');
    document.querySelector('#contact-form').reset(); status().textContent=t().contactSuccess;
  } catch { status().textContent=t().contactError; status().classList.add('error'); }
  finally { contactPending=false; button().disabled=false; button().innerHTML=`${t().contactSubmitApi}${icon('diagonal')}`; }
});
render();
