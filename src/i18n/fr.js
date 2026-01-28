'use strict';

module.exports = {
  "a11ycore_img_altPresent_title": "<img> doit avoir un attribut alt",
  "a11ycore_img_altPresent_description": "Vérifie que les éléments <img> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.",

  "a11ycore_img_altPresent_summary_fail": "Attribut alt manquant sur <img>.",
  "a11ycore_img_altPresent_hint_fail": "Ajoutez un attribut alt (utilisez alt=\"\" uniquement pour les images décoratives).",
  "a11ycore_area_altPresent_title": '<area> doit avoir un attribut alt',
  "a11ycore_area_altPresent_description":
      'Vérifie que les éléments <area> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.',
  "a11ycore_area_altPresent_summary_fail": 'Attribut alt manquant sur <area>.',
  "a11ycore_area_altPresent_hint_fail":
      'Ajoutez un attribut alt (utilisez alt="" uniquement pour les zones décoratives).',
  "a11ycore_inputImage_altPresent_title": "<input type=\"image\"> doit avoir un attribut alt",
  "a11ycore_inputImage_altPresent_description": "Vérifie que les éléments <input type=\"image\"> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.",
  "a11ycore_inputImage_altPresent_summary_fail": "Attribut alt manquant sur <input type=\"image\">.",
  "a11ycore_inputImage_altPresent_hint_fail": "Ajoutez un attribut alt (utilisez alt=\"\" uniquement lorsqu’un nom accessible séparé est fourni).",
  "a11ycore_ariaHidden_programmaticFocus_review_title": "Vérifier le focus programmatique avec aria-hidden",
  "a11ycore_ariaHidden_programmaticFocus_review_description": "Signale les éléments aria-hidden considérés comme éligibles uniquement via un focus programmatique (ex. tabindex < 0). Vérifiez l’intention de gestion du focus et l’exposition aux technologies d’assistance.",
  "a11ycore_ariaHidden_programmaticFocus_review_summary": "Vérification : un élément aria-hidden est focusable de façon programmatique.",
  "a11ycore_ariaHidden_programmaticFocus_review_hint": "Vérifiez que la gestion du focus est intentionnelle et que l’élément doit rester masqué aux technologies d’assistance.",
  "a11ycore_canvas_textAltPresent_title": "<canvas> doit fournir une alternative textuelle",
  "a11ycore_canvas_textAltPresent_description": "Vérifie que les éléments <canvas> fournissent une alternative textuelle via un contenu de repli ou un nom accessible.",
  "a11ycore_canvas_textAltPresent_summary_fail": "Alternative textuelle manquante pour <canvas>.",
  "a11ycore_canvas_textAltPresent_hint_fail": "Fournissez un texte de repli dans <canvas> ou un nom accessible (par ex. aria-label/aria-labelledby).",
  "a11ycore_svg_textAltPresent_title": "<svg> doit fournir une alternative textuelle",
  "a11ycore_svg_textAltPresent_description": "Vérifie que les éléments <svg> en ligne fournissent une alternative textuelle via <title>/<desc> ou un nom ARIA.",
  "a11ycore_svg_textAltPresent_summary_fail": "Alternative textuelle manquante pour <svg>.",
  "a11ycore_svg_textAltPresent_hint_fail": "Fournissez un élément <title> ou <desc> avec du texte, ou un nom ARIA (aria-label/aria-labelledby).",
  "a11ycore_object_textAltPresent_title": "<object> doit fournir une alternative textuelle",
  "a11ycore_object_textAltPresent_description": "Vérifie que les éléments <object> fournissent une alternative textuelle via un contenu de repli ou un nom accessible.",
  "a11ycore_object_textAltPresent_summary_fail": "Alternative textuelle manquante pour <object>.",
  "a11ycore_object_textAltPresent_hint_fail": "Fournissez un contenu de repli pertinent dans <object>, ou ajoutez un nom accessible (aria-label/aria-labelledby).",
  "a11ycore_embed_textAltPresent_title": "<embed> doit fournir une alternative textuelle",
  "a11ycore_embed_textAltPresent_description": "Vérifie que les éléments <embed> fournissent une alternative textuelle via un nom accessible.",
  "a11ycore_embed_textAltPresent_summary_fail": "Alternative textuelle manquante pour <embed>.",
  "a11ycore_embed_textAltPresent_hint_fail": "Ajoutez un nom accessible à <embed> (aria-label/aria-labelledby).",
  "a11ycore_img_altQuality_title": "<img> : texte alt à vérifier (revue manuelle)",
  "a11ycore_img_altQuality_description": "Signale les éléments <img> dont l’attribut alt n’est pas vide afin de vérifier manuellement sa pertinence.",
  "a11ycore_img_altQuality_summary_cantTell": "Vérifiez le texte alt de <img> (exactitude et pertinence).",
  "a11ycore_img_altQuality_hint_cantTell": "Assurez-vous que le texte alt exprime le but/l’information de l’image dans son contexte (ni redondant, ni nom de fichier).",
  "a11ycore_img_altDecorative_title": "<img> avec alt=\"\" : décoratif à confirmer (revue manuelle)",
  "a11ycore_img_altDecorative_description": "Signale les éléments <img> dont l’attribut alt est vide afin de confirmer qu’ils sont purement décoratifs.",
  "a11ycore_img_altDecorative_summary_cantTell": "Vérifiez si <img> est décoratif (alt=\"\").",
  "a11ycore_img_altDecorative_hint_cantTell": "Confirmez que l’image est purement décorative. Sinon, fournissez un texte alt pertinent.",
  "a11ycore_area_altQuality_title": "<area> : texte alt à vérifier (revue manuelle)",
  "a11ycore_area_altQuality_description": "Signale les éléments <area> dont l’attribut alt n’est pas vide afin de vérifier manuellement sa pertinence.",
  "a11ycore_area_altQuality_summary_cantTell": "Vérifiez le texte alt de <area> (exactitude et pertinence).",
  "a11ycore_area_altQuality_hint_cantTell": "Assurez-vous que le texte alt identifie la destination/l’action de la zone dans son contexte.",
  "a11ycore_area_altDecorative_title": "<area> avec alt=\"\" : décoratif à confirmer (revue manuelle)",
  "a11ycore_area_altDecorative_description": "Signale les éléments <area> dont l’attribut alt est vide afin de confirmer qu’ils sont décoratifs ou non informatifs.",
  "a11ycore_area_altDecorative_summary_cantTell": "Vérifiez si <area> est décoratif (alt=\"\").",
  "a11ycore_area_altDecorative_hint_cantTell": "Confirmez que la zone n’a pas de fonction ni d’information. Sinon, fournissez un texte alt pertinent.",
  "a11ycore_inputImage_altQuality_title": "<input type=\"image\"> : texte alt à vérifier (revue manuelle)",
  "a11ycore_inputImage_altQuality_description": "Signale les éléments <input type=\"image\"> dont l’attribut alt n’est pas vide afin de vérifier manuellement sa pertinence.",
  "a11ycore_inputImage_altQuality_summary_cantTell": "Vérifiez le texte alt de <input type=\"image\"> (exactitude et pertinence).",
  "a11ycore_inputImage_altQuality_hint_cantTell": "Assurez-vous que le texte alt décrit l’action du contrôle (ex. « Rechercher », « Envoyer ») dans son contexte.",
  "a11ycore_inputImage_altDecorative_title": "<input type=\"image\"> avec alt=\"\" : à vérifier (revue manuelle)",
  "a11ycore_inputImage_altDecorative_description": "Signale les éléments <input type=\"image\"> dont l’attribut alt est vide afin de vérifier manuellement (souvent inadapté pour un contrôle fonctionnel).",
  "a11ycore_inputImage_altDecorative_summary_cantTell": "Vérifiez <input type=\"image\"> avec alt=\"\".",
  "a11ycore_inputImage_altDecorative_hint_cantTell": "Ce contrôle est généralement fonctionnel. Confirmez qu’un nom accessible équivalent existe, sinon fournissez un texte alt pertinent.",
  "a11ycore_canvas_textAltQuality_title": "<canvas> : alternative textuelle à vérifier (revue manuelle)",
  "a11ycore_canvas_textAltQuality_description": "Signale les éléments <canvas> pour lesquels une alternative textuelle a été détectée, afin de vérifier manuellement son équivalence.",
  "a11ycore_canvas_textAltQuality_summary_cantTell": "Vérifiez l’alternative textuelle de <canvas> (équivalence et pertinence).",
  "a11ycore_canvas_textAltQuality_hint_cantTell": "Confirmez que le texte de secours ou le nom accessible transmet la même information/fonction que le contenu du canvas.",
  "a11ycore_svg_textAltQuality_title": "<svg> : alternative textuelle à vérifier (revue manuelle)",
  "a11ycore_svg_textAltQuality_description": "Signale les graphiques <svg> pour lesquels une alternative textuelle a été détectée, afin de vérifier manuellement sa pertinence.",
  "a11ycore_svg_textAltQuality_summary_cantTell": "Vérifiez l’alternative textuelle de <svg> (exactitude et pertinence).",
  "a11ycore_svg_textAltQuality_hint_cantTell": "Confirmez que <title>/<desc> ou le nom ARIA transmet le sens/le but du graphique dans son contexte.",
  "a11ycore_object_textAltQuality_title": "<object> : alternative textuelle à vérifier (revue manuelle)",
  "a11ycore_object_textAltQuality_description": "Signale les éléments <object> avec contenu de secours ou nom détecté, afin de vérifier manuellement l’équivalence.",
  "a11ycore_object_textAltQuality_summary_cantTell": "Vérifiez l’alternative textuelle de <object> (équivalence et pertinence).",
  "a11ycore_object_textAltQuality_hint_cantTell": "Confirmez que le contenu de secours ou le nom ARIA fournit une alternative équivalente au contenu embarqué.",
  "a11ycore_embed_textAltQuality_title": "<embed> : alternative textuelle à vérifier (revue manuelle)",
  "a11ycore_embed_textAltQuality_description": "Signale les éléments <embed> avec nom détecté, afin de vérifier manuellement sa pertinence.",
  "a11ycore_embed_textAltQuality_summary_cantTell": "Vérifiez l’alternative textuelle de <embed> (exactitude et pertinence).",
  "a11ycore_embed_textAltQuality_hint_cantTell": "Confirmez que le nom ARIA ou l’attribut title identifie correctement le contenu embarqué dans son contexte.",
  "a11ycore_videoPoster_textAltPresent_title": "L’image poster de <video> doit avoir une alternative textuelle",
  "a11ycore_videoPoster_textAltPresent_description": "Vérifie que les éléments <video> avec une image poster fournissent une alternative textuelle (nom accessible ou texte de repli).",
  "a11ycore_videoPoster_textAltPresent_summary_fail": "Alternative textuelle manquante pour l’image poster de <video>.",
  "a11ycore_videoPoster_textAltPresent_hint_fail": "Fournissez un nom accessible (par ex. aria-label/aria-labelledby) ou un texte de repli pertinent dans <video>.",
  "a11ycore_svgImage_textAltPresent_title": "<image> dans un SVG doit avoir une alternative textuelle",
  "a11ycore_svgImage_textAltPresent_description": "Vérifie que les éléments SVG <image> fournissent une alternative textuelle via <title>/<desc> ou un nom accessible ARIA.",
  "a11ycore_svgImage_textAltPresent_summary_fail": "Alternative textuelle manquante sur <image> (SVG).",
  "a11ycore_svgImage_textAltPresent_hint_fail": "Ajoutez un <title> (et éventuellement <desc>) dans <image>, ou fournissez aria-label/aria-labelledby.",
  "a11ycore_formControl_programmaticLabelPresent_title":
      "Les contrôles de formulaire doivent avoir un libellé programmatique",

  "a11ycore_formControl_programmaticLabelPresent_description":
      "Vérifie que les contrôles de formulaire ont un libellé programmatique via <label>, aria-label ou aria-labelledby.",

  "a11ycore_formControl_programmaticLabelPresent_summary_fail":
      "Le contrôle de formulaire n’a pas de libellé programmatique.",

  "a11ycore_formControl_programmaticLabelPresent_hint_fail":
      "Associez un <label>, ou utilisez aria-label / aria-labelledby (placeholder/title ne sont pas des libellés).",


  'a11ycore_formControlAccessibleName_description': 'Échec lorsqu’un contrôle de formulaire applicable n’a pas de nom accessible (ex. label, aria-label, aria-labelledby).',
  'a11ycore_formControlAccessibleName_hint_fail': 'Fournissez un nom accessible via un <label>, aria-label ou aria-labelledby.',
  'a11ycore_formControlAccessibleName_summary_fail': 'Le contrôle de formulaire n’a pas de nom accessible.',
  'a11ycore_formControlAccessibleName_title': 'Les champs de formulaire doivent avoir un nom accessible.',
  'a11ycore_linksTargetBlankNoopener_description': 'Échec lorsqu’un lien avec target="_blank" n’inclut pas rel="noopener" (risque de sécurité via window.opener).',
  'a11ycore_linksTargetBlankNoopener_hint_cantTell': 'Ajoutez rel="noopener" (et éventuellement noreferrer) aux liens avec target="_blank".',
  'a11ycore_linksTargetBlankNoopener_summary_cantTell': 'Lien avec target="_blank" sans rel="noopener".',
  'a11ycore_linksTargetBlankNoopener_title': 'Les liens qui s’ouvrent dans un nouvel onglet doivent utiliser rel="noopener".',
  'a11ycore_manualReview_description': 'Cette règle renvoie toujours cantTell et nécessite une vérification manuelle.',
  'a11ycore_manualReview_hint_cantTell': 'Examinez la page et validez ce point manuellement selon le contexte.',
  'a11ycore_manualReview_summary_cantTell': 'Vérification manuelle requise.',
  'a11ycore_manualReview_title': 'Vérification manuelle requise.',
  "rules.a11ycore-img-alt-suspicious.meta.title":
      "Texte alternatif suspect nécessitant une vérification",

  "rules.a11ycore-img-alt-suspicious.meta.description":
      "Identifie les images dont le texte alternatif correspond à des motifs suspects courants (nom de fichier, URL, texte fictif ou terme générique) et nécessite une vérification manuelle.",

  "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.summary":
      "Le texte alternatif de l’image semble suspect (« {{alt}} » ressemble à {{pattern}}) et nécessite une vérification.",

  "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.hint":
      "Vérifiez le texte alternatif. Évitez les noms de fichiers, les URL, les textes fictifs ou les termes génériques, et assurez-vous que l’alternative textuelle décrit la fonction ou le contenu de l’image dans son contexte.",
  "a11ycore_formControl_programmaticLabelQuality_title":
      "Les champs de formulaire ne devraient pas dépendre du placeholder ou du title comme libellé principal",
  "a11ycore_formControl_programmaticLabelQuality_description":
      "Signale les champs de formulaire dont le nom accessible est principalement dérivé du placeholder ou de l’attribut title. Préférez un <label> ou aria-labelledby.",
  "a11ycore_formControl_programmaticLabelQuality_summary_cantTell":
      "Le libellé principal du champ provient de {{methodLabel}}.",
  "a11ycore_formControl_programmaticLabelQuality_hint_cantTell":
      "Préférez un <label> persistant ou aria-labelledby. Évitez d’utiliser placeholder/title comme libellé principal.",
  "a11ycore_html_lang_attr_title": 'La langue de la page est déclarée',
  "a11ycore_html_lang_attr_description": 'Vérifie que la langue par défaut de la page est déclarée de manière programmatique.',

  "a11ycore_html_lang_attr_missing_absent":
      'La langue par défaut de la page n’est pas déclarée.',
  "a11ycore_html_lang_attr_hint_missing_absent":
      'Ajoutez un attribut lang à l’élément <html> (par exemple : <html lang="fr">).',

  "a11ycore_html_lang_attr_missing_empty":
      'La langue par défaut de la page est déclarée mais vide.',

  "a11ycore_html_lang_attr_hint_missing_empty":
      'Renseignez une valeur de langue valide dans l’attribut lang de l’élément <html> (par exemple : <html lang="fr">).',

  "a11ycore_html_lang_attr_invalid":
      'La langue par défaut de la page est déclarée, mais la valeur « {{lang}} » n’est pas une balise de langue valide.',
  "a11ycore_html_lang_attr_hint_invalid":
      'Utilisez une balise de langue BCP 47 valide dans <html lang="…"> (par exemple : « fr », « en », « fr-FR »).',

  "a11ycore_mediaTranscriptPresent_title":
      "Média temporel : preuve de transcription ou d’alternative textuelle",

  "a11ycore_mediaTranscriptPresent_description":
      "Détecte les éléments audio et vidéo pour lesquels la présence d’une transcription ou d’une autre alternative textuelle n’est pas clairement établie dans le contenu de la page. Cette règle est volontairement conservatrice et retourne cantTell lorsque la preuve est absente ou invérifiable.",

  "a11ycore_mediaTranscriptPresent_summary_cantTell_missing":
      "Aucune transcription ou autre alternative textuelle pour ce média temporel n’est clairement établie sur la page.",

  "a11ycore_mediaTranscriptPresent_hint_cantTell_missing":
      "Fournir une transcription ou une autre alternative textuelle clairement identifiée pour les médias préenregistrés audio seuls ou vidéo seuls, par exemple une section ou un lien « Transcription » visible.",

  "a11ycore_mediaTranscriptPresent_summary_cantTell_unverified":
      "Une transcription ou une autre alternative textuelle peut être disponible pour ce média temporel, mais elle n’a pas pu être vérifiée à partir du contenu de la page.",

  "a11ycore_mediaTranscriptPresent_hint_cantTell_unverified":
      "Aucune transcription ou autre alternative textuelle pour cet élément {element} n’est clairement établie sur la page.",

  "a11ycore_pageTitlePresent_title": "La page possède un titre non vide",
  "a11ycore_pageTitlePresent_description":
      "Vérifie que la page contient un élément <title> non vide permettant d’identifier la page.",

  "a11ycore_pageTitlePresent_summary_fail":
      "La page ne possède pas de titre non vide.",
  "a11ycore_pageTitlePresent_hint_fail":
      "Ajouter un élément <title> contenant un texte décrivant le sujet ou l’objectif de la page.",
  "a11ycore_pageTitlePatterns_title":
      "Motifs de titres de page pouvant indiquer un manque de descriptivité",
  "a11ycore_pageTitlePatterns_description":
      "Identifie des motifs de titres de page pouvant indiquer un manque de descriptivité, tels que des titres génériques, dupliqués ou excessivement modélisés. Cette règle fournit des signaux de revue et n’entraîne pas d’échec automatique.",

  "a11ycore_pageTitlePatterns_summary_cantTell":
      "Le titre de la page peut ne pas être suffisamment descriptif pour identifier le sujet ou l’objectif de la page.",

  "a11ycore_pageTitlePresent_summary_fail_missing":
      "La page ne contient pas d’élément <title>.",
  "a11ycore_pageTitlePresent_summary_fail_empty":
      "La page contient un élément <title> vide.",
  "a11ycore_pageTitlePatterns_summary_cantTell_duplicateAcrossPages":
      "Plusieurs pages partagent le même titre, ce qui peut rendre plus difficile la distinction entre les pages ({{duplicateGroups}} groupes dupliqués sur {{pagesAnalyzed}} pages). Exemple : « {{exampleTitle}} ».",

  "a11ycore_pageTitlePatterns_summary_cantTell_templatedAcrossPages":
      "De nombreux titres de page semblent fortement modélisés, ce qui peut réduire la capacité des titres à distinguer les pages ({{pagesAnalyzed}} pages).",

  "a11ycore_pageTitlePatterns_summary_cantTell_generic":
      "Le titre de la page est générique et peut ne pas identifier le sujet ou l’objectif de la page.",

  "a11ycore_pageTitlePatterns_summary_cantTell_veryShort":
      "Le titre de la page est très court et peut ne pas identifier le sujet ou l’objectif de la page.",

  "a11ycore_pageTitlePatterns_summary_cantTell_templateLike":
      "Le titre de la page semble modélisé et peut ne pas identifier le sujet ou l’objectif de la page.",

// Un seul conseil pour tous les cas
  "a11ycore_pageTitlePatterns_hint_cantTell":
      "Vérifier que le titre de la page identifie clairement le sujet ou l’objectif de la page et permet de la distinguer des autres pages.",

  // --- Contraste DOM : calculabilité (porte d’entrée)
  "a11ycore_contrastComputable_title": 'Le contraste des couleurs est calculable pour le texte rendu',
  "a11ycore_contrastComputable_description":
      'Détermine si suffisamment d’informations sont disponibles pour calculer le contraste WCAG du texte visible (ex. pas de dégradés/images/modes de fusion rendant l’arrière-plan indéterminé).',
  "a11ycore_contrastComputable_pass_allComputable":
      'Le contraste est calculable pour tout le texte éligible ({{eligibleTextCount}} nœud(s) de texte).',

  "a11ycore_contrastComputable_cantTell_generic":
      'Le contraste peut ne pas être calculable ({{reasonCode}}).',

  "a11ycore_contrastComputable_cantTell_bgImageOrGradient":
      'Le contraste n’est pas calculable car l’arrière-plan utilise une image ou un dégradé ({{blockerProperty}}={{blockerValue}}).',

  "a11ycore_contrastComputable_cantTell_mixBlendMode":
      'Le contraste n’est pas calculable car mix-blend-mode est utilisé ({{blockerProperty}}={{blockerValue}}).',

  "a11ycore_contrastComputable_cantTell_filter":
      'Le contraste n’est pas calculable car filter/backdrop-filter est utilisé ({{blockerProperty}}={{blockerValue}}).',

  "a11ycore_contrastComputable_cantTell_rootNotOpaque":
      'Le contraste n’est pas calculable car l’arrière-plan effectif n’est pas totalement opaque à la racine (alpha={{backgroundAlpha}}).',

  "a11ycore_contrastComputable_cantTell_foregroundUnparsable":
      'Le contraste n’est pas calculable car la couleur de premier plan calculée n’a pas pu être analysée.',

  "a11ycore_contrastComputable_cantTell_engineFailure":
      'La calculabilité du contraste n’a pas pu être déterminée en raison d’une erreur interne du moteur ({{reasonCode}}).',

// --- Contraste DOM : minimum AA (1.4.3)
  "a11ycore_contrastMinimum_title": 'Le texte respecte le contraste minimum (AA)',
  "a11ycore_contrastMinimum_description":
      'Vérifie que le texte visible atteint un ratio de contraste d’au moins 4,5:1 (texte normal) ou 3,0:1 (grand texte), lorsque le contraste est calculable à partir du CSS.',

  "a11ycore_contrastMinimum_fail_belowThreshold":
      "L’élément présente un contraste de couleur insuffisant de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).",

  "a11ycore_contrastMinimum_pass_allAboveThreshold":
      'Tout le texte calculable respecte le contraste minimum (AA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.',

  "a11ycore_contrastMinimum_notApplicable_noComputableText":
      'Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.',

  "a11ycore_contrastMinimum_cantTell_engineFailure":
      'Le contraste minimum (AA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).',

// --- Contraste DOM : renforcé AAA (1.4.6)
  "a11ycore_contrastEnhanced_title": 'Le texte respecte le contraste renforcé (AAA)',
  "a11ycore_contrastEnhanced_description":
      'Vérifie que le texte visible atteint un ratio de contraste d’au moins 7,0:1 (texte normal) ou 4,5:1 (grand texte), lorsque le contraste est calculable à partir du CSS.',

// --- 1) Contraste du texte (Minimum) — WCAG 1.4.3 (AA)
  "a11ycore_dom_textContrastMinimum_title": "Le texte doit avoir un contraste suffisant (minimum)",
  "a11ycore_dom_textContrastMinimum_description": "Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.3 (AA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.",

  "a11ycore_dom_textContrastMinimum_summary_fail":
      "Contraste de texte insuffisant : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
  "a11ycore_dom_textContrastMinimum_hint_fail":
      "Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour cette taille/épaisseur de texte.",

  "a11ycore_dom_textContrastMinimum_summary_pass":
      "Contraste de texte conforme : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",

  "a11ycore_dom_textContrastMinimum_summary_cantTell":
      "Impossible de calculer fiablement le contraste du texte car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).",
  "a11ycore_dom_textContrastMinimum_hint_cantTell":
      "Vérifiez manuellement le contraste lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.",

  "a11ycore_contrastEnhanced_fail_belowThreshold":
      "L’élément présente un contraste de couleur insuffisant renforcé (AAA) de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).",

  "a11ycore_contrastEnhanced_pass_allAboveThreshold":
      'Tout le texte calculable respecte le contraste renforcé (AAA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.',

  "a11ycore_contrastEnhanced_notApplicable_noComputableText":
      'Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.',

  "a11ycore_contrastEnhanced_cantTell_engineFailure":
      'Le contraste renforcé (AAA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).',

  // --- 2) Contraste du texte (Renforcé) — WCAG 1.4.6 (AAA)
  "a11ycore_dom_textContrastEnhanced_title": "Le texte doit avoir un contraste suffisant (renforcé)",
  "a11ycore_dom_textContrastEnhanced_description": "Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.6 (AAA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.",

  "a11ycore_dom_textContrastEnhanced_summary_fail":
      "Contraste de texte renforcé insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
  "a11ycore_dom_textContrastEnhanced_hint_fail":
      "Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour le niveau renforcé (AAA).",

  "a11ycore_dom_textContrastEnhanced_summary_pass":
      "Contraste de texte renforcé conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",

  "a11ycore_dom_textContrastEnhanced_summary_cantTell":
      "Impossible de calculer fiablement le contraste renforcé car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).",
  "a11ycore_dom_textContrastEnhanced_hint_cantTell":
      "Vérifiez manuellement le contraste renforcé (AAA) lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.",

  // --- 3) Contraste non-textuel — WCAG 1.4.11 (AA)
  "a11ycore_dom_nonTextContrast_title": "Les composants d’interface et les graphiques doivent avoir un contraste suffisant",
  "a11ycore_dom_nonTextContrast_description": "Vérifie le contraste des informations visuelles non textuelles (contours de composants, états, et objets graphiques porteurs d’information) selon WCAG 2.2 SC 1.4.11 (AA).",

  "a11ycore_dom_nonTextContrast_summary_fail":
      "Contraste non-textuel insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.",
  "a11ycore_dom_nonTextContrast_hint_fail":
      "Ajustez les couleurs du composant/graphique afin d’atteindre au moins {{requiredRatio}}:1 pour le contour perceptible ou l’information visuelle essentielle.",

  "a11ycore_dom_nonTextContrast_summary_pass":
      "Contraste non-textuel conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.",

  "a11ycore_dom_nonTextContrast_summary_cantTell":
      "Impossible de calculer fiablement le contraste non-textuel car l’arrière-plan effectif ou les pixels peints ne sont pas déterminables (ex. image/dégradé/vidéo/canvas, transparence ou fusion complexes).",
  "a11ycore_dom_nonTextContrast_hint_cantTell":
      "Vérifiez manuellement le contraste du composant/graphique par rapport aux couleurs adjacentes ; assurez-vous qu’il respecte {{requiredRatio}}:1 pour l’information visuelle non textuelle essentielle.",
  "a11ycore_contrastEnhanced_pass_allTextMeetsThreshold": "Tout le texte calculable respecte le contraste renforcé (AAA).",
  "a11ycore_contrastMinimum_pass_allTextMeetsThreshold": "Tout le texte calculable respecte le contraste minimum (AA).",
  a11ycore_roleImg_textAlternativePresent_title:
      'Les éléments avec role="img" doivent avoir une alternative textuelle accessible',

  a11ycore_roleImg_textAlternativePresent_description:
      'Vérifie que les éléments ayant le rôle "img" fournissent une alternative textuelle accessible via aria-label ou aria-labelledby.',

  // Résumé d’échec & aide
  a11ycore_roleImg_textAlternativePresent_summary_fail:
      'L’élément avec le rôle "img" ne possède pas d’alternative textuelle accessible.',

  a11ycore_roleImg_textAlternativePresent_hint_fail:
      'Fournissez une alternative textuelle à l’aide de aria-label ou de aria-labelledby pointant vers un texte non vide.'

}