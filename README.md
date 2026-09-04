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
| `custom:alex-select-label-card` | oui        | Groupe de checkbox par label HA (appartenance multiple, non exclusive). |
| `custom:alex-switch-card`       | oui        | Bascule un `input_select` entre ses options, une puce par valeur. |
| `custom:alex-input-card`        | oui        | Comme Switch Card, mais pour plusieurs types d'entrée (`input_select`/`select`, `input_number`/`number`, `input_datetime`, `input_button`/`script`, `switch`/`automation`/`input_boolean`) — le contrôle affiché s'adapte au domaine. |
| `custom:alex-tabs-card`         | oui        | Carte à onglets : monte n'importe quelle carte par onglet, navigation par puces/interrupteur/onglets. |
| `custom:alex-clock-card`        | oui        | Horloge et date, alignables, avec la personnalisation du package. |
| `custom:alex-media-player-card` | oui        | Contrôle média (pochette, lecture, volume) avec bascule entre lecteurs actifs. |
| `custom:alex-server-card`       | oui        | Liste de serveurs/VM avec statut en ligne et bouton power. |
| `custom:alex-gradient-card`     | oui        | Réglage des segments de couleur des lampes Gradient Philips Hue (Zigbee2MQTT). |
| `custom:alex-gradient-popup-card` | oui      | Liste de bandeaux LED — roue chromatique à points multiples pour composer le dégradé de chacun, façon éditeur Philips Hue. |
| `custom:alex-gradient-scene-card` | oui      | Liste et applique les scènes enregistrées via l'intégration Alex Gradient Studio. |
| `custom:alex-input-color`       | oui        | Réglage compact de luminosité/couleur RGB/température de blanc par groupes. |

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

**Templates Jinja** : le champ **Nom** et **Sous-titre** de la Pill Card acceptent un
template Jinja (`{{ }}`/`{% %}`) au lieu d'un texte fixe — la carte s'abonne au rendu
en direct de HA (même mécanisme que les capteurs template) et se met à jour toute seule
à chaque changement d'état pertinent :

```yaml
type: custom:alex-pill-card
name: Volets
secondary: >-
  {% set members = state_attr('cover.volet_maison', 'entity_id') or [] %}
  {{ members | select('is_state', 'open') | list | count }}/{{ members | count }} ouverts
icon: mdi:window-shutter-open
```

Ce mécanisme est propre au package (les champs `custom:button-card` sous-jacents ne
supportent nativement que leurs propres templates JS `[[[ ]]]`, pas le Jinja) — la carte
détecte automatiquement si le texte contient `{{`/`{%`, sinon il est utilisé tel quel.
Pour l'instant activé uniquement sur Pill Card ; à étendre à d'autres champs/cartes sur
demande.

Dans les éditeurs à liste (Light, Multi Graph, Weather, Sensor, Entity, Toggle, Server —
et la sous-liste des membres d'un groupe sur Light), chaque ligne a des flèches **▲ / ▼**
pour la remonter ou la descendre dans l'ordre d'affichage, en plus du crayon et de la
poubelle. Les flèches n'apparaissent que quand elles ont un effet (pas de « monter » sur
le premier élément, pas de « descendre » sur le dernier).

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

Graph Card et Prise Card prennent désormais explicitement le fond du thème par défaut (auparavant, `custom:stack-in-card` ne le faisait pas de façon fiable et pouvait rester transparent).

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

Le mini-graphe en fond (`fill: fade`) peut, selon `mini-graph-card`, dessiner un léger contour tout autour de sa zone de remplissage (y compris une ligne en bas) — corrigé en désactivant ce contour (`.fill { stroke: none }`). Ce correctif seul ne suffit pas toujours : un thème avec effet « verre dépoli » (ou tout thème injectant un `ha-card::before` global, ex. Frosted Glass) peut peindre son propre liseré par-dessus la tuile texte, qui devient visible contre le graphe coloré en dessous. Graph Card et Prise Card neutralisent maintenant explicitement ce pseudo-élément (`ha-card::before/::after { content: none }`) sur leur tuile texte, et le mini-graphe déborde légèrement de sa zone (`height: 130%`, `overflow: visible`) pour que son dégradé de fondu se termine hors champ plutôt que d'être coupé net. Multi Graph Card garde le correctif `.fill { stroke: none }` seul (structure différente, sans tuile superposée).

**Correctif** : `color: [r, g, b]` produit maintenant un hex (`#rrggbb`) plutôt qu'un
`rgba(r, g, b, a)` pour l'`icon_color` envoyé à `mushroom-entity-card`/
`mushroom-template-card`. Vérifié en pratique : avec un `rgba(...)`, mushroom colore
bien l'icône elle-même, mais n'arrive pas à en dériver le fond du badge circulaire
derrière — qui restait transparent, alors qu'un hex fonctionne pour les deux. Même
correctif appliqué à Alex Light Card pour la couleur fixe d'une tuile
(`tile.icon_color`, quand `color:` est défini sur une entrée de `lights:`).

### Shutter Card

Couleurs en CSS libre (accepte `rgba(...)`, hex, noms). Champs couleur vides = défauts du thème.
Panneau Customisation regroupé en sous-sections : Général (icône, texte), puis un groupe
par bouton (Open / Projection / Close), chacun avec sa couleur de fond et de texte.

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

Le bloc des membres d'un groupe déployé suit désormais l'arrondi de la carte englobante
sur son bord inférieur quand ce groupe est le **dernier** élément de `lights` — avant ce
correctif, ses coins restaient toujours carrés (`border-radius: 0px` forcé), ce qui
laissait un bord carré dépasser visuellement du bas de la carte une fois déplié.

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
  `range_track_color` (vide = secondaire), et un champ `row_spacing` (px, défaut 10) pour
  l'écartement entre les lignes. La hauteur du composant s'ajuste automatiquement au
  nombre de jours affichés et à cet écartement (plus de hauteur fixe à 235px) — plus de
  jours ou un espacement plus large agrandissent la carte en conséquence.
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
Catégories elles-mêmes), avec une ligne « Ajouter une entité ». Chaque catégorie a aussi
son propre panneau **Interactions** (clic/appui long/double-clic — mêmes actions que les
autres cartes du package : more-info, toggle, navigate, url, appel de service). Sans
action configurée, la ligne reste en lecture seule (pas de curseur pointeur). L'entité
par défaut pour un `more-info` sans cible explicite est la première de la catégorie.

