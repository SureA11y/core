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
  "a11ycore_svg_textAltPresent_hint_fail": "Fournissez un élément <title> ou <desc> avec du texte, ou un nom ARIA (aria-label/aria-labelledby).", "a11ycore_object_textAltPresent_title": "<object> doit fournir une alternative textuelle",
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
      'Utilisez une balise de langue BCP 47 valide dans <html lang="…"> (par exemple : « fr », « en », « fr-FR »).'
};
