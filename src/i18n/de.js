/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

module.exports = {
  img_altPresent_title: '<img> muss ein alt-Attribut haben',
  img_altPresent_description:
    'Prüft, ob <img>-Elemente ein alt-Attribut bereitstellen, um einen Mechanismus für eine Textalternative zu unterstützen.',

  img_altPresent_summary_fail: 'Fehlendes alt-Attribut auf <img>.',
  img_altPresent_hint_fail:
    'Fügen Sie ein alt-Attribut hinzu (verwenden Sie alt="" nur für dekorative Bilder).',
  area_altPresent_title: '<area> muss ein alt-Attribut haben',
  area_altPresent_description:
    'Prüft, ob <area>-Elemente ein alt-Attribut bereitstellen, um einen Mechanismus für eine Textalternative zu unterstützen.',
  area_altPresent_summary_fail: 'Fehlendes alt-Attribut auf <area>.',
  area_altPresent_hint_fail:
    'Fügen Sie ein alt-Attribut hinzu (verwenden Sie alt="" nur für dekorative Bereiche).',
  inputImage_altPresent_title: '<input type="image"> muss ein alt-Attribut haben',
  inputImage_altPresent_description:
    'Prüft, ob <input type="image">-Elemente ein alt-Attribut bereitstellen, um einen Mechanismus für eine Textalternative zu unterstützen.',
  inputImage_altPresent_summary_fail: 'Fehlendes alt-Attribut auf <input type="image">.',
  inputImage_altPresent_hint_fail:
    'Fügen Sie ein alt-Attribut hinzu (verwenden Sie alt="" nur, wenn ein separater zugänglicher Name bereitgestellt wird).',
  inputImage_altPresent_summary_defaultName:
    'Der zugaengliche Name ist der Browser-Standard fuer eine Bildschaltflaeche und sagt nichts aus.',
  inputImage_altPresent_hint_defaultName:
    'Ersetzen Sie ihn durch Text, der die Aktion beschreibt, zum Beispiel "Suchen".',
  inputImage_altPresent_summary_emptyAlt:
    'Ein leeres alt="" auf <input type="image"> laesst das Steuerelement ohne Namen.',
  inputImage_altPresent_hint_emptyAlt:
    'Beschreiben Sie die Aktion in alt, oder benennen Sie das Steuerelement mit aria-label oder aria-labelledby.',
  ariaHidden_programmaticFocus_review_title: 'Programmatischen Fokus bei aria-hidden überprüfen',
  ariaHidden_programmaticFocus_review_description:
    'Markiert Elemente, die aria-hidden sind, aber aufgrund von programmatischem Fokus (z. B. tabindex < 0) als geeignet gelten. Überprüfen Sie die beabsichtigte Fokusverwaltung und die Sichtbarkeit für assistive Technologien.',
  ariaHidden_programmaticFocus_review_summary:
    'Überprüfung: Ein aria-hidden-Element ist programmatisch fokussierbar.',
  ariaHidden_programmaticFocus_review_hint:
    'Prüfen Sie, ob die Fokusverwaltung beabsichtigt ist und ob das Element vor assistiven Technologien verborgen bleiben soll.',
  canvas_textAltPresent_title: '<canvas> muss eine Textalternative bereitstellen',
  canvas_textAltPresent_description:
    'Prüft, ob <canvas>-Elemente eine Textalternative über Ersatzinhalt oder einen zugänglichen Namen bereitstellen.',
  canvas_textAltPresent_summary_fail: 'Fehlende Textalternative für <canvas>.',
  canvas_textAltPresent_hint_fail:
    'Stellen Sie einen Ersatztext innerhalb von <canvas> oder einen zugänglichen Namen bereit (z. B. aria-label/aria-labelledby).',
  svg_textAltPresent_title: '<svg> muss eine Textalternative bereitstellen',
  svg_textAltPresent_description:
    'Prüft, ob inline eingebundene <svg>-Elemente eine Textalternative über ein <title>-Element oder einen ARIA-Namen bereitstellen (ein <desc>-Element allein zählt nicht).',
  svg_textAltPresent_summary_fail: 'Fehlende Textalternative für <svg>.',
  svg_textAltPresent_hint_fail:
    'Fügen Sie ein <title>-Element mit Text oder einen ARIA-Namen hinzu (aria-label/aria-labelledby) — ein <desc>-Element allein liefert keinen zugänglichen Namen.',
  object_textAltPresent_title: '<object> muss eine Textalternative bereitstellen',
  object_textAltPresent_description:
    'Prüft, ob <object>-Elemente eine Textalternative über Ersatzinhalt oder einen zugänglichen Namen bereitstellen.',
  object_textAltPresent_summary_fail: 'Fehlende Textalternative für <object>.',
  object_textAltPresent_hint_fail:
    'Stellen Sie sinnvollen Ersatzinhalt innerhalb von <object> bereit, fügen Sie einen zugänglichen Namen hinzu (aria-label/aria-labelledby), oder verwenden Sie ein title-Attribut als Notlösung.',
  embed_textAltPresent_title: '<embed> muss eine Textalternative bereitstellen',
  embed_textAltPresent_description:
    'Prüft, ob <embed>-Elemente eine Textalternative über einen zugänglichen Namen bereitstellen.',
  embed_textAltPresent_summary_fail: 'Fehlende Textalternative für <embed>.',
  embed_textAltPresent_hint_fail:
    'Fügen Sie <embed> einen zugänglichen Namen hinzu (vorzugsweise aria-label/aria-labelledby, oder ein title-Attribut als Notlösung).',
  img_altQuality_title: '<img>-Alternativtext muss angemessen sein (manuelle Überprüfung)',
  img_altQuality_description:
    'Markiert <img>-Elemente mit nicht leerem Alternativtext zur manuellen Überprüfung der Angemessenheit.',
  img_altQuality_summary_cantTell:
    'Überprüfen Sie den Alternativtext von <img> auf Genauigkeit und Angemessenheit.',
  img_altQuality_hint_cantTell:
    'Stellen Sie sicher, dass der Alternativtext den Zweck/die Information des Bildes im Kontext vermittelt (nicht redundant, kein Dateiname).',
  img_altDecorative_title: '<img> mit alt="" muss dekorativ sein (manuelle Überprüfung)',
  img_altDecorative_description:
    'Markiert <img>-Elemente mit leerem alt zur manuellen Überprüfung, ob sie rein dekorativ sind.',
  img_altDecorative_summary_cantTell: 'Überprüfen Sie, ob <img> dekorativ ist (alt="").',
  img_altDecorative_hint_cantTell:
    'Bestätigen Sie, dass das Bild rein dekorativ ist. Falls es Information oder Funktion vermittelt, stellen Sie einen aussagekräftigen Alternativtext bereit.',
  area_altQuality_title: '<area>-Alternativtext muss angemessen sein (manuelle Überprüfung)',
  area_altQuality_description:
    'Markiert <area>-Elemente mit nicht leerem Alternativtext zur manuellen Überprüfung der Angemessenheit.',
  area_altQuality_summary_cantTell:
    'Überprüfen Sie den Alternativtext von <area> auf Genauigkeit und Angemessenheit.',
  area_altQuality_hint_cantTell:
    'Stellen Sie sicher, dass der Alternativtext das Ziel/die Aktion des Bereichs der Image-Map im Kontext identifiziert.',
  area_altDecorative_title: '<area> mit alt="" muss dekorativ sein (manuelle Überprüfung)',
  area_altDecorative_description:
    'Markiert <area>-Elemente mit leerem alt zur manuellen Überprüfung, ob sie dekorativ/nicht informativ sind.',
  area_altDecorative_summary_cantTell: 'Überprüfen Sie, ob <area> dekorativ ist (alt="").',
  area_altDecorative_hint_cantTell:
    'Bestätigen Sie, dass der Bereich keine Information oder Funktion vermittelt. Falls er interaktiv oder bedeutsam ist, stellen Sie einen aussagekräftigen Alternativtext bereit.',
  inputImage_altQuality_title:
    '<input type="image">-Alternativtext muss angemessen sein (manuelle Überprüfung)',
  inputImage_altQuality_description:
    'Markiert <input type="image">-Elemente mit nicht leerem Alternativtext zur manuellen Überprüfung der Angemessenheit.',
  inputImage_altQuality_summary_cantTell:
    'Überprüfen Sie den Alternativtext von <input type="image"> auf Genauigkeit und Angemessenheit.',
  inputImage_altQuality_hint_cantTell:
    'Stellen Sie sicher, dass der Alternativtext die Aktion des Elements beschreibt (z. B. „Suchen“, „Bestellung abschicken“) im jeweiligen Kontext.',
  inputImage_altDecorative_title:
    '<input type="image"> mit alt="" muss angemessen sein (manuelle Überprüfung)',
  inputImage_altDecorative_description:
    'Markiert <input type="image">-Elemente mit leerem alt zur manuellen Überprüfung (in der Regel bei funktionalen Formularelementen nicht angemessen).',
  inputImage_altDecorative_summary_cantTell: 'Überprüfen Sie <input type="image"> mit alt="".',
  inputImage_altDecorative_hint_cantTell:
    'Dieses Formularelement ist typischerweise funktional. Bestätigen Sie, dass an anderer Stelle ein gleichwertiger zugänglicher Name vorhanden ist, oder stellen Sie einen aussagekräftigen Alternativtext bereit.',
  canvas_textAltQuality_title:
    '<canvas>-Textalternative muss angemessen sein (manuelle Überprüfung)',
  canvas_textAltQuality_description:
    'Markiert <canvas>-Elemente mit erkannter Textalternative zur manuellen Überprüfung von Gleichwertigkeit und Angemessenheit.',
  canvas_textAltQuality_summary_cantTell:
    'Überprüfen Sie die Textalternative von <canvas> auf Gleichwertigkeit und Angemessenheit.',
  canvas_textAltQuality_hint_cantTell:
    'Bestätigen Sie, dass der Ersatztext oder der zugängliche Name dieselbe Information/Funktion wie der Canvas-Inhalt vermittelt.',
  svg_textAltQuality_title: '<svg>-Textalternative muss angemessen sein (manuelle Überprüfung)',
  svg_textAltQuality_description:
    'Markiert zutreffende <svg>-Grafiken mit erkannter Textalternative zur manuellen Überprüfung der Angemessenheit.',
  svg_textAltQuality_summary_cantTell:
    'Überprüfen Sie die Textalternative von <svg> auf Genauigkeit und Angemessenheit.',
  svg_textAltQuality_hint_cantTell:
    'Bestätigen Sie, dass <title>/<desc> oder der ARIA-Name die Bedeutung/den Zweck der Grafik im Kontext vermittelt.',
  object_textAltQuality_title:
    '<object>-Textalternative muss angemessen sein (manuelle Überprüfung)',
  object_textAltQuality_description:
    'Markiert <object>-Elemente mit erkanntem Ersatzinhalt oder Namen zur manuellen Überprüfung von Gleichwertigkeit und Angemessenheit.',
  object_textAltQuality_summary_cantTell:
    'Überprüfen Sie die Textalternative von <object> auf Gleichwertigkeit und Angemessenheit.',
  object_textAltQuality_hint_cantTell:
    'Bestätigen Sie, dass der Ersatzinhalt oder der ARIA-Name eine gleichwertige Alternative für den eingebetteten Inhalt bietet.',
  embed_textAltQuality_title: '<embed>-Textalternative muss angemessen sein (manuelle Überprüfung)',
  embed_textAltQuality_description:
    'Markiert <embed>-Elemente mit erkanntem Namen zur manuellen Überprüfung der Angemessenheit.',
  embed_textAltQuality_summary_cantTell:
    'Überprüfen Sie die Textalternative von <embed> auf Genauigkeit und Angemessenheit.',
  embed_textAltQuality_hint_cantTell:
    'Bestätigen Sie, dass der ARIA-Name oder der title-Wert den eingebetteten Inhalt im Kontext korrekt identifiziert.',
  videoPoster_textAltPresent_title:
    'Das Vorschaubild (poster) von <video> muss eine Textalternative haben',
  videoPoster_textAltPresent_description:
    'Prüft, ob <video>-Elemente mit einem Vorschaubild (poster) eine Textalternative (zugänglicher Name) bereitstellen.',
  videoPoster_textAltPresent_summary_fail:
    'Fehlende Textalternative für das Vorschaubild (poster) von <video>.',
  videoPoster_textAltPresent_hint_fail:
    'Stellen Sie für das Vorschaubild einen zugänglichen Namen bereit (vorzugsweise aria-label/aria-labelledby, oder ein title-Attribut als Notlösung).',
  svgImage_textAltPresent_title: 'SVG <image> muss eine Textalternative haben',
  svgImage_textAltPresent_description:
    'Prüft, ob SVG-<image>-Elemente eine Textalternative über <title>/<desc> oder einen zugänglichen ARIA-Namen bereitstellen.',
  svgImage_textAltPresent_summary_fail: 'Fehlende Textalternative auf SVG <image>.',
  svgImage_textAltPresent_hint_fail:
    'Fügen Sie innerhalb von <image> ein <title> (und optional <desc>) hinzu, oder stellen Sie aria-label/aria-labelledby bereit.',
  formControl_programmaticLabelPresent_title:
    'Formularelemente müssen eine programmatische Beschriftung haben',
  formControl_programmaticLabelPresent_description:
    'Prüft, ob Formularelemente eine programmatische Beschriftung über <label>, aria-label oder aria-labelledby haben.',
  formControl_programmaticLabelPresent_summary_fail:
    'Dem Formularelement fehlt eine programmatische Beschriftung.',
  formControl_programmaticLabelPresent_hint_fail:
    'Stellen Sie eine <label>-Zuordnung, aria-label oder aria-labelledby bereit (placeholder/title zählen nicht als Beschriftung).',

  formControlAccessibleName_description:
    'Schlägt fehl, wenn ein zutreffendes Formularelement keinen zugänglichen Namen hat (z. B. label, aria-label, aria-labelledby).',
  formControlAccessibleName_hint_fail:
    'Stellen Sie einen zugänglichen Namen über ein <label>, aria-label oder aria-labelledby bereit.',
  formControlAccessibleName_summary_fail: 'Das Formularelement hat keinen zugänglichen Namen.',
  formControlAccessibleName_title: 'Formularelemente müssen einen zugänglichen Namen haben',
  linksTargetBlankNoopener_description:
    'Stellt sicher, dass Links mit target="_blank" die Risiken von Reverse-Tabnabbing verringern.',
  linksTargetBlankNoopener_hint_cantTell: 'Beachten Sie die Hinweise zu dieser Regel.',
  linksTargetBlankNoopener_summary_cantTell:
    'Links, die in einem neuen Tab geöffnet werden, sollten rel="noopener" verwenden',
  linksTargetBlankNoopener_title:
    'Links, die in einem neuen Tab geöffnet werden, sollten rel="noopener" verwenden',
  manualReview_description:
    'Markiert, dass eine manuelle Überprüfung der Tastaturnavigation und der Fokusreihenfolge erforderlich ist.',
  manualReview_hint_cantTell: 'Beachten Sie die Hinweise zu dieser Regel.',
  manualReview_summary_cantTell: 'Manuelle Überprüfung: Tastaturnavigation und Fokusreihenfolge',
  manualReview_title: 'Manuelle Überprüfung: Tastaturnavigation und Fokusreihenfolge',
  'rules.img-alt-suspicious.meta.title': 'Verdächtiger Alternativtext erfordert eine Überprüfung',

  'rules.img-alt-suspicious.meta.description':
    'Identifiziert Bilder, deren Alternativtext gängigen verdächtigen Mustern entspricht (z. B. Dateinamen, URLs, Platzhaltern oder generischen Begriffen), und erfordert eine manuelle Überprüfung.',

  'rules.img-alt-suspicious.occurrence.cantTell.summary':
    'Der Alternativtext des Bildes wirkt verdächtig („{{alt}}“ ähnelt {{pattern}}) und erfordert eine Überprüfung.',

  'rules.img-alt-suspicious.occurrence.cantTell.hint':
    'Überprüfen Sie den Alternativtext. Vermeiden Sie Dateinamen, URLs, Platzhalter oder generische Begriffe, und stellen Sie sicher, dass die Textalternative den Zweck oder die Funktion des Bildes im Kontext beschreibt.',
  formControl_programmaticLabelQuality_title:
    'Formularelemente sollten sich nicht auf placeholder oder title als primäre Beschriftung verlassen',
  formControl_programmaticLabelQuality_description:
    'Markiert Formularelemente, deren berechneter zugänglicher Name sich auf placeholder oder title als primäre Beschriftungsmethode stützt. Bevorzugen Sie <label> oder aria-labelledby.',
  formControl_programmaticLabelQuality_summary_cantTell:
    'Die primäre Beschriftung des Formularelements stammt von {{methodLabel}}.',
  formControl_programmaticLabelQuality_hint_cantTell:
    'Bevorzugen Sie ein dauerhaftes <label> oder aria-labelledby. Verlassen Sie sich nicht auf placeholder/title als primäre Beschriftung.',

  html_lang_attr_title: 'Die Sprache der Seite ist deklariert',
  html_lang_attr_description:
    'Prüft, ob die Standardsprache der Seite programmatisch deklariert ist.',

  html_lang_attr_missing_absent: 'Die Standardsprache der Seite ist nicht deklariert.',
  html_lang_attr_hint_missing_absent:
    'Fügen Sie dem <html>-Element ein lang-Attribut hinzu (zum Beispiel: <html lang="de">).',

  html_lang_attr_missing_empty: 'Die Standardsprache der Seite ist deklariert, aber leer.',
  html_lang_attr_hint_missing_empty:
    'Legen Sie im lang-Attribut des <html>-Elements einen gültigen Sprachwert fest (zum Beispiel: <html lang="de">).',

  html_lang_attr_invalid:
    'Die Standardsprache der Seite ist deklariert, aber der Wert „{{lang}}“ ist kein gültiges Sprach-Tag.',
  html_lang_attr_hint_invalid:
    'Verwenden Sie in <html lang="…"> ein gültiges BCP-47-Sprach-Tag (zum Beispiel: „de“, „fr“, „en-US“).',
  mediaTranscriptPresent_title:
    'Zeitbasierte Medien: Nachweis einer Transkription oder Textalternative',

  mediaTranscriptPresent_description:
    'Findet Audio- und Video-Elemente, bei denen eine Transkription oder eine andere Textalternative im Seiteninhalt nicht eindeutig nachgewiesen ist. Diese Regel ist konservativ ausgelegt und meldet manuelle Überprüfung (cantTell), wenn Nachweise fehlen oder nicht verifiziert werden können.',

  mediaTranscriptPresent_summary_cantTell_missing:
    'Das Vorhandensein einer Transkription oder einer anderen Textalternative für dieses <{{element}}> ist auf der Seite nicht eindeutig nachgewiesen.',

  mediaTranscriptPresent_hint_cantTell_missing:
    'Stellen Sie für vorab aufgezeichnete Nur-Audio- oder Nur-Video-Medien eine klar erkennbare Transkription oder eine andere Textalternative bereit, zum Beispiel einen sichtbaren Abschnitt oder Link „Transkription“.',

  mediaTranscriptPresent_summary_cantTell_unverified:
    'Für dieses zeitbasierte Medium ist möglicherweise eine Transkription oder eine andere Textalternative verfügbar, dies konnte jedoch anhand des Seiteninhalts nicht verifiziert werden.',

  mediaTranscriptPresent_hint_cantTell_unverified:
    'Stellen Sie sicher, dass eine klar erkennbare Transkription oder eine andere Textalternative verfügbar und sichtbar oder programmatisch mit dem Medium auf der Seite verknüpft ist.',
  pageTitlePresent_title: 'Die Seite hat einen nicht leeren Titel',
  pageTitlePresent_description:
    'Prüft, ob die Seite ein nicht leeres <title>-Element enthält, das die Seite identifiziert.',

  pageTitlePresent_summary_fail: 'Die Seite hat keinen nicht leeren Titel.',
  pageTitlePresent_hint_fail:
    'Fügen Sie ein <title>-Element mit Text hinzu, der das Thema oder den Zweck der Seite beschreibt.',
  pageTitlePatterns_title:
    'Seitentitel-Muster, die möglicherweise unzureichend aussagekräftig sind',
  pageTitlePatterns_description:
    'Identifiziert Muster in Seitentiteln, die auf eine geringe Aussagekraft hindeuten können, etwa generische, duplizierte oder übermäßig schablonenhafte Titel. Diese Regel liefert Hinweise zur Überprüfung und schlägt nicht automatisch fehl.',

  pageTitlePatterns_summary_cantTell:
    'Der Seitentitel ist möglicherweise nicht aussagekräftig genug, um das Thema oder den Zweck der Seite zu identifizieren.',

  pageTitlePresent_summary_fail_missing: 'Der Seite fehlt ein <title>-Element.',
  pageTitlePresent_summary_fail_empty: 'Die Seite hat ein leeres <title>.',

  pageTitlePatterns_summary_cantTell_duplicateAcrossPages:
    'Mehrere Seiten teilen sich denselben Titel, was die Unterscheidung der Seiten erschweren kann ({{duplicateGroups}} Duplikatgruppen über {{pagesAnalyzed}} Seiten). Beispiel: „{{exampleTitle}}“.',

  pageTitlePatterns_summary_cantTell_templatedAcrossPages:
    'Viele Seitentitel wirken stark schablonenhaft, was beeinträchtigen kann, wie gut Titel Seiten voneinander unterscheiden ({{pagesAnalyzed}} Seiten).',

  pageTitlePatterns_summary_cantTell_generic:
    'Der Seitentitel ist generisch und identifiziert das Thema oder den Zweck der Seite möglicherweise nicht.',

  pageTitlePatterns_summary_cantTell_veryShort:
    'Der Seitentitel ist sehr kurz und identifiziert das Thema oder den Zweck der Seite möglicherweise nicht.',

  pageTitlePatterns_summary_cantTell_templateLike:
    'Der Seitentitel wirkt schablonenhaft und identifiziert das Thema oder den Zweck der Seite möglicherweise nicht.',

  pageTitlePatterns_hint_cantTell:
    'Überprüfen Sie den Seitentitel und stellen Sie sicher, dass er das Thema oder den Zweck der Seite klar identifiziert und hilft, die Seite von anderen zu unterscheiden.',

  // --- DOM-Kontrast: Berechenbarkeits-Torwächter
  contrastComputable_title: 'Der Farbkontrast ist für gerenderten Text berechenbar',
  contrastComputable_description:
    'Bestimmt, ob ausreichend Informationen verfügbar sind, um den WCAG-Farbkontrast für sichtbaren Text zu berechnen (z. B. keine Verläufe/Bilder/Blend-Modi, die den Hintergrund unbestimmbar machen).',

  contrastComputable_pass_allComputable:
    'Der Kontrast ist für allen zutreffenden Text berechenbar ({{eligibleTextCount}} Textknoten).',

  contrastComputable_cantTell_generic:
    'Der Kontrast ist möglicherweise nicht berechenbar ({{reasonCode}}).',

  contrastComputable_cantTell_bgImageOrGradient:
    'Der Kontrast ist nicht berechenbar, weil der Hintergrund ein Bild oder einen Verlauf verwendet ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgImage:
    'Der Kontrast ist nicht berechenbar, weil der Hintergrund ein Bild verwendet ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgGradient:
    'Der Kontrast ist nicht berechenbar, weil der Hintergrund einen Verlauf verwendet ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgImageAndGradient:
    'Der Kontrast ist nicht berechenbar, weil der Hintergrund ein Bild und einen Verlauf verwendet ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_mixBlendMode:
    'Der Kontrast ist nicht berechenbar, weil mix-blend-mode verwendet wird ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_filter:
    'Der Kontrast ist nicht berechenbar, weil filter/backdrop-filter verwendet wird ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_rootNotOpaque:
    'Der Kontrast ist nicht berechenbar, weil der effektive Hintergrund an der Wurzel nicht vollständig opak ist (alpha={{backgroundAlpha}}).',

  contrastComputable_cantTell_foregroundUnparsable:
    'Der Kontrast ist nicht berechenbar, weil die berechnete Vordergrundfarbe nicht ausgewertet werden konnte.',

  contrastComputable_cantTell_engineFailure:
    'Die Berechenbarkeit des Kontrasts konnte aufgrund eines internen Engine-Fehlers nicht bestimmt werden ({{reasonCode}}).',

  contrastComputable_cantTell_backdropFilter:
    'Der Kontrast ist nicht berechenbar, weil backdrop-filter verwendet wird ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_filterOrBackdropFilter:
    'Der Kontrast ist nicht berechenbar, weil filter verwendet wird ({{blockerProperty}}={{blockerValue}}).',

  // --- DOM-Kontrast: AA-Minimum (1.4.3)
  contrastMinimum_title: 'Text erfüllt den Mindestfarbkontrast (AA)',
  contrastMinimum_description:
    'Prüft, ob sichtbarer Text ein Kontrastverhältnis von mindestens 4,5:1 (normal) oder 3,0:1 (groß) aufweist, sofern der Kontrast aus CSS berechenbar ist.',

  contrastMinimum_fail_belowThreshold:
    'Das Element weist einen unzureichenden Farbkontrast von {{ratio}}:1 auf (Vordergrund: {{foregroundHex}}, Hintergrund: {{backgroundHex}}, Schriftgröße: {{fontSizePx}}px, Schriftgewicht: {{fontWeightLabel}}). Erwartetes Kontrastverhältnis: {{threshold}}:1 ({{#isLargeText}}großer Text{{/isLargeText}}{{^isLargeText}}normaler Text{{/isLargeText}}).',

  contrastMinimum_pass_allAboveThreshold:
    'Der gesamte berechenbare Text erfüllt den Mindestkontrast (AA). Zutreffende Textknoten: {{eligibleTextCount}}. Berechenbar: {{computableTextCount}}.',

  contrastMinimum_notApplicable_noComputableText:
    'Bei keinem zutreffenden Text war der Kontrast berechenbar (zutreffende Textknoten: {{eligibleTextCount}}). Details siehe Regel zur Kontrastberechenbarkeit.',

  contrastMinimum_cantTell_engineFailure:
    'Der Mindestkontrast (AA) konnte aufgrund eines internen Engine-Fehlers nicht bestimmt werden ({{reasonCode}}).',

  // --- DOM-Kontrast: AAA erweitert (1.4.6)
  contrastEnhanced_title: 'Text erfüllt den erweiterten Farbkontrast (AAA)',
  contrastEnhanced_description:
    'Prüft, ob sichtbarer Text ein Kontrastverhältnis von mindestens 7,0:1 (normal) oder 4,5:1 (groß) aufweist, sofern der Kontrast aus CSS berechenbar ist.',

  contrastEnhanced_fail_belowThreshold:
    'Das Element weist einen unzureichenden Farbkontrast (AAA) von {{ratio}}:1 auf (Vordergrund: {{foregroundHex}}, Hintergrund: {{backgroundHex}}, Schriftgröße: {{fontSizePx}}px, Schriftgewicht: {{fontWeightLabel}}). Erwartetes Kontrastverhältnis: {{threshold}}:1 ({{#isLargeText}}großer Text{{/isLargeText}}{{^isLargeText}}normaler Text{{/isLargeText}}).',

  contrastEnhanced_pass_allAboveThreshold:
    'Der gesamte berechenbare Text erfüllt den erweiterten Kontrast (AAA). Zutreffende Textknoten: {{eligibleTextCount}}. Berechenbar: {{computableTextCount}}.',

  contrastEnhanced_notApplicable_noComputableText:
    'Bei keinem zutreffenden Text war der Kontrast berechenbar (zutreffende Textknoten: {{eligibleTextCount}}). Details siehe Regel zur Kontrastberechenbarkeit.',

  contrastEnhanced_cantTell_engineFailure:
    'Der erweiterte Kontrast (AAA) konnte aufgrund eines internen Engine-Fehlers nicht bestimmt werden ({{reasonCode}}).',

  // --- 1) Textkontrast (Minimum) — WCAG 1.4.3 (AA)
  dom_textContrastMinimum_title: 'Text muss ausreichenden Kontrast aufweisen (Minimum)',
  dom_textContrastMinimum_description:
    'Prüft den Kontrast von sichtbarem Text gegenüber seinem berechneten Hintergrund gemäß WCAG 2.2 Erfolgskriterium 1.4.3 (AA), unter Verwendung der gerenderten Stile (Schriftgröße/-gewicht) zur Bestimmung des erforderlichen Verhältnisses.',

  dom_textContrastMinimum_summary_fail:
    'Unzureichender Textkontrast: {{contrastRatio}}:1 (erforderlich {{requiredRatio}}:1). Vordergrund {{fgColor}} auf Hintergrund {{bgColor}}. Schrift {{fontSizePx}}px, Gewicht {{fontWeight}}{{#isBold}}, fett{{/isBold}}{{#isLargeText}} (großer Text){{/isLargeText}}.',
  dom_textContrastMinimum_hint_fail:
    'Passen Sie die Vordergrund- oder Hintergrundfarbe so an, dass das Kontrastverhältnis für diese Textgröße/dieses Textgewicht mindestens {{requiredRatio}}:1 beträgt.',

  dom_textContrastMinimum_summary_pass:
    'Textkontrast in Ordnung: {{contrastRatio}}:1 (erforderlich {{requiredRatio}}:1). Vordergrund {{fgColor}} auf Hintergrund {{bgColor}}. Schrift {{fontSizePx}}px, Gewicht {{fontWeight}}{{#isBold}}, fett{{/isBold}}{{#isLargeText}} (großer Text){{/isLargeText}}.',

  dom_textContrastMinimum_summary_cantTell:
    'Der Textkontrast konnte nicht zuverlässig berechnet werden, da der effektive Hintergrund nicht deterministisch auflösbar ist (z. B. Bild, Verlauf, Video, Canvas, komplexe Transparenz oder Blending).',
  dom_textContrastMinimum_hint_cantTell:
    'Überprüfen Sie den Kontrast manuell, wenn Text über Bildern/Verläufen/Transparenz liegt; stellen Sie sicher, dass er {{requiredRatio}}:1 für die berechnete Textgröße/das Textgewicht erreicht.',

  // --- 2) Textkontrast (Erweitert) — WCAG 1.4.6 (AAA)
  dom_textContrastEnhanced_title: 'Text muss ausreichenden Kontrast aufweisen (erweitert)',
  dom_textContrastEnhanced_description:
    'Prüft den Kontrast von sichtbarem Text gegenüber seinem berechneten Hintergrund gemäß WCAG 2.2 Erfolgskriterium 1.4.6 (AAA), unter Verwendung der gerenderten Stile (Schriftgröße/-gewicht) zur Bestimmung des erforderlichen Verhältnisses.',

  dom_textContrastEnhanced_summary_fail:
    'Unzureichender erweiterter Textkontrast: {{contrastRatio}}:1 (erforderlich {{requiredRatio}}:1). Vordergrund {{fgColor}} auf Hintergrund {{bgColor}}. Schrift {{fontSizePx}}px, Gewicht {{fontWeight}}{{#isBold}}, fett{{/isBold}}{{#isLargeText}} (großer Text){{/isLargeText}}.',
  dom_textContrastEnhanced_hint_fail:
    'Passen Sie die Vordergrund- oder Hintergrundfarbe so an, dass das Kontrastverhältnis für den erweiterten (AAA-)Kontrast mindestens {{requiredRatio}}:1 beträgt.',

  dom_textContrastEnhanced_summary_pass:
    'Erweiterter Textkontrast in Ordnung: {{contrastRatio}}:1 (erforderlich {{requiredRatio}}:1). Vordergrund {{fgColor}} auf Hintergrund {{bgColor}}. Schrift {{fontSizePx}}px, Gewicht {{fontWeight}}{{#isBold}}, fett{{/isBold}}{{#isLargeText}} (großer Text){{/isLargeText}}.',

  dom_textContrastEnhanced_summary_cantTell:
    'Der erweiterte Textkontrast konnte nicht zuverlässig berechnet werden, da der effektive Hintergrund nicht deterministisch auflösbar ist (z. B. Bild, Verlauf, Video, Canvas, komplexe Transparenz oder Blending).',
  dom_textContrastEnhanced_hint_cantTell:
    'Überprüfen Sie den erweiterten (AAA-)Kontrast manuell, wenn Text über Bildern/Verläufen/Transparenz liegt; stellen Sie sicher, dass er {{requiredRatio}}:1 für die berechnete Textgröße/das Textgewicht erreicht.',

  // --- 3) Nicht-Text-Kontrast — WCAG 1.4.11 (AA)
  dom_nonTextContrast_title: 'UI-Komponenten und Grafiken müssen ausreichenden Kontrast aufweisen',
  dom_nonTextContrast_description:
    'Prüft den Kontrast nicht-textueller visueller Informationen (UI-Komponentengrenzen, Zustände und bedeutungstragende grafische Objekte) gemäß WCAG 2.2 Erfolgskriterium 1.4.11 (AA).',

  dom_nonTextContrast_summary_fail:
    'Unzureichender Nicht-Text-Kontrast: {{contrastRatio}}:1 (erforderlich {{requiredRatio}}:1). Vordergrund {{fgColor}} gegenüber Hintergrund {{bgColor}}. Komponente: {{componentKind}}{{#componentState}} (Zustand: {{componentState}}){{/componentState}}.',
  dom_nonTextContrast_hint_fail:
    'Passen Sie die Farben der Komponente/Grafik so an, dass das Kontrastverhältnis für die wahrnehmbare Abgrenzung oder die wesentliche visuelle Information mindestens {{requiredRatio}}:1 beträgt.',

  dom_nonTextContrast_summary_pass:
    'Nicht-Text-Kontrast in Ordnung: {{contrastRatio}}:1 (erforderlich {{requiredRatio}}:1). Vordergrund {{fgColor}} gegenüber Hintergrund {{bgColor}}. Komponente: {{componentKind}}{{#componentState}} (Zustand: {{componentState}}){{/componentState}}.',

  dom_nonTextContrast_summary_cantTell:
    'Der Nicht-Text-Kontrast konnte nicht zuverlässig berechnet werden, da der effektive Hintergrund oder die gezeichneten Pixel nicht deterministisch auflösbar sind (z. B. Bild/Verlauf/Video/Canvas, komplexe Transparenz oder Blending).',
  dom_nonTextContrast_hint_cantTell:
    'Überprüfen Sie den Kontrast der Komponente/Grafik manuell gegenüber den angrenzenden Farben; stellen Sie sicher, dass er {{requiredRatio}}:1 für die wesentliche nicht-textuelle visuelle Information erreicht.',
  contrastEnhanced_pass_allTextMeetsThreshold:
    'Der gesamte berechenbare Text erfüllt den erweiterten Kontrast (AAA).',
  contrastMinimum_pass_allTextMeetsThreshold:
    'Der gesamte berechenbare Text erfüllt den Mindestkontrast (AA).',

  contrastComputable_cantTell_notComputable:
    'Der Kontrast konnte für diesen Text nicht berechnet werden ({{reasonCode}}).',

  // Titel & Beschreibung
  roleImg_textAlternativePresent_title: '[role="img"] muss eine zugängliche Textalternative haben',

  roleImg_textAlternativePresent_description:
    'Prüft, ob Elemente mit role="img" eine zugängliche Textalternative über aria-label, aria-labelledby oder ein title-Attribut bereitstellen.',

  // Fehlerzusammenfassung & Hinweis
  roleImg_textAlternativePresent_summary_fail:
    'Das Element mit role="img" hat keine zugängliche Textalternative.',

  roleImg_textAlternativePresent_hint_fail:
    'Stellen Sie eine Textalternative über aria-label oder aria-labelledby bereit, das auf nicht leeren Text verweist.',

  // --- Zielgröße (Minimum) — WCAG 2.5.8 (AA)
  targetSizeMinimum_title:
    'Zeigerziele müssen mindestens 24x24px groß sein oder ausreichend Abstand zu anderen Zielen einhalten',
  targetSizeMinimum_description:
    'Prüft, ob per Zeiger bedienbare Ziele eine effektive Zielgröße von mindestens 24 mal 24 CSS-Pixel haben oder eine zulässige Ausnahme erfüllen (z. B. ausreichender Abstand).',

  targetSizeMinimum_summary_fail:
    'Ein oder mehrere Zeigerziele sind kleiner als 24×24 CSS-Pixel und liegen zu nah an einem anderen Ziel.',
  targetSizeMinimum_hint_fail:
    'Vergrößern Sie das Ziel auf mindestens 24×24 CSS-Pixel, oder fügen Sie ausreichend Abstand zu benachbarten Zielen hinzu.',
  targetSizeMinimum_summary_cantTell_ambiguousSpacing:
    'Das Ziel ist möglicherweise zu klein und zu nah an einem anderen Ziel, aber die Überlappung liegt nahe am Erkennungsschwellenwert und konnte nicht zuverlässig gemessen werden.',
  targetSizeMinimum_hint_cantTell_ambiguousSpacing:
    'Überprüfen Sie manuell den effektiven Abstand zwischen diesem Ziel und seinem Nachbarn; vergrößern Sie Zielgröße oder Abstand, falls die Überlappung real ist.',
  targetSizeMinimum_summary_cantTell_plausiblyEssential:
    'Das Ziel ist zu klein und zu nah an einem anderen Ziel, könnte aber als Teil einer essenziellen Grafik oder eines Image-Map-Bereichs ausgenommen sein.',
  targetSizeMinimum_hint_cantTell_plausiblyEssential:
    'Prüfen Sie, ob die Größe dieses Ziels wirklich für seine Funktion essenziell ist (z. B. Teil eines SVG/Canvas/einer Image-Map); falls nicht, vergrößern Sie Zielgröße oder Abstand.',

  targetSizeMinimum_notApplicable_noTargets:
    'Es gab keine per Zeiger bedienbaren Ziele, die für die Bewertung infrage kamen.',
  targetSizeMinimum_pass_allOk:
    'Alle zutreffenden Zeigerziele erfüllen die Mindestgröße oder eine zulässige Ausnahme.',

  // --- aria-hidden-focus
  ariaHidden_focus_title: 'ARIA-hidden-Elemente dürfen nicht fokussierbar sein',
  ariaHidden_focus_description:
    'Prüft, ob Elemente mit aria-hidden="true" nicht fokussierbar sind und keine fokussierbaren Nachfahren enthalten.',

  ariaHidden_focus_summary_fail_desc:
    'aria-hidden {{element}} enthält {{focusableCount}} fokussierbare(s) Element(e).',
  ariaHidden_focus_summary_fail_self:
    'aria-hidden {{element}} ist fokussierbar ({{focusableCount}} fokussierbare(s) Element(e)).',
  ariaHidden_focus_summary_fail_self_and_desc:
    'aria-hidden {{element}} ist fokussierbar und enthält {{descendantFocusableCount}} fokussierbare(n) Nachfahren ({{focusableCount}} fokussierbare Elemente insgesamt).',

  ariaHidden_focus_hint_fail:
    'Entfernen Sie die Fokussierbarkeit der Nachfahren oder entfernen Sie aria-hidden; stellen Sie sicher, dass Fokus- und Accessibility-Baum übereinstimmen.',
  ariaHidden_focus_summary_cantTell_redirect:
    'aria-hidden {{element}} hat den Fokus erhalten, der Fokus wurde jedoch sofort zu einem anderen Element verschoben. Überprüfen Sie das Sentinel-/Fokus-Trap-Verhalten.',
  ariaHidden_focus_hint_cantTell_redirect:
    'Überprüfen Sie, ob es sich um eine beabsichtigte Fokus-Sentinel-/Fokus-Trap-Übergabe handelt und dass Tastaturnutzer niemals auf verborgenen Fokuszielen verbleiben.',

  // --- css-hidden-focus
  cssHidden_focus_title: 'Fokussierbare Elemente dürfen nicht visuell verborgen sein',
  cssHidden_focus_description:
    'Prüft, ob per Tastatur fokussierbare Elemente nicht durch CSS-Techniken visuell verborgen werden, die sie dennoch in der Tab-Reihenfolge belassen können.',

  cssHidden_focus_summary_cantTell:
    'Das fokussierbare {{element}} ist visuell verborgen ({{visibilityHints}}).',
  cssHidden_focus_hint_cantTell:
    'Machen Sie das Element sichtbar, wenn es den Tastaturfokus erhalten kann, oder entfernen Sie es aus der Tab-Reihenfolge, solange es nicht sichtbar ist.',

  linkNamePresent_title: 'Links haben einen zugänglichen Namen',
  linkNamePresent_description: 'Prüft, ob Links einen nicht leeren zugänglichen Namen aufweisen.',
  linkNamePresent_summary_fail: 'Dieser Link hat keinen zugänglichen Namen.',
  linkNamePresent_hint_fail:
    'Stellen Sie einen Linktext oder einen Mechanismus für einen zugänglichen Namen bereit (zum Beispiel aria-label), damit assistive Technologien den Link identifizieren können.',
  buttonNamePresent_title: 'Schaltflächen haben einen zugänglichen Namen',
  buttonNamePresent_description:
    'Prüft, ob Schaltflächen einen nicht leeren zugänglichen Namen aufweisen.',
  buttonNamePresent_summary_fail: 'Diese Schaltfläche hat keinen zugänglichen Namen.',
  buttonNamePresent_hint_fail:
    'Stellen Sie einen sichtbaren Schaltflächentext oder einen programmatischen Mechanismus für einen zugänglichen Namen bereit (zum Beispiel aria-label), damit assistive Technologien die Schaltfläche identifizieren können.',

  binaryControlNamePresent_title: 'Binäre Formularelemente haben einen zugänglichen Namen',
  binaryControlNamePresent_description:
    'Prüft, ob Kontrollkästchen, Optionsfelder und Schalter (switch) einen nicht leeren zugänglichen Namen aufweisen.',
  binaryControlNamePresent_summary_fail: 'Dieses Formularelement hat keinen zugänglichen Namen.',
  binaryControlNamePresent_hint_fail:
    'Stellen Sie eine Beschriftung, aria-label, aria-labelledby oder einen anderen Mechanismus für einen zugänglichen Namen bereit, damit assistive Technologien das Formularelement identifizieren können.',
  comboboxNamePresent_title: 'Comboboxen haben einen zugänglichen Namen',
  comboboxNamePresent_description:
    'Prüft, ob Elemente mit role="combobox" einen nicht leeren zugänglichen Namen aufweisen.',
  comboboxNamePresent_summary_fail: 'Diese Combobox hat keinen zugänglichen Namen.',
  comboboxNamePresent_hint_fail:
    'Stellen Sie aria-label, aria-labelledby oder ein title-Attribut bereit — sichtbarer Textinhalt wird bei dieser Combobox nicht als zugänglicher Name ausgegeben.',
  dialogNamePresent_title: 'Dialoge haben einen zugänglichen Namen',
  dialogNamePresent_description:
    'Prüft, ob Elemente mit role="dialog" oder role="alertdialog" einen nicht leeren zugänglichen Namen aufweisen.',
  dialogNamePresent_summary_fail: 'Dieser Dialog hat keinen zugänglichen Namen.',
  dialogNamePresent_hint_fail:
    'Stellen Sie aria-labelledby (bevorzugt) oder aria-label bereit, damit assistive Technologien den Dialog ansagen können.',
  menuitemNamePresent_title: 'Menüeinträge haben einen zugänglichen Namen',
  menuitemNamePresent_description:
    'Prüft, ob Menüeinträge (role="menuitem*", einschließlich Checkbox-/Radio-Varianten) einen nicht leeren zugänglichen Namen aufweisen.',
  menuitemNamePresent_summary_fail: 'Dieser Menüeintrag hat keinen zugänglichen Namen.',
  menuitemNamePresent_hint_fail:
    'Stellen Sie sichtbaren Text bereit, der nicht vor assistiven Technologien verborgen ist, oder stellen Sie aria-label oder aria-labelledby bereit.',
  tabNamePresent_title: 'Tabs haben einen zugänglichen Namen',
  tabNamePresent_description:
    'Prüft, ob Elemente mit role="tab" einen nicht leeren zugänglichen Namen aufweisen.',
  tabNamePresent_summary_fail: 'Dieser Tab hat keinen zugänglichen Namen.',
  tabNamePresent_hint_fail:
    'Stellen Sie einen Tab-Text bereit, der nicht vor assistiven Technologien verborgen ist, oder stellen Sie aria-label oder aria-labelledby bereit.',
  sliderNamePresent_title: 'Schieberegler haben einen zugänglichen Namen',
  sliderNamePresent_description:
    'Prüft, ob Schieberegler (input[type="range"] und role="slider") einen nicht leeren zugänglichen Namen aufweisen.',
  sliderNamePresent_summary_fail: 'Dieser Schieberegler hat keinen zugänglichen Namen.',
  sliderNamePresent_hint_fail:
    'Stellen Sie eine Beschriftung, aria-label oder aria-labelledby bereit, damit assistive Technologien den Schieberegler identifizieren können.',
  textboxNamePresent_title: 'Textfelder haben einen zugänglichen Namen',
  textboxNamePresent_description:
    'Prüft, ob Elemente mit role="textbox" einen nicht leeren zugänglichen Namen aufweisen.',
  textboxNamePresent_summary_fail: 'Dieses Textfeld hat keinen zugänglichen Namen.',
  textboxNamePresent_hint_fail:
    'Stellen Sie aria-label, aria-labelledby oder ein title-Attribut bereit — sichtbarer Textinhalt wird bei diesem Textfeld nicht als zugänglicher Name ausgegeben.',
  searchboxNamePresent_title: 'Suchfelder haben einen zugänglichen Namen',
  searchboxNamePresent_description:
    'Prüft, ob Elemente mit role="searchbox" einen nicht leeren zugänglichen Namen aufweisen.',
  searchboxNamePresent_summary_fail: 'Dieses Suchfeld hat keinen zugänglichen Namen.',
  searchboxNamePresent_hint_fail:
    'Stellen Sie aria-label, aria-labelledby oder ein title-Attribut bereit — sichtbarer Textinhalt wird bei diesem Suchfeld nicht als zugänglicher Name ausgegeben.',
  spinbuttonNamePresent_title: 'Spinbuttons haben einen zugänglichen Namen',
  spinbuttonNamePresent_description:
    'Prüft, ob Elemente mit role="spinbutton" einen nicht leeren zugänglichen Namen aufweisen.',
  spinbuttonNamePresent_summary_fail: 'Dieser Spinbutton hat keinen zugänglichen Namen.',
  spinbuttonNamePresent_hint_fail:
    'Stellen Sie aria-label, aria-labelledby oder ein title-Attribut bereit — sichtbarer Textinhalt wird bei diesem Spinbutton nicht als zugänglicher Name ausgegeben.',
  listboxNamePresent_title: 'Listboxen haben einen zugänglichen Namen',
  listboxNamePresent_description:
    'Prüft, ob Elemente mit role="listbox" einen nicht leeren zugänglichen Namen aufweisen.',
  listboxNamePresent_summary_fail: 'Diese Listbox hat keinen zugänglichen Namen.',
  listboxNamePresent_hint_fail:
    'Stellen Sie aria-label, aria-labelledby oder ein title-Attribut bereit — sichtbarer Textinhalt wird bei dieser Listbox nicht als zugänglicher Name ausgegeben.',
  optionNamePresent_title: 'Optionen haben einen zugänglichen Namen',
  optionNamePresent_description:
    'Prüft, ob Elemente mit role="option" einen nicht leeren zugänglichen Namen aufweisen.',
  optionNamePresent_summary_fail: 'Diese Option hat keinen zugänglichen Namen.',
  optionNamePresent_hint_fail:
    'Stellen Sie einen Optionstext bereit, der nicht vor assistiven Technologien verborgen ist, oder stellen Sie aria-label oder aria-labelledby bereit.',
  treeitemNamePresent_title: 'Baumeinträge haben einen zugänglichen Namen',
  treeitemNamePresent_description:
    'Prüft, ob Elemente mit role="treeitem" einen nicht leeren zugänglichen Namen aufweisen.',
  treeitemNamePresent_summary_fail: 'Dieser Baumeintrag hat keinen zugänglichen Namen.',
  treeitemNamePresent_hint_fail:
    'Stellen Sie einen Baumeintrag-Text bereit, der nicht vor assistiven Technologien verborgen ist, oder stellen Sie aria-label oder aria-labelledby bereit.',
  ariaRoleNamePresent_title: 'ARIA-Widget-/Container-Rollen haben einen zugänglichen Namen',
  ariaRoleNamePresent_description:
    'Prüft, ob bestimmte ARIA-Widget-/Container-Rollen einen nicht leeren zugänglichen Namen aufweisen.',
  ariaRoleNamePresent_summary_fail: 'Dieses Element hat keinen zugänglichen Namen.',
  ariaRoleNamePresent_hint_fail:
    'Stellen Sie aria-label oder aria-labelledby bereit (bevorzugt), oder ein nicht leeres title-Attribut.',

  /* =========================
   * Zusammenfassungen zusammengesetzter Regeln
   * ========================= */
  composite_rollup_summary:
    'Ergebnis der zusammengesetzten Regel: {{reasonCode}} ({{testCount}} Prüfungen)',

  /* =========================
   * WCAG 1.1.1 – Nicht-Text-Inhalt
   * ========================= */
  'catalog.rules.wcag_111_non_text_content.title': 'Nicht-Text-Inhalt: Textalternativen',
  'catalog.rules.wcag_111_non_text_content.description':
    'Zusammenfassung von Prüfungen, die sicherstellen, dass Nicht-Text-Inhalte eine passende Textalternative haben.',

  /* =========================
   * WCAG 1.2.1 – Nur Audio / Nur Video
   * ========================= */
  'catalog.rules.wcag_121_prerecorded_transcript.title':
    'Nur Audio und nur Video (voraufgezeichnet): Transkription',
  'catalog.rules.wcag_121_prerecorded_transcript.description':
    'Zusammenfassung von Prüfungen zur Verfügbarkeit einer Transkription für voraufgezeichnete Nur-Audio- oder Nur-Video-Medien.',

  /* =========================
   * WCAG 1.4.3 – Kontrast (Minimum)
   * ========================= */
  'catalog.rules.wcag_143_contrast_minimum.title': 'Kontrast: Minimum',
  'catalog.rules.wcag_143_contrast_minimum.description':
    'Zusammenfassung von Prüfungen zum Mindesttextkontrast.',

  /* =========================
   * WCAG 1.4.6 – Kontrast (Erweitert)
   * ========================= */
  'catalog.rules.wcag_146_contrast_enhanced.title': 'Kontrast: erweitert',
  'catalog.rules.wcag_146_contrast_enhanced.description':
    'Zusammenfassung von Prüfungen zum erweiterten Textkontrast.',

  /* =========================
   * WCAG 2.4.2 – Seite mit Titel
   * ========================= */
  'catalog.rules.wcag_242_page_titled.title': 'Seite mit Titel',
  'catalog.rules.wcag_242_page_titled.description':
    'Zusammenfassung von Prüfungen, die sicherstellen, dass Dokumente einen aussagekräftigen Seitentitel haben.',

  /* =========================
   * WCAG 2.4.7 – Fokus sichtbar
   * ========================= */
  'catalog.rules.wcag_247_focus_visible.title': 'Fokus sichtbar',
  'catalog.rules.wcag_247_focus_visible.description':
    'Zusammenfassung von Prüfungen, die sicherstellen, dass der Tastaturfokus nicht verborgen ist und wahrnehmbar bleibt.',

  /* =========================
   * WCAG 2.5.8 – Zielgröße (Minimum)
   * ========================= */
  'catalog.rules.wcag_258_target_size_minimum.title': 'Zielgröße: Minimum',
  'catalog.rules.wcag_258_target_size_minimum.description':
    'Zusammenfassung von Prüfungen, die sicherstellen, dass Zeigerziele die Mindestgrößenanforderungen erfüllen.',

  /* =========================
   * WCAG 3.1.1 – Sprache der Seite
   * ========================= */
  'catalog.rules.wcag_311_language_of_page.title': 'Sprache der Seite',
  'catalog.rules.wcag_311_language_of_page.description':
    'Zusammenfassung von Prüfungen, die sicherstellen, dass die Sprache der Seite angegeben ist.',

  /* =========================
   * WCAG 4.1.2 – Name, Rolle, Wert
   * ========================= */
  'catalog.rules.wcag_412_name.title': 'Name, Rolle, Wert: zugänglicher Name',
  'catalog.rules.wcag_412_name.description':
    'Zusammenfassung von Prüfungen, die sicherstellen, dass gängige interaktive Elemente einen nicht leeren zugänglichen Namen aufweisen.',
  labelInName_title: 'Beschriftung im Namen: Der zugängliche Name enthält den sichtbaren Text',
  labelInName_description:
    'Prüft, ob bei einem Formularelement mit sichtbarer Textbeschriftung der zugängliche Name diesen sichtbaren Beschriftungstext enthält (WCAG 2.5.3).',
  labelInName_summary_fail:
    '{{element}}: Die sichtbare Beschriftung „{{visibleLabel}}“ (aus {{labelSource}}) ist nicht im zugänglichen Namen enthalten (aus {{nameMechanism}}).',
  labelInName_hint_fail:
    'Aktualisieren Sie aria-label/aria-labelledby (oder den sichtbaren Beschriftungstext), damit der zugängliche Name den Wortlaut der sichtbaren Beschriftung enthält.',
  labelInName_summary_cantTell:
    '{{element}}: Die sichtbare Beschriftung „{{visibleLabel}}“ (aus {{labelSource}}) unterscheidet sich vom zugänglichen Namen (aus {{nameMechanism}}) nur durch eine Abkürzung oder eine Bindestrichschreibung.',
  labelInName_hint_cantTell:
    'Prüfen Sie manuell, ob beide Formulierungen übereinstimmen: Aus dem Markup lässt sich eine beabsichtigte Abkürzung nicht von einer Abweichung unterscheiden.',

  /* =========================
   * ARIA-Gültigkeitsfamilie
   * ========================= */
  ariaRolesValid_title: 'Das role-Attribut muss eine gültige, nicht abstrakte ARIA-Rolle sein',
  ariaRolesValid_description:
    'Prüft, ob ein explizites role=""-Attribut zu einer echten, nicht abstrakten WAI-ARIA-Rolle aufgelöst wird.',
  ariaRolesValid_summary_invalid: 'role="{{role}}" ist keine erkannte ARIA-Rolle.',
  ariaRolesValid_hint_invalid:
    'Verwenden Sie einen gültigen ARIA-Rollenwert, oder entfernen Sie das role-Attribut, wenn keine Rolle zutrifft.',
  ariaRolesValid_summary_abstract:
    'role="{{role}}" ist eine abstrakte ARIA-Rolle, die nicht direkt verwendet werden darf.',
  ariaRolesValid_hint_abstract:
    'Ersetzen Sie diese abstrakte Rolle durch eine konkrete Rolle, die zu dem Widget/der Struktur passt.',

  ariaDeprecatedRole_title:
    'Das role-Attribut darf keine veraltete oder für Autoren untersagte ARIA-Rolle verwenden',
  ariaDeprecatedRole_description:
    'Prüft, ob ein explizites role=""-Attribut keine durch die WAI-ARIA-Spezifikation als veraltet markierte Rolle verwendet, und keine Rolle, die ausschließlich für die interne Verwendung durch den User-Agent reserviert ist (z. B. role="generic").',
  ariaDeprecatedRole_summary_fail:
    'Dieses Element verwendet role="{{role}}", was Autoren nicht explizit deklarieren dürfen.',
  ariaDeprecatedRole_hint_fail: '{{guidance}}',

  ariaValidAttr_title: 'aria-*-Attribute müssen echte, definierte ARIA-Attribute sein',
  ariaValidAttr_description:
    'Prüft, ob jeder im DOM vorhandene aria-*-Attributname ein echtes, durch die WAI-ARIA-Spezifikation definiertes Attribut ist.',
  ariaValidAttr_summary_fail: '{{attr}} ist kein erkanntes ARIA-Attribut.',
  ariaValidAttr_hint_fail:
    'Korrigieren Sie den Attributnamen (prüfen Sie auf Tippfehler), oder entfernen Sie ihn, falls er nicht benötigt wird.',

  ariaValidAttrValue_title:
    'Die Werte von aria-*-Attributen müssen ihrem deklarierten Typ entsprechen',
  ariaValidAttrValue_description:
    'Prüft, ob jedes erkannte aria-*-Attribut einen Wert hat, der seinem WAI-ARIA-deklarierten Werttyp entspricht (boolesch, tristate, Token, Ganzzahl, Zahl oder ID-Referenz).',
  ariaValidAttrValue_summary_fail:
    '{{attr}}="{{value}}" ist kein gültiger Wert für dieses Attribut.',
  ariaValidAttrValue_hint_fail:
    'Verwenden Sie einen Wert, der dem erwarteten Typ des Attributs entspricht (siehe WAI-ARIA-Spezifikation für dieses Attribut).',

  ariaAllowedAttr_title: 'aria-*-Attribute müssen für die Rolle des Elements zulässig sein',
  ariaAllowedAttr_description:
    'Prüft, ob jedes erkannte aria-*-Attribut auf einem Element mit expliziter Rolle entweder global unterstützt wird oder von dieser Rolle unterstützt wird.',
  ariaAllowedAttr_summary_fail: '{{attr}} ist bei role="{{role}}" nicht zulässig.',
  ariaAllowedAttr_hint_fail:
    'Entfernen Sie dieses Attribut, oder verwenden Sie eine Rolle, die es unterstützt.',

  ariaProhibitedAttr_title:
    'ARIA-Benennungsattribute dürfen nicht bei Rollen verwendet werden, die sie untersagen',
  ariaProhibitedAttr_description:
    'Prüft, ob aria-label/aria-labelledby nicht bei WAI-ARIA-Rollen vorhanden sind, deren Spezifikation die ARIA-Benennung ausdrücklich untersagt (z. B. generic, emphasis, strong, paragraph).',
  ariaProhibitedAttr_summary_fail: '{{attr}} ist bei role="{{role}}" untersagt.',
  ariaProhibitedAttr_hint_fail:
    'Entfernen Sie dieses Attribut; diese Rolle darf keinen zugänglichen Namen tragen.',
  ariaProhibitedAttr_summary_fail_roleless:
    'Dieses {{element}} hat keine Rolle und keine andere Quelle für einen zugänglichen Namen, sodass {{attr}} assistiven Technologien nicht zuverlässig zur Verfügung gestellt wird.',
  ariaProhibitedAttr_hint_fail_roleless:
    'Geben Sie diesem Element eine Rolle, die einen zugänglichen Namen unterstützt (z. B. role="img"/"button"), oder entfernen Sie dieses Attribut, wenn es ohne Rolle keinen Zweck erfüllt.',
  ariaProhibitedAttr_summary_cantTell_roleless:
    'Dieses {{element}} hat keine Rolle, sodass {{attr}} von assistiven Technologien möglicherweise nicht als zugänglicher Name ausgegeben wird — der eigene Inhalt des Elements liefert jedoch bereits einen.',
  ariaProhibitedAttr_hint_cantTell_roleless:
    'Prüfen Sie, ob der vorhandene Textinhalt bereits als Beschriftung dieses Elements dient; falls ja, ist das Benennungsattribut redundant, andernfalls geben Sie dem Element eine Rolle, die die Benennung unterstützt (z. B. role="img").',

  ariaRequiredAttr_title:
    'Rollen mit einem erforderlichen ARIA-Status/-Eigenschaft müssen diesen tragen',
  ariaRequiredAttr_description:
    'Prüft, ob Elemente mit expliziter Rolle jeden eindeutigen, kontextunabhängigen erforderlichen aria-*-Status/-Eigenschaft für diese Rolle tragen (z. B. muss role="checkbox" aria-checked haben).',
  ariaRequiredAttr_summary_fail: '{{attr}} ist für role="{{role}}" erforderlich, fehlt jedoch.',
  ariaRequiredAttr_hint_fail:
    'Fügen Sie dieses Attribut mit einem für diese Rolle gültigen Wert hinzu.',

  ariaAllowedRole_title: 'Die explizite Rolle muss für ihr Host-Element zulässig sein',
  ariaAllowedRole_description:
    'Prüft, ob ein explizites role=""-Attribut eine der Rollen ist, die die ARIA-in-HTML-Spezifikation für das Host-Element zulässt (z. B. ist role="tab" bei <nav> nicht zulässig).',
  ariaAllowedRole_summary_fail: 'role="{{role}}" ist bei <{{element}}> nicht zulässig.',
  ariaAllowedRole_hint_fail:
    'Verwenden Sie eine für dieses Element zulässige Rolle, oder ändern Sie das Host-Element.',

  ariaRequiredChildren_title:
    'Container-Rollen müssen mindestens eine erforderliche Kind-Rolle besitzen',
  ariaRequiredChildren_description:
    'Prüft, ob Container-Rollen mit einem dokumentierten Eintrag „erforderliche eigene Elemente“ (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, …) mindestens einen Nachfahren oder ein über aria-owns referenziertes Element mit einer zulässigen eigenen Rolle enthalten.',
  ariaRequiredChildren_summary_fail:
    'role="{{role}}" besitzt kein eigenes Kind mit einer der erforderlichen Rollen: {{requiredRoles}}.',
  ariaRequiredChildren_hint_fail:
    'Fügen Sie einen Nachfahren (oder ein über aria-owns referenziertes Element) mit einer der erforderlichen eigenen Rollen hinzu.',

  ariaProhibitedChildren_title:
    'Container-Rollen dürfen kein Kind mit einer unzulässigen Rolle besitzen',
  ariaProhibitedChildren_description:
    'Prüft, ob jedes im Accessibility-Baum zugehörige Kind einer Container-Rolle (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) eine der von dieser Rolle zulässigen eigenen Rollen hat.',
  ariaProhibitedChildren_summary_fail:
    'Dieses Element hat role="{{childRole}}", was kein zulässiges eigenes Kind des umschließenden Containers role="{{containerRole}}" ist.',
  ariaProhibitedChildren_hint_fail:
    'Entfernen oder ändern Sie diese Rolle, sodass sie einer der zulässigen eigenen Rollen des Containers entspricht ({{allowedRoles}}), oder verschieben Sie dieses Element außerhalb des {{containerRole}}-Containers.',
  ariaProhibitedChildren_summary_fail_roleless:
    'Dieses Element hat keine explizite Rolle, trägt jedoch {{attr}}, wodurch es zu einem echten Knoten im Accessibility-Baum wird, der kein zulässiges eigenes Kind des umschließenden Containers role="{{containerRole}}" ist.',
  ariaProhibitedChildren_hint_fail_roleless:
    'Entfernen Sie {{attr}} (oder die Container-Zugehörigkeit zu role="{{containerRole}}"), oder geben Sie diesem Element role="presentation"/"none", falls es kein eigener Knoten im Accessibility-Baum sein soll.',
  ariaProhibitedChildren_summary_fail_native_focusable:
    'Dieses Element hat keine explizite Rolle, ist jedoch nativ fokussierbar, wodurch es zu einem echten Knoten im Accessibility-Baum wird, der kein zulässiges eigenes Kind des umschließenden Containers role="{{containerRole}}" ist.',
  ariaProhibitedChildren_hint_fail_native_focusable:
    'Geben Sie diesem Element role="presentation"/"none", entfernen Sie seine native Fokussierbarkeit (z. B. das href/tabindex-verleihende Attribut), oder verschieben Sie es außerhalb des {{containerRole}}-Containers.',

  ariaRequiredParent_title:
    'Rollen, die einen bestimmten Kontext-Rolle erfordern, müssen sich in diesem Kontext befinden',
  ariaRequiredParent_description:
    'Prüft, ob Rollen mit einem dokumentierten Eintrag „erforderliche Kontext-Rolle“ (listitem, option, tab, treeitem, row, cell, …) einen Vorfahren oder aria-owns-Eigentümer mit einer zulässigen Kontext-Rolle haben.',
  ariaRequiredParent_summary_fail:
    'role="{{role}}" erfordert eine Kontext-Rolle aus: {{requiredRoles}}, die nicht gefunden wurde.',
  ariaRequiredParent_hint_fail:
    'Platzieren Sie dieses Element innerhalb eines Elements mit einer zulässigen Kontext-Rolle (oder referenzieren Sie es von dort über aria-owns).',

  deprecatedElements_title:
    'Veraltete, nicht anhaltbare Elemente (<blink>, <marquee>) dürfen nicht verwendet werden',
  deprecatedElements_description:
    'Prüft, ob veraltete, nicht standardisierte HTML-Elemente, deren blinkender/scrollender Inhalt vom Nutzer nicht angehalten, gestoppt oder ausgeblendet werden kann (<blink>, <marquee>), nicht vorhanden sind.',
  deprecatedElements_summary_fail:
    'Der Inhalt von <{{element}}> kann vom Nutzer nicht angehalten, gestoppt oder ausgeblendet werden.',
  deprecatedElements_hint_fail:
    'Entfernen Sie dieses Element; verwenden Sie stattdessen statischen Inhalt oder eine Animation mit einer für den Nutzer zugänglichen Pause-/Stopp-Steuerung.',

  iframeNamePresent_title: 'Frames haben einen zugänglichen Namen',
  iframeNamePresent_description:
    'Prüft, ob <iframe>/<frame>-Elemente über aria-label, aria-labelledby oder das title-Attribut einen nicht leeren zugänglichen Namen aufweisen.',
  iframeNamePresent_summary_fail: 'Dieses <{{element}}> hat keinen zugänglichen Namen.',
  iframeNamePresent_hint_fail:
    'Fügen Sie ein title-Attribut (oder aria-label/aria-labelledby) hinzu, das Inhalt oder Zweck des Frames beschreibt.',

  iframeTitleUnique_title: 'Frame-Titel müssen eindeutig sein',
  iframeTitleUnique_description:
    'Prüft, ob nicht zwei <iframe>/<frame>-Elemente im betrachteten Bereich denselben title-Attributwert teilen.',
  iframeTitleUnique_summary_fail:
    'Der Titel „{{title}}“ dieses <{{element}}> ist unter den Frames dieser Seite nicht eindeutig.',
  iframeTitleUnique_hint_fail:
    'Geben Sie jedem Frame einen eigenen Titel, der seinen jeweiligen Inhalt oder Zweck beschreibt.',

  iframeFocusableContent_title:
    'Frames mit tabindex="-1" dürfen keinen fokussierbaren Inhalt enthalten',
  iframeFocusableContent_description:
    'Prüft, ob <iframe>/<frame>-Elemente derselben Herkunft mit tabindex="-1" keinen fokussierbaren Inhalt enthalten, da Browser diese Einschränkung nicht in das eingebettete Dokument des Frames übertragen.',
  iframeFocusableContent_summary_fail:
    'Dieses <{{element}}> hat tabindex="-1", aber sein Inhalt enthält fokussierbare Elemente, die weiterhin per Tastatur erreichbar sind.',
  iframeFocusableContent_hint_fail:
    'Entfernen Sie den fokussierbaren Inhalt aus dem Frame, oder entfernen Sie tabindex="-1", falls der Frame erreichbar sein soll.',

  tableHeadersAttrValid_title:
    'Das headers-Attribut einer Tabellenzelle muss auf gültige Kopfzellen verweisen',
  tableHeadersAttrValid_description:
    'Prüft, ob jede id im headers-Attribut eines <td>/<th> auf ein <th>-Element innerhalb derselben Tabelle aufgelöst wird (nicht fehlend, kein Nicht-th-Element, nicht sich selbst).',
  tableHeadersAttrValid_summary_fail:
    'Das headers-Attribut dieses <{{element}}> verweist auf ungültige Kopfzelle(n): {{invalidIds}}.',
  tableHeadersAttrValid_hint_fail:
    'Aktualisieren Sie das headers-Attribut so, dass jede id auf ein <th>-Element innerhalb derselben Tabelle verweist.',

  tableThHasDataCells_title: '<th>-Elemente müssen mindestens eine Datenzelle beschreiben',
  tableThHasDataCells_description:
    'Prüft, ob eine Tabelle, die <th>-Elemente enthält, auch mindestens eine <td>-Datenzelle enthält, die von diesen Kopfzeilen beschrieben wird.',
  tableThHasDataCells_summary_fail:
    'Diese Tabelle hat Kopfzellen, aber keine Datenzellen, die sie beschreiben.',
  tableThHasDataCells_hint_fail:
    'Fügen Sie der Tabelle Datenzellen (<td>) hinzu, oder entfernen Sie die Kopfzellen, wenn die Tabelle keine Daten enthält.',

  ariaHiddenBody_title: 'Das <body>-Element des Dokuments darf nicht aria-hidden sein',
  ariaHiddenBody_description:
    'Prüft, ob <body> nicht aria-hidden="true" hat, was die gesamte Seite aus dem Accessibility-Baum entfernen würde.',
  ariaHiddenBody_summary_fail:
    'Der Dokumentkörper hat aria-hidden="true", wodurch die gesamte Seite vor assistiven Technologien verborgen wird.',
  ariaHiddenBody_hint_fail:
    'Entfernen Sie aria-hidden von <body>. Verbergen Sie stattdessen einzelne Elemente, falls das die Absicht war.',

  listChildrenValid_title: 'Listen dürfen direkt nur Listenelemente enthalten',
  listChildrenValid_description:
    'Prüft, ob <ul>/<ol>-Elemente als direkte Kinder nur <li>, <script> oder <template> haben.',
  listChildrenValid_summary_fail:
    'Dieses <{{element}}> enthält ein direktes Kind, das kein Listenelement ist: {{invalidChildren}}.',
  listChildrenValid_hint_fail:
    'Verwenden Sie als direkte Kinder von <ul>/<ol> nur <li> (oder <script>/<template>); verschieben Sie anderes Markup in ein <li>.',

  listitemParentValid_title:
    'Listenelemente müssen sich innerhalb eines Listen-Containers befinden',
  listitemParentValid_description:
    'Prüft, ob <li>-Elemente von <ul>, <ol> oder einem Element mit role="list" enthalten sind.',
  listitemParentValid_summary_fail:
    'Das übergeordnete Element (<{{parentElement}}>) dieses Listenelements ist kein Listen-Container.',
  listitemParentValid_hint_fail:
    'Platzieren Sie dieses <li> innerhalb eines <ul>/<ol>, oder geben Sie seinem übergeordneten Element role="list".',

  definitionListChildrenValid_title: 'Beschreibungslisten müssen korrekt strukturiert sein',
  definitionListChildrenValid_description:
    'Prüft, ob <dl>-Elemente direkt nur <dt>/<dd>-Gruppen (optional in einem einzigen <div> verpackt), <script>, <template> oder <style> enthalten.',
  definitionListChildrenValid_summary_fail_invalidChild:
    'Diese Beschreibungsliste enthält ein direktes oder verpacktes Kind, das nicht Teil einer dt/dd-Gruppe ist: {{invalidChildren}}.',
  definitionListChildrenValid_hint_fail_invalidChild:
    'Verwenden Sie innerhalb von <dl> nur <dt>/<dd> (optional in einem einzigen <div> verpackt), <script>, <template> oder <style>.',
  definitionListChildrenValid_summary_fail_noDtDd:
    'Diese Beschreibungsliste hat keine <dt>/<dd>-Begriff-Definitions-Gruppe.',
  definitionListChildrenValid_hint_fail_noDtDd:
    'Fügen Sie mindestens ein <dt>/<dd>-Paar innerhalb dieses <dl> hinzu.',

  dlitemParentValid_title:
    'Beschreibungslisten-Elemente müssen sich innerhalb einer Beschreibungsliste befinden',
  dlitemParentValid_description:
    'Prüft, ob <dt>/<dd>-Elemente von einem <dl> enthalten sind, direkt oder über ein umschließendes <div>.',
  dlitemParentValid_summary_fail:
    'Das übergeordnete Element (<{{parentElement}}>) dieses <{{element}}> ist keine Beschreibungsliste.',
  dlitemParentValid_hint_fail:
    'Platzieren Sie dieses <dt>/<dd> innerhalb eines <dl>, direkt oder in einem einzigen <div> verpackt.',

  duplicateIdAria_title: 'Von ARIA referenzierte IDs müssen eindeutig sein',
  duplicateIdAria_description:
    'Prüft, ob jeder id-Wert, der durch ein ARIA-ID-Referenzattribut referenziert wird (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details), im Dokument eindeutig ist.',
  duplicateIdAria_summary_fail:
    'Die id „{{id}}“ wird von einem ARIA-Attribut referenziert, wird aber von {{duplicateCount}} Elementen verwendet.',
  duplicateIdAria_hint_fail:
    'Machen Sie von ARIA-Attributen referenzierte ids innerhalb des Dokuments eindeutig.',

  summaryNamePresent_title: 'Summary-Elemente haben einen zugänglichen Namen',
  summaryNamePresent_description:
    'Prüft, ob <summary>-Elemente einen nicht leeren zugänglichen Namen aufweisen.',
  summaryNamePresent_summary_fail: 'Dieses Summary-Element hat keinen zugänglichen Namen.',
  summaryNamePresent_hint_fail:
    'Stellen Sie einen Summary-Text bereit, der nicht vor assistiven Technologien verborgen ist, oder stellen Sie aria-label oder aria-labelledby bereit.',

  metaViewportZoomEnabled_title: 'Der Viewport-Meta-Tag darf das Zoomen nicht deaktivieren',
  metaViewportZoomEnabled_description:
    'Prüft, ob <meta name="viewport"> nicht user-scalable=no oder maximum-scale unter 2 (200 %) setzt.',
  metaViewportZoomEnabled_summary_fail:
    'Dieser Viewport-Meta-Tag schränkt die Zoom-Fähigkeit des Nutzers ein ({{reasons}}).',
  metaViewportZoomEnabled_hint_fail:
    'Entfernen Sie user-scalable=no und jedes maximum-scale unter 2 aus dem Inhalt des Viewport-Meta-Tags.',

  metaRefreshTimingAbsent_title: 'Die Seite darf keinen zeitgesteuerten Meta-Refresh verwenden',
  metaRefreshTimingAbsent_description:
    'Prüft, ob <meta http-equiv="refresh"> keine positive Verzögerung von 20 Stunden oder weniger erzwingt.',
  metaRefreshTimingAbsent_summary_fail:
    'Diese Seite lädt sich nach {{delay}} Sekunden automatisch neu.',
  metaRefreshTimingAbsent_hint_fail:
    'Entfernen Sie den zeitgesteuerten Meta-Refresh, oder bieten Sie den Nutzern eine Möglichkeit, ihn zu deaktivieren, zu verlängern oder vor dem Auslösen zu pausieren.',

  meterNamePresent_title: 'Meter-Elemente haben einen zugänglichen Namen',
  meterNamePresent_description:
    'Prüft, ob Elemente mit role="meter" einen nicht leeren zugänglichen Namen aufweisen.',
  meterNamePresent_summary_fail: 'Dieses Meter-Element hat keinen zugänglichen Namen.',
  meterNamePresent_hint_fail:
    'Stellen Sie aria-label, aria-labelledby oder ein title-Attribut bereit — sichtbarer Textinhalt wird bei diesem Meter-Element nicht als zugänglicher Name ausgegeben.',

  progressbarNamePresent_title: 'Fortschrittsanzeigen haben einen zugänglichen Namen',
  progressbarNamePresent_description:
    'Prüft, ob Elemente mit role="progressbar" einen nicht leeren zugänglichen Namen aufweisen.',
  progressbarNamePresent_summary_fail: 'Diese Fortschrittsanzeige hat keinen zugänglichen Namen.',
  progressbarNamePresent_hint_fail:
    'Stellen Sie aria-label, aria-labelledby oder ein title-Attribut bereit — sichtbarer Textinhalt wird bei dieser Fortschrittsanzeige nicht als zugänglicher Name ausgegeben.',

  tooltipNamePresent_title: 'Tooltips haben einen zugänglichen Namen',
  tooltipNamePresent_description:
    'Prüft, ob Elemente mit role="tooltip" einen nicht leeren zugänglichen Namen aufweisen.',
  tooltipNamePresent_summary_fail: 'Dieser Tooltip hat keinen zugänglichen Namen.',
  tooltipNamePresent_hint_fail:
    'Stellen Sie einen Tooltip-Text bereit, der nicht vor assistiven Technologien verborgen ist, oder stellen Sie aria-label oder aria-labelledby bereit.',

  serverSideImageMapAbsent_title: 'Bilder dürfen keine serverseitige Image-Map verwenden',
  serverSideImageMapAbsent_description:
    'Prüft, ob <img>-Elemente nicht das ismap-Attribut tragen (serverseitige Image-Maps haben kein per Tastatur bedienbares Äquivalent).',
  serverSideImageMapAbsent_summary_fail:
    'Dieses Bild verwendet eine serverseitige Image-Map, die kein per Tastatur bedienbares Äquivalent hat.',
  serverSideImageMapAbsent_hint_fail:
    'Ersetzen Sie die serverseitige Image-Map (ismap) durch eine clientseitige Image-Map (<map>/<area>) oder separate zugängliche Links/Schaltflächen.',

  formControlSingleLabel_title: 'Formularelemente dürfen nicht mehrere Beschriftungen haben',
  formControlSingleLabel_description:
    'Prüft, ob ein Formularelement mit höchstens einem <label> verknüpft ist (durch Umschließen oder durch label[for]).',
  formControlSingleLabel_summary_fail:
    'Dieses <{{element}}> ist mit {{labelCount}} Beschriftungen verknüpft.',
  formControlSingleLabel_hint_fail:
    'Behalten Sie nur ein <label> pro Formularelement (entweder umschließend oder über for/id referenziert).',

  nestedInteractiveControlsAbsent_title:
    'Interaktive Formularelemente dürfen nicht verschachtelt sein',
  nestedInteractiveControlsAbsent_description:
    'Prüft, ob ein interaktives Element (Link, Schaltfläche, Formularelement oder ARIA-Widget-Rolle) kein weiteres interaktives Element enthält.',
  nestedInteractiveControlsAbsent_summary_fail:
    'Dieses <{{element}}> enthält ein oder mehrere verschachtelte interaktive Elemente: {{nestedElements}}.',
  nestedInteractiveControlsAbsent_hint_fail:
    'Verschieben Sie die verschachtelten interaktiven Elemente außerhalb dieses Elements; verschachtelte interaktive Elemente sind über assistive Technologien nicht zuverlässig bedienbar.',

  bypassBlocksPresent_title:
    'Die Seite muss eine Möglichkeit bieten, wiederkehrende Blöcke zu überspringen',
  bypassBlocksPresent_description:
    'Prüft, ob die Seite mindestens einen anerkannten Mechanismus nach WCAG 2.4.1 zum Überspringen wiederkehrender Blöcke hat: eine main-Landmarke, einen funktionierenden Anker-Link auf derselben Seite oder eine Überschrift.',
  bypassBlocksPresent_summary_fail:
    'Diese Seite hat keine anerkannte Möglichkeit, wiederkehrende Inhaltsblöcke zu überspringen.',
  bypassBlocksPresent_hint_fail:
    'Fügen Sie eine main-Landmarke (<main> oder role="main"), einen funktionierenden „Zum Inhalt springen“-Link oder Überschriften-Elemente hinzu, die assistive Technologien nutzen können, um wiederkehrende Inhalte zu überspringen.',

  landmarkBannerIsTopLevel_title: 'Die banner-Landmarke muss auf oberster Ebene liegen',
  landmarkBannerIsTopLevel_description:
    'Prüft, ob die banner-Landmarke (role="banner" oder ein nicht verschachtelter <header>) nicht innerhalb einer anderen Landmarke verschachtelt ist.',
  landmarkBannerIsTopLevel_summary_cantTell:
    'Diese banner-Landmarke ist innerhalb einer anderen Landmarke verschachtelt.',
  landmarkBannerIsTopLevel_hint_cantTell:
    'Verschieben Sie die banner-Landmarke (header/role="banner") so, dass sie nicht von einer anderen Landmarke umschlossen wird; eine banner-Landmarke sollte eine Region auf oberster Ebene der Seite sein.',

  landmarkContentinfoIsTopLevel_title: 'Die contentinfo-Landmarke muss auf oberster Ebene liegen',
  landmarkContentinfoIsTopLevel_description:
    'Prüft, ob die contentinfo-Landmarke (role="contentinfo" oder ein nicht verschachtelter <footer>) nicht innerhalb einer anderen Landmarke verschachtelt ist.',
  landmarkContentinfoIsTopLevel_summary_cantTell:
    'Diese contentinfo-Landmarke ist innerhalb einer anderen Landmarke verschachtelt.',
  landmarkContentinfoIsTopLevel_hint_cantTell:
    'Verschieben Sie die contentinfo-Landmarke (footer/role="contentinfo") so, dass sie nicht von einer anderen Landmarke umschlossen wird; contentinfo sollte eine Region auf oberster Ebene der Seite sein.',

  landmarkMainIsTopLevel_title: 'Die main-Landmarke muss auf oberster Ebene liegen',
  landmarkMainIsTopLevel_description:
    'Prüft, ob die main-Landmarke (role="main" oder <main>) nicht innerhalb einer anderen Landmarke verschachtelt ist.',
  landmarkMainIsTopLevel_summary_cantTell:
    'Diese main-Landmarke ist innerhalb einer anderen Landmarke verschachtelt.',
  landmarkMainIsTopLevel_hint_cantTell:
    'Verschieben Sie die main-Landmarke (<main>/role="main") so, dass sie nicht von einer anderen Landmarke umschlossen wird; main sollte eine Region auf oberster Ebene der Seite sein.',

  landmarkNoDuplicateBanner_title: 'Die Seite darf nicht mehr als eine banner-Landmarke haben',
  landmarkNoDuplicateBanner_description:
    'Prüft, ob höchstens eine banner-Landmarke (role="banner" oder ein nicht verschachtelter <header>) auf der Seite vorhanden ist.',
  landmarkNoDuplicateBanner_summary_cantTell: 'Diese Seite hat mehr als eine banner-Landmarke.',
  landmarkNoDuplicateBanner_hint_cantTell:
    'Behalten Sie nur eine banner-Landmarke (header/role="banner") pro Seite.',

  landmarkNoDuplicateContentinfo_title:
    'Die Seite darf nicht mehr als eine contentinfo-Landmarke haben',
  landmarkNoDuplicateContentinfo_description:
    'Prüft, ob höchstens eine contentinfo-Landmarke (role="contentinfo" oder ein nicht verschachtelter <footer>) auf der Seite vorhanden ist.',
  landmarkNoDuplicateContentinfo_summary_cantTell:
    'Diese Seite hat mehr als eine contentinfo-Landmarke.',
  landmarkNoDuplicateContentinfo_hint_cantTell:
    'Behalten Sie nur eine contentinfo-Landmarke (footer/role="contentinfo") pro Seite.',

  landmarkNoDuplicateMain_title: 'Die Seite darf nicht mehr als eine main-Landmarke haben',
  landmarkNoDuplicateMain_description:
    'Prüft, ob höchstens eine main-Landmarke (role="main" oder <main>) auf der Seite vorhanden ist.',
  landmarkNoDuplicateMain_summary_cantTell: 'Diese Seite hat mehr als eine main-Landmarke.',
  landmarkNoDuplicateMain_hint_cantTell:
    'Behalten Sie nur eine main-Landmarke (<main>/role="main") pro Seite.',

  landmarkOneMain_title: 'Die Seite sollte eine main-Landmarke haben',
  landmarkOneMain_description:
    'Prüft, ob die Seite mindestens eine main-Landmarke (role="main" oder <main>) hat.',
  landmarkOneMain_summary_cantTell_missing: 'Diese Seite hat keine main-Landmarke.',
  landmarkOneMain_hint_cantTell_missing:
    'Fügen Sie eine main-Landmarke (<main> oder role="main") um den primären Inhalt der Seite hinzu.',

  landmarkUnique_title: 'Landmarken mit derselben Rolle müssen eindeutige Namen haben',
  landmarkUnique_description:
    'Prüft, ob bei zwei oder mehr Landmarken mit derselben Rolle jede einen eigenen zugänglichen Namen hat.',
  landmarkUnique_summary_cantTell_duplicateName:
    'Diese {{role}}-Landmarke teilt ihren zugänglichen Namen mit einer anderen {{role}}-Landmarke.',
  landmarkUnique_summary_cantTell_bothUnnamed:
    'Diese {{role}}-Landmarke hat keinen zugänglichen Namen, und es gibt mehr als eine unbenannte {{role}}-Landmarke auf dieser Seite.',
  landmarkUnique_hint_cantTell:
    'Geben Sie jeder {{role}}-Landmarke über aria-label oder aria-labelledby einen eigenen Namen.',

  emptyHeading_title: 'Überschriften dürfen nicht leer sein',
  emptyHeading_description:
    'Prüft, ob Überschriften-Elemente (<h1>-<h6> oder role="heading") einen nicht leeren zugänglichen Namen haben.',
  emptyHeading_summary_cantTell: 'Diese Überschrift hat keinen zugänglichen Namen.',
  emptyHeading_hint_cantTell:
    'Fügen Sie dieser Überschrift Textinhalt (oder aria-label/aria-labelledby) hinzu, oder entfernen Sie sie, wenn sie nicht benötigt wird.',

  headingOrder_title: 'Überschriftenebenen dürfen keine Ebene überspringen',
  headingOrder_description:
    'Prüft, ob Überschriftenebenen in Dokumentreihenfolge jeweils höchstens um eine Ebene steigen.',
  headingOrder_summary_cantTell:
    'Diese Überschrift springt von Ebene {{fromLevel}} auf Ebene {{toLevel}} und überspringt dabei eine Ebene.',
  headingOrder_hint_cantTell:
    'Verwenden Sie aufeinanderfolgende Überschriftenebenen (überspringen Sie beim Tieferwerden keine Ebene), damit die Dokumentgliederung vorhersehbar bleibt.',

  pageHasHeadingOne_title: 'Die Seite sollte eine Überschrift der Ebene eins haben',
  pageHasHeadingOne_description:
    'Prüft, ob die Seite mindestens eine Überschrift der Ebene eins hat (<h1> oder role="heading" mit aria-level="1").',
  pageHasHeadingOne_summary_cantTell: 'Diese Seite hat keine Überschrift der Ebene eins.',
  pageHasHeadingOne_hint_cantTell:
    'Fügen Sie eine Überschrift der Ebene eins hinzu (<h1> oder role="heading" aria-level="1"), die den Hauptinhalt der Seite identifiziert.',

  accesskeys_title: 'accesskey-Werte müssen eindeutig sein',
  accesskeys_description:
    'Prüft, ob nicht zwei Elemente auf der Seite denselben accesskey-Attributwert teilen.',
  accesskeys_summary_cantTell:
    'Der accesskey dieses Elements wird mit einem anderen Element auf der Seite geteilt.',
  accesskeys_hint_cantTell: 'Machen Sie jeden accesskey-Wert auf der gesamten Seite eindeutig.',

  scopeAttrValid_title: 'Das scope-Attribut muss einen gültigen Wert haben',
  scopeAttrValid_description: 'Prüft, ob scope="…" row, col, rowgroup oder colgroup ist.',
  scopeAttrValid_summary_cantTell: 'Dieser scope-Attributwert wird nicht erkannt.',
  scopeAttrValid_hint_cantTell:
    'Verwenden Sie für das scope-Attribut row, col, rowgroup oder colgroup.',

  tabindex_title: 'tabindex sollte nicht größer als 0 sein',
  tabindex_description: 'Prüft, ob tabindex-Werte 0 oder negativ sind, nicht eine positive Zahl.',
  tabindex_summary_cantTell:
    'Dieses Element hat einen positiven tabindex, der die natürliche Tab-Reihenfolge überschreibt.',
  tabindex_hint_cantTell:
    'Verwenden Sie tabindex="0" (oder einen negativen Wert, um es aus der Tab-Reihenfolge zu entfernen) anstelle einer positiven Zahl; korrigieren Sie stattdessen die DOM-Reihenfolge, wenn eine andere Tab-Reihenfolge benötigt wird.',

  emptyTableHeader_title: 'Tabellen-Kopfzellen dürfen nicht leer sein',
  emptyTableHeader_description:
    'Prüft, ob <th>-Elemente sichtbaren Textinhalt haben — eine Kopfzelle, die nur über aria-label/aria-labelledby benannt ist, wird ebenfalls markiert, da die tatsächliche Unterstützung durch Screenreader/Browser dafür uneinheitlich ist.',
  emptyTableHeader_summary_cantTell: 'Diese Tabellen-Kopfzelle hat keinen zugänglichen Namen.',
  emptyTableHeader_hint_cantTell:
    'Fügen Sie dieser Kopfzelle Textinhalt (oder aria-label/aria-labelledby) hinzu, oder entfernen Sie sie, wenn sie nicht benötigt wird.',
  emptyTableHeader_summary_cantTell_ariaOnly:
    'Diese Tabellen-Kopfzelle hat keinen sichtbaren Text — ihr einziger zugänglicher Name stammt von aria-label/aria-labelledby, was bekanntermaßen von realen Screenreader-/Browser-Kombinationen (z. B. NVDA+Firefox, iOS VoiceOver+Safari) bei <th>-Elementen ignoriert wird.',
  emptyTableHeader_hint_cantTell_ariaOnly:
    'Fügen Sie dieser Kopfzelle sichtbaren Textinhalt hinzu (zusätzlich zu, oder anstelle von, aria-label/aria-labelledby) — sichtbarer Text ist der einzige Benennungsmechanismus, der bei getesteten Screenreadern nachweislich funktioniert.',

  labelTitleOnly_title: 'Formularelemente sollten title nicht als einzige Beschriftung verwenden',
  labelTitleOnly_description:
    'Prüft, ob ein Formularelement mit einem title-Attribut auch eine echte Beschriftung hat (label-Element, aria-label oder aria-labelledby).',
  labelTitleOnly_summary_cantTell:
    'Dieses Formularelement stützt sich auf das title-Attribut als einzige Beschriftung.',
  labelTitleOnly_hint_cantTell:
    'Fügen Sie zusätzlich zu, oder anstelle von, dem title-Attribut ein sichtbares <label> (oder aria-label/aria-labelledby) hinzu.',

  imageRedundantAlt_title:
    'Der Alternativtext eines Bildes darf angrenzenden sichtbaren Text nicht duplizieren',
  imageRedundantAlt_description:
    'Prüft, ob der Alternativtext eines <img> nicht mit anderem, bereits in seinem unmittelbaren übergeordneten Element vorhandenem sichtbaren Text identisch ist.',
  imageRedundantAlt_summary_cantTell:
    'Der Alternativtext dieses Bildes dupliziert anderen sichtbaren Text direkt daneben.',
  imageRedundantAlt_hint_cantTell:
    'Setzen Sie den Alternativtext auf leer (alt=""), wenn das Bild neben dem Text rein dekorativ ist, oder entfernen Sie die redundante Duplizierung.',

  tableDuplicateName_title: 'Die Tabellenbeschriftung darf ihr summary-Attribut nicht duplizieren',
  tableDuplicateName_description:
    'Prüft, ob der <caption>-Text einer <table> nicht identisch mit ihrem (veralteten) summary-Attribut ist.',
  tableDuplicateName_summary_cantTell:
    'Die Beschriftung dieser Tabelle dupliziert ihr summary-Attribut.',
  tableDuplicateName_hint_cantTell:
    'Entfernen Sie das redundante summary-Attribut, oder lassen Sie es andere Informationen als die Beschriftung liefern.',

  metaViewportLarge_title: 'Der Viewport-Meta-Tag sollte ein Zoomen bis zu 500 % erlauben',
  metaViewportLarge_description:
    'Prüft, ob <meta name="viewport"> nicht user-scalable=no oder maximum-scale unter 5 (500 %) setzt.',
  metaViewportLarge_summary_cantTell:
    'Dieser Viewport-Meta-Tag schränkt den Zoom unter das empfohlene Ziel von 500 % ein.',
  metaViewportLarge_hint_cantTell:
    'Entfernen Sie user-scalable=no und erhöhen Sie maximum-scale nach Möglichkeit auf mindestens 5 (500 %).',

  presentationRoleConflict_title:
    'Eine präsentationale Rolle darf nicht mit einem globalen ARIA-Attribut oder Fokussierbarkeit im Konflikt stehen',
  presentationRoleConflict_description:
    'Prüft, ob role="presentation"/"none" (einschließlich der impliziten presentation-Rolle eines <img alt="">) nicht mit einem globalen ARIA-Attribut (aria-label, aria-hidden, aria-describedby, …) oder Fokussierbarkeit (tabindex/nativ) kombiniert wird.',
  presentationRoleConflict_summary_cantTell:
    'Dieses Element mit role="{{role}}" hat außerdem eine widersprüchliche Bedingung ({{attrs}}), die seine implizite Rolle wiederherstellt und die präsentationale Absicht aufhebt.',
  presentationRoleConflict_hint_cantTell:
    'Entfernen Sie das/die widersprüchliche(n) Benennungsattribut(e) und/oder die Fokussierbarkeit (tabindex/nativ), wenn das Element präsentational bleiben soll, oder entfernen Sie role="presentation"/"none", wenn es assistiven Technologien zur Verfügung gestellt werden soll.',

  region_title: 'Der Seiteninhalt sollte sich innerhalb einer Landmarke befinden',
  region_description: 'Prüft, ob Inhalt unter <body> innerhalb einer Landmarke enthalten ist.',
  region_summary_cantTell: 'Dieser Inhalt befindet sich innerhalb keiner Landmarke.',
  region_hint_cantTell:
    'Verschieben Sie diesen Inhalt in eine Landmarke (main, nav, aside, ein beschrifteter Abschnitt usw.).',

  skipLink_title: 'Ein Sprunglink muss ein auflösbares, nutzbares Ziel haben',
  skipLink_description:
    'Prüft, ob das href-Fragment eines „Zu … springen“-Links auf ein reales, derzeit nutzbares Element im Dokument aufgelöst wird.',
  skipLink_summary_cantTell: 'Das Ziel dieses Sprunglinks existiert nicht.',
  skipLink_hint_cantTell:
    'Verweisen Sie mit dem href des Sprunglinks auf eine im Dokument existierende id, oder fügen Sie das fehlende Zielelement hinzu.',
  skipLink_summary_unusableTarget_cantTell:
    'Dieser Sprunglink zeigt auf ein Ziel, das existiert, aber derzeit nicht nutzbar ist.',
  skipLink_hint_unusableTarget_cantTell:
    'Verweisen Sie mit diesem Sprunglink auf ein Ziel, das als Navigationsziel verfügbar und nutzbar ist.',

  autocompleteValid_title: 'Das autocomplete-Attribut muss ein gültiger Autofill-Wert sein',
  autocompleteValid_description:
    'Prüft, ob ein nicht leeres autocomplete-Attribut „on“/„off“ oder eine wohlgeformte Liste von Autofill-Detail-Tokens ist.',
  autocompleteValid_summary_fail:
    'Dieser autocomplete-Attributwert ist kein gültiger Autofill-Wert.',
  autocompleteValid_hint_fail:
    'Verwenden Sie „on“/„off“ oder eine gültige Liste von Autofill-Tokens (z. B. „shipping street-address“, „cc-number“).',

  htmlXmlLangMismatch_title: 'lang und xml:lang dürfen sich nicht widersprechen',
  htmlXmlLangMismatch_description:
    'Prüft, ob die Attribute lang und xml:lang des <html>-Elements dieselbe Hauptsprache deklarieren, wenn beide vorhanden sind.',
  htmlXmlLangMismatch_summary_fail:
    'Die Attribute lang („{{lang}}“) und xml:lang („{{xmlLang}}“) deklarieren unterschiedliche Sprachen.',
  htmlXmlLangMismatch_hint_fail:
    'Lassen Sie lang und xml:lang dieselbe Hauptsprache deklarieren, oder entfernen Sie das veraltete Attribut xml:lang.',

  avoidInlineSpacing_title:
    'Inline-Stile dürfen den Textabstand nicht unter den WCAG-Wert erzwingen',
  avoidInlineSpacing_description:
    'Prüft, dass ein per !important erzwungener Wert für line-height, letter-spacing oder word-spacing WCAG 1.4.12 bereits erfüllt, sodass dem Nutzer nichts zu überschreiben bleibt.',
  avoidInlineSpacing_summary_fail:
    'Der Inline-Stil dieses Elements erzwingt {{properties}} mit !important und blockiert damit Überschreibungen des Textabstands durch den Nutzer.',
  avoidInlineSpacing_hint_fail:
    'Entfernen Sie !important von line-height/letter-spacing/word-spacing in Inline-Stilen, damit Nutzer den Textabstand überschreiben können.',

  metaRefreshNoExceptions_title: 'Die Seite darf überhaupt keinen Meta-Refresh verwenden (AAA)',
  metaRefreshNoExceptions_description:
    'Prüft, ob <meta http-equiv="refresh"> unabhängig von der Verzögerung überhaupt nicht vorhanden ist — das strengere AAA-Gegenstück zur A-Prüfung, die nur positive Verzögerungen betrachtet.',
  metaRefreshNoExceptions_summary_fail:
    'Diese Seite verwendet einen Meta-Refresh, eine automatische Kontextänderung, die nicht vom Nutzer ausgelöst wird.',
  metaRefreshNoExceptions_hint_fail:
    'Entfernen Sie den Meta-Refresh; lösen Sie die Weiterleitung/Aktualisierung stattdessen nur als Reaktion auf eine Nutzeraktion aus.',

  validLang_title: 'Das lang-Attribut eines Elements muss syntaktisch gültig sein',
  validLang_description:
    'Prüft, ob jedes Element (außer dem Wurzelelement <html>) mit einem nicht leeren lang-Attribut ein syntaktisch gültiges Sprach-Tag verwendet.',
  validLang_summary_fail:
    'Dieser lang-Attributwert („{{value}}“) ist kein syntaktisch gültiges Sprach-Tag.',
  validLang_hint_fail: 'Verwenden Sie ein gültiges BCP-47-Sprach-Tag (z. B. „fr“, „es-MX“).',

  linkInTextBlock_title:
    'Links in Textblöcken müssen sich vom umgebenden Text unterscheiden lassen, ohne sich allein auf Farbe zu verlassen',
  linkInTextBlock_description:
    'Prüft, ob ein Link innerhalb eines Textabschnitts durch Unterstreichung, einen Unterschied in Schriftgewicht/-stil oder einen ausreichenden (>= 3:1) Farbkontrastunterschied visuell vom umgebenden Text unterscheidbar ist — nicht allein durch Farbe.',
  linkInTextBlock_summary_fail:
    'Dieser Link in einem Textblock unterscheidet sich vom umgebenden Text ausschließlich durch Farbe.',
  linkInTextBlock_hint_fail:
    'Fügen Sie eine Unterstreichung oder einen Unterschied in Schriftgewicht/-stil hinzu, oder erhöhen Sie den Farbkontrast zwischen Link und umgebendem Text auf mindestens 3:1.',

  noAutoplayAudio_title:
    'Automatisch abgespieltes Audio sollte einen Mechanismus zum Pausieren/Stoppen oder zur Lautstärkeregelung bieten',
  noAutoplayAudio_description:
    'Markiert <audio>/<video>-Elemente, die unstummgeschaltet automatisch abspielen und kein natives controls-Attribut haben, zur manuellen Überprüfung im Hinblick auf die 3-Sekunden-Ausnahme in WCAG 1.4.2.',
  noAutoplayAudio_summary_cantTell:
    'Dieses Element spielt Audio automatisch ab, ohne einen nativen Mechanismus zum Pausieren/Stoppen oder zur Lautstärkeregelung.',
  noAutoplayAudio_hint_cantTell:
    'Falls dieser Clip länger als 3 Sekunden abläuft, fügen Sie ein controls-Attribut (oder einen gleichwertigen benutzerdefinierten Mechanismus) hinzu, damit Nutzer ihn pausieren/stoppen oder seine Lautstärke unabhängig von der Systemlautstärke regeln können.',

  videoCaption_title: 'Voraufgezeichnetes Video sollte eine Untertitelspur bereitstellen',
  videoCaption_description:
    'Markiert <video>-Elemente ohne <track kind="captions"|"subtitles">-Kind zur manuellen Überprüfung, ob das Video eine Audiospur hat, die Untertitel benötigt.',
  videoCaption_summary_cantTell: 'Dieses Video hat keine Untertitelspur (captions oder subtitles).',
  videoCaption_hint_cantTell:
    'Falls dieses Video eine informationstragende Audiospur hat, fügen Sie ein <track kind="captions" src="…"> mit dem untertitelten Inhalt hinzu.',

  scrollableRegionFocusable_title:
    'Scrollbare Bereiche ohne fokussierbaren Inhalt sollten per Tastatur fokussierbar sein',
  scrollableRegionFocusable_description:
    'Markiert Elemente, deren CSS overflow:auto/scroll deklariert, die keinen fokussierbaren Nachfahren enthalten und selbst nicht per Tastatur fokussierbar sind, zur manuellen Überprüfung, ob ihr Inhalt tatsächlich überläuft und Tastaturzugriff zum Scrollen benötigt.',
  scrollableRegionFocusable_summary_cantTell:
    'Dieses Element deklariert overflow:auto/scroll, hat keinen fokussierbaren Nachfahren und ist selbst nicht per Tastatur fokussierbar.',
  scrollableRegionFocusable_hint_cantTell:
    'Falls der Inhalt dieses Bereichs tatsächlich überläuft, fügen Sie tabindex="0" (und eine geeignete Beschriftung) hinzu, damit Tastaturnutzer ihn fokussieren und mit den Pfeiltasten scrollen können.',

  identicalLinksSamePurpose_title:
    'Links mit demselben zugänglichen Namen sollten zum selben Ziel führen',
  identicalLinksSamePurpose_description:
    'Markiert Gruppen von Links, die denselben zugänglichen Namen teilen, aber zu mehr als einem unterschiedlichen Ziel führen, zur manuellen Überprüfung, ob sie demselben Zweck dienen.',
  identicalLinksSamePurpose_summary_cantTell:
    'Dieser Link teilt einen zugänglichen Namen mit anderen Links auf der Seite, die zu einem anderen Ziel führen.',
  identicalLinksSamePurpose_hint_cantTell:
    'Stellen Sie sicher, dass Links mit demselben Text demselben Zweck dienen, oder machen Sie den Linktext eindeutig genug, um jedes Ziel zu beschreiben.',

  ariaBrailleEquivalent_title:
    'aria-braillelabel/aria-brailleroledescription müssen ein Nicht-Braille-Äquivalent haben',
  ariaBrailleEquivalent_description:
    'Prüft, ob Elemente, die aria-braillelabel verwenden, auch einen regulären zugänglichen Namen haben, und Elemente, die aria-brailleroledescription verwenden, auch aria-roledescription haben.',
  ariaBrailleEquivalent_summary_fail:
    'Dieses Element hat {{attr}}, aber nicht {{requires}}, sein Nicht-Braille-Äquivalent.',
  ariaBrailleEquivalent_hint_fail:
    '{{attr}} ist eine Braille-spezifische Ergänzung, kein Ersatz — stellen Sie zusätzlich {{requires}} bereit.',

  ariaConditionalAttr_title:
    'aria-errormessage erfordert, dass aria-invalid auf einen Wert ungleich false gesetzt ist',
  ariaConditionalAttr_description:
    'Prüft, ob Elemente mit aria-errormessage auch aria-invalid auf „true“, „grammar“ oder „spelling“ gesetzt haben — andernfalls wird die Fehlermeldung aus dem Accessibility-Baum entfernt.',
  ariaConditionalAttr_summary_fail:
    'Dieses Element hat aria-errormessage, aber aria-invalid fehlt oder ist „false“, sodass die Fehlermeldung nicht zur Verfügung gestellt wird.',
  ariaConditionalAttr_hint_fail:
    'Setzen Sie aria-invalid auf „true“ (oder „grammar“/„spelling“), wann immer aria-errormessage assistiven Technologien zur Verfügung gestellt werden soll.',

  ariaCheckedStateMismatch_title:
    'Das aria-checked eines nativen Kontrollkästchens/Optionsfelds sollte seinem tatsächlichen Zustand entsprechen',
  ariaCheckedStateMismatch_description:
    'Markiert ein natives <input type="checkbox">/<input type="radio">, dessen expliziter aria-checked-Wert nicht mit seinem tatsächlichen aktivierten/unbestimmten Zustand übereinstimmt, zur manuellen Überprüfung.',
  ariaCheckedStateMismatch_summary_cantTell:
    'Der aria-checked-Wert dieses Elements stimmt nicht mit seinem tatsächlichen aktivierten/unbestimmten Zustand überein.',
  ariaCheckedStateMismatch_hint_cantTell:
    'Setzen Sie aria-checked passend zum tatsächlichen Zustand des Elements, oder entfernen Sie es — ein natives Kontrollkästchen/Optionsfeld stellt diesen Zustand bereits ohne dieses Attribut zur Verfügung.',

  cssOrientationLock_title: 'CSS darf die Seite nicht auf eine einzige Ausrichtung festlegen',
  cssOrientationLock_description:
    'Prüft, ob keine @media (orientation: portrait|landscape)-Regel ein transform: rotate(...) auf der Seite setzt, eine bekannte Technik, um die Geräteausrichtung zu umgehen.',
  cssOrientationLock_summary_fail:
    'Eine Media Query „{{mediaText}}“ dreht „{{selectorText}}“ und legt die Seite damit auf eine Ausrichtung fest.',
  cssOrientationLock_hint_fail:
    'Entfernen Sie die rotate()-Transformation aus der Ausrichtungs-Media-Query; lassen Sie die Seite stattdessen natürlich auf die Geräteausrichtung reagieren, anstatt eine visuelle Drehung zu erzwingen.',

  ariaText_title: 'Elemente mit role="text" sollten keine fokussierbaren Nachfahren haben',
  ariaText_description:
    'Prüft, ob Elemente mit role="text" keinen fokussierbaren Nachfahren enthalten (Link, Schaltfläche, Formularelement, tabindex, iframe oder contenteditable).',
  ariaText_summary_cantTell:
    'Dieses Element mit role="text" enthält einen fokussierbaren Nachfahren.',
  ariaText_hint_cantTell:
    'Entfernen Sie role="text" (oder entfernen Sie den fokussierbaren Nachfahren) — ein Bereich mit „reinem Text“ sollte keinen fokussierbaren Inhalt enthalten.',

  focusOrderSemantics_title:
    'Zur Tab-Reihenfolge hinzugefügte Elemente sollten interaktive Semantik haben',
  focusOrderSemantics_description:
    'Markiert Elemente mit tabindex >= 0, deren explizite Rolle eine nicht interaktive strukturelle/dokumentarische Rolle ist (z. B. heading, list, region, presentation), zur manuellen Überprüfung.',
  focusOrderSemantics_summary_cantTell:
    'Dieses Element befindet sich in der Tab-Reihenfolge (tabindex="{{tabindex}}"), hat jedoch eine nicht interaktive Rolle („{{role}}“).',
  focusOrderSemantics_hint_cantTell:
    'Entfernen Sie tabindex, wenn dieses Element nicht interaktiv sein soll, oder verwenden Sie eine interaktive Rolle, die seinem tatsächlichen Verhalten entspricht.',

  pAsHeading_title:
    'Ein <p>, das wie eine Überschrift aussieht, sollte wahrscheinlich eine echte Überschrift sein',
  pAsHeading_description:
    'Markiert kurze <p>-Elemente, deren gesamter Text fett ist und in >= 18px dargestellt wird, zur manuellen Überprüfung, ob stattdessen ein echtes Überschriften-Element verwendet werden sollte.',
  pAsHeading_summary_cantTell:
    'Dieser Absatz ist vollständig fett und wird in einer überschriftenähnlichen Größe dargestellt.',
  pAsHeading_hint_cantTell:
    'Wenn dieser Text einen neuen Abschnitt einleitet, verwenden Sie ein echtes Überschriften-Element (<h1>-<h6> oder role="heading"), anstatt einen Absatz so zu gestalten, dass er wie eine Überschrift aussieht.',

  tableFakeCaption_title:
    'Die erste Zeile einer Tabelle sollte nicht eine echte <caption> ersetzen',
  tableFakeCaption_description:
    'Markiert Tabellen ohne <caption>, deren erste Zeile eine einzelne nicht leere Zelle hat, während andere Zeilen mehrere Zellen haben, zur manuellen Überprüfung, ob diese Zelle als unechte Beschriftung fungiert.',
  tableFakeCaption_summary_cantTell:
    'Diese Tabelle hat keine <caption>, aber ihre erste Zeile besteht aus einer einzelnen Zelle oberhalb von Zeilen mit mehreren Zellen — sie könnte als unechte Beschriftung fungieren.',
  tableFakeCaption_hint_cantTell:
    'Wenn diese Zelle die Tabelle beschreiben soll, verwenden Sie ein echtes <caption>-Element anstelle einer einzelnen Zelle in der ersten Zeile.',

  tdHasHeader_title: 'Datenzellen in großen Tabellen müssen einen zugeordneten Header haben',
  tdHasHeader_description:
    'Prüft, ob jedes <td> in einer großen, einfachen Tabelle (ohne colspan/rowspan) einen zugeordneten Header hat — über ein headers-Attribut, ein implizites Spalten-<th> darüber oder ein implizites Zeilen-<th> links davon.',
  tdHasHeader_summary_fail:
    'Diese Datenzelle hat keinen zugeordneten Header (kein headers-Attribut, kein Spalten-<th> darüber, kein Zeilen-<th> links davon).',
  tdHasHeader_hint_fail:
    'Fügen Sie ein headers-Attribut hinzu, das auf die relevante(n) <th>-id(s) verweist, oder strukturieren Sie die Tabelle so um, dass diese Zelle einen impliziten Zeilen-/Spalten-Header hat.',

  mouseOnlyEventHandlers_title:
    'Nur für den Zeiger bestimmte Inline-Event-Handler sollten ein per Tastatur erreichbares Äquivalent haben',
  mouseOnlyEventHandlers_description:
    'Markiert Elemente mit einem nur für den Zeiger bestimmten Inline-Event-Handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave) ohne per Tastatur erreichbares Äquivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), zur manuellen Überprüfung.',
  mouseOnlyEventHandlers_summary_cantTell:
    'Dieses Element hat {{attrs}}, aber keinen entsprechenden, per Tastatur erreichbaren Handler.',
  mouseOnlyEventHandlers_hint_cantTell:
    'Fügen Sie onkeydown/onkeyup/onkeypress (oder onfocus/onblur für durch Hover ausgelöstes Verhalten) hinzu, damit diese Funktionalität auch per Tastatur erreichbar ist.',

  linkNameQuality_title: 'Der Linktext sollte aussagekräftig sein, nicht generisch',
  linkNameQuality_description:
    'Markiert Links, deren vollständiger zugänglicher Name eine bekannte, wenig aussagekräftige Formulierung ist (z. B. „hier klicken“, „mehr erfahren“, „mehr“), zur manuellen Überprüfung, ob der Zweck ohne zusätzlichen Kontext klar ist.',
  linkNameQuality_summary_cantTell:
    'Der zugängliche Name dieses Links („{{name}}“) ist eine generische, wenig aussagekräftige Formulierung.',
  linkNameQuality_hint_cantTell:
    'Lassen Sie den Linktext selbst sein Ziel/seinen Zweck beschreiben (z. B. „Preisliste 2026 herunterladen“ statt „Herunterladen“), oder bestätigen Sie, dass der umgebende Kontext den Zweck bereits klar macht.'
};