**Personnalisation (color-pickers avec opacité, comme le reste du package) :**

- Racine → panneau **Customisation**, regroupé en sous-sections : **Carte** (écartement
  entre catégories, couleur du badge, fond de la carte — vide = thème), **En-tête**
  (couleur du nom de la carte), **Catégories** (couleur des noms de catégorie).
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
- Mêmes champs de personnalisation que la Sensor Card, regroupés en sous-sections dans
  le panneau Customisation racine : **Carte** (écartement entre entités, badge, fond),
  **En-tête** (couleur du nom de la carte), **Entité** (couleur des noms d'entité),
  **États** (couleur succès, couleur échec) — la couleur succès/échec ici colore la
  **pastille d'état** de chaque ligne (teinte de fond légère + texte).
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
- Personnalisation, regroupée en sous-sections dans le panneau Customisation racine :
  **Carte** (écartement entre entités, badge, fond), **En-tête** (couleur du nom de la
  carte), **Entité** (icône des lignes — vide = icône du badge —, couleur des noms
  d'entité, **opacité du texte/icône quand l'entité est inactive** — %, défaut 50,
  s'applique à l'icône et au nom, pas à l'interrupteur ni au temps écoulé),
  **Interrupteur** (**couleur interrupteur actif** et **couleur interrupteur inactif**,
  remplacent respectivement l'orange et le gris par défaut).

### Alex Select Label Card

Groupe de checkbox par label HA : pour chaque entité, une puce cliquable par label
déclaré. Appartenance **non exclusive** — une entité peut porter plusieurs labels à
la fois, ou aucun (contrairement à Toggle Card qui est un simple on/off). Pensée pour
des cas comme des modes d'ambiance (ex. « lumière normale » / « lumière confort »)
sans avoir à créer un `input_boolean` par combinaison entité × mode.

```yaml
type: custom:alex-select-label-card
name: Lumière
icon: mdi:label-multiple-outline
labels:
  - name: Normal
    label_id: light_mode_normal
    active_color: [55, 143, 233]
  - name: Confort
    label_id: light_mode_confort
    active_color: [244, 169, 53]
entities:
  - entity: light.sam_light_globe
    name: Globe
  - entity: light.sam_light_plafond
    name: Plafond
```

- **`labels`** définit les colonnes de puces, dans l'ordre d'affichage : `name` (nom
  affiché sur la puce, éditable indépendamment) et `label_id` (le label HA réellement
  posé/retiré — sélecteur natif, doit déjà exister dans Réglages > Étiquettes).
  `active_color`/`inactive_color` sont optionnels et **par label** (pas un jeu partagé
  comme `on_color`/`off_color` sur Toggle Card) ; sans eux, une palette par défaut
  s'applique en cyclant sur l'ordre des labels.
- **`entities`** : même structure que Toggle Card (entité, nom, icône, couleur
  d'icône optionnels par ligne) — sans restriction de domaine ici, une carte peut
  mélanger `light`, `switch`, `media_player`, etc.
- **Aucune dépendance externe** (pas de Spook, pas de `template:` sensor) : la carte
  lit et écrit le registre d'entités HA directement en websocket
  (`config/entity_registry/list`/`update`), et reste à jour toute seule via
  l'événement `entity_registry_updated` — y compris si le label est modifié ailleurs
  (Réglages > Entités, une automatisation, une autre carte). Bascule optimiste au
  clic (la puce répond avant la confirmation réseau, annulée si l'appel échoue).
- **Clics rapprochés sur plusieurs labels d'une même ligne** : chaque entité a sa
  propre file d'attente interne — un 2ᵉ clic pendant qu'un 1er est encore en vol
  attend que celui-ci retombe (optimiste + confirmation réseau) avant de calculer
  son propre changement, au lieu de partir d'un instantané périmé. Des clics sur des
  entités différentes restent traités en parallèle, sans attendre l'un l'autre.
- Ce sont des commandes internes du frontend HA, pas une API tierce officiellement
  garantie stable entre versions (à la différence des services) — en cas de souci
  après une mise à jour HA, comparer avec l'onglet réseau du navigateur pendant une
  édition de label manuelle depuis Réglages > Entités.
- Pas d'atténuation visuelle des lignes sans label actif — contrairement à Toggle
  Card, la ligne reste à pleine opacité qu'un label soit actif ou non.
- Personnalisation (panneau Customisation racine) : badge, icône des lignes (vide =
  icône du badge), fond de carte, couleur du nom, couleur des noms d'entité,
  écartement entre les entités (px), taille du nom de la carte, taille de l'icône du
  badge, taille des noms d'entité, taille des icônes d'entité (px, chacune séparée —
  ajuste indépendamment le texte/icône de l'en-tête et ceux des lignes). Le cadre
  arrondi autour de chaque icône suit automatiquement sa taille, pas besoin de le
  régler à part.

### Alex Switch Card

Même gabarit visuel qu'Alex Select Label Card (une ligne par entité, une puce par
valeur cliquable), mais pour basculer un `input_select` entre ses options plutôt que
poser des labels HA. Contrairement à Select Label Card, **une seule puce est active à
la fois par ligne** (un `input_select` n'a qu'un seul état) — pas de registre à
lire/écrire, pas de websocket dédié, pas de race à gérer : juste l'état natif de
l'entité (déjà réactif via `hass`) et le service natif `input_select.select_option`.

```yaml
type: custom:alex-switch-card
name: Mode
icon: mdi:swap-horizontal
entities:
  - entity: input_select.light_mode_salon
    name: Salon
  - entity: input_select.light_mode_chambre
    name: Chambre
```

- **Pas de section « Options »** : les puces d'une ligne sont générées directement à
  partir de l'attribut `options` de l'`input_select` de cette ligne (celui déjà
  configuré côté `input_select`, dans Réglages > Aides ou en YAML) — chaque entité
  peut donc avoir son propre jeu de valeurs, sans rien déclarer côté carte. Le nom
  affiché sur la puce est la valeur brute de l'option.
- **`chip_style`** (dans Customisation > Switch) : deux rendus possibles pour les
  puces d'une ligne.
  - `separate` (défaut) : puces indépendantes avec bordure, espacées.
  - `switch` : toutes les options d'une ligne regroupées dans un seul rail arrondi,
    sans bordure individuelle — vraiment l'aspect d'un interrupteur à plusieurs
    positions plutôt que des puces séparées.
- **`entities`** : même structure qu'Alex Select Label Card (entité, nom, icône,
  couleur d'icône optionnels par ligne), restreinte au domaine `input_select` dans le
  picker d'ajout et le champ entité du détail.
- Personnalisation regroupée en quatre sous-sections dans le panneau Customisation :
  - **Carte** : écartement entre les entités (px), couleur du badge, fond de carte.
  - **En-tête** : couleur du nom de la carte, taille du nom, taille de l'icône du
    badge.
  - **Entité** : icône des lignes (vide = icône du badge), couleur des noms
    d'entité, taille des noms d'entité, taille des icônes d'entité (le cadre autour
    de chaque icône suit automatiquement sa taille).
  - **Switch** : style de sélecteur (`separate`/`switch`), **taille du switch (px,
    défaut 12)** — un seul curseur fait varier ensemble le texte, le padding, les
    rayons d'arrondi et l'espacement des puces/du rail, pour réduire ou agrandir le
    switch dans son ensemble sans dérégler chaque dimension séparément —, couleur du
    texte actif, fond actif, couleur du texte inactif, fond inactif — un seul jeu de
    couleurs partagé par toutes les puces/segments de toutes les lignes de la carte
    (pas de couleur par valeur). Les valeurs par défaut diffèrent selon le style
    choisi :
    - `separate` : option active en fond plein `var(--primary-color)`, inactive
      transparente avec bordure — inchangé par rapport à avant.
    - `switch` : le rail (fond du groupe entier) porte la couleur « inactive »,
      teintée par défaut sur l'accent du thème ; l'option active flotte dessus comme
      une pastille contrastée (fond clair + légère ombre), les options inactives
      restent transparentes et laissent voir le rail — capsule entièrement arrondie,
      pas des boutons carrés collés les uns aux autres.

### Alex Input Card

Même gabarit visuel et même mécanisme qu'Alex Switch Card (dont elle est directement
issue par duplication du bloc — Switch Card reste intacte à côté, carte séparée le
temps de valider le nouveau comportement), généralisée à plusieurs types d'entrée
plutôt que seulement `input_select`. Le contrôle affiché par ligne dépend du **domaine**
de l'entité, détecté automatiquement — rien à configurer pour choisir le rendu :

- **`input_select` / `select`** → puces d'options (comportement d'origine de Switch
  Card, inchangé — mêmes styles `separate`/`switch`, mêmes couleurs/tailles). Un champ
  **« Options à masquer »** apparaît dans le détail de l'entité (liste à cocher, basée
  sur les options réelles de l'entité) pour retirer certaines valeurs de l'affichage
  sans y toucher côté `input_select` lui-même — utile pour un `input_select` partagé
  avec d'autres cartes/automatisations où seul un sous-ensemble des options a du sens
  ici.
- **`input_number` / `number`** → chiffre courant + boutons `−`/`+`, pas du `step` de
  l'entité (ou 1 par défaut), borné à `min`/`max`, arrondi au même nombre de décimales
  que le pas pour éviter les artefacts de virgule flottante (`0.1 + 0.2 =
  0.30000000000000004`).
- **`input_datetime`** → affiche l'heure (`HH:MM`) si l'entité en gère une, sinon la
  date ; boutons `−`/`+` qui avancent/reculent de 15 min par défaut (heure) ou 1 jour
  (date seule). Un champ **« Pas par clic (minutes) »** dans le détail de l'entité
  permet de choisir un autre pas (5 min, 1 min...) — uniquement pour les entités avec
  heure ; le pas des entités date-seule reste fixé à 1 jour, non configurable pour
  l'instant. Appelle `input_datetime.set_datetime` avec uniquement les champs que
  l'entité gère réellement (`date`/`time`).
- **`input_button` / `script`** → un seul bouton (icône ▶ pour un script, icône
  d'appui pour un `input_button`, par défaut) — `script.turn_on` ou `input_button.press`
  selon le domaine. Icône et texte personnalisables dans le détail de l'entité
  (**« Icône du bouton »**, **« Texte du bouton »**). L'icône par défaut du domaine ne
  s'applique que si ni l'icône ni le texte ne sont personnalisés — un texte
  personnalisé sans icône choisie reste texte seul (pas de retour à l'icône par
  défaut). Sans texte, le bouton reste une pastille ronde icône seule (comportement
  d'origine) ; avec un texte, il s'étire en pilule pour l'accueillir à côté de
  l'icône (ou seul, si aucune icône n'est définie).
- **`switch` / `automation` / `input_boolean`** → interrupteur on/off en pilule (même
  mécanique que les interrupteurs déjà utilisés ailleurs dans le bundle — une pastille
  qui glisse, pas une simple puce qui change de texte) — `turn_on`/`turn_off` du
  domaine natif de l'entité.
- **Autre domaine** → état affiché en lecture seule, aucun bouton — repli silencieux
  plutôt qu'une ligne cassée.

```yaml
type: custom:alex-input-card
name: Réglages
icon: mdi:tune-variant
entities:
  - entity: input_select.light_mode_salon
    name: Mode salon
    exclude: ["confort"]
  - entity: input_number.salon_luminosite
    name: Luminosité salon
  - entity: input_datetime.reveil
    name: Réveil
    step_minutes: 5
  - entity: script.bonne_nuit
    name: Bonne nuit
  - entity: switch.prise_salon
    name: Prise salon
```

- **`entities`** : mêmes champs qu'Alex Switch Card (entité, nom, icône, couleur
  d'icône optionnels par ligne), plus `exclude` (liste, `input_select`/`select`
  uniquement) et `step_minutes` (nombre, `input_datetime` uniquement) — le picker
  d'ajout et le champ entité du détail n'ont **pas** de restriction de domaine ici
  (contrairement à Switch Card, limitée à `input_select`), c'est justement l'objet de
  cette carte.
- **Icône par défaut par domaine** si ni l'entité ni la carte n'en précisent une (ex.
  `mdi:script-text-outline` pour un script, `mdi:toggle-switch-outline` pour un
  switch, `mdi:clock-outline` pour un input_datetime) — un indice visuel immédiat du
  type de contrôle affiché sur la ligne, sans rien à configurer.
- Le rail `−`/`+` (modes `input_number` et `input_datetime`) et l'interrupteur
  (`switch`/`automation`/`input_boolean`) reprennent toujours le style « switch » en
  pilule, quel que soit `chip_style` — ces modes n'ont pas de notion de « plusieurs
  choix indépendants » à afficher côte à côte, donc pas de variante `separate` pour
  eux. `chip_style` ne s'applique qu'aux lignes `input_select`/`select`.
- **Interaction sur la ligne** : la zone icône+nom de chaque ligne (à gauche, séparée
  du contrôle à droite qui garde sa propre interaction — sélection d'option,
  −/+, bouton, interrupteur) déclenche une **`tap_action`** configurable dans le
  détail de l'entité (même sélecteur d'action que les cartes natives HA — more-info,
  bascule, navigation, URL, appel de service...). **more-info** par défaut si rien
  n'est choisi.
- Personnalisation : identique à Alex Switch Card (mêmes sous-sections Carte /
  En-tête / Entité / **Contrôle** — renommée par rapport à « Switch » pour rester
  cohérente avec le fait que cette carte ne gère plus seulement des switches).

### Alex Tabs Card

Carte à onglets : chaque onglet monte n'importe quelle carte Lovelace (native ou
`custom:`, y compris les autres cartes `alex-*`) — construite pour remplacer les
cartes tierces (`simple-tabs`, `tabbed-card`, `tabdeck-card`) sur deux points qu'elles
ne couvrent pas : un vrai retour à la ligne de la barre quand il y a trop d'onglets
pour la largeur disponible, et un style « interrupteur à pilule glissante » identique
à celui d'Alex Switch Card.

