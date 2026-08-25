/**
 * Alex Cards — collection de cartes Lovelace custom.
 * Aucune dépendance, aucun build : JS natif + <ha-form> (fourni par Home Assistant).
 *
 * Pour ajouter une carte : dupliquer un bloc "=== ma-carte ===" ci-dessous
 * (classe + éditeur + customElements.define + window.customCards.push).
 */

const ALEX_CARDS_VERSION = "0.32.5";

console.info(
  `%c ALEX-CARDS %c v${ALEX_CARDS_VERSION} `,
  "color:white;background:#5b6b7a;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px;",
  "color:#5b6b7a;background:#e8ebee;border-radius:0 4px 4px 0;padding:2px 6px;"
);

window.customCards = window.customCards || [];

// Charge le composant natif utilisé par Home Assistant
// pour les panneaux repliables.
if (!customElements.get("ha-expansion-panel")) {
  const script = document.createElement("script");
  script.type = "module";
  script.src = "/frontend_latest/ha-expansion-panel.js";
  document.head.appendChild(script);
}

/* =========================================================================
 * === room-header-card ====================================================
 * Bandeau d'en-tête de pièce : icône + titre/sous-titre + température,
 * humidité et état des ouvrants.
 * ========================================================================= */

const RH_SCHEMA = [
  { name: "name", selector: { text: {} } },
  { name: "secondary", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "temp_entity", selector: { entity: { domain: "sensor" } } },
  { name: "hum_entity", selector: { entity: { domain: "sensor" } } },
  {
    name: "window_entity",
    selector: { entity: { domain: ["binary_sensor", "cover", "group"] } },
  },
  {
    name: "interactions",
    type: "expandable",
    flatten: true,
    title: "Interactions",
    icon: "mdi:gesture-tap",
    schema: [
      {
        name: "tap_action",
        selector: {
          ui_action: {
            default_action: "more-info",
          },
        },
      },
      {
        name: "",
        type: "optional_actions",
        flatten: true,
        schema: [
          {
            name: "hold_action",
            selector: {
              ui_action: {
                default_action: "none",
              },
            },
          },
          {
            name: "double_tap_action",
            selector: {
              ui_action: {
                default_action: "none",
              },
            },
          },
        ],
      },
    ],
  },
];

const RH_LABELS = {
  name: "Nom",
  secondary: "Sous-titre",
  icon: "Icône",
  temp_entity: "Capteur température",
  hum_entity: "Capteur humidité",
  window_entity: "Ouvrants (contact / volet / groupe)",
  tap_action: "Action au clic",
  hold_action: "Action à l'appui long",
  double_tap_action: "Action au double-clic",
};

class RoomHeaderCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-room-header-card-editor");
  }

  static getStubConfig() {
    return {
      name: "Salon",
      secondary: "Volet · Apple TV · lumière",
      icon: "mdi:sofa",
      temp_entity: "",
      hum_entity: "",
      window_entity: "",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
    if (!this._actionsBound) {
      bindActions(
        this,
        () => this._hass,
        () => this._config,
        () =>
          this._config &&
          (this._config.temp_entity || this._config.window_entity || this._config.hum_entity)
      );
      this._actionsBound = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  _stateObj(entity) {
    if (!entity || !this._hass || !this._hass.states[entity]) return null;
    return this._hass.states[entity];
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;

    // Un bloc n'est affiché que si son entité est configurée.
    const hasTemp = !!c.temp_entity;
    const hasHum = !!c.hum_entity;
    const hasWin = !!c.window_entity;

    const tObj = this._stateObj(c.temp_entity);
    const hObj = this._stateObj(c.hum_entity);
    const wObj = this._stateObj(c.window_entity);

    const t = tObj ? tObj.state : "–";
    const e = hObj ? hObj.state : "–";
    const wState = wObj ? wObj.state : "unknown";
    // "fermé" = off (binary_sensor) ou closed (cover)
    const closed = wState === "off" || wState === "closed";

    // Ne re-render que si un élément affiché a réellement changé.
    const sig = [
      c.name,
      c.secondary,
      c.icon,
      hasTemp ? t : "∅",
      hasHum ? e : "∅",
      hasWin ? wState : "∅",
    ].join("|");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const green = "#2ea043";
    const red = "#d13b3b";
    const badgeBg = closed ? "rgba(52,199,89,.15)" : "rgba(255,69,58,.15)";
    const badgeCol = closed ? green : red;

    const blocks = [];

    if (hasTemp) {
      blocks.push(`
        <div style="display:flex;align-items:center;gap:8px;">
          <ha-icon icon="mdi:thermometer" style="--mdc-icon-size:20px;color:#e8a13a;"></ha-icon>
          <div style="display:flex;flex-direction:column;line-height:1.1;">
            <span style="font-size:18px;font-weight:700;color:#1c1c1e;">${t}°</span>
            <span style="font-size:10px;letter-spacing:.5px;color:#8a8a8e;">TEMPÉRATURE</span>
          </div>
        </div>`);
    }

    if (hasHum) {
      blocks.push(`
        <div style="display:flex;align-items:center;gap:8px;">
          <ha-icon icon="mdi:water" style="--mdc-icon-size:20px;color:#4a7fb5;"></ha-icon>
          <div style="display:flex;flex-direction:column;line-height:1.1;">
            <span style="font-size:18px;font-weight:700;color:#1c1c1e;">${e}%</span>
            <span style="font-size:10px;letter-spacing:.5px;color:#8a8a8e;">HUMIDITÉ</span>
          </div>
        </div>`);
    }

    if (hasWin) {
      blocks.push(`
        <div style="display:flex;align-items:center;gap:8px;background:${badgeBg};
                    padding:8px 14px;border-radius:16px;">
          <ha-icon icon="mdi:window-closed-variant" style="--mdc-icon-size:20px;color:${badgeCol};"></ha-icon>
          <div style="display:flex;flex-direction:column;line-height:1.1;">
            <span style="font-size:16px;font-weight:700;color:${badgeCol};">${closed ? "Fermée" : "Ouverte"}</span>
            <span style="font-size:10px;letter-spacing:.5px;color:${badgeCol};opacity:.8;">OUVRANTS</span>
          </div>
        </div>`);
    }

    const stats = blocks.length
      ? `<div style="display:flex;align-items:center;gap:28px;">${blocks.join("")}</div>`
      : "";

    this.innerHTML = `
      <ha-card style="border-radius:28px;box-shadow:none;background:rgba(255,255,255,0.55);">
        <div style="display:grid;grid-template-columns:min-content auto 1fr min-content;
                    align-items:center;gap:16px;padding:14px 24px;">
          <div style="width:44px;height:44px;border-radius:14px;background:rgba(0,0,0,0.06);
                      display:flex;align-items:center;justify-content:center;">
            <ha-icon icon="${c.icon || "mdi:home"}" style="--mdc-icon-size:24px;color:#5b6b7a;"></ha-icon>
          </div>
          <div style="display:flex;flex-direction:column;line-height:1.15;">
            <span style="font-size:26px;font-weight:700;color:#1c1c1e;">${c.name || ""}</span>
            <span style="font-size:13px;color:#8a8a8e;">${c.secondary || ""}</span>
          </div>
          <div></div>
          ${stats}
        </div>
      </ha-card>`;
    this._built = true;
  }
}
customElements.define("alex-room-header-card", RoomHeaderCard);

class RoomHeaderCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => RH_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: ev.detail.value },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }
    this._form.schema = RH_SCHEMA;
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}
customElements.define("alex-room-header-card-editor", RoomHeaderCardEditor);

window.customCards.push({
  type: "alex-room-header-card",
  name: "Alex Room Header",
  description: "Bandeau d'en-tête de pièce (température, humidité, ouvrants).",
  preview: true,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * Helpers partagés
 * ========================================================================= */

// [r,g,b] -> "rgba(r, g, b, alpha)"
function rgba(rgb, alpha, fallback) {
  const [r, g, b] = Array.isArray(rgb) ? rgb : fallback;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Échappe le texte injecté en innerHTML (noms/entités saisis par l'utilisateur).
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// [r,g,b] ou [r,g,b,a] -> "rgba(r, g, b, a)" (a vaut 1 si absent).
function rgbaCss(rgb) {
  const [r, g, b, a] = rgb;
  const alpha = a == null ? 1 : a;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Résout une couleur optionnelle ([r,g,b]/[r,g,b,a] du picker, chaîne CSS, ou
// vide) vers une valeur CSS, avec repli sur une variable de thème.
function colorOr(v, fallback) {
  if (Array.isArray(v)) return rgbaCss(v);
  if (typeof v === "string" && v.trim()) return v;
  return fallback;
}

/* ---- Actions (tap / hold / double) --------------------------------------
 * Champs d'éditeur communs + exécuteur autonome pour les cartes au rendu
 * "maison" (sans dépendre de custom-card-helpers).
 */
const ACTION_RELATED_CONTEXT_ALEX = {
  action_entity: "entity",
};

const ACTION_SCHEMA = [
  {
    name: "tap_action",
    selector: {
      ui_action: {
        default_action: "more-info",
      },
    },
    context: ACTION_RELATED_CONTEXT_ALEX,
  },
  {
    name: "",
    type: "optional_actions",
    flatten: true,
    schema: [
      {
        name: "hold_action",
        selector: {
          ui_action: {
            default_action: "none",
          },
        },
        context: ACTION_RELATED_CONTEXT_ALEX,
      },
      {
        name: "double_tap_action",
        selector: {
          ui_action: {
            default_action: "none",
          },
        },
        context: ACTION_RELATED_CONTEXT_ALEX,
      },
    ],
  },
];
const ACTION_LABELS = {
  tap_action: "Action au clic",
  hold_action: "Action à l'appui long",
  double_tap_action: "Action au double-clic",
};

// Section "Interactions" homogène (repliable) réutilisée par tous les éditeurs.
const INTERACTIONS_FIELD = {
  name: "interactions",
  type: "expandable",
  flatten: true,
  title: "Interactions",
  icon: "mdi:gesture-tap",
  schema: ACTION_SCHEMA,
};

// Copie les actions définies vers une config de carte (n'ajoute que celles
// réellement renseignées, pour préserver les valeurs par défaut).
function applyActions(target, c) {
  if (!c) return target;

  if (c.tap_action !== undefined) {
    target.tap_action = c.tap_action;
  }

  if (c.hold_action !== undefined) {
    target.hold_action = c.hold_action;
  }

  if (c.double_tap_action !== undefined) {
    target.double_tap_action = c.double_tap_action;
  }

  return target;
}

function fireDomEvent(node, type, detail) {
  const e = new Event(type, { bubbles: true, composed: true, cancelable: false });
  e.detail = detail;
  node.dispatchEvent(e);
  return e;
}

// Exécute une action HA (more-info, toggle, navigate, url, call-service, none).
function fireAction(node, hass, actionConfig, entityId) {
  const cfg = actionConfig || { action: "more-info" };
  const action = cfg.action || "more-info";
  if (action === "none") return;
  if (action === "more-info") {
    const eid = cfg.entity || (cfg.data && cfg.data.entity_id) || entityId;
    if (eid) fireDomEvent(node, "hass-more-info", { entityId: eid });
    return;
  }
  if (action === "toggle") {
    const eid = cfg.entity || entityId;
    if (eid && hass) hass.callService("homeassistant", "toggle", { entity_id: eid });
    return;
  }
  if (action === "navigate") {
    if (cfg.navigation_path) {
      history.pushState(null, "", cfg.navigation_path);
      fireDomEvent(window, "location-changed", { replace: false });
    }
    return;
  }
  if (action === "url") {
    if (cfg.url_path) window.open(cfg.url_path);
    return;
  }
  if (action === "call-service" || action === "perform-action") {
    const svc = cfg.perform_action || cfg.service;
    if (!svc || !hass) return;
    const dot = svc.indexOf(".");
    hass.callService(
      svc.slice(0, dot),
      svc.slice(dot + 1),
      cfg.data || cfg.service_data || {},
      cfg.target
    );
    return;
  }
}

// Branche tap / double-clic / appui long sur un nœud, et route vers fireAction.
function bindActions(node, getHass, getConfig, entityId) {
  let holdTimer = null;
  let held = false;
  let clickTimer = null;

  const cfg = () => getConfig() || {};
  const act = (name) =>
    fireAction(
      node,
      getHass(),
      cfg()[name],
      typeof entityId === "function" ? entityId() : entityId
    );

  node.style.cursor = "pointer";

  node.addEventListener("pointerdown", () => {
    held = false;
    holdTimer = window.setTimeout(() => {
      held = true;
      if (cfg().hold_action) act("hold_action");
    }, 500);
  });
  const clearHold = () => {
    if (holdTimer) window.clearTimeout(holdTimer);
    holdTimer = null;
  };
  node.addEventListener("pointerup", clearHold);
  node.addEventListener("pointercancel", clearHold);

  node.addEventListener("click", () => {
    if (held) return; // c'était un appui long
    if (cfg().double_tap_action) {
      // on attend un éventuel 2e clic
      if (clickTimer) {
        window.clearTimeout(clickTimer);
        clickTimer = null;
        return;
      }
      clickTimer = window.setTimeout(() => {
        clickTimer = null;
        act("tap_action");
      }, 220);
    } else {
      act("tap_action");
    }
  });

  node.addEventListener("dblclick", () => {
    if (clickTimer) {
      window.clearTimeout(clickTimer);
      clickTimer = null;
    }
    if (cfg().double_tap_action) act("double_tap_action");
  });
}

/*
 * Base pour les cartes "wrapper" : construit en interne une carte HA
 * (via loadCardHelpers) à partir d'une config simple. Les sous-classes
 * implémentent _innerConfig(config) qui retourne l'objet de carte à créer.
 */
class AlexWrapperCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._syncTemplateSubs();
    if (this._hass) this._build();
  }

  set hass(hass) {
    this._hass = hass;
    this._syncTemplateSubs();
    if (this._card) this._card.hass = hass;
    else this._build();
  }

  getCardSize() {
    return this._card && this._card.getCardSize ? this._card.getCardSize() : 3;
  }

  // Sous-classes : liste des cles de config pouvant contenir un template
  // Jinja (ex. ["name", "secondary"]). Vide par defaut (pas de changement
  // de comportement pour les cartes qui ne s'en servent pas).
  _templatableFields() {
    return [];
  }

  _isJinjaTemplate(v) {
    return typeof v === "string" && (v.includes("{{") || v.includes("{%"));
  }

  // Valeur a utiliser pour ce champ : le rendu Jinja live si un abonnement
  // est actif pour ce champ, sinon la valeur brute de la config.
  _templated(field) {
    if (this._templateResults && Object.prototype.hasOwnProperty.call(this._templateResults, field)) {
      return this._templateResults[field];
    }
    return this._config ? this._config[field] : undefined;
  }

  // (Re)synchronise les abonnements de rendu de template avec la config et
  // le hass courants : cree les abonnements manquants, desabonne ceux dont
  // le texte du template a change ou qui ne sont plus templates.
  _syncTemplateSubs() {
    if (!this._hass || !this._hass.connection || !this._config) return;
    this._templateSubs = this._templateSubs || {};
    this._templateResults = this._templateResults || {};
    this._templatableFields().forEach((field) => {
      const raw = this._config[field];
      const existing = this._templateSubs[field];
      if (existing && existing.raw === raw) return; // deja a jour
      if (existing) {
        existing.unsub && existing.unsub();
        delete this._templateSubs[field];
        delete this._templateResults[field];
      }
      if (!this._isJinjaTemplate(raw)) return;
      const sub = { raw, unsub: null };
      this._templateSubs[field] = sub;
      this._hass.connection
        .subscribeMessage(
          (msg) => {
            this._templateResults[field] = msg.result;
            // Pousse la nouvelle valeur a la carte deja construite plutot
            // que d'attendre un rebuild complet (evite un flash visuel).
            if (this._card && this._card.setConfig) {
              try {
                this._card.setConfig(this._innerConfig(this._config));
              } catch (e) {
                /* config momentanement invalide, ignore */
              }
            } else {
              this._build();
            }
          },
          { type: "render_template", template: raw }
        )
        .then((unsub) => {
          if (this._templateSubs[field] === sub) sub.unsub = unsub;
          else unsub(); // config a change entre-temps, abonnement deja perime
        })
        .catch(() => {
          delete this._templateSubs[field];
        });
    });
  }

  disconnectedCallback() {
    Object.values(this._templateSubs || {}).forEach((s) => s.unsub && s.unsub());
    this._templateSubs = {};
  }

  async _build() {
    if (!this._config || !this._hass || this._building) return;
    this._building = true;
    try {
      const cfg = this._innerConfig(this._config);
      const helpers = await window.loadCardHelpers();
      const el = helpers.createCardElement(cfg);
      el.hass = this._hass;
      this.innerHTML = "";
      this.appendChild(el);
      this._card = el;
    } catch (e) {
      this.innerHTML =
        `<ha-card style="padding:16px;color:var(--error-color,#db4437);">` +
        `${this.localName} : ${(e && e.message) || e}</ha-card>`;
      this._card = null;
    } finally {
      this._building = false;
    }
  }

  _innerConfig() {
    throw new Error("_innerConfig() à implémenter");
  }
}

/*
 * Base pour les éditeurs ha-form. Les sous-classes définissent
 * this._schema (tableau) et this._labels (objet name->libellé).
 */
class AlexFormEditor extends HTMLElement {
  setConfig(config) {
    const incoming = JSON.stringify(config || {});
    if (incoming === this._configStr) return;
    this._config = JSON.parse(incoming);
    this._configStr = incoming;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    (this._forms || []).forEach((f) => (f.hass = hass));
    (this._selectors || []).forEach((s) => (s.hass = hass));
  }

  _emit(patch) {
    const cfg = { ...this._config, ...patch };
    this._config = cfg;
    this._configStr = JSON.stringify(cfg);
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: cfg },
        bubbles: true,
        composed: true,
      })
    );
  }

  _form(schema, data, labels, onChange) {
    const f = document.createElement("ha-form");
    f.schema = schema;
    f.data = data || {};
    f.computeLabel = (s) => (labels && labels[s.name]) || s.name;
    if (this._hass) f.hass = this._hass;
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      onChange(ev.detail.value);
    });
    this._forms.push(f);
    return f;
  }

  // Ligne compacte : libellé à gauche, color-picker à droite — même gabarit
  // partout, quel que soit le champ (fond de carte, icône, texte, bouton…).
  _colorRow(label, value, onChange) {
    const rgb = Array.isArray(value) ? [value[0], value[1], value[2]] : undefined;
    const alphaPct =
      Array.isArray(value) && value[3] != null ? Math.round(value[3] * 100) : 100;

    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;gap:10px;" +
      "min-height:40px;padding:6px 0;";
    const lab = document.createElement("div");
    lab.textContent = label;
    lab.style.cssText =
      "flex:1;min-width:0;font-size:14px;color:var(--primary-text-color);" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";

    const colorSel = document.createElement("ha-selector");
    colorSel.selector = { color_rgb: {} };
    colorSel.value = rgb;
    if (this._hass) colorSel.hass = this._hass;
    colorSel.style.cssText = "flex:0 0 auto;";

    // Opacite en % : HA n'a pas de selecteur couleur+alpha natif, donc on
    // combine le picker RGB avec un champ numerique dedie, recombines en
    // [r, g, b, a] (a entre 0 et 1) a chaque changement.
    const alphaSel = document.createElement("ha-selector");
    alphaSel.selector = {
      number: { min: 0, max: 100, step: 1, mode: "box", unit_of_measurement: "%" },
    };
    alphaSel.value = alphaPct;
    if (this._hass) alphaSel.hass = this._hass;
    alphaSel.style.cssText = "flex:0 0 64px;";

    const emit = () => {
      const cur = Array.isArray(colorSel.value) ? colorSel.value : null;
      if (!cur) {
        onChange(undefined);
        return;
      }
      const a = alphaSel.value != null ? alphaSel.value / 100 : 1;
      onChange([cur[0], cur[1], cur[2], a]);
    };

    colorSel.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      colorSel.value = ev.detail.value;
      emit();
    });
    alphaSel.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      alphaSel.value = ev.detail.value;
      emit();
    });

    this._selectors.push(colorSel, alphaSel);
    row.append(lab, colorSel, alphaSel);
    return row;
  }

  _panel(title, iconName, contentEl, expanded) {
    const panel = document.createElement("ha-expansion-panel");
    panel.outlined = true;
    panel.expanded = !!expanded;
    panel.style.cssText =
      "display:block;margin:12px 0 8px;" +
      "--expansion-panel-summary-padding:0 12px;" +
      "--expansion-panel-content-padding:0 12px 12px;";
    const header = document.createElement("div");
    header.setAttribute("slot", "header");
    header.style.cssText =
      "display:flex;align-items:center;gap:8px;height:32px;" +
      "font-size:14px;font-weight:500;color:var(--primary-text-color);";
    if (iconName) {
      const ic = document.createElement("ha-icon");
      ic.icon = iconName;
      ic.style.cssText = "--mdc-icon-size:20px;color:var(--secondary-text-color);flex:0 0 auto;";
      header.appendChild(ic);
    }
    const t = document.createElement("span");
    t.textContent = title;
    header.appendChild(t);
    panel.appendChild(header);
    panel.appendChild(contentEl);
    return panel;
  }

  // Parcourt un schéma (champs + groupes "expandable") et route chaque champ
  // color_rgb vers une ligne compacte, tout le reste vers un <ha-form> natif
  // groupé — pour que Nom/Icône/Entité gardent leur style natif tandis que
  // les couleurs sont toujours "libellé + pastille" sur la même ligne.
  _mixed(schema, data, labels, onChange) {
    const frag = document.createDocumentFragment();
    let batch = [];
    const flush = () => {
      if (!batch.length) return;
      frag.appendChild(this._form(batch, data, labels, onChange));
      batch = [];
    };
    (schema || []).forEach((field) => {
      if (field.type === "expandable") {
        flush();
        const content = this._mixed(field.schema, data, labels, onChange);
        frag.appendChild(this._panel(field.title, field.icon, content));
        return;
      }
      if (field.selector && field.selector.color_rgb) {
        flush();
        frag.appendChild(
          this._colorRow(labels[field.name] || field.name, data[field.name], (val) =>
            onChange({ [field.name]: val })
          )
        );
        return;
      }
      batch.push(field);
    });
    flush();
    return frag;
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    this.appendChild(
      this._mixed(this._schema, this._config, this._labels, (v) => this._emit(v))
    );
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }
}

/*
 * Base pour les éditeurs "liste" (façon mushroom-chips) : une liste d'items
 * avec ajout / crayon / suppression, et un détail par item. La sous-classe
 * implémente _normalize() (garantir les tableaux) et _render() (les vues).
 * Fournit la garde d'écho setConfig (pas de re-render à chaque tick hass =>
 * pas de perte de focus) et les briques DOM communes.
 */
class AlexListEditor extends HTMLElement {
  setConfig(config) {
    const incoming = JSON.stringify(config || {});
    if (incoming === this._configStr) return;
    this._config = JSON.parse(incoming);
    this._normalize();
    this._configStr = incoming;
    if (!Array.isArray(this._path)) this._path = [];
    this._render();
  }

  _normalize() {}

  set hass(hass) {
    this._hass = hass;
    (this._forms || []).forEach((f) => (f.hass = hass));
    (this._selectors || []).forEach((s) => (s.hass = hass));
  }

  _emit() {
    this._configStr = JSON.stringify(this._config);
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _update(mutator) {
    const cfg = JSON.parse(JSON.stringify(this._config));
    mutator(cfg);
    this._config = cfg;
    this._emit();
  }

  // Echange l'element a `index` avec son voisin (index+delta) dans le
  // tableau renvoye par getList(config). Utilise par les fleches monter/
  // descendre des listes ; ne fait rien si l'index cible sort du tableau
  // (bornes gerees en amont via onMoveUp/onMoveDown = null aux extremites).
  _moveItem(getList, index, delta) {
    this._update((c) => {
      const arr = getList(c);
      if (!Array.isArray(arr)) return;
      const j = index + delta;
      if (j < 0 || j >= arr.length) return;
      const tmp = arr[index];
      arr[index] = arr[j];
      arr[j] = tmp;
    });
    this._render();
  }

  _iconButton(icon, title, onClick) {
    const btn = document.createElement("ha-icon-button");
    btn.title = title;
    btn.style.cssText =
      "--mdc-icon-button-size:40px;--mdc-icon-size:20px;color:var(--secondary-text-color);flex:0 0 auto;";
    const ic = document.createElement("ha-icon");
    ic.icon = icon;
    btn.appendChild(ic);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  _form(schema, data, labels, onChange) {
    const f = document.createElement("ha-form");
    f.schema = schema;
    f.data = data || {};
    f.computeLabel = (s) => (labels && labels[s.name]) || s.name;
    if (this._hass) f.hass = this._hass;
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      onChange(ev.detail.value);
    });
    this._forms.push(f);
    return f;
  }

