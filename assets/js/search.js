(function () {
  "use strict";

  // Normalize Latvian diacritics so searching "skinkisi" or "pankukas" matches "šķiņķīši" / "pankūkas"
  function normalizeText(str) {
    if (!str) return "";
    return str
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // 1. Homepage Catalog Search & Category Filter
  const searchInput = document.getElementById("recipe-search-input");
  const clearBtn = document.getElementById("search-clear-btn");
  const categoryBar = document.getElementById("category-filter-bar");
  const catalogGrid = document.getElementById("recipe-catalog-grid");
  const countLabel = document.getElementById("recipe-count-label");
  const emptyState = document.getElementById("empty-search-state");
  const resetBtn = document.getElementById("reset-filters-btn");

  if (catalogGrid && searchInput) {
    const cards = Array.from(catalogGrid.querySelectorAll(".recipe-card"));
    let activeCategory = "all";

    // Pre-compute normalized search corpus for each card
    const cardIndex = cards.map((card) => {
      const rawText = [
        card.dataset.title || "",
        card.dataset.description || "",
        card.dataset.categories || "",
        card.dataset.tags || "",
        card.dataset.ingredients || ""
      ].join(" ");
      const categories = (card.dataset.categories || "")
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);

      return {
        element: card,
        categories: categories,
        normalizedCorpus: normalizeText(rawText)
      };
    });

    function applyFilters() {
      const query = normalizeText(searchInput.value.trim());
      const terms = query.split(/\s+/).filter(Boolean);
      clearBtn.hidden = terms.length === 0;

      let visibleCount = 0;

      cardIndex.forEach((item) => {
        const matchesCategory =
          activeCategory === "all" || item.categories.includes(activeCategory);

        const matchesQuery =
          terms.length === 0 ||
          terms.every((term) => item.normalizedCorpus.includes(term));

        const isVisible = matchesCategory && matchesQuery;
        item.element.hidden = !isVisible;
        if (isVisible) visibleCount++;
      });

      if (countLabel) {
        const isSingular = visibleCount % 10 === 1 && visibleCount % 100 !== 11;
        if (activeCategory === "all" && terms.length === 0) {
          countLabel.textContent = isSingular
            ? `Rāda ${visibleCount} recepti`
            : `Rāda visas ${visibleCount} receptes`;
        } else {
          countLabel.textContent = isSingular
            ? `Atrasta ${visibleCount} recepte`
            : `Atrastas ${visibleCount} receptes`;
        }
      }

      if (emptyState) {
        emptyState.hidden = visibleCount > 0;
      }
    }

    searchInput.addEventListener("input", applyFilters);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        applyFilters();
        searchInput.focus();
      });
    }

    if (categoryBar) {
      categoryBar.addEventListener("click", (e) => {
        const pill = e.target.closest(".category-pill");
        if (!pill) return;
        categoryBar
          .querySelectorAll(".category-pill")
          .forEach((btn) => btn.classList.remove("active"));
        pill.classList.add("active");
        activeCategory = pill.dataset.category || "all";
        applyFilters();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        activeCategory = "all";
        if (categoryBar) {
          categoryBar
            .querySelectorAll(".category-pill")
            .forEach((btn) =>
              btn.classList.toggle("active", btn.dataset.category === "all")
            );
        }
        applyFilters();
      });
    }

    // Check URL parameter ?kategorija=...
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get("kategorija");
    if (initialCategory && categoryBar) {
      const matchingPill = Array.from(
        categoryBar.querySelectorAll(".category-pill")
      ).find((btn) => btn.dataset.category === initialCategory);
      if (matchingPill) {
        matchingPill.click();
      }
    }
  }

  // 2. Recipe Page Interactive Features (Portion Scaling & Checklists)
  const recipePage = document.querySelector(".recipe-page");
  if (recipePage) {
    const baseServings = parseFloat(recipePage.dataset.baseServings) || 4;
    const servingsEl = document.getElementById("current-servings");
    const scaleBtns = recipePage.querySelectorAll(".scale-btn");
    const amountEls = recipePage.querySelectorAll(".ingredient-amount");
    const instructionEl = document.getElementById("recipe-instructions");

    // Identify inline bolded ingredient amounts in instructions (e.g., "230 g", "60 ml", "5 ml (1 tk)")
    // while ignoring temperatures (°C) and durations (min, sek, stund, nedēļ)
    const inlineAmountEls = [];
    if (instructionEl) {
      instructionEl.querySelectorAll("strong").forEach((strongEl) => {
        const txt = (strongEl.textContent || "").trim();
        const hasUnit = /\b(g|kg|ml|l|tk|ēk|gab\.)(\b|$)/i.test(txt);
        const isTempOrTime = /(°\s*C|min|sek|stund|dien|nedēļ)/i.test(txt);
        if (hasUnit && !isTempOrTime && /\d/.test(txt)) {
          strongEl.dataset.baseAmount = txt;
          inlineAmountEls.push(strongEl);
        }
      });
    }

    function formatScaledNumber(num) {
      const rounded = Math.round(num * 10) / 10;
      return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
    }

    function scaleAmountString(rawStr, factor) {
      if (!rawStr || factor === 1) return rawStr;
      // Scale numeric values (excluding fractions like 1/2 which we write as 0.5 or decimal)
      return rawStr.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
        const val = parseFloat(match.replace(",", "."));
        if (isNaN(val)) return match;
        return formatScaledNumber(val * factor);
      });
    }

    scaleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const factor = parseFloat(btn.dataset.scale) || 1;
        scaleBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (servingsEl) {
          servingsEl.textContent = formatScaledNumber(baseServings * factor);
        }

        amountEls.forEach((el) => {
          const base = el.dataset.baseAmount || "";
          el.textContent = scaleAmountString(base, factor);
        });

        inlineAmountEls.forEach((el) => {
          const base = el.dataset.baseAmount || "";
          el.textContent = scaleAmountString(base, factor);
        });
      });
    });

    // Ingredient checklist toggle
    recipePage.querySelectorAll(".ingredient-row").forEach((row) => {
      row.addEventListener("click", () => {
        row.classList.toggle("checked");
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          row.classList.toggle("checked");
        }
      });
    });

    // Step checklist toggle
    const instructions = document.getElementById("recipe-instructions");
    if (instructions) {
      instructions.querySelectorAll("ol li").forEach((step) => {
        step.addEventListener("click", () => {
          step.classList.toggle("step-done");
        });
      });
    }
  }
})();

