/**
 * Navegação Lateral Responsiva
 * Sistema de navegação que se adapta a diferentes tamanhos de tela
 */

class ResponsiveNav {
    constructor() {
        this.menu = document.getElementById("menu-hamburguer");
        this.nav = document.getElementById("nav-elementos");
        this.overlay = null;
        this.isOpen = false;
        this.currentBreakpoint = this.getCurrentBreakpoint();
        
        this.init();
    }

    init() {
        this.createOverlay();
        this.setupEventListeners();
        this.setupLabels();
        this.handleResize();
        this.setCurrentPage();
        
        // Listener para mudanças de tamanho da tela
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    createOverlay() {
        // Criar overlay apenas se não existir
        if (!document.querySelector('.nav-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'nav-overlay';
            document.body.appendChild(this.overlay);
            
            this.overlay.addEventListener('click', () => {
                this.closeNav();
            });
        } else {
            this.overlay = document.querySelector('.nav-overlay');
        }
    }

    setupEventListeners() {
        if (this.menu) {
            this.menu.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleNav();
            });
        }

        // Fechar menu com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeNav();
            }
        });

        // Prevenir scroll quando menu está aberto em mobile
        document.addEventListener('touchmove', (e) => {
            if (this.isOpen && this.currentBreakpoint === 'mobile') {
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupLabels() {
        // Adicionar labels aos links para telas pequenas
        const navLinks = this.nav?.querySelectorAll('a');
        if (navLinks) {
            navLinks.forEach(link => {
                const icon = link.querySelector('i');
                if (icon) {
                    let label = '';
                    if (icon.classList.contains('fa-house')) {
                        label = 'Início';
                    } else if (icon.classList.contains('fa-clock')) {
                        label = 'Histórico';
                    } else if (icon.classList.contains('fa-gear')) {
                        label = 'Configurações';
                    } else if (icon.classList.contains('fa-search')) {
                        label = 'Buscar';
                    }
                    link.setAttribute('data-label', label);
                }
            });
        }
    }

    setCurrentPage() {
        // Marcar página atual
        const currentPath = window.location.pathname;
        const navLinks = this.nav?.querySelectorAll('li');
        
        if (navLinks) {
            navLinks.forEach(li => {
                const link = li.querySelector('a');
                if (link) {
                    const href = link.getAttribute('href');
                    if (href && (currentPath.includes(href.replace('.html', '')) || 
                        (currentPath === '/' && href === 'index.html'))) {
                        li.classList.add('current-page');
                    }
                }
            });
        }
    }

    getCurrentBreakpoint() {
        const width = window.innerWidth;
        if (width <= 480) return 'mobile-small';
        if (width <= 768) return 'mobile';
        if (width <= 1200) return 'tablet';
        return 'desktop';
    }

    handleResize() {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        if (newBreakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            
            // Fechar navegação ao mudar de breakpoint
            if (this.isOpen) {
                this.closeNav();
            }
            
            // Ajustar comportamento baseado no breakpoint
            this.adjustForBreakpoint();
        }
    }

    adjustForBreakpoint() {
        const content = document.querySelector('.content-with-nav') || 
                       document.querySelector('main') || 
                       document.body;

        switch (this.currentBreakpoint) {
            case 'desktop':
                // Desktop: navegação sempre visível
                if (this.nav) {
                    this.nav.classList.add('ativo');
                }
                if (content) {
                    content.classList.add('content-with-nav');
                }
                if (this.overlay) {
                    this.overlay.classList.remove('ativo');
                }
                break;
                
            case 'tablet':
            case 'mobile':
            case 'mobile-small':
                // Mobile/Tablet: navegação escondida por padrão
                if (this.nav) {
                    this.nav.classList.remove('ativo');
                }
                if (content) {
                    content.classList.remove('nav-open');
                }
                break;
        }
    }

    toggleNav() {
        if (this.isOpen) {
            this.closeNav();
        } else {
            this.openNav();
        }
    }

    openNav() {
        if (!this.nav || !this.menu) return;

        this.isOpen = true;
        
        // Adicionar classes ativas
        this.menu.classList.add("ativo");
        this.nav.classList.add("ativo");
        
        // Mostrar overlay em telas pequenas
        if (this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'mobile-small') {
            if (this.overlay) {
                this.overlay.classList.add('ativo');
            }
            document.body.classList.add('nav-open');
        } else if (this.currentBreakpoint === 'tablet') {
            const content = document.querySelector('.content-with-nav') || 
                           document.querySelector('main');
            if (content) {
                content.classList.add('nav-open');
            }
        }

        // Animação dos ícones
        this.animateIcons();
    }

    closeNav() {
        if (!this.nav || !this.menu) return;

        this.isOpen = false;
        
        // Remover classes ativas
        this.menu.classList.remove("ativo");
        this.nav.classList.remove("ativo");
        
        // Esconder overlay
        if (this.overlay) {
            this.overlay.classList.remove('ativo');
        }
        
        // Remover classe do body
        document.body.classList.remove('nav-open');
        
        // Remover classe do conteúdo
        const content = document.querySelector('.content-with-nav') || 
                       document.querySelector('main');
        if (content) {
            content.classList.remove('nav-open');
        }
    }

    animateIcons() {
        const icons = this.nav?.querySelectorAll('li');
        if (icons) {
            icons.forEach((icon, index) => {
                setTimeout(() => {
                    icon.classList.add('active');
                    setTimeout(() => {
                        icon.classList.remove('active');
                    }, 300);
                }, index * 100);
            });
        }
    }

    // Utility function para debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se os elementos necessários existem
    if (document.getElementById("menu-hamburguer") && document.getElementById("nav-elementos")) {
        new ResponsiveNav();
    }
});

// Exportar para uso em outros scripts se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveNav;
}
