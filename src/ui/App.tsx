import { useEffect, useRef, useState } from 'react';
import { PanelLeft, Waves } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '../components/ui/sidebar';
import { Notice } from './Notice';
import { PageFooter, PageHeader, pageIcons } from './page';
import {
  defaultPage,
  documentTitle,
  isPageKey,
  navigationGroups,
  pageName,
  type PageKey,
} from './navigation';
import { RestartApp } from './RestartApp';

const pages: Record<PageKey, { intro: string; notice: string }> = {
  opdriftssikring: {
    intro: 'Beregning af opdrift, ballast, geonet og forankring.',
    notice: 'Beregningen af opdrift, ballast, geonet og forankring bygges i fase 3.',
  },
  rapport: { intro: 'PDF-rapport for beregningen.', notice: 'PDF-rapporten bygges i fase 4.' },
  geonet: {
    intro: 'Opslag over geonet og faste værdier.',
    notice: 'Opslag over geonet og faste værdier bygges i fase 5.',
  },
  hjaelp: {
    intro: 'Beregningsgrundlag og brugervejledning.',
    notice: 'Hjælp og dokumentation bygges i fase 5.',
  },
  indstillinger: {
    intro: 'Indstillinger for beregningen.',
    notice: 'Valg af konsekvensklasse bygges i fase 3.',
  },
};

function currentPage(): PageKey {
  const hash = location.hash.slice(1);
  return isPageKey(hash) ? hash : defaultPage;
}

function MenuButton({ returnFocus = false }: { returnFocus?: boolean }) {
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (returnFocus && isMobile && wasOpen.current && !openMobile) button.current?.focus();
    wasOpen.current = openMobile;
  }, [returnFocus, isMobile, openMobile]);
  return (
    <Button
      ref={button}
      variant="ghost"
      size="sm"
      className="menu-toggle"
      aria-label="Menu"
      aria-expanded={isMobile ? openMobile : state === 'expanded'}
      onClick={toggleSidebar}
    >
      <PanelLeft aria-hidden="true" />
      Menu
    </Button>
  );
}

function Navigation({ page }: { page: PageKey }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <Sidebar collapsible="icon" className="app-sidebar">
      {isMobile && (
        <SidebarHeader>
          <MenuButton />
        </SidebarHeader>
      )}
      <SidebarContent>
        <nav aria-label="Navigation">
          {navigationGroups.map(({ label, items }) => (
            <SidebarGroup key={label}>
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ key, name }) => {
                    const Icon = pageIcons[key];
                    return (
                      <SidebarMenuItem key={key}>
                        <SidebarMenuButton asChild tooltip={name} isActive={page === key}>
                          <a
                            href={`#${key}`}
                            aria-current={page === key ? 'page' : undefined}
                            onClick={() => isMobile && setOpenMobile(false)}
                          >
                            <Icon aria-hidden="true" />
                            <span>{name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="app-sidebar-footer group-data-[collapsible=icon]:hidden">
        <span>BG Byggros A/S</span>
        <span>Beregningsværktøj v0.1</span>
        <RestartApp />
      </SidebarFooter>
    </Sidebar>
  );
}

export function App() {
  const [page, setPage] = useState(currentPage);
  useEffect(() => {
    const update = () => {
      const next = currentPage();
      if (location.hash !== `#${next}`) history.replaceState(null, '', `#${next}`);
      setPage(next);
    };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    document.title = documentTitle(page);
  }, [page]);
  return (
    <SidebarProvider className="app-shell">
      <header className="topbar">
        <MenuButton returnFocus />
        <div className="brand">
          <Waves size={24} strokeWidth={1.6} aria-hidden="true" />
          <strong>OPDRIFT</strong>
          <span>Sikring med geonet</span>
        </div>
      </header>
      <div className="app-body">
        <Navigation page={page} />
        <div className="app-content">
          <main>
            <PageHeader page={page} title={pageName(page)} intro={pages[page].intro} />
            <section className="section-card settings-card" aria-labelledby="placeholder-title">
              <h2 id="placeholder-title">Indhold</h2>
              <Notice>{pages[page].notice}</Notice>
            </section>
            <PageFooter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
