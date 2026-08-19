/**
 * Alex Cards — collection de cartes Lovelace custom.
 * Aucune dépendance, aucun build : JS natif + <ha-form> (fourni par Home Assistant).
 *
 * Pour ajouter une carte : dupliquer un bloc "=== ma-carte ===" ci-dessous
 * (classe + éditeur + customElements.define + window.customCards.push).
 */

const ALEX_CARDS_VERSION = "0.4.1";

console.info(
  `%c ALEX-CARDS %c v${ALEX_CARDS_VERSION} `,
  "color:white;background:#5b6b7a;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px;",
  "color:#5b6b7a;background:#e8ebee;border-radius:0 4px 4px 0;padding:2px 6px;"
);

window.customCards = window.customCards || [];

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
];

const RH_LABELS = {
  name: "Nom",
  secondary: "Sous-titre",
  icon: "Icône",
  temp_entity: "Capteur température",
  hum_entity: "Capteur humidité",
  window_entity: "Ouvrants (contact / volet / groupe)",
};

class RoomHeaderCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("room-header-card-editor");
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
customElements.define("room-header-card", RoomHeaderCard);

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
customElements.define("room-header-card-editor", RoomHeaderCardEditor);

window.customCards.push({
  type: "room-header-card",
  name: "Room Header Card",
  description: "Bandeau d'en-tête de pièce (température, humidité, ouvrants).",
  preview: true,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * Helpers partagés
 * ========================================================================= */

// [r,g,b] (selector color_rgb) -> "#rrggbb"
function rgbToHex(rgb, fallback) {
  const a = Array.isArray(rgb) ? rgb : fallback;
  const [r, g, b] = a;
  const h = (n) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

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

/*
 * Base pour les cartes "wrapper" : construit en interne une carte HA
 * (via loadCardHelpers) à partir d'une config simple. Les sous-classes
 * implémentent _innerConfig(config) qui retourne l'objet de carte à créer.
 */
class AlexWrapperCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
    if (this._hass) this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._card) this._card.hass = hass;
    else this._build();
  }

  getCardSize() {
    return this._card && this._card.getCardSize ? this._card.getCardSize() : 3;
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
      this._form.computeLabel = (s) => (this._labels && this._labels[s.name]) || s.name;
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
    this._form.schema = this._schema;
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

/* =========================================================================
 * === graph-card ==========================================================
 * Tuile état + mini-graphe 24 h en fond. Config : entité, nom, icône, couleur.
 * ========================================================================= */

const GRAPH_DEFAULT_RGB = [217, 148, 20];

class GraphCard extends AlexWrapperCard {
  static getConfigElement() {
    return document.createElement("graph-card-editor");
  }
  static getStubConfig() {
    return { entity: "", name: "", icon: "mdi:chart-line", color: GRAPH_DEFAULT_RGB };
  }
  _innerConfig(c) {
    const hex = rgbToHex(c.color, GRAPH_DEFAULT_RGB);
    const line = rgba(c.color, 0.5, GRAPH_DEFAULT_RGB);
    return {
      type: "custom:stack-in-card",
      card_mod: { style: "ha-card {\n  --ha-card-border-width: 0;\n}\n" },
      cards: [
        {
          type: "custom:mushroom-entity-card",
          entity: c.entity,
          primary_info: "state",
          secondary_info: "name",
          name: c.name || "",
          icon: c.icon || "mdi:chart-line",
          icon_color: hex,
          card_mod: { style: "ha-card {\n  z-index: 1;\n  --ha-card-border-width: 0;\n}\n" },
        },
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
              "ha-card {\n  position: absolute !important;\n  height: 100%;\n  width: 100%;\n" +
              "  right: 0px;\n  bottom: 0px;\n  --ha-card-border-width: 0;\n}\n",
          },
        },
      ],
    };
  }
}
customElements.define("graph-card", GraphCard);

class GraphCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "entity", selector: { entity: { domain: "sensor" } } },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "color", selector: { color_rgb: {} } },
    ];
    this._labels = { entity: "Entité", name: "Nom", icon: "Icône", color: "Couleur" };
  }
}
customElements.define("graph-card-editor", GraphCardEditor);

