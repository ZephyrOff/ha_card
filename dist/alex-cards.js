/**
 * Alex Cards — collection de cartes Lovelace custom.
 * Aucune dépendance, aucun build : JS natif + <ha-form> (fourni par Home Assistant).
 *
 * Pour ajouter une carte : dupliquer un bloc "=== ma-carte ===" ci-dessous
 * (classe + éditeur + customElements.define + window.customCards.push).
 */

const ALEX_CARDS_VERSION = "0.1.1";

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
 * === ma-prochaine-carte ==================================================
 * Copier le bloc room-header-card ci-dessus : classe + <...>-editor +
 * customElements.define(...) + window.customCards.push(...).
 * ========================================================================= */
