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
    "a11ycore_svg_textAltPresent_description": "Checks that inline <svg> elements provide a text alternative via <title>/<desc> or an ARIA name.",
    "a11ycore_svg_textAltPresent_summary_fail": "Missing text alternative for <svg>.",
    "a11ycore_svg_textAltPresent_hint_fail": "Provide a <title> or <desc> element with text, or an ARIA name (aria-label/aria-labelledby).",
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
    "a11ycore_videoPoster_textAltPresent_description": "Checks that <video> elements with a poster image provide a text alternative (accessible name or fallback text).",
    "a11ycore_videoPoster_textAltPresent_summary_fail": "Missing text alternative for <video> poster.",
    "a11ycore_videoPoster_textAltPresent_hint_fail": "Provide an accessible name (e.g., aria-label/aria-labelledby) or meaningful fallback text inside <video>.",
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
        'Checks that elements with role="img" provide an accessible text alternative using aria-label or aria-labelledby.',

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
    "a11ycore_labelInName_hint_fail": "Update aria-label/aria-labelledby (or the visible label text) so the accessible name includes the visible label wording."
}
