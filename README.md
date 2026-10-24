# Focal

Une chose à la fois : trois objectifs maximum, un focus du jour, des jalons, un check-in du soir
et une session de focus chronométrée. Web app installable (PWA) pensée pour l'iPhone.

Maquette d'origine : projet Claude Design « App focus objectifs iPhone » (`Focal.dc.html`).

## Stack

- HTML, CSS et JavaScript sans build ni dépendance.
- Données en `localStorage` sur l'appareil (objectifs, check-ins, minutes de focus, réglages).
- `manifest.webmanifest` + `sw.js` pour l'installation et le hors-ligne.
- Icônes générées par `tools/make-icons.py` (Pillow).

## Lancer en local

```bash
python3 -m http.server 8160 --directory .
```

Puis ouvrir http://localhost:8160/.

## Installer sur iPhone

1. Ouvrir l'URL publiée dans Safari.
2. Bouton Partager, puis « Sur l'écran d'accueil ».
3. L'app s'ouvre en plein écran, sans barre Safari, et fonctionne hors ligne.

## Déployer

Site statique : n'importe quel hébergement HTTPS convient. Le dépôt est servi par GitHub Pages
depuis la branche `main` (racine).

Après une modification, incrémenter `VERSION` dans `sw.js` pour que les appareils déjà installés
rechargent la coquille.
