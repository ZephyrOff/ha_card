# Alex Cards

Collection de cartes Lovelace custom pour Home Assistant, distribuée en **plugin HACS**
(catégorie *Dashboard*). Sans build : JS natif + `<ha-form>` fourni par HA.

## Cartes incluses

| Type                       | Éditeur UI | Description                                                        |
| -------------------------- | :--------: | ----------------------------------------------------------------- |
| `custom:room-header-card`  | oui        | Bandeau d'en-tête de pièce : température, humidité, ouvrants.      |
| `custom:graph-card`        | oui        | Tuile valeur + mini-graphe 24 h en fond.                          |
| `custom:prise-card`        | oui        | Interrupteur avec puissance + mini-graphe (masqué à l'arrêt).     |
| `custom:shutter-card`      | oui        | Volet (position) + boutons Open / Projection / Close scriptés.    |
| `custom:light-card`        | oui        | Liste de lumières, groupes déployables au double-clic.            |
| `custom:multi-graph-card`  | oui        | Pile de mini-graphes configurables (fond de card du thème).      |
| `custom:pill-card`         | oui        | Pastille nom + sous-titre avec icône ronde et chevron.           |

Toutes les cartes apparaissent dans le sélecteur « Ajouter une carte » avec un éditeur
visuel. La `light-card` a un éditeur type « chips » (liste + crayon pour éditer chaque
entité, sous-liste de membres pour les groupes) ; le toggle « Éditeur de code » reste
dispo pour éditer le YAML directement.

## Dépendances (HACS)

`graph-card`, `prise-card`, `shutter-card` et `light-card` génèrent en interne des cartes
mushroom/card-mod : elles requièrent, installées via HACS, **Mushroom**, **card-mod**,
**mini-graph-card**, **stack-in-card**, **vertical-stack-in-card** et **mod-card**.
`room-header-card` n'a aucune dépendance.

## Installation via HACS (dépôt personnalisé)

1. HACS → menu ⋮ → **Dépôts personnalisés**.
2. URL du repo : `https://github.com/<user>/alex-cards` — catégorie : **Dashboard**.
3. Chercher « Alex Cards » dans HACS → **Télécharger**.
4. HACS enregistre automatiquement la ressource JS. Vider le cache du navigateur si besoin.

> Sans release GitHub, HACS charge `dist/alex-cards.js` depuis la branche par défaut.
> Avec une release, attacher `alex-cards.js` comme *asset* de la release (nom identique).

## Utilisation

Dans une vue, « Ajouter une carte » → **Room Header Card**, puis remplir les champs
(l'éditeur fait le reste). Équivalent YAML :

```yaml
type: custom:room-header-card
name: Salon
secondary: Volet · Apple TV · lumière · Béatrice
icon: mdi:sofa
temp_entity: sensor.salon_temp_temperature
hum_entity: sensor.salon_temp_humidity
window_entity: binary_sensor.salon_window_contact
```

`window_entity` accepte un `binary_sensor` (fermé = `off`), un `cover` (fermé = `closed`)
ou un `group`.

### Graph Card / Prise Card

```yaml
type: custom:graph-card
entity: sensor.cuisine_temp_temperature
name: Température
icon: mdi:thermometer
color: [217, 148, 20]
```

```yaml
type: custom:prise-card
entity: switch.prise_cagibi
power_entity: sensor.prise_cagibi_power   # optionnel : active W + graphe
name: Prise Cagibi
icon: mdi:power-plug
color: [8, 207, 104]
tap_action:
  action: toggle
```

### Shutter Card

Couleurs en CSS libre (accepte `rgba(...)`, hex, noms). Champs couleur vides = défauts du thème.

```yaml
type: custom:shutter-card
entity: cover.volet_cuisine
name: Cuisine
icon: mdi:window-shutter
icon_color: '#d99414'
script_open: script.volet_cuisine_open
script_projection: script.volet_cuisine_projection
script_close: script.volet_cuisine_close
btn_open_color: 'rgba(255,255,255,.05)'
txt_open_color: '#c2bcbc'
```

### Light Card

Chaque entrée de `lights` est une lumière simple ; ajouter `expand_toggle` (un
`input_boolean` à créer côté HA) **et** `members` en fait un groupe qui se déploie
au double-clic.

```yaml
type: custom:light-card
all_entity: light.bureau_light_all
lights:
  - entity: light.bureau_light_plafond_all
    name: Plafond
    icon: hue:bulb-group-spot
    expand_toggle: input_boolean.dashboard_bureau_plafond
    members:
      - { entity: light.bureau_light_plafond,  name: Plafond 1, icon: hue:bulb-spot }
      - { entity: light.bureau_light_plafond2, name: Plafond 2, icon: hue:bulb-spot }
  - entity: light.bureau_light_globe
    name: Globe gauche
    icon: hue:go
```

## Ajouter une nouvelle carte

Dans `dist/alex-cards.js`, dupliquer le bloc `=== room-header-card ===` :

1. une classe `MaCarte extends HTMLElement` avec `setConfig`, `set hass`, `getCardSize`,
   `static getConfigElement`, `static getStubConfig` ;
2. une classe `MaCarteEditor extends HTMLElement` basée sur `<ha-form>` + un schéma de
   *selectors* ;
3. `customElements.define("ma-carte", MaCarte)` et `..."ma-carte-editor"...` ;
4. `window.customCards.push({ type: "ma-carte", name: "...", preview: true })`.

Bumper `ALEX_CARDS_VERSION`, commit, (option) release.

## Versioning

Tags SemVer (`v0.1.0`, ...). HACS suit les releases GitHub.