  // Ligne compacte : libelle a gauche, color-picker a droite - meme gabarit
  // que dans AlexFormEditor, pour un rendu identique sur toutes les cartes.
  _colorRow(label, value, onChange) {
    const rgb = Array.isArray(value) ? [value[0], value[1], value[2]] : undefined;
    const alphaPct =
      Array.isArray(value) && value[3] != null ? Math.round(value[3] * 100) : 100;

    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;gap:10px;" +
      "min-height:40px;padding:6px 0;";
    const lab = document.createElement("div");
    lab.textContent = label;
    lab.style.cssText =
      "flex:1;min-width:0;font-size:14px;color:var(--primary-text-color);" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";

    const colorSel = document.createElement("ha-selector");
    colorSel.selector = { color_rgb: {} };
    colorSel.value = rgb;
    if (this._hass) colorSel.hass = this._hass;
    colorSel.style.cssText = "flex:0 0 auto;";

    // Opacite en % : HA n'a pas de selecteur couleur+alpha natif, donc on
    // combine le picker RGB avec un champ numerique dedie, recombines en
    // [r, g, b, a] (a entre 0 et 1) a chaque changement.
    const alphaSel = document.createElement("ha-selector");
    alphaSel.selector = {
      number: { min: 0, max: 100, step: 1, mode: "box", unit_of_measurement: "%" },
    };
    alphaSel.value = alphaPct;
    if (this._hass) alphaSel.hass = this._hass;
    alphaSel.style.cssText = "flex:0 0 64px;";

    const emit = () => {
      const cur = Array.isArray(colorSel.value) ? colorSel.value : null;
      if (!cur) {
        onChange(undefined);
        return;
      }
      const a = alphaSel.value != null ? alphaSel.value / 100 : 1;
      onChange([cur[0], cur[1], cur[2], a]);
    };

    colorSel.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      colorSel.value = ev.detail.value;
      emit();
    });
    alphaSel.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      alphaSel.value = ev.detail.value;
      emit();
    });

    this._selectors = this._selectors || [];
    this._selectors.push(colorSel, alphaSel);
    row.append(lab, colorSel, alphaSel);
    return row;
  }

  _panel(title, iconName, contentEl, expanded) {
    const panel = document.createElement("ha-expansion-panel");
    panel.outlined = true;
    panel.expanded = !!expanded;
    panel.style.cssText =
      "display:block;margin:12px 0 8px;" +
      "--expansion-panel-summary-padding:0 12px;" +
      "--expansion-panel-content-padding:0 12px 12px;";
    const header = document.createElement("div");
    header.setAttribute("slot", "header");
    header.style.cssText =
      "display:flex;align-items:center;gap:8px;height:32px;" +
      "font-size:14px;font-weight:500;color:var(--primary-text-color);";
    if (iconName) {
      const ic = document.createElement("ha-icon");
      ic.icon = iconName;
      ic.style.cssText = "--mdc-icon-size:20px;color:var(--secondary-text-color);flex:0 0 auto;";
      header.appendChild(ic);
    }
    const t = document.createElement("span");
    t.textContent = title;
    header.appendChild(t);
    panel.appendChild(header);
    panel.appendChild(contentEl);
    return panel;
  }

  // Voir AlexFormEditor._mixed - meme logique, dupliquee ici car
  // AlexListEditor ne partage pas la meme chaine d'heritage.
  _mixed(schema, data, labels, onChange) {
    const frag = document.createDocumentFragment();
    let batch = [];
    const flush = () => {
      if (!batch.length) return;
      frag.appendChild(this._form(batch, data, labels, onChange));
      batch = [];
    };
    (schema || []).forEach((field) => {
      if (field.type === "expandable") {
        flush();
        const content = this._mixed(field.schema, data, labels, onChange);
        frag.appendChild(this._panel(field.title, field.icon, content));
        return;
      }
      if (field.selector && field.selector.color_rgb) {
        flush();
        frag.appendChild(
          this._colorRow(labels[field.name] || field.name, data[field.name], (val) =>
            onChange({ [field.name]: val })
          )
        );
        return;
      }
      batch.push(field);
    });
    flush();
    return frag;
  }

  _row(icon, text, subtitle, onEdit, onDelete, onMoveUp, onMoveDown) {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;gap:12px;padding:6px 6px 6px 12px;" +
      "margin-bottom:8px;border:1px solid var(--divider-color);border-radius:8px;" +
      "background:var(--card-background-color,var(--ha-card-background));box-sizing:border-box;";
    const ic = document.createElement("ha-icon");
    ic.icon = icon || "mdi:chart-line";
    ic.style.cssText = "color:var(--secondary-text-color);flex:0 0 auto;--mdc-icon-size:22px;";
    const lab = document.createElement("div");
    lab.style.cssText = "flex:1;min-width:0;";
    lab.innerHTML =
      `<div style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(text)}</div>` +
      (subtitle
        ? `<div style="font-size:12px;color:var(--secondary-text-color);overflow:hidden;` +
          `text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(subtitle)}</div>`
        : "");
    row.append(ic, lab);
    if (onMoveUp) row.appendChild(this._iconButton("mdi:arrow-up", "Monter", onMoveUp));
    if (onMoveDown) row.appendChild(this._iconButton("mdi:arrow-down", "Descendre", onMoveDown));
    if (onEdit) row.appendChild(this._iconButton("mdi:pencil", "Éditer", onEdit));
    row.appendChild(this._iconButton("mdi:delete", "Supprimer", onDelete));
    return row;
  }

  _sectionTitle(txt) {
    const d = document.createElement("div");
    d.textContent = txt;
    d.style.cssText =
      "text-transform:uppercase;font-size:12px;font-weight:500;letter-spacing:.5px;" +
      "color:var(--secondary-text-color);margin:18px 0 8px;";
    return d;
  }

  _backHeader(title, onBack) {
    const h = document.createElement("div");
    h.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px;";
    h.appendChild(this._iconButton("mdi:arrow-left", "Retour", onBack));
    const t = document.createElement("div");
    t.textContent = title;
    t.style.cssText = "font-weight:600;";
    h.appendChild(t);
    return h;
  }

  _addButton(label, onClick) {
    const b = document.createElement("button");
    b.textContent = "+ " + label;
    b.style.cssText =
      "width:100%;margin-top:12px;padding:10px;border:1px dashed var(--divider-color,#9e9e9e);" +
      "border-radius:8px;background:transparent;color:var(--primary-color);cursor:pointer;font:inherit;";
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return b;
  }
}

/* =========================================================================
 * === graph-card ==========================================================
 * Tuile état + mini-graphe 24 h en fond. Config : entité, nom, icône, couleur.
 * ========================================================================= */

const GRAPH_DEFAULT_RGB = [217, 148, 20];

class GraphCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("alex-graph-card-editor");
  }
  static getStubConfig() {
    return { entity: "", name: "", icon: "mdi:chart-line", color: GRAPH_DEFAULT_RGB };
  }
  _innerConfig(c) {
    const iconColor = colorOr(c.color, rgbaCss(GRAPH_DEFAULT_RGB));
    const line = rgba(c.color, 0.5, GRAPH_DEFAULT_RGB);
    return {
      type: "custom:stack-in-card",
      card_mod: {
        style:
          "ha-card {\n  --ha-card-border-width: 0;\n  border: none !important;\n" +
          "  box-shadow: none !important;\n" +
          "  background: var(--ha-card-background, var(--card-background-color));\n" +
          "  overflow: hidden !important;\n}\n",
      },
      cards: [
        applyActions(
          {
            type: "custom:mushroom-entity-card",
            entity: c.entity,
            primary_info: "state",
            secondary_info: "name",
            name: c.name || "",
            icon: c.icon || "mdi:chart-line",
            icon_color: iconColor,
            card_mod: {
              style:
                "ha-card {\n  position: relative !important;\n  z-index: 1 !important;\n" +
                "  --ha-card-border-width: 0px !important;\n" +
                "  --ha-card-border-color: transparent !important;\n" +
                "  --ha-card-box-shadow: none !important;\n" +
                "  border: none !important;\n  border-width: 0 !important;\n" +
                "  box-shadow: none !important;\n  outline: none !important;\n}\n" +
                "ha-card::before,\nha-card::after {\n  display: none !important;\n" +
                "  content: none !important;\n  box-shadow: none !important;\n" +
                "  border: none !important;\n}\n",
            },
          },
          c
        ),
        {
          type: "custom:mini-graph-card",
          entities: [{ entity: c.entity, color: line }],
          height: 100,
          hours_to_show: 24,
          points_per_hour: 2,
          line_width: 1,
          animate: true,
          show: { name: false, icon: false, state: false, legend: false, fill: "fade" },
          card_mod: {
            style:
              "ha-card {\n  position: absolute !important;\n  height: 130% !important;\n" +
              "  width: 100%;\n  right: 0px;\n  bottom: 0px;\n" +
              "  --ha-card-border-width: 0 !important;\n  border: none !important;\n" +
              "  border-width: 0 !important;\n  box-shadow: none !important;\n" +
              "  outline: none !important;\n  background: transparent !important;\n" +
              "  overflow: visible !important;\n}\n" +
              ".fill {\n  stroke: none !important;\n}\n",
          },
        },
      ],
    };
  }
}
customElements.define("alex-graph-card", GraphCard);

class GraphCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "entity", selector: { entity: { domain: "sensor" } } },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "color", selector: { color_rgb: {} } },
      INTERACTIONS_FIELD,
    ];
    this._labels = Object.assign(
      { entity: "Entité", name: "Nom", icon: "Icône", color: "Couleur" },
      ACTION_LABELS
    );
  }
}
customElements.define("alex-graph-card-editor", GraphCardEditor);

window.customCards.push({
  type: "alex-graph-card",
  name: "Alex Graph Card",
  description: "Tuile valeur + mini-graphe 24 h en fond.",
  preview: true,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === prise-card ==========================================================
 * Interrupteur avec puissance + mini-graphe (masqué à l'arrêt).
 * Config : entité (switch), capteur puissance (option), nom, icône, couleur,
 * tap_action (natif).
 * ========================================================================= */

const PRISE_DEFAULT_RGB = [8, 207, 104];

class PriseCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("alex-prise-card-editor");
  }
  static getStubConfig() {
    return {
      entity: "",
      power_entity: "",
      name: "Prise",
      icon: "mdi:power-plug",
      color: PRISE_DEFAULT_RGB,
      tap_action: { action: "toggle" },
    };
  }
  _innerConfig(c) {
    const sw = c.entity;
    const power = c.power_entity;
    const iconColor = colorOr(c.color, rgbaCss(PRISE_DEFAULT_RGB));
    const line = rgba(c.color, 0.5, PRISE_DEFAULT_RGB);
    const icon = c.icon || "mdi:power-plug";

    const secondary = power
      ? `{% if is_state('${sw}', 'on') %}\n  {{ states('${power}') }} W\n{% else %}\n  off\n{% endif %}`
      : `{% if is_state('${sw}', 'on') %}on{% else %}off{% endif %}`;

    const cards = [
      {
        type: "custom:mushroom-template-card",
        entity: sw,
        primary: c.name || "",
        secondary,
        icon,
        icon_color: `{% if is_state('${sw}', 'on') %}${iconColor}{% endif %}`,
        tap_action: c.tap_action || { action: "toggle" },
        hold_action:
          c.hold_action ||
          (power ? { action: "more-info", entity: power } : { action: "more-info" }),
        ...(c.double_tap_action ? { double_tap_action: c.double_tap_action } : {}),
        card_mod: {
          style:
            "ha-card {\n  position: relative !important;\n  z-index: 1 !important;\n" +
            "  --ha-card-border-width: 0px !important;\n" +
            "  --ha-card-border-color: transparent !important;\n" +
            "  --ha-card-box-shadow: none !important;\n" +
            "  border: none !important;\n  border-width: 0 !important;\n" +
            "  box-shadow: none !important;\n  outline: none !important;\n}\n" +
            "ha-card::before,\nha-card::after {\n  display: none !important;\n" +
            "  content: none !important;\n  box-shadow: none !important;\n" +
            "  border: none !important;\n}\n",
        },
      },
    ];

    if (power) {
      cards.push({
        type: "custom:mini-graph-card",
        entities: [{ entity: power, color: line }],
        height: 100,
        hours_to_show: 24,
        points_per_hour: 2,
        line_width: 1,
        animate: true,
        show: { name: false, icon: false, state: false, legend: false, labels: false, fill: "fade" },
        card_mod: {
          style:
            "ha-card {\n" +
            `  {% if is_state('${sw}', 'off') %}\n    visibility: hidden;\n` +
            "  {% else %}\n    visibility: visible;\n  {% endif %}\n" +
            "  position: absolute !important;\n  height: 130% !important;\n  width: 100%;\n" +
            "  right: 0px;\n  bottom: 0px;\n" +
            "  --ha-card-border-width: 0 !important;\n  border: none !important;\n" +
            "  border-width: 0 !important;\n  box-shadow: none !important;\n" +
            "  outline: none !important;\n  background: transparent !important;\n" +
            "  overflow: visible !important;\n}\n" +
            ".fill {\n  stroke: none !important;\n}\n",
        },
      });
    }

    return {
      type: "custom:stack-in-card",
      card_mod: {
        style:
          "ha-card {\n  --ha-card-border-width: 0;\n  border: none !important;\n" +
          "  box-shadow: none !important;\n" +
          "  background: var(--ha-card-background, var(--card-background-color));\n" +
          "  overflow: hidden !important;\n}\n",
      },
      cards,
    };
  }
}
customElements.define("alex-prise-card", PriseCard);

class PriseCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "entity", selector: { entity: { domain: "switch" } } },
      { name: "power_entity", selector: { entity: { domain: "sensor" } } },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "color", selector: { color_rgb: {} } },
      INTERACTIONS_FIELD,
    ];
    this._labels = Object.assign(
      {
        entity: "Interrupteur",
        power_entity: "Capteur puissance",
        name: "Nom",
        icon: "Icône",
        color: "Couleur",
      },
      ACTION_LABELS
    );
  }
}
customElements.define("alex-prise-card-editor", PriseCardEditor);

window.customCards.push({
  type: "alex-prise-card",
  name: "Alex Prise Card",
  description: "Interrupteur avec puissance et mini-graphe.",
  preview: true,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === shutter-card ========================================================
 * Volet (position) + 3 boutons scriptés Open / Projection / Close.
 * ========================================================================= */

class ShutterCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("alex-shutter-card-editor");
  }
  static getStubConfig() {
    return {
      entity: "",
      name: "Volet",
      icon: "",
      icon_color: "",
      text_color: "",
      script_open: "",
      script_projection: "",
      script_close: "",
      btn_open_color: "",
      btn_projection_color: "",
      btn_close_color: "",
      txt_open_color: "",
      txt_projection_color: "",
      txt_close_color: "",
    };
  }

  _button(label, script, bg, txt) {
    return {
      type: "custom:mushroom-template-card",
      primary: label,
      tap_action: {
        action: "call-service",
        service: "script.turn_on",
        target: { entity_id: script },
      },
      card_mod: {
        style: {
          ".":
            "ha-card {\n  margin: 0 !important;\n" +
            (txt ? `  --primary-text-color: ${txt};\n` : "") +
            `  background: ${bg};\n` +
            "  border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);\n" +
            "  border-radius: 999px;\n  box-shadow: none;\n" +
            "  min-height: 28px !important;\n  height: 28px !important;\n" +
            "  padding: 0 10px !important;\n}\n" +
            ".container {\n  display: flex !important;\n  align-items: center !important;\n" +
            "  justify-content: center !important;\n  height: 28px !important;\n  padding: 0 !important;\n}\n" +
            ".content {\n  padding: 0 !important;\n  width: 100% !important;\n}\n",
          "ha-tile-info$":
            ".info {\n  align-items: center !important;\n  justify-content: center !important;\n" +
            "  text-align: center !important;\n}\n" +
            ".primary {\n  font-size: 14px !important;\n  font-weight: 500 !important;\n  line-height: 1 !important;\n}\n",
        },
      },
    };
  }

  _innerConfig(c) {
    const BTN_BG_DEFAULT = "rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)";
    const iconColor = colorOr(c.icon_color, "");
    const textColor = colorOr(c.text_color, "");
    const coverIconVars =
      (iconColor ? `  --icon-color: ${iconColor};\n` : "") +
      (textColor ? `  --primary-text-color: ${textColor};\n` : "");
    const coverCard = {
      type: "custom:mushroom-cover-card",
      entity: c.entity,
      name: c.name || "",
      layout: "horizontal",
      show_position_control: true,
      show_buttons_control: false,
      show_tilt_position_control: false,
      card_mod: {
        style:
          "ha-card {\n  margin: 0 !important;\n  border-radius: 0 !important;\n" +
          "  padding-bottom: 0 !important;\n  box-shadow: none;\n  --ha-card-border-width: 0px;\n" +
          coverIconVars +
          "}\n",
      },
    };
    if (c.icon) coverCard.icon = c.icon;
    applyActions(coverCard, c);

    return {
      type: "custom:stack-in-card",
      mode: "vertical",
      card_mod: {
        style:
          "ha-card {\n  border-radius: 18px;\n  overflow: hidden;\n" +
          "  background: var(--ha-card-background, var(--card-background-color)) !important;\n}\n",
      },
      cards: [
        coverCard,
        {
          type: "custom:mod-card",
          style:
            "ha-card {\n  background: transparent !important;\n  box-shadow: none !important;\n" +
            "  border: none !important;\n  --ha-card-border-width: 0px;\n" +
            "  margin: 0 !important;\n  padding: 0 14px 14px !important;\n}\n",
          card: {
            type: "horizontal-stack",
            cards: [
              this._button("Open", c.script_open, colorOr(c.btn_open_color, BTN_BG_DEFAULT), colorOr(c.txt_open_color, "")),
              this._button("Projection", c.script_projection, colorOr(c.btn_projection_color, BTN_BG_DEFAULT), colorOr(c.txt_projection_color, "")),
              this._button("Close", c.script_close, colorOr(c.btn_close_color, BTN_BG_DEFAULT), colorOr(c.txt_close_color, "")),
            ],
          },
        },
      ],
    };
  }
}
customElements.define("alex-shutter-card", ShutterCard);

class ShutterCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "entity", selector: { entity: { domain: "cover" } } },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      {
        name: "scripts",
        type: "expandable",
        flatten: true,
        title: "Scripts",
        icon: "mdi:script-text",
        schema: [
          { name: "script_open", selector: { entity: { domain: "script" } } },
          { name: "script_projection", selector: { entity: { domain: "script" } } },
          { name: "script_close", selector: { entity: { domain: "script" } } },
        ],
      },
      {
        name: "customisation",
        type: "expandable",
        flatten: true,
        title: "Customisation",
        icon: "mdi:palette",
        schema: [
          { name: "icon_color", selector: { color_rgb: {} } },
          { name: "text_color", selector: { color_rgb: {} } },
          { name: "btn_open_color", selector: { color_rgb: {} } },
          { name: "txt_open_color", selector: { color_rgb: {} } },
          { name: "btn_projection_color", selector: { color_rgb: {} } },
          { name: "txt_projection_color", selector: { color_rgb: {} } },
          { name: "btn_close_color", selector: { color_rgb: {} } },
          { name: "txt_close_color", selector: { color_rgb: {} } },
        ],
      },
      INTERACTIONS_FIELD,
    ];
    this._labels = Object.assign(
      {
        entity: "Volet",
        name: "Nom",
        icon: "Icône",
        script_open: "Script Open",
        script_projection: "Script Projection",
        script_close: "Script Close",
        icon_color: "Couleur icône",
        text_color: "Couleur texte",
        btn_open_color: "Fond bouton Open",
        txt_open_color: "Texte bouton Open",
        btn_projection_color: "Fond bouton Projection",
        txt_projection_color: "Texte bouton Projection",
        btn_close_color: "Fond bouton Close",
        txt_close_color: "Texte bouton Close",
      },
      ACTION_LABELS
    );
  }
}
customElements.define("alex-shutter-card-editor", ShutterCardEditor);

