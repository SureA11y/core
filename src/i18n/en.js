'use strict';

module.exports = {
    "a11ycore_img_altPresent_title": "<img> must have an alt attribute",
    "a11ycore_img_altPresent_description": "Checks that <img> elements provide an alt attribute to support a text alternative mechanism.",

    "a11ycore_img_altPresent_summary_fail": "Missing alt attribute on <img>.",
    "a11ycore_img_altPresent_hint_fail": "Add an alt attribute (use alt=\"\" only for decorative images).",
    "a11ycore_area_altPresent_title": '<area> must have an alt attribute',
    "a11ycore_area_altPresent_description":
        'Checks that <area> elements provide an alt attribute to support a text alternative mechanism.',
    "a11ycore_area_altPresent_summary_fail": 'Missing alt attribute on <area>.',
    "a11ycore_area_altPresent_hint_fail": 'Add an alt attribute (use alt="" only for decorative areas).',
    "a11ycore_inputImage_altPresent_title": "<input type=\"image\"> must have an alt attribute",
    "a11ycore_inputImage_altPresent_description": "Checks that <input type=\"image\"> elements provide an alt attribute to support a text alternative mechanism.",
    "a11ycore_inputImage_altPresent_summary_fail": "Missing alt attribute on <input type=\"image\">.",
    "a11ycore_inputImage_altPresent_hint_fail": "Add an alt attribute (use alt=\"\" only when a separate accessible name is provided).",
    "a11ycore_ariaHidden_programmaticFocus_review_title": "Review aria-hidden programmatic focus",
    "a11ycore_ariaHidden_programmaticFocus_review_description": "Flags elements that are aria-hidden but considered eligible due to programmatic focus (e.g., tabindex < 0). Verify intended focus management and assistive technology exposure.",
    "a11ycore_ariaHidden_programmaticFocus_review_summary": "Review: aria-hidden element is programmatically focusable.",
    "a11ycore_ariaHidden_programmaticFocus_review_hint": "Check that focus management is intentional and that the element should remain hidden from assistive technologies.",
    "a11ycore_canvas_textAltPresent_title": "<canvas> must provide a text alternative",
    "a11ycore_canvas_textAltPresent_description": "Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.",
    "a11ycore_canvas_textAltPresent_summary_fail": "Missing text alternative for <canvas>.",
    "a11ycore_canvas_textAltPresent_hint_fail": "Provide fallback text inside <canvas> or an accessible name (e.g., aria-label/aria-labelledby).",
    "a11ycore_svg_textAltPresent_title": "<svg> must provide a text alternative",
    "a11ycore_svg_textAltPresent_description": "Checks that inline <svg> elements provide a text alternative via a <title> element or an ARIA name (a <desc> element alone does not count).",
    "a11ycore_svg_textAltPresent_summary_fail": "Missing text alternative for <svg>.",
    "a11ycore_svg_textAltPresent_hint_fail": "Provide a <title> element with text, or an ARIA name (aria-label/aria-labelledby) — a <desc> element alone does not provide an accessible name.",
    "a11ycore_object_textAltPresent_title": "<object> must provide a text alternative",
    "a11ycore_object_textAltPresent_description": "Checks that <object> elements provide a text alternative via fallback content or an accessible name.",
    "a11ycore_object_textAltPresent_summary_fail": "Missing text alternative for <object>.",
    "a11ycore_object_textAltPresent_hint_fail": "Provide meaningful fallback content inside <object>, or add an accessible name (aria-label/aria-labelledby).",
    "a11ycore_embed_textAltPresent_title": "<embed> must provide a text alternative",
    "a11ycore_embed_textAltPresent_description": "Checks that <embed> elements provide a text alternative via an accessible name.",
    "a11ycore_embed_textAltPresent_summary_fail": "Missing text alternative for <embed>.",
    "a11ycore_embed_textAltPresent_hint_fail": "Add an accessible name to <embed> (aria-label/aria-labelledby).",
    "a11ycore_img_altQuality_title": "<img> alt text must be appropriate (manual review)",
    "a11ycore_img_altQuality_description": "Flags <img> elements with non-empty alt text for human review of appropriateness.",
    "a11ycore_img_altQuality_summary_cantTell": "Review alt text on <img> for accuracy and appropriateness.",
    "a11ycore_img_altQuality_hint_cantTell": "Ensure the alt text conveys the image’s purpose/information in context (not redundant, not filename-like).",
    "a11ycore_img_altDecorative_title": "<img> with alt=\"\" must be decorative (manual review)",
    "a11ycore_img_altDecorative_description": "Flags <img> elements with empty alt for human review that they are purely decorative.",
    "a11ycore_img_altDecorative_summary_cantTell": "Review whether <img> is decorative (alt=\"\").",
    "a11ycore_img_altDecorative_hint_cantTell": "Confirm the image is purely decorative. If it conveys information or function, provide meaningful alt text.",
    "a11ycore_area_altQuality_title": "<area> alt text must be appropriate (manual review)",
    "a11ycore_area_altQuality_description": "Flags <area> elements with non-empty alt text for human review of appropriateness.",
    "a11ycore_area_altQuality_summary_cantTell": "Review alt text on <area> for accuracy and appropriateness.",
    "a11ycore_area_altQuality_hint_cantTell": "Ensure the alt text identifies the destination/action of the image map area in context.",
    "a11ycore_area_altDecorative_title": "<area> with alt=\"\" must be decorative (manual review)",
    "a11ycore_area_altDecorative_description": "Flags <area> elements with empty alt for human review that they are decorative/non-informative.",
    "a11ycore_area_altDecorative_summary_cantTell": "Review whether <area> is decorative (alt=\"\").",
    "a11ycore_area_altDecorative_hint_cantTell": "Confirm the area does not convey information or function. If it is interactive or meaningful, provide meaningful alt text.",
    "a11ycore_inputImage_altQuality_title": "<input type=\"image\"> alt text must be appropriate (manual review)",
    "a11ycore_inputImage_altQuality_description": "Flags <input type=\"image\"> elements with non-empty alt text for human review of appropriateness.",
    "a11ycore_inputImage_altQuality_summary_cantTell": "Review alt text on <input type=\"image\"> for accuracy and appropriateness.",
    "a11ycore_inputImage_altQuality_hint_cantTell": "Ensure the alt text describes the control’s action (e.g., “Search”, “Submit order”) in context.",
    "a11ycore_inputImage_altDecorative_title": "<input type=\"image\"> with alt=\"\" must be appropriate (manual review)",
    "a11ycore_inputImage_altDecorative_description": "Flags <input type=\"image\"> elements with empty alt for human review (usually not appropriate for functional controls).",
    "a11ycore_inputImage_altDecorative_summary_cantTell": "Review <input type=\"image\"> with alt=\"\".",
    "a11ycore_inputImage_altDecorative_hint_cantTell": "This control is typically functional. Confirm it has an equivalent accessible name elsewhere, or provide meaningful alt text.",
    "a11ycore_canvas_textAltQuality_title": "<canvas> text alternative must be appropriate (manual review)",
    "a11ycore_canvas_textAltQuality_description": "Flags <canvas> elements with a detected text alternative for human review of equivalence and appropriateness.",
    "a11ycore_canvas_textAltQuality_summary_cantTell": "Review text alternative for <canvas> for equivalence and appropriateness.",
    "a11ycore_canvas_textAltQuality_hint_cantTell": "Confirm the fallback text or accessible name conveys the same information/function as the canvas content.",
    "a11ycore_svg_textAltQuality_title": "<svg> text alternative must be appropriate (manual review)",
    "a11ycore_svg_textAltQuality_description": "Flags applicable <svg> graphics with a detected text alternative for human review of appropriateness.",
    "a11ycore_svg_textAltQuality_summary_cantTell": "Review text alternative for <svg> for accuracy and appropriateness.",
    "a11ycore_svg_textAltQuality_hint_cantTell": "Confirm the <title>/<desc> or ARIA name conveys the meaning/purpose of the graphic in context.",
    "a11ycore_object_textAltQuality_title": "<object> text alternative must be appropriate (manual review)",
    "a11ycore_object_textAltQuality_description": "Flags <object> elements with detected fallback or name for human review of equivalence and appropriateness.",
    "a11ycore_object_textAltQuality_summary_cantTell": "Review text alternative for <object> for equivalence and appropriateness.",
    "a11ycore_object_textAltQuality_hint_cantTell": "Confirm the fallback content or ARIA name provides an equivalent alternative for the embedded content.",
    "a11ycore_embed_textAltQuality_title": "<embed> text alternative must be appropriate (manual review)",
    "a11ycore_embed_textAltQuality_description": "Flags <embed> elements with a detected name for human review of appropriateness.",
    "a11ycore_embed_textAltQuality_summary_cantTell": "Review text alternative for <embed> for accuracy and appropriateness.",
    "a11ycore_embed_textAltQuality_hint_cantTell": "Confirm the ARIA name or title accurately identifies the embedded content in context.",
    "a11ycore_videoPoster_textAltPresent_title": "<video> poster must have a text alternative",
    "a11ycore_videoPoster_textAltPresent_description": "Checks that <video> elements with a poster image provide a text alternative (accessible name).",
    "a11ycore_videoPoster_textAltPresent_summary_fail": "Missing text alternative for <video> poster.",
    "a11ycore_videoPoster_textAltPresent_hint_fail": "Provide an accessible name (e.g., aria-label/aria-labelledby) for the poster image.",
    "a11ycore_svgImage_textAltPresent_title": "SVG <image> must have a text alternative",
    "a11ycore_svgImage_textAltPresent_description": "Checks that SVG <image> elements provide a text alternative via <title>/<desc> or an ARIA accessible name.",
    "a11ycore_svgImage_textAltPresent_summary_fail": "Missing text alternative on SVG <image>.",
    "a11ycore_svgImage_textAltPresent_hint_fail": "Add a <title> (and optionally <desc>) inside <image>, or provide aria-label/aria-labelledby.",
    "a11ycore_formControl_programmaticLabelPresent_title": "Form controls must have a programmatic label",
    "a11ycore_formControl_programmaticLabelPresent_description":
        "Checks that form controls have a programmatic label via <label>, aria-label, or aria-labelledby.",
    "a11ycore_formControl_programmaticLabelPresent_summary_fail": "Form control is missing a programmatic label.",
    "a11ycore_formControl_programmaticLabelPresent_hint_fail":
        "Provide a <label> association, aria-label, or aria-labelledby (placeholder/title do not count as labels).",


    'a11ycore_formControlAccessibleName_description': 'Fails when an applicable form control has no accessible name (e.g., label, aria-label, aria-labelledby).',
    'a11ycore_formControlAccessibleName_hint_fail': 'Provide an accessible name via a <label>, aria-label, or aria-labelledby.',
    'a11ycore_formControlAccessibleName_summary_fail': 'Form control has no accessible name.',
    'a11ycore_formControlAccessibleName_title': 'Form controls must have an accessible name',
    'a11ycore_linksTargetBlankNoopener_description': 'Ensures links with target="_blank" mitigate reverse tabnabbing risks.',
    'a11ycore_linksTargetBlankNoopener_hint_cantTell': 'See guidance for this rule.',
    'a11ycore_linksTargetBlankNoopener_summary_cantTell': 'Links that open in a new tab should use rel="noopener"',
    'a11ycore_linksTargetBlankNoopener_title': 'Links that open in a new tab should use rel="noopener"',
    'a11ycore_manualReview_description': 'Flags that a manual review of keyboard navigation and focus order is required.',
    'a11ycore_manualReview_hint_cantTell': 'See guidance for this rule.',
    'a11ycore_manualReview_summary_cantTell': 'Manual review: keyboard navigation and focus order',
    'a11ycore_manualReview_title': 'Manual review: keyboard navigation and focus order',
    "rules.a11ycore-img-alt-suspicious.meta.title":
        "Suspicious alt text requires verification",

    "rules.a11ycore-img-alt-suspicious.meta.description":
        "Identifies images whose alt text matches common suspicious patterns (such as filenames, URLs, placeholders, or generic terms) and requires manual verification.",

    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.summary":
        "Image alt text appears suspicious (\"{{alt}}\" looks like {{pattern}}) and requires verification.",

    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.hint":
        "Review the alt text. Avoid filenames, URLs, placeholders, or generic terms, and ensure the text alternative describes the image’s purpose or function in context.",
    "a11ycore_formControl_programmaticLabelQuality_title":
        "Form controls should not rely on placeholder or title as the primary label",
    "a11ycore_formControl_programmaticLabelQuality_description":
        "Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer <label> or aria-labelledby.",
    "a11ycore_formControl_programmaticLabelQuality_summary_cantTell":
        "Form control’s primary label is derived from {{methodLabel}}.",
    "a11ycore_formControl_programmaticLabelQuality_hint_cantTell":
        "Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.",

    "a11ycore_html_lang_attr_title": 'Page language is declared',
    "a11ycore_html_lang_attr_description": 'Checks that the default language of the page is programmatically declared.',

    "a11ycore_html_lang_attr_missing_absent":
        'The default language of the page is not declared.',
    "a11ycore_html_lang_attr_hint_missing_absent":
        'Add a lang attribute to the <html> element (for example: <html lang="en">).',

    "a11ycore_html_lang_attr_missing_empty":
        'The default language of the page is declared but empty.',
    "a11ycore_html_lang_attr_hint_missing_empty":
        'Set a valid language value in the lang attribute of the <html> element (for example: <html lang="en">).',

    "a11ycore_html_lang_attr_invalid":
        'The default language of the page is declared, but the value "{{lang}}" is not a valid language tag.',
    "a11ycore_html_lang_attr_hint_invalid":
        'Use a valid BCP 47 language tag in <html lang="…"> (for example: "en", "fr", "en-US").',
    "a11ycore_mediaTranscriptPresent_title":
        "Time-based media: transcript or text alternative evidence",

    "a11ycore_mediaTranscriptPresent_description":
        "Finds audio and video elements where a transcript or other text alternative is not strongly evidenced in the page content. This rule is conservative and reports cantTell when evidence is missing or cannot be verified.",

    "a11ycore_mediaTranscriptPresent_summary_cantTell_missing":
        "La présence d’une transcription ou d’une autre alternative textuelle pour cet élément {{element}} n’est pas clairement démontrée sur la page.",

    "a11ycore_mediaTranscriptPresent_hint_cantTell_missing":
        "Provide a clearly identified transcript or other text alternative for prerecorded audio-only or video-only media, for example a visible “Transcript” section or link.",

    "a11ycore_mediaTranscriptPresent_summary_cantTell_unverified":
        "A transcript or other text alternative may be available for this time-based media, but it could not be verified from the page content.",

    "a11ycore_mediaTranscriptPresent_hint_cantTell_unverified":
        "Ensure a clearly identified transcript or other text alternative is available and visibly or programmatically associated with the media on the page.",
    "a11ycore_pageTitlePresent_title": "Page has a non-empty title",
    "a11ycore_pageTitlePresent_description":
        "Checks that the page includes a non-empty <title> element that identifies the page.",

    "a11ycore_pageTitlePresent_summary_fail":
        "The page does not have a non-empty title.",
    "a11ycore_pageTitlePresent_hint_fail":
        "Add a <title> element with text that describes the page topic or purpose.",
    "a11ycore_pageTitlePatterns_title":
        "Page title patterns that may be insufficiently descriptive",
    "a11ycore_pageTitlePatterns_description":
        "Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.",

    "a11ycore_pageTitlePatterns_summary_cantTell":
        "The page title may not be descriptive enough to identify the page topic or purpose.",

    "a11ycore_pageTitlePresent_summary_fail_missing":
        "The page is missing a <title> element.",
    "a11ycore_pageTitlePresent_summary_fail_empty":
        "The page has an empty <title>.",

    "a11ycore_pageTitlePatterns_summary_cantTell_duplicateAcrossPages":
        "Several pages share the same title, which may make it harder to distinguish pages ({{duplicateGroups}} duplicate groups across {{pagesAnalyzed}} pages). Example: “{{exampleTitle}}”.",

    "a11ycore_pageTitlePatterns_summary_cantTell_templatedAcrossPages":
        "Many page titles appear highly templated, which may reduce how well titles distinguish pages ({{pagesAnalyzed}} pages).",

    "a11ycore_pageTitlePatterns_summary_cantTell_generic":
        "The page title is generic and may not identify the page topic or purpose.",

    "a11ycore_pageTitlePatterns_summary_cantTell_veryShort":
        "The page title is very short and may not identify the page topic or purpose.",

    "a11ycore_pageTitlePatterns_summary_cantTell_templateLike":
        "The page title appears templated and may not identify the page topic or purpose.",

    "a11ycore_pageTitlePatterns_hint_cantTell":
        "Review the page title and ensure it clearly identifies the page topic or purpose and helps distinguish the page from others.",

    // --- DOM Contrast: computability gatekeeper
    "a11ycore_contrastComputable_title": 'Color contrast is computable for rendered text',
    "a11ycore_contrastComputable_description":
        'Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).',

    "a11ycore_contrastComputable_pass_allComputable":
        'Contrast is computable for all eligible text ({{eligibleTextCount}} text node(s)).',

    "a11ycore_contrastComputable_cantTell_generic":
        'Contrast may not be computable ({{reasonCode}}).',

    "a11ycore_contrastComputable_cantTell_bgImageOrGradient":
        'Contrast is not computable because the background uses an image or gradient ({{blockerProperty}}={{blockerValue}}).',

    "a11ycore_contrastComputable_cantTell_bgImage":
        'Contrast is not computable because the background uses an image ({{blockerProperty}}={{blockerValue}}).',

    "a11ycore_contrastComputable_cantTell_bgGradient":
        'Contrast is not computable because the background uses a gradient ({{blockerProperty}}={{blockerValue}}).',

    "a11ycore_contrastComputable_cantTell_bgImageAndGradient":
        'Contrast is not computable because the background uses an image and a gradient ({{blockerProperty}}={{blockerValue}}).',

    "a11ycore_contrastComputable_cantTell_mixBlendMode":
        'Contrast is not computable because mix-blend-mode is used ({{blockerProperty}}={{blockerValue}}).',

    "a11ycore_contrastComputable_cantTell_filter":
        'Contrast is not computable because filter/backdrop-filter is used ({{blockerProperty}}={{blockerValue}}).',

    "a11ycore_contrastComputable_cantTell_rootNotOpaque":
        'Contrast is not computable because the effective background is not fully opaque at the root (alpha={{backgroundAlpha}}).',

    "a11ycore_contrastComputable_cantTell_foregroundUnparsable":
        'Contrast is not computable because the computed foreground color could not be parsed.',

    "a11ycore_contrastComputable_cantTell_engineFailure":
        'Contrast computability could not be determined due to an internal engine error ({{reasonCode}}).',

    "a11ycore_contrastComputable_cantTell_backdropFilter":
        'Contrast is not computable because backdrop-filter is used ({{blockerProperty}}={{blockerValue}}).',

    "a11ycore_contrastComputable_cantTell_filterOrBackdropFilter":
        'Contrast is not computable because filter is used ({{blockerProperty}}={{blockerValue}}).',

// --- DOM Contrast: AA minimum (1.4.3)
    "a11ycore_contrastMinimum_title": 'Text meets minimum color contrast (AA)',
    "a11ycore_contrastMinimum_description":
        'Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3.0:1 (large), when contrast is computable from CSS.',

    "a11ycore_contrastMinimum_fail_belowThreshold":
        'Element has insufficient color contrast of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).',

    "a11ycore_contrastMinimum_pass_allAboveThreshold":
        'All computable text meets minimum contrast (AA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.',

    "a11ycore_contrastMinimum_notApplicable_noComputableText":
        'No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.',

    "a11ycore_contrastMinimum_cantTell_engineFailure":
        'Minimum contrast (AA) could not be determined due to an internal engine error ({{reasonCode}}).',

// --- DOM Contrast: AAA enhanced (1.4.6)
    "a11ycore_contrastEnhanced_title": 'Text meets enhanced color contrast (AAA)',
    "a11ycore_contrastEnhanced_description":
        'Checks that visible text has a contrast ratio of at least 7.0:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.',

    "a11ycore_contrastEnhanced_fail_belowThreshold":
        'Element has insufficient color contrast (AAA) of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).',

    "a11ycore_contrastEnhanced_pass_allAboveThreshold":
        'All computable text meets enhanced contrast (AAA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.',

    "a11ycore_contrastEnhanced_notApplicable_noComputableText":
        'No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.',

    "a11ycore_contrastEnhanced_cantTell_engineFailure":
        'Enhanced contrast (AAA) could not be determined due to an internal engine error ({{reasonCode}}).',

// --- 1) Text contrast (Minimum) — WCAG 1.4.3 (AA)
    "a11ycore_dom_textContrastMinimum_title": "Text must have sufficient contrast (minimum)",
    "a11ycore_dom_textContrastMinimum_description": "Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.3 (AA), using rendered styles (font size/weight) to determine the required ratio.",

    "a11ycore_dom_textContrastMinimum_summary_fail":
        "Insufficient text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_hint_fail":
        "Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for this text size/weight.",

    "a11ycore_dom_textContrastMinimum_summary_pass":
        "Text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",

    "a11ycore_dom_textContrastMinimum_summary_cantTell":
        "Could not reliably compute text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).",
    "a11ycore_dom_textContrastMinimum_hint_cantTell":
        "Manually verify contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.",


    // --- 2) Text contrast (Enhanced) — WCAG 1.4.6 (AAA)
    "a11ycore_dom_textContrastEnhanced_title": "Text must have sufficient contrast (enhanced)",
    "a11ycore_dom_textContrastEnhanced_description": "Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.6 (AAA), using rendered styles (font size/weight) to determine the required ratio.",

    "a11ycore_dom_textContrastEnhanced_summary_fail":
        "Insufficient enhanced text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_hint_fail":
        "Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for enhanced (AAA) contrast.",

    "a11ycore_dom_textContrastEnhanced_summary_pass":
        "Enhanced text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",

    "a11ycore_dom_textContrastEnhanced_summary_cantTell":
        "Could not reliably compute enhanced text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).",
    "a11ycore_dom_textContrastEnhanced_hint_cantTell":
        "Manually verify enhanced (AAA) contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.",


    // --- 3) Non-text contrast — WCAG 1.4.11 (AA)
    "a11ycore_dom_nonTextContrast_title": "UI components and graphics must have sufficient contrast",
    "a11ycore_dom_nonTextContrast_description": "Checks contrast for non-text visual information (UI component boundaries, states, and meaningful graphical objects) per WCAG 2.2 SC 1.4.11 (AA).",

    "a11ycore_dom_nonTextContrast_summary_fail":
        "Insufficient non-text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_hint_fail":
        "Adjust the component/graphic colors so the contrast ratio is at least {{requiredRatio}}:1 for the perceivable boundary or essential visual information.",

    "a11ycore_dom_nonTextContrast_summary_pass":
        "Non-text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.",

    "a11ycore_dom_nonTextContrast_summary_cantTell":
        "Could not reliably compute non-text contrast because the effective background or painted pixels are not deterministically resolvable (e.g. image/gradient/video/canvas, complex transparency, or blending).",
    "a11ycore_dom_nonTextContrast_hint_cantTell":
        "Manually verify the component/graphic contrast against adjacent colors; ensure it meets {{requiredRatio}}:1 for essential non-text visual information.",
    "a11ycore_contrastEnhanced_pass_allTextMeetsThreshold": "All computable text meets enhanced contrast (AAA).",
    "a11ycore_contrastMinimum_pass_allTextMeetsThreshold": "All computable text meets minimum contrast (AA).",

    "a11ycore_contrastComputable_cantTell_notComputable":
        "Contrast could not be computed for this text ({{reasonCode}}).",

    // Title & description
    "a11ycore_roleImg_textAlternativePresent_title":
        '[role="img"] must have an accessible text alternative',

    "a11ycore_roleImg_textAlternativePresent_description":
        'Checks that elements with role="img" provide an accessible text alternative using aria-label, aria-labelledby, or a title attribute.',

    // Failure summary & hint
    "a11ycore_roleImg_textAlternativePresent_summary_fail":
        'The element with role="img" does not have an accessible text alternative.',

    "a11ycore_roleImg_textAlternativePresent_hint_fail":
        'Provide a text alternative using aria-label, or aria-labelledby that references non-empty text.',

    // --- Target Size (Minimum) — WCAG 2.5.8 (AA)
    "a11ycore_targetSizeMinimum_title": "Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets",
    "a11ycore_targetSizeMinimum_description": "Checks that pointer-operable targets have an effective hit region of at least 24 by 24 CSS pixels, or meet an allowed exception (e.g. sufficient spacing).",

    "a11ycore_targetSizeMinimum_summary_fail": "One or more pointer targets are smaller than 24×24 CSS px and are too close to another target.",
    "a11ycore_targetSizeMinimum_hint_fail": "Increase the target size to at least 24×24 CSS px or add sufficient spacing from neighboring targets.",

    "a11ycore_targetSizeMinimum_notApplicable_noTargets": "No pointer-operable targets were eligible for evaluation.",
    "a11ycore_targetSizeMinimum_pass_allOk": "All eligible pointer targets meet the minimum size or a permitted exception.",

// --- a11ycore-aria-hidden-focus
    "a11ycore_ariaHidden_focus_title": "ARIA hidden elements must not be focusable",
    "a11ycore_ariaHidden_focus_description":
        "Checks that aria-hidden=\"true\" elements are not focusable and do not contain focusable descendants.",

    "a11ycore_ariaHidden_focus_summary_fail_desc":
        "aria-hidden {{element}} contains {{focusableCount}} focusable element(s).",
    "a11ycore_ariaHidden_focus_summary_fail_self":
        "aria-hidden {{element}} is focusable ({{focusableCount}} focusable element(s)).",
    "a11ycore_ariaHidden_focus_summary_fail_self_and_desc":
        "aria-hidden {{element}} is focusable and contains {{descendantFocusableCount}} focusable descendant(s) ({{focusableCount}} focusable element(s) total).",

    "a11ycore_ariaHidden_focus_hint_fail":
        "Remove focusability from descendants or remove aria-hidden; ensure focus and accessibility trees stay aligned.",

// --- a11ycore-css-hidden-focus
    "a11ycore_cssHidden_focus_title": "Focusable elements must not be visually hidden",
    "a11ycore_cssHidden_focus_description":
        "Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.",

    "a11ycore_cssHidden_focus_summary_cantTell":
        "Focusable {{element}} is visually hidden ({{visibilityHints}}).",
    "a11ycore_cssHidden_focus_hint_cantTell":
        "Make the element visible when it can receive keyboard focus, or remove it from the tab order until it is visible.",

    "a11ycore_linkNamePresent_title": "Links have an accessible name",
    "a11ycore_linkNamePresent_description": "Checks that links expose a non-empty accessible name.",
    "a11ycore_linkNamePresent_summary_fail": "This link has no accessible name.",
    "a11ycore_linkNamePresent_hint_fail": "Provide link text or an accessible-name mechanism (for example aria-label) so assistive technologies can identify the link.",
    "a11ycore_buttonNamePresent_title": "Buttons have an accessible name",
    "a11ycore_buttonNamePresent_description": "Checks that buttons expose a non-empty accessible name.",
    "a11ycore_buttonNamePresent_summary_fail": "This button has no accessible name.",
    "a11ycore_buttonNamePresent_hint_fail": "Provide visible button text or a programmatic accessible-name mechanism (for example aria-label) so assistive technologies can identify the button.",

    "a11ycore_binaryControlNamePresent_title": "Binary controls have an accessible name",
    "a11ycore_binaryControlNamePresent_description": "Checks that checkbox, radio, and switch controls expose a non-empty accessible name.",
    "a11ycore_binaryControlNamePresent_summary_fail": "This control has no accessible name.",
    "a11ycore_binaryControlNamePresent_hint_fail": "Provide a label, aria-label, aria-labelledby, or other accessible-name mechanism so assistive technologies can identify the control.",
    "a11ycore_comboboxNamePresent_title": "Comboboxes have an accessible name",
    "a11ycore_comboboxNamePresent_description": "Checks that elements with role=\"combobox\" expose a non-empty accessible name.",
    "a11ycore_comboboxNamePresent_summary_fail": "This combobox has no accessible name.",
    "a11ycore_comboboxNamePresent_hint_fail": "Provide aria-label or aria-labelledby (preferred), or ensure the element has visible text that is not hidden from assistive technologies.",
    "a11ycore_dialogNamePresent_title": "Dialogs have an accessible name",
    "a11ycore_dialogNamePresent_description": "Checks that elements with role=\"dialog\" or role=\"alertdialog\" expose a non-empty accessible name.",
    "a11ycore_dialogNamePresent_summary_fail": "This dialog has no accessible name.",
    "a11ycore_dialogNamePresent_hint_fail": "Provide aria-labelledby (preferred) or aria-label so assistive technologies can announce the dialog.",
    "a11ycore_menuitemNamePresent_title": "Menu items have an accessible name",
    "a11ycore_menuitemNamePresent_description": "Checks that menu items (role=\"menuitem*\", including checkbox/radio variants) expose a non-empty accessible name.",
    "a11ycore_menuitemNamePresent_summary_fail": "This menu item has no accessible name.",
    "a11ycore_menuitemNamePresent_hint_fail": "Provide visible text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",
    "a11ycore_tabNamePresent_title": "Tabs have an accessible name",
    "a11ycore_tabNamePresent_description": "Checks that elements with role=\"tab\" expose a non-empty accessible name.",
    "a11ycore_tabNamePresent_summary_fail": "This tab has no accessible name.",
    "a11ycore_tabNamePresent_hint_fail": "Provide tab text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",
    "a11ycore_sliderNamePresent_title": "Sliders have an accessible name",
    "a11ycore_sliderNamePresent_description": "Checks that sliders (input[type=\"range\"] and role=\"slider\") expose a non-empty accessible name.",
    "a11ycore_sliderNamePresent_summary_fail": "This slider has no accessible name.",
    "a11ycore_sliderNamePresent_hint_fail": "Provide a label, aria-label, or aria-labelledby so assistive technologies can identify the slider.",
    "a11ycore_textboxNamePresent_title": "Textboxes have an accessible name",
    "a11ycore_textboxNamePresent_description": "Checks that elements with role=\"textbox\" expose a non-empty accessible name.",
    "a11ycore_textboxNamePresent_summary_fail": "This textbox has no accessible name.",
    "a11ycore_textboxNamePresent_hint_fail": "Provide aria-label or aria-labelledby (preferred), or ensure the textbox has visible text that is not hidden from assistive technologies.",
    "a11ycore_searchboxNamePresent_title": "Searchboxes have an accessible name",
    "a11ycore_searchboxNamePresent_description": "Checks that elements with role=\"searchbox\" expose a non-empty accessible name.",
    "a11ycore_searchboxNamePresent_summary_fail": "This searchbox has no accessible name.",
    "a11ycore_searchboxNamePresent_hint_fail": "Provide aria-label or aria-labelledby (preferred), or ensure the searchbox has visible text that is not hidden from assistive technologies.",
    "a11ycore_spinbuttonNamePresent_title": "Spinbuttons have an accessible name",
    "a11ycore_spinbuttonNamePresent_description": "Checks that elements with role=\"spinbutton\" expose a non-empty accessible name.",
    "a11ycore_spinbuttonNamePresent_summary_fail": "This spinbutton has no accessible name.",
    "a11ycore_spinbuttonNamePresent_hint_fail": "Provide aria-label or aria-labelledby (preferred), or ensure the spinbutton has visible text that is not hidden from assistive technologies.",
    "a11ycore_listboxNamePresent_title": "Listboxes have an accessible name",
    "a11ycore_listboxNamePresent_description": "Checks that elements with role=\"listbox\" expose a non-empty accessible name.",
    "a11ycore_listboxNamePresent_summary_fail": "This listbox has no accessible name.",
    "a11ycore_listboxNamePresent_hint_fail": "Provide aria-label or aria-labelledby (preferred), or ensure the listbox has visible text that is not hidden from assistive technologies.",
    "a11ycore_optionNamePresent_title": "Options have an accessible name",
    "a11ycore_optionNamePresent_description": "Checks that elements with role=\"option\" expose a non-empty accessible name.",
    "a11ycore_optionNamePresent_summary_fail": "This option has no accessible name.",
    "a11ycore_optionNamePresent_hint_fail": "Provide option text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",
    "a11ycore_treeitemNamePresent_title": "Tree items have an accessible name",
    "a11ycore_treeitemNamePresent_description": "Checks that elements with role=\"treeitem\" expose a non-empty accessible name.",
    "a11ycore_treeitemNamePresent_summary_fail": "This tree item has no accessible name.",
    "a11ycore_treeitemNamePresent_hint_fail": "Provide tree item text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",
    "a11ycore_ariaRoleNamePresent_title": "ARIA widget/container roles have an accessible name",
    "a11ycore_ariaRoleNamePresent_description": "Checks that selected ARIA widget/container roles expose a non-empty accessible name.",
    "a11ycore_ariaRoleNamePresent_summary_fail": "This element has no accessible name.",
    "a11ycore_ariaRoleNamePresent_hint_fail": "Provide aria-label or aria-labelledby (preferred), or a non-empty title attribute.",

    /* =========================
     * Composite rule summaries
     * ========================= */
    "a11ycore_composite_rollup_summary":
    "Composite rule result: {{reasonCode}} ({{testCount}} checks)",

        /* =========================
         * WCAG 1.1.1 – Non-text content
         * ========================= */
        "catalog.rules.wcag_111_non_text_content.title":
    "Non-text content: text alternatives",
        "catalog.rules.wcag_111_non_text_content.description":
    "Rollup of checks ensuring non-text content has an appropriate text alternative.",

        /* =========================
         * WCAG 1.2.1 – Audio-only / Video-only
         * ========================= */
        "catalog.rules.wcag_121_prerecorded_transcript.title":
    "Audio-only and video-only (prerecorded): transcript",
        "catalog.rules.wcag_121_prerecorded_transcript.description":
    "Rollup of checks for transcript availability for prerecorded audio-only or video-only media.",

        /* =========================
         * WCAG 1.4.3 – Contrast (Minimum)
         * ========================= */
        "catalog.rules.wcag_143_contrast_minimum.title":
    "Contrast: minimum",
        "catalog.rules.wcag_143_contrast_minimum.description":
    "Rollup of checks for minimum text contrast.",

        /* =========================
         * WCAG 1.4.6 – Contrast (Enhanced)
         * ========================= */
        "catalog.rules.wcag_146_contrast_enhanced.title":
    "Contrast: enhanced",
        "catalog.rules.wcag_146_contrast_enhanced.description":
    "Rollup of checks for enhanced text contrast.",

        /* =========================
         * WCAG 2.4.2 – Page titled
         * ========================= */
        "catalog.rules.wcag_242_page_titled.title":
    "Page titled",
        "catalog.rules.wcag_242_page_titled.description":
    "Rollup of checks ensuring documents have a meaningful page title.",

        /* =========================
         * WCAG 2.4.7 – Focus visible
         * ========================= */
        "catalog.rules.wcag_247_focus_visible.title":
    "Focus visible",
        "catalog.rules.wcag_247_focus_visible.description":
    "Rollup of checks ensuring keyboard focus is not hidden and remains perceivable.",

        /* =========================
         * WCAG 2.5.8 – Target size (Minimum)
         * ========================= */
        "catalog.rules.wcag_258_target_size_minimum.title":
    "Target size: minimum",
        "catalog.rules.wcag_258_target_size_minimum.description":
    "Rollup of checks ensuring pointer targets meet minimum size requirements.",

        /* =========================
         * WCAG 3.1.1 – Language of page
         * ========================= */
        "catalog.rules.wcag_311_language_of_page.title":
    "Language of page",
        "catalog.rules.wcag_311_language_of_page.description":
    "Rollup of checks ensuring the page language is specified.",

        /* =========================
         * WCAG 4.1.2 – Name, role, value
         * ========================= */
        "catalog.rules.wcag_412_name.title":
    "Name, role, value: accessible name",
        "catalog.rules.wcag_412_name.description":
    "Rollup of checks that common interactive elements expose a non-empty accessible name.",
    "a11ycore_labelInName_title": "Label in Name: accessible name contains visible text",
    "a11ycore_labelInName_description": "Checks that when a control has a visible text label, the accessible name contains that visible label text (WCAG 2.5.3).",
    "a11ycore_labelInName_summary_fail":  "{{element}}: visible label \"{{visibleLabel}}\" (from {{labelSource}}) is not included in the accessible name (from {{nameMechanism}}).",
    "a11ycore_labelInName_hint_fail": "Update aria-label/aria-labelledby (or the visible label text) so the accessible name includes the visible label wording.",

    /* =========================
     * ARIA validity family
     * ========================= */
    "a11ycore_ariaRolesValid_title": "role attribute must be a valid, non-abstract ARIA role",
    "a11ycore_ariaRolesValid_description": "Checks that an explicit role=\"\" attribute resolves to a real, non-abstract WAI-ARIA role.",
    "a11ycore_ariaRolesValid_summary_invalid": "role=\"{{role}}\" is not a recognized ARIA role.",
    "a11ycore_ariaRolesValid_hint_invalid": "Use a valid ARIA role token, or remove the role attribute if none applies.",
    "a11ycore_ariaRolesValid_summary_abstract": "role=\"{{role}}\" is an abstract ARIA role, which must not be used directly.",
    "a11ycore_ariaRolesValid_hint_abstract": "Replace this abstract role with a concrete role appropriate for the widget/structure.",

    "a11ycore_ariaDeprecatedRole_title": "role attribute must not use a deprecated or author-prohibited ARIA role",
    "a11ycore_ariaDeprecatedRole_description": "Checks that an explicit role=\"\" attribute does not use a role deprecated by the WAI-ARIA specification, or one reserved for user-agent-internal use only (e.g. role=\"generic\").",
    "a11ycore_ariaDeprecatedRole_summary_fail": "This element uses role=\"{{role}}\", which authors must not explicitly declare.",
    "a11ycore_ariaDeprecatedRole_hint_fail": "{{guidance}}",

    "a11ycore_ariaValidAttr_title": "aria-* attributes must be real, defined ARIA attributes",
    "a11ycore_ariaValidAttr_description": "Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.",
    "a11ycore_ariaValidAttr_summary_fail": "{{attr}} is not a recognized ARIA attribute.",
    "a11ycore_ariaValidAttr_hint_fail": "Correct the attribute name (check for typos), or remove it if not needed.",

    "a11ycore_ariaValidAttrValue_title": "aria-* attribute values must match their declared type",
    "a11ycore_ariaValidAttrValue_description": "Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).",
    "a11ycore_ariaValidAttrValue_summary_fail": "{{attr}}=\"{{value}}\" is not a valid value for this attribute.",
    "a11ycore_ariaValidAttrValue_hint_fail": "Use a value that matches the attribute’s expected type (see the WAI-ARIA specification for this attribute).",

    "a11ycore_ariaAllowedAttr_title": "aria-* attributes must be permitted for the element’s role",
    "a11ycore_ariaAllowedAttr_description": "Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.",
    "a11ycore_ariaAllowedAttr_summary_fail": "{{attr}} is not permitted on role=\"{{role}}\".",
    "a11ycore_ariaAllowedAttr_hint_fail": "Remove this attribute, or use a role that supports it.",

    "a11ycore_ariaProhibitedAttr_title": "ARIA naming attributes must not be used on roles that prohibit them",
    "a11ycore_ariaProhibitedAttr_description": "Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).",
    "a11ycore_ariaProhibitedAttr_summary_fail": "{{attr}} is prohibited on role=\"{{role}}\".",
    "a11ycore_ariaProhibitedAttr_hint_fail": "Remove this attribute; this role must not carry an accessible name.",

    "a11ycore_ariaRequiredAttr_title": "Roles with a required ARIA state/property must carry it",
    "a11ycore_ariaRequiredAttr_description": "Checks that elements with an explicit role carry every unambiguous, context-independent required aria-* state/property for that role (e.g. role=\"checkbox\" must have aria-checked).",
    "a11ycore_ariaRequiredAttr_summary_fail": "{{attr}} is required for role=\"{{role}}\", but is missing.",
    "a11ycore_ariaRequiredAttr_hint_fail": "Add this attribute with a valid value for this role.",

    "a11ycore_ariaAllowedRole_title": "Explicit role must be permitted for its host element",
    "a11ycore_ariaAllowedRole_description": "Checks that an explicit role=\"\" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role=\"tab\" is not permitted on <nav>).",
    "a11ycore_ariaAllowedRole_summary_fail": "role=\"{{role}}\" is not permitted on <{{element}}>.",
    "a11ycore_ariaAllowedRole_hint_fail": "Use a role permitted for this element, or change the host element.",

    "a11ycore_ariaRequiredChildren_title": "Container roles must own at least one required child role",
    "a11ycore_ariaRequiredChildren_description": "Checks that container roles with a documented \"required owned elements\" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.",
    "a11ycore_ariaRequiredChildren_summary_fail": "role=\"{{role}}\" has no owned child with one of the required roles: {{requiredRoles}}.",
    "a11ycore_ariaRequiredChildren_hint_fail": "Add a descendant (or aria-owns-referenced element) with one of the required owned roles.",

    "a11ycore_ariaProhibitedChildren_title": "Container roles must not own a child with a disallowed role",
    "a11ycore_ariaProhibitedChildren_description": "Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles.",
    "a11ycore_ariaProhibitedChildren_summary_fail": "This element has role=\"{{childRole}}\", which is not an allowed owned child of the enclosing role=\"{{containerRole}}\" container.",
    "a11ycore_ariaProhibitedChildren_hint_fail": "Remove or change this role so it matches one of the container's allowed owned roles ({{allowedRoles}}), or move this element outside the {{containerRole}} container.",
    "a11ycore_ariaProhibitedChildren_summary_fail_roleless": "This element has no explicit role but carries {{attr}}, making it a real accessible-tree node that is not an allowed owned child of the enclosing role=\"{{containerRole}}\" container.",
    "a11ycore_ariaProhibitedChildren_hint_fail_roleless": "Remove {{attr}} (or the role=\"{{containerRole}}\" container ownership), or give this element role=\"presentation\"/\"none\" if it isn't meant to be its own accessible-tree node.",

    "a11ycore_ariaRequiredParent_title": "Roles requiring a specific context role must be in that context",
    "a11ycore_ariaRequiredParent_description": "Checks that roles with a documented \"required context role\" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.",
    "a11ycore_ariaRequiredParent_summary_fail": "role=\"{{role}}\" requires a context role of one of: {{requiredRoles}}, which was not found.",
    "a11ycore_ariaRequiredParent_hint_fail": "Place this element inside (or aria-owns-reference it from) an element with an acceptable context role.",

    "a11ycore_deprecatedElements_title": "Obsolete non-stoppable elements (<blink>, <marquee>) must not be used",
    "a11ycore_deprecatedElements_description": "Checks that deprecated, non-standard HTML elements whose blinking/scrolling content cannot be paused, stopped, or hidden by the user (<blink>, <marquee>) are not present.",
    "a11ycore_deprecatedElements_summary_fail": "<{{element}}> content cannot be paused, stopped, or hidden by the user.",
    "a11ycore_deprecatedElements_hint_fail": "Remove this element; use static content, or an animation with a user-facing pause/stop control, instead.",

    "a11ycore_iframeNamePresent_title": "Frames have an accessible name",
    "a11ycore_iframeNamePresent_description": "Checks that <iframe>/<frame> elements expose a non-empty accessible name via aria-label, aria-labelledby, or the title attribute.",
    "a11ycore_iframeNamePresent_summary_fail": "This <{{element}}> has no accessible name.",
    "a11ycore_iframeNamePresent_hint_fail": "Add a title attribute (or aria-label/aria-labelledby) describing the frame’s content or purpose.",

    "a11ycore_iframeTitleUnique_title": "Frame titles must be unique",
    "a11ycore_iframeTitleUnique_description": "Checks that no two <iframe>/<frame> elements in scope share the same title attribute value.",
    "a11ycore_iframeTitleUnique_summary_fail": "This <{{element}}>'s title \"{{title}}\" is not unique among the frames on this page.",
    "a11ycore_iframeTitleUnique_hint_fail": "Give each frame a distinct title describing its specific content or purpose.",

    "a11ycore_iframeFocusableContent_title": "Frames with tabindex=\"-1\" must not contain focusable content",
    "a11ycore_iframeFocusableContent_description": "Checks that same-origin <iframe>/<frame> elements with tabindex=\"-1\" do not contain focusable content, since browsers do not propagate that restriction into the frame’s embedded document.",
    "a11ycore_iframeFocusableContent_summary_fail": "This <{{element}}> has tabindex=\"-1\" but its content contains focusable elements, which remain reachable by keyboard.",
    "a11ycore_iframeFocusableContent_hint_fail": "Remove focusable content from the frame, or remove tabindex=\"-1\" if the frame is meant to be reachable.",

    "a11ycore_tableHeadersAttrValid_title": "Table cell \"headers\" attribute must reference valid header cells",
    "a11ycore_tableHeadersAttrValid_description": "Checks that each id in a <td>/<th> headers attribute resolves to a <th> element within the same table (not missing, not a non-th element, not itself).",
    "a11ycore_tableHeadersAttrValid_summary_fail": "This <{{element}}>'s headers attribute references invalid header cell(s): {{invalidIds}}.",
    "a11ycore_tableHeadersAttrValid_hint_fail": "Update the headers attribute so every id refers to a <th> element within the same table.",

    "a11ycore_tableThHasDataCells_title": "<th> elements must describe at least one data cell",
    "a11ycore_tableThHasDataCells_description": "Checks that a table containing <th> elements also contains at least one <td> data cell for those headers to describe.",
    "a11ycore_tableThHasDataCells_summary_fail": "This table has header cells but no data cells for them to describe.",
    "a11ycore_tableThHasDataCells_hint_fail": "Add data cells (<td>) to the table, or remove the header cells if the table has no data.",

    "a11ycore_ariaHiddenBody_title": "The document <body> must not be aria-hidden",
    "a11ycore_ariaHiddenBody_description": "Checks that <body> does not have aria-hidden=\"true\", which would remove the entire page from the accessibility tree.",
    "a11ycore_ariaHiddenBody_summary_fail": "The document body has aria-hidden=\"true\", which hides the entire page from assistive technologies.",
    "a11ycore_ariaHiddenBody_hint_fail": "Remove aria-hidden from <body>. Hide specific elements instead, if that was the intent.",

    "a11ycore_listChildrenValid_title": "Lists must only directly contain list items",
    "a11ycore_listChildrenValid_description": "Checks that <ul>/<ol> elements only have <li>, <script>, or <template> as direct children.",
    "a11ycore_listChildrenValid_summary_fail": "This <{{element}}> contains a direct child that is not a list item: {{invalidChildren}}.",
    "a11ycore_listChildrenValid_hint_fail": "Only use <li> (or <script>/<template>) as direct children of <ul>/<ol>; move other markup inside an <li>.",

    "a11ycore_listitemParentValid_title": "List items must be inside a list container",
    "a11ycore_listitemParentValid_description": "Checks that <li> elements are contained by <ul>, <ol>, or an element with role=\"list\".",
    "a11ycore_listitemParentValid_summary_fail": "This list item's parent (<{{parentElement}}>) is not a list container.",
    "a11ycore_listitemParentValid_hint_fail": "Place this <li> inside a <ul>/<ol>, or give its parent role=\"list\".",

    "a11ycore_definitionListChildrenValid_title": "Description lists must be structured correctly",
    "a11ycore_definitionListChildrenValid_description": "Checks that <dl> elements only directly contain <dt>/<dd> groups (optionally wrapped in one <div>), <script>, <template>, or <style>.",
    "a11ycore_definitionListChildrenValid_summary_fail_invalidChild": "This description list contains a direct or wrapped child that is not part of a dt/dd group: {{invalidChildren}}.",
    "a11ycore_definitionListChildrenValid_hint_fail_invalidChild": "Only use <dt>/<dd> (optionally wrapped in one <div>), <script>, <template>, or <style> inside <dl>.",
    "a11ycore_definitionListChildrenValid_summary_fail_noDtDd": "This description list has no <dt>/<dd> term-definition group.",
    "a11ycore_definitionListChildrenValid_hint_fail_noDtDd": "Add at least one <dt>/<dd> pair inside this <dl>.",

    "a11ycore_dlitemParentValid_title": "Description-list items must be inside a description list",
    "a11ycore_dlitemParentValid_description": "Checks that <dt>/<dd> elements are contained by a <dl>, directly or via one wrapping <div>.",
    "a11ycore_dlitemParentValid_summary_fail": "This <{{element}}>'s parent (<{{parentElement}}>) is not a description list.",
    "a11ycore_dlitemParentValid_hint_fail": "Place this <dt>/<dd> inside a <dl>, directly or wrapped in a single <div>.",

    "a11ycore_duplicateIdAria_title": "IDs referenced by ARIA must be unique",
    "a11ycore_duplicateIdAria_description": "Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.",
    "a11ycore_duplicateIdAria_summary_fail": "The id \"{{id}}\" is referenced by an ARIA attribute but is used by {{duplicateCount}} elements.",
    "a11ycore_duplicateIdAria_hint_fail": "Make ids referenced by ARIA attributes unique within the document.",

    "a11ycore_summaryNamePresent_title": "Summary elements have an accessible name",
    "a11ycore_summaryNamePresent_description": "Checks that <summary> elements expose a non-empty accessible name.",
    "a11ycore_summaryNamePresent_summary_fail": "This summary has no accessible name.",
    "a11ycore_summaryNamePresent_hint_fail": "Provide summary text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",

    "a11ycore_metaViewportZoomEnabled_title": "Viewport meta tag must not disable zoom",
    "a11ycore_metaViewportZoomEnabled_description": "Checks that <meta name=\"viewport\"> does not set user-scalable=no or maximum-scale below 2 (200%).",
    "a11ycore_metaViewportZoomEnabled_summary_fail": "This viewport meta tag restricts the user's ability to zoom ({{reasons}}).",
    "a11ycore_metaViewportZoomEnabled_hint_fail": "Remove user-scalable=no and any maximum-scale below 2 from the viewport meta content.",

    "a11ycore_metaRefreshTimingAbsent_title": "Page must not use a timed meta refresh",
    "a11ycore_metaRefreshTimingAbsent_description": "Checks that <meta http-equiv=\"refresh\"> does not impose a positive delay of 20 hours or less.",
    "a11ycore_metaRefreshTimingAbsent_summary_fail": "This page refreshes itself automatically after {{delay}} seconds.",
    "a11ycore_metaRefreshTimingAbsent_hint_fail": "Remove the timed meta refresh, or provide a way for users to turn it off, extend it, or pause it before it triggers.",

    "a11ycore_meterNamePresent_title": "Meters have an accessible name",
    "a11ycore_meterNamePresent_description": "Checks that elements with role=\"meter\" expose a non-empty accessible name.",
    "a11ycore_meterNamePresent_summary_fail": "This meter has no accessible name.",
    "a11ycore_meterNamePresent_hint_fail": "Provide meter text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",

    "a11ycore_progressbarNamePresent_title": "Progress bars have an accessible name",
    "a11ycore_progressbarNamePresent_description": "Checks that elements with role=\"progressbar\" expose a non-empty accessible name.",
    "a11ycore_progressbarNamePresent_summary_fail": "This progress bar has no accessible name.",
    "a11ycore_progressbarNamePresent_hint_fail": "Provide progress bar text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",

    "a11ycore_tooltipNamePresent_title": "Tooltips have an accessible name",
    "a11ycore_tooltipNamePresent_description": "Checks that elements with role=\"tooltip\" expose a non-empty accessible name.",
    "a11ycore_tooltipNamePresent_summary_fail": "This tooltip has no accessible name.",
    "a11ycore_tooltipNamePresent_hint_fail": "Provide tooltip text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.",

    "a11ycore_serverSideImageMapAbsent_title": "Images must not use a server-side image map",
    "a11ycore_serverSideImageMapAbsent_description": "Checks that <img> elements do not carry the ismap attribute (server-side image maps have no keyboard-operable equivalent).",
    "a11ycore_serverSideImageMapAbsent_summary_fail": "This image uses a server-side image map, which has no keyboard-operable equivalent.",
    "a11ycore_serverSideImageMapAbsent_hint_fail": "Replace the server-side image map (ismap) with a client-side image map (<map>/<area>) or separate accessible links/buttons.",

    "a11ycore_formControlSingleLabel_title": "Form controls must not have multiple labels",
    "a11ycore_formControlSingleLabel_description": "Checks that a form control is associated with at most one <label> (by wrapping or by label[for]).",
    "a11ycore_formControlSingleLabel_summary_fail": "This <{{element}}> is associated with {{labelCount}} labels.",
    "a11ycore_formControlSingleLabel_hint_fail": "Keep only one <label> per form control (either wrapping it or referencing it via for/id).",

    "a11ycore_nestedInteractiveControlsAbsent_title": "Interactive controls must not be nested",
    "a11ycore_nestedInteractiveControlsAbsent_description": "Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.",
    "a11ycore_nestedInteractiveControlsAbsent_summary_fail": "This <{{element}}> contains one or more nested interactive controls: {{nestedElements}}.",
    "a11ycore_nestedInteractiveControlsAbsent_hint_fail": "Move the nested interactive control(s) outside this element; nested interactive controls are not reliably operable via assistive technology.",

    "a11ycore_bypassBlocksPresent_title": "Page must provide a way to bypass repeated blocks",
    "a11ycore_bypassBlocksPresent_description": "Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working same-page anchor link, or a heading.",
    "a11ycore_bypassBlocksPresent_summary_fail": "This page has no recognized way to bypass repeated blocks of content.",
    "a11ycore_bypassBlocksPresent_hint_fail": "Add a main landmark (<main> or role=\"main\"), a working \"skip to content\" link, or heading elements that assistive technology can use to jump past repeated content.",

    "a11ycore_landmarkBannerIsTopLevel_title": "Banner landmark must be top-level",
    "a11ycore_landmarkBannerIsTopLevel_description": "Checks that the banner landmark (role=\"banner\" or a non-nested <header>) is not nested inside another landmark region.",
    "a11ycore_landmarkBannerIsTopLevel_summary_cantTell": "This banner landmark is nested inside another landmark region.",
    "a11ycore_landmarkBannerIsTopLevel_hint_cantTell": "Move the banner landmark (header/role=\"banner\") so it is not contained by another landmark; a banner should be a top-level region of the page.",

    "a11ycore_landmarkContentinfoIsTopLevel_title": "Contentinfo landmark must be top-level",
    "a11ycore_landmarkContentinfoIsTopLevel_description": "Checks that the contentinfo landmark (role=\"contentinfo\" or a non-nested <footer>) is not nested inside another landmark region.",
    "a11ycore_landmarkContentinfoIsTopLevel_summary_cantTell": "This contentinfo landmark is nested inside another landmark region.",
    "a11ycore_landmarkContentinfoIsTopLevel_hint_cantTell": "Move the contentinfo landmark (footer/role=\"contentinfo\") so it is not contained by another landmark; contentinfo should be a top-level region of the page.",

    "a11ycore_landmarkMainIsTopLevel_title": "Main landmark must be top-level",
    "a11ycore_landmarkMainIsTopLevel_description": "Checks that the main landmark (role=\"main\" or <main>) is not nested inside another landmark region.",
    "a11ycore_landmarkMainIsTopLevel_summary_cantTell": "This main landmark is nested inside another landmark region.",
    "a11ycore_landmarkMainIsTopLevel_hint_cantTell": "Move the main landmark (<main>/role=\"main\") so it is not contained by another landmark; main should be a top-level region of the page.",

    "a11ycore_landmarkNoDuplicateBanner_title": "Page must not have more than one banner landmark",
    "a11ycore_landmarkNoDuplicateBanner_description": "Checks that at most one banner landmark (role=\"banner\" or a non-nested <header>) exists on the page.",
    "a11ycore_landmarkNoDuplicateBanner_summary_cantTell": "This page has more than one banner landmark.",
    "a11ycore_landmarkNoDuplicateBanner_hint_cantTell": "Keep only one banner landmark (header/role=\"banner\") per page.",

    "a11ycore_landmarkNoDuplicateContentinfo_title": "Page must not have more than one contentinfo landmark",
    "a11ycore_landmarkNoDuplicateContentinfo_description": "Checks that at most one contentinfo landmark (role=\"contentinfo\" or a non-nested <footer>) exists on the page.",
    "a11ycore_landmarkNoDuplicateContentinfo_summary_cantTell": "This page has more than one contentinfo landmark.",
    "a11ycore_landmarkNoDuplicateContentinfo_hint_cantTell": "Keep only one contentinfo landmark (footer/role=\"contentinfo\") per page.",

    "a11ycore_landmarkNoDuplicateMain_title": "Page must not have more than one main landmark",
    "a11ycore_landmarkNoDuplicateMain_description": "Checks that at most one main landmark (role=\"main\" or <main>) exists on the page.",
    "a11ycore_landmarkNoDuplicateMain_summary_cantTell": "This page has more than one main landmark.",
    "a11ycore_landmarkNoDuplicateMain_hint_cantTell": "Keep only one main landmark (<main>/role=\"main\") per page.",

    "a11ycore_landmarkOneMain_title": "Page should have a main landmark",
    "a11ycore_landmarkOneMain_description": "Checks that the page has at least one main landmark (role=\"main\" or <main>).",
    "a11ycore_landmarkOneMain_summary_cantTell_missing": "This page has no main landmark.",
    "a11ycore_landmarkOneMain_hint_cantTell_missing": "Add a main landmark (<main> or role=\"main\") around the page's primary content.",

    "a11ycore_landmarkUnique_title": "Landmarks with the same role must have unique names",
    "a11ycore_landmarkUnique_description": "Checks that when two or more landmarks share the same role, each has a distinct accessible name.",
    "a11ycore_landmarkUnique_summary_cantTell_duplicateName": "This {{role}} landmark shares its accessible name with another {{role}} landmark.",
    "a11ycore_landmarkUnique_summary_cantTell_bothUnnamed": "This {{role}} landmark has no accessible name, and more than one unnamed {{role}} landmark exists on this page.",
    "a11ycore_landmarkUnique_hint_cantTell": "Give each {{role}} landmark a distinct name via aria-label or aria-labelledby.",

    "a11ycore_emptyHeading_title": "Headings must not be empty",
    "a11ycore_emptyHeading_description": "Checks that heading elements (<h1>-<h6> or role=\"heading\") have a non-empty accessible name.",
    "a11ycore_emptyHeading_summary_cantTell": "This heading has no accessible name.",
    "a11ycore_emptyHeading_hint_cantTell": "Add text content (or aria-label/aria-labelledby) to this heading, or remove it if it is not needed.",

    "a11ycore_headingOrder_title": "Heading levels must not skip a level",
    "a11ycore_headingOrder_description": "Checks that heading levels increase by at most one at a time in document order.",
    "a11ycore_headingOrder_summary_cantTell": "This heading jumps from level {{fromLevel}} to level {{toLevel}}, skipping a level.",
    "a11ycore_headingOrder_hint_cantTell": "Use consecutive heading levels (do not skip a level when going deeper) so the document outline stays predictable.",

    "a11ycore_pageHasHeadingOne_title": "Page should have a level-one heading",
    "a11ycore_pageHasHeadingOne_description": "Checks that the page has at least one level-one heading (<h1> or role=\"heading\" with aria-level=\"1\").",
    "a11ycore_pageHasHeadingOne_summary_cantTell": "This page has no level-one heading.",
    "a11ycore_pageHasHeadingOne_hint_cantTell": "Add a level-one heading (<h1> or role=\"heading\" aria-level=\"1\") that identifies the page's main content.",

    "a11ycore_accesskeys_title": "accesskey values must be unique",
    "a11ycore_accesskeys_description": "Checks that no two elements on the page share the same accesskey attribute value.",
    "a11ycore_accesskeys_summary_cantTell": "This element's accesskey is shared with another element on the page.",
    "a11ycore_accesskeys_hint_cantTell": "Make each accesskey value unique across the page.",

    "a11ycore_scopeAttrValid_title": "scope attribute must have a valid value",
    "a11ycore_scopeAttrValid_description": "Checks that scope=\"...\" is one of row, col, rowgroup, or colgroup.",
    "a11ycore_scopeAttrValid_summary_cantTell": "This scope attribute value is not recognized.",
    "a11ycore_scopeAttrValid_hint_cantTell": "Use one of row, col, rowgroup, or colgroup for the scope attribute.",

    "a11ycore_tabindex_title": "tabindex should not be greater than 0",
    "a11ycore_tabindex_description": "Checks that tabindex values are 0 or negative, not a positive number.",
    "a11ycore_tabindex_summary_cantTell": "This element has a positive tabindex, overriding the natural tab order.",
    "a11ycore_tabindex_hint_cantTell": "Use tabindex=\"0\" (or a negative value to remove from tab order) instead of a positive number; fix the DOM order if a different tab order is needed.",

    "a11ycore_emptyTableHeader_title": "Table header cells must not be empty",
    "a11ycore_emptyTableHeader_description": "Checks that <th> elements have visible text content — a header named only via aria-label/aria-labelledby is also flagged, since real screen-reader/browser support for that is inconsistent.",
    "a11ycore_emptyTableHeader_summary_cantTell": "This table header cell has no accessible name.",
    "a11ycore_emptyTableHeader_hint_cantTell": "Add text content (or aria-label/aria-labelledby) to this header cell, or remove it if it is not needed.",
    "a11ycore_emptyTableHeader_summary_cantTell_ariaOnly": "This table header cell has no visible text — its only accessible name comes from aria-label/aria-labelledby, which real screen-reader/browser combinations (e.g. NVDA+Firefox, iOS VoiceOver+Safari) are known to ignore on <th> elements.",
    "a11ycore_emptyTableHeader_hint_cantTell_ariaOnly": "Add visible text content to this header cell (in addition to, or instead of, aria-label/aria-labelledby) — visible text is the only naming mechanism confirmed to work across tested screen readers.",

    "a11ycore_labelTitleOnly_title": "Form controls should not use title as their only label",
    "a11ycore_labelTitleOnly_description": "Checks that a form control with a title attribute also has a real label (label element, aria-label, or aria-labelledby).",
    "a11ycore_labelTitleOnly_summary_cantTell": "This form control relies on the title attribute as its only label.",
    "a11ycore_labelTitleOnly_hint_cantTell": "Add a visible <label> (or aria-label/aria-labelledby) in addition to, or instead of, the title attribute.",

    "a11ycore_imageRedundantAlt_title": "Image alt text must not duplicate adjacent visible text",
    "a11ycore_imageRedundantAlt_description": "Checks that an <img> alt text is not identical to other visible text already present in its immediate parent element.",
    "a11ycore_imageRedundantAlt_summary_cantTell": "This image's alt text duplicates other visible text right next to it.",
    "a11ycore_imageRedundantAlt_hint_cantTell": "Make the alt text empty (alt=\"\") if the image is purely decorative alongside the text, or remove the redundant duplication.",

    "a11ycore_tableDuplicateName_title": "Table caption must not duplicate its summary attribute",
    "a11ycore_tableDuplicateName_description": "Checks that a <table>'s <caption> text is not identical to its (deprecated) summary attribute.",
    "a11ycore_tableDuplicateName_summary_cantTell": "This table's caption duplicates its summary attribute.",
    "a11ycore_tableDuplicateName_hint_cantTell": "Remove the redundant summary attribute, or make it provide different information than the caption.",

    "a11ycore_metaViewportLarge_title": "Viewport meta tag should allow zooming up to 500%",
    "a11ycore_metaViewportLarge_description": "Checks that <meta name=\"viewport\"> does not set user-scalable=no or maximum-scale below 5 (500%).",
    "a11ycore_metaViewportLarge_summary_cantTell": "This viewport meta tag restricts zoom below the 500% best-practice target.",
    "a11ycore_metaViewportLarge_hint_cantTell": "Remove user-scalable=no and raise maximum-scale to at least 5 (500%) if possible.",

    "a11ycore_presentationRoleConflict_title": "Presentational role must not conflict with a global ARIA attribute or focusability",
    "a11ycore_presentationRoleConflict_description": "Checks that role=\"presentation\"/\"none\" (including an <img alt=\"\"> implicit presentation role) is not combined with a global ARIA attribute (aria-label, aria-hidden, aria-describedby, ...) or focusability (tabindex/native).",
    "a11ycore_presentationRoleConflict_summary_cantTell": "This role=\"{{role}}\" element also has a conflicting condition ({{attrs}}), which restores its implicit role and cancels the presentational intent.",
    "a11ycore_presentationRoleConflict_hint_cantTell": "Remove the conflicting naming attribute(s) and/or focusability (tabindex/native) if the element should stay presentational, or remove role=\"presentation\"/\"none\" if it should be exposed to assistive technology.",

    "a11ycore_region_title": "Page content should be inside a landmark region",
    "a11ycore_region_description": "Checks that direct children of <body> with visible text content are contained within a landmark region.",
    "a11ycore_region_summary_cantTell": "This content is not contained within a landmark region.",
    "a11ycore_region_hint_cantTell": "Move this content inside a landmark region (main, nav, aside, a labeled section, etc.).",

    "a11ycore_skipLink_title": "Skip link must have a resolvable target",
    "a11ycore_skipLink_description": "Checks that a \"skip to ...\" link's href fragment resolves to a real element in the document.",
    "a11ycore_skipLink_summary_cantTell": "This skip link's target does not exist.",
    "a11ycore_skipLink_hint_cantTell": "Point the skip link's href at an id that exists in the document, or add the missing target element.",

    "a11ycore_autocompleteValid_title": "autocomplete attribute must be a valid autofill value",
    "a11ycore_autocompleteValid_description": "Checks that a non-empty autocomplete attribute is \"on\"/\"off\" or a well-formed autofill detail token list.",
    "a11ycore_autocompleteValid_summary_fail": "This autocomplete attribute value is not a valid autofill value.",
    "a11ycore_autocompleteValid_hint_fail": "Use \"on\"/\"off\", or a valid autofill token list (e.g. \"shipping street-address\", \"cc-number\").",

    "a11ycore_htmlXmlLangMismatch_title": "lang and xml:lang must not disagree",
    "a11ycore_htmlXmlLangMismatch_description": "Checks that the <html> element's lang and xml:lang attributes declare the same primary language, when both are present.",
    "a11ycore_htmlXmlLangMismatch_summary_fail": "The lang (\"{{lang}}\") and xml:lang (\"{{xmlLang}}\") attributes declare different languages.",
    "a11ycore_htmlXmlLangMismatch_hint_fail": "Make lang and xml:lang declare the same primary language, or remove the deprecated xml:lang attribute.",

    "a11ycore_avoidInlineSpacing_title": "Inline style must not force text spacing with !important",
    "a11ycore_avoidInlineSpacing_description": "Checks that inline style does not set line-height, letter-spacing, or word-spacing with !important, which blocks user text-spacing overrides.",
    "a11ycore_avoidInlineSpacing_summary_fail": "This element's inline style forces {{properties}} with !important, blocking user text-spacing overrides.",
    "a11ycore_avoidInlineSpacing_hint_fail": "Remove !important from line-height/letter-spacing/word-spacing in inline styles so users can override text spacing.",

    "a11ycore_metaRefreshNoExceptions_title": "Page must not use a meta refresh at all (AAA)",
    "a11ycore_metaRefreshNoExceptions_description": "Checks that <meta http-equiv=\"refresh\"> is not present at all, regardless of delay — the stricter AAA-level counterpart of the A-level positive-delay-only check.",
    "a11ycore_metaRefreshNoExceptions_summary_fail": "This page uses a meta refresh, which is an automatic context change not initiated by the user.",
    "a11ycore_metaRefreshNoExceptions_hint_fail": "Remove the meta refresh; trigger the redirect/refresh only in response to a user action instead.",

    "a11ycore_validLang_title": "Element lang attribute must be syntactically valid",
    "a11ycore_validLang_description": "Checks that any element (other than the root <html>) with a non-empty lang attribute uses a syntactically valid language tag.",
    "a11ycore_validLang_summary_fail": "This lang attribute value (\"{{value}}\") is not a syntactically valid language tag.",
    "a11ycore_validLang_hint_fail": "Use a valid BCP47 language tag (e.g. \"fr\", \"es-MX\").",

    "a11ycore_linkInTextBlock_title": "Links in text blocks must be distinguishable from surrounding text without relying on color alone",
    "a11ycore_linkInTextBlock_description": "Checks that a link inside a run of text is visually distinguishable from the surrounding text by underline, a font-weight/style difference, or a sufficient (>=3:1) color-contrast difference — not by color alone.",
    "a11ycore_linkInTextBlock_summary_fail": "This link in a block of text relies on color alone to be distinguished from the surrounding text.",
    "a11ycore_linkInTextBlock_hint_fail": "Add an underline, a font-weight/style difference, or increase the color contrast between the link and surrounding text to at least 3:1.",

    "a11ycore_noAutoplayAudio_title": "Autoplaying audio should provide a pause/stop or volume-control mechanism",
    "a11ycore_noAutoplayAudio_description": "Flags <audio>/<video> elements that autoplay unmuted with no native controls attribute, for manual review against the 3-second exemption in WCAG 1.4.2.",
    "a11ycore_noAutoplayAudio_summary_cantTell": "This element autoplays audio without a native pause/stop or volume-control mechanism.",
    "a11ycore_noAutoplayAudio_hint_cantTell": "If this clip plays for more than 3 seconds, add a controls attribute (or an equivalent custom mechanism) so users can pause/stop it or control its volume independently of the system volume.",

    "a11ycore_videoCaption_title": "Prerecorded video should provide a captions track",
    "a11ycore_videoCaption_description": "Flags <video> elements with no <track kind=\"captions\"|\"subtitles\"> child, for manual review of whether the video has an audio track that needs captions.",
    "a11ycore_videoCaption_summary_cantTell": "This video has no captions (or subtitles) track.",
    "a11ycore_videoCaption_hint_cantTell": "If this video has an audio track that conveys information, add a <track kind=\"captions\" src=\"...\"> with the captioned content.",

    "a11ycore_scrollableRegionFocusable_title": "Scrollable regions with no focusable content should be keyboard-focusable",
    "a11ycore_scrollableRegionFocusable_description": "Flags elements whose CSS declares overflow:auto/scroll, contain no focusable descendant, and are not themselves keyboard-focusable, for manual review of whether their content actually overflows and needs keyboard scroll access.",
    "a11ycore_scrollableRegionFocusable_summary_cantTell": "This element declares overflow:auto/scroll, has no focusable descendant, and is not itself keyboard-focusable.",
    "a11ycore_scrollableRegionFocusable_hint_cantTell": "If this region's content actually overflows, add tabindex=\"0\" (and a suitable label) so keyboard users can focus it and scroll with the arrow keys.",

    "a11ycore_identicalLinksSamePurpose_title": "Links with the same accessible name should lead to the same destination",
    "a11ycore_identicalLinksSamePurpose_description": "Flags groups of links that share the same accessible name but resolve to more than one distinct destination, for manual review of whether they serve the same purpose.",
    "a11ycore_identicalLinksSamePurpose_summary_cantTell": "This link shares an accessible name with other links on the page that lead to a different destination.",
    "a11ycore_identicalLinksSamePurpose_hint_cantTell": "Ensure links with the same text serve the same purpose, or make the link text distinct enough to describe each destination.",

    "a11ycore_ariaBrailleEquivalent_title": "aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent",
    "a11ycore_ariaBrailleEquivalent_description": "Checks that elements using aria-braillelabel also have a regular accessible name, and elements using aria-brailleroledescription also have aria-roledescription.",
    "a11ycore_ariaBrailleEquivalent_summary_fail": "This element has {{attr}} but no {{requires}}, its non-braille equivalent.",
    "a11ycore_ariaBrailleEquivalent_hint_fail": "{{attr}} is a Braille-specific supplement, not a replacement — also provide {{requires}}.",

    "a11ycore_ariaConditionalAttr_title": "aria-errormessage requires aria-invalid to be set to a non-false value",
    "a11ycore_ariaConditionalAttr_description": "Checks that elements with aria-errormessage also have aria-invalid set to \"true\", \"grammar\", or \"spelling\" — otherwise the error message is dropped from the accessibility tree.",
    "a11ycore_ariaConditionalAttr_summary_fail": "This element has aria-errormessage but aria-invalid is missing or \"false\", so the error message is not exposed.",
    "a11ycore_ariaConditionalAttr_hint_fail": "Set aria-invalid to \"true\" (or \"grammar\"/\"spelling\") whenever aria-errormessage should be exposed to assistive technology.",

    "a11ycore_ariaCheckedStateMismatch_title": "Native checkbox/radio aria-checked should match its actual state",
    "a11ycore_ariaCheckedStateMismatch_description": "Flags a native <input type=\"checkbox\">/<input type=\"radio\"> whose explicit aria-checked value disagrees with its actual checked/indeterminate state, for manual review.",
    "a11ycore_ariaCheckedStateMismatch_summary_cantTell": "This element’s aria-checked value does not match its actual checked/indeterminate state.",
    "a11ycore_ariaCheckedStateMismatch_hint_cantTell": "Set aria-checked to match the element’s real state, or remove it — a native checkbox/radio already exposes this state without it.",

    "a11ycore_cssOrientationLock_title": "CSS must not lock the page to a single orientation",
    "a11ycore_cssOrientationLock_description": "Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation.",
    "a11ycore_cssOrientationLock_summary_fail": "A \"{{mediaText}}\" media query rotates \"{{selectorText}}\", locking the page to one orientation.",
    "a11ycore_cssOrientationLock_hint_fail": "Remove the rotate() transform from the orientation media query; let the page respond naturally to device orientation instead of forcing a visual rotation.",

    "a11ycore_ariaText_title": "role=\"text\" elements should have no focusable descendants",
    "a11ycore_ariaText_description": "Checks that elements with role=\"text\" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).",
    "a11ycore_ariaText_summary_cantTell": "This role=\"text\" element contains a focusable descendant.",
    "a11ycore_ariaText_hint_cantTell": "Remove role=\"text\" (or remove the focusable descendant) — a \"plain text\" region should not contain focusable content.",

    "a11ycore_focusOrderSemantics_title": "Elements added to the tab order should have interactive semantics",
    "a11ycore_focusOrderSemantics_description": "Flags elements with tabindex >= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, region, presentation), for manual review.",
    "a11ycore_focusOrderSemantics_summary_cantTell": "This element is in the tab order (tabindex=\"{{tabindex}}\") but has a non-interactive role (\"{{role}}\").",
    "a11ycore_focusOrderSemantics_hint_cantTell": "Remove tabindex if this element is not meant to be interactive, or use an interactive role that matches its actual behavior.",

    "a11ycore_pAsHeading_title": "A <p> styled to look like a heading should probably be a real heading",
    "a11ycore_pAsHeading_description": "Flags short <p> elements whose entire text is bold and rendered at >=18px, for manual review of whether a real heading element should be used instead.",
    "a11ycore_pAsHeading_summary_cantTell": "This paragraph is entirely bold and rendered at a heading-like size.",
    "a11ycore_pAsHeading_hint_cantTell": "If this text introduces a new section, use a real heading element (<h1>-<h6> or role=\"heading\") instead of styling a paragraph to look like one.",

    "a11ycore_tableFakeCaption_title": "A table's first row should not stand in for a real <caption>",
    "a11ycore_tableFakeCaption_description": "Flags tables with no <caption> whose first row has a single non-empty cell while other rows have multiple cells, for manual review of whether that cell is acting as a fake caption.",
    "a11ycore_tableFakeCaption_summary_cantTell": "This table has no <caption>, but its first row is a single cell sitting above multi-cell rows — it may be acting as a fake caption.",
    "a11ycore_tableFakeCaption_hint_cantTell": "If this cell is meant to describe the table, use a real <caption> element instead of a lone first-row cell.",

    "a11ycore_tdHasHeader_title": "Data cells in large tables must have an associated header",
    "a11ycore_tdHasHeader_description": "Checks that every <td> in a large, simple (no colspan/rowspan) table has an associated header — via a headers attribute, an implicit column <th> above it, or an implicit row <th> to its left.",
    "a11ycore_tdHasHeader_summary_fail": "This data cell has no associated header (no headers attribute, no column <th> above it, no row <th> to its left).",
    "a11ycore_tdHasHeader_hint_fail": "Add a headers attribute referencing the relevant <th> id(s), or restructure the table so this cell has an implicit row/column header.",

    "a11ycore_mouseOnlyEventHandlers_title": "Pointer-only inline event handlers should have a keyboard-reachable equivalent",
    "a11ycore_mouseOnlyEventHandlers_description": "Flags elements with an inline pointer-only event handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave) and no keyboard-reachable equivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), for manual review.",
    "a11ycore_mouseOnlyEventHandlers_summary_cantTell": "This element has {{attrs}} but no keyboard-reachable equivalent handler.",
    "a11ycore_mouseOnlyEventHandlers_hint_cantTell": "Add onkeydown/onkeyup/onkeypress (or onfocus/onblur for hover-triggered behavior) so this functionality is also reachable by keyboard.",

    "a11ycore_linkNameQuality_title": "Link text should be descriptive, not generic",
    "a11ycore_linkNameQuality_description": "Flags links whose full accessible name is a known non-descriptive phrase (e.g. \"click here\", \"read more\", \"more\"), for manual review of whether the purpose is clear without additional context.",
    "a11ycore_linkNameQuality_summary_cantTell": "This link's accessible name (\"{{name}}\") is a generic, non-descriptive phrase.",
    "a11ycore_linkNameQuality_hint_cantTell": "Make the link text itself describe its destination/purpose (e.g. \"Download the 2026 pricing guide\" instead of \"Download\"), or confirm the surrounding context already makes the purpose clear."
}