```yaml
type: custom:alex-tabs-card
bar_style: switch
bar_position: top
wrap: true
swipe: true
tabs:
  - name: Salon
    icon: mdi:sofa-single
    cards:
      - type: custom:alex-select-label-card
        name: Salon
        # ... reste de la config, inchangé
  - name: Cuisine
    icon: mdi:countertop
    cards:
      - type: custom:alex-select-label-card
        name: Cuisine
        # ...
force_tab:
  - entity: input_boolean.mode_invite
    state: "on"
    tab: 1
```

- **`tabs`** (au moins un requis) : `name`, `icon` (les deux optionnels, mais au moins
  l'un des deux recommandé pour que l'onglet soit identifiable dans la barre), et
  `cards` — une **liste** de configs de carte Lovelace classiques (pas de limite de
  nombre), montées via `window.loadCardHelpers()` (l'API standard utilisée par
  `stack-in-card`/`conditional-card`/`auto-entities` pour créer dynamiquement
  n'importe quelle carte à partir de sa config). Plusieurs cartes sur un même onglet
  sont automatiquement empilées verticalement (`vertical-stack`) ; une seule ne l'est
  pas (pas d'empilement inutile). L'ancien champ singulier `card` (une seule carte par
  onglet) reste lu correctement pour la rétrocompatibilité, et est migré vers `cards`
  automatiquement dès que l'onglet est ouvert dans l'éditeur visuel.
  - **Éditable visuellement** dans l'éditeur : chaque carte de l'onglet apparaît comme
    une ligne dans une liste (comme les onglets eux-mêmes) — icône, type, flèches
    monter/descendre pour réordonner, crayon pour ouvrir son éditeur, poubelle pour la
    retirer. Le bouton **« + Ajouter une carte »** ouvre un sélecteur de type (cartes
    natives HA + toutes les cartes `custom:` installées, y compris les autres cartes
    `alex-*` — valeur libre acceptée si le type voulu n'est pas dans la liste), plus
    une entrée **« Manuel »** en tête de liste pour démarrer d'une config vide. Une
    fois le type choisi (ou « Manuel ») → l'éditeur natif HA de cette carte
    (`hui-card-element-editor`, le même composant que la boîte de dialogue « Modifier
    la carte » utilise en interne) : éditeur visuel si le type en a un, éditeur de
    code (YAML) sinon, avec le même bouton de bascule « Afficher l'éditeur de
    code »/« Afficher l'éditeur visuel » que partout ailleurs dans Home Assistant —
    « Manuel » démarre directement en éditeur de code, YAML libre, et bascule
    automatiquement vers l'éditeur visuel si le type que tu tapes en a un. Si ce
    composant ne s'avère pas disponible dans le contexte d'ouverture de cet éditeur
    (vérifié avant utilisation, avec un délai borné), repli automatique sur
    `getConfigElement()` (l'API publique et stable que toute carte Lovelace avec un
    éditeur visuel expose — la même que nos propres cartes utilisent), puis en tout
    dernier recours un textarea JSON brut si même ce repli échoue.
- **`bar_style`** : trois rendus pour la barre de navigation.
  - `chips` : puces indépendantes avec bordure, espacées (même style que le mode
    `separate` d'Alex Switch Card).
  - `switch` (défaut) : toutes les options regroupées dans un seul rail, l'onglet actif
    flotte dessus comme une pastille contrastée (même mécanique que le mode `switch`
    d'Alex Switch Card) — capsule complète (`border-radius` en pilule) si `wrap: false`
    garantit une seule ligne, rayon modéré sinon (reste correct visuellement que la
    barre tienne sur une ou plusieurs lignes).
  - `tabs` : style onglets soulignés, texte + trait sous l'onglet actif, sans fond ni
    bordure — le plus proche du rendu natif Home Assistant.
- **`bar_position`** : `top` (défaut) ou `bottom`. L'en-tête (nom/icône de la carte,
  optionnel) reste toujours en haut de la carte, indépendamment de la position choisie
  pour la barre d'onglets.
- **`bar_align`** : `left` (défaut), `center` ou `right` — alignement des boutons
  d'onglets dans la barre quand ils ne remplissent pas toute la largeur disponible.
  S'applique aux trois styles de barre.
- **`wrap`** (défaut `true`) : la barre passe sur plusieurs lignes si tous les onglets
  ne tiennent pas sur une seule — c'est le point qui manquait aux cartes tierces
  testées. À `false`, une seule ligne avec défilement horizontal.
- **`swipe`** (défaut `true`) : balaie à gauche/droite sur le contenu de l'onglet pour
  naviguer vers le suivant/précédent, sans repasser par la barre. `swipe_threshold`
  (px, défaut 50) règle la distance minimale du geste. Un élément portant l'attribut
  `data-no-swipe` dans la carte imbriquée désactive le geste au-dessus de lui (utile
  pour un slider ou tout contenu à défilement horizontal propre), même principe que
  `simple-tabs-card`.
- **`force_tab`** : liste de règles `{ entity, state, tab }` — bascule automatiquement
  vers l'onglet `tab` (index, 0 = premier onglet) quand `entity` **passe** à l'état
  `state`. Déclenchement sur front montant uniquement : si l'entité reste dans cet état,
  rien n'empêche de naviguer manuellement ailleurs ensuite — la règle ne « recolle » pas
  à chaque mise à jour de `hass`, seulement au moment où l'état change.
- Personnalisation, regroupée en sous-sections dans le panneau Customisation :
  **Carte** (fond, et **carte sans habillage** — voir juste en dessous), **En-tête**
  (couleur du badge, couleur et taille du nom, taille de l'icône du badge — n'apparaît
  que si `name` est renseigné), **Navigation** (style de barre, position, alignement,
  retour à la ligne, balayage et son seuil), **Barre d'onglets** (taille des onglets —
  même curseur unique proportionnel qu'Alex Switch Card —, couleur du texte actif,
  fond actif, couleur du texte inactif, fond inactif — un seul jeu de couleurs
  partagé, quel que soit le style de barre choisi).
- **`transparent`** (défaut `false`, dans Customisation > Carte) : retire le fond,
  l'ombre, la bordure arrondie et le padding intérieur de la carte — la barre
  d'onglets et le contenu occupent alors tout l'espace disponible, sans habillage de
  carte visible autour. `background` devient sans effet tant que ce réglage est actif.
  L'en-tête (nom/icône), s'il est renseigné, reste affiché — seul l'habillage de la
  carte elle-même disparaît.
- Chaque carte imbriquée n'est montée qu'à la première visite de son onglet (pas de
  préchargement de toutes les cartes au démarrage), puis reste montée (juste masquée)
  en changeant d'onglet — l'état interne (position de scroll, formulaire en cours...)
  n'est donc pas perdu en allant-venant entre onglets déjà visités. Changer d'onglet
  ne reconstruit pas non plus le reste de la carte (badge, barre) : seuls les deux
  boutons concernés changent d'état et l'affichage bascule entre les cartes déjà
  montées — évite le micro-délai d'un rechargement complet à chaque clic.

### Clock Card


Horloge et date, sans entité — se met à jour toute seule chaque seconde (indépendamment
des mises à jour de `hass`). La plus simple structurellement : pas de badge, pas de
liste, juste deux lignes de texte alignables.

```yaml
type: custom:alex-clock-card
show_time: true
show_date: true
alignment: left            # left / center / right
time_size: 34              # optionnel, taille de l'heure en px (défaut 34)
date_size: 14               # optionnel, taille de la date en px (défaut 14)
primary_color: [255, 255, 255]   # optionnel, couleur de l'heure
secondary_color: [150, 150, 150] # optionnel, couleur de la date
```

- `show_time`/`show_date` : chacun indépendamment affichable ou non.
- `alignment` : gauche / centre / droite, s'applique aux deux lignes.
- `time_size`/`date_size` : taille de chaque ligne en pixels.
- Personnalisation (panneau Customisation) : fond de la carte, couleur de l'heure
  (primary), couleur de la date (secondary) — pas de badge/icône ici, cette carte n'en a
  pas.
- Police : une pile de polices système modernes (SF Pro / Segoe UI / Roboto selon l'OS),
  en graisse fine (300 pour l'heure, 400 pour la date) plutôt qu'en gras, pour un rendu
  fin/arrondi proche des horloges natives des OS.
- La date est formatée dans la langue de l'interface HA (`hass.locale`, repli sur le
  français), au format « Jour J mois » (ex. « Mardi 16 septembre »). L'heure est
  affichée en 24 h.

### Media Player Card

Contrôle média complet : pochette, titre/artiste, lecture (précédent/lecture-pause/
suivant), volume. Prend en charge plusieurs lecteurs ; s'il y en a **plusieurs
actuellement actifs** (lecture ou pause), des onglets apparaissent en bas pour basculer
entre eux.

```yaml
type: custom:alex-media-player-card
entities:
  - entity: media_player.salon
    name: Salon                     # optionnel, sinon le nom convivial HA
  - entity: media_player.spotify
    name: Spotify Web
now_playing_label: "À l'écoute"   # optionnel, texte au-dessus du titre
accent_color: [255, 255, 255]     # optionnel, couleur du bouton lecture/volume/onglet actif
```

- **Sélection automatique** : si un seul lecteur configuré est actif, il s'affiche
  directement. S'il y en a plusieurs, le premier actif s'affiche par défaut ; les onglets
  permettent de choisir lequel afficher. La sélection est un état d'affichage (pas
  sauvegardé dans la config) : elle revient au comportement automatique après un
  rechargement de la page.
- **Onglets de bascule** : affichent le **nom du média** (le `name` personnalisé s'il est
  défini, sinon le nom convivial HA de l'entité) plutôt qu'une simple icône — crayon sur
  la ligne d'un lecteur dans l'éditeur pour le renommer.
- **Précédent/Suivant** appellent `media_player.media_previous_track`/`media_next_track`
  (changement de piste) — les icônes en chevrons doubles (rewind/fast-forward) restent un
  choix purement visuel (comme dans Spotify), pas un vrai rembobinage. Les trois boutons
  (précédent/lecture-pause/suivant) partagent désormais exactement le même style : même
  taille, même fond translucide, mêmes coins arrondis en carré — pas de bouton central
  mis en avant.
- **Lecture/Pause optimiste** : l'icône bascule immédiatement au clic, sans attendre la
  confirmation de HA. Utile avec les intégrations qui ne remontent l'état réel que par
  sondage (ex. Alexa Media Player, qui peut mettre plusieurs dizaines de secondes) — sans
  ça, le bouton semblerait ne rien faire pendant tout ce délai. L'affichage optimiste
  s'efface dès que l'état réel confirme le changement, ou après 8 secondes sinon.
- **Volume** : le curseur n'apparaît que si l'entité expose `volume_level` ; cliquer sur
  l'icône bascule le mute. Le service `volume_set` n'est appelé qu'au relâchement du
  curseur (pas en continu pendant le glissement), pour éviter de spammer l'entité.
- **Icône « cast »** en haut à droite : ouvre le more-info natif de HA sur le lecteur
  sélectionné (accès à la sélection de source, etc., sans réinventer ce sélecteur).
- **Pochette** agrandie (72×72px) pour rester lisible en avant-plan de la carte.
- La carte est divisée en **deux panneaux visuellement distincts** : le haut (pochette +
  infos du média) et le bas (transport, volume, onglets), chacun avec **son propre fond
  personnalisable** — même principe que le sous-panneau « Groupe » de la Light Card.
- Personnalisation, regroupée en sous-sections dans le panneau Customisation :
  **Fonds** (**fond de la section infos** — haut, vide = thème — et **fond de la
  section contrôles** — bas, vide = légère teinte automatique dérivée du thème),
  **Texte et accent** (couleur du titre, couleur de l'artiste/libellé/boutons de
  transport — primary —, couleur d'accent — curseur de volume + onglet actif
  uniquement).
- Rétrocompatible : une ancienne config avec `entities:` en simple liste de chaînes, ou
  avec l'ancien champ `background` (désormais `top_background`), reste valide.

### Server Card

Liste de serveurs/VM avec statut en ligne/hors ligne et bouton power qui bascule
directement l'entité associée. Pas de badge d'en-tête (juste un titre + compteur
« N/Total en ligne »), fidèle au gabarit `custom:button-card` fourni.

```yaml
type: custom:alex-server-card
name: Serveurs
servers:
  - name: Proxmox
    secondary: 192.168.1.10
    icon: mdi:server
    entity: switch.proxmox_power
  - name: Ubuntu Server
    secondary: 192.168.1.20
    icon: mdi:linux
    entity: switch.ubuntu_power
```

- Chaque serveur a son **nom**, son **sous-titre** (texte libre — typiquement une adresse
  IP, mais ce n'est pas contraint), son **icône**, et son **entité** (`switch` ou
  `input_boolean` de préférence — c'est cette entité qui détermine en ligne/hors ligne
  et que le bouton power bascule).
- Le sous-titre est un **champ texte libre**, pas une valeur dynamique lue depuis
  l'entité (contrairement à ce que suggérait le gabarit d'origine où l'IP était en dur) —
  à toi de le renseigner toi-même.
- Le bouton power appelle `homeassistant.toggle` sur l'entité du serveur (éteint si en
  ligne, allume si hors ligne).
- Personnalisation, regroupée en sous-sections dans le panneau Customisation :
  **Carte** (fond de la carte, couleur des noms de serveur/titre — primary —, couleur
  des adresses/compteur — secondary), **Statut** (couleur « en ligne » et couleur
  « hors ligne », appliquées au point de statut, au texte de statut, et à l'icône du
  bouton power) — une simplification par rapport aux 4 teintes distinctes du gabarit
  d'origine, pour rester sur le même nombre de champs que les autres cartes.

### Alex Gradient Card

Pilotage des segments de couleur des lampes/bandeaux à zones — Philips Hue Gradient ou
Aqara LED Strip T1 — via Zigbee2MQTT. Pas d'intégration tierce nécessaire, juste le
service natif `mqtt.publish` de Home Assistant (déjà disponible dès que Z2M tourne).
Les deux familles utilisent un **format de payload différent**, géré automatiquement
selon `device_type`.

```yaml
type: custom:alex-gradient-card
entity: light.chambre_bled
device_type: aqara             # hue / aqara
friendly_name: chambre_bled    # optionnel, vide = déduit de l'entité
segments: 5                    # repli si aucune entité longueur n'est resolvable
name: Bandeau Chambre
icon: mdi:led-strip-variant
```

- **Réglage à l'aveugle, assumé pour les deux types** : Zigbee2MQTT expose ces
  fonctionnalités en écriture seule — confirmé dans sa documentation officielle
  (« It's not possible to read (/get) this value »). La carte ne peut donc pas
  pré-remplir les sélecteurs de couleur avec ce qui est réellement affiché sur le
  bandeau ; ils partent toujours neutres (blanc) au chargement.
- **`device_type: hue`** — payload `{"gradient": ["#hex", ...]}`. Nombre de segments non
  limité par Z2M pour cette famille (`929002994901`, `929004610602`…) ; le champ
  `segments` reste utile pour choisir combien de couleurs envoyer (5 est une valeur
  courante pour la Lightstrip Gradient d'origine, à ajuster selon ton modèle).
- **`device_type: aqara`** — payload différent : `{"segment_colors": [{"segment": 1,
  "color": {"r":.., "g":.., "b":..}}, ...]}`. **Nombre de segments détecté
  automatiquement**, sans rien configurer en plus dans le cas courant : `length` est
  exposée par Z2M comme une **entité séparée** (`number.*`, parfois aussi un `sensor.*`
  désactivé par défaut) — jamais un attribut de l'entité lumière — mais son nom suit une
  convention fiable (`light.chambre_bled` → `number.chambre_bled_length`, confirmée en
  usage réel), donc la carte la déduit automatiquement de `entity`. Si ton entité ne
  suit pas cette convention (par exemple renommée manuellement côté HA), tu peux forcer
  l'entité longueur avec `length_entity: number.xxx` **directement en YAML** — ce champ
  n'apparaît pas dans l'éditeur visuel (cas rare, pour ne pas alourdir le formulaire),
  mais reste pris en compte s'il est présent dans la config, en priorité sur la
  déduction automatique. Sans entité résolvable (déduite ou explicite) ou si elle n'est
  pas lisible, repli sur `segments` réglé manuellement.
- **`friendly_name`** doit correspondre au nom convivial **Zigbee2MQTT** de l'appareil
  (celui utilisé dans le topic MQTT), pas nécessairement au nom de l'entité HA si tu
  l'as renommée séparément. Vide par défaut = déduit de l'attribut `friendly_name` de
  l'entité (HA le copie tel quel depuis la découverte MQTT Z2M, casse d'origine
  comprise), avec repli sur le dernier segment de l'entity_id si l'attribut est absent —
  ce dernier est « slugifié » par HA (tout en minuscules) et peut donc diverger du vrai
  nom Z2M dès que celui-ci contient de la casse mixte (ex. « Chambre_BLed » →
  entity_id `chambre_bled`, qui ne correspond plus au topic MQTT réel). Le bouton
  d'application appelle `mqtt.publish` sur `zigbee2mqtt/<nom_convivial>/set`.
- Un interrupteur dans l'en-tête permet d'allumer/éteindre la lumière elle-même
  (`homeassistant.toggle` sur l'entité configurée) — les segments n'ont de sens que
  lumière allumée.
- Les sélecteurs de couleur se répartissent sur plusieurs lignes de façon **équilibrée**
  au-delà de 6 segments (jamais un simple retour à la ligne façon `flex-wrap`, qui
  laisserait un reliquat difforme — ex. 11 puis 1 pour 12 segments). Le nombre de lignes
  nécessaires est calculé selon un maximum de 6 par ligne, puis le total est redistribué
  également entre ces lignes (12 segments → 6+6, 13 → 5+5+3, etc.).
- **Points d'édition ajustables** (boutons + Point / − Point, même principe que le panel
  Alex Gradient Studio) : édite moins de couleurs que le nombre réel de segments et laisse
  la carte réinterpoler le reste au moment d'appliquer — pratique pour un bandeau à
  beaucoup de segments (11+) sans avoir à régler chaque pastille individuellement. Borné
  entre 2 et le nombre réel de segments ; la réinterpolation (linéaire, par point) n'a
  lieu qu'au clic sur « Appliquer le dégradé », jamais pendant l'édition elle-même.
- Personnalisation, regroupée en sous-sections dans le panneau Customisation :
  **Carte** (couleur du badge, fond de la carte), **Texte et accent** (couleur du nom,
  couleur secondaire, couleur du bouton « Appliquer »/interrupteur actif).

### Alex Gradient Popup Card

Liste de bandeaux LED configurés — cliquer sur un bandeau ouvre une fenêtre avec une
roue chromatique où poser plusieurs points déplaçables pour composer son dégradé,
inspirée de l'éditeur de dégradé de l'app Philips Hue. Complète Alex Gradient Card
plutôt que la remplace : même mécanisme d'application (résolution du nom convivial
Z2M, nombre de segments effectif, appel `mqtt.publish` vers `zigbee2mqtt/<nom>/set`),
juste une autre façon de composer les couleurs en amont.

```yaml
type: custom:alex-gradient-popup-card
name: Bandeaux LED
icon: mdi:gradient-vertical
strips:
  - entity: light.chambre_bled
    name: Chambre
    device_type: aqara
  - entity: light.salon_gradient
    name: Salon
    device_type: hue
    segments: 7
```

- **Le mécanisme de la roue** : elle n'encode que la couleur (angle = teinte,
  distance au centre = saturation) — pas la position physique sur le bandeau. Le
  centre de la roue (saturation nulle) donne du blanc, pas du gris — les points
  utilisent toujours la pleine valeur (HSV), la saturation seule contrôle le mélange
  vers le blanc, exactement comme le dégradé radial affiché sur la roue elle-même.
  Chaque point est une couleur indépendante ; c'est son **ordre dans la liste sous la
  roue** (pas sa position sur la roue) qui détermine où il tombe sur le bandeau. Mode
  linéaire uniquement pour l'instant : les points se répartissent dans l'ordre sur le
  bandeau, l'interpolation entre eux est automatique (autres modes façon
  Mirrored/Scattered de Hue envisageables plus tard). 2 à 8 points par bandeau.
- **Aperçu du bandeau** : une barre sous la liste de points affiche en direct le
  dégradé tel qu'il apparaîtra sur le bandeau réel (couleurs + luminosité combinées),
  mise à jour à chaque déplacement de point ou changement de luminosité.
- **Luminosité partagée** : un seul curseur pour tout le dégradé, hors de la roue —
  comme chez Hue, qui ne l'encode jamais dans la roue elle-même. Préremplie avec la
  luminosité actuelle de la lumière à l'ouverture de la fenêtre. N'assombrit jamais les
  couleurs envoyées à l'appareil (toujours en pleine valeur) — c'est le champ
  `brightness` séparé du payload MQTT qui gère l'intensité, pour éviter un double
  assombrissement.
- **Interrupteur allumer/éteindre** en haut du contenu de la fenêtre, au-dessus de la
  roue — reste synchronisé si l'état change pendant que la fenêtre est ouverte (clic
  dessus ou changement ailleurs), pas seulement au moment du clic.