window.customCards.push({
  type: "alex-shutter-card",
  name: "Alex Shutter Card",
  description: "Volet (position) + boutons Open / Projection / Close.",
  preview: true,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === light-card ==========================================================
 * Liste de lumières ; certaines entrées sont des groupes qui, au double-clic,
 * déploient leurs membres (via un input_boolean d'affichage).
 *
 * Config (éditée en YAML — pas encore d'éditeur visuel pour la liste) :
 *   type: custom:light-card
 *   all_entity: light.bureau_light_all        # optionnel : ligne "All" en haut
 *   lights:
 *     - entity: light.bureau_light_plafond_all
 *       name: Plafond
 *       icon: hue:bulb-group-spot
 *       expand_toggle: input_boolean.dashboard_bureau_plafond  # => groupe
 *       members:
 *         - { entity: light.bureau_light_plafond,  name: Plafond 1, icon: hue:bulb-spot }
 *         - { entity: light.bureau_light_plafond2, name: Plafond 2, icon: hue:bulb-spot }
 *     - entity: light.bureau_light_globe
 *       name: Globe gauche
 *       icon: hue:go
 * ========================================================================= */

const LIGHT_TRANSPARENT =
  "ha-card {\n  background: transparent;\n  box-shadow: none;\n  border: none;\n}\n";

class LightCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("alex-light-card-editor");
  }
  static getStubConfig() {
    return {
      all_entity: "",
      lights: [{ entity: "", name: "", icon: "mdi:lightbulb" }],
    };
  }

  _lightTile(l) {
    const tile = {
      type: "custom:mushroom-light-card",
      entity: l.entity,
      name: l.name || "",
      show_brightness_control: true,
      layout: "horizontal",
      show_color_control: false,
      show_color_temp_control: false,
      card_mod: { style: LIGHT_TRANSPARENT },
    };
    if (l.icon) tile.icon = l.icon;
    // Couleur fixe si définie, sinon on suit la couleur de l'ampoule.
    if (Array.isArray(l.color)) {
      tile.icon_color = rgbaCss(l.color);
      tile.use_light_color = false;
    } else {
      tile.use_light_color = true;
    }
    applyActions(tile, l);
    return tile;
  }

  _innerConfig(c) {
    const cards = [];

    if (c.all_entity) {
      cards.push({
        type: "custom:mushroom-entity-card",
        entity: c.all_entity,
        name: "All",
        tap_action: { action: "toggle" },
        grid_options: { columns: 12, rows: 1 },
        card_mod: { style: LIGHT_TRANSPARENT },
      });
    }

    (c.lights || []).forEach((l) => {
      const group = l.expand_toggle && Array.isArray(l.members) && l.members.length;

      const tile = this._lightTile(l);
      if (group) {
        tile.double_tap_action = {
          action: "call-service",
          service: "input_boolean.toggle",
          data: { entity_id: l.expand_toggle },
        };
      }
      cards.push(tile);

      if (group) {
        const sb = l.submenu_background;
        const submenuBg = Array.isArray(sb)
          ? rgba(sb, 0.12)
          : typeof sb === "string" && sb.trim()
          ? sb
          : "rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12)";
        cards.push({
          type: "conditional",
          conditions: [{ entity: l.expand_toggle, state: "on" }],
          card: {
            type: "custom:vertical-stack-in-card",
            card_mod: {
              style:
                `ha-card {\n  background: ${submenuBg};\n` +
                "  border-radius: 0px !important;\n  box-shadow: none;\n}\n",
            },
            cards: l.members.map((m) => this._lightTile(m)),
          },
        });
      }
    });

    return {
      type: "custom:vertical-stack-in-card",
      card_mod: {
        style:
          "ha-card {\n  background: var(--ha-card-background, var(--card-background-color));\n" +
          "  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);\n}\n",
      },
      cards,
    };
  }
}
customElements.define("alex-light-card", LightCard);

/*
 * Éditeur "façon mushroom-chips" : liste de lumières avec ajout / crayon /
 * suppression. Le crayon ouvre le détail d'une lumière ; un groupe (avec
 * input_boolean d'affichage) a sa propre liste de membres éditables.
 */
const LIGHT_MAIN_SCHEMA = [
  { name: "entity", selector: { entity: { domain: "light" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
];
const LIGHT_ITEM_LABELS = Object.assign(
  {
    entity: "Entité",
    name: "Nom",
    icon: "Icône",
    expand_toggle: "Affichage groupe",
    color: "Couleur",
    submenu_background: "Fond du sous-menu",
  },
  ACTION_LABELS
);
const MEMBER_ITEM_LABELS = {
  entity: "Entité",
  name: "Nom",
  icon: "Icône",
  color: "Couleur",
};
const MEMBER_ITEM_SCHEMA = [
  { name: "entity", selector: { entity: { domain: "light" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
];

class LightCardEditor extends HTMLElement {
  setConfig(config) {
    const incoming = JSON.stringify(config || {});
    // Garde d'écho : ignore le setConfig renvoyé par HA après notre propre édition
    // (sinon re-render => perte de focus en cours de saisie).
    if (incoming === this._configStr) return;
    this._config = JSON.parse(incoming);
    if (!Array.isArray(this._config.lights)) this._config.lights = [];
    this._configStr = incoming;
    if (!Array.isArray(this._path)) this._path = [];
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    (this._forms || []).forEach((f) => (f.hass = hass));
    (this._selectors || []).forEach((s) => (s.hass = hass));
  }

  _emit() {
    this._configStr = JSON.stringify(this._config);
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Applique une mutation sur une copie de la config puis notifie HA.
  _update(mutator) {
    const cfg = JSON.parse(JSON.stringify(this._config));
    mutator(cfg);
    this._config = cfg;
    this._emit();
  }

  // Echange l'element a `index` avec son voisin (index+delta) dans le
  // tableau renvoye par getList(config). Utilise par les fleches monter/
  // descendre des listes ; ne fait rien si l'index cible sort du tableau
  // (bornes gerees en amont via onMoveUp/onMoveDown = null aux extremites).
  _moveItem(getList, index, delta) {
    this._update((c) => {
      const arr = getList(c);
      if (!Array.isArray(arr)) return;
      const j = index + delta;
      if (j < 0 || j >= arr.length) return;
      const tmp = arr[index];
      arr[index] = arr[j];
      arr[j] = tmp;
    });
    this._render();
  }

  /* ---- petits composants DOM ---- */

  _iconButton(icon, title, onClick) {
    const btn = document.createElement("ha-icon-button");
    btn.title = title;
    btn.style.cssText =
      "--mdc-icon-button-size:40px;--mdc-icon-size:20px;color:var(--secondary-text-color);flex:0 0 auto;";
    const ic = document.createElement("ha-icon");
    ic.icon = icon;
    btn.appendChild(ic);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  _form(schema, data, labels, onChange) {
    const f = document.createElement("ha-form");
    f.schema = schema;
    f.data = data || {};
    f.computeLabel = (s) => (labels && labels[s.name]) || s.name;
    if (this._hass) f.hass = this._hass;
    f.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      onChange(ev.detail.value);
    });
    this._forms.push(f);
    return f;
  }

  // Ligne compacte : libellé à gauche, color-picker à droite — même gabarit
  // que dans AlexFormEditor, pour un rendu identique sur toutes les cartes.
  _colorRow(label, value, onChange) {
    const rgb = Array.isArray(value) ? [value[0], value[1], value[2]] : undefined;
    const alphaPct =
      Array.isArray(value) && value[3] != null ? Math.round(value[3] * 100) : 100;

    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;gap:10px;" +
      "min-height:40px;padding:6px 0;";
    const lab = document.createElement("div");
    lab.textContent = label;
    lab.style.cssText =
      "flex:1;min-width:0;font-size:14px;color:var(--primary-text-color);" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";

    const colorSel = document.createElement("ha-selector");
    colorSel.selector = { color_rgb: {} };
    colorSel.value = rgb;
    if (this._hass) colorSel.hass = this._hass;
    colorSel.style.cssText = "flex:0 0 auto;";

    // Opacite en % : HA n'a pas de selecteur couleur+alpha natif, donc on
    // combine le picker RGB avec un champ numerique dedie, recombines en
    // [r, g, b, a] (a entre 0 et 1) a chaque changement.
    const alphaSel = document.createElement("ha-selector");
    alphaSel.selector = {
      number: { min: 0, max: 100, step: 1, mode: "box", unit_of_measurement: "%" },
    };
    alphaSel.value = alphaPct;
    if (this._hass) alphaSel.hass = this._hass;
    alphaSel.style.cssText = "flex:0 0 64px;";

    const emit = () => {
      const cur = Array.isArray(colorSel.value) ? colorSel.value : null;
      if (!cur) {
        onChange(undefined);
        return;
      }
      const a = alphaSel.value != null ? alphaSel.value / 100 : 1;
      onChange([cur[0], cur[1], cur[2], a]);
    };

    colorSel.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      colorSel.value = ev.detail.value;
      emit();
    });
    alphaSel.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      alphaSel.value = ev.detail.value;
      emit();
    });

    this._selectors = this._selectors || [];
    this._selectors.push(colorSel, alphaSel);
    row.append(lab, colorSel, alphaSel);
    return row;
  }

  // Regroupe plusieurs lignes (ex. plusieurs _colorRow) dans un seul
  // conteneur, pour les passer comme contenu unique à _panel().
  _customFields(...rows) {
    const wrap = document.createElement("div");
    rows.forEach((r) => wrap.appendChild(r));
    return wrap;
  }

  _row(icon, text, subtitle, onEdit, onDelete, onMoveUp, onMoveDown) {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;gap:12px;padding:6px 6px 6px 12px;" +
      "margin-bottom:8px;border:1px solid var(--divider-color);border-radius:8px;" +
      "background:var(--card-background-color,var(--ha-card-background));box-sizing:border-box;";
    const ic = document.createElement("ha-icon");
    ic.icon = icon || "mdi:lightbulb";
    ic.style.cssText = "color:var(--secondary-text-color);flex:0 0 auto;--mdc-icon-size:22px;";
    const lab = document.createElement("div");
    lab.style.cssText = "flex:1;min-width:0;";
    lab.innerHTML =
      `<div style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(text)}</div>` +
      (subtitle
        ? `<div style="font-size:12px;color:var(--secondary-text-color);overflow:hidden;` +
          `text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(subtitle)}</div>`
        : "");
    row.append(ic, lab);
    if (onMoveUp) row.appendChild(this._iconButton("mdi:arrow-up", "Monter", onMoveUp));
    if (onMoveDown) row.appendChild(this._iconButton("mdi:arrow-down", "Descendre", onMoveDown));
    if (onEdit) row.appendChild(this._iconButton("mdi:pencil", "Éditer", onEdit));
    row.appendChild(this._iconButton("mdi:delete", "Supprimer", onDelete));
    return row;
  }

  _sectionTitle(txt) {
    const d = document.createElement("div");
    d.textContent = txt;
    d.style.cssText =
      "text-transform:uppercase;font-size:12px;font-weight:500;letter-spacing:.5px;" +
      "color:var(--secondary-text-color);margin:18px 0 8px;";
    return d;
  }

  _backHeader(title, onBack) {
    const h = document.createElement("div");
    h.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px;";
    h.appendChild(this._iconButton("mdi:arrow-left", "Retour", onBack));
    const t = document.createElement("div");
    t.textContent = title;
    t.style.cssText = "font-weight:600;";
    h.appendChild(t);
    return h;
  }

  _addRow(domain, label, onPick) {
    return this._form(
      [{ name: "entity", selector: { entity: { domain } } }],
      {},
      { entity: label },
      (v) => {
        if (v && v.entity) onPick(v.entity);
      }
    );
  }

  /* ---- vues ---- */

  _validPath() {
    const p = this._path || [];
    const lights = this._config.lights || [];
    if (p.length >= 1 && !lights[p[0]]) return [];
    if (p.length >= 2) {
      const m = lights[p[0]] && lights[p[0]].members;
      if (!m || !m[p[1]]) return [p[0]];
    }
    return p;
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else if (p.length === 1) this._renderLight(p[0]);
    else this._renderMember(p[0], p[1]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    const cfg = this._config;

    this.appendChild(this._sectionTitle("Ligne « All » (optionnel)"));
    this.appendChild(
      this._form(
        [{ name: "all_entity", selector: { entity: { domain: "light" } } }],
        { all_entity: cfg.all_entity || "" },
        { all_entity: "Entité groupe (All)" },
        (v) => this._update((c) => (c.all_entity = v.all_entity))
      )
    );

    this.appendChild(this._sectionTitle("Lumières"));
    (cfg.lights || []).forEach((l, i) => {
      const isGroup = l.members && l.members.length;
      this.appendChild(
        this._row(
          l.icon,
          l.name || l.entity || "(vide)",
          isGroup ? `groupe · ${l.members.length} membre(s)` : l.entity,
          () => {
            this._path = [i];
            this._render();
          },
          () => {
            this._update((c) => c.lights.splice(i, 1));
            this._render();
          },
          i > 0 ? () => this._moveItem((c) => c.lights, i, -1) : null,
          i < (cfg.lights || []).length - 1
            ? () => this._moveItem((c) => c.lights, i, 1)
            : null
        )
      );
    });

    this.appendChild(
      this._addRow("light", "Ajouter une lumière", (ent) => {
        let idx;
        this._update((c) => {
          c.lights = c.lights || [];
          c.lights.push({ entity: ent, name: "", icon: "mdi:lightbulb" });
          idx = c.lights.length - 1;
        });
        this._path = [idx];
        this._render();
      })
    );
  }

  _renderLight(i) {
    const l = this._config.lights[i] || {};

    /*
     * ----------------------------------------------------------------------
     * Retour
     * ----------------------------------------------------------------------
     */

    this.appendChild(
      this._backHeader(
        l.name || l.entity || "Lumière",
        () => {
          this._path = [];
          this._render();
        }
      )
    );

    /*
     * ----------------------------------------------------------------------
     * Champs principaux
     *
     * Entité
     * Nom
     * Icône
     * input_boolean d'affichage
     * ----------------------------------------------------------------------
     */

    this.appendChild(
      this._form(
        LIGHT_MAIN_SCHEMA,
        {
          entity: l.entity,
          name: l.name,
          icon: l.icon,
        },
        LIGHT_ITEM_LABELS,
        (v) =>
          this._update(
            (c) =>
              (c.lights[i] = {
                ...c.lights[i],
                ...v,
              })
          )
      )
    );

    const merge = (v) =>
      this._update((c) => (c.lights[i] = { ...c.lights[i], ...v }));

    this.appendChild(
      this._panel("Groupe", "mdi:account-group", this._groupContent(i, l))
    );

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._customFields(
          this._colorRow(LIGHT_ITEM_LABELS.color, l.color, (v) => merge({ color: v })),
          this._colorRow(LIGHT_ITEM_LABELS.submenu_background, l.submenu_background, (v) =>
            merge({ submenu_background: v })
          )
        )
      )
    );

    this.appendChild(
      this._panel(
        "Interactions",
        "mdi:gesture-tap",
        this._form(
          ACTION_SCHEMA,
          {
            tap_action: l.tap_action,
            hold_action: l.hold_action,
            double_tap_action: l.double_tap_action,
          },
          ACTION_LABELS,
          merge
        )
      )
    );
  }

  _panel(title, iconName, contentEl, expanded) {
    const panel = document.createElement("ha-expansion-panel");
    panel.outlined = true;
    panel.expanded = !!expanded;
    panel.style.cssText =
      "display:block;margin:12px 0 8px;" +
      "--expansion-panel-summary-padding:0 12px;" +
      "--expansion-panel-content-padding:0 12px 12px;";

    // En-tête compact fait main (au lieu du rendu par défaut du composant,
    // trop haut) : hauteur fixe alignée sur les lignes de la liste.
    const header = document.createElement("div");
    header.setAttribute("slot", "header");
    header.style.cssText =
      "display:flex;align-items:center;gap:8px;height:32px;" +
      "font-size:14px;font-weight:500;color:var(--primary-text-color);";
    if (iconName) {
      const ic = document.createElement("ha-icon");
      ic.icon = iconName;
      ic.style.cssText = "--mdc-icon-size:20px;color:var(--secondary-text-color);flex:0 0 auto;";
      header.appendChild(ic);
    }
    const t = document.createElement("span");
    t.textContent = title;
    header.appendChild(t);
    panel.appendChild(header);

    panel.appendChild(contentEl);
    return panel;
  }

  _groupContent(i, l) {
    const content = document.createElement("div");

    content.appendChild(
      this._form(
        [{ name: "expand_toggle", selector: { entity: { domain: "input_boolean" } } }],
        { expand_toggle: l.expand_toggle },
        { expand_toggle: "Affichage groupe" },
        (v) => this._update((c) => (c.lights[i].expand_toggle = v.expand_toggle))
      )
    );

    content.appendChild(this._sectionTitle("Membres du groupe"));

    const members = l.members || [];
    if (members.length && !l.expand_toggle) {
      const hint = document.createElement("div");
      hint.textContent =
        "⚠ Renseigne un « Affichage groupe » ci-dessus pour que le groupe se déploie.";
      hint.style.cssText = "font-size:12px;color:var(--warning-color,#f4a000);margin:4px 0;";
      content.appendChild(hint);
    }

    members.forEach((m, j) => {
      content.appendChild(
        this._row(
          m.icon,
          m.name || m.entity || "(vide)",
          m.entity,
          () => {
            this._path = [i, j];
            this._render();
          },
          () => {
            this._update((c) => c.lights[i].members.splice(j, 1));
            this._render();
          },
          j > 0 ? () => this._moveItem((c) => c.lights[i].members, j, -1) : null,
          j < members.length - 1
            ? () => this._moveItem((c) => c.lights[i].members, j, 1)
            : null
        )
      );
    });

    content.appendChild(
      this._addRow("light", "Ajouter un membre", (ent) => {
        let idx;
        this._update((c) => {
          const li = c.lights[i];
          li.members = li.members || [];
          li.members.push({ entity: ent, name: "", icon: "mdi:lightbulb" });
          idx = li.members.length - 1;
        });
        this._path = [i, idx];
        this._render();
      })
    );

    return content;
  }

  _renderMember(i, j) {
    const m = (this._config.lights[i].members || [])[j] || {};
    const mergeMember = (v) =>
      this._update(
        (c) =>
          (c.lights[i].members[j] = {
            ...c.lights[i].members[j],
            ...v,
          })
      );

    this.appendChild(
      this._backHeader(m.name || m.entity || "Membre", () => {
        this._path = [i];
        this._render();
      })
    );

    this.appendChild(
      this._form(
        MEMBER_ITEM_SCHEMA,
        { entity: m.entity, name: m.name, icon: m.icon },
        MEMBER_ITEM_LABELS,
        mergeMember
      )
    );

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._customFields(
          this._colorRow(MEMBER_ITEM_LABELS.color, m.color, (v) => mergeMember({ color: v }))
        )
      )
    );
  }
}
customElements.define("alex-light-card-editor", LightCardEditor);

window.customCards.push({
  type: "alex-light-card",
  name: "Alex Light Card",
  description: "Liste de lumières avec groupes déployables au double-clic.",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === multi-graph-card ====================================================
 * Pile de mini-graphes (fond de card du thème). L'éditeur est une liste de
 * graphes ; chaque graphe : entité(s), nom, couleur de ligne, icône,
 * hours_to_show (défaut 24), points_per_hour (défaut 4).
 * ========================================================================= */

class MultiGraphCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("alex-multi-graph-card-editor");
  }
  static getStubConfig() {
    return {
      graphs: [{ entities: [], name: "", hours_to_show: 24, points_per_hour: 4 }],
    };
  }

  _graphCard(g) {
    const color = colorOr(g.line_color, null);
    const card = {
      type: "custom:mini-graph-card",
      name: g.name || "",
      entities: g.entities || [],
      hours_to_show: g.hours_to_show || 24,
      points_per_hour: g.points_per_hour || 4,
      line_width: 3,
      smoothing: true,
      animate: true,
      show: { state: true, extrema: true, fill: "fade", labels: true, icon: !!g.icon },
      card_mod: {
        style: "ha-card { border-radius: 24px; }\n.fill {\n  stroke: none !important;\n}\n",
      },
    };
    if (color) card.line_color = color;
    if (g.icon) card.icon = g.icon;
    applyActions(card, g);
    return card;
  }

  _innerConfig(c) {
    return {
      type: "custom:vertical-stack-in-card",
      card_mod: {
        style:
          "ha-card {\n  background: var(--ha-card-background, var(--card-background-color));\n}\n",
      },
      cards: (c.graphs || []).map((g) => this._graphCard(g)),
    };
  }
}
customElements.define("alex-multi-graph-card", MultiGraphCard);

const MG_SCHEMA = [
  { name: "entities", selector: { entity: { multiple: true } } },
  { name: "name", selector: { text: {} } },
  { name: "line_color", selector: { color_rgb: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "hours_to_show", selector: { number: { min: 1, max: 336, step: 1, mode: "box" } } },
  { name: "points_per_hour", selector: { number: { min: 1, max: 120, step: 1, mode: "box" } } },
  INTERACTIONS_FIELD,
];
const MG_LABELS = Object.assign(
  {
    entities: "Entité(s)",
    name: "Nom",
    line_color: "Couleur de la ligne",
    icon: "Icône",
    hours_to_show: "Heures affichées (défaut 24)",
    points_per_hour: "Points par heure (défaut 4)",
  },
  ACTION_LABELS
);

class MultiGraphCardEditor extends AlexListEditor {
  _normalize() {
    if (!Array.isArray(this._config.graphs)) this._config.graphs = [];
  }

  _validPath() {
    const p = this._path || [];
    if (p.length >= 1 && !this._config.graphs[p[0]]) return [];
    return p;
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else this._renderGraph(p[0]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    this.appendChild(this._sectionTitle("Graphes"));
    const graphs = this._config.graphs || [];
    graphs.forEach((g, i) => {
      const n = (g.entities || []).length;
      this.appendChild(
        this._row(
          g.icon || "mdi:chart-line",
          g.name || (g.entities && g.entities[0]) || "(vide)",
          n > 1 ? `${n} entités` : g.entities && g.entities[0],
          () => {
            this._path = [i];
            this._render();
          },
          () => {
            this._update((c) => c.graphs.splice(i, 1));
            this._render();
          },
          i > 0 ? () => this._moveItem((c) => c.graphs, i, -1) : null,
          i < graphs.length - 1 ? () => this._moveItem((c) => c.graphs, i, 1) : null
        )
      );
    });

    this.appendChild(
      this._addButton("Ajouter un graphe", () => {
        let idx;
        this._update((c) => {
          c.graphs = c.graphs || [];
          c.graphs.push({ entities: [], name: "", hours_to_show: 24, points_per_hour: 4 });
          idx = c.graphs.length - 1;
        });
        this._path = [idx];
        this._render();
      })
    );
  }

  _renderGraph(i) {
    const g = this._config.graphs[i] || {};
    this.appendChild(
      this._backHeader(g.name || (g.entities && g.entities[0]) || "Graphe", () => {
        this._path = [];
        this._render();
      })
    );
    this.appendChild(
      this._mixed(
        MG_SCHEMA,
        {
          entities: g.entities || [],
          name: g.name,
          line_color: g.line_color,
          icon: g.icon,
          hours_to_show: g.hours_to_show != null ? g.hours_to_show : 24,
          points_per_hour: g.points_per_hour != null ? g.points_per_hour : 4,
          tap_action: g.tap_action,
          hold_action: g.hold_action,
          double_tap_action: g.double_tap_action,
        },
        MG_LABELS,
        (v) => this._update((c) => (c.graphs[i] = { ...c.graphs[i], ...v }))
      )
    );
  }
}
customElements.define("alex-multi-graph-card-editor", MultiGraphCardEditor);

window.customCards.push({
  type: "alex-multi-graph-card",
  name: "Alex Multi Graph",
  description: "Pile de mini-graphes configurables (fond de card du thème).",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === pill-card ===========================================================
 * Pastille nom + label, icône ronde et chevron. Fond = thème par défaut.
 * Options : fond, icône, couleur d'icône, couleur du nom, couleur du label.
 * ========================================================================= */

class PillCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("alex-pill-card-editor");
  }
  static getStubConfig() {
    return { name: "Titre", secondary: "Sous-titre", icon: "mdi:home" };
  }

  _templatableFields() {
    return ["name", "secondary"];
  }

  _innerConfig(c) {
    const bg = colorOr(
      c.background,
      "var(--ha-card-background, var(--card-background-color))"
    );
    const iconColor = colorOr(c.icon_color, "var(--state-icon-color)");
    const circleBg = Array.isArray(c.icon_color)
      ? rgba(c.icon_color, 0.14)
      : "rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08)";
    const nameColor = colorOr(c.name_color, "var(--primary-text-color)");
    const secColor = colorOr(c.secondary_color, "var(--secondary-text-color)");
    const name = this._templated("name");
    const secondary = this._templated("secondary");

    const cfg = {
      type: "custom:button-card",
      icon: c.icon || "mdi:home",
      name: name || "",
      label: secondary || "",
      show_name: true,
      show_label: true,
      show_icon: true,
      styles: {
        card: [
          { height: "64px" },
          { padding: "8px 14px" },
          { "border-radius": "20px" },
          { background: bg },
          { "box-shadow": "0 4px 12px rgba(50, 60, 90, 0.08)" },
        ],
        grid: [
          { "grid-template-areas": '"i n action" "i l action"' },
          { "grid-template-columns": "42px 1fr 25px" },
          { "grid-template-rows": "1fr 1fr" },
          { "column-gap": "10px" },
        ],
        img_cell: [
          { width: "40px" },
          { height: "40px" },
          { "border-radius": "50%" },
          { background: circleBg },
          { "align-self": "center" },
          { "justify-self": "center" },
        ],
        icon: [{ width: "21px" }, { height: "21px" }, { color: iconColor }],
        name: [
          { "justify-self": "start" },
          { "align-self": "end" },
          { "font-size": "15px" },
          { "font-weight": "650" },
          { color: nameColor },
          { "line-height": "18px" },
        ],
        label: [
          { "justify-self": "start" },
          { "align-self": "start" },
          { "font-size": "12px" },
          { "font-weight": "500" },
          { color: secColor },
          { "line-height": "15px" },
        ],
        custom_fields: {
          action: [
            { color: secColor },
            { "align-self": "center" },
            { "justify-self": "end" },
          ],
        },
      },
      custom_fields: {
        action: '<ha-icon icon="mdi:chevron-right"></ha-icon>',
      },
    };
    return applyActions(cfg, c);
  }
}
customElements.define("alex-pill-card", PillCard);

class PillCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "name", selector: { text: {} } },
      { name: "secondary", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      {
        name: "customisation",
        type: "expandable",
        flatten: true,
        title: "Customisation",
        icon: "mdi:palette",
        schema: [
          { name: "background", selector: { color_rgb: {} } },
          { name: "icon_color", selector: { color_rgb: {} } },
          { name: "name_color", selector: { color_rgb: {} } },
          { name: "secondary_color", selector: { color_rgb: {} } },
        ],
      },
      INTERACTIONS_FIELD,
    ];
    this._labels = Object.assign(
      {
        name: "Nom",
        secondary: "Sous-titre (label)",
        icon: "Icône",
        background: "Fond de la carte",
        icon_color: "Couleur de l'icône",
        name_color: "Couleur du nom",
        secondary_color: "Couleur du sous-titre",
      },
      ACTION_LABELS
    );
  }
}
customElements.define("alex-pill-card-editor", PillCardEditor);

window.customCards.push({
  type: "alex-pill-card",
  name: "Alex Pill",
  description: "Pastille nom + sous-titre avec icône et chevron.",
  preview: true,
  documentationURL: "https://github.com/<user>/alex-cards",
});

