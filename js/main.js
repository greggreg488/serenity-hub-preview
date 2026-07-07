/* Serenity Hub — shared behaviour (vanilla, no dependencies).
   All demo commerce/booking state lives in localStorage; nothing is sent anywhere. */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- product catalogue (demo data; a CMS drives this in production) ---------- */
  var CATALOGUE = {
    "oil-eucalyptus": { name: "Eucalyptus & Clary Sage Oil", price: 34, seed: "driftwood-shore", url: "product-eucalyptus-oil.html" },
    "roller-calm": { name: "Calm Blend Pulse-Point Roller", price: 22, seed: "sh-roller-calm" },
    "candle-salt-sage": { name: "Soy Candle: Salt & Sage", price: 39, seed: "sh-candle-salt" },
    "incense-dish": { name: "Ceramic Incense Dish", price: 28, seed: "sh-incense-dish" },
    "eye-pillow": { name: "Linen Eye Pillow, Lavender", price: 26, seed: "sh-eye-pillow" },
    "tea-evening": { name: "Herbal Tea: Evening Ritual", price: 19, seed: "sh-tea-evening" },
    "gift-slow-morning": { name: "Gift Pack: The Slow Morning", price: 89, seed: "linen-fold" },
    "yoga-block": { name: "Cork Yoga Block, Pair", price: 54, seed: "sh-yoga-block" },
    "tote-market": { name: "Organic Cotton Market Tote", price: 24, seed: "sh-tote" }
  };

  /* ---------- tiny helpers ---------- */
  function money(n) { return "$" + (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)); }
  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- header: scrolled state (IO sentinel, no scroll listener) ---------- */
  var header = $(".site-header");
  var sentinel = $("#top-sentinel");
  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- mobile menu ---------- */
  var navToggle = $(".nav-toggle");
  var overlay = $(".menu-overlay");
  if (navToggle && overlay) {
    var closeBtn = $(".menu-close", overlay);
    var setMenu = function (open) {
      overlay.classList.toggle("open", open);
      document.body.classList.toggle("no-scroll", open);
      navToggle.setAttribute("aria-expanded", String(open));
      if (open) { (closeBtn || overlay).focus(); } else { navToggle.focus(); }
    };
    navToggle.addEventListener("click", function () { setMenu(true); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); });
    overlay.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- generic filter pills (classes / shop / journal) ---------- */
  $$("[data-filter-group]").forEach(function (group) {
    var targetSel = group.getAttribute("data-filter-target");
    var pills = $$(".pill", group);
    group.addEventListener("click", function (e) {
      var pill = e.target.closest(".pill");
      if (!pill) return;
      pills.forEach(function (p) { p.setAttribute("aria-pressed", String(p === pill)); });
      var want = pill.getAttribute("data-filter");
      $$(targetSel).forEach(function (item) {
        var cats = (item.getAttribute("data-cat") || "").split(" ");
        item.classList.toggle("is-hidden", want !== "all" && cats.indexOf(want) === -1);
      });
      var dayGroups = $$("[data-day-group]");
      dayGroups.forEach(function (g) {
        var anyVisible = $$(".class-row", g).some(function (r) { return !r.classList.contains("is-hidden"); });
        g.style.display = anyVisible ? "" : "none";
      });
    });
  });

  /* ---------- simple demo forms (contact / newsletter / register) ---------- */
  function validateRequired(form) {
    var ok = true;
    $$("[required]", form).forEach(function (input) {
      var field = input.closest(".field");
      var bad = !input.value.trim() || (input.type === "email" && input.value.indexOf("@") === -1);
      if (field) field.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    return ok;
  }
  $$("form[data-demo-form]").forEach(function (form) {
    form.setAttribute("novalidate", "novalidate");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateRequired(form)) return;
      var btn = $('[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending'; }
      setTimeout(function () {
        form.classList.add("done");
        var panel = $(".success-panel", form.parentElement) || $(".success-panel", form);
        if (panel) { panel.classList.add("show"); panel.setAttribute("tabindex", "-1"); panel.focus(); }
        form.dispatchEvent(new CustomEvent("demo-form-done"));
      }, 750);
    });
  });

  /* ---------- events: register panels + seat counts ---------- */
  $$("[data-register-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("data-register-toggle"));
      if (!panel) return;
      var open = !panel.classList.contains("open");
      $$(".register-panel.open").forEach(function (p) { p.classList.remove("open"); });
      panel.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      if (open) { var first = $("input", panel); if (first) first.focus(); }
    });
  });

  /* ---------- cart ---------- */
  var CART_KEY = "sh_cart";
  function cart() { return readJSON(CART_KEY, {}); }
  function cartCount(c) {
    var n = 0; Object.keys(c).forEach(function (k) { n += c[k]; }); return n;
  }
  function cartTotal(c) {
    var t = 0; Object.keys(c).forEach(function (k) { if (CATALOGUE[k]) t += CATALOGUE[k].price * c[k]; }); return t;
  }
  function renderCartCount() {
    var c = cartCount(cart());
    $$(".cart-count").forEach(function (el) { el.textContent = c > 0 ? String(c) : ""; });
  }
  function setQty(id, qty) {
    var c = cart();
    if (qty <= 0) { delete c[id]; } else { c[id] = qty; }
    writeJSON(CART_KEY, c);
    renderCartCount();
    renderDrawer();
    renderCheckout();
  }

  var drawer = $(".cart-drawer");
  var backdrop = $(".drawer-backdrop");
  function openDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    if (backdrop) backdrop.classList.toggle("show", open);
    document.body.classList.toggle("no-scroll", open);
    if (open) renderDrawer();
  }
  $$("[data-open-cart]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openDrawer(true); });
  });
  if (backdrop) backdrop.addEventListener("click", function () { openDrawer(false); });
  if (drawer) {
    var dClose = $(".cart-close", drawer);
    if (dClose) dClose.addEventListener("click", function () { openDrawer(false); });
    drawer.addEventListener("keydown", function (e) { if (e.key === "Escape") openDrawer(false); });
  }

  function renderDrawer() {
    if (!drawer) return;
    var list = $(".cart-items", drawer);
    var foot = $(".cart-foot", drawer);
    var c = cart();
    var ids = Object.keys(c).filter(function (k) { return CATALOGUE[k]; });
    if (!ids.length) {
      list.innerHTML = '<div class="cart-empty"><p>Your bag is empty.</p><a class="link-arrow" href="shop.html">Browse the shop <i class="ph ph-arrow-right" aria-hidden="true"></i></a></div>';
      foot.style.display = "none";
      return;
    }
    foot.style.display = "";
    list.innerHTML = ids.map(function (id) {
      var p = CATALOGUE[id];
      return '<div class="cart-item">' +
        '<div class="media"><img src="https://picsum.photos/seed/' + p.seed + '/160/160" alt="" loading="lazy"></div>' +
        '<div><h4>' + p.name + '</h4>' +
        '<div class="qty-ctl" aria-label="Quantity for ' + p.name + '">' +
        '<button type="button" data-qty="-1" data-id="' + id + '" aria-label="Reduce quantity">&minus;</button>' +
        '<span>' + c[id] + '</span>' +
        '<button type="button" data-qty="1" data-id="' + id + '" aria-label="Increase quantity">+</button>' +
        "</div></div>" +
        '<div style="text-align:right"><div class="price">' + money(p.price * c[id]) + "</div>" +
        '<button type="button" class="icon-btn" data-remove="' + id + '" aria-label="Remove ' + p.name + '"><i class="ph ph-trash" aria-hidden="true"></i></button></div>' +
        "</div>";
    }).join("");
    $(".cart-total-val", drawer).textContent = money(cartTotal(c));
  }
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      var q = e.target.closest("[data-qty]");
      var r = e.target.closest("[data-remove]");
      if (q) { var id = q.getAttribute("data-id"); setQty(id, (cart()[id] || 0) + parseInt(q.getAttribute("data-qty"), 10)); }
      if (r) setQty(r.getAttribute("data-remove"), 0);
    });
  }

  $$("[data-add-to-cart]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var id = btn.getAttribute("data-add-to-cart");
      var qtyInput = $("#qty-input");
      var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      if (!CATALOGUE[id]) return;
      setQty(id, (cart()[id] || 0) + qty);
      toast("Added to your bag: " + CATALOGUE[id].name);
      openDrawer(true);
    });
  });
  renderCartCount();

  /* ---------- checkout page ---------- */
  function renderCheckout() {
    var box = $("#order-lines");
    if (!box) return;
    var c = cart();
    var ids = Object.keys(c).filter(function (k) { return CATALOGUE[k]; });
    var emptyMsg = $("#checkout-empty");
    var grid = $("#checkout-grid");
    if (!ids.length) {
      if (emptyMsg) emptyMsg.style.display = "";
      if (grid) grid.style.display = "none";
      return;
    }
    if (emptyMsg) emptyMsg.style.display = "none";
    if (grid) grid.style.display = "";
    box.innerHTML = ids.map(function (id) {
      var p = CATALOGUE[id];
      return '<div class="summary-row"><span>' + p.name + " &times; " + c[id] + "</span><span>" + money(p.price * c[id]) + "</span></div>";
    }).join("");
    var sub = cartTotal(c);
    var pickupBtn = $('.segmented button[data-mode="pickup"]');
    var isPickup = pickupBtn && pickupBtn.getAttribute("aria-pressed") === "true";
    var ship = isPickup ? 0 : (sub >= 80 ? 0 : 9.5);
    $("#sum-subtotal").textContent = money(sub);
    $("#sum-shipping").textContent = ship === 0 ? "Free" : money(ship);
    $("#sum-total").textContent = money(sub + ship);
  }
  renderCheckout();

  var checkoutForm = $("#checkout-form");
  if (checkoutForm) {
    checkoutForm.setAttribute("novalidate", "novalidate");
    var finishOrder = function () {
      var ref = "SH-" + String(Math.floor(1000 + (performance.now() % 9000)));
      $("#order-ref").textContent = ref;
      var email = $("#co-email") ? $("#co-email").value : "";
      $("#order-email").textContent = email || "your inbox";
      localStorage.removeItem(CART_KEY);
      renderCartCount();
      $("#checkout-grid").style.display = "none";
      var done = $("#checkout-success");
      done.classList.add("show");
      done.setAttribute("tabindex", "-1");
      done.focus();
    };
    checkoutForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateRequired(checkoutForm)) return;
      var btn = $('[type="submit"]', checkoutForm);
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Processing payment';
      setTimeout(finishOrder, 1100);
    });
    $$(".pay-btn--express").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!validateRequired(checkoutForm)) { toast("Add your contact and delivery details first."); return; }
        b.disabled = true;
        b.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
        setTimeout(finishOrder, 900);
      });
    });
    $$(".segmented button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".segmented button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var pickup = b.getAttribute("data-mode") === "pickup";
        var shipFields = $("#shipping-fields");
        if (shipFields) shipFields.style.display = pickup ? "none" : "";
        $$("#shipping-fields [required-when-delivery]").forEach(function (i) {
          if (pickup) { i.removeAttribute("required"); } else { i.setAttribute("required", ""); }
        });
        renderCheckout();
      });
    });
  }

  /* ---------- class booking widget ---------- */
  var booking = $("#booking-widget");
  if (booking) {
    var picked = null;
    booking.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (chip && !chip.disabled) {
        $$(".chip", booking).forEach(function (ch) { ch.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        picked = chip.getAttribute("data-session");
        $("#booking-next").disabled = false;
      }
    });
    $("#booking-next").addEventListener("click", function () {
      if (!picked) return;
      $("#picked-session").textContent = picked;
      $("#step-pick").classList.remove("active");
      $("#step-pay").classList.add("active");
      $("#bk-name").focus();
    });
    $("#booking-back").addEventListener("click", function () {
      $("#step-pay").classList.remove("active");
      $("#step-pick").classList.add("active");
    });
    var payForm = $("#booking-form");
    payForm.setAttribute("novalidate", "novalidate");
    var confirmBooking = function () {
      $("#conf-session").textContent = picked;
      $("#conf-email").textContent = $("#bk-email").value;
      $("#step-pay").classList.remove("active");
      $("#step-done").classList.add("active");
      $("#step-done").setAttribute("tabindex", "-1");
      $("#step-done").focus();
    };
    payForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateRequired(payForm)) return;
      var btn = $('[type="submit"]', payForm);
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Confirming';
      setTimeout(confirmBooking, 1000);
    });
    $$(".pay-btn--express", booking).forEach(function (b) {
      b.addEventListener("click", function () {
        if (!validateRequired(payForm)) { toast("Add your name and email first."); return; }
        b.disabled = true;
        b.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
        setTimeout(confirmBooking, 800);
      });
    });
  }

  /* ---------- member auth (demo) ---------- */
  var MEMBER_KEY = "sh_member";
  var loginForm = $("#login-form");
  if (loginForm) {
    loginForm.setAttribute("novalidate", "novalidate");
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateRequired(loginForm)) return;
      var email = $("#login-email").value.trim();
      var name = email.split("@")[0].replace(/[._-]+/g, " ");
      name = name.charAt(0).toUpperCase() + name.slice(1);
      writeJSON(MEMBER_KEY, { name: name, email: email, plan: "Rhythm membership" });
      var btn = $('[type="submit"]', loginForm);
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Signing in';
      setTimeout(function () { window.location.href = "account.html"; }, 600);
    });
  }

  var dash = $("#dashboard");
  if (dash) {
    var member = readJSON(MEMBER_KEY, null);
    if (!member) {
      $("#dash-locked").style.display = "";
      dash.style.display = "none";
    } else {
      $("#dash-locked").style.display = "none";
      dash.style.display = "";
      $$(".member-name").forEach(function (el) { el.textContent = member.name; });
      $$(".member-email").forEach(function (el) { el.textContent = member.email; });
      var pf = $("#profile-name"); if (pf) pf.value = member.name;
      var pe = $("#profile-email"); if (pe) pe.value = member.email;
    }
    $$(".dash-nav button").forEach(function (tab) {
      tab.addEventListener("click", function () {
        $$(".dash-nav button").forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        $$(".dash-panel").forEach(function (p) { p.classList.remove("active"); });
        var panel = document.getElementById(tab.getAttribute("data-panel"));
        if (panel) panel.classList.add("active");
      });
    });
    var logout = $("#logout-btn");
    if (logout) logout.addEventListener("click", function () {
      localStorage.removeItem(MEMBER_KEY);
      window.location.href = "login.html";
    });
    $$("[data-cancel-booking]").forEach(function (b) {
      b.addEventListener("click", function () {
        var row = b.closest(".booking-row");
        row.style.opacity = "0.45";
        b.replaceWith(Object.assign(document.createElement("span"), { className: "tag", textContent: "Cancelled" }));
        toast("Booking cancelled. In the live site this also emails you.");
      });
    });
    var profileForm = $("#profile-form");
    if (profileForm) {
      profileForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var m = readJSON(MEMBER_KEY, {});
        m.name = $("#profile-name").value.trim() || m.name;
        writeJSON(MEMBER_KEY, m);
        $$(".member-name").forEach(function (el) { el.textContent = m.name; });
        toast("Profile saved.");
      });
    }
  }

  /* ---------- contact map facade (click-to-load embed) ---------- */
  var mapBtn = $("#load-map");
  if (mapBtn) {
    mapBtn.addEventListener("click", function () {
      var facade = $(".map-facade");
      var iframe = document.createElement("iframe");
      iframe.title = "Map showing the location of Serenity Hub";
      iframe.loading = "lazy";
      iframe.src = "https://www.google.com/maps?q=" + encodeURIComponent($("#map-facade-el").getAttribute("data-address")) + "&output=embed";
      facade.appendChild(iframe);
      $(".map-facade-inner").style.display = "none";
    });
  }
})();