window.customCards.push({
  type: "graph-card",
  name: "Graph Card",
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
    return document.createElement("prise-card-editor");
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
    const hex = rgbToHex(c.color, PRISE_DEFAULT_RGB);
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
        icon_color: `{% if is_state('${sw}', 'on') %}${hex}{% endif %}`,
        tap_action: c.tap_action || { action: "toggle" },
        hold_action: power ? { action: "more-info", entity: power } : { action: "more-info" },
        card_mod: { style: "ha-card {\n  z-index: 1;\n  --ha-card-border-width: 0;\n}\n" },
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
            "  position: absolute !important;\n  height: 100%;\n  width: 100%;\n" +
            "  right: 0px;\n  bottom: 0px;\n  --ha-card-border-width: 0;\n}\n",
        },
      });
    }

    return {
      type: "custom:stack-in-card",
      card_mod: { style: "ha-card {\n  --ha-card-border-width: 0;\n}\n" },
      cards,
    };
  }
}
customElements.define("prise-card", PriseCard);

class PriseCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "entity", selector: { entity: { domain: "switch" } } },
      { name: "power_entity", selector: { entity: { domain: "sensor" } } },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "color", selector: { color_rgb: {} } },
      { name: "tap_action", selector: { ui_action: {} } },
    ];
    this._labels = {
      entity: "Interrupteur",
      power_entity: "Capteur puissance (optionnel)",
      name: "Nom",
      icon: "Icône",
      color: "Couleur",
      tap_action: "Action au clic",
    };
  }
}
customElements.define("prise-card-editor", PriseCardEditor);

window.customCards.push({
  type: "prise-card",
  name: "Prise Card",
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
    return document.createElement("shutter-card-editor");
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
      btn_open_color: "rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)",
      btn_projection_color: "rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)",
      btn_close_color: "rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)",
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
    const coverIconVars =
      (c.icon_color ? `  --icon-color: ${c.icon_color};\n` : "") +
      (c.text_color ? `  --primary-text-color: ${c.text_color};\n` : "");
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
              this._button("Open", c.script_open, c.btn_open_color, c.txt_open_color),
              this._button("Projection", c.script_projection, c.btn_projection_color, c.txt_projection_color),
              this._button("Close", c.script_close, c.btn_close_color, c.txt_close_color),
            ],
          },
        },
      ],
    };
  }
}
customElements.define("shutter-card", ShutterCard);

class ShutterCardEditor extends AlexFormEditor {
  constructor() {
    super();
    this._schema = [
      { name: "entity", selector: { entity: { domain: "cover" } } },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      { name: "icon_color", selector: { text: {} } },
      { name: "text_color", selector: { text: {} } },
      {
        type: "expandable",
        title: "Scripts",
        icon: "mdi:script-text",
        schema: [
          { name: "script_open", selector: { entity: { domain: "script" } } },
          { name: "script_projection", selector: { entity: { domain: "script" } } },
          { name: "script_close", selector: { entity: { domain: "script" } } },
        ],
      },
      {
        type: "expandable",
        title: "Couleurs des boutons",
        icon: "mdi:palette",
        schema: [
          { name: "btn_open_color", selector: { text: {} } },
          { name: "txt_open_color", selector: { text: {} } },
          { name: "btn_projection_color", selector: { text: {} } },
          { name: "txt_projection_color", selector: { text: {} } },
          { name: "btn_close_color", selector: { text: {} } },
          { name: "txt_close_color", selector: { text: {} } },
        ],
      },
    ];
    this._labels = {
      entity: "Volet",
      name: "Nom",
      icon: "Icône",
      icon_color: "Couleur icône (CSS, ex. #d99414)",
      text_color: "Couleur texte (CSS)",
      script_open: "Script Open",
      script_projection: "Script Projection",
      script_close: "Script Close",
      btn_open_color: "Fond bouton Open (CSS)",
      txt_open_color: "Texte bouton Open (CSS)",
      btn_projection_color: "Fond bouton Projection (CSS)",
      txt_projection_color: "Texte bouton Projection (CSS)",
      btn_close_color: "Fond bouton Close (CSS)",
      txt_close_color: "Texte bouton Close (CSS)",
    };
  }
}
customElements.define("shutter-card-editor", ShutterCardEditor);

