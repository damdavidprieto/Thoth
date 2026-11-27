/* ==========================================================================
   app.js — navegación (pestañas, índices, pseudocódigo, acertijos) y arranque.
   Se carga al final y espera a que el DOM esté listo.
   ========================================================================== */

// Pestañas accesibles: role="tab", aria-selected y navegación con flechas, Inicio y Fin
function initTabs() {
    const list = document.querySelector('.tab-navigation');
    const tabs = Array.from(list.querySelectorAll('.tab-button'));
    const panels = tabs.map((tab) => document.getElementById(`${tab.dataset.tab}-tab`));
    list.setAttribute('role', 'tablist');

    tabs.forEach((tab, i) => {
        tab.id = `tab-${tab.dataset.tab}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panels[i].id);
        panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', tab.id);

        tab.addEventListener('click', () => activate(i));
        tab.addEventListener('keydown', (event) => {
            const keys = {
                ArrowRight: (i + 1) % tabs.length,
                ArrowLeft: (i - 1 + tabs.length) % tabs.length,
                Home: 0,
                End: tabs.length - 1,
            };
            if (!(event.key in keys)) return;
            event.preventDefault();
            activate(keys[event.key], true);
        });
    });

    function activate(index, focus = false) {
        tabs.forEach((tab, i) => {
            const selected = i === index;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            panels[i].hidden = !selected;
        });
        if (focus) tabs[index].focus();
        history.replaceState(null, '', `#${tabs[index].dataset.tab}`);
        // Las visualizaciones de la pestaña recién mostrada se ajustan a su ancho
        window.dispatchEvent(new Event('resize'));
    }

    const fromHash = tabs.findIndex((tab) => `#${tab.dataset.tab}` === location.hash);
    activate(fromHash >= 0 ? fromHash : 0);
}

// El icono inicial de pestañas y títulos va en una insignia de tamaño fijo para que se vea bien
const LEADING_ICON = /^(\p{Extended_Pictographic}[\uFE0F\u200D]*)+\s*/u;

function initIconBadges() {
    document.querySelectorAll('.tab-button, .section-header h2, .tab-intro h2').forEach((el) => {
        const first = el.firstChild;
        if (!first || first.nodeType !== Node.TEXT_NODE) return;
        const match = first.textContent.match(LEADING_ICON);
        if (!match) return;

        const badge = document.createElement('span');
        badge.className = 'icon-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = match[0].trim();
        first.textContent = first.textContent.slice(match[0].length);
        el.prepend(badge);
    });
}

// Pseudocódigo colapsable: botón accesible con teclado y animación sin alturas fijas
function initPseudocode() {
    document.querySelectorAll('.pseudocode-box.collapsible').forEach((box) => {
        const header = box.querySelector('.pseudocode-header');
        const content = box.querySelector('.pseudocode-content');
        const icon = header.querySelector('.toggle-icon');

        // Se envuelve el contenido para animar la altura con grid-template-rows
        const inner = document.createElement('div');
        inner.className = 'pseudocode-inner';
        inner.append(...content.childNodes);
        content.append(inner);

        header.setAttribute('role', 'button');
        header.tabIndex = 0;

        const setOpen = (open) => {
            box.classList.toggle('is-open', open);
            header.setAttribute('aria-expanded', String(open));
            content.inert = !open;
            icon.textContent = open ? '▼' : '▶';
        };
        setOpen(false);

        header.addEventListener('click', () => setOpen(!box.classList.contains('is-open')));
        header.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            setOpen(!box.classList.contains('is-open'));
        });
    });
}

// Acertijos: la respuesta se revela con un botón en lugar de mostrarse de entrada
function initRiddles() {
    document.querySelectorAll('.riddle-answer').forEach((answer) => {
        answer.hidden = true;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary riddle-reveal';
        button.textContent = 'Mostrar respuesta';
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('click', () => {
            answer.hidden = !answer.hidden;
            button.textContent = answer.hidden ? 'Mostrar respuesta' : 'Ocultar respuesta';
            button.setAttribute('aria-expanded', String(!answer.hidden));
        });

        answer.before(button);
    });
}

// Índice de secciones en las pestañas largas (con más de dos algoritmos)
function initSectionNav() {
    document.querySelectorAll('.tab-content').forEach((tab) => {
        const sections = Array.from(tab.querySelectorAll(':scope > section.algorithm-section'));
        if (sections.length < 3) return;

        const nav = document.createElement('nav');
        nav.className = 'section-nav';
        nav.setAttribute('aria-label', 'Índice de algoritmos de esta pestaña');

        for (const section of sections) {
            const title = section.querySelector('h2')?.textContent.trim() ?? section.id;
            const link = document.createElement('a');
            link.href = `#${section.id}`;
            link.textContent = title.replace(/^[^\p{L}\p{N}]+/u, ''); // quita el emoji inicial
            nav.append(link);
        }
        sections[0].before(nav);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initIconBadges();
    initPseudocode();
    initRiddles();
    initSectionNav();

    new LinearSearchVisualizer();
    new BinarySearchVisualizer();
    new BubbleSortVisualizer();
    new SelectionSortVisualizer();
    new InsertionSortVisualizer();
    new MergeSortVisualizer();
    new QuickSortVisualizer();
    new AStarVisualizer();
    new HillClimbingVisualizer();
    new SimulatedAnnealingVisualizer();
    new GeneticAlgorithmVisualizer();
    new ParticleSwarmVisualizer();
    new KMeansVisualizer();
});
