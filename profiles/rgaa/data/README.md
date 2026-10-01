# RGAA source data

`criteres-4.1.2.json` is the RGAA 4.1.2 criteria file exactly as the French government's digital accessibility team (DINUM) publishes it, copied byte for byte:

- Repository: <https://github.com/DISIC/accessibilite.numerique.gouv.fr>, file `RGAA/criteres.json`
- Commit: `ca4019f95073b6cbd2482a16e9f12b52d8de678d` (git blob `24e2149541e6fae6b0ac0c8eb92c36e43f991773`)
- Version: RGAA 4.1.2, the 4.1 criteria with the April 2023 errata applied (the repository's `src/ressources/notes-de-revision-4-1-2.md`)
- Licence: [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) (Etalab), per the repository's README. Attribution: « Référentiel général d’amélioration de l’accessibilité (RGAA) 4.1.2, DINUM ».

`profiles/rgaa/scripts/generate-map.js` turns it into `profiles/rgaa/map.js`. Never edit that file by hand: `profiles/rgaa/tests/map.test.js` regenerates it from this file and fails on any difference. To take a newer RGAA, add its file here and a version entry in the generator, then run `npm run rgaa-map`.