- **Aperçu en direct** (interrupteur dans la fenêtre, désactivé par défaut) :
  applique le dégradé au bandeau réel à chaque déplacement d'un point ou changement de
  luminosité (débit limité à un appel toutes les ~180 ms pendant qu'on glisse un
  point, pour ne pas noyer Zigbee2MQTT). Le bouton **Appliquer** reste disponible dans
  tous les cas, direct activé ou non — un envoi final explicite, garanti après
  n'importe quelle série de changements.
- Contrôles de la fenêtre stylés à la main (curseur de luminosité avec piste/curseur
  colorés à l'accent de la carte, interrupteurs pilule pour allumer/éteindre et
  l'aperçu en direct, bouton « Appliquer » rempli à l'accent, bouton « + Ajouter un
  point » en pilule) plutôt que les éléments par défaut du navigateur, cohérent avec
  le reste du bundle.
- **Rien n'est mémorisé d'une ouverture à l'autre** : chaque ouverture de la fenêtre
  repart d'un dégradé par défaut à 3 points (même principe « éphémère » que les points
  d'édition d'Alex Gradient Card — l'état n'a de sens qu'au moment d'appliquer). Si
  retrouver le dernier dégradé utilisé par bandeau devient gênant à l'usage, on peut
  ajouter une mémorisation locale au navigateur.
