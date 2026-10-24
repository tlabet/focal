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

Site statique servi par GitHub Pages depuis la branche `main` (racine) du dépôt perso
`github.com/tlabet/focal` : https://tlabet.github.io/focal/

- Mettre en ligne = `git push` (le dépôt local pousse sous le compte `tlabet` via un credential helper local).
- Pages a été activé une fois par l'API (`gh api -X POST repos/tlabet/focal/pages -f 'source[branch]=main' -f 'source[path]=/'`
  avec `GH_TOKEN=$(gh auth token --user tlabet)`). À défaut : Settings → Pages → Deploy from a branch → `main` / root.
- Après une modification, incrémenter `VERSION` dans `sw.js` pour que les appareils déjà installés rechargent la coquille.
