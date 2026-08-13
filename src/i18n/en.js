/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

module.exports = {
  img_altPresent_title: '<img> must have an alt attribute',
  img_altPresent_description:
    'Checks that <img> elements provide an alt attribute to support a text alternative mechanism.',

  img_altPresent_summary_fail: 'Missing alt attribute on <img>.',
  img_altPresent_hint_fail: 'Add an alt attribute (use alt="" only for decorative images).',
  area_altPresent_title: '<area> must have an alt attribute',
  area_altPresent_description:
    'Checks that <area> elements provide an alt attribute to support a text alternative mechanism.',
  area_altPresent_summary_fail: 'Missing alt attribute on <area>.',
  area_altPresent_hint_fail: 'Add an alt attribute (use alt="" only for decorative areas).',
  inputImage_altPresent_title: '<input type="image"> must have an alt attribute',
  inputImage_altPresent_description:
    'Checks that <input type="image"> elements provide an alt attribute to support a text alternative mechanism.',
  inputImage_altPresent_summary_fail: 'Missing alt attribute on <input type="image">.',
  inputImage_altPresent_hint_fail:
    'Add an alt attribute (use alt="" only when a separate accessible name is provided).',
  inputImage_altPresent_summary_defaultName:
    'Accessible name is the browser default for an image button, which conveys nothing.',
  inputImage_altPresent_hint_defaultName:
    'Replace it with text describing what the button does, for example "Search".',
  inputImage_altPresent_summary_emptyAlt:
    'Empty alt="" on <input type="image"> leaves the control unnamed.',
  inputImage_altPresent_hint_emptyAlt:
    'Describe the action in alt, or name the control with aria-label or aria-labelledby.',
  ariaHidden_programmaticFocus_review_title: 'Review aria-hidden programmatic focus',
  ariaHidden_programmaticFocus_review_description:
    'Flags elements that are aria-hidden but considered eligible due to programmatic focus (e.g., tabindex < 0). Verify intended focus management and assistive technology exposure.',
  ariaHidden_programmaticFocus_review_summary:
    'Review: aria-hidden element is programmatically focusable.',
  ariaHidden_programmaticFocus_review_hint:
    'Check that focus management is intentional and that the element should remain hidden from assistive technologies.',
  canvas_textAltPresent_title: '<canvas> must provide a text alternative',
  canvas_textAltPresent_description:
    'Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.',
  canvas_textAltPresent_summary_fail: 'Missing text alternative for <canvas>.',
  canvas_textAltPresent_hint_fail:
    'Provide fallback text inside <canvas> or an accessible name (e.g., aria-label/aria-labelledby).',
  svg_textAltPresent_title: '<svg> must provide a text alternative',
  svg_textAltPresent_description:
    'Checks that inline <svg> elements provide a text alternative via a <title> element or an ARIA name (a <desc> element alone does not count).',
  svg_textAltPresent_summary_fail: 'Missing text alternative for <svg>.',
  svg_textAltPresent_hint_fail:
    'Provide a <title> element with text, or an ARIA name (aria-label/aria-labelledby) — a <desc> element alone does not provide an accessible name.',
  object_textAltPresent_title: '<object> must provide a text alternative',
  object_textAltPresent_description:
    'Checks that <object> elements provide a text alternative via fallback content or an accessible name.',
  object_textAltPresent_summary_fail: 'Missing text alternative for <object>.',
  object_textAltPresent_hint_fail:
    'Provide meaningful fallback content inside <object>, add an accessible name (aria-label/aria-labelledby), or use a title attribute as a best-effort fallback.',
  embed_textAltPresent_title: '<embed> must provide a text alternative',
  embed_textAltPresent_description:
    'Checks that <embed> elements provide a text alternative via an accessible name.',
  embed_textAltPresent_summary_fail: 'Missing text alternative for <embed>.',
  embed_textAltPresent_hint_fail:
    'Add an accessible name to <embed> (aria-label/aria-labelledby preferred, or a title attribute as a best-effort fallback).',
  img_altQuality_title: '<img> alt text must be appropriate (manual review)',
  img_altQuality_description:
    'Flags <img> elements with non-empty alt text for human review of appropriateness.',
  img_altQuality_summary_cantTell: 'Review alt text on <img> for accuracy and appropriateness.',
  img_altQuality_hint_cantTell:
    'Ensure the alt text conveys the image’s purpose/information in context (not redundant, not filename-like).',
  img_altDecorative_title: '<img> with alt="" must be decorative (manual review)',
  img_altDecorative_description:
    'Flags <img> elements with empty alt for human review that they are purely decorative.',
  img_altDecorative_summary_cantTell: 'Review whether <img> is decorative (alt="").',
  img_altDecorative_hint_cantTell:
    'Confirm the image is purely decorative. If it conveys information or function, provide meaningful alt text.',
  area_altQuality_title: '<area> alt text must be appropriate (manual review)',
  area_altQuality_description:
    'Flags <area> elements with non-empty alt text for human review of appropriateness.',
  area_altQuality_summary_cantTell: 'Review alt text on <area> for accuracy and appropriateness.',
  area_altQuality_hint_cantTell:
    'Ensure the alt text identifies the destination/action of the image map area in context.',
  area_altDecorative_title: '<area> with alt="" must be decorative (manual review)',
  area_altDecorative_description:
    'Flags <area> elements with empty alt for human review that they are decorative/non-informative.',
  area_altDecorative_summary_cantTell: 'Review whether <area> is decorative (alt="").',
  area_altDecorative_hint_cantTell:
    'Confirm the area does not convey information or function. If it is interactive or meaningful, provide meaningful alt text.',
  inputImage_altQuality_title: '<input type="image"> alt text must be appropriate (manual review)',
  inputImage_altQuality_description:
    'Flags <input type="image"> elements with non-empty alt text for human review of appropriateness.',
  inputImage_altQuality_summary_cantTell:
    'Review alt text on <input type="image"> for accuracy and appropriateness.',
  inputImage_altQuality_hint_cantTell:
    'Ensure the alt text describes the control’s action (e.g., “Search”, “Submit order”) in context.',
  inputImage_altDecorative_title:
    '<input type="image"> with alt="" must be appropriate (manual review)',
  inputImage_altDecorative_description:
    'Flags <input type="image"> elements with empty alt for human review (usually not appropriate for functional controls).',
  inputImage_altDecorative_summary_cantTell: 'Review <input type="image"> with alt="".',
  inputImage_altDecorative_hint_cantTell:
    'This control is typically functional. Confirm it has an equivalent accessible name elsewhere, or provide meaningful alt text.',
  canvas_textAltQuality_title: '<canvas> text alternative must be appropriate (manual review)',
  canvas_textAltQuality_description:
    'Flags <canvas> elements with a detected text alternative for human review of equivalence and appropriateness.',
  canvas_textAltQuality_summary_cantTell:
    'Review text alternative for <canvas> for equivalence and appropriateness.',
  canvas_textAltQuality_hint_cantTell:
    'Confirm the fallback text or accessible name conveys the same information/function as the canvas content.',
  svg_textAltQuality_title: '<svg> text alternative must be appropriate (manual review)',
  svg_textAltQuality_description:
    'Flags applicable <svg> graphics with a detected text alternative for human review of appropriateness.',
  svg_textAltQuality_summary_cantTell:
    'Review text alternative for <svg> for accuracy and appropriateness.',
  svg_textAltQuality_hint_cantTell:
    'Confirm the <title>/<desc> or ARIA name conveys the meaning/purpose of the graphic in context.',
  object_textAltQuality_title: '<object> text alternative must be appropriate (manual review)',
  object_textAltQuality_description:
    'Flags <object> elements with detected fallback or name for human review of equivalence and appropriateness.',
  object_textAltQuality_summary_cantTell:
    'Review text alternative for <object> for equivalence and appropriateness.',
  object_textAltQuality_hint_cantTell:
    'Confirm the fallback content or ARIA name provides an equivalent alternative for the embedded content.',
  embed_textAltQuality_title: '<embed> text alternative must be appropriate (manual review)',
  embed_textAltQuality_description:
    'Flags <embed> elements with a detected name for human review of appropriateness.',
  embed_textAltQuality_summary_cantTell:
    'Review text alternative for <embed> for accuracy and appropriateness.',
  embed_textAltQuality_hint_cantTell:
    'Confirm the ARIA name or title accurately identifies the embedded content in context.',
  videoPoster_textAltPresent_title: '<video> poster must have a text alternative',
  videoPoster_textAltPresent_description:
    'Checks that <video> elements with a poster image provide a text alternative (accessible name).',
  videoPoster_textAltPresent_summary_fail: 'Missing text alternative for <video> poster.',
  videoPoster_textAltPresent_hint_fail:
    'Provide an accessible name for the poster image (aria-label/aria-labelledby preferred, or a title attribute as a fallback).',
  svgImage_textAltPresent_title: 'SVG <image> must have a text alternative',
  svgImage_textAltPresent_description:
    'Checks that SVG <image> elements provide a text alternative via <title>/<desc> or an ARIA accessible name.',
  svgImage_textAltPresent_summary_fail: 'Missing text alternative on SVG <image>.',
  svgImage_textAltPresent_hint_fail:
    'Add a <title> (and optionally <desc>) inside <image>, or provide aria-label/aria-labelledby.',
  formControl_programmaticLabelPresent_title: 'Form controls must have a programmatic label',
  formControl_programmaticLabelPresent_description:
    'Checks that form controls have a programmatic label via <label>, aria-label, or aria-labelledby.',
  formControl_programmaticLabelPresent_summary_fail:
    'Form control is missing a programmatic label.',
  formControl_programmaticLabelPresent_hint_fail:
    'Provide a <label> association, aria-label, or aria-labelledby (placeholder/title do not count as labels).',

  formControlAccessibleName_description:
    'Fails when an applicable form control has no accessible name (e.g., label, aria-label, aria-labelledby).',
  formControlAccessibleName_hint_fail:
    'Provide an accessible name via a <label>, aria-label, or aria-labelledby.',
  formControlAccessibleName_summary_fail: 'Form control has no accessible name.',
  formControlAccessibleName_title: 'Form controls must have an accessible name',
  linksTargetBlankNoopener_description:
    'Ensures links with target="_blank" mitigate reverse tabnabbing risks.',
  linksTargetBlankNoopener_hint_cantTell: 'See guidance for this rule.',
  linksTargetBlankNoopener_summary_cantTell:
    'Links that open in a new tab should use rel="noopener"',
  linksTargetBlankNoopener_title: 'Links that open in a new tab should use rel="noopener"',
  manualReview_description:
    'Flags that a manual review of keyboard navigation and focus order is required.',
  manualReview_hint_cantTell: 'See guidance for this rule.',
  manualReview_summary_cantTell: 'Manual review: keyboard navigation and focus order',
  manualReview_title: 'Manual review: keyboard navigation and focus order',
  'rules.img-alt-suspicious.meta.title': 'Suspicious alt text requires verification',

  'rules.img-alt-suspicious.meta.description':
    'Identifies images whose alt text matches common suspicious patterns (such as filenames, URLs, placeholders, or generic terms) and requires manual verification.',

  'rules.img-alt-suspicious.occurrence.cantTell.summary':
    'Image alt text appears suspicious ("{{alt}}" looks like {{pattern}}) and requires verification.',

  'rules.img-alt-suspicious.occurrence.cantTell.hint':
    'Review the alt text. Avoid filenames, URLs, placeholders, or generic terms, and ensure the text alternative describes the image’s purpose or function in context.',
  formControl_programmaticLabelQuality_title:
    'Form controls should not rely on placeholder or title as the primary label',
  formControl_programmaticLabelQuality_description:
    'Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer <label> or aria-labelledby.',
  formControl_programmaticLabelQuality_summary_cantTell:
    'Form control’s primary label is derived from {{methodLabel}}.',
  formControl_programmaticLabelQuality_hint_cantTell:
    'Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.',

  html_lang_attr_title: 'Page language is declared',
  html_lang_attr_description:
    'Checks that the default language of the page is programmatically declared.',

  html_lang_attr_missing_absent: 'The default language of the page is not declared.',
  html_lang_attr_hint_missing_absent:
    'Add a lang attribute to the <html> element (for example: <html lang="en">).',

  html_lang_attr_missing_empty: 'The default language of the page is declared but empty.',
  html_lang_attr_hint_missing_empty:
    'Set a valid language value in the lang attribute of the <html> element (for example: <html lang="en">).',

  html_lang_attr_invalid:
    'The default language of the page is declared, but the value "{{lang}}" is not a valid language tag.',
  html_lang_attr_hint_invalid:
    'Use a valid BCP 47 language tag in <html lang="…"> (for example: "en", "fr", "en-US").',
  mediaTranscriptPresent_title: 'Time-based media: transcript or text alternative evidence',

  mediaTranscriptPresent_description:
    'Finds audio and video elements where a transcript or other text alternative is not strongly evidenced in the page content. This rule is conservative and reports cantTell when evidence is missing or cannot be verified.',

  mediaTranscriptPresent_summary_cantTell_missing:
    'A transcript or other text alternative for this <{{element}}> is not strongly evidenced on the page.',

  mediaTranscriptPresent_hint_cantTell_missing:
    'Provide a clearly identified transcript or other text alternative for prerecorded audio-only or video-only media, for example a visible “Transcript” section or link.',

  mediaTranscriptPresent_summary_cantTell_unverified:
    'A transcript or other text alternative may be available for this time-based media, but it could not be verified from the page content.',

  mediaTranscriptPresent_hint_cantTell_unverified:
    'Ensure a clearly identified transcript or other text alternative is available and visibly or programmatically associated with the media on the page.',
  pageTitlePresent_title: 'Page has a non-empty title',
  pageTitlePresent_description:
    'Checks that the page includes a non-empty <title> element that identifies the page.',

  pageTitlePresent_summary_fail: 'The page does not have a non-empty title.',
  pageTitlePresent_hint_fail:
    'Add a <title> element with text that describes the page topic or purpose.',
  pageTitlePatterns_title: 'Page title patterns that may be insufficiently descriptive',
  pageTitlePatterns_description:
    'Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.',

  pageTitlePatterns_summary_cantTell:
    'The page title may not be descriptive enough to identify the page topic or purpose.',

  pageTitlePresent_summary_fail_missing: 'The page is missing a <title> element.',
  pageTitlePresent_summary_fail_empty: 'The page has an empty <title>.',

  pageTitlePatterns_summary_cantTell_duplicateAcrossPages:
    'Several pages share the same title, which may make it harder to distinguish pages ({{duplicateGroups}} duplicate groups across {{pagesAnalyzed}} pages). Example: “{{exampleTitle}}”.',

  pageTitlePatterns_summary_cantTell_templatedAcrossPages:
    'Many page titles appear highly templated, which may reduce how well titles distinguish pages ({{pagesAnalyzed}} pages).',

  pageTitlePatterns_summary_cantTell_generic:
    'The page title is generic and may not identify the page topic or purpose.',

  pageTitlePatterns_summary_cantTell_veryShort:
    'The page title is very short and may not identify the page topic or purpose.',

  pageTitlePatterns_summary_cantTell_templateLike:
    'The page title appears templated and may not identify the page topic or purpose.',

  pageTitlePatterns_hint_cantTell:
    'Review the page title and ensure it clearly identifies the page topic or purpose and helps distinguish the page from others.',

  // --- DOM Contrast: computability gatekeeper
  contrastComputable_title: 'Color contrast is computable for rendered text',
  contrastComputable_description:
    'Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).',

  contrastComputable_pass_allComputable:
    'Contrast is computable for all eligible text ({{eligibleTextCount}} text node(s)).',

  contrastComputable_cantTell_generic: 'Contrast may not be computable ({{reasonCode}}).',

  contrastComputable_cantTell_bgImageOrGradient:
    'Contrast is not computable because the background uses an image or gradient ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgImage:
    'Contrast is not computable because the background uses an image ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgGradient:
    'Contrast is not computable because the background uses a gradient ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_bgImageAndGradient:
    'Contrast is not computable because the background uses an image and a gradient ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_mixBlendMode:
    'Contrast is not computable because mix-blend-mode is used ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_filter:
    'Contrast is not computable because filter/backdrop-filter is used ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_rootNotOpaque:
    'Contrast is not computable because the effective background is not fully opaque at the root (alpha={{backgroundAlpha}}).',

  contrastComputable_cantTell_foregroundUnparsable:
    'Contrast is not computable because the computed foreground color could not be parsed.',

  contrastComputable_cantTell_engineFailure:
    'Contrast computability could not be determined due to an internal engine error ({{reasonCode}}).',

  contrastComputable_cantTell_backdropFilter:
    'Contrast is not computable because backdrop-filter is used ({{blockerProperty}}={{blockerValue}}).',

  contrastComputable_cantTell_filterOrBackdropFilter:
    'Contrast is not computable because filter is used ({{blockerProperty}}={{blockerValue}}).',

  // --- DOM Contrast: AA minimum (1.4.3)
  contrastMinimum_title: 'Text meets minimum color contrast (AA)',
  contrastMinimum_description:
    'Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3.0:1 (large), when contrast is computable from CSS.',

  contrastMinimum_fail_belowThreshold:
    'Element has insufficient color contrast of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).',

  contrastMinimum_pass_allAboveThreshold:
    'All computable text meets minimum contrast (AA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.',

  contrastMinimum_notApplicable_noComputableText:
    'No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.',

  contrastMinimum_cantTell_engineFailure:
    'Minimum contrast (AA) could not be determined due to an internal engine error ({{reasonCode}}).',

  // --- DOM Contrast: AAA enhanced (1.4.6)
  contrastEnhanced_title: 'Text meets enhanced color contrast (AAA)',
  contrastEnhanced_description:
    'Checks that visible text has a contrast ratio of at least 7.0:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.',

  contrastEnhanced_fail_belowThreshold:
    'Element has insufficient color contrast (AAA) of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).',

  contrastEnhanced_pass_allAboveThreshold:
    'All computable text meets enhanced contrast (AAA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.',

  contrastEnhanced_notApplicable_noComputableText:
    'No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.',

  contrastEnhanced_cantTell_engineFailure:
    'Enhanced contrast (AAA) could not be determined due to an internal engine error ({{reasonCode}}).',

  // --- 1) Text contrast (Minimum) — WCAG 1.4.3 (AA)
  dom_textContrastMinimum_title: 'Text must have sufficient contrast (minimum)',
  dom_textContrastMinimum_description:
    'Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.3 (AA), using rendered styles (font size/weight) to determine the required ratio.',

  dom_textContrastMinimum_summary_fail:
    'Insufficient text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.',
  dom_textContrastMinimum_hint_fail:
    'Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for this text size/weight.',

  dom_textContrastMinimum_summary_pass:
    'Text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.',

  dom_textContrastMinimum_summary_cantTell:
    'Could not reliably compute text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).',
  dom_textContrastMinimum_hint_cantTell:
    'Manually verify contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.',

  // --- 2) Text contrast (Enhanced) — WCAG 1.4.6 (AAA)
  dom_textContrastEnhanced_title: 'Text must have sufficient contrast (enhanced)',
  dom_textContrastEnhanced_description:
    'Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.6 (AAA), using rendered styles (font size/weight) to determine the required ratio.',

  dom_textContrastEnhanced_summary_fail:
    'Insufficient enhanced text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.',
  dom_textContrastEnhanced_hint_fail:
    'Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for enhanced (AAA) contrast.',

  dom_textContrastEnhanced_summary_pass:
    'Enhanced text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.',

  dom_textContrastEnhanced_summary_cantTell:
    'Could not reliably compute enhanced text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).',
  dom_textContrastEnhanced_hint_cantTell:
    'Manually verify enhanced (AAA) contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.',

  // --- 3) Non-text contrast — WCAG 1.4.11 (AA)
  dom_nonTextContrast_title: 'UI components and graphics must have sufficient contrast',
  dom_nonTextContrast_description:
    'Checks contrast for non-text visual information (UI component boundaries, states, and meaningful graphical objects) per WCAG 2.2 SC 1.4.11 (AA).',

  dom_nonTextContrast_summary_fail:
    'Insufficient non-text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.',
  dom_nonTextContrast_hint_fail:
    'Adjust the component/graphic colors so the contrast ratio is at least {{requiredRatio}}:1 for the perceivable boundary or essential visual information.',

  dom_nonTextContrast_summary_pass:
    'Non-text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.',

  dom_nonTextContrast_summary_cantTell:
    'Could not reliably compute non-text contrast because the effective background or painted pixels are not deterministically resolvable (e.g. image/gradient/video/canvas, complex transparency, or blending).',
  dom_nonTextContrast_hint_cantTell:
    'Manually verify the component/graphic contrast against adjacent colors; ensure it meets {{requiredRatio}}:1 for essential non-text visual information.',
  contrastEnhanced_pass_allTextMeetsThreshold: 'All computable text meets enhanced contrast (AAA).',
  contrastMinimum_pass_allTextMeetsThreshold: 'All computable text meets minimum contrast (AA).',

  contrastComputable_cantTell_notComputable:
    'Contrast could not be computed for this text ({{reasonCode}}).',

  // Title & description
  roleImg_textAlternativePresent_title: '[role="img"] must have an accessible text alternative',

  roleImg_textAlternativePresent_description:
    'Checks that elements with role="img" provide an accessible text alternative using aria-label, aria-labelledby, or a title attribute.',

  // Failure summary & hint
  roleImg_textAlternativePresent_summary_fail:
    'The element with role="img" does not have an accessible text alternative.',

  roleImg_textAlternativePresent_hint_fail:
    'Provide a text alternative using aria-label, or aria-labelledby that references non-empty text.',

  // --- Target Size (Minimum) — WCAG 2.5.8 (AA)
  targetSizeMinimum_title:
    'Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets',
  targetSizeMinimum_description:
    'Checks that pointer-operable targets have an effective hit region of at least 24 by 24 CSS pixels, or meet an allowed exception (e.g. sufficient spacing).',

  targetSizeMinimum_summary_fail:
    'One or more pointer targets are smaller than 24×24 CSS px and are too close to another target.',
  targetSizeMinimum_hint_fail:
    'Increase the target size to at least 24×24 CSS px or add sufficient spacing from neighboring targets.',
  targetSizeMinimum_summary_cantTell_ambiguousSpacing:
    'Target may be too small and too close to another target, but the overlap is near the detection threshold and could not be confidently measured.',
  targetSizeMinimum_hint_cantTell_ambiguousSpacing:
    'Manually verify the effective spacing between this target and its neighbor; increase target size or spacing if the overlap is real.',
  targetSizeMinimum_summary_cantTell_plausiblyEssential:
    'Target is too small and too close to another target, but may be exempt as part of an essential graphic or image-map region.',
  targetSizeMinimum_hint_cantTell_plausiblyEssential:
    'Verify whether this target’s size is genuinely essential to its function (e.g. part of an SVG/canvas/image map); if not, increase target size or spacing.',

  targetSizeMinimum_notApplicable_noTargets:
    'No pointer-operable targets were eligible for evaluation.',
  targetSizeMinimum_pass_allOk:
    'All eligible pointer targets meet the minimum size or a permitted exception.',

  // --- aria-hidden-focus
  ariaHidden_focus_title: 'ARIA hidden elements must not be focusable',
  ariaHidden_focus_description:
    'Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.',

  ariaHidden_focus_summary_fail_desc:
    'aria-hidden {{element}} contains {{focusableCount}} focusable element(s).',
  ariaHidden_focus_summary_fail_self:
    'aria-hidden {{element}} is focusable ({{focusableCount}} focusable element(s)).',
  ariaHidden_focus_summary_fail_self_and_desc:
    'aria-hidden {{element}} is focusable and contains {{descendantFocusableCount}} focusable descendant(s) ({{focusableCount}} focusable element(s) total).',

  ariaHidden_focus_hint_fail:
    'Remove focusability from descendants or remove aria-hidden; ensure focus and accessibility trees stay aligned.',
  ariaHidden_focus_summary_cantTell_redirect:
    'aria-hidden {{element}} received focus but focus moved immediately to another element. Verify sentinel/focus-trap behavior.',
  ariaHidden_focus_hint_cantTell_redirect:
    'Verify this is an intentional focus sentinel/focus-trap handoff and that keyboard users never remain on hidden focus targets.',

  // --- css-hidden-focus
  cssHidden_focus_title: 'Focusable elements must not be visually hidden',
  cssHidden_focus_description:
    'Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.',

  cssHidden_focus_summary_cantTell:
    'Focusable {{element}} is visually hidden ({{visibilityHints}}).',
  cssHidden_focus_hint_cantTell:
    'Make the element visible when it can receive keyboard focus, or remove it from the tab order until it is visible.',

  linkNamePresent_title: 'Links have an accessible name',
  linkNamePresent_description: 'Checks that links expose a non-empty accessible name.',
  linkNamePresent_summary_fail: 'This link has no accessible name.',
  linkNamePresent_hint_fail:
    'Provide link text or an accessible-name mechanism (for example aria-label) so assistive technologies can identify the link.',
  buttonNamePresent_title: 'Buttons have an accessible name',
  buttonNamePresent_description: 'Checks that buttons expose a non-empty accessible name.',
  buttonNamePresent_summary_fail: 'This button has no accessible name.',
  buttonNamePresent_hint_fail:
    'Provide visible button text or a programmatic accessible-name mechanism (for example aria-label) so assistive technologies can identify the button.',

  binaryControlNamePresent_title: 'Binary controls have an accessible name',
  binaryControlNamePresent_description:
    'Checks that checkbox, radio, and switch controls expose a non-empty accessible name.',
  binaryControlNamePresent_summary_fail: 'This control has no accessible name.',
  binaryControlNamePresent_hint_fail:
    'Provide a label, aria-label, aria-labelledby, or other accessible-name mechanism so assistive technologies can identify the control.',
  comboboxNamePresent_title: 'Comboboxes have an accessible name',
  comboboxNamePresent_description:
    'Checks that elements with role="combobox" expose a non-empty accessible name.',
  comboboxNamePresent_summary_fail: 'This combobox has no accessible name.',
  comboboxNamePresent_hint_fail:
    "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this combobox's accessible name.",
  dialogNamePresent_title: 'Dialogs have an accessible name',
  dialogNamePresent_description:
    'Checks that elements with role="dialog" or role="alertdialog" expose a non-empty accessible name.',
  dialogNamePresent_summary_fail: 'This dialog has no accessible name.',
  dialogNamePresent_hint_fail:
    'Provide aria-labelledby (preferred) or aria-label so assistive technologies can announce the dialog.',
  menuitemNamePresent_title: 'Menu items have an accessible name',
  menuitemNamePresent_description:
    'Checks that menu items (role="menuitem*", including checkbox/radio variants) expose a non-empty accessible name.',
  menuitemNamePresent_summary_fail: 'This menu item has no accessible name.',
  menuitemNamePresent_hint_fail:
    'Provide visible text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.',
  tabNamePresent_title: 'Tabs have an accessible name',
  tabNamePresent_description:
    'Checks that elements with role="tab" expose a non-empty accessible name.',
  tabNamePresent_summary_fail: 'This tab has no accessible name.',
  tabNamePresent_hint_fail:
    'Provide tab text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.',
  sliderNamePresent_title: 'Sliders have an accessible name',
  sliderNamePresent_description:
    'Checks that sliders (input[type="range"] and role="slider") expose a non-empty accessible name.',
  sliderNamePresent_summary_fail: 'This slider has no accessible name.',
  sliderNamePresent_hint_fail:
    'Provide a label, aria-label, or aria-labelledby so assistive technologies can identify the slider.',
  textboxNamePresent_title: 'Textboxes have an accessible name',
  textboxNamePresent_description:
    'Checks that elements with role="textbox" expose a non-empty accessible name.',
  textboxNamePresent_summary_fail: 'This textbox has no accessible name.',
  textboxNamePresent_hint_fail:
    "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this textbox's accessible name.",
  searchboxNamePresent_title: 'Searchboxes have an accessible name',
  searchboxNamePresent_description:
    'Checks that elements with role="searchbox" expose a non-empty accessible name.',
  searchboxNamePresent_summary_fail: 'This searchbox has no accessible name.',
  searchboxNamePresent_hint_fail:
    "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this searchbox's accessible name.",
  spinbuttonNamePresent_title: 'Spinbuttons have an accessible name',
  spinbuttonNamePresent_description:
    'Checks that elements with role="spinbutton" expose a non-empty accessible name.',
  spinbuttonNamePresent_summary_fail: 'This spinbutton has no accessible name.',
  spinbuttonNamePresent_hint_fail:
    "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this spinbutton's accessible name.",
  listboxNamePresent_title: 'Listboxes have an accessible name',
  listboxNamePresent_description:
    'Checks that elements with role="listbox" expose a non-empty accessible name.',
  listboxNamePresent_summary_fail: 'This listbox has no accessible name.',
  listboxNamePresent_hint_fail:
    "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this listbox's accessible name.",
  optionNamePresent_title: 'Options have an accessible name',
  optionNamePresent_description:
    'Checks that elements with role="option" expose a non-empty accessible name.',
  optionNamePresent_summary_fail: 'This option has no accessible name.',
  optionNamePresent_hint_fail:
    'Provide option text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.',
  treeitemNamePresent_title: 'Tree items have an accessible name',
  treeitemNamePresent_description:
    'Checks that elements with role="treeitem" expose a non-empty accessible name.',
  treeitemNamePresent_summary_fail: 'This tree item has no accessible name.',
  treeitemNamePresent_hint_fail:
    'Provide tree item text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.',
  ariaRoleNamePresent_title: 'ARIA widget/container roles have an accessible name',
  ariaRoleNamePresent_description:
    'Checks that selected ARIA widget/container roles expose a non-empty accessible name.',
  ariaRoleNamePresent_summary_fail: 'This element has no accessible name.',
  ariaRoleNamePresent_hint_fail:
    'Provide aria-label or aria-labelledby (preferred), or a non-empty title attribute.',

  /* =========================
   * Composite rule summaries
   * ========================= */
  composite_rollup_summary: 'Composite rule result: {{reasonCode}} ({{testCount}} checks)',

  /* =========================
   * WCAG 1.1.1 – Non-text content
   * ========================= */
  'catalog.rules.wcag_111_non_text_content.title': 'Non-text content: text alternatives',
  'catalog.rules.wcag_111_non_text_content.description':
    'Rollup of checks ensuring non-text content has an appropriate text alternative.',

  /* =========================
   * WCAG 1.2.1 – Audio-only / Video-only
   * ========================= */
  'catalog.rules.wcag_121_prerecorded_transcript.title':
    'Audio-only and video-only (prerecorded): transcript',
  'catalog.rules.wcag_121_prerecorded_transcript.description':
    'Rollup of checks for transcript availability for prerecorded audio-only or video-only media.',

  /* =========================
   * WCAG 1.4.3 – Contrast (Minimum)
   * ========================= */
  'catalog.rules.wcag_143_contrast_minimum.title': 'Contrast: minimum',
  'catalog.rules.wcag_143_contrast_minimum.description':
    'Rollup of checks for minimum text contrast.',

  /* =========================
   * WCAG 1.4.6 – Contrast (Enhanced)
   * ========================= */
  'catalog.rules.wcag_146_contrast_enhanced.title': 'Contrast: enhanced',
  'catalog.rules.wcag_146_contrast_enhanced.description':
    'Rollup of checks for enhanced text contrast.',

  /* =========================
   * WCAG 2.4.2 – Page titled
   * ========================= */
  'catalog.rules.wcag_242_page_titled.title': 'Page titled',
  'catalog.rules.wcag_242_page_titled.description':
    'Rollup of checks ensuring documents have a meaningful page title.',

  /* =========================
   * WCAG 2.4.7 – Focus visible
   * ========================= */
  'catalog.rules.wcag_247_focus_visible.title': 'Focus visible',
  'catalog.rules.wcag_247_focus_visible.description':
    'Rollup of checks ensuring keyboard focus is not hidden and remains perceivable.',

  /* =========================
   * WCAG 2.5.8 – Target size (Minimum)
   * ========================= */
  'catalog.rules.wcag_258_target_size_minimum.title': 'Target size: minimum',
  'catalog.rules.wcag_258_target_size_minimum.description':
    'Rollup of checks ensuring pointer targets meet minimum size requirements.',

  /* =========================
   * WCAG 3.1.1 – Language of page
   * ========================= */
  'catalog.rules.wcag_311_language_of_page.title': 'Language of page',
  'catalog.rules.wcag_311_language_of_page.description':
    'Rollup of checks ensuring the page language is specified.',

  /* =========================
   * WCAG 4.1.2 – Name, role, value
   * ========================= */
  'catalog.rules.wcag_412_name.title': 'Name, role, value: accessible name',
  'catalog.rules.wcag_412_name.description':
    'Rollup of checks that common interactive elements expose a non-empty accessible name.',
  labelInName_title: 'Label in Name: accessible name contains visible text',
  labelInName_description:
    'Checks that when a control has a visible text label, the accessible name contains that visible label text (WCAG 2.5.3).',
  labelInName_summary_fail:
    '{{element}}: visible label "{{visibleLabel}}" (from {{labelSource}}) is not included in the accessible name (from {{nameMechanism}}).',
  labelInName_hint_fail:
    'Update aria-label/aria-labelledby (or the visible label text) so the accessible name includes the visible label wording.',
  labelInName_summary_cantTell:
    '{{element}}: visible label "{{visibleLabel}}" (from {{labelSource}}) differs from the accessible name (from {{nameMechanism}}) only by an abbreviation or by hyphenation.',
  labelInName_hint_cantTell:
    'Check by hand whether the two wordings match: markup cannot tell an intended abbreviation from a mismatch.',

  /* =========================
   * ARIA validity family
   * ========================= */
  ariaRolesValid_title: 'role attribute must be a valid, non-abstract ARIA role',
  ariaRolesValid_description:
    'Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.',
  ariaRolesValid_summary_invalid: 'role="{{role}}" is not a recognized ARIA role.',
  ariaRolesValid_hint_invalid:
    'Use a valid ARIA role token, or remove the role attribute if none applies.',
  ariaRolesValid_summary_abstract:
    'role="{{role}}" is an abstract ARIA role, which must not be used directly.',
  ariaRolesValid_hint_abstract:
    'Replace this abstract role with a concrete role appropriate for the widget/structure.',

  ariaDeprecatedRole_title:
    'role attribute must not use a deprecated or author-prohibited ARIA role',
  ariaDeprecatedRole_description:
    'Checks that an explicit role="" attribute does not use a role deprecated by the WAI-ARIA specification, or one reserved for user-agent-internal use only (e.g. role="generic").',
  ariaDeprecatedRole_summary_fail:
    'This element uses role="{{role}}", which authors must not explicitly declare.',
  ariaDeprecatedRole_hint_fail: '{{guidance}}',

  ariaValidAttr_title: 'aria-* attributes must be real, defined ARIA attributes',
  ariaValidAttr_description:
    'Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.',
  ariaValidAttr_summary_fail: '{{attr}} is not a recognized ARIA attribute.',
  ariaValidAttr_hint_fail:
    'Correct the attribute name (check for typos), or remove it if not needed.',

  ariaValidAttrValue_title: 'aria-* attribute values must match their declared type',
  ariaValidAttrValue_description:
    'Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).',
  ariaValidAttrValue_summary_fail: '{{attr}}="{{value}}" is not a valid value for this attribute.',
  ariaValidAttrValue_hint_fail:
    'Use a value that matches the attribute’s expected type (see the WAI-ARIA specification for this attribute).',

  ariaAllowedAttr_title: 'aria-* attributes must be permitted for the element’s role',
  ariaAllowedAttr_description:
    'Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.',
  ariaAllowedAttr_summary_fail: '{{attr}} is not permitted on role="{{role}}".',
  ariaAllowedAttr_hint_fail: 'Remove this attribute, or use a role that supports it.',

  ariaProhibitedAttr_title: 'ARIA naming attributes must not be used on roles that prohibit them',
  ariaProhibitedAttr_description:
    'Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).',
  ariaProhibitedAttr_summary_fail: '{{attr}} is prohibited on role="{{role}}".',
  ariaProhibitedAttr_hint_fail:
    'Remove this attribute; this role must not carry an accessible name.',
  ariaProhibitedAttr_summary_fail_roleless:
    'This {{element}} has no role and no other accessible-name source, so {{attr}} is not reliably exposed to assistive technology.',
  ariaProhibitedAttr_hint_fail_roleless:
    'Give this element a role that supports an accessible name (e.g. role="img"/"button"), or remove this attribute if it serves no purpose without one.',
  ariaProhibitedAttr_summary_cantTell_roleless:
    "This {{element}} has no role, so {{attr}} may not be exposed as its accessible name by assistive technology — but the element's own content already provides one.",
  ariaProhibitedAttr_hint_cantTell_roleless:
    'Verify whether the existing text content already serves as this element\'s label; if so the naming attribute is redundant, otherwise give the element a role that supports naming (e.g. role="img").',

  ariaRequiredAttr_title: 'Roles with a required ARIA state/property must carry it',
  ariaRequiredAttr_description:
    'Checks that elements with an explicit role carry every unambiguous, context-independent required aria-* state/property for that role (e.g. role="checkbox" must have aria-checked).',
  ariaRequiredAttr_summary_fail: '{{attr}} is required for role="{{role}}", but is missing.',
  ariaRequiredAttr_hint_fail: 'Add this attribute with a valid value for this role.',

  ariaAllowedRole_title: 'Explicit role must be permitted for its host element',
  ariaAllowedRole_description:
    'Checks that an explicit role="" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role="tab" is not permitted on <nav>).',
  ariaAllowedRole_summary_fail: 'role="{{role}}" is not permitted on <{{element}}>.',
  ariaAllowedRole_hint_fail: 'Use a role permitted for this element, or change the host element.',

  ariaRequiredChildren_title: 'Container roles must own at least one required child role',
  ariaRequiredChildren_description:
    'Checks that container roles with a documented "required owned elements" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.',
  ariaRequiredChildren_summary_fail:
    'role="{{role}}" has no owned child with one of the required roles: {{requiredRoles}}.',
  ariaRequiredChildren_hint_fail:
    'Add a descendant (or aria-owns-referenced element) with one of the required owned roles.',

  ariaProhibitedChildren_title: 'Container roles must not own a child with a disallowed role',
  ariaProhibitedChildren_description:
    "Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles.",
  ariaProhibitedChildren_summary_fail:
    'This element has role="{{childRole}}", which is not an allowed owned child of the enclosing role="{{containerRole}}" container.',
  ariaProhibitedChildren_hint_fail:
    "Remove or change this role so it matches one of the container's allowed owned roles ({{allowedRoles}}), or move this element outside the {{containerRole}} container.",
  ariaProhibitedChildren_summary_fail_roleless:
    'This element has no explicit role but carries {{attr}}, making it a real accessible-tree node that is not an allowed owned child of the enclosing role="{{containerRole}}" container.',
  ariaProhibitedChildren_hint_fail_roleless:
    'Remove {{attr}} (or the role="{{containerRole}}" container ownership), or give this element role="presentation"/"none" if it isn\'t meant to be its own accessible-tree node.',
  ariaProhibitedChildren_summary_fail_native_focusable:
    'This element has no explicit role but is natively focusable, making it a real accessible-tree node that is not an allowed owned child of the enclosing role="{{containerRole}}" container.',
  ariaProhibitedChildren_hint_fail_native_focusable:
    'Give this element role="presentation"/"none", remove its native focusability (e.g. drop the href/tabindex-granting attribute), or move it outside the {{containerRole}} container.',

  ariaRequiredParent_title: 'Roles requiring a specific context role must be in that context',
  ariaRequiredParent_description:
    'Checks that roles with a documented "required context role" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.',
  ariaRequiredParent_summary_fail:
    'role="{{role}}" requires a context role of one of: {{requiredRoles}}, which was not found.',
  ariaRequiredParent_hint_fail:
    'Place this element inside (or aria-owns-reference it from) an element with an acceptable context role.',

  deprecatedElements_title: 'Obsolete non-stoppable elements (<blink>, <marquee>) must not be used',
  deprecatedElements_description:
    'Checks that deprecated, non-standard HTML elements whose blinking/scrolling content cannot be paused, stopped, or hidden by the user (<blink>, <marquee>) are not present.',
  deprecatedElements_summary_fail:
    '<{{element}}> content cannot be paused, stopped, or hidden by the user.',
  deprecatedElements_hint_fail:
    'Remove this element; use static content, or an animation with a user-facing pause/stop control, instead.',

  iframeNamePresent_title: 'Frames have an accessible name',
  iframeNamePresent_description:
    'Checks that <iframe>/<frame> elements expose a non-empty accessible name via aria-label, aria-labelledby, or the title attribute.',
  iframeNamePresent_summary_fail: 'This <{{element}}> has no accessible name.',
  iframeNamePresent_hint_fail:
    'Add a title attribute (or aria-label/aria-labelledby) describing the frame’s content or purpose.',

  iframeTitleUnique_title: 'Frame titles must be unique',
  iframeTitleUnique_description:
    'Checks that no two <iframe>/<frame> elements in scope share the same title attribute value.',
  iframeTitleUnique_summary_fail:
    'This <{{element}}>\'s title "{{title}}" is not unique among the frames on this page.',
  iframeTitleUnique_hint_fail:
    'Give each frame a distinct title describing its specific content or purpose.',

  iframeFocusableContent_title: 'Frames with tabindex="-1" must not contain focusable content',
  iframeFocusableContent_description:
    'Checks that same-origin <iframe>/<frame> elements with tabindex="-1" do not contain focusable content, since browsers do not propagate that restriction into the frame’s embedded document.',
  iframeFocusableContent_summary_fail:
    'This <{{element}}> has tabindex="-1" but its content contains focusable elements, which remain reachable by keyboard.',
  iframeFocusableContent_hint_fail:
    'Remove focusable content from the frame, or remove tabindex="-1" if the frame is meant to be reachable.',

  tableHeadersAttrValid_title: 'Table cell "headers" attribute must reference valid header cells',
  tableHeadersAttrValid_description:
    'Checks that each id in a <td>/<th> headers attribute resolves to a <th> element within the same table (not missing, not a non-th element, not itself).',
  tableHeadersAttrValid_summary_fail:
    "This <{{element}}>'s headers attribute references invalid header cell(s): {{invalidIds}}.",
  tableHeadersAttrValid_hint_fail:
    'Update the headers attribute so every id refers to a <th> element within the same table.',

  tableThHasDataCells_title: '<th> elements must describe at least one data cell',
  tableThHasDataCells_description:
    'Checks that a table containing <th> elements also contains at least one <td> data cell for those headers to describe.',
  tableThHasDataCells_summary_fail:
    'This table has header cells but no data cells for them to describe.',
  tableThHasDataCells_hint_fail:
    'Add data cells (<td>) to the table, or remove the header cells if the table has no data.',

  ariaHiddenBody_title: 'The document <body> must not be aria-hidden',
  ariaHiddenBody_description:
    'Checks that <body> does not have aria-hidden="true", which would remove the entire page from the accessibility tree.',
  ariaHiddenBody_summary_fail:
    'The document body has aria-hidden="true", which hides the entire page from assistive technologies.',
  ariaHiddenBody_hint_fail:
    'Remove aria-hidden from <body>. Hide specific elements instead, if that was the intent.',

  listChildrenValid_title: 'Lists must only directly contain list items',
  listChildrenValid_description:
    'Checks that <ul>/<ol> elements only have <li>, <script>, or <template> as direct children.',
  listChildrenValid_summary_fail:
    'This <{{element}}> contains a direct child that is not a list item: {{invalidChildren}}.',
  listChildrenValid_hint_fail:
    'Only use <li> (or <script>/<template>) as direct children of <ul>/<ol>; move other markup inside an <li>.',

  listitemParentValid_title: 'List items must be inside a list container',
  listitemParentValid_description:
    'Checks that <li> elements are contained by <ul>, <ol>, or an element with role="list".',
  listitemParentValid_summary_fail:
    "This list item's parent (<{{parentElement}}>) is not a list container.",
  listitemParentValid_hint_fail:
    'Place this <li> inside a <ul>/<ol>, or give its parent role="list".',

  definitionListChildrenValid_title: 'Description lists must be structured correctly',
  definitionListChildrenValid_description:
    'Checks that <dl> elements only directly contain <dt>/<dd> groups (optionally wrapped in one <div>), <script>, <template>, or <style>.',
  definitionListChildrenValid_summary_fail_invalidChild:
    'This description list contains a direct or wrapped child that is not part of a dt/dd group: {{invalidChildren}}.',
  definitionListChildrenValid_hint_fail_invalidChild:
    'Only use <dt>/<dd> (optionally wrapped in one <div>), <script>, <template>, or <style> inside <dl>.',
  definitionListChildrenValid_summary_fail_noDtDd:
    'This description list has no <dt>/<dd> term-definition group.',
  definitionListChildrenValid_hint_fail_noDtDd: 'Add at least one <dt>/<dd> pair inside this <dl>.',

  dlitemParentValid_title: 'Description-list items must be inside a description list',
  dlitemParentValid_description:
    'Checks that <dt>/<dd> elements are contained by a <dl>, directly or via one wrapping <div>.',
  dlitemParentValid_summary_fail:
    "This <{{element}}>'s parent (<{{parentElement}}>) is not a description list.",
  dlitemParentValid_hint_fail:
    'Place this <dt>/<dd> inside a <dl>, directly or wrapped in a single <div>.',

  duplicateIdAria_title: 'IDs referenced by ARIA must be unique',
  duplicateIdAria_description:
    'Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.',
  duplicateIdAria_summary_fail:
    'The id "{{id}}" is referenced by an ARIA attribute but is used by {{duplicateCount}} elements.',
  duplicateIdAria_hint_fail: 'Make ids referenced by ARIA attributes unique within the document.',

  summaryNamePresent_title: 'Summary elements have an accessible name',
  summaryNamePresent_description:
    'Checks that <summary> elements expose a non-empty accessible name.',
  summaryNamePresent_summary_fail: 'This summary has no accessible name.',
  summaryNamePresent_hint_fail:
    'Provide summary text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.',

  metaViewportZoomEnabled_title: 'Viewport meta tag must not disable zoom',
  metaViewportZoomEnabled_description:
    'Checks that <meta name="viewport"> does not set user-scalable=no or maximum-scale below 2 (200%).',
  metaViewportZoomEnabled_summary_fail:
    "This viewport meta tag restricts the user's ability to zoom ({{reasons}}).",
  metaViewportZoomEnabled_hint_fail:
    'Remove user-scalable=no and any maximum-scale below 2 from the viewport meta content.',

  metaRefreshTimingAbsent_title: 'Page must not use a timed meta refresh',
  metaRefreshTimingAbsent_description:
    'Checks that <meta http-equiv="refresh"> does not impose a positive delay of 20 hours or less.',
  metaRefreshTimingAbsent_summary_fail:
    'This page refreshes itself automatically after {{delay}} seconds.',
  metaRefreshTimingAbsent_hint_fail:
    'Remove the timed meta refresh, or provide a way for users to turn it off, extend it, or pause it before it triggers.',

  meterNamePresent_title: 'Meters have an accessible name',
  meterNamePresent_description:
    'Checks that elements with role="meter" expose a non-empty accessible name.',
  meterNamePresent_summary_fail: 'This meter has no accessible name.',
  meterNamePresent_hint_fail:
    "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this meter's accessible name.",

  progressbarNamePresent_title: 'Progress bars have an accessible name',
  progressbarNamePresent_description:
    'Checks that elements with role="progressbar" expose a non-empty accessible name.',
  progressbarNamePresent_summary_fail: 'This progress bar has no accessible name.',
  progressbarNamePresent_hint_fail:
    "Provide aria-label, aria-labelledby, or a title attribute — visible text content is not exposed as this progress bar's accessible name.",

  tooltipNamePresent_title: 'Tooltips have an accessible name',
  tooltipNamePresent_description:
    'Checks that elements with role="tooltip" expose a non-empty accessible name.',
  tooltipNamePresent_summary_fail: 'This tooltip has no accessible name.',
  tooltipNamePresent_hint_fail:
    'Provide tooltip text that is not hidden from assistive technologies, or provide aria-label or aria-labelledby.',

  serverSideImageMapAbsent_title: 'Images must not use a server-side image map',
  serverSideImageMapAbsent_description:
    'Checks that <img> elements do not carry the ismap attribute (server-side image maps have no keyboard-operable equivalent).',
  serverSideImageMapAbsent_summary_fail:
    'This image uses a server-side image map, which has no keyboard-operable equivalent.',
  serverSideImageMapAbsent_hint_fail:
    'Replace the server-side image map (ismap) with a client-side image map (<map>/<area>) or separate accessible links/buttons.',

  formControlSingleLabel_title: 'Form controls must not have multiple labels',
  formControlSingleLabel_description:
    'Checks that a form control is associated with at most one <label> (by wrapping or by label[for]).',
  formControlSingleLabel_summary_fail:
    'This <{{element}}> is associated with {{labelCount}} labels.',
  formControlSingleLabel_hint_fail:
    'Keep only one <label> per form control (either wrapping it or referencing it via for/id).',
  formControlSingleLabel_summary_cantTell:
    'This <{{element}}> has one labelling <label> plus an extra empty <label> association; verify how it is announced.',
  formControlSingleLabel_hint_cantTell:
    'Remove the redundant empty <label> so exactly one <label> is associated with the control.',

  nestedInteractiveControlsAbsent_title: 'Interactive controls must not be nested',
  nestedInteractiveControlsAbsent_description:
    'Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.',
  nestedInteractiveControlsAbsent_summary_fail:
    'This <{{element}}> contains one or more nested interactive controls: {{nestedElements}}.',
  nestedInteractiveControlsAbsent_hint_fail:
    'Move the nested interactive control(s) outside this element; nested interactive controls are not reliably operable via assistive technology.',

  bypassBlocksPresent_title: 'Page must provide a way to bypass repeated blocks',
  bypassBlocksPresent_description:
    'Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working same-page anchor link, or a heading.',
  bypassBlocksPresent_summary_cantTell:
    'No recognized way to bypass repeated blocks of content was detected on this page — verify a bypass mechanism exists.',
  bypassBlocksPresent_hint_cantTell:
    'Confirm the page offers a bypass mechanism: a main landmark (<main> or role="main"), a working "skip to content" link, or heading elements that assistive technology can use to jump past repeated content. (A mechanism may be temporarily hidden — e.g. while a modal dialog makes the page inert — or provided on a per-site basis; this needs human confirmation.)',

  landmarkBannerIsTopLevel_title: 'Banner landmark must be top-level',
  landmarkBannerIsTopLevel_description:
    'Checks that the banner landmark (role="banner" or a non-nested <header>) is not nested inside another landmark region.',
  landmarkBannerIsTopLevel_summary_cantTell:
    'This banner landmark is nested inside another landmark region.',
  landmarkBannerIsTopLevel_hint_cantTell:
    'Move the banner landmark (header/role="banner") so it is not contained by another landmark; a banner should be a top-level region of the page.',

  landmarkContentinfoIsTopLevel_title: 'Contentinfo landmark must be top-level',
  landmarkContentinfoIsTopLevel_description:
    'Checks that the contentinfo landmark (role="contentinfo" or a non-nested <footer>) is not nested inside another landmark region.',
  landmarkContentinfoIsTopLevel_summary_cantTell:
    'This contentinfo landmark is nested inside another landmark region.',
  landmarkContentinfoIsTopLevel_hint_cantTell:
    'Move the contentinfo landmark (footer/role="contentinfo") so it is not contained by another landmark; contentinfo should be a top-level region of the page.',

  landmarkMainIsTopLevel_title: 'Main landmark must be top-level',
  landmarkMainIsTopLevel_description:
    'Checks that the main landmark (role="main" or <main>) is not nested inside another landmark region.',
  landmarkMainIsTopLevel_summary_cantTell:
    'This main landmark is nested inside another landmark region.',
  landmarkMainIsTopLevel_hint_cantTell:
    'Move the main landmark (<main>/role="main") so it is not contained by another landmark; main should be a top-level region of the page.',

  landmarkNoDuplicateBanner_title: 'Page must not have more than one banner landmark',
  landmarkNoDuplicateBanner_description:
    'Checks that at most one banner landmark (role="banner" or a non-nested <header>) exists on the page.',
  landmarkNoDuplicateBanner_summary_cantTell: 'This page has more than one banner landmark.',
  landmarkNoDuplicateBanner_hint_cantTell:
    'Keep only one banner landmark (header/role="banner") per page.',

  landmarkNoDuplicateContentinfo_title: 'Page must not have more than one contentinfo landmark',
  landmarkNoDuplicateContentinfo_description:
    'Checks that at most one contentinfo landmark (role="contentinfo" or a non-nested <footer>) exists on the page.',
  landmarkNoDuplicateContentinfo_summary_cantTell:
    'This page has more than one contentinfo landmark.',
  landmarkNoDuplicateContentinfo_hint_cantTell:
    'Keep only one contentinfo landmark (footer/role="contentinfo") per page.',

  landmarkNoDuplicateMain_title: 'Page must not have more than one main landmark',
  landmarkNoDuplicateMain_description:
    'Checks that at most one main landmark (role="main" or <main>) exists on the page.',
  landmarkNoDuplicateMain_summary_cantTell: 'This page has more than one main landmark.',
  landmarkNoDuplicateMain_hint_cantTell:
    'Keep only one main landmark (<main>/role="main") per page.',

  landmarkOneMain_title: 'Page should have a main landmark',
  landmarkOneMain_description:
    'Checks that the page has at least one main landmark (role="main" or <main>).',
  landmarkOneMain_summary_cantTell_missing: 'This page has no main landmark.',
  landmarkOneMain_hint_cantTell_missing:
    'Add a main landmark (<main> or role="main") around the page\'s primary content.',

  landmarkUnique_title: 'Landmarks with the same role must have unique names',
  landmarkUnique_description:
    'Checks that when two or more landmarks share the same role, each has a distinct accessible name.',
  landmarkUnique_summary_cantTell_duplicateName:
    'This {{role}} landmark shares its accessible name with another {{role}} landmark.',
  landmarkUnique_summary_cantTell_bothUnnamed:
    'This {{role}} landmark has no accessible name, and more than one unnamed {{role}} landmark exists on this page.',
  landmarkUnique_hint_cantTell:
    'Give each {{role}} landmark a distinct name via aria-label or aria-labelledby.',

  emptyHeading_title: 'Headings must not be empty',
  emptyHeading_description:
    'Checks that heading elements (<h1>-<h6> or role="heading") have a non-empty accessible name.',
  emptyHeading_summary_cantTell: 'This heading has no accessible name.',
  emptyHeading_hint_cantTell:
    'Add text content (or aria-label/aria-labelledby) to this heading, or remove it if it is not needed.',

  headingOrder_title: 'Heading levels must not skip a level',
  headingOrder_description:
    'Checks that heading levels increase by at most one at a time in document order.',
  headingOrder_summary_cantTell:
    'This heading jumps from level {{fromLevel}} to level {{toLevel}}, skipping a level.',
  headingOrder_hint_cantTell:
    'Use consecutive heading levels (do not skip a level when going deeper) so the document outline stays predictable.',

  pageHasHeadingOne_title: 'Page should have a level-one heading',
  pageHasHeadingOne_description:
    'Checks that the page has at least one level-one heading (<h1> or role="heading" with aria-level="1").',
  pageHasHeadingOne_summary_cantTell: 'This page has no level-one heading.',
  pageHasHeadingOne_hint_cantTell:
    'Add a level-one heading (<h1> or role="heading" aria-level="1") that identifies the page\'s main content.',

  accesskeys_title: 'accesskey values must be unique',
  accesskeys_description:
    'Checks that no two elements on the page share the same accesskey attribute value.',
  accesskeys_summary_cantTell:
    "This element's accesskey is shared with another element on the page.",
  accesskeys_hint_cantTell: 'Make each accesskey value unique across the page.',

  scopeAttrValid_title: 'scope attribute must have a valid value',
  scopeAttrValid_description: 'Checks that scope="..." is one of row, col, rowgroup, or colgroup.',
  scopeAttrValid_summary_cantTell: 'This scope attribute value is not recognized.',
  scopeAttrValid_hint_cantTell:
    'Use one of row, col, rowgroup, or colgroup for the scope attribute.',

  tabindex_title: 'tabindex should not be greater than 0',
  tabindex_description: 'Checks that tabindex values are 0 or negative, not a positive number.',
  tabindex_summary_cantTell:
    'This element has a positive tabindex, overriding the natural tab order.',
  tabindex_hint_cantTell:
    'Use tabindex="0" (or a negative value to remove from tab order) instead of a positive number; fix the DOM order if a different tab order is needed.',

  emptyTableHeader_title: 'Table header cells must not be empty',
  emptyTableHeader_description:
    'Checks that <th> elements have visible text content — a header named only via aria-label/aria-labelledby is also flagged, since real screen-reader/browser support for that is inconsistent.',
  emptyTableHeader_summary_cantTell: 'This table header cell has no accessible name.',
  emptyTableHeader_hint_cantTell:
    'Add text content (or aria-label/aria-labelledby) to this header cell, or remove it if it is not needed.',
  emptyTableHeader_summary_cantTell_ariaOnly:
    'This table header cell has no visible text — its only accessible name comes from aria-label/aria-labelledby, which real screen-reader/browser combinations (e.g. NVDA+Firefox, iOS VoiceOver+Safari) are known to ignore on <th> elements.',
  emptyTableHeader_hint_cantTell_ariaOnly:
    'Add visible text content to this header cell (in addition to, or instead of, aria-label/aria-labelledby) — visible text is the only naming mechanism confirmed to work across tested screen readers.',

  labelTitleOnly_title: 'Form controls should not use title as their only label',
  labelTitleOnly_description:
    'Checks that a form control with a title attribute also has a real label (label element, aria-label, or aria-labelledby).',
  labelTitleOnly_summary_cantTell:
    'This form control relies on the title attribute as its only label.',
  labelTitleOnly_hint_cantTell:
    'Add a visible <label> (or aria-label/aria-labelledby) in addition to, or instead of, the title attribute.',

  imageRedundantAlt_title: 'Image alt text must not duplicate adjacent visible text',
  imageRedundantAlt_description:
    'Checks that an <img> alt text is not identical to other visible text already present in its immediate parent element.',
  imageRedundantAlt_summary_cantTell:
    "This image's alt text duplicates other visible text right next to it.",
  imageRedundantAlt_hint_cantTell:
    'Make the alt text empty (alt="") if the image is purely decorative alongside the text, or remove the redundant duplication.',

  tableDuplicateName_title: 'Table caption must not duplicate its summary attribute',
  tableDuplicateName_description:
    "Checks that a <table>'s <caption> text is not identical to its (deprecated) summary attribute.",
  tableDuplicateName_summary_cantTell: "This table's caption duplicates its summary attribute.",
  tableDuplicateName_hint_cantTell:
    'Remove the redundant summary attribute, or make it provide different information than the caption.',

  metaViewportLarge_title: 'Viewport meta tag should allow zooming up to 500%',
  metaViewportLarge_description:
    'Checks that <meta name="viewport"> does not set user-scalable=no or maximum-scale below 5 (500%).',
  metaViewportLarge_summary_cantTell:
    'This viewport meta tag restricts zoom below the 500% best-practice target.',
  metaViewportLarge_hint_cantTell:
    'Remove user-scalable=no and raise maximum-scale to at least 5 (500%) if possible.',

  presentationRoleConflict_title:
    'Presentational role must not conflict with a global ARIA attribute or focusability',
  presentationRoleConflict_description:
    'Checks that role="presentation"/"none" (including an <img alt=""> implicit presentation role) is not combined with a global ARIA attribute (aria-label, aria-hidden, aria-describedby, ...) or focusability (tabindex/native).',
  presentationRoleConflict_summary_cantTell:
    'This role="{{role}}" element also has a conflicting condition ({{attrs}}), which restores its implicit role and cancels the presentational intent.',
  presentationRoleConflict_hint_cantTell:
    'Remove the conflicting naming attribute(s) and/or focusability (tabindex/native) if the element should stay presentational, or remove role="presentation"/"none" if it should be exposed to assistive technology.',

  region_title: 'Page content should be inside a landmark region',
  region_description: 'Checks that content under <body> is contained within a landmark region.',
  region_summary_cantTell: 'This content is not contained within a landmark region.',
  region_hint_cantTell:
    'Move this content inside a landmark region (main, nav, aside, a labeled section, etc.).',

  skipLink_title: 'Skip link must have a resolvable, usable target',
  skipLink_description:
    'Checks that a "skip to ..." link\'s href fragment resolves to a real, currently usable element in the document.',
  skipLink_summary_cantTell: "This skip link's target does not exist.",
  skipLink_hint_cantTell:
    "Point the skip link's href at an id that exists in the document, or add the missing target element.",
  skipLink_summary_unusableTarget_cantTell:
    'This skip link points to a target that exists but is not currently usable.',
  skipLink_hint_unusableTarget_cantTell:
    'Point this skip link to a target that is exposed and usable as a navigation destination.',

  autocompleteValid_title: 'autocomplete attribute must be a valid autofill value',
  autocompleteValid_description:
    'Checks that a non-empty autocomplete attribute is "on"/"off" or a well-formed autofill detail token list.',
  autocompleteValid_summary_fail:
    'This autocomplete attribute value is not a valid autofill value.',
  autocompleteValid_hint_fail:
    'Use "on"/"off", or a valid autofill token list (e.g. "shipping street-address", "cc-number").',

  htmlXmlLangMismatch_title: 'lang and xml:lang must not disagree',
  htmlXmlLangMismatch_description:
    "Checks that the <html> element's lang and xml:lang attributes declare the same primary language, when both are present.",
  htmlXmlLangMismatch_summary_fail:
    'The lang ("{{lang}}") and xml:lang ("{{xmlLang}}") attributes declare different languages.',
  htmlXmlLangMismatch_hint_fail:
    'Make lang and xml:lang declare the same primary language, or remove the deprecated xml:lang attribute.',

  avoidInlineSpacing_title: 'Inline style must not force text spacing below the WCAG metric',
  avoidInlineSpacing_description:
    'Checks that where inline style forces line-height, letter-spacing or word-spacing with !important, the value already meets WCAG 1.4.12, so the user has nothing left to override.',
  avoidInlineSpacing_summary_fail:
    "This element's inline style forces {{properties}} with !important, blocking user text-spacing overrides.",
  avoidInlineSpacing_hint_fail:
    'Remove !important from line-height/letter-spacing/word-spacing in inline styles so users can override text spacing.',

  metaRefreshNoExceptions_title: 'Page must not use a meta refresh at all (AAA)',
  metaRefreshNoExceptions_description:
    'Checks that <meta http-equiv="refresh"> is not present at all, regardless of delay — the stricter AAA-level counterpart of the A-level positive-delay-only check.',
  metaRefreshNoExceptions_summary_fail:
    'This page uses a meta refresh, which is an automatic context change not initiated by the user.',
  metaRefreshNoExceptions_hint_fail:
    'Remove the meta refresh; trigger the redirect/refresh only in response to a user action instead.',

  validLang_title: 'Element lang attribute must be syntactically valid',
  validLang_description:
    'Checks that any element (other than the root <html>) with a non-empty lang attribute uses a syntactically valid language tag.',
  validLang_summary_fail:
    'This lang attribute value ("{{value}}") is not a syntactically valid language tag.',
  validLang_hint_fail: 'Use a valid BCP47 language tag (e.g. "fr", "es-MX").',

  linkInTextBlock_title:
    'Links in text blocks must be distinguishable from surrounding text without relying on color alone',
  linkInTextBlock_description:
    'Checks that a link inside a run of text is visually distinguishable from the surrounding text by underline, a font-weight/style difference, or a sufficient (>=3:1) color-contrast difference — not by color alone.',
  linkInTextBlock_summary_fail:
    'This link in a block of text relies on color alone to be distinguished from the surrounding text.',
  linkInTextBlock_hint_fail:
    'Add an underline, a font-weight/style difference, or increase the color contrast between the link and surrounding text to at least 3:1.',

  noAutoplayAudio_title:
    'Autoplaying audio should provide a pause/stop or volume-control mechanism',
  noAutoplayAudio_description:
    'Flags <audio>/<video> elements that autoplay unmuted with no native controls attribute, for manual review against the 3-second exemption in WCAG 1.4.2.',
  noAutoplayAudio_summary_cantTell:
    'This element autoplays audio without a native pause/stop or volume-control mechanism.',
  noAutoplayAudio_hint_cantTell:
    'If this clip plays for more than 3 seconds, add a controls attribute (or an equivalent custom mechanism) so users can pause/stop it or control its volume independently of the system volume.',

  videoCaption_title: 'Prerecorded video should provide a captions track',
  videoCaption_description:
    'Flags <video> elements with no <track kind="captions"|"subtitles"> child, for manual review of whether the video has an audio track that needs captions.',
  videoCaption_summary_cantTell: 'This video has no captions (or subtitles) track.',
  videoCaption_hint_cantTell:
    'If this video has an audio track that conveys information, add a <track kind="captions" src="..."> with the captioned content.',

  scrollableRegionFocusable_title:
    'Scrollable regions with no focusable content should be keyboard-focusable',
  scrollableRegionFocusable_description:
    'Flags elements whose CSS declares overflow:auto/scroll, contain no focusable descendant, and are not themselves keyboard-focusable, for manual review of whether their content actually overflows and needs keyboard scroll access.',
  scrollableRegionFocusable_summary_cantTell:
    'This element declares overflow:auto/scroll, has no focusable descendant, and is not itself keyboard-focusable.',
  scrollableRegionFocusable_hint_cantTell:
    'If this region\'s content actually overflows, add tabindex="0" (and a suitable label) so keyboard users can focus it and scroll with the arrow keys.',

  identicalLinksSamePurpose_title:
    'Links with the same accessible name should lead to the same destination',
  identicalLinksSamePurpose_description:
    'Flags groups of links that share the same accessible name but resolve to more than one distinct destination, for manual review of whether they serve the same purpose.',
  identicalLinksSamePurpose_summary_cantTell:
    'This link shares an accessible name with other links on the page that lead to a different destination.',
  identicalLinksSamePurpose_hint_cantTell:
    'Ensure links with the same text serve the same purpose, or make the link text distinct enough to describe each destination.',

  ariaBrailleEquivalent_title:
    'aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent',
  ariaBrailleEquivalent_description:
    'Checks that elements using aria-braillelabel also have a regular accessible name, and elements using aria-brailleroledescription also have aria-roledescription.',
  ariaBrailleEquivalent_summary_fail:
    'This element has {{attr}} but no {{requires}}, its non-braille equivalent.',
  ariaBrailleEquivalent_hint_fail:
    '{{attr}} is a Braille-specific supplement, not a replacement — also provide {{requires}}.',

  ariaConditionalAttr_title:
    'aria-errormessage requires aria-invalid to be set to a non-false value',
  ariaConditionalAttr_description:
    'Checks that elements with aria-errormessage also have aria-invalid set to "true", "grammar", or "spelling" — otherwise the error message is dropped from the accessibility tree.',
  ariaConditionalAttr_summary_fail:
    'This element has aria-errormessage but aria-invalid is missing or "false", so the error message is not exposed.',
  ariaConditionalAttr_hint_fail:
    'Set aria-invalid to "true" (or "grammar"/"spelling") whenever aria-errormessage should be exposed to assistive technology.',

  ariaCheckedStateMismatch_title:
    'Native checkbox/radio aria-checked should match its actual state',
  ariaCheckedStateMismatch_description:
    'Flags a native <input type="checkbox">/<input type="radio"> whose explicit aria-checked value disagrees with its actual checked/indeterminate state, for manual review.',
  ariaCheckedStateMismatch_summary_cantTell:
    'This element’s aria-checked value does not match its actual checked/indeterminate state.',
  ariaCheckedStateMismatch_hint_cantTell:
    'Set aria-checked to match the element’s real state, or remove it — a native checkbox/radio already exposes this state without it.',

  cssOrientationLock_title: 'CSS must not lock the page to a single orientation',
  cssOrientationLock_description:
    'Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation.',
  cssOrientationLock_summary_fail:
    'A "{{mediaText}}" media query rotates "{{selectorText}}", locking the page to one orientation.',
  cssOrientationLock_hint_fail:
    'Remove the rotate() transform from the orientation media query; let the page respond naturally to device orientation instead of forcing a visual rotation.',

  ariaText_title: 'role="text" elements should have no focusable descendants',
  ariaText_description:
    'Checks that elements with role="text" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).',
  ariaText_summary_cantTell: 'This role="text" element contains a focusable descendant.',
  ariaText_hint_cantTell:
    'Remove role="text" (or remove the focusable descendant) — a "plain text" region should not contain focusable content.',

  focusOrderSemantics_title: 'Elements added to the tab order should have interactive semantics',
  focusOrderSemantics_description:
    'Flags elements with tabindex >= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, region, presentation), for manual review.',
  focusOrderSemantics_summary_cantTell:
    'This element is in the tab order (tabindex="{{tabindex}}") but has a non-interactive role ("{{role}}").',
  focusOrderSemantics_hint_cantTell:
    'Remove tabindex if this element is not meant to be interactive, or use an interactive role that matches its actual behavior.',

  pAsHeading_title: 'A <p> styled to look like a heading should probably be a real heading',
  pAsHeading_description:
    'Flags short <p> elements whose entire text is bold and rendered at >=18px, for manual review of whether a real heading element should be used instead.',
  pAsHeading_summary_cantTell:
    'This paragraph is entirely bold and rendered at a heading-like size.',
  pAsHeading_hint_cantTell:
    'If this text introduces a new section, use a real heading element (<h1>-<h6> or role="heading") instead of styling a paragraph to look like one.',

  tableFakeCaption_title: "A table's first row should not stand in for a real <caption>",
  tableFakeCaption_description:
    'Flags tables with no <caption> whose first row has a single non-empty cell while other rows have multiple cells, for manual review of whether that cell is acting as a fake caption.',
  tableFakeCaption_summary_cantTell:
    'This table has no <caption>, but its first row is a single cell sitting above multi-cell rows — it may be acting as a fake caption.',
  tableFakeCaption_hint_cantTell:
    'If this cell is meant to describe the table, use a real <caption> element instead of a lone first-row cell.',

  tdHasHeader_title: 'Data cells in large tables must have an associated header',
  tdHasHeader_description:
    'Checks that every <td> in a large, simple (no colspan/rowspan) table has an associated header — via a headers attribute, an implicit column <th> above it, or an implicit row <th> to its left.',
  tdHasHeader_summary_fail:
    'This data cell has no associated header (no headers attribute, no column <th> above it, no row <th> to its left).',
  tdHasHeader_hint_fail:
    'Add a headers attribute referencing the relevant <th> id(s), or restructure the table so this cell has an implicit row/column header.',

  mouseOnlyEventHandlers_title:
    'Pointer-only inline event handlers should have a keyboard-reachable equivalent',
  mouseOnlyEventHandlers_description:
    'Flags elements with an inline pointer-only event handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave) and no keyboard-reachable equivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), for manual review.',
  mouseOnlyEventHandlers_summary_cantTell:
    'This element has {{attrs}} but no keyboard-reachable equivalent handler.',
  mouseOnlyEventHandlers_hint_cantTell:
    'Add onkeydown/onkeyup/onkeypress (or onfocus/onblur for hover-triggered behavior) so this functionality is also reachable by keyboard.',

  linkNameQuality_title: 'Link text should be descriptive, not generic',
  linkNameQuality_description:
    'Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more"), for manual review of whether the purpose is clear without additional context.',
  linkNameQuality_summary_cantTell:
    'This link\'s accessible name ("{{name}}") is a generic, non-descriptive phrase.',
  linkNameQuality_hint_cantTell:
    'Make the link text itself describe its destination/purpose (e.g. "Download the 2026 pricing guide" instead of "Download"), or confirm the surrounding context already makes the purpose clear.'
};
