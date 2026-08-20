# Alex Cards

Collection de cartes Lovelace custom pour Home Assistant, distribuée en **plugin HACS**
(catégorie *Dashboard*). Sans build : JS natif + `<ha-form>` fourni par HA.

## Cartes incluses

| Type                       | Éditeur UI | Description                                                        |
| -------------------------- | :--------: | ----------------------------------------------------------------- |
| `custom:alex-room-header-card`  | oui        | Bandeau d'en-tête de pièce : température, humidité, ouvrants.      |
| `custom:alex-graph-card`        | oui        | Tuile valeur + mini-graphe 24 h en fond.                          |
| `custom:alex-prise-card`        | oui        | Interrupteur avec puissance + mini-graphe (masqué à l'arrêt).     |
| `custom:alex-shutter-card`      | oui        | Volet (position) + boutons Open / Projection / Close scriptés.    |
| `custom:alex-light-card`        | oui        | Liste de lumières, groupes déployables au double-clic.            |
| `custom:alex-multi-graph-card`  | oui        | Pile de mini-graphes configurables (fond de card du thème).      |
| `custom:alex-pill-card`         | oui        | Pastille nom + sous-titre avec icône ronde et chevron.           |
| `custom:alex-weather-card`      | oui        | Météo actuelle et/ou prévisions (3 styles), à empiler librement. |
| `custom:alex-sensor-card`       | oui        | Vue synthétique de capteurs par catégories (ouvrants, verrous…). |
| `custom:alex-entity-card`       | oui        | Liste détaillée d'entités d'un même type (état, zone, dernier changement). |
| `custom:alex-toggle-card`       | oui        | Liste d'entités basculables avec interrupteur cliquable par ligne. |
| `custom:alex-clock-card`        | oui        | Horloge et date, alignables, avec la personnalisation du package. |

Toutes les cartes apparaissent dans le sélecteur « Ajouter une carte » avec un éditeur
visuel. La `alex-light-card` a un éditeur type « chips » (liste + crayon pour éditer chaque
entité, sous-liste de membres pour les groupes) ; le toggle « Éditeur de code » reste
dispo pour éditer le YAML directement.

Tous les color-pickers du package (Customisation, fonds de carte, etc.) combinent un
sélecteur RGB natif avec un champ d'opacité (%) séparé — HA n'a pas de sélecteur
couleur+alpha natif. Les deux se recombinent en `[r, g, b, a]` (`a` entre 0 et 1) dans
la config ; un ancien `[r, g, b]` (sans 4ᵉ valeur) reste valide, l'opacité vaut alors 100 %.

## Dépendances (HACS)

`alex-graph-card`, `alex-prise-card`, `alex-shutter-card` et `alex-light-card` génèrent en interne des cartes
mushroom/card-mod : elles requièrent, installées via HACS, **Mushroom**, **card-mod**,
**mini-graph-card**, **stack-in-card**, **vertical-stack-in-card** et **mod-card**.
`alex-weather-card` requiert **button-card** et **vertical-stack-in-card**.
`alex-room-header-card` n'a aucune dépendance.

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
type: custom:alex-room-header-card
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
type: custom:alex-graph-card
entity: sensor.cuisine_temp_temperature
name: Température
icon: mdi:thermometer
color: [217, 148, 20]
```

```yaml
type: custom:alex-prise-card
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
type: custom:alex-shutter-card
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
type: custom:alex-light-card
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

### Weather Card

Une carte, plusieurs « composants » empilés verticalement et **visuellement unifiés**
(un seul fond, un seul contour arrondi). Chaque composant est un des 4 styles
ci-dessous ; on peut en mettre plusieurs (ex. météo actuelle + un style de prévisions)
dans la même carte.

```yaml
type: custom:alex-weather-card
entity: weather.forecast_maison
background: [48, 48, 63]        # optionnel : fond unique pour toute la carte
components:
  - type: current          # météo actuelle
    # background/primary_color/secondary_color : optionnels (color picker dans l'éditeur)
  - type: classic           # prévisions, icônes emoji + barre min/max par jour
    days: 5
  - type: bars               # prévisions, icônes mdi + jauge thermique horizontale
    days: 5
  - type: chart               # prévisions, courbe SVG max/min + pluie
    days: 5
```

**Fond de la carte — priorité, du plus spécifique au plus général :**

1. Un composant avec **son propre `background`** défini (dans son panneau
   Customisation) garde toujours sa couleur et ses coins arrondis — override
   volontaire, visuellement distinct des autres.
2. Sinon, si la carte a un **`background` racine** défini (champ « Apparence » en
   haut de l'éditeur) : tous les composants (y compris `current`) deviennent
   transparents et suivent cette couleur unique → unité totale.
3. Sinon (rien de défini nulle part) :
   - `current` garde son **dégradé dynamique** selon la météo (comportement
     historique), avec ses propres coins arrondis.
   - Les composants de prévision (`classic`/`bars`/`chart`) deviennent transparents
     et suivent le **fond de thème** du conteneur externe → unifiés entre eux, même
     si `current` reste visuellement à part (son dégradé ne peut pas se fondre dans
     un fond partagé statique, puisqu'il dépend de l'état météo en direct).

Pour une unité complète même avec `current` dans le lot, définis un `background`
racine explicite (les couleurs météo dynamiques ne s'appliquent alors plus).

Autres points :

- `days` (défaut 5) limite le nombre de jours de prévision affichés sur les 3 styles
  de prévisions. Elles sont récupérées via l'abonnement WebSocket
  `weather/subscribe_forecast` (méthode standard de HA depuis 2023.9, celle qu'utilise
  la carte météo native) ; en repli, si l'entité ne le supporte pas, l'ancien attribut
  `attributes.forecast` est lu une fois. Si aucun des deux n'est disponible, le
  composant affiche « Prévisions indisponibles ».
- `primary_color`/`secondary_color` (par composant) retintent respectivement : la
  température + la condition (current) ; le jour + le max (classic, bars) ; la courbe
  max + la courbe min (chart, valeurs par défaut bleu/orange non liées au thème).
- **`classic`** a deux couleurs dédiées pour le « piston » vertical de chaque jour :
  `range_track_color` (le fond du piston, vide = secondaire) et `range_fill_color`
  (le levier à l'intérieur, vide = primaire).
- **`bars`** a une couleur dédiée pour le segment qui entoure le point sur la jauge :
  `range_track_color` (vide = secondaire).
- Les 4 styles viennent de gabarits `custom:button-card` fournis par l'utilisateur ;
  seule la lecture des prévisions (remplacement des données figées d'origine par les
  vraies données de l'entité) a été ajoutée par le plugin.

### Sensor Card

Vue synthétique par catégories : chaque catégorie agrège plusieurs entités en une seule
ligne de statut (icône + point coloré + texte). Rendu « maison » (pas de dépendance
externe), directement basé sur `hass.states`.

```yaml
type: custom:alex-sensor-card
name: Sécurité
icon: mdi:shield-home
icon_color: [230, 163, 74]        # optionnel, teinte du badge (défaut ambré)
categories:
  - name: Alarme
    type: alarm
    icon: mdi:shield-outline
    entities: [alarm_control_panel.maison]
  - name: Porte d'entrée
    type: lock
    icon: mdi:lock
    entities: [lock.porte_entree]
  - name: Fenêtres
    type: opening
    icon: mdi:window-closed-variant
    entities: [binary_sensor.fenetre_cuisine, binary_sensor.fenetre_chambre]
  - name: Mouvement
    type: detector
    icon: mdi:motion-sensor
    entities: [binary_sensor.mouvement_couloir]
  - name: Caméras
    type: boolean
    icon: mdi:cctv
    entities: [binary_sensor.camera_avant_active]
```

Types de catégorie et agrégation :

- **`opening`** (ouvrant) — "Tout fermé" (vert) ou "N ouvert(s)" (rouge). Accepte
  `binary_sensor` (`on` = ouvert) et `cover` (`open`/`closed`).
- **`lock`** (verrou) — "Tout verrouillé" (vert) ou "N déverrouillé(s)" (rouge). Accepte
  `lock` (`locked`/`unlocked`) et `binary_sensor` classe verrou (`on` = déverrouillé).
- **`detector`** (détecteur) — "Aucune détection" (vert) ou "N détecté(s)" (orange).
  `binary_sensor`, `on` = détecté.
- **`boolean`** (booléen simple) — texte neutre "Tout inactif"/"N actif(s)" (gris), mais
  le **point** passe au vert dès qu'au moins une entité est active — utile pour un statut
  informatif (caméras actives, etc.) sans connotation d'alerte.
- **`alarm`** (alarme) — affiche l'état littéral de la **première** entité
  (`alarm_control_panel`) : Désarmée (gris), Armée (vert), En attente/Activation (orange),
  Déclenchée (rouge). Les entités suivantes de la même catégorie sont ignorées.

Chaque catégorie a sa propre icône (optionnelle, sinon une icône par défaut selon le
type). L'éditeur affiche les entités d'une catégorie sous forme de liste (comme les
Catégories elles-mêmes), avec une ligne « Ajouter une entité ». Il n'y a pas encore
d'action au clic sur une ligne (more-info, etc.) — à ajouter si besoin.

**Personnalisation (color-pickers avec opacité, comme le reste du package) :**

- Racine → panneau **Customisation** : couleur du badge, fond de la carte (vide = thème),
  couleur du nom de la carte, couleur des noms de catégorie, écartement entre les
  catégories (px, défaut 12).
- Chaque catégorie → son propre panneau **Customisation** : couleur de succès (remplace
  le vert par défaut) et couleur d'échec (remplace le rouge/orange par défaut — le
  détecteur en alerte et l'ouvrant/verrou en défaut partagent la même couleur d'échec,
  pour rester sur une logique binaire succès/échec).

### Entity Card

Complément de la Sensor Card : au lieu d'agréger plusieurs entités en une ligne de
résumé, liste **chaque entité individuellement** — état, zone (si connue dans HA),
temps depuis le dernier changement. Toute la carte partage **un seul type**
(contrairement à la Sensor Card qui a plusieurs catégories, chacune avec son propre
type).

```yaml
type: custom:alex-entity-card
name: Portes
icon: mdi:door
entity_type: opening              # opening / lock / detector / boolean / alarm
entities:
  - entity: binary_sensor.porte_entree
    name: Entrée                  # optionnel, sinon le nom convivial HA
    icon: mdi:door                # optionnel, sinon l'icône par défaut du type
    color: [74, 222, 128]         # optionnel, sinon la couleur du texte secondaire
  - entity: binary_sensor.porte_garage
icon_color: [74, 222, 128]        # optionnel, teinte du badge
```

- Chaque ligne affiche : nom convivial de l'entité (ou le nom personnalisé), sa zone HA
  (si l'entité ou son appareil en a une), une pastille avec son état libellé selon
  `entity_type` (ex. « Fermé »/« Ouvert » pour `opening`, « Verrouillé »/« Déverrouillé »
  pour `lock`), et le temps écoulé depuis `last_changed`.
- Chaque entité de la liste a son propre **nom**, **icône** et **couleur d'icône**
  personnalisables (crayon sur sa ligne dans l'éditeur) — tous optionnels, avec repli sur
  le nom convivial HA / l'icône par défaut du type / la couleur de texte secondaire.
- Le nombre total d'entités s'affiche à droite de l'en-tête (« N total »).
- Mêmes options de personnalisation que la Sensor Card (panneau Customisation racine :
  badge, fond de carte, couleur du nom, couleur des noms d'entité, couleur succès,
  couleur échec, écartement entre les entités en px) — la couleur succès/échec ici
  colore la **pastille d'état** de chaque ligne (teinte de fond légère + texte).
- Type `alarm` : chaque ligne affichera l'état littéral de son entité
  (`alarm_control_panel`), pas de limitation à une seule entité ici (contrairement à la
  catégorie Alarme de la Sensor Card) puisque chaque ligne montre sa propre entité.
- Rétrocompatible : une ancienne config avec `entities:` en simple liste de chaînes
  (`- binary_sensor.porte_entree`) reste valide, sans personnalisation par entité.

### Toggle Card

Comme l'Entity Card, mais **interactive** : chaque ligne a un vrai interrupteur
cliquable (au lieu d'une pastille en lecture seule) qui bascule directement
l'entité (service `homeassistant.toggle`).

```yaml
type: custom:alex-toggle-card
name: Morning
icon: mdi:transit-connection-variant
entities:
  - entity: input_boolean.morning_lights
    name: Lumières du matin       # optionnel, sinon le nom convivial HA
    icon: mdi:lightbulb           # optionnel, sinon l'icône du badge
    color: [244, 169, 53]         # optionnel, sinon la couleur du badge
  - entity: switch.coffee_machine
on_color: [244, 169, 53]          # optionnel, couleur de l'interrupteur actif
```

- Pas de notion de « type » ici (contrairement à l'Entity Card) : n'importe quelle
  entité avec un état `on`/`off` fonctionne (`input_boolean`, `switch`, `automation`,
  `light`, `fan`…), le picker d'ajout suggère ces domaines à titre indicatif.
- Chaque entité de la liste a son propre **nom**, **icône** et **couleur d'icône**
  personnalisables (crayon sur sa ligne dans l'éditeur).
- L'en-tête affiche « N/Total » (nombre d'entités actuellement actives).
- Rétrocompatible : une ancienne config avec `entities:` en simple liste de chaînes
  reste valide, sans personnalisation par entité.
- Personnalisation (panneau Customisation racine) : badge, icône des lignes (vide =
  icône du badge), fond de carte, couleur du nom, couleur des noms d'entité, écartement
  entre les entités (px), **couleur interrupteur actif** et **couleur interrupteur
  inactif** (remplacent respectivement l'orange et le gris par défaut).

### Clock Card

Horloge et date, sans entité — se met à jour toute seule chaque seconde (indépendamment
des mises à jour de `hass`). La plus simple structurellement : pas de badge, pas de
liste, juste deux lignes de texte alignables.

```yaml
type: custom:alex-clock-card
show_time: true
show_date: true
alignment: left            # left / center / right
primary_color: [255, 255, 255]   # optionnel, couleur de l'heure
secondary_color: [150, 150, 150] # optionnel, couleur de la date
```

- `show_time`/`show_date` : chacun indépendamment affichable ou non.
- `alignment` : gauche / centre / droite, s'applique aux deux lignes.
- Personnalisation (panneau Customisation) : fond de la carte, couleur de l'heure
  (primary), couleur de la date (secondary) — pas de badge/icône ici, cette carte n'en a
  pas.
- La date est formatée dans la langue de l'interface HA (`hass.locale`, repli sur le
  français), au format « Jour J mois » (ex. « Mardi 16 septembre »). L'heure est
  affichée en 24 h.

## Ajouter une nouvelle carte

Dans `dist/alex-cards.js`, dupliquer le bloc `=== room-header-card ===` (le nom du bloc de code source ; le tag public, lui, est `alex-room-header-card`) :

1. une classe `MaCarte extends HTMLElement` avec `setConfig`, `set hass`, `getCardSize`,
   `static getConfigElement`, `static getStubConfig` ;
2. une classe `MaCarteEditor extends HTMLElement` basée sur `<ha-form>` + un schéma de
   *selectors* ;
3. `customElements.define("ma-carte", MaCarte)` et `..."ma-carte-editor"...` ;
4. `window.customCards.push({ type: "ma-carte", name: "...", preview: true })`.

Bumper `ALEX_CARDS_VERSION`, commit, (option) release.

## Versioning

Tags SemVer (`v0.1.0`, ...). HACS suit les releases GitHub.
