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
      if (clearBtn) {
        clearBtn.hidden = terms.length === 0;
        clearBtn.style.display = terms.length === 0 ? "none" : "";
      }

      let visibleCount = 0;

      cardIndex.forEach((item) => {
        const matchesCategory =
          activeCategory === "all" || item.categories.includes(activeCategory);

        const matchesQuery =
          terms.length === 0 ||
          terms.every((term) => item.normalizedCorpus.includes(term));

        const isVisible = matchesCategory && matchesQuery;
        item.element.hidden = !isVisible;
        item.element.style.display = isVisible ? "" : "none";
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
        emptyState.style.display = visibleCount > 0 ? "none" : "";
      }
    }

    searchInput.addEventListener("input", applyFilters);
    searchInput.addEventListener("keyup", applyFilters);
    searchInput.addEventListener("search", applyFilters);

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
    } else {
      // Ensure initial state is synced (e.g. if Firefox restores search input text on reload)
      applyFilters();
    }
  }

  // 2. Recipe Page Interactive Features (Portion Scaling, Pizza Calculator & Checklists)
  const recipePage = document.querySelector(".recipe-page");
  if (recipePage) {
    const baseServings = parseFloat(recipePage.dataset.baseServings) || 4;
    const servingsEl = document.getElementById("current-servings");
    const scaleBtns = recipePage.querySelectorAll(".scale-btn");
    const amountEls = recipePage.querySelectorAll(".ingredient-amount");
    const instructionEl = document.getElementById("recipe-instructions");
    const pizzaCalcEl = document.getElementById("pizza-calculator");

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

    if (pizzaCalcEl) {
      // Pizza Dough Calculator Mode
      const PRESETS = {
        hybrid: {
          num_pizzas: 6,
          diameter_cm: 28,
          dough_factor: 0.45,
          hydration_pct: 62,
          salt_pct: 2.5,
          oil_pct: 0,
          yeastiness_pct: 50,
          starter_pct: 10,
          starter_hyd_pct: 100,
          target_yeast_pct: 0.30
        },
        sugarspunrun: {
          num_pizzas: 1,
          diameter_cm: 30,
          dough_factor: 0.68,
          hydration_pct: 65,
          salt_pct: 1.2,
          oil_pct: 10,
          yeastiness_pct: 100,
          starter_pct: 10,
          starter_hyd_pct: 100,
          target_yeast_pct: 3.00
        },
        yeast100: {
          num_pizzas: 6,
          diameter_cm: 28,
          dough_factor: 0.45,
          hydration_pct: 62,
          salt_pct: 2.5,
          oil_pct: 0,
          yeastiness_pct: 100,
          starter_pct: 10,
          starter_hyd_pct: 100,
          target_yeast_pct: 0.30
        },
        sourdough100: {
          num_pizzas: 6,
          diameter_cm: 28,
          dough_factor: 0.45,
          hydration_pct: 62,
          salt_pct: 2.5,
          oil_pct: 0,
          yeastiness_pct: 0,
          starter_pct: 10,
          starter_hyd_pct: 100,
          target_yeast_pct: 0.30
        },
        neapolitan: {
          num_pizzas: 4,
          diameter_cm: 28,
          dough_factor: 0.40,
          hydration_pct: 65,
          salt_pct: 2.8,
          oil_pct: 0,
          yeastiness_pct: 100,
          starter_pct: 10,
          starter_hyd_pct: 100,
          target_yeast_pct: 0.20
        }
      };

      let presetBasePizzas = 6;

      const elNumPizzas = document.getElementById("calc-num-pizzas");
      const elDiameter = document.getElementById("calc-diameter");
      const elDiameterRange = document.getElementById("calc-diameter-range");
      const elFactor = document.getElementById("calc-factor");
      const elFactorRange = document.getElementById("calc-factor-range");
      const elFactorLabel = document.getElementById("calc-factor-label");
      const elHydration = document.getElementById("calc-hydration");
      const elHydrationRange = document.getElementById("calc-hydration-range");
      const elSalt = document.getElementById("calc-salt");
      const elSaltRange = document.getElementById("calc-salt-range");
      const elOil = document.getElementById("calc-oil");
      const elOilRange = document.getElementById("calc-oil-range");
      const elYeastiness = document.getElementById("calc-yeastiness");
      const elYeastinessRange = document.getElementById("calc-yeastiness-range");
      const elYeastinessBadge = document.getElementById("calc-yeastiness-badge");
      const elStarterPct = document.getElementById("calc-starter-pct");
      const elStarterHyd = document.getElementById("calc-starter-hyd");
      const elTargetYeast = document.getElementById("calc-target-yeast");

      const grpStarterPct = document.getElementById("calc-starter-pct-group");
      const grpStarterHyd = document.getElementById("calc-starter-hyd-group");
      const grpTargetYeast = document.getElementById("calc-target-yeast-group");

      const factorChips = pizzaCalcEl.querySelectorAll(".factor-chip");
      const presetBtns = pizzaCalcEl.querySelectorAll(".calc-preset-btn");

      function clampNum(val, min, max, fallback) {
        const n = parseFloat(val);
        if (isNaN(n)) return fallback;
        return Math.min(max, Math.max(min, n));
      }

      function setText(id, text) {
        const node = document.getElementById(id);
        if (node) node.textContent = text;
      }

      function updateFactorChipHighlight(factorVal) {
        factorChips.forEach((chip) => {
          const chipVal = parseFloat(chip.dataset.factor);
          chip.classList.toggle("active", Math.abs(chipVal - factorVal) < 0.005);
        });
      }

      function recalculatePizzaDough() {
        const num_pizzas = clampNum(elNumPizzas.value, 1, 100, 6);
        const diameter_cm = clampNum(elDiameter.value, 10, 100, 28);
        const dough_factor = clampNum(elFactor.value, 0.1, 2.0, 0.45);
        const hydration_pct = clampNum(elHydration.value, 30, 120, 62);
        const salt_pct = clampNum(elSalt.value, 0, 15, 2.5);
        const oil_pct = clampNum(elOil.value, 0, 50, 0);
        const yeastiness_pct = clampNum(elYeastiness.value, 0, 100, 50);
        const starter_pct = clampNum(elStarterPct.value, 0, 80, 10);
        const starter_hyd_pct = clampNum(elStarterHyd.value, 30, 300, 100);
        const target_yeast_pct = clampNum(elTargetYeast.value, 0, 20, 0.30);

        if (elFactorLabel) elFactorLabel.textContent = dough_factor.toFixed(2);
        if (elYeastinessBadge) elYeastinessBadge.textContent = `${Math.round(yeastiness_pct)}%`;
        updateFactorChipHighlight(dough_factor);

        // Interactive validation: disable starter fields at 100% yeastiness; disable yeast field at 0% yeastiness
        const isPureYeast = yeastiness_pct >= 100;
        const isPureSourdough = yeastiness_pct <= 0;

        if (elStarterPct) elStarterPct.disabled = isPureYeast;
        if (elStarterHyd) elStarterHyd.disabled = isPureYeast;
        if (grpStarterPct) grpStarterPct.classList.toggle("is-disabled", isPureYeast);
        if (grpStarterHyd) grpStarterHyd.classList.toggle("is-disabled", isPureYeast);

        if (elTargetYeast) elTargetYeast.disabled = isPureSourdough;
        if (grpTargetYeast) grpTargetYeast.classList.toggle("is-disabled", isPureSourdough);

        // Step 1: Unit Conversion (Percentages to Decimals)
        const H = hydration_pct / 100;
        const S = salt_pct / 100;
        const O = oil_pct / 100;
        const Y = yeastiness_pct / 100;
        const P_starter = starter_pct / 100;
        const H_starter = starter_hyd_pct / 100;
        const Y_target = target_yeast_pct / 100;

        // Step 2: Total Dough Weight Scaling
        const area = Math.PI * Math.pow(diameter_cm / 2, 2);
        const W_ball = area * dough_factor;
        const W_total = W_ball * num_pizzas;

        // Step 3: Salt & Effective Fresh Yeast
        const W_salt = W_total * S;
        const Y_effective = Y_target * Y;

        // Step 4: Total Component Weights
        const W_flour = (W_total - W_salt) / (1 + H + O + Y_effective);
        const W_water = W_flour * H;
        const W_oil = W_flour * O;
        const W_yeast = W_flour * Y_effective;

        // Step 5: Starter / Levain Decomposition
        const W_starter = W_total * P_starter * (1 - Y);
        const W_starter_flour = W_starter / (1 + H_starter);
        const W_starter_water = W_starter - W_starter_flour;

        // Step 6: Final Mix (What to Weigh During Final Mixing)
        const W_add_flour = W_flour - W_starter_flour;
        const W_add_water = W_water - W_starter_water;
        const W_add_salt = W_salt;
        const W_add_oil = W_oil;
        const W_add_yeast = W_yeast;
        const W_add_starter = W_starter;
        const W_check =
          W_add_flour +
          W_add_water +
          W_add_salt +
          W_add_oil +
          W_add_yeast +
          W_add_starter;

        // Optional Sugar Spun Run flavorings (scaled proportionally to total flour)
        const W_opt_sugar = W_flour * 0.02;
        const W_opt_garlic = W_flour * 0.003;
        const W_opt_basil = W_flour * 0.0015;
        const W_dry_yeast = W_add_yeast / 3;

        // Update Summary Bar (1 decimal place)
        setText("calc-out-total-dough", `${W_total.toFixed(1)} g`);
        setText("calc-out-ball-weight", `${W_ball.toFixed(1)} g`);
        setText("calc-out-total-flour", `${W_flour.toFixed(1)} g`);
        setText("calc-out-total-water", `${W_water.toFixed(1)} g`);

        // Update Technical Details (3 decimal places for reference verification)
        setText("tech-ball", `${W_ball.toFixed(3)} g`);
        setText("tech-total", `${W_total.toFixed(3)} g`);
        setText("tech-eff-yeast", `${(Y_effective * 100).toFixed(2)}%`);
        setText("tech-flour", `${W_flour.toFixed(3)} g`);
        setText("tech-water", `${W_water.toFixed(3)} g`);
        setText(
          "tech-starter-split",
          `${W_starter_flour.toFixed(3)} g / ${W_starter_water.toFixed(3)} g`
        );
        setText("tech-add-flour", `${W_add_flour.toFixed(3)} g`);
        setText("tech-add-water", `${W_add_water.toFixed(3)} g`);
        setText("tech-add-salt", `${W_add_salt.toFixed(3)} g`);
        setText("tech-add-oil", `${W_add_oil.toFixed(3)} g`);
        setText("tech-add-yeast", `${W_add_yeast.toFixed(3)} g`);
        setText("tech-add-starter", `${W_add_starter.toFixed(3)} g`);
        setText("tech-check", `${W_check.toFixed(3)} g`);

        // Update Header Servings
        if (servingsEl) {
          servingsEl.textContent = `${num_pizzas} (${W_ball.toFixed(0)} g/gab.)`;
        }

        // Update Recipe Ingredients List (Final Mixing Checklist)
        const calcAmounts = {
          add_flour: W_add_flour,
          add_water: W_add_water,
          add_salt: W_add_salt,
          add_oil: W_add_oil,
          add_yeast: W_add_yeast,
          add_starter: W_add_starter,
          opt_sugar: W_opt_sugar,
          opt_garlic: W_opt_garlic,
          opt_basil: W_opt_basil
        };

        Object.keys(calcAmounts).forEach((key) => {
          const val = calcAmounts[key];
          const formatted = `${val.toFixed(1)} g`;
          const amountNode = recipePage.querySelector(`[data-calc-amount="${key}"]`);
          const rowNode = recipePage.querySelector(`[data-calc-row="${key}"]`);
          if (amountNode) {
            amountNode.textContent = formatted;
            amountNode.dataset.baseAmount = formatted;
          }
          if (rowNode) {
            rowNode.classList.toggle("ingredient-unused", val < 0.05);
          }
        });

        // Update dynamic ingredient descriptions (dry yeast equivalent & starter breakdown)
        const yeastNameNode = recipePage.querySelector('[data-calc-name="add_yeast"]');
        if (yeastNameNode) {
          yeastNameNode.textContent =
            W_add_yeast >= 0.05
              ? `svaigais raugs (vai ${W_dry_yeast.toFixed(1)} g sausais raugs)`
              : "svaigais raugs (šajā režīmā neizmanto)";
        }

        const starterNameNode = recipePage.querySelector('[data-calc-name="add_starter"]');
        if (starterNameNode) {
          starterNameNode.textContent =
            W_add_starter >= 0.05
              ? `aktīvs ieraugs (${starter_hyd_pct}% hidratācija: ${W_starter_flour.toFixed(1)} g milti + ${W_starter_water.toFixed(1)} g ūdens)`
              : "aktīvs ieraugs (šajā režīmā neizmanto)";
        }

        // Update Inline Amounts in Instructions
        const inlineValues = {
          add_water: `${W_add_water.toFixed(1)} g`,
          add_starter: `${W_add_starter.toFixed(1)} g`,
          add_yeast: `${W_add_yeast.toFixed(1)} g`,
          add_dry_yeast: `${W_dry_yeast.toFixed(1)} g`,
          opt_sugar: `${W_opt_sugar.toFixed(1)} g`,
          add_flour_half: `${(W_add_flour / 2).toFixed(1)} g`,
          add_flour_half2: `${(W_add_flour / 2).toFixed(1)} g`,
          add_salt: `${W_add_salt.toFixed(1)} g`,
          opt_garlic: `${W_opt_garlic.toFixed(1)} g`,
          opt_basil: `${W_opt_basil.toFixed(1)} g`,
          add_oil: `${W_add_oil.toFixed(1)} g`,
          total_dough: `${W_total.toFixed(1)} g`,
          num_pizzas: `${num_pizzas} gab.`,
          ball_weight: `${W_ball.toFixed(1)} g`,
          diameter_cm: `${diameter_cm} cm`
        };

        Object.keys(inlineValues).forEach((key) => {
          recipePage.querySelectorAll(`[data-calc-inline="${key}"]`).forEach((el) => {
            el.textContent = inlineValues[key];
          });
        });
      }

      // Bind two-way range + number input pairs
      function bindRangeAndNumber(rangeEl, numEl) {
        if (!rangeEl || !numEl) return;
        rangeEl.addEventListener("input", () => {
          numEl.value = rangeEl.value;
          presetBtns.forEach((b) => b.classList.remove("active"));
          recalculatePizzaDough();
        });
        numEl.addEventListener("input", () => {
          rangeEl.value = numEl.value;
          presetBtns.forEach((b) => b.classList.remove("active"));
          recalculatePizzaDough();
        });
      }

      bindRangeAndNumber(elDiameterRange, elDiameter);
      bindRangeAndNumber(elFactorRange, elFactor);
      bindRangeAndNumber(elHydrationRange, elHydration);
      bindRangeAndNumber(elSaltRange, elSalt);
      bindRangeAndNumber(elOilRange, elOil);
      bindRangeAndNumber(elYeastinessRange, elYeastiness);

      [elNumPizzas, elStarterPct, elStarterHyd, elTargetYeast].forEach((inputEl) => {
        if (!inputEl) return;
        inputEl.addEventListener("input", () => {
          presetBtns.forEach((b) => b.classList.remove("active"));
          recalculatePizzaDough();
        });
      });

      // Factor quick chips
      factorChips.forEach((chip) => {
        chip.addEventListener("click", () => {
          const f = chip.dataset.factor;
          if (elFactor) elFactor.value = f;
          if (elFactorRange) elFactorRange.value = f;
          presetBtns.forEach((b) => b.classList.remove("active"));
          recalculatePizzaDough();
        });
      });

      // Preset buttons
      presetBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const presetKey = btn.dataset.preset;
          const p = PRESETS[presetKey];
          if (!p) return;

          presetBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          presetBasePizzas = p.num_pizzas;
          elNumPizzas.value = p.num_pizzas;
          elDiameter.value = p.diameter_cm;
          if (elDiameterRange) elDiameterRange.value = p.diameter_cm;
          elFactor.value = p.dough_factor.toFixed(2);
          if (elFactorRange) elFactorRange.value = p.dough_factor;
          elHydration.value = p.hydration_pct;
          if (elHydrationRange) elHydrationRange.value = p.hydration_pct;
          elSalt.value = p.salt_pct;
          if (elSaltRange) elSaltRange.value = p.salt_pct;
          elOil.value = p.oil_pct;
          if (elOilRange) elOilRange.value = p.oil_pct;
          elYeastiness.value = p.yeastiness_pct;
          if (elYeastinessRange) elYeastinessRange.value = p.yeastiness_pct;
          elStarterPct.value = p.starter_pct;
          elStarterHyd.value = p.starter_hyd_pct;
          elTargetYeast.value = p.target_yeast_pct.toFixed(2);

          scaleBtns.forEach((b) => b.classList.toggle("active", b.dataset.scale === "1"));
          recalculatePizzaDough();
        });
      });

      // Connect scale buttons (0.5x, 1x, 2x, 3x) to calculator's num_pizzas
      scaleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const factor = parseFloat(btn.dataset.scale) || 1;
          scaleBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          elNumPizzas.value = Math.max(1, Math.round(presetBasePizzas * factor));
          recalculatePizzaDough();
        });
      });

      // Initial calculation on page load
      recalculatePizzaDough();
    } else {
      // Standard Recipe Portion Scaling
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
    }

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

    // 3. Live Git Commit Version History (via GitHub REST API)
    const historyDetails = document.getElementById("recipe-history-details");
    const historyList = document.getElementById("recipe-history-list");
    const historyStatus = document.getElementById("recipe-history-status");
    const versionBadge = document.getElementById("recipe-version-badge");

    if (historyDetails && historyList && historyStatus) {
      const repo = historyDetails.dataset.repo || "HermanisV/gurkis.lv";
      const branch = historyDetails.dataset.branch || "main";
      const recipePath = historyDetails.dataset.recipePath || "";
      const cacheKey = `gurkis_commits_${repo}_${branch}_${recipePath}`;
      const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

      function formatLatvianDate(isoString) {
        if (!isoString) return "";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;
      }

      function renderCommits(commits) {
        if (!Array.isArray(commits) || commits.length === 0) {
          historyStatus.textContent =
            "Šai receptei GitHub repozitorijā vēl nav atrasta publiska izmaiņu vēsture.";
          historyStatus.hidden = false;
          historyList.hidden = true;
          return;
        }

        const total = commits.length;
        if (versionBadge) {
          versionBadge.textContent =
            total === 1 ? "1 versija" : `${total} versijas`;
          versionBadge.hidden = false;
        }

        historyList.innerHTML = "";
        commits.forEach((entry, idx) => {
          const sha = entry.sha || "";
          const shortSha = sha.slice(0, 7);
          const commitObj = entry.commit || {};
          const rawMessage = (commitObj.message || "Izmaiņas receptē").trim();
          const lines = rawMessage.split(/\r?\n/);
          const headline = lines[0];
          const bodyText = lines.slice(1).join("\n").trim();
          const authorName =
            (commitObj.author && commitObj.author.name) ||
            (entry.author && entry.author.login) ||
            "Autors";
          const commitDate =
            commitObj.author && commitObj.author.date
              ? formatLatvianDate(commitObj.author.date)
              : "";
          const commitUrl =
            entry.html_url || `https://github.com/${repo}/commit/${sha}`;
          const versionNum = total - idx;

          const li = document.createElement("li");
          li.className = "history-item";

          const headerRow = document.createElement("div");
          headerRow.className = "history-item-header";

          const leftMeta = document.createElement("div");
          leftMeta.className = "history-item-meta";

          const verTag = document.createElement("span");
          verTag.className = "history-version-pill";
          verTag.textContent = `v${versionNum}`;
          leftMeta.appendChild(verTag);

          if (commitDate) {
            const dateSpan = document.createElement("time");
            dateSpan.className = "history-date";
            dateSpan.dateTime = commitObj.author.date;
            dateSpan.textContent = commitDate;
            leftMeta.appendChild(dateSpan);
          }

          const authorSpan = document.createElement("span");
          authorSpan.className = "history-author";
          authorSpan.textContent = `· ${authorName}`;
          leftMeta.appendChild(authorSpan);

          const shaLink = document.createElement("a");
          shaLink.className = "history-sha-link";
          shaLink.href = commitUrl;
          shaLink.target = "_blank";
          shaLink.rel = "noopener noreferrer";
          shaLink.title = "Skatīt konkrētās izmaiņas (diff) GitHub";
          shaLink.textContent = `${shortSha} ↗`;

          headerRow.appendChild(leftMeta);
          headerRow.appendChild(shaLink);

          const msgEl = document.createElement("div");
          msgEl.className = "history-message";
          msgEl.textContent = headline;

          li.appendChild(headerRow);
          li.appendChild(msgEl);

          if (bodyText) {
            const bodyEl = document.createElement("pre");
            bodyEl.className = "history-message-body";
            bodyEl.textContent = bodyText;
            li.appendChild(bodyEl);
          }

          historyList.appendChild(li);
        });

        historyStatus.hidden = true;
        historyList.hidden = false;
      }

      async function loadCommitHistory() {
        if (!recipePath) {
          historyStatus.textContent = "Receptes faila ceļš nav norādīts.";
          return;
        }

        // Check sessionStorage cache first
        try {
          const cachedRaw = sessionStorage.getItem(cacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
              renderCommits(cached.data);
              return;
            }
          }
        } catch (_e) {
          // Ignore sessionStorage errors in private browsing
        }

        const apiUrl = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(
          recipePath
        )}&sha=${encodeURIComponent(branch)}&per_page=15`;

        try {
          const response = await fetch(apiUrl, {
            headers: {
              Accept: "application/vnd.github+json"
            }
          });

          if (!response.ok) {
            throw new Error(`GitHub API status ${response.status}`);
          }

          const data = await response.json();
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ timestamp: Date.now(), data: data })
            );
          } catch (_e) {
            // Ignore quota errors
          }

          renderCommits(data);
        } catch (_err) {
          historyStatus.innerHTML = `Neizdevās automātiski ielādēt versiju sarakstu no GitHub API. <a href="https://github.com/${repo}/commits/${branch}/${recipePath}" target="_blank" rel="noopener noreferrer">Atvērt vēsturi GitHub ↗</a>`;
          historyStatus.hidden = false;
          historyList.hidden = true;
        }
      }

      loadCommitHistory();
    }
  }
})();

