/* Dock the product filter beside category content on desktop. On mobile,
   restore the original document order and layout. */
(() => {
  const init = () => {
    const main = document.querySelector("main");
    const hero = main?.querySelector(".hero");
    const categories = main?.querySelector(".category-section");
    const catalog = main?.querySelector(".catalog");
    const filter = catalog?.querySelector(".filters");
    const catalogLayout = catalog?.querySelector(".catalog-layout");
    const catalogMain = catalogLayout?.querySelector(".catalog-main");
    const header = document.querySelector("header.site-header");
    if (!main || !hero || !categories || !catalog || !filter || !catalogLayout || !catalogMain || !header) return;

    const original = {
      heroNext: hero.nextSibling,
      categoriesNext: categories.nextSibling,
      catalogNext: catalog.nextSibling,
      filterParent: filter.parentNode,
      filterNext: filter.nextSibling,
      gridTemplate: catalogLayout.style.gridTemplateColumns,
    };

    const dock = document.createElement("div");
    dock.className = "shop-desktop-layout";
    const sidebar = document.createElement("aside");
    sidebar.className = "shop-desktop-sidebar";
    sidebar.setAttribute("aria-label", "Filtrování produktů");
    const content = document.createElement("div");
    content.className = "shop-desktop-main";
    dock.append(sidebar, content);

    let desktop = false;
    const apply = () => {
      const shouldDock = window.matchMedia("(min-width: 801px)").matches;
      if (shouldDock === desktop) return;
      desktop = shouldDock;
      if (shouldDock) {
        main.insertBefore(dock, main.firstChild);
        sidebar.append(filter);
        content.append(hero, categories, catalog);
        catalogLayout.style.gridTemplateColumns = "minmax(0, 1fr)";
      } else {
        original.filterParent.insertBefore(filter, original.filterNext);
        catalogLayout.style.gridTemplateColumns = original.gridTemplate;
        main.insertBefore(catalog, original.catalogNext);
        main.insertBefore(categories, original.categoriesNext);
        main.insertBefore(hero, original.heroNext);
        dock.remove();
      }
    };
    apply();
    window.addEventListener("resize", apply, { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