// Corps de templates button-card ([[[ ... ]]]) generes depuis les 4 YAML
// fournis par l'utilisateur. Jetons remplaces a l'execution de _innerConfig:
// @@ENTITY@@, @@DAYS@@, @@PRIMARY@@, @@SECONDARY@@, @@BG@@.
const TPL_CURRENT_BG = "const w = states['@@ENTITY@@'];\n\nif (!w)\n  return 'linear-gradient(135deg, #71869a 0%, #506579 50%, #303f50 100%)';\n\nconst backgrounds = {\n  sunny: 'linear-gradient(135deg, #438bb8 0%, #28658e 50%, #1d3e5b 100%)',\n  'clear-night': 'linear-gradient(135deg, #5965a5 0%, #363c72 50%, #20233f 100%)',\n  partlycloudy: 'linear-gradient(135deg, #5fa8d3 0%, #438bb8 50%, #52677d 100%)',\n  cloudy: 'linear-gradient(135deg, #71869a 0%, #506579 50%, #303f50 100%)',\n  rainy: 'linear-gradient(135deg, #71869a 0%, #506579 50%, #303f50 100%)',\n  pouring: 'linear-gradient(135deg, #71869a 0%, #506579 50%, #303f50 100%)',\n  snowy: 'linear-gradient(135deg, #b8d8eb 0%, #79a9c5 50%, #496c82 100%)',\n  'snowy-rainy': 'linear-gradient(135deg, #78aabd 0%, #507f98 50%, #304f63 100%)',\n  fog: 'linear-gradient(135deg, #a5adb2 0%, #747f86 50%, #4c565d 100%)',\n  windy: 'linear-gradient(135deg, #48a6b8 0%, #327f91 50%, #235566 100%)',\n  'windy-variant': 'linear-gradient(135deg, #48a6b8 0%, #327f91 50%, #235566 100%)'\n};\n\nreturn backgrounds[w.state] || backgrounds.cloudy;";
const TPL_CURRENT_TEMP = "const w = states['@@ENTITY@@'];\n\nreturn w && w.attributes.temperature !== undefined\n  ? `${w.attributes.temperature}\u00b0`\n  : '--\u00b0';";
const TPL_CURRENT_CONDITION = "const w = states['@@ENTITY@@'];\n\nif (!w) return '';\n\nconst conditions = {\n  sunny: 'Ensoleill\u00e9',\n  'clear-night': 'Nuit claire',\n  partlycloudy: 'Partiellement nuageux',\n  cloudy: 'Nuageux',\n  rainy: 'Pluie',\n  pouring: 'Forte pluie',\n  snowy: 'Neige',\n  'snowy-rainy': 'Neige et pluie',\n  fog: 'Brouillard',\n  windy: 'Venteux',\n  'windy-variant': 'Venteux'\n};\n\nreturn conditions[w.state] || w.state;";
const TPL_CURRENT_RANGE = "const w = states['@@ENTITY@@'];\n\nif (!w) return '';\n\nconst fc = (@@FORECAST_JSON@@)[0];\n\nif (fc && fc.temperature !== undefined) {\n  const max = Math.round(fc.temperature);\n  const min = fc.templow !== undefined ? Math.round(fc.templow) : max - 6;\n  return `\u2191 ${max}\u00b0   \u2193 ${min}\u00b0`;\n}\n\nif (w.attributes.temperature === undefined) return '';\n\nconst t = Number(w.attributes.temperature);\nreturn `\u2191 ${Math.round(t + 2)}\u00b0   \u2193 ${Math.round(t - 6)}\u00b0`;";
const TPL_CURRENT_ICON = "const w = states['@@ENTITY@@'];\n\nif (!w)\n  return 'mdi:weather-cloudy';\n\nconst icons = {\n  sunny: 'mdi:weather-sunny',\n  'clear-night': 'mdi:weather-night',\n  partlycloudy: 'mdi:weather-partly-cloudy',\n  cloudy: 'mdi:weather-cloudy',\n  rainy: 'mdi:weather-rainy',\n  pouring: 'mdi:weather-pouring',\n  snowy: 'mdi:weather-snowy',\n  'snowy-rainy': 'mdi:weather-snowy-rainy',\n  fog: 'mdi:weather-fog',\n  windy: 'mdi:weather-windy',\n  'windy-variant': 'mdi:weather-windy-variant'\n};\n\nreturn icons[w.state] || 'mdi:weather-cloudy';";
const TPL_FORECAST_CLASSIC = "const raw = @@FORECAST_JSON@@;\n\nif (!raw.length) {\n  return '<div style=\"display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.4);font-size:13px;text-align:center;padding:0 12px;\">Pr\u00e9visions indisponibles pour cette entit\u00e9</div>';\n}\n\nconst DAY_NAMES = ['Di.', 'Lu.', 'Ma.', 'Me.', 'Je.', 'Ve.', 'Sa.'];\nconst EMOJI = {\n  sunny: '\u2600\ufe0f', 'clear-night': '\ud83c\udf19', partlycloudy: '\u26c5', cloudy: '\u2601\ufe0f',\n  rainy: '\ud83c\udf27\ufe0f', pouring: '\ud83c\udf27\ufe0f', snowy: '\u2744\ufe0f', 'snowy-rainy': '\ud83c\udf28\ufe0f',\n  fog: '\ud83c\udf2b\ufe0f', windy: '\ud83d\udca8', 'windy-variant': '\ud83d\udca8',\n  exceptional: '\u26a0\ufe0f', hail: '\ud83c\udf28\ufe0f', lightning: '\u26c8\ufe0f', 'lightning-rainy': '\u26c8\ufe0f'\n};\n\nconst data = raw.slice(0, @@DAYS@@).map(f => {\n  const d = new Date(f.datetime);\n  const max = f.temperature !== undefined ? Math.round(f.temperature) : null;\n  const min = f.templow !== undefined\n    ? Math.round(f.templow)\n    : (max !== null ? max - 5 : null);\n\n  return {\n    day: DAY_NAMES[d.getDay()],\n    date: String(d.getDate()).padStart(2, '0'),\n    icon: EMOJI[f.condition] || '\u2601\ufe0f',\n    max: max !== null ? max : '--',\n    min: min !== null ? min : '--',\n    rain: (f.precipitation !== undefined ? f.precipitation : 0).toFixed(1)\n  };\n});\n\nconst nums = key => data.map(x => x[key]).filter(v => typeof v === 'number');\nconst mins = nums('min');\nconst maxs = nums('max');\nconst globalMin = mins.length ? Math.min(...mins) : 0;\nconst globalMax = maxs.length ? Math.max(...maxs) : 1;\nconst range = (globalMax - globalMin) || 1;\n\nreturn `\n  <div class=\"forecast\">\n    ${data.map(item => {\n\n      const top = typeof item.max === 'number'\n        ? ((globalMax - item.max) / range) * 100\n        : 0;\n\n      const bottom = typeof item.min === 'number'\n        ? ((globalMax - item.min) / range) * 100\n        : 100;\n\n      const height = bottom - top;\n\n      return `\n        <div class=\"day\">\n\n          <div class=\"day-name\">\n            ${item.day}\n          </div>\n\n          <div class=\"date\">\n            ${item.date}\n          </div>\n\n          <div class=\"weather-icon\">\n            ${item.icon}\n          </div>\n\n          <div class=\"temperature\">\n            ${item.max}\u00b0\n          </div>\n\n          <div class=\"range\">\n            <div class=\"range-bg\"></div>\n\n            <div\n              class=\"range-value\"\n              style=\"\n                top:${top}%;\n                height:${height}%;\n              \"\n            ></div>\n          </div>\n\n          <div class=\"low\">\n            ${item.min}\u00b0\n          </div>\n\n          <div class=\"rain\">\n            ${item.rain}\n          </div>\n\n        </div>\n      `;\n    }).join('')}\n  </div>\n`;";
const TPL_FORECAST_BARS = "const raw = @@FORECAST_JSON@@;\n\nif (!raw.length) {\n  return '<div style=\"display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.4);font-size:13px;text-align:center;padding:0 12px;\">Pr\u00e9visions indisponibles pour cette entit\u00e9</div>';\n}\n\nconst DAY_NAMES = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];\nconst ICONS = {\n  sunny: 'mdi:weather-sunny', 'clear-night': 'mdi:weather-night',\n  partlycloudy: 'mdi:weather-partly-cloudy', cloudy: 'mdi:weather-cloudy',\n  rainy: 'mdi:weather-rainy', pouring: 'mdi:weather-pouring',\n  snowy: 'mdi:weather-snowy', 'snowy-rainy': 'mdi:weather-snowy-rainy',\n  fog: 'mdi:weather-fog', windy: 'mdi:weather-windy',\n  'windy-variant': 'mdi:weather-windy-variant',\n  exceptional: 'mdi:alert', hail: 'mdi:weather-hail',\n  lightning: 'mdi:weather-lightning', 'lightning-rainy': 'mdi:weather-lightning-rainy'\n};\n\nconst data = raw.slice(0, @@DAYS@@).map((f, i) => {\n  const d = new Date(f.datetime);\n  const max = f.temperature !== undefined ? Math.round(f.temperature) : 0;\n  const min = f.templow !== undefined ? Math.round(f.templow) : max - 5;\n\n  return {\n    day: DAY_NAMES[d.getDay()],\n    icon: ICONS[f.condition] || 'mdi:weather-cloudy',\n    min,\n    max,\n    current: i === 0\n  };\n});\n\n/*\n * \u00c9chelle thermique : -10\u00b0C = 0%, 55\u00b0C = 100%\n */\nconst minTemp = -10;\nconst maxTemp = 55;\n\nconst getPosition = temp => {\n  const position = ((temp - minTemp) / (maxTemp - minTemp)) * 100;\n  return Math.max(0, Math.min(100, position));\n};\n\nreturn `\n  <div class=\"daily\">\n\n    ${data.map(item => {\n\n      const minPosition = getPosition(item.min);\n      const maxPosition = getPosition(item.max);\n      const rangeWidth = maxPosition - minPosition;\n\n      return `\n        <div class=\"row\">\n\n          <div class=\"day\">\n            ${item.day}\n          </div>\n\n          <div class=\"icon\">\n            <ha-icon\n              icon=\"${item.icon}\"\n              style=\"\n                --mdc-icon-size:22px;\n              \"\n            ></ha-icon>\n          </div>\n\n          <div class=\"bar\">\n\n            <div\n              class=\"range\"\n              style=\"\n                left:${minPosition}%;\n                width:${rangeWidth}%;\n              \"\n            ></div>\n\n            <div\n              class=\"point ${item.current ? 'current' : ''}\"\n              style=\"\n                left:${minPosition}%;\n              \"\n            ></div>\n\n          </div>\n\n          <div class=\"temps\">\n            <span class=\"max\">\n              ${item.max}\u00b0\n            </span>\n\n            <span class=\"min\">\n              ${item.min}\u00b0\n            </span>\n          </div>\n\n        </div>\n      `;\n\n    }).join('')}\n\n  </div>\n`;";
const TPL_FORECAST_CHART = "const raw = @@FORECAST_JSON@@;\n\nif (!raw.length) {\n  return '<div style=\"display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.4);font-size:13px;text-align:center;padding:0 12px;\">Pr\u00e9visions indisponibles pour cette entit\u00e9</div>';\n}\n\nconst DAY_NAMES = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];\nconst EMOJI = {\n  sunny: '\u2600\ufe0f', 'clear-night': '\ud83c\udf19', partlycloudy: '\ud83c\udf24\ufe0f', cloudy: '\u2601\ufe0f',\n  rainy: '\ud83c\udf27\ufe0f', pouring: '\ud83c\udf27\ufe0f', snowy: '\u2744\ufe0f', 'snowy-rainy': '\ud83c\udf28\ufe0f',\n  fog: '\ud83c\udf2b\ufe0f', windy: '\ud83d\udca8', 'windy-variant': '\ud83d\udca8',\n  exceptional: '\u26a0\ufe0f', hail: '\ud83c\udf28\ufe0f', lightning: '\u26c8\ufe0f', 'lightning-rainy': '\u26c8\ufe0f'\n};\n\nconst data = raw.slice(0, @@DAYS@@).map(f => {\n  const d = new Date(f.datetime);\n  const max = f.temperature !== undefined ? Math.round(f.temperature) : 0;\n  const min = f.templow !== undefined ? Math.round(f.templow) : max - 5;\n\n  return {\n    day: DAY_NAMES[d.getDay()],\n    icon: EMOJI[f.condition] || '\u2601\ufe0f',\n    max,\n    min,\n    rain: f.precipitation !== undefined ? f.precipitation : 0\n  };\n});\n\n/*\n * ==========================\n * DIMENSIONS\n * ==========================\n */\n\nconst width = 500;\nconst height = 225;\n\nconst left = 35;\nconst right = 465;\n\nconst graphTop = 78;\nconst graphBottom = 154;\n\nconst rainBottom = 203;\nconst rainMaxHeight = 22;\n\n/*\n * ==========================\n * ECHELLE TEMPERATURE\n * ==========================\n */\n\nconst temperatures = [\n  ...data.map(item => item.max),\n  ...data.map(item => item.min)\n];\n\nconst dataMin = Math.min(...temperatures);\nconst dataMax = Math.max(...temperatures);\n\nconst minTemp = dataMin - 2;\nconst maxTemp = dataMax + 2;\n\nconst y = temp => {\n\n  const ratio =\n    (maxTemp - temp) /\n    (maxTemp - minTemp);\n\n  return graphTop +\n    ratio *\n    (graphBottom - graphTop);\n};\n\n/*\n * ==========================\n * POSITIONS\n * ==========================\n */\n\nconst step =\n  data.length > 1\n    ? (right - left) / (data.length - 1)\n    : 0;\n\nconst x = i =>\n  data.length > 1 ? left + i * step : (left + right) / 2;\n\n/*\n * ==========================\n * COURBES DE BEZIER\n * ==========================\n */\n\nconst createSmoothPath = values => {\n\n  if (values.length === 0)\n    return '';\n\n  let path =\n    `M ${x(0)} ${y(values[0])}`;\n\n  for (let i = 0; i < values.length - 1; i++) {\n\n    const x1 = x(i);\n    const y1 = y(values[i]);\n\n    const x2 = x(i + 1);\n    const y2 = y(values[i + 1]);\n\n    const controlOffset =\n      (x2 - x1) * 0.35;\n\n    path += `\n      C\n      ${x1 + controlOffset} ${y1},\n      ${x2 - controlOffset} ${y2},\n      ${x2} ${y2}\n    `;\n  }\n\n  return path;\n};\n\nconst maxPath =\n  createSmoothPath(\n    data.map(item => item.max)\n  );\n\nconst minPath =\n  createSmoothPath(\n    data.map(item => item.min)\n  );\n\n/*\n * ==========================\n * JOURS + ICONES\n * ==========================\n */\n\nconst days = data.map((item, i) => `\n  <text\n    x=\"${x(i)}\"\n    y=\"18\"\n    text-anchor=\"middle\"\n    font-size=\"15\"\n    font-weight=\"400\"\n    fill=\"rgba(255,255,255,.82)\"\n  >\n    ${item.day}\n  </text>\n\n  <text\n    x=\"${x(i)}\"\n    y=\"52\"\n    text-anchor=\"middle\"\n    font-size=\"27\"\n  >\n    ${item.icon}\n  </text>\n`).join('');\n\n/*\n * ==========================\n * TEMPERATURE MAX (couleur primaire)\n * ==========================\n */\n\nconst maxLabels = data.map((item, i) => `\n  <text\n    x=\"${x(i)}\"\n    y=\"${y(item.max) - 9}\"\n    text-anchor=\"middle\"\n    font-size=\"14\"\n    font-weight=\"500\"\n    fill=\"@@PRIMARY@@\"\n  >\n    ${item.max}\u00b0\n  </text>\n`).join('');\n\n/*\n * ==========================\n * TEMPERATURE MIN (couleur secondaire)\n * ==========================\n */\n\nconst minLabels = data.map((item, i) => `\n  <text\n    x=\"${x(i)}\"\n    y=\"${y(item.min) + 16}\"\n    text-anchor=\"middle\"\n    font-size=\"11\"\n    font-weight=\"400\"\n    fill=\"@@SECONDARY@@\"\n  >\n    ${item.min}\u00b0\n  </text>\n`).join('');\n\n/*\n * ==========================\n * POINTS\n * ==========================\n */\n\nconst maxCircles = data.map((item, i) => `\n  <circle\n    cx=\"${x(i)}\"\n    cy=\"${y(item.max)}\"\n    r=\"4\"\n    fill=\"@@PRIMARY@@\"\n    stroke=\"@@BG@@\"\n    stroke-width=\"2\"\n  />\n`).join('');\n\nconst minCircles = data.map((item, i) => `\n  <circle\n    cx=\"${x(i)}\"\n    cy=\"${y(item.min)}\"\n    r=\"4\"\n    fill=\"@@SECONDARY@@\"\n    stroke=\"@@BG@@\"\n    stroke-width=\"2\"\n  />\n`).join('');\n\n/*\n * ==========================\n * PLUIE\n * ==========================\n */\n\nconst maxRain =\n  Math.max(\n    ...data.map(item => item.rain),\n    1\n  );\n\nconst rain = data.map((item, i) => {\n\n  if (item.rain <= 0) {\n    return `\n      <text\n        x=\"${x(i)}\"\n        y=\"${rainBottom + 10}\"\n        text-anchor=\"middle\"\n        font-size=\"10\"\n        fill=\"rgba(255,255,255,.20)\"\n      >\n        \u2014\n      </text>\n    `;\n  }\n\n  const barHeight =\n    (item.rain / maxRain) *\n    rainMaxHeight;\n\n  return `\n    <rect\n      x=\"${x(i) - 8}\"\n      y=\"${rainBottom - barHeight}\"\n      width=\"16\"\n      height=\"${barHeight}\"\n      rx=\"4\"\n      fill=\"rgba(57,124,168,.60)\"\n    />\n\n    <text\n      x=\"${x(i)}\"\n      y=\"${rainBottom + 10}\"\n      text-anchor=\"middle\"\n      font-size=\"10\"\n      fill=\"rgba(100,160,200,.78)\"\n    >\n      ${item.rain}\n    </text>\n  `;\n}).join('');\n\n/*\n * ==========================\n * SVG\n * ==========================\n */\n\nreturn `\n  <svg\n    xmlns=\"http://www.w3.org/2000/svg\"\n    viewBox=\"0 0 ${width} ${height}\"\n    preserveAspectRatio=\"none\"\n    style=\"\n      display:block;\n      width:100%;\n      height:100%;\n    \"\n  >\n\n    ${days}\n\n    <line x1=\"${left}\" x2=\"${right}\" y1=\"95\" y2=\"95\" stroke=\"rgba(255,255,255,.035)\" stroke-width=\"1\" />\n    <line x1=\"${left}\" x2=\"${right}\" y1=\"125\" y2=\"125\" stroke=\"rgba(255,255,255,.035)\" stroke-width=\"1\" />\n    <line x1=\"${left}\" x2=\"${right}\" y1=\"154\" y2=\"154\" stroke=\"rgba(255,255,255,.035)\" stroke-width=\"1\" />\n\n    <path d=\"${maxPath}\" fill=\"none\" stroke=\"@@PRIMARY@@\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />\n    <path d=\"${minPath}\" fill=\"none\" stroke=\"@@SECONDARY@@\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />\n\n    ${maxCircles}\n    ${minCircles}\n\n    ${maxLabels}\n    ${minLabels}\n\n    ${rain}\n\n  </svg>\n`;";
/* =========================================================================
 * === weather-card ========================================================
 * Empile un ou plusieurs "composants" meteo (actuelle + 3 styles de
 * previsions) dans une seule carte. Chaque composant est un
 * custom:button-card genere a partir des templates ci-dessus.
 * ========================================================================= */

const WEATHER_COMPONENT_LABELS = {
  current: "Météo actuelle",
  classic: "Prévisions (icônes + barres)",
  bars: "Prévisions (lignes + jauge)",
  chart: "Prévisions (graphique courbes)",
};
const WEATHER_COMPONENT_OPTIONS = Object.entries(WEATHER_COMPONENT_LABELS).map(
  ([value, label]) => ({ value, label })
);
const WEATHER_COMPONENT_ICONS = {
  current: "mdi:weather-partly-cloudy",
  classic: "mdi:calendar-week",
  bars: "mdi:chart-timeline-variant",
  chart: "mdi:chart-bell-curve",
};

// Remplace les jetons @@X@@ dans un corps de template. `tokens` est un objet
// { NOM: valeur }. Les valeurs non fournies laissent le jeton tel quel (utile
// pour deboguer), donc on fournit toujours une valeur pour chaque jeton utilise.
function fillTokens(body, tokens) {
  let out = body;
  Object.entries(tokens).forEach(([k, v]) => {
    out = out.split(`@@${k}@@`).join(String(v));
  });
  return out;
}

class WeatherCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("alex-weather-card-editor");
  }
  static getStubConfig() {
    return {
      entity: "",
      components: [{ type: "current" }],
    };
  }

  constructor() {
    super();
    // entity -> tableau de prevision (via l'abonnement WS weather/subscribe_forecast)
    this._forecasts = {};
    // entity -> fonction de desabonnement (ou null pendant la souscription)
    this._forecastSubs = {};
  }

  disconnectedCallback() {
    Object.values(this._forecastSubs).forEach((unsub) => {
      if (typeof unsub === "function") {
        try {
          unsub();
        } catch (e) {
          /* ignore */
        }
      }
    });
    this._forecastSubs = {};
  }

  setConfig(config) {
    this._config = config;
    this._ensureForecastSub();
    if (this._hass) this._build();
  }

  set hass(hass) {
    this._hass = hass;
    this._ensureForecastSub();
    if (this._card) this._card.hass = hass;
    else this._build();
  }

  // L'entite est partagee par toute la carte : un seul abonnement WS suffit
  // (weather/subscribe_forecast est la methode moderne de HA depuis 2023.9 -
  // les previsions ne sont plus systematiquement dans attributes.forecast).
  _ensureForecastSub() {
    const entity = this._config && this._config.entity;
    const hasComponents =
      this._config && Array.isArray(this._config.components) && this._config.components.length;

    Object.keys(this._forecastSubs).forEach((e) => {
      if (e !== entity || !hasComponents) {
        const unsub = this._forecastSubs[e];
        if (typeof unsub === "function") {
          try {
            unsub();
          } catch (err) {
            /* ignore */
          }
        }
        delete this._forecastSubs[e];
        delete this._forecasts[e];
      }
    });

    if (!entity || !hasComponents) return;
    if (!this._hass || !this._hass.connection) return;
    if (Object.prototype.hasOwnProperty.call(this._forecastSubs, entity)) return;

    this._forecastSubs[entity] = null; // souscription en cours, evite les doublons
    this._hass.connection
      .subscribeMessage(
        (msg) => {
          this._forecasts[entity] = (msg && msg.forecast) || [];
          this._build();
        },
        { type: "weather/subscribe_forecast", entity_id: entity, forecast_type: "daily" }
      )
      .then((unsub) => {
        this._forecastSubs[entity] = unsub;
      })
      .catch(() => {
        // Repli pour les integrations qui n'exposent pas encore le nouveau
        // systeme : on tente une lecture ponctuelle (non reactive) de
        // l'ancien attribut, si present.
        delete this._forecastSubs[entity];
        const st = this._hass.states[entity];
        const legacy = st && st.attributes && st.attributes.forecast;
        if (Array.isArray(legacy)) {
          this._forecasts[entity] = legacy;
          this._build();
        }
      });
  }

  _currentConfig(entity, comp, keepsOwnBg) {
    const primary = colorOr(comp.primary_color, null);
    const secondary = colorOr(comp.secondary_color, null);
    const bgOverride = colorOr(comp.background, null);

    const primaryTemp = primary || "var(--primary-text-color)";
    const primaryCond = primary || "var(--primary-text-color)";
    const secondaryRange = secondary || "var(--secondary-text-color)";

    const forecastJson = JSON.stringify(this._forecasts[entity] || []);
    const t = (tpl) => fillTokens(tpl, { ENTITY: entity, FORECAST_JSON: forecastJson });

    const bgValue = !keepsOwnBg
      ? "transparent"
      : bgOverride
      ? bgOverride
      : "[[[ " + t(TPL_CURRENT_BG) + " ]]]";

    return {
      type: "custom:button-card",
      entity,
      show_name: false,
      show_state: false,
      show_icon: false,
      tap_action: { action: "more-info" },
      styles: {
        card: [
          { height: "120px" },
          { "border-radius": keepsOwnBg ? "22px" : "0" },
          { padding: "8px 16px" },
          { background: bgValue },
          { "box-shadow": "none" },
          { border: "none" },
          { overflow: "visible" },
        ],
        grid: [
          {
            "grid-template-areas":
              '"temp icon"\n"condition icon"\n"range icon"',
          },
          { "grid-template-columns": "1fr 90px" },
          { "grid-template-rows": "54px 25px 18px" },
          { overflow: "visible" },
        ],
      },
      custom_fields: {
        temp: {
          card: {
            type: "custom:button-card",
            show_icon: false,
            show_name: true,
            name: "[[[ " + t(TPL_CURRENT_TEMP) + " ]]]",
            styles: {
              card: [
                { background: "transparent" },
                { border: "none" },
                { "border-radius": "0" },
                { "box-shadow": "none" },
                { padding: "0" },
                { margin: "0" },
                { overflow: "visible" },
              ],
              grid: [{ overflow: "visible" }],
              name: [
                { "justify-self": "start" },
                { "align-self": "center" },
                { "font-size": "42px" },
                { "font-weight": "300" },
                { "margin-top": "10px" },
                { "line-height": "1" },
                { color: primaryTemp },
                { "white-space": "nowrap" },
                { overflow: "visible" },
              ],
            },
          },
        },
        condition: {
          card: {
            type: "custom:button-card",
            show_icon: false,
            show_name: true,
            name: "[[[ " + t(TPL_CURRENT_CONDITION) + " ]]]",
            styles: {
              card: [
                { background: "transparent" },
                { border: "none" },
                { "border-radius": "0" },
                { "box-shadow": "none" },
                { padding: "0" },
                { margin: "0" },
                { overflow: "visible" },
              ],
              grid: [{ overflow: "visible" }],
              name: [
                { "justify-self": "start" },
                { "align-self": "center" },
                { "font-size": "15px" },
                { "font-weight": "400" },
                { "line-height": "1" },
                { color: primaryCond },
                { "white-space": "nowrap" },
                { overflow: "visible" },
              ],
            },
          },
        },
        range: {
          card: {
            type: "custom:button-card",
            show_icon: false,
            show_name: true,
            name: "[[[ " + t(TPL_CURRENT_RANGE) + " ]]]",
            styles: {
              card: [
                { background: "transparent" },
                { border: "none" },
                { "border-radius": "0" },
                { "box-shadow": "none" },
                { padding: "0" },
                { margin: "0" },
                { overflow: "visible" },
              ],
              grid: [{ overflow: "visible" }],
              name: [
                { "justify-self": "start" },
                { "align-self": "center" },
                { "font-size": "12px" },
                { "line-height": "1" },
                { color: secondaryRange },
                { "white-space": "nowrap" },
                { overflow: "visible" },
              ],
            },
          },
        },
        icon: {
          card: {
            type: "custom:button-card",
            show_name: false,
            show_state: false,
            icon: "[[[ " + t(TPL_CURRENT_ICON) + " ]]]",
            styles: {
              card: [
                { background: "transparent" },
                { border: "none" },
                { "border-radius": "0" },
                { "box-shadow": "none" },
                { padding: "0" },
                { margin: "0" },
                { overflow: "visible" },
              ],
              grid: [{ overflow: "visible" }],
              icon: [
                { width: "72px" },
                { height: "72px" },
                { color: "#f5c542" },
              ],
            },
          },
        },
      },
    };
  }

  _forecastConfig(entity, comp, opts, keepsOwnBg, outerBg) {
    // opts: { field, template, extraStyles, bg, height, gridArea, extraColors, extraValues }
    const days = comp.days != null ? comp.days : 5;
    const primary = colorOr(comp.primary_color, opts.defaultPrimary);
    const secondary = colorOr(comp.secondary_color, opts.defaultSecondary);
    const ownBg = colorOr(comp.background, null);
    const bg = !keepsOwnBg ? "transparent" : ownBg || opts.defaultBg;
    // Pour les elements decoratifs (ex. contour des points de la courbe) qui
    // doivent visuellement se fondre dans ce qui est REELLEMENT affiche
    // derriere le composant (le fond du conteneur externe quand transparent).
    const visualBg = !keepsOwnBg ? outerBg : bg;
    const forecastJson = JSON.stringify(this._forecasts[entity] || []);

    // Couleurs additionnelles propres a certains styles (ex. piston du
    // classic, jauge du bars) : repli sur primary ou secondary si l'utilisateur
    // ne les personnalise pas individuellement.
    const extraTokens = {};
    (opts.extraColors || []).forEach(({ token, field, fallback }) => {
      extraTokens[token] = colorOr(comp[field], fallback === "primary" ? primary : secondary);
    });
    // Valeurs additionnelles non-couleur (ex. ecartement entre les lignes),
    // avec repli sur une valeur par defaut si l'utilisateur ne la definit pas.
    (opts.extraValues || []).forEach(({ token, field, fallback }) => {
      extraTokens[token] = comp[field] != null ? comp[field] : fallback;
    });

    const tokenValues = Object.assign(
      {
        ENTITY: entity,
        DAYS: days,
        PRIMARY: primary,
        SECONDARY: secondary,
        BG: visualBg,
        FORECAST_JSON: forecastJson,
      },
      extraTokens
    );

    const body = fillTokens(opts.template, tokenValues);
    const heightVal = typeof opts.height === "function" ? opts.height(comp, days) : opts.height;

    const cfg = {
      type: "custom:button-card",
      entity,
      show_name: false,
      show_icon: false,
      show_state: false,
      styles: {
        card: [
          { height: heightVal },
          { "border-radius": keepsOwnBg ? "22px" : "0" },
          { padding: opts.padding },
          { background: bg },
          { border: "none" },
          { "box-shadow": "none" },
          { overflow: "hidden" },
        ],
        grid: [
          { "grid-template-areas": `"${opts.field}"` },
          { "grid-template-columns": "1fr" },
          { "grid-template-rows": "1fr" },
          { width: "100%" },
          { height: "100%" },
        ],
        custom_fields: {
          [opts.field]: [
            { width: "100%" },
            { height: "100%" },
            { "align-self": "stretch" },
            { "justify-self": "stretch" },
          ],
        },
      },
      custom_fields: {
        [opts.field]: "[[[ " + body + " ]]]",
      },
    };

    if (opts.extraStyles) {
      cfg.extra_styles = fillTokens(opts.extraStyles, tokenValues);
    }

    return cfg;
  }

  _classicConfig(entity, comp, keepsOwnBg, outerBg) {
    const extraStyles = `
.forecast { display:flex; width:100%; height:100%; justify-content:space-between; align-items:stretch; gap:0; }
.day { flex:1 1 0; min-width:0; width:0; display:flex; flex-direction:column; align-items:center; text-align:center; }
.day-name { font-size:16px; font-weight:400; color:@@PRIMARY@@; line-height:1.1; }
.date { font-size:13px; color:@@SECONDARY@@; margin-top:3px; }
.weather-icon { height:52px; width:100%; display:flex; align-items:center; justify-content:center; font-size:30px; margin-top:2px; }
.temperature { font-size:16px; font-weight:500; color:@@PRIMARY@@; margin-top:3px; }
.range { position:relative; width:9px; height:155px; margin-top:7px; }
.range-bg { position:absolute; inset:0; width:9px; border-radius:20px; background:@@RANGE_TRACK@@; }
.range-value { position:absolute; left:0; width:9px; border-radius:20px; background:@@RANGE_FILL@@; }
.low { font-size:14px; font-weight:500; color:@@SECONDARY@@; margin-top:5px; }
.rain { font-size:13px; color:#3877aa; margin-top:8px; }
`.trim();

    return this._forecastConfig(
      entity,
      comp,
      {
        field: "forecast",
        template: TPL_FORECAST_CLASSIC,
        extraStyles,
        defaultBg: "var(--ha-card-background, var(--card-background-color))",
        defaultPrimary: "var(--primary-text-color)",
        defaultSecondary: "var(--secondary-text-color)",
        extraColors: [
          { token: "RANGE_TRACK", field: "range_track_color", fallback: "secondary" },
          { token: "RANGE_FILL", field: "range_fill_color", fallback: "primary" },
        ],
        height: "255px",
        padding: "15px 10px",
      },
      keepsOwnBg,
      outerBg
    );
  }

  _barsConfig(entity, comp, keepsOwnBg, outerBg) {
    const extraStyles = `
.daily { display:flex; flex-direction:column; justify-content:flex-start; gap:@@ROW_GAP@@px; width:100%; height:100%; overflow:hidden; }
.row { display:grid; grid-template-columns:72px 28px minmax(0,1fr) 58px; align-items:center; column-gap:0px; margin-left:-10px; width:100%; height:30px; }
.day { font-size:13px; font-weight:400; color:@@PRIMARY@@; white-space:nowrap; }
.icon { display:flex; align-items:center; justify-content:center; color:@@PRIMARY@@; transform:translateX(-12px); }
.bar { position:relative; width:100%; height:12px; border-radius:20px; background:linear-gradient(90deg, rgba(62,125,170,.35) 0%, rgba(82,151,181,.35) 25%, rgba(128,171,137,.35) 45%, rgba(205,183,87,.35) 65%, rgba(218,130,67,.35) 82%, rgba(190,75,60,.35) 100%); }
.range { position:absolute; top:0; height:12px; border-radius:20px; background:@@RANGE_TRACK@@; }
.point { position:absolute; top:50%; width:12px; height:12px; transform:translate(-50%,-50%); border-radius:50%; box-sizing:border-box; background:rgba(220,220,220,.95); border:1px solid rgba(0,0,0,.75); }
.point.current { box-shadow:0 0 0 2px rgba(255,255,255,.28); }
.temps { display:grid; grid-template-columns:28px 18px; align-items:center; justify-content:end; column-gap:4px; white-space:nowrap; }
.max { font-size:14px; font-weight:600; color:@@PRIMARY@@; text-align:right; }
.min { font-size:9px; font-weight:400; color:@@SECONDARY@@; text-align:left; margin-bottom:5px; }
`.trim();

    return this._forecastConfig(
      entity,
      comp,
      {
        field: "daily",
        template: TPL_FORECAST_BARS,
        extraStyles,
        defaultBg: "var(--ha-card-background, var(--card-background-color))",
        defaultPrimary: "var(--primary-text-color)",
        defaultSecondary: "var(--secondary-text-color)",
        extraColors: [
          { token: "RANGE_TRACK", field: "range_track_color", fallback: "secondary" },
        ],
        extraValues: [{ token: "ROW_GAP", field: "row_spacing", fallback: 10 }],
        // Hauteur dynamique : row_spacing n'etant plus absorbe par un
        // space-between qui etirait automatiquement, la carte doit suivre
        // le nombre de jours x hauteur de ligne (30px, fixee en CSS) +
        // les ecarts entre lignes + le padding vertical (14px x 2).
        height: (c, days) => {
          const rowH = 30;
          const gap = c.row_spacing != null ? c.row_spacing : 10;
          const padV = 28;
          return `${days * rowH + Math.max(0, days - 1) * gap + padV}px`;
        },
        padding: "14px",
      },
      keepsOwnBg,
      outerBg
    );
  }

  _chartConfig(entity, comp, keepsOwnBg, outerBg) {
    return this._forecastConfig(
      entity,
      comp,
      {
        field: "chart",
        template: TPL_FORECAST_CHART,
        extraStyles: null,
        defaultBg: "var(--ha-card-background, var(--card-background-color))",
        defaultPrimary: "#18a6d5",
        defaultSecondary: "#e8a52c",
        height: "245px",
        padding: "9px 12px",
      },
      keepsOwnBg,
      outerBg
    );
  }

  _innerConfig(c) {
    const entity = c.entity || "";
    const comps = c.components || [];
    const cardBg = colorOr(c.background, null);
    const outerBg = cardBg || "var(--ha-card-background, var(--card-background-color))";

    const cards = comps.map((comp) => {
      const ownBg = colorOr(comp.background, null);
      // Un composant garde son PROPRE fond (et ses coins arrondis) seulement
      // s'il a un override explicite, ou si c'est "current" sans fond de
      // carte defini (il conserve alors son degrade dynamique). Sinon, il
      // devient transparent et suit le fond unique du conteneur externe.
      const keepsOwnBg = !!ownBg || (comp.type === "current" && !cardBg);

      if (comp.type === "classic")
        return this._classicConfig(entity, comp, keepsOwnBg, outerBg);
      if (comp.type === "bars")
        return this._barsConfig(entity, comp, keepsOwnBg, outerBg);
      if (comp.type === "chart")
        return this._chartConfig(entity, comp, keepsOwnBg, outerBg);
      return this._currentConfig(entity, comp, keepsOwnBg);
    });

    return {
      type: "custom:vertical-stack-in-card",
      card_mod: {
        style:
          "ha-card {\n  background: " +
          outerBg +
          ";\n  border-radius: 22px;\n  overflow: hidden;\n  box-shadow: none;\n  border: none;\n}\n" +
          "#root {\n  gap: 0px !important;\n}\n" +
          "#root > * {\n  margin: 0 !important;\n}\n",
      },
      cards,
    };
  }
}
customElements.define("alex-weather-card", WeatherCard);

