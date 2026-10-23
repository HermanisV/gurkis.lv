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

  // 2. Recipe Page Interactive Features (Portion Scaling, Pizza Calculator, Checklists & Version Switching)
  const recipePage = document.querySelector(".recipe-page");
  if (recipePage) {
    let baseServings = parseFloat(recipePage.dataset.baseServings) || 4;
    const servingsEl = document.getElementById("current-servings");
    const scaleBtns = recipePage.querySelectorAll(".scale-btn");
    const ingredientsGroupsEl = document.getElementById("recipe-ingredients-groups");
    const instructionEl = document.getElementById("recipe-instructions");
    const pizzaCalcEl = document.getElementById("pizza-calculator");
    const breadCalcEl = document.getElementById("bread-calculator");
    const hasCalculator = Boolean(pizzaCalcEl || breadCalcEl);
    const titleEl = recipePage.querySelector(".recipe-title");
    const leadEl = recipePage.querySelector(".recipe-lead");

    let amountEls = [];
    let inlineAmountEls = [];

    function bindInteractiveRecipeElements() {
      amountEls = Array.from(recipePage.querySelectorAll(".ingredient-amount"));
      inlineAmountEls = [];

      if (instructionEl) {
        instructionEl.querySelectorAll("strong").forEach((strongEl) => {
          const txt = (strongEl.dataset.baseAmount || strongEl.textContent || "").trim();
          const hasUnit = /\b(g|kg|ml|l|tk|ēk|gab\.)(\b|$)/i.test(txt);
          const isTempOrTime = /(°\s*C|min|sek|stund|dien|nedēļ)/i.test(txt);
          if (hasUnit && !isTempOrTime && /\d/.test(txt)) {
            strongEl.dataset.baseAmount = txt;
            inlineAmountEls.push(strongEl);
          }
        });
      }

      // Ingredient checklist toggle
      recipePage.querySelectorAll(".ingredient-row").forEach((row) => {
        if (row.dataset.boundCheck === "1") return;
        row.dataset.boundCheck = "1";
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
      if (instructionEl) {
        instructionEl.querySelectorAll("ol li").forEach((step) => {
          if (step.dataset.boundStep === "1") return;
          step.dataset.boundStep = "1";
          step.addEventListener("click", () => {
            step.classList.toggle("step-done");
          });
        });
      }
    }

    bindInteractiveRecipeElements();

    // Screen Wake Lock Toggle ("Turēt ekrānu ieslēgtu")
    const wakeLockContainer = document.getElementById("wake-lock-container");
    const wakeLockBtn = document.getElementById("wake-lock-toggle");

    if (wakeLockContainer && wakeLockBtn) {
      if (!("wakeLock" in navigator)) {
        wakeLockContainer.hidden = true;
      } else {
        let wakeLockSentinel = null;
        let wakeLockDesired = true;
        try {
          if (localStorage.getItem("gurkis_wake_lock") === "0") {
            wakeLockDesired = false;
          }
        } catch (_e) {
          // Ignore localStorage errors
        }

        function updateWakeLockUI(isActive) {
          wakeLockBtn.classList.toggle("active", Boolean(isActive));
          wakeLockBtn.setAttribute("aria-checked", isActive ? "true" : "false");
        }

        async function acquireWakeLock() {
          if (!wakeLockDesired || document.visibilityState !== "visible") return;
          if (wakeLockSentinel && !wakeLockSentinel.released) {
            updateWakeLockUI(true);
            return;
          }
          try {
            wakeLockSentinel = await navigator.wakeLock.request("screen");
            updateWakeLockUI(true);
            wakeLockSentinel.addEventListener("release", () => {
              if (!wakeLockDesired) {
                updateWakeLockUI(false);
              }
            });
          } catch (_err) {
            updateWakeLockUI(false);
          }
        }

        async function releaseWakeLock() {
          if (wakeLockSentinel) {
            try {
              await wakeLockSentinel.release();
            } catch (_err) {
              // Ignore release errors
            }
            wakeLockSentinel = null;
          }
          updateWakeLockUI(false);
        }

        wakeLockBtn.addEventListener("click", () => {
          const isCurrentlyActive = wakeLockBtn.classList.contains("active");
          wakeLockDesired = !isCurrentlyActive;
          try {
            localStorage.setItem("gurkis_wake_lock", wakeLockDesired ? "1" : "0");
          } catch (_e) {
            // Ignore localStorage errors
          }

          if (wakeLockDesired) {
            acquireWakeLock();
          } else {
            releaseWakeLock();
          }
        });

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && wakeLockDesired) {
            acquireWakeLock();
          }
        });

        // Attempt to acquire immediately if enabled by default, and retry on first tap if browser requires gesture
        if (wakeLockDesired) {
          acquireWakeLock();
          const onFirstInteraction = (e) => {
            if (wakeLockBtn.contains(e.target)) return;
            if (wakeLockDesired && (!wakeLockSentinel || wakeLockSentinel.released)) {
              acquireWakeLock();
            }
          };
          document.addEventListener("click", onFirstInteraction, { once: true, passive: true });
          document.addEventListener("touchstart", onFirstInteraction, { once: true, passive: true });
        }
      }
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

    function applyCurrentScaleFactor(factor) {
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
    } else if (breadCalcEl) {
      // Sourdough Bread Calculator Mode (Baker's % relative to bowl flour)
      const BREAD_PRESETS = {
        alexandra: {
          num_loaves: 1,
          flour_per_loaf: 500,
          temp_c: 21,
          hydration_pct: 75,
          starter_pct: 20,
          salt_pct: 2.4,
          starter_hyd_pct: 100,
          wholewheat_pct: 0,
          rye_pct: 0,
          spelt_pct: 0,
          auto_hydration: true
        },
        warm_kitchen: {
          num_loaves: 1,
          flour_per_loaf: 500,
          temp_c: 25,
          hydration_pct: 75,
          starter_pct: 10,
          salt_pct: 2.4,
          starter_hyd_pct: 100,
          wholewheat_pct: 0,
          rye_pct: 0,
          spelt_pct: 0,
          auto_hydration: true
        },
        country_wholewheat: {
          num_loaves: 1,
          flour_per_loaf: 500,
          temp_c: 21,
          hydration_pct: 75,
          starter_pct: 20,
          salt_pct: 2.4,
          starter_hyd_pct: 100,
          wholewheat_pct: 20,
          rye_pct: 0,
          spelt_pct: 0,
          auto_hydration: true
        },
        rye_blend: {
          num_loaves: 1,
          flour_per_loaf: 500,
          temp_c: 21,
          hydration_pct: 75,
          starter_pct: 20,
          salt_pct: 2.4,
          starter_hyd_pct: 100,
          wholewheat_pct: 0,
          rye_pct: 30,
          spelt_pct: 0,
          auto_hydration: true
        },
        spelt_loaf: {
          num_loaves: 1,
          flour_per_loaf: 500,
          temp_c: 21,
          hydration_pct: 75,
          starter_pct: 20,
          salt_pct: 2.4,
          starter_hyd_pct: 100,
          wholewheat_pct: 0,
          rye_pct: 0,
          spelt_pct: 50,
          auto_hydration: true
        }
      };

      let presetBaseLoaves = 1;

      const elNumLoaves = document.getElementById("bread-num-loaves");
      const elFlourPerLoaf = document.getElementById("bread-flour-per-loaf");
      const elFlourPerLoafRange = document.getElementById("bread-flour-per-loaf-range");
      const elTemp = document.getElementById("bread-temp");
      const elTempRange = document.getElementById("bread-temp-range");
      const elTempBadge = document.getElementById("bread-temp-badge");
      const elHydration = document.getElementById("bread-hydration");
      const elHydrationRange = document.getElementById("bread-hydration-range");
      const elEffHydrationBadge = document.getElementById("bread-eff-hydration-badge");
      const elStarterPct = document.getElementById("bread-starter-pct");
      const elStarterPctRange = document.getElementById("bread-starter-pct-range");
      const elSaltPct = document.getElementById("bread-salt-pct");
      const elSaltPctRange = document.getElementById("bread-salt-pct-range");
      const elStarterHyd = document.getElementById("bread-starter-hyd");

      const elWholewheatPct = document.getElementById("bread-wholewheat-pct");
      const elWholewheatPctRange = document.getElementById("bread-wholewheat-pct-range");
      const elRyePct = document.getElementById("bread-rye-pct");
      const elRyePctRange = document.getElementById("bread-rye-pct-range");
      const elSpeltPct = document.getElementById("bread-spelt-pct");
      const elSpeltPctRange = document.getElementById("bread-spelt-pct-range");
      const elAutoHydration = document.getElementById("bread-auto-hydration");
      const elHydCorrNote = document.getElementById("bread-hyd-corr-note");
      const elFlourWarning = document.getElementById("bread-flour-warning");

      const sizeChips = breadCalcEl.querySelectorAll(".bread-size-chip");
      const presetBtns = breadCalcEl.querySelectorAll(".calc-preset-btn");

      function clampBreadNum(val, min, max, fallback) {
        const n = parseFloat(val);
        if (isNaN(n)) return fallback;
        return Math.min(max, Math.max(min, n));
      }

      function setBreadText(id, text) {
        const node = document.getElementById(id);
        if (node) node.textContent = text;
      }

      function formatGramDisplay(val, stepHalf) {
        if (stepHalf) {
          const r = Math.round(val * 2) / 2;
          return r % 1 === 0 ? `${r.toFixed(0)} g` : `${r.toFixed(1)} g`;
        }
        return `${Math.round(val)} g`;
      }

      // Estimate bulk fermentation range (hours) based on kitchen temp (C) & starter % of bowl flour
      // Calibrated to Alexandra's benchmarks:
      // - 21 °C @ 20% starter -> 8–10 h
      // - 25 °C @ 20% starter -> 4–6 h
      // - 10% starter (50 g) increases time by ~30%
      function estimateBulkFermentation(tempC, starterPct) {
        const tempFactor = Math.pow(2, (21 - tempC) / 4.5);
        const starterFactor = Math.pow(20 / Math.max(2, starterPct), 0.38);
        const midHours = 9.0 * tempFactor * starterFactor;
        const low = Math.max(2, Math.round(midHours * 0.88 * 2) / 2);
        const high = Math.max(low + 1, Math.round(midHours * 1.12 * 2) / 2);
        const fmt = (n) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1));
        return {
          shortLabel: `${fmt(low)}–${fmt(high)} h`,
          longLabel: `${fmt(low)}–${fmt(high)} stundas`
        };
      }

      function rebalanceSpecialtyFlours(changedInput) {
        let ww = clampBreadNum(elWholewheatPct.value, 0, 100, 0);
        let rye = clampBreadNum(elRyePct.value, 0, 100, 0);
        let spelt = clampBreadNum(elSpeltPct.value, 0, 100, 0);
        const sum = ww + rye + spelt;
        if (sum > 100) {
          const excess = sum - 100;
          if (changedInput === "ww") {
            const others = rye + spelt;
            if (others > 0) {
              rye = Math.max(0, Math.round(rye - (excess * rye) / others));
              spelt = Math.max(0, 100 - ww - rye);
            } else {
              ww = 100;
            }
          } else if (changedInput === "rye") {
            const others = ww + spelt;
            if (others > 0) {
              ww = Math.max(0, Math.round(ww - (excess * ww) / others));
              spelt = Math.max(0, 100 - rye - ww);
            } else {
              rye = 100;
            }
          } else if (changedInput === "spelt") {
            const others = ww + rye;
            if (others > 0) {
              ww = Math.max(0, Math.round(ww - (excess * ww) / others));
              rye = Math.max(0, 100 - spelt - ww);
            } else {
              spelt = 100;
            }
          }
          elWholewheatPct.value = ww;
          if (elWholewheatPctRange) elWholewheatPctRange.value = ww;
          elRyePct.value = rye;
          if (elRyePctRange) elRyePctRange.value = rye;
          elSpeltPct.value = spelt;
          if (elSpeltPctRange) elSpeltPctRange.value = spelt;
        }
      }

      function recalculateBreadDough() {
        const num_loaves = clampBreadNum(elNumLoaves.value, 1, 50, 1);
        const flour_per_loaf = clampBreadNum(elFlourPerLoaf.value, 100, 3000, 500);
        const temp_c = clampBreadNum(elTemp.value, 12, 38, 21);
        const base_hyd_pct = clampBreadNum(elHydration.value, 45, 120, 75);
        const starter_pct = clampBreadNum(elStarterPct.value, 1, 80, 20);
        const salt_pct = clampBreadNum(elSaltPct.value, 0, 6, 2.4);
        const starter_hyd_pct = clampBreadNum(elStarterHyd.value, 40, 250, 100);

        let ww_pct = clampBreadNum(elWholewheatPct.value, 0, 100, 0);
        let rye_pct = clampBreadNum(elRyePct.value, 0, 100, 0);
        let spelt_pct = clampBreadNum(elSpeltPct.value, 0, 100, 0);
        if (ww_pct + rye_pct + spelt_pct > 100) {
          const scale = 100 / (ww_pct + rye_pct + spelt_pct);
          ww_pct = Math.round(ww_pct * scale);
          rye_pct = Math.round(rye_pct * scale);
          spelt_pct = Math.max(0, 100 - ww_pct - rye_pct);
        }
        const wheat_pct = Math.max(0, 100 - ww_pct - rye_pct - spelt_pct);

        // Highlight size chip
        sizeChips.forEach((chip) => {
          const chipVal = parseFloat(chip.dataset.flour);
          chip.classList.toggle("active", Math.abs(chipVal - flour_per_loaf) < 1);
        });

        // Hydration auto-correction for flour blend (+10 pp whole wheat, +15 pp rye, -5 pp spelt)
        const rawCorrPct = 0.10 * ww_pct + 0.15 * rye_pct - 0.05 * spelt_pct;
        const autoHydOn = Boolean(elAutoHydration && elAutoHydration.checked);
        const appliedCorrPct = autoHydOn ? rawCorrPct : 0;
        const eff_hyd_pct = Math.max(45, base_hyd_pct + appliedCorrPct);

        if (elHydCorrNote) {
          const sign = rawCorrPct >= 0 ? "+" : "";
          elHydCorrNote.textContent = `(${sign}${rawCorrPct.toFixed(1)}%)`;
        }
        if (elEffHydrationBadge) {
          elEffHydrationBadge.textContent = `${eff_hyd_pct.toFixed(1)}%`;
        }
        if (elTempBadge) {
          const tempStr = temp_c % 1 === 0 ? temp_c.toFixed(0) : temp_c.toFixed(1);
          elTempBadge.textContent = `${tempStr} °C`;
        }

        // Core Baker's Math (relative to bowl flour F)
        const F_bowl = flour_per_loaf * num_loaves;
        const W_wheat = (F_bowl * wheat_pct) / 100;
        const W_ww = (F_bowl * ww_pct) / 100;
        const W_rye = (F_bowl * rye_pct) / 100;
        const W_spelt = (F_bowl * spelt_pct) / 100;

        const W_water = (F_bowl * eff_hyd_pct) / 100;
        const W_starter = (F_bowl * starter_pct) / 100;
        const W_salt = (F_bowl * salt_pct) / 100;

        const H_starter = starter_hyd_pct / 100;
        const W_starter_flour = W_starter / (1 + H_starter);
        const W_starter_water = W_starter - W_starter_flour;

        const W_total_flour = F_bowl + W_starter_flour;
        const W_total_water = W_water + W_starter_water;
        const W_total_dough = F_bowl + W_water + W_starter + W_salt;
        const W_loaf = W_total_dough / num_loaves;

        const true_hyd_pct = (W_total_water / W_total_flour) * 100;
        const true_salt_pct = (W_salt / W_total_flour) * 100;

        // Flour badges in Card 3
        setBreadText(
          "bread-wheat-pct-badge",
          `${Math.round(wheat_pct)}% (${formatGramDisplay(W_wheat, false)})`
        );
        setBreadText("bread-wholewheat-gram-badge", `${Math.round(ww_pct)}% (${formatGramDisplay(W_ww, false)})`);
        setBreadText("bread-rye-gram-badge", `${Math.round(rye_pct)}% (${formatGramDisplay(W_rye, false)})`);
        setBreadText("bread-spelt-gram-badge", `${Math.round(spelt_pct)}% (${formatGramDisplay(W_spelt, false)})`);

        // Warnings for high rye or high spelt
        if (elFlourWarning) {
          const warnings = [];
          if (rye_pct > 40) {
            warnings.push(
              "⚠️ Rudzu milti pārsniedz 40% — mīkla būs lipīga un neveidos klasisku lipekļa tīklu. Locīšanu veic ar mitrām rokām vai cep maizes veidnē."
            );
          }
          if (spelt_pct > 60) {
            warnings.push(
              "ℹ️ Augsts speltas miltu īpatsvars (> 60%) — spelta ātrāk pārmīcās un mīkla ir maigāka; locīšanu veic saudzīgi."
            );
          }
          if (warnings.length > 0) {
            elFlourWarning.textContent = warnings.join(" ");
            elFlourWarning.hidden = false;
          } else {
            elFlourWarning.hidden = true;
          }
        }

        // Bulk fermentation estimate
        const bulkEst = estimateBulkFermentation(temp_c, starter_pct);
        setBreadText("bread-out-bulk-inline", bulkEst.longLabel);
        setBreadText("bread-out-bulk-time", bulkEst.shortLabel);
        const summaryBulkLabel = breadCalcEl.querySelector(
          "#bread-out-bulk-time"
        )?.previousElementSibling;
        if (summaryBulkLabel) {
          const tempStr = temp_c % 1 === 0 ? temp_c.toFixed(0) : temp_c.toFixed(1);
          summaryBulkLabel.textContent = `Pirmā raudzēšana (${tempStr} °C)`;
        }

        // Update Summary Bar
        setBreadText("bread-out-total-dough", formatGramDisplay(W_total_dough, false));
        setBreadText("bread-out-loaf-weight", formatGramDisplay(W_loaf, false));
        setBreadText("bread-out-true-hydration", `${true_hyd_pct.toFixed(1)}%`);

        // Update Technical Details
        setBreadText("bread-tech-bowl-flour", `${F_bowl.toFixed(1)} g`);
        setBreadText(
          "bread-tech-flour-split",
          `${W_wheat.toFixed(1)} / ${W_ww.toFixed(1)} / ${W_rye.toFixed(1)} / ${W_spelt.toFixed(1)} g`
        );
        setBreadText("bread-tech-eff-hyd", `${eff_hyd_pct.toFixed(2)}%`);
        setBreadText("bread-tech-water", `${W_water.toFixed(1)} g`);
        setBreadText("bread-tech-starter", `${W_starter.toFixed(1)} g`);
        setBreadText(
          "bread-tech-starter-split",
          `${W_starter_flour.toFixed(1)} g / ${W_starter_water.toFixed(1)} g`
        );
        setBreadText("bread-tech-salt", `${W_salt.toFixed(1)} g`);
        setBreadText("bread-tech-total-flour", `${W_total_flour.toFixed(1)} g`);
        setBreadText("bread-tech-total-water", `${W_total_water.toFixed(1)} g`);
        setBreadText("bread-tech-true-hyd", `${true_hyd_pct.toFixed(2)}%`);
        setBreadText("bread-tech-true-salt", `${true_salt_pct.toFixed(2)}%`);
        setBreadText("bread-tech-check", `${W_total_dough.toFixed(1)} g`);

        // Update Header Servings
        if (servingsEl) {
          servingsEl.textContent = `${num_loaves} (${Math.round(W_loaf)} g/gab.)`;
        }

        // Update Ingredient Checklist Rows (hide 0 g specialty flours)
        const ingredientMap = {
          add_starter: { val: W_starter, halfStep: false, hideWhenZero: false },
          add_water: { val: W_water, halfStep: false, hideWhenZero: false },
          flour_wheat: { val: W_wheat, halfStep: false, hideWhenZero: true },
          flour_wholewheat: { val: W_ww, halfStep: false, hideWhenZero: true },
          flour_rye: { val: W_rye, halfStep: false, hideWhenZero: true },
          flour_spelt: { val: W_spelt, halfStep: false, hideWhenZero: true },
          add_salt: { val: W_salt, halfStep: true, hideWhenZero: false }
        };

        Object.keys(ingredientMap).forEach((key) => {
          const cfg = ingredientMap[key];
          const formatted = formatGramDisplay(cfg.val, cfg.halfStep);
          const amountNode = recipePage.querySelector(`[data-calc-amount="${key}"]`);
          const rowNode = recipePage.querySelector(`[data-calc-row="${key}"]`);
          if (amountNode) {
            amountNode.textContent = formatted;
            amountNode.dataset.baseAmount = formatted;
          }
          if (rowNode) {
            const isZero = cfg.val < 0.5;
            if (cfg.hideWhenZero) {
              rowNode.hidden = isZero;
            } else {
              rowNode.classList.toggle("ingredient-unused", isZero);
            }
          }
        });

        // Update dynamic starter description
        const starterNameNode = recipePage.querySelector('[data-calc-name="add_starter"]');
        if (starterNameNode) {
          starterNameNode.textContent = `aktīvs, burbuļojošs ieraugs (${Math.round(starter_hyd_pct)}% hidratācija: ${formatGramDisplay(W_starter_flour, false)} milti + ${formatGramDisplay(W_starter_water, false)} ūdens)`;
        }

        // Build readable inline flour breakdown
        const breakdownParts = [];
        if (W_wheat >= 0.5) breakdownParts.push(`${formatGramDisplay(W_wheat, false)} kviešu`);
        if (W_ww >= 0.5) breakdownParts.push(`${formatGramDisplay(W_ww, false)} pilngraudu kviešu`);
        if (W_rye >= 0.5) breakdownParts.push(`${formatGramDisplay(W_rye, false)} rudzu`);
        if (W_spelt >= 0.5) breakdownParts.push(`${formatGramDisplay(W_spelt, false)} speltas`);

        const tempInlineStr = temp_c % 1 === 0 ? `${temp_c.toFixed(0)} °C` : `${temp_c.toFixed(1)} °C`;
        const inlineValues = {
          add_starter: formatGramDisplay(W_starter, false),
          add_water: formatGramDisplay(W_water, false),
          flour_total: formatGramDisplay(F_bowl, false),
          flour_breakdown: breakdownParts.join(" + "),
          add_salt: formatGramDisplay(W_salt, true),
          total_dough: formatGramDisplay(W_total_dough, false),
          kitchen_temp: tempInlineStr,
          starter_pct_label: `${Math.round(starter_pct)}%`,
          bulk_time: bulkEst.longLabel,
          num_loaves: `${num_loaves} gab.`,
          num_loaves_bake: `${num_loaves} gab.`,
          loaf_weight: formatGramDisplay(W_loaf, false)
        };

        Object.keys(inlineValues).forEach((key) => {
          recipePage.querySelectorAll(`[data-calc-inline="${key}"]`).forEach((el) => {
            el.textContent = inlineValues[key];
          });
        });
      }

      function bindBreadRangeAndNumber(rangeEl, numEl, onBeforeCalc) {
        if (!rangeEl || !numEl) return;
        rangeEl.addEventListener("input", () => {
          numEl.value = rangeEl.value;
          presetBtns.forEach((b) => b.classList.remove("active"));
          if (onBeforeCalc) onBeforeCalc();
          recalculateBreadDough();
        });
        numEl.addEventListener("input", () => {
          rangeEl.value = numEl.value;
          presetBtns.forEach((b) => b.classList.remove("active"));
          if (onBeforeCalc) onBeforeCalc();
          recalculateBreadDough();
        });
      }

      bindBreadRangeAndNumber(elFlourPerLoafRange, elFlourPerLoaf);
      bindBreadRangeAndNumber(elTempRange, elTemp);
      bindBreadRangeAndNumber(elHydrationRange, elHydration);
      bindBreadRangeAndNumber(elStarterPctRange, elStarterPct);
      bindBreadRangeAndNumber(elSaltPctRange, elSaltPct);
      bindBreadRangeAndNumber(elWholewheatPctRange, elWholewheatPct, () =>
        rebalanceSpecialtyFlours("ww")
      );
      bindBreadRangeAndNumber(elRyePctRange, elRyePct, () =>
        rebalanceSpecialtyFlours("rye")
      );
      bindBreadRangeAndNumber(elSpeltPctRange, elSpeltPct, () =>
        rebalanceSpecialtyFlours("spelt")
      );

      [elNumLoaves, elStarterHyd].forEach((inputEl) => {
        if (!inputEl) return;
        inputEl.addEventListener("input", () => {
          presetBtns.forEach((b) => b.classList.remove("active"));
          recalculateBreadDough();
        });
      });

      if (elAutoHydration) {
        elAutoHydration.addEventListener("change", () => {
          presetBtns.forEach((b) => b.classList.remove("active"));
          recalculateBreadDough();
        });
      }

      // Loaf size chips
      sizeChips.forEach((chip) => {
        chip.addEventListener("click", () => {
          const f = chip.dataset.flour;
          if (elFlourPerLoaf) elFlourPerLoaf.value = f;
          if (elFlourPerLoafRange) elFlourPerLoafRange.value = f;
          presetBtns.forEach((b) => b.classList.remove("active"));
          recalculateBreadDough();
        });
      });

      // Preset buttons
      presetBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const presetKey = btn.dataset.preset;
          const p = BREAD_PRESETS[presetKey];
          if (!p) return;

          presetBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          presetBaseLoaves = p.num_loaves;
          elNumLoaves.value = p.num_loaves;
          elFlourPerLoaf.value = p.flour_per_loaf;
          if (elFlourPerLoafRange) elFlourPerLoafRange.value = p.flour_per_loaf;
          elTemp.value = p.temp_c;
          if (elTempRange) elTempRange.value = p.temp_c;
          elHydration.value = p.hydration_pct;
          if (elHydrationRange) elHydrationRange.value = p.hydration_pct;
          elStarterPct.value = p.starter_pct;
          if (elStarterPctRange) elStarterPctRange.value = p.starter_pct;
          elSaltPct.value = p.salt_pct;
          if (elSaltPctRange) elSaltPctRange.value = p.salt_pct;
          elStarterHyd.value = p.starter_hyd_pct;
          elWholewheatPct.value = p.wholewheat_pct;
          if (elWholewheatPctRange) elWholewheatPctRange.value = p.wholewheat_pct;
          elRyePct.value = p.rye_pct;
          if (elRyePctRange) elRyePctRange.value = p.rye_pct;
          elSpeltPct.value = p.spelt_pct;
          if (elSpeltPctRange) elSpeltPctRange.value = p.spelt_pct;
          if (elAutoHydration) elAutoHydration.checked = Boolean(p.auto_hydration);

          scaleBtns.forEach((b) => b.classList.toggle("active", b.dataset.scale === "1"));
          recalculateBreadDough();
        });
      });

      // Connect scale buttons (0.5x, 1x, 2x, 3x) to calculator's num_loaves or flour_per_loaf
      scaleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const factor = parseFloat(btn.dataset.scale) || 1;
          scaleBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          elNumLoaves.value = Math.max(1, Math.round(presetBaseLoaves * factor));
          recalculateBreadDough();
        });
      });

      // Initial calculation on page load
      recalculateBreadDough();
    } else {
      // Standard Recipe Portion Scaling
      scaleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const factor = parseFloat(btn.dataset.scale) || 1;
          scaleBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          applyCurrentScaleFactor(factor);
        });
      });
    }

    // 3. Live Git Commit Version History & Interactive Version Switching
    const historyDetails = document.getElementById("recipe-history-details");
    const historyList = document.getElementById("recipe-history-list");
    const historyStatus = document.getElementById("recipe-history-status");
    const versionBadge = document.getElementById("recipe-version-badge");
    const versionBanner = document.getElementById("recipe-version-banner");
    const versionBannerLabel = document.getElementById("recipe-version-banner-label");
    const versionRestoreBtn = document.getElementById("recipe-version-restore-btn");
    const versionedCommentsSection = document.getElementById("recipe-versioned-comments");
    const versionedCommentsList = document.getElementById("recipe-versioned-comments-list");
    const recipeCommentTextarea = document.getElementById("recipe-comment-textarea");
    const recipeCommentSubmitBtn = document.getElementById("recipe-comment-submit-btn");
    const recipeCommentActiveVersion = document.getElementById("recipe-comment-active-version");
    const recipeViewIssueLink = document.getElementById("recipe-view-github-issue-link");
    const recipeCommentToast = document.getElementById("recipe-comment-toast");
    const recipeCommentsCountBadge = document.getElementById("recipe-comments-count-badge");
    const recipeCommentsEmpty = document.getElementById("recipe-comments-empty");
    const recipeCommentsPagination = document.getElementById("recipe-comments-pagination");
    const loadMoreCommentsBtn = document.getElementById("load-more-comments-btn");

    if (historyDetails && historyList && historyStatus) {
      const repo = historyDetails.dataset.repo || "HermanisV/gurkis.lv";
      const branch = historyDetails.dataset.branch || "main";
      const recipePath = historyDetails.dataset.recipePath || "";
      const recipeSlug = recipePath
        .replace(/^_recipes[/\\]/, "")
        .replace(/\.md$/, "");
      const cacheKey = `gurkis_commits_v2_${repo}_${branch}_${recipePath}`;
      const commentsCacheKey = `gurkis_comments_v2_${repo}_${recipeSlug}`;
      const CACHE_TTL_MS = 60 * 1000; // 1 minute cache to stay fresh after merges

      let loadedCommits = [];
      let activeCommitSha = "";
      let recipeMatchedIssue = null;
      let toastTimer = null;

      function showCommentToast(msg, durationMs) {
        if (!recipeCommentToast) return;
        recipeCommentToast.textContent = msg;
        recipeCommentToast.hidden = false;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          recipeCommentToast.hidden = true;
        }, durationMs || 5000);
      }

      function updateActiveCommentVersionBadge(versionNum, shortSha, isLatest) {
        if (recipeCommentActiveVersion) {
          recipeCommentActiveVersion.textContent = isLatest
            ? `v${versionNum} (Jaunākā)`
            : `v${versionNum} (${shortSha})`;
        }
      }

      function handleCommentSubmit() {
        const commentText = (recipeCommentTextarea && recipeCommentTextarea.value.trim()) || "";
        const verStr = (recipeCommentActiveVersion && recipeCommentActiveVersion.textContent.trim()) || "Jaunākā";

        if (recipeMatchedIssue && recipeMatchedIssue.html_url) {
          const targetUrl = `${recipeMatchedIssue.html_url}#new_comment_field`;

          if (commentText) {
            const formatted = `[Piezīme pie ${verStr}]\n\n${commentText}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard
                .writeText(formatted)
                .then(() => {
                  showCommentToast(
                    "✓ Piezīmes teksts nokopēts starpliktuvē! Atveras GitHub komentāru lauks — ielīmē (Ctrl+V) un spied 'Comment'.",
                    6000
                  );
                  window.open(targetUrl, "_blank", "noopener");
                })
                .catch(() => {
                  showCommentToast("Atveras GitHub diskusija — ieraksti komentāru atvērtajā logā.", 4000);
                  window.open(targetUrl, "_blank", "noopener");
                });
            } else {
              showCommentToast("Atveras GitHub diskusija — ieraksti komentāru atvērtajā logā.", 4000);
              window.open(targetUrl, "_blank", "noopener");
            }
          } else {
            window.open(targetUrl, "_blank", "noopener");
          }
        } else {
          // No issue exists yet -> Create new issue on GitHub with prefilled title & body
          const params = new URLSearchParams();
          params.set("labels", "receptes-piezimes");
          params.set("title", `receptes/${recipeSlug}/`);
          const initialBody = commentText
            ? `[Piezīme pie ${verStr}]\n\n${commentText}`
            : `Piezīme pie receptes [${verStr}]:\n- `;
          params.set("body", initialBody);
          const newIssueUrl = `https://github.com/${repo}/issues/new?${params.toString()}`;

          showCommentToast("Atveras jauna ieraksta izveide GitHub — nospied 'Submit new issue'.", 5000);
          window.open(newIssueUrl, "_blank", "noopener");
        }
      }

      if (recipeCommentSubmitBtn) {
        recipeCommentSubmitBtn.addEventListener("click", handleCommentSubmit);
      }

      if (recipeCommentTextarea) {
        recipeCommentTextarea.addEventListener("keydown", (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleCommentSubmit();
          }
        });
      }

      function escapeHtml(str) {
        return String(str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function formatInlineMarkdown(text) {
        let html = escapeHtml(text);
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
        html = html.replace(/`(.+?)`/g, "<code>$1</code>");
        return html;
      }

      function renderMarkdownBody(md) {
        const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
        const out = [];
        let inOl = false;
        let inUl = false;

        function closeLists() {
          if (inOl) {
            out.push("</ol>");
            inOl = false;
          }
          if (inUl) {
            out.push("</ul>");
            inUl = false;
          }
        }

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
            closeLists();
            continue;
          }

          const h2Match = line.match(/^##\s+(.+)$/);
          if (h2Match) {
            closeLists();
            out.push(`<h2>${formatInlineMarkdown(h2Match[1])}</h2>`);
            continue;
          }

          const h3Match = line.match(/^###\s+(.+)$/);
          if (h3Match) {
            closeLists();
            out.push(`<h3>${formatInlineMarkdown(h3Match[1])}</h3>`);
            continue;
          }

          const olMatch = line.match(/^\d+\.\s+(.+)$/);
          if (olMatch) {
            if (inUl) {
              out.push("</ul>");
              inUl = false;
            }
            if (!inOl) {
              out.push("<ol>");
              inOl = true;
            }
            out.push(`<li>${formatInlineMarkdown(olMatch[1])}</li>`);
            continue;
          }

          const ulMatch = line.match(/^[-*]\s+(.+)$/);
          if (ulMatch) {
            if (inOl) {
              out.push("</ol>");
              inOl = false;
            }
            if (!inUl) {
              out.push("<ul>");
              inUl = true;
            }
            out.push(`<li>${formatInlineMarkdown(ulMatch[1])}</li>`);
            continue;
          }

          closeLists();
          out.push(`<p>${formatInlineMarkdown(line)}</p>`);
        }

        closeLists();
        return out.join("\n");
      }

      function stripYamlQuotes(val) {
        const s = String(val || "").trim();
        if (
          (s.startsWith('"') && s.endsWith('"')) ||
          (s.startsWith("'") && s.endsWith("'"))
        ) {
          return s.slice(1, -1);
        }
        return s;
      }

      function parseRecipeMarkdown(rawText) {
        const match = String(rawText || "").match(
          /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
        );
        if (!match) return null;

        const yaml = match[1];
        const body = match[2];

        const titleMatch = yaml.match(/^title:\s*(.+)$/m);
        const descMatch = yaml.match(/^description:\s*(.+)$/m);
        const servMatch = yaml.match(/^servings:\s*(\d+(?:\.\d+)?)/m);

        const groups = [];
        const yamlLines = yaml.replace(/\r\n/g, "\n").split("\n");
        let inIngredients = false;
        let currentGroup = null;
        let currentItem = null;

        for (let i = 0; i < yamlLines.length; i++) {
          const rawLine = yamlLines[i];
          if (/^ingredients:\s*$/.test(rawLine)) {
            inIngredients = true;
            continue;
          }
          if (inIngredients && /^[a-zA-Z0-9_]+:/.test(rawLine)) {
            inIngredients = false;
            break;
          }
          if (!inIngredients) continue;

          const groupMatch = rawLine.match(/^\s*-\s*group:\s*(.*)$/);
          if (groupMatch) {
            currentGroup = {
              group: stripYamlQuotes(groupMatch[1]),
              items: []
            };
            groups.push(currentGroup);
            currentItem = null;
            continue;
          }

          const amountMatch = rawLine.match(/^\s*-\s*amount:\s*(.*)$/);
          if (amountMatch && currentGroup) {
            currentItem = {
              amount: stripYamlQuotes(amountMatch[1]),
              item: "",
              calc_key: ""
            };
            currentGroup.items.push(currentItem);
            continue;
          }

          const itemMatch = rawLine.match(/^\s*item:\s*(.*)$/);
          if (itemMatch && currentItem) {
            currentItem.item = stripYamlQuotes(itemMatch[1]);
            continue;
          }

          const calcKeyMatch = rawLine.match(/^\s*calc_key:\s*(.*)$/);
          if (calcKeyMatch && currentItem) {
            currentItem.calc_key = stripYamlQuotes(calcKeyMatch[1]);
          }
        }

        return {
          title: titleMatch ? stripYamlQuotes(titleMatch[1]) : "",
          description: descMatch ? stripYamlQuotes(descMatch[1]) : "",
          servings: servMatch ? parseFloat(servMatch[1]) : null,
          ingredients: groups,
          bodyHtml: renderMarkdownBody(body)
        };
      }

      function renderIngredientsGroupsHtml(groups) {
        return groups
          .map((g) => {
            const heading = g.group
              ? `<h3 class="ingredient-group-title">${escapeHtml(g.group)}</h3>`
              : "";
            const rows = (g.items || [])
              .map((ing) => {
                const calcRowAttr = ing.calc_key
                  ? ` data-calc-row="${escapeHtml(ing.calc_key)}"`
                  : "";
                const calcAmtAttr = ing.calc_key
                  ? ` data-calc-amount="${escapeHtml(ing.calc_key)}"`
                  : "";
                const calcNameAttr = ing.calc_key
                  ? ` data-calc-name="${escapeHtml(ing.calc_key)}"`
                  : "";
                return `<li class="ingredient-row" tabindex="0"${calcRowAttr}>
                  <span class="ingredient-check" aria-hidden="true"></span>
                  <span class="ingredient-amount" data-base-amount="${escapeHtml(ing.amount)}"${calcAmtAttr}>${escapeHtml(ing.amount)}</span>
                  <span class="ingredient-name"${calcNameAttr}>${escapeHtml(ing.item)}</span>
                </li>`;
              })
              .join("\n");
            return `<div class="ingredient-group">${heading}<ul class="ingredient-list">${rows}</ul></div>`;
          })
          .join("\n");
      }

      function formatLatvianDate(isoString) {
        if (!isoString) return "";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;
      }

      function updateActiveVersionHighlight() {
        historyList.querySelectorAll(".history-item").forEach((li) => {
          const isCurrent = li.dataset.sha === activeCommitSha;
          li.classList.toggle("active-version", isCurrent);
          const btn = li.querySelector(".history-sha-btn");
          const stateBadge = li.querySelector(".history-active-badge");
          if (btn) {
            btn.classList.toggle("is-active", isCurrent);
          }
          if (stateBadge) {
            stateBadge.hidden = !isCurrent;
          }
        });
      }

      async function switchToVersion(entry, versionNum, isLatest, options) {
        const opts = options || {};
        if (!entry || !entry.sha) return;

        const sha = entry.sha;
        const shortSha = sha.slice(0, 7);
        const commitObj = entry.commit || {};
        const commitDate =
          commitObj.author && commitObj.author.date
            ? formatLatvianDate(commitObj.author.date)
            : "";

        const rawUrl = `https://raw.githubusercontent.com/${repo}/${sha}/${recipePath}`;

        try {
          const resp = await fetch(rawUrl);
          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
          }
          const rawMd = await resp.text();
          const parsed = parseRecipeMarkdown(rawMd);
          if (!parsed) {
            throw new Error("Neizdevās nolasīt receptes struktūru");
          }

          if (titleEl && parsed.title) titleEl.textContent = parsed.title;
          if (leadEl && parsed.description) leadEl.textContent = parsed.description;
          if (parsed.servings && !hasCalculator) {
            baseServings = parsed.servings;
          }
          if (ingredientsGroupsEl && parsed.ingredients.length > 0 && !hasCalculator) {
            ingredientsGroupsEl.innerHTML = renderIngredientsGroupsHtml(parsed.ingredients);
          }
          if (instructionEl && !hasCalculator) {
            instructionEl.innerHTML = parsed.bodyHtml;
          }

          bindInteractiveRecipeElements();

          // Re-apply active portion scale factor
          if (!hasCalculator) {
            const activeScaleBtn = recipePage.querySelector(".scale-btn.active");
            const factor = activeScaleBtn
              ? parseFloat(activeScaleBtn.dataset.scale) || 1
              : 1;
            applyCurrentScaleFactor(factor);
          }

          activeCommitSha = sha;
          updateActiveVersionHighlight();
          updateActiveCommentVersionBadge(versionNum, shortSha, isLatest);

          // Update banner & URL parameter
          const url = new URL(window.location.href);
          if (isLatest) {
            if (versionBanner) versionBanner.hidden = true;
            url.searchParams.delete("versija");
          } else {
            if (versionBanner && versionBannerLabel) {
              versionBannerLabel.textContent = `Tu šobrīd skaties vēsturisku receptes versiju: v${versionNum} (${shortSha}${commitDate ? " · " + commitDate : ""}).`;
              versionBanner.hidden = false;
            }
            url.searchParams.set("versija", shortSha);
          }
          window.history.replaceState({}, "", url.toString());

          if (opts.scrollToTop) {
            recipePage.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } catch (_err) {
          // Fallback: if raw fetch fails, open commit on GitHub
          window.open(
            entry.html_url || `https://github.com/${repo}/commit/${sha}`,
            "_blank",
            "noopener"
          );
        }
      }

      if (versionRestoreBtn) {
        versionRestoreBtn.addEventListener("click", () => {
          if (loadedCommits.length > 0) {
            switchToVersion(loadedCommits[0], loadedCommits.length, true, {
              scrollToTop: true
            });
          }
        });
      }

      function renderCommits(commits) {
        if (!Array.isArray(commits) || commits.length === 0) {
          historyStatus.textContent =
            "Šai receptei GitHub repozitorijā vēl nav atrasta publiska izmaiņu vēsture.";
          historyStatus.hidden = false;
          historyList.hidden = true;
          return;
        }

        loadedCommits = commits;
        const total = commits.length;
        if (!activeCommitSha) {
          activeCommitSha = commits[0].sha || "";
        }
        updateActiveCommentVersionBadge(total, (commits[0].sha || "").slice(0, 7), true);

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
          const isLatest = idx === 0;

          const li = document.createElement("li");
          li.className = "history-item";
          li.dataset.sha = sha;

          const headerRow = document.createElement("div");
          headerRow.className = "history-item-header";

          const leftMeta = document.createElement("div");
          leftMeta.className = "history-item-meta";

          const verTag = document.createElement("span");
          verTag.className = "history-version-pill";
          verTag.textContent = isLatest ? `v${versionNum} (Jaunākā)` : `v${versionNum}`;
          leftMeta.appendChild(verTag);

          const activeTag = document.createElement("span");
          activeTag.className = "history-active-badge";
          activeTag.textContent = "Atvērta";
          activeTag.hidden = sha !== activeCommitSha;
          leftMeta.appendChild(activeTag);

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

          const rightActions = document.createElement("div");
          rightActions.className = "history-item-actions";

          const shaBtn = document.createElement("button");
          shaBtn.type = "button";
          shaBtn.className = "history-sha-btn";
          shaBtn.title = `Atvērt šo receptes versiju (v${versionNum} · ${shortSha})`;
          shaBtn.textContent = `Atvērt ${shortSha}`;
          shaBtn.addEventListener("click", () => {
            switchToVersion(entry, versionNum, isLatest, { scrollToTop: true });
          });

          const diffLink = document.createElement("a");
          diffLink.className = "history-diff-link";
          diffLink.href = commitUrl;
          diffLink.target = "_blank";
          diffLink.rel = "noopener noreferrer";
          diffLink.title = "Skatīt koda izmaiņas (diff) GitHub";
          diffLink.textContent = "Diff ↗";

          rightActions.appendChild(shaBtn);
          rightActions.appendChild(diffLink);

          headerRow.appendChild(leftMeta);
          headerRow.appendChild(rightActions);

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

          const notesContainer = document.createElement("div");
          notesContainer.className = "history-item-comments";
          notesContainer.dataset.versionSha = sha;
          notesContainer.hidden = true;
          li.appendChild(notesContainer);

          historyList.appendChild(li);
        });

        updateActiveVersionHighlight();
        historyStatus.hidden = true;
        historyList.hidden = false;

        // Fetch and attach version-tagged comments for this recipe
        loadRecipeComments(commits);

        // Check if URL requests a specific historical version (?versija=<sha>),
        // otherwise ensure the newest commit (commits[0]) is loaded so browser/CDN cache never shows stale recipe text
        const params = new URLSearchParams(window.location.search);
        const requestedVer = (params.get("versija") || "").trim().toLowerCase();
        if (requestedVer) {
          const matchIdx = commits.findIndex((c) =>
            (c.sha || "").toLowerCase().startsWith(requestedVer)
          );
          if (matchIdx >= 0) {
            switchToVersion(
              commits[matchIdx],
              total - matchIdx,
              matchIdx === 0,
              { scrollToTop: false }
            );
            historyDetails.open = true;
            return;
          }
        }

        // Always ensure newest version from commits[0] is synced onto the page by default
        switchToVersion(commits[0], total, true, { scrollToTop: false });
      }

      function findVersionForCommentTimestamp(commentIsoDate, commits) {
        if (!Array.isArray(commits) || commits.length === 0) return null;
        const commentTime = new Date(commentIsoDate).getTime();
        if (isNaN(commentTime)) {
          return {
            entry: commits[0],
            versionNum: commits.length,
            isLatest: true
          };
        }

        // Commits are ordered newest-first (index 0 = newest vN, index length-1 = oldest v1).
        // The version active when the comment was written is the newest commit with commitDate <= commentTime.
        for (let i = 0; i < commits.length; i++) {
          const cDateStr =
            commits[i].commit &&
            commits[i].commit.author &&
            commits[i].commit.author.date;
          const cTime = cDateStr ? new Date(cDateStr).getTime() : 0;
          if (cTime <= commentTime) {
            return {
              entry: commits[i],
              versionNum: commits.length - i,
              isLatest: i === 0
            };
          }
        }

        // If comment timestamp is older than the earliest commit, map to v1
        const oldestIdx = commits.length - 1;
        return {
          entry: commits[oldestIdx],
          versionNum: 1,
          isLatest: oldestIdx === 0
        };
      }

      const COMMENTS_PAGE_SIZE = 5;
      let allCommentsForRecipe = [];
      let currentCommentCount = 0;

      function renderNextCommentsPage(commits) {
        if (!versionedCommentsList) return;
        const total = allCommentsForRecipe.length;
        const nextBatch = allCommentsForRecipe.slice(
          currentCommentCount,
          currentCommentCount + COMMENTS_PAGE_SIZE
        );

        nextBatch.forEach((item) => {
          const verInfo = findVersionForCommentTimestamp(item.created_at, commits);
          const vNum = verInfo ? verInfo.versionNum : 1;
          const shortSha =
            verInfo && verInfo.entry && verInfo.entry.sha
              ? verInfo.entry.sha.slice(0, 7)
              : "";
          const isLatest = verInfo ? verInfo.isLatest : true;
          const dateFormatted = formatLatvianDate(item.created_at);

          const card = document.createElement("div");
          const commentStatus = item.status || "open";
          card.className = `versioned-comment-card comment-is-${commentStatus}`;

          const metaRow = document.createElement("div");
          metaRow.className = "versioned-comment-meta";

          const verBtn = document.createElement("button");
          verBtn.type = "button";
          verBtn.className = "comment-version-badge-btn";
          verBtn.title = `Atvērt receptes versiju v${vNum} (${shortSha}), pie kuras šī piezīme tika pievienota`;
          verBtn.textContent = `Pie versijas v${vNum} (${shortSha})`;
          if (verInfo && verInfo.entry) {
            verBtn.addEventListener("click", () => {
              switchToVersion(verInfo.entry, vNum, isLatest, {
                scrollToTop: true
              });
            });
          }

          const statusBadge = document.createElement("span");
          if (commentStatus === "resolved") {
            statusBadge.className = "badge badge-status badge-status-resolved";
            statusBadge.innerHTML = `<span aria-hidden="true">✓</span> Ieviests`;
            statusBadge.title = "Šī piezīme vai ierosinājums ir ieviests jaunākā receptes versijā";
          } else if (commentStatus === "rejected") {
            statusBadge.className = "badge badge-status badge-status-rejected";
            statusBadge.innerHTML = `<span aria-hidden="true">✕</span> Noraidīts`;
            statusBadge.title = "Šis ierosinājums tika izskatīts, bet netika ieviests";
          } else {
            statusBadge.className = "badge badge-status badge-status-open";
            statusBadge.innerHTML = `<span aria-hidden="true">⏳</span> Aktīvs`;
            statusBadge.title = "Aktīva piezīme nākamajai gatavošanas reizei";
          }

          const authorSpan = document.createElement("span");
          authorSpan.className = "versioned-comment-author";
          authorSpan.textContent = `· @${item.author}`;

          const dateSpan = document.createElement("time");
          dateSpan.className = "versioned-comment-date";
          dateSpan.dateTime = item.created_at;
          dateSpan.textContent = `· ${dateFormatted}`;

          metaRow.appendChild(verBtn);
          metaRow.appendChild(statusBadge);
          metaRow.appendChild(authorSpan);
          metaRow.appendChild(dateSpan);

          if (item.url) {
            const githubLink = document.createElement("a");
            githubLink.className = "versioned-comment-link";
            githubLink.href = item.url;
            githubLink.target = "_blank";
            githubLink.rel = "noopener noreferrer";
            githubLink.title = "Skatīt komentāru GitHub";
            githubLink.textContent = "GitHub ↗";
            metaRow.appendChild(githubLink);
          }

          const bodyDiv = document.createElement("div");
          bodyDiv.className = "versioned-comment-body";
          bodyDiv.textContent = item.body;

          card.appendChild(metaRow);
          card.appendChild(bodyDiv);
          versionedCommentsList.appendChild(card);
        });

        currentCommentCount += nextBatch.length;

        if (loadMoreCommentsBtn && recipeCommentsPagination) {
          const remaining = total - currentCommentCount;
          if (remaining > 0) {
            recipeCommentsPagination.hidden = false;
            loadMoreCommentsBtn.hidden = false;
            const nextLoadCount = Math.min(COMMENTS_PAGE_SIZE, remaining);
            loadMoreCommentsBtn.textContent =
              remaining > nextLoadCount
                ? `Rādīt vēl ${nextLoadCount} piezīmes (atlikušas ${remaining})`
                : (nextLoadCount === 1 ? "Rādīt vēl 1 piezīmi" : `Rādīt vēl ${nextLoadCount} piezīmes`);
          } else {
            recipeCommentsPagination.hidden = true;
            loadMoreCommentsBtn.hidden = true;
          }
        }
      }

      if (loadMoreCommentsBtn) {
        loadMoreCommentsBtn.addEventListener("click", () => {
          renderNextCommentsPage(loadedCommits);
        });
      }

      function renderVersionedComments(commentsList, commits) {
        allCommentsForRecipe = [];
        currentCommentCount = 0;

        if (versionedCommentsList) {
          versionedCommentsList.innerHTML = "";
        }

        // Clear any previously rendered per-version comment containers in history timeline
        historyList.querySelectorAll(".history-item-comments").forEach((el) => {
          el.innerHTML = "";
          el.hidden = true;
        });

        if (versionedCommentsSection) {
          versionedCommentsSection.hidden = false;
        }

        if (!Array.isArray(commentsList) || commentsList.length === 0) {
          if (recipeCommentsEmpty) recipeCommentsEmpty.hidden = false;
          if (recipeCommentsCountBadge) recipeCommentsCountBadge.hidden = true;
          if (recipeCommentsPagination) recipeCommentsPagination.hidden = true;
          return;
        }

        if (recipeCommentsEmpty) {
          recipeCommentsEmpty.hidden = true;
        }

        // Sort comments newest-first
        const sorted = commentsList.slice().sort((a, b) => {
          const timeA = new Date(a.created_at).getTime() || 0;
          const timeB = new Date(b.created_at).getTime() || 0;
          return timeB - timeA;
        });

        allCommentsForRecipe = sorted;

        if (recipeCommentsCountBadge) {
          const total = sorted.length;
          const isSingular = total % 10 === 1 && total % 100 !== 11;
          recipeCommentsCountBadge.textContent = isSingular
            ? `${total} piezīme`
            : `${total} piezīmes`;
          recipeCommentsCountBadge.hidden = false;
        }

        // 1. Attach ALL comments to their respective commit in Versiju vēsture timeline
        sorted.forEach((item) => {
          const verInfo = findVersionForCommentTimestamp(item.created_at, commits);
          if (!verInfo || !verInfo.entry) return;

          const sha = verInfo.entry.sha || "";
          const shortSha = sha.slice(0, 7);
          const vNum = verInfo.versionNum;
          const dateFormatted = formatLatvianDate(item.created_at);

          const historyCommentsBox = historyList.querySelector(
            `.history-item-comments[data-version-sha="${sha}"]`
          );
          if (historyCommentsBox) {
            const commentStatus = item.status || "open";
            const noteRow = document.createElement("div");
            noteRow.className = `history-attached-comment is-${commentStatus}`;

            let statusBadgeHtml = "";
            if (commentStatus === "resolved") {
              statusBadgeHtml = `<span class="badge badge-status-sm badge-status-resolved" title="Ierosinājums ieviests jaunākā versijā">✓ Ieviests</span> `;
            } else if (commentStatus === "rejected") {
              statusBadgeHtml = `<span class="badge badge-status-sm badge-status-rejected" title="Ierosinājums netika ieviests">✕ Noraidīts</span> `;
            } else {
              statusBadgeHtml = `<span class="badge badge-status-sm badge-status-open" title="Aktīva piezīme">⏳ Aktīvs</span> `;
            }

            noteRow.innerHTML = `<span class="history-comment-tag">💬 Piezīme pie v${vNum} (${escapeHtml(
              shortSha
            )})</span> ${statusBadgeHtml}<span class="history-comment-meta">· @${escapeHtml(
              item.author
            )} · ${escapeHtml(
              dateFormatted
            )}:</span> <span class="history-comment-text">${escapeHtml(
              item.body
            )}</span>`;
            historyCommentsBox.appendChild(noteRow);
            historyCommentsBox.hidden = false;
          }
        });

        // 2. Render initial batch of 5 comments in comment log section
        renderNextCommentsPage(commits);
      }

      function determineCommentStatus(issue, commentBody) {
        const bodyText = String(commentBody || "").trim().toLowerCase();

        // 1. Explicit in-text tag in comment or issue body takes immediate precedence
        if (
          bodyText.startsWith("[ieviests]") ||
          bodyText.startsWith("[atrisināts]") ||
          bodyText.startsWith("[atrisinats]") ||
          bodyText.startsWith("[resolved]")
        ) {
          return "resolved";
        }
        if (
          bodyText.startsWith("[noraidīts]") ||
          bodyText.startsWith("[noraidits]") ||
          bodyText.startsWith("[rejected]") ||
          bodyText.startsWith("[wontfix]") ||
          bodyText.startsWith("[won't fix]")
        ) {
          return "rejected";
        }

        if (!issue) return "open";

        // 2. Check issue labels
        const labelNames = Array.isArray(issue.labels)
          ? issue.labels.map((l) => (typeof l === "string" ? l : (l && l.name) || "").toLowerCase())
          : [];

        const hasRejectedLabel = labelNames.some((l) =>
          [
            "noraidīts",
            "noraidits",
            "rejected",
            "wontfix",
            "won't fix",
            "not-planned",
            "nav plānots",
            "nav planots"
          ].includes(l)
        );
        if (hasRejectedLabel) return "rejected";

        const hasResolvedLabel = labelNames.some((l) =>
          [
            "ieviests",
            "atrisināts",
            "atrisinats",
            "resolved",
            "done",
            "completed"
          ].includes(l)
        );
        if (hasResolvedLabel) return "resolved";

        // 3. Check GitHub issue state and state_reason
        const state = String(issue.state || "").toLowerCase();
        const stateReason = String(issue.state_reason || "").toLowerCase();

        if (state === "closed") {
          if (stateReason === "not_planned") {
            return "rejected";
          }
          // Default close or "completed" -> resolved / implemented in version history
          return "resolved";
        }

        return "open";
      }

      async function loadRecipeComments(commits) {
        if (!recipeSlug) return;

        try {
          const cachedRaw = sessionStorage.getItem(commentsCacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
              recipeMatchedIssue = cached.matchedIssue || null;
              if (recipeViewIssueLink) {
                const targetViewUrl = cached.viewIssueUrl || (recipeMatchedIssue && recipeMatchedIssue.html_url);
                if (targetViewUrl) {
                  recipeViewIssueLink.href = targetViewUrl;
                  recipeViewIssueLink.hidden = false;
                } else {
                  recipeViewIssueLink.hidden = true;
                }
              }
              renderVersionedComments(cached.data, commits);
              return;
            }
          }
        } catch (_e) {
          // Ignore sessionStorage errors
        }

        try {
          const issuesUrl = `https://api.github.com/repos/${repo}/issues?state=all&per_page=100`;
          const resp = await fetch(issuesUrl, {
            headers: { Accept: "application/vnd.github+json" }
          });
          if (!resp.ok) return;

          const allIssues = await resp.json();
          if (!Array.isArray(allIssues)) return;

          const matchingIssues = allIssues.filter((issue) => {
            if (issue.pull_request) return false;
            const t = String(issue.title || "");
            const b = String(issue.body || "");
            return (
              t.includes(recipeSlug) ||
              b.includes(`receptes/${recipeSlug}/`) ||
              b.includes(`receptes/${recipeSlug}`)
            );
          });

          let viewIssueUrl = null;
          if (matchingIssues.length > 0) {
            // Prioritize an open issue as target for new comment additions
            const openIssue = matchingIssues.find(
              (iss) => String(iss.state || "").toLowerCase() === "open"
            );

            if (openIssue) {
              recipeMatchedIssue = {
                number: openIssue.number,
                html_url: openIssue.html_url
              };
              viewIssueUrl = openIssue.html_url;
            } else {
              // All matching issues are closed (e.g. earlier feedback was resolved/rejected)
              // Setting recipeMatchedIssue to null ensures "Pievienot piezīmi" opens a fresh issue for future notes
              recipeMatchedIssue = null;
              viewIssueUrl = matchingIssues[0].html_url;
            }

            if (recipeViewIssueLink && viewIssueUrl) {
              recipeViewIssueLink.href = viewIssueUrl;
              recipeViewIssueLink.hidden = false;
            }
          } else {
            recipeMatchedIssue = null;
            if (recipeViewIssueLink) {
              recipeViewIssueLink.hidden = true;
            }
          }

          const collected = [];
          for (let i = 0; i < matchingIssues.length; i++) {
            const issue = matchingIssues[i];
            const issueAuthor = (issue.user && issue.user.login) || "Autors";
            const isUtterancesThread =
              issueAuthor === "utterances-bot" ||
              String(issue.title || "").includes(`receptes/${recipeSlug}`);

            if (!isUtterancesThread && issue.body) {
              const status = determineCommentStatus(issue, issue.body);
              collected.push({
                author: issueAuthor,
                created_at: issue.created_at,
                body: String(issue.body).trim(),
                url: issue.html_url,
                status: status,
                issueState: issue.state,
                issueNumber: issue.number
              });
            }

            if (issue.comments > 0 && issue.comments_url) {
              const cResp = await fetch(issue.comments_url, {
                headers: { Accept: "application/vnd.github+json" }
              });
              if (cResp.ok) {
                const cList = await cResp.json();
                if (Array.isArray(cList)) {
                  cList.forEach((c) => {
                    if (c && c.body) {
                      const status = determineCommentStatus(issue, c.body);
                      collected.push({
                        author: (c.user && c.user.login) || "Autors",
                        created_at: c.created_at,
                        body: String(c.body).trim(),
                        url: c.html_url,
                        status: status,
                        issueState: issue.state,
                        issueNumber: issue.number
                      });
                    }
                  });
                }
              }
            }
          }

          try {
            sessionStorage.setItem(
              commentsCacheKey,
              JSON.stringify({
                timestamp: Date.now(),
                data: collected,
                matchedIssue: recipeMatchedIssue,
                viewIssueUrl: viewIssueUrl
              })
            );
          } catch (_e) {
            // Ignore quota errors
          }

          renderVersionedComments(collected, commits);
        } catch (_err) {
          // Silently ignore if rate-limited
        }
      }

      async function loadCommitHistory() {
        if (!recipePath) {
          historyStatus.textContent = "Receptes faila ceļš nav norādīts.";
          return;
        }

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
          // Ignore sessionStorage errors
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

  // 3. Page Requests ("Pievienot ko jaunu") Interactive Form & GitHub Issues Board
  const requestsRoot = document.getElementById("page-requests-root");
  if (requestsRoot) {
    const repo = requestsRoot.dataset.repo || "HermanisV/gurkis.lv";
    const typeBtns = Array.from(requestsRoot.querySelectorAll(".request-type-btn"));
    const titleInput = document.getElementById("request-title-input");
    const urlGroup = document.getElementById("request-url-group");
    const sourceUrlInput = document.getElementById("request-source-url");
    const bodyLabel = document.getElementById("request-body-label");
    const bodyInput = document.getElementById("request-body-input");
    const submitGithubBtn = document.getElementById("request-submit-github-btn");

    const tabBtns = Array.from(requestsRoot.querySelectorAll(".request-tab-btn"));
    const openCountEl = document.getElementById("open-requests-count");
    const closedCountEl = document.getElementById("closed-requests-count");
    const boardStatus = document.getElementById("requests-board-status");
    const boardList = document.getElementById("requests-board-list");
    const refreshBtn = document.getElementById("refresh-requests-btn");

    let activeType = "new-recipe";
    let activeStateFilter = "open";
    let allRequestItems = [];

    const typeConfig = {
      "new-recipe": {
        prefix: "[Jauna recepte]",
        label: "pieprasijums,jauna-recepte",
        badgeText: "🍲 Jauna recepte",
        titlePlaceholder: "Piem., Kraukšķīgi kartupeļu plācenīši vai Tiramisu recepte",
        bodyLabelText: "Receptes apraksts, sastāvdaļas vai piezīmes *",
        bodyPlaceholder:
          "Iekopē saiti uz recepti, brīvā formā uzraksti sastāvdaļas un pagatavošanu vai norādi, ko vēlies pievienot..."
      },
      "site-change": {
        prefix: "[Lapas uzlabojums]",
        label: "pieprasijums,lapas-uzlabojums",
        badgeText: "✨ Lapas uzlabojums",
        titlePlaceholder: "Piem., Pievienot taimeri gatavošanas soļiem vai drukas režīmu",
        bodyLabelText: "Vēlamo izmaiņu vai funkcijas apraksts *",
        bodyPlaceholder:
          "Apraksti, kādu jaunu funkciju, pogu vai dizaina uzlabojumu vēlies redzēt lapā..."
      }
    };

    function formatReqDate(isoStr) {
      if (!isoStr) return "";
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("lv-LV", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function updateGithubSubmitHref() {
      if (!submitGithubBtn) return;
      const cfg = typeConfig[activeType] || typeConfig["new-recipe"];
      const rawTitle = (titleInput && titleInput.value.trim()) || "";
      const rawUrl = (sourceUrlInput && sourceUrlInput.value.trim()) || "";
      const rawBody = (bodyInput && bodyInput.value.trim()) || "";

      const issueTitle = rawTitle
        ? `${cfg.prefix} ${rawTitle}`
        : `${cfg.prefix} `;

      const bodyParts = [];
      bodyParts.push(`### Pieprasījuma veids\n${cfg.badgeText}`);

      if (activeType === "new-recipe" && rawUrl) {
        bodyParts.push(`### Oriģinālās receptes saite (URL)\n${rawUrl}`);
      }

      bodyParts.push(
        `### Apraksts un prasības aģentam\n${
          rawBody || "(Apraksti šeit savu pieprasījumu...)"
        }`
      );

      const params = new URLSearchParams();
      params.set("labels", cfg.label);
      params.set("title", issueTitle);
      params.set("body", bodyParts.join("\n\n"));

      submitGithubBtn.href = `https://github.com/${repo}/issues/new?${params.toString()}`;
    }

    function setRequestType(type) {
      activeType = typeConfig[type] ? type : "new-recipe";
      const cfg = typeConfig[activeType];

      typeBtns.forEach((btn) => {
        const isCurrent = btn.dataset.type === activeType;
        btn.classList.toggle("active", isCurrent);
        btn.setAttribute("aria-checked", isCurrent ? "true" : "false");
      });

      if (urlGroup) {
        urlGroup.hidden = activeType !== "new-recipe";
      }
      if (titleInput) {
        titleInput.placeholder = cfg.titlePlaceholder;
      }
      if (bodyLabel) {
        bodyLabel.innerHTML = `${cfg.bodyLabelText.replace(
          " *",
          ""
        )} <span class="required-mark">*</span>`;
      }
      if (bodyInput) {
        bodyInput.placeholder = cfg.bodyPlaceholder;
      }

      updateGithubSubmitHref();
    }

    typeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        setRequestType(btn.dataset.type);
      });
    });

    [titleInput, sourceUrlInput, bodyInput].forEach((el) => {
      if (el) {
        el.addEventListener("input", updateGithubSubmitHref);
        el.addEventListener("change", updateGithubSubmitHref);
      }
    });

    setRequestType("new-recipe");

    function inferRequestCategoryLabel(issue) {
      const title = String(issue.title || "").toLowerCase();
      const labels = Array.isArray(issue.labels)
        ? issue.labels.map((l) => String(l.name || "").toLowerCase())
        : [];
      if (
        labels.includes("jauna-recepte") ||
        title.includes("[jauna recepte]") ||
        title.includes("jauna recepte")
      ) {
        return "🍲 Jauna recepte";
      }
      if (
        labels.includes("lapas-uzlabojums") ||
        title.includes("[lapas uzlabojums]")
      ) {
        return "✨ Lapas uzlabojums";
      }
      return "📌 Pieprasījums";
    }

    function cleanBodyPreview(rawBody) {
      return String(rawBody || "")
        .replace(/###\s+Pieprasījuma veids[\s\S]*?(?=###|$)/i, "")
        .replace(/###\s+[^\n]+\n/g, "")
        .trim();
    }

    function renderRequestsBoard() {
      if (!boardList || !boardStatus) return;

      const openItems = allRequestItems.filter((item) => item.state === "open");
      const closedItems = allRequestItems.filter((item) => item.state === "closed");

      if (openCountEl) openCountEl.textContent = String(openItems.length);
      if (closedCountEl) closedCountEl.textContent = String(closedItems.length);

      const filtered = allRequestItems.filter((item) => {
        if (activeStateFilter === "all") return true;
        return item.state === activeStateFilter;
      });

      if (filtered.length === 0) {
        boardList.hidden = true;
        boardStatus.hidden = false;
        if (activeStateFilter === "open") {
          boardStatus.textContent =
            "Šobrīd nav neviena atvērta pieprasījuma. Iesniedz jaunu pieprasījumu kreisajā pusē!";
        } else if (activeStateFilter === "closed") {
          boardStatus.textContent = "Vēl nav neviena izpildīta (aizvērta) pieprasījuma.";
        } else {
          boardStatus.textContent = "Pieprasījumu saraksts ir tukšs.";
        }
        return;
      }

      boardStatus.hidden = true;
      boardList.innerHTML = "";

      filtered.forEach((item) => {
        const card = document.createElement("article");
        card.className = "request-item-card";

        const topRow = document.createElement("div");
        topRow.className = "request-item-top";

        const badgesWrap = document.createElement("div");
        badgesWrap.className = "request-item-badges";

        const statusBadge = document.createElement("span");
        const isOpen = item.state === "open";
        statusBadge.className = `request-status-pill ${
          isOpen ? "request-status-open" : "request-status-closed"
        }`;
        statusBadge.textContent = isOpen ? "⏳ Gaida izpildi" : "✅ Izpildīts";

        const typeBadge = document.createElement("span");
        typeBadge.className = "request-type-pill";
        typeBadge.textContent = item.categoryLabel;

        badgesWrap.appendChild(statusBadge);
        badgesWrap.appendChild(typeBadge);

        const numSpan = document.createElement("span");
        numSpan.className = "history-author";
        numSpan.textContent = `#${item.number}`;

        topRow.appendChild(badgesWrap);
        topRow.appendChild(numSpan);

        const titleH3 = document.createElement("h3");
        titleH3.className = "request-item-title";
        const titleLink = document.createElement("a");
        titleLink.href = item.url;
        titleLink.target = "_blank";
        titleLink.rel = "noopener noreferrer";
        titleLink.textContent = item.title;
        titleH3.appendChild(titleLink);

        card.appendChild(topRow);
        card.appendChild(titleH3);

        if (item.preview) {
          const bodyP = document.createElement("p");
          bodyP.className = "request-item-body";
          bodyP.textContent = item.preview;
          card.appendChild(bodyP);
        }

        const footer = document.createElement("div");
        footer.className = "request-item-footer";

        const metaSpan = document.createElement("span");
        metaSpan.textContent = `@${item.author} · ${formatReqDate(item.created_at)}`;

        const editLink = document.createElement("a");
        editLink.className = "request-item-link";
        editLink.href = item.url;
        editLink.target = "_blank";
        editLink.rel = "noopener noreferrer";
        editLink.textContent = isOpen ? "Rediģēt / komentēt GitHub ↗" : "Skatīt GitHub ↗";

        footer.appendChild(metaSpan);
        footer.appendChild(editLink);
        card.appendChild(footer);

        boardList.appendChild(card);
      });

      boardList.hidden = false;
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeStateFilter = btn.dataset.state || "open";
        tabBtns.forEach((b) => {
          const isCurrent = b === btn;
          b.classList.toggle("active", isCurrent);
          b.setAttribute("aria-selected", isCurrent ? "true" : "false");
        });
        renderRequestsBoard();
      });
    });

    async function fetchPageRequests() {
      if (boardStatus) {
        boardStatus.textContent = "Ielādē pieprasījumus no GitHub…";
        boardStatus.hidden = false;
      }
      if (boardList) {
        boardList.hidden = true;
      }

      try {
        const apiUrl = `https://api.github.com/repos/${repo}/issues?state=all&per_page=100`;
        const resp = await fetch(apiUrl, {
          headers: { Accept: "application/vnd.github+json" }
        });
        if (!resp.ok) {
          throw new Error(`GitHub API ${resp.status}`);
        }

        const rawIssues = await resp.json();
        if (!Array.isArray(rawIssues)) {
          throw new Error("Invalid response");
        }

        const items = [];
        for (let i = 0; i < rawIssues.length; i++) {
          const iss = rawIssues[i];
          if (iss.pull_request) continue;

          const author = (iss.user && iss.user.login) || "Autors";
          const title = String(iss.title || "");
          const isUtterancesThread =
            author === "utterances-bot" || title.includes("receptes/");

          if (isUtterancesThread) {
            continue;
          }

          items.push({
            number: iss.number,
            state: iss.state || "open",
            title: title.replace(/^\[(Jauna recepte|Lapas uzlabojums|Pieprasījums)\]\s*/i, "") || title,
            preview: cleanBodyPreview(iss.body),
            categoryLabel: inferRequestCategoryLabel(iss),
            author: author,
            created_at: iss.created_at,
            url: iss.html_url
          });
        }

        allRequestItems = items;
        renderRequestsBoard();
      } catch (_err) {
        if (boardStatus) {
          boardStatus.innerHTML = `Neizdevās automātiski ielādēt pieprasījumus no GitHub API. <a href="https://github.com/${repo}/issues" target="_blank" rel="noopener noreferrer">Skatīt visus pieprasījumus GitHub ↗</a>`;
          boardStatus.hidden = false;
        }
      }
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", fetchPageRequests);
    }

    fetchPageRequests();
  }
})();