- **`strips`** (au moins un recommandé) : mêmes champs qu'Alex Gradient Card, par
  bandeau — `entity`, `device_type` (`hue` ou `aqara`), `friendly_name` (vide = déduit
  de l'entité), `segments` (ignoré pour l'Aqara si une longueur est détectée),
  `length_entity` (Aqara, vide = déduite du nom de l'entité), `name`, `icon`.
- Personnalisation, regroupée en sous-sections dans le panneau Customisation :
  **Carte** (écartement entre bandeaux, couleur du badge, fond de la carte),
  **En-tête** (couleur du nom de la carte), **Bandeaux** (couleur des noms de
  bandeau).
- **À vérifier en conditions réelles** : le dégradé et la luminosité partent dans le
  même envoi MQTT (`{ gradient: [...], brightness: ... }` ou l'équivalent
  `segment_colors` pour l'Aqara) — en partant du principe que Z2M accepte `brightness`
  dans la même charge utile `/set`, convention habituelle chez Z2M mais non confirmée
  pour ces deux appareils précis. Côté fenêtre, `ha-dialog` s'est révélé fiable pour un
  titre texte simple (`.heading`) et pour son contenu principal, mais **pas** pour
  glisser du contenu personnalisé dans son emplacement d'en-tête (`slot="heading"`) —
  resté invisible en pratique. L'interrupteur allumer/éteindre est donc placé dans le
  contenu principal plutôt que dans l'en-tête, pour rester sur la partie confirmée
  fiable du composant.

### Alex Gradient Scene Card

Liste et applique les scènes de dégradé enregistrées via l'intégration
**Alex Gradient Studio** (dépôt séparé, `custom_components/alex_gradient_studio`)
sur une lumière précise — l'équivalent d'un vrai bouton de scène, contrairement à
Alex Gradient Card qui sert à éditer/tester en direct.

```yaml
type: custom:alex-gradient-scene-card
entity: light.chambre_bled
device_type: aqara             # hue / aqara
friendly_name: ''              # optionnel, vide = déduit de l'attribut friendly_name de l'entité
name: Scènes bandeau chambre
icon: mdi:palette-swatch
```

Nécessite l'intégration Alex Gradient Studio installée et au moins une scène
enregistrée (depuis son panel, ou via le service `save_scene`) — sans elle, la
carte affiche un message plutôt que de planter. **Toute la logique** (détection
du nombre de segments, interpolation, format du payload Hue vs Aqara) vit côté
service Python `alex_gradient_studio.load_scene` ; la carte se contente de
lister les scènes disponibles (lues depuis `sensor.alex_gradient_studio_scenes`)
avec un aperçu visuel du dégradé, et d'appeler ce service au clic — aucune
duplication de logique entre la carte et l'intégration.

Personnalisation (panneau Customisation) : couleur du badge, fond de la carte,
couleur du nom, couleur des noms de scène.

### Alex Input Color

Réglage compact de luminosité, couleur RGB et température de blanc, organisé en
groupes (ex. « Matin », « Soir »...) — chaque groupe pilote un jeu d'entités
`input_number`/`input_text` de son choix, pas nécessairement les attributs natifs
d'une entité `light`.

```yaml
type: custom:alex-input-color
name: Ambiances
icon: mdi:palette
row_spacing: 6
groups:
  - name: Matin
    icon: mdi:weather-sunset-up
    brightness: input_number.matin_brightness
    color: input_text.matin_color
    white: input_number.matin_white
```

- **En-tête optionnel** (icône + nom de la carte, à l'image d'Alex Sensor Card) —
  n'apparaît que si `name` ou `icon` est renseigné au niveau de la carte.
- **Sélecteur de couleur RGB** : `<input type="color">` natif — un clic ouvre
  directement le sélecteur du système, sans étape intermédiaire.
- **Luminosité et température de blanc** : chacune embarque une vraie
  `custom:mushroom-number-card` (icône/nom masqués, valeur affichée via
  `secondary_info: state`, hauteur du curseur réduite à 22px) plutôt qu'un
  contrôle fait maison — la plage (min/max/step) vient entièrement de la
  configuration de l'entité `input_number` ciblée, **pas** d'un réglage de
  cette carte (mushroom-number-card ne permet pas de surcharger min/max
  depuis sa propre config). Pense à régler la bonne plage sur chaque aide
  `input_number` dans Réglages → Appareils et services → Aides.
- Le curseur de température de blanc affiche en fond un **dégradé
  orange → blanc** (orange = chaud/kelvin bas, blanc = froid/kelvin haut,
  saturation renforcée pour se rapprocher du rendu natif HA), pour repérer en
  un coup d'œil de quel côté on se rapproche — appliqué via `card_mod` avec
  sélecteur imbriqué (`mushroom-number-value-control$: mushroom-slider$:`),
  qui cible le curseur interne à travers les shadow DOM successifs de la
  carte mushroom. La propriété `background` est ciblée directement (pas la
  variable `--bg-color`) — plus fiable, indépendant de la propriété CSS
  interne réellement consommée par mushroom-slider. Si le sens te paraît
  inversé par rapport au min/max réel de ton entité, les deux couleurs
  s'échangent en une ligne dans `_createWhiteControl`.
- Le remplissage qui indique la valeur actuelle (`--main-color`, bleu du
  thème par défaut à l'origine) est en **gris semi-transparent** — reste
  nettement visible par-dessus n'importe quelle partie du dégradé (orange ou
  blanc) sans le recouvrir complètement.
- La sélection de couleur RGB (`<input type="color">`) ne déclenche plus de
  reconstruction de la carte pendant la sélection : l'entité `color` de
  chaque groupe est volontairement exclue de la détection de changement
  pertinent (contrairement à `brightness`/`white`) — la pastille affiche déjà
  sa propre valeur en direct nativement, la surveiller aurait provoqué un
  rebuild à chaque changement de couleur (puisque c'est justement ce qu'on
  vient de modifier), fermant le sélecteur natif du système en cours
  d'utilisation.
- La carte ne se reconstruit que lorsque sa config ou l'état d'une de ses
  entités change réellement (pas à chaque mise à jour de `hass` ailleurs dans
  la maison) — nécessaire pour que le sélecteur de couleur natif ne se ferme
  pas tout seul en cours de sélection.
- Personnalisation, regroupée en sous-sections dans le panneau Customisation :
  **Carte** (écartement entre les lignes en px, couleur du badge — aussi utilisée pour
  les icônes de chaque groupe —, fond de la carte), **En-tête** (couleur du nom de la
  carte), **Groupes** (couleur du texte des groupes).

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