class WeatherCardEditor extends AlexListEditor {
  static getStubConfig() {
    return WeatherCard.getStubConfig();
  }

  _normalize() {
    if (!Array.isArray(this._config.components)) this._config.components = [];
  }

  _validPath() {
    const p = this._path || [];
    if (p.length >= 1 && !this._config.components[p[0]]) return [];
    return p;
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else this._renderComponent(p[0]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    const cfg = this._config;

    this.appendChild(this._sectionTitle("Entité"));
    this.appendChild(
      this._form(
        [{ name: "entity", selector: { entity: { domain: "weather" } } }],
        { entity: cfg.entity || "" },
        { entity: "Entité météo" },
        (v) => this._update((c) => (c.entity = v.entity))
      )
    );

    this.appendChild(this._sectionTitle("Apparence"));
    this.appendChild(
      this._colorRow(
        "Fond de la carte (vide = unifié, thème ou dégradé météo)",
        cfg.background,
        (v) => this._update((c) => (c.background = v))
      )
    );

    this.appendChild(this._sectionTitle("Composants"));
    const components = cfg.components || [];
    components.forEach((comp, i) => {
      const label = WEATHER_COMPONENT_LABELS[comp.type] || comp.type;
      const sub =
        comp.type === "current" ? undefined : `${comp.days != null ? comp.days : 5} jour(s)`;
      this.appendChild(
        this._row(
          WEATHER_COMPONENT_ICONS[comp.type] || "mdi:weather-cloudy",
          label,
          sub,
          () => {
            this._path = [i];
            this._render();
          },
          () => {
            this._update((c) => c.components.splice(i, 1));
            this._render();
          },
          i > 0 ? () => this._moveItem((c) => c.components, i, -1) : null,
          i < components.length - 1
            ? () => this._moveItem((c) => c.components, i, 1)
            : null
        )
      );
    });

    this.appendChild(
      this._form(
        [
          {
            name: "add_type",
            selector: { select: { mode: "dropdown", options: WEATHER_COMPONENT_OPTIONS } },
          },
        ],
        {},
        { add_type: "Ajouter un composant" },
        (v) => {
          if (!v || !v.add_type) return;
          let idx;
          this._update((c) => {
            c.components = c.components || [];
            const entry = { type: v.add_type };
            if (v.add_type !== "current") entry.days = 5;
            c.components.push(entry);
            idx = c.components.length - 1;
          });
          this._path = [idx];
          this._render();
        }
      )
    );
  }

  _renderComponent(i) {
    const comp = this._config.components[i] || {};
    const merge = (v) =>
      this._update((c) => (c.components[i] = { ...c.components[i], ...v }));

    this.appendChild(
      this._backHeader(WEATHER_COMPONENT_LABELS[comp.type] || comp.type, () => {
        this._path = [];
        this._render();
      })
    );

    if (comp.type !== "current") {
      this.appendChild(
        this._form(
          [
            {
              name: "days",
              selector: { number: { min: 1, max: 10, step: 1, mode: "box" } },
            },
          ],
          { days: comp.days != null ? comp.days : 5 },
          { days: "Jours de prévision" },
          merge
        )
      );
    }

    const rows = document.createElement("div");
    rows.appendChild(
      this._colorRow("Fond de la carte", comp.background, (v) => merge({ background: v }))
    );
    rows.appendChild(
      this._colorRow("Couleur primaire", comp.primary_color, (v) =>
        merge({ primary_color: v })
      )
    );
    rows.appendChild(
      this._colorRow("Couleur secondaire", comp.secondary_color, (v) =>
        merge({ secondary_color: v })
      )
    );

    if (comp.type === "classic") {
      rows.appendChild(
        this._colorRow(
          "Fond du piston (vide = secondaire)",
          comp.range_track_color,
          (v) => merge({ range_track_color: v })
        )
      );
      rows.appendChild(
        this._colorRow(
          "Levier du piston (vide = primaire)",
          comp.range_fill_color,
          (v) => merge({ range_fill_color: v })
        )
      );
    }

    if (comp.type === "bars") {
      rows.appendChild(
        this._colorRow(
          "Segment autour du point (vide = secondaire)",
          comp.range_track_color,
          (v) => merge({ range_track_color: v })
        )
      );
      rows.appendChild(
        this._form(
          [
            {
              name: "row_spacing",
              selector: { number: { min: 0, max: 40, step: 1, mode: "box" } },
            },
          ],
          { row_spacing: comp.row_spacing != null ? comp.row_spacing : 10 },
          { row_spacing: "Écartement entre les lignes (px)" },
          (v) => merge(v)
        )
      );
    }

    this.appendChild(this._panel("Customisation", "mdi:palette", rows));
  }
}
customElements.define("alex-weather-card-editor", WeatherCardEditor);

window.customCards.push({
  type: "alex-weather-card",
  name: "Alex Weather Card",
  description: "Météo actuelle et/ou prévisions (3 styles), à empiler librement.",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === alex-sensor-card ====================================================
 * Vision synthetique d'un groupe de capteurs, organises en categories
 * (ouvrant, verrou, detecteur, booleen simple, alarme). Chaque categorie
 * agrege plusieurs entites en une ligne de statut. Rendu "maison" (comme
 * room-header-card), pas de custom:button-card ici : l'agregation par
 * categorie est plus simple a exprimer en JS direct qu'en template imbrique.
 * ========================================================================= */

const SENSOR_CATEGORY_TYPES = {
  opening: "Ouvrant (porte/fenêtre)",
  lock: "Verrou",
  detector: "Détecteur",
  boolean: "Booléen simple",
  alarm: "Alarme",
};
const SENSOR_TYPE_OPTIONS = Object.entries(SENSOR_CATEGORY_TYPES).map(([value, label]) => ({
  value,
  label,
}));
const SENSOR_TYPE_DEFAULT_ICON = {
  opening: "mdi:window-closed-variant",
  lock: "mdi:lock",
  detector: "mdi:motion-sensor",
  boolean: "mdi:checkbox-marked-circle-outline",
  alarm: "mdi:shield-outline",
};
// Filtre de domaine propose par l'entity-picker selon le type de categorie
// (juste une aide au choix ; rien n'empeche techniquement un autre domaine).
const SENSOR_TYPE_DOMAINS = {
  opening: ["binary_sensor", "cover"],
  lock: ["lock", "binary_sensor"],
  detector: ["binary_sensor"],
  boolean: ["input_boolean", "binary_sensor", "switch"],
  alarm: ["alarm_control_panel"],
};

const SENSOR_TONE_CSS = {
  green: "var(--success-color, #22c55e)",
  orange: "var(--warning-color, #f4a000)",
  red: "var(--error-color, #ef4444)",
  grey: "var(--secondary-text-color)",
};

const SENSOR_ALARM_STATES = {
  disarmed: { text: "Désarmée", tone: "grey" },
  armed_home: { text: "Armée (maison)", tone: "green" },
  armed_away: { text: "Armée (absence)", tone: "green" },
  armed_night: { text: "Armée (nuit)", tone: "green" },
  armed_vacation: { text: "Armée (vacances)", tone: "green" },
  armed_custom_bypass: { text: "Armée", tone: "green" },
  arming: { text: "Activation…", tone: "orange" },
  pending: { text: "En attente", tone: "orange" },
  triggered: { text: "Déclenchée !", tone: "red" },
};

// Une entite est "active" (probleme potentiel a signaler) selon le type de
// sa categorie : porte/fenetre ouverte, serrure deverrouillee, detecteur
// declenche, booleen a "on". Gere binary_sensor (on/off), cover (open/closed)
// et lock (locked/unlocked) sans distinction de domaine.
function sensorEntityActive(type, stateObj) {
  if (!stateObj) return false;
  const s = stateObj.state;
  if (s == null || s === "unavailable" || s === "unknown") return false;
  if (type === "opening") return s === "on" || s === "open";
  if (type === "lock") return s === "unlocked" || s === "on";
  if (type === "detector") return s === "on";
  if (type === "boolean") return s === "on";
  return s === "on";
}

function pluralFr(n, word) {
  return n > 1 ? `${word}s` : word;
}

// Calcule { text, tone, dotTone } pour une categorie donnee.
function sensorCategorySummary(hass, cat) {
  const entities = cat.entities || [];

  if (cat.type === "alarm") {
    const st = entities.length && hass ? hass.states[entities[0]] : null;
    if (!st) return { text: "Indisponible", tone: "grey" };
    return SENSOR_ALARM_STATES[st.state] || { text: st.state, tone: "grey" };
  }

  const activeCount = entities.filter((e) =>
    sensorEntityActive(cat.type, hass && hass.states[e])
  ).length;

  if (cat.type === "opening") {
    return activeCount === 0
      ? { text: "Tout fermé", tone: "green" }
      : { text: `${activeCount} ${pluralFr(activeCount, "ouvert")}`, tone: "red" };
  }
  if (cat.type === "lock") {
    return activeCount === 0
      ? { text: "Tout verrouillé", tone: "green" }
      : { text: `${activeCount} déverrouillé${activeCount > 1 ? "s" : ""}`, tone: "red" };
  }
  if (cat.type === "detector") {
    return activeCount === 0
      ? { text: "Aucune détection", tone: "green" }
      : { text: `${activeCount} détecté${activeCount > 1 ? "s" : ""}`, tone: "orange" };
  }
  // boolean (par defaut) : neutre - le point signale la presence d'actifs,
  // le texte reste informatif (pas d'alerte de securite implicite).
  return activeCount === 0
    ? { text: "Tout inactif", tone: "grey", dotTone: "grey" }
    : { text: `${activeCount} actif${activeCount > 1 ? "s" : ""}`, tone: "grey", dotTone: "green" };
}

// Resout un ton semantique ('green'/'orange'/'red'/'grey') vers une couleur
// CSS reelle, en tenant compte des overrides success_color/failed_color
// definis sur la categorie ('orange' partage failed_color avec 'red', pour
// rester sur la logique binaire succes/echec demandee).
function resolveSensorTone(tone, cat) {
  if (tone === "green") return colorOr(cat.success_color, SENSOR_TONE_CSS.green);
  if (tone === "red" || tone === "orange")
    return colorOr(cat.failed_color, SENSOR_TONE_CSS[tone]);
  return SENSOR_TONE_CSS.grey;
}

class SensorCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-sensor-card-editor");
  }
  static getStubConfig() {
    return { name: "Sécurité", icon: "mdi:shield-home", categories: [] };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1 + ((this._config && this._config.categories) || []).length;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    const cats = c.categories || [];
    const hass = this._hass;

    const summaries = cats.map((cat) => sensorCategorySummary(hass, cat));

    // Ne re-render que si un element affiche a reellement change (nom,
    // icone, couleurs, ou le texte/couleur resultant d'au moins une categorie).
    const sig = [
      c.name,
      c.icon,
      JSON.stringify(c.icon_color || null),
      JSON.stringify(c.background || null),
      JSON.stringify(c.primary_color || null),
      JSON.stringify(c.secondary_color || null),
      c.row_spacing,
      cats
        .map(
          (cat) =>
            `${cat.name}|${cat.icon}|${cat.type}|${cat.success_color}|${cat.failed_color}|` +
            `${JSON.stringify(cat.tap_action || null)}|${JSON.stringify(cat.hold_action || null)}|` +
            `${JSON.stringify(cat.double_tap_action || null)}`
        )
        .join(";"),
      summaries.map((s) => `${s.text}|${s.tone}|${s.dotTone || ""}`).join(";"),
    ].join("~");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const iconColor = colorOr(c.icon_color, "#e6a34a");
    const badgeRgb = Array.isArray(c.icon_color) ? c.icon_color : [230, 163, 74];
    const badgeBg = `rgba(${badgeRgb[0]}, ${badgeRgb[1]}, ${badgeRgb[2]}, 0.16)`;
    const cardBg = colorOr(c.background, "var(--ha-card-background, var(--card-background-color))");
    const primaryColor = colorOr(c.primary_color, "var(--primary-text-color)");
    const secondaryColor = colorOr(c.secondary_color, "var(--primary-text-color)");
    const rowSpacing = c.row_spacing != null ? c.row_spacing : 12;

    const rowsHtml = cats
      .map((cat, i) => {
        const info = summaries[i];
        const dotTone = info.dotTone || info.tone;
        const dotColor = resolveSensorTone(dotTone, cat);
        const textColor = resolveSensorTone(info.tone, cat);
        const icon = cat.icon || SENSOR_TYPE_DEFAULT_ICON[cat.type] || "mdi:help-circle-outline";
        const border =
          i < cats.length - 1 ? "border-bottom:1px solid var(--divider-color);" : "";
        const hasAction = cat.tap_action || cat.hold_action || cat.double_tap_action;
        return `
          <div class="ac-sensor-row" data-cat-index="${i}" style="display:flex;align-items:center;gap:10px;
                      padding:${rowSpacing}px 2px;${border}${hasAction ? "cursor:pointer;" : ""}">
            <div style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex:0 0 auto;"></div>
            <ha-icon icon="${icon}" style="--mdc-icon-size:18px;color:var(--secondary-text-color);flex:0 0 auto;"></ha-icon>
            <div style="flex:1;min-width:0;font-size:14px;font-weight:600;color:${secondaryColor};
                        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cat.name || "")}</div>
            <div style="flex:0 0 auto;font-family:var(--code-font-family, ui-monospace, monospace);
                        font-size:13px;color:${textColor};white-space:nowrap;">${escapeHtml(info.text)}</div>
          </div>`;
      })
      .join("");

    this.innerHTML = `
      <ha-card style="border-radius:20px;box-shadow:none;
                      background:${cardBg};
                      padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
          <div style="width:40px;height:40px;border-radius:12px;background:${badgeBg};
                      display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
            <ha-icon icon="${c.icon || "mdi:shield-home"}" style="--mdc-icon-size:20px;color:${iconColor};"></ha-icon>
          </div>
          <div style="font-size:17px;font-weight:700;color:${primaryColor};
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.name || "")}</div>
        </div>
        <div>${rowsHtml}</div>
      </ha-card>`;

    this.querySelectorAll(".ac-sensor-row").forEach((el) => {
      const i = parseInt(el.getAttribute("data-cat-index"), 10);
      const cat = cats[i];
      if (!cat) return;
      bindActions(
        el,
        () => this._hass,
        () => cat,
        () => (cat.entities && cat.entities[0]) || undefined
      );
    });

    this._built = true;
  }
}
customElements.define("alex-sensor-card", SensorCard);

class SensorCardEditor extends AlexListEditor {
  static getStubConfig() {
    return SensorCard.getStubConfig();
  }

  _normalize() {
    if (!Array.isArray(this._config.categories)) this._config.categories = [];
  }

  _validPath() {
    const p = this._path || [];
    if (p.length >= 1 && !this._config.categories[p[0]]) return [];
    return p;
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else this._renderCategory(p[0]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    const cfg = this._config;

    this.appendChild(this._sectionTitle("En-tête"));
    this.appendChild(
      this._form(
        [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ],
        { name: cfg.name, icon: cfg.icon },
        { name: "Nom", icon: "Icône" },
        (v) => this._update((c) => Object.assign(c, v))
      )
    );

    this.appendChild(this._sectionTitle("Catégories"));
    const categories = cfg.categories || [];
    categories.forEach((cat, i) => {
      this.appendChild(
        this._row(
          cat.icon || SENSOR_TYPE_DEFAULT_ICON[cat.type] || "mdi:help-circle-outline",
          cat.name || "(sans nom)",
          SENSOR_CATEGORY_TYPES[cat.type] || cat.type,
          () => {
            this._path = [i];
            this._render();
          },
          () => {
            this._update((c) => c.categories.splice(i, 1));
            this._render();
          },
          i > 0 ? () => this._moveItem((c) => c.categories, i, -1) : null,
          i < categories.length - 1
            ? () => this._moveItem((c) => c.categories, i, 1)
            : null
        )
      );
    });

    this.appendChild(
      this._form(
        [
          {
            name: "add_type",
            selector: { select: { mode: "dropdown", options: SENSOR_TYPE_OPTIONS } },
          },
        ],
        {},
        { add_type: "Ajouter une catégorie" },
        (v) => {
          if (!v || !v.add_type) return;
          let idx;
          this._update((c) => {
            c.categories = c.categories || [];
            c.categories.push({
              name: "",
              type: v.add_type,
              icon: SENSOR_TYPE_DEFAULT_ICON[v.add_type],
              entities: [],
            });
            idx = c.categories.length - 1;
          });
          this._path = [idx];
          this._render();
        }
      )
    );

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._mixed(
          [
            { name: "row_spacing", selector: { number: { min: 0, max: 40, step: 1, mode: "box" } } },
            { name: "icon_color", selector: { color_rgb: {} } },
            { name: "background", selector: { color_rgb: {} } },
            { name: "primary_color", selector: { color_rgb: {} } },
            { name: "secondary_color", selector: { color_rgb: {} } },
          ],
          {
            row_spacing: cfg.row_spacing != null ? cfg.row_spacing : 12,
            icon_color: cfg.icon_color,
            background: cfg.background,
            primary_color: cfg.primary_color,
            secondary_color: cfg.secondary_color,
          },
          {
            row_spacing: "Écartement entre les catégories (px)",
            icon_color: "Couleur du badge",
            background: "Fond de la carte",
            primary_color: "Couleur du nom de la carte",
            secondary_color: "Couleur des noms de catégorie",
          },
          (v) => this._update((c) => Object.assign(c, v))
        )
      )
    );
  }

  // Ligne "+ ajouter une entité" : un mini ha-form a un seul champ
  // entity-picker, servant de bouton d'ajout (meme principe que les listes
  // de Light/Weather). `domains` peut etre un tableau (filtre indicatif).
  _addEntityRow(domains, onPick) {
    return this._form(
      [{ name: "entity", selector: { entity: { domain: domains } } }],
      {},
      { entity: "Ajouter une entité" },
      (v) => {
        if (v && v.entity) onPick(v.entity);
      }
    );
  }

