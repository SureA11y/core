/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

module.exports = {
  img_altPresent_title: '<img> doit avoir un attribut alt',
  img_altPresent_description:
    'Vérifie que les éléments <img> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.',

  img_altPresent_summary_fail: 'Attribut alt manquant sur <img>.',
  img_altPresent_hint_fail:
    'Ajoutez un attribut alt (utilisez alt="" uniquement pour les images décoratives).',
  area_altPresent_title: '<area> doit avoir un attribut alt',
  area_altPresent_description:
    'Vérifie que les éléments <area> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.',
  area_altPresent_summary_fail: 'Attribut alt manquant sur <area>.',
  area_altPresent_hint_fail:
    'Ajoutez un attribut alt (utilisez alt="" uniquement pour les zones décoratives).',
  inputImage_altPresent_title: '<input type="image"> doit avoir un attribut alt',
  inputImage_altPresent_description:
    'Vérifie que les éléments <input type="image"> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.',
  inputImage_altPresent_summary_fail: 'Attribut alt manquant sur <input type="image">.',
  inputImage_altPresent_hint_fail:
    'Ajoutez un attribut alt (utilisez alt="" uniquement lorsqu’un nom accessible séparé est fourni).',
  inputImage_altPresent_summary_defaultName:
    "Le nom accessible est celui par defaut du navigateur pour un bouton image et n'apporte aucune information.",
  inputImage_altPresent_hint_defaultName:
    'Remplacez-le par un texte decrivant l action du bouton, par exemple "Rechercher".',
  inputImage_altPresent_summary_emptyAlt:
    'Un alt="" vide sur <input type="image"> laisse le controle sans nom.',
  inputImage_altPresent_hint_emptyAlt:
    'Decrivez l action dans alt, ou nommez le controle avec aria-label ou aria-labelledby.',
  ariaHidden_programmaticFocus_review_title: 'Vérifier le focus programmatique avec aria-hidden',
  ariaHidden_programmaticFocus_review_description:
    'Signale les éléments aria-hidden considérés comme éligibles uniquement via un focus programmatique (ex. tabindex < 0). Vérifiez l’intention de gestion du focus et l’exposition aux technologies d’assistance.',
  ariaHidden_programmaticFocus_review_summary:
    'Vérification : un élément aria-hidden est focusable de façon programmatique.',
  ariaHidden_programmaticFocus_review_hint:
    'Vérifiez que la gestion du focus est intentionnelle et que l’élément doit rester masqué aux technologies d’assistance.',
  canvas_textAltPresent_title: '<canvas> doit fournir une alternative textuelle',
  canvas_textAltPresent_description:
    'Vérifie que les éléments <canvas> fournissent une alternative textuelle via un contenu de repli ou un nom accessible.',
  canvas_textAltPresent_summary_fail: 'Alternative textuelle manquante pour <canvas>.',
  canvas_textAltPresent_hint_fail:
    'Fournissez un texte de repli dans <canvas> ou un nom accessible (par ex. aria-label/aria-labelledby).',
  svg_textAltPresent_title: '<svg> doit fournir une alternative textuelle',
  svg_textAltPresent_description:
    'Vérifie que les éléments <svg> en ligne fournissent une alternative textuelle via un élément <title> ou un nom ARIA (un élément <desc> seul ne suffit pas).',
  svg_textAltPresent_summary_fail: 'Alternative textuelle manquante pour <svg>.',
  svg_textAltPresent_hint_fail:
    'Fournissez un élément <title> avec du texte, ou un nom ARIA (aria-label/aria-labelledby) — un élément <desc> seul ne fournit pas de nom accessible.',
  object_textAltPresent_title: '<object> doit fournir une alternative textuelle',
  object_textAltPresent_description:
    'Vérifie que les éléments <object> fournissent une alternative textuelle via un contenu de repli ou un nom accessible.',
  object_textAltPresent_summary_fail: 'Alternative textuelle manquante pour <object>.',
  object_textAltPresent_hint_fail:
    'Fournissez un contenu de repli pertinent dans <object>, ajoutez un nom accessible (aria-label/aria-labelledby), ou utilisez un attribut title comme solution de repli.',
  embed_textAltPresent_title: '<embed> doit fournir une alternative textuelle',
  embed_textAltPresent_description:
    'Vérifie que les éléments <embed> fournissent une alternative textuelle via un nom accessible.',
  embed_textAltPresent_summary_fail: 'Alternative textuelle manquante pour <embed>.',
  embed_textAltPresent_hint_fail:
    'Ajoutez un nom accessible à <embed> (aria-label/aria-labelledby de préférence, ou un attribut title comme solution de repli).',
  img_altQuality_title: '<img> : texte alt à vérifier (revue manuelle)',
  img_altQuality_description:
    'Signale les éléments <img> dont l’attribut alt n’est pas vide afin de vérifier manuellement sa pertinence.',
  img_altQuality_summary_cantTell: 'Vérifiez le texte alt de <img> (exactitude et pertinence).',
  img_altQuality_hint_cantTell:
    'Assurez-vous que le texte alt exprime le but/l’information de l’image dans son contexte (ni redondant, ni nom de fichier).',
  img_altDecorative_title: '<img> avec alt="" : décoratif à confirmer (revue manuelle)',
  img_altDecorative_description:
    'Signale les éléments <img> dont l’attribut alt est vide afin de confirmer qu’ils sont purement décoratifs.',
  img_altDecorative_summary_cantTell: 'Vérifiez si <img> est décoratif (alt="").',
  img_altDecorative_hint_cantTell:
    'Confirmez que l’image est purement décorative. Sinon, fournissez un texte alt pertinent.',
  area_altQuality_title: '<area> : texte alt à vérifier (revue manuelle)',
  area_altQuality_description:
    'Signale les éléments <area> dont l’attribut alt n’est pas vide afin de vérifier manuellement sa pertinence.',
  area_altQuality_summary_cantTell: 'Vérifiez le texte alt de <area> (exactitude et pertinence).',
  area_altQuality_hint_cantTell:
    'Assurez-vous que le texte alt identifie la destination/l’action de la zone dans son contexte.',
  area_altDecorative_title: '<area> avec alt="" : décoratif à confirmer (revue manuelle)',
  area_altDecorative_description:
    'Signale les éléments <area> dont l’attribut alt est vide afin de confirmer qu’ils sont décoratifs ou non informatifs.',
  area_altDecorative_summary_cantTell: 'Vérifiez si <area> est décoratif (alt="").',
  area_altDecorative_hint_cantTell:
    'Confirmez que la zone n’a pas de fonction ni d’information. Sinon, fournissez un texte alt pertinent.',
  inputImage_altQuality_title: '<input type="image"> : texte alt à vérifier (revue manuelle)',
  inputImage_altQuality_description:
    'Signale les éléments <input type="image"> dont l’attribut alt n’est pas vide afin de vérifier manuellement sa pertinence.',
  inputImage_altQuality_summary_cantTell:
    'Vérifiez le texte alt de <input type="image"> (exactitude et pertinence).',
  inputImage_altQuality_hint_cantTell:
    'Assurez-vous que le texte alt décrit l’action du contrôle (ex. « Rechercher », « Envoyer ») dans son contexte.',
  inputImage_altDecorative_title: '<input type="image"> avec alt="" : à vérifier (revue manuelle)',
  inputImage_altDecorative_description:
    'Signale les éléments <input type="image"> dont l’attribut alt est vide afin de vérifier manuellement (souvent inadapté pour un contrôle fonctionnel).',
  inputImage_altDecorative_summary_cantTell: 'Vérifiez <input type="image"> avec alt="".',
  inputImage_altDecorative_hint_cantTell:
    'Ce contrôle est généralement fonctionnel. Confirmez qu’un nom accessible équivalent existe, sinon fournissez un texte alt pertinent.',
  canvas_textAltQuality_title: '<canvas> : alternative textuelle à vérifier (revue manuelle)',
  canvas_textAltQuality_description:
    'Signale les éléments <canvas> pour lesquels une alternative textuelle a été détectée, afin de vérifier manuellement son équivalence.',
  canvas_textAltQuality_summary_cantTell:
    'Vérifiez l’alternative textuelle de <canvas> (équivalence et pertinence).',
  canvas_textAltQuality_hint_cantTell:
    'Confirmez que le texte de secours ou le nom accessible transmet la même information/fonction que le contenu du canvas.',
  svg_textAltQuality_title: '<svg> : alternative textuelle à vérifier (revue manuelle)',
  svg_textAltQuality_description:
    'Signale les graphiques <svg> pour lesquels une alternative textuelle a été détectée, afin de vérifier manuellement sa pertinence.',
  svg_textAltQuality_summary_cantTell:
    'Vérifiez l’alternative textuelle de <svg> (exactitude et pertinence).',
  svg_textAltQuality_hint_cantTell:
    'Confirmez que <title>/<desc> ou le nom ARIA transmet le sens/le but du graphique dans son contexte.',
  object_textAltQuality_title: '<object> : alternative textuelle à vérifier (revue manuelle)',
  object_textAltQuality_description:
    'Signale les éléments <object> avec contenu de secours ou nom détecté, afin de vérifier manuellement l’équivalence.',
  object_textAltQuality_summary_cantTell:
    'Vérifiez l’alternative textuelle de <object> (équivalence et pertinence).',
  object_textAltQuality_hint_cantTell:
    'Confirmez que le contenu de secours ou le nom ARIA fournit une alternative équivalente au contenu embarqué.',
  embed_textAltQuality_title: '<embed> : alternative textuelle à vérifier (revue manuelle)',
  embed_textAltQuality_description:
    'Signale les éléments <embed> avec nom détecté, afin de vérifier manuellement sa pertinence.',
  embed_textAltQuality_summary_cantTell:
    'Vérifiez l’alternative textuelle de <embed> (exactitude et pertinence).',
  embed_textAltQuality_hint_cantTell:
    'Confirmez que le nom ARIA ou l’attribut title identifie correctement le contenu embarqué dans son contexte.',
  videoPoster_textAltPresent_title:
    'L’image poster de <video> doit avoir une alternative textuelle',
  videoPoster_textAltPresent_description:
    'Vérifie que les éléments <video> avec une image poster fournissent une alternative textuelle (nom accessible).',
  videoPoster_textAltPresent_summary_fail:
    'Alternative textuelle manquante pour l’image poster de <video>.',
  videoPoster_textAltPresent_hint_fail:
    'Fournissez un nom accessible pour l’image poster (aria-label/aria-labelledby de préférence, ou un attribut title comme solution de repli).',
  svgImage_textAltPresent_title: '<image> dans un SVG doit avoir une alternative textuelle',
  svgImage_textAltPresent_description:
    'Vérifie que les éléments SVG <image> fournissent une alternative textuelle via <title>/<desc> ou un nom accessible ARIA.',
  svgImage_textAltPresent_summary_fail: 'Alternative textuelle manquante sur <image> (SVG).',
  svgImage_textAltPresent_hint_fail:
    'Ajoutez un <title> (et éventuellement <desc>) dans <image>, ou fournissez aria-label/aria-labelledby.',
  formControl_programmaticLabelPresent_title:
    'Les contrôles de formulaire doivent avoir un libellé programmatique',
  formControl_programmaticLabelPresent_description:
    'Vérifie que les contrôles de formulaire ont un libellé programmatique via <label>, aria-label ou aria-labelledby.',
  formControl_programmaticLabelPresent_summary_fail:
    'Le contrôle de formulaire n’a pas de libellé programmatique.',
  formControl_programmaticLabelPresent_hint_fail:
    'Associez un <label>, ou utilisez aria-label / aria-labelledby (placeholder/title ne sont pas des libellés).',

  formControlAccessibleName_description:
    'Échec lorsqu’un contrôle de formulaire applicable n’a pas de nom accessible (ex. label, aria-label, aria-labelledby).',
  formControlAccessibleName_hint_fail:
    'Fournissez un nom accessible via un <label>, aria-label ou aria-labelledby.',
  formControlAccessibleName_summary_fail: 'Le contrôle de formulaire n’a pas de nom accessible.',
  formControlAccessibleName_title: 'Les champs de formulaire doivent avoir un nom accessible.',
  linksTargetBlankNoopener_description:
    'Échec lorsqu’un lien avec target="_blank" n’inclut pas rel="noopener" (risque de sécurité via window.opener).',
  linksTargetBlankNoopener_hint_cantTell:
    'Ajoutez rel="noopener" (et éventuellement noreferrer) aux liens avec target="_blank".',
  linksTargetBlankNoopener_summary_cantTell: 'Lien avec target="_blank" sans rel="noopener".',
  linksTargetBlankNoopener_title:
    'Les liens qui s’ouvrent dans un nouvel onglet doivent utiliser rel="noopener".',
  manualReview_description:
    'Cette règle renvoie toujours cantTell et nécessite une vérification manuelle.',
  manualReview_hint_cantTell:
    'Examinez la page et validez ce point manuellement selon le contexte.',
  manualReview_summary_cantTell: 'Vérification manuelle requise.',
  manualReview_title: 'Vérification manuelle requise.',
  'rules.img-alt-suspicious.meta.title': 'Texte alternatif suspect nécessitant une vérification',

  'rules.img-alt-suspicious.meta.description':
    'Identifie les images dont le texte alternatif correspond à des motifs suspects courants (nom de fichier, URL, texte fictif ou terme générique) et nécessite une vérification manuelle.',

  'rules.img-alt-suspicious.occurrence.cantTell.summary':
    'Le texte alternatif de l’image semble suspect (« {{alt}} » ressemble à {{pattern}}) et nécessite une vérification.',

  'rules.img-alt-suspicious.occurrence.cantTell.hint':
    'Vérifiez le texte alternatif. Évitez les noms de fichiers, les URL, les textes fictifs ou les termes génériques, et assurez-vous que l’alternative textuelle décrit la fonction ou le contenu de l’image dans son contexte.',
  formControl_programmaticLabelQuality_title:
    'Les champs de formulaire ne devraient pas dépendre du placeholder ou du title comme libellé principal',
  formControl_programmaticLabelQuality_description:
    'Signale les champs de formulaire dont le nom accessible est principalement dérivé du placeholder ou de l’attribut title. Préférez un <label> ou aria-labelledby.',
  formControl_programmaticLabelQuality_summary_cantTell:
    'Le libellé principal du champ provient de {{methodLabel}}.',
  formControl_programmaticLabelQuality_hint_cantTell:
    'Préférez un <label> persistant ou aria-labelledby. Évitez d’utiliser placeholder/title comme libellé principal.',

  html_lang_attr_title: 'La langue de la page est déclarée',
  html_lang_attr_description:
    'Vérifie que la langue par défaut de la page est déclarée de manière programmatique.',

  html_lang_attr_missing_absent: 'La langue par défaut de la page n’est pas déclarée.',
  html_lang_attr_hint_missing_absent:
    'Ajoutez un attribut lang à l’élément <html> (par exemple : <html lang="fr">).',

  html_lang_attr_missing_empty: 'La langue par défaut de la page est déclarée mais vide.',
  html_lang_attr_hint_missing_empty:
    'Renseignez une valeur de langue valide dans l’attribut lang de l’élément <html> (par exemple : <html lang="fr">).',

  html_lang_attr_invalid:
    'La langue par défaut de la page est déclarée, mais la valeur « {{lang}} » n’est pas une balise de langue valide.',
  html_lang_attr_hint_invalid:
    'Utilisez une balise de langue BCP 47 valide dans <html lang="…"> (par exemple : « fr », « en », « fr-FR »).',
  mediaTranscriptPresent_title:
    'Média temporel : preuve de transcription ou d’alternative textuelle',

  mediaTranscriptPresent_description:
    'Détecte les éléments audio et vidéo pour lesquels la présence d’une transcription ou d’une autre alternative textuelle n’est pas clairement établie dans le contenu de la page. Cette règle est volontairement conservatrice et retourne cantTell lorsque la preuve est absente ou invérifiable.',

  mediaTranscriptPresent_summary_cantTell_missing:
    'Aucune transcription ou autre alternative textuelle pour ce média temporel n’est clairement établie sur la page.',

  mediaTranscriptPresent_hint_cantTell_missing:
    'Fournir une transcription ou une autre alternative textuelle clairement identifiée pour les médias préenregistrés audio seuls ou vidéo seuls, par exemple une section ou un lien « Transcription » visible.',

  mediaTranscriptPresent_summary_cantTell_unverified:
    'Une transcription ou une autre alternative textuelle peut être disponible pour ce média temporel, mais elle n’a pas pu être vérifiée à partir du contenu de la page.',

  mediaTranscriptPresent_hint_cantTell_unverified:
    'Aucune transcription ou autre alternative textuelle pour cet élément {element} n’est clairement établie sur la page.',
  pageTitlePresent_title: 'La page possède un titre non vide',
  pageTitlePresent_description:
    'Vérifie que la page contient un élément <title> non vide permettant d’identifier la page.',

  pageTitlePresent_summary_fail: 'La page ne possède pas de titre non vide.',
  pageTitlePresent_hint_fail:
    'Ajouter un élément <title> contenant un texte décrivant le sujet ou l’objectif de la page.',
  pageTitlePatterns_title: 'Motifs de titres de page pouvant indiquer un manque de descriptivité',
  pageTitlePatterns_description:
    'Identifie des motifs de titres de page pouvant indiquer un manque de descriptivité, tels que des titres génériques, dupliqués ou excessivement modélisés. Cette règle fournit des signaux de revue et n’entraîne pas d’échec automatique.',

  pageTitlePatterns_summary_cantTell:
    'Le titre de la page peut ne pas être suffisamment descriptif pour identifier le sujet ou l’objectif de la page.',

  pageTitlePresent_summary_fail_missing: 'La page ne contient pas d’élément <title>.',
  pageTitlePresent_summary_fail_empty: 'La page contient un élément <title> vide.',

  pageTitlePatterns_summary_cantTell_duplicateAcrossPages:
    'Plusieurs pages partagent le même titre, ce qui peut rendre plus difficile la distinction entre les pages ({{duplicateGroups}} groupes dupliqués sur {{pagesAnalyzed}} pages). Exemple : « {{exampleTitle}} ».',

  pageTitlePatterns_summary_cantTell_templatedAcrossPages:
    'De nombreux titres de page semblent fortement modélisés, ce qui peut réduire la capacité des titres à distinguer les pages ({{pagesAnalyzed}} pages).',

  pageTitlePatterns_summary_cantTell_generic:
    'Le titre de la page est générique et peut ne pas identifier le sujet ou l’objectif de la page.',

  pageTitlePatterns_summary_cantTell_veryShort:
    'Le titre de la page est très court et peut ne pas identifier le sujet ou l’objectif de la page.',

  pageTitlePatterns_summary_cantTell_templateLike:
    'Le titre de la page semble modélisé et peut ne pas identifier le sujet ou l’objectif de la page.',

  // Un seul conseil pour tous les cas
  pageTitlePatterns_hint_cantTell:
    'Vérifier que le titre de la page identifie clairement le sujet ou l’objectif de la page et permet de la distinguer des autres pages.',

  // --- Contraste DOM : calculabilité (porte d’entrée)
  contrastComputable_title: 'Le contraste des couleurs est calculable pour le texte rendu',
  contrastComputable_description:
    'Détermine si suffisamment d’informations sont disponibles pour calculer le contraste WCAG du texte visible (ex. pas de dégradés/images/modes de fusion rendant l’arrière-plan indéterminé).',

  contrastComputable_pass_allComputable:
    'Le contraste est calculable pour tout le texte éligible ({{eligibleTextCount}} nœud(s) de texte).',

  contrastComputable_cantTell_generic: 'Le contraste peut ne pas être calculable ({{reasonCode}}).',

  contrastComputable_cantTell_bgImageOrGradient:
    'Le contraste n’est pas calculable car l’arrière-plan utilise une image ou un dégradé ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgImage:
    'Le contraste ne peut pas être calculé car l’arrière-plan utilise une image ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgGradient:
    'Le contraste ne peut pas être calculé car l’arrière-plan utilise un dégradé ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgImageAndGradient:
    'Le contraste ne peut pas être calculé car l’arrière-plan utilise une image et un dégradé ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_mixBlendMode:
    'Le contraste n’est pas calculable car mix-blend-mode est utilisé ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_filter:
    'Le contraste ne peut pas être calculé car la propriété filter est utilisée ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_rootNotOpaque:
    'Le contraste n’est pas calculable car l’arrière-plan effectif n’est pas totalement opaque à la racine (alpha={{backgroundAlpha}}).',

  contrastComputable_cantTell_foregroundUnparsable:
    'Le contraste n’est pas calculable car la couleur de premier plan calculée n’a pas pu être analysée.',

  contrastComputable_cantTell_engineFailure:
    'La calculabilité du contraste n’a pas pu être déterminée en raison d’une erreur interne du moteur ({{reasonCode}}).',

  contrastComputable_cantTell_backdropFilter:
    'Le contraste ne peut pas être calculé car la propriété backdrop-filter est utilisée ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_filterOrBackdropFilter:
    'Le contraste ne peut pas être calculé car une propriété filter ou backdrop-filter est utilisée ({{blockerProperty}}={{blockerValue}}).',

  // --- Contraste DOM : minimum AA (1.4.3)
  contrastMinimum_title: 'Le texte respecte le contraste minimum (AA)',
  contrastMinimum_description:
    'Vérifie que le texte visible atteint un ratio de contraste d’au moins 4,5:1 (texte normal) ou 3,0:1 (grand texte), lorsque le contraste est calculable à partir du CSS.',

  contrastMinimum_fail_belowThreshold:
    'L’élément présente un contraste de couleur insuffisant de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).',

  contrastMinimum_pass_allAboveThreshold:
    'Tout le texte calculable respecte le contraste minimum (AA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.',

  contrastMinimum_notApplicable_noComputableText:
    'Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.',

  contrastMinimum_cantTell_engineFailure:
    'Le contraste minimum (AA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).',

  // --- Contraste DOM : renforcé AAA (1.4.6)
  contrastEnhanced_title: 'Le texte respecte le contraste renforcé (AAA)',
  contrastEnhanced_description:
    'Vérifie que le texte visible atteint un ratio de contraste d’au moins 7,0:1 (texte normal) ou 4,5:1 (grand texte), lorsque le contraste est calculable à partir du CSS.',

  contrastEnhanced_fail_belowThreshold:
    'L’élément présente un contraste de couleur insuffisant renforcé (AAA) de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).',

  contrastEnhanced_pass_allAboveThreshold:
    'Tout le texte calculable respecte le contraste renforcé (AAA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.',

  contrastEnhanced_notApplicable_noComputableText:
    'Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.',

  contrastEnhanced_cantTell_engineFailure:
    'Le contraste renforcé (AAA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).',

  // --- 1) Contraste du texte (Minimum) — WCAG 1.4.3 (AA)
  dom_textContrastMinimum_title: 'Le texte doit avoir un contraste suffisant (minimum)',
  dom_textContrastMinimum_description:
    'Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.3 (AA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.',

  dom_textContrastMinimum_summary_fail:
    'Contraste de texte insuffisant : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.',
  dom_textContrastMinimum_hint_fail:
    'Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour cette taille/épaisseur de texte.',

  dom_textContrastMinimum_summary_pass:
    'Contraste de texte conforme : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.',

  dom_textContrastMinimum_summary_cantTell:
    'Impossible de calculer fiablement le contraste du texte car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).',
  dom_textContrastMinimum_hint_cantTell:
    'Vérifiez manuellement le contraste lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.',

  // --- 2) Contraste du texte (Renforcé) — WCAG 1.4.6 (AAA)
  dom_textContrastEnhanced_title: 'Le texte doit avoir un contraste suffisant (renforcé)',
  dom_textContrastEnhanced_description:
    'Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.6 (AAA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.',

  dom_textContrastEnhanced_summary_fail:
    'Contraste de texte renforcé insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.',
  dom_textContrastEnhanced_hint_fail:
    'Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour le niveau renforcé (AAA).',

  dom_textContrastEnhanced_summary_pass:
    'Contraste de texte renforcé conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.',

  dom_textContrastEnhanced_summary_cantTell:
    'Impossible de calculer fiablement le contraste renforcé car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).',
  dom_textContrastEnhanced_hint_cantTell:
    'Vérifiez manuellement le contraste renforcé (AAA) lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.',

  // --- 3) Contraste non-textuel — WCAG 1.4.11 (AA)
  dom_nonTextContrast_title:
    'Les composants d’interface et les graphiques doivent avoir un contraste suffisant',
  dom_nonTextContrast_description:
    'Vérifie le contraste des informations visuelles non textuelles (contours de composants, états, et objets graphiques porteurs d’information) selon WCAG 2.2 SC 1.4.11 (AA).',

  dom_nonTextContrast_summary_fail:
    'Contraste non-textuel insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.',
  dom_nonTextContrast_hint_fail:
    'Ajustez les couleurs du composant/graphique afin d’atteindre au moins {{requiredRatio}}:1 pour le contour perceptible ou l’information visuelle essentielle.',

  dom_nonTextContrast_summary_pass:
    'Contraste non-textuel conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.',

  dom_nonTextContrast_summary_cantTell:
    'Impossible de calculer fiablement le contraste non-textuel car l’arrière-plan effectif ou les pixels peints ne sont pas déterminables (ex. image/dégradé/vidéo/canvas, transparence ou fusion complexes).',
  dom_nonTextContrast_hint_cantTell:
    'Vérifiez manuellement le contraste du composant/graphique par rapport aux couleurs adjacentes ; assurez-vous qu’il respecte {{requiredRatio}}:1 pour l’information visuelle non textuelle essentielle.',
  contrastEnhanced_pass_allTextMeetsThreshold:
    'Tout le texte calculable respecte le contraste renforcé (AAA).',
  contrastMinimum_pass_allTextMeetsThreshold:
    'Tout le texte calculable respecte le contraste minimum (AA).',

  contrastComputable_cantTell_notComputable:
    'Le contraste ne peut pas être calculé pour ce texte ({{reasonCode}}).',

  roleImg_textAlternativePresent_title:
    'Les éléments avec role="img" doivent avoir une alternative textuelle accessible',

  roleImg_textAlternativePresent_description:
    'Vérifie que les éléments ayant le rôle "img" fournissent une alternative textuelle accessible via aria-label ou aria-labelledby.',

  // Résumé d’échec & aide
  roleImg_textAlternativePresent_summary_fail:
    'L’élément avec le rôle "img" ne possède pas d’alternative textuelle accessible.',

  roleImg_textAlternativePresent_hint_fail:
    'Fournissez une alternative textuelle à l’aide de aria-label ou de aria-labelledby pointant vers un texte non vide.',

  // --- Taille de la cible (minimum) — WCAG 2.5.8 (AA)
  targetSizeMinimum_title: 'Les cibles activables au pointeur respectent la taille minimale (AA)',
  targetSizeMinimum_description:
    'Vérifie que les cibles activables au pointeur ont une zone cliquable effective d’au moins 24×24 pixels CSS, ou respectent une exception autorisée (par ex. un espacement suffisant).',

  targetSizeMinimum_summary_fail:
    'La cible est plus petite que 24×24 px CSS et est trop proche d’une autre cible.',
  targetSizeMinimum_hint_fail:
    'Augmentez la taille de la cible à au moins 24×24 px CSS, ou ajoutez un espacement suffisant par rapport aux cibles voisines.',
  targetSizeMinimum_summary_cantTell_ambiguousSpacing:
    'La cible est peut-être trop petite et trop proche d’une autre cible, mais le chevauchement est proche du seuil de détection et n’a pas pu être mesuré avec certitude.',
  targetSizeMinimum_hint_cantTell_ambiguousSpacing:
    'Vérifiez manuellement l’espacement effectif entre cette cible et sa voisine ; augmentez la taille de la cible ou l’espacement si le chevauchement est réel.',
  targetSizeMinimum_summary_cantTell_plausiblyEssential:
    'La cible est trop petite et trop proche d’une autre cible, mais pourrait être exemptée en tant qu’élément essentiel d’une zone graphique ou d’une image cliquable.',
  targetSizeMinimum_hint_cantTell_plausiblyEssential:
    'Vérifiez si la taille de cette cible est réellement essentielle à sa fonction (par ex. partie d’un SVG/canvas/plan d’image) ; sinon, augmentez la taille de la cible ou l’espacement.',
  targetSizeMinimum_summary_cantTell_inlineLinkRun:
    'La cible est plus petite que 24×24 px CSS et proche d’un autre lien en ligne dans le même texte, où l’exception de contenu en ligne peut s’appliquer.',
  targetSizeMinimum_hint_cantTell_inlineLinkRun:
    'Confirmez si ces liens font partie d’un texte en ligne (qui est exempté) ; sinon, augmentez la taille de la cible à au moins 24×24 px CSS ou ajoutez de l’espacement.',

  targetSizeMinimum_notApplicable_noTargets:
    'Aucune cible activable par pointeur n’était éligible à l’évaluation.',
  targetSizeMinimum_pass_allOk:
    'Toutes les cibles activables par pointeur respectent la taille minimale ou une exception autorisée.',

  // --- aria-hidden-focus
  ariaHidden_focus_title: 'Les éléments aria-hidden ne doivent pas être focalisables',
  ariaHidden_focus_description:
    'Vérifie que les éléments avec aria-hidden="true" ne sont pas focalisables et ne contiennent pas d’éléments focalisables.',

  ariaHidden_focus_summary_fail_desc:
    'L’élément aria-hidden {{element}} contient {{focusableCount}} élément(s) focalisable(s).',
  ariaHidden_focus_summary_fail_self:
    'L’élément aria-hidden {{element}} est focalisable ({{focusableCount}} élément(s) focalisable(s)).',
  ariaHidden_focus_summary_fail_self_and_desc:
    'L’élément aria-hidden {{element}} est focalisable et contient {{descendantFocusableCount}} descendant(s) focalisable(s) ({{focusableCount}} élément(s) focalisable(s) au total).',

  ariaHidden_focus_hint_fail:
    'Supprimez la focalisation des descendants ou retirez aria-hidden ; assurez la cohérence entre l’ordre de focus et l’arbre d’accessibilité.',
  ariaHidden_focus_summary_cantTell_redirect:
    'L’élément aria-hidden {{element}} reçoit le focus mais le focus est immédiatement déplacé vers un autre élément. Vérifiez le comportement de sentinelle/piège de focus.',
  ariaHidden_focus_hint_cantTell_redirect:
    'Vérifiez qu’il s’agit d’un transfert intentionnel de sentinelle/piège de focus et que les utilisateurs clavier ne restent jamais sur une cible de focus masquée.',
  ariaHidden_focus_summary_cantTell_modal:
    'L’élément aria-hidden {{element}} contient {{focusableCount}} élément(s) focalisable(s) alors qu’une boîte de dialogue modale est ouverte. Si la modale conserve le focus clavier piégé, ils peuvent être inaccessibles ; vérifiez que le focus ne peut pas les atteindre.',
  ariaHidden_focus_hint_cantTell_modal:
    'Une boîte de dialogue modale semble ouverte. Préférez rendre l’arrière-plan inerte (ou un <dialog> natif ouvert avec showModal()) afin qu’il quitte l’ordre de tabulation, puis vérifiez que le focus clavier reste dans la boîte de dialogue.',

  // --- css-hidden-focus
  cssHidden_focus_title: 'Les éléments focalisables ne doivent pas être masqués visuellement',
  cssHidden_focus_description:
    'Vérifie que les éléments focalisables au clavier ne sont pas masqués visuellement par des techniques CSS pouvant les laisser dans l’ordre de tabulation.',

  cssHidden_focus_summary_cantTell:
    'L’élément focalisable {{element}} est masqué visuellement ({{visibilityHints}}).',
  cssHidden_focus_hint_cantTell:
    'Rendez l’élément visible lorsqu’il peut recevoir le focus clavier, ou retirez-le de l’ordre de tabulation tant qu’il n’est pas visible.',

  linkNamePresent_title: 'Les liens ont un nom accessible',
  linkNamePresent_description: 'Vérifie que les liens exposent un nom accessible non vide.',
  linkNamePresent_summary_fail: 'Ce lien n’a pas de nom accessible.',
  linkNamePresent_hint_fail:
    'Fournissez un texte de lien ou un mécanisme de nom accessible (par exemple aria-label) afin que les technologies d’assistance puissent identifier le lien.',
  buttonNamePresent_title: 'Les boutons ont un nom accessible',
  buttonNamePresent_description: 'Vérifie que les boutons exposent un nom accessible non vide.',
  buttonNamePresent_summary_fail: 'Ce bouton n’a pas de nom accessible.',
  buttonNamePresent_hint_fail:
    'Fournissez un texte visible pour le bouton ou un mécanisme de nom accessible (par exemple aria-label) afin que les technologies d’assistance puissent identifier le bouton.',

  binaryControlNamePresent_title: 'Les contrôles binaires ont un nom accessible',
  binaryControlNamePresent_description:
    'Vérifie que les cases à cocher, les boutons radio et les interrupteurs exposent un nom accessible non vide.',
  binaryControlNamePresent_summary_fail: 'Ce contrôle n’a pas de nom accessible.',
  binaryControlNamePresent_hint_fail:
    'Fournissez un libellé, aria-label, aria-labelledby ou un autre mécanisme de nom accessible afin que les technologies d’assistance puissent identifier le contrôle.',
  comboboxNamePresent_title: 'Les listes déroulantes (combobox) ont un nom accessible',
  comboboxNamePresent_description:
    'Vérifie que les éléments avec role="combobox" exposent un nom accessible non vide.',
  comboboxNamePresent_summary_fail: 'Cette combobox n’a pas de nom accessible.',
  comboboxNamePresent_hint_fail:
    'Fournissez aria-label, aria-labelledby ou un attribut title — le contenu textuel visible n’est pas exposé comme nom accessible de cet élément.',
  dialogNamePresent_title: 'Les dialogues ont un nom accessible',
  dialogNamePresent_description:
    'Vérifie que les éléments avec role="dialog" ou role="alertdialog" exposent un nom accessible non vide.',
  dialogNamePresent_summary_fail: 'Ce dialogue n’a pas de nom accessible.',
  dialogNamePresent_hint_fail:
    'Fournissez aria-labelledby (préféré) ou aria-label afin que les technologies d’assistance puissent annoncer le dialogue.',
  menuitemNamePresent_title: 'Les éléments de menu ont un nom accessible',
  menuitemNamePresent_description:
    'Vérifie que les éléments de menu (role="menuitem*", y compris les variantes case à cocher/radio) exposent un nom accessible non vide.',
  menuitemNamePresent_summary_fail: 'Cet élément de menu n’a pas de nom accessible.',
  menuitemNamePresent_hint_fail:
    'Fournissez un texte visible qui n’est pas masqué aux technologies d’assistance, ou fournissez aria-label ou aria-labelledby.',
  tabNamePresent_title: 'Les onglets ont un nom accessible',
  tabNamePresent_description:
    'Vérifie que les éléments avec role="tab" exposent un nom accessible non vide.',
  tabNamePresent_summary_fail: 'Cet onglet n’a pas de nom accessible.',
  tabNamePresent_hint_fail:
    'Fournissez un texte d’onglet qui n’est pas masqué aux technologies d’assistance, ou fournissez aria-label ou aria-labelledby.',
  sliderNamePresent_title: 'Les curseurs ont un nom accessible',
  sliderNamePresent_description:
    'Vérifie que les curseurs (input[type="range"] et role="slider") exposent un nom accessible non vide.',
  sliderNamePresent_summary_fail: 'Ce curseur n’a pas de nom accessible.',
  sliderNamePresent_hint_fail:
    'Fournissez un libellé, aria-label ou aria-labelledby afin que les technologies d’assistance puissent identifier le curseur.',
  textboxNamePresent_title: 'Les champs de texte ont un nom accessible',
  textboxNamePresent_description:
    'Vérifie que les éléments avec role="textbox" exposent un nom accessible non vide.',
  textboxNamePresent_summary_fail: 'Ce champ de texte n’a pas de nom accessible.',
  textboxNamePresent_hint_fail:
    'Fournissez aria-label, aria-labelledby ou un attribut title — le contenu textuel visible n’est pas exposé comme nom accessible de ce champ de texte.',
  searchboxNamePresent_title: 'Les champs de recherche ont un nom accessible',
  searchboxNamePresent_description:
    'Vérifie que les éléments avec role="searchbox" exposent un nom accessible non vide.',
  searchboxNamePresent_summary_fail: 'Ce champ de recherche n’a pas de nom accessible.',
  searchboxNamePresent_hint_fail:
    'Fournissez aria-label, aria-labelledby ou un attribut title — le contenu textuel visible n’est pas exposé comme nom accessible de ce champ de recherche.',
  spinbuttonNamePresent_title: 'Les sélecteurs numériques (spinbutton) ont un nom accessible',
  spinbuttonNamePresent_description:
    'Vérifie que les éléments avec role="spinbutton" exposent un nom accessible non vide.',
  spinbuttonNamePresent_summary_fail: 'Ce spinbutton n’a pas de nom accessible.',
  spinbuttonNamePresent_hint_fail:
    'Fournissez aria-label, aria-labelledby ou un attribut title — le contenu textuel visible n’est pas exposé comme nom accessible de ce spinbutton.',
  listboxNamePresent_title: 'Les listes (listbox) ont un nom accessible',
  listboxNamePresent_description:
    'Vérifie que les éléments avec role="listbox" exposent un nom accessible non vide.',
  listboxNamePresent_summary_fail: 'Cette listbox n’a pas de nom accessible.',
  listboxNamePresent_hint_fail:
    'Fournissez aria-label, aria-labelledby ou un attribut title — le contenu textuel visible n’est pas exposé comme nom accessible de cette listbox.',
  optionNamePresent_title: 'Les options ont un nom accessible',
  optionNamePresent_description:
    'Vérifie que les éléments avec role="option" exposent un nom accessible non vide.',
  optionNamePresent_summary_fail: 'Cette option n’a pas de nom accessible.',
  optionNamePresent_hint_fail:
    'Fournissez un texte d’option qui n’est pas masqué aux technologies d’assistance, ou fournissez aria-label ou aria-labelledby.',
  treeitemNamePresent_title: 'Les éléments d’arborescence ont un nom accessible',
  treeitemNamePresent_description:
    'Vérifie que les éléments avec role="treeitem" exposent un nom accessible non vide.',
  treeitemNamePresent_summary_fail: 'Cet élément d’arborescence n’a pas de nom accessible.',
  treeitemNamePresent_hint_fail:
    'Fournissez un texte d’élément d’arborescence qui n’est pas masqué aux technologies d’assistance, ou fournissez aria-label ou aria-labelledby.',
  ariaRoleNamePresent_title: 'Les rôles ARIA de type widget/conteneur ont un nom accessible',
  ariaRoleNamePresent_description:
    'Vérifie que certains rôles ARIA de type widget/conteneur exposent un nom accessible non vide.',
  ariaRoleNamePresent_summary_fail: 'Cet élément n’a pas de nom accessible.',
  ariaRoleNamePresent_hint_fail:
    'Fournissez aria-label ou aria-labelledby (préféré), ou un attribut title non vide.',

  /* =========================
   * Résumé des règles composites
   * ========================= */
  composite_rollup_summary:
    'Résultat de la règle composite : {{reasonCode}} ({{testCount}} contrôles)',

  /* =========================
   * WCAG 1.1.1 – Contenu non textuel
   * ========================= */
  'catalog.rules.wcag_111_non_text_content.title': 'Contenu non textuel : alternatives textuelles',
  'catalog.rules.wcag_111_non_text_content.description':
    'Regroupe les contrôles garantissant que le contenu non textuel dispose d’une alternative textuelle appropriée.',

  /* =========================
   * WCAG 1.2.1 – Audio seul / Vidéo seule
   * ========================= */
  'catalog.rules.wcag_121_prerecorded_transcript.title':
    'Audio seul et vidéo seule (préenregistrés) : transcription',
  'catalog.rules.wcag_121_prerecorded_transcript.description':
    'Regroupe les contrôles vérifiant la disponibilité d’une transcription pour les médias audio seuls ou vidéo seuls préenregistrés.',

  /* =========================
   * WCAG 1.4.3 – Contraste (minimum)
   * ========================= */
  'catalog.rules.wcag_143_contrast_minimum.title': 'Contraste : minimum',
  'catalog.rules.wcag_143_contrast_minimum.description':
    'Regroupe les contrôles relatifs au contraste minimal du texte.',

  /* =========================
   * WCAG 1.4.6 – Contraste (renforcé)
   * ========================= */
  'catalog.rules.wcag_146_contrast_enhanced.title': 'Contraste : renforcé',
  'catalog.rules.wcag_146_contrast_enhanced.description':
    'Regroupe les contrôles relatifs au contraste renforcé du texte.',

  /* =========================
   * WCAG 2.4.2 – Page titrée
   * ========================= */
  'catalog.rules.wcag_242_page_titled.title': 'Page titrée',
  'catalog.rules.wcag_242_page_titled.description':
    'Regroupe les contrôles garantissant que les documents possèdent un titre de page pertinent.',

  /* =========================
   * WCAG 2.4.7 – Focus visible
   * ========================= */
  'catalog.rules.wcag_247_focus_visible.title': 'Focus visible',
  'catalog.rules.wcag_247_focus_visible.description':
    'Regroupe les contrôles garantissant que le focus clavier n’est pas masqué et reste perceptible.',

  /* =========================
   * WCAG 2.5.8 – Taille de la cible (minimum)
   * ========================= */
  'catalog.rules.wcag_258_target_size_minimum.title': 'Taille de la cible : minimum',
  'catalog.rules.wcag_258_target_size_minimum.description':
    'Regroupe les contrôles garantissant que les cibles de pointage respectent les dimensions minimales requises.',

  /* =========================
   * WCAG 3.1.1 – Langue de la page
   * ========================= */
  'catalog.rules.wcag_311_language_of_page.title': 'Langue de la page',
  'catalog.rules.wcag_311_language_of_page.description':
    'Regroupe les contrôles garantissant que la langue de la page est spécifiée.',

  /* =========================
   * WCAG 4.1.2 – Nom, rôle, valeur
   * ========================= */
  'catalog.rules.wcag_412_name.title': 'Nom, rôle, valeur : nom accessible',
  'catalog.rules.wcag_412_name.description':
    'Regroupe les contrôles garantissant que les éléments interactifs courants exposent un nom accessible non vide.',
  labelInName_title: 'Intitulé dans le nom : le nom accessible contient le texte visible',
  labelInName_description:
    'Vérifie que lorsqu’un composant possède un libellé textuel visible, le nom accessible contient ce libellé visible (WCAG 2.5.3).',
  labelInName_summary_fail:
    '{{element}} : le libellé visible « {{visibleLabel}} » (source : {{labelSource}}) n’est pas inclus dans le nom accessible (source : {{nameMechanism}}).',
  labelInName_hint_fail:
    'Modifiez aria-label ou aria-labelledby (ou le texte du libellé visible) afin que le nom accessible inclue le libellé visible.',
  labelInName_summary_cantTell:
    '{{element}} : le libellé visible « {{visibleLabel}} » (source : {{labelSource}}) ne diffère du nom accessible (source : {{nameMechanism}}) que par une abréviation ou une césure.',
  labelInName_hint_cantTell:
    'Vérifiez manuellement que les deux formulations correspondent : le balisage ne permet pas de distinguer une abréviation volontaire d’une incohérence.',

  ariaRolesValid_title: 'L’attribut role doit être un rôle ARIA valide et non abstrait',
  ariaRolesValid_description:
    'Vérifie qu’un attribut role="" explicite correspond à un rôle WAI-ARIA réel et non abstrait.',
  ariaRolesValid_summary_invalid: 'role="{{role}}" n’est pas un rôle ARIA reconnu.',
  ariaRolesValid_hint_invalid:
    'Utilisez un rôle ARIA valide, ou retirez l’attribut role si aucun ne s’applique.',
  ariaRolesValid_summary_abstract:
    'role="{{role}}" est un rôle ARIA abstrait, qui ne doit pas être utilisé directement.',
  ariaRolesValid_hint_abstract:
    'Remplacez ce rôle abstrait par un rôle concret adapté au composant/à la structure.',

  ariaDeprecatedRole_title:
    'L’attribut role ne devrait pas utiliser un rôle ARIA obsolète ou déconseillé aux auteurs',
  ariaDeprecatedRole_description:
    'Vérifie qu’un attribut role="" explicite n’utilise pas un rôle rendu obsolète par la spécification WAI-ARIA, ni un rôle réservé à un usage interne à l’agent utilisateur (ex. role="generic").',
  ariaDeprecatedRole_summary_fail:
    'Cet élément utilise role="{{role}}", que les auteurs ne doivent pas déclarer explicitement.',
  ariaDeprecatedRole_hint_fail: '{{guidance}}',
  ariaDeprecatedRole_summary_cantTell:
    'Cet élément utilise role="{{role}}", qui est obsolète dans WAI-ARIA (toujours valide, mais déconseillé).',
  ariaDeprecatedRole_summary_cantTell_discouraged:
    'Cet élément utilise role="{{role}}", qui est réservé aux agents utilisateurs (toujours valide, mais déconseillé).',
  ariaDeprecatedRole_hint_cantTell: '{{guidance}}',

  ariaValidAttr_title: 'Les attributs aria-* doivent être des attributs ARIA réels et définis',
  ariaValidAttr_description:
    'Vérifie que chaque nom d’attribut aria-* présent dans le DOM est un attribut réel défini par la spécification WAI-ARIA.',
  ariaValidAttr_summary_fail: '{{attr}} n’est pas un attribut ARIA reconnu.',
  ariaValidAttr_hint_fail:
    'Corrigez le nom de l’attribut (vérifiez les fautes de frappe), ou retirez-le s’il n’est pas nécessaire.',

  ariaValidAttrValue_title:
    'Les valeurs des attributs aria-* doivent correspondre à leur type déclaré',
  ariaValidAttrValue_description:
    'Vérifie que chaque attribut aria-* reconnu a une valeur conforme à son type déclaré par WAI-ARIA (booléen, tri-état, jeton, entier, nombre ou référence d’ID).',
  ariaValidAttrValue_summary_fail:
    '{{attr}}="{{value}}" n’est pas une valeur valide pour cet attribut.',
  ariaValidAttrValue_hint_fail:
    'Utilisez une valeur correspondant au type attendu de l’attribut (consultez la spécification WAI-ARIA pour cet attribut).',

  ariaAllowedAttr_title: 'Les attributs aria-* doivent être autorisés pour le rôle de l’élément',
  ariaAllowedAttr_description:
    'Vérifie que chaque attribut aria-* reconnu présent sur un élément ayant un rôle explicite est soit globalement pris en charge, soit pris en charge par ce rôle.',
  ariaAllowedAttr_summary_fail: '{{attr}} n’est pas autorisé sur role="{{role}}".',
  ariaAllowedAttr_hint_fail: 'Retirez cet attribut, ou utilisez un rôle qui le prend en charge.',
  ariaAllowedAttr_summary_cantTell:
    '{{attr}} est obsolète sur role="{{role}}" (toujours autorisé, mais déconseillé).',
  ariaAllowedAttr_hint_cantTell:
    'Cet attribut a été retiré de l’ensemble global d’ARIA en 1.2 ; retirez-le ou utilisez un rôle qui le prend en charge, car une future version d’ARIA pourrait l’interdire.',

  ariaProhibitedAttr_title:
    'Les attributs de nommage ARIA ne doivent pas être utilisés sur des rôles qui les interdisent',
  ariaProhibitedAttr_description:
    'Vérifie que aria-label/aria-labelledby ne sont pas présents sur des rôles WAI-ARIA dont la spécification interdit explicitement le nommage ARIA (ex. generic, emphasis, strong, paragraph).',
  ariaProhibitedAttr_summary_fail: '{{attr}} est interdit sur role="{{role}}".',
  ariaProhibitedAttr_hint_fail:
    'Retirez cet attribut ; ce rôle ne doit pas porter de nom accessible.',
  ariaProhibitedAttr_summary_fail_roleless:
    "Cet élément {{element}} n'a aucun rôle ni autre source de nom accessible, donc {{attr}} n'est pas exposé de façon fiable aux technologies d'assistance.",
  ariaProhibitedAttr_hint_fail_roleless:
    'Donnez à cet élément un rôle prenant en charge un nom accessible (par ex. role="img"/"button"), ou retirez cet attribut s\'il ne sert à rien sans rôle.',
  ariaProhibitedAttr_summary_cantTell_roleless:
    "Cet élément {{element}} n'a aucun rôle, donc {{attr}} pourrait ne pas être exposé comme nom accessible par les technologies d'assistance — mais le contenu de l'élément en fournit déjà un.",
  ariaProhibitedAttr_hint_cantTell_roleless:
    'Vérifiez si le contenu textuel existant sert déjà de libellé à cet élément ; si oui, l\'attribut de nommage est redondant, sinon donnez à l\'élément un rôle prenant en charge le nommage (par ex. role="img").',

  ariaRequiredAttr_title: 'Les rôles avec un état/une propriété ARIA requis doivent le porter',
  ariaRequiredAttr_description:
    'Vérifie que les éléments ayant un rôle explicite portent chaque état/propriété aria-* requis, non ambigu et indépendant du contexte, pour ce rôle (ex. role="checkbox" doit avoir aria-checked).',
  ariaRequiredAttr_summary_fail: '{{attr}} est requis pour role="{{role}}", mais est absent.',
  ariaRequiredAttr_hint_fail: 'Ajoutez cet attribut avec une valeur valide pour ce rôle.',

  ariaAllowedRole_title: 'Le rôle explicite doit être autorisé pour son élément hôte',
  ariaAllowedRole_description:
    'Vérifie qu’un attribut role="" explicite fait partie des rôles que la spécification ARIA-in-HTML autorise pour l’élément hôte (ex. role="tab" n’est pas autorisé sur <nav>).',
  ariaAllowedRole_summary_fail: 'role="{{role}}" n’est pas autorisé sur <{{element}}>.',
  ariaAllowedRole_hint_fail:
    'Utilisez un rôle autorisé pour cet élément, ou changez l’élément hôte.',

  ariaRequiredChildren_title:
    'Les rôles conteneurs doivent posséder au moins un rôle enfant requis',
  ariaRequiredChildren_description:
    'Vérifie que les rôles conteneurs disposant d’une entrée documentée « éléments possédés requis » (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contiennent au moins un descendant, ou un élément référencé par aria-owns, ayant un rôle possédé acceptable.',
  ariaRequiredChildren_summary_fail:
    'role="{{role}}" ne possède aucun enfant ayant l’un des rôles requis : {{requiredRoles}}.',
  ariaRequiredChildren_hint_fail:
    'Ajoutez un descendant (ou un élément référencé par aria-owns) ayant l’un des rôles possédés requis.',

  ariaProhibitedChildren_title:
    'Les rôles conteneurs ne doivent pas posséder d’enfant ayant un rôle interdit',
  ariaProhibitedChildren_description:
    'Vérifie que chaque enfant possédé (dans l’arbre d’accessibilité) d’un rôle conteneur (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) a l’un des rôles possédés autorisés par ce rôle.',
  ariaProhibitedChildren_summary_fail:
    'Cet élément a le rôle role="{{childRole}}", qui n’est pas un rôle enfant possédé autorisé par le conteneur englobant role="{{containerRole}}".',
  ariaProhibitedChildren_hint_fail:
    'Retirez ou modifiez ce rôle afin qu’il corresponde à l’un des rôles possédés autorisés du conteneur ({{allowedRoles}}), ou déplacez cet élément hors du conteneur {{containerRole}}.',
  ariaProhibitedChildren_summary_fail_roleless:
    'Cet élément n’a pas de rôle explicite mais porte {{attr}}, ce qui en fait un véritable nœud de l’arbre d’accessibilité qui n’est pas un enfant possédé autorisé du conteneur englobant role="{{containerRole}}".',
  ariaProhibitedChildren_hint_fail_roleless:
    'Retirez {{attr}} (ou la relation de possession avec le conteneur role="{{containerRole}}"), ou attribuez à cet élément role="presentation"/"none" s’il n’est pas censé constituer son propre nœud dans l’arbre d’accessibilité.',
  ariaProhibitedChildren_summary_fail_native_focusable:
    'Cet élément n’a pas de rôle explicite mais est nativement focalisable, ce qui en fait un véritable nœud de l’arbre d’accessibilité qui n’est pas un enfant possédé autorisé du conteneur englobant role="{{containerRole}}".',
  ariaProhibitedChildren_hint_fail_native_focusable:
    'Attribuez à cet élément role="presentation"/"none", retirez sa focalisabilité native (par ex. supprimez l’attribut href/tabindex à l’origine), ou déplacez-le hors du conteneur {{containerRole}}.',

  ariaRequiredParent_title:
    'Les rôles exigeant un rôle de contexte spécifique doivent se trouver dans ce contexte',
  ariaRequiredParent_description:
    'Vérifie que les rôles disposant d’une entrée documentée « rôle de contexte requis » (listitem, option, tab, treeitem, row, cell, ...) ont un ancêtre, ou un propriétaire aria-owns, ayant un rôle de contexte acceptable.',
  ariaRequiredParent_summary_fail:
    'role="{{role}}" exige un rôle de contexte parmi : {{requiredRoles}}, qui n’a pas été trouvé.',
  ariaRequiredParent_hint_fail:
    'Placez cet élément à l’intérieur d’un élément ayant un rôle de contexte acceptable (ou référencez-le depuis celui-ci via aria-owns).',

  deprecatedElements_title:
    'Les éléments obsolètes non interruptibles (<blink>, <marquee>) ne doivent pas être utilisés',
  deprecatedElements_description:
    'Vérifie que les éléments HTML obsolètes et non standards dont le contenu clignotant/défilant ne peut pas être mis en pause, arrêté ou masqué par l’utilisateur (<blink>, <marquee>) ne sont pas présents.',
  deprecatedElements_summary_fail:
    'Le contenu de <{{element}}> ne peut pas être mis en pause, arrêté ou masqué par l’utilisateur.',
  deprecatedElements_hint_fail:
    'Retirez cet élément ; utilisez à la place un contenu statique, ou une animation dotée d’un contrôle de pause/arrêt accessible à l’utilisateur.',

  iframeNamePresent_title: 'Les cadres ont un nom accessible',
  iframeNamePresent_description:
    'Vérifie que les éléments <iframe>/<frame> exposent un nom accessible non vide via aria-label, aria-labelledby, ou l’attribut title.',
  iframeNamePresent_summary_fail: 'Ce <{{element}}> n’a pas de nom accessible.',
  iframeNamePresent_hint_fail:
    'Ajoutez un attribut title (ou aria-label/aria-labelledby) décrivant le contenu ou l’objet du cadre.',

  iframeTitleUnique_title: 'Les titres de cadres doivent être uniques',
  iframeTitleUnique_description:
    'Vérifie qu’aucun <iframe>/<frame> dans le périmètre analysé ne partage la même valeur d’attribut title qu’un autre.',
  iframeTitleUnique_summary_fail:
    'Le titre « {{title}} » de ce <{{element}}> n’est pas unique parmi les cadres de cette page.',
  iframeTitleUnique_hint_fail:
    'Donnez à chaque cadre un titre distinct décrivant son contenu ou son objet spécifique.',

  iframeFocusableContent_title:
    'Les cadres avec tabindex="-1" ne doivent pas contenir de contenu focalisable',
  iframeFocusableContent_description:
    'Vérifie que les éléments <iframe>/<frame> de même origine avec tabindex="-1" ne contiennent pas de contenu focalisable, car les navigateurs ne propagent pas cette restriction au document intégré du cadre.',
  iframeFocusableContent_summary_fail:
    'Ce <{{element}}> a tabindex="-1" mais son contenu contient des éléments focalisables, qui restent accessibles au clavier.',
  iframeFocusableContent_hint_fail:
    'Retirez le contenu focalisable du cadre, ou retirez tabindex="-1" si le cadre est censé être accessible.',

  tableHeadersAttrValid_title:
    'L’attribut headers d’une cellule de tableau doit référencer des cellules d’en-tête valides',
  tableHeadersAttrValid_description:
    'Vérifie que chaque id de l’attribut headers d’un <td>/<th> correspond à un élément <th> du même tableau (ni absent, ni un élément autre que th, ni lui-même).',
  tableHeadersAttrValid_summary_fail:
    'L’attribut headers de ce <{{element}}> référence des cellules d’en-tête invalides : {{invalidIds}}.',
  tableHeadersAttrValid_hint_fail:
    'Mettez à jour l’attribut headers afin que chaque id désigne un élément <th> du même tableau.',

  tableThHasDataCells_title: 'Les éléments <th> doivent décrire au moins une cellule de données',
  tableThHasDataCells_description:
    'Vérifie qu’un tableau contenant des éléments <th> contient aussi au moins une cellule de données <td> que ces en-têtes décrivent.',
  tableThHasDataCells_summary_fail:
    'Ce tableau a des cellules d’en-tête mais aucune cellule de données à décrire.',
  tableThHasDataCells_hint_fail:
    'Ajoutez des cellules de données (<td>) au tableau, ou retirez les cellules d’en-tête si le tableau n’a pas de données.',

  ariaHiddenBody_title: 'Le <body> du document ne doit pas être aria-hidden',
  ariaHiddenBody_description:
    'Vérifie que <body> n’a pas aria-hidden="true", ce qui retirerait toute la page de l’arbre d’accessibilité.',
  ariaHiddenBody_summary_fail:
    'Le corps du document a aria-hidden="true", ce qui masque toute la page aux technologies d’assistance.',
  ariaHiddenBody_hint_fail:
    'Retirez aria-hidden de <body>. Masquez des éléments spécifiques à la place, si c’était l’intention.',

  listChildrenValid_title: 'Les listes ne doivent contenir directement que des éléments de liste',
  listChildrenValid_description:
    'Vérifie que les éléments <ul>/<ol> n’ont comme enfants directs que <li>, <script> ou <template>.',
  listChildrenValid_summary_fail:
    'Ce <{{element}}> contient un enfant direct qui n’est pas un élément de liste : {{invalidChildren}}.',
  listChildrenValid_hint_fail:
    'N’utilisez que <li> (ou <script>/<template>) comme enfants directs de <ul>/<ol> ; déplacez tout autre balisage à l’intérieur d’un <li>.',

  listitemParentValid_title:
    'Les éléments de liste doivent se trouver à l’intérieur d’un conteneur de liste',
  listitemParentValid_description:
    'Vérifie que les éléments <li> sont contenus par <ul>, <ol>, ou un élément ayant role="list".',
  listitemParentValid_summary_fail:
    'Le parent de cet élément de liste (<{{parentElement}}>) n’est pas un conteneur de liste.',
  listitemParentValid_hint_fail:
    'Placez ce <li> à l’intérieur d’un <ul>/<ol>, ou donnez à son parent role="list".',

  definitionListChildrenValid_title:
    'Les listes de définitions doivent être structurées correctement',
  definitionListChildrenValid_description:
    'Vérifie que les éléments <dl> ne contiennent directement que des groupes <dt>/<dd> (éventuellement enveloppés dans un seul <div>), <script>, <template>, ou <style>.',
  definitionListChildrenValid_summary_fail_invalidChild:
    'Cette liste de définitions contient un enfant direct ou enveloppé qui ne fait pas partie d’un groupe dt/dd : {{invalidChildren}}.',
  definitionListChildrenValid_hint_fail_invalidChild:
    'N’utilisez que <dt>/<dd> (éventuellement enveloppés dans un seul <div>), <script>, <template>, ou <style> à l’intérieur de <dl>.',
  definitionListChildrenValid_summary_fail_noDtDd:
    'Cette liste de définitions n’a aucun groupe terme/définition <dt>/<dd>.',
  definitionListChildrenValid_hint_fail_noDtDd:
    'Ajoutez au moins une paire <dt>/<dd> à l’intérieur de ce <dl>.',

  dlitemParentValid_title:
    'Les éléments d’une liste de définitions doivent se trouver à l’intérieur d’une liste de définitions',
  dlitemParentValid_description:
    'Vérifie que les éléments <dt>/<dd> sont contenus par un <dl>, directement ou via un <div> englobant.',
  dlitemParentValid_summary_fail:
    'Le parent (<{{parentElement}}>) de ce <{{element}}> n’est pas une liste de définitions.',
  dlitemParentValid_hint_fail:
    'Placez ce <dt>/<dd> à l’intérieur d’un <dl>, directement ou enveloppé dans un seul <div>.',

  duplicateIdAria_title: 'Les ID référencés par ARIA doivent être uniques',
  duplicateIdAria_description:
    'Vérifie que toute valeur id référencée par un attribut de référence d’ID ARIA (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) est unique dans le document.',
  duplicateIdAria_summary_cantTell:
    'L’id « {{id}} » est référencé par un attribut ARIA mais est utilisé par {{duplicateCount}} éléments ; la référence pointe vers le premier.',
  duplicateIdAria_hint_cantTell:
    'Vérifiez que le premier élément portant cet id est bien la cible attendue, ou rendez l’id unique dans le document.',

  summaryNamePresent_title: 'Les éléments summary ont un nom accessible',
  summaryNamePresent_description:
    'Vérifie que les éléments <summary> exposent un nom accessible non vide.',
  summaryNamePresent_summary_fail: 'Ce summary n’a pas de nom accessible.',
  summaryNamePresent_hint_fail:
    'Fournissez un texte de summary qui ne soit pas masqué aux technologies d’assistance, ou fournissez aria-label ou aria-labelledby.',

  metaViewportZoomEnabled_title: 'La balise meta viewport ne doit pas désactiver le zoom',
  metaViewportZoomEnabled_description:
    'Vérifie que <meta name="viewport"> ne définit pas user-scalable=no ni maximum-scale en dessous de 2 (200 %).',
  metaViewportZoomEnabled_summary_fail:
    'Cette balise meta viewport restreint la capacité de l’utilisateur à zoomer ({{reasons}}).',
  metaViewportZoomEnabled_hint_fail:
    'Retirez user-scalable=no et tout maximum-scale inférieur à 2 du contenu de la balise meta viewport.',

  metaRefreshTimingAbsent_title: 'La page ne doit pas utiliser un rafraîchissement meta minuté',
  metaRefreshTimingAbsent_description:
    'Vérifie que <meta http-equiv="refresh"> n’impose pas un délai positif de 20 heures ou moins.',
  metaRefreshTimingAbsent_summary_fail:
    'Cette page se rafraîchit automatiquement après {{delay}} secondes.',
  metaRefreshTimingAbsent_hint_fail:
    'Retirez le rafraîchissement meta minuté, ou proposez un moyen pour les utilisateurs de le désactiver, de le prolonger ou de le mettre en pause avant qu’il ne se déclenche.',

  meterNamePresent_title: 'Les éléments meter ont un nom accessible',
  meterNamePresent_description:
    'Vérifie que les éléments avec role="meter" exposent un nom accessible non vide.',
  meterNamePresent_summary_fail: 'Ce meter n’a pas de nom accessible.',
  meterNamePresent_hint_fail:
    'Fournissez aria-label, aria-labelledby ou un attribut title — le contenu textuel visible n’est pas exposé comme nom accessible de ce meter.',

  progressbarNamePresent_title: 'Les barres de progression ont un nom accessible',
  progressbarNamePresent_description:
    'Vérifie que les éléments avec role="progressbar" exposent un nom accessible non vide.',
  progressbarNamePresent_summary_fail: 'Cette barre de progression n’a pas de nom accessible.',
  progressbarNamePresent_hint_fail:
    'Fournissez aria-label, aria-labelledby ou un attribut title — le contenu textuel visible n’est pas exposé comme nom accessible de cette barre de progression.',

  tooltipNamePresent_title: 'Les infobulles ont un nom accessible',
  tooltipNamePresent_description:
    'Vérifie que les éléments avec role="tooltip" exposent un nom accessible non vide.',
  tooltipNamePresent_summary_fail: 'Cette infobulle n’a pas de nom accessible.',
  tooltipNamePresent_hint_fail:
    'Fournissez un texte pour l’infobulle qui ne soit pas masqué aux technologies d’assistance, ou fournissez aria-label ou aria-labelledby.',

  serverSideImageMapAbsent_title:
    'Les images ne doivent pas utiliser une carte d’image côté serveur',
  serverSideImageMapAbsent_description:
    'Vérifie que les éléments <img> ne portent pas l’attribut ismap (les cartes d’image côté serveur n’ont pas d’équivalent utilisable au clavier).',
  serverSideImageMapAbsent_summary_fail:
    'Cette image utilise une carte d’image côté serveur, qui n’a pas d’équivalent utilisable au clavier.',
  serverSideImageMapAbsent_hint_fail:
    'Remplacez la carte d’image côté serveur (ismap) par une carte d’image côté client (<map>/<area>) ou par des liens/boutons accessibles distincts.',

  formControlSingleLabel_title:
    'Les contrôles de formulaire ne doivent pas avoir plusieurs étiquettes',
  formControlSingleLabel_description:
    'Vérifie qu’un contrôle de formulaire est associé à au plus un <label> (par imbrication ou par label[for]).',
  formControlSingleLabel_summary_fail: 'Ce <{{element}}> est associé à {{labelCount}} étiquettes.',
  formControlSingleLabel_hint_fail:
    'Conservez une seule <label> par contrôle de formulaire (soit en l’enveloppant, soit en la référençant via for/id).',
  formControlSingleLabel_summary_cantTell:
    'Ce <{{element}}> a une <label> qui l’étiquette plus une association de <label> vide supplémentaire ; vérifiez comment il est annoncé.',
  formControlSingleLabel_hint_cantTell:
    'Supprimez la <label> vide redondante afin qu’une seule <label> soit associée au contrôle.',

  nestedInteractiveControlsAbsent_title: 'Les contrôles interactifs ne doivent pas être imbriqués',
  nestedInteractiveControlsAbsent_description:
    'Vérifie qu’un contrôle interactif (lien, bouton, contrôle de formulaire, ou rôle de widget ARIA) ne contient pas un autre contrôle interactif.',
  nestedInteractiveControlsAbsent_summary_fail:
    'Ce <{{element}}> contient un ou plusieurs contrôles interactifs imbriqués : {{nestedElements}}.',
  nestedInteractiveControlsAbsent_hint_fail:
    'Déplacez le(s) contrôle(s) interactif(s) imbriqué(s) hors de cet élément ; les contrôles interactifs imbriqués ne sont pas utilisables de façon fiable via les technologies d’assistance.',

  bypassBlocksPresent_title: 'La page doit proposer un moyen de contourner les blocs répétés',
  bypassBlocksPresent_description:
    'Vérifie que la page dispose d’au moins un mécanisme reconnu de contournement des blocs répétés (WCAG 2.4.1) : un point de repère main, un lien d’ancrage fonctionnel vers la même page, ou un titre.',
  bypassBlocksPresent_summary_cantTell:
    'Aucun moyen reconnu de contourner les blocs de contenu répétés n’a été détecté sur cette page — vérifiez qu’un mécanisme de contournement existe.',
  bypassBlocksPresent_hint_cantTell:
    'Confirmez que la page propose un mécanisme de contournement : un point de repère main (<main> ou role="main"), un lien « aller au contenu » fonctionnel, ou des éléments de titre que les technologies d’assistance peuvent utiliser pour passer le contenu répété. (Un mécanisme peut être temporairement masqué — par exemple pendant qu’une boîte de dialogue modale rend la page inerte — ou fourni à l’échelle du site ; cela nécessite une confirmation humaine.)',

  landmarkBannerIsTopLevel_title: 'Le point de repère banner doit être de premier niveau',
  landmarkBannerIsTopLevel_description:
    'Vérifie que le point de repère banner (role="banner" ou un <header> non imbriqué) n’est pas imbriqué dans un autre point de repère.',
  landmarkBannerIsTopLevel_summary_cantTell:
    'Ce point de repère banner est imbriqué dans un autre point de repère.',
  landmarkBannerIsTopLevel_hint_cantTell:
    'Déplacez le point de repère banner (header/role="banner") afin qu’il ne soit contenu par aucun autre point de repère ; un banner doit être une région de premier niveau de la page.',

  landmarkContentinfoIsTopLevel_title: 'Le point de repère contentinfo doit être de premier niveau',
  landmarkContentinfoIsTopLevel_description:
    'Vérifie que le point de repère contentinfo (role="contentinfo" ou un <footer> non imbriqué) n’est pas imbriqué dans un autre point de repère.',
  landmarkContentinfoIsTopLevel_summary_cantTell:
    'Ce point de repère contentinfo est imbriqué dans un autre point de repère.',
  landmarkContentinfoIsTopLevel_hint_cantTell:
    'Déplacez le point de repère contentinfo (footer/role="contentinfo") afin qu’il ne soit contenu par aucun autre point de repère ; contentinfo doit être une région de premier niveau de la page.',

  landmarkMainIsTopLevel_title: 'Le point de repère main doit être de premier niveau',
  landmarkMainIsTopLevel_description:
    'Vérifie que le point de repère main (role="main" ou <main>) n’est pas imbriqué dans un autre point de repère.',
  landmarkMainIsTopLevel_summary_cantTell:
    'Ce point de repère main est imbriqué dans un autre point de repère.',
  landmarkMainIsTopLevel_hint_cantTell:
    'Déplacez le point de repère main (<main>/role="main") afin qu’il ne soit contenu par aucun autre point de repère ; main doit être une région de premier niveau de la page.',

  landmarkNoDuplicateBanner_title: 'La page ne doit pas avoir plus d’un point de repère banner',
  landmarkNoDuplicateBanner_description:
    'Vérifie qu’au plus un point de repère banner (role="banner" ou un <header> non imbriqué) existe sur la page.',
  landmarkNoDuplicateBanner_summary_cantTell: 'Cette page a plus d’un point de repère banner.',
  landmarkNoDuplicateBanner_hint_cantTell:
    'Ne conservez qu’un seul point de repère banner (header/role="banner") par page.',

  landmarkNoDuplicateContentinfo_title:
    'La page ne doit pas avoir plus d’un point de repère contentinfo',
  landmarkNoDuplicateContentinfo_description:
    'Vérifie qu’au plus un point de repère contentinfo (role="contentinfo" ou un <footer> non imbriqué) existe sur la page.',
  landmarkNoDuplicateContentinfo_summary_cantTell:
    'Cette page a plus d’un point de repère contentinfo.',
  landmarkNoDuplicateContentinfo_hint_cantTell:
    'Ne conservez qu’un seul point de repère contentinfo (footer/role="contentinfo") par page.',

  landmarkNoDuplicateMain_title: 'La page ne doit pas avoir plus d’un point de repère main',
  landmarkNoDuplicateMain_description:
    'Vérifie qu’au plus un point de repère main (role="main" ou <main>) existe sur la page.',
  landmarkNoDuplicateMain_summary_cantTell: 'Cette page a plus d’un point de repère main.',
  landmarkNoDuplicateMain_hint_cantTell:
    'Ne conservez qu’un seul point de repère main (<main>/role="main") par page.',

  landmarkOneMain_title: 'La page devrait avoir un point de repère main',
  landmarkOneMain_description:
    'Vérifie que la page a au moins un point de repère main (role="main" ou <main>).',
  landmarkOneMain_summary_cantTell_missing: 'Cette page n’a aucun point de repère main.',
  landmarkOneMain_hint_cantTell_missing:
    'Ajoutez un point de repère main (<main> ou role="main") autour du contenu principal de la page.',

  landmarkUnique_title:
    'Les points de repère partageant le même rôle doivent avoir des noms uniques',
  landmarkUnique_description:
    'Vérifie que lorsque deux points de repère ou plus partagent le même rôle, chacun a un nom accessible distinct.',
  landmarkUnique_summary_cantTell_duplicateName:
    'Ce point de repère {{role}} partage son nom accessible avec un autre point de repère {{role}}.',
  landmarkUnique_summary_cantTell_bothUnnamed:
    'Ce point de repère {{role}} n’a pas de nom accessible, et plus d’un point de repère {{role}} sans nom existe sur cette page.',
  landmarkUnique_hint_cantTell:
    'Donnez à chaque point de repère {{role}} un nom distinct via aria-label ou aria-labelledby.',

  emptyHeading_title: 'Les titres ne doivent pas être vides',
  emptyHeading_description:
    'Vérifie que les éléments de titre (<h1>-<h6> ou role="heading") ont un nom accessible non vide.',
  emptyHeading_summary_cantTell: 'Ce titre n’a pas de nom accessible.',
  emptyHeading_hint_cantTell:
    'Ajoutez du contenu textuel (ou aria-label/aria-labelledby) à ce titre, ou retirez-le s’il n’est pas nécessaire.',

  headingOrder_title: 'Les niveaux de titre ne doivent pas sauter un niveau',
  headingOrder_description:
    'Vérifie que les niveaux de titre n’augmentent que d’un niveau à la fois, dans l’ordre du document.',
  headingOrder_summary_cantTell:
    'Ce titre passe du niveau {{fromLevel}} au niveau {{toLevel}}, en sautant un niveau.',
  headingOrder_hint_cantTell:
    'Utilisez des niveaux de titre consécutifs (ne sautez pas de niveau en descendant dans la hiérarchie) afin que le plan du document reste prévisible.',

  pageHasHeadingOne_title: 'La page devrait avoir un titre de niveau un',
  pageHasHeadingOne_description:
    'Vérifie que la page a au moins un titre de niveau un (<h1> ou role="heading" avec aria-level="1").',
  pageHasHeadingOne_summary_cantTell: 'Cette page n’a aucun titre de niveau un.',
  pageHasHeadingOne_hint_cantTell:
    'Ajoutez un titre de niveau un (<h1> ou role="heading" aria-level="1") identifiant le contenu principal de la page.',

  accesskeys_title: 'Les valeurs accesskey doivent être uniques',
  accesskeys_description:
    'Vérifie qu’aucun élément de la page ne partage la même valeur d’attribut accesskey qu’un autre.',
  accesskeys_summary_cantTell:
    'L’accesskey de cet élément est partagée avec un autre élément de la page.',
  accesskeys_hint_cantTell: 'Rendez chaque valeur accesskey unique sur l’ensemble de la page.',

  scopeAttrValid_title: 'L’attribut scope doit avoir une valeur valide',
  scopeAttrValid_description: 'Vérifie que scope="..." vaut row, col, rowgroup, ou colgroup.',
  scopeAttrValid_summary_cantTell: 'Cette valeur d’attribut scope n’est pas reconnue.',
  scopeAttrValid_hint_cantTell: 'Utilisez row, col, rowgroup, ou colgroup pour l’attribut scope.',

  tabindex_title: 'tabindex ne devrait pas être supérieur à 0',
  tabindex_description:
    'Vérifie que les valeurs de tabindex sont égales à 0 ou négatives, jamais un nombre positif.',
  tabindex_summary_cantTell:
    'Cet élément a un tabindex positif, ce qui modifie l’ordre naturel de tabulation.',
  tabindex_hint_cantTell:
    'Utilisez tabindex="0" (ou une valeur négative pour le retirer de l’ordre de tabulation) plutôt qu’un nombre positif ; corrigez l’ordre dans le DOM si un ordre de tabulation différent est nécessaire.',

  emptyTableHeader_title: 'Les cellules d’en-tête de tableau ne doivent pas être vides',
  emptyTableHeader_description:
    'Vérifie que les éléments <th> ont un contenu textuel visible — un en-tête nommé uniquement via aria-label/aria-labelledby est aussi signalé, car la prise en charge réelle par les lecteurs d’écran/navigateurs est incohérente.',
  emptyTableHeader_summary_cantTell:
    'Cette cellule d’en-tête de tableau n’a pas de nom accessible.',
  emptyTableHeader_hint_cantTell:
    'Ajoutez du contenu textuel (ou aria-label/aria-labelledby) à cette cellule d’en-tête, ou retirez-la si elle n’est pas nécessaire.',
  emptyTableHeader_summary_cantTell_ariaOnly:
    'Cette cellule d’en-tête de tableau n’a pas de texte visible — son seul nom accessible provient de aria-label/aria-labelledby, que des combinaisons réelles de lecteur d’écran/navigateur (ex. NVDA+Firefox, iOS VoiceOver+Safari) sont connues pour ignorer sur les éléments <th>.',
  emptyTableHeader_hint_cantTell_ariaOnly:
    'Ajoutez du contenu textuel visible à cette cellule d’en-tête (en plus de, ou à la place de, aria-label/aria-labelledby) — le texte visible est le seul mécanisme de nommage confirmé comme fonctionnel sur les lecteurs d’écran testés.',

  labelTitleOnly_title:
    'Les contrôles de formulaire ne devraient pas utiliser title comme seule étiquette',
  labelTitleOnly_description:
    'Vérifie qu’un contrôle de formulaire ayant un attribut title possède aussi une véritable étiquette (élément label, aria-label, ou aria-labelledby).',
  labelTitleOnly_summary_cantTell:
    'Ce contrôle de formulaire repose sur l’attribut title comme seule étiquette.',
  labelTitleOnly_hint_cantTell:
    'Ajoutez une <label> visible (ou aria-label/aria-labelledby) en plus de, ou à la place de, l’attribut title.',

  imageRedundantAlt_title:
    'Le texte alt d’une image ne doit pas dupliquer le texte visible adjacent',
  imageRedundantAlt_description:
    'Vérifie que le texte alt d’un <img> n’est pas identique à un autre texte visible déjà présent dans son élément parent immédiat.',
  imageRedundantAlt_summary_cantTell:
    'Le texte alt de cette image duplique un autre texte visible juste à côté.',
  imageRedundantAlt_hint_cantTell:
    'Videz le texte alt (alt="") si l’image est purement décorative à côté du texte, ou supprimez la duplication redondante.',

  tableDuplicateName_title: 'La légende d’un tableau ne doit pas dupliquer son attribut summary',
  tableDuplicateName_description:
    'Vérifie que le texte de la <caption> d’un <table> n’est pas identique à son attribut summary (obsolète).',
  tableDuplicateName_summary_cantTell: 'La légende de ce tableau duplique son attribut summary.',
  tableDuplicateName_hint_cantTell:
    'Retirez l’attribut summary redondant, ou faites en sorte qu’il apporte une information différente de la légende.',

  metaViewportLarge_title: 'La balise meta viewport devrait permettre un zoom jusqu’à 500 %',
  metaViewportLarge_description:
    'Vérifie que <meta name="viewport"> ne définit pas user-scalable=no ni maximum-scale en dessous de 5 (500 %).',
  metaViewportLarge_summary_cantTell:
    'Cette balise meta viewport restreint le zoom en dessous de l’objectif de bonne pratique de 500 %.',
  metaViewportLarge_hint_cantTell:
    'Retirez user-scalable=no et augmentez maximum-scale à au moins 5 (500 %) si possible.',

  presentationRoleConflict_title:
    'Un rôle de présentation ne doit pas entrer en conflit avec un attribut ARIA global ou la focalisabilité',
  presentationRoleConflict_description:
    'Vérifie que role="presentation"/"none" (y compris le rôle presentation implicite d’un <img alt="">) n’est pas combiné avec un attribut ARIA global (aria-label, aria-hidden, aria-describedby, ...) ou avec la focalisabilité (tabindex/native).',
  presentationRoleConflict_summary_cantTell:
    'Cet élément role="{{role}}" a aussi une condition conflictuelle ({{attrs}}), qui restaure son rôle implicite et annule l’intention présentationnelle.',
  presentationRoleConflict_hint_cantTell:
    'Retirez le(s) attribut(s) de nommage conflictuel(s) et/ou la focalisabilité (tabindex/native) si l’élément doit rester présentationnel, ou retirez role="presentation"/"none" s’il doit être exposé aux technologies d’assistance.',

  region_title: 'Le contenu de la page devrait se trouver à l’intérieur d’un point de repère',
  region_description: 'Vérifie que le contenu sous <body> est contenu dans un point de repère.',
  region_summary_cantTell: 'Ce contenu n’est contenu dans aucun point de repère.',
  region_hint_cantTell:
    'Déplacez ce contenu à l’intérieur d’un point de repère (main, nav, aside, une section nommée, etc.).',

  skipLink_title: 'Un lien d’évitement doit avoir une cible qui se résout et qui est utilisable',
  skipLink_description:
    'Vérifie que le fragment href d’un lien « aller au... » se résout vers un élément réel et actuellement utilisable du document.',
  skipLink_summary_cantTell: 'La cible de ce lien d’évitement n’existe pas.',
  skipLink_hint_cantTell:
    'Faites pointer le href du lien d’évitement vers un id qui existe dans le document, ou ajoutez l’élément cible manquant.',
  skipLink_summary_unusableTarget_cantTell:
    'Ce lien d’évitement pointe vers une cible qui existe mais qui n’est pas actuellement utilisable.',
  skipLink_hint_unusableTarget_cantTell:
    'Faites pointer ce lien d’évitement vers une cible exposée et utilisable comme destination de navigation.',

  autocompleteValid_title: 'L’attribut autocomplete doit être une valeur d’auto-remplissage valide',
  autocompleteValid_description:
    'Vérifie qu’un attribut autocomplete non vide vaut « on »/« off » ou une liste de jetons d’auto-remplissage bien formée.',
  autocompleteValid_summary_fail:
    'Cette valeur d’attribut autocomplete n’est pas une valeur d’auto-remplissage valide.',
  autocompleteValid_hint_fail:
    'Utilisez « on »/« off », ou une liste de jetons d’auto-remplissage valide (ex. « shipping street-address », « cc-number »).',

  htmlXmlLangMismatch_title: 'lang et xml:lang ne doivent pas se contredire',
  htmlXmlLangMismatch_description:
    'Vérifie que les attributs lang et xml:lang de l’élément <html> déclarent la même langue principale, lorsque les deux sont présents.',
  htmlXmlLangMismatch_summary_fail:
    'Les attributs lang (« {{lang}} ») et xml:lang (« {{xmlLang}} ») déclarent des langues différentes.',
  htmlXmlLangMismatch_hint_fail:
    'Faites en sorte que lang et xml:lang déclarent la même langue principale, ou retirez l’attribut obsolète xml:lang.',

  avoidInlineSpacing_title:
    'Un style en ligne ne doit pas forcer l’espacement du texte en dessous du seuil WCAG',
  avoidInlineSpacing_description:
    'Vérifie que lorsqu’un style en ligne force line-height, letter-spacing ou word-spacing avec !important, la valeur respecte déjà WCAG 1.4.12, ne laissant rien à surcharger à l’utilisateur.',
  avoidInlineSpacing_summary_fail:
    'Le style en ligne de cet élément force {{properties}} avec !important, bloquant les surcharges d’espacement de texte par l’utilisateur.',
  avoidInlineSpacing_hint_fail:
    'Retirez !important de line-height/letter-spacing/word-spacing dans les styles en ligne afin que les utilisateurs puissent surcharger l’espacement du texte.',

  metaRefreshNoExceptions_title: 'La page ne doit utiliser aucun rafraîchissement meta (AAA)',
  metaRefreshNoExceptions_description:
    'Vérifie que <meta http-equiv="refresh"> n’est présent en aucun cas, quel que soit le délai — la variante plus stricte, de niveau AAA, de la vérification de niveau A qui ne porte que sur les délais positifs.',
  metaRefreshNoExceptions_summary_fail:
    'Cette page utilise un rafraîchissement meta, un changement de contexte automatique non initié par l’utilisateur.',
  metaRefreshNoExceptions_hint_fail:
    'Retirez le rafraîchissement meta ; déclenchez la redirection/le rafraîchissement uniquement en réponse à une action de l’utilisateur.',

  validLang_title: 'L’attribut lang d’un élément doit être syntaxiquement valide',
  validLang_description:
    'Vérifie que tout élément (autre que la racine <html>) ayant un attribut lang non vide utilise une étiquette de langue syntaxiquement valide.',
  validLang_summary_fail:
    'Cette valeur d’attribut lang (« {{value}} ») n’est pas une étiquette de langue syntaxiquement valide.',
  validLang_hint_fail: 'Utilisez une étiquette de langue BCP47 valide (ex. « fr », « es-MX »).',

  linkInTextBlock_title:
    'Les liens dans des blocs de texte doivent être distinguables du texte environnant sans se fier uniquement à la couleur',
  linkInTextBlock_description:
    'Vérifie qu’un lien à l’intérieur d’un bloc de texte est visuellement distinguable du texte environnant par un soulignement, une différence de graisse/style de police, ou un contraste de couleur suffisant (>= 3:1) — pas seulement par la couleur.',
  linkInTextBlock_summary_fail:
    'Ce lien dans un bloc de texte se distingue du texte environnant uniquement par la couleur.',
  linkInTextBlock_hint_fail:
    'Ajoutez un soulignement, une différence de graisse/style de police, ou augmentez le contraste de couleur entre le lien et le texte environnant à au moins 3:1.',

  noAutoplayAudio_title:
    'Un audio en lecture automatique devrait proposer un mécanisme de pause/arrêt ou de contrôle du volume',
  noAutoplayAudio_description:
    'Signale les éléments <audio>/<video> qui se lancent automatiquement sans être coupés et sans attribut controls natif, pour une revue manuelle par rapport à l’exemption de 3 secondes de la WCAG 1.4.2.',
  noAutoplayAudio_summary_cantTell:
    'Cet élément lit un audio automatiquement sans mécanisme natif de pause/arrêt ou de contrôle du volume.',
  noAutoplayAudio_hint_cantTell:
    'Si ce clip dure plus de 3 secondes, ajoutez un attribut controls (ou un mécanisme personnalisé équivalent) afin que les utilisateurs puissent le mettre en pause/l’arrêter ou contrôler son volume indépendamment du volume du système.',

  videoCaption_title: 'Une vidéo préenregistrée devrait proposer une piste de sous-titres',
  videoCaption_description:
    'Signale les éléments <video> sans enfant <track kind="captions"|"subtitles">, pour une revue manuelle visant à déterminer si la vidéo a une piste audio nécessitant des sous-titres.',
  videoCaption_summary_cantTell:
    'Cette vidéo n’a aucune piste de sous-titres (captions ou subtitles).',
  videoCaption_hint_cantTell:
    'Si cette vidéo a une piste audio porteuse d’information, ajoutez un <track kind="captions" src="..."> avec le contenu sous-titré.',

  scrollableRegionFocusable_title:
    'Les régions défilantes sans contenu focalisable devraient être focalisables au clavier',
  scrollableRegionFocusable_description:
    'Signale les éléments dont le CSS déclare overflow:auto/scroll, qui ne contiennent aucun descendant focalisable, et qui ne sont pas eux-mêmes focalisables au clavier, pour une revue manuelle visant à déterminer si leur contenu déborde réellement et nécessite un accès au défilement au clavier.',
  scrollableRegionFocusable_summary_cantTell:
    'Cet élément déclare overflow:auto/scroll, n’a aucun descendant focalisable, et n’est pas lui-même focalisable au clavier.',
  scrollableRegionFocusable_hint_cantTell:
    'Si le contenu de cette région déborde réellement, ajoutez tabindex="0" (et une étiquette adaptée) afin que les utilisateurs du clavier puissent la focaliser et faire défiler avec les flèches.',

  identicalLinksSamePurpose_title:
    'Les liens partageant le même nom accessible devraient mener à la même destination',
  identicalLinksSamePurpose_description:
    'Signale les groupes de liens qui partagent le même nom accessible mais mènent à plus d’une destination distincte, pour une revue manuelle visant à déterminer s’ils servent le même objectif.',
  identicalLinksSamePurpose_summary_cantTell:
    'Ce lien partage un nom accessible avec d’autres liens de la page qui mènent à une destination différente.',
  identicalLinksSamePurpose_hint_cantTell:
    'Assurez-vous que les liens ayant le même texte servent le même objectif, ou rendez le texte du lien suffisamment distinct pour décrire chaque destination.',

  ariaBrailleEquivalent_title:
    'aria-braillelabel/aria-brailleroledescription doivent avoir un équivalent non braille',
  ariaBrailleEquivalent_description:
    'Vérifie que les éléments utilisant aria-braillelabel ont aussi un nom accessible ordinaire, et que ceux utilisant aria-brailleroledescription ont aussi aria-roledescription.',
  ariaBrailleEquivalent_summary_fail:
    'Cet élément a {{attr}} mais pas {{requires}}, son équivalent non braille.',
  ariaBrailleEquivalent_hint_fail:
    '{{attr}} est un complément spécifique au braille, pas un remplacement — fournissez aussi {{requires}}.',

  ariaConditionalAttr_title:
    'aria-errormessage exige que aria-invalid soit défini à une valeur autre que false',
  ariaConditionalAttr_description:
    'Vérifie que les éléments ayant aria-errormessage ont aussi aria-invalid défini à « true », « grammar », ou « spelling » — sinon le message d’erreur est retiré de l’arbre d’accessibilité.',
  ariaConditionalAttr_summary_fail:
    'Cet élément a aria-errormessage mais aria-invalid est absent ou « false », donc le message d’erreur n’est pas exposé.',
  ariaConditionalAttr_hint_fail:
    'Définissez aria-invalid à « true » (ou « grammar »/« spelling ») chaque fois que aria-errormessage doit être exposé aux technologies d’assistance.',

  ariaCheckedStateMismatch_title:
    'L’aria-checked d’une case à cocher/d’un bouton radio natif devrait correspondre à son état réel',
  ariaCheckedStateMismatch_description:
    'Signale un <input type="checkbox">/<input type="radio"> natif dont la valeur explicite d’aria-checked ne correspond pas à son état réel (coché/indéterminé), pour une revue manuelle.',
  ariaCheckedStateMismatch_summary_cantTell:
    'La valeur d’aria-checked de cet élément ne correspond pas à son état réel (coché/indéterminé).',
  ariaCheckedStateMismatch_hint_cantTell:
    'Définissez aria-checked pour qu’il corresponde à l’état réel de l’élément, ou retirez-le — une case à cocher/un bouton radio natif expose déjà cet état sans lui.',

  cssOrientationLock_title: 'Le CSS ne doit pas verrouiller la page à une seule orientation',
  cssOrientationLock_description:
    'Vérifie qu’aucune règle @media (orientation: portrait|landscape) ne définit un transform: rotate(...) sur la page, une technique connue pour contourner l’orientation de l’appareil.',
  cssOrientationLock_summary_fail:
    'Une media query « {{mediaText}} » fait pivoter « {{selectorText}} », verrouillant la page à une seule orientation.',
  cssOrientationLock_hint_fail:
    'Retirez la transformation rotate() de la media query d’orientation ; laissez la page répondre naturellement à l’orientation de l’appareil au lieu de forcer une rotation visuelle.',

  ariaText_title: 'Les éléments role="text" ne devraient avoir aucun descendant focalisable',
  ariaText_description:
    'Vérifie que les éléments ayant role="text" ne contiennent aucun descendant focalisable (lien, bouton, contrôle de formulaire, tabindex, iframe, ou contenteditable).',
  ariaText_summary_cantTell: 'Cet élément role="text" contient un descendant focalisable.',
  ariaText_hint_cantTell:
    'Retirez role="text" (ou retirez le descendant focalisable) — une région de « texte brut » ne devrait pas contenir de contenu focalisable.',

  focusOrderSemantics_title:
    'Les éléments ajoutés à l’ordre de tabulation devraient avoir une sémantique interactive',
  focusOrderSemantics_description:
    'Signale les éléments ayant tabindex >= 0 dont le rôle explicite est un rôle structurel/documentaire non interactif (ex. heading, list, region, presentation), pour une revue manuelle.',
  focusOrderSemantics_summary_cantTell:
    'Cet élément est dans l’ordre de tabulation (tabindex="{{tabindex}}") mais a un rôle non interactif (« {{role}} »).',
  focusOrderSemantics_hint_cantTell:
    'Retirez tabindex si cet élément n’est pas censé être interactif, ou utilisez un rôle interactif correspondant à son comportement réel.',

  pAsHeading_title:
    'Un <p> stylé pour ressembler à un titre devrait probablement être un véritable titre',
  pAsHeading_description:
    'Signale les éléments <p> courts dont tout le texte est en gras et affiché à >= 18px, pour une revue manuelle visant à déterminer si un véritable élément de titre devrait être utilisé à la place.',
  pAsHeading_summary_cantTell:
    'Ce paragraphe est entièrement en gras et affiché à une taille évoquant un titre.',
  pAsHeading_hint_cantTell:
    'Si ce texte introduit une nouvelle section, utilisez un véritable élément de titre (<h1>-<h6> ou role="heading") plutôt que de styler un paragraphe pour qu’il y ressemble.',

  tableFakeCaption_title:
    'La première ligne d’un tableau ne devrait pas tenir lieu de véritable <caption>',
  tableFakeCaption_description:
    'Signale les tableaux sans <caption> dont la première ligne a une seule cellule non vide alors que les autres lignes ont plusieurs cellules, pour une revue manuelle visant à déterminer si cette cellule fait office de légende factice.',
  tableFakeCaption_summary_cantTell:
    'Ce tableau n’a pas de <caption>, mais sa première ligne est une cellule unique placée au-dessus de lignes à plusieurs cellules — elle fait peut-être office de légende factice.',
  tableFakeCaption_hint_cantTell:
    'Si cette cellule est censée décrire le tableau, utilisez un véritable élément <caption> plutôt qu’une cellule isolée en première ligne.',

  tdHasHeader_title: 'Les cellules de données des grands tableaux doivent avoir un en-tête associé',
  tdHasHeader_description:
    'Vérifie que chaque <td> d’un tableau grand et simple (sans colspan/rowspan) a un en-tête associé — via un attribut headers, un <th> de colonne implicite au-dessus, ou un <th> de ligne implicite à sa gauche.',
  tdHasHeader_summary_fail:
    'Cette cellule de données n’a pas d’en-tête associé (pas d’attribut headers, pas de <th> de colonne au-dessus, pas de <th> de ligne à gauche).',
  tdHasHeader_hint_fail:
    'Ajoutez un attribut headers référençant le(s) id du/des <th> pertinent(s), ou restructurez le tableau afin que cette cellule ait un en-tête de ligne/colonne implicite.',

  mouseOnlyEventHandlers_title:
    'Les gestionnaires d’événements en ligne réservés au pointeur devraient avoir un équivalent accessible au clavier',
  mouseOnlyEventHandlers_description:
    'Signale les éléments ayant un gestionnaire d’événement en ligne réservé au pointeur (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave) sans équivalent accessible au clavier (onkeydown/onkeyup/onkeypress/onfocus/onblur), pour une revue manuelle.',
  mouseOnlyEventHandlers_summary_cantTell:
    'Cet élément a {{attrs}} mais aucun gestionnaire équivalent accessible au clavier.',
  mouseOnlyEventHandlers_hint_cantTell:
    'Ajoutez onkeydown/onkeyup/onkeypress (ou onfocus/onblur pour un comportement déclenché au survol) afin que cette fonctionnalité soit aussi accessible au clavier.',

  linkNameQuality_title: 'Le texte des liens devrait être descriptif, pas générique',
  linkNameQuality_description:
    'Signale les liens dont le nom accessible complet est une formule connue comme non descriptive (ex. « cliquez ici », « en savoir plus », « plus »), pour une revue manuelle visant à déterminer si l’objet du lien est clair sans contexte supplémentaire.',
  linkNameQuality_summary_cantTell:
    'Le nom accessible de ce lien (« {{name}} ») est une formule générique et non descriptive.',
  linkNameQuality_hint_cantTell:
    'Faites en sorte que le texte du lien lui-même décrive sa destination/son objet (ex. « Télécharger le guide tarifaire 2026 » plutôt que « Télécharger »), ou confirmez que le contexte environnant rend déjà l’objet clair.'
};