window.customCards.push({
  type: "shutter-card",
  name: "Shutter Card",
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
    return document.createElement("light-card-editor");
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
      tile.icon_color = rgbToHex(l.color);
      tile.use_light_color = false;
    } else {
      tile.use_light_color = true;
    }
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
customElements.define("light-card", LightCard);

/*
 * Éditeur "façon mushroom-chips" : liste de lumières avec ajout / crayon /
 * suppression. Le crayon ouvre le détail d'une lumière ; un groupe (avec
 * input_boolean d'affichage) a sa propre liste de membres éditables.
 */
const LIGHT_ITEM_SCHEMA = [
  { name: "entity", selector: { entity: { domain: "light" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
  { name: "color", selector: { color_rgb: {} } },
  { name: "expand_toggle", selector: { entity: { domain: "input_boolean" } } },
  { name: "submenu_background", selector: { color_rgb: {} } },
];
const LIGHT_ITEM_LABELS = {
  entity: "Entité",
  name: "Nom",
  icon: "Icône",
  color: "Couleur (laisser vide = couleur de l'ampoule)",
  expand_toggle: "input_boolean d'affichage (rend la lumière déployable)",
  submenu_background: "Fond du sous-menu (vide = teinte du thème)",
};
const MEMBER_ITEM_SCHEMA = LIGHT_ITEM_SCHEMA.slice(0, 4);

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

  /* ---- petits composants DOM ---- */

  _iconButton(icon, title, onClick) {
    const btn = document.createElement("ha-icon-button");
    btn.title = title;
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

  _row(icon, text, subtitle, onEdit, onDelete) {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;gap:10px;padding:8px 4px;" +
      "border-bottom:1px solid var(--divider-color,#e0e0e0);";
    const ic = document.createElement("ha-icon");
    ic.icon = icon || "mdi:lightbulb";
    ic.style.color = "var(--secondary-text-color)";
    const lab = document.createElement("div");
    lab.style.cssText = "flex:1;min-width:0;";
    lab.innerHTML =
      `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(text)}</div>` +
      (subtitle
        ? `<div style="font-size:12px;color:var(--secondary-text-color);overflow:hidden;` +
          `text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(subtitle)}</div>`
        : "");
    row.append(
      ic,
      lab,
      this._iconButton("mdi:pencil", "Éditer", onEdit),
      this._iconButton("mdi:delete", "Supprimer", onDelete)
    );
    return row;
  }

  _sectionTitle(txt) {
    const d = document.createElement("div");
    d.textContent = txt;
    d.style.cssText = "font-weight:600;margin:16px 0 4px;";
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
    this.innerHTML = "";
    const p = this._validPath();
    if (p.length === 0) this._renderRoot();
    else if (p.length === 1) this._renderLight(p[0]);
    else this._renderMember(p[0], p[1]);
    if (this._hass) this._forms.forEach((f) => (f.hass = this._hass));
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
          }
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

    this.appendChild(
      this._backHeader(l.name || l.entity || "Lumière", () => {
        this._path = [];
        this._render();
      })
    );

    this.appendChild(
      this._form(
        LIGHT_ITEM_SCHEMA,
        {
          entity: l.entity,
          name: l.name,
          icon: l.icon,
          color: l.color,
          expand_toggle: l.expand_toggle,
          submenu_background: l.submenu_background,
        },
        LIGHT_ITEM_LABELS,
        (v) => this._update((c) => (c.lights[i] = { ...c.lights[i], ...v }))
      )
    );

    this.appendChild(this._sectionTitle("Membres du groupe"));
    const members = l.members || [];
    if (members.length && !l.expand_toggle) {
      const hint = document.createElement("div");
      hint.textContent =
        "⚠ Renseigne un input_boolean d'affichage ci-dessus pour que le groupe se déploie.";
      hint.style.cssText = "font-size:12px;color:var(--warning-color,#f4a000);margin:4px 0;";
      this.appendChild(hint);
    }
    members.forEach((m, j) => {
      this.appendChild(
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
          }
        )
      );
    });

    this.appendChild(
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
  }

  _renderMember(i, j) {
    const m = (this._config.lights[i].members || [])[j] || {};

    this.appendChild(
      this._backHeader(m.name || m.entity || "Membre", () => {
        this._path = [i];
        this._render();
      })
    );

    this.appendChild(
      this._form(
        MEMBER_ITEM_SCHEMA,
        { entity: m.entity, name: m.name, icon: m.icon, color: m.color },
        LIGHT_ITEM_LABELS,
        (v) =>
          this._update((c) => (c.lights[i].members[j] = { ...c.lights[i].members[j], ...v }))
      )
    );
  }
}
customElements.define("light-card-editor", LightCardEditor);

window.customCards.push({
  type: "light-card",
  name: "Light Card",
  description: "Liste de lumières avec groupes déployables au double-clic.",
  preview: false,
  documentationURL: "https://github.com/<user>/alex-cards",
});

/* =========================================================================
 * === ma-prochaine-carte ==================================================
 * Wrapper : étendre AlexWrapperCard + implémenter _innerConfig(config),
 * éditeur : étendre AlexFormEditor + définir this._schema / this._labels.
 * Puis customElements.define(...) x2 + window.customCards.push(...).
 * ========================================================================= */