  _renderCategory(i) {
    const cat = this._config.categories[i] || {};
    const merge = (v) => this._update((c) => (c.categories[i] = { ...c.categories[i], ...v }));
    const icon = cat.icon || SENSOR_TYPE_DEFAULT_ICON[cat.type] || "mdi:help-circle-outline";

    this.appendChild(
      this._backHeader(cat.name || SENSOR_CATEGORY_TYPES[cat.type] || "Catégorie", () => {
        this._path = [];
        this._render();
      })
    );

    this.appendChild(
      this._form(
        [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          {
            name: "type",
            selector: { select: { mode: "dropdown", options: SENSOR_TYPE_OPTIONS } },
          },
        ],
        { name: cat.name, icon: cat.icon, type: cat.type },
        { name: "Nom", icon: "Icône", type: "Type" },
        merge
      )
    );

    this.appendChild(this._sectionTitle("Entités à surveiller"));
    const entities = cat.entities || [];
    entities.forEach((entityId, j) => {
      const st = this._hass && this._hass.states[entityId];
      const friendly = st && st.attributes && st.attributes.friendly_name;
      this.appendChild(
        this._row(icon, friendly || entityId, friendly ? entityId : "", null, () => {
          this._update((c) => c.categories[i].entities.splice(j, 1));
          this._render();
        })
      );
    });
    this.appendChild(
      this._addEntityRow(SENSOR_TYPE_DOMAINS[cat.type], (entityId) => {
        this._update((c) => {
          c.categories[i].entities = c.categories[i].entities || [];
          c.categories[i].entities.push(entityId);
        });
        this._render();
      })
    );

    if (cat.type === "alarm" && entities.length > 1) {
      const hint = document.createElement("div");
      hint.textContent =
        "⚠ Seule la première entité est prise en compte pour une catégorie Alarme.";
      hint.style.cssText = "font-size:12px;color:var(--warning-color,#f4a000);margin:4px 0;";
      this.appendChild(hint);
    }

    const interactionsForm = this._form(
      [INTERACTIONS_FIELD],
      {
        tap_action: cat.tap_action,
        hold_action: cat.hold_action,
        double_tap_action: cat.double_tap_action,
      },
      ACTION_LABELS,
      merge
    );
    interactionsForm.style.display = "block";
    interactionsForm.style.marginTop = "12px";
    this.appendChild(interactionsForm);

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._mixed(
          [
            { name: "success_color", selector: { color_rgb: {} } },
            { name: "failed_color", selector: { color_rgb: {} } },
          ],
          { success_color: cat.success_color, failed_color: cat.failed_color },
          {
            success_color: "Couleur succès (vert)",
            failed_color: "Couleur échec (rouge/orange)",
          },
          merge
        )
      )
    );
  }
}
customElements.define("alex-sensor-card-editor", SensorCardEditor);

window.customCards.push({
  type: "alex-sensor-card",
  name: "Alex Sensor Card",
  description: "Vue synthétique de capteurs par catégories (ouvrants, verrous, détecteurs…).",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === alex-entity-card ====================================================
 * Liste detaillee d'entites d'un meme type (ouvrant, verrou, detecteur,
 * booleen, alarme) : une ligne par entite, avec son etat individuel, sa
 * zone (si connue) et le temps depuis le dernier changement. Complement de
 * alex-sensor-card, qui affiche un resume agrege par categorie plutot
 * qu'une ligne par entite. Reutilise les memes types/tons/couleurs.
 * ========================================================================= */

// Tons approximatifs (RGB) utilises uniquement pour teinter le fond des
// pastilles d'etat quand aucune couleur success/failed n'est definie par
// l'utilisateur (le texte, lui, passe toujours par resolveSensorTone/CSS).
const ENTITY_TONE_RGB = {
  green: [34, 197, 94],
  orange: [244, 160, 0],
  red: [239, 68, 68],
  grey: [144, 144, 144],
};

// Libelle + ton pour UNE entite (par opposition a sensorCategorySummary qui
// agrege une liste). Reutilise sensorEntityActive/SENSOR_ALARM_STATES.
function sensorEntityStateLabel(type, stateObj) {
  if (!stateObj) return { text: "Indisponible", tone: "grey" };
  const s = stateObj.state;
  if (s == null || s === "unavailable" || s === "unknown") {
    return { text: "Indisponible", tone: "grey" };
  }
  if (type === "alarm") {
    return SENSOR_ALARM_STATES[s] || { text: s, tone: "grey" };
  }
  const active = sensorEntityActive(type, stateObj);
  if (type === "opening") return active ? { text: "Ouvert", tone: "red" } : { text: "Fermé", tone: "green" };
  if (type === "lock") return active ? { text: "Déverrouillé", tone: "red" } : { text: "Verrouillé", tone: "green" };
  if (type === "detector") return active ? { text: "Détecté", tone: "orange" } : { text: "Clair", tone: "green" };
  // boolean
  return active ? { text: "Actif", tone: "green" } : { text: "Inactif", tone: "grey" };
}

// Temps relatif en francais, a partir de last_changed (ISO).
function sensorRelativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "à l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD} j`;
}

// Zone (piece) d'une entite, via les registres entities/devices/areas
// exposes par le frontend HA. Renvoie "" si indisponible.
function sensorEntityArea(hass, entityId) {
  if (!hass) return "";
  const entReg = hass.entities && hass.entities[entityId];
  let areaId = entReg && entReg.area_id;
  if (!areaId && entReg && entReg.device_id) {
    const dev = hass.devices && hass.devices[entReg.device_id];
    areaId = dev && dev.area_id;
  }
  if (!areaId) return "";
  const area = hass.areas && hass.areas[areaId];
  return (area && area.name) || "";
}

class EntityCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-entity-card-editor");
  }
  static getStubConfig() {
    return { name: "Portes", icon: "mdi:door", entity_type: "opening", entities: [] };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1 + ((this._config && this._config.entities) || []).length;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    const entities = c.entities || [];
    const hass = this._hass;
    const type = c.entity_type || "opening";

    const rows = entities.map((entry) => {
      const e = typeof entry === "string" ? { entity: entry } : entry || {};
      const entityId = e.entity;
      const stateObj = hass.states[entityId];
      const info = sensorEntityStateLabel(type, stateObj);
      const name =
        e.name || (stateObj && stateObj.attributes && stateObj.attributes.friendly_name) || entityId;
      const area = sensorEntityArea(hass, entityId);
      const time = stateObj ? sensorRelativeTime(stateObj.last_changed) : "";
      return { entityId, info, name, area, time, icon: e.icon, color: e.color };
    });

    // Ne re-render que si un element affiche a reellement change.
    const sig = [
      c.name,
      c.icon,
      JSON.stringify(c.icon_color || null),
      JSON.stringify(c.background || null),
      JSON.stringify(c.primary_color || null),
      JSON.stringify(c.secondary_color || null),
      JSON.stringify(c.success_color || null),
      JSON.stringify(c.failed_color || null),
      type,
      rows
        .map(
          (r) =>
            `${r.entityId}|${r.name}|${r.icon}|${JSON.stringify(r.color || null)}|${r.area}|${r.info.text}|${r.info.tone}|${r.time}`
        )
        .join(";"),
      c.row_spacing,
    ].join("~");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const iconColor = colorOr(c.icon_color, "#e6a34a");
    const badgeRgb = Array.isArray(c.icon_color) ? c.icon_color : [230, 163, 74];
    const badgeBg = `rgba(${badgeRgb[0]}, ${badgeRgb[1]}, ${badgeRgb[2]}, 0.16)`;
    const cardBg = colorOr(c.background, "var(--ha-card-background, var(--card-background-color))");
    const primaryColor = colorOr(c.primary_color, "var(--primary-text-color)");
    const secondaryColor = colorOr(c.secondary_color, "var(--primary-text-color)");
    const rowIcon = c.entity_icon || SENSOR_TYPE_DEFAULT_ICON[type] || "mdi:help-circle-outline";
    const rowSpacing = c.row_spacing != null ? c.row_spacing : 12;

    const rowsHtml = rows
      .map((r, i) => {
        const textColor = resolveSensorTone(r.info.tone, c);
        const tintRgb = Array.isArray(
          r.info.tone === "green" ? c.success_color : c.failed_color
        )
          ? r.info.tone === "green"
            ? c.success_color
            : c.failed_color
          : ENTITY_TONE_RGB[r.info.tone] || ENTITY_TONE_RGB.grey;
        const pillBg = `rgba(${tintRgb[0]}, ${tintRgb[1]}, ${tintRgb[2]}, 0.14)`;
        const border =
          i < rows.length - 1 ? "border-bottom:1px solid var(--divider-color);" : "";
        const entIcon = r.icon || rowIcon;
        const entIconColor = colorOr(r.color, "var(--secondary-text-color)");
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:${rowSpacing}px 2px;${border}">
            <div style="width:32px;height:32px;border-radius:9px;
                        background:rgba(var(--rgb-primary-text-color,0,0,0),0.06);
                        display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
              <ha-icon icon="${entIcon}" style="--mdc-icon-size:16px;color:${entIconColor};"></ha-icon>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:600;color:${secondaryColor};
                          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.name)}</div>
              ${
                r.area
                  ? `<div style="font-size:12px;color:var(--secondary-text-color);
                                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.area)}</div>`
                  : ""
              }
            </div>
            <div style="flex:0 0 auto;text-align:right;">
              <div style="display:inline-block;padding:2px 10px;border-radius:999px;
                          background:${pillBg};color:${textColor};font-size:12px;font-weight:600;
                          white-space:nowrap;">${escapeHtml(r.info.text)}</div>
              ${
                r.time
                  ? `<div style="font-size:11px;color:var(--secondary-text-color);margin-top:3px;white-space:nowrap;">${escapeHtml(r.time)}</div>`
                  : ""
              }
            </div>
          </div>`;
      })
      .join("");

    this.innerHTML = `
      <ha-card style="border-radius:20px;box-shadow:none;
                      background:${cardBg};
                      padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
          <div style="width:40px;height:40px;border-radius:12px;background:${badgeBg};
                      display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
            <ha-icon icon="${c.icon || "mdi:door"}" style="--mdc-icon-size:20px;color:${iconColor};"></ha-icon>
          </div>
          <div style="flex:1;min-width:0;font-size:17px;font-weight:700;color:${primaryColor};
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.name || "")}</div>
          <div style="flex:0 0 auto;font-size:12px;color:var(--secondary-text-color);">${rows.length} total</div>
        </div>
        <div>${rowsHtml}</div>
      </ha-card>`;
    this._built = true;
  }
}
customElements.define("alex-entity-card", EntityCard);

class EntityCardEditor extends AlexListEditor {
  static getStubConfig() {
    return EntityCard.getStubConfig();
  }

  _normalize() {
    if (!Array.isArray(this._config.entities)) this._config.entities = [];
    // Migration : ancien format (tableau de chaines) -> objets {entity, ...}.
    this._config.entities = this._config.entities.map((e) =>
      typeof e === "string" ? { entity: e } : e
    );
  }

  _validPath() {
    const p = this._path || [];
    if (p.length >= 1 && !this._config.entities[p[0]]) return [];
    return p;
  }

  _addEntityRow(domains, onPick) {
    return this._form(
      [{ name: "entity", selector: { entity: { domain: domains } } }],
      {},
      { entity: "Ajouter une entité" },
      (v) => {
        if (v && v.entity) onPick(v.entity);
      }
    );
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else this._renderEntity(p[0]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    const cfg = this._config;

    this.appendChild(this._sectionTitle("En-tête"));
    this.appendChild(
      this._form(
        [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          {
            name: "entity_type",
            selector: { select: { mode: "dropdown", options: SENSOR_TYPE_OPTIONS } },
          },
        ],
        { name: cfg.name, icon: cfg.icon, entity_type: cfg.entity_type || "opening" },
        { name: "Nom", icon: "Icône", entity_type: "Type" },
        (v) => this._update((c) => Object.assign(c, v))
      )
    );

    this.appendChild(this._sectionTitle("Entités"));
    const entities = cfg.entities || [];
    entities.forEach((e, j) => {
      const st = this._hass && this._hass.states[e.entity];
      const friendly = e.name || (st && st.attributes && st.attributes.friendly_name);
      this.appendChild(
        this._row(
          e.icon || SENSOR_TYPE_DEFAULT_ICON[cfg.entity_type] || "mdi:door",
          friendly || e.entity || "(sans entité)",
          friendly ? e.entity : "",
          () => {
            this._path = [j];
            this._render();
          },
          () => {
            this._update((c) => c.entities.splice(j, 1));
            this._render();
          },
          j > 0 ? () => this._moveItem((c) => c.entities, j, -1) : null,
          j < entities.length - 1 ? () => this._moveItem((c) => c.entities, j, 1) : null
        )
      );
    });
    this.appendChild(
      this._addEntityRow(SENSOR_TYPE_DOMAINS[cfg.entity_type], (entityId) => {
        let idx;
        this._update((c) => {
          c.entities = c.entities || [];
          c.entities.push({ entity: entityId });
          idx = c.entities.length - 1;
        });
        this._path = [idx];
        this._render();
      })
    );

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._mixed(
          [
            { name: "row_spacing", selector: { number: { min: 0, max: 40, step: 1, mode: "box" } } },
            { name: "icon_color", selector: { color_rgb: {} } },
            { name: "background", selector: { color_rgb: {} } },
            { name: "primary_color", selector: { color_rgb: {} } },
            { name: "secondary_color", selector: { color_rgb: {} } },
            { name: "success_color", selector: { color_rgb: {} } },
            { name: "failed_color", selector: { color_rgb: {} } },
          ],
          {
            row_spacing: cfg.row_spacing != null ? cfg.row_spacing : 12,
            icon_color: cfg.icon_color,
            background: cfg.background,
            primary_color: cfg.primary_color,
            secondary_color: cfg.secondary_color,
            success_color: cfg.success_color,
            failed_color: cfg.failed_color,
          },
          {
            row_spacing: "Écartement entre les entités (px)",
            icon_color: "Couleur du badge",
            background: "Fond de la carte",
            primary_color: "Couleur du nom de la carte",
            secondary_color: "Couleur des noms d'entité",
            success_color: "Couleur succès (vert)",
            failed_color: "Couleur échec (rouge/orange)",
          },
          (v) => this._update((c) => Object.assign(c, v))
        )
      )
    );
  }

  _renderEntity(i) {
    const cfg = this._config;
    const e = cfg.entities[i] || {};
    const merge = (v) => this._update((c) => (c.entities[i] = { ...c.entities[i], ...v }));

    this.appendChild(
      this._backHeader(e.name || e.entity || "Entité", () => {
        this._path = [];
        this._render();
      })
    );

    this.appendChild(
      this._mixed(
        [
          { name: "entity", selector: { entity: { domain: SENSOR_TYPE_DOMAINS[cfg.entity_type] } } },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          { name: "color", selector: { color_rgb: {} } },
        ],
        { entity: e.entity, name: e.name, icon: e.icon, color: e.color },
        {
          entity: "Entité",
          name: "Nom (vide = nom convivial)",
          icon: "Icône (vide = icône du type)",
          color: "Couleur de l'icône",
        },
        merge
      )
    );
  }
}
customElements.define("alex-entity-card-editor", EntityCardEditor);

window.customCards.push({
  type: "alex-entity-card",
  name: "Alex Entity Card",
  description: "Liste détaillée d'entités d'un même type (état, zone, dernier changement).",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === alex-toggle-card ====================================================
 * Liste d'entites basculables (input_boolean, switch, automation, light...)
 * avec un vrai interrupteur cliquable par ligne. Complement interactif de
 * alex-entity-card (lecture seule) : meme gabarit visuel (badge, "N/Total"),
 * mais chaque ligne agit reellement sur l'entite au clic.
 * ========================================================================= */

const TOGGLE_DOMAINS = ["input_boolean", "switch", "automation", "light", "fan"];

function toggleEntityOn(stateObj) {
  return !!stateObj && stateObj.state === "on";
}

class ToggleCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-toggle-card-editor");
  }
  static getStubConfig() {
    return { name: "Morning", icon: "mdi:transit-connection-variant", entities: [] };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1 + ((this._config && this._config.entities) || []).length;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    const entities = c.entities || [];
    const hass = this._hass;

    const rows = entities.map((entry) => {
      const e = typeof entry === "string" ? { entity: entry } : entry || {};
      const entityId = e.entity;
      const stateObj = hass.states[entityId];
      const on = toggleEntityOn(stateObj);
      const name =
        e.name || (stateObj && stateObj.attributes && stateObj.attributes.friendly_name) || entityId;
      const time = stateObj ? sensorRelativeTime(stateObj.last_changed) : "";
      return { entityId, on, name, time, icon: e.icon, color: e.color };
    });
    const onCount = rows.filter((r) => r.on).length;

    const sig = [
      c.name,
      c.icon,
      c.entity_icon,
      JSON.stringify(c.icon_color || null),
      JSON.stringify(c.background || null),
      JSON.stringify(c.primary_color || null),
      JSON.stringify(c.secondary_color || null),
      JSON.stringify(c.on_color || null),
      JSON.stringify(c.off_color || null),
      c.inactive_opacity,
      rows
        .map(
          (r) =>
            `${r.entityId}|${r.name}|${r.icon}|${JSON.stringify(r.color || null)}|${r.on}|${r.time}`
        )
        .join(";"),
      c.row_spacing,
    ].join("~");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const iconColor = colorOr(c.icon_color, "#8b7ae6");
    const badgeRgb = Array.isArray(c.icon_color) ? c.icon_color : [139, 122, 230];
    const badgeBg = `rgba(${badgeRgb[0]}, ${badgeRgb[1]}, ${badgeRgb[2]}, 0.16)`;
    const cardBg = colorOr(c.background, "var(--ha-card-background, var(--card-background-color))");
    const primaryColor = colorOr(c.primary_color, "var(--primary-text-color)");
    const secondaryColor = colorOr(c.secondary_color, "var(--primary-text-color)");
    const onColor = colorOr(c.on_color, "#f4a935");
    const offColor = colorOr(c.off_color, "rgba(var(--rgb-primary-text-color,0,0,0),0.18)");
    const rowIcon = c.entity_icon || c.icon || "mdi:toggle-switch-outline";
    const rowSpacing = c.row_spacing != null ? c.row_spacing : 12;
    const inactiveOpacity = (c.inactive_opacity != null ? c.inactive_opacity : 50) / 100;

    const rowsHtml = rows
      .map((r, i) => {
        const border =
          i < rows.length - 1 ? "border-bottom:1px solid var(--divider-color);" : "";
        const track = r.on ? onColor : offColor;
        const thumbLeft = r.on ? "23px" : "3px";
        const entIcon = r.icon || rowIcon;
        const entIconColor = colorOr(r.color, iconColor);
        const dim = r.on ? 1 : inactiveOpacity;
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:${rowSpacing}px 2px;${border}">
            <div style="width:32px;height:32px;border-radius:9px;
                        background:rgba(var(--rgb-primary-text-color,0,0,0),0.06);
                        display:flex;align-items:center;justify-content:center;flex:0 0 auto;
                        opacity:${dim};transition:opacity .15s;">
              <ha-icon icon="${entIcon}" style="--mdc-icon-size:16px;color:${entIconColor};"></ha-icon>
            </div>
            <div style="flex:1;min-width:0;opacity:${dim};transition:opacity .15s;">
              <div style="font-size:14px;font-weight:600;color:${secondaryColor};
                          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.name)}</div>
              ${
                r.time
                  ? `<div style="font-size:12px;color:var(--secondary-text-color);
                                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.time)}</div>`
                  : ""
              }
            </div>
            <div class="ac-toggle" data-entity="${escapeHtml(r.entityId)}"
                style="flex:0 0 auto;width:44px;height:24px;border-radius:12px;background:${track};
                       position:relative;cursor:pointer;transition:background .15s;">
              <div style="width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;
                          top:3px;left:${thumbLeft};transition:left .15s;
                          box-shadow:0 1px 3px rgba(0,0,0,.3);"></div>
            </div>
          </div>`;
      })
      .join("");

    this.innerHTML = `
      <ha-card style="border-radius:20px;box-shadow:none;
                      background:${cardBg};
                      padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
          <div style="width:40px;height:40px;border-radius:12px;background:${badgeBg};
                      display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
            <ha-icon icon="${c.icon || "mdi:transit-connection-variant"}" style="--mdc-icon-size:20px;color:${iconColor};"></ha-icon>
          </div>
          <div style="flex:1;min-width:0;font-size:17px;font-weight:700;color:${primaryColor};
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.name || "")}</div>
          <div style="flex:0 0 auto;font-size:12px;color:var(--secondary-text-color);">${onCount}/${rows.length}</div>
        </div>
        <div>${rowsHtml}</div>
      </ha-card>`;

    this.querySelectorAll(".ac-toggle").forEach((el) => {
      el.addEventListener("click", () => {
        fireAction(this, this._hass, { action: "toggle" }, el.getAttribute("data-entity"));
      });
    });

    this._built = true;
  }
}
customElements.define("alex-toggle-card", ToggleCard);

class ToggleCardEditor extends AlexListEditor {
  static getStubConfig() {
    return ToggleCard.getStubConfig();
  }

  _normalize() {
    if (!Array.isArray(this._config.entities)) this._config.entities = [];
    // Migration : ancien format (tableau de chaines) -> objets {entity, ...}.
    this._config.entities = this._config.entities.map((e) =>
      typeof e === "string" ? { entity: e } : e
    );
  }

  _validPath() {
    const p = this._path || [];
    if (p.length >= 1 && !this._config.entities[p[0]]) return [];
    return p;
  }

  _addEntityRow(domains, onPick) {
    return this._form(
      [{ name: "entity", selector: { entity: { domain: domains } } }],
      {},
      { entity: "Ajouter une entité" },
      (v) => {
        if (v && v.entity) onPick(v.entity);
      }
    );
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else this._renderEntity(p[0]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    const cfg = this._config;

    this.appendChild(this._sectionTitle("En-tête"));
    this.appendChild(
      this._form(
        [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ],
        { name: cfg.name, icon: cfg.icon },
        { name: "Nom", icon: "Icône" },
        (v) => this._update((c) => Object.assign(c, v))
      )
    );

    this.appendChild(this._sectionTitle("Entités"));
    const entities = cfg.entities || [];
    entities.forEach((e, j) => {
      const st = this._hass && this._hass.states[e.entity];
      const friendly = e.name || (st && st.attributes && st.attributes.friendly_name);
      this.appendChild(
        this._row(
          e.icon || cfg.entity_icon || cfg.icon || "mdi:toggle-switch-outline",
          friendly || e.entity || "(sans entité)",
          friendly ? e.entity : "",
          () => {
            this._path = [j];
            this._render();
          },
          () => {
            this._update((c) => c.entities.splice(j, 1));
            this._render();
          },
          j > 0 ? () => this._moveItem((c) => c.entities, j, -1) : null,
          j < entities.length - 1 ? () => this._moveItem((c) => c.entities, j, 1) : null
        )
      );
    });
    this.appendChild(
      this._addEntityRow(TOGGLE_DOMAINS, (entityId) => {
        let idx;
        this._update((c) => {
          c.entities = c.entities || [];
          c.entities.push({ entity: entityId });
          idx = c.entities.length - 1;
        });
        this._path = [idx];
        this._render();
      })
    );

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._mixed(
          [
            { name: "row_spacing", selector: { number: { min: 0, max: 40, step: 1, mode: "box" } } },
            {
              name: "inactive_opacity",
              selector: { number: { min: 0, max: 100, step: 5, mode: "box" } },
            },
            { name: "entity_icon", selector: { icon: {} } },
            { name: "icon_color", selector: { color_rgb: {} } },
            { name: "background", selector: { color_rgb: {} } },
            { name: "primary_color", selector: { color_rgb: {} } },
            { name: "secondary_color", selector: { color_rgb: {} } },
            { name: "on_color", selector: { color_rgb: {} } },
            { name: "off_color", selector: { color_rgb: {} } },
          ],
          {
            row_spacing: cfg.row_spacing != null ? cfg.row_spacing : 12,
            inactive_opacity: cfg.inactive_opacity != null ? cfg.inactive_opacity : 50,
            entity_icon: cfg.entity_icon,
            icon_color: cfg.icon_color,
            background: cfg.background,
            primary_color: cfg.primary_color,
            secondary_color: cfg.secondary_color,
            on_color: cfg.on_color,
            off_color: cfg.off_color,
          },
          {
            row_spacing: "Écartement entre les entités (px)",
            inactive_opacity: "Opacité texte/icône si inactif (%)",
            entity_icon: "Icône des lignes (vide = icône du badge)",
            icon_color: "Couleur du badge",
            background: "Fond de la carte",
            primary_color: "Couleur du nom de la carte",
            secondary_color: "Couleur des noms d'entité",
            on_color: "Couleur interrupteur actif",
            off_color: "Couleur interrupteur inactif",
          },
          (v) => this._update((c) => Object.assign(c, v))
        )
      )
    );
  }

  _renderEntity(i) {
    const cfg = this._config;
    const e = cfg.entities[i] || {};
    const merge = (v) => this._update((c) => (c.entities[i] = { ...c.entities[i], ...v }));

    this.appendChild(
      this._backHeader(e.name || e.entity || "Entité", () => {
        this._path = [];
        this._render();
      })
    );

    this.appendChild(
      this._mixed(
        [
          { name: "entity", selector: { entity: { domain: TOGGLE_DOMAINS } } },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          { name: "color", selector: { color_rgb: {} } },
        ],
        { entity: e.entity, name: e.name, icon: e.icon, color: e.color },
        {
          entity: "Entité",
          name: "Nom (vide = nom convivial)",
          icon: "Icône (vide = icône du badge)",
          color: "Couleur de l'icône",
        },
        merge
      )
    );
  }
}
customElements.define("alex-toggle-card-editor", ToggleCardEditor);

