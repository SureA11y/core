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
        'Use a valid BCP 47 language tag in <html lang="…"> (for example: "en", "fr", "en-US").'
};