window.customCards.push({
  type: "alex-toggle-card",
  name: "Alex Toggle Card",
  description: "Liste d'entités basculables avec interrupteur cliquable par ligne.",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === alex-clock-card =====================================================
 * Horloge + date, alignables, avec la meme customisation (fond, couleurs
 * primary/secondary) que les autres cartes. Contrairement aux autres cartes
 * du package, elle n'est liee a aucune entite : elle se met a jour toute
 * seule via un timer (demarre/arrete via les callbacks de cycle de vie du
 * custom element), independamment des mises a jour de `hass`.
 * ========================================================================= */

const CLOCK_ALIGN_OPTIONS = [
  { value: "left", label: "Gauche" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Droite" },
];

class ClockCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-clock-card-editor");
  }
  static getStubConfig() {
    return { show_time: true, show_date: true, alignment: "left" };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    if (!this._timer) {
      this._timer = window.setInterval(() => this._render(), 1000);
    }
    this._render();
  }

  disconnectedCallback() {
    if (this._timer) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
  }

  getCardSize() {
    return 1;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const now = new Date();
    const locale = (this._hass && this._hass.locale && this._hass.locale.language) || "fr";

    const showTime = c.show_time !== false;
    const showDate = c.show_date !== false;
    const align = c.alignment || "left";

    const timeStr = showTime
      ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(now)
      : "";
    const dateRaw = showDate
      ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now)
      : "";
    // Majuscule en debut de phrase (Intl renvoie "mardi 16 septembre" en francais).
    const dateStr = dateRaw ? dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1) : "";

    // Ne re-render que si le texte affiche ou une couleur/alignement/taille a
    // change (evite de re-peindre le DOM chaque seconde alors que "HH:MM" est
    // identique).
    const sig = [
      c.background,
      c.primary_color,
      c.secondary_color,
      align,
      c.time_size,
      c.date_size,
      timeStr,
      dateStr,
    ].join("~");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const cardBg = colorOr(c.background, "var(--ha-card-background, var(--card-background-color))");
    const primaryColor = colorOr(c.primary_color, "var(--primary-text-color)");
    const secondaryColor = colorOr(c.secondary_color, "var(--secondary-text-color)");
    const timeSize = c.time_size != null ? c.time_size : 34;
    const dateSize = c.date_size != null ? c.date_size : 14;
    const clockFont =
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable', " +
      "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

    this.innerHTML = `
      <ha-card style="border-radius:20px;box-shadow:none;background:${cardBg};padding:16px 18px;">
        <div style="text-align:${align};font-family:${clockFont};">
          ${
            timeStr
              ? `<div style="font-size:${timeSize}px;font-weight:300;line-height:1.1;letter-spacing:.5px;color:${primaryColor};">${escapeHtml(timeStr)}</div>`
              : ""
          }
          ${
            dateStr
              ? `<div style="font-size:${dateSize}px;font-weight:400;margin-top:${timeStr ? "4px" : "0"};color:${secondaryColor};">${escapeHtml(dateStr)}</div>`
              : ""
          }
        </div>
      </ha-card>`;
    this._built = true;
  }
}
customElements.define("alex-clock-card", ClockCard);

class ClockCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "show_time", selector: { boolean: {} } },
      { name: "show_date", selector: { boolean: {} } },
      {
        name: "alignment",
        selector: { select: { mode: "dropdown", options: CLOCK_ALIGN_OPTIONS } },
      },
      {
        name: "time_size",
        selector: { number: { min: 10, max: 120, step: 1, mode: "box", unit_of_measurement: "px" } },
      },
      {
        name: "date_size",
        selector: { number: { min: 8, max: 60, step: 1, mode: "box", unit_of_measurement: "px" } },
      },
      {
        name: "customisation",
        type: "expandable",
        flatten: true,
        title: "Customisation",
        icon: "mdi:palette",
        schema: [
          { name: "background", selector: { color_rgb: {} } },
          { name: "primary_color", selector: { color_rgb: {} } },
          { name: "secondary_color", selector: { color_rgb: {} } },
        ],
      },
    ];
    this._labels = {
      show_time: "Afficher l'heure",
      show_date: "Afficher la date",
      alignment: "Alignement",
      time_size: "Taille de l'heure",
      date_size: "Taille de la date",
      background: "Fond de la carte",
      primary_color: "Couleur de l'heure",
      secondary_color: "Couleur de la date",
    };
  }
}
customElements.define("alex-clock-card-editor", ClockCardEditor);

window.customCards.push({
  type: "alex-clock-card",
  name: "Alex Clock Card",
  description: "Horloge et date, alignables, avec la personnalisation du package.",
  preview: true,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === alex-media-player-card ==============================================
 * Carte de controle media (pochette, titre/artiste, lecture, volume), avec
 * plusieurs media_player configurables : si plusieurs sont actuellement
 * actifs (playing/paused/buffering), des onglets apparaissent pour basculer
 * entre eux. Rendu "maison" (comme Toggle/Sensor/Entity Card), controles via
 * hass.callService direct.
 * ========================================================================= */

const MEDIA_ACTIVE_STATES = ["playing", "paused", "buffering"];

function mediaVolumeIcon(muted, level) {
  if (muted || level === 0) return "mdi:volume-mute";
  if (level < 0.5) return "mdi:volume-medium";
  return "mdi:volume-high";
}

class MediaPlayerCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-media-player-card-editor");
  }
  static getStubConfig() {
    return { entities: [], now_playing_label: "À l'écoute" };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 3;
  }

  _pickSelected(hass, configured, active) {
    let selected = this._selectedEntity;
    if (!selected || !configured.includes(selected) || (active.length && !active.includes(selected))) {
      selected = active[0] || configured[0] || null;
    }
    this._selectedEntity = selected;
    return selected;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    const hass = this._hass;
    // Normalise : ancien format (tableau de chaines) -> objets {entity, name}.
    const configuredEntries = (c.entities || []).map((e) => (typeof e === "string" ? { entity: e } : e));
    const configuredIds = configuredEntries.map((e) => e.entity);

    const active = configuredIds.filter((e) => {
      const st = hass.states[e];
      return st && MEDIA_ACTIVE_STATES.includes(st.state);
    });
    const selected = this._pickSelected(hass, configuredIds, active);
    const stateObj = selected ? hass.states[selected] : null;
    const attrs = (stateObj && stateObj.attributes) || {};

    const title = attrs.media_title || "Aucune lecture en cours";
    const artist = attrs.media_artist || "";
    const picture = attrs.entity_picture || "";
    let isPlaying = stateObj && stateObj.state === "playing";
    // Affichage optimiste : certaines integrations (ex. Alexa Media Player)
    // ne remontent l'etat reel que par sondage, avec plusieurs dizaines de
    // secondes de retard. On force l'icone au clic (voir plus bas) et on ne
    // laisse l'etat reel reprendre la main que s'il confirme l'optimisme, ou
    // apres expiration d'un delai de securite.
    if (this._optimistic && this._optimistic.entity === selected) {
      if (Date.now() - this._optimistic.ts < 8000) {
        isPlaying = this._optimistic.playing;
      } else {
        this._optimistic = null;
      }
    }
    const muted = !!attrs.is_volume_muted;
    const volume = attrs.volume_level != null ? attrs.volume_level : 1;
    const hasVolume = attrs.volume_level != null;
    const showTabs = active.length > 1;

    const sig = [
      JSON.stringify(c.top_background || null),
      JSON.stringify(c.bottom_background || null),
      JSON.stringify(c.primary_color || null),
      JSON.stringify(c.secondary_color || null),
      JSON.stringify(c.accent_color || null),
      c.now_playing_label,
      configuredEntries.map((e) => `${e.entity}|${e.name || ""}`).join(";"),
      selected,
      title,
      artist,
      picture,
      isPlaying,
      muted,
      volume,
      active.join(","),
    ].join("~");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const topBg = colorOr(
      c.top_background,
      colorOr(c.background, "var(--ha-card-background, var(--card-background-color))")
    );
    const bottomBgOverride = colorOr(c.bottom_background, null);
    const bottomBg = bottomBgOverride || "rgba(var(--rgb-primary-text-color,0,0,0),0.05)";
    const primaryColor = colorOr(c.primary_color, "var(--primary-text-color)");
    const secondaryColor = colorOr(c.secondary_color, "var(--secondary-text-color)");
    const accentColor = colorOr(c.accent_color, "#ffffff");
    const label = c.now_playing_label != null ? c.now_playing_label : "À l'écoute";

    const artHtml = picture
      ? `<div style="width:72px;height:72px;border-radius:16px;background-image:url('${escapeHtml(picture)}');
                     background-size:cover;background-position:center;flex:0 0 auto;"></div>`
      : `<div style="width:72px;height:72px;border-radius:16px;
                     background:rgba(var(--rgb-primary-text-color,0,0,0),0.08);
                     display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
           <ha-icon icon="mdi:music" style="--mdc-icon-size:30px;color:${secondaryColor};"></ha-icon>
         </div>`;

    const nameFor = (entityId) => {
      const entry = configuredEntries.find((e) => e.entity === entityId);
      if (entry && entry.name) return entry.name;
      const st = hass.states[entityId];
      return (st && st.attributes && st.attributes.friendly_name) || entityId;
    };

    const tabsHtml = showTabs
      ? `<div class="ac-mp-tabs" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px;">
          ${active
            .map((e) => {
              const isSel = e === selected;
              const bg = isSel ? accentColor : "rgba(var(--rgb-primary-text-color,0,0,0),0.10)";
              const col = isSel ? "#000" : secondaryColor;
              return `
                <div class="ac-mp-tab" data-entity="${escapeHtml(e)}"
                    style="padding:6px 14px;border-radius:999px;background:${bg};cursor:pointer;
                           font-size:12px;font-weight:600;color:${col};white-space:nowrap;
                           max-width:140px;overflow:hidden;text-overflow:ellipsis;">
                  ${escapeHtml(nameFor(e))}
                </div>`;
            })
            .join("")}
        </div>`
      : "";

    this.innerHTML = `
      <ha-card style="border-radius:22px;box-shadow:none;background:${topBg};padding:0;overflow:hidden;">
        <div style="padding:18px 20px 16px;">
          <div style="display:flex;align-items:flex-start;gap:14px;">
            ${artHtml}
            <div style="flex:1;min-width:0;padding-top:2px;">
              <div style="font-size:12px;color:${secondaryColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(label)}</div>
              <div style="font-size:17px;font-weight:700;color:${primaryColor};margin-top:3px;
                          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(title)}</div>
              <div style="font-size:13px;color:${secondaryColor};margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(artist)}</div>
            </div>
            <div class="ac-mp-more" style="flex:0 0 auto;cursor:pointer;padding:4px;">
              <ha-icon icon="mdi:cast" style="--mdc-icon-size:18px;color:${secondaryColor};"></ha-icon>
            </div>
          </div>
        </div>

        <div style="background:${bottomBg};padding:10px 20px 12px;">
          <div style="display:flex;align-items:center;justify-content:center;gap:14px;">
            <div class="ac-mp-prev" style="width:40px;height:40px;border-radius:14px;
                        background:rgba(var(--rgb-primary-text-color,0,0,0),0.10);
                        display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <ha-icon icon="mdi:rewind" style="--mdc-icon-size:20px;color:${primaryColor};"></ha-icon>
            </div>
            <div class="ac-mp-playpause" style="width:40px;height:40px;border-radius:14px;
                        background:rgba(var(--rgb-primary-text-color,0,0,0),0.10);
                        display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <ha-icon icon="${isPlaying ? "mdi:pause" : "mdi:play"}" style="--mdc-icon-size:20px;color:${primaryColor};"></ha-icon>
            </div>
            <div class="ac-mp-next" style="width:40px;height:40px;border-radius:14px;
                        background:rgba(var(--rgb-primary-text-color,0,0,0),0.10);
                        display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <ha-icon icon="mdi:fast-forward" style="--mdc-icon-size:20px;color:${primaryColor};"></ha-icon>
            </div>
          </div>

          ${
            hasVolume
              ? `<div style="display:flex;align-items:center;gap:10px;margin-top:16px;">
                  <div class="ac-mp-mute" style="cursor:pointer;flex:0 0 auto;">
                    <ha-icon icon="${mediaVolumeIcon(muted, volume)}" style="--mdc-icon-size:18px;color:${secondaryColor};"></ha-icon>
                  </div>
                  <input class="ac-mp-volume" type="range" min="0" max="1" step="0.01"
                         value="${muted ? 0 : volume}"
                         style="flex:1;accent-color:${accentColor};height:4px;cursor:pointer;" />
                </div>`
              : ""
          }

          ${tabsHtml}
        </div>
      </ha-card>`;

    const entityId = selected;
    const call = (service, extra) => {
      if (!entityId) return;
      const [domain, svc] = service.split(".");
      hass.callService(domain, svc, { entity_id: entityId, ...extra });
    };

    const prevEl = this.querySelector(".ac-mp-prev");
    if (prevEl) prevEl.addEventListener("click", () => call("media_player.media_previous_track"));
    const nextEl = this.querySelector(".ac-mp-next");
    if (nextEl) nextEl.addEventListener("click", () => call("media_player.media_next_track"));
    const ppEl = this.querySelector(".ac-mp-playpause");
    if (ppEl)
      ppEl.addEventListener("click", () => {
        this._optimistic = { entity: entityId, playing: !isPlaying, ts: Date.now() };
        this._lastSig = null;
        call("media_player.media_play_pause");
        this._render();
        // Filet de securite : si aucune mise a jour de hass ne survient
        // avant l'expiration de la fenetre optimiste, on force quand meme
        // un nouveau rendu pour laisser l'etat reel reprendre la main.
        window.setTimeout(() => {
          this._lastSig = null;
          this._render();
        }, 8100);
      });
    const moreEl = this.querySelector(".ac-mp-more");
    if (moreEl) moreEl.addEventListener("click", () => fireAction(this, hass, { action: "more-info" }, entityId));
    const muteEl = this.querySelector(".ac-mp-mute");
    if (muteEl)
      muteEl.addEventListener("click", () => call("media_player.volume_mute", { is_volume_muted: !muted }));
    const volEl = this.querySelector(".ac-mp-volume");
    if (volEl)
      volEl.addEventListener("change", (ev) =>
        call("media_player.volume_set", { volume_level: parseFloat(ev.target.value) })
      );
    this.querySelectorAll(".ac-mp-tab").forEach((el) => {
      el.addEventListener("click", () => {
        this._selectedEntity = el.getAttribute("data-entity");
        this._lastSig = null;
        this._render();
      });
    });

    this._built = true;
  }
}
customElements.define("alex-media-player-card", MediaPlayerCard);

class MediaPlayerCardEditor extends AlexListEditor {
  static getStubConfig() {
    return MediaPlayerCard.getStubConfig();
  }

  _normalize() {
    if (!Array.isArray(this._config.entities)) this._config.entities = [];
    // Migration : ancien format (tableau de chaines) -> objets {entity, name}.
    this._config.entities = this._config.entities.map((e) =>
      typeof e === "string" ? { entity: e } : e
    );
  }

  _validPath() {
    const p = this._path || [];
    if (p.length >= 1 && !this._config.entities[p[0]]) return [];
    return p;
  }

  _addEntityRow(onPick) {
    return this._form(
      [{ name: "entity", selector: { entity: { domain: "media_player" } } }],
      {},
      { entity: "Ajouter un lecteur" },
      (v) => {
        if (v && v.entity) onPick(v.entity);
      }
    );
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else this._renderEntity(p[0]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    const cfg = this._config;

    this.appendChild(this._sectionTitle("Options"));
    this.appendChild(
      this._form(
        [{ name: "now_playing_label", selector: { text: {} } }],
        { now_playing_label: cfg.now_playing_label != null ? cfg.now_playing_label : "À l'écoute" },
        { now_playing_label: "Libellé « en cours de lecture »" },
        (v) => this._update((c) => Object.assign(c, v))
      )
    );

    this.appendChild(this._sectionTitle("Lecteurs"));
    const entities = cfg.entities || [];
    entities.forEach((e, j) => {
      const st = this._hass && this._hass.states[e.entity];
      const friendly = e.name || (st && st.attributes && st.attributes.friendly_name);
      this.appendChild(
        this._row(
          (st && st.attributes && st.attributes.icon) || "mdi:speaker",
          friendly || e.entity || "(sans entité)",
          friendly ? e.entity : "",
          () => {
            this._path = [j];
            this._render();
          },
          () => {
            this._update((c) => c.entities.splice(j, 1));
            this._render();
          }
        )
      );
    });
    this.appendChild(
      this._addEntityRow((entityId) => {
        let idx;
        this._update((c) => {
          c.entities = c.entities || [];
          c.entities.push({ entity: entityId });
          idx = c.entities.length - 1;
        });
        this._path = [idx];
        this._render();
      })
    );

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._mixed(
          [
            { name: "top_background", selector: { color_rgb: {} } },
            { name: "bottom_background", selector: { color_rgb: {} } },
            { name: "primary_color", selector: { color_rgb: {} } },
            { name: "secondary_color", selector: { color_rgb: {} } },
            { name: "accent_color", selector: { color_rgb: {} } },
          ],
          {
            top_background: cfg.top_background,
            bottom_background: cfg.bottom_background,
            primary_color: cfg.primary_color,
            secondary_color: cfg.secondary_color,
            accent_color: cfg.accent_color,
          },
          {
            top_background: "Fond section infos (haut)",
            bottom_background: "Fond section contrôles (bas, vide = teinte auto)",
            primary_color: "Couleur du titre",
            secondary_color: "Couleur de l'artiste / du libellé",
            accent_color: "Couleur du bouton lecture / volume / onglet actif",
          },
          (v) => this._update((c) => Object.assign(c, v))
        )
      )
    );
  }

  _renderEntity(i) {
    const cfg = this._config;
    const e = cfg.entities[i] || {};
    const merge = (v) => this._update((c) => (c.entities[i] = { ...c.entities[i], ...v }));

    this.appendChild(
      this._backHeader(e.name || e.entity || "Lecteur", () => {
        this._path = [];
        this._render();
      })
    );

    this.appendChild(
      this._form(
        [
          { name: "entity", selector: { entity: { domain: "media_player" } } },
          { name: "name", selector: { text: {} } },
        ],
        { entity: e.entity, name: e.name },
        { entity: "Entité", name: "Nom du média (vide = nom convivial)" },
        merge
      )
    );
  }
}
customElements.define("alex-media-player-card-editor", MediaPlayerCardEditor);

window.customCards.push({
  type: "alex-media-player-card",
  name: "Alex Media Player Card",
  description: "Contrôle média (pochette, lecture, volume) avec bascule entre lecteurs actifs.",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === alex-server-card ====================================================
 * Liste de serveurs/VM avec statut en ligne/hors ligne et bouton power
 * (bascule l'entite associee). Rendu "maison", meme famille que
 * Sensor/Entity/Toggle Card. Pas de badge d'en-tete (fidele au gabarit
 * button-card fourni : juste un titre + compteur "N/Total en ligne").
 * ========================================================================= */

class ServerCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-server-card-editor");
  }
  static getStubConfig() {
    return { name: "Serveurs", servers: [] };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1 + ((this._config && this._config.servers) || []).length;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    const hass = this._hass;
    const servers = c.servers || [];

    const rows = servers.map((s) => {
      const st = s.entity ? hass.states[s.entity] : null;
      const online = !!st && st.state === "on";
      return { ...s, online, available: !!st };
    });
    const onlineCount = rows.filter((r) => r.online).length;

    const sig = [
      c.name,
      JSON.stringify(c.background || null),
      JSON.stringify(c.primary_color || null),
      JSON.stringify(c.secondary_color || null),
      JSON.stringify(c.online_color || null),
      JSON.stringify(c.offline_color || null),
      rows.map((r) => `${r.entity}|${r.name}|${r.secondary}|${r.icon}|${r.online}`).join(";"),
    ].join("~");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const cardBg = colorOr(c.background, "var(--ha-card-background, var(--card-background-color))");
    const primaryColor = colorOr(c.primary_color, "var(--primary-text-color)");
    const secondaryColor = colorOr(c.secondary_color, "var(--secondary-text-color)");
    const onlineColor = colorOr(c.online_color, "#72c58a");
    const offlineColor = colorOr(c.offline_color, "var(--secondary-text-color)");
    const title = c.name != null ? c.name : "Serveurs";

    const rowsHtml = rows
      .map((r) => {
        const statusColor = r.online ? onlineColor : offlineColor;
        const statusText = r.online ? "En ligne" : "Arrêté";
        const powerIcon = r.online ? "mdi:power" : "mdi:play";
        return `
          <div class="ac-srv-row" style="display:grid;grid-template-columns:42px minmax(0,1fr) auto 42px;
                      align-items:center;width:100%;min-height:62px;padding:0 10px;box-sizing:border-box;
                      border-radius:15px;background:rgba(var(--rgb-primary-text-color,0,0,0),0.045);">
            <div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;
                        justify-content:center;background:rgba(var(--rgb-primary-text-color,0,0,0),0.07);">
              <ha-icon icon="${r.icon || "mdi:server"}" style="--mdc-icon-size:21px;color:${secondaryColor};"></ha-icon>
            </div>
            <div style="display:flex;flex-direction:column;justify-content:center;min-width:0;padding:0 10px;">
              <div style="font-size:15px;font-weight:500;color:${primaryColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.name || "")}</div>
              <div style="font-size:11px;margin-top:3px;color:${secondaryColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.secondary || "")}</div>
            </div>
            <div style="display:flex;align-items:center;gap:5px;margin-right:12px;font-size:11px;white-space:nowrap;color:${statusColor};">
              <span style="width:7px;height:7px;border-radius:50%;background:${statusColor};box-shadow:${r.online ? `0 0 7px ${statusColor}` : "none"};"></span>
              ${statusText}
            </div>
            <div class="ac-srv-power" data-entity="${escapeHtml(r.entity || "")}"
                style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;
                       background:rgba(var(--rgb-primary-text-color,0,0,0),0.06);cursor:pointer;">
              <ha-icon icon="${powerIcon}" style="--mdc-icon-size:19px;color:${statusColor};"></ha-icon>
            </div>
          </div>`;
      })
      .join("");

    this.innerHTML = `
      <ha-card style="border-radius:22px;box-shadow:none;background:${cardBg};padding:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 4px 8px 4px;">
          <div style="font-size:14px;font-weight:500;color:${primaryColor};">${escapeHtml(title)}</div>
          <div style="font-size:11px;color:${secondaryColor};">${onlineCount}/${rows.length} en ligne</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">${rowsHtml}</div>
      </ha-card>`;

    this.querySelectorAll(".ac-srv-power").forEach((el) => {
      const entityId = el.getAttribute("data-entity");
      if (!entityId) return;
      el.addEventListener("click", () => {
        hass.callService("homeassistant", "toggle", { entity_id: entityId });
      });
    });

    this._built = true;
  }
}
customElements.define("alex-server-card", ServerCard);

class ServerCardEditor extends AlexListEditor {
  static getStubConfig() {
    return ServerCard.getStubConfig();
  }

  _normalize() {
    if (!Array.isArray(this._config.servers)) this._config.servers = [];
  }

  _validPath() {
    const p = this._path || [];
    if (p.length >= 1 && !this._config.servers[p[0]]) return [];
    return p;
  }

  _addServerRow(onPick) {
    return this._form(
      [{ name: "entity", selector: { entity: { domain: ["switch", "input_boolean"] } } }],
      {},
      { entity: "Ajouter un serveur" },
      (v) => {
        if (v && v.entity) onPick(v.entity);
      }
    );
  }

  _render() {
    this._forms = [];
    this._selectors = [];
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else this._renderServer(p[0]);
    if (this._hass) {
      this._forms.forEach((f) => (f.hass = this._hass));
      this._selectors.forEach((s) => (s.hass = this._hass));
    }
  }

  _renderRoot() {
    const cfg = this._config;

    this.appendChild(this._sectionTitle("En-tête"));
    this.appendChild(
      this._form(
        [{ name: "name", selector: { text: {} } }],
        { name: cfg.name != null ? cfg.name : "Serveurs" },
        { name: "Titre" },
        (v) => this._update((c) => Object.assign(c, v))
      )
    );

    this.appendChild(this._sectionTitle("Serveurs"));
    const servers = cfg.servers || [];
    servers.forEach((s, j) => {
      this.appendChild(
        this._row(
          s.icon || "mdi:server",
          s.name || s.entity || "(sans nom)",
          s.secondary || s.entity || "",
          () => {
            this._path = [j];
            this._render();
          },
          () => {
            this._update((c) => c.servers.splice(j, 1));
            this._render();
          },
          j > 0 ? () => this._moveItem((c) => c.servers, j, -1) : null,
          j < servers.length - 1 ? () => this._moveItem((c) => c.servers, j, 1) : null
        )
      );
    });
    this.appendChild(
      this._addServerRow((entityId) => {
        let idx;
        this._update((c) => {
          c.servers = c.servers || [];
          c.servers.push({ entity: entityId, icon: "mdi:server" });
          idx = c.servers.length - 1;
        });
        this._path = [idx];
        this._render();
      })
    );

    this.appendChild(
      this._panel(
        "Customisation",
        "mdi:palette",
        this._mixed(
          [
            { name: "background", selector: { color_rgb: {} } },
            { name: "primary_color", selector: { color_rgb: {} } },
            { name: "secondary_color", selector: { color_rgb: {} } },
            { name: "online_color", selector: { color_rgb: {} } },
            { name: "offline_color", selector: { color_rgb: {} } },
          ],
          {
            background: cfg.background,
            primary_color: cfg.primary_color,
            secondary_color: cfg.secondary_color,
            online_color: cfg.online_color,
            offline_color: cfg.offline_color,
          },
          {
            background: "Fond de la carte",
            primary_color: "Couleur des noms de serveur / titre",
            secondary_color: "Couleur des adresses / compteur",
            online_color: "Couleur « en ligne » (statut + bouton)",
            offline_color: "Couleur « hors ligne » (statut + bouton)",
          },
          (v) => this._update((c) => Object.assign(c, v))
        )
      )
    );
  }

  _renderServer(i) {
    const cfg = this._config;
    const s = cfg.servers[i] || {};
    const merge = (v) => this._update((c) => (c.servers[i] = { ...c.servers[i], ...v }));

    this.appendChild(
      this._backHeader(s.name || s.entity || "Serveur", () => {
        this._path = [];
        this._render();
      })
    );

    this.appendChild(
      this._form(
        [
          { name: "name", selector: { text: {} } },
          { name: "secondary", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          { name: "entity", selector: { entity: { domain: ["switch", "input_boolean"] } } },
        ],
        { name: s.name, secondary: s.secondary, icon: s.icon, entity: s.entity },
        {
          name: "Nom",
          secondary: "Sous-titre (ex. adresse IP)",
          icon: "Icône",
          entity: "Entité (marche/arrêt)",
        },
        merge
      )
    );
  }
}
customElements.define("alex-server-card-editor", ServerCardEditor);

window.customCards.push({
  type: "alex-server-card",
  name: "Alex Server Card",
  description: "Liste de serveurs/VM avec statut en ligne et bouton power.",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});


/* =========================================================================
 * === alex-gradient-card ==================================================
 * Pilotage des degrades par segment des lampes/bandeaux "Gradient" Philips
 * Hue via Zigbee2MQTT. Z2M expose `gradient` en ECRITURE SEULE (confirme
 * dans sa doc officielle : "It's not possible to read (/get) this value.")
 * — pas de service natif HA pour ca, donc appel direct a mqtt.publish sur
 * le topic zigbee2mqtt/<nom_convivial>/set avec {"gradient": [...]}.
 * Consequence assumee : les pickers ne refletent jamais l'etat reel du
 * bandeau au chargement (impossible techniquement), ils partent neutres.
 * ========================================================================= */

// Conversion hex -> objet {r,g,b} pour le format Aqara (segment_colors),
// distinct du simple tableau de hex utilise par le format Hue (gradient).
function hexToRgbObj(hex) {
  const h = (hex || "#ffffff").replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

class GradientCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alex-gradient-card-editor");
  }
  static getStubConfig() {
    return {
      entity: "",
      device_type: "hue",
      segments: 5,
      name: "Bandeau",
      icon: "mdi:led-strip-variant",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = config;
    this._built = false;
    this._lastSig = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 2;
  }

  // Nom convivial Z2M utilise dans le topic MQTT : deduit de l'entite si non
  // renseigne explicitement (souvent identique, mais pas garanti si
  // l'entite HA a ete renommee independamment du peripherique Z2M).
  _friendlyName() {
    const c = this._config;
    if (c.friendly_name) return c.friendly_name;
    if (c.entity) return c.entity.split(".")[1] || "";
    return "";
  }

  // Entite number.*_length deduite du nom de l'entite lumiere elle-meme
  // (convention confirmee : light.chambre_bled -> number.chambre_bled_length,
  // meme "object_id" avec juste le domaine et le suffixe qui changent).
  // N'est qu'un point de depart : `length_entity` explicite prend toujours
  // le pas si l'utilisateur l'a renseignee (ex. entite renommee cote HA).
  _defaultLengthEntity() {
    const c = this._config;
    if (!c.entity) return null;
    const objectId = c.entity.split(".")[1];
    return objectId ? `number.${objectId}_length` : null;
  }

  // Nombre de segments effectif. Pour l'Aqara T1, deduit automatiquement de
  // l'entite longueur (number.*_length — deduite par convention du nom de
  // l'entite lumiere, ou fournie explicitement via `length_entity` si le
  // nommage ne correspond pas) : 5 segments de 20cm par metre de bandeau.
  // Z2M expose cette propriete comme une entite SEPAREE de la lumiere,
  // jamais comme simple attribut de l'entite light. Pour Hue (ou si aucune
  // entite longueur n'est resolvable/lisible), repli sur `segments` regle
  // manuellement.
  _effectiveSegments() {
    const c = this._config;
    if (c.device_type === "aqara" && this._hass) {
      const lengthEntityId = c.length_entity || this._defaultLengthEntity();
      const st = lengthEntityId ? this._hass.states[lengthEntityId] : null;
      if (st && st.state != null && !Number.isNaN(Number(st.state))) {
        const n = Math.round(Number(st.state) * 5);
        if (n > 0) return Math.min(50, n);
      }
    }
    return Math.max(2, Math.min(50, c.segments || 5));
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;
    const hass = this._hass;
    const entity = c.entity;
    const stateObj = entity ? hass.states[entity] : null;
    const isOn = !!stateObj && stateObj.state === "on";
    const segmentsCount = this._effectiveSegments();
    const friendlyName = this._friendlyName();

    // Etat local des pickers (jamais lu depuis Z2M, voir note en tete de
    // fichier) : reinitialise seulement si le nombre de segments change,
    // conserve sinon (pas de rebuild sur chaque mise a jour de hass tant
    // que la config elle-meme n'a pas change — voir sig plus bas).
    if (!this._segmentColors || this._segmentColors.length !== segmentsCount) {
      const prev = this._segmentColors || [];
      this._segmentColors = Array.from({ length: segmentsCount }, (_, i) => prev[i] || "#ffffff");
    }

    const sig = [
      c.name,
      c.icon,
      c.device_type,
      c.length_entity,
      JSON.stringify(c.icon_color || null),
      JSON.stringify(c.background || null),
      JSON.stringify(c.primary_color || null),
      JSON.stringify(c.secondary_color || null),
      JSON.stringify(c.accent_color || null),
      segmentsCount,
      isOn,
      entity,
      friendlyName,
    ].join("~");
    if (this._built && sig === this._lastSig) return;
    this._lastSig = sig;

    const cardBg = colorOr(c.background, "var(--ha-card-background, var(--card-background-color))");
    const primaryColor = colorOr(c.primary_color, "var(--primary-text-color)");
    const secondaryColor = colorOr(c.secondary_color, "var(--secondary-text-color)");
    const accentColor = colorOr(c.accent_color, "#8b7ae6");
    const iconColor = colorOr(c.icon_color, accentColor);
    const badgeRgb = Array.isArray(c.icon_color) ? c.icon_color : [139, 122, 230];
    const badgeBg = `rgba(${badgeRgb[0]}, ${badgeRgb[1]}, ${badgeRgb[2]}, 0.16)`;

    // Repartition equilibree sur plusieurs lignes (plutot qu'un flex-wrap
    // qui remplit une ligne au maximum et laisse un reliquat difforme sur
    // la suivante, ex. 11 puis 1 pour 12 segments) : calcule le nombre de
    // lignes necessaires selon un maximum par ligne, puis redistribue le
    // total de facon egale entre ces lignes.
    const maxPerRow = 6;
    const rowsNeeded = Math.max(1, Math.ceil(segmentsCount / maxPerRow));
    const perRow = Math.ceil(segmentsCount / rowsNeeded);
    const segmentRows = [];
    for (let r = 0; r < rowsNeeded; r++) {
      const start = r * perRow;
      const end = Math.min(start + perRow, segmentsCount);
      if (start >= end) break;
      const rowItems = this._segmentColors
        .slice(start, end)
        .map((color, localIdx) => {
          const i = start + localIdx;
          return `
            <input type="color" class="ac-gradient-seg" data-index="${i}" value="${color}"
              style="flex:1;min-width:0;height:44px;border:none;border-radius:10px;padding:0;
                     cursor:pointer;background:${color};-webkit-appearance:none;appearance:none;" />`;
        })
        .join("");
      segmentRows.push(`<div style="display:flex;gap:6px;">${rowItems}</div>`);
    }
    const segmentsHtml = `<div style="display:flex;flex-direction:column;gap:6px;">${segmentRows.join("")}</div>`;

    const missingConfig = !entity || !friendlyName;

    this.innerHTML = `
      <ha-card style="border-radius:20px;box-shadow:none;background:${cardBg};padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div style="width:40px;height:40px;border-radius:12px;background:${badgeBg};
                      display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
            <ha-icon icon="${c.icon || "mdi:led-strip-variant"}" style="--mdc-icon-size:20px;color:${iconColor};"></ha-icon>
          </div>
          <div style="flex:1;min-width:0;font-size:17px;font-weight:700;color:${primaryColor};
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.name || "")}</div>
          ${
            entity
              ? `<div class="ac-gradient-toggle" style="flex:0 0 auto;width:44px;height:24px;border-radius:12px;
                      background:${isOn ? accentColor : "rgba(var(--rgb-primary-text-color,0,0,0),0.18)"};
                      position:relative;cursor:pointer;transition:background .15s;">
                  <div style="width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;
                              top:3px;left:${isOn ? "23px" : "3px"};transition:left .15s;
                              box-shadow:0 1px 3px rgba(0,0,0,.3);"></div>
                </div>`
              : ""
          }
        </div>

        ${
          missingConfig
            ? `<div style="font-size:13px;color:${secondaryColor};padding:8px 0;">
                Configure l'entité de la lumière (et le nom convivial Z2M si besoin) dans les réglages de la carte.
              </div>`
            : `<div style="margin-bottom:14px;">
                ${segmentsHtml}
              </div>
              <div class="ac-gradient-apply" style="text-align:center;padding:10px;border-radius:12px;
                          background:${accentColor};color:#000;font-size:14px;font-weight:600;cursor:pointer;">
                Appliquer le dégradé
              </div>`
        }
      </ha-card>`;

    this.querySelectorAll(".ac-gradient-seg").forEach((el) => {
      el.addEventListener("input", (ev) => {
        const idx = parseInt(el.getAttribute("data-index"), 10);
        this._segmentColors[idx] = ev.target.value;
        el.style.background = ev.target.value;
      });
    });

    const toggleEl = this.querySelector(".ac-gradient-toggle");
    if (toggleEl && entity) {
      toggleEl.addEventListener("click", () => {
        hass.callService("homeassistant", "toggle", { entity_id: entity });
      });
    }

    const applyEl = this.querySelector(".ac-gradient-apply");
    if (applyEl) {
      applyEl.addEventListener("click", () => {
        if (!friendlyName) return;
        const payload =
          c.device_type === "aqara"
            ? {
                segment_colors: this._segmentColors.map((hex, i) => ({
                  segment: i + 1,
                  color: hexToRgbObj(hex),
                })),
              }
            : { gradient: this._segmentColors };
        hass.callService("mqtt", "publish", {
          topic: `zigbee2mqtt/${friendlyName}/set`,
          payload: JSON.stringify(payload),
        });
      });
    }

    this._built = true;
  }
}
customElements.define("alex-gradient-card", GradientCard);

class GradientCardEditor extends AlexFormEditor {
  static getStubConfig() {
    return GradientCard.getStubConfig();
  }

  constructor() {
    super();
    this._schema = [
      { name: "entity", selector: { entity: { domain: "light" } } },
      {
        name: "device_type",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "hue", label: "Philips Hue Gradient" },
              { value: "aqara", label: "Aqara LED Strip T1 (LGYCDD01LM)" },
            ],
          },
        },
      },
      { name: "friendly_name", selector: { text: {} } },
      {
        name: "segments",
        selector: { number: { min: 2, max: 50, step: 1, mode: "box" } },
      },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      {
        name: "customisation",
        type: "expandable",
        flatten: true,
        title: "Customisation",
        icon: "mdi:palette",
        schema: [
          { name: "icon_color", selector: { color_rgb: {} } },
          { name: "background", selector: { color_rgb: {} } },
          { name: "primary_color", selector: { color_rgb: {} } },
          { name: "secondary_color", selector: { color_rgb: {} } },
          { name: "accent_color", selector: { color_rgb: {} } },
        ],
      },
    ];
    this._labels = {
      entity: "Entité de la lumière",
      device_type: "Type d'appareil",
      friendly_name: "Nom convivial Z2M (vide = déduit de l'entité)",
      segments: "Nombre de segments (Aqara : ignoré si longueur détectée)",
      name: "Nom",
      icon: "Icône",
      icon_color: "Couleur du badge",
      background: "Fond de la carte",
      primary_color: "Couleur du nom",
      secondary_color: "Couleur secondaire",
      accent_color: "Couleur du bouton / interrupteur actif",
    };
  }
}
customElements.define("alex-gradient-card-editor", GradientCardEditor);

window.customCards.push({
  type: "alex-gradient-card",
  name: "Alex Gradient Card",
  description: "Réglage des segments de couleur des lampes Gradient Philips Hue via Zigbee2MQTT.",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});


/* =========================================================================
 * === alex-input-color ====================================================
 *
 * Gestion compacte des paramètres lumineux :
 *
 *   - brightness -> input_number 0..254
 *   - color      -> input_text contenant une couleur HEX (#RRGGBB)
 *   - white      -> input_number contenant une température en Kelvin
 *
 * Chaque groupe peut utiliser un, deux ou trois paramètres.
 *
 * Exemple :
 *
 * type: custom:alex-input-color
 * groups:
 *   - name: Matin
 *     icon: mdi:weather-sunset-up
 *     brightness: input_number.matin_light_direct
 *     color: input_text.light_scheduler_color_matin_direct
 *     white: input_number.light_scheduler_white_matin_direct
 *
 * ========================================================================= */

class AlexInputColorCard extends HTMLElement {

  static getConfigElement() {
    return document.createElement("alex-input-color-card-editor");
  }

  static getStubConfig() {
    return {
      groups: [
        {
          name: "Matin",
          icon: "mdi:weather-sunset-up",
          brightness: "",
          color: "",
          white: "",
        },
      ],
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Configuration invalide");
    }

    this._config = config;
    this._built = false;
    this._lastSig = null;
    this._colorPickers = [];
    this._whitePickers = [];
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    const groups = this._config?.groups || [];
    return Math.max(1, groups.length);
  }

  /* -----------------------------------------------------------------------
   * Helpers
   * --------------------------------------------------------------------- */

  _getState(entityId) {
    if (!entityId || !this._hass) return null;
    return this._hass.states[entityId] || null;
  }

  _getNumber(entityId, fallback = 0) {
    const state = this._getState(entityId);

    if (!state) return fallback;

    const value = Number(state.state);

    return Number.isFinite(value) ? value : fallback;
  }

  _getColor(entityId) {
    const state = this._getState(entityId);

    if (!state || !state.state || state.state === "unknown" || state.state === "unavailable") {
      return [255, 255, 255];
    }

    const value = String(state.state).trim();

    /*
     * HEX #RRGGBB
     */

    const match = value.match(/^#?([0-9a-f]{6})$/i);

    if (match) {
      const hex = match[1];

      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
      ];
    }

    /*
     * RGB "255, 120, 50"
     */

    const rgb = value.match(
      /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i
    );

    if (rgb) {
      return [
        Number(rgb[1]),
        Number(rgb[2]),
        Number(rgb[3]),
      ];
    }

    return [255, 255, 255];
  }

  _rgbToHex(rgb) {
    if (!Array.isArray(rgb) || rgb.length < 3) {
      return "#ffffff";
    }

    return (
      "#" +
      rgb
        .slice(0, 3)
        .map((v) =>
          Math.max(0, Math.min(255, Number(v) || 0))
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
        .toUpperCase()
    );
  }

  _setInputText(entityId, value) {
    if (!entityId || !this._hass) return;

    this._hass.callService(
      "input_text",
      "set_value",
      {
        entity_id: entityId,
        value,
      }
    );
  }

  _setInputNumber(entityId, value) {
    if (!entityId || !this._hass) return;

    this._hass.callService(
      "input_number",
      "set_value",
      {
        entity_id: entityId,
        value,
      }
    );
  }

  _createRgbPicker(entityId) {

    const picker = document.createElement("ha-selector");

    picker.selector = {
      color_rgb: {},
    };

    picker.value = this._getColor(entityId);

    if (this._hass) {
      picker.hass = this._hass;
    }

    picker.style.cssText =
      "flex:0 0 auto;" +
      "min-width:42px;" +
      "max-width:120px;";

    picker.addEventListener("value-changed", (ev) => {

      ev.stopPropagation();

      const rgb = ev.detail?.value;

      if (!Array.isArray(rgb) || rgb.length < 3) {
        return;
      }

      picker.value = rgb;

      const hex = this._rgbToHex(rgb);

      this._setInputText(entityId, hex);
    });

    this._colorPickers.push(picker);

    return picker;
  }

  _createWhitePicker(entityId) {

    const value = this._getNumber(entityId, 4000);

    const picker = document.createElement("ha-selector");

    picker.selector = {
      color_temp: {
        unit: "kelvin",
        min: 2000,
        max: 6500,
      },
    };

    picker.value = value;

    if (this._hass) {
      picker.hass = this._hass;
    }

    picker.style.cssText =
      "flex:1 1 auto;" +
      "min-width:90px;" +
      "max-width:180px;";

    picker.addEventListener("value-changed", (ev) => {

      ev.stopPropagation();

      const kelvin = Number(ev.detail?.value);

      if (!Number.isFinite(kelvin)) {
        return;
      }

      picker.value = kelvin;

      this._setInputNumber(entityId, kelvin);
    });

    this._whitePickers.push(picker);

    return picker;
  }

  /* -----------------------------------------------------------------------
   * Row
   * --------------------------------------------------------------------- */

  _renderGroup(group) {

    const row = document.createElement("div");

    row.style.cssText =
      "display:flex;" +
      "align-items:center;" +
      "gap:8px;" +
      "min-height:42px;" +
      "padding:3px 0;";

    /*
     * Icône
     */

    const iconWrap = document.createElement("div");

    iconWrap.style.cssText =
      "width:28px;" +
      "height:28px;" +
      "border-radius:8px;" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:center;" +
      "background:rgba(var(--rgb-primary-text-color,0,0,0),0.06);" +
      "flex:0 0 auto;";

    const icon = document.createElement("ha-icon");

    icon.icon = group.icon || "mdi:lightbulb-outline";

    icon.style.cssText =
      "--mdc-icon-size:17px;" +
      "color:var(--secondary-text-color);";

    iconWrap.appendChild(icon);

    /*
     * Nom
     */

    const name = document.createElement("div");

    name.textContent = group.name || "";

    name.style.cssText =
      "flex:0 0 76px;" +
      "min-width:0;" +
      "font-size:13px;" +
      "font-weight:500;" +
      "color:var(--primary-text-color);" +
      "white-space:nowrap;" +
      "overflow:hidden;" +
      "text-overflow:ellipsis;";

    row.append(iconWrap, name);

    /*
     * BRIGHTNESS
     */

    if (group.brightness) {

      const brightness = document.createElement("ha-selector");

      brightness.selector = {
        number: {
          min: 0,
          max: 254,
          step: 1,
          mode: "slider",
        },
      };

      brightness.value = this._getNumber(group.brightness, 0);

      if (this._hass) {
        brightness.hass = this._hass;
      }

      brightness.style.cssText =
        "flex:1 1 auto;" +
        "min-width:70px;" +
        "max-width:170px;";

      brightness.addEventListener("value-changed", (ev) => {

        ev.stopPropagation();

        const value = Number(ev.detail?.value);

        if (!Number.isFinite(value)) {
          return;
        }

        brightness.value = value;

        this._setInputNumber(group.brightness, value);
      });

      this._colorPickers.push(brightness);

      row.appendChild(brightness);

      const brightnessValue = document.createElement("div");

      brightnessValue.textContent =
        `${Math.round(this._getNumber(group.brightness, 0))}`;

      brightnessValue.style.cssText =
        "width:28px;" +
        "flex:0 0 28px;" +
        "text-align:right;" +
        "font-size:11px;" +
        "color:var(--secondary-text-color);";

      row.appendChild(brightnessValue);
    }

    /*
     * RGB
     */

    if (group.color) {

      const picker = this._createRgbPicker(group.color);

      row.appendChild(picker);
    }

    /*
     * WHITE / KELVIN
     */

    if (group.white) {

      const picker = this._createWhitePicker(group.white);

      row.appendChild(picker);

      const kelvinValue = document.createElement("div");

      kelvinValue.textContent =
        `${Math.round(this._getNumber(group.white, 4000))} K`;

      kelvinValue.style.cssText =
        "width:48px;" +
        "flex:0 0 48px;" +
        "text-align:right;" +
        "font-size:11px;" +
        "color:var(--secondary-text-color);" +
        "white-space:nowrap;";

      row.appendChild(kelvinValue);
    }

    return row;
  }

  /* -----------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------- */

  _render() {

    if (!this._config || !this._hass) {
      return;
    }

    const groups = this._config.groups || [];

    const signature = groups
      .map((g) => {

        const brightness = g.brightness
          ? this._getNumber(g.brightness, 0)
          : "";

        const color = g.color
          ? this._getState(g.color)?.state || ""
          : "";

        const white = g.white
          ? this._getNumber(g.white, 4000)
          : "";

        return [
          g.name,
          g.icon,
          g.brightness,
          brightness,
          g.color,
          color,
          g.white,
          white,
        ].join("|");

      })
      .join("~");

    if (this._built && signature === this._lastSig) {
      return;
    }

    this._lastSig = signature;

    this._colorPickers = [];
    this._whitePickers = [];

    const card = document.createElement("ha-card");

    card.style.cssText =
      "border-radius:20px;" +
      "box-shadow:none;" +
      "border:none;" +
      "background:var(--ha-card-background,var(--card-background-color));" +
      "padding:8px 12px;";

    const container = document.createElement("div");

    container.style.cssText =
      "display:flex;" +
      "flex-direction:column;" +
      "width:100%;" +
      "gap:1px;";

    groups.forEach((group, index) => {

      const row = this._renderGroup(group);

      if (index < groups.length - 1) {

        row.style.borderBottom =
          "1px solid var(--divider-color)";
      }

      container.appendChild(row);
    });

    card.appendChild(container);

    this.innerHTML = "";
    this.appendChild(card);

    this._built = true;
  }
}

customElements.define(
  "alex-input-color",
  AlexInputColorCard
);


/* =========================================================================
 * === alex-input-color-editor =============================================
 * ========================================================================= */

class AlexInputColorCardEditor extends AlexListEditor {

  static getStubConfig() {
    return AlexInputColorCard.getStubConfig();
  }

  _normalize() {

    if (!Array.isArray(this._config.groups)) {
      this._config.groups = [];
    }

    this._config.groups = this._config.groups.map((g) => ({
      name: "",
      icon: "mdi:lightbulb-outline",
      brightness: "",
      color: "",
      white: "",
      ...g,
    }));
  }

  _validPath() {

    const p = this._path || [];

    if (
      p.length >= 1 &&
      !this._config.groups[p[0]]
    ) {
      return [];
    }

    return p;
  }

  _render() {

    this._forms = [];
    this._selectors = [];

    this.innerHTML = "";

    const p = this._validPath();

    if (p.length === 0) {
      this._renderRoot();
    } else {
      this._renderGroupEditor(p[0]);
    }

    if (this._hass) {

      this._forms.forEach(
        (f) => (f.hass = this._hass)
      );

      this._selectors.forEach(
        (s) => (s.hass = this._hass)
      );
    }
  }

  _renderRoot() {

    const groups = this._config.groups || [];

    this.appendChild(
      this._sectionTitle("Groupes")
    );

    groups.forEach((group, index) => {

      this.appendChild(
        this._row(
          group.icon || "mdi:lightbulb-outline",
          group.name || "(sans nom)",
          [
            group.brightness ? "Luminosité" : "",
            group.color ? "RGB" : "",
            group.white ? "Blanc" : "",
          ]
            .filter(Boolean)
            .join(" · "),
          () => {

            this._path = [index];
            this._render();

          },
          () => {

            this._update(
              (c) => c.groups.splice(index, 1)
            );

            this._render();

          },
          index > 0
            ? () =>
                this._moveItem(
                  (c) => c.groups,
                  index,
                  -1
                )
            : null,
          index < groups.length - 1
            ? () =>
                this._moveItem(
                  (c) => c.groups,
                  index,
                  1
                )
            : null
        )
      );
    });

    this.appendChild(
      this._addButton(
        "Ajouter un groupe",
        () => {

          let index;

          this._update((c) => {

            c.groups = c.groups || [];

            c.groups.push({
              name: "",
              icon: "mdi:lightbulb-outline",
              brightness: "",
              color: "",
              white: "",
            });

            index = c.groups.length - 1;

          });

          this._path = [index];

          this._render();
        }
      )
    );
  }

  _renderGroupEditor(index) {

    const group =
      this._config.groups[index] || {};

    const merge = (value) => {

      this._update((c) => {

        c.groups[index] = {
          ...c.groups[index],
          ...value,
        };

      });
    };

    this.appendChild(
      this._backHeader(
        group.name || "Groupe",
        () => {

          this._path = [];
          this._render();

        }
      )
    );

    /*
     * Général
     */

    this.appendChild(
      this._sectionTitle("Général")
    );

    this.appendChild(
      this._form(
        [
          {
            name: "name",
            selector: { text: {} },
          },
          {
            name: "icon",
            selector: { icon: {} },
          },
        ],
        {
          name: group.name || "",
          icon:
            group.icon ||
            "mdi:lightbulb-outline",
        },
        {
          name: "Nom",
          icon: "Icône",
        },
        merge
      )
    );

    /*
     * Entités
     */

    this.appendChild(
      this._sectionTitle("Paramètres lumineux")
    );

    this.appendChild(
      this._form(
        [
          {
            name: "brightness",
            selector: {
              entity: {
                domain: "input_number",
              },
            },
          },
          {
            name: "color",
            selector: {
              entity: {
                domain: "input_text",
              },
            },
          },
          {
            name: "white",
            selector: {
              entity: {
                domain: "input_number",
              },
            },
          },
        ],
        {
          brightness: group.brightness || "",
          color: group.color || "",
          white: group.white || "",
        },
        {
          brightness: "Luminosité",
          color: "Couleur RGB",
          white: "Température du blanc",
        },
        merge
      )
    );

    /*
     * Configuration du Kelvin
     */

    const whiteConfig = document.createElement("div");

    whiteConfig.style.cssText =
      "margin-top:10px;";

    whiteConfig.appendChild(
      this._form(
        [
          {
            name: "white_min",
            selector: {
              number: {
                min: 1000,
                max: 10000,
                step: 50,
                mode: "box",
              },
            },
          },
          {
            name: "white_max",
            selector: {
              number: {
                min: 1000,
                max: 10000,
                step: 50,
                mode: "box",
              },
            },
          },
        ],
        {
          white_min:
            group.white_min != null
              ? group.white_min
              : 2000,

          white_max:
            group.white_max != null
              ? group.white_max
              : 6500,
        },
        {
          white_min: "Kelvin minimum",
          white_max: "Kelvin maximum",
        },
        merge
      )
    );

    this.appendChild(
      this._panel(
        "Plage du blanc",
        "mdi:thermometer",
        whiteConfig,
        false
      )
    );
  }
}

customElements.define(
  "alex-input-color-editor",
  AlexInputColorCardEditor
);

window.customCards.push({
  type: "alex-input-color",
  name: "Alex Input Color",
  description:
    "Gestion compacte de luminosité, couleur RGB et température de blanc.",
  preview: false,
  documentationURL:
    "https://github.com/<user>/alex-cards",
});