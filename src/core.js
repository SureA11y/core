'use strict';

const ENGINE_TAG = "a11ycore";
const SCHEMA_VERSION = "1.0.0";

// Rule catalog (data only)
const RULE_DEFS = [
  {
    "ruleId": "a11ycore-area-alt-decorative",
    "title": "<area> with alt=\"\" must be decorative (manual review)",
    "description": "Flags <area> elements with empty alt for human review that they are decorative/non-informative.",
    "i18n": {
      "titleKey": "a11ycore_area_altDecorative_title",
      "descriptionKey": "a11ycore_area_altDecorative_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "imagemap",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-area-alt-present",
    "title": "&lt;area&gt; must have an alt attribute",
    "description": "Checks that &lt;area&gt; elements provide an alt attribute to support a text alternative mechanism.",
    "i18n": {
      "titleKey": "a11ycore_area_altPresent_title",
      "descriptionKey": "a11ycore_area_altPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "imagemap",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "area-alt-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-area-alt-quality",
    "title": "<area> alt text must be appropriate (manual review)",
    "description": "Flags <area> elements with non-empty alt text for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_area_altQuality_title",
      "descriptionKey": "a11ycore_area_altQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "imagemap",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-aria-hidden-programmatic-focus-review",
    "title": "Review aria-hidden programmatic focus",
    "description": "Flags elements that are aria-hidden but programmatically focusable (tabindex < 0). Verify intended focus management and assistive technology exposure.",
    "i18n": {
      "titleKey": "a11ycore_ariaHidden_programmaticFocus_review_title",
      "descriptionKey": "a11ycore_ariaHidden_programmaticFocus_review_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag412",
      "focus",
      "aria",
      "atomic",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [],
    "defaultSeverity": "moderate",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": null,
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "robust",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-canvas-text-alternative-present",
    "title": "<canvas> must provide a text alternative",
    "description": "Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.",
    "i18n": {
      "titleKey": "a11ycore_canvas_textAltPresent_title",
      "descriptionKey": "a11ycore_canvas_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "canvas",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "canvas-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-canvas-text-alternative-quality",
    "title": "<canvas> text alternative must be appropriate (manual review)",
    "description": "Flags <canvas> elements with a detected text alternative for human review of equivalence and appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_canvas_textAltQuality_title",
      "descriptionKey": "a11ycore_canvas_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "canvas",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-contrast-computable",
    "title": "Color contrast is computable for rendered text",
    "description": "Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).",
    "i18n": {
      "titleKey": "a11ycore_contrastComputable_title",
      "descriptionKey": "a11ycore_contrastComputable_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag2aa",
      "wcag2aaa",
      "wcag143",
      "wcag146",
      "contrast",
      "color",
      "structure",
      "atomic",
      "automatic",
      "dom",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.3",
        "title": "Contrast (Minimum)",
        "conformanceLevel": "AA"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.6",
        "title": "Contrast (Enhanced)",
        "conformanceLevel": "AAA"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "minor",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.4.3": [
          "contrast-computability-143"
        ],
        "1.4.6": [
          "contrast-computability-146"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-contrast-enhanced",
    "title": "Text meets enhanced color contrast (AAA)",
    "description": "Checks that visible text has a contrast ratio of at least 7:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.",
    "i18n": {
      "titleKey": "a11ycore_contrastEnhanced_title",
      "descriptionKey": "a11ycore_contrastEnhanced_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2aaa",
      "wcag146",
      "contrast",
      "color",
      "structure",
      "atomic",
      "automatic",
      "dom",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.6",
        "title": "Contrast (Enhanced)",
        "conformanceLevel": "AAA"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.4.6": [
          "contrast-enhanced-text"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-contrast-minimum",
    "title": "Text meets minimum color contrast (AA)",
    "description": "Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3:1 (large), when contrast is computable from CSS.",
    "i18n": {
      "titleKey": "a11ycore_contrastMinimum_title",
      "descriptionKey": "a11ycore_contrastMinimum_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2aa",
      "wcag143",
      "contrast",
      "color",
      "structure",
      "atomic",
      "automatic",
      "dom",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.3",
        "title": "Contrast (Minimum)",
        "conformanceLevel": "AA"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.4.3": [
          "contrast-minimum-text"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-embed-text-alternative-present",
    "title": "<embed> must provide a text alternative",
    "description": "Checks that <embed> elements provide a text alternative via an accessible name.",
    "i18n": {
      "titleKey": "a11ycore_embed_textAltPresent_title",
      "descriptionKey": "a11ycore_embed_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "embed",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "embed-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-embed-text-alternative-quality",
    "title": "<embed> text alternative must be appropriate (manual review)",
    "description": "Flags <embed> elements with a detected name for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_embed_textAltQuality_title",
      "descriptionKey": "a11ycore_embed_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "embed",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-form-control-programmatic-label-present",
    "title": "Form controls must have a programmatic label",
    "description": "Checks that form controls have a programmatic label via <label>, aria-label, aria-labelledby, title, or placeholder.",
    "i18n": {
      "titleKey": "a11ycore_formControl_programmaticLabelPresent_title",
      "descriptionKey": "a11ycore_formControl_programmaticLabelPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag131",
      "wcag332",
      "wcag412",
      "forms",
      "labels",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "4.1.2",
        "title": "Name, Role, Value",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "4.1.2": [
          "form-control-name-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "robust",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-form-control-programmatic-label-quality",
    "title": "Form controls should not rely on placeholder or title as the primary label",
    "description": "Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer <label> or aria-labelledby.",
    "i18n": {
      "titleKey": "a11ycore_formControl_programmaticLabelQuality_title",
      "descriptionKey": "a11ycore_formControl_programmaticLabelQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag412",
      "forms",
      "labels",
      "quality",
      "atomic",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "4.1.2",
        "title": "Name, Role, Value",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "moderate",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "4.1.2": [
          "form-control-name-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "robust",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-html-lang-attr-present",
    "title": "Page language is declared",
    "description": "Checks that the default language of the page is programmatically declared.",
    "i18n": {
      "titleKey": "a11ycore_html_lang_attr_title",
      "descriptionKey": "a11ycore_html_lang_attr_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag311",
      "structure",
      "language",
      "automatic",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "3.1.1",
        "title": "Language of Page",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "3.1.1": [
          "html-lang-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "understandable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-img-alt-decorative",
    "title": "<img> with alt=\"\" must be decorative (manual review)",
    "description": "Flags <img> elements with empty alt for human review that they are purely decorative.",
    "i18n": {
      "titleKey": "a11ycore_img_altDecorative_title",
      "descriptionKey": "a11ycore_img_altDecorative_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-img-alt-present",
    "title": "<img> must have an alt attribute",
    "description": "Checks that <img> elements provide an alt attribute to support a text alternative mechanism.",
    "i18n": {
      "titleKey": "a11ycore_img_altPresent_title",
      "descriptionKey": "a11ycore_img_altPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "img-alt-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-img-alt-quality",
    "title": "<img> alt text must be appropriate (manual review)",
    "description": "Flags <img> elements with non-empty alt text for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_img_altQuality_title",
      "descriptionKey": "a11ycore_img_altQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-input-image-alt-decorative",
    "title": "<input type=\"image\"> with alt=\"\" must be appropriate (manual review)",
    "description": "Flags <input type=\"image\"> elements with empty alt for human review (usually not appropriate for functional controls).",
    "i18n": {
      "titleKey": "a11ycore_inputImage_altDecorative_title",
      "descriptionKey": "a11ycore_inputImage_altDecorative_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "forms",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-input-image-alt-present",
    "title": "<input type=\"image\"> must have an alt attribute",
    "description": "Checks that <input type=\"image\"> elements provide an alt attribute to support a text alternative mechanism.",
    "i18n": {
      "titleKey": "a11ycore_inputImage_altPresent_title",
      "descriptionKey": "a11ycore_inputImage_altPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "input-image-alt-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-input-image-alt-quality",
    "title": "<input type=\"image\"> alt text must be appropriate (manual review)",
    "description": "Flags <input type=\"image\"> elements with non-empty alt text for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_inputImage_altQuality_title",
      "descriptionKey": "a11ycore_inputImage_altQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "forms",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-manual-review",
    "title": "Manual review: keyboard navigation and focus order",
    "description": "Flags that a manual review of keyboard navigation and focus order is required.",
    "i18n": {
      "titleKey": "a11ycore_manualReview_title",
      "descriptionKey": "a11ycore_manualReview_description"
    },
    "helpUrl": "",
    "tags": [
      "manual",
      "wcag2a",
      "wcag2aa",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.1.1",
        "title": "Keyboard",
        "conformanceLevel": "A",
        "url": "https://www.w3.org/TR/WCAG22/#keyboard"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.3",
        "title": "Focus Order",
        "conformanceLevel": "A",
        "url": "https://www.w3.org/TR/WCAG22/#focus-order"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.7",
        "title": "Focus Visible",
        "conformanceLevel": "AA",
        "url": "https://www.w3.org/TR/WCAG22/#focus-visible"
      },
      {
        "standard": "EN 301 549",
        "version": "V3.2.1",
        "requirement": "9.2.1.1",
        "title": "Keyboard"
      },
      {
        "standard": "EN 301 549",
        "version": "V3.2.1",
        "requirement": "9.2.4.3",
        "title": "Focus Order"
      },
      {
        "standard": "EN 301 549",
        "version": "V3.2.1",
        "requirement": "9.2.4.7",
        "title": "Focus Visible"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "type": "Understanding",
        "requirement": "2.1.1",
        "title": "Understanding Keyboard",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "type": "Understanding",
        "requirement": "2.4.3",
        "title": "Understanding Focus Order",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "type": "Understanding",
        "requirement": "2.4.7",
        "title": "Understanding Focus Visible",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
      }
    ],
    "defaultSeverity": "moderate",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": null,
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "operable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-media-alternative-transcript-evidence",
    "title": "Time-based media: transcript / media alternative evidence",
    "description": "Finds <audio>/<video> elements where a transcript or other text alternative is not strongly evidenced in-page. This rule is conservative and returns cantTell when evidence is missing or unverified.",
    "i18n": {
      "titleKey": "a11ycore_mediaTranscriptPresent_title",
      "descriptionKey": "a11ycore_mediaTranscriptPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag121",
      "timebasedmedia",
      "atomic",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.2.1",
        "title": "Audio-only and Video-only (Prerecorded)",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "moderate",
    "defaultConfidence": "low",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.2.1": [
          "transcript-evidence"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-object-text-alternative-present",
    "title": "<object> must provide a text alternative",
    "description": "Checks that <object> elements provide a text alternative via fallback content or an accessible name.",
    "i18n": {
      "titleKey": "a11ycore_object_textAltPresent_title",
      "descriptionKey": "a11ycore_object_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "object",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "object-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-object-text-alternative-quality",
    "title": "<object> text alternative must be appropriate (manual review)",
    "description": "Flags <object> elements with detected fallback or name for human review of equivalence and appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_object_textAltQuality_title",
      "descriptionKey": "a11ycore_object_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "object",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-page-title-patterns",
    "title": "Page title patterns that may indicate low descriptiveness",
    "description": "Flags page titles that are likely too generic or templated as review signals (WCAG 2.2 SC 2.4.2). This rule is conservative and does not fail based on patterns alone.",
    "i18n": {
      "titleKey": "a11ycore_pageTitlePatterns_title",
      "descriptionKey": "a11ycore_pageTitlePatterns_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag242",
      "titles",
      "atomic",
      "navigation",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.2",
        "title": "Page Titled",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "2.4.2": [
          "page-title-patterns"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "operable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-page-title-present",
    "title": "Page title is present and non-empty",
    "description": "Checks that the document has a non-empty <title> element (WCAG 2.2 SC 2.4.2).",
    "i18n": {
      "titleKey": "a11ycore_pageTitlePresent_title",
      "descriptionKey": "a11ycore_pageTitlePresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag242",
      "titles",
      "atomic",
      "navigation",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.2",
        "title": "Page Titled",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "2.4.2": [
          "page-title-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "operable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-role-img-text-alternative-present",
    "title": "[role=\"img\"] must have an accessible text alternative",
    "description": "Checks that elements with role=\"img\" provide an accessible text alternative via aria-label or aria-labelledby.",
    "i18n": {
      "titleKey": "a11ycore_roleImg_textAlternativePresent_title",
      "descriptionKey": "a11ycore_roleImg_textAlternativePresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "aria",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "role-img-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-svg-image-text-alternative-present",
    "title": "SVG <image> must have a text alternative",
    "description": "Checks that SVG <image> elements provide a text alternative via <title>/<desc> or an ARIA accessible name.",
    "i18n": {
      "titleKey": "a11ycore_svgImage_textAltPresent_title",
      "descriptionKey": "a11ycore_svgImage_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "svg",
      "image",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "svg-image-text-alt-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-svg-text-alternative-present",
    "title": "<svg> must provide a text alternative",
    "description": "Checks that inline <svg> elements provide a text alternative via <title>/<desc> or an ARIA name.",
    "i18n": {
      "titleKey": "a11ycore_svg_textAltPresent_title",
      "descriptionKey": "a11ycore_svg_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "svg",
      "nontext",
      "images",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "svg-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-svg-text-alternative-quality",
    "title": "<svg> text alternative must be appropriate (manual review)",
    "description": "Flags applicable <svg> graphics with a detected text alternative for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_svg_textAltQuality_title",
      "descriptionKey": "a11ycore_svg_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "svg",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-video-poster-text-alternative-present",
    "title": "<video> poster must have a text alternative",
    "description": "Checks that <video> elements with a poster image provide a text alternative (accessible name or fallback text).",
    "i18n": {
      "titleKey": "a11ycore_videoPoster_textAltPresent_title",
      "descriptionKey": "a11ycore_videoPoster_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "media",
      "video",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "video-poster-text-alt-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  }
];

// Node/runtime rule implementations (normalized)
const RULE_IMPLS = {
  "a11ycore-area-alt-decorative": { run: require("./rules/manual/area-alt-decorative-manual.js").runInPage, applicability: require("./rules/manual/area-alt-decorative-manual.js").applicability || null },
  "a11ycore-area-alt-present": { run: require("./rules/automatic/area-alt-present.js").runInPage, applicability: require("./rules/automatic/area-alt-present.js").applicability || null },
  "a11ycore-area-alt-quality": { run: require("./rules/manual/area-alt-quality-manual.js").runInPage, applicability: require("./rules/manual/area-alt-quality-manual.js").applicability || null },
  "a11ycore-aria-hidden-programmatic-focus-review": { run: require("./rules/aria-hidden-programmatic-focus-review.js").runInPage, applicability: require("./rules/aria-hidden-programmatic-focus-review.js").applicability || null },
  "a11ycore-canvas-text-alternative-present": { run: require("./rules/automatic/canvas-text-alternative-present.js").runInPage, applicability: require("./rules/automatic/canvas-text-alternative-present.js").applicability || null },
  "a11ycore-canvas-text-alternative-quality": { run: require("./rules/manual/canvas-text-alternative-quality-manual.js").runInPage, applicability: require("./rules/manual/canvas-text-alternative-quality-manual.js").applicability || null },
  "a11ycore-contrast-computable": { run: require("./rules/automatic/contrast-computable.js").runInPage, applicability: require("./rules/automatic/contrast-computable.js").applicability || null },
  "a11ycore-contrast-enhanced": { run: require("./rules/automatic/contrast-enhanced.js").runInPage, applicability: require("./rules/automatic/contrast-enhanced.js").applicability || null },
  "a11ycore-contrast-minimum": { run: require("./rules/automatic/contrast-minimum.js").runInPage, applicability: require("./rules/automatic/contrast-minimum.js").applicability || null },
  "a11ycore-embed-text-alternative-present": { run: require("./rules/automatic/embed-text-alternative-present.js").runInPage, applicability: require("./rules/automatic/embed-text-alternative-present.js").applicability || null },
  "a11ycore-embed-text-alternative-quality": { run: require("./rules/manual/embed-text-alternative-quality-manual.js").runInPage, applicability: require("./rules/manual/embed-text-alternative-quality-manual.js").applicability || null },
  "a11ycore-form-control-programmatic-label-present": { run: require("./rules/automatic/form-control-programmatic-label-present.js").runInPage, applicability: require("./rules/automatic/form-control-programmatic-label-present.js").applicability || null },
  "a11ycore-form-control-programmatic-label-quality": { run: require("./rules/manual/form-control-programmatic-label-quality-manual.js").runInPage, applicability: require("./rules/manual/form-control-programmatic-label-quality-manual.js").applicability || null },
  "a11ycore-html-lang-attr-present": { run: require("./rules/automatic/language-page-present.js").runInPage, applicability: require("./rules/automatic/language-page-present.js").applicability || null },
  "a11ycore-img-alt-decorative": { run: require("./rules/manual/img-alt-decorative-manual.js").runInPage, applicability: require("./rules/manual/img-alt-decorative-manual.js").applicability || null },
  "a11ycore-img-alt-present": { run: require("./rules/automatic/img-alt-present.js").runInPage, applicability: require("./rules/automatic/img-alt-present.js").applicability || null },
  "a11ycore-img-alt-quality": { run: require("./rules/manual/img-alt-quality-manual.js").runInPage, applicability: require("./rules/manual/img-alt-quality-manual.js").applicability || null },
  "a11ycore-input-image-alt-decorative": { run: require("./rules/manual/input-image-alt-decorative-manual.js").runInPage, applicability: require("./rules/manual/input-image-alt-decorative-manual.js").applicability || null },
  "a11ycore-input-image-alt-present": { run: require("./rules/automatic/input-image-alt-present.js").runInPage, applicability: require("./rules/automatic/input-image-alt-present.js").applicability || null },
  "a11ycore-input-image-alt-quality": { run: require("./rules/manual/input-image-alt-quality-manual.js").runInPage, applicability: require("./rules/manual/input-image-alt-quality-manual.js").applicability || null },
  "a11ycore-manual-review": { run: require("./rules/manual-review.js").runInPage, applicability: require("./rules/manual-review.js").applicability || null },
  "a11ycore-media-alternative-transcript-evidence": { run: require("./rules/manual/a11ycore-media-transcript-present-manual.js").runInPage, applicability: require("./rules/manual/a11ycore-media-transcript-present-manual.js").applicability || null },
  "a11ycore-object-text-alternative-present": { run: require("./rules/automatic/object-text-alternative-present.js").runInPage, applicability: require("./rules/automatic/object-text-alternative-present.js").applicability || null },
  "a11ycore-object-text-alternative-quality": { run: require("./rules/manual/object-text-alternative-quality-manual.js").runInPage, applicability: require("./rules/manual/object-text-alternative-quality-manual.js").applicability || null },
  "a11ycore-page-title-patterns": { run: require("./rules/automatic/a11ycore-page-title-patterns.js").runInPage, applicability: require("./rules/automatic/a11ycore-page-title-patterns.js").applicability || null },
  "a11ycore-page-title-present": { run: require("./rules/automatic/a11ycore-page-title-present.js").runInPage, applicability: require("./rules/automatic/a11ycore-page-title-present.js").applicability || null },
  "a11ycore-role-img-text-alternative-present": { run: require("./rules/automatic/role-img-alt-present.js").runInPage, applicability: require("./rules/automatic/role-img-alt-present.js").applicability || null },
  "a11ycore-svg-image-text-alternative-present": { run: require("./rules/automatic/svg-image-text-alternative-present.js").runInPage, applicability: require("./rules/automatic/svg-image-text-alternative-present.js").applicability || null },
  "a11ycore-svg-text-alternative-present": { run: require("./rules/automatic/svg-text-alternative-present.js").runInPage, applicability: require("./rules/automatic/svg-text-alternative-present.js").applicability || null },
  "a11ycore-svg-text-alternative-quality": { run: require("./rules/manual/svg-text-alternative-quality-manual.js").runInPage, applicability: require("./rules/manual/svg-text-alternative-quality-manual.js").applicability || null },
  "a11ycore-video-poster-text-alternative-present": { run: require("./rules/automatic/video-poster-text-alternative-present.js").runInPage, applicability: require("./rules/automatic/video-poster-text-alternative-present.js").applicability || null }
};

const DEFAULT_POLICY = {
  allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
  allowedConfidence: ['high', 'medium', 'low'],
  coerceManualFailToCantTell: true
};

// Built-in message catalogs (inlined at build time)
const I18N = {
  "en": {
    "a11ycore_img_altPresent_title": "<img> must have an alt attribute",
    "a11ycore_img_altPresent_description": "Checks that <img> elements provide an alt attribute to support a text alternative mechanism.",
    "a11ycore_img_altPresent_summary_fail": "Missing alt attribute on <img>.",
    "a11ycore_img_altPresent_hint_fail": "Add an alt attribute (use alt=\"\" only for decorative images).",
    "a11ycore_area_altPresent_title": "<area> must have an alt attribute",
    "a11ycore_area_altPresent_description": "Checks that <area> elements provide an alt attribute to support a text alternative mechanism.",
    "a11ycore_area_altPresent_summary_fail": "Missing alt attribute on <area>.",
    "a11ycore_area_altPresent_hint_fail": "Add an alt attribute (use alt=\"\" only for decorative areas).",
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
    "a11ycore_formControl_programmaticLabelPresent_description": "Checks that form controls have a programmatic label via <label>, aria-label, or aria-labelledby.",
    "a11ycore_formControl_programmaticLabelPresent_summary_fail": "Form control is missing a programmatic label.",
    "a11ycore_formControl_programmaticLabelPresent_hint_fail": "Provide a <label> association, aria-label, or aria-labelledby (placeholder/title do not count as labels).",
    "a11ycore_formControlAccessibleName_description": "Fails when an applicable form control has no accessible name (e.g., label, aria-label, aria-labelledby).",
    "a11ycore_formControlAccessibleName_hint_fail": "Provide an accessible name via a <label>, aria-label, or aria-labelledby.",
    "a11ycore_formControlAccessibleName_summary_fail": "Form control has no accessible name.",
    "a11ycore_formControlAccessibleName_title": "Form controls must have an accessible name",
    "a11ycore_linksTargetBlankNoopener_description": "Ensures links with target=\"_blank\" mitigate reverse tabnabbing risks.",
    "a11ycore_linksTargetBlankNoopener_hint_cantTell": "See guidance for this rule.",
    "a11ycore_linksTargetBlankNoopener_summary_cantTell": "Links that open in a new tab should use rel=\"noopener\"",
    "a11ycore_linksTargetBlankNoopener_title": "Links that open in a new tab should use rel=\"noopener\"",
    "a11ycore_manualReview_description": "Flags that a manual review of keyboard navigation and focus order is required.",
    "a11ycore_manualReview_hint_cantTell": "See guidance for this rule.",
    "a11ycore_manualReview_summary_cantTell": "Manual review: keyboard navigation and focus order",
    "a11ycore_manualReview_title": "Manual review: keyboard navigation and focus order",
    "rules.a11ycore-img-alt-suspicious.meta.title": "Suspicious alt text requires verification",
    "rules.a11ycore-img-alt-suspicious.meta.description": "Identifies images whose alt text matches common suspicious patterns (such as filenames, URLs, placeholders, or generic terms) and requires manual verification.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.summary": "Image alt text appears suspicious (\"{{alt}}\" looks like {{pattern}}) and requires verification.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.hint": "Review the alt text. Avoid filenames, URLs, placeholders, or generic terms, and ensure the text alternative describes the image’s purpose or function in context.",
    "a11ycore_formControl_programmaticLabelQuality_title": "Form controls should not rely on placeholder or title as the primary label",
    "a11ycore_formControl_programmaticLabelQuality_description": "Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer <label> or aria-labelledby.",
    "a11ycore_formControl_programmaticLabelQuality_summary_cantTell": "Form control’s primary label is derived from {{methodLabel}}.",
    "a11ycore_formControl_programmaticLabelQuality_hint_cantTell": "Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.",
    "a11ycore_html_lang_attr_title": "Page language is declared",
    "a11ycore_html_lang_attr_description": "Checks that the default language of the page is programmatically declared.",
    "a11ycore_html_lang_attr_missing_absent": "The default language of the page is not declared.",
    "a11ycore_html_lang_attr_hint_missing_absent": "Add a lang attribute to the <html> element (for example: <html lang=\"en\">).",
    "a11ycore_html_lang_attr_missing_empty": "The default language of the page is declared but empty.",
    "a11ycore_html_lang_attr_hint_missing_empty": "Set a valid language value in the lang attribute of the <html> element (for example: <html lang=\"en\">).",
    "a11ycore_html_lang_attr_invalid": "The default language of the page is declared, but the value \"{{lang}}\" is not a valid language tag.",
    "a11ycore_html_lang_attr_hint_invalid": "Use a valid BCP 47 language tag in <html lang=\"…\"> (for example: \"en\", \"fr\", \"en-US\").",
    "a11ycore_mediaTranscriptPresent_title": "Time-based media: transcript or text alternative evidence",
    "a11ycore_mediaTranscriptPresent_description": "Finds audio and video elements where a transcript or other text alternative is not strongly evidenced in the page content. This rule is conservative and reports cantTell when evidence is missing or cannot be verified.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_missing": "La présence d’une transcription ou d’une autre alternative textuelle pour cet élément {{element}} n’est pas clairement démontrée sur la page.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_missing": "Provide a clearly identified transcript or other text alternative for prerecorded audio-only or video-only media, for example a visible “Transcript” section or link.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_unverified": "A transcript or other text alternative may be available for this time-based media, but it could not be verified from the page content.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_unverified": "Ensure a clearly identified transcript or other text alternative is available and visibly or programmatically associated with the media on the page.",
    "a11ycore_pageTitlePresent_title": "Page has a non-empty title",
    "a11ycore_pageTitlePresent_description": "Checks that the page includes a non-empty <title> element that identifies the page.",
    "a11ycore_pageTitlePresent_summary_fail": "The page does not have a non-empty title.",
    "a11ycore_pageTitlePresent_hint_fail": "Add a <title> element with text that describes the page topic or purpose.",
    "a11ycore_pageTitlePatterns_title": "Page title patterns that may be insufficiently descriptive",
    "a11ycore_pageTitlePatterns_description": "Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.",
    "a11ycore_pageTitlePatterns_summary_cantTell": "The page title may not be descriptive enough to identify the page topic or purpose.",
    "a11ycore_pageTitlePresent_summary_fail_missing": "The page is missing a <title> element.",
    "a11ycore_pageTitlePresent_summary_fail_empty": "The page has an empty <title>.",
    "a11ycore_pageTitlePatterns_summary_cantTell_duplicateAcrossPages": "Several pages share the same title, which may make it harder to distinguish pages ({{duplicateGroups}} duplicate groups across {{pagesAnalyzed}} pages). Example: “{{exampleTitle}}”.",
    "a11ycore_pageTitlePatterns_summary_cantTell_templatedAcrossPages": "Many page titles appear highly templated, which may reduce how well titles distinguish pages ({{pagesAnalyzed}} pages).",
    "a11ycore_pageTitlePatterns_summary_cantTell_generic": "The page title is generic and may not identify the page topic or purpose.",
    "a11ycore_pageTitlePatterns_summary_cantTell_veryShort": "The page title is very short and may not identify the page topic or purpose.",
    "a11ycore_pageTitlePatterns_summary_cantTell_templateLike": "The page title appears templated and may not identify the page topic or purpose.",
    "a11ycore_pageTitlePatterns_hint_cantTell": "Review the page title and ensure it clearly identifies the page topic or purpose and helps distinguish the page from others.",
    "a11ycore_contrastComputable_title": "Color contrast is computable for rendered text",
    "a11ycore_contrastComputable_description": "Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).",
    "a11ycore_contrastComputable_pass_allComputable": "Contrast is computable for all eligible text ({{eligibleTextCount}} text node(s)).",
    "a11ycore_contrastComputable_cantTell_generic": "Contrast may not be computable ({{reasonCode}}).",
    "a11ycore_contrastComputable_cantTell_bgImageOrGradient": "Contrast is not computable because the background uses an image or gradient ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_mixBlendMode": "Contrast is not computable because mix-blend-mode is used ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_filter": "Contrast is not computable because filter/backdrop-filter is used ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_rootNotOpaque": "Contrast is not computable because the effective background is not fully opaque at the root (alpha={{backgroundAlpha}}).",
    "a11ycore_contrastComputable_cantTell_foregroundUnparsable": "Contrast is not computable because the computed foreground color could not be parsed.",
    "a11ycore_contrastComputable_cantTell_engineFailure": "Contrast computability could not be determined due to an internal engine error ({{reasonCode}}).",
    "a11ycore_contrastMinimum_title": "Text meets minimum color contrast (AA)",
    "a11ycore_contrastMinimum_description": "Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3.0:1 (large), when contrast is computable from CSS.",
    "a11ycore_contrastMinimum_fail_belowThreshold": "Element has insufficient color contrast of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).",
    "a11ycore_contrastMinimum_pass_allAboveThreshold": "All computable text meets minimum contrast (AA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.",
    "a11ycore_contrastMinimum_notApplicable_noComputableText": "No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.",
    "a11ycore_contrastMinimum_cantTell_engineFailure": "Minimum contrast (AA) could not be determined due to an internal engine error ({{reasonCode}}).",
    "a11ycore_contrastEnhanced_title": "Text meets enhanced color contrast (AAA)",
    "a11ycore_contrastEnhanced_description": "Checks that visible text has a contrast ratio of at least 7.0:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.",
    "a11ycore_contrastEnhanced_fail_belowThreshold": "Element has insufficient color contrast (AAA) of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).",
    "a11ycore_contrastEnhanced_pass_allAboveThreshold": "All computable text meets enhanced contrast (AAA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.",
    "a11ycore_contrastEnhanced_notApplicable_noComputableText": "No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.",
    "a11ycore_contrastEnhanced_cantTell_engineFailure": "Enhanced contrast (AAA) could not be determined due to an internal engine error ({{reasonCode}}).",
    "a11ycore_dom_textContrastMinimum_title": "Text must have sufficient contrast (minimum)",
    "a11ycore_dom_textContrastMinimum_description": "Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.3 (AA), using rendered styles (font size/weight) to determine the required ratio.",
    "a11ycore_dom_textContrastMinimum_summary_fail": "Insufficient text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_hint_fail": "Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for this text size/weight.",
    "a11ycore_dom_textContrastMinimum_summary_pass": "Text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_summary_cantTell": "Could not reliably compute text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).",
    "a11ycore_dom_textContrastMinimum_hint_cantTell": "Manually verify contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.",
    "a11ycore_dom_textContrastEnhanced_title": "Text must have sufficient contrast (enhanced)",
    "a11ycore_dom_textContrastEnhanced_description": "Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.6 (AAA), using rendered styles (font size/weight) to determine the required ratio.",
    "a11ycore_dom_textContrastEnhanced_summary_fail": "Insufficient enhanced text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_hint_fail": "Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for enhanced (AAA) contrast.",
    "a11ycore_dom_textContrastEnhanced_summary_pass": "Enhanced text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_summary_cantTell": "Could not reliably compute enhanced text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).",
    "a11ycore_dom_textContrastEnhanced_hint_cantTell": "Manually verify enhanced (AAA) contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.",
    "a11ycore_dom_nonTextContrast_title": "UI components and graphics must have sufficient contrast",
    "a11ycore_dom_nonTextContrast_description": "Checks contrast for non-text visual information (UI component boundaries, states, and meaningful graphical objects) per WCAG 2.2 SC 1.4.11 (AA).",
    "a11ycore_dom_nonTextContrast_summary_fail": "Insufficient non-text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_hint_fail": "Adjust the component/graphic colors so the contrast ratio is at least {{requiredRatio}}:1 for the perceivable boundary or essential visual information.",
    "a11ycore_dom_nonTextContrast_summary_pass": "Non-text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_summary_cantTell": "Could not reliably compute non-text contrast because the effective background or painted pixels are not deterministically resolvable (e.g. image/gradient/video/canvas, complex transparency, or blending).",
    "a11ycore_dom_nonTextContrast_hint_cantTell": "Manually verify the component/graphic contrast against adjacent colors; ensure it meets {{requiredRatio}}:1 for essential non-text visual information.",
    "a11ycore_contrastEnhanced_pass_allTextMeetsThreshold": "All computable text meets enhanced contrast (AAA).",
    "a11ycore_contrastMinimum_pass_allTextMeetsThreshold": "All computable text meets minimum contrast (AA).",
    "a11ycore_roleImg_textAlternativePresent_title": "[role=\"img\"] must have an accessible text alternative",
    "a11ycore_roleImg_textAlternativePresent_description": "Checks that elements with role=\"img\" provide an accessible text alternative using aria-label or aria-labelledby.",
    "a11ycore_roleImg_textAlternativePresent_summary_fail": "The element with role=\"img\" does not have an accessible text alternative.",
    "a11ycore_roleImg_textAlternativePresent_hint_fail": "Provide a text alternative using aria-label, or aria-labelledby that references non-empty text."
  },
  "fr": {
    "a11ycore_img_altPresent_title": "<img> doit avoir un attribut alt",
    "a11ycore_img_altPresent_description": "Vérifie que les éléments <img> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.",
    "a11ycore_img_altPresent_summary_fail": "Attribut alt manquant sur <img>.",
    "a11ycore_img_altPresent_hint_fail": "Ajoutez un attribut alt (utilisez alt=\"\" uniquement pour les images décoratives).",
    "a11ycore_area_altPresent_title": "<area> doit avoir un attribut alt",
    "a11ycore_area_altPresent_description": "Vérifie que les éléments <area> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.",
    "a11ycore_area_altPresent_summary_fail": "Attribut alt manquant sur <area>.",
    "a11ycore_area_altPresent_hint_fail": "Ajoutez un attribut alt (utilisez alt=\"\" uniquement pour les zones décoratives).",
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
    "a11ycore_formControl_programmaticLabelPresent_title": "Les contrôles de formulaire doivent avoir un libellé programmatique",
    "a11ycore_formControl_programmaticLabelPresent_description": "Vérifie que les contrôles de formulaire ont un libellé programmatique via <label>, aria-label ou aria-labelledby.",
    "a11ycore_formControl_programmaticLabelPresent_summary_fail": "Le contrôle de formulaire n’a pas de libellé programmatique.",
    "a11ycore_formControl_programmaticLabelPresent_hint_fail": "Associez un <label>, ou utilisez aria-label / aria-labelledby (placeholder/title ne sont pas des libellés).",
    "a11ycore_formControlAccessibleName_description": "Échec lorsqu’un contrôle de formulaire applicable n’a pas de nom accessible (ex. label, aria-label, aria-labelledby).",
    "a11ycore_formControlAccessibleName_hint_fail": "Fournissez un nom accessible via un <label>, aria-label ou aria-labelledby.",
    "a11ycore_formControlAccessibleName_summary_fail": "Le contrôle de formulaire n’a pas de nom accessible.",
    "a11ycore_formControlAccessibleName_title": "Les champs de formulaire doivent avoir un nom accessible.",
    "a11ycore_linksTargetBlankNoopener_description": "Échec lorsqu’un lien avec target=\"_blank\" n’inclut pas rel=\"noopener\" (risque de sécurité via window.opener).",
    "a11ycore_linksTargetBlankNoopener_hint_cantTell": "Ajoutez rel=\"noopener\" (et éventuellement noreferrer) aux liens avec target=\"_blank\".",
    "a11ycore_linksTargetBlankNoopener_summary_cantTell": "Lien avec target=\"_blank\" sans rel=\"noopener\".",
    "a11ycore_linksTargetBlankNoopener_title": "Les liens qui s’ouvrent dans un nouvel onglet doivent utiliser rel=\"noopener\".",
    "a11ycore_manualReview_description": "Cette règle renvoie toujours cantTell et nécessite une vérification manuelle.",
    "a11ycore_manualReview_hint_cantTell": "Examinez la page et validez ce point manuellement selon le contexte.",
    "a11ycore_manualReview_summary_cantTell": "Vérification manuelle requise.",
    "a11ycore_manualReview_title": "Vérification manuelle requise.",
    "rules.a11ycore-img-alt-suspicious.meta.title": "Texte alternatif suspect nécessitant une vérification",
    "rules.a11ycore-img-alt-suspicious.meta.description": "Identifie les images dont le texte alternatif correspond à des motifs suspects courants (nom de fichier, URL, texte fictif ou terme générique) et nécessite une vérification manuelle.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.summary": "Le texte alternatif de l’image semble suspect (« {{alt}} » ressemble à {{pattern}}) et nécessite une vérification.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.hint": "Vérifiez le texte alternatif. Évitez les noms de fichiers, les URL, les textes fictifs ou les termes génériques, et assurez-vous que l’alternative textuelle décrit la fonction ou le contenu de l’image dans son contexte.",
    "a11ycore_formControl_programmaticLabelQuality_title": "Les champs de formulaire ne devraient pas dépendre du placeholder ou du title comme libellé principal",
    "a11ycore_formControl_programmaticLabelQuality_description": "Signale les champs de formulaire dont le nom accessible est principalement dérivé du placeholder ou de l’attribut title. Préférez un <label> ou aria-labelledby.",
    "a11ycore_formControl_programmaticLabelQuality_summary_cantTell": "Le libellé principal du champ provient de {{methodLabel}}.",
    "a11ycore_formControl_programmaticLabelQuality_hint_cantTell": "Préférez un <label> persistant ou aria-labelledby. Évitez d’utiliser placeholder/title comme libellé principal.",
    "a11ycore_html_lang_attr_title": "La langue de la page est déclarée",
    "a11ycore_html_lang_attr_description": "Vérifie que la langue par défaut de la page est déclarée de manière programmatique.",
    "a11ycore_html_lang_attr_missing_absent": "La langue par défaut de la page n’est pas déclarée.",
    "a11ycore_html_lang_attr_hint_missing_absent": "Ajoutez un attribut lang à l’élément <html> (par exemple : <html lang=\"fr\">).",
    "a11ycore_html_lang_attr_missing_empty": "La langue par défaut de la page est déclarée mais vide.",
    "a11ycore_html_lang_attr_hint_missing_empty": "Renseignez une valeur de langue valide dans l’attribut lang de l’élément <html> (par exemple : <html lang=\"fr\">).",
    "a11ycore_html_lang_attr_invalid": "La langue par défaut de la page est déclarée, mais la valeur « {{lang}} » n’est pas une balise de langue valide.",
    "a11ycore_html_lang_attr_hint_invalid": "Utilisez une balise de langue BCP 47 valide dans <html lang=\"…\"> (par exemple : « fr », « en », « fr-FR »).",
    "a11ycore_mediaTranscriptPresent_title": "Média temporel : preuve de transcription ou d’alternative textuelle",
    "a11ycore_mediaTranscriptPresent_description": "Détecte les éléments audio et vidéo pour lesquels la présence d’une transcription ou d’une autre alternative textuelle n’est pas clairement établie dans le contenu de la page. Cette règle est volontairement conservatrice et retourne cantTell lorsque la preuve est absente ou invérifiable.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_missing": "Aucune transcription ou autre alternative textuelle pour ce média temporel n’est clairement établie sur la page.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_missing": "Fournir une transcription ou une autre alternative textuelle clairement identifiée pour les médias préenregistrés audio seuls ou vidéo seuls, par exemple une section ou un lien « Transcription » visible.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_unverified": "Une transcription ou une autre alternative textuelle peut être disponible pour ce média temporel, mais elle n’a pas pu être vérifiée à partir du contenu de la page.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_unverified": "Aucune transcription ou autre alternative textuelle pour cet élément {element} n’est clairement établie sur la page.",
    "a11ycore_pageTitlePresent_title": "La page possède un titre non vide",
    "a11ycore_pageTitlePresent_description": "Vérifie que la page contient un élément <title> non vide permettant d’identifier la page.",
    "a11ycore_pageTitlePresent_summary_fail": "La page ne possède pas de titre non vide.",
    "a11ycore_pageTitlePresent_hint_fail": "Ajouter un élément <title> contenant un texte décrivant le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_title": "Motifs de titres de page pouvant indiquer un manque de descriptivité",
    "a11ycore_pageTitlePatterns_description": "Identifie des motifs de titres de page pouvant indiquer un manque de descriptivité, tels que des titres génériques, dupliqués ou excessivement modélisés. Cette règle fournit des signaux de revue et n’entraîne pas d’échec automatique.",
    "a11ycore_pageTitlePatterns_summary_cantTell": "Le titre de la page peut ne pas être suffisamment descriptif pour identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePresent_summary_fail_missing": "La page ne contient pas d’élément <title>.",
    "a11ycore_pageTitlePresent_summary_fail_empty": "La page contient un élément <title> vide.",
    "a11ycore_pageTitlePatterns_summary_cantTell_duplicateAcrossPages": "Plusieurs pages partagent le même titre, ce qui peut rendre plus difficile la distinction entre les pages ({{duplicateGroups}} groupes dupliqués sur {{pagesAnalyzed}} pages). Exemple : « {{exampleTitle}} ».",
    "a11ycore_pageTitlePatterns_summary_cantTell_templatedAcrossPages": "De nombreux titres de page semblent fortement modélisés, ce qui peut réduire la capacité des titres à distinguer les pages ({{pagesAnalyzed}} pages).",
    "a11ycore_pageTitlePatterns_summary_cantTell_generic": "Le titre de la page est générique et peut ne pas identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_summary_cantTell_veryShort": "Le titre de la page est très court et peut ne pas identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_summary_cantTell_templateLike": "Le titre de la page semble modélisé et peut ne pas identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_hint_cantTell": "Vérifier que le titre de la page identifie clairement le sujet ou l’objectif de la page et permet de la distinguer des autres pages.",
    "a11ycore_contrastComputable_title": "Le contraste des couleurs est calculable pour le texte rendu",
    "a11ycore_contrastComputable_description": "Détermine si suffisamment d’informations sont disponibles pour calculer le contraste WCAG du texte visible (ex. pas de dégradés/images/modes de fusion rendant l’arrière-plan indéterminé).",
    "a11ycore_contrastComputable_pass_allComputable": "Le contraste est calculable pour tout le texte éligible ({{eligibleTextCount}} nœud(s) de texte).",
    "a11ycore_contrastComputable_cantTell_generic": "Le contraste peut ne pas être calculable ({{reasonCode}}).",
    "a11ycore_contrastComputable_cantTell_bgImageOrGradient": "Le contraste n’est pas calculable car l’arrière-plan utilise une image ou un dégradé ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_mixBlendMode": "Le contraste n’est pas calculable car mix-blend-mode est utilisé ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_filter": "Le contraste n’est pas calculable car filter/backdrop-filter est utilisé ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_rootNotOpaque": "Le contraste n’est pas calculable car l’arrière-plan effectif n’est pas totalement opaque à la racine (alpha={{backgroundAlpha}}).",
    "a11ycore_contrastComputable_cantTell_foregroundUnparsable": "Le contraste n’est pas calculable car la couleur de premier plan calculée n’a pas pu être analysée.",
    "a11ycore_contrastComputable_cantTell_engineFailure": "La calculabilité du contraste n’a pas pu être déterminée en raison d’une erreur interne du moteur ({{reasonCode}}).",
    "a11ycore_contrastMinimum_title": "Le texte respecte le contraste minimum (AA)",
    "a11ycore_contrastMinimum_description": "Vérifie que le texte visible atteint un ratio de contraste d’au moins 4,5:1 (texte normal) ou 3,0:1 (grand texte), lorsque le contraste est calculable à partir du CSS.",
    "a11ycore_contrastMinimum_fail_belowThreshold": "L’élément présente un contraste de couleur insuffisant de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).",
    "a11ycore_contrastMinimum_pass_allAboveThreshold": "Tout le texte calculable respecte le contraste minimum (AA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.",
    "a11ycore_contrastMinimum_notApplicable_noComputableText": "Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.",
    "a11ycore_contrastMinimum_cantTell_engineFailure": "Le contraste minimum (AA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).",
    "a11ycore_contrastEnhanced_title": "Le texte respecte le contraste renforcé (AAA)",
    "a11ycore_contrastEnhanced_description": "Vérifie que le texte visible atteint un ratio de contraste d’au moins 7,0:1 (texte normal) ou 4,5:1 (grand texte), lorsque le contraste est calculable à partir du CSS.",
    "a11ycore_dom_textContrastMinimum_title": "Le texte doit avoir un contraste suffisant (minimum)",
    "a11ycore_dom_textContrastMinimum_description": "Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.3 (AA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.",
    "a11ycore_dom_textContrastMinimum_summary_fail": "Contraste de texte insuffisant : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_hint_fail": "Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour cette taille/épaisseur de texte.",
    "a11ycore_dom_textContrastMinimum_summary_pass": "Contraste de texte conforme : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_summary_cantTell": "Impossible de calculer fiablement le contraste du texte car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).",
    "a11ycore_dom_textContrastMinimum_hint_cantTell": "Vérifiez manuellement le contraste lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.",
    "a11ycore_contrastEnhanced_fail_belowThreshold": "L’élément présente un contraste de couleur insuffisant renforcé (AAA) de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).",
    "a11ycore_contrastEnhanced_pass_allAboveThreshold": "Tout le texte calculable respecte le contraste renforcé (AAA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.",
    "a11ycore_contrastEnhanced_notApplicable_noComputableText": "Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.",
    "a11ycore_contrastEnhanced_cantTell_engineFailure": "Le contraste renforcé (AAA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).",
    "a11ycore_dom_textContrastEnhanced_title": "Le texte doit avoir un contraste suffisant (renforcé)",
    "a11ycore_dom_textContrastEnhanced_description": "Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.6 (AAA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.",
    "a11ycore_dom_textContrastEnhanced_summary_fail": "Contraste de texte renforcé insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_hint_fail": "Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour le niveau renforcé (AAA).",
    "a11ycore_dom_textContrastEnhanced_summary_pass": "Contraste de texte renforcé conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_summary_cantTell": "Impossible de calculer fiablement le contraste renforcé car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).",
    "a11ycore_dom_textContrastEnhanced_hint_cantTell": "Vérifiez manuellement le contraste renforcé (AAA) lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.",
    "a11ycore_dom_nonTextContrast_title": "Les composants d’interface et les graphiques doivent avoir un contraste suffisant",
    "a11ycore_dom_nonTextContrast_description": "Vérifie le contraste des informations visuelles non textuelles (contours de composants, états, et objets graphiques porteurs d’information) selon WCAG 2.2 SC 1.4.11 (AA).",
    "a11ycore_dom_nonTextContrast_summary_fail": "Contraste non-textuel insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_hint_fail": "Ajustez les couleurs du composant/graphique afin d’atteindre au moins {{requiredRatio}}:1 pour le contour perceptible ou l’information visuelle essentielle.",
    "a11ycore_dom_nonTextContrast_summary_pass": "Contraste non-textuel conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_summary_cantTell": "Impossible de calculer fiablement le contraste non-textuel car l’arrière-plan effectif ou les pixels peints ne sont pas déterminables (ex. image/dégradé/vidéo/canvas, transparence ou fusion complexes).",
    "a11ycore_dom_nonTextContrast_hint_cantTell": "Vérifiez manuellement le contraste du composant/graphique par rapport aux couleurs adjacentes ; assurez-vous qu’il respecte {{requiredRatio}}:1 pour l’information visuelle non textuelle essentielle.",
    "a11ycore_contrastEnhanced_pass_allTextMeetsThreshold": "Tout le texte calculable respecte le contraste renforcé (AAA).",
    "a11ycore_contrastMinimum_pass_allTextMeetsThreshold": "Tout le texte calculable respecte le contraste minimum (AA).",
    "a11ycore_roleImg_textAlternativePresent_title": "Les éléments avec role=\"img\" doivent avoir une alternative textuelle accessible",
    "a11ycore_roleImg_textAlternativePresent_description": "Vérifie que les éléments ayant le rôle \"img\" fournissent une alternative textuelle accessible via aria-label ou aria-labelledby.",
    "a11ycore_roleImg_textAlternativePresent_summary_fail": "L’élément avec le rôle \"img\" ne possède pas d’alternative textuelle accessible.",
    "a11ycore_roleImg_textAlternativePresent_hint_fail": "Fournissez une alternative textuelle à l’aide de aria-label ou de aria-labelledby pointant vers un texte non vide."
  }
};

function normalizeLocale(locale) {
  if (typeof locale !== 'string') return 'en';
  const s = locale.trim();
  return s ? s : 'en';
}

function getLocaleDict(engineOptions) {
  const loc = normalizeLocale(engineOptions && engineOptions.locale);
  return (I18N && I18N[loc]) ? I18N[loc] : (I18N && I18N.en ? I18N.en : {});
}

  function isTruthyMustache(val) {
    if (val === false || val === null || val === undefined) return false;
    if (typeof val === 'number') return val !== 0 && !Number.isNaN(val);
    if (typeof val === 'string') return val.length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }

  function renderMustacheLite(template, params) {
    const str = (typeof template === 'string') ? template : '';
    const ctx = (params && typeof params === 'object') ? params : null;
    if (!str || !ctx) return str;

    // Tokenize: {{...}}
    const tagRe = /\{\{\s*([#^/]?)([^}\s]+)\s*\}\}/g;

    // We render by building an AST-like stack of frames (small + deterministic).
    const root = { type: 'root', key: null, inverted: false, parts: [] };
    const stack = [root];

    let lastIndex = 0;
    let m;

    while ((m = tagRe.exec(str)) !== null) {
      const before = str.slice(lastIndex, m.index);
      if (before) stack[stack.length - 1].parts.push({ type: 'text', value: before });

      const sigil = m[1];           // '', '#', '^', '/'
      const rawKey = m[2] || '';
      const key = String(rawKey).trim();

      if (!key) {
        // Treat empty tags as literal text (no-throw).
        stack[stack.length - 1].parts.push({ type: 'text', value: m[0] });
        lastIndex = tagRe.lastIndex;
        continue;
      }

      if (sigil === '#') {
        const frame = { type: 'section', key, inverted: false, parts: [] };
        stack[stack.length - 1].parts.push(frame);
        stack.push(frame);
      } else if (sigil === '^') {
        const frame = { type: 'section', key, inverted: true, parts: [] };
        stack[stack.length - 1].parts.push(frame);
        stack.push(frame);
      } else if (sigil === '/') {
        // Close section if it matches; otherwise treat as literal.
        const top = stack[stack.length - 1];
        if (top && top.type === 'section' && top.key === key) {
          stack.pop();
        } else {
          stack[stack.length - 1].parts.push({ type: 'text', value: m[0] });
        }
      } else {
        // Variable
        stack[stack.length - 1].parts.push({ type: 'var', key });
      }

      lastIndex = tagRe.lastIndex;
    }

    // Tail text
    const tail = str.slice(lastIndex);
    if (tail) stack[stack.length - 1].parts.push({ type: 'text', value: tail });

    // If we have unclosed sections, we *don’t throw*; we just render them as literal
    // by flattening them with their original markers removed. (Deterministic.)
    function evalParts(parts) {
      let out = '';
      for (const p of parts) {
        if (!p || typeof p !== 'object') continue;
        if (p.type === 'text') out += p.value || '';
        else if (p.type === 'var') {
          const v = Object.prototype.hasOwnProperty.call(ctx, p.key) ? ctx[p.key] : '';
          out += (v === null || v === undefined) ? '' : String(v);
        } else if (p.type === 'section') {
          const v = Object.prototype.hasOwnProperty.call(ctx, p.key) ? ctx[p.key] : undefined;
          const ok = isTruthyMustache(v);
          const shouldRender = p.inverted ? !ok : ok;
          if (shouldRender) out += evalParts(p.parts || []);
        }
      }
      return out;
    }

    return evalParts(root.parts);
  }

  function applyI18nParams(str, params) {
    return renderMustacheLite(str, params);
  }


function t(key, fallback, params, engineOptions) {
  if (typeof key !== 'string' || !key.trim()) return typeof fallback === 'string' ? fallback : '';

  const dict = getLocaleDict(engineOptions);
  const v = dict ? dict[key] : null;

  // fallback to English if missing in requested locale
  const vEn = (I18N && I18N.en) ? I18N.en[key] : null;

  const base =
    (typeof v === 'string' && v) ? v :
    (typeof vEn === 'string' && vEn) ? vEn :
    (typeof fallback === 'string' ? fallback : '');

  return applyI18nParams(base, params);
}

function resolveRuleDefI18n(def, engineOptions) {
  if (!def || typeof def !== 'object') return def;
  const out = { ...def };
  if (out.i18n && typeof out.i18n === 'object') {
    out.title = t(out.i18n.titleKey, out.title, null, engineOptions);
    out.description = t(out.i18n.descriptionKey, out.description, null, engineOptions);
  }
  return out;
}

const POLICY_CONTRACTS = {
  "a11y": {
    "id": "a11y",
    "allowedOutcomes": [
      "fail",
      "pass",
      "cantTell",
      "notApplicable"
    ],
    "allowedConfidence": [
      "high",
      "medium",
      "low"
    ],
    "coerceManualFailToCantTell": true
  },
  "generic": {
    "id": "generic",
    "allowedOutcomes": [
      "fail",
      "pass",
      "cantTell",
      "notApplicable"
    ],
    "allowedConfidence": [
      "high",
      "medium",
      "low"
    ],
    "coerceManualFailToCantTell": false
  }
};

// This is the single source of truth, inlined from src/policy/resolvePolicy.js
const resolvePolicy = (function resolvePolicy(POLICY_CONTRACTS, engineOptions) {
    function normalizePolicyContract(POLICY_CONTRACTS, contract, fallbackId) {
        const fallback = POLICY_CONTRACTS[fallbackId] || POLICY_CONTRACTS.a11y;
        if (typeof contract === 'string') return POLICY_CONTRACTS[contract] || fallback;

        if (contract && typeof contract === 'object') {
            const allowedOutcomes = Array.isArray(contract.allowedOutcomes)
                ? contract.allowedOutcomes.slice()
                : fallback.allowedOutcomes.slice();

            const allowedConfidence = Array.isArray(contract.allowedConfidence)
                ? contract.allowedConfidence.slice()
                : fallback.allowedConfidence.slice();

            return {
                id: (typeof contract.id === 'string' && contract.id.trim())
                    ? contract.id.trim()
                    : (fallback.id || fallbackId || 'custom'),
                allowedOutcomes,
                allowedConfidence,
                coerceManualFailToCantTell:
                    typeof contract.coerceManualFailToCantTell === 'boolean'
                        ? contract.coerceManualFailToCantTell
                        : !!fallback.coerceManualFailToCantTell
            };
        }

        return fallback;
    }

    function normalizePolicyOverrides(policy) {
        const p = (policy && typeof policy === 'object') ? policy : {};
        return {
            allowedOutcomes: Array.isArray(p.allowedOutcomes) ? p.allowedOutcomes.slice() : null,
            allowedConfidence: Array.isArray(p.allowedConfidence) ? p.allowedConfidence.slice() : null,
            coerceManualFailToCantTell: typeof p.coerceManualFailToCantTell === 'boolean' ? p.coerceManualFailToCantTell : null
        };
    }

    const opts = (engineOptions && typeof engineOptions === 'object') ? engineOptions : {};
    const contract = normalizePolicyContract(POLICY_CONTRACTS, opts.policyContract, 'a11y');
    const ov = normalizePolicyOverrides(opts.policy);

    return {
        contractId: contract.id,
        allowedOutcomes: ov.allowedOutcomes || contract.allowedOutcomes.slice(),
        allowedConfidence: ov.allowedConfidence || contract.allowedConfidence.slice(),
        coerceManualFailToCantTell:
            ov.coerceManualFailToCantTell !== null ? ov.coerceManualFailToCantTell : !!contract.coerceManualFailToCantTell
    };
});

function parseCommaList(value, { lower = false } = {}) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const arr = value.map(String).map((s) => s.trim()).filter(Boolean);
    const norm = lower ? arr.map((s) => s.toLowerCase()) : arr.slice();
    // de-dupe while preserving first-seen order (deterministic)
    const seen = new Set();
    const out = [];
    for (const v of norm) {
      if (!seen.has(v)) { seen.add(v); out.push(v); }
    }
    return out;
  }
  if (typeof value !== 'string') return [];
  const raw = value.split(',').map((s) => String(s).trim()).filter(Boolean);
  const norm = lower ? raw.map((s) => s.toLowerCase()) : raw.slice();
  const seen = new Set();
  const out = [];
  for (const v of norm) {
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

function normalizeIncludeMode(mode) {
  const m = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  return m === 'or' ? 'or' : 'and';
}

function hasAnyRunOnlyKeys(runOnly) {
  if (!runOnly || typeof runOnly !== 'object') return false;
  // legacy reference-engine-like: { type:'tag', values:[...] }
  if (runOnly.type === 'tag' && Array.isArray(runOnly.values) && runOnly.values.length) return true;
  if (Array.isArray(runOnly.tags) && runOnly.tags.length) return true;
  if (Array.isArray(runOnly.includeRuleIds) && runOnly.includeRuleIds.length) return true;
  if (Array.isArray(runOnly.excludeRuleIds) && runOnly.excludeRuleIds.length) return true;
  // extended (new)
  if (Array.isArray(runOnly.excludeTags) && runOnly.excludeTags.length) return true;
  if (typeof runOnly.includeMode === 'string' && runOnly.includeMode.trim()) return true;
  return false;
}

/**
 * Normalize the selection object used at runtime.
 *
 * Supported inputs:
 * - legacy runOnly object (arrays)
 * - legacy reference-engine-like runOnly: { type:'tag', values:[...] }
 * - extended runOnly: { includeMode:'and'|'or', excludeTags:[...] }
 *
 * Output shape:
 * { includeMode, tags, excludeTags, includeRuleIds, excludeRuleIds }
 */
function normalizeRunOnly(runOnly) {
  const out = { includeMode: 'and', tags: [], excludeTags: [], includeRuleIds: [], excludeRuleIds: [] };
  if (!runOnly || typeof runOnly !== 'object') return out;

  out.includeMode = normalizeIncludeMode(runOnly.includeMode);

  // legacy reference-engine-like: { type:'tag', values:[...] }
  if (runOnly.type === 'tag' && Array.isArray(runOnly.values)) {
    out.tags = parseCommaList(runOnly.values, { lower: true });
    return out;
  }

  out.tags = parseCommaList(runOnly.tags, { lower: true });
  out.excludeTags = parseCommaList(runOnly.excludeTags, { lower: true });

  out.includeRuleIds = parseCommaList(runOnly.includeRuleIds, { lower: false });
  out.excludeRuleIds = parseCommaList(runOnly.excludeRuleIds, { lower: false });

  return out;
}

/**
 * Resolve effective selection from engineOptions (preferred) or runOnly (legacy).
 *
 * Precedence:
 * - If runOnly is provided and non-empty => use it (legacy behavior, plus extended fields)
 * - Else => derive from engineOptions.rules/tags/includeMode (comma-separated strings)
 */
function resolveEffectiveRunOnly(engineOptions, runOnly) {
  if (hasAnyRunOnlyKeys(runOnly)) return normalizeRunOnly(runOnly);

  const eo = (engineOptions && typeof engineOptions === 'object') ? engineOptions : {};
  const mode = normalizeIncludeMode(eo.includeMode);

  const rules = (eo.rules && typeof eo.rules === 'object') ? eo.rules : null;
  const tags = (eo.tags && typeof eo.tags === 'object') ? eo.tags : null;

  const includeRuleIds = parseCommaList(rules && rules.include, { lower: false });
  const excludeRuleIds = parseCommaList(rules && rules.exclude, { lower: false });

  const includeTags = parseCommaList(tags && tags.include, { lower: true });
  const excludeTags = parseCommaList(tags && tags.exclude, { lower: true });

  return {
    includeMode: mode,
    tags: includeTags,
    excludeTags,
    includeRuleIds,
    excludeRuleIds
  };
}

function ruleIdMatches(candidate, ruleId, engineTag) {
  if (!candidate || !ruleId) return false;
  if (candidate === ruleId) return true;

  const prefix = (engineTag ? String(engineTag) : '') + '-';
  if (ruleId.startsWith(prefix) && candidate === ruleId.slice(prefix.length)) return true;
  if (candidate.startsWith(prefix) && candidate.slice(prefix.length) === ruleId) return true;

  return false;
}

function ruleMatchesRunOnly(def, runOnly, engineTag) {
  const norm = normalizeRunOnly(runOnly);
  const includeMode = normalizeIncludeMode(norm.includeMode);

  const defTags = Array.isArray(def.tags) ? def.tags.map((t) => String(t).toLowerCase()) : [];

  const hasIdInclude = norm.includeRuleIds.length > 0;
  const hasTagInclude = norm.tags.length > 0;

  let idMatch = true;
  let tagMatch = true;

  if (hasIdInclude) {
    idMatch = norm.includeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
  }
  if (hasTagInclude) {
    tagMatch = defTags.some((t) => norm.tags.includes(t));
  }

  // Includes
  if (hasIdInclude || hasTagInclude) {
    if (includeMode === 'or' && hasIdInclude && hasTagInclude) {
      if (!(idMatch || tagMatch)) return false;
    } else {
      // 'and' semantics (or only one include dimension present)
      if (hasIdInclude && !idMatch) return false;
      if (hasTagInclude && !tagMatch) return false;
    }
  }

  // Excludes (always subtractive; apply after include)
  if (norm.excludeRuleIds.length) {
    const blocked = norm.excludeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
    if (blocked) return false;
  }

  if (norm.excludeTags.length) {
    const blockedTag = defTags.some((t) => norm.excludeTags.includes(t));
    if (blockedTag) return false;
  }

  return true;
}

function normalizeRuleResult(def, raw, schemaVersion, policy, helpers) {
  if (!policy || typeof policy !== 'object') {
    throw new Error('normalizeRuleResult requires a resolved policy');
  }
  const pol = policy;
  const out = raw && typeof raw === 'object' ? { ...raw } : {};
  out.ruleId = def.ruleId;
  
  // NOTE: title and description are included here (already localized)
  // so consumers do not need to rejoin with the rule catalog.
  out.title = def.title;
  out.description = def.description;
  out.i18n = def.i18n || null;

  if (!pol.allowedOutcomes.includes(out.outcome)) out.outcome = 'cantTell';

  out.outcomeNormalized =
    out.outcome === 'notApplicable' ? 'inapplicable' : out.outcome;
    
    const output = (out.engineOptions && out.engineOptions.output && typeof out.engineOptions.output === 'object')
    ? out.engineOptions.output
    : null;

  const includeSelector = !(output && output.includeSelector === false);
  const includeHtml = !(output && output.includeHtml === false);

  const needsDetails = (out.outcome === 'fail' || out.outcome === 'cantTell');

  // Manual rules must never "fail" automatically
  if (pol.coerceManualFailToCantTell && (def.type === 'manual' || out.type === 'manual') && out.outcome === 'fail') {
    out.outcome = 'cantTell';
    out.outcomeNormalized = 'cantTell';
    out.error = (out.error ? String(out.error) + ' | ' : '') + 'Manual rules cannot return outcome=fail; coerced to cantTell.';
  }

  out.severity = out.severity || def.defaultSeverity;

  let conf = raw && raw.confidence;
  if (!pol.allowedConfidence.includes(conf)) conf = def.defaultConfidence;
  out.confidence = conf;

  out.type = def.type;

  // Standards-only metadata passthrough for traceability
  out.meta = {
    ruleId: def.ruleId,
    ruleInterfaceVersion: def.ruleInterfaceVersion,
    ruleVersion: def.ruleVersion,
    normative: def.normative,
    atomic: def.atomic,
    category: def.category || null,
    normativeMappings: Array.isArray(def.normativeMappings) ? def.normativeMappings.map((o) => ({ ...o })) : [],
    informativeReferences: Array.isArray(def.informativeReferences) ? def.informativeReferences.map((o) => ({ ...o })) : [],
    standard: def.standard || null,
    applicability: def.applicability || '',
    expectation: def.expectation || '',
    references: Array.isArray(def.references) ? def.references.slice() : [],
    requirements: def.requirements || null,
    mappings: def.mappings || null
  };

  out.schemaVersion = schemaVersion;

  const occ = Array.isArray(out.occurrences) ? out.occurrences : [];
  out.occurrences = occ.map((item) => {
    const o = item && typeof item === 'object' ? { ...item } : {};

    // Engine-side finalization (only if rule reported a node)
    const node = o.__node || null;
    if (node) delete o.__node;

    if (needsDetails && node && helpers && typeof helpers === 'object') {
      if (includeSelector && (!o.selector || typeof o.selector !== 'string')) {
        try {
          o.selector = (typeof helpers.buildSelector === 'function') ? String(helpers.buildSelector(node) || '') : '';
        } catch {
          o.selector = '';
        }
      }
      if (includeHtml && (!o.html || typeof o.html !== 'string')) {
        try {
          o.html = (typeof helpers.getOuterHtmlSnippet === 'function') ? String(helpers.getOuterHtmlSnippet(node) || '') : '';
        } catch {
          o.html = '';
        }
      }
    }

    // Enforce string types (deterministic / no-throw)
    if (typeof o.selector !== 'string') o.selector = '';
    if (typeof o.summary !== 'string') o.summary = '';
    if (typeof o.hint !== 'string') o.hint = '';
    if (typeof o.html !== 'string') o.html = '';

    // Existing i18n normalization/resolution (leave as-is, shown shortened here)
    if (o.i18n && typeof o.i18n === 'object' && !Array.isArray(o.i18n)) {
      const ii = { ...o.i18n };
      if (typeof ii.summaryKey !== 'string') ii.summaryKey = '';
      if (typeof ii.hintKey !== 'string') ii.hintKey = '';
      if (ii.params && typeof ii.params === 'object' && !Array.isArray(ii.params)) {
        ii.params = { ...ii.params };
      } else {
        ii.params = {};
      }
      o.i18n = ii;

      if (ii.summaryKey) o.summary = t(ii.summaryKey, o.summary, ii.params, out.engineOptions || null);
      if (ii.hintKey) o.hint = t(ii.hintKey, o.hint, ii.params, out.engineOptions || null);
    } else {
      o.i18n = null;
    }

    return o;
  });

  if (raw && raw.error) out.error = String(raw.error);

  return out;
}

function toCatalogEntry(r, engineOptions) {
  return {
    ruleId: r.ruleId,
    title: (r && r.i18n ? t(r.i18n.titleKey, r.title, null, engineOptions) : r.title),
    description: (r && r.i18n ? t(r.i18n.descriptionKey, r.description, null, engineOptions) : r.description),
    i18n: r.i18n || null,
    helpUrl: r.helpUrl,
    tags: Array.isArray(r.tags) ? r.tags.slice() : [],
    normativeMappings: Array.isArray(r.normativeMappings) ? r.normativeMappings.map((o) => ({ ...o })) : [],
    informativeReferences: Array.isArray(r.informativeReferences) ? r.informativeReferences.map((o) => ({ ...o })) : [],
    defaultSeverity: r.defaultSeverity,
    defaultConfidence: r.defaultConfidence,
    type: r.type,
    coverage: r.coverage || null,

    data: (r.data === undefined ? null : r.data),

    ruleInterfaceVersion: r.ruleInterfaceVersion,
    ruleVersion: r.ruleVersion,
    normative: r.normative,
    atomic: r.atomic,
    category: r.category || null,
    standard: r.standard || null,
    applicability: r.applicability || '',
    expectation: r.expectation || '',
    references: Array.isArray(r.references) ? r.references.slice() : [],
    requirements: r.requirements || null,
    mappings: r.mappings || null
  };
}

// Inlined from src/core/contrast-helpers.js
const createContrastHelpers = (function createContrastHelpers(opts, shared) {
    const window = opts && opts.window ? opts.window : null;

    const trim = shared.trim;
    const computedStyle = shared.computedStyle;
    const composedParent = shared.composedParent;
    const buildSimpleSelector = shared.buildSimpleSelector;

    const clamp01 = (n) => {
        const x = Number(n);
        if (Number.isNaN(x)) return 0;
        if (x < 0) return 0;
        if (x > 1) return 1;
        return x;
    };

    const clamp255 = (n) => {
        const x = Number(n);
        if (Number.isNaN(x)) return 0;
        if (x < 0) return 0;
        if (x > 255) return 255;
        return x;
    };

    // -------- Shared per-run caches (shared.__contrastSharedCache lifetime is per engine run) --------

    function __getSharedWeakMapCache(propName) {
        try {
            const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
            if (!sc) return null;
            const existing = sc[propName];
            if (existing && typeof existing.get === 'function' && typeof existing.set === 'function') return existing;
            const wm = new WeakMap();
            sc[propName] = wm;
            return wm;
        } catch (_e) {
            return null;
        }
    }

    function __getSharedTextScanCache() {
        try {
            const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
            if (!sc) return null;

            if (
                sc.__textScanCache &&
                typeof sc.__textScanCache.get === 'function' &&
                typeof sc.__textScanCache.set === 'function' &&
                typeof sc.__textScanCache.has === 'function'
            ) {
                return sc.__textScanCache;
            }

            try {
                Object.defineProperty(sc, '__textScanCache', {
                    value: new Map(),
                    writable: false,
                    enumerable: false,
                    configurable: true
                });
            } catch {
                sc.__textScanCache = new Map();
            }
            return sc.__textScanCache;
        } catch {
            return null;
        }
    }

    function __getSharedColorParseCache() {
        try {
            const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
            if (!sc) return null;

            if (sc.__colorParseCache && typeof sc.__colorParseCache.get === 'function') {
                return sc.__colorParseCache;
            }
            const m = new Map();
            sc.__colorParseCache = m;
            return m;
        } catch (_e) {
            return null;
        }
    }

    // -------- Computed style memoization (per element, per run) --------

    const __localComputedStyleCache = new WeakMap();
    const __computedStyleCache = __getSharedWeakMapCache('__computedStyleCache') || __localComputedStyleCache;

    function __contrastComputedStyle(el) {
        try {
            if (!el || el.nodeType !== 1) return computedStyle(el);
            if (__computedStyleCache.has(el)) return __computedStyleCache.get(el);
            const cs = computedStyle(el);
            __computedStyleCache.set(el, cs);
            return cs;
        } catch {
            // Always no-throw: return empty object on any failure
            try {
                const cs = computedStyle(el);
                if (el && el.nodeType === 1) __computedStyleCache.set(el, cs);
                return cs;
            } catch {
                return {};
            }
        }
    }

    // Cache common booleans per element (per run)
    const __localHasBgImgCache = new WeakMap();
    const __localHasBlendModeCache = new WeakMap();
    const __localHasFilterCache = new WeakMap();
    const __hasBgImgCache = __getSharedWeakMapCache('__hasBgImgCache') || __localHasBgImgCache;
    const __hasBlendModeCache = __getSharedWeakMapCache('__hasBlendModeCache') || __localHasBlendModeCache;
    const __hasFilterCache = __getSharedWeakMapCache('__hasFilterCache') || __localHasFilterCache;


    // Cache parsed colors / numeric opacity per element (per run)
    const __localOpacityFloatCache = new WeakMap();
    const __opacityFloatCache = __getSharedWeakMapCache('__opacityFloatCache') || __localOpacityFloatCache;

    const __localBgColorRgbaCache = new WeakMap();
    const __bgColorRgbaCache = __getSharedWeakMapCache('__bgColorRgbaCache') || __localBgColorRgbaCache;

    const __localFgColorRgbaCache = new WeakMap();
    const __fgColorRgbaCache = __getSharedWeakMapCache('__fgColorRgbaCache') || __localFgColorRgbaCache;

    function __opacityFloat(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));
            if (__opacityFloatCache.has(el)) return __opacityFloatCache.get(el);
            const o = clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));
            __opacityFloatCache.set(el, o);
            return o;
        } catch {
            return 1;
        }
    }

    function __bgColorRgba(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return parseCssColorToRgba(cs && cs.backgroundColor);
            if (__bgColorRgbaCache.has(el)) return __bgColorRgbaCache.get(el);
            const c = parseCssColorToRgba(cs && cs.backgroundColor);
            __bgColorRgbaCache.set(el, c);
            return c;
        } catch {
            return null;
        }
    }

    function __fgColorRgba(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return parseCssColorToRgba(cs && cs.color);
            if (__fgColorRgbaCache.has(el)) return __fgColorRgbaCache.get(el);
            const c = parseCssColorToRgba(cs && cs.color);
            __fgColorRgbaCache.set(el, c);
            return c;
        } catch {
            return null;
        }
    }

    // -------- Visibility mode resolution for getTextScan --------

    function __getVisibilityMode(engineOptions) {
        const m = engineOptions && typeof engineOptions.visibilityMode === 'string' ? engineOptions.visibilityMode : '';
        return m || 'styleOnly';
    }

    function __resolveVisibilityMode(ctx, engineOptions, d, w) {
        // If getTextScan was called with a direct string (unlikely, but safe)
        if (typeof engineOptions === 'string') return engineOptions;

        const candidates = [
            engineOptions,

            // common shapes
            ctx && ctx.engineOptions,
            ctx && ctx.options && ctx.options.engineOptions,
            ctx && ctx.options,
            ctx && ctx.opts && ctx.opts.engineOptions,
            ctx && ctx.opts,

            // policy layering shapes
            ctx && ctx.policyOverrides && ctx.policyOverrides.engineOptions,
            ctx && ctx.policyOverrides,
            ctx && ctx.policy && ctx.policy.engineOptions,
            ctx && ctx.policy,

            // sometimes hoisted
            ctx,

            // opts passed into createContrastHelpers
            opts && opts.engineOptions,
            opts && opts.options && opts.options.engineOptions,
            opts && opts.options,
            opts && opts.opts && opts.opts.engineOptions,
            opts && opts.opts,

            opts && opts.policyOverrides && opts.policyOverrides.engineOptions,
            opts && opts.policyOverrides,
            opts && opts.policy && opts.policy.engineOptions,
            opts && opts.policy,

            // globals sometimes used by runners
            w && w.__a11ycoreEngineOptions,
            d && d.__a11ycoreEngineOptions
        ];

        for (const c of candidates) {
            if (!c || typeof c !== 'object') continue;

            if (typeof c.visibilityMode === 'string') return c.visibilityMode;

            if (
                c.engineOptions &&
                typeof c.engineOptions === 'object' &&
                typeof c.engineOptions.visibilityMode === 'string'
            ) {
                return c.engineOptions.visibilityMode;
            }

            if (
                c.options &&
                typeof c.options === 'object' &&
                c.options.engineOptions &&
                typeof c.options.engineOptions === 'object' &&
                typeof c.options.engineOptions.visibilityMode === 'string'
            ) {
                return c.options.engineOptions.visibilityMode;
            }

            if (
                c.policy &&
                typeof c.policy === 'object' &&
                c.policy.engineOptions &&
                typeof c.policy.engineOptions === 'object' &&
                typeof c.policy.engineOptions.visibilityMode === 'string'
            ) {
                return c.policy.engineOptions.visibilityMode;
            }

            if (
                c.policyOverrides &&
                typeof c.policyOverrides === 'object' &&
                c.policyOverrides.engineOptions &&
                typeof c.policyOverrides.engineOptions === 'object' &&
                typeof c.policyOverrides.engineOptions.visibilityMode === 'string'
            ) {
                return c.policyOverrides.engineOptions.visibilityMode;
            }
        }

        return 'styleOnly';
    }

    function __asEligibilityBool(v) {
        if (typeof v === 'boolean') return v;
        if (v && typeof v === 'object' && typeof v.eligible === 'boolean') return v.eligible;
        return !!v;
    }

    function getTextScan(ctx, helpers, engineOptions) {
        try {
            const d = (ctx && ctx.document) || (opts && opts.document) || null;

            const w =
                (ctx && ctx.window) ||
                (d && d.defaultView) ||
                window ||
                null;

            const rawMode = __resolveVisibilityMode(ctx, engineOptions, d, w);

            const visibilityMode =
                __getVisibilityMode({ visibilityMode: rawMode }) === 'styleAndGeometry'
                    ? 'styleAndGeometry'
                    : 'styleOnly';

            if (!d || typeof d.createTreeWalker !== 'function') {
                return { eligibleTextCount: 0, elements: [], visibilityMode };
            }

            const cache = __getSharedTextScanCache();
            const cacheKey = `visibilityMode=${visibilityMode}`;
            if (cache && cache.has(cacheKey)) return cache.get(cacheKey);

            const walkRoot = d.body || d.documentElement || d;

            const SHOW_TEXT =
                (w && w.NodeFilter && typeof w.NodeFilter.SHOW_TEXT === 'number')
                    ? w.NodeFilter.SHOW_TEXT
                    : 4;

            const walker = d.createTreeWalker(walkRoot, SHOW_TEXT, null);

            const isNonEmptyText = (t) => t != null && /\S/.test(String(t));

            const elToCount = new WeakMap();
            const elements = [];
            let eligibleTextCount = 0;

            const eligCache = new WeakMap();

            const isVisibleEligible = (el) => {
                if (!helpers || typeof helpers.isDomVisibleEligible !== 'function') return true;
                if (eligCache.has(el)) return eligCache.get(el);

                let ok = true;
                try {
                    const r = helpers.isDomVisibleEligible(el, ctx, { visibilityMode });
                    ok = __asEligibilityBool(r);
                } catch {
                    ok = false;
                }

                eligCache.set(el, ok);
                return ok;
            };

            let node = null;
            let guard = 0;

            while ((node = walker.nextNode()) && guard++ < 500000) {
                const text = node && node.nodeValue;
                if (!isNonEmptyText(text)) continue;

                const el =
                    node.parentElement ||
                    (node.parentNode && node.parentNode.nodeType === 1 ? node.parentNode : null);

                if (!el) continue;
                if (!isVisibleEligible(el)) continue;

                eligibleTextCount++;

                const prev = elToCount.get(el);
                if (prev === undefined) {
                    elToCount.set(el, 1);
                    elements.push(el);
                } else {
                    elToCount.set(el, prev + 1);
                }
            }

            const out = Object.freeze({
                eligibleTextCount,
                visibilityMode,
                elements: Object.freeze(
                    elements.map((el) => Object.freeze({ el, textCount: elToCount.get(el) || 0 }))
                )
            });

            if (cache) cache.set(cacheKey, out);
            return out;
        } catch {
            return { eligibleTextCount: 0, elements: [], visibilityMode: 'styleOnly' };
        }
    }

    // -------- Formatting helpers --------

    function toHex2(n) {
        const x = clamp255(n);
        const s = x.toString(16).toLowerCase();
        return s.length === 1 ? '0' + s : s;
    }

    function rgbToHex(rgb) {
        try {
            if (!rgb || typeof rgb !== 'object') return '';
            return '#' + toHex2(rgb.r) + toHex2(rgb.g) + toHex2(rgb.b);
        } catch {
            return '';
        }
    }

    // 96px/in, 72pt/in => 1px = 0.75pt
    function pxToPt(px) {
        const x = parseFloat(px);
        if (!Number.isFinite(x)) return '';
        return (x * 0.75).toFixed(1);
    }

    function fontWeightLabel(fontWeightNum) {
        const w = Number(fontWeightNum);
        if (Number.isFinite(w) && w >= 700) return 'bold';
        return 'normal';
    }

    function round2(n) {
        const x = Number(n);
        if (!Number.isFinite(x)) return '0.00';
        return (Math.round(x * 100) / 100).toFixed(2);
    }

    function rgbaToString(rgba) {
        if (!rgba || typeof rgba !== 'object') return '';
        const r = clamp255(rgba.r);
        const g = clamp255(rgba.g);
        const b = clamp255(rgba.b);
        const a = clamp01(rgba.a);
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }

    function parsePx(value) {
        if (value == null) return null;

        if (typeof value === 'number' && Number.isFinite(value)) return value;

        const s = String(value).trim().toLowerCase();
        if (!s) return null;

        const n = parseFloat(s);
        if (!Number.isFinite(n)) return null;

        if (s.endsWith('px')) return n;
        if (s.endsWith('pt')) return n * (96 / 72);

        if (s.endsWith('rem')) return n * 16;
        if (s.endsWith('em')) return n * 16;
        if (s.endsWith('%')) return (n / 100) * 16;

        return n;
    }

    function normalizeFontWeight(v) {
        const s = trim(v).toLowerCase();
        if (!s) return 400;
        if (s === 'normal') return 400;
        if (s === 'bold' || s === 'bolder') return 700;
        if (s === 'lighter') return 300;
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) ? n : 400;
    }

    function isLargeText(fontSizePx, fontWeightNum) {
        const size = parseFloat(fontSizePx);
        const w = Number(fontWeightNum);
        if (!Number.isFinite(size)) return false;
        if (size >= 24) return true;
        if (size >= 18.6667 && Number.isFinite(w) && w >= 700) return true;
        return false;
    }

    function requiredRatio(level, large) {
        const l = String(level || '').toUpperCase();
        if (l === 'AAA') return large ? 4.5 : 7.0;
        return large ? 3.0 : 4.5;
    }

    // -------- CSS color parsing + memoization --------

    const __localColorParseCache = new Map();
    const __colorParseCache = __getSharedColorParseCache() || __localColorParseCache;

    function __normalizeCssColorCacheKey(input) {
        const raw = input == null ? '' : String(input);
        let s = trim(raw).toLowerCase();
        if (!s) return '';
        s = s.replace(/\s+/g, ' ');
        s = s.replace(/\s*,\s*/g, ',');
        s = s.replace(/\(\s+/g, '(');
        s = s.replace(/\s+\)/g, ')');
        s = s.replace(/\s*\/\s*/g, '/');
        s = s.replace(/\s*%\s*/g, '%');
        return s;
    }

    function __parseCssColorToRgbaUncached(input) {
        const s = trim(input).toLowerCase();
        if (!s) return null;
        if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

        if (s[0] === '#') {
            const hex = s.slice(1);
            const isHex = /^[0-9a-f]+$/i.test(hex);
            if (!isHex) return null;

            const hexToInt = (h) => Number.parseInt(h, 16);

            try {
                if (hex.length === 3) {
                    const r = hexToInt(hex[0] + hex[0]);
                    const g = hexToInt(hex[1] + hex[1]);
                    const b = hexToInt(hex[2] + hex[2]);
                    return { r, g, b, a: 1 };
                }
                if (hex.length === 4) {
                    const r = hexToInt(hex[0] + hex[0]);
                    const g = hexToInt(hex[1] + hex[1]);
                    const b = hexToInt(hex[2] + hex[2]);
                    const a = hexToInt(hex[3] + hex[3]) / 255;
                    return { r, g, b, a: clamp01(a) };
                }
                if (hex.length === 6) {
                    const r = hexToInt(hex.slice(0, 2));
                    const g = hexToInt(hex.slice(2, 4));
                    const b = hexToInt(hex.slice(4, 6));
                    return { r, g, b, a: 1 };
                }
                if (hex.length === 8) {
                    const r = hexToInt(hex.slice(0, 2));
                    const g = hexToInt(hex.slice(2, 4));
                    const b = hexToInt(hex.slice(4, 6));
                    const a = hexToInt(hex.slice(6, 8)) / 255;
                    return { r, g, b, a: clamp01(a) };
                }
            } catch {}
            return null;
        }

        const m = s.match(/^rgba?\((.*)\)$/);

        // Modern space-separated: rgb(0 0 0 / 0.5)
        if (m && m[1] && m[1].indexOf(',') === -1) {
            const body = trim(m[1]);
            const parts2 = body.split('/').map((x) => trim(x));
            const rgbPart = parts2[0] || '';
            const aPart = parts2[1] || '';

            const rgbNums = rgbPart.split(/\s+/).map((x) => trim(x)).filter(Boolean);
            if (rgbNums.length >= 3) {
                const parseChannel2 = (t) => {
                    if (!t) return null;
                    if (t.endsWith('%')) {
                        const p = Number.parseFloat(t);
                        if (!Number.isFinite(p)) return null;
                        return clamp255(Math.round((p / 100) * 255));
                    }
                    const n = Number.parseFloat(t);
                    if (!Number.isFinite(n)) return null;
                    return clamp255(Math.round(n));
                };

                const r = parseChannel2(rgbNums[0]);
                const g = parseChannel2(rgbNums[1]);
                const b = parseChannel2(rgbNums[2]);
                if (r == null || g == null || b == null) return null;

                let a = 1;
                if (aPart) {
                    if (aPart.endsWith('%')) {
                        const p = Number.parseFloat(aPart);
                        if (Number.isFinite(p)) a = clamp01(p / 100);
                    } else {
                        const n = Number.parseFloat(aPart);
                        if (Number.isFinite(n)) a = clamp01(n);
                    }
                }

                return { r, g, b, a };
            }
        }

        // Comma-separated: rgb(0,0,0) / rgba(0,0,0,0.5)
        if (m && m[1]) {
            const parts = m[1].split(',').map((x) => trim(x));
            if (parts.length < 3) return null;

            const parseChannel = (t) => {
                if (!t) return null;
                if (t.endsWith('%')) {
                    const p = Number.parseFloat(t);
                    if (!Number.isFinite(p)) return null;
                    return clamp255(Math.round((p / 100) * 255));
                }
                const n = Number.parseFloat(t);
                if (!Number.isFinite(n)) return null;
                return clamp255(Math.round(n));
            };

            const r = parseChannel(parts[0]);
            const g = parseChannel(parts[1]);
            const b = parseChannel(parts[2]);
            if (r == null || g == null || b == null) return null;

            let a = 1;
            if (parts.length >= 4) {
                const t = parts[3];
                if (t && t.endsWith('%')) {
                    const p = Number.parseFloat(t);
                    if (Number.isFinite(p)) a = clamp01(p / 100);
                } else {
                    const n = Number.parseFloat(t);
                    if (Number.isFinite(n)) a = clamp01(n);
                }
            }
            return { r, g, b, a };
        }

        return null;
    }

    function parseCssColorToRgba(input) {
        const key = __normalizeCssColorCacheKey(input);
        if (!key) return null;
        if (__colorParseCache.has(key)) return __colorParseCache.get(key);

        const out = __parseCssColorToRgbaUncached(key);
        __colorParseCache.set(key, out);
        return out;
    }

    // -------- Color math --------

    function compositeRgba(src, dst) {
        const s = src && typeof src === 'object' ? src : { r: 0, g: 0, b: 0, a: 0 };
        const d = dst && typeof dst === 'object' ? dst : { r: 0, g: 0, b: 0, a: 0 };

        const as = clamp01(s.a);
        const ad = clamp01(d.a);

        const outA = as + ad * (1 - as);
        if (outA <= 0) return { r: 0, g: 0, b: 0, a: 0 };

        const rs = clamp255(s.r);
        const gs = clamp255(s.g);
        const bs = clamp255(s.b);

        const rd = clamp255(d.r);
        const gd = clamp255(d.g);
        const bd = clamp255(d.b);

        const outR = (rs * as + rd * ad * (1 - as)) / outA;
        const outG = (gs * as + gd * ad * (1 - as)) / outA;
        const outB = (bs * as + bd * ad * (1 - as)) / outA;

        return {
            r: clamp255(Math.round(outR)),
            g: clamp255(Math.round(outG)),
            b: clamp255(Math.round(outB)),
            a: clamp01(outA)
        };
    }

    function srgbToLinear(c) {
        const cs = Number(c) / 255;
        if (cs <= 0.03928) return cs / 12.92;
        return Math.pow((cs + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(rgb) {
        const r = srgbToLinear(clamp255(rgb.r));
        const g = srgbToLinear(clamp255(rgb.g));
        const b = srgbToLinear(clamp255(rgb.b));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrastRatio(fgRgb, bgRgb) {
        const L1 = relativeLuminance(fgRgb);
        const L2 = relativeLuminance(bgRgb);
        const lighter = Math.max(L1, L2);
        const darker = Math.min(L1, L2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function truncateCssValue(v, maxLen) {
        const s = trim(v);
        const n = (Number(maxLen) | 0) > 10 ? (Number(maxLen) | 0) : 80;
        if (s.length <= n) return s;
        return s.slice(0, n - 3) + '...';
    }

    function hasBackgroundImageOrGradient(style) {
        try {
            const v = style && style.backgroundImage;
            return !!(v && String(v).trim() && String(v).trim().toLowerCase() !== 'none');
        } catch {
            return false;
        }
    }

    function hasBlendMode(style) {
        try {
            const v = style && style.mixBlendMode;
            return !!(v && String(v).trim() && String(v).trim().toLowerCase() !== 'normal');
        } catch {
            return false;
        }
    }

    function hasFilter(style) {
        try {
            const f = style && style.filter;
            const bf = style && style.backdropFilter;
            const fOn = f && String(f).trim().toLowerCase() !== 'none';
            const bfOn = bf && String(bf).trim().toLowerCase() !== 'none';
            return !!(fOn || bfOn);
        } catch {
            return false;
        }
    }

    function __hasBackgroundImageOrGradientEl(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return hasBackgroundImageOrGradient(cs);
            if (__hasBgImgCache.has(el)) return __hasBgImgCache.get(el);
            const v = hasBackgroundImageOrGradient(cs);
            __hasBgImgCache.set(el, v);
            return v;
        } catch {
            return false;
        }
    }

    function __hasBlendModeEl(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return hasBlendMode(cs);
            if (__hasBlendModeCache.has(el)) return __hasBlendModeCache.get(el);
            const v = hasBlendMode(cs);
            __hasBlendModeCache.set(el, v);
            return v;
        } catch {
            return false;
        }
    }

    function __hasFilterEl(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return hasFilter(cs);
            if (__hasFilterCache.has(el)) return __hasFilterCache.get(el);
            const v = hasFilter(cs);
            __hasFilterCache.set(el, v);
            return v;
        } catch {
            return false;
        }
    }

    // -------- Opacity product memoization --------

    const __localOpacityProductCache = new WeakMap();
    const __opacityProductCache = __getSharedWeakMapCache('__opacityProductCache') || __localOpacityProductCache;

    function computeOpacityProduct(el) {
        try {
            if (!el || (typeof el !== 'object' && typeof el !== 'function')) return 1;
            if (__opacityProductCache.has(el)) return __opacityProductCache.get(el);

            let prod = 1;
            let cur = el;
            let guard = 0;
            while (cur && guard++ < 200) {
                if (cur.nodeType !== 1) {
                    cur = composedParent(cur);
                    continue;
                }
                const cs = __contrastComputedStyle(cur);
                const o = __opacityFloat(cur, cs);
                prod *= o;
                cur = composedParent(cur);
                if (prod <= 0) break;
            }

            const out = clamp01(prod);
            __opacityProductCache.set(el, out);
            return out;
        } catch (_e) {
            return 1;
        }
    }

    // -------- Effective foreground/background memoization --------

    const __localEffectiveForegroundCache = new WeakMap();
    const __effectiveForegroundCache =
        __getSharedWeakMapCache('__effectiveForegroundCache') || __localEffectiveForegroundCache;

    function computeEffectiveForeground(el) {
        try {
            if (el && __effectiveForegroundCache.has(el)) return __effectiveForegroundCache.get(el);
        } catch (_e) {}

        const cs = __contrastComputedStyle(el);
        const c = __fgColorRgba(el, cs);
        if (!c) {
            const out = { rgba: null, alpha: 0, opacityProduct: computeOpacityProduct(el) };
            try { if (el) __effectiveForegroundCache.set(el, out); } catch (_e) {}
            return out;
        }

        const op = computeOpacityProduct(el);
        const out = {
            rgba: { r: c.r, g: c.g, b: c.b, a: clamp01(c.a * op) },
            alpha: clamp01(c.a * op),
            opacityProduct: op
        };
        try { if (el) __effectiveForegroundCache.set(el, out); } catch (_e) {}
        return out;
    }

    const __localEffectiveBackgroundCache = new WeakMap();
    const __effectiveBackgroundCache =
        __getSharedWeakMapCache('__effectiveBackgroundCache') || __localEffectiveBackgroundCache;

    function __bgCacheKey(opts2) {
        const profileRaw = opts2 && typeof opts2.profile === 'string' ? opts2.profile : 'strictConformance';
        const profile = String(profileRaw).trim().toLowerCase();
        const rootCanvasFallback = opts2 && typeof opts2.rootCanvasFallback === 'string' ? opts2.rootCanvasFallback : '#ffffff';
        const collectStack = !!(opts2 && opts2.collectStack);
        return `p=${profile}|f=${rootCanvasFallback}|s=${collectStack ? '1' : '0'}`;
    }

    function computeEffectiveBackground(el, opts2) {
        const __bgKey = __bgCacheKey(opts2);
        const __collectStack = !!(opts2 && opts2.collectStack);

        // Only cache when stack collection is off
        if (!__collectStack) {
            try {
                if (el && __effectiveBackgroundCache.has(el)) {
                    const m = __effectiveBackgroundCache.get(el);
                    if (m && typeof m.get === 'function' && m.has(__bgKey)) return m.get(__bgKey);
                }
            } catch (_e) {}
        }

        const profileRaw = opts2 && typeof opts2.profile === 'string' ? opts2.profile : 'strictConformance';
        const profile = String(profileRaw).trim().toLowerCase();
        const rootCanvasFallback = opts2 && typeof opts2.rootCanvasFallback === 'string' ? opts2.rootCanvasFallback : '#ffffff';

        const collectStack = !!(opts2 && opts2.collectStack);
        const stack = collectStack ? [] : null;
        let acc = { r: 0, g: 0, b: 0, a: 0 };

        let cur = el;
        let guard = 0;

        while (cur && guard++ < 200) {
            if (cur.nodeType !== 1) { cur = composedParent(cur); continue; }

            const cs = __contrastComputedStyle(cur);
            const bg = __bgColorRgba(cur, cs);
            const op = __opacityFloat(cur, cs);

            if (bg) {
                const layer = { r: bg.r, g: bg.g, b: bg.b, a: clamp01(bg.a * op) };
                if (collectStack) {
                    stack.push({
                        selector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                        bg: { r: layer.r, g: layer.g, b: layer.b, a: layer.a },
                        opacity: op
                    });
                }
                acc = compositeRgba(layer, acc);
                if (acc.a >= 1) break;
            }

            cur = composedParent(cur);
        }

        let out;
        if (acc.a < 1) {
            if (profile === 'referenceenginecompat') {
                const fb = parseCssColorToRgba(rootCanvasFallback) || { r: 255, g: 255, b: 255, a: 1 };
                acc = compositeRgba(fb, acc);
                out = { ok: false, rgba: acc, alpha: acc.a, stack: stack || [], reasonCode: null };
            } else {
                out = { ok: false, rgba: acc, alpha: acc.a, stack, reasonCode: 'BACKGROUND_NOT_OPAQUE_AT_ROOT' };
            }
        } else {
            out = { ok: true, rgba: acc, alpha: acc.a, stack, reasonCode: null };
        }

        if (!__collectStack && el) {
            try {
                let m = __effectiveBackgroundCache.get(el);
                if (!m) { m = new Map(); __effectiveBackgroundCache.set(el, m); }
                m.set(__bgKey, out);
            } catch (_e) {}
        }

        return out;
    }

    // -------- Selector memoization --------

    const __localSimpleSelectorCache = new WeakMap();
    const __simpleSelectorCache = __getSharedWeakMapCache('__simpleSelectorCache') || __localSimpleSelectorCache;

    function __getSimpleSelectorCached(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return '';
            if (__simpleSelectorCache.has(el)) return __simpleSelectorCache.get(el) || '';
            const s = buildSimpleSelector(el, fallbackTag);
            __simpleSelectorCache.set(el, s || '');
            return s || '';
        } catch (_e) {
            return '';
        }
    }

    // -------- Computability blocker (memoized per element, per run) --------

    const __localComputabilityBlockerCache = new WeakMap();
    const __computabilityBlockerCache =
        __getSharedWeakMapCache('__computabilityBlockerCache') || __localComputabilityBlockerCache;

    function getComputabilityBlocker(el) {
        try {
            if (el && __computabilityBlockerCache.has(el)) return __computabilityBlockerCache.get(el);
        } catch (_e) {}

        let cur = el;
        let guard = 0;
        while (cur && guard++ < 200) {
            if (cur.nodeType !== 1) { cur = composedParent(cur); continue; }
            const cs = __contrastComputedStyle(cur);

            if (__hasBlendModeEl(cur, cs)) {
                const out = {
                    ok: false,
                    reasonCode: 'MIX_BLEND_MODE',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: 'mix-blend-mode',
                    blockerValue: truncateCssValue(cs && cs.mixBlendMode, 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            if (__hasFilterEl(cur, cs)) {
                const isFilter = cs && cs.filter && String(cs.filter).trim().toLowerCase() !== 'none';
                const out = {
                    ok: false,
                    reasonCode: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: isFilter ? 'filter' : 'backdrop-filter',
                    blockerValue: truncateCssValue((isFilter ? cs.filter : cs.backdropFilter) || '', 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            if (__hasBackgroundImageOrGradientEl(cur, cs)) {
                const out = {
                    ok: false,
                    reasonCode: 'BACKGROUND_IMAGE_OR_GRADIENT',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: 'background-image',
                    blockerValue: truncateCssValue(cs && cs.backgroundImage, 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            cur = composedParent(cur);
        }

        const out = { ok: true, reasonCode: null, blockerSelector: '', blockerProperty: '', blockerValue: '' };
        try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
        return out;
    }

    return {
        clamp01,
        clamp255,
        round2,
        rgbaToString,
        parsePx,
        normalizeFontWeight,
        isLargeText,
        requiredRatio,
        parseCssColorToRgba,
        compositeRgba,
        relativeLuminance,
        contrastRatio,
        toHex2,
        rgbToHex,
        pxToPt,
        fontWeightLabel,
        hasBackgroundImageOrGradient,
        hasBlendMode,
        hasFilter,
        computeOpacityProduct,
        computeEffectiveForeground,
        computeEffectiveBackground,
        getComputabilityBlocker,
        getTextScan
    };
});

// Inlined from src/core/dom-helpers.js
const normalizeSelectorList = (function normalizeSelectorList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === 'string') {
        // allow "#a,#b" or "#a, #b"
        return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
});
const createDomHelpers = (function createDomHelpers(opts) {
    const document = opts && opts.document ? opts.document : null;
    const window = opts && opts.window ? opts.window : null;
    // Some engine paths may not pass opts.window; recover it from document when possible.
    const realmWindow =
        window ||
        (document && document.defaultView) ||
        null;
    const root = opts && opts.root ? opts.root : null;
    const includeShadowDom = !!(opts && opts.includeShadowDom);
    const excludeSelectors = Array.isArray(opts && opts.excludeSelectors) ? opts.excludeSelectors : [];

    // -------------------------------------------------------------------------
    // Per-run shared caches (DOM helpers)
    // Stored on the realm window when possible so multiple helper instances
    // within the same run share caches deterministically.
    // -------------------------------------------------------------------------
    var __domSharedCache = {};
    var __selectorCache = null;
    var __outerHtmlCache = null;
    var __idLookupDocCache = null;   // Map<string, Element|null>
    var __idLookupRootCache = null;  // Map<string, Element|null>
    var __idRefCacheByRoot = null;   // WeakMap<object, Map<string, {refs, missing, flags, partsLen}>>
    var __idRefReverseIndexByScope = null; // WeakMap<object, Map<string, Set<Element>>>
    var __uniqIndexByScope = null; // WeakMap<object, object> (selector uniqueness index per scope)
    var __shadowRootsByRoot = null; // WeakMap<object, Array<object>> (cached open shadow roots per root)

    // -------------------------------------------------------------------------
    // Optional per-run performance counters (debug/benchmark only)
    // -------------------------------------------------------------------------
    const __perfEnabled = !!(opts && opts.perfStats);
    const __perf = __perfEnabled ? {enabled: true, counters: Object.create(null)} : null;

    function __perfInc(key, n) {
        if (!__perfEnabled || !__perf) return;
        const k = String(key);
        const add = n == null ? 1 : (Number(n) || 0);
        __perf.counters[k] = (__perf.counters[k] || 0) + add;
    }

    function getPerfStats() {
        if (!__perfEnabled || !__perf) return {enabled: false, counters: {}};
        // Return a shallow copy to prevent accidental mutation by callers
        return {enabled: true, counters: {...__perf.counters}};
    }

    function resetPerfStats() {
        if (!__perfEnabled || !__perf) return;
        __perf.counters = Object.create(null);
    }


    // -------------------------------------------------------------------------
    // Shared escaping helpers (reduce per-call allocations, deterministic)
    // -------------------------------------------------------------------------
    const __w = realmWindow || window;
    const __cssEscapeSafe = (s) => {
        try {
            return __w && __w.CSS && typeof __w.CSS.escape === 'function' ? __w.CSS.escape(String(s)) : String(s);
        } catch {
            return String(s);
        }
    };
    const __cssEscapeIdent = (s) => {
        try {
            if (__w && __w.CSS && typeof __w.CSS.escape === 'function') return __w.CSS.escape(String(s));
        } catch {
        }
        return String(s).replace(/[^a-zA-Z0-9\-_]/g, '\\$&');
    };
    const __escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');


    // --- eligibility utilities ---
    const isElement = (n) => !!n && n.nodeType === 1;
    const computedStyle = (el) => {
        // Per-run memoization scoped by *helper scope* (root/document), to ensure
        // style caching does not bleed across helper instances with different roots.
        // This aligns with eligibility cache scoping semantics locked by tests.
        const scope = (root && typeof root === 'object') ? root : (document && typeof document === 'object' ? document : null);

        let map = null;

        try {
            if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
                map = __computedStyleCacheByScope.get(scope) || null;
                if (map && map.has(el)) {
                    __perfInc('computedStyle.hit');
                    const c = map.get(el);
                    return c && typeof c === 'object' ? c : {};
                }
            }
        } catch { /* ignore */
        }

        __perfInc('computedStyle.miss');
        let cs = {};
        try {
            const w = realmWindow || window;
            cs = w && w.getComputedStyle ? w.getComputedStyle(el) : (el && el.style) || {};
        } catch {
            cs = {};
        }

        try {
            if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
                if (!map) {
                    map = __computedStyleCacheByScope.get(scope) || null;
                    if (!map) {
                        map = new WeakMap();
                        __computedStyleCacheByScope.set(scope, map);
                    }
                }
                map.set(el, cs);
            }
        } catch {
            __perfInc('computedStyle.nocache');
        }

        return cs && typeof cs === 'object' ? cs : {};
    };

    const getOpenModalDialogs = () => {
        // Per-run memoization of open modal dialogs (document-scoped).
        // Safe under engine constraints (no DOM mutation during a run); deterministic.
        if (!document || !document.querySelectorAll) return [];
        if (!__openModalDialogsByDoc) {
            __perfInc('modalDialogs.nocache');
        }
        try {
            if (__openModalDialogsByDoc) {
                const cached = __openModalDialogsByDoc.get(document);
                if (cached) {
                    __perfInc('modalDialogs.hit');
                    return cached;
                }
                __perfInc('modalDialogs.miss');
            }
        } catch {
            __perfInc('modalDialogs.nocache');
        }

        let list = [];
        try {
            const nl = document.querySelectorAll('dialog[open][aria-modal="true"]');
            // Preserve document order, avoid Array.from allocation where possible.
            for (const el of nl) list.push(el);
        } catch {
            list = [];
        }

        try {
            if (__openModalDialogsByDoc) __openModalDialogsByDoc.set(document, list);
        } catch { /* ignore */
        }

        return list;
    };

    const getRootNodeSafe = (n) => {
        try {
            return n && n.getRootNode ? n.getRootNode({composed: true}) : (document || null);
        } catch {
            return document || null;
        }
    };
    const composedParent = (n) => {
        if (!n) return null;
        const p = n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
        if (p) return p;
        const rn = getRootNodeSafe(n);
        return rn && rn.host ? rn.host : null;
    };
    const ancestorsIncludingSelf = (n) => {
        if (!n) return [];
        // Cache ancestor chains per node, per run, to avoid repeated composed-parent walks.
        // Deterministic: purely memoized within the current run, no cross-run persistence.
        try {
            if (__ancestorsIncludingSelfCache && typeof __ancestorsIncludingSelfCache.get === 'function') {
                const cached = __ancestorsIncludingSelfCache.get(n);
                if (cached) {
                    __perfInc('ancestorsIncludingSelf.hit');
                    return cached;
                }
                __perfInc('ancestorsIncludingSelf.miss');
                const out = [];
                let cur = n, guard = 0;
                while (cur && guard++ < 200) {
                    out.push(cur);
                    cur = composedParent(cur);
                }
                __ancestorsIncludingSelfCache.set(n, out);
                return out;
            }
        } catch { /* fall through */
        }

        __perfInc('ancestorsIncludingSelf.nocache');
        const out = [];
        let cur = n, guard = 0;
        while (cur && guard++ < 200) {
            out.push(cur);
            cur = composedParent(cur);
        }
        return out;
    };

    function getClosestMap(el) {
        try {
            if (!isElement(el)) return null;
            return el.closest ? el.closest('map') : null;
        } catch {
            return null;
        }
    }

    function hasBlockingInert(node) {
        // Default behavior: inert anywhere in ancestorsIncludingSelf blocks.
        if (!isElement(node)) return false;

        const tag = (node.tagName || '').toLowerCase();
        const isArea = tag === 'area';

        let mapEl = null;
        if (isArea) mapEl = getClosestMap(node);

        const chain = ancestorsIncludingSelf(node);

        for (const a of chain) {
            if (!isElement(a)) continue;

            // Exception: for <area>, inert on itself or on its <map> does NOT block
            if (isArea) {
                if (a === node) continue;     // ignore <area inert>
                if (mapEl && a === mapEl) continue; // ignore <map inert>
            }

            if (a.hasAttribute && a.hasAttribute('inert')) return true;
        }
        return false;
    }

    const trim = (v) => (v == null ? '' : String(v)).trim();

    const getAttr = (el, name) => {
        try {
            return el && el.getAttribute ? el.getAttribute(name) : null;
        } catch {
            return null;
        }
    };

    function parseTabIndex(el) {
        const raw = getAttr(el, 'tabindex');
        const t = trim(raw);
        if (raw == null || t === '') return {has: false, value: null, valid: false};
        const n = Number(t);
        if (Number.isNaN(n)) return {has: true, value: null, valid: false};
        return {has: true, value: n, valid: true};
    }

    function getPlatformFocusability(el) {
        // Per-run memoization (WeakMap<Element, Result>)
        try {
            if (__focusabilityCache && el && typeof el === 'object' && __focusabilityCache.has(el)) {
                __perfInc('focusability.hit');
                const c = __focusabilityCache.get(el);
                if (c && typeof c === 'object') {
                    return {
                        focusable: !!c.focusable,
                        tabbable: !!c.tabbable,
                        mechanism: c.mechanism || 'none',
                        flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                    };
                }
            }
        } catch {
        }

        __perfInc('focusability.miss');
        let result = null;

        if (!isElement(el)) {
            result = {focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement']};
        } else if (hasBlockingInert(el)) {
            result = {focusable: false, tabbable: false, mechanism: 'none', flags: ['inert']};
        } else {
            const flags = [];
            const disabled = !!(el.matches && el.matches(':disabled'));
            if (disabled) {
                result = {focusable: false, tabbable: false, mechanism: 'disabled', flags: ['disabled']};
            } else {
                const ti = parseTabIndex(el);
                if (ti.has) {
                    if (!ti.valid) result = {
                        focusable: false,
                        tabbable: false,
                        mechanism: 'tabindex',
                        flags: ['tabindex-invalid']
                    };
                    else if (ti.value < 0) result = {
                        focusable: true,
                        tabbable: false,
                        mechanism: 'tabindex',
                        flags: ['tabindex-negative']
                    };
                    else result = {
                            focusable: true,
                            tabbable: true,
                            mechanism: 'tabindex',
                            flags: ['tabindex-nonnegative']
                        };
                } else {
                    // native focusability
                    const native = isPlatformFocusable(el); // uses your existing boolean logic
                    if (native) result = {focusable: true, tabbable: true, mechanism: 'native', flags};
                    else result = {focusable: false, tabbable: false, mechanism: 'none', flags};
                }
            }
        }

        try {
            if (__focusabilityCache && el && typeof el === 'object') {
                __focusabilityCache.set(el, {
                    focusable: !!result.focusable,
                    tabbable: !!result.tabbable,
                    mechanism: result.mechanism || 'none',
                    flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
                });
            }
        } catch {
        }

        return {
            focusable: !!result.focusable,
            tabbable: !!result.tabbable,
            mechanism: result.mechanism || 'none',
            flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
        };
    }

    // --- attribute ---
    function getAttributeInfo(el, attr) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const attrValue = trim(getAttr(el, attr));
        if (!attrValue) return {present: false, value: '', mechanism: attr, flags: ['empty']};

        return {present: true, value: attrValue, mechanism: attr, flags};
    }

    // --- ARIA name primitives (reusable across rules) ---
    function getAriaLabelInfo(el) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const ariaLabel = trim(getAttr(el, 'aria-label'));
        if (!ariaLabel) return {present: false, value: '', mechanism: 'aria-label', flags: ['empty']};

        return {present: true, value: ariaLabel, mechanism: 'aria-label', flags};
    }

    function getAriaLabelledByInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const ariaLabelledBy = trim(getAttr(el, 'aria-labelledby'));
        if (!ariaLabelledBy) return {present: false, value: '', mechanism: 'aria-labelledby', flags: ['missing']};

        const t = getTextFromIdRefs(ariaLabelledBy, _ctx, opts);
        for (const f of t.flags) flags.push(f);

        if (!t.text) flags.push('empty');

        return {
            present: !!t.text,
            value: t.text || '',
            mechanism: 'aria-labelledby',
            refsCount: t.refsCount,
            missing: t.missing ? t.missing.slice(0) : [],
            flags
        };
    }

    /**
     * getAriaNameInfo: ARIA-only name, with correct precedence.
     * aria-labelledby (if non-empty) wins over aria-label.
     */
    function getAriaNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const lb = getAriaLabelledByInfo(el, _ctx, opts);
        if (lb.present && lb.value) return {
            present: true,
            value: lb.value,
            mechanism: 'aria-labelledby',
            flags: flags.concat(lb.flags || [])
        };

        const al = getAriaLabelInfo(el);
        if (al.present && al.value) return {
            present: true,
            value: al.value,
            mechanism: 'aria-label',
            flags: flags.concat(al.flags || [])
        };

        // If aria-labelledby existed but was empty/unresolvable, preserve that info in flags.
        if (trim(getAttr(el, 'aria-labelledby'))) flags.push('aria-labelledby-empty-or-unresolvable');
        if (getAttr(el, 'aria-label') != null && !trim(getAttr(el, 'aria-label'))) flags.push('aria-label-empty');

        return {present: false, value: '', mechanism: 'none', flags};
    }

    const lower = (v) => trim(v).toLowerCase();

    const safeDocGetById = (id) => {
        const key = trim(id);
        if (!key) return null;

        // Shared cache (per run)
        try {
            if (__idLookupDocCache && __idLookupDocCache.has(key)) {
                __perfInc('idLookup.doc.hit');
                return __idLookupDocCache.get(key) || null;
            }
        } catch {
        }

        __perfInc('idLookup.doc.miss');
        let el = null;
        try {
            if (document && document.getElementById) el = document.getElementById(key);
        } catch {
            el = null;
        }

        try {
            if (__idLookupDocCache) __idLookupDocCache.set(key, el || null);
        } catch {
        }

        return el || null;
    };

    const safeRootQueryById = (id) => {
        // Best-effort for cases where root is not the document (e.g. shadow root-like, fragment roots).
        // Note: IDs are document-global in HTML, but test harnesses may use scoped roots.
        const key = trim(id);
        if (!key) return null;
        if (!root || !root.querySelector) return null;

        try {
            const cacheKey = '#' + key;
            if (__idLookupRootCache && __idLookupRootCache.has(cacheKey)) {
                __perfInc('idLookup.root.hit');
                return __idLookupRootCache.get(cacheKey) || null;
            }
        } catch {
        }

        __perfInc('idLookup.root.miss');
        let el = null;
        try {
            el = root.querySelector('#' + key);
        } catch {
            el = null;
        }

        try {
            const cacheKey = '#' + key;
            if (__idLookupRootCache) __idLookupRootCache.set(cacheKey, el || null);
        } catch {
        }

        return el || null;
    };

    function inClosedDetailsContent(node) {
        try {
            if (!isElement(node)) return false;
            const summary = node.closest && node.closest('summary');
            if (summary && summary.contains(node)) return false;
            const details = node.closest && node.closest('details');
            if (details && !details.hasAttribute('open')) return true;
        } catch {
        }
        return false;
    }

    function isPlatformFocusable(el) {
        if (!isElement(el) || hasBlockingInert(el)) return false;
        const tag = (el.tagName || '').toLowerCase();
        const type = (el.getAttribute && (el.getAttribute('type') || '').toLowerCase()) || '';
        const disabled = !!(el.matches && el.matches(':disabled'));
        if (disabled) return false;

        if (tag === 'a') {
            const href = el.getAttribute && el.getAttribute('href');
            if (href && href.trim()) return true;
        }
        if (tag === 'area') {
            // Engine policy: treat <area> as focusable when it's part of a *used* image map.
            const map = getClosestMap(el);
            if (map) {
                const rawName = (map.getAttribute && (map.getAttribute('name') || map.getAttribute('id') || '')).trim();
                if (rawName && document && document.querySelector) {
                    const esc = __cssEscapeSafe;
                    const n = esc(rawName);

                    // Be practical: accept both "#name" and "name", and ignore case.
                    const sels = [
                        `img[usemap="#${n}" i]`,
                        `img[usemap="${n}" i]`
                    ];

                    for (const sel of sels) {
                        try {
                            if (document.querySelector(sel)) return true;
                        } catch {
                        }
                    }
                }
            }
        }
        if (tag === 'input') {
            if (type !== 'hidden') return true;
        }
        if (tag === 'select' || tag === 'textarea' || tag === 'button' || tag === 'summary') return true;
        if (el.hasAttribute && el.hasAttribute('contenteditable')) return true;

        const tabindex = el.getAttribute && el.getAttribute('tabindex');
        if (tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(tabindex))) return true;

        return false;
    }


    function getIdRefReverseIndex(scopeObj) {
        // Reverse index: id token -> referencing elements (aria-labelledby / aria-describedby)
        // Built once per scope per run. Deterministic: querySelectorAll order is document order.
        if (!scopeObj || !scopeObj.querySelectorAll) return null;

        if (!__idRefReverseIndexByScope) {
            __perfInc('idrefReverseIndex.nocache');
            return null;
        }

        try {
            const cached = __idRefReverseIndexByScope.get(scopeObj);
            if (cached) {
                __perfInc('idrefReverseIndex.hit');
                return cached;
            }
        } catch {
            __perfInc('idrefReverseIndex.nocache');
            return null;
        }

        __perfInc('idrefReverseIndex.miss');

        const idx = new Map();
        let refs = [];
        try {
            refs = Array.from(scopeObj.querySelectorAll('[aria-labelledby],[aria-describedby]'));
        } catch {
            refs = [];
        }

        for (const el of refs) {
            if (!isElement(el)) continue;

            // Parse tokens deterministically
            const lb = trim(getAttr(el, 'aria-labelledby'));
            const db = trim(getAttr(el, 'aria-describedby'));

            // Avoid pushing same element twice for the same token when both attrs contain it.
            const pushed = new Set();

            if (lb) {
                const parts = lb.split(/\s+/).filter(Boolean);
                for (const t of parts) {
                    const tok = trim(t);
                    if (!tok || pushed.has(tok)) continue;
                    pushed.add(tok);
                    const arr = idx.get(tok);
                    if (arr) arr.push(el);
                    else idx.set(tok, [el]);
                }
            }

            if (db) {
                const parts = db.split(/\s+/).filter(Boolean);
                for (const t of parts) {
                    const tok = trim(t);
                    if (!tok || pushed.has(tok)) continue;
                    pushed.add(tok);
                    const arr = idx.get(tok);
                    if (arr) arr.push(el);
                    else idx.set(tok, [el]);
                }
            }
        }

        try {
            __idRefReverseIndexByScope.set(scopeObj, idx);
            __perfInc('idrefReverseIndex.build');
        } catch {
            // ignore cache set errors
        }

        return idx;
    }

    function isReferencedByVisibleIdRef(node) {
        if (!document || !isElement(node)) return false;
        const id = node.getAttribute && node.getAttribute('id');
        const idTok = id && id.trim ? id.trim() : '';
        if (!idTok) return false;

        // Prefer reverse-index lookup (single build per run) over repeated querySelectorAll per node.
        const idx = getIdRefReverseIndex(document);
        if (idx && typeof idx.get === 'function') {
            let refs = null;
            try {
                refs = idx.get(idTok) || null;
            } catch {
                refs = null;
            }
            if (refs && refs.length) {
                for (const ref of refs) {
                    if (!isElement(ref)) continue;
                    const elig = isAccTreeEligible(ref); // safe recursion
                    if (elig && elig.eligible) return true;
                }
                return false;
            }
            // If index exists but no references, short-circuit.
            return false;
        }

        // Fallback to querySelectorAll when cache is unavailable.
        const esc = __cssEscapeSafe;
        const idSel = esc(idTok);
        let refs = [];
        try {
            refs = [
                ...Array.from(document.querySelectorAll('[aria-labelledby~="' + idSel + '"]')),
                ...Array.from(document.querySelectorAll('[aria-describedby~="' + idSel + '"]')),
            ];
        } catch {
            refs = [];
        }
        for (const ref of refs) {
            if (!isElement(ref)) continue;
            const elig = isAccTreeEligible(ref); // safe recursion
            if (elig && elig.eligible) return true;
        }
        return false;
    }


    function isExcluded(el) {
        if (!excludeSelectors.length || !el || !el.closest) return false;
        try {
            return excludeSelectors.some((sel) => !!el.closest(sel));
        } catch {
            return false;
        }
    }

    function queryAll(sel) {
        if (!root) return [];
        try {
            return Array.from(root.querySelectorAll(sel));
        } catch {
            return [];
        }
    }

    function queryAllDeep(sel) {
        if (!root) return [];
        // Performance note:
        // Avoid the old "querySelectorAll('*')" approach which is O(N) per shadow host
        // and explodes on huge DOMs. Instead, walk shadow roots only and run the selector
        // in each root once. This keeps work proportional to the number of shadow roots.
        const results = [];
        const seen = new Set();
        const visitedRoots = new Set();

        const pushMatches = (scope) => {
            if (!scope || !scope.querySelectorAll) return;
            let els = [];
            try {
                els = scope.querySelectorAll(sel);
            } catch {
                els = [];
            }
            // NodeList is iterable; avoid Array.from to reduce allocations.
            for (const el of els) {
                if (el && !seen.has(el) && !isExcluded(el)) {
                    seen.add(el);
                    results.push(el);
                }
            }
        };

        const collectShadowRoots = (scope) => {
            if (!scope || !scope.querySelectorAll) return [];

            // Cache shadow root discovery per root to avoid repeated querySelectorAll('*') walks.
            // IMPORTANT: do not cache when excludeSelectors is non-empty (different helpers may differ).
            if (!excludeSelectors.length && __shadowRootsByRoot) {
                try {
                    const cached = __shadowRootsByRoot.get(scope);
                    if (cached) {
                        __perfInc('shadowRoots.hit');
                        return cached;
                    }
                    __perfInc('shadowRoots.miss');

                    let hosts = [];
                    try {
                        hosts = scope.querySelectorAll('*');
                    } catch {
                        hosts = [];
                    }

                    const roots = [];
                    for (const el of hosts) {
                        if (!el || el.nodeType !== 1) continue;
                        const sr = el.shadowRoot;
                        if (sr) roots.push(sr);
                    }

                    try {
                        __shadowRootsByRoot.set(scope, roots);
                    } catch {
                        __perfInc('shadowRoots.nocache');
                    }
                    return roots;
                } catch {
                    __perfInc('shadowRoots.nocache');
                    // fall through to uncached path
                }
            } else {
                __perfInc('shadowRoots.nocache');
            }

            // Uncached path (preserves excludeSelectors filtering semantics).
            let hosts = [];
            try {
                hosts = scope.querySelectorAll('*');
            } catch {
                hosts = [];
            }
            const roots = [];
            for (const el of hosts) {
                if (!el || el.nodeType !== 1) continue;
                if (isExcluded(el)) continue;
                const sr = el.shadowRoot;
                if (sr) roots.push(sr);
            }
            return roots;
        };

        const q = [root];
        for (let qi = 0; qi < q.length; qi++) {
            const curRoot = q[qi];
            if (!curRoot || visitedRoots.has(curRoot)) continue;
            visitedRoots.add(curRoot);

            pushMatches(curRoot);

            const childShadowRoots = collectShadowRoots(curRoot);
            for (const sr of childShadowRoots) q.push(sr);
        }

        return results;
    }

    function queryAllSmart(sel) {
        const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
        return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
    }

    // -------------------------------------------------------------------------
    // Per-run shared caches (DOM helpers)
    // -------------------------------------------------------------------------
    try {
        const w =
            realmWindow ||
            (document && document.defaultView) ||
            (typeof global !== 'undefined' && global.window ? global.window : null);

        if (w) {
            if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
            if (!w.__a11ycoreSharedCache.dom) w.__a11ycoreSharedCache.dom = {};
            __domSharedCache = w.__a11ycoreSharedCache.dom;
        }
    } catch {
        __domSharedCache = {};
    }

    // Selector/snippet caches (per element)
    try {
        __selectorCache = __domSharedCache.selectorCache instanceof WeakMap
            ? __domSharedCache.selectorCache
            : (__domSharedCache.selectorCache = new WeakMap());
    } catch {
        __selectorCache = null;
    }

    try {
        __outerHtmlCache = __domSharedCache.outerHtmlCache instanceof WeakMap
            ? __domSharedCache.outerHtmlCache
            : (__domSharedCache.outerHtmlCache = new WeakMap());
    } catch {
        __outerHtmlCache = null;
    }

    // ID lookups: cache getElementById / root.querySelector(#id) results within a run
    try {
        __idLookupDocCache = __domSharedCache.idLookupDocCache instanceof Map
            ? __domSharedCache.idLookupDocCache
            : (__domSharedCache.idLookupDocCache = new Map());
    } catch {
        __idLookupDocCache = null;
    }

    try {
        __idLookupRootCache = __domSharedCache.idLookupRootCache instanceof Map
            ? __domSharedCache.idLookupRootCache
            : (__domSharedCache.idLookupRootCache = new Map());
    } catch {
        __idLookupRootCache = null;
    }

    // IDREF resolution: cache resolveIdRefs results (root-scoped) within a run
    try {
        __idRefCacheByRoot = __domSharedCache.idRefCacheByRoot instanceof WeakMap
            ? __domSharedCache.idRefCacheByRoot
            : (__domSharedCache.idRefCacheByRoot = new WeakMap());
    } catch {
        __idRefCacheByRoot = null;
    }

    // Reverse index for aria-labelledby/aria-describedby -> id token
    try {
        __idRefReverseIndexByScope = __domSharedCache.idRefReverseIndexByScope instanceof WeakMap
            ? __domSharedCache.idRefReverseIndexByScope
            : (__domSharedCache.idRefReverseIndexByScope = new WeakMap());
    } catch {
        __idRefReverseIndexByScope = null;
    }

    // Selector uniqueness index (per scope) within a run
    try {
        __uniqIndexByScope = __domSharedCache.uniqIndexByScope instanceof WeakMap
            ? __domSharedCache.uniqIndexByScope
            : (__domSharedCache.uniqIndexByScope = new WeakMap());
    } catch {
        __uniqIndexByScope = null;
    }

    // Shadow root discovery cache (per root) within a run.
    // Only used when excludeSelectors is empty to avoid cross-helper bleed.
    try {
        __shadowRootsByRoot = __domSharedCache.shadowRootsByRoot instanceof WeakMap
            ? __domSharedCache.shadowRootsByRoot
            : (__domSharedCache.shadowRootsByRoot = new WeakMap());
    } catch {
        __shadowRootsByRoot = null;
    }


// -------------------------------------------------------------------------
// Additional per-run caches (eligibility / focusability / labeling)
// -------------------------------------------------------------------------
    let __ancestorsIncludingSelfCache = null;
    let __eligibilityAccCache = null;
    let __eligibilityDomCacheByMode = null; // Map<string, WeakMap<Element, Result>>
    let __focusabilityCache = null;
    let __computedStyleCacheByScope = null; // WeakMap<object, WeakMap<Element, CSSStyleDeclaration|object>>
    let __openModalDialogsByDoc = null; // WeakMap<Document, Array<Element>>
    let __ancestorBlockerAccByScope = null; // WeakMap<object, WeakMap<Element, {struct:string|null, css:string|null}>>
    let __ancestorBlockerDomByScope = null; // WeakMap<object, WeakMap<Element, {struct, css, cssKnown, visibility, contentVisHidden, opacity}>>
    let __ancestorBlockerDomStructFinalByScope = null; // WeakMap<object, WeakMap<Element, string|null>> (final structural blocker per element per scope)
    let __labelAssociationCache = null;
    let __labelMethodCache = null;
    let __labelForIndexByDoc = null; // WeakMap<Document, Map<string, {exists:boolean, text:string}>> (label[for] by id cache)
    let __accessibleNameCacheByKey = null; // Map<string, WeakMap<Element, Info>>
    let __accessibleDescCacheByKey = null; // Map<string, WeakMap<Element, Info>>

    try {
        __ancestorsIncludingSelfCache = __domSharedCache.ancestorsIncludingSelfCache instanceof WeakMap
            ? __domSharedCache.ancestorsIncludingSelfCache
            : (__domSharedCache.ancestorsIncludingSelfCache = new WeakMap());
    } catch {
        __ancestorsIncludingSelfCache = null;
    }

    try {
        __eligibilityAccCache = __domSharedCache.eligibilityAccCache instanceof WeakMap
            ? __domSharedCache.eligibilityAccCache
            : (__domSharedCache.eligibilityAccCache = new WeakMap());
    } catch {
        __eligibilityAccCache = null;
    }

    try {
        __eligibilityDomCacheByMode = __domSharedCache.eligibilityDomCacheByMode instanceof Map
            ? __domSharedCache.eligibilityDomCacheByMode
            : (__domSharedCache.eligibilityDomCacheByMode = new Map());
    } catch {
        __eligibilityDomCacheByMode = null;
    }

    try {
        __focusabilityCache = __domSharedCache.focusabilityCache instanceof WeakMap
            ? __domSharedCache.focusabilityCache
            : (__domSharedCache.focusabilityCache = new WeakMap());
    } catch {
        __focusabilityCache = null;
    }

    try {
        __computedStyleCacheByScope = __domSharedCache.computedStyleCacheByScope instanceof WeakMap
            ? __domSharedCache.computedStyleCacheByScope
            : (__domSharedCache.computedStyleCacheByScope = new WeakMap());
    } catch {
        __computedStyleCacheByScope = null;
    }


    try {
        __openModalDialogsByDoc = __domSharedCache.openModalDialogsByDoc instanceof WeakMap
            ? __domSharedCache.openModalDialogsByDoc
            : (__domSharedCache.openModalDialogsByDoc = new WeakMap());
    } catch {
        __openModalDialogsByDoc = null;
    }

    try {
        __ancestorBlockerAccByScope = __domSharedCache.ancestorBlockerAccByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerAccByScope
            : (__domSharedCache.ancestorBlockerAccByScope = new WeakMap());
    } catch {
        __ancestorBlockerAccByScope = null;
    }

    try {
        __ancestorBlockerDomByScope = __domSharedCache.ancestorBlockerDomByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerDomByScope
            : (__domSharedCache.ancestorBlockerDomByScope = new WeakMap());
    } catch {
        __ancestorBlockerDomByScope = null;
    }

    try {
        __ancestorBlockerDomStructFinalByScope = __domSharedCache.ancestorBlockerDomStructFinalByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerDomStructFinalByScope
            : (__domSharedCache.ancestorBlockerDomStructFinalByScope = new WeakMap());
    } catch {
        __ancestorBlockerDomStructFinalByScope = null;
    }


    try {
        __labelAssociationCache = __domSharedCache.labelAssociationCache instanceof WeakMap
            ? __domSharedCache.labelAssociationCache
            : (__domSharedCache.labelAssociationCache = new WeakMap());
    } catch {
        __labelAssociationCache = null;
    }

    try {
        __labelMethodCache = __domSharedCache.labelMethodCache instanceof WeakMap
            ? __domSharedCache.labelMethodCache
            : (__domSharedCache.labelMethodCache = new WeakMap());
    } catch {
        __labelMethodCache = null;
    }


    try {
        __labelForIndexByDoc = __domSharedCache.labelForIndexByDoc instanceof WeakMap
            ? __domSharedCache.labelForIndexByDoc
            : (__domSharedCache.labelForIndexByDoc = new WeakMap());
    } catch {
        __labelForIndexByDoc = null;
    }

    try {
        __accessibleNameCacheByKey = __domSharedCache.accessibleNameCacheByKey instanceof Map
            ? __domSharedCache.accessibleNameCacheByKey
            : (__domSharedCache.accessibleNameCacheByKey = new Map());
    } catch {
        __accessibleNameCacheByKey = null;
    }

    try {
        __accessibleDescCacheByKey = __domSharedCache.accessibleDescCacheByKey instanceof Map
            ? __domSharedCache.accessibleDescCacheByKey
            : (__domSharedCache.accessibleDescCacheByKey = new Map());
    } catch {
        __accessibleDescCacheByKey = null;
    }


    function __getScopeObj() {
        const scopeObj =
            (root && typeof root === 'object') ? root :
                (document && typeof document === 'object') ? document :
                    null;
        return scopeObj;
    }


    function __getLabelForByIdCache(nameKey) {
        // Document-scoped cache for `document.querySelector('label[for="..."]')`.
        // Keeps test semantics (first lookup uses querySelector) while eliminating repeated lookups.
        if (!document || !document.querySelector) return null;
        if (!__labelForIndexByDoc) {
            __perfInc('labelForById.nocache');
            return null;
        }

        try {
            const nk = nameKey == null ? '__default__' : String(nameKey);
            let byKey = __labelForIndexByDoc.get(document);
            if (!(byKey instanceof Map)) {
                __perfInc('labelForById.miss');
                byKey = new Map();
                __labelForIndexByDoc.set(document, byKey);
                __perfInc('labelForById.build');
            }
            const existing = byKey.get(nk);
            if (existing && existing instanceof Map) {
                __perfInc('labelForById.hit');
                return existing;
            }
            __perfInc('labelForById.miss');
            const map = new Map();
            byKey.set(nk, map);
            __perfInc('labelForById.build');
            return map;
        } catch {
            __perfInc('labelForById.nocache');
            return null;
        }
    }

    function __lookupLabelForId(id, nameKey) {
        const key = trim(id);
        if (!key) return null;

        const map = __getLabelForByIdCache(nameKey);
        if (map) {
            if (map.has(key)) return map.get(key) || null;
            // compute and store
            let entry = null;
            try {
                const sel = 'label[for="' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\\"') + '"]';
                const label = document.querySelector(sel);
                if (label && isElement(label)) {
                    let t = '';
                    try {
                        t = trim(label.textContent);
                    } catch {
                        t = '';
                    }
                    entry = {exists: true, text: t};
                } else {
                    entry = {exists: false, text: ''};
                }
            } catch {
                entry = {exists: false, text: ''};
            }
            try {
                map.set(key, entry);
            } catch {
            }
            return entry && entry.exists ? entry : null;
        }

        // No cache available: fallback to direct querySelector
        try {
            const sel = 'label[for="' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\\"') + '"]';
            const label = document.querySelector(sel);
            if (label && isElement(label)) {
                let t = '';
                try {
                    t = trim(label.textContent);
                } catch {
                    t = '';
                }
                return {exists: true, text: t};
            }
        } catch {
        }
        return null;
    }

    function __getEligibilityAccCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__domSharedCache) return null;
        try {
            const wmByScope =
                __domSharedCache.eligibilityAccCacheByScope instanceof WeakMap
                    ? __domSharedCache.eligibilityAccCacheByScope
                    : (__domSharedCache.eligibilityAccCacheByScope = new WeakMap());

            let perScope = wmByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                wmByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getEligibilityDomCacheForScope(modeKey) {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__domSharedCache) return null;
        try {
            const wmByScope =
                __domSharedCache.eligibilityDomCacheByScope instanceof WeakMap
                    ? __domSharedCache.eligibilityDomCacheByScope
                    : (__domSharedCache.eligibilityDomCacheByScope = new WeakMap());

            let perScopeMap = wmByScope.get(scopeObj);
            if (!(perScopeMap instanceof Map)) {
                perScopeMap = new Map();
                wmByScope.set(scopeObj, perScopeMap);
            }

            let perMode = perScopeMap.get(modeKey);
            if (!(perMode instanceof WeakMap)) {
                perMode = new WeakMap();
                perScopeMap.set(modeKey, perMode);
            }
            return perMode;
        } catch {
            return null;
        }
    }


    function __getAncestorBlockerAccCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerAccByScope) return null;
        try {
            let perScope = __ancestorBlockerAccByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerAccByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getAncestorBlockerDomCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerDomByScope) return null;
        try {
            let perScope = __ancestorBlockerDomByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerDomByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getAncestorBlockerDomStructFinalCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerDomStructFinalByScope) return null;
        try {
            let perScope = __ancestorBlockerDomStructFinalByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerDomStructFinalByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }


    function __getDomEligibilityModeKey(opts) {
        const mode = opts && opts.visibilityMode === 'styleAndGeometry' ? 'styleAndGeometry' : 'styleOnly';
        const disableGeometry = !!(opts && opts.disableGeometry === true);
        return mode + '|' + (disableGeometry ? 'dg1' : 'dg0');
    }

    function __getNameOptsKey(opts) {
        // Only include options that affect this helper's output.
        const disallowContents = !!(opts && opts.disallowContents === true);
        const maxRefs = opts && opts.maxRefs != null ? (Number(opts.maxRefs) | 0) : -1;
        return (disallowContents ? 'dc1' : 'dc0') + '|mr' + String(maxRefs);
    }

    function __getDescOptsKey(opts) {
        const allowTitle = !!(opts && opts.allowTitle === true);
        const maxRefs = opts && opts.maxRefs != null ? (Number(opts.maxRefs) | 0) : -1;
        return (allowTitle ? 'at1' : 'at0') + '|mr' + String(maxRefs);
    }

    function getOuterHtmlSnippet(el) {
        if (!el || typeof el !== 'object') return '';
        try {
            if (__outerHtmlCache && __outerHtmlCache.has(el)) {
                __perfInc('outerHtml.hit');
                return __outerHtmlCache.get(el) || '';
            }
        } catch {
        }

        __perfInc('outerHtml.miss');

        let out = '';
        try {
            const html = el.outerHTML || '';
            if (html.length > 2000) out = html.slice(0, 2000) + '…';
            else out = html;
        } catch {
            out = '';
        }

        try {
            if (__outerHtmlCache && el && typeof el === 'object') __outerHtmlCache.set(el, out);
        } catch {
        }
        return out;
    }

// --- Accessibility-tree eligibility (ordered checks) ---
    function isAccTreeEligible(node) {
        // Cache is per-scope (root/document) to avoid cross-run leakage.
        const __accCache = __getEligibilityAccCacheForScope();
        const __ancBlockCache = __getAncestorBlockerAccCacheForScope();

        if (!isElement(node)) {
            return {eligible: false, reasons: ['notElement']};
        }

        try {
            if (__accCache && node && typeof node === 'object' && __accCache.has(node)) {
                const c = __accCache.get(node);
                if (c && typeof c === 'object') {
                    return {
                        eligible: !!c.eligible,
                        reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : []
                    };
                }
            }
        } catch {
        }

        const reasons = [];

        function __cacheAndReturn(res) {
            const out = {
                eligible: !!(res && res.eligible),
                reasons: (res && Array.isArray(res.reasons)) ? res.reasons.slice(0) : []
            };
            try {
                if (__accCache && node && typeof node === 'object') {
                    __accCache.set(node, {eligible: out.eligible, reasons: out.reasons.slice(0)});
                }
            } catch {
            }
            return out;
        }

        const chain = ancestorsIncludingSelf(node);

        // 1) HTML/DOM hiding
        for (const a of chain) {
            if (!isElement(a)) continue;

            // Ancestor structural blockers are scope-cached (per run) to avoid repeated checks.
            let struct = null;
            try {
                if (__ancBlockCache && __ancBlockCache.has(a)) {
                    __perfInc('ancestorBlockerAcc.struct.hit');
                    const cached = __ancBlockCache.get(a);
                    struct = cached && cached.struct ? String(cached.struct) : null;
                } else {
                    __perfInc('ancestorBlockerAcc.struct.miss');
                    const tn = (a.tagName || '').toLowerCase();
                    if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
                    else if (tn === 'template') struct = 'templateContent';
                    else if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') struct = 'nonRenderedElement';
                    else if (tn === 'input') {
                        const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                        if (t === 'hidden') struct = 'inputHidden';
                    }
                    try {
                        try {
                            if (__ancBlockCache) {
                                const prev = __ancBlockCache.has(a) ? (__ancBlockCache.get(a) || null) : null;
                                __ancBlockCache.set(a, {
                                    struct,
                                    css: prev && prev.css ? prev.css : null,
                                    cssKnown: prev && prev.cssKnown === true ? true : false
                                });
                            }
                        } catch {
                            __perfInc('ancestorBlockerAcc.struct.nocache');
                        }
                    } catch {
                        __perfInc('ancestorBlockerAcc.struct.nocache');
                    }
                }
            } catch { /* ignore */
            }

            if (struct) return __cacheAndReturn({eligible: false, reasons: [struct]});
        }
        if (inClosedDetailsContent(node)) return __cacheAndReturn({eligible: false, reasons: ['detailsClosed']});

        // 2) Inertness / modality
        if (hasBlockingInert(node)) {
            return __cacheAndReturn({eligible: false, reasons: ['inert']});
        }
        // Modal dialog (best effort)
        try {
            const openModals = getOpenModalDialogs();
            if (openModals.length) {
                let inside = false;
                for (const d of openModals) {
                    if (d && d.contains && d.contains(node)) {
                        inside = true;
                        break;
                    }
                }
                if (!inside) return __cacheAndReturn({eligible: false, reasons: ['modalInert']});
            }
        } catch {
        }

        // 3) CSS rendering suppression
        for (const a of chain) {
            if (!isElement(a)) continue;

            // <area> is a non-rendered element; some DOMs report display:none for it.
            // Don’t treat the *area itself* as ineligible based on computed style.
            if (a === node) {
                const tn = (a.tagName || '').toLowerCase();
                if (tn === 'area') continue;
            }

            // Cache ancestor CSS blockers (display/visibility) per scope.
            let cssBlock = null;
            let cssKnown = false;
            try {
                if (__ancBlockCache && __ancBlockCache.has(a)) {
                    const cached = __ancBlockCache.get(a);
                    if (cached && cached.cssKnown === true) {
                        __perfInc('ancestorBlockerAcc.css.hit');
                        cssKnown = true;
                        cssBlock = cached.css ? String(cached.css) : null;
                    } else {
                        __perfInc('ancestorBlockerAcc.css.miss');
                    }
                } else {
                    __perfInc('ancestorBlockerAcc.css.miss');
                }
            } catch {
            }

            if (!cssKnown) {
                const cs = computedStyle(a);
                if (cs && cs.display === 'none') cssBlock = 'displayNone';
                else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) cssBlock = 'visibilityHidden';

                try {
                    if (__ancBlockCache) {
                        const prev = __ancBlockCache.has(a) ? (__ancBlockCache.get(a) || null) : null;
                        __ancBlockCache.set(a, {
                            struct: prev && prev.struct ? prev.struct : null,
                            css: cssBlock || null,
                            cssKnown: true
                        });
                    }
                } catch {
                    __perfInc('ancestorBlockerAcc.css.nocache');
                }
            }

            if (cssBlock === 'displayNone') return __cacheAndReturn({eligible: false, reasons: ['displayNone']});
            if (cssBlock === 'visibilityHidden') return __cacheAndReturn({
                eligible: false,
                reasons: ['visibilityHidden']
            });
        }

        // 4) ARIA subtree hiding with exceptions with exceptions
        let ariaHidden = false;
        for (const a of chain) {
            if (!isElement(a)) continue;
            const v = a.getAttribute && a.getAttribute('aria-hidden');
            if (v != null && String(v).trim().toLowerCase() === 'true') {
                ariaHidden = true;
                break;
            }
        }
        if (ariaHidden) {
            const idref = isReferencedByVisibleIdRef(node);

            // IDREF exception stays
            if (idref) return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenIdref']});

            // Only *explicit* tabbable focus (tabindex >= 0) overrides aria-hidden by default.
            // Native focusability alone does not override aria-hidden EXCEPT for specific
            // mechanisms where the engine must still evaluate (e.g. <area> in a *used* map,
            // and <input type="image">).
            const ti = parseTabIndex(node);
            if (ti.has && ti.valid && ti.value >= 0) {
                return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenTabbable']});
            }

            // Programmatic focus (explicit tabindex < 0) does NOT override eligibility.
            if (ti.has && ti.valid && ti.value < 0) {
                return __cacheAndReturn({eligible: false, reasons: ['ariaHiddenProgrammaticFocusExcluded']});
            }

            // Exception: allow aria-hidden override for mechanisms where the engine must
            // still evaluate required labeling/alt rules. Keep this narrowly scoped.
            const tag = (node.tagName || '').toLowerCase();
            const type = tag === 'input'
                ? ((node.getAttribute && (node.getAttribute('type') || '').toLowerCase()) || '')
                : '';

            // Native form controls are tabbable by default (even without tabindex)
            // and are targeted by labeling rules.
            const isNativeFormControl =
                tag === 'select' ||
                tag === 'textarea' ||
                (tag === 'input' && type !== 'hidden'); // includes type=image

            if (tag === 'area' || isNativeFormControl) {
                const f2 = getPlatformFocusability(node);
                if (f2 && f2.tabbable) {
                    return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenTabbable']});
                }
            }

            return __cacheAndReturn({eligible: false, reasons: ['ariaHidden']});
        }

        // 5/6 handled implicitly; 7 already covered
        return __cacheAndReturn({eligible: true, reasons});
    }

    function isDomVisibleEligible(node, _ctx, opts) {
        const reasons = [];
        const out = (visible, reasonsArr, metrics) => ({
            eligible: !!visible,
            reasons: reasonsArr.slice(0),
            metrics: metrics && typeof metrics === 'object' ? {...metrics} : {}
        });

        if (!isElement(node)) return out(false, ['notElement'], {});

        const __modeKey = __getDomEligibilityModeKey(opts);
        const __domCache = __getEligibilityDomCacheForScope(__modeKey);

        const __ancBlockDomCache = __getAncestorBlockerDomCacheForScope();
        const __ancBlockStructFinalCache = __getAncestorBlockerDomStructFinalCacheForScope();

        try {
            if (__domCache && node && typeof node === 'object' && __domCache.has(node)) {
                const c = __domCache.get(node);
                if (c && typeof c === 'object') {
                    return {
                        eligible: !!c.eligible,
                        reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : [],
                        metrics: c.metrics && typeof c.metrics === 'object' ? {...c.metrics} : {}
                    };
                }
            }
        } catch {
        }

        function __cacheAndReturn(res) {
            const outRes = {
                eligible: !!(res && res.eligible),
                reasons: (res && Array.isArray(res.reasons)) ? res.reasons.slice(0) : [],
                metrics: (res && res.metrics && typeof res.metrics === 'object') ? {...res.metrics} : {}
            };
            try {
                if (__domCache && node && typeof node === 'object') {
                    __domCache.set(node, {
                        eligible: outRes.eligible,
                        reasons: outRes.reasons.slice(0),
                        metrics: {...outRes.metrics}
                    });
                }
            } catch {
            }
            return outRes;
        }

        // 1) HTML hiding
        // Final short-circuit: reuse structural blocker result for this node when already known.
        try {
            if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(node)) {
                __perfInc('ancestorBlockerDom.structFinal.hit');
                const r = __ancBlockStructFinalCache.get(node);
                const rr = (r != null && r !== '') ? String(r) : null;
                if (rr) return __cacheAndReturn(out(false, [rr], {}));
            } else {
                __perfInc('ancestorBlockerDom.structFinal.miss');
            }
        } catch {
        }

        const chain = ancestorsIncludingSelf(node);
        const __domStructSeen = [];
        for (const a of chain) {
            if (!isElement(a)) continue;

            __domStructSeen.push(a);

            // If an ancestor already has a final structural blocker cached,
            // short-circuit immediately (this is what the test expects).
            try {
                if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(a)) {
                    __perfInc('ancestorBlockerDom.structFinal.hit');
                    const r = __ancBlockStructFinalCache.get(a);
                    const rr = (r != null && r !== '') ? String(r) : null;
                    if (rr) {
                        // Propagate to nodes we've seen on this walk (including `node`)
                        try {
                            for (const s of __domStructSeen) {
                                if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, rr);
                            }
                        } catch {
                        }
                        return __cacheAndReturn(out(false, [rr], {}));
                    }
                }
            } catch {
            }

            // Cached structural blockers (per scope) to short-circuit shared ancestor checks.
            let struct = null;
            try {
                if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
                    __perfInc('ancestorBlockerDom.struct.hit');
                    const cached = __ancBlockDomCache.get(a);
                    struct = cached && cached.struct ? String(cached.struct) : null;
                } else {
                    __perfInc('ancestorBlockerDom.struct.miss');
                    const tn = (a.tagName || '').toLowerCase();
                    if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
                    else if (tn === 'template') struct = 'templateContent';
                    else if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') struct = 'nonRenderedElement';
                    else if (tn === 'input') {
                        const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                        if (t === 'hidden') struct = 'inputHidden';
                    }
                    try {
                        if (__ancBlockDomCache) {
                            const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                            __ancBlockDomCache.set(a, {
                                struct,
                                css: prev && prev.css ? prev.css : null,
                                cssKnown: prev && prev.cssKnown === true ? true : false,
                                visibility: prev && prev.visibility ? prev.visibility : null,
                                contentVisHidden: prev && prev.contentVisHidden === true ? true : null,
                                opacity: prev && typeof prev.opacity === 'number' ? prev.opacity : null
                            });
                        }
                    } catch {
                        __perfInc('ancestorBlockerDom.struct.nocache');
                    }

                }
            } catch {
            }

            if (struct) {
                try {
                    if (__ancBlockStructFinalCache) {
                        for (const s of __domStructSeen) {
                            if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, struct);
                        }
                    }
                } catch {
                }
                return __cacheAndReturn(out(false, [struct], {}));
            }
        }

        try {
            if (__ancBlockStructFinalCache) {
                for (const s of __domStructSeen) {
                    if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, null);
                }
            }
        } catch {
        }

        // Closed <details> hides content visually
        if (inClosedDetailsContent(node)) return __cacheAndReturn(out(false, ['detailsClosed'], {}));

        // 2) CSS visibility suppression + opacity chain
        let opacityProduct = 1;
        for (const a of chain) {
            if (!isElement(a)) continue;

            let cssBlock = null;
            let cssKnown = false;

            let cachedVisibility = null;
            let cachedContentVisHidden = null;
            let cachedOpacity = null;
            let cs = null;

            try {
                if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
                    const cached = __ancBlockDomCache.get(a);
                    if (cached) {
                        // cssKnown means "we already computed display/visibility/content-visibility once"
                        if (cached.cssKnown === true) {
                            __perfInc('ancestorBlockerDom.css.hit');
                            cssKnown = true;
                            cssBlock = cached.css ? String(cached.css) : null;
                        } else {
                            __perfInc('ancestorBlockerDom.css.miss');
                        }

                        cachedVisibility = cached.visibility != null ? String(cached.visibility) : null;
                        cachedContentVisHidden = cached.contentVisHidden === true ? true : null;
                        cachedOpacity =
                            (typeof cached.opacity === 'number' && Number.isFinite(cached.opacity))
                                ? cached.opacity
                                : null;
                    }
                } else {
                    __perfInc('ancestorBlockerDom.css.miss');
                }
            } catch {
            }

            // Compute CSS blockers (and maybe opacity) only when needed
            if (!cssKnown && cachedContentVisHidden !== true) {
                cs = computedStyle(a);

                if (cs && cs.display === 'none') cssBlock = 'displayNone';
                else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
                    cssBlock = 'visibilityHidden';
                    cachedVisibility = cs.visibility;
                } else if (cs && cs.contentVisibility === 'hidden') {
                    cssBlock = 'contentVisibilityHidden';
                    cachedContentVisHidden = true;
                }

                // NEW: parse opacity once and cache it (even if cssBlock is null)
                if (cachedOpacity == null) {
                    try {
                        const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
                        const parsed = Number.parseFloat(raw);
                        if (Number.isFinite(parsed)) cachedOpacity = parsed;
                    } catch {
                    }
                }

                try {
                    if (__ancBlockDomCache) {
                        const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                        __ancBlockDomCache.set(a, {
                            struct: prev && prev.struct ? prev.struct : null,
                            css: cssBlock || null,
                            cssKnown: true,
                            visibility: cachedVisibility || (prev && prev.visibility ? prev.visibility : null),
                            contentVisHidden: cachedContentVisHidden === true ? true : (prev && prev.contentVisHidden === true ? true : null),
                            opacity: cachedOpacity == null ? (prev && typeof prev.opacity === 'number' ? prev.opacity : null) : cachedOpacity
                        });
                    }
                } catch {
                    __perfInc('ancestorBlockerDom.css.nocache');
                }
            }

            if (cssBlock === 'displayNone') return __cacheAndReturn(out(false, ['displayNone'], {}));
            if (cssBlock === 'visibilityHidden') {
                return __cacheAndReturn(out(false, ['visibilityHidden'], {visibility: cachedVisibility || 'hidden'}));
            }
            if (cssBlock === 'contentVisibilityHidden') {
                return __cacheAndReturn(out(false, ['contentVisibilityHidden'], {}));
            }

            // If opacity isn't cached yet, compute once and write it back even when cssBlock was cached.
            // This prevents repeated computedStyle(a) calls across many isDomVisibleEligible() invocations.
            if (cachedOpacity == null) {
                try {
                    if (!cs) cs = computedStyle(a);
                    const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
                    const parsed = Number.parseFloat(raw);
                    if (Number.isFinite(parsed)) {
                        cachedOpacity = parsed;

                        // Write back to cache without disturbing other fields
                        try {
                            if (__ancBlockDomCache) {
                                const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                                if (prev) {
                                    __ancBlockDomCache.set(a, {
                                        struct: prev.struct || null,
                                        css: prev.css || null,
                                        visibility: prev.visibility || null,
                                        contentVisHidden: prev.contentVisHidden === true ? true : null,
                                        opacity: cachedOpacity
                                    });
                                } else {
                                    __ancBlockDomCache.set(a, {
                                        struct: null,
                                        css: cssBlock || null,
                                        visibility: cachedVisibility || null,
                                        contentVisHidden: cachedContentVisHidden === true ? true : null,
                                        opacity: cachedOpacity
                                    });
                                }
                            }
                        } catch {}
                    }
                } catch {}
            }

            // opacity handling (visual)
            const op = cachedOpacity != null ? cachedOpacity : 1;
            opacityProduct *= op;
            if (opacityProduct <= 0.0001) {
                return __cacheAndReturn(out(false, ['opacityZero'], { opacity: opacityProduct }));
            }
        }

        // 3) Layout/geometry (optional)
        const visibilityMode =
            opts && opts.visibilityMode === 'styleAndGeometry'
                ? 'styleAndGeometry'
                : 'styleOnly';

        const useGeometry =
            visibilityMode === 'styleAndGeometry' &&
            !(opts && opts.disableGeometry === true);

        if (useGeometry) {
            try {
                if (node.getClientRects) {
                    const rects = node.getClientRects();
                    const rectCount = rects ? rects.length : 0;

                    if (!rectCount) {
                        return __cacheAndReturn(out(false, ['noClientRects'], {rectCount: 0}));
                    }

                    const r = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
                    const w = r && Number.isFinite(r.width) ? r.width : 0;
                    const h = r && Number.isFinite(r.height) ? r.height : 0;

                    if (w <= 0 || h <= 0) {
                        return __cacheAndReturn(out(false, ['zeroArea'], {rectCount, width: w, height: h}));
                    }

                    return __cacheAndReturn(out(true, reasons, {
                        rectCount,
                        width: w,
                        height: h,
                        opacity: opacityProduct
                    }));
                }
            } catch {
                // ignore geometry failures; fall back to style-only eligibility
            }
        }

        return __cacheAndReturn(out(true, reasons, {opacity: opacityProduct}));
    }

    function getEligibilityInfo(node, _ctx, opts) {
        const targetSet = opts && (opts.targetSet === 'acc' || opts.targetSet === 'dom') ? opts.targetSet : 'dom';
        const r = targetSet === 'dom' ? isDomVisibleEligible(node, _ctx, opts) : isAccTreeEligible(node);
        return {
            eligible: !!(r && r.eligible),
            reasons: (r && Array.isArray(r.reasons)) ? r.reasons.slice(0) : [],
            targetSet,
            accEligible: targetSet === 'acc' ? !!(r && r.eligible) : null,
        };
    }

    // E) IDREF helpers
    function resolveIdRefs(idrefString, _ctx, opts) {
        const raw = trim(idrefString);
        if (!raw) return {refs: [], missing: [], flags: ['empty']};

        // Normalize whitespace for stable cache keys
        const parts = raw.split(/\s+/).filter(Boolean);
        const normKey = parts.join(' ');

        // Root-scoped cache map
        let cacheMap = null;
        if (__idRefCacheByRoot) {
            const scopeObj =
                (root && typeof root === 'object') ? root :
                    (document && typeof document === 'object') ? document :
                        null;
            if (scopeObj) {
                try {
                    cacheMap = __idRefCacheByRoot.get(scopeObj) || null;
                    if (!cacheMap) {
                        cacheMap = new Map();
                        __idRefCacheByRoot.set(scopeObj, cacheMap);
                    }
                } catch {
                    cacheMap = null;
                }
            }
        }

        // Cached base result is *untruncated* (opts.maxRefs applied per call)
        if (cacheMap) {
            try {
                const cached = cacheMap.get(normKey);
                if (cached && cached.refs && cached.missing && cached.flags) {
                    const baseRefs = Array.isArray(cached.refs) ? cached.refs.slice(0) : [];
                    const baseMissing = Array.isArray(cached.missing) ? cached.missing.slice(0) : [];
                    const baseFlags = Array.isArray(cached.flags) ? cached.flags.slice(0) : [];

                    // Apply deterministic truncation if requested
                    if (opts && opts.maxRefs && baseRefs.length > opts.maxRefs) {
                        baseRefs.length = Math.max(0, Number(opts.maxRefs) | 0);
                        baseFlags.push('truncated');
                    }

                    __perfInc('idref.resolve.hit');
                    return {refs: baseRefs, missing: baseMissing, flags: baseFlags};
                }
            } catch {
                // cache read errors should never throw
            }
        }

        __perfInc(cacheMap ? 'idref.resolve.miss' : 'idref.resolve.nocache');
        // Compute base result
        const refs = [];
        const missing = [];
        const seen = new Set();

        for (const id of parts) {
            const key = trim(id);
            if (!key) continue;

            let el = safeDocGetById(key);
            if (!el) el = safeRootQueryById(key);

            if (!el || !isElement(el)) {
                missing.push(key);
                continue;
            }
            if (seen.has(el)) continue;
            seen.add(el);
            refs.push(el);
        }

        const flags = [];
        if (missing.length) flags.push('idref-missing');
        if (parts.length !== refs.length + missing.length) flags.push('deduped'); // indicates repeats

        // Store untruncated base result
        if (cacheMap) {
            try {
                cacheMap.set(normKey, {
                    refs: refs.slice(0),
                    missing: missing.slice(0),
                    flags: flags.slice(0),
                    partsLen: parts.length
                });
            } catch {
                // ignore cache write errors
            }
        }

        // Apply deterministic truncation per call
        if (opts && opts.maxRefs && refs.length > opts.maxRefs) {
            refs.length = Math.max(0, Number(opts.maxRefs) | 0);
            flags.push('truncated');
        }

        return {refs, missing, flags};
    }

    function getTextFromIdRefs(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);
        const texts = [];
        for (const el of r.refs) {
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {
            }
        }
        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');
        return {text, refsCount: r.refs.length, missing: r.missing.slice(0), flags};
    }

    function isIdRefEligibleTarget(node) {
        // IDREF policy: include hidden/aria-hidden/collapsed targets,
        // exclude only inertness or non-composed.
        if (!isElement(node)) return {eligible: false, reasons: ['notElement']};

        // NOTE: `root` is not an eligibility boundary for IDREF targets.

        if (hasBlockingInert(node)) return {eligible: false, reasons: ['inert']};

        return {eligible: true, reasons: []};
    }

    function getTextFromIdRefsIdrefEligible(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);

        const texts = [];
        const excluded = []; // [{ id, reasons }]
        for (const el of r.refs) {
            const elig = isIdRefEligibleTarget(el);
            if (!elig.eligible) {
                const id = trim(el.getAttribute && el.getAttribute('id'));
                excluded.push({id: id || null, reasons: elig.reasons.slice(0)});
                continue;
            }
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {
            }
        }

        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');

        if (excluded.length) flags.push('idref-excluded');

        return {
            text,
            refsCount: r.refs.length,
            missing: r.missing.slice(0),
            excluded,
            flags
        };
    }

    // B) Accessible name / description helpers (mechanism-first, but scoped & deterministic)
    function getAccessibleNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const key = __getNameOptsKey(opts);
        try {
            if (__accessibleNameCacheByKey && __accessibleNameCacheByKey.has(key)) {
                const wm = __accessibleNameCacheByKey.get(key);
                if (wm && wm instanceof WeakMap && wm.has(el)) {
                    const c = wm.get(el);
                    if (c && typeof c === 'object') {
                        __perfInc('accessibleName.hit');
                        return {
                            present: !!c.present,
                            value: c.value == null ? '' : String(c.value),
                            mechanism: c.mechanism || 'none',
                            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                        };
                    }
                }
            }
        } catch {
        }
        __perfInc('accessibleName.miss');

        const aria = getAriaNameInfo(el, _ctx, opts);
        if (aria && aria.present && aria.value) {
            const out = {
                present: true,
                value: aria.value,
                mechanism: aria.mechanism,
                flags: flags.concat(aria.flags || [])
            };
            try {
                if (__accessibleNameCacheByKey) {
                    const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                    if (wm && wm instanceof WeakMap) wm.set(el, {
                        present: !!out.present,
                        value: out.value,
                        mechanism: out.mechanism,
                        flags: out.flags.slice(0)
                    });
                }
            } catch {
            }
            return out;
        }
        if (aria && aria.flags && aria.flags.length) {
            for (const f of aria.flags) flags.push(f);
        }

        // Explicit <label for="..."> or wrapping <label> (common and deterministic for form controls)
        const id = trim(getAttr(el, 'id'));
        if (id) {
            // Prefer indexed lookup (1 build per run) over repeated querySelector per element.
            const entry = __lookupLabelForId(id, key);
            if (entry && entry.exists) {
                const lt = entry.text || '';
                if (lt) {
                    const out = {present: true, value: lt, mechanism: 'label', flags};
                    try {
                        if (__accessibleNameCacheByKey) {
                            const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                            if (wm && wm instanceof WeakMap) wm.set(el, {
                                present: true,
                                value: out.value,
                                mechanism: out.mechanism,
                                flags: out.flags.slice(0)
                            });
                        }
                    } catch {
                    }
                    return out;
                }
                // If label exists but is empty, fall through (matches prior behavior: empty label doesn't produce a name).
            }
        }


        const title = trim(getAttr(el, 'title'));
        if (title) {
            flags.push('title-used');
            const out = {present: true, value: title, mechanism: 'title', flags};
            try {
                if (__accessibleNameCacheByKey) {
                    const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                    if (wm && wm instanceof WeakMap) wm.set(el, {
                        present: true,
                        value: out.value,
                        mechanism: out.mechanism,
                        flags: out.flags.slice(0)
                    });
                }
            } catch {
            }
            return out;
        }

        const out = {present: false, value: '', mechanism: 'none', flags};
        try {
            if (__accessibleNameCacheByKey) {
                const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                if (wm && wm instanceof WeakMap) wm.set(el, {
                    present: false,
                    value: '',
                    mechanism: 'none',
                    flags: out.flags.slice(0)
                });
            }
        } catch {
        }
        return out;
    }

    function getAccessibleDescriptionInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const key = __getDescOptsKey(opts);
        try {
            if (__accessibleDescCacheByKey && __accessibleDescCacheByKey.has(key)) {
                const wm = __accessibleDescCacheByKey.get(key);
                if (wm && wm instanceof WeakMap && wm.has(el)) {
                    const c = wm.get(el);
                    if (c && typeof c === 'object') {
                        __perfInc('accessibleDesc.hit');
                        return {
                            present: !!c.present,
                            value: c.value == null ? '' : String(c.value),
                            mechanism: c.mechanism || 'none',
                            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                        };
                    }
                }
            }
        } catch {
        }
        __perfInc('accessibleDesc.miss');

        const describedBy = trim(getAttr(el, 'aria-describedby'));
        if (describedBy) {
            const t = getTextFromIdRefs(describedBy, _ctx, opts);
            for (const f of t.flags) flags.push(f);
            if (t.text) {
                const out = {present: true, value: t.text, mechanism: 'aria-describedby', flags};
                try {
                    if (__accessibleDescCacheByKey) {
                        const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                        if (wm && wm instanceof WeakMap) wm.set(el, {
                            present: true,
                            value: out.value,
                            mechanism: out.mechanism,
                            flags: out.flags.slice(0)
                        });
                    }
                } catch {
                }
                return out;
            }
            flags.push('empty');
        }

        const allowTitle = !!(opts && opts.allowTitle === true);
        if (allowTitle) {
            const title = trim(getAttr(el, 'title'));
            if (title) {
                flags.push('title-used');
                const out = {present: true, value: title, mechanism: 'title', flags};
                try {
                    if (__accessibleDescCacheByKey) {
                        const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                        if (wm && wm instanceof WeakMap) wm.set(el, {
                            present: true,
                            value: out.value,
                            mechanism: out.mechanism,
                            flags: out.flags.slice(0)
                        });
                    }
                } catch {
                }
                return out;
            }
        }

        const out = {present: false, value: '', mechanism: 'none', flags};
        try {
            if (__accessibleDescCacheByKey) {
                const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                if (wm && wm instanceof WeakMap) wm.set(el, {
                    present: false,
                    value: '',
                    mechanism: 'none',
                    flags: out.flags.slice(0)
                });
            }
        } catch {
        }
        return out;
    }

    // C) Text alternative helper (mechanism-aware by element/type)
    function getTextAlternativeInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) {
            return {
                present: false,
                value: '',
                mechanism: 'unsupported',
                requiredMechanism: 'unknown',
                flags: ['notElement']
            };
        }

        const tag = lower(el.tagName);
        const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';

        const isImageLike =
            tag === 'img' ||
            tag === 'area' ||
            (tag === 'input' && type === 'image');

        if (isImageLike) {
            const altRaw = getAttr(el, 'alt');
            const altPresent = altRaw != null;
            const altText = trim(altRaw);

            if (altPresent) {
                if (!altText) flags.push('alt-empty');
                return {
                    present: true,
                    value: altText,
                    mechanism: 'alt',
                    requiredMechanism: 'alt',
                    flags
                };
            }

            // Missing alt is a real issue even if an accessible name exists.
            const name = getAccessibleNameInfo(el, _ctx, opts);
            if (name && name.present && name.value) flags.push('name-present-but-alt-missing');
            flags.push('alt-missing');

            return {
                present: false,
                value: name && name.present ? (name.value || '') : '',
                mechanism: name && name.present ? 'accessible-name' : 'none',
                requiredMechanism: 'alt',
                flags: flags.concat((name && name.flags) ? name.flags.slice(0) : [])
            };
        }

        if (tag === 'canvas') {
            const fallback = trim(el.textContent || '');
            if (fallback) {
                return {
                    present: true,
                    value: fallback,
                    mechanism: 'canvas-fallback',
                    requiredMechanism: 'fallback-or-name',
                    flags
                };
            }

            const name = getAccessibleNameInfo(el, _ctx, opts);
            if (name && name.present && name.value) {
                return {
                    present: true,
                    value: name.value,
                    mechanism: 'accessible-name',
                    requiredMechanism: 'fallback-or-name',
                    flags: flags.concat(name.flags ? name.flags.slice(0) : [])
                };
            }

            return {
                present: false,
                value: '',
                mechanism: 'none',
                requiredMechanism: 'fallback-or-name',
                flags
            };
        }

        return {
            present: false,
            value: '',
            mechanism: 'unsupported',
            requiredMechanism: 'unknown',
            flags: ['unsupported-element']
        };
    }

    // D) Role + focusability helpers
    function getRoleInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {role: '', source: 'none', flags: ['notElement']};

        const explicit = trim(getAttr(el, 'role'));
        if (explicit) {
            const v = explicit;
            const low = v.toLowerCase();
            if (low === 'presentation' || low === 'none') flags.push('presentation');
            // Minimal sanity: role token should not contain spaces beyond role list; keep deterministic
            if (/\s/.test(v)) flags.push('multiple-roles');
            return {role: v, source: 'explicit', flags};
        }

        const allowImplicit = !(opts && opts.disallowImplicit === true);
        if (!allowImplicit) return {role: '', source: 'none', flags};

        const tag = lower(el.tagName);
        const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';
        const href = tag === 'a' || tag === 'area' ? trim(getAttr(el, 'href')) : '';

        // Minimal implicit mapping (expand later if needed, but keep stable and small).
        let role = '';
        if ((tag === 'a' || tag === 'area') && href) role = 'link';
        else if (tag === 'button') role = 'button';
        else if (tag === 'summary') role = 'button';
        else if (tag === 'input') {
            if (type === 'checkbox') role = 'checkbox';
            else if (type === 'radio') role = 'radio';
            else if (type === 'range') role = 'slider';
            else if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') role = 'button';
            else if (type !== 'hidden') role = 'textbox';
        } else if (tag === 'select') role = 'combobox';
        else if (tag === 'textarea') role = 'textbox';

        if (role) return {role, source: 'implicit', flags};
        return {role: '', source: 'none', flags};
    }

    function getFocusableInfo(el, _ctx, opts) {
        // Allocation-minimal merge: avoid chained concat() which creates intermediate arrays.
        if (!isElement(el)) return {focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement']};

        const pf = getPlatformFocusability(el); // returns focusable + tabbable + mechanism + flags

        // Merge flags deterministically (stable order: local flags, then pf.flags)
        const outFlags = [];
        // (No local flags today; keep structure for forward compatibility without extra allocations.)
        if (pf && Array.isArray(pf.flags) && pf.flags.length) {
            for (let i = 0; i < pf.flags.length; i++) outFlags.push(pf.flags[i]);
        }

        return {
            focusable: !!(pf && pf.focusable),
            tabbable: !!(pf && pf.tabbable),
            mechanism: (pf && pf.mechanism) || 'none',
            flags: outFlags
        };
    }

    // Back-compat: keep existing helper but implement via new name helper.
    function hasAccessibleName(el) {
        const info = getAccessibleNameInfo(el);
        return !!(info && info.present && trim(info.value));
    }

    function createSelectorUniqIndex() {
        const scope = root && root.querySelectorAll ? root : document;

        const idCount = new Map();
        const testIdCount = new Map(); // data-testid + data-test + data-cy + data-qa
        const nameCount = new Map();   // key: tag|name
        const ariaLabelCount = new Map(); // key: tag|aria-label
        const roleAriaLabelCount = new Map(); // key: role|aria-label

        const sel = '[id],[data-testid],[data-test],[data-cy],[data-qa],[name],[aria-label],[role]';
        const nodes = (typeof queryAllSmart === 'function')
            ? (queryAllSmart(sel) || [])
            : Array.from(scope.querySelectorAll(sel));

        const inc = (map, key) => map.set(key, (map.get(key) || 0) + 1);

        for (const el of nodes) {
            if (!el || el.nodeType !== 1) continue;

            const tag = (el.tagName || '').toLowerCase();

            const id = el.getAttribute('id');
            if (id && id.trim()) inc(idCount, id.trim());

            for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                const v = el.getAttribute(a);
                if (v && v.trim()) inc(testIdCount, a + '=' + v.trim());
            }

            const name = el.getAttribute('name');
            if (name && name.trim() && tag) inc(nameCount, tag + '|' + name.trim());

            const aria = el.getAttribute('aria-label');
            if (aria && aria.trim() && tag) inc(ariaLabelCount, tag + '|' + aria.trim());

            const role = el.getAttribute('role');
            if (role && role.trim() && aria && aria.trim()) {
                inc(roleAriaLabelCount, role.trim() + '|' + aria.trim());
            }
        }

        return {idCount, testIdCount, nameCount, ariaLabelCount, roleAriaLabelCount};
    }

    function buildSimpleSelector(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return fallbackTag || 'html';

            const tag = (el.tagName || fallbackTag || 'html').toLowerCase();

            const cssEscapeIdent = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {
                }
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const escapeAttrValue = __escapeAttrValue;

            const id = el.getAttribute && el.getAttribute('id');
            if (id && id.trim()) return '#' + cssEscapeIdent(id.trim());

            for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                const v = el.getAttribute && el.getAttribute(a);
                if (v && v.trim()) return '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
            }

            const name = el.getAttribute && el.getAttribute('name');
            if (name && name.trim()) return tag + '[name="' + escapeAttrValue(name.trim()) + '"]';

            return tag;
        } catch {
            return fallbackTag || 'html';
        }
    }

    function getUniqIndex() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__uniqIndexByScope) {
            __perfInc('uniqIndex.nocache');
            // Fallback: build per call (should be rare; determinism preserved)
            return createSelectorUniqIndex();
        }

        const cached = __uniqIndexByScope.get(scopeObj);
        if (cached) {
            __perfInc('uniqIndex.hit');
            return cached;
        }

        __perfInc('uniqIndex.miss');
        const idx = createSelectorUniqIndex();
        try {
            __uniqIndexByScope.set(scopeObj, idx);
        } catch { /* ignore */
        }
        __perfInc('uniqIndex.build');
        return idx;
    }

    function buildSelectorUncached(el) {
        const escapeAttrValue = __escapeAttrValue;
        try {
            if (!el || el.nodeType !== 1) return 'html';

            const cssEscape = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {
                }
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const idx = getUniqIndex();
            const tag = (el.tagName || '').toLowerCase();

            const uniqueIdSel = () => {
                const id = el.getAttribute('id');
                if (!id || !id.trim()) return null;
                const v = id.trim();
                if (idx && (idx.idCount.get(v) || 0) === 1) return '#' + cssEscape(v);
                return null;
            };

            const uniqueTestSel = () => {
                for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                    const v = el.getAttribute(a);
                    if (!v || !v.trim()) continue;
                    const key = a + '=' + v.trim();
                    if (idx && (idx.testIdCount.get(key) || 0) === 1) {
                        return '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
                    }
                }
                return null;
            };

            const uniqueNameSel = () => {
                const v = el.getAttribute('name');
                if (!v || !v.trim() || !tag) return null;
                const key = tag + '|' + v.trim();
                if (idx && (idx.nameCount.get(key) || 0) === 1) return tag + '[name="' + escapeAttrValue(v.trim()) + '"]';
                return null;
            };

            const uniqueAriaSel = () => {
                const v = el.getAttribute('aria-label');
                if (!v || !v.trim() || !tag) return null;
                const key = tag + '|' + v.trim();
                if (idx && (idx.ariaLabelCount.get(key) || 0) === 1) return tag + '[aria-label="' + escapeAttrValue(v.trim()) + '"]';
                return null;
            };

            const uniqueRoleAriaSel = () => {
                const role = el.getAttribute('role');
                const aria = el.getAttribute('aria-label');
                if (!role || !role.trim() || !aria || !aria.trim()) return null;
                const key = role.trim() + '|' + aria.trim();
                if (idx && (idx.roleAriaLabelCount.get(key) || 0) === 1) {
                    return '[role="' + escapeAttrValue(role.trim()) + '"][aria-label="' + escapeAttrValue(aria.trim()) + '"]';
                }
                return null;
            };

            const direct =
                uniqueIdSel() ||
                uniqueTestSel() ||
                uniqueRoleAriaSel() ||
                uniqueNameSel() ||
                uniqueAriaSel();

            if (direct) return direct;

            const parts = [];

            function nthOfType(node) {
                const t = (node.tagName || '').toLowerCase() || '*';
                const p = node.parentElement;
                if (!p) return t;

                let i = 1;
                let sib = node.previousElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) i++;
                    sib = sib.previousElementSibling;
                }

                let hasSame = false;
                sib = node.nextElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) {
                        hasSame = true;
                        break;
                    }
                    sib = sib.nextElementSibling;
                }
                if (!hasSame) {
                    sib = node.nextElementSibling;
                    while (sib) {
                        if ((sib.tagName || '').toLowerCase() === t) {
                            hasSame = true;
                            break;
                        }
                        sib = sib.previousElementSibling;
                    }
                }
                return hasSame ? t + ':nth-of-type(' + i + ')' : t;
            }

            let node = el;
            let safety = 0;

            while (node && node.nodeType === 1 && safety++ < 20) {
                let anchor = null;

                if (node !== el) {
                    const t = (node.tagName || '').toLowerCase();
                    const id = node.getAttribute('id');
                    if (id && id.trim() && idx && (idx.idCount.get(id.trim()) || 0) === 1) anchor = '#' + cssEscape(id.trim());
                    if (!anchor) {
                        for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                            const v = node.getAttribute(a);
                            if (v && v.trim() && idx && (idx.testIdCount.get(a + '=' + v.trim()) || 0) === 1) {
                                anchor = '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
                                break;
                            }
                        }
                    }
                    if (!anchor) {
                        const name = node.getAttribute('name');
                        if (name && name.trim() && t && idx && (idx.nameCount.get(t + '|' + name.trim()) || 0) === 1) {
                            anchor = t + '[name="' + escapeAttrValue(name.trim()) + '"]';
                        }
                    }
                    if (!anchor) {
                        const aria = node.getAttribute('aria-label');
                        if (aria && aria.trim() && t && idx && (idx.ariaLabelCount.get(t + '|' + aria.trim()) || 0) === 1) {
                            anchor = t + '[aria-label="' + escapeAttrValue(aria.trim()) + '"]';
                        }
                    }
                }

                if (node === el) {
                    parts.unshift(nthOfType(node));
                } else if (anchor) {
                    parts.unshift(anchor);
                    break;
                } else {
                    parts.unshift(nthOfType(node));
                }

                if (!node.parentElement || node === root) break;
                node = node.parentElement;
            }

            const candidate = parts.join(' > ') || (tag || 'html');

            try {
                const scope = root && root.querySelectorAll ? root : document;
                const matches = scope.querySelectorAll(candidate);
                if (matches && matches.length === 1 && matches[0] === el) return candidate;
            } catch {
            }

            return buildSimpleSelector(el, tag || 'html');
        } catch {
            return 'html';
        }
    }

    function buildSelector(el) {
        try {
            if (__selectorCache && el && typeof el === 'object' && __selectorCache.has(el)) {
                __perfInc('selector.hit');
                return __selectorCache.get(el) || 'html';
            }
        } catch {
        }
        __perfInc('selector.miss');
        const sel = buildSelectorUncached(el);
        try {
            if (__selectorCache && el && typeof el === 'object') __selectorCache.set(el, sel);
        } catch {
        }
        return sel;
    }

    function getNonEmptyTitle(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'title');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch {
            return null;
        }
    }

    function getNonEmptyPlaceholder(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'placeholder');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch {
            return null;
        }
    }

    function hasLabelAssociation(el) {
        // Deterministic, stable subset:
        // - <label for="id">
        // - wrapping <label> ... <input> ...
        if (!isElement(el)) return false;

        try {
            if (__labelAssociationCache && el && typeof el === 'object' && __labelAssociationCache.has(el)) {
                __perfInc('labelAssociation.hit');
                return !!__labelAssociationCache.get(el);
            }
        } catch {
        }

        __perfInc('labelAssociation.miss');
        let out = false;

        const id = trim(getAttr(el, 'id'));
        if (id) {
            const entry = __lookupLabelForId(id, '__default__');
            if (entry && entry.exists) {
                out = true;
            }
        }

        if (!out && el.closest) {
            try {
                const wrap = el.closest('label');
                if (wrap && isElement(wrap)) out = true;
            } catch {
            }
        }

        try {
            if (__labelAssociationCache && el && typeof el === 'object') __labelAssociationCache.set(el, !!out);
        } catch {
        }

        return out;
    }

    function getLabelMethod(el, _ctx, opts) {
        // returns { method, value } where value is best-effort text, deterministically trimmed
        if (!isElement(el)) return {method: 'none', value: null};

        try {
            if (__labelMethodCache && el && typeof el === 'object' && __labelMethodCache.has(el)) {
                __perfInc('labelMethod.hit');
                const c = __labelMethodCache.get(el);
                if (c && typeof c === 'object') {
                    return {method: c.method || 'none', value: c.value == null ? null : String(c.value)};
                }
            }
        } catch {
        }

        __perfInc('labelMethod.miss');
        let out = {method: 'none', value: null};

        if (hasLabelAssociation(el)) out = {method: 'label', value: null};
        else if (getAriaLabelledByInfo) {
            try {
                const info = getAriaLabelledByInfo(el, _ctx, {maxRefs: 8});
                const v = info && info.present ? trim(info.value) : '';
                if (v) out = {method: 'aria-labelledby', value: v};
            } catch {
            }
        }

        if (out.method === 'none' && getAriaLabelInfo) {
            try {
                const info = getAriaLabelInfo(el);
                const v = info && info.present ? trim(info.value) : '';
                if (v) out = {method: 'aria-label', value: v};
            } catch {
            }
        }

        if (out.method === 'none') {
            const titleV = getNonEmptyTitle(el);
            if (titleV) out = {method: 'title', value: titleV};
        }

        if (out.method === 'none') {
            const phV = getNonEmptyPlaceholder(el);
            if (phV) out = {method: 'placeholder', value: phV};
        }

        try {
            if (__labelMethodCache && el && typeof el === 'object') {
                __labelMethodCache.set(el, {method: out.method, value: out.value});
            }
        } catch {
        }

        return out;
    }

    function getLabelStrength(method) {
        // policy choice; this is deterministic and tweakable
        if (method === 'label' || method === 'aria-labelledby') return 'strong';
        if (method === 'aria-label') return 'medium';
        if (method === 'title' || method === 'placeholder') return 'weak';
        return 'none';
    }

    function reportOccurrence(node, partial) {
        const o = (partial && typeof partial === 'object' && !Array.isArray(partial)) ? { ...partial } : {};
        // Attach the node for engine-side finalization. This must be removed later before returning results.
        o.__node = node || null;
        return o;
    }

    let __contrastSharedCache = {};
    try {
        // In Node/JSDOM tests, the harness sets global.window/global.document.
        // The engine may instantiate helpers per rule without passing opts.window,
        // so we must be able to recover the stable realm window to share caches.
        const w =
            realmWindow ||
            (document && document.defaultView) ||
            (typeof global !== 'undefined' && global.window ? global.window : null);

        if (w) {
            if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
            if (!w.__a11ycoreSharedCache.contrast) w.__a11ycoreSharedCache.contrast = {};
            __contrastSharedCache = w.__a11ycoreSharedCache.contrast;
        }
    } catch {
        __contrastSharedCache = {};
    }

    const __contrastShared = {
        trim,
        computedStyle,
        composedParent,
        buildSimpleSelector,
        __contrastSharedCache
    };

    const contrast = createContrastHelpers(
        {window: realmWindow || window, document, root},
        __contrastShared
    );

    // Expose shared cache to rules (deterministic, in-memory only)
    contrast.sharedCache = __contrastShared.__contrastSharedCache;

    return {
        // Existing query/snippet utilities
        queryAll,
        queryAllDeep,
        queryAllSmart,
        getOuterHtmlSnippet,
        buildSimpleSelector,
        buildSelector,

        // Existing (back-compat)
        hasAccessibleName,
        isExcluded,
        isAccTreeEligible,
        isDomVisibleEligible,

        // Eligibility info wrapper
        getEligibilityInfo,

        // IDREF primitives
        resolveIdRefs,
        getTextFromIdRefs,
        getTextFromIdRefsIdrefEligible,

        // ARIA-only name primitives (new)
        getAriaLabelInfo,
        getAriaLabelledByInfo,
        getAriaNameInfo,

        // Name / description
        getAccessibleNameInfo,
        getAccessibleDescriptionInfo,

        // Text alternatives
        getTextAlternativeInfo,

        // Role / focusability
        getRoleInfo,
        getFocusableInfo,

        getAttributeInfo,

        getLabelMethod, getLabelStrength,

        // Perf counters (only populated when opts.perfStats === true)
        getPerfStats,
        resetPerfStats,

        reportOccurrence,

        contrast
    };
});

// Inlined from src/core/dom-runner.js
const runCore = (function runCore(pageUrl, contextSelector, engineOptions, runOnly, RULE_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION) {
    const ctxSelector =
        (typeof contextSelector === 'string' && contextSelector.trim())
            ? contextSelector.trim()
            : null;

    const policy = resolvePolicy(POLICY_CONTRACTS, engineOptions);

    const root =
        ctxSelector
            ? (document.querySelector(ctxSelector) ||
                document.documentElement ||
                document.body ||
                document.querySelector('html'))
            : (document.documentElement ||
                document.body ||
                document.querySelector('html'));


    const includeShadowDom = !!(engineOptions && engineOptions.includeShadowDom);
    const excludeSelectors = normalizeSelectorList(engineOptions && engineOptions.excludeSelectors);

    const url = pageUrl || (document.location && document.location.href) || null;
    const title = document.title || null;
    // Deterministic timestamp: only use host-provided value (no time-based logic).
    const timestamp =
        (engineOptions && typeof engineOptions.timestamp === 'string' && engineOptions.timestamp.trim())
            ? engineOptions.timestamp.trim()
            : null;

    const sharedHelpers = createDomHelpers({
        document,
        window,
        root,
        includeShadowDom,
        excludeSelectors,
        // Optional perf counters (bench/debug only). Deterministic and per-run.
        perfStats: !!(engineOptions && engineOptions.perfStats)
    });

    const profileRules = !!(engineOptions && engineOptions.profileRules);
    const ruleTimings = profileRules ? Object.create(null) : null;

    function nowMs() {
        // performance.now() if available, else Date.now()
        try {
            if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
                return performance.now();
            }
        } catch (e) {}
        return Date.now();
    }

    // =========================
    // Probes (optional evidence fed by the host app)
    // Keep deterministic + serializable + no-throws.
    // =========================
    function sanitizeProbeValue(v, depth) {
        // depth-bounded, JSON-safe sanitizer
        if (depth <= 0) return null;
        if (v == null) return null;

        const t = typeof v;
        if (t === 'string') return v.length > 2000 ? v.slice(0, 2000) : v;
        if (t === 'number') return Number.isFinite(v) ? v : null;
        if (t === 'boolean') return v;
        if (t === 'function') return null;

        if (Array.isArray(v)) {
            // cap arrays to avoid huge payloads
            const out = [];
            const n = Math.min(v.length, 200);
            for (let i = 0; i < n; i++) out.push(sanitizeProbeValue(v[i], depth - 1));
            return out;
        }

        if (t === 'object') {
            const out = {};
            const keys = Object.keys(v);
            // cap object keys
            const n = Math.min(keys.length, 50);
            for (let i = 0; i < n; i++) {
                const k = keys[i];
                // only allow string keys
                if (typeof k !== 'string') continue;
                out[k] = sanitizeProbeValue(v[k], depth - 1);
            }
            return out;
        }

        return null;
    }

    let probes = null;
    try {
        const rawProbes = engineOptions && typeof engineOptions.probes === 'object' ? engineOptions.probes : null;
        probes = rawProbes ? sanitizeProbeValue(rawProbes, 6) : null;
        if (!probes || typeof probes !== 'object' || Array.isArray(probes)) probes = null;
    } catch (e) {
        probes = null;
    }

    const rulesResults = [];

    for (const def of RULE_DEFS) {
        const t0 = ruleTimings ? nowMs() : 0;
        const defResolved = resolveRuleDefI18n(def, engineOptions);
        if (!ruleMatchesRunOnly(defResolved, runOnly)) continue;

        const implEntry = RULE_IMPLS[defResolved.ruleId];
        const impl = implEntry && typeof implEntry.run === 'function' ? implEntry.run : null;
        const applicabilityFn = implEntry && typeof implEntry.applicability === 'function' ? implEntry.applicability : null;
        if (typeof impl !== 'function') continue;

        const ruleConfig =
            engineOptions && engineOptions.rules && engineOptions.rules[defResolved.ruleId]
                ? engineOptions.rules[defResolved.ruleId]
                : null;

        const ctx = {
            document,
            window,
            root,
            rule: defResolved,
            config: ruleConfig,
            helpers: sharedHelpers,
            engineTag: ENGINE_TAG,
            contextSelector: ctxSelector,
            engineOptions: (engineOptions && typeof engineOptions === 'object') ? engineOptions : {},

            // Optional evidence channel provided by host app
            inputs: {
                probes
            }
        };

        if (typeof applicabilityFn === 'function') {
            let applicable = true;
            try {
                const res = applicabilityFn(ctx);
                if (typeof res === 'boolean') applicable = res;
                else if (res && typeof res === 'object' && typeof res.applicable === 'boolean') applicable = res.applicable;
            } catch (err) {
                const raw = {
                    outcome: 'cantTell',
                    occurrences: [],
                    error: String(err && err.message ? err.message : err),
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
                if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
                continue;
            }

            if (!applicable) {
                const raw = {
                    outcome: 'notApplicable',
                    occurrences: [],
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
                if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
                continue;
            }
        }

        let result;
        try {
            result = impl(ctx);
        } catch (err) {
            result = {
                outcome: 'cantTell',
                occurrences: [],
                error: String(err && err.message ? err.message : err),
                engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
            };
        }

        if (!result || typeof result !== 'object') {
            if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
            continue;
        }
        if (!result.engineOptions) {
            result.engineOptions = { ...(ctx.engineOptions || {}), locale: normalizeLocale(engineOptions && engineOptions.locale) };
        }
        rulesResults.push(normalizeRuleResult(defResolved, result, SCHEMA_VERSION, policy, sharedHelpers));
        if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
    }


    // Optional perf counters passthrough (only when enabled). Deterministic.
    let perfStats = null;
    try {
        if (engineOptions && engineOptions.perfStats && sharedHelpers && typeof sharedHelpers.getPerfStats === 'function') {
            perfStats = sharedHelpers.getPerfStats();
        }
    } catch (e) {
        perfStats = null;
    }

    if (ruleTimings) {
        if (perfStats && engineOptions && engineOptions.profileRules) {
            perfStats.ruleTimings = ruleTimings; // (whatever your timing map is)
        }
    }

    return {
        engine: { tag: ENGINE_TAG, schemaVersion: SCHEMA_VERSION },
        url,
        title,
        timestamp,
        perfStats,
        contextSelector: ctxSelector,
        rules: rulesResults
    };
});

function getRuleDefById(ruleId, engineOptions) {
  const r = RULE_DEFS.find((x) => x.ruleId === ruleId) || null;
  return r ? toCatalogEntry(r, engineOptions) : null;
}

function getRulesCatalog(engineOptions) {
  return RULE_DEFS.map((r) => toCatalogEntry(r, engineOptions));
}

function getRulesForRunOnly(runOnly, engineOptions) {
  return RULE_DEFS
    .filter((r) => ruleMatchesRunOnly(r, resolveEffectiveRunOnly(engineOptions, runOnly), ENGINE_TAG))
    .map((r) => toCatalogEntry(r, engineOptions));
}

/**
 * Node/runtime runner.
 */
function runDomRulesInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  return runCore(pageUrl, contextSelector, engineOptions, resolveEffectiveRunOnly(engineOptions, runOnly), RULE_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION);
}

// =======================
// SELF-CONTAINED in-page runner for page.evaluate
// =======================
function runa11yCoreInPage(pageUrl, contextSelector, engineOptions, runOnly) {
  const ENGINE_TAG = "a11ycore";
  const SCHEMA_VERSION = "1.0.0";

  const RULE_DEFS = [
  {
    "ruleId": "a11ycore-area-alt-decorative",
    "title": "<area> with alt=\"\" must be decorative (manual review)",
    "description": "Flags <area> elements with empty alt for human review that they are decorative/non-informative.",
    "i18n": {
      "titleKey": "a11ycore_area_altDecorative_title",
      "descriptionKey": "a11ycore_area_altDecorative_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "imagemap",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-area-alt-present",
    "title": "&lt;area&gt; must have an alt attribute",
    "description": "Checks that &lt;area&gt; elements provide an alt attribute to support a text alternative mechanism.",
    "i18n": {
      "titleKey": "a11ycore_area_altPresent_title",
      "descriptionKey": "a11ycore_area_altPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "imagemap",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "area-alt-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-area-alt-quality",
    "title": "<area> alt text must be appropriate (manual review)",
    "description": "Flags <area> elements with non-empty alt text for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_area_altQuality_title",
      "descriptionKey": "a11ycore_area_altQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "imagemap",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-aria-hidden-programmatic-focus-review",
    "title": "Review aria-hidden programmatic focus",
    "description": "Flags elements that are aria-hidden but programmatically focusable (tabindex < 0). Verify intended focus management and assistive technology exposure.",
    "i18n": {
      "titleKey": "a11ycore_ariaHidden_programmaticFocus_review_title",
      "descriptionKey": "a11ycore_ariaHidden_programmaticFocus_review_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag412",
      "focus",
      "aria",
      "atomic",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [],
    "defaultSeverity": "moderate",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": null,
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "robust",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-canvas-text-alternative-present",
    "title": "<canvas> must provide a text alternative",
    "description": "Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.",
    "i18n": {
      "titleKey": "a11ycore_canvas_textAltPresent_title",
      "descriptionKey": "a11ycore_canvas_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "canvas",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "canvas-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-canvas-text-alternative-quality",
    "title": "<canvas> text alternative must be appropriate (manual review)",
    "description": "Flags <canvas> elements with a detected text alternative for human review of equivalence and appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_canvas_textAltQuality_title",
      "descriptionKey": "a11ycore_canvas_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "canvas",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-contrast-computable",
    "title": "Color contrast is computable for rendered text",
    "description": "Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).",
    "i18n": {
      "titleKey": "a11ycore_contrastComputable_title",
      "descriptionKey": "a11ycore_contrastComputable_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag2aa",
      "wcag2aaa",
      "wcag143",
      "wcag146",
      "contrast",
      "color",
      "structure",
      "atomic",
      "automatic",
      "dom",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.3",
        "title": "Contrast (Minimum)",
        "conformanceLevel": "AA"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.6",
        "title": "Contrast (Enhanced)",
        "conformanceLevel": "AAA"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "minor",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.4.3": [
          "contrast-computability-143"
        ],
        "1.4.6": [
          "contrast-computability-146"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-contrast-enhanced",
    "title": "Text meets enhanced color contrast (AAA)",
    "description": "Checks that visible text has a contrast ratio of at least 7:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.",
    "i18n": {
      "titleKey": "a11ycore_contrastEnhanced_title",
      "descriptionKey": "a11ycore_contrastEnhanced_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2aaa",
      "wcag146",
      "contrast",
      "color",
      "structure",
      "atomic",
      "automatic",
      "dom",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.6",
        "title": "Contrast (Enhanced)",
        "conformanceLevel": "AAA"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.4.6": [
          "contrast-enhanced-text"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-contrast-minimum",
    "title": "Text meets minimum color contrast (AA)",
    "description": "Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3:1 (large), when contrast is computable from CSS.",
    "i18n": {
      "titleKey": "a11ycore_contrastMinimum_title",
      "descriptionKey": "a11ycore_contrastMinimum_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2aa",
      "wcag143",
      "contrast",
      "color",
      "structure",
      "atomic",
      "automatic",
      "dom",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.4.3",
        "title": "Contrast (Minimum)",
        "conformanceLevel": "AA"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.4.3": [
          "contrast-minimum-text"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-embed-text-alternative-present",
    "title": "<embed> must provide a text alternative",
    "description": "Checks that <embed> elements provide a text alternative via an accessible name.",
    "i18n": {
      "titleKey": "a11ycore_embed_textAltPresent_title",
      "descriptionKey": "a11ycore_embed_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "embed",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "embed-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-embed-text-alternative-quality",
    "title": "<embed> text alternative must be appropriate (manual review)",
    "description": "Flags <embed> elements with a detected name for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_embed_textAltQuality_title",
      "descriptionKey": "a11ycore_embed_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "embed",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-form-control-programmatic-label-present",
    "title": "Form controls must have a programmatic label",
    "description": "Checks that form controls have a programmatic label via <label>, aria-label, aria-labelledby, title, or placeholder.",
    "i18n": {
      "titleKey": "a11ycore_formControl_programmaticLabelPresent_title",
      "descriptionKey": "a11ycore_formControl_programmaticLabelPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag131",
      "wcag332",
      "wcag412",
      "forms",
      "labels",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "4.1.2",
        "title": "Name, Role, Value",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "4.1.2": [
          "form-control-name-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "robust",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-form-control-programmatic-label-quality",
    "title": "Form controls should not rely on placeholder or title as the primary label",
    "description": "Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer <label> or aria-labelledby.",
    "i18n": {
      "titleKey": "a11ycore_formControl_programmaticLabelQuality_title",
      "descriptionKey": "a11ycore_formControl_programmaticLabelQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag412",
      "forms",
      "labels",
      "quality",
      "atomic",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "4.1.2",
        "title": "Name, Role, Value",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "moderate",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "4.1.2": [
          "form-control-name-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "robust",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-html-lang-attr-present",
    "title": "Page language is declared",
    "description": "Checks that the default language of the page is programmatically declared.",
    "i18n": {
      "titleKey": "a11ycore_html_lang_attr_title",
      "descriptionKey": "a11ycore_html_lang_attr_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag311",
      "structure",
      "language",
      "automatic",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "3.1.1",
        "title": "Language of Page",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "3.1.1": [
          "html-lang-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "understandable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-img-alt-decorative",
    "title": "<img> with alt=\"\" must be decorative (manual review)",
    "description": "Flags <img> elements with empty alt for human review that they are purely decorative.",
    "i18n": {
      "titleKey": "a11ycore_img_altDecorative_title",
      "descriptionKey": "a11ycore_img_altDecorative_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-img-alt-present",
    "title": "<img> must have an alt attribute",
    "description": "Checks that <img> elements provide an alt attribute to support a text alternative mechanism.",
    "i18n": {
      "titleKey": "a11ycore_img_altPresent_title",
      "descriptionKey": "a11ycore_img_altPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "img-alt-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-img-alt-quality",
    "title": "<img> alt text must be appropriate (manual review)",
    "description": "Flags <img> elements with non-empty alt text for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_img_altQuality_title",
      "descriptionKey": "a11ycore_img_altQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-input-image-alt-decorative",
    "title": "<input type=\"image\"> with alt=\"\" must be appropriate (manual review)",
    "description": "Flags <input type=\"image\"> elements with empty alt for human review (usually not appropriate for functional controls).",
    "i18n": {
      "titleKey": "a11ycore_inputImage_altDecorative_title",
      "descriptionKey": "a11ycore_inputImage_altDecorative_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "forms",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-input-image-alt-present",
    "title": "<input type=\"image\"> must have an alt attribute",
    "description": "Checks that <input type=\"image\"> elements provide an alt attribute to support a text alternative mechanism.",
    "i18n": {
      "titleKey": "a11ycore_inputImage_altPresent_title",
      "descriptionKey": "a11ycore_inputImage_altPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "input-image-alt-attr-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-input-image-alt-quality",
    "title": "<input type=\"image\"> alt text must be appropriate (manual review)",
    "description": "Flags <input type=\"image\"> elements with non-empty alt text for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_inputImage_altQuality_title",
      "descriptionKey": "a11ycore_inputImage_altQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "forms",
      "images",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-manual-review",
    "title": "Manual review: keyboard navigation and focus order",
    "description": "Flags that a manual review of keyboard navigation and focus order is required.",
    "i18n": {
      "titleKey": "a11ycore_manualReview_title",
      "descriptionKey": "a11ycore_manualReview_description"
    },
    "helpUrl": "",
    "tags": [
      "manual",
      "wcag2a",
      "wcag2aa",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.1.1",
        "title": "Keyboard",
        "conformanceLevel": "A",
        "url": "https://www.w3.org/TR/WCAG22/#keyboard"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.3",
        "title": "Focus Order",
        "conformanceLevel": "A",
        "url": "https://www.w3.org/TR/WCAG22/#focus-order"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.7",
        "title": "Focus Visible",
        "conformanceLevel": "AA",
        "url": "https://www.w3.org/TR/WCAG22/#focus-visible"
      },
      {
        "standard": "EN 301 549",
        "version": "V3.2.1",
        "requirement": "9.2.1.1",
        "title": "Keyboard"
      },
      {
        "standard": "EN 301 549",
        "version": "V3.2.1",
        "requirement": "9.2.4.3",
        "title": "Focus Order"
      },
      {
        "standard": "EN 301 549",
        "version": "V3.2.1",
        "requirement": "9.2.4.7",
        "title": "Focus Visible"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "type": "Understanding",
        "requirement": "2.1.1",
        "title": "Understanding Keyboard",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "type": "Understanding",
        "requirement": "2.4.3",
        "title": "Understanding Focus Order",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html"
      },
      {
        "standard": "WCAG",
        "version": "2.2",
        "type": "Understanding",
        "requirement": "2.4.7",
        "title": "Understanding Focus Visible",
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
      }
    ],
    "defaultSeverity": "moderate",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": null,
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "operable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-media-alternative-transcript-evidence",
    "title": "Time-based media: transcript / media alternative evidence",
    "description": "Finds <audio>/<video> elements where a transcript or other text alternative is not strongly evidenced in-page. This rule is conservative and returns cantTell when evidence is missing or unverified.",
    "i18n": {
      "titleKey": "a11ycore_mediaTranscriptPresent_title",
      "descriptionKey": "a11ycore_mediaTranscriptPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag121",
      "timebasedmedia",
      "atomic",
      "manual",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.2.1",
        "title": "Audio-only and Video-only (Prerecorded)",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "moderate",
    "defaultConfidence": "low",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.2.1": [
          "transcript-evidence"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-object-text-alternative-present",
    "title": "<object> must provide a text alternative",
    "description": "Checks that <object> elements provide a text alternative via fallback content or an accessible name.",
    "i18n": {
      "titleKey": "a11ycore_object_textAltPresent_title",
      "descriptionKey": "a11ycore_object_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "object",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "object-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-object-text-alternative-quality",
    "title": "<object> text alternative must be appropriate (manual review)",
    "description": "Flags <object> elements with detected fallback or name for human review of equivalence and appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_object_textAltQuality_title",
      "descriptionKey": "a11ycore_object_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "object",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-page-title-patterns",
    "title": "Page title patterns that may indicate low descriptiveness",
    "description": "Flags page titles that are likely too generic or templated as review signals (WCAG 2.2 SC 2.4.2). This rule is conservative and does not fail based on patterns alone.",
    "i18n": {
      "titleKey": "a11ycore_pageTitlePatterns_title",
      "descriptionKey": "a11ycore_pageTitlePatterns_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag242",
      "titles",
      "atomic",
      "navigation",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.2",
        "title": "Page Titled",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "2.4.2": [
          "page-title-patterns"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "operable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-page-title-present",
    "title": "Page title is present and non-empty",
    "description": "Checks that the document has a non-empty <title> element (WCAG 2.2 SC 2.4.2).",
    "i18n": {
      "titleKey": "a11ycore_pageTitlePresent_title",
      "descriptionKey": "a11ycore_pageTitlePresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag242",
      "titles",
      "atomic",
      "navigation",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "2.4.2",
        "title": "Page Titled",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "2.4.2": [
          "page-title-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "operable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-role-img-text-alternative-present",
    "title": "[role=\"img\"] must have an accessible text alternative",
    "description": "Checks that elements with role=\"img\" provide an accessible text alternative via aria-label or aria-labelledby.",
    "i18n": {
      "titleKey": "a11ycore_roleImg_textAlternativePresent_title",
      "descriptionKey": "a11ycore_roleImg_textAlternativePresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "images",
      "aria",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "role-img-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-svg-image-text-alternative-present",
    "title": "SVG <image> must have a text alternative",
    "description": "Checks that SVG <image> elements provide a text alternative via <title>/<desc> or an ARIA accessible name.",
    "i18n": {
      "titleKey": "a11ycore_svgImage_textAltPresent_title",
      "descriptionKey": "a11ycore_svgImage_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "svg",
      "image",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "svg-image-text-alt-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-svg-text-alternative-present",
    "title": "<svg> must provide a text alternative",
    "description": "Checks that inline <svg> elements provide a text alternative via <title>/<desc> or an ARIA name.",
    "i18n": {
      "titleKey": "a11ycore_svg_textAltPresent_title",
      "descriptionKey": "a11ycore_svg_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "svg",
      "nontext",
      "images",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "high",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "svg-text-alternative-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-svg-text-alternative-quality",
    "title": "<svg> text alternative must be appropriate (manual review)",
    "description": "Flags applicable <svg> graphics with a detected text alternative for human review of appropriateness.",
    "i18n": {
      "titleKey": "a11ycore_svg_textAltQuality_title",
      "descriptionKey": "a11ycore_svg_textAltQuality_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "nontext",
      "svg",
      "manual",
      "atomic",
      "a11ycore"
    ],
    "normativeMappings": [],
    "informativeReferences": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "defaultSeverity": "minor",
    "defaultConfidence": "medium",
    "type": "manual",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "text-alternative-quality"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  },
  {
    "ruleId": "a11ycore-video-poster-text-alternative-present",
    "title": "<video> poster must have a text alternative",
    "description": "Checks that <video> elements with a poster image provide a text alternative (accessible name or fallback text).",
    "i18n": {
      "titleKey": "a11ycore_videoPoster_textAltPresent_title",
      "descriptionKey": "a11ycore_videoPoster_textAltPresent_description"
    },
    "helpUrl": "",
    "tags": [
      "wcag2a",
      "wcag111",
      "media",
      "video",
      "atomic",
      "automatic",
      "a11ycore"
    ],
    "normativeMappings": [
      {
        "standard": "WCAG",
        "version": "2.2",
        "requirement": "1.1.1",
        "title": "Non-text Content",
        "conformanceLevel": "A"
      }
    ],
    "informativeReferences": [],
    "defaultSeverity": "serious",
    "defaultConfidence": "medium",
    "type": "automatic",
    "coverage": {
      "facetsBySc": {
        "1.1.1": [
          "video-poster-text-alt-present"
        ]
      }
    },
    "data": null,
    "ruleInterfaceVersion": "1.0.0",
    "ruleVersion": "0.0.0",
    "normative": true,
    "atomic": true,
    "category": "perceivable",
    "standard": null,
    "applicability": "",
    "expectation": "",
    "references": [],
    "requirements": null,
    "mappings": null
  }
];

  const RULE_IMPLS = {
    "a11ycore-area-alt-decorative": { run: (function runInPage(ctx) {
    const {document, root, helpers, rule} = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try {
                return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : [];
            } catch {
                return [];
            }
        };

    const __accEligCache = new WeakMap();
    function accEligibleCached(node) {
        if (!isAccTreeEligible) return { eligible: true, reasons: [] };
        if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
        const cached = __accEligCache.get(node);
        if (cached) return cached;
        let res;
        try { res = isAccTreeEligible(node, ctx); }
        catch { res = { eligible: true, reasons: [] }; }
        res = res && typeof res === 'object' ? res : { eligible: !!res, reasons: [] };
        __accEligCache.set(node, res);
        return res;
    }

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;


// --- image-map semantics (rule-local; match automatic <area> applicability) ---
    function normUsemap(val) {
        try {
            const t = String(val || '').trim();
            if (!t) return '';
            return (t[0] === '#') ? t.slice(1).trim().toLowerCase() : t.toLowerCase();
        } catch {
            return '';
        }
    }

    function getMapName(mapEl) {
        try {
            if (!mapEl || !mapEl.getAttribute) return '';
            const n = String(mapEl.getAttribute('name') || mapEl.getAttribute('id') || '').trim();
            return n ? n.toLowerCase() : '';
        } catch {
            return '';
        }
    }

    function getReferencingImgForArea(areaEl) {
        try {
            if (!areaEl || !areaEl.closest) return null;
            const map = areaEl.closest('map');
            if (!map) return null;
            const mapName = getMapName(map);
            if (!mapName) return null;

            const imgs = Array.from(document.querySelectorAll('img[usemap]'));
            for (const img of imgs) {
                const u = normUsemap(img.getAttribute('usemap'));
                if (u && u === mapName) return img; // deterministic: first match in doc order
            }
        } catch {
        }
        return null;
    }

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try {
                return String(el.getAttribute('role') || '').trim().toLowerCase();
            } catch {
                return '';
            }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => {
                try {
                    return getFocusableInfo(el, ctx);
                } catch {
                    return null;
                }
            })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try {
            return Array.from((queryAllSmart ? queryAllSmart("area") : queryAll("area")) || []);
        } catch {
            return queryAll("area");
        }
    })();

    const __usemapIndex = new Map(); // mapName -> img (first in document order)
    try {
        const imgs = Array.from(document.querySelectorAll('img[usemap]'));
        for (const img of imgs) {
            const u = normUsemap(img.getAttribute('usemap'));
            if (!u) continue;
            if (!__usemapIndex.has(u)) __usemapIndex.set(u, img); // keep first match only
        }
    } catch {
    }

    if (!els.length) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        // Must belong to a *used* image map (referenced by an <img usemap>). If unused, not applicable.
        let img = null;
        try {
            const map = el.closest && el.closest('map');
            const mapName = map ? getMapName(map) : '';
            img = mapName ? (__usemapIndex.get(mapName) || null) : null;
        } catch {
            img = null;
        }
        if (!img) continue;

        // The referencing <img> must be eligible in the accessibility tree.
        if (isAccTreeEligible) {
            const imgElig = accEligibleCached(img);
            if (imgElig && imgElig.eligible === false) continue;
        }

        if (isAccTreeEligible) {
            const elig = (() => {
                try {
                    return isAccTreeEligible(el, ctx);
                } catch {
                    return {eligible: true, reasons: []};
                }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        let alt = null;
        try { alt = el.getAttribute('alt'); } catch { alt = null; }
        if (alt === null) continue;
        if (String(alt).trim() !== '') continue; // only alt=""

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, {targetSet: 'acc'}) : null;

        const baseOccurrence = {
            summary: 'Review whether <area> is decorative (alt="").',
            hint: 'Confirm the area does not convey information or function. If it is interactive or meaningful, provide meaningful alt text.',
            i18n: {
                summaryKey: 'a11ycore_area_altDecorative_summary_cantTell',
                hintKey: 'a11ycore_area_altDecorative_hint_cantTell',
                params: {element: (el.tagName || '').toLowerCase()}
            },
            data: {
                visibilityFilter: eligInfo || {targetSet: 'acc', accEligible: null, reasons: []},
                details: null
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({selector: '', html: '', ...baseOccurrence});
        }
    }

    if (applicableCount === 0) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    return {ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences};
}), applicability: null },
    "a11ycore-area-alt-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
        try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
        catch { return []; }
      };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
      ? helpers.getEligibilityInfo
      : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
      ? helpers.isAccTreeEligible
      : null;

  // --- image-map semantics (rule-local) ---

  function normUsemap(val) {
    try {
      const s = String(val || '').trim();
      if (!s) return '';
      return (s[0] === '#') ? s.slice(1).trim().toLowerCase() : s.toLowerCase();
    } catch {
      return '';
    }
  }

  function getMapName(mapEl) {
    try {
      if (!mapEl || !mapEl.getAttribute) return '';
      const n = String(mapEl.getAttribute('name') || mapEl.getAttribute('id') || '').trim();
      return n ? n.toLowerCase() : '';
    } catch {
      return '';
    }
  }

  // Cache mapName -> first referencing <img> in document order (deterministic)
  const __usemapIndex = (() => {
    const idx = new Map();
    try {
      const imgs = document && document.querySelectorAll ? document.querySelectorAll('img[usemap]') : [];
      for (const img of imgs) {
        if (!img || !img.getAttribute) continue;
        const u = normUsemap(img.getAttribute('usemap'));
        if (!u) continue;
        if (!idx.has(u)) idx.set(u, img); // first in document order wins
      }
    } catch {
      // ignore
    }
    return idx;
  })();

  function getReferencingImgForArea(areaEl) {
    try {
      if (!areaEl || !areaEl.closest) return null;
      const map = areaEl.closest('map');
      if (!map) return null;

      const mapName = getMapName(map);
      if (!mapName) return null;

      return __usemapIndex.get(mapName) || null;
    } catch {}
    return null;
  }

  const areas = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('area') : queryAll('area')) || []); }
    catch { return queryAll('area'); }
  })();

  if (!areas.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of areas) {
    if (!el || !el.getAttribute) continue;

    // 0) Must belong to a *used* image map: an <img usemap> must reference its <map>.
    // If not used, <area> is not applicable (matches your observed focus behavior).
    const img = getReferencingImgForArea(el);
    if (!img) continue;

    // 1) The referencing <img> must itself be eligible in the acc tree.
    // This is the "visibility of map/area doesn't matter; the image does" policy.
    if (isAccTreeEligible) {
      const imgElig = (() => {
        try { return isAccTreeEligible(img, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (imgElig && imgElig.eligible === false) continue;
    }

    // 2) The <area> itself must be eligible (aria-hidden/inert exceptions handled by helper).
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // From here: applicable
    applicableCount += 1;

    const hasAlt = el.getAttribute('alt') !== null;
    if (hasAlt) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      // Leave selector/html empty so the engine can fill them from __node.
      selector: '',
      html: '',
      summary: 'Missing alt attribute on &lt;area&gt;.',
      hint: 'Add an alt attribute (use alt="" only for decorative areas).',
      i18n: {
        summaryKey: 'a11ycore_area_altPresent_summary_fail',
        hintKey: 'a11ycore_area_altPresent_hint_fail',
        params: { element: 'area' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-area-alt-quality": { run: (function runInPage(ctx) {

    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const __accEligCache = new WeakMap();
    function accEligibleCached(node) {
        if (!isAccTreeEligible) return { eligible: true, reasons: [] };
        if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
        const c = __accEligCache.get(node);
        if (c) return c;
        let r;
        try { r = isAccTreeEligible(node, ctx); } catch { r = { eligible: true, reasons: [] }; }
        r = r && typeof r === 'object' ? r : { eligible: !!r, reasons: [] };
        __accEligCache.set(node, r);
        return r;
    }

// --- image-map semantics (rule-local; match automatic <area> applicability) ---
function normUsemap(val) {
    try {
        const t = String(val || '').trim();
        if (!t) return '';
        return (t[0] === '#') ? t.slice(1).trim().toLowerCase() : t.toLowerCase();
    } catch { return ''; }
}
function getMapName(mapEl) {
    try {
        if (!mapEl || !mapEl.getAttribute) return '';
        const n = String(mapEl.getAttribute('name') || mapEl.getAttribute('id') || '').trim();
        return n ? n.toLowerCase() : '';
    } catch { return ''; }
}

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('area') : queryAll('area')) || []); }
        catch { return queryAll('area'); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    const __usemapIndex = new Map(); // mapName -> img (first in document order)
    try {
        const imgs = Array.from(document.querySelectorAll('img[usemap]'));
        for (const img of imgs) {
            const u = normUsemap(img.getAttribute('usemap'));
            if (!u) continue;
            if (!__usemapIndex.has(u)) __usemapIndex.set(u, img);
        }
    } catch {}

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

// Must belong to a *used* image map (referenced by an <img usemap>). If unused, not applicable.
        let img = null;
        try {
            const map = el.closest && el.closest('map');
            const mapName = map ? getMapName(map) : '';
            img = mapName ? (__usemapIndex.get(mapName) || null) : null;
        } catch {
            img = null;
        }
        if (!img) continue;

// The referencing <img> must be eligible in the accessibility tree.
if (isAccTreeEligible) {
    const imgElig = accEligibleCached(img);
    if (imgElig && imgElig.eligible === false) continue;
}

        if (isAccTreeEligible) {
            const elig = accEligibleCached(el);
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        let alt = null;
        try { alt = el.getAttribute('alt'); } catch { alt = null; }
        if (alt === null) continue;
        if (String(alt).trim() === '') continue; // only non-empty alt is applicable here

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        let altVal = '';
        try { altVal = String(el.getAttribute('alt') || ''); } catch { altVal = ''; }

        const baseOccurrence = {
            summary: 'Review alt text on <area> for accuracy and appropriateness.',
            hint: 'Ensure the alt text identifies the destination/action of the image map area in context.',
            i18n: {
                summaryKey: 'a11ycore_area_altQuality_summary_cantTell',
                hintKey: 'a11ycore_area_altQuality_hint_cantTell',
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: { alt: altVal.trim() } // optional but useful for manual review
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}), applicability: null },
    "a11ycore-aria-hidden-programmatic-focus-review": { run: (function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAll = helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const buildSelector = helpers && typeof helpers.buildSelector === 'function'
        ? helpers.buildSelector
        : (el) => {
            try {
                if (!el || !el.tagName) return 'html';
                const tag = (el.tagName || 'html').toLowerCase();
                return el.id ? `${tag}#${el.id}` : tag;
            } catch { return 'html'; }
        };

    const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function'
        ? helpers.getOuterHtmlSnippet
        : (el) => { try { return (el && el.outerHTML) ? String(el.outerHTML).slice(0, 2000) : ''; } catch { return ''; } };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    // We only need to look at nodes that *might* be in this situation.
    // Keep it deterministic and cheap.
    const candidates = queryAll('[aria-hidden="true"], [aria-hidden="true"] *') || [];
    if (!candidates.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];

    for (const el of candidates) {
        if (!el || !el.getAttribute) continue;

        const info = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
        const reasons = info && Array.isArray(info.reasons) ? info.reasons : [];

        // We only flag the precise, “low-confidence override” case.
        if (!reasons.includes('ariaHiddenOverriddenProgrammaticFocus')) continue;

        occurrences.push({
            selector: (() => { try { return buildSelector(el); } catch { return 'html'; } })(),
            html: getOuterHtmlSnippet(el),
            summary: 'Review: aria-hidden element is programmatically focusable.',
            hint: 'Check that focus management is intentional and that the element should remain hidden from assistive technologies.',
            i18n: {
                summaryKey: 'a11ycore_ariaHidden_programmaticFocus_review_summary',
                hintKey: 'a11ycore_ariaHidden_programmaticFocus_review_hint'
            },
            data: {
                visibilityFilter: info || { targetSet: 'acc', accEligible: null, reasons: [] }
            }
        });
    }

    if (!occurrences.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'moderate', occurrences: [] };
    }

    // Manual rule: never fail.
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-canvas-text-alternative-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
    ? helpers.queryAll
    : (sel) => {
      try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
      catch { return []; }
    };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const getTextAlternativeInfo = helpers && typeof helpers.getTextAlternativeInfo === 'function'
    ? helpers.getTextAlternativeInfo
    : null;

  const canvases = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('canvas') : queryAll('canvas')) || []); }
    catch { return queryAll('canvas'); }
  })();

  if (!canvases.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of canvases) {
    if (!el) continue;

    // Applicability: eligible in the accessibility tree (with focusable/IDREF exceptions handled by helper).
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    applicableCount += 1;

    // Expectation: must provide a text alternative.
    const ti = getTextAlternativeInfo
      ? (() => { try { return getTextAlternativeInfo(el, ctx); } catch { return null; } })()
      : null;

    const hasTextAlt = !!(ti && ti.present);

    if (hasTextAlt) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      selector: '',
      html: '',
      summary: 'Missing text alternative for <canvas>.',
      hint: 'Provide fallback text inside <canvas> or an accessible name (e.g., aria-label/aria-labelledby).',
      i18n: {
        summaryKey: 'a11ycore_canvas_textAltPresent_summary_fail',
        hintKey: 'a11ycore_canvas_textAltPresent_hint_fail',
        params: { element: 'canvas' }
      },
      data: {
        // Always log eligibility/filter info (engine contract for targetSet=acc rules)
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        // Debuggable, deterministic helper facts (non-verdict)
        textAlternative: ti || null
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-canvas-text-alternative-quality": { run: (function runInPage(ctx) {

    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const __accEligCache = new WeakMap();
    function accEligibleCached(node) {
        if (!isAccTreeEligible) return { eligible: true, reasons: [] };
        if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
        const c = __accEligCache.get(node);
        if (c) return c;
        let r;
        try { r = isAccTreeEligible(node, ctx); } catch { r = { eligible: true, reasons: [] }; }
        r = r && typeof r === 'object' ? r : { eligible: !!r, reasons: [] };
        __accEligCache.set(node, r);
        return r;
    }

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
            focusable = !!(fi && fi.focusable);
        } else {
            let tabindex = null;
            try { tabindex = el.getAttribute('tabindex'); } catch { tabindex = null; }
            const t = tabindex == null ? '' : String(tabindex).trim();
            focusable = t !== '' && !Number.isNaN(Number(t));
        }
        return !focusable;
    }


    const els = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('canvas') : queryAll('canvas')) || []); }
        catch { return queryAll('canvas'); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        if (isAccTreeEligible) {
            const elig = accEligibleCached(el);
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        const getTextAlternativeInfo =
            helpers && typeof helpers.getTextAlternativeInfo === 'function'
                ? helpers.getTextAlternativeInfo
                : null;

        const trim = (v) => (v == null ? '' : String(v)).trim();

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        let textAltInfo = null;
        if (getTextAlternativeInfo) {
            try { textAltInfo = getTextAlternativeInfo(el, ctx); } catch { textAltInfo = null; }
        }

        const hasTextAlt = !!(textAltInfo && textAltInfo.present);
        if (!hasTextAlt) continue;

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Review text alternative for <canvas> for equivalence and appropriateness.',
            hint: 'Confirm the fallback text or accessible name conveys the same information/function as the canvas content.',
            i18n: {
                summaryKey: 'a11ycore_canvas_textAltQuality_summary_cantTell',
                hintKey: 'a11ycore_canvas_textAltQuality_hint_cantTell',
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: textAltInfo || null
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}), applicability: null },
    "a11ycore-contrast-computable": { run: (function runInPage(ctx) {
    const { helpers, rule, engineOptions } = ctx;

    const __contrastSharedCache = helpers && helpers.contrast && helpers.contrast.sharedCache ? helpers.contrast.sharedCache : null;

    const profile =
        engineOptions && typeof engineOptions.profile === 'string' && engineOptions.profile.trim()
            ? engineOptions.profile.trim()
            : 'strictConformance';

    const rootCanvasFallback =
        engineOptions && typeof engineOptions.rootCanvasFallback === 'string' && engineOptions.rootCanvasFallback.trim()
            ? engineOptions.rootCanvasFallback.trim()
            : '#ffffff';

    const MAX_OCCURRENCES = 50;

    const occurrences = [];
    let eligibleTextCount = 0;
    let cantTellCount = 0;

    const seenFailEls = new Set();

    function pushCantTellOccurrence(el, reasonCode, extraDetails) {
        try {
            if (!el || seenFailEls.has(el)) return;
            if (occurrences.length >= MAX_OCCURRENCES) return;
            seenFailEls.add(el);

            const rc = String(reasonCode || 'UNKNOWN');

            // Match test contract: choose a specific summaryKey per computability blocker.
            // Fall back to the generic notComputable key.
            let summaryKey = 'a11ycore_contrastComputable_cantTell_notComputable';
            if (rc === 'BACKGROUND_IMAGE_OR_GRADIENT') summaryKey = 'a11ycore_contrastComputable_cantTell_bgImageOrGradient';
            else if (rc === 'MIX_BLEND_MODE') summaryKey = 'a11ycore_contrastComputable_cantTell_mixBlendMode';
            else if (rc === 'BACKGROUND_FILTER_OR_BACKDROP_FILTER') {
                const bp = extraDetails && typeof extraDetails === 'object' ? String(extraDetails.blockerProperty || '') : '';
                if (bp === 'filter') summaryKey = 'a11ycore_contrastComputable_cantTell_filter';
                else if (bp === 'backdrop-filter') summaryKey = 'a11ycore_contrastComputable_cantTell_backdropFilter';
                else summaryKey = 'a11ycore_contrastComputable_cantTell_filterOrBackdropFilter';
            }
            else if (rc === 'BACKGROUND_NOT_OPAQUE_AT_ROOT') summaryKey = 'a11ycore_contrastComputable_cantTell_rootNotOpaque';

            const details =
                Object.assign(
                    { reasonCode: rc },
                    extraDetails && typeof extraDetails === 'object' ? extraDetails : {}
                );

            const occBase = {
                selector: '',
                html: '',
                summary: '',
                hint: '',
                i18n: {
                    summaryKey,
                    hintKey: '',
                    params: { reasonCode: rc }
                },
                data: { details }
            };

            if (helpers && typeof helpers.reportOccurrence === 'function') {
                occurrences.push(helpers.reportOccurrence(el, occBase));
            } else {
                // Never compute selector/snippet in the rule.
                occurrences.push({ ...occBase });
            }
        } catch {
            // no-throw
        }
    }

    // perf: cache per-element analysis so multiple text nodes in same element don't repeat expensive work
    const __elBlockerCache = __contrastSharedCache
        ? (__contrastSharedCache.__elBlockerCache || (__contrastSharedCache.__elBlockerCache = new WeakMap()))
        : new WeakMap(); // Element -> { ok:boolean, reasonCode, blockerSelector, blockerProperty, blockerValue }
    const __elBgCache = __contrastSharedCache
        ? (__contrastSharedCache.__elBgCache || (__contrastSharedCache.__elBgCache = new WeakMap()))
        : new WeakMap();      // Element -> { ok, rgba, alpha, reasonCode } (no stack)
    const __elFgCache = __contrastSharedCache
        ? (__contrastSharedCache.__elFgCache || (__contrastSharedCache.__elFgCache = new WeakMap()))
        : new WeakMap();      // Element -> { rgba, alpha, opacityProduct }

    // perf: fast-path memo for self-opaque background (common) to avoid ancestor walk
    const __elBgSelfOpaqueCache = __contrastSharedCache
        ? (__contrastSharedCache.__elBgSelfOpaqueCache || (__contrastSharedCache.__elBgSelfOpaqueCache = new WeakMap()))
        : new WeakMap(); // Element -> { ok, rgba, alpha, reasonCode }

    // Shared deterministic text scan (computed once per run and reused across contrast rules)
    let scan = null;
    try {
        scan = helpers && helpers.contrast && typeof helpers.contrast.getTextScan === 'function'
            ? helpers.contrast.getTextScan(ctx, helpers, engineOptions)
            : null;
    } catch {
        scan = null;
    }

    // Walk eligible visible text nodes (counted per text node), but compute blockers/bg/fg once per element.
    if (scan && scan.elements && Array.isArray(scan.elements)) {
        try {
            eligibleTextCount = Number(scan.eligibleTextCount) || 0;

            for (const rec of scan.elements) {
                // If we're already capped on occurrences and already know the final outcome is cantTell,
                // stop scanning to avoid wasting time. Deterministic: we don't randomize; we just stop
                // once further work cannot change the output (cantTell + capped occurrences).
                if (cantTellCount > 0 && occurrences.length >= MAX_OCCURRENCES) break;

                const el = rec && rec.el;
                const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
                if (!el || textCount <= 0) continue;

                // 1) Blockers in ancestor chain (blend/filter/bg-image/gradient)
                let blocker = __elBlockerCache.get(el);
                if (!blocker) {
                    blocker = helpers.contrast.getComputabilityBlocker(el);
                    // Normalize to stable shape
                    blocker = blocker || { ok: true, reasonCode: null, blockerSelector: '', blockerProperty: '', blockerValue: '' };
                    __elBlockerCache.set(el, blocker);
                }
                if (blocker && blocker.ok === false) {
                    cantTellCount += textCount;
                    // occurrence is deduped per element (seenFailEls)
                    pushCantTellOccurrence(el, blocker.reasonCode, {
                        blockerProperty: blocker.blockerProperty,
                        blockerValue: blocker.blockerValue,
                        blockerSelector: blocker.blockerSelector
                    });
                    continue;
                }

                // 2) Background resolution (CSS-only), strict vs referenceEngineCompat
                let bg = __elBgCache.get(el);
                if (!bg) {
                    // 2a) Fast-path: if the element itself paints an opaque background-color and opacity is 1,
                    // then the background behind its text is computable without walking ancestors.
                    // This is a strict subset of the full algorithm, so it is behavior-preserving:
                    // if it doesn't match, we fall back to computeEffectiveBackground.
                    let bgSelfOpaque = __elBgSelfOpaqueCache.get(el);
                    if (bgSelfOpaque === undefined) {
                        bgSelfOpaque = null;
                        try {
                            if (helpers && typeof helpers.getComputedStyle === 'function' && helpers.contrast && typeof helpers.contrast.parseCssColorToRgba === 'function') {
                                const cs = helpers.getComputedStyle(el);
                                const op = Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1');
                                // Only treat as self-opaque if opacity is exactly 1 (string '1' or number 1)
                                // to avoid float/serialization quirks and preserve determinism.
                                if (Number.isFinite(op) && op === 1) {
                                    const c = helpers.contrast.parseCssColorToRgba(cs && cs.backgroundColor);
                                    if (c && typeof c.a === 'number' && c.a === 1) {
                                        bgSelfOpaque = {
                                            ok: true,
                                            rgba: { r: c.r, g: c.g, b: c.b, a: 1 },
                                            alpha: 1,
                                            reasonCode: null
                                        };
                                    }
                                }
                            }
                        } catch {
                            bgSelfOpaque = null;
                        }
                        __elBgSelfOpaqueCache.set(el, bgSelfOpaque);
                    }

                    if (bgSelfOpaque && bgSelfOpaque.ok === true) {
                        bg = bgSelfOpaque;
                    } else {
                        bg = helpers.contrast.computeEffectiveBackground(el, { profile, rootCanvasFallback, collectStack: false });
                        bg = bg || { ok: false, reasonCode: 'BACKGROUND_NOT_COMPUTABLE', rgba: null, alpha: 0 };
                    }

                    __elBgCache.set(el, bg);
                }
                if (!bg || bg.ok === false) {
                    cantTellCount += textCount;
                    pushCantTellOccurrence(el, (bg && bg.reasonCode) || 'BACKGROUND_NOT_COMPUTABLE', {
                        background: bg && bg.rgba ? helpers.contrast.rgbaToString(bg.rgba) : '',
                        backgroundAlpha: bg && typeof bg.alpha === 'number' ? helpers.contrast.round2(bg.alpha) : ''
                    });
                    continue;
                }

                // 3) Foreground parsability (computed color should be rgb/rgba)
                let fg = __elFgCache.get(el);
                if (!fg) {
                    fg = helpers.contrast.computeEffectiveForeground(el);
                    fg = fg || { rgba: null, alpha: 0, opacityProduct: 1 };
                    __elFgCache.set(el, fg);
                }
                if (!fg || !fg.rgba) {
                    cantTellCount += textCount;
                    pushCantTellOccurrence(el, 'FOREGROUND_UNPARSABLE', {
                        background: bg && bg.rgba ? helpers.contrast.rgbaToString(bg.rgba) : '',
                        backgroundAlpha: bg && typeof bg.alpha === 'number' ? helpers.contrast.round2(bg.alpha) : ''
                    });
                    continue;
                }

                // If we got here, this element's eligible text is computable.
                // (We intentionally do not compute contrast ratio in this gatekeeper rule.)
            }
        } catch {
            // If scan processing fails unexpectedly, keep determinism: treat as cantTell with one occurrence
            return {
                ruleId: rule.ruleId,
                outcome: 'cantTell',
                severity: rule.defaultSeverity || 'minor',
                confidence: rule.defaultConfidence || 'high',
                occurrences: [
                    {
                        selector: '',
                        summary: '',
                        hint: '',
                        html: '',
                        i18n: {
                            summaryKey: 'a11ycore_contrastComputable_cantTell_engineFailure',
                            hintKey: '',
                            params: { reasonCode: 'ENGINE_EXCEPTION' }
                        },
                        data: { details: { reasonCode: 'ENGINE_EXCEPTION' } }
                    }
                ]
            };
        }
    }

    if (eligibleTextCount === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: rule.defaultSeverity || 'minor',
            confidence: rule.defaultConfidence || 'high',
            occurrences: []
        };
    }

    if (cantTellCount > 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'cantTell',
            severity: rule.defaultSeverity || 'minor',
            confidence: rule.defaultConfidence || 'high',
            occurrences
        };
    }

    // All eligible text is computable
    return {
        ruleId: rule.ruleId,
        outcome: 'pass',
        severity: rule.defaultSeverity || 'minor',
        confidence: rule.defaultConfidence || 'high',
        occurrences: [
            {
                selector: '',
                summary: '',
                hint: '',
                html: '',
                i18n: {
                    summaryKey: 'a11ycore_contrastComputable_pass_allComputable',
                    hintKey: '',
                    params: {
                        eligibleTextCount: String(eligibleTextCount)
                    }
                },
                data: { details: { eligibleTextCount } }
            }
        ]
    };
}), applicability: null },
    "a11ycore-contrast-enhanced": { run: (function runInPage(ctx) {
    const { helpers, rule, engineOptions } = ctx;

    function toElement(node) {
        try {
            if (!node) return null;
            if (node.nodeType === 1) return node; // ELEMENT_NODE
            if (node.nodeType === 3) return node.parentElement || null; // TEXT_NODE
            return null;
        } catch {
            return null;
        }
    }

    const __contrastSharedCache = helpers && helpers.contrast && helpers.contrast.sharedCache ? helpers.contrast.sharedCache : null;
    const __elBlockerCache = __contrastSharedCache
        ? (__contrastSharedCache.__elBlockerCache || (__contrastSharedCache.__elBlockerCache = new WeakMap()))
        : null;

    const __elBgCache = __contrastSharedCache
        ? (__contrastSharedCache.__elBgCache || (__contrastSharedCache.__elBgCache = new WeakMap()))
        : null;

    const __elFgCache = __contrastSharedCache
        ? (__contrastSharedCache.__elFgCache || (__contrastSharedCache.__elFgCache = new WeakMap()))
        : null;

    const __elFontCache = __contrastSharedCache
        ? (__contrastSharedCache.__elFontCache || (__contrastSharedCache.__elFontCache = new WeakMap()))
        : new WeakMap();

    function safeComputedStyle(el) {
        try {
            if (!el || el.nodeType !== 1) return null;

            // Prefer engine helper (matches tests/engine behavior + may be cached)
            if (helpers && typeof helpers.computedStyle === 'function') {
                const cs = helpers.computedStyle(el);
                if (cs) return cs;
            }

            const view = (el.ownerDocument && el.ownerDocument.defaultView)
                ? el.ownerDocument.defaultView
                : null;

            if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
        } catch {}
        return null;
    }

    function getFontInfo(el) {
        try {
            if (!el || el.nodeType !== 1) {
                return {
                    fontSizePx: 0,
                    fontSizePt: '',
                    fontWeightNum: 400,
                    fontWeight: 'normal',
                    isBold: false,
                    isLarge: false,
                    isLargeText: false
                };
            }

            const cached = __elFontCache.get(el);
            if (cached) return cached;

            const cs = safeComputedStyle(el);
            const fontSizePx = cs ? helpers.contrast.parsePx(cs.fontSize) : null;
            const fontWeightNum = cs ? helpers.contrast.normalizeFontWeight(cs.fontWeight) : 400;

            const sizePx = Number.isFinite(fontSizePx) ? fontSizePx : 0;
            const isBold = Number.isFinite(fontWeightNum) && fontWeightNum >= 700;
            const isLarge = helpers.contrast.isLargeText(sizePx, fontWeightNum);

            const out = {
                fontSizePx: sizePx,
                fontSizePt: helpers.contrast.pxToPt(sizePx),
                fontWeightNum,
                fontWeight: helpers.contrast.fontWeightLabel(fontWeightNum),
                isBold,
                isLarge,
                isLargeText: isLarge
            };

            __elFontCache.set(el, out);
            return out;
        } catch {
            return {
                fontSizePx: 0,
                fontSizePt: '',
                fontWeightNum: 400,
                fontWeight: 'normal',
                isBold: false,
                isLarge: false,
                isLargeText: false
            };
        }
    }

    const profile =
        engineOptions && typeof engineOptions.profile === 'string' && engineOptions.profile.trim()
            ? engineOptions.profile.trim()
            : 'strictConformance';

    const rootCanvasFallback =
        engineOptions && typeof engineOptions.rootCanvasFallback === 'string' && engineOptions.rootCanvasFallback.trim()
            ? engineOptions.rootCanvasFallback.trim()
            : '#ffffff';

    const MAX_OCCURRENCES = 50;

    const occurrences = [];
    let eligibleTextCount = 0;
    let computableTextCount = 0;
    let failCount = 0;

    const seenFailEls = new Set();

    function pushPassOccurrence(eligibleCount, computableCount) {
        try {
            occurrences.push({
                selector: '',
                summary: 'All computable text meets the enhanced (AAA) contrast threshold.',
                hint: '',
                html: '',
                i18n: {
                    summaryKey: 'a11ycore_contrastEnhanced_pass_allAboveThreshold',
                    hintKey: '',
                    params: {
                        eligibleTextCount: String(Number(eligibleCount) || 0),
                        computableTextCount: String(Number(computableCount) || 0)
                    }
                },
                data: {
                    details: {
                        reasonCode: 'ALL_ABOVE_THRESHOLD',
                        eligibleTextCount: Number(eligibleCount) || 0,
                        computableTextCount: Number(computableCount) || 0,
                        metrics: {
                            eligibleTextCount: Number(eligibleCount) || 0,
                            computableTextCount: Number(computableCount) || 0
                        }
                    }
                }
            });
        } catch {
            // no-throw
        }
    }

    function pushFailOccurrence(el, params, details) {
        try {
            if (!el || seenFailEls.has(el)) return;
            if (occurrences.length >= MAX_OCCURRENCES) return;

            seenFailEls.add(el);

            const det = details && typeof details === 'object' ? details : { reasonCode: 'UNKNOWN' };

            const occBase = {
                selector: '',
                html: '',
                summary: '',
                hint: '',
                i18n: {
                    summaryKey: 'a11ycore_contrastEnhanced_fail_belowThreshold',
                    hintKey: '',
                    params: params && typeof params === 'object' ? params : {}
                },
                data: { details: det }
            };

            if (helpers && typeof helpers.reportOccurrence === 'function') {
                occurrences.push(helpers.reportOccurrence(el, occBase));
            } else {
                // Never compute selector/snippet in the rule.
                occurrences.push({ ...occBase });
            }
        } catch {
            // no-throw
        }
    }

    // perf: per-element analysis cache
    const __elAnalysisCache = __contrastSharedCache
        ? (__contrastSharedCache.__elAnalysisCacheAAA || (__contrastSharedCache.__elAnalysisCacheAAA = new WeakMap()))
             : new WeakMap();


// Shared deterministic text scan (computed once per run and reused across contrast rules)
let scan = null;
try {
    scan = helpers && helpers.contrast && typeof helpers.contrast.getTextScan === 'function'
        ? helpers.contrast.getTextScan(ctx, helpers, engineOptions)
        : null;
} catch {
    scan = null;
}

// Walk eligible visible text nodes (counted per text node), but compute expensive analysis once per element.
if (scan && scan.elements && Array.isArray(scan.elements)) {
    try {
        eligibleTextCount = Number(scan.eligibleTextCount) || 0;

        for (const rec of scan.elements) {
            const el = toElement(rec && rec.el);
            const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
            if (!el || textCount <= 0) continue;

            // Computability + contrast analysis (cached per element)
            let analysis = __elAnalysisCache.get(el);
            if (!analysis) {
                // Computability gate (do NOT emit cantTell here; Rule 1 is responsible for that)
                let blocker = __elBlockerCache ? __elBlockerCache.get(el) : null;
                if (!blocker) {
                    blocker = helpers.contrast.getComputabilityBlocker(el);
                    blocker = blocker || { ok: true, reasonCode: null, blockerSelector: '', blockerProperty: '', blockerValue: '' };
                    if (__elBlockerCache) __elBlockerCache.set(el, blocker);
                }

                if (blocker && blocker.ok === false) {
                    analysis = { computable: false };
                } else {
                    let bg = __elBgCache ? __elBgCache.get(el) : null;
                    if (!bg) {
                        bg = helpers.contrast.computeEffectiveBackground(el, { profile, rootCanvasFallback, collectStack: false });
                        bg = bg || { ok: false, reasonCode: 'BACKGROUND_NOT_COMPUTABLE', rgba: null, alpha: 0 };
                        if (__elBgCache) __elBgCache.set(el, bg);
                    }

                    let fg = __elFgCache ? __elFgCache.get(el) : null;
                    if (!fg) {
                        fg = helpers.contrast.computeEffectiveForeground(el);
                        fg = fg || { rgba: null, alpha: 0, opacityProduct: 1 };
                        if (__elFgCache) __elFgCache.set(el, fg);
                    }

                    if (!bg || bg.ok === false || !bg.rgba || !fg || !fg.rgba) {
                        analysis = { computable: false };
                    } else {
                        // Compose FG over BG if FG has alpha (effective fg may be < 1 due to opacity chain)
                        const fgOpaque = (fg.rgba.a != null && fg.rgba.a < 1)
                            ? helpers.contrast.compositeRgba(fg.rgba, bg.rgba)
                            : { r: fg.rgba.r, g: fg.rgba.g, b: fg.rgba.b, a: 1 };

                        const bgOpaque = { r: bg.rgba.r, g: bg.rgba.g, b: bg.rgba.b, a: 1 };

                        const ratio = helpers.contrast.contrastRatio(fgOpaque, bgOpaque);

                        const font = getFontInfo(el);
                        const threshold = helpers.contrast.requiredRatio('AAA', font.isLargeText);

                        analysis = {
                            computable: true,
                            ratio,
                            ratioStr: helpers.contrast.round2(ratio),
                            threshold,
                            thresholdStr: `${threshold}`,
                            font,
                            fgOpaque,
                            bgOpaque
                        };
                    }
                }
                __elAnalysisCache.set(el, analysis);
            }

            if (!analysis || analysis.computable !== true) continue;

            computableTextCount += textCount;

            const ratio = analysis.ratio;
            const font = analysis.font;
            const threshold = analysis.threshold;
            const ratioStr = analysis.ratioStr;
            const thresholdStr = analysis.thresholdStr;
            const fgOpaque = analysis.fgOpaque;
            const bgOpaque = analysis.bgOpaque;

            if (!(ratio >= threshold)) {
                failCount += textCount;

                const fgHex = (helpers.contrast.rgbToHex)
                    ? helpers.contrast.rgbToHex(fgOpaque)
                    : '';

                const bgHex = (helpers.contrast.rgbToHex)
                    ? helpers.contrast.rgbToHex(bgOpaque)
                    : '';

                const fontPxNum = font.fontSizePx ? parseFloat(font.fontSizePx) : NaN;

                const fontPtStr = (helpers.contrast.pxToPt && Number.isFinite(fontPxNum))
                    ? helpers.contrast.pxToPt(fontPxNum)
                    : '';

                const fwNum = Number(font.fontWeightNum);
                const fwLabel = (helpers.contrast.fontWeightLabel)
                    ? helpers.contrast.fontWeightLabel(fwNum)
                    : (font.isBold ? 'bold' : 'normal');

                const fgRgbaStr = helpers.contrast.rgbaToString(fgOpaque);
                const bgRgbaStr = helpers.contrast.rgbaToString(bgOpaque);

                const params = {
                    reasonCode: 'BELOW_THRESHOLD',

                    foreground: fgRgbaStr,
                    background: bgRgbaStr,

                    foregroundHex: fgHex,
                    backgroundHex: bgHex,
                    fontSizePt: fontPtStr,
                    fontWeightLabel: fwLabel,

                    ratio: ratioStr,
                    threshold: thresholdStr,

                    fontSizePx: font.fontSizePx,
                    fontWeight: font.fontWeight,
                    isBold: font.isBold,
                    isLargeText: font.isLargeText
                };

                const details = {
                    reasonCode: 'BELOW_THRESHOLD',
                    metrics: { ratio, threshold },
                    typography: {
                        fontSizePx: Number.isFinite(fontPxNum) ? fontPxNum : null,
                        fontSizePt: Number.isFinite(fontPxNum) ? (fontPxNum * 0.75) : null,
                        fontWeight: Number.isFinite(fwNum) ? fwNum : null,
                        fontWeightLabel: fwLabel,
                        isBold: !!font.isBold,
                        isLargeText: !!font.isLargeText
                    },
                    colors: {
                        foregroundHex: fgHex,
                        backgroundHex: bgHex,
                        foregroundRgba: fgRgbaStr,
                        backgroundRgba: bgRgbaStr
                    }
                };

                pushFailOccurrence(el, params, details);

                if (occurrences.length >= MAX_OCCURRENCES) break;
            }
        }
    } catch {
        // No-throw: deterministic cantTell on internal failure
        return {
            ruleId: rule.ruleId,
            outcome: 'cantTell',
            severity: rule.defaultSeverity || 'serious',
            confidence: rule.defaultConfidence || 'high',
            occurrences: [
                {
                    selector: '',
                    summary: '',
                    hint: '',
                    html: '',
                    i18n: {
                        summaryKey: 'a11ycore_contrastEnhanced_cantTell_engineFailure',
                        hintKey: '',
                        params: { reasonCode: 'ENGINE_EXCEPTION' }
                    },
                    data: { details: { reasonCode: 'ENGINE_EXCEPTION' } }
                }
            ]
        };
    }
}
    if (eligibleTextCount === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: rule.defaultSeverity || 'serious',
            confidence: rule.defaultConfidence || 'high',
            occurrences: []
        };
    }

    // If eligible text exists but none is computable, stay notApplicable; Rule 1 reports cantTell.
    if (computableTextCount === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: rule.defaultSeverity || 'serious',
            confidence: rule.defaultConfidence || 'high',
            occurrences: [
                {
                    selector: '',
                    summary: '',
                    hint: '',
                    html: '',
                    i18n: {
                        summaryKey: 'a11ycore_contrastEnhanced_notApplicable_noComputableText',
                        hintKey: '',
                        params: { eligibleTextCount: String(eligibleTextCount) }
                    },
                    data: { details: { eligibleTextCount, computableTextCount } }
                }
            ]
        };
    }

    if (failCount > 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity || 'serious',
            confidence: rule.defaultConfidence || 'high',
            occurrences
        };
    }

    // All computable text passed
    if (!occurrences.length) {
        pushPassOccurrence(eligibleTextCount, computableTextCount);
    }

    return {
        ruleId: rule.ruleId,
        outcome: 'pass',
        severity: rule.defaultSeverity || 'serious',
        confidence: rule.defaultConfidence || 'high',
        occurrences
    };
}), applicability: null },
    "a11ycore-contrast-minimum": { run: (function runInPage(ctx) {
    const {helpers, rule, engineOptions} = ctx;

    function toElement(node) {
        try {
            if (!node) return null;
            if (node.nodeType === 1) return node; // ELEMENT_NODE
            if (node.nodeType === 3) return node.parentElement || null; // TEXT_NODE
            return null;
        } catch {
            return null;
        }
    }

    const __contrastSharedCache = helpers && helpers.contrast && helpers.contrast.sharedCache ? helpers.contrast.sharedCache : null;
    const __elBlockerCache = __contrastSharedCache
        ? (__contrastSharedCache.__elBlockerCache || (__contrastSharedCache.__elBlockerCache = new WeakMap()))
        : null;

    const __elBgCache = __contrastSharedCache
        ? (__contrastSharedCache.__elBgCache || (__contrastSharedCache.__elBgCache = new WeakMap()))
        : null;

    const __elFgCache = __contrastSharedCache
        ? (__contrastSharedCache.__elFgCache || (__contrastSharedCache.__elFgCache = new WeakMap()))
        : null;

    const __elFontCache = __contrastSharedCache
        ? (__contrastSharedCache.__elFontCache || (__contrastSharedCache.__elFontCache = new WeakMap()))
        : new WeakMap();

    function safeComputedStyle(el) {
        try {
            if (!el || el.nodeType !== 1) return null;

            if (helpers && typeof helpers.computedStyle === 'function') {
                const cs = helpers.computedStyle(el);
                if (cs) return cs;
            }
            const view = (el.ownerDocument && el.ownerDocument.defaultView)
                ? el.ownerDocument.defaultView
                : null;
            if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
        } catch {}
        return null;
    }

    function getFontInfo(el) {
        try {
            if (!el || el.nodeType !== 1) {
                return {
                    fontSizePx: 0,
                    fontSizePt: '',
                    fontWeightNum: 400,
                    fontWeight: 'normal',
                    isBold: false,
                    isLarge: false,
                    isLargeText: false
                };
            }

            const cached = __elFontCache.get(el);
            if (cached) return cached;

            const cs = safeComputedStyle(el);
            const fontSizePx = cs ? helpers.contrast.parsePx(cs.fontSize) : null;
            const fontWeightNum = cs ? helpers.contrast.normalizeFontWeight(cs.fontWeight) : 400;

            const sizePx = Number.isFinite(fontSizePx) ? fontSizePx : 0;
            const isBold = Number.isFinite(fontWeightNum) && fontWeightNum >= 700;
            const isLarge = helpers.contrast.isLargeText(sizePx, fontWeightNum);

            const out = {
                fontSizePx: sizePx,
                fontSizePt: helpers.contrast.pxToPt(sizePx),
                fontWeightNum,
                fontWeight: helpers.contrast.fontWeightLabel(fontWeightNum),
                isBold,
                isLarge,
                isLargeText: isLarge
            };

            __elFontCache.set(el, out);
            return out;
        } catch {
            return {
                fontSizePx: 0,
                fontSizePt: '',
                fontWeightNum: 400,
                fontWeight: 'normal',
                isBold: false,
                isLarge: false,
                isLargeText: false
            };
        }
    }

    const profile =
        engineOptions && typeof engineOptions.profile === 'string' && engineOptions.profile.trim()
            ? engineOptions.profile.trim()
            : 'strictConformance';

    const rootCanvasFallback =
        engineOptions && typeof engineOptions.rootCanvasFallback === 'string' && engineOptions.rootCanvasFallback.trim()
            ? engineOptions.rootCanvasFallback.trim()
            : '#ffffff';

    const MAX_OCCURRENCES = 50;

    const occurrences = [];
    let eligibleTextCount = 0;
    let computableTextCount = 0;
    let failCount = 0;

    const seenFailEls = new Set();

    function pushPassOccurrence(eligibleCount, computableCount) {
        try {
            occurrences.push({
                selector: '',
                summary: 'All computable text meets the minimum (AA) contrast threshold.',
                hint: '',
                html: '',
                i18n: {
                    summaryKey: 'a11ycore_contrastMinimum_pass_allAboveThreshold',
                    hintKey: '',
                    params: {
                        eligibleTextCount: String(Number(eligibleCount) || 0),
                        computableTextCount: String(Number(computableCount) || 0)
                    }
                },
                data: {
                    details: {
                        reasonCode: 'ALL_ABOVE_THRESHOLD',
                        eligibleTextCount: Number(eligibleCount) || 0,
                        computableTextCount: Number(computableCount) || 0,
                        metrics: {
                            eligibleTextCount: Number(eligibleCount) || 0,
                            computableTextCount: Number(computableCount) || 0
                        }
                    }
                }
            });
        } catch {
            // no-throw
        }
    }

    function pushFailOccurrence(el, params, details) {
        try {
            if (!el || seenFailEls.has(el)) return;
            if (occurrences.length >= MAX_OCCURRENCES) return;

            seenFailEls.add(el);

            const det = details && typeof details === 'object' ? details : { reasonCode: 'UNKNOWN' };

            const occBase = {
                selector: '',
                html: '',
                summary: '',
                hint: '',
                i18n: {
                    summaryKey: 'a11ycore_contrastMinimum_fail_belowThreshold',
                    hintKey: '',
                    params: params && typeof params === 'object' ? params : {}
                },
                data: { details: det }
            };

            if (helpers && typeof helpers.reportOccurrence === 'function') {
                occurrences.push(helpers.reportOccurrence(el, occBase));
            } else {
                // Never compute selector/snippet in the rule.
                occurrences.push({ ...occBase });
            }
        } catch {
            // no-throw
        }
    }

    // perf: per-element analysis cache
    const __elAnalysisCache = __contrastSharedCache
        ? (__contrastSharedCache.__elAnalysisCacheAA || (__contrastSharedCache.__elAnalysisCacheAA = new WeakMap()))
        : new WeakMap();


    // Shared deterministic text scan (computed once per run and reused across contrast rules)
    let scan = null;
    try {
        scan = helpers && helpers.contrast && typeof helpers.contrast.getTextScan === 'function'
            ? helpers.contrast.getTextScan(ctx, helpers, engineOptions)
            : null;
    } catch {
        scan = null;
    }

    // Walk eligible visible text nodes (counted per text node), but compute expensive analysis once per element.
    if (scan && scan.elements && Array.isArray(scan.elements)) {
        try {
            eligibleTextCount = Number(scan.eligibleTextCount) || 0;

            for (const rec of scan.elements) {
                const el = toElement(rec && rec.el);
                const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
                if (!el || textCount <= 0) continue;

                // Computability + contrast analysis (cached per element)
                let analysis = __elAnalysisCache.get(el);
                if (!analysis) {
                    // Computability gate (do NOT emit cantTell here; Rule 1 is responsible for that)
                    let blocker = __elBlockerCache ? __elBlockerCache.get(el) : null;
                    if (!blocker) {
                        blocker = helpers.contrast.getComputabilityBlocker(el);
                        blocker = blocker || { ok: true, reasonCode: null, blockerSelector: '', blockerProperty: '', blockerValue: '' };
                        if (__elBlockerCache) __elBlockerCache.set(el, blocker);
                    }

                    if (blocker && blocker.ok === false) {
                        analysis = { computable: false };
                    } else {
                        let bg = __elBgCache ? __elBgCache.get(el) : null;
                        if (!bg) {
                            bg = helpers.contrast.computeEffectiveBackground(el, { profile, rootCanvasFallback, collectStack: false });
                            bg = bg || { ok: false, reasonCode: 'BACKGROUND_NOT_COMPUTABLE', rgba: null, alpha: 0 };
                            if (__elBgCache) __elBgCache.set(el, bg);
                        }

                        let fg = __elFgCache ? __elFgCache.get(el) : null;
                        if (!fg) {
                            fg = helpers.contrast.computeEffectiveForeground(el);
                            fg = fg || { rgba: null, alpha: 0, opacityProduct: 1 };
                            if (__elFgCache) __elFgCache.set(el, fg);
                        }

                        if (!bg || bg.ok === false || !bg.rgba || !fg || !fg.rgba) {
                            analysis = { computable: false };
                        } else {
                            // Compose FG over BG if FG has alpha (effective fg may be < 1 due to opacity chain)
                            const fgOpaque = (fg.rgba.a != null && fg.rgba.a < 1)
                                ? helpers.contrast.compositeRgba(fg.rgba, bg.rgba)
                                : { r: fg.rgba.r, g: fg.rgba.g, b: fg.rgba.b, a: 1 };

                            const bgOpaque = { r: bg.rgba.r, g: bg.rgba.g, b: bg.rgba.b, a: 1 };

                            const ratio = helpers.contrast.contrastRatio(fgOpaque, bgOpaque);

                            const font = getFontInfo(el);
                            const threshold = helpers.contrast.requiredRatio('AA', font.isLargeText);

                            analysis = {
                                computable: true,
                                ratio,
                                ratioStr: helpers.contrast.round2(ratio),
                                threshold,
                                thresholdStr: `${threshold}`,
                                font,
                                fgOpaque,
                                bgOpaque
                            };
                        }
                    }
                    __elAnalysisCache.set(el, analysis);
                }

                if (!analysis || analysis.computable !== true) continue;

                computableTextCount += textCount;

                const ratio = analysis.ratio;
                const font = analysis.font;
                const threshold = analysis.threshold;
                const ratioStr = analysis.ratioStr;
                const thresholdStr = analysis.thresholdStr;
                const fgOpaque = analysis.fgOpaque;
                const bgOpaque = analysis.bgOpaque;

                if (!(ratio >= threshold)) {
                    failCount += textCount;

                    const fgHex = (helpers.contrast.rgbToHex)
                        ? helpers.contrast.rgbToHex(fgOpaque)
                        : '';

                    const bgHex = (helpers.contrast.rgbToHex)
                        ? helpers.contrast.rgbToHex(bgOpaque)
                        : '';

                    const fontPxNum = font.fontSizePx ? parseFloat(font.fontSizePx) : NaN;

                    const fontPtStr = (helpers.contrast.pxToPt && Number.isFinite(fontPxNum))
                        ? helpers.contrast.pxToPt(fontPxNum)
                        : '';

                    const fwNum = Number(font.fontWeightNum);
                    const fwLabel = font.fontWeight || (font.isBold ? 'bold' : 'normal');

                    const fgRgbaStr = helpers.contrast.rgbaToString(fgOpaque);
                    const bgRgbaStr = helpers.contrast.rgbaToString(bgOpaque);

                    const params = {
                        reasonCode: 'BELOW_THRESHOLD',

                        foreground: fgRgbaStr,
                        background: bgRgbaStr,

                        foregroundHex: fgHex,
                        backgroundHex: bgHex,
                        fontSizePt: fontPtStr,
                        fontWeightLabel: fwLabel,

                        ratio: ratioStr,
                        threshold: thresholdStr,

                        fontSizePx: font.fontSizePx,
                        fontWeight: font.fontWeight,
                        isBold: font.isBold,
                        isLargeText: font.isLargeText
                    };

                    const details = {
                        reasonCode: 'BELOW_THRESHOLD',
                        metrics: {ratio, threshold},
                        typography: {
                            fontSizePx: Number.isFinite(fontPxNum) ? fontPxNum : null,
                            fontSizePt: Number.isFinite(fontPxNum) ? (fontPxNum * 0.75) : null,
                            fontWeight: Number.isFinite(fwNum) ? fwNum : null,
                            fontWeightLabel: fwLabel,
                            isBold: !!font.isBold,
                            isLargeText: !!font.isLargeText
                        },
                        colors: {
                            foregroundHex: fgHex,
                            backgroundHex: bgHex,
                            foregroundRgba: fgRgbaStr,
                            backgroundRgba: bgRgbaStr
                        }
                    };

                    pushFailOccurrence(el, params, details);

                    if (occurrences.length >= MAX_OCCURRENCES) break;
                }
            }
        } catch {
            // No-throw: deterministic cantTell on internal failure
            return {
                ruleId: rule.ruleId,
                outcome: 'cantTell',
                severity: rule.defaultSeverity || 'serious',
                confidence: rule.defaultConfidence || 'high',
                occurrences: [
                    {
                        selector: '',
                        summary: '',
                        hint: '',
                        html: '',
                        i18n: {
                            summaryKey: 'a11ycore_contrastMinimum_cantTell_engineFailure',
                            hintKey: '',
                            params: {reasonCode: 'ENGINE_EXCEPTION'}
                        },
                        data: {details: {reasonCode: 'ENGINE_EXCEPTION'}}
                    }
                ]
            };
        }
    }

    if (eligibleTextCount === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: rule.defaultSeverity || 'serious',
            confidence: rule.defaultConfidence || 'high',
            occurrences: []
        };
    }

    // If there was eligible text but nothing computable, this rule stays notApplicable
    // because Rule 1 (computability) is responsible for cantTell.
    if (computableTextCount === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: rule.defaultSeverity || 'serious',
            confidence: rule.defaultConfidence || 'high',
            occurrences: [
                {
                    selector: '',
                    summary: '',
                    hint: '',
                    html: '',
                    i18n: {
                        summaryKey: 'a11ycore_contrastMinimum_notApplicable_noComputableText',
                        hintKey: '',
                        params: {eligibleTextCount: String(eligibleTextCount)}
                    },
                    data: {details: {eligibleTextCount, computableTextCount}}
                }
            ]
        };
    }

    if (failCount > 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity || 'serious',
            confidence: rule.defaultConfidence || 'high',
            occurrences
        };
    }

    // All computable text passed
    if (!occurrences.length) {
        pushPassOccurrence(eligibleTextCount, computableTextCount);
    }

    return {
        ruleId: rule.ruleId,
        outcome: 'pass',
        severity: rule.defaultSeverity || 'serious',
        confidence: rule.defaultConfidence || 'high',
        occurrences
    };
}), applicability: null },
    "a11ycore-embed-text-alternative-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
    ? helpers.queryAll
    : (sel) => {
      try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
      catch { return []; }
    };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function'
    ? helpers.getAriaNameInfo
    : null;

  const embeds = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('embed') : queryAll('embed')) || []); }
    catch { return queryAll('embed'); }
  })();

  if (!embeds.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  function computeNameInfo(el) {
    // For <embed>, treat ARIA name as primary. Do not accept HTML <label> associations.
    const flags = [];
    let aria = null;

    if (getAriaNameInfo) {
      aria = (() => { try { return getAriaNameInfo(el, ctx); } catch { return null; } })();
    }

    if (aria && aria.present && trim(aria.value)) {
      return { present: true, value: trim(aria.value), mechanism: aria.mechanism || 'aria', flags: (aria.flags || []).slice(0) };
    }

    const title = trim(el.getAttribute && el.getAttribute('title'));
    if (title) {
      flags.push('title-used');
      return { present: true, value: title, mechanism: 'title', flags };
    }

    if (aria && aria.flags && aria.flags.length) {
      for (const f of aria.flags) flags.push(f);
    }

    return { present: false, value: '', mechanism: 'none', flags };
  }

  for (const el of embeds) {
    if (!el || !el.getAttribute) continue;

    if (isAccTreeEligible) {
      const elig = (() => { try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; } })();
      if (elig && elig.eligible === false) continue;
    }

    // role presentation/none exclusion only when not focusable
    const role = (() => { try { return String(el.getAttribute('role') || '').trim().toLowerCase(); } catch { return ''; } })();
    if (role === 'presentation' || role === 'none') {
      let focusable = false;
      if (getFocusableInfo) {
        const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = el.getAttribute('tabindex');
        focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const name = computeNameInfo(el);
    if (name.present) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Missing text alternative for <embed>.',
      hint: 'Add an accessible name to <embed> (aria-label/aria-labelledby).',
      i18n: {
        summaryKey: 'a11ycore_embed_textAltPresent_summary_fail',
        hintKey: 'a11ycore_embed_textAltPresent_hint_fail',
        params: { element: 'embed' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        name
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-embed-text-alternative-quality": { run: (function runInPage(ctx) {
    const {document, root, helpers, rule} = ctx;
    const safeRoot = root || document;

    const trim = (v) => (v == null ? '' : String(v)).trim();
    const getTextFromIdRefs =
        helpers && typeof helpers.getTextFromIdRefs === 'function' ? helpers.getTextFromIdRefs : null;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try {
                return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : [];
            } catch {
                return [];
            }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try {
                return String(el.getAttribute('role') || '').trim().toLowerCase();
            } catch {
                return '';
            }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => {
                try {
                    return getFocusableInfo(el, ctx);
                } catch {
                    return null;
                }
            })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try {
            return Array.from((queryAllSmart ? queryAllSmart('embed') : queryAll('embed')) || []);
        } catch {
            return queryAll('embed');
        }
    })();

    if (!els.length) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        if (isAccTreeEligible) {
            const elig = (() => {
                try {
                    return isAccTreeEligible(el, ctx);
                } catch {
                    return {eligible: true, reasons: []};
                }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        let ariaLabel = '';
        let ariaLabelledBy = '';
        let title = '';
        try {
            ariaLabel = trim(el.getAttribute('aria-label'));
            ariaLabelledBy = trim(el.getAttribute('aria-labelledby'));
            title = trim(el.getAttribute('title'));
        } catch {
            ariaLabel = '';
            ariaLabelledBy = '';
            title = '';
        }

        // Only resolve IDREF text if aria-labelledby is present and aria-label is not already sufficient
        let labelledByText = '';
        let hasLabelledByMechanism = false;

        if (!ariaLabel && ariaLabelledBy) {
            hasLabelledByMechanism = true;

            if (getTextFromIdRefs) {
                try {
                    const t = getTextFromIdRefs(ariaLabelledBy, ctx);
                    labelledByText = trim(t && t.text);
                    // If it resolves to empty, still treat as a mechanism present for manual review.
                } catch {
                    labelledByText = '';
                }
            }
        }

        const hasNameMechanism = !!(ariaLabel || title || hasLabelledByMechanism);
        if (!hasNameMechanism) continue;

        const details = {
            ariaLabel: ariaLabel || null,
            ariaLabelledBy: ariaLabelledBy || null,
            ariaLabelledByText: labelledByText || null,
            title: title || null
        };

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, {targetSet: 'acc'}) : null;

        const baseOccurrence = {
            summary: 'Review text alternative for <embed> for accuracy and appropriateness.',
            hint: 'Confirm the ARIA name or title accurately identifies the embedded content in context.',
            i18n: {
                summaryKey: 'a11ycore_embed_textAltQuality_summary_cantTell',
                hintKey: 'a11ycore_embed_textAltQuality_hint_cantTell',
                params: {element: (el.tagName || '').toLowerCase()}
            },
            data: {
                visibilityFilter: eligInfo || {targetSet: 'acc', accEligible: null, reasons: []},
                details
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({selector: '', html: '', ...baseOccurrence});
        }
    }

    if (applicableCount === 0) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    return {ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences};
}), applicability: null },
    "a11ycore-form-control-programmatic-label-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const getAriaLabelInfo = helpers && typeof helpers.getAriaLabelInfo === 'function' ? helpers.getAriaLabelInfo : null;
  const getAriaLabelledByInfo =
    helpers && typeof helpers.getAriaLabelledByInfo === 'function' ? helpers.getAriaLabelledByInfo : null;

  const getAttributeInfo = helpers && typeof helpers.getAttributeInfo === 'function' ? helpers.getAttributeInfo : null;
  const getLabelMethod = helpers && typeof helpers.getLabelMethod === 'function' ? helpers.getLabelMethod : null;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  const metrics = {
    applicableCount: 0,
    passCount: 0,
    failCount: 0,
    byMethod: { label: 0, 'aria-labelledby': 0, 'aria-label': 0, title: 0, placeholder: 0, none: 0 },
    weakPassCount: 0
  };

  function getLabelStrength(method) {
    if (method === 'label' || method === 'aria-labelledby') return 'strong';
    if (method === 'aria-label') return 'medium';
    if (method === 'title' || method === 'placeholder') return 'weak';
    return 'none';
  }

  function getNonEmptyAttrViaHelper(el, name) {
    if (!getAttributeInfo) return '';
    try {
      const info = getAttributeInfo(el, name);
      return info && info.present ? trim(info.value) : '';
    } catch {
      return '';
    }
  }

  // Build a document-wide Set of label[for] values once (O(#labels) instead of O(#controls) selector queries).
  // This matches original semantics, which queried `document.querySelector(label[for="id"])`.
  const labelForSet = new Set();
  try {
    if (document && typeof document.getElementsByTagName === 'function') {
      const labels = document.getElementsByTagName('label');
      for (let i = 0; i < labels.length; i++) {
        const lab = labels[i];
        if (!lab || !lab.getAttribute) continue;
        const f = trim(lab.getAttribute('for'));
        if (f) labelForSet.add(f);
      }
    }
  } catch {
    // no-throw
  }

  function isEligibleAcc(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  function hasLabelAssociation(el) {
    // 1) Native labels API
    try {
      if (el && 'labels' in el && el.labels && el.labels.length) return true;
    } catch {}

    // 2) Wrapped by <label>
    try {
      if (el && el.closest) {
        const wrap = el.closest('label');
        if (wrap) return true;
      }
    } catch {}

    // 3) <label for="id">
    try {
      const idAttr = el && el.getAttribute ? trim(el.getAttribute('id')) : '';
      if (!idAttr) return false;
      return labelForSet.has(idAttr);
    } catch {
      return false;
    }
  }

  function computeLabelMethodFallback(el) {
    // Deterministic priority order
    if (hasLabelAssociation(el)) return { method: 'label', value: '' };

    // Only resolve aria-labelledby if attribute exists
    let raw = '';
    try {
      raw = el && el.getAttribute ? trim(el.getAttribute('aria-labelledby')) : '';
    } catch {
      raw = '';
    }
    if (raw && getAriaLabelledByInfo) {
      try {
        const info = getAriaLabelledByInfo(el, ctx, { maxRefs: 8 });
        const v = info && info.present ? trim(info.value) : '';
        if (v) return { method: 'aria-labelledby', value: v };
      } catch {}
    }

    // Only resolve aria-label if attribute exists
    raw = '';
    try {
      raw = el && el.getAttribute ? trim(el.getAttribute('aria-label')) : '';
    } catch {
      raw = '';
    }
    if (raw && getAriaLabelInfo) {
      try {
        const info = getAriaLabelInfo(el, ctx);
        const v = info && info.present ? trim(info.value) : '';
        if (v) return { method: 'aria-label', value: v };
      } catch {}
    }

    // title / placeholder
    const titleV = getNonEmptyAttrViaHelper(el, 'title') || (() => {
      try { return trim(el.getAttribute('title')); } catch { return ''; }
    })();
    if (titleV) return { method: 'title', value: titleV };

    const phV = getNonEmptyAttrViaHelper(el, 'placeholder') || (() => {
      try { return trim(el.getAttribute('placeholder')); } catch { return ''; }
    })();
    if (phV) return { method: 'placeholder', value: phV };

    return { method: 'none', value: '' };
  }

  function getLabelMethodSafe(el) {
    if (getLabelMethod) {
      try {
        const r = getLabelMethod(el, ctx);
        const m = r && typeof r.method === 'string' ? r.method : 'none';
        const v = r && r.value != null ? trim(r.value) : '';
        if (!Object.prototype.hasOwnProperty.call(metrics.byMethod, m)) return { method: 'none', value: '' };
        return { method: m, value: v };
      } catch {
        // fall through
      }
    }
    return computeLabelMethodFallback(el);
  }

  // Collect nodes scoped to safeRoot (matching original semantics).
  // Prefer getElementsByTagName (fast) when available on the root.
  const nodes = [];
  try {
    const rootHasGetByTag = safeRoot && typeof safeRoot.getElementsByTagName === 'function';

    const pushInputs = (coll) => {
      for (let i = 0; i < coll.length; i++) {
        const el = coll[i];
        if (!el || !el.getAttribute) continue;
        const t = trim(el.getAttribute('type')).toLowerCase();
        // exclude hidden|submit|reset|button|image
        if (t === 'hidden' || t === 'submit' || t === 'reset' || t === 'button' || t === 'image') continue;
        nodes.push(el);
      }
    };

    const pushAll = (coll) => {
      for (let i = 0; i < coll.length; i++) {
        const el = coll[i];
        if (el) nodes.push(el);
      }
    };

    if (rootHasGetByTag) {
      pushInputs(safeRoot.getElementsByTagName('input'));
      pushAll(safeRoot.getElementsByTagName('select'));
      pushAll(safeRoot.getElementsByTagName('textarea'));
    } else if (safeRoot && typeof safeRoot.querySelectorAll === 'function') {
      // fallback: match original selector
      const sel =
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';
      const list = safeRoot.querySelectorAll(sel);
      for (let i = 0; i < list.length; i++) nodes.push(list[i]);
    }
  } catch {
    // no-throw
  }

  if (!nodes.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: { details: { metrics } }
    };
  }

  const occurrences = [];

  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    if (!el || !el.getAttribute) continue;

    if (!isEligibleAcc(el)) continue;

    // role="presentation"/"none" exclusion only when NOT focusable
    let role = '';
    try {
      role = trim(el.getAttribute('role')).toLowerCase();
    } catch {
      role = '';
    }

    if (role === 'presentation' || role === 'none') {
      const fi = getFocusableInfo
        ? (() => {
            try {
              return getFocusableInfo(el, ctx);
            } catch {
              return null;
            }
          })()
        : null;
      const tabbable = !!(fi && fi.tabbable);
      if (!tabbable) continue;
    }

    metrics.applicableCount += 1;

    const label = getLabelMethodSafe(el);
    if (Object.prototype.hasOwnProperty.call(metrics.byMethod, label.method)) {
      metrics.byMethod[label.method] += 1;
    } else {
      metrics.byMethod.none += 1;
    }

    const strength = getLabelStrength(label.method);
    const ok = label.method !== 'none';

    if (ok) {
      metrics.passCount += 1;
      if (strength === 'weak') metrics.weakPassCount += 1;
      continue;
    }

    metrics.failCount += 1;

    const vf = getEligibilityInfo ? (() => { try { return getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })() : null;

    const baseOccurrence = {
      summary: 'Form control is missing a programmatic label.',
      hint: 'Provide a <label> association, aria-label, aria-labelledby, title, or placeholder.',
      i18n: {
        summaryKey: 'a11ycore_formControl_programmaticLabelPresent_summary_fail',
        hintKey: 'a11ycore_formControl_programmaticLabelPresent_hint_fail',
        params: { element: (el.tagName || '').toLowerCase() }
      },
      data: {
        visibilityFilter: vf
          ? { targetSet: vf.targetSet, accEligible: vf.accEligible, reasons: vf.reasons }
          : { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode: 'missing_programmatic_label',
          labelMethod: 'none',
          labelStrength: 'none'
        }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (metrics.applicableCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: { details: { metrics } }
    };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences,
      data: { details: { metrics } }
    };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: 'minor',
    occurrences: [],
    data: { details: { metrics } }
  };
}), applicability: null },
    "a11ycore-form-control-programmatic-label-quality": { run: (function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
    const getAriaLabelInfo = helpers && typeof helpers.getAriaLabelInfo === 'function' ? helpers.getAriaLabelInfo : null;
    const getAriaLabelledByInfo = helpers && typeof helpers.getAriaLabelledByInfo === 'function' ? helpers.getAriaLabelledByInfo : null;

    const getAttributeInfo = helpers && typeof helpers.getAttributeInfo === 'function' ? helpers.getAttributeInfo : null;

    // Optional helper; we validate/normalize if present.
    const getLabelMethod = helpers && typeof helpers.getLabelMethod === 'function' ? helpers.getLabelMethod : null;

    const trim = (v) => (v == null ? '' : String(v)).trim();

    const metrics = {
        applicableCount: 0,
        flaggedCount: 0,
        byMethod: { label: 0, 'aria-labelledby': 0, 'aria-label': 0, title: 0, placeholder: 0, none: 0 }
    };

    function safeQueryAll(sel) {
        try {
            if (queryAllSmart) return Array.from(queryAllSmart(sel) || []);
            return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : [];
        } catch {
            return [];
        }
    }

    function isEligibleAcc(el) {
        if (!isAccTreeEligible) return true;
        try {
            const r = isAccTreeEligible(el, ctx);
            if (typeof r === 'boolean') return r;
            return !!(r && r.eligible);
        } catch {
            return true;
        }
    }

    function isFocusable(el) {
        if (!getFocusableInfo) return false;
        try {
            const fi = getFocusableInfo(el, ctx);
            return !!(fi && fi.focusable);
        } catch {
            return false;
        }
    }

    function getNonEmptyAttr(el, name) {
        if (!getAttributeInfo) return '';
        try {
            const info = getAttributeInfo(el, name);
            return info && info.present ? trim(info.value) : '';
        } catch {
            return '';
        }
    }

    function hasLabelAssociation(el) {
        // 1) Native labels API
        try {
            if (el && 'labels' in el && el.labels && el.labels.length) return true;
        } catch {}

        // 2) Wrapped by <label>
        try {
            if (el && el.closest) {
                const wrap = el.closest('label');
                if (wrap) return true;
            }
        } catch {}

        // 3) <label for="id">
        try {
            const idAttr = el && el.getAttribute ? trim(el.getAttribute('id')) : '';
            if (!idAttr || !document || !document.querySelector) return false;

            const esc = idAttr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const sel = `label[for="${esc}"]`;
            return !!document.querySelector(sel);
        } catch {
            return false;
        }
    }

    function computeLabelMethodFallback(el) {
        // Deterministic priority order:
        // label > aria-labelledby > aria-label > title > placeholder
        if (hasLabelAssociation(el)) return { method: 'label', value: '' };

        if (getAriaLabelledByInfo) {
            try {
                const info = getAriaLabelledByInfo(el, ctx, { maxRefs: 8 });
                const v = info && info.present ? trim(info.value) : '';
                if (v) return { method: 'aria-labelledby', value: v };
            } catch {}
        }

        if (getAriaLabelInfo) {
            try {
                const info = getAriaLabelInfo(el, ctx);
                const v = info && info.present ? trim(info.value) : '';
                if (v) return { method: 'aria-label', value: v };
            } catch {}
        }

        const titleV = getNonEmptyAttr(el, 'title');
        if (titleV) return { method: 'title', value: titleV };

        const phV = getNonEmptyAttr(el, 'placeholder');
        if (phV) return { method: 'placeholder', value: phV };

        return { method: 'none', value: '' };
    }

    function getLabelMethodSafe(el) {
        if (getLabelMethod) {
            try {
                const r = getLabelMethod(el, ctx);
                const m = r && typeof r.method === 'string' ? r.method : 'none';
                const v = r && r.value != null ? trim(r.value) : '';
                if (!Object.prototype.hasOwnProperty.call(metrics.byMethod, m)) return { method: 'none', value: '' };
                return { method: m, value: v };
            } catch {
                // fall through
            }
        }
        return computeLabelMethodFallback(el);
    }

    // Native controls only (same as your current rule)
    const selector =
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';

    const nodes = safeQueryAll(selector);

    if (!nodes.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [], data: { details: { metrics } } };
    }

    const occurrences = [];

    for (const el of nodes) {
        if (!el || !el.getAttribute) continue;

        if (!isEligibleAcc(el)) continue;

        const role = (() => {
            try {
                return trim(el.getAttribute('role')).toLowerCase();
            } catch {
                return '';
            }
        })();

        let fi = null;
        if (getFocusableInfo) {
            try { fi = getFocusableInfo(el, ctx); } catch { fi = null; }
        }
        const tabbable = !!(fi && fi.tabbable);

        if ((role === 'presentation' || role === 'none') && !tabbable) continue;

        metrics.applicableCount += 1;

        const label = getLabelMethodSafe(el);
        const method = label && typeof label.method === 'string' ? label.method : 'none';
        if (Object.prototype.hasOwnProperty.call(metrics.byMethod, method)) metrics.byMethod[method] += 1;
        else metrics.byMethod.none += 1;

        // Flag only when the *primary* (best) method is title/placeholder
        const isWeakPrimary = method === 'title' || method === 'placeholder';
        if (!isWeakPrimary) continue;

        metrics.flaggedCount += 1;

        const vf = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const reasonCode = method === 'title' ? 'label_from_title_primary' : 'label_from_placeholder_primary';
        const methodLabel =
            method === 'title' ? 'title'
                : method === 'placeholder' ? 'placeholder'
                    : 'title or placeholder';

        const baseOccurrence = {
            summary: 'Form control’s primary label is derived from title or placeholder.',
            hint: 'Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.',
            i18n: {
                summaryKey: 'a11ycore_formControl_programmaticLabelQuality_summary_cantTell',
                hintKey: 'a11ycore_formControl_programmaticLabelQuality_hint_cantTell',
                params: { element: (el.tagName || '').toLowerCase(), method, methodLabel }
            },
            data: {
                visibilityFilter: vf || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: {
                    reasonCode,
                    labelMethod: method,
                    labelStrength: 'weak',
                    recommendedMethods: ['label', 'aria-labelledby'],
                    sourceText: (label && label.value ? String(label.value).slice(0, 120) : '')
                }
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (metrics.applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [], data: { details: { metrics } } };
    }

    if (occurrences.length) {
        return {
            ruleId: rule.ruleId,
            outcome: 'cantTell',
            severity: rule.defaultSeverity || 'minor',
            occurrences,
            data: { details: { metrics } }
        };
    }

    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], data: { details: { metrics } } };
}), applicability: null },
    "a11ycore-html-lang-attr-present": { run: (function runInPage(ctx) {
    const { document, rule, helpers } = ctx;
    const html = document && document.documentElement;

    const tag = (html && html.tagName) ? String(html.tagName).toLowerCase() : '';
    if (!html || tag !== 'html') {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: 'minor',
            occurrences: []
        };
    }

    const visibilityFilter = { targetSet: 'acc', accEligible: true, reasons: [] };

    function pushFail(summaryKey, hintKey, params, details) {
        const baseOccurrence = {
            summary: '',
            hint: '',
            i18n: {
                summaryKey,
                hintKey,
                params: params && typeof params === 'object' ? params : {}
            },
            data: {
                visibilityFilter,
                details: details && typeof details === 'object' ? details : {}
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            return [helpers.reportOccurrence(html, baseOccurrence)];
        }

        // Never compute selector/snippet in the rule.
        return [{ selector: '', html: '', ...baseOccurrence }];
    }

    const rawLang = html.getAttribute('lang'); // null if missing
    const lang = (rawLang || '').trim();

    if (rawLang === null) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: pushFail(
                'a11ycore_html_lang_attr_missing_absent',
                'a11ycore_html_lang_attr_hint_missing_absent',
                {},
                { reasonCode: 'lang-missing', location: 'html' }
            )
        };
    }

    if (lang.length === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: pushFail(
                'a11ycore_html_lang_attr_missing_empty',
                'a11ycore_html_lang_attr_hint_missing_empty',
                {},
                { reasonCode: 'lang-empty', location: 'html' }
            )
        };
    }

    // Minimal BCP47 primary subtag check
    if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(lang)) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: pushFail(
                'a11ycore_html_lang_attr_invalid',
                'a11ycore_html_lang_attr_hint_invalid',
                { lang },
                { reasonCode: 'lang-invalid-bcp47', lang }
            )
        };
    }

    return {
        ruleId: rule.ruleId,
        outcome: 'pass',
        severity: 'minor',
        occurrences: []
    };
}), applicability: null },
    "a11ycore-img-alt-decorative": { run: (function runInPage(ctx) {

    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }

    const els = (() => {
        // Only likely candidates:
        // - alt="" (exact)
        // - alt that starts/ends with space (to catch whitespace-only like "   ")
        const sel = 'img[alt=""], img[alt^=" "], img[alt$=" "]';
        try { return Array.from((queryAllSmart ? queryAllSmart(sel) : queryAll(sel)) || []); }
        catch { return queryAll(sel); }
    })();
    const uniqueEls = [];
    const seen = new Set();
    for (const el of els) {
        if (!seen.has(el)) { seen.add(el); uniqueEls.push(el); }
    }

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of uniqueEls) {
        if (!el || !el.getAttribute) continue;

        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        const rawAlt = el.getAttribute('alt');
        if (rawAlt == null) continue;
        if (String(rawAlt).trim() !== '') continue;

        applicableCount += 1;

        const baseOccurrence = {
            summary: 'Review whether <img> is decorative (alt="").',
            hint: 'Confirm the image is purely decorative. If it conveys information or function, provide meaningful alt text.',
            i18n: {
                summaryKey: 'a11ycore_img_altDecorative_summary_cantTell',
                hintKey: 'a11ycore_img_altDecorative_hint_cantTell',
                params: { element: 'img' }
            },
            data: {
                visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}), applicability: null },
    "a11ycore-img-alt-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  // Prefer tagName collection when available (cheap), otherwise fall back.
  function getImgsCollection() {
    try {
      if (queryAllSmart) {
        const r = queryAllSmart('img');
        return Array.isArray(r) ? r : Array.from(r || []);
      }
    } catch {
      // fall through
    }

    try {
      if (safeRoot && typeof safeRoot.getElementsByTagName === 'function') {
        return safeRoot.getElementsByTagName('img'); // HTMLCollection (live)
      }
    } catch {
      // fall through
    }

    try {
      if (safeRoot && typeof safeRoot.querySelectorAll === 'function') return safeRoot.querySelectorAll('img');
    } catch {
      // fall through
    }

    return [];
  }

  const imgs = getImgsCollection();
  const imgLen = imgs && typeof imgs.length === 'number' ? imgs.length : 0;

  if (!imgLen) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  // Helper-safe trim
  const trim = (v) => (v == null ? '' : String(v)).trim();

  // Deterministic tabindex fallback (only used if helper missing)
  function isFocusableFallback(el) {
    try {
      const tabindex = el.getAttribute('tabindex');
      if (tabindex == null) return false;
      const s = String(tabindex).trim();
      if (!s) return false;
      return !Number.isNaN(Number(s));
    } catch {
      return false;
    }
  }

  for (let i = 0; i < imgLen; i++) {
    const el = imgs[i];
    if (!el || !el.getAttribute) continue;

    // Eligibility: only imgs exposed to assistive tech (with focusable/IDREF exceptions handled by helper)
    if (isAccTreeEligible) {
      let elig;
      try {
        elig = isAccTreeEligible(el, ctx);
      } catch {
        elig = null;
      }
      if (elig && elig.eligible === false) continue;
      // If helper returns boolean, treat false as ineligible.
      if (typeof elig === 'boolean' && elig === false) continue;
    }

    // Role (presentation/none) exclusion only when NOT focusable.
    let role = '';
    try {
      role = trim(el.getAttribute('role')).toLowerCase();
    } catch {
      role = '';
    }

    if (role === 'presentation' || role === 'none') {
      let focusable = false;
      if (getFocusableInfo) {
        try {
          const fi = getFocusableInfo(el, ctx);
          // Preserve existing behavior: prefer fi.focusable; fall back to fi.tabbable if present.
          focusable = !!(fi && (fi.focusable || fi.tabbable));
        } catch {
          focusable = false;
        }
      } else {
        focusable = isFocusableFallback(el);
      }

      if (!focusable) continue;
    }

    // From here: applicable
    applicableCount += 1;

    // alt attribute presence check (empty allowed)
    let hasAlt = false;
    try {
      hasAlt = el.getAttribute('alt') !== null;
    } catch {
      hasAlt = false;
    }
    if (hasAlt) continue;

    const eligInfo = getEligibilityInfo ? (() => { try { return getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })() : null;

    const baseOccurrence = {
      summary: 'Missing alt attribute on <img>.',
      hint: 'Add an alt attribute (use alt="" only for decorative images).',
      i18n: {
        summaryKey: 'a11ycore_img_altPresent_summary_fail',
        hintKey: 'a11ycore_img_altPresent_hint_fail',
        params: {}
      },
      data: { visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] } }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ __node: el, selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-img-alt-quality": { run: (function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    // Cap occurrences to keep manual “quality” rules fast on large pages.
    // Deterministic: we keep DOM order, just stop collecting after N.
    const MAX_OCCURRENCES = 50;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }

    const selector = 'img[alt]:not([alt=""])';
    const els = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart(selector) : queryAll(selector)) || []); }
        catch { return queryAll(selector); }
    })();

    if (!els.length) {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: 'minor',
            occurrences: [],
            data: { details: { applicableCount: 0, reportedCount: 0, maxOccurrences: MAX_OCCURRENCES, truncated: false } }
        };
    }

    const occurrences = [];
    let applicableCount = 0;  // total applicable elements
    let collectedCount = 0;   // how many occurrences we actually reported

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability: non-empty alt
        const alt = (() => {
            try { return String(el.getAttribute('alt') || '').trim(); } catch { return ''; }
        })();
        if (!alt) continue;

        applicableCount += 1;

        // IMPORTANT: stop doing expensive occurrence building after we hit the cap
        if (collectedCount >= MAX_OCCURRENCES) continue;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
        const baseOccurrence = {
            summary: 'Review alt text on <img> for accuracy and appropriateness.',
            hint: 'Ensure the alt text conveys the image’s purpose/information in context (not redundant, not filename-like).',
            i18n: {
                summaryKey: 'a11ycore_img_altQuality_summary_cantTell',
                hintKey: 'a11ycore_img_altQuality_hint_cantTell',
                params: { element: 'img' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }

        collectedCount += 1;
    }

    if (applicableCount === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: 'minor',
            occurrences: [],
            data: { details: { applicableCount: 0, reportedCount: 0, maxOccurrences: MAX_OCCURRENCES, truncated: false } }
        };
    }

    const truncated = applicableCount > collectedCount;

    return {
        ruleId: rule.ruleId,
        outcome: 'cantTell',
        severity: 'minor',
        occurrences,
        data: {
            details: {
                applicableCount,
                reportedCount: collectedCount,
                maxOccurrences: MAX_OCCURRENCES,
                truncated
            }
        }
    };
}), applicability: null },
    "a11ycore-input-image-alt-decorative": { run: (function runInPage(ctx) {

    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('input[type="image"]') : queryAll('input[type="image"]')) || []); }
        catch { return queryAll('input[type="image"]'); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        if (!((el.getAttribute('alt') != null && String(el.getAttribute('alt')).trim() === ''))) continue;

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Review <input type="image"> with alt="".',
            hint: 'This control is typically functional. Confirm it has an equivalent accessible name elsewhere, or provide meaningful alt text.',
            i18n: {
                summaryKey: 'a11ycore_inputImage_altDecorative_summary_cantTell',
                hintKey: 'a11ycore_inputImage_altDecorative_hint_cantTell',
                params: { element: 'input[type=image]' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}), applicability: null },
    "a11ycore-input-image-alt-present": { run: (function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const inputs = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('input[type="image"]') : queryAll('input[type="image"]')) || []); }
        catch { return queryAll('input[type="image"]'); }
    })();

    if (!inputs.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of inputs) {
        if (!el || !el.getAttribute) continue;

        // Applicability: eligible in the acc tree (with helper exceptions).
        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        applicableCount += 1;

        const hasAlt = el.getAttribute('alt') !== null;
        if (hasAlt) continue;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Missing alt attribute on <input type="image">.',
            hint: 'Add an alt attribute (use alt="" only when a separate accessible name is provided).',
            i18n: {
                summaryKey: 'a11ycore_inputImage_altPresent_summary_fail',
                hintKey: 'a11ycore_inputImage_altPresent_hint_fail',
                params: { element: 'input[type=image]' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            // Never compute selector/snippet in the rule.
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    if (!occurrences.length) {
        return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-input-image-alt-quality": { run: (function runInPage(ctx) {

    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('input[type="image"]') : queryAll('input[type="image"]')) || []); }
        catch { return queryAll('input[type="image"]'); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        if (!((el.getAttribute('alt') != null && String(el.getAttribute('alt')).trim() !== ''))) continue;

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Review alt text on <input type="image"> for accuracy and appropriateness.',
            hint: 'Ensure the alt text describes the control’s action (e.g., “Search”, “Submit order”) in context.',
            i18n: {
                summaryKey: 'a11ycore_inputImage_altQuality_summary_cantTell',
                hintKey: 'a11ycore_inputImage_altQuality_hint_cantTell',
                params: { element: 'input[type=image]' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: { alt: String(el.getAttribute('alt') || '') } // optional but useful
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}), applicability: null },
    "a11ycore-manual-review": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;

  const getOuterHtmlSnippet = helpers && helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet
      : (el) => (el && el.outerHTML) || '';

  const contextSelector = ctx.contextSelector || null;

  let rootEl = root || null;

  if (!rootEl) {
    if (contextSelector) {
      try {
        rootEl = document.querySelector(contextSelector);
      } catch {
        // invalid selector, fallback to full document
        rootEl = null;
      }
    }
    if (!rootEl) {
      rootEl = document.documentElement || document.body || document.querySelector('html');
    }
  }

  const fallbackRoot =
      rootEl ||
      document.documentElement ||
      document.body ||
      document.querySelector('html');

  const html = getOuterHtmlSnippet(fallbackRoot);

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [
      {
        selector: contextSelector || 'html',
        html,
        summary: 'Manual review required for keyboard navigation and focus order.',
        i18n: { summaryKey: 'a11ycore_manualReview_summary_cantTell', hintKey: 'a11ycore_manualReview_hint_cantTell', params: {} },
      }
    ]
  };
}), applicability: null },
    "a11ycore-media-alternative-transcript-evidence": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  // Conservative keyword set (deterministic). Includes common EN/FR terms.
  // Keep this list strict to avoid false positives.
  const TRANSCRIPT_TOKENS = [
    'transcript',
    'transcription',
    'texte intégral',
    'compte rendu',
    'verbatim'
  ];

  // Minimum transcript body length to be considered "substantial" when used as evidence.
  // (Avoids treating short summaries as transcripts.)
  const MIN_TRANSCRIPT_CHARS = 200;

  // If aria-describedby contains no transcript token, require a larger body to consider it evidence.
  const MIN_DESCRIBEDBY_CHARS_WITHOUT_TOKEN = 400;

  function normText(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function containsTranscriptToken(s) {
    const t = normText(s);
    if (!t) return false;
    for (const tok of TRANSCRIPT_TOKENS) {
      if (t.includes(tok)) return true;
    }
    return false;
  }

  function textLen(s) {
    const t = normText(s);
    return t ? t.length : 0;
  }

  function getNodeText(el) {
    try {
      if (!el) return '';
      return el.textContent || '';
    } catch (e) {
      return '';
    }
  }

  function isElement(el) {
    return !!(el && el.nodeType === 1);
  }

  const __eligCache = new WeakMap();

  function getEligibility(node) {
    if (!node || node.nodeType !== 1) return { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };
    const cached = __eligCache.get(node);
    if (cached) return cached;

    let info = null;
    try {
      info = (helpers && typeof helpers.getEligibilityInfo === 'function')
          ? helpers.getEligibilityInfo(node, ctx, { targetSet: 'acc' })
          : null;
    } catch {
      info = null;
    }

    const norm = (info && typeof info === 'object')
        ? info
        : { eligible: true, reasons: [], targetSet: 'acc', accEligible: null };

    __eligCache.set(node, norm);
    return norm;
  }

  function isEligible(node) {
    const info = getEligibility(node);
    return !!(info && info.eligible);
  }

  function safeSelector(node) {
    return helpers.buildSelector ? helpers.buildSelector(node) : 'html';
  }

  // Evidence object includes strength, so the rule can treat "unverified external link" as insufficient proof.
  function evidenceNone() {
    return {
      strength: 'none', // none | weak | strong
      method: 'none',
      transcriptNodeSelector: null,
      transcriptLinkHref: null,
      notes: []
    };
  }

  function nodeRef(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
      const id = el.getAttribute && el.getAttribute('id');
      if (id) return { type: 'id', value: String(id) };
      const tag = (el.tagName || '').toLowerCase();
      return { type: 'tag', value: tag };
    } catch {
      return null;
    }
  }

  const __evidenceCache = new WeakMap();

  function getContainer(mediaEl) {
    try {
      return mediaEl && mediaEl.parentElement ? mediaEl.parentElement : null;
    } catch {
      return null;
    }
  }

  // Walk a small neighborhood around the media element to find transcript cues.
  // Bounded for determinism and performance.
  function findTranscriptEvidence(mediaEl) {
    const evidence = evidenceNone();

    // 1) aria-describedby strong binding
    const descInfo = helpers.getAccessibleDescriptionInfo
      ? helpers.getAccessibleDescriptionInfo(mediaEl, ctx)
      : null;

    if (descInfo && descInfo.mechanism === 'aria-describedby') {
      const descText = descInfo.value || '';
      const hasToken = containsTranscriptToken(descText);
      const len = textLen(descText);

      // Strong signal if the described text clearly indicates transcript, or is very substantial.
      if (hasToken || len >= MIN_DESCRIBEDBY_CHARS_WITHOUT_TOKEN) {
        evidence.strength = 'strong';
        evidence.method = 'aria-describedby';
        evidence.notes.push('media has aria-describedby with explicit or substantial transcript text');
        return evidence;
      }
    }

    // 2) In-container transcript heading + substantial visible text
    const parent = mediaEl.parentElement;
    if (isElement(parent) && isEligible(parent)) {
      const headings = parent.querySelectorAll('h1,h2,h3,h4,h5,h6');
      for (const h of headings) {
        if (!isEligible(h)) continue;
        const hText = getNodeText(h);
        if (!containsTranscriptToken(hText)) continue;

        // Look at a small set of following siblings for substantial text (and ensure visibility).
        let sib = h.nextElementSibling;
        let steps = 0;
        while (isElement(sib) && steps < 4) {
          if (isEligible(sib)) {
            const sibText = getNodeText(sib);
            if (textLen(sibText) >= MIN_TRANSCRIPT_CHARS) {
              evidence.strength = 'strong';
              evidence.method = 'adjacent-heading';
              evidence.transcriptNodeSelector = nodeRef(h);
              evidence.notes.push('found transcript heading with substantial visible adjacent text');
              return evidence;
            }
          }
          sib = sib.nextElementSibling;
          steps += 1;
        }
      }
    }

    // 3) Nearby explicit transcript link
    // - Same-document anchors can be verified (strong).
    // - Cross-document links are unverified (weak).
    if (isElement(parent) && isEligible(parent)) {
      const links = parent.querySelectorAll('a[href]');
      for (const a of links) {
        if (!isEligible(a)) continue;

        const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(a, ctx) : null;
        const linkName = nameInfo && nameInfo.value ? nameInfo.value : getNodeText(a);
        if (!containsTranscriptToken(linkName)) continue;

        const href = a.getAttribute('href') || '';
        evidence.transcriptLinkHref = href;
        evidence.transcriptNodeSelector = nodeRef(a);

        // 3a) Same-document anchor: resolve and verify target content has transcript heading + substance.
        if (href.startsWith('#')) {
          const targetId = href.slice(1);
          const target = targetId
            ? (safeRoot.getElementById ? safeRoot.getElementById(targetId) : document.getElementById(targetId))
            : null;

          if (isElement(target) && isEligible(target)) {
            // Find a transcript heading in the target, and ensure there is substantial text in the target subtree.
            const targetHeadings = target.querySelectorAll('h1,h2,h3,h4,h5,h6');
            let hasTranscriptHeading = false;
            for (const th of targetHeadings) {
              if (!isEligible(th)) continue;
              if (containsTranscriptToken(getNodeText(th))) {
                hasTranscriptHeading = true;
                break;
              }
            }
            const targetText = getNodeText(target);

            if (hasTranscriptHeading && textLen(targetText) >= MIN_TRANSCRIPT_CHARS) {
              evidence.strength = 'strong';
              evidence.method = 'anchor-target';
              evidence.notes.push('resolved transcript link to an on-page section with transcript heading and substantial text');
              return evidence;
            }
          }

          // If anchor cannot be verified, treat as weak (still better than nothing, but not proof).
          evidence.strength = 'weak';
          evidence.method = 'anchor-unverified';
          evidence.notes.push('transcript link found but anchor target could not be verified as a transcript section');
          return evidence;
        }

        // 3b) External or cross-document link: do not treat as proof without crawling.
        evidence.strength = 'weak';
        evidence.method = 'external-link';
        evidence.notes.push('transcript link found but cannot verify content without crawling');
        return evidence;
      }
    }

    return evidence;
  }

  const occurrences = [];
  let applicableCount = 0;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('audio,video')
    : helpers.queryAll('audio,video');

  for (const el of nodes) {
    const eligInfo = getEligibility(el);
    if (!eligInfo || !eligInfo.eligible) continue;

    applicableCount += 1;

    const container = getContainer(el);
    let evidence = container ? __evidenceCache.get(container) : null;
    if (!evidence) {
      evidence = findTranscriptEvidence(el);
      if (container) __evidenceCache.set(container, evidence);
    }

    const mediaTag = (el.tagName || '').toLowerCase();

    if (evidence.strength === 'none') {
      const baseOccurrence = {
        summary:
            'A transcript or other text alternative for this time-based media is not strongly evidenced on the page.',
        hint:
            'Provide a clearly identified transcript or other text alternative for audio-only/video-only prerecorded media (for example, a “Transcript” section or link).',
        i18n: {
          summaryKey: 'a11ycore_mediaTranscriptPresent_summary_cantTell_missing',
          hintKey: 'a11ycore_mediaTranscriptPresent_hint_cantTell_missing',
          params: { element: mediaTag }
        },
        data: {
          details: {
            reasonCode: 'transcriptNotDetected',
            mediaTag,
            evidence
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      };

      if (helpers && typeof helpers.reportOccurrence === 'function') {
        occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
      } else {
        occurrences.push({ selector: '', html: '', ...baseOccurrence });
      }
      continue;
    }

    if (evidence.strength === 'weak') {

      const baseOccurrence = {
        summary:
            'A transcript or other text alternative may be available for this time-based media, but it could not be verified from the page content.',
        hint:
            'Ensure a clearly identified transcript or other text alternative is available and programmatically or visibly associated with the media on the page.',
        i18n: {
          summaryKey: 'a11ycore_mediaTranscriptPresent_summary_cantTell_unverified',
          hintKey: 'a11ycore_mediaTranscriptPresent_hint_cantTell_unverified',
          params: { element: mediaTag }
        },
        data: {
          details: {
            reasonCode: 'transcriptEvidenceUnverified',
            mediaTag,
            evidence
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      };

      if (helpers && typeof helpers.reportOccurrence === 'function') {
        occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
      } else {
        occurrences.push({ selector: '', html: '', ...baseOccurrence });
      }
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }

  // Strong evidence found for all applicable media elements.
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}), applicability: null },
    "a11ycore-object-text-alternative-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
    ? helpers.queryAll
    : (sel) => {
      try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
      catch { return []; }
    };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function'
    ? helpers.getAriaNameInfo
    : null;

  const objects = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('object') : queryAll('object')) || []); }
    catch { return queryAll('object'); }
  })();

  if (!objects.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  function computeNameInfo(el) {
    // For <object>, treat ARIA name as primary. Do not accept HTML <label> associations.
    const flags = [];
    let aria = null;

    if (getAriaNameInfo) {
      aria = (() => { try { return getAriaNameInfo(el, ctx); } catch { return null; } })();
    }

    if (aria && aria.present && trim(aria.value)) {
      return { present: true, value: trim(aria.value), mechanism: aria.mechanism || 'aria', flags: (aria.flags || []).slice(0) };
    }

    const title = trim(el.getAttribute && el.getAttribute('title'));
    if (title) {
      flags.push('title-used');
      return { present: true, value: title, mechanism: 'title', flags };
    }

    if (aria && aria.flags && aria.flags.length) {
      for (const f of aria.flags) flags.push(f);
    }

    return { present: false, value: '', mechanism: 'none', flags };
  }

  function computeFallbackText(el) {
    try {
      // Deterministic + bounded: textContent can be large
      const raw = trim(el.textContent || '');
      const t = raw.length > 1000 ? raw.slice(0, 1000) : raw;
      return { present: !!t, value: t, mechanism: 'fallback', flags: t ? [] : ['empty'] };
    } catch {
      return { present: false, value: '', mechanism: 'fallback', flags: ['error'] };
    }
  }

  for (const el of objects) {
    if (!el || !el.getAttribute) continue;

    if (isAccTreeEligible) {
      const elig = (() => { try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; } })();
      if (elig && elig.eligible === false) continue;
    }

    // role presentation/none exclusion only when not focusable
    const role = (() => { try { return String(el.getAttribute('role') || '').trim().toLowerCase(); } catch { return ''; } })();
    if (role === 'presentation' || role === 'none') {
      let focusable = false;
      if (getFocusableInfo) {
        const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = el.getAttribute('tabindex');
        focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const name = computeNameInfo(el);

    // Only compute fallback text if there is no name.
    // (textContent can be expensive; avoid when not needed)
    const fb = name.present ? { present: false, value: '', mechanism: 'fallback', flags: ['skipped-name-present'] }
        : computeFallbackText(el);

    const hasTextAlt = !!(name.present || fb.present);
    if (hasTextAlt) continue;


    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Missing text alternative for <object>.',
      hint: 'Provide meaningful fallback content inside <object>, or add an accessible name (aria-label/aria-labelledby).',
      i18n: {
        summaryKey: 'a11ycore_object_textAltPresent_summary_fail',
        hintKey: 'a11ycore_object_textAltPresent_hint_fail',
        params: { element: 'object' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        fallback: fb,
        name
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-object-text-alternative-quality": { run: (function runInPage(ctx) {

    const {document, root, helpers, rule} = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try {
                return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : [];
            } catch {
                return [];
            }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try {
                return String(el.getAttribute('role') || '').trim().toLowerCase();
            } catch {
                return '';
            }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => {
                try {
                    return getFocusableInfo(el, ctx);
                } catch {
                    return null;
                }
            })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try {
            return Array.from((queryAllSmart ? queryAllSmart('object') : queryAll('object')) || []);
        } catch {
            return queryAll('object');
        }
    })();

    if (!els.length) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        if (isAccTreeEligible) {
            const elig = (() => {
                try {
                    return isAccTreeEligible(el, ctx);
                } catch {
                    return {eligible: true, reasons: []};
                }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        const trim = (v) => (v == null ? '' : String(v)).trim();

        let fallbackText = '';
        let ariaLabel = '';
        let ariaLabelledBy = '';
        let title = '';
        let labelledByText = '';

        try {
            fallbackText = trim(el.textContent || '');
            ariaLabel = trim(el.getAttribute('aria-label'));
            ariaLabelledBy = trim(el.getAttribute('aria-labelledby'));
            title = trim(el.getAttribute('title'));
        } catch {}

// Only resolve idrefs if needed/present
        if (!ariaLabel && ariaLabelledBy && helpers && typeof helpers.getTextFromIdRefs === 'function') {
            try {
                const t = helpers.getTextFromIdRefs(ariaLabelledBy, ctx);
                labelledByText = trim(t && t.text);
            } catch {}
        }

        const details = {
            fallbackText: fallbackText || null,
            ariaLabel: ariaLabel || null,
            ariaLabelledBy: ariaLabelledBy || null,
            ariaLabelledByText: labelledByText || null,
            title: title || null
        };

        const hasMechanism = !!(details.fallbackText || details.ariaLabel || details.ariaLabelledByText || details.title);
        if (!hasMechanism) continue;

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Review text alternative for <object> for equivalence and appropriateness.',
            hint: 'Confirm the fallback content or ARIA name provides an equivalent alternative for the embedded content.',
            i18n: {
                summaryKey: 'a11ycore_object_textAltQuality_summary_cantTell',
                hintKey: 'a11ycore_object_textAltQuality_hint_cantTell',
                params: { element: 'object' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    return {ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences};
}), applicability: null },
    "a11ycore-page-title-patterns": { run: (function runInPage(ctx) {
  const { document, helpers, rule } = ctx;
  const probes = ctx && ctx.inputs && ctx.inputs.probes && typeof ctx.inputs.probes === 'object'
      ? ctx.inputs.probes
      : null;

  const pageTitlesProbe = probes && probes['crawl.pageTitles'] && typeof probes['crawl.pageTitles'] === 'object'
      ? probes['crawl.pageTitles']
      : null;

  const occurrences = [];
  let applicableCount = 1;

  const titleEl = document.querySelector('head > title');
  const rawTitle = document.title || '';
  const titleText = rawTitle.replace(/\s+/g, ' ').trim();
  const titleLc = titleText.toLowerCase();
  // =========================
  // Cross-page pattern analysis (preferred) if crawl.pageTitles probe is provided
  // =========================
  if (pageTitlesProbe && Array.isArray(pageTitlesProbe.pages)) {
    const pages = pageTitlesProbe.pages.filter(p => p && typeof p === 'object');

    // Require enough data to avoid noisy conclusions
    const MIN_PAGES = 10;
    const analyzable = pages
        .map(p => ({
          url: p.url ? String(p.url) : null,
          title: typeof p.title === 'string' ? p.title.replace(/\s+/g, ' ').trim() : ''
        }))
        .filter(p => p.url && p.title);

    if (analyzable.length >= MIN_PAGES) {
      // Build normalized title groups (case-insensitive)
      const groups = new Map(); // normTitle -> { title, urls: [] }
      for (const p of analyzable) {
        const norm = p.title.toLowerCase();
        if (!groups.has(norm)) groups.set(norm, { title: p.title, urls: [] });
        groups.get(norm).urls.push(p.url);
      }

      // Duplicate titles across distinct URLs is a strong "review" signal (not a guaranteed failure)
      const dupGroups = Array.from(groups.values()).filter(g => g.urls.length >= 2);

      // Boilerplate-ish: detect a long common suffix/prefix across most titles.
      // Keep conservative: only flag if the common part is long and shared by many.
      const titles = analyzable.map(p => p.title);
      function commonPrefix(a, b) {
        const n = Math.min(a.length, b.length);
        let i = 0;
        for (; i < n; i++) if (a[i] !== b[i]) break;
        return a.slice(0, i);
      }
      function commonSuffix(a, b) {
        const ra = a.split('').reverse().join('');
        const rb = b.split('').reverse().join('');
        return commonPrefix(ra, rb).split('').reverse().join('');
      }

      let sharedPrefix = titles[0] || '';
      let sharedSuffix = titles[0] || '';
      for (let i = 1; i < titles.length; i++) {
        sharedPrefix = commonPrefix(sharedPrefix, titles[i]);
        sharedSuffix = commonSuffix(sharedSuffix, titles[i]);
        if (sharedPrefix.length === 0 && sharedSuffix.length === 0) break;
      }

      const prefixLen = sharedPrefix.trim().length;
      const suffixLen = sharedSuffix.trim().length;

      const hasStrongTemplateSignal =
          (prefixLen >= 12 || suffixLen >= 12) &&
          (prefixLen >= 12 ? sharedPrefix.trim().length : 0) + (suffixLen >= 12 ? sharedSuffix.trim().length : 0) >= 12;

      // If any cross-page signal exists, emit cantTell occurrence(s)
      if (dupGroups.length || hasStrongTemplateSignal) {
        const reasonCode = dupGroups.length
            ? 'duplicateTitlesAcrossPages'
            : 'templatedTitlesAcrossPages';

        // Deterministic example title for i18n params (lexicographic, case-insensitive)
        const exampleTitle = dupGroups.length
            ? dupGroups
            .map(g => String(g.title || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))[0] || ''
            : '';

        const summaryKey = dupGroups.length
            ? 'a11ycore_pageTitlePatterns_summary_cantTell_duplicateAcrossPages'
            : 'a11ycore_pageTitlePatterns_summary_cantTell_templatedAcrossPages';

        const i18nParams = dupGroups.length
            ? {
              reasonCode,
              pagesAnalyzed: analyzable.length,
              duplicateGroups: dupGroups.length,
              exampleTitle
            }
            : {
              reasonCode,
              pagesAnalyzed: analyzable.length
            };

        const occBase = {
          selector: 'head > title',
          html: '',
          summary: 'The set of page titles may not be descriptive enough to distinguish pages by topic or purpose.',
          hint: 'Ensure each page title is sufficiently descriptive and helps users distinguish pages (avoid identical or overly templated titles across many pages).',
          i18n: {
            summaryKey,
            hintKey: 'a11ycore_pageTitlePatterns_hint_cantTell',
            params: i18nParams
          },
          data: {
            details: {
              reasonCode,
              metrics: {
                pagesAnalyzed: analyzable.length,
                duplicateGroups: dupGroups.length,
                largestDuplicateGroupSize: dupGroups.length ? Math.max(...dupGroups.map(g => g.urls.length)) : 0,
                sharedPrefix: prefixLen >= 12 ? sharedPrefix.trim() : '',
                sharedSuffix: suffixLen >= 12 ? sharedSuffix.trim() : ''
              },
              refs: {
                exampleDuplicateTitles: dupGroups.slice(0, 3).map(g => ({
                  title: g.title,
                  urls: g.urls.slice(0, 5)
                }))
              }
            },
            visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        };

        if (titleEl && helpers && typeof helpers.reportOccurrence === 'function') {
          occurrences.push(helpers.reportOccurrence(titleEl, occBase));
        } else {
          // No node available: keep deterministic fallback snippet (no helper calls).
          occurrences.push({
            ...occBase,
            html: titleEl && titleEl.outerHTML ? String(titleEl.outerHTML).slice(0, 2000) : '<title>(unknown)</title>'
          });
        }

        // Cross-page analysis is authoritative when present; do not also run single-page heuristics.
        return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
      }

      // If we had enough pages and found no signals, we can return informative pass.
      return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
    }

    // Not enough analyzable pages -> notApplicable for cross-page patterns, fall back to single-page logic.
  }

  // If there's no title (or empty), defer to the hard-fail rule.
  if (!titleEl || titleText.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const GENERIC_TITLES = new Set([
    'home',
    'homepage',
    'welcome',
    'untitled',
    'page',
    'document'
  ]);

  // Conservative signals:
  // - very short title (likely non-descriptive)
  // - title is one of a small set of generic titles
  const isVeryShort = titleText.length > 0 && titleText.length < 8;
  const isGeneric = GENERIC_TITLES.has(titleLc);

  // Template-like: "Brand | Home" or "Home - Brand" where the page-specific part is a generic token.
  const templateLike = /\b(home|homepage|welcome)\b\s*(\||-|—|:)\s*.+/i.test(titleText) ||
                       /.+\s*(\||-|—|:)\s*\b(home|homepage|welcome)\b/i.test(titleText);

  if (isGeneric || isVeryShort || templateLike) {
    const reasonCode = isGeneric
      ? 'genericTitle'
      : (isVeryShort ? 'veryShortTitle' : 'templateLikeTitle');

    const summaryKey =
        reasonCode === 'genericTitle'
            ? 'a11ycore_pageTitlePatterns_summary_cantTell_generic'
            : (reasonCode === 'veryShortTitle'
                ? 'a11ycore_pageTitlePatterns_summary_cantTell_veryShort'
                : 'a11ycore_pageTitlePatterns_summary_cantTell_templateLike');
    const occBase = {
      selector: 'head > title',
      html: '',
      summary:
          'The page title may not be descriptive enough to identify the page topic or purpose.',
      hint:
          'Use a more specific title that identifies the page topic or purpose (for example, include the section name or task).',
      i18n: {
        summaryKey,
        hintKey: 'a11ycore_pageTitlePatterns_hint_cantTell',
        params: {}
      },
      data: {
        details: {
          reasonCode,
          titleText
        },
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (titleEl && helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(titleEl, occBase));
    } else {
      occurrences.push({
        ...occBase,
        html: titleEl && titleEl.outerHTML ? String(titleEl.outerHTML).slice(0, 2000) : '<title>(unknown)</title>'
      });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    // Patterns are review signals: cantTell rather than fail.
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }

  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}), applicability: null },
    "a11ycore-page-title-present": { run: (function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 1;

  const titleEl = document.querySelector('head > title');
  const titleText = (document.title || '').replace(/\s+/g, ' ').trim();

  const missingTitleEl = !titleEl;
  const emptyTitle = !missingTitleEl && titleText.length === 0;

  if (missingTitleEl || emptyTitle) {
    const reasonCode = missingTitleEl ? 'missingTitleElement' : 'emptyTitleText';

    const occBase = {
      selector: 'head > title',
      html: '',
      summary: missingTitleEl
          ? 'The page is missing a <title> element.'
          : 'The page has an empty <title>.',
      hint: 'Provide a descriptive, non-empty <title> that identifies the page topic or purpose.',
      i18n: {
        summaryKey: missingTitleEl
            ? 'a11ycore_pageTitlePresent_summary_fail_missing'
            : 'a11ycore_pageTitlePresent_summary_fail_empty',
        hintKey: 'a11ycore_pageTitlePresent_hint_fail',
        params: {}
      },
      data: {
        details: {
          reasonCode,
          titleText
        },
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (!missingTitleEl && titleEl && helpers && typeof helpers.reportOccurrence === 'function') {
      // empty title: we have a node, so engine can attach html
      occurrences.push(helpers.reportOccurrence(titleEl, occBase));
    } else {
      // missing title element: no node exists, keep deterministic html string
      occurrences.push({ ...occBase, html: '<title>(missing)</title>' });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}), applicability: null },
    "a11ycore-role-img-text-alternative-present": { run: (function runInPage(ctx) {
    const { root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const trim = (v) => {
        try { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
        catch { return ''; }
    };

    const imgElements = (() => {
        // do not consider element "img" because it has its own rule
        const sel = '[role="img" i]:not(img)';
        try { return Array.from((queryAllSmart ? queryAllSmart(sel) : queryAll(sel)) || []); }
        catch { return queryAll(sel); }
    })();

    if (!imgElements.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getAccessibleNameInfo = helpers && typeof helpers.getAccessibleNameInfo === 'function'
        ? helpers.getAccessibleNameInfo
        : null;

    for (const el of imgElements) {
        if (!el || !el.getAttribute) continue;

        // Applicability: eligible in the acc tree (with helper exceptions).
        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        applicableCount += 1;

        // Expectation: aria-label OR aria-labelledby. We use helper name-info when available,
        // but we also validate the source to keep this rule scoped/deterministic.

        const ariaLabelRaw = (() => { try { return el.getAttribute('aria-label'); } catch { return null; } })();
        const ariaLabel = trim(ariaLabelRaw);

        const ariaLabelledbyRaw = (() => { try { return el.getAttribute('aria-labelledby'); } catch { return null; } })();
        const ariaLabelledby = trim(ariaLabelledbyRaw);

        const hasAriaLabelAttr = ariaLabelRaw !== null;
        const hasAriaLabelledbyAttr = ariaLabelledbyRaw !== null;

        const hasValidAriaLabel = hasAriaLabelAttr && ariaLabel.length > 0;
        const hasValidAriaLabelledbyAttr = hasAriaLabelledbyAttr && ariaLabelledby.length > 0;

        let nameInfo = null;

        // Fast outcomes first (no helper needed)
        let reasonCode = '';
        let hasName = false;

        if (!hasAriaLabelAttr && !hasAriaLabelledbyAttr) {
            reasonCode = 'missingTextAlternative';
        } else if (hasAriaLabelAttr && !hasValidAriaLabel) {
            reasonCode = 'emptyAriaLabel';
        } else if (hasAriaLabelledbyAttr && !hasValidAriaLabelledbyAttr) {
            reasonCode = 'emptyAriaLabelledby';
        } else {
            // Mechanism present + non-empty. Optionally validate resolution via helper.
            if (getAccessibleNameInfo) {
                nameInfo = (() => { try { return getAccessibleNameInfo(el, ctx); } catch { return null; } })();
                const helperSaysHasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));
                if (helperSaysHasName) {
                    hasName = true;
                } else {
                    reasonCode = 'nameNotResolved';
                }
            } else {
                // Without helper, accept non-empty aria-label/labelledby as sufficient.
                hasName = true;
            }
        }

        if (hasName) continue;


        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Missing text alternative on element with role="img".',
            hint: 'Provide aria-label or aria-labelledby (referencing non-empty text) to give this image a text alternative.',
            i18n: {
                summaryKey: 'a11ycore_roleImg_textAlternativePresent_summary_fail',
                hintKey: 'a11ycore_roleImg_textAlternativePresent_hint_fail',
                params: { role: 'img' }
            },
            data: {
                details: {
                    reasonCode,
                    ariaLabel: ariaLabelRaw === null ? null : ariaLabel,
                    ariaLabelledby: ariaLabelledbyRaw === null ? null : ariaLabelledby,
                    accessibleNameInfo: nameInfo || null
                },
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    if (!occurrences.length) {
        return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-svg-image-text-alternative-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
    ? helpers.queryAll
    : (sel) => {
        try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
        catch { return []; }
      };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const isFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAccessibleNameInfo = helpers && typeof helpers.getAccessibleNameInfo === 'function'
    ? helpers.getAccessibleNameInfo
    : null;

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  function directChildText(el, localName) {
    try {
      if (!el) return '';
      for (let n = el.firstElementChild; n; n = n.nextElementSibling) {
        const tn = (n.localName || n.tagName || '').toLowerCase();
        if (tn === localName) {
          const t = trim(n.textContent);
          if (t) return t;
        }
      }
    } catch {}
    return '';
  }

  const rawImages = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('image') : queryAll('image')) || []); }
    catch { return queryAll('svg image'); }
  })();

  const images = rawImages.filter((el) => {
    try { return el && (el.namespaceURI === 'http://www.w3.org/2000/svg') && (String(el.localName).toLowerCase() === 'image'); }
    catch { return false; }
  });

  if (!images.length) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const occurrences = [];
  let applicableCount = 0;

  for (const el of images) {
    if (!el || !el.getAttribute) continue;

    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    const role = trim(el.getAttribute('role')).toLowerCase();
    if (role === 'presentation' || role === 'none') {
      let focusable = false;
      if (isFocusableInfo) {
        const fi = (() => { try { return isFocusableInfo(el, ctx); } catch { return null; } })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = el.getAttribute('tabindex');
        focusable = tabindex != null && trim(tabindex) !== '' && !Number.isNaN(Number(trim(tabindex)));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const titleText = directChildText(el, 'title');
    if (titleText) continue;

    const descText = directChildText(el, 'desc');
    if (descText) continue;

    // Only now check “accessible name” (but scoped to allowed mechanisms)
    const ariaLabelRaw = (() => { try { return el.getAttribute('aria-label'); } catch { return null; } })();
    const ariaLabelledbyRaw = (() => { try { return el.getAttribute('aria-labelledby'); } catch { return null; } })();
    const titleAttrRaw = (() => { try { return el.getAttribute('title'); } catch { return null; } })();

    const ariaLabel = trim(ariaLabelRaw);
    const ariaLabelledby = trim(ariaLabelledbyRaw);
    const titleAttr = trim(titleAttrRaw);

    const hasMechanism =
        (ariaLabelRaw !== null && ariaLabel.length > 0) ||
        (ariaLabelledbyRaw !== null && ariaLabelledby.length > 0) ||
        (titleAttrRaw !== null && titleAttr.length > 0);

    let nameInfo = null;
    let hasName = false;

    if (hasMechanism) {
      if (getAccessibleNameInfo) {
        nameInfo = (() => { try { return getAccessibleNameInfo(el, ctx); } catch { return null; } })();
        hasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));
      } else {
        // Without helper, accept presence of non-empty allowed attributes
        hasName = true;
      }
    }

    if (hasName) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Missing text alternative on SVG <image>.',
      hint: 'Add a <title> (and optionally <desc>) inside <image>, or provide aria-label/aria-labelledby.',
      i18n: {
        summaryKey: 'a11ycore_svgImage_textAltPresent_summary_fail',
        hintKey: 'a11ycore_svgImage_textAltPresent_hint_fail',
        params: { element: 'image' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (!occurrences.length) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-svg-text-alternative-present": { run: (function runInPage(ctx) {
    const {document, root, helpers, rule} = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try {
                return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : [];
            } catch {
                return [];
            }
        };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function'
        ? helpers.getAriaNameInfo
        : null;

    function trim(v) {
        try {
            return (v == null ? '' : String(v)).trim();
        } catch {
            return '';
        }
    }

    function nonEmptyDirectChildText(svg, localName) {
        try {
            for (let n = svg.firstElementChild; n; n = n.nextElementSibling) {
                const tn = (n.localName || n.tagName || '').toLowerCase();
                if (tn === localName) {
                    const txt = trim(n.textContent);
                    if (txt) return txt;
                }
            }
        } catch {
        }
        return '';
    }

    function isFocusable(svg) {
        if (getFocusableInfo) {
            const fi = (() => {
                try {
                    return getFocusableInfo(svg, ctx);
                } catch {
                    return null;
                }
            })();
            return !!(fi && fi.focusable);
        }
        // deterministic fallback: tabindex presence/valid number
        try {
            const tabindex = svg && svg.getAttribute ? svg.getAttribute('tabindex') : null;
            return tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        } catch {
            return false;
        }
    }

    const svgs = (() => {
        try {
            return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []);
        } catch {
            return queryAll('svg');
        }
    })();

    if (!svgs.length) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of svgs) {
        if (!el || !el.getAttribute) continue;

        // Applicability step 1: only acc-tree eligible nodes (with helper exceptions)
        if (isAccTreeEligible) {
            const elig = (() => {
                try {
                    return isAccTreeEligible(el, ctx);
                } catch {
                    return {eligible: true, reasons: []};
                }
            })();
            if (elig && elig.eligible === false) continue;
        }

        // Applicability step 2: role (presentation/none) exclusion only when not focusable
        const role = (() => {
            try {
                return String(el.getAttribute('role') || '').trim().toLowerCase();
            } catch {
                return '';
            }
        })();

        const focusable = isFocusable(el);

        if (role === 'presentation' || role === 'none') {
            if (!focusable) continue;
        }

        // Applicability step 3: intent signal gating (computed once per element)
        let hasAriaNamingAttr = false;
        try {
            hasAriaNamingAttr = (el.getAttribute('aria-label') != null) || (el.getAttribute('aria-labelledby') != null);
        } catch {
        }

        const titleText = nonEmptyDirectChildText(el, 'title');
        const descText = titleText ? '' : nonEmptyDirectChildText(el, 'desc'); // avoid second scan if title already passes
        const hasTitleOrDesc = !!(titleText || descText);

        const hasIntent =
            role === 'img' ||
            hasAriaNamingAttr ||
            hasTitleOrDesc ||
            focusable;

        if (!hasIntent) continue;

        applicableCount += 1;

        // Expectation: non-empty title/desc OR ARIA name (but only resolve name if attrs exist)
        let hasAriaName = false;
        if (hasAriaNamingAttr) {
            if (getAriaNameInfo) {
                const info = (() => {
                    try {
                        return getAriaNameInfo(el, ctx);
                    } catch {
                        return null;
                    }
                })();
                hasAriaName = !!(info && info.present && trim(info.value));
            } else {
                // minimal deterministic fallback
                const ariaLabel = trim((() => {
                    try {
                        return el.getAttribute('aria-label');
                    } catch {
                        return '';
                    }
                })());
                const ariaLabelledby = trim((() => {
                    try {
                        return el.getAttribute('aria-labelledby');
                    } catch {
                        return '';
                    }
                })());
                hasAriaName = !!(ariaLabel || ariaLabelledby);
            }
        }

        const ok = hasTitleOrDesc || hasAriaName;
        if (ok) continue;

        let eligInfo = null;
        if (getEligibilityInfo) {
            try { eligInfo = getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { eligInfo = null; }
        }

        const baseOccurrence = {
            summary: 'Missing text alternative for <svg>.',
            hint: 'Provide a <title> or <desc> element with text, or an ARIA name (aria-label/aria-labelledby).',
            i18n: {
                summaryKey: 'a11ycore_svg_textAltPresent_summary_fail',
                hintKey: 'a11ycore_svg_textAltPresent_hint_fail',
                params: {element: 'svg'}
            },
            data: {
                visibilityFilter: eligInfo || {targetSet: 'acc', accEligible: null, reasons: []}
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({selector: '', html: '', ...baseOccurrence});
        }
    }

    if (applicableCount === 0) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    if (!occurrences.length) {
        return {ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: []};
    }

    return {ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences};
}), applicability: null },
    "a11ycore-svg-text-alternative-quality": { run: (function runInPage(ctx) {
    const {document, root, helpers, rule} = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const buildSelector = helpers && typeof helpers.buildSelector === 'function'
        ? helpers.buildSelector
        : (el) => {
            try {
                if (!el || !el.tagName) return 'html';
                const tag = (el.tagName || 'html').toLowerCase();
                return el.id ? `${tag}#${el.id}` : tag;
            } catch {
                return 'html';
            }
        };

    const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function'
        ? helpers.getOuterHtmlSnippet
        : (el) => { try { return (el && el.outerHTML) ? String(el.outerHTML).slice(0, 2000) : ''; } catch { return ''; } };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try {
                return String(el.getAttribute('role') || '').trim().toLowerCase();
            } catch {
                return '';
            }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => {
                try {
                    return getFocusableInfo(el, ctx);
                } catch {
                    return null;
                }
            })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try {
            return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []);
        } catch {
            return queryAll('svg');
        }
    })();

    if (!els.length) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    const occurrences = [];
    let applicableCount = 0;

    const trim = (v) => (v == null ? '' : String(v)).trim();

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        // acc eligibility
        if (isAccTreeEligible) {
            const elig = (() => { try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; } })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Detect mechanisms once
        let titleText = '';
        let descText = '';
        let ariaLabel = '';
        let ariaLabelledBy = '';
        let labelledByText = '';

        try {
            const titleEl = el.querySelector ? el.querySelector('title') : null;
            const descEl = el.querySelector ? el.querySelector('desc') : null;
            titleText = trim(titleEl && titleEl.textContent);
            descText = trim(descEl && descEl.textContent);

            ariaLabel = trim(el.getAttribute('aria-label'));
            ariaLabelledBy = trim(el.getAttribute('aria-labelledby'));
        } catch {}

        if (!ariaLabel && ariaLabelledBy && helpers && typeof helpers.getTextFromIdRefs === 'function') {
            try {
                const t = helpers.getTextFromIdRefs(ariaLabelledBy, ctx);
                labelledByText = trim(t && t.text);
            } catch {}
        }

        const hasNonEmptyTitle = !!titleText;
        const hasNonEmptyDesc = !!descText;
        const hasAriaLabel = !!ariaLabel;
        const hasResolvedLabelledBy = !!labelledByText;

        const hasMechanism = hasNonEmptyTitle || hasNonEmptyDesc || hasAriaLabel || hasResolvedLabelledBy;
        if (!hasMechanism) continue;

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Review text alternative for <svg> for accuracy and appropriateness.',
            hint: 'Confirm the <title>/<desc> or ARIA name conveys the meaning/purpose of the graphic in context.',
            i18n: {
                summaryKey: 'a11ycore_svg_textAltQuality_summary_cantTell',
                hintKey: 'a11ycore_svg_textAltQuality_hint_cantTell',
                params: { element: 'svg' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: {
                    hasNonEmptyTitle,
                    hasNonEmptyDesc,
                    ariaLabel: ariaLabel || null,
                    ariaLabelledBy: ariaLabelledBy || null,
                    ariaLabelledByText: labelledByText ? labelledByText.slice(0, 120) : null // deterministic truncation
                }
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
            const html = getOuterHtmlSnippet(el);
            occurrences.push({ selector: selectorStr, html, ...baseOccurrence });
        }
    }

    if (applicableCount === 0) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    return {ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences};
}), applicability: null },
    "a11ycore-video-poster-text-alternative-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const reportOccurrence = helpers && typeof helpers.reportOccurrence === 'function'
      ? helpers.reportOccurrence
      : null;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : null;

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const isFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAccessibleNameInfo = helpers && typeof helpers.getAccessibleNameInfo === 'function'
    ? helpers.getAccessibleNameInfo
    : null;

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  function hasMeaningfulFallbackText(el) {
    try {
      const t = trim((el && el.textContent) || '');
      return t.length > 0;
    } catch {
      return false;
    }
  }

  const videos = (() => {
    try {
      if (queryAllSmart) return Array.from(queryAllSmart('video') || []);
      if (queryAll) return Array.from(queryAll('video') || []);
      return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll('video')) : [];
    } catch {
      try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll('video')) : []; }
      catch { return []; }
    }
  })();

  if (!videos.length) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const occurrences = [];
  let applicableCount = 0;

  for (const el of videos) {
    if (!el || !el.getAttribute) continue;

    const poster = trim(el.getAttribute('poster'));
    if (!poster) continue; // not applicable: no poster image

    // Eligibility: only elements exposed to AT (with helper exceptions)
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // Role presentation/none excluded ONLY if not focusable (mirrors img behavior)
    const role = trim(el.getAttribute('role')).toLowerCase();
    if (role === 'presentation' || role === 'none') {
      let focusable = false;
      if (isFocusableInfo) {
        const fi = (() => { try { return isFocusableInfo(el, ctx); } catch { return null; } })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = el.getAttribute('tabindex');
        focusable = tabindex != null && trim(tabindex) !== '' && !Number.isNaN(Number(trim(tabindex)));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const hasFallback = hasMeaningfulFallbackText(el);
    if (hasFallback) continue;

    const nameInfo = getAccessibleNameInfo
        ? (() => { try { return getAccessibleNameInfo(el, ctx); } catch { return null; } })()
        : null;

    const hasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));
    if (hasName) continue;

    let eligInfo = null;
    if (getEligibilityInfo) {
      try { eligInfo = getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { eligInfo = null; }
    }

    const baseOccurrence = {
      summary: 'Missing text alternative for <video> poster.',
      hint: 'Provide an accessible name (e.g., aria-label/aria-labelledby) or meaningful fallback text inside <video>.',
      i18n: {
        summaryKey: 'a11ycore_videoPoster_textAltPresent_summary_fail',
        hintKey: 'a11ycore_videoPoster_textAltPresent_hint_fail',
        params: { element: 'video' }
      },
      data: {
        poster,
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        nameInfo: nameInfo || null
      }
    };

    if (reportOccurrence) {
      occurrences.push(reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (!occurrences.length) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null }
  };

  const DEFAULT_POLICY = {
  allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
  allowedConfidence: ['high', 'medium', 'low'],
  coerceManualFailToCantTell: true
};

// Built-in message catalogs (inlined at build time)
const I18N = {
  "en": {
    "a11ycore_img_altPresent_title": "<img> must have an alt attribute",
    "a11ycore_img_altPresent_description": "Checks that <img> elements provide an alt attribute to support a text alternative mechanism.",
    "a11ycore_img_altPresent_summary_fail": "Missing alt attribute on <img>.",
    "a11ycore_img_altPresent_hint_fail": "Add an alt attribute (use alt=\"\" only for decorative images).",
    "a11ycore_area_altPresent_title": "<area> must have an alt attribute",
    "a11ycore_area_altPresent_description": "Checks that <area> elements provide an alt attribute to support a text alternative mechanism.",
    "a11ycore_area_altPresent_summary_fail": "Missing alt attribute on <area>.",
    "a11ycore_area_altPresent_hint_fail": "Add an alt attribute (use alt=\"\" only for decorative areas).",
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
    "a11ycore_formControl_programmaticLabelPresent_description": "Checks that form controls have a programmatic label via <label>, aria-label, or aria-labelledby.",
    "a11ycore_formControl_programmaticLabelPresent_summary_fail": "Form control is missing a programmatic label.",
    "a11ycore_formControl_programmaticLabelPresent_hint_fail": "Provide a <label> association, aria-label, or aria-labelledby (placeholder/title do not count as labels).",
    "a11ycore_formControlAccessibleName_description": "Fails when an applicable form control has no accessible name (e.g., label, aria-label, aria-labelledby).",
    "a11ycore_formControlAccessibleName_hint_fail": "Provide an accessible name via a <label>, aria-label, or aria-labelledby.",
    "a11ycore_formControlAccessibleName_summary_fail": "Form control has no accessible name.",
    "a11ycore_formControlAccessibleName_title": "Form controls must have an accessible name",
    "a11ycore_linksTargetBlankNoopener_description": "Ensures links with target=\"_blank\" mitigate reverse tabnabbing risks.",
    "a11ycore_linksTargetBlankNoopener_hint_cantTell": "See guidance for this rule.",
    "a11ycore_linksTargetBlankNoopener_summary_cantTell": "Links that open in a new tab should use rel=\"noopener\"",
    "a11ycore_linksTargetBlankNoopener_title": "Links that open in a new tab should use rel=\"noopener\"",
    "a11ycore_manualReview_description": "Flags that a manual review of keyboard navigation and focus order is required.",
    "a11ycore_manualReview_hint_cantTell": "See guidance for this rule.",
    "a11ycore_manualReview_summary_cantTell": "Manual review: keyboard navigation and focus order",
    "a11ycore_manualReview_title": "Manual review: keyboard navigation and focus order",
    "rules.a11ycore-img-alt-suspicious.meta.title": "Suspicious alt text requires verification",
    "rules.a11ycore-img-alt-suspicious.meta.description": "Identifies images whose alt text matches common suspicious patterns (such as filenames, URLs, placeholders, or generic terms) and requires manual verification.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.summary": "Image alt text appears suspicious (\"{{alt}}\" looks like {{pattern}}) and requires verification.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.hint": "Review the alt text. Avoid filenames, URLs, placeholders, or generic terms, and ensure the text alternative describes the image’s purpose or function in context.",
    "a11ycore_formControl_programmaticLabelQuality_title": "Form controls should not rely on placeholder or title as the primary label",
    "a11ycore_formControl_programmaticLabelQuality_description": "Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer <label> or aria-labelledby.",
    "a11ycore_formControl_programmaticLabelQuality_summary_cantTell": "Form control’s primary label is derived from {{methodLabel}}.",
    "a11ycore_formControl_programmaticLabelQuality_hint_cantTell": "Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.",
    "a11ycore_html_lang_attr_title": "Page language is declared",
    "a11ycore_html_lang_attr_description": "Checks that the default language of the page is programmatically declared.",
    "a11ycore_html_lang_attr_missing_absent": "The default language of the page is not declared.",
    "a11ycore_html_lang_attr_hint_missing_absent": "Add a lang attribute to the <html> element (for example: <html lang=\"en\">).",
    "a11ycore_html_lang_attr_missing_empty": "The default language of the page is declared but empty.",
    "a11ycore_html_lang_attr_hint_missing_empty": "Set a valid language value in the lang attribute of the <html> element (for example: <html lang=\"en\">).",
    "a11ycore_html_lang_attr_invalid": "The default language of the page is declared, but the value \"{{lang}}\" is not a valid language tag.",
    "a11ycore_html_lang_attr_hint_invalid": "Use a valid BCP 47 language tag in <html lang=\"…\"> (for example: \"en\", \"fr\", \"en-US\").",
    "a11ycore_mediaTranscriptPresent_title": "Time-based media: transcript or text alternative evidence",
    "a11ycore_mediaTranscriptPresent_description": "Finds audio and video elements where a transcript or other text alternative is not strongly evidenced in the page content. This rule is conservative and reports cantTell when evidence is missing or cannot be verified.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_missing": "La présence d’une transcription ou d’une autre alternative textuelle pour cet élément {{element}} n’est pas clairement démontrée sur la page.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_missing": "Provide a clearly identified transcript or other text alternative for prerecorded audio-only or video-only media, for example a visible “Transcript” section or link.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_unverified": "A transcript or other text alternative may be available for this time-based media, but it could not be verified from the page content.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_unverified": "Ensure a clearly identified transcript or other text alternative is available and visibly or programmatically associated with the media on the page.",
    "a11ycore_pageTitlePresent_title": "Page has a non-empty title",
    "a11ycore_pageTitlePresent_description": "Checks that the page includes a non-empty <title> element that identifies the page.",
    "a11ycore_pageTitlePresent_summary_fail": "The page does not have a non-empty title.",
    "a11ycore_pageTitlePresent_hint_fail": "Add a <title> element with text that describes the page topic or purpose.",
    "a11ycore_pageTitlePatterns_title": "Page title patterns that may be insufficiently descriptive",
    "a11ycore_pageTitlePatterns_description": "Identifies page title patterns that may indicate low descriptiveness, such as generic, duplicated, or overly templated titles. This rule provides review signals and does not fail automatically.",
    "a11ycore_pageTitlePatterns_summary_cantTell": "The page title may not be descriptive enough to identify the page topic or purpose.",
    "a11ycore_pageTitlePresent_summary_fail_missing": "The page is missing a <title> element.",
    "a11ycore_pageTitlePresent_summary_fail_empty": "The page has an empty <title>.",
    "a11ycore_pageTitlePatterns_summary_cantTell_duplicateAcrossPages": "Several pages share the same title, which may make it harder to distinguish pages ({{duplicateGroups}} duplicate groups across {{pagesAnalyzed}} pages). Example: “{{exampleTitle}}”.",
    "a11ycore_pageTitlePatterns_summary_cantTell_templatedAcrossPages": "Many page titles appear highly templated, which may reduce how well titles distinguish pages ({{pagesAnalyzed}} pages).",
    "a11ycore_pageTitlePatterns_summary_cantTell_generic": "The page title is generic and may not identify the page topic or purpose.",
    "a11ycore_pageTitlePatterns_summary_cantTell_veryShort": "The page title is very short and may not identify the page topic or purpose.",
    "a11ycore_pageTitlePatterns_summary_cantTell_templateLike": "The page title appears templated and may not identify the page topic or purpose.",
    "a11ycore_pageTitlePatterns_hint_cantTell": "Review the page title and ensure it clearly identifies the page topic or purpose and helps distinguish the page from others.",
    "a11ycore_contrastComputable_title": "Color contrast is computable for rendered text",
    "a11ycore_contrastComputable_description": "Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).",
    "a11ycore_contrastComputable_pass_allComputable": "Contrast is computable for all eligible text ({{eligibleTextCount}} text node(s)).",
    "a11ycore_contrastComputable_cantTell_generic": "Contrast may not be computable ({{reasonCode}}).",
    "a11ycore_contrastComputable_cantTell_bgImageOrGradient": "Contrast is not computable because the background uses an image or gradient ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_mixBlendMode": "Contrast is not computable because mix-blend-mode is used ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_filter": "Contrast is not computable because filter/backdrop-filter is used ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_rootNotOpaque": "Contrast is not computable because the effective background is not fully opaque at the root (alpha={{backgroundAlpha}}).",
    "a11ycore_contrastComputable_cantTell_foregroundUnparsable": "Contrast is not computable because the computed foreground color could not be parsed.",
    "a11ycore_contrastComputable_cantTell_engineFailure": "Contrast computability could not be determined due to an internal engine error ({{reasonCode}}).",
    "a11ycore_contrastMinimum_title": "Text meets minimum color contrast (AA)",
    "a11ycore_contrastMinimum_description": "Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3.0:1 (large), when contrast is computable from CSS.",
    "a11ycore_contrastMinimum_fail_belowThreshold": "Element has insufficient color contrast of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).",
    "a11ycore_contrastMinimum_pass_allAboveThreshold": "All computable text meets minimum contrast (AA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.",
    "a11ycore_contrastMinimum_notApplicable_noComputableText": "No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.",
    "a11ycore_contrastMinimum_cantTell_engineFailure": "Minimum contrast (AA) could not be determined due to an internal engine error ({{reasonCode}}).",
    "a11ycore_contrastEnhanced_title": "Text meets enhanced color contrast (AAA)",
    "a11ycore_contrastEnhanced_description": "Checks that visible text has a contrast ratio of at least 7.0:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.",
    "a11ycore_contrastEnhanced_fail_belowThreshold": "Element has insufficient color contrast (AAA) of {{ratio}}:1 (foreground: {{foregroundHex}}, background: {{backgroundHex}}, font size: {{fontSizePx}}px, font weight: {{fontWeightLabel}}). Expected contrast ratio of {{threshold}}:1 ({{#isLargeText}}large text{{/isLargeText}}{{^isLargeText}}normal text{{/isLargeText}}).",
    "a11ycore_contrastEnhanced_pass_allAboveThreshold": "All computable text meets enhanced contrast (AAA). Eligible text nodes: {{eligibleTextCount}}. Computable: {{computableTextCount}}.",
    "a11ycore_contrastEnhanced_notApplicable_noComputableText": "No eligible text had computable contrast (eligible text nodes: {{eligibleTextCount}}). See the contrast computability rule for details.",
    "a11ycore_contrastEnhanced_cantTell_engineFailure": "Enhanced contrast (AAA) could not be determined due to an internal engine error ({{reasonCode}}).",
    "a11ycore_dom_textContrastMinimum_title": "Text must have sufficient contrast (minimum)",
    "a11ycore_dom_textContrastMinimum_description": "Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.3 (AA), using rendered styles (font size/weight) to determine the required ratio.",
    "a11ycore_dom_textContrastMinimum_summary_fail": "Insufficient text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_hint_fail": "Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for this text size/weight.",
    "a11ycore_dom_textContrastMinimum_summary_pass": "Text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_summary_cantTell": "Could not reliably compute text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).",
    "a11ycore_dom_textContrastMinimum_hint_cantTell": "Manually verify contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.",
    "a11ycore_dom_textContrastEnhanced_title": "Text must have sufficient contrast (enhanced)",
    "a11ycore_dom_textContrastEnhanced_description": "Checks visible text contrast against its computed background per WCAG 2.2 SC 1.4.6 (AAA), using rendered styles (font size/weight) to determine the required ratio.",
    "a11ycore_dom_textContrastEnhanced_summary_fail": "Insufficient enhanced text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_hint_fail": "Adjust the foreground or background color so the contrast ratio is at least {{requiredRatio}}:1 for enhanced (AAA) contrast.",
    "a11ycore_dom_textContrastEnhanced_summary_pass": "Enhanced text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} on background {{bgColor}}. Font {{fontSizePx}}px, weight {{fontWeight}}{{#isBold}}, bold{{/isBold}}{{#isLargeText}} (large text){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_summary_cantTell": "Could not reliably compute enhanced text contrast because the effective background is not deterministically resolvable (e.g. image, gradient, video, canvas, complex transparency, or blending).",
    "a11ycore_dom_textContrastEnhanced_hint_cantTell": "Manually verify enhanced (AAA) contrast where text overlays imagery/gradients/transparency; ensure it meets {{requiredRatio}}:1 for the computed text size/weight.",
    "a11ycore_dom_nonTextContrast_title": "UI components and graphics must have sufficient contrast",
    "a11ycore_dom_nonTextContrast_description": "Checks contrast for non-text visual information (UI component boundaries, states, and meaningful graphical objects) per WCAG 2.2 SC 1.4.11 (AA).",
    "a11ycore_dom_nonTextContrast_summary_fail": "Insufficient non-text contrast: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_hint_fail": "Adjust the component/graphic colors so the contrast ratio is at least {{requiredRatio}}:1 for the perceivable boundary or essential visual information.",
    "a11ycore_dom_nonTextContrast_summary_pass": "Non-text contrast OK: {{contrastRatio}}:1 (required {{requiredRatio}}:1). Foreground {{fgColor}} against background {{bgColor}}. Component: {{componentKind}}{{#componentState}} (state: {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_summary_cantTell": "Could not reliably compute non-text contrast because the effective background or painted pixels are not deterministically resolvable (e.g. image/gradient/video/canvas, complex transparency, or blending).",
    "a11ycore_dom_nonTextContrast_hint_cantTell": "Manually verify the component/graphic contrast against adjacent colors; ensure it meets {{requiredRatio}}:1 for essential non-text visual information.",
    "a11ycore_contrastEnhanced_pass_allTextMeetsThreshold": "All computable text meets enhanced contrast (AAA).",
    "a11ycore_contrastMinimum_pass_allTextMeetsThreshold": "All computable text meets minimum contrast (AA).",
    "a11ycore_roleImg_textAlternativePresent_title": "[role=\"img\"] must have an accessible text alternative",
    "a11ycore_roleImg_textAlternativePresent_description": "Checks that elements with role=\"img\" provide an accessible text alternative using aria-label or aria-labelledby.",
    "a11ycore_roleImg_textAlternativePresent_summary_fail": "The element with role=\"img\" does not have an accessible text alternative.",
    "a11ycore_roleImg_textAlternativePresent_hint_fail": "Provide a text alternative using aria-label, or aria-labelledby that references non-empty text."
  },
  "fr": {
    "a11ycore_img_altPresent_title": "<img> doit avoir un attribut alt",
    "a11ycore_img_altPresent_description": "Vérifie que les éléments <img> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.",
    "a11ycore_img_altPresent_summary_fail": "Attribut alt manquant sur <img>.",
    "a11ycore_img_altPresent_hint_fail": "Ajoutez un attribut alt (utilisez alt=\"\" uniquement pour les images décoratives).",
    "a11ycore_area_altPresent_title": "<area> doit avoir un attribut alt",
    "a11ycore_area_altPresent_description": "Vérifie que les éléments <area> fournissent un attribut alt afin de proposer un mécanisme d’alternative textuelle.",
    "a11ycore_area_altPresent_summary_fail": "Attribut alt manquant sur <area>.",
    "a11ycore_area_altPresent_hint_fail": "Ajoutez un attribut alt (utilisez alt=\"\" uniquement pour les zones décoratives).",
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
    "a11ycore_formControl_programmaticLabelPresent_title": "Les contrôles de formulaire doivent avoir un libellé programmatique",
    "a11ycore_formControl_programmaticLabelPresent_description": "Vérifie que les contrôles de formulaire ont un libellé programmatique via <label>, aria-label ou aria-labelledby.",
    "a11ycore_formControl_programmaticLabelPresent_summary_fail": "Le contrôle de formulaire n’a pas de libellé programmatique.",
    "a11ycore_formControl_programmaticLabelPresent_hint_fail": "Associez un <label>, ou utilisez aria-label / aria-labelledby (placeholder/title ne sont pas des libellés).",
    "a11ycore_formControlAccessibleName_description": "Échec lorsqu’un contrôle de formulaire applicable n’a pas de nom accessible (ex. label, aria-label, aria-labelledby).",
    "a11ycore_formControlAccessibleName_hint_fail": "Fournissez un nom accessible via un <label>, aria-label ou aria-labelledby.",
    "a11ycore_formControlAccessibleName_summary_fail": "Le contrôle de formulaire n’a pas de nom accessible.",
    "a11ycore_formControlAccessibleName_title": "Les champs de formulaire doivent avoir un nom accessible.",
    "a11ycore_linksTargetBlankNoopener_description": "Échec lorsqu’un lien avec target=\"_blank\" n’inclut pas rel=\"noopener\" (risque de sécurité via window.opener).",
    "a11ycore_linksTargetBlankNoopener_hint_cantTell": "Ajoutez rel=\"noopener\" (et éventuellement noreferrer) aux liens avec target=\"_blank\".",
    "a11ycore_linksTargetBlankNoopener_summary_cantTell": "Lien avec target=\"_blank\" sans rel=\"noopener\".",
    "a11ycore_linksTargetBlankNoopener_title": "Les liens qui s’ouvrent dans un nouvel onglet doivent utiliser rel=\"noopener\".",
    "a11ycore_manualReview_description": "Cette règle renvoie toujours cantTell et nécessite une vérification manuelle.",
    "a11ycore_manualReview_hint_cantTell": "Examinez la page et validez ce point manuellement selon le contexte.",
    "a11ycore_manualReview_summary_cantTell": "Vérification manuelle requise.",
    "a11ycore_manualReview_title": "Vérification manuelle requise.",
    "rules.a11ycore-img-alt-suspicious.meta.title": "Texte alternatif suspect nécessitant une vérification",
    "rules.a11ycore-img-alt-suspicious.meta.description": "Identifie les images dont le texte alternatif correspond à des motifs suspects courants (nom de fichier, URL, texte fictif ou terme générique) et nécessite une vérification manuelle.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.summary": "Le texte alternatif de l’image semble suspect (« {{alt}} » ressemble à {{pattern}}) et nécessite une vérification.",
    "rules.a11ycore-img-alt-suspicious.occurrence.cantTell.hint": "Vérifiez le texte alternatif. Évitez les noms de fichiers, les URL, les textes fictifs ou les termes génériques, et assurez-vous que l’alternative textuelle décrit la fonction ou le contenu de l’image dans son contexte.",
    "a11ycore_formControl_programmaticLabelQuality_title": "Les champs de formulaire ne devraient pas dépendre du placeholder ou du title comme libellé principal",
    "a11ycore_formControl_programmaticLabelQuality_description": "Signale les champs de formulaire dont le nom accessible est principalement dérivé du placeholder ou de l’attribut title. Préférez un <label> ou aria-labelledby.",
    "a11ycore_formControl_programmaticLabelQuality_summary_cantTell": "Le libellé principal du champ provient de {{methodLabel}}.",
    "a11ycore_formControl_programmaticLabelQuality_hint_cantTell": "Préférez un <label> persistant ou aria-labelledby. Évitez d’utiliser placeholder/title comme libellé principal.",
    "a11ycore_html_lang_attr_title": "La langue de la page est déclarée",
    "a11ycore_html_lang_attr_description": "Vérifie que la langue par défaut de la page est déclarée de manière programmatique.",
    "a11ycore_html_lang_attr_missing_absent": "La langue par défaut de la page n’est pas déclarée.",
    "a11ycore_html_lang_attr_hint_missing_absent": "Ajoutez un attribut lang à l’élément <html> (par exemple : <html lang=\"fr\">).",
    "a11ycore_html_lang_attr_missing_empty": "La langue par défaut de la page est déclarée mais vide.",
    "a11ycore_html_lang_attr_hint_missing_empty": "Renseignez une valeur de langue valide dans l’attribut lang de l’élément <html> (par exemple : <html lang=\"fr\">).",
    "a11ycore_html_lang_attr_invalid": "La langue par défaut de la page est déclarée, mais la valeur « {{lang}} » n’est pas une balise de langue valide.",
    "a11ycore_html_lang_attr_hint_invalid": "Utilisez une balise de langue BCP 47 valide dans <html lang=\"…\"> (par exemple : « fr », « en », « fr-FR »).",
    "a11ycore_mediaTranscriptPresent_title": "Média temporel : preuve de transcription ou d’alternative textuelle",
    "a11ycore_mediaTranscriptPresent_description": "Détecte les éléments audio et vidéo pour lesquels la présence d’une transcription ou d’une autre alternative textuelle n’est pas clairement établie dans le contenu de la page. Cette règle est volontairement conservatrice et retourne cantTell lorsque la preuve est absente ou invérifiable.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_missing": "Aucune transcription ou autre alternative textuelle pour ce média temporel n’est clairement établie sur la page.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_missing": "Fournir une transcription ou une autre alternative textuelle clairement identifiée pour les médias préenregistrés audio seuls ou vidéo seuls, par exemple une section ou un lien « Transcription » visible.",
    "a11ycore_mediaTranscriptPresent_summary_cantTell_unverified": "Une transcription ou une autre alternative textuelle peut être disponible pour ce média temporel, mais elle n’a pas pu être vérifiée à partir du contenu de la page.",
    "a11ycore_mediaTranscriptPresent_hint_cantTell_unverified": "Aucune transcription ou autre alternative textuelle pour cet élément {element} n’est clairement établie sur la page.",
    "a11ycore_pageTitlePresent_title": "La page possède un titre non vide",
    "a11ycore_pageTitlePresent_description": "Vérifie que la page contient un élément <title> non vide permettant d’identifier la page.",
    "a11ycore_pageTitlePresent_summary_fail": "La page ne possède pas de titre non vide.",
    "a11ycore_pageTitlePresent_hint_fail": "Ajouter un élément <title> contenant un texte décrivant le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_title": "Motifs de titres de page pouvant indiquer un manque de descriptivité",
    "a11ycore_pageTitlePatterns_description": "Identifie des motifs de titres de page pouvant indiquer un manque de descriptivité, tels que des titres génériques, dupliqués ou excessivement modélisés. Cette règle fournit des signaux de revue et n’entraîne pas d’échec automatique.",
    "a11ycore_pageTitlePatterns_summary_cantTell": "Le titre de la page peut ne pas être suffisamment descriptif pour identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePresent_summary_fail_missing": "La page ne contient pas d’élément <title>.",
    "a11ycore_pageTitlePresent_summary_fail_empty": "La page contient un élément <title> vide.",
    "a11ycore_pageTitlePatterns_summary_cantTell_duplicateAcrossPages": "Plusieurs pages partagent le même titre, ce qui peut rendre plus difficile la distinction entre les pages ({{duplicateGroups}} groupes dupliqués sur {{pagesAnalyzed}} pages). Exemple : « {{exampleTitle}} ».",
    "a11ycore_pageTitlePatterns_summary_cantTell_templatedAcrossPages": "De nombreux titres de page semblent fortement modélisés, ce qui peut réduire la capacité des titres à distinguer les pages ({{pagesAnalyzed}} pages).",
    "a11ycore_pageTitlePatterns_summary_cantTell_generic": "Le titre de la page est générique et peut ne pas identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_summary_cantTell_veryShort": "Le titre de la page est très court et peut ne pas identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_summary_cantTell_templateLike": "Le titre de la page semble modélisé et peut ne pas identifier le sujet ou l’objectif de la page.",
    "a11ycore_pageTitlePatterns_hint_cantTell": "Vérifier que le titre de la page identifie clairement le sujet ou l’objectif de la page et permet de la distinguer des autres pages.",
    "a11ycore_contrastComputable_title": "Le contraste des couleurs est calculable pour le texte rendu",
    "a11ycore_contrastComputable_description": "Détermine si suffisamment d’informations sont disponibles pour calculer le contraste WCAG du texte visible (ex. pas de dégradés/images/modes de fusion rendant l’arrière-plan indéterminé).",
    "a11ycore_contrastComputable_pass_allComputable": "Le contraste est calculable pour tout le texte éligible ({{eligibleTextCount}} nœud(s) de texte).",
    "a11ycore_contrastComputable_cantTell_generic": "Le contraste peut ne pas être calculable ({{reasonCode}}).",
    "a11ycore_contrastComputable_cantTell_bgImageOrGradient": "Le contraste n’est pas calculable car l’arrière-plan utilise une image ou un dégradé ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_mixBlendMode": "Le contraste n’est pas calculable car mix-blend-mode est utilisé ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_filter": "Le contraste n’est pas calculable car filter/backdrop-filter est utilisé ({{blockerProperty}}={{blockerValue}}).",
    "a11ycore_contrastComputable_cantTell_rootNotOpaque": "Le contraste n’est pas calculable car l’arrière-plan effectif n’est pas totalement opaque à la racine (alpha={{backgroundAlpha}}).",
    "a11ycore_contrastComputable_cantTell_foregroundUnparsable": "Le contraste n’est pas calculable car la couleur de premier plan calculée n’a pas pu être analysée.",
    "a11ycore_contrastComputable_cantTell_engineFailure": "La calculabilité du contraste n’a pas pu être déterminée en raison d’une erreur interne du moteur ({{reasonCode}}).",
    "a11ycore_contrastMinimum_title": "Le texte respecte le contraste minimum (AA)",
    "a11ycore_contrastMinimum_description": "Vérifie que le texte visible atteint un ratio de contraste d’au moins 4,5:1 (texte normal) ou 3,0:1 (grand texte), lorsque le contraste est calculable à partir du CSS.",
    "a11ycore_contrastMinimum_fail_belowThreshold": "L’élément présente un contraste de couleur insuffisant de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).",
    "a11ycore_contrastMinimum_pass_allAboveThreshold": "Tout le texte calculable respecte le contraste minimum (AA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.",
    "a11ycore_contrastMinimum_notApplicable_noComputableText": "Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.",
    "a11ycore_contrastMinimum_cantTell_engineFailure": "Le contraste minimum (AA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).",
    "a11ycore_contrastEnhanced_title": "Le texte respecte le contraste renforcé (AAA)",
    "a11ycore_contrastEnhanced_description": "Vérifie que le texte visible atteint un ratio de contraste d’au moins 7,0:1 (texte normal) ou 4,5:1 (grand texte), lorsque le contraste est calculable à partir du CSS.",
    "a11ycore_dom_textContrastMinimum_title": "Le texte doit avoir un contraste suffisant (minimum)",
    "a11ycore_dom_textContrastMinimum_description": "Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.3 (AA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.",
    "a11ycore_dom_textContrastMinimum_summary_fail": "Contraste de texte insuffisant : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_hint_fail": "Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour cette taille/épaisseur de texte.",
    "a11ycore_dom_textContrastMinimum_summary_pass": "Contraste de texte conforme : {{contrastRatio}}:1 (minimum requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastMinimum_summary_cantTell": "Impossible de calculer fiablement le contraste du texte car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).",
    "a11ycore_dom_textContrastMinimum_hint_cantTell": "Vérifiez manuellement le contraste lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.",
    "a11ycore_contrastEnhanced_fail_belowThreshold": "L’élément présente un contraste de couleur insuffisant renforcé (AAA) de {{ratio}}:1 (premier plan : {{foregroundHex}}, arrière-plan : {{backgroundHex}}, taille de police : {{fontSizePx}}px, graisse de police : {{fontWeightLabel}}). Le ratio de contraste attendu est de {{threshold}}:1 ({{#isLargeText}}texte de grande taille{{/isLargeText}}{{^isLargeText}}texte normal{{/isLargeText}}).",
    "a11ycore_contrastEnhanced_pass_allAboveThreshold": "Tout le texte calculable respecte le contraste renforcé (AAA). Nœuds de texte éligibles : {{eligibleTextCount}}. Calculables : {{computableTextCount}}.",
    "a11ycore_contrastEnhanced_notApplicable_noComputableText": "Aucun texte éligible n’avait un contraste calculable (nœuds de texte éligibles : {{eligibleTextCount}}). Voir la règle de calculabilité du contraste pour les détails.",
    "a11ycore_contrastEnhanced_cantTell_engineFailure": "Le contraste renforcé (AAA) n’a pas pu être déterminé en raison d’une erreur interne du moteur ({{reasonCode}}).",
    "a11ycore_dom_textContrastEnhanced_title": "Le texte doit avoir un contraste suffisant (renforcé)",
    "a11ycore_dom_textContrastEnhanced_description": "Vérifie le contraste du texte visible par rapport à son arrière-plan calculé selon WCAG 2.2 SC 1.4.6 (AAA), en utilisant les styles rendus (taille/épaisseur) pour déterminer le ratio requis.",
    "a11ycore_dom_textContrastEnhanced_summary_fail": "Contraste de texte renforcé insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_hint_fail": "Ajustez la couleur du texte ou l’arrière-plan afin d’atteindre au moins {{requiredRatio}}:1 pour le niveau renforcé (AAA).",
    "a11ycore_dom_textContrastEnhanced_summary_pass": "Contraste de texte renforcé conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} sur arrière-plan {{bgColor}}. Police {{fontSizePx}}px, graisse {{fontWeight}}{{#isBold}}, en gras{{/isBold}}{{#isLargeText}} (grand texte){{/isLargeText}}.",
    "a11ycore_dom_textContrastEnhanced_summary_cantTell": "Impossible de calculer fiablement le contraste renforcé car l’arrière-plan effectif n’est pas déterminable de manière fiable (ex. image, dégradé, vidéo, canvas, transparence ou fusion complexes).",
    "a11ycore_dom_textContrastEnhanced_hint_cantTell": "Vérifiez manuellement le contraste renforcé (AAA) lorsque le texte est superposé à des images/dégradés/transparences ; assurez-vous qu’il respecte {{requiredRatio}}:1 selon la taille/épaisseur calculée.",
    "a11ycore_dom_nonTextContrast_title": "Les composants d’interface et les graphiques doivent avoir un contraste suffisant",
    "a11ycore_dom_nonTextContrast_description": "Vérifie le contraste des informations visuelles non textuelles (contours de composants, états, et objets graphiques porteurs d’information) selon WCAG 2.2 SC 1.4.11 (AA).",
    "a11ycore_dom_nonTextContrast_summary_fail": "Contraste non-textuel insuffisant : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_hint_fail": "Ajustez les couleurs du composant/graphique afin d’atteindre au moins {{requiredRatio}}:1 pour le contour perceptible ou l’information visuelle essentielle.",
    "a11ycore_dom_nonTextContrast_summary_pass": "Contraste non-textuel conforme : {{contrastRatio}}:1 (requis {{requiredRatio}}:1). Premier plan {{fgColor}} par rapport à {{bgColor}}. Composant : {{componentKind}}{{#componentState}} (état : {{componentState}}){{/componentState}}.",
    "a11ycore_dom_nonTextContrast_summary_cantTell": "Impossible de calculer fiablement le contraste non-textuel car l’arrière-plan effectif ou les pixels peints ne sont pas déterminables (ex. image/dégradé/vidéo/canvas, transparence ou fusion complexes).",
    "a11ycore_dom_nonTextContrast_hint_cantTell": "Vérifiez manuellement le contraste du composant/graphique par rapport aux couleurs adjacentes ; assurez-vous qu’il respecte {{requiredRatio}}:1 pour l’information visuelle non textuelle essentielle.",
    "a11ycore_contrastEnhanced_pass_allTextMeetsThreshold": "Tout le texte calculable respecte le contraste renforcé (AAA).",
    "a11ycore_contrastMinimum_pass_allTextMeetsThreshold": "Tout le texte calculable respecte le contraste minimum (AA).",
    "a11ycore_roleImg_textAlternativePresent_title": "Les éléments avec role=\"img\" doivent avoir une alternative textuelle accessible",
    "a11ycore_roleImg_textAlternativePresent_description": "Vérifie que les éléments ayant le rôle \"img\" fournissent une alternative textuelle accessible via aria-label ou aria-labelledby.",
    "a11ycore_roleImg_textAlternativePresent_summary_fail": "L’élément avec le rôle \"img\" ne possède pas d’alternative textuelle accessible.",
    "a11ycore_roleImg_textAlternativePresent_hint_fail": "Fournissez une alternative textuelle à l’aide de aria-label ou de aria-labelledby pointant vers un texte non vide."
  }
};

function normalizeLocale(locale) {
  if (typeof locale !== 'string') return 'en';
  const s = locale.trim();
  return s ? s : 'en';
}

function getLocaleDict(engineOptions) {
  const loc = normalizeLocale(engineOptions && engineOptions.locale);
  return (I18N && I18N[loc]) ? I18N[loc] : (I18N && I18N.en ? I18N.en : {});
}

  function isTruthyMustache(val) {
    if (val === false || val === null || val === undefined) return false;
    if (typeof val === 'number') return val !== 0 && !Number.isNaN(val);
    if (typeof val === 'string') return val.length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }

  function renderMustacheLite(template, params) {
    const str = (typeof template === 'string') ? template : '';
    const ctx = (params && typeof params === 'object') ? params : null;
    if (!str || !ctx) return str;

    // Tokenize: {{...}}
    const tagRe = /\{\{\s*([#^/]?)([^}\s]+)\s*\}\}/g;

    // We render by building an AST-like stack of frames (small + deterministic).
    const root = { type: 'root', key: null, inverted: false, parts: [] };
    const stack = [root];

    let lastIndex = 0;
    let m;

    while ((m = tagRe.exec(str)) !== null) {
      const before = str.slice(lastIndex, m.index);
      if (before) stack[stack.length - 1].parts.push({ type: 'text', value: before });

      const sigil = m[1];           // '', '#', '^', '/'
      const rawKey = m[2] || '';
      const key = String(rawKey).trim();

      if (!key) {
        // Treat empty tags as literal text (no-throw).
        stack[stack.length - 1].parts.push({ type: 'text', value: m[0] });
        lastIndex = tagRe.lastIndex;
        continue;
      }

      if (sigil === '#') {
        const frame = { type: 'section', key, inverted: false, parts: [] };
        stack[stack.length - 1].parts.push(frame);
        stack.push(frame);
      } else if (sigil === '^') {
        const frame = { type: 'section', key, inverted: true, parts: [] };
        stack[stack.length - 1].parts.push(frame);
        stack.push(frame);
      } else if (sigil === '/') {
        // Close section if it matches; otherwise treat as literal.
        const top = stack[stack.length - 1];
        if (top && top.type === 'section' && top.key === key) {
          stack.pop();
        } else {
          stack[stack.length - 1].parts.push({ type: 'text', value: m[0] });
        }
      } else {
        // Variable
        stack[stack.length - 1].parts.push({ type: 'var', key });
      }

      lastIndex = tagRe.lastIndex;
    }

    // Tail text
    const tail = str.slice(lastIndex);
    if (tail) stack[stack.length - 1].parts.push({ type: 'text', value: tail });

    // If we have unclosed sections, we *don’t throw*; we just render them as literal
    // by flattening them with their original markers removed. (Deterministic.)
    function evalParts(parts) {
      let out = '';
      for (const p of parts) {
        if (!p || typeof p !== 'object') continue;
        if (p.type === 'text') out += p.value || '';
        else if (p.type === 'var') {
          const v = Object.prototype.hasOwnProperty.call(ctx, p.key) ? ctx[p.key] : '';
          out += (v === null || v === undefined) ? '' : String(v);
        } else if (p.type === 'section') {
          const v = Object.prototype.hasOwnProperty.call(ctx, p.key) ? ctx[p.key] : undefined;
          const ok = isTruthyMustache(v);
          const shouldRender = p.inverted ? !ok : ok;
          if (shouldRender) out += evalParts(p.parts || []);
        }
      }
      return out;
    }

    return evalParts(root.parts);
  }

  function applyI18nParams(str, params) {
    return renderMustacheLite(str, params);
  }


function t(key, fallback, params, engineOptions) {
  if (typeof key !== 'string' || !key.trim()) return typeof fallback === 'string' ? fallback : '';

  const dict = getLocaleDict(engineOptions);
  const v = dict ? dict[key] : null;

  // fallback to English if missing in requested locale
  const vEn = (I18N && I18N.en) ? I18N.en[key] : null;

  const base =
    (typeof v === 'string' && v) ? v :
    (typeof vEn === 'string' && vEn) ? vEn :
    (typeof fallback === 'string' ? fallback : '');

  return applyI18nParams(base, params);
}

function resolveRuleDefI18n(def, engineOptions) {
  if (!def || typeof def !== 'object') return def;
  const out = { ...def };
  if (out.i18n && typeof out.i18n === 'object') {
    out.title = t(out.i18n.titleKey, out.title, null, engineOptions);
    out.description = t(out.i18n.descriptionKey, out.description, null, engineOptions);
  }
  return out;
}

const POLICY_CONTRACTS = {
  "a11y": {
    "id": "a11y",
    "allowedOutcomes": [
      "fail",
      "pass",
      "cantTell",
      "notApplicable"
    ],
    "allowedConfidence": [
      "high",
      "medium",
      "low"
    ],
    "coerceManualFailToCantTell": true
  },
  "generic": {
    "id": "generic",
    "allowedOutcomes": [
      "fail",
      "pass",
      "cantTell",
      "notApplicable"
    ],
    "allowedConfidence": [
      "high",
      "medium",
      "low"
    ],
    "coerceManualFailToCantTell": false
  }
};

// This is the single source of truth, inlined from src/policy/resolvePolicy.js
const resolvePolicy = (function resolvePolicy(POLICY_CONTRACTS, engineOptions) {
    function normalizePolicyContract(POLICY_CONTRACTS, contract, fallbackId) {
        const fallback = POLICY_CONTRACTS[fallbackId] || POLICY_CONTRACTS.a11y;
        if (typeof contract === 'string') return POLICY_CONTRACTS[contract] || fallback;

        if (contract && typeof contract === 'object') {
            const allowedOutcomes = Array.isArray(contract.allowedOutcomes)
                ? contract.allowedOutcomes.slice()
                : fallback.allowedOutcomes.slice();

            const allowedConfidence = Array.isArray(contract.allowedConfidence)
                ? contract.allowedConfidence.slice()
                : fallback.allowedConfidence.slice();

            return {
                id: (typeof contract.id === 'string' && contract.id.trim())
                    ? contract.id.trim()
                    : (fallback.id || fallbackId || 'custom'),
                allowedOutcomes,
                allowedConfidence,
                coerceManualFailToCantTell:
                    typeof contract.coerceManualFailToCantTell === 'boolean'
                        ? contract.coerceManualFailToCantTell
                        : !!fallback.coerceManualFailToCantTell
            };
        }

        return fallback;
    }

    function normalizePolicyOverrides(policy) {
        const p = (policy && typeof policy === 'object') ? policy : {};
        return {
            allowedOutcomes: Array.isArray(p.allowedOutcomes) ? p.allowedOutcomes.slice() : null,
            allowedConfidence: Array.isArray(p.allowedConfidence) ? p.allowedConfidence.slice() : null,
            coerceManualFailToCantTell: typeof p.coerceManualFailToCantTell === 'boolean' ? p.coerceManualFailToCantTell : null
        };
    }

    const opts = (engineOptions && typeof engineOptions === 'object') ? engineOptions : {};
    const contract = normalizePolicyContract(POLICY_CONTRACTS, opts.policyContract, 'a11y');
    const ov = normalizePolicyOverrides(opts.policy);

    return {
        contractId: contract.id,
        allowedOutcomes: ov.allowedOutcomes || contract.allowedOutcomes.slice(),
        allowedConfidence: ov.allowedConfidence || contract.allowedConfidence.slice(),
        coerceManualFailToCantTell:
            ov.coerceManualFailToCantTell !== null ? ov.coerceManualFailToCantTell : !!contract.coerceManualFailToCantTell
    };
});

function parseCommaList(value, { lower = false } = {}) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const arr = value.map(String).map((s) => s.trim()).filter(Boolean);
    const norm = lower ? arr.map((s) => s.toLowerCase()) : arr.slice();
    // de-dupe while preserving first-seen order (deterministic)
    const seen = new Set();
    const out = [];
    for (const v of norm) {
      if (!seen.has(v)) { seen.add(v); out.push(v); }
    }
    return out;
  }
  if (typeof value !== 'string') return [];
  const raw = value.split(',').map((s) => String(s).trim()).filter(Boolean);
  const norm = lower ? raw.map((s) => s.toLowerCase()) : raw.slice();
  const seen = new Set();
  const out = [];
  for (const v of norm) {
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

function normalizeIncludeMode(mode) {
  const m = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  return m === 'or' ? 'or' : 'and';
}

function hasAnyRunOnlyKeys(runOnly) {
  if (!runOnly || typeof runOnly !== 'object') return false;
  // legacy reference-engine-like: { type:'tag', values:[...] }
  if (runOnly.type === 'tag' && Array.isArray(runOnly.values) && runOnly.values.length) return true;
  if (Array.isArray(runOnly.tags) && runOnly.tags.length) return true;
  if (Array.isArray(runOnly.includeRuleIds) && runOnly.includeRuleIds.length) return true;
  if (Array.isArray(runOnly.excludeRuleIds) && runOnly.excludeRuleIds.length) return true;
  // extended (new)
  if (Array.isArray(runOnly.excludeTags) && runOnly.excludeTags.length) return true;
  if (typeof runOnly.includeMode === 'string' && runOnly.includeMode.trim()) return true;
  return false;
}

/**
 * Normalize the selection object used at runtime.
 *
 * Supported inputs:
 * - legacy runOnly object (arrays)
 * - legacy reference-engine-like runOnly: { type:'tag', values:[...] }
 * - extended runOnly: { includeMode:'and'|'or', excludeTags:[...] }
 *
 * Output shape:
 * { includeMode, tags, excludeTags, includeRuleIds, excludeRuleIds }
 */
function normalizeRunOnly(runOnly) {
  const out = { includeMode: 'and', tags: [], excludeTags: [], includeRuleIds: [], excludeRuleIds: [] };
  if (!runOnly || typeof runOnly !== 'object') return out;

  out.includeMode = normalizeIncludeMode(runOnly.includeMode);

  // legacy reference-engine-like: { type:'tag', values:[...] }
  if (runOnly.type === 'tag' && Array.isArray(runOnly.values)) {
    out.tags = parseCommaList(runOnly.values, { lower: true });
    return out;
  }

  out.tags = parseCommaList(runOnly.tags, { lower: true });
  out.excludeTags = parseCommaList(runOnly.excludeTags, { lower: true });

  out.includeRuleIds = parseCommaList(runOnly.includeRuleIds, { lower: false });
  out.excludeRuleIds = parseCommaList(runOnly.excludeRuleIds, { lower: false });

  return out;
}

/**
 * Resolve effective selection from engineOptions (preferred) or runOnly (legacy).
 *
 * Precedence:
 * - If runOnly is provided and non-empty => use it (legacy behavior, plus extended fields)
 * - Else => derive from engineOptions.rules/tags/includeMode (comma-separated strings)
 */
function resolveEffectiveRunOnly(engineOptions, runOnly) {
  if (hasAnyRunOnlyKeys(runOnly)) return normalizeRunOnly(runOnly);

  const eo = (engineOptions && typeof engineOptions === 'object') ? engineOptions : {};
  const mode = normalizeIncludeMode(eo.includeMode);

  const rules = (eo.rules && typeof eo.rules === 'object') ? eo.rules : null;
  const tags = (eo.tags && typeof eo.tags === 'object') ? eo.tags : null;

  const includeRuleIds = parseCommaList(rules && rules.include, { lower: false });
  const excludeRuleIds = parseCommaList(rules && rules.exclude, { lower: false });

  const includeTags = parseCommaList(tags && tags.include, { lower: true });
  const excludeTags = parseCommaList(tags && tags.exclude, { lower: true });

  return {
    includeMode: mode,
    tags: includeTags,
    excludeTags,
    includeRuleIds,
    excludeRuleIds
  };
}

function ruleIdMatches(candidate, ruleId, engineTag) {
  if (!candidate || !ruleId) return false;
  if (candidate === ruleId) return true;

  const prefix = (engineTag ? String(engineTag) : '') + '-';
  if (ruleId.startsWith(prefix) && candidate === ruleId.slice(prefix.length)) return true;
  if (candidate.startsWith(prefix) && candidate.slice(prefix.length) === ruleId) return true;

  return false;
}

function ruleMatchesRunOnly(def, runOnly, engineTag) {
  const norm = normalizeRunOnly(runOnly);
  const includeMode = normalizeIncludeMode(norm.includeMode);

  const defTags = Array.isArray(def.tags) ? def.tags.map((t) => String(t).toLowerCase()) : [];

  const hasIdInclude = norm.includeRuleIds.length > 0;
  const hasTagInclude = norm.tags.length > 0;

  let idMatch = true;
  let tagMatch = true;

  if (hasIdInclude) {
    idMatch = norm.includeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
  }
  if (hasTagInclude) {
    tagMatch = defTags.some((t) => norm.tags.includes(t));
  }

  // Includes
  if (hasIdInclude || hasTagInclude) {
    if (includeMode === 'or' && hasIdInclude && hasTagInclude) {
      if (!(idMatch || tagMatch)) return false;
    } else {
      // 'and' semantics (or only one include dimension present)
      if (hasIdInclude && !idMatch) return false;
      if (hasTagInclude && !tagMatch) return false;
    }
  }

  // Excludes (always subtractive; apply after include)
  if (norm.excludeRuleIds.length) {
    const blocked = norm.excludeRuleIds.some((id) => ruleIdMatches(id, def.ruleId, engineTag || ENGINE_TAG));
    if (blocked) return false;
  }

  if (norm.excludeTags.length) {
    const blockedTag = defTags.some((t) => norm.excludeTags.includes(t));
    if (blockedTag) return false;
  }

  return true;
}

function normalizeRuleResult(def, raw, schemaVersion, policy, helpers) {
  if (!policy || typeof policy !== 'object') {
    throw new Error('normalizeRuleResult requires a resolved policy');
  }
  const pol = policy;
  const out = raw && typeof raw === 'object' ? { ...raw } : {};
  out.ruleId = def.ruleId;
  
  // NOTE: title and description are included here (already localized)
  // so consumers do not need to rejoin with the rule catalog.
  out.title = def.title;
  out.description = def.description;
  out.i18n = def.i18n || null;

  if (!pol.allowedOutcomes.includes(out.outcome)) out.outcome = 'cantTell';

  out.outcomeNormalized =
    out.outcome === 'notApplicable' ? 'inapplicable' : out.outcome;
    
    const output = (out.engineOptions && out.engineOptions.output && typeof out.engineOptions.output === 'object')
    ? out.engineOptions.output
    : null;

  const includeSelector = !(output && output.includeSelector === false);
  const includeHtml = !(output && output.includeHtml === false);

  const needsDetails = (out.outcome === 'fail' || out.outcome === 'cantTell');

  // Manual rules must never "fail" automatically
  if (pol.coerceManualFailToCantTell && (def.type === 'manual' || out.type === 'manual') && out.outcome === 'fail') {
    out.outcome = 'cantTell';
    out.outcomeNormalized = 'cantTell';
    out.error = (out.error ? String(out.error) + ' | ' : '') + 'Manual rules cannot return outcome=fail; coerced to cantTell.';
  }

  out.severity = out.severity || def.defaultSeverity;

  let conf = raw && raw.confidence;
  if (!pol.allowedConfidence.includes(conf)) conf = def.defaultConfidence;
  out.confidence = conf;

  out.type = def.type;

  // Standards-only metadata passthrough for traceability
  out.meta = {
    ruleId: def.ruleId,
    ruleInterfaceVersion: def.ruleInterfaceVersion,
    ruleVersion: def.ruleVersion,
    normative: def.normative,
    atomic: def.atomic,
    category: def.category || null,
    normativeMappings: Array.isArray(def.normativeMappings) ? def.normativeMappings.map((o) => ({ ...o })) : [],
    informativeReferences: Array.isArray(def.informativeReferences) ? def.informativeReferences.map((o) => ({ ...o })) : [],
    standard: def.standard || null,
    applicability: def.applicability || '',
    expectation: def.expectation || '',
    references: Array.isArray(def.references) ? def.references.slice() : [],
    requirements: def.requirements || null,
    mappings: def.mappings || null
  };

  out.schemaVersion = schemaVersion;

  const occ = Array.isArray(out.occurrences) ? out.occurrences : [];
  out.occurrences = occ.map((item) => {
    const o = item && typeof item === 'object' ? { ...item } : {};

    // Engine-side finalization (only if rule reported a node)
    const node = o.__node || null;
    if (node) delete o.__node;

    if (needsDetails && node && helpers && typeof helpers === 'object') {
      if (includeSelector && (!o.selector || typeof o.selector !== 'string')) {
        try {
          o.selector = (typeof helpers.buildSelector === 'function') ? String(helpers.buildSelector(node) || '') : '';
        } catch {
          o.selector = '';
        }
      }
      if (includeHtml && (!o.html || typeof o.html !== 'string')) {
        try {
          o.html = (typeof helpers.getOuterHtmlSnippet === 'function') ? String(helpers.getOuterHtmlSnippet(node) || '') : '';
        } catch {
          o.html = '';
        }
      }
    }

    // Enforce string types (deterministic / no-throw)
    if (typeof o.selector !== 'string') o.selector = '';
    if (typeof o.summary !== 'string') o.summary = '';
    if (typeof o.hint !== 'string') o.hint = '';
    if (typeof o.html !== 'string') o.html = '';

    // Existing i18n normalization/resolution (leave as-is, shown shortened here)
    if (o.i18n && typeof o.i18n === 'object' && !Array.isArray(o.i18n)) {
      const ii = { ...o.i18n };
      if (typeof ii.summaryKey !== 'string') ii.summaryKey = '';
      if (typeof ii.hintKey !== 'string') ii.hintKey = '';
      if (ii.params && typeof ii.params === 'object' && !Array.isArray(ii.params)) {
        ii.params = { ...ii.params };
      } else {
        ii.params = {};
      }
      o.i18n = ii;

      if (ii.summaryKey) o.summary = t(ii.summaryKey, o.summary, ii.params, out.engineOptions || null);
      if (ii.hintKey) o.hint = t(ii.hintKey, o.hint, ii.params, out.engineOptions || null);
    } else {
      o.i18n = null;
    }

    return o;
  });

  if (raw && raw.error) out.error = String(raw.error);

  return out;
}

function toCatalogEntry(r, engineOptions) {
  return {
    ruleId: r.ruleId,
    title: (r && r.i18n ? t(r.i18n.titleKey, r.title, null, engineOptions) : r.title),
    description: (r && r.i18n ? t(r.i18n.descriptionKey, r.description, null, engineOptions) : r.description),
    i18n: r.i18n || null,
    helpUrl: r.helpUrl,
    tags: Array.isArray(r.tags) ? r.tags.slice() : [],
    normativeMappings: Array.isArray(r.normativeMappings) ? r.normativeMappings.map((o) => ({ ...o })) : [],
    informativeReferences: Array.isArray(r.informativeReferences) ? r.informativeReferences.map((o) => ({ ...o })) : [],
    defaultSeverity: r.defaultSeverity,
    defaultConfidence: r.defaultConfidence,
    type: r.type,
    coverage: r.coverage || null,

    data: (r.data === undefined ? null : r.data),

    ruleInterfaceVersion: r.ruleInterfaceVersion,
    ruleVersion: r.ruleVersion,
    normative: r.normative,
    atomic: r.atomic,
    category: r.category || null,
    standard: r.standard || null,
    applicability: r.applicability || '',
    expectation: r.expectation || '',
    references: Array.isArray(r.references) ? r.references.slice() : [],
    requirements: r.requirements || null,
    mappings: r.mappings || null
  };
}

// Inlined from src/core/contrast-helpers.js
const createContrastHelpers = (function createContrastHelpers(opts, shared) {
    const window = opts && opts.window ? opts.window : null;

    const trim = shared.trim;
    const computedStyle = shared.computedStyle;
    const composedParent = shared.composedParent;
    const buildSimpleSelector = shared.buildSimpleSelector;

    const clamp01 = (n) => {
        const x = Number(n);
        if (Number.isNaN(x)) return 0;
        if (x < 0) return 0;
        if (x > 1) return 1;
        return x;
    };

    const clamp255 = (n) => {
        const x = Number(n);
        if (Number.isNaN(x)) return 0;
        if (x < 0) return 0;
        if (x > 255) return 255;
        return x;
    };

    // -------- Shared per-run caches (shared.__contrastSharedCache lifetime is per engine run) --------

    function __getSharedWeakMapCache(propName) {
        try {
            const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
            if (!sc) return null;
            const existing = sc[propName];
            if (existing && typeof existing.get === 'function' && typeof existing.set === 'function') return existing;
            const wm = new WeakMap();
            sc[propName] = wm;
            return wm;
        } catch (_e) {
            return null;
        }
    }

    function __getSharedTextScanCache() {
        try {
            const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
            if (!sc) return null;

            if (
                sc.__textScanCache &&
                typeof sc.__textScanCache.get === 'function' &&
                typeof sc.__textScanCache.set === 'function' &&
                typeof sc.__textScanCache.has === 'function'
            ) {
                return sc.__textScanCache;
            }

            try {
                Object.defineProperty(sc, '__textScanCache', {
                    value: new Map(),
                    writable: false,
                    enumerable: false,
                    configurable: true
                });
            } catch {
                sc.__textScanCache = new Map();
            }
            return sc.__textScanCache;
        } catch {
            return null;
        }
    }

    function __getSharedColorParseCache() {
        try {
            const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
            if (!sc) return null;

            if (sc.__colorParseCache && typeof sc.__colorParseCache.get === 'function') {
                return sc.__colorParseCache;
            }
            const m = new Map();
            sc.__colorParseCache = m;
            return m;
        } catch (_e) {
            return null;
        }
    }

    // -------- Computed style memoization (per element, per run) --------

    const __localComputedStyleCache = new WeakMap();
    const __computedStyleCache = __getSharedWeakMapCache('__computedStyleCache') || __localComputedStyleCache;

    function __contrastComputedStyle(el) {
        try {
            if (!el || el.nodeType !== 1) return computedStyle(el);
            if (__computedStyleCache.has(el)) return __computedStyleCache.get(el);
            const cs = computedStyle(el);
            __computedStyleCache.set(el, cs);
            return cs;
        } catch {
            // Always no-throw: return empty object on any failure
            try {
                const cs = computedStyle(el);
                if (el && el.nodeType === 1) __computedStyleCache.set(el, cs);
                return cs;
            } catch {
                return {};
            }
        }
    }

    // Cache common booleans per element (per run)
    const __localHasBgImgCache = new WeakMap();
    const __localHasBlendModeCache = new WeakMap();
    const __localHasFilterCache = new WeakMap();
    const __hasBgImgCache = __getSharedWeakMapCache('__hasBgImgCache') || __localHasBgImgCache;
    const __hasBlendModeCache = __getSharedWeakMapCache('__hasBlendModeCache') || __localHasBlendModeCache;
    const __hasFilterCache = __getSharedWeakMapCache('__hasFilterCache') || __localHasFilterCache;


    // Cache parsed colors / numeric opacity per element (per run)
    const __localOpacityFloatCache = new WeakMap();
    const __opacityFloatCache = __getSharedWeakMapCache('__opacityFloatCache') || __localOpacityFloatCache;

    const __localBgColorRgbaCache = new WeakMap();
    const __bgColorRgbaCache = __getSharedWeakMapCache('__bgColorRgbaCache') || __localBgColorRgbaCache;

    const __localFgColorRgbaCache = new WeakMap();
    const __fgColorRgbaCache = __getSharedWeakMapCache('__fgColorRgbaCache') || __localFgColorRgbaCache;

    function __opacityFloat(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));
            if (__opacityFloatCache.has(el)) return __opacityFloatCache.get(el);
            const o = clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));
            __opacityFloatCache.set(el, o);
            return o;
        } catch {
            return 1;
        }
    }

    function __bgColorRgba(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return parseCssColorToRgba(cs && cs.backgroundColor);
            if (__bgColorRgbaCache.has(el)) return __bgColorRgbaCache.get(el);
            const c = parseCssColorToRgba(cs && cs.backgroundColor);
            __bgColorRgbaCache.set(el, c);
            return c;
        } catch {
            return null;
        }
    }

    function __fgColorRgba(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return parseCssColorToRgba(cs && cs.color);
            if (__fgColorRgbaCache.has(el)) return __fgColorRgbaCache.get(el);
            const c = parseCssColorToRgba(cs && cs.color);
            __fgColorRgbaCache.set(el, c);
            return c;
        } catch {
            return null;
        }
    }

    // -------- Visibility mode resolution for getTextScan --------

    function __getVisibilityMode(engineOptions) {
        const m = engineOptions && typeof engineOptions.visibilityMode === 'string' ? engineOptions.visibilityMode : '';
        return m || 'styleOnly';
    }

    function __resolveVisibilityMode(ctx, engineOptions, d, w) {
        // If getTextScan was called with a direct string (unlikely, but safe)
        if (typeof engineOptions === 'string') return engineOptions;

        const candidates = [
            engineOptions,

            // common shapes
            ctx && ctx.engineOptions,
            ctx && ctx.options && ctx.options.engineOptions,
            ctx && ctx.options,
            ctx && ctx.opts && ctx.opts.engineOptions,
            ctx && ctx.opts,

            // policy layering shapes
            ctx && ctx.policyOverrides && ctx.policyOverrides.engineOptions,
            ctx && ctx.policyOverrides,
            ctx && ctx.policy && ctx.policy.engineOptions,
            ctx && ctx.policy,

            // sometimes hoisted
            ctx,

            // opts passed into createContrastHelpers
            opts && opts.engineOptions,
            opts && opts.options && opts.options.engineOptions,
            opts && opts.options,
            opts && opts.opts && opts.opts.engineOptions,
            opts && opts.opts,

            opts && opts.policyOverrides && opts.policyOverrides.engineOptions,
            opts && opts.policyOverrides,
            opts && opts.policy && opts.policy.engineOptions,
            opts && opts.policy,

            // globals sometimes used by runners
            w && w.__a11ycoreEngineOptions,
            d && d.__a11ycoreEngineOptions
        ];

        for (const c of candidates) {
            if (!c || typeof c !== 'object') continue;

            if (typeof c.visibilityMode === 'string') return c.visibilityMode;

            if (
                c.engineOptions &&
                typeof c.engineOptions === 'object' &&
                typeof c.engineOptions.visibilityMode === 'string'
            ) {
                return c.engineOptions.visibilityMode;
            }

            if (
                c.options &&
                typeof c.options === 'object' &&
                c.options.engineOptions &&
                typeof c.options.engineOptions === 'object' &&
                typeof c.options.engineOptions.visibilityMode === 'string'
            ) {
                return c.options.engineOptions.visibilityMode;
            }

            if (
                c.policy &&
                typeof c.policy === 'object' &&
                c.policy.engineOptions &&
                typeof c.policy.engineOptions === 'object' &&
                typeof c.policy.engineOptions.visibilityMode === 'string'
            ) {
                return c.policy.engineOptions.visibilityMode;
            }

            if (
                c.policyOverrides &&
                typeof c.policyOverrides === 'object' &&
                c.policyOverrides.engineOptions &&
                typeof c.policyOverrides.engineOptions === 'object' &&
                typeof c.policyOverrides.engineOptions.visibilityMode === 'string'
            ) {
                return c.policyOverrides.engineOptions.visibilityMode;
            }
        }

        return 'styleOnly';
    }

    function __asEligibilityBool(v) {
        if (typeof v === 'boolean') return v;
        if (v && typeof v === 'object' && typeof v.eligible === 'boolean') return v.eligible;
        return !!v;
    }

    function getTextScan(ctx, helpers, engineOptions) {
        try {
            const d = (ctx && ctx.document) || (opts && opts.document) || null;

            const w =
                (ctx && ctx.window) ||
                (d && d.defaultView) ||
                window ||
                null;

            const rawMode = __resolveVisibilityMode(ctx, engineOptions, d, w);

            const visibilityMode =
                __getVisibilityMode({ visibilityMode: rawMode }) === 'styleAndGeometry'
                    ? 'styleAndGeometry'
                    : 'styleOnly';

            if (!d || typeof d.createTreeWalker !== 'function') {
                return { eligibleTextCount: 0, elements: [], visibilityMode };
            }

            const cache = __getSharedTextScanCache();
            const cacheKey = `visibilityMode=${visibilityMode}`;
            if (cache && cache.has(cacheKey)) return cache.get(cacheKey);

            const walkRoot = d.body || d.documentElement || d;

            const SHOW_TEXT =
                (w && w.NodeFilter && typeof w.NodeFilter.SHOW_TEXT === 'number')
                    ? w.NodeFilter.SHOW_TEXT
                    : 4;

            const walker = d.createTreeWalker(walkRoot, SHOW_TEXT, null);

            const isNonEmptyText = (t) => t != null && /\S/.test(String(t));

            const elToCount = new WeakMap();
            const elements = [];
            let eligibleTextCount = 0;

            const eligCache = new WeakMap();

            const isVisibleEligible = (el) => {
                if (!helpers || typeof helpers.isDomVisibleEligible !== 'function') return true;
                if (eligCache.has(el)) return eligCache.get(el);

                let ok = true;
                try {
                    const r = helpers.isDomVisibleEligible(el, ctx, { visibilityMode });
                    ok = __asEligibilityBool(r);
                } catch {
                    ok = false;
                }

                eligCache.set(el, ok);
                return ok;
            };

            let node = null;
            let guard = 0;

            while ((node = walker.nextNode()) && guard++ < 500000) {
                const text = node && node.nodeValue;
                if (!isNonEmptyText(text)) continue;

                const el =
                    node.parentElement ||
                    (node.parentNode && node.parentNode.nodeType === 1 ? node.parentNode : null);

                if (!el) continue;
                if (!isVisibleEligible(el)) continue;

                eligibleTextCount++;

                const prev = elToCount.get(el);
                if (prev === undefined) {
                    elToCount.set(el, 1);
                    elements.push(el);
                } else {
                    elToCount.set(el, prev + 1);
                }
            }

            const out = Object.freeze({
                eligibleTextCount,
                visibilityMode,
                elements: Object.freeze(
                    elements.map((el) => Object.freeze({ el, textCount: elToCount.get(el) || 0 }))
                )
            });

            if (cache) cache.set(cacheKey, out);
            return out;
        } catch {
            return { eligibleTextCount: 0, elements: [], visibilityMode: 'styleOnly' };
        }
    }

    // -------- Formatting helpers --------

    function toHex2(n) {
        const x = clamp255(n);
        const s = x.toString(16).toLowerCase();
        return s.length === 1 ? '0' + s : s;
    }

    function rgbToHex(rgb) {
        try {
            if (!rgb || typeof rgb !== 'object') return '';
            return '#' + toHex2(rgb.r) + toHex2(rgb.g) + toHex2(rgb.b);
        } catch {
            return '';
        }
    }

    // 96px/in, 72pt/in => 1px = 0.75pt
    function pxToPt(px) {
        const x = parseFloat(px);
        if (!Number.isFinite(x)) return '';
        return (x * 0.75).toFixed(1);
    }

    function fontWeightLabel(fontWeightNum) {
        const w = Number(fontWeightNum);
        if (Number.isFinite(w) && w >= 700) return 'bold';
        return 'normal';
    }

    function round2(n) {
        const x = Number(n);
        if (!Number.isFinite(x)) return '0.00';
        return (Math.round(x * 100) / 100).toFixed(2);
    }

    function rgbaToString(rgba) {
        if (!rgba || typeof rgba !== 'object') return '';
        const r = clamp255(rgba.r);
        const g = clamp255(rgba.g);
        const b = clamp255(rgba.b);
        const a = clamp01(rgba.a);
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }

    function parsePx(value) {
        if (value == null) return null;

        if (typeof value === 'number' && Number.isFinite(value)) return value;

        const s = String(value).trim().toLowerCase();
        if (!s) return null;

        const n = parseFloat(s);
        if (!Number.isFinite(n)) return null;

        if (s.endsWith('px')) return n;
        if (s.endsWith('pt')) return n * (96 / 72);

        if (s.endsWith('rem')) return n * 16;
        if (s.endsWith('em')) return n * 16;
        if (s.endsWith('%')) return (n / 100) * 16;

        return n;
    }

    function normalizeFontWeight(v) {
        const s = trim(v).toLowerCase();
        if (!s) return 400;
        if (s === 'normal') return 400;
        if (s === 'bold' || s === 'bolder') return 700;
        if (s === 'lighter') return 300;
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) ? n : 400;
    }

    function isLargeText(fontSizePx, fontWeightNum) {
        const size = parseFloat(fontSizePx);
        const w = Number(fontWeightNum);
        if (!Number.isFinite(size)) return false;
        if (size >= 24) return true;
        if (size >= 18.6667 && Number.isFinite(w) && w >= 700) return true;
        return false;
    }

    function requiredRatio(level, large) {
        const l = String(level || '').toUpperCase();
        if (l === 'AAA') return large ? 4.5 : 7.0;
        return large ? 3.0 : 4.5;
    }

    // -------- CSS color parsing + memoization --------

    const __localColorParseCache = new Map();
    const __colorParseCache = __getSharedColorParseCache() || __localColorParseCache;

    function __normalizeCssColorCacheKey(input) {
        const raw = input == null ? '' : String(input);
        let s = trim(raw).toLowerCase();
        if (!s) return '';
        s = s.replace(/\s+/g, ' ');
        s = s.replace(/\s*,\s*/g, ',');
        s = s.replace(/\(\s+/g, '(');
        s = s.replace(/\s+\)/g, ')');
        s = s.replace(/\s*\/\s*/g, '/');
        s = s.replace(/\s*%\s*/g, '%');
        return s;
    }

    function __parseCssColorToRgbaUncached(input) {
        const s = trim(input).toLowerCase();
        if (!s) return null;
        if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

        if (s[0] === '#') {
            const hex = s.slice(1);
            const isHex = /^[0-9a-f]+$/i.test(hex);
            if (!isHex) return null;

            const hexToInt = (h) => Number.parseInt(h, 16);

            try {
                if (hex.length === 3) {
                    const r = hexToInt(hex[0] + hex[0]);
                    const g = hexToInt(hex[1] + hex[1]);
                    const b = hexToInt(hex[2] + hex[2]);
                    return { r, g, b, a: 1 };
                }
                if (hex.length === 4) {
                    const r = hexToInt(hex[0] + hex[0]);
                    const g = hexToInt(hex[1] + hex[1]);
                    const b = hexToInt(hex[2] + hex[2]);
                    const a = hexToInt(hex[3] + hex[3]) / 255;
                    return { r, g, b, a: clamp01(a) };
                }
                if (hex.length === 6) {
                    const r = hexToInt(hex.slice(0, 2));
                    const g = hexToInt(hex.slice(2, 4));
                    const b = hexToInt(hex.slice(4, 6));
                    return { r, g, b, a: 1 };
                }
                if (hex.length === 8) {
                    const r = hexToInt(hex.slice(0, 2));
                    const g = hexToInt(hex.slice(2, 4));
                    const b = hexToInt(hex.slice(4, 6));
                    const a = hexToInt(hex.slice(6, 8)) / 255;
                    return { r, g, b, a: clamp01(a) };
                }
            } catch {}
            return null;
        }

        const m = s.match(/^rgba?\((.*)\)$/);

        // Modern space-separated: rgb(0 0 0 / 0.5)
        if (m && m[1] && m[1].indexOf(',') === -1) {
            const body = trim(m[1]);
            const parts2 = body.split('/').map((x) => trim(x));
            const rgbPart = parts2[0] || '';
            const aPart = parts2[1] || '';

            const rgbNums = rgbPart.split(/\s+/).map((x) => trim(x)).filter(Boolean);
            if (rgbNums.length >= 3) {
                const parseChannel2 = (t) => {
                    if (!t) return null;
                    if (t.endsWith('%')) {
                        const p = Number.parseFloat(t);
                        if (!Number.isFinite(p)) return null;
                        return clamp255(Math.round((p / 100) * 255));
                    }
                    const n = Number.parseFloat(t);
                    if (!Number.isFinite(n)) return null;
                    return clamp255(Math.round(n));
                };

                const r = parseChannel2(rgbNums[0]);
                const g = parseChannel2(rgbNums[1]);
                const b = parseChannel2(rgbNums[2]);
                if (r == null || g == null || b == null) return null;

                let a = 1;
                if (aPart) {
                    if (aPart.endsWith('%')) {
                        const p = Number.parseFloat(aPart);
                        if (Number.isFinite(p)) a = clamp01(p / 100);
                    } else {
                        const n = Number.parseFloat(aPart);
                        if (Number.isFinite(n)) a = clamp01(n);
                    }
                }

                return { r, g, b, a };
            }
        }

        // Comma-separated: rgb(0,0,0) / rgba(0,0,0,0.5)
        if (m && m[1]) {
            const parts = m[1].split(',').map((x) => trim(x));
            if (parts.length < 3) return null;

            const parseChannel = (t) => {
                if (!t) return null;
                if (t.endsWith('%')) {
                    const p = Number.parseFloat(t);
                    if (!Number.isFinite(p)) return null;
                    return clamp255(Math.round((p / 100) * 255));
                }
                const n = Number.parseFloat(t);
                if (!Number.isFinite(n)) return null;
                return clamp255(Math.round(n));
            };

            const r = parseChannel(parts[0]);
            const g = parseChannel(parts[1]);
            const b = parseChannel(parts[2]);
            if (r == null || g == null || b == null) return null;

            let a = 1;
            if (parts.length >= 4) {
                const t = parts[3];
                if (t && t.endsWith('%')) {
                    const p = Number.parseFloat(t);
                    if (Number.isFinite(p)) a = clamp01(p / 100);
                } else {
                    const n = Number.parseFloat(t);
                    if (Number.isFinite(n)) a = clamp01(n);
                }
            }
            return { r, g, b, a };
        }

        return null;
    }

    function parseCssColorToRgba(input) {
        const key = __normalizeCssColorCacheKey(input);
        if (!key) return null;
        if (__colorParseCache.has(key)) return __colorParseCache.get(key);

        const out = __parseCssColorToRgbaUncached(key);
        __colorParseCache.set(key, out);
        return out;
    }

    // -------- Color math --------

    function compositeRgba(src, dst) {
        const s = src && typeof src === 'object' ? src : { r: 0, g: 0, b: 0, a: 0 };
        const d = dst && typeof dst === 'object' ? dst : { r: 0, g: 0, b: 0, a: 0 };

        const as = clamp01(s.a);
        const ad = clamp01(d.a);

        const outA = as + ad * (1 - as);
        if (outA <= 0) return { r: 0, g: 0, b: 0, a: 0 };

        const rs = clamp255(s.r);
        const gs = clamp255(s.g);
        const bs = clamp255(s.b);

        const rd = clamp255(d.r);
        const gd = clamp255(d.g);
        const bd = clamp255(d.b);

        const outR = (rs * as + rd * ad * (1 - as)) / outA;
        const outG = (gs * as + gd * ad * (1 - as)) / outA;
        const outB = (bs * as + bd * ad * (1 - as)) / outA;

        return {
            r: clamp255(Math.round(outR)),
            g: clamp255(Math.round(outG)),
            b: clamp255(Math.round(outB)),
            a: clamp01(outA)
        };
    }

    function srgbToLinear(c) {
        const cs = Number(c) / 255;
        if (cs <= 0.03928) return cs / 12.92;
        return Math.pow((cs + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(rgb) {
        const r = srgbToLinear(clamp255(rgb.r));
        const g = srgbToLinear(clamp255(rgb.g));
        const b = srgbToLinear(clamp255(rgb.b));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrastRatio(fgRgb, bgRgb) {
        const L1 = relativeLuminance(fgRgb);
        const L2 = relativeLuminance(bgRgb);
        const lighter = Math.max(L1, L2);
        const darker = Math.min(L1, L2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function truncateCssValue(v, maxLen) {
        const s = trim(v);
        const n = (Number(maxLen) | 0) > 10 ? (Number(maxLen) | 0) : 80;
        if (s.length <= n) return s;
        return s.slice(0, n - 3) + '...';
    }

    function hasBackgroundImageOrGradient(style) {
        try {
            const v = style && style.backgroundImage;
            return !!(v && String(v).trim() && String(v).trim().toLowerCase() !== 'none');
        } catch {
            return false;
        }
    }

    function hasBlendMode(style) {
        try {
            const v = style && style.mixBlendMode;
            return !!(v && String(v).trim() && String(v).trim().toLowerCase() !== 'normal');
        } catch {
            return false;
        }
    }

    function hasFilter(style) {
        try {
            const f = style && style.filter;
            const bf = style && style.backdropFilter;
            const fOn = f && String(f).trim().toLowerCase() !== 'none';
            const bfOn = bf && String(bf).trim().toLowerCase() !== 'none';
            return !!(fOn || bfOn);
        } catch {
            return false;
        }
    }

    function __hasBackgroundImageOrGradientEl(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return hasBackgroundImageOrGradient(cs);
            if (__hasBgImgCache.has(el)) return __hasBgImgCache.get(el);
            const v = hasBackgroundImageOrGradient(cs);
            __hasBgImgCache.set(el, v);
            return v;
        } catch {
            return false;
        }
    }

    function __hasBlendModeEl(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return hasBlendMode(cs);
            if (__hasBlendModeCache.has(el)) return __hasBlendModeCache.get(el);
            const v = hasBlendMode(cs);
            __hasBlendModeCache.set(el, v);
            return v;
        } catch {
            return false;
        }
    }

    function __hasFilterEl(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return hasFilter(cs);
            if (__hasFilterCache.has(el)) return __hasFilterCache.get(el);
            const v = hasFilter(cs);
            __hasFilterCache.set(el, v);
            return v;
        } catch {
            return false;
        }
    }

    // -------- Opacity product memoization --------

    const __localOpacityProductCache = new WeakMap();
    const __opacityProductCache = __getSharedWeakMapCache('__opacityProductCache') || __localOpacityProductCache;

    function computeOpacityProduct(el) {
        try {
            if (!el || (typeof el !== 'object' && typeof el !== 'function')) return 1;
            if (__opacityProductCache.has(el)) return __opacityProductCache.get(el);

            let prod = 1;
            let cur = el;
            let guard = 0;
            while (cur && guard++ < 200) {
                if (cur.nodeType !== 1) {
                    cur = composedParent(cur);
                    continue;
                }
                const cs = __contrastComputedStyle(cur);
                const o = __opacityFloat(cur, cs);
                prod *= o;
                cur = composedParent(cur);
                if (prod <= 0) break;
            }

            const out = clamp01(prod);
            __opacityProductCache.set(el, out);
            return out;
        } catch (_e) {
            return 1;
        }
    }

    // -------- Effective foreground/background memoization --------

    const __localEffectiveForegroundCache = new WeakMap();
    const __effectiveForegroundCache =
        __getSharedWeakMapCache('__effectiveForegroundCache') || __localEffectiveForegroundCache;

    function computeEffectiveForeground(el) {
        try {
            if (el && __effectiveForegroundCache.has(el)) return __effectiveForegroundCache.get(el);
        } catch (_e) {}

        const cs = __contrastComputedStyle(el);
        const c = __fgColorRgba(el, cs);
        if (!c) {
            const out = { rgba: null, alpha: 0, opacityProduct: computeOpacityProduct(el) };
            try { if (el) __effectiveForegroundCache.set(el, out); } catch (_e) {}
            return out;
        }

        const op = computeOpacityProduct(el);
        const out = {
            rgba: { r: c.r, g: c.g, b: c.b, a: clamp01(c.a * op) },
            alpha: clamp01(c.a * op),
            opacityProduct: op
        };
        try { if (el) __effectiveForegroundCache.set(el, out); } catch (_e) {}
        return out;
    }

    const __localEffectiveBackgroundCache = new WeakMap();
    const __effectiveBackgroundCache =
        __getSharedWeakMapCache('__effectiveBackgroundCache') || __localEffectiveBackgroundCache;

    function __bgCacheKey(opts2) {
        const profileRaw = opts2 && typeof opts2.profile === 'string' ? opts2.profile : 'strictConformance';
        const profile = String(profileRaw).trim().toLowerCase();
        const rootCanvasFallback = opts2 && typeof opts2.rootCanvasFallback === 'string' ? opts2.rootCanvasFallback : '#ffffff';
        const collectStack = !!(opts2 && opts2.collectStack);
        return `p=${profile}|f=${rootCanvasFallback}|s=${collectStack ? '1' : '0'}`;
    }

    function computeEffectiveBackground(el, opts2) {
        const __bgKey = __bgCacheKey(opts2);
        const __collectStack = !!(opts2 && opts2.collectStack);

        // Only cache when stack collection is off
        if (!__collectStack) {
            try {
                if (el && __effectiveBackgroundCache.has(el)) {
                    const m = __effectiveBackgroundCache.get(el);
                    if (m && typeof m.get === 'function' && m.has(__bgKey)) return m.get(__bgKey);
                }
            } catch (_e) {}
        }

        const profileRaw = opts2 && typeof opts2.profile === 'string' ? opts2.profile : 'strictConformance';
        const profile = String(profileRaw).trim().toLowerCase();
        const rootCanvasFallback = opts2 && typeof opts2.rootCanvasFallback === 'string' ? opts2.rootCanvasFallback : '#ffffff';

        const collectStack = !!(opts2 && opts2.collectStack);
        const stack = collectStack ? [] : null;
        let acc = { r: 0, g: 0, b: 0, a: 0 };

        let cur = el;
        let guard = 0;

        while (cur && guard++ < 200) {
            if (cur.nodeType !== 1) { cur = composedParent(cur); continue; }

            const cs = __contrastComputedStyle(cur);
            const bg = __bgColorRgba(cur, cs);
            const op = __opacityFloat(cur, cs);

            if (bg) {
                const layer = { r: bg.r, g: bg.g, b: bg.b, a: clamp01(bg.a * op) };
                if (collectStack) {
                    stack.push({
                        selector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                        bg: { r: layer.r, g: layer.g, b: layer.b, a: layer.a },
                        opacity: op
                    });
                }
                acc = compositeRgba(layer, acc);
                if (acc.a >= 1) break;
            }

            cur = composedParent(cur);
        }

        let out;
        if (acc.a < 1) {
            if (profile === 'referenceenginecompat') {
                const fb = parseCssColorToRgba(rootCanvasFallback) || { r: 255, g: 255, b: 255, a: 1 };
                acc = compositeRgba(fb, acc);
                out = { ok: false, rgba: acc, alpha: acc.a, stack: stack || [], reasonCode: null };
            } else {
                out = { ok: false, rgba: acc, alpha: acc.a, stack, reasonCode: 'BACKGROUND_NOT_OPAQUE_AT_ROOT' };
            }
        } else {
            out = { ok: true, rgba: acc, alpha: acc.a, stack, reasonCode: null };
        }

        if (!__collectStack && el) {
            try {
                let m = __effectiveBackgroundCache.get(el);
                if (!m) { m = new Map(); __effectiveBackgroundCache.set(el, m); }
                m.set(__bgKey, out);
            } catch (_e) {}
        }

        return out;
    }

    // -------- Selector memoization --------

    const __localSimpleSelectorCache = new WeakMap();
    const __simpleSelectorCache = __getSharedWeakMapCache('__simpleSelectorCache') || __localSimpleSelectorCache;

    function __getSimpleSelectorCached(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return '';
            if (__simpleSelectorCache.has(el)) return __simpleSelectorCache.get(el) || '';
            const s = buildSimpleSelector(el, fallbackTag);
            __simpleSelectorCache.set(el, s || '');
            return s || '';
        } catch (_e) {
            return '';
        }
    }

    // -------- Computability blocker (memoized per element, per run) --------

    const __localComputabilityBlockerCache = new WeakMap();
    const __computabilityBlockerCache =
        __getSharedWeakMapCache('__computabilityBlockerCache') || __localComputabilityBlockerCache;

    function getComputabilityBlocker(el) {
        try {
            if (el && __computabilityBlockerCache.has(el)) return __computabilityBlockerCache.get(el);
        } catch (_e) {}

        let cur = el;
        let guard = 0;
        while (cur && guard++ < 200) {
            if (cur.nodeType !== 1) { cur = composedParent(cur); continue; }
            const cs = __contrastComputedStyle(cur);

            if (__hasBlendModeEl(cur, cs)) {
                const out = {
                    ok: false,
                    reasonCode: 'MIX_BLEND_MODE',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: 'mix-blend-mode',
                    blockerValue: truncateCssValue(cs && cs.mixBlendMode, 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            if (__hasFilterEl(cur, cs)) {
                const isFilter = cs && cs.filter && String(cs.filter).trim().toLowerCase() !== 'none';
                const out = {
                    ok: false,
                    reasonCode: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: isFilter ? 'filter' : 'backdrop-filter',
                    blockerValue: truncateCssValue((isFilter ? cs.filter : cs.backdropFilter) || '', 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            if (__hasBackgroundImageOrGradientEl(cur, cs)) {
                const out = {
                    ok: false,
                    reasonCode: 'BACKGROUND_IMAGE_OR_GRADIENT',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: 'background-image',
                    blockerValue: truncateCssValue(cs && cs.backgroundImage, 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            cur = composedParent(cur);
        }

        const out = { ok: true, reasonCode: null, blockerSelector: '', blockerProperty: '', blockerValue: '' };
        try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
        return out;
    }

    return {
        clamp01,
        clamp255,
        round2,
        rgbaToString,
        parsePx,
        normalizeFontWeight,
        isLargeText,
        requiredRatio,
        parseCssColorToRgba,
        compositeRgba,
        relativeLuminance,
        contrastRatio,
        toHex2,
        rgbToHex,
        pxToPt,
        fontWeightLabel,
        hasBackgroundImageOrGradient,
        hasBlendMode,
        hasFilter,
        computeOpacityProduct,
        computeEffectiveForeground,
        computeEffectiveBackground,
        getComputabilityBlocker,
        getTextScan
    };
});

// Inlined from src/core/dom-helpers.js
const normalizeSelectorList = (function normalizeSelectorList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === 'string') {
        // allow "#a,#b" or "#a, #b"
        return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
});
const createDomHelpers = (function createDomHelpers(opts) {
    const document = opts && opts.document ? opts.document : null;
    const window = opts && opts.window ? opts.window : null;
    // Some engine paths may not pass opts.window; recover it from document when possible.
    const realmWindow =
        window ||
        (document && document.defaultView) ||
        null;
    const root = opts && opts.root ? opts.root : null;
    const includeShadowDom = !!(opts && opts.includeShadowDom);
    const excludeSelectors = Array.isArray(opts && opts.excludeSelectors) ? opts.excludeSelectors : [];

    // -------------------------------------------------------------------------
    // Per-run shared caches (DOM helpers)
    // Stored on the realm window when possible so multiple helper instances
    // within the same run share caches deterministically.
    // -------------------------------------------------------------------------
    var __domSharedCache = {};
    var __selectorCache = null;
    var __outerHtmlCache = null;
    var __idLookupDocCache = null;   // Map<string, Element|null>
    var __idLookupRootCache = null;  // Map<string, Element|null>
    var __idRefCacheByRoot = null;   // WeakMap<object, Map<string, {refs, missing, flags, partsLen}>>
    var __idRefReverseIndexByScope = null; // WeakMap<object, Map<string, Set<Element>>>
    var __uniqIndexByScope = null; // WeakMap<object, object> (selector uniqueness index per scope)
    var __shadowRootsByRoot = null; // WeakMap<object, Array<object>> (cached open shadow roots per root)

    // -------------------------------------------------------------------------
    // Optional per-run performance counters (debug/benchmark only)
    // -------------------------------------------------------------------------
    const __perfEnabled = !!(opts && opts.perfStats);
    const __perf = __perfEnabled ? {enabled: true, counters: Object.create(null)} : null;

    function __perfInc(key, n) {
        if (!__perfEnabled || !__perf) return;
        const k = String(key);
        const add = n == null ? 1 : (Number(n) || 0);
        __perf.counters[k] = (__perf.counters[k] || 0) + add;
    }

    function getPerfStats() {
        if (!__perfEnabled || !__perf) return {enabled: false, counters: {}};
        // Return a shallow copy to prevent accidental mutation by callers
        return {enabled: true, counters: {...__perf.counters}};
    }

    function resetPerfStats() {
        if (!__perfEnabled || !__perf) return;
        __perf.counters = Object.create(null);
    }


    // -------------------------------------------------------------------------
    // Shared escaping helpers (reduce per-call allocations, deterministic)
    // -------------------------------------------------------------------------
    const __w = realmWindow || window;
    const __cssEscapeSafe = (s) => {
        try {
            return __w && __w.CSS && typeof __w.CSS.escape === 'function' ? __w.CSS.escape(String(s)) : String(s);
        } catch {
            return String(s);
        }
    };
    const __cssEscapeIdent = (s) => {
        try {
            if (__w && __w.CSS && typeof __w.CSS.escape === 'function') return __w.CSS.escape(String(s));
        } catch {
        }
        return String(s).replace(/[^a-zA-Z0-9\-_]/g, '\\$&');
    };
    const __escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');


    // --- eligibility utilities ---
    const isElement = (n) => !!n && n.nodeType === 1;
    const computedStyle = (el) => {
        // Per-run memoization scoped by *helper scope* (root/document), to ensure
        // style caching does not bleed across helper instances with different roots.
        // This aligns with eligibility cache scoping semantics locked by tests.
        const scope = (root && typeof root === 'object') ? root : (document && typeof document === 'object' ? document : null);

        let map = null;

        try {
            if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
                map = __computedStyleCacheByScope.get(scope) || null;
                if (map && map.has(el)) {
                    __perfInc('computedStyle.hit');
                    const c = map.get(el);
                    return c && typeof c === 'object' ? c : {};
                }
            }
        } catch { /* ignore */
        }

        __perfInc('computedStyle.miss');
        let cs = {};
        try {
            const w = realmWindow || window;
            cs = w && w.getComputedStyle ? w.getComputedStyle(el) : (el && el.style) || {};
        } catch {
            cs = {};
        }

        try {
            if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
                if (!map) {
                    map = __computedStyleCacheByScope.get(scope) || null;
                    if (!map) {
                        map = new WeakMap();
                        __computedStyleCacheByScope.set(scope, map);
                    }
                }
                map.set(el, cs);
            }
        } catch {
            __perfInc('computedStyle.nocache');
        }

        return cs && typeof cs === 'object' ? cs : {};
    };

    const getOpenModalDialogs = () => {
        // Per-run memoization of open modal dialogs (document-scoped).
        // Safe under engine constraints (no DOM mutation during a run); deterministic.
        if (!document || !document.querySelectorAll) return [];
        if (!__openModalDialogsByDoc) {
            __perfInc('modalDialogs.nocache');
        }
        try {
            if (__openModalDialogsByDoc) {
                const cached = __openModalDialogsByDoc.get(document);
                if (cached) {
                    __perfInc('modalDialogs.hit');
                    return cached;
                }
                __perfInc('modalDialogs.miss');
            }
        } catch {
            __perfInc('modalDialogs.nocache');
        }

        let list = [];
        try {
            const nl = document.querySelectorAll('dialog[open][aria-modal="true"]');
            // Preserve document order, avoid Array.from allocation where possible.
            for (const el of nl) list.push(el);
        } catch {
            list = [];
        }

        try {
            if (__openModalDialogsByDoc) __openModalDialogsByDoc.set(document, list);
        } catch { /* ignore */
        }

        return list;
    };

    const getRootNodeSafe = (n) => {
        try {
            return n && n.getRootNode ? n.getRootNode({composed: true}) : (document || null);
        } catch {
            return document || null;
        }
    };
    const composedParent = (n) => {
        if (!n) return null;
        const p = n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
        if (p) return p;
        const rn = getRootNodeSafe(n);
        return rn && rn.host ? rn.host : null;
    };
    const ancestorsIncludingSelf = (n) => {
        if (!n) return [];
        // Cache ancestor chains per node, per run, to avoid repeated composed-parent walks.
        // Deterministic: purely memoized within the current run, no cross-run persistence.
        try {
            if (__ancestorsIncludingSelfCache && typeof __ancestorsIncludingSelfCache.get === 'function') {
                const cached = __ancestorsIncludingSelfCache.get(n);
                if (cached) {
                    __perfInc('ancestorsIncludingSelf.hit');
                    return cached;
                }
                __perfInc('ancestorsIncludingSelf.miss');
                const out = [];
                let cur = n, guard = 0;
                while (cur && guard++ < 200) {
                    out.push(cur);
                    cur = composedParent(cur);
                }
                __ancestorsIncludingSelfCache.set(n, out);
                return out;
            }
        } catch { /* fall through */
        }

        __perfInc('ancestorsIncludingSelf.nocache');
        const out = [];
        let cur = n, guard = 0;
        while (cur && guard++ < 200) {
            out.push(cur);
            cur = composedParent(cur);
        }
        return out;
    };

    function getClosestMap(el) {
        try {
            if (!isElement(el)) return null;
            return el.closest ? el.closest('map') : null;
        } catch {
            return null;
        }
    }

    function hasBlockingInert(node) {
        // Default behavior: inert anywhere in ancestorsIncludingSelf blocks.
        if (!isElement(node)) return false;

        const tag = (node.tagName || '').toLowerCase();
        const isArea = tag === 'area';

        let mapEl = null;
        if (isArea) mapEl = getClosestMap(node);

        const chain = ancestorsIncludingSelf(node);

        for (const a of chain) {
            if (!isElement(a)) continue;

            // Exception: for <area>, inert on itself or on its <map> does NOT block
            if (isArea) {
                if (a === node) continue;     // ignore <area inert>
                if (mapEl && a === mapEl) continue; // ignore <map inert>
            }

            if (a.hasAttribute && a.hasAttribute('inert')) return true;
        }
        return false;
    }

    const trim = (v) => (v == null ? '' : String(v)).trim();

    const getAttr = (el, name) => {
        try {
            return el && el.getAttribute ? el.getAttribute(name) : null;
        } catch {
            return null;
        }
    };

    function parseTabIndex(el) {
        const raw = getAttr(el, 'tabindex');
        const t = trim(raw);
        if (raw == null || t === '') return {has: false, value: null, valid: false};
        const n = Number(t);
        if (Number.isNaN(n)) return {has: true, value: null, valid: false};
        return {has: true, value: n, valid: true};
    }

    function getPlatformFocusability(el) {
        // Per-run memoization (WeakMap<Element, Result>)
        try {
            if (__focusabilityCache && el && typeof el === 'object' && __focusabilityCache.has(el)) {
                __perfInc('focusability.hit');
                const c = __focusabilityCache.get(el);
                if (c && typeof c === 'object') {
                    return {
                        focusable: !!c.focusable,
                        tabbable: !!c.tabbable,
                        mechanism: c.mechanism || 'none',
                        flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                    };
                }
            }
        } catch {
        }

        __perfInc('focusability.miss');
        let result = null;

        if (!isElement(el)) {
            result = {focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement']};
        } else if (hasBlockingInert(el)) {
            result = {focusable: false, tabbable: false, mechanism: 'none', flags: ['inert']};
        } else {
            const flags = [];
            const disabled = !!(el.matches && el.matches(':disabled'));
            if (disabled) {
                result = {focusable: false, tabbable: false, mechanism: 'disabled', flags: ['disabled']};
            } else {
                const ti = parseTabIndex(el);
                if (ti.has) {
                    if (!ti.valid) result = {
                        focusable: false,
                        tabbable: false,
                        mechanism: 'tabindex',
                        flags: ['tabindex-invalid']
                    };
                    else if (ti.value < 0) result = {
                        focusable: true,
                        tabbable: false,
                        mechanism: 'tabindex',
                        flags: ['tabindex-negative']
                    };
                    else result = {
                            focusable: true,
                            tabbable: true,
                            mechanism: 'tabindex',
                            flags: ['tabindex-nonnegative']
                        };
                } else {
                    // native focusability
                    const native = isPlatformFocusable(el); // uses your existing boolean logic
                    if (native) result = {focusable: true, tabbable: true, mechanism: 'native', flags};
                    else result = {focusable: false, tabbable: false, mechanism: 'none', flags};
                }
            }
        }

        try {
            if (__focusabilityCache && el && typeof el === 'object') {
                __focusabilityCache.set(el, {
                    focusable: !!result.focusable,
                    tabbable: !!result.tabbable,
                    mechanism: result.mechanism || 'none',
                    flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
                });
            }
        } catch {
        }

        return {
            focusable: !!result.focusable,
            tabbable: !!result.tabbable,
            mechanism: result.mechanism || 'none',
            flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
        };
    }

    // --- attribute ---
    function getAttributeInfo(el, attr) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const attrValue = trim(getAttr(el, attr));
        if (!attrValue) return {present: false, value: '', mechanism: attr, flags: ['empty']};

        return {present: true, value: attrValue, mechanism: attr, flags};
    }

    // --- ARIA name primitives (reusable across rules) ---
    function getAriaLabelInfo(el) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const ariaLabel = trim(getAttr(el, 'aria-label'));
        if (!ariaLabel) return {present: false, value: '', mechanism: 'aria-label', flags: ['empty']};

        return {present: true, value: ariaLabel, mechanism: 'aria-label', flags};
    }

    function getAriaLabelledByInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const ariaLabelledBy = trim(getAttr(el, 'aria-labelledby'));
        if (!ariaLabelledBy) return {present: false, value: '', mechanism: 'aria-labelledby', flags: ['missing']};

        const t = getTextFromIdRefs(ariaLabelledBy, _ctx, opts);
        for (const f of t.flags) flags.push(f);

        if (!t.text) flags.push('empty');

        return {
            present: !!t.text,
            value: t.text || '',
            mechanism: 'aria-labelledby',
            refsCount: t.refsCount,
            missing: t.missing ? t.missing.slice(0) : [],
            flags
        };
    }

    /**
     * getAriaNameInfo: ARIA-only name, with correct precedence.
     * aria-labelledby (if non-empty) wins over aria-label.
     */
    function getAriaNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const lb = getAriaLabelledByInfo(el, _ctx, opts);
        if (lb.present && lb.value) return {
            present: true,
            value: lb.value,
            mechanism: 'aria-labelledby',
            flags: flags.concat(lb.flags || [])
        };

        const al = getAriaLabelInfo(el);
        if (al.present && al.value) return {
            present: true,
            value: al.value,
            mechanism: 'aria-label',
            flags: flags.concat(al.flags || [])
        };

        // If aria-labelledby existed but was empty/unresolvable, preserve that info in flags.
        if (trim(getAttr(el, 'aria-labelledby'))) flags.push('aria-labelledby-empty-or-unresolvable');
        if (getAttr(el, 'aria-label') != null && !trim(getAttr(el, 'aria-label'))) flags.push('aria-label-empty');

        return {present: false, value: '', mechanism: 'none', flags};
    }

    const lower = (v) => trim(v).toLowerCase();

    const safeDocGetById = (id) => {
        const key = trim(id);
        if (!key) return null;

        // Shared cache (per run)
        try {
            if (__idLookupDocCache && __idLookupDocCache.has(key)) {
                __perfInc('idLookup.doc.hit');
                return __idLookupDocCache.get(key) || null;
            }
        } catch {
        }

        __perfInc('idLookup.doc.miss');
        let el = null;
        try {
            if (document && document.getElementById) el = document.getElementById(key);
        } catch {
            el = null;
        }

        try {
            if (__idLookupDocCache) __idLookupDocCache.set(key, el || null);
        } catch {
        }

        return el || null;
    };

    const safeRootQueryById = (id) => {
        // Best-effort for cases where root is not the document (e.g. shadow root-like, fragment roots).
        // Note: IDs are document-global in HTML, but test harnesses may use scoped roots.
        const key = trim(id);
        if (!key) return null;
        if (!root || !root.querySelector) return null;

        try {
            const cacheKey = '#' + key;
            if (__idLookupRootCache && __idLookupRootCache.has(cacheKey)) {
                __perfInc('idLookup.root.hit');
                return __idLookupRootCache.get(cacheKey) || null;
            }
        } catch {
        }

        __perfInc('idLookup.root.miss');
        let el = null;
        try {
            el = root.querySelector('#' + key);
        } catch {
            el = null;
        }

        try {
            const cacheKey = '#' + key;
            if (__idLookupRootCache) __idLookupRootCache.set(cacheKey, el || null);
        } catch {
        }

        return el || null;
    };

    function inClosedDetailsContent(node) {
        try {
            if (!isElement(node)) return false;
            const summary = node.closest && node.closest('summary');
            if (summary && summary.contains(node)) return false;
            const details = node.closest && node.closest('details');
            if (details && !details.hasAttribute('open')) return true;
        } catch {
        }
        return false;
    }

    function isPlatformFocusable(el) {
        if (!isElement(el) || hasBlockingInert(el)) return false;
        const tag = (el.tagName || '').toLowerCase();
        const type = (el.getAttribute && (el.getAttribute('type') || '').toLowerCase()) || '';
        const disabled = !!(el.matches && el.matches(':disabled'));
        if (disabled) return false;

        if (tag === 'a') {
            const href = el.getAttribute && el.getAttribute('href');
            if (href && href.trim()) return true;
        }
        if (tag === 'area') {
            // Engine policy: treat <area> as focusable when it's part of a *used* image map.
            const map = getClosestMap(el);
            if (map) {
                const rawName = (map.getAttribute && (map.getAttribute('name') || map.getAttribute('id') || '')).trim();
                if (rawName && document && document.querySelector) {
                    const esc = __cssEscapeSafe;
                    const n = esc(rawName);

                    // Be practical: accept both "#name" and "name", and ignore case.
                    const sels = [
                        `img[usemap="#${n}" i]`,
                        `img[usemap="${n}" i]`
                    ];

                    for (const sel of sels) {
                        try {
                            if (document.querySelector(sel)) return true;
                        } catch {
                        }
                    }
                }
            }
        }
        if (tag === 'input') {
            if (type !== 'hidden') return true;
        }
        if (tag === 'select' || tag === 'textarea' || tag === 'button' || tag === 'summary') return true;
        if (el.hasAttribute && el.hasAttribute('contenteditable')) return true;

        const tabindex = el.getAttribute && el.getAttribute('tabindex');
        if (tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(tabindex))) return true;

        return false;
    }


    function getIdRefReverseIndex(scopeObj) {
        // Reverse index: id token -> referencing elements (aria-labelledby / aria-describedby)
        // Built once per scope per run. Deterministic: querySelectorAll order is document order.
        if (!scopeObj || !scopeObj.querySelectorAll) return null;

        if (!__idRefReverseIndexByScope) {
            __perfInc('idrefReverseIndex.nocache');
            return null;
        }

        try {
            const cached = __idRefReverseIndexByScope.get(scopeObj);
            if (cached) {
                __perfInc('idrefReverseIndex.hit');
                return cached;
            }
        } catch {
            __perfInc('idrefReverseIndex.nocache');
            return null;
        }

        __perfInc('idrefReverseIndex.miss');

        const idx = new Map();
        let refs = [];
        try {
            refs = Array.from(scopeObj.querySelectorAll('[aria-labelledby],[aria-describedby]'));
        } catch {
            refs = [];
        }

        for (const el of refs) {
            if (!isElement(el)) continue;

            // Parse tokens deterministically
            const lb = trim(getAttr(el, 'aria-labelledby'));
            const db = trim(getAttr(el, 'aria-describedby'));

            // Avoid pushing same element twice for the same token when both attrs contain it.
            const pushed = new Set();

            if (lb) {
                const parts = lb.split(/\s+/).filter(Boolean);
                for (const t of parts) {
                    const tok = trim(t);
                    if (!tok || pushed.has(tok)) continue;
                    pushed.add(tok);
                    const arr = idx.get(tok);
                    if (arr) arr.push(el);
                    else idx.set(tok, [el]);
                }
            }

            if (db) {
                const parts = db.split(/\s+/).filter(Boolean);
                for (const t of parts) {
                    const tok = trim(t);
                    if (!tok || pushed.has(tok)) continue;
                    pushed.add(tok);
                    const arr = idx.get(tok);
                    if (arr) arr.push(el);
                    else idx.set(tok, [el]);
                }
            }
        }

        try {
            __idRefReverseIndexByScope.set(scopeObj, idx);
            __perfInc('idrefReverseIndex.build');
        } catch {
            // ignore cache set errors
        }

        return idx;
    }

    function isReferencedByVisibleIdRef(node) {
        if (!document || !isElement(node)) return false;
        const id = node.getAttribute && node.getAttribute('id');
        const idTok = id && id.trim ? id.trim() : '';
        if (!idTok) return false;

        // Prefer reverse-index lookup (single build per run) over repeated querySelectorAll per node.
        const idx = getIdRefReverseIndex(document);
        if (idx && typeof idx.get === 'function') {
            let refs = null;
            try {
                refs = idx.get(idTok) || null;
            } catch {
                refs = null;
            }
            if (refs && refs.length) {
                for (const ref of refs) {
                    if (!isElement(ref)) continue;
                    const elig = isAccTreeEligible(ref); // safe recursion
                    if (elig && elig.eligible) return true;
                }
                return false;
            }
            // If index exists but no references, short-circuit.
            return false;
        }

        // Fallback to querySelectorAll when cache is unavailable.
        const esc = __cssEscapeSafe;
        const idSel = esc(idTok);
        let refs = [];
        try {
            refs = [
                ...Array.from(document.querySelectorAll('[aria-labelledby~="' + idSel + '"]')),
                ...Array.from(document.querySelectorAll('[aria-describedby~="' + idSel + '"]')),
            ];
        } catch {
            refs = [];
        }
        for (const ref of refs) {
            if (!isElement(ref)) continue;
            const elig = isAccTreeEligible(ref); // safe recursion
            if (elig && elig.eligible) return true;
        }
        return false;
    }


    function isExcluded(el) {
        if (!excludeSelectors.length || !el || !el.closest) return false;
        try {
            return excludeSelectors.some((sel) => !!el.closest(sel));
        } catch {
            return false;
        }
    }

    function queryAll(sel) {
        if (!root) return [];
        try {
            return Array.from(root.querySelectorAll(sel));
        } catch {
            return [];
        }
    }

    function queryAllDeep(sel) {
        if (!root) return [];
        // Performance note:
        // Avoid the old "querySelectorAll('*')" approach which is O(N) per shadow host
        // and explodes on huge DOMs. Instead, walk shadow roots only and run the selector
        // in each root once. This keeps work proportional to the number of shadow roots.
        const results = [];
        const seen = new Set();
        const visitedRoots = new Set();

        const pushMatches = (scope) => {
            if (!scope || !scope.querySelectorAll) return;
            let els = [];
            try {
                els = scope.querySelectorAll(sel);
            } catch {
                els = [];
            }
            // NodeList is iterable; avoid Array.from to reduce allocations.
            for (const el of els) {
                if (el && !seen.has(el) && !isExcluded(el)) {
                    seen.add(el);
                    results.push(el);
                }
            }
        };

        const collectShadowRoots = (scope) => {
            if (!scope || !scope.querySelectorAll) return [];

            // Cache shadow root discovery per root to avoid repeated querySelectorAll('*') walks.
            // IMPORTANT: do not cache when excludeSelectors is non-empty (different helpers may differ).
            if (!excludeSelectors.length && __shadowRootsByRoot) {
                try {
                    const cached = __shadowRootsByRoot.get(scope);
                    if (cached) {
                        __perfInc('shadowRoots.hit');
                        return cached;
                    }
                    __perfInc('shadowRoots.miss');

                    let hosts = [];
                    try {
                        hosts = scope.querySelectorAll('*');
                    } catch {
                        hosts = [];
                    }

                    const roots = [];
                    for (const el of hosts) {
                        if (!el || el.nodeType !== 1) continue;
                        const sr = el.shadowRoot;
                        if (sr) roots.push(sr);
                    }

                    try {
                        __shadowRootsByRoot.set(scope, roots);
                    } catch {
                        __perfInc('shadowRoots.nocache');
                    }
                    return roots;
                } catch {
                    __perfInc('shadowRoots.nocache');
                    // fall through to uncached path
                }
            } else {
                __perfInc('shadowRoots.nocache');
            }

            // Uncached path (preserves excludeSelectors filtering semantics).
            let hosts = [];
            try {
                hosts = scope.querySelectorAll('*');
            } catch {
                hosts = [];
            }
            const roots = [];
            for (const el of hosts) {
                if (!el || el.nodeType !== 1) continue;
                if (isExcluded(el)) continue;
                const sr = el.shadowRoot;
                if (sr) roots.push(sr);
            }
            return roots;
        };

        const q = [root];
        for (let qi = 0; qi < q.length; qi++) {
            const curRoot = q[qi];
            if (!curRoot || visitedRoots.has(curRoot)) continue;
            visitedRoots.add(curRoot);

            pushMatches(curRoot);

            const childShadowRoots = collectShadowRoots(curRoot);
            for (const sr of childShadowRoots) q.push(sr);
        }

        return results;
    }

    function queryAllSmart(sel) {
        const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
        return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
    }

    // -------------------------------------------------------------------------
    // Per-run shared caches (DOM helpers)
    // -------------------------------------------------------------------------
    try {
        const w =
            realmWindow ||
            (document && document.defaultView) ||
            (typeof global !== 'undefined' && global.window ? global.window : null);

        if (w) {
            if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
            if (!w.__a11ycoreSharedCache.dom) w.__a11ycoreSharedCache.dom = {};
            __domSharedCache = w.__a11ycoreSharedCache.dom;
        }
    } catch {
        __domSharedCache = {};
    }

    // Selector/snippet caches (per element)
    try {
        __selectorCache = __domSharedCache.selectorCache instanceof WeakMap
            ? __domSharedCache.selectorCache
            : (__domSharedCache.selectorCache = new WeakMap());
    } catch {
        __selectorCache = null;
    }

    try {
        __outerHtmlCache = __domSharedCache.outerHtmlCache instanceof WeakMap
            ? __domSharedCache.outerHtmlCache
            : (__domSharedCache.outerHtmlCache = new WeakMap());
    } catch {
        __outerHtmlCache = null;
    }

    // ID lookups: cache getElementById / root.querySelector(#id) results within a run
    try {
        __idLookupDocCache = __domSharedCache.idLookupDocCache instanceof Map
            ? __domSharedCache.idLookupDocCache
            : (__domSharedCache.idLookupDocCache = new Map());
    } catch {
        __idLookupDocCache = null;
    }

    try {
        __idLookupRootCache = __domSharedCache.idLookupRootCache instanceof Map
            ? __domSharedCache.idLookupRootCache
            : (__domSharedCache.idLookupRootCache = new Map());
    } catch {
        __idLookupRootCache = null;
    }

    // IDREF resolution: cache resolveIdRefs results (root-scoped) within a run
    try {
        __idRefCacheByRoot = __domSharedCache.idRefCacheByRoot instanceof WeakMap
            ? __domSharedCache.idRefCacheByRoot
            : (__domSharedCache.idRefCacheByRoot = new WeakMap());
    } catch {
        __idRefCacheByRoot = null;
    }

    // Reverse index for aria-labelledby/aria-describedby -> id token
    try {
        __idRefReverseIndexByScope = __domSharedCache.idRefReverseIndexByScope instanceof WeakMap
            ? __domSharedCache.idRefReverseIndexByScope
            : (__domSharedCache.idRefReverseIndexByScope = new WeakMap());
    } catch {
        __idRefReverseIndexByScope = null;
    }

    // Selector uniqueness index (per scope) within a run
    try {
        __uniqIndexByScope = __domSharedCache.uniqIndexByScope instanceof WeakMap
            ? __domSharedCache.uniqIndexByScope
            : (__domSharedCache.uniqIndexByScope = new WeakMap());
    } catch {
        __uniqIndexByScope = null;
    }

    // Shadow root discovery cache (per root) within a run.
    // Only used when excludeSelectors is empty to avoid cross-helper bleed.
    try {
        __shadowRootsByRoot = __domSharedCache.shadowRootsByRoot instanceof WeakMap
            ? __domSharedCache.shadowRootsByRoot
            : (__domSharedCache.shadowRootsByRoot = new WeakMap());
    } catch {
        __shadowRootsByRoot = null;
    }


// -------------------------------------------------------------------------
// Additional per-run caches (eligibility / focusability / labeling)
// -------------------------------------------------------------------------
    let __ancestorsIncludingSelfCache = null;
    let __eligibilityAccCache = null;
    let __eligibilityDomCacheByMode = null; // Map<string, WeakMap<Element, Result>>
    let __focusabilityCache = null;
    let __computedStyleCacheByScope = null; // WeakMap<object, WeakMap<Element, CSSStyleDeclaration|object>>
    let __openModalDialogsByDoc = null; // WeakMap<Document, Array<Element>>
    let __ancestorBlockerAccByScope = null; // WeakMap<object, WeakMap<Element, {struct:string|null, css:string|null}>>
    let __ancestorBlockerDomByScope = null; // WeakMap<object, WeakMap<Element, {struct, css, cssKnown, visibility, contentVisHidden, opacity}>>
    let __ancestorBlockerDomStructFinalByScope = null; // WeakMap<object, WeakMap<Element, string|null>> (final structural blocker per element per scope)
    let __labelAssociationCache = null;
    let __labelMethodCache = null;
    let __labelForIndexByDoc = null; // WeakMap<Document, Map<string, {exists:boolean, text:string}>> (label[for] by id cache)
    let __accessibleNameCacheByKey = null; // Map<string, WeakMap<Element, Info>>
    let __accessibleDescCacheByKey = null; // Map<string, WeakMap<Element, Info>>

    try {
        __ancestorsIncludingSelfCache = __domSharedCache.ancestorsIncludingSelfCache instanceof WeakMap
            ? __domSharedCache.ancestorsIncludingSelfCache
            : (__domSharedCache.ancestorsIncludingSelfCache = new WeakMap());
    } catch {
        __ancestorsIncludingSelfCache = null;
    }

    try {
        __eligibilityAccCache = __domSharedCache.eligibilityAccCache instanceof WeakMap
            ? __domSharedCache.eligibilityAccCache
            : (__domSharedCache.eligibilityAccCache = new WeakMap());
    } catch {
        __eligibilityAccCache = null;
    }

    try {
        __eligibilityDomCacheByMode = __domSharedCache.eligibilityDomCacheByMode instanceof Map
            ? __domSharedCache.eligibilityDomCacheByMode
            : (__domSharedCache.eligibilityDomCacheByMode = new Map());
    } catch {
        __eligibilityDomCacheByMode = null;
    }

    try {
        __focusabilityCache = __domSharedCache.focusabilityCache instanceof WeakMap
            ? __domSharedCache.focusabilityCache
            : (__domSharedCache.focusabilityCache = new WeakMap());
    } catch {
        __focusabilityCache = null;
    }

    try {
        __computedStyleCacheByScope = __domSharedCache.computedStyleCacheByScope instanceof WeakMap
            ? __domSharedCache.computedStyleCacheByScope
            : (__domSharedCache.computedStyleCacheByScope = new WeakMap());
    } catch {
        __computedStyleCacheByScope = null;
    }


    try {
        __openModalDialogsByDoc = __domSharedCache.openModalDialogsByDoc instanceof WeakMap
            ? __domSharedCache.openModalDialogsByDoc
            : (__domSharedCache.openModalDialogsByDoc = new WeakMap());
    } catch {
        __openModalDialogsByDoc = null;
    }

    try {
        __ancestorBlockerAccByScope = __domSharedCache.ancestorBlockerAccByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerAccByScope
            : (__domSharedCache.ancestorBlockerAccByScope = new WeakMap());
    } catch {
        __ancestorBlockerAccByScope = null;
    }

    try {
        __ancestorBlockerDomByScope = __domSharedCache.ancestorBlockerDomByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerDomByScope
            : (__domSharedCache.ancestorBlockerDomByScope = new WeakMap());
    } catch {
        __ancestorBlockerDomByScope = null;
    }

    try {
        __ancestorBlockerDomStructFinalByScope = __domSharedCache.ancestorBlockerDomStructFinalByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerDomStructFinalByScope
            : (__domSharedCache.ancestorBlockerDomStructFinalByScope = new WeakMap());
    } catch {
        __ancestorBlockerDomStructFinalByScope = null;
    }


    try {
        __labelAssociationCache = __domSharedCache.labelAssociationCache instanceof WeakMap
            ? __domSharedCache.labelAssociationCache
            : (__domSharedCache.labelAssociationCache = new WeakMap());
    } catch {
        __labelAssociationCache = null;
    }

    try {
        __labelMethodCache = __domSharedCache.labelMethodCache instanceof WeakMap
            ? __domSharedCache.labelMethodCache
            : (__domSharedCache.labelMethodCache = new WeakMap());
    } catch {
        __labelMethodCache = null;
    }


    try {
        __labelForIndexByDoc = __domSharedCache.labelForIndexByDoc instanceof WeakMap
            ? __domSharedCache.labelForIndexByDoc
            : (__domSharedCache.labelForIndexByDoc = new WeakMap());
    } catch {
        __labelForIndexByDoc = null;
    }

    try {
        __accessibleNameCacheByKey = __domSharedCache.accessibleNameCacheByKey instanceof Map
            ? __domSharedCache.accessibleNameCacheByKey
            : (__domSharedCache.accessibleNameCacheByKey = new Map());
    } catch {
        __accessibleNameCacheByKey = null;
    }

    try {
        __accessibleDescCacheByKey = __domSharedCache.accessibleDescCacheByKey instanceof Map
            ? __domSharedCache.accessibleDescCacheByKey
            : (__domSharedCache.accessibleDescCacheByKey = new Map());
    } catch {
        __accessibleDescCacheByKey = null;
    }


    function __getScopeObj() {
        const scopeObj =
            (root && typeof root === 'object') ? root :
                (document && typeof document === 'object') ? document :
                    null;
        return scopeObj;
    }


    function __getLabelForByIdCache(nameKey) {
        // Document-scoped cache for `document.querySelector('label[for="..."]')`.
        // Keeps test semantics (first lookup uses querySelector) while eliminating repeated lookups.
        if (!document || !document.querySelector) return null;
        if (!__labelForIndexByDoc) {
            __perfInc('labelForById.nocache');
            return null;
        }

        try {
            const nk = nameKey == null ? '__default__' : String(nameKey);
            let byKey = __labelForIndexByDoc.get(document);
            if (!(byKey instanceof Map)) {
                __perfInc('labelForById.miss');
                byKey = new Map();
                __labelForIndexByDoc.set(document, byKey);
                __perfInc('labelForById.build');
            }
            const existing = byKey.get(nk);
            if (existing && existing instanceof Map) {
                __perfInc('labelForById.hit');
                return existing;
            }
            __perfInc('labelForById.miss');
            const map = new Map();
            byKey.set(nk, map);
            __perfInc('labelForById.build');
            return map;
        } catch {
            __perfInc('labelForById.nocache');
            return null;
        }
    }

    function __lookupLabelForId(id, nameKey) {
        const key = trim(id);
        if (!key) return null;

        const map = __getLabelForByIdCache(nameKey);
        if (map) {
            if (map.has(key)) return map.get(key) || null;
            // compute and store
            let entry = null;
            try {
                const sel = 'label[for="' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\\"') + '"]';
                const label = document.querySelector(sel);
                if (label && isElement(label)) {
                    let t = '';
                    try {
                        t = trim(label.textContent);
                    } catch {
                        t = '';
                    }
                    entry = {exists: true, text: t};
                } else {
                    entry = {exists: false, text: ''};
                }
            } catch {
                entry = {exists: false, text: ''};
            }
            try {
                map.set(key, entry);
            } catch {
            }
            return entry && entry.exists ? entry : null;
        }

        // No cache available: fallback to direct querySelector
        try {
            const sel = 'label[for="' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\\"') + '"]';
            const label = document.querySelector(sel);
            if (label && isElement(label)) {
                let t = '';
                try {
                    t = trim(label.textContent);
                } catch {
                    t = '';
                }
                return {exists: true, text: t};
            }
        } catch {
        }
        return null;
    }

    function __getEligibilityAccCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__domSharedCache) return null;
        try {
            const wmByScope =
                __domSharedCache.eligibilityAccCacheByScope instanceof WeakMap
                    ? __domSharedCache.eligibilityAccCacheByScope
                    : (__domSharedCache.eligibilityAccCacheByScope = new WeakMap());

            let perScope = wmByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                wmByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getEligibilityDomCacheForScope(modeKey) {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__domSharedCache) return null;
        try {
            const wmByScope =
                __domSharedCache.eligibilityDomCacheByScope instanceof WeakMap
                    ? __domSharedCache.eligibilityDomCacheByScope
                    : (__domSharedCache.eligibilityDomCacheByScope = new WeakMap());

            let perScopeMap = wmByScope.get(scopeObj);
            if (!(perScopeMap instanceof Map)) {
                perScopeMap = new Map();
                wmByScope.set(scopeObj, perScopeMap);
            }

            let perMode = perScopeMap.get(modeKey);
            if (!(perMode instanceof WeakMap)) {
                perMode = new WeakMap();
                perScopeMap.set(modeKey, perMode);
            }
            return perMode;
        } catch {
            return null;
        }
    }


    function __getAncestorBlockerAccCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerAccByScope) return null;
        try {
            let perScope = __ancestorBlockerAccByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerAccByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getAncestorBlockerDomCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerDomByScope) return null;
        try {
            let perScope = __ancestorBlockerDomByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerDomByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getAncestorBlockerDomStructFinalCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerDomStructFinalByScope) return null;
        try {
            let perScope = __ancestorBlockerDomStructFinalByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerDomStructFinalByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }


    function __getDomEligibilityModeKey(opts) {
        const mode = opts && opts.visibilityMode === 'styleAndGeometry' ? 'styleAndGeometry' : 'styleOnly';
        const disableGeometry = !!(opts && opts.disableGeometry === true);
        return mode + '|' + (disableGeometry ? 'dg1' : 'dg0');
    }

    function __getNameOptsKey(opts) {
        // Only include options that affect this helper's output.
        const disallowContents = !!(opts && opts.disallowContents === true);
        const maxRefs = opts && opts.maxRefs != null ? (Number(opts.maxRefs) | 0) : -1;
        return (disallowContents ? 'dc1' : 'dc0') + '|mr' + String(maxRefs);
    }

    function __getDescOptsKey(opts) {
        const allowTitle = !!(opts && opts.allowTitle === true);
        const maxRefs = opts && opts.maxRefs != null ? (Number(opts.maxRefs) | 0) : -1;
        return (allowTitle ? 'at1' : 'at0') + '|mr' + String(maxRefs);
    }

    function getOuterHtmlSnippet(el) {
        if (!el || typeof el !== 'object') return '';
        try {
            if (__outerHtmlCache && __outerHtmlCache.has(el)) {
                __perfInc('outerHtml.hit');
                return __outerHtmlCache.get(el) || '';
            }
        } catch {
        }

        __perfInc('outerHtml.miss');

        let out = '';
        try {
            const html = el.outerHTML || '';
            if (html.length > 2000) out = html.slice(0, 2000) + '…';
            else out = html;
        } catch {
            out = '';
        }

        try {
            if (__outerHtmlCache && el && typeof el === 'object') __outerHtmlCache.set(el, out);
        } catch {
        }
        return out;
    }

// --- Accessibility-tree eligibility (ordered checks) ---
    function isAccTreeEligible(node) {
        // Cache is per-scope (root/document) to avoid cross-run leakage.
        const __accCache = __getEligibilityAccCacheForScope();
        const __ancBlockCache = __getAncestorBlockerAccCacheForScope();

        if (!isElement(node)) {
            return {eligible: false, reasons: ['notElement']};
        }

        try {
            if (__accCache && node && typeof node === 'object' && __accCache.has(node)) {
                const c = __accCache.get(node);
                if (c && typeof c === 'object') {
                    return {
                        eligible: !!c.eligible,
                        reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : []
                    };
                }
            }
        } catch {
        }

        const reasons = [];

        function __cacheAndReturn(res) {
            const out = {
                eligible: !!(res && res.eligible),
                reasons: (res && Array.isArray(res.reasons)) ? res.reasons.slice(0) : []
            };
            try {
                if (__accCache && node && typeof node === 'object') {
                    __accCache.set(node, {eligible: out.eligible, reasons: out.reasons.slice(0)});
                }
            } catch {
            }
            return out;
        }

        const chain = ancestorsIncludingSelf(node);

        // 1) HTML/DOM hiding
        for (const a of chain) {
            if (!isElement(a)) continue;

            // Ancestor structural blockers are scope-cached (per run) to avoid repeated checks.
            let struct = null;
            try {
                if (__ancBlockCache && __ancBlockCache.has(a)) {
                    __perfInc('ancestorBlockerAcc.struct.hit');
                    const cached = __ancBlockCache.get(a);
                    struct = cached && cached.struct ? String(cached.struct) : null;
                } else {
                    __perfInc('ancestorBlockerAcc.struct.miss');
                    const tn = (a.tagName || '').toLowerCase();
                    if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
                    else if (tn === 'template') struct = 'templateContent';
                    else if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') struct = 'nonRenderedElement';
                    else if (tn === 'input') {
                        const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                        if (t === 'hidden') struct = 'inputHidden';
                    }
                    try {
                        try {
                            if (__ancBlockCache) {
                                const prev = __ancBlockCache.has(a) ? (__ancBlockCache.get(a) || null) : null;
                                __ancBlockCache.set(a, {
                                    struct,
                                    css: prev && prev.css ? prev.css : null,
                                    cssKnown: prev && prev.cssKnown === true ? true : false
                                });
                            }
                        } catch {
                            __perfInc('ancestorBlockerAcc.struct.nocache');
                        }
                    } catch {
                        __perfInc('ancestorBlockerAcc.struct.nocache');
                    }
                }
            } catch { /* ignore */
            }

            if (struct) return __cacheAndReturn({eligible: false, reasons: [struct]});
        }
        if (inClosedDetailsContent(node)) return __cacheAndReturn({eligible: false, reasons: ['detailsClosed']});

        // 2) Inertness / modality
        if (hasBlockingInert(node)) {
            return __cacheAndReturn({eligible: false, reasons: ['inert']});
        }
        // Modal dialog (best effort)
        try {
            const openModals = getOpenModalDialogs();
            if (openModals.length) {
                let inside = false;
                for (const d of openModals) {
                    if (d && d.contains && d.contains(node)) {
                        inside = true;
                        break;
                    }
                }
                if (!inside) return __cacheAndReturn({eligible: false, reasons: ['modalInert']});
            }
        } catch {
        }

        // 3) CSS rendering suppression
        for (const a of chain) {
            if (!isElement(a)) continue;

            // <area> is a non-rendered element; some DOMs report display:none for it.
            // Don’t treat the *area itself* as ineligible based on computed style.
            if (a === node) {
                const tn = (a.tagName || '').toLowerCase();
                if (tn === 'area') continue;
            }

            // Cache ancestor CSS blockers (display/visibility) per scope.
            let cssBlock = null;
            let cssKnown = false;
            try {
                if (__ancBlockCache && __ancBlockCache.has(a)) {
                    const cached = __ancBlockCache.get(a);
                    if (cached && cached.cssKnown === true) {
                        __perfInc('ancestorBlockerAcc.css.hit');
                        cssKnown = true;
                        cssBlock = cached.css ? String(cached.css) : null;
                    } else {
                        __perfInc('ancestorBlockerAcc.css.miss');
                    }
                } else {
                    __perfInc('ancestorBlockerAcc.css.miss');
                }
            } catch {
            }

            if (!cssKnown) {
                const cs = computedStyle(a);
                if (cs && cs.display === 'none') cssBlock = 'displayNone';
                else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) cssBlock = 'visibilityHidden';

                try {
                    if (__ancBlockCache) {
                        const prev = __ancBlockCache.has(a) ? (__ancBlockCache.get(a) || null) : null;
                        __ancBlockCache.set(a, {
                            struct: prev && prev.struct ? prev.struct : null,
                            css: cssBlock || null,
                            cssKnown: true
                        });
                    }
                } catch {
                    __perfInc('ancestorBlockerAcc.css.nocache');
                }
            }

            if (cssBlock === 'displayNone') return __cacheAndReturn({eligible: false, reasons: ['displayNone']});
            if (cssBlock === 'visibilityHidden') return __cacheAndReturn({
                eligible: false,
                reasons: ['visibilityHidden']
            });
        }

        // 4) ARIA subtree hiding with exceptions with exceptions
        let ariaHidden = false;
        for (const a of chain) {
            if (!isElement(a)) continue;
            const v = a.getAttribute && a.getAttribute('aria-hidden');
            if (v != null && String(v).trim().toLowerCase() === 'true') {
                ariaHidden = true;
                break;
            }
        }
        if (ariaHidden) {
            const idref = isReferencedByVisibleIdRef(node);

            // IDREF exception stays
            if (idref) return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenIdref']});

            // Only *explicit* tabbable focus (tabindex >= 0) overrides aria-hidden by default.
            // Native focusability alone does not override aria-hidden EXCEPT for specific
            // mechanisms where the engine must still evaluate (e.g. <area> in a *used* map,
            // and <input type="image">).
            const ti = parseTabIndex(node);
            if (ti.has && ti.valid && ti.value >= 0) {
                return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenTabbable']});
            }

            // Programmatic focus (explicit tabindex < 0) does NOT override eligibility.
            if (ti.has && ti.valid && ti.value < 0) {
                return __cacheAndReturn({eligible: false, reasons: ['ariaHiddenProgrammaticFocusExcluded']});
            }

            // Exception: allow aria-hidden override for mechanisms where the engine must
            // still evaluate required labeling/alt rules. Keep this narrowly scoped.
            const tag = (node.tagName || '').toLowerCase();
            const type = tag === 'input'
                ? ((node.getAttribute && (node.getAttribute('type') || '').toLowerCase()) || '')
                : '';

            // Native form controls are tabbable by default (even without tabindex)
            // and are targeted by labeling rules.
            const isNativeFormControl =
                tag === 'select' ||
                tag === 'textarea' ||
                (tag === 'input' && type !== 'hidden'); // includes type=image

            if (tag === 'area' || isNativeFormControl) {
                const f2 = getPlatformFocusability(node);
                if (f2 && f2.tabbable) {
                    return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenTabbable']});
                }
            }

            return __cacheAndReturn({eligible: false, reasons: ['ariaHidden']});
        }

        // 5/6 handled implicitly; 7 already covered
        return __cacheAndReturn({eligible: true, reasons});
    }

    function isDomVisibleEligible(node, _ctx, opts) {
        const reasons = [];
        const out = (visible, reasonsArr, metrics) => ({
            eligible: !!visible,
            reasons: reasonsArr.slice(0),
            metrics: metrics && typeof metrics === 'object' ? {...metrics} : {}
        });

        if (!isElement(node)) return out(false, ['notElement'], {});

        const __modeKey = __getDomEligibilityModeKey(opts);
        const __domCache = __getEligibilityDomCacheForScope(__modeKey);

        const __ancBlockDomCache = __getAncestorBlockerDomCacheForScope();
        const __ancBlockStructFinalCache = __getAncestorBlockerDomStructFinalCacheForScope();

        try {
            if (__domCache && node && typeof node === 'object' && __domCache.has(node)) {
                const c = __domCache.get(node);
                if (c && typeof c === 'object') {
                    return {
                        eligible: !!c.eligible,
                        reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : [],
                        metrics: c.metrics && typeof c.metrics === 'object' ? {...c.metrics} : {}
                    };
                }
            }
        } catch {
        }

        function __cacheAndReturn(res) {
            const outRes = {
                eligible: !!(res && res.eligible),
                reasons: (res && Array.isArray(res.reasons)) ? res.reasons.slice(0) : [],
                metrics: (res && res.metrics && typeof res.metrics === 'object') ? {...res.metrics} : {}
            };
            try {
                if (__domCache && node && typeof node === 'object') {
                    __domCache.set(node, {
                        eligible: outRes.eligible,
                        reasons: outRes.reasons.slice(0),
                        metrics: {...outRes.metrics}
                    });
                }
            } catch {
            }
            return outRes;
        }

        // 1) HTML hiding
        // Final short-circuit: reuse structural blocker result for this node when already known.
        try {
            if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(node)) {
                __perfInc('ancestorBlockerDom.structFinal.hit');
                const r = __ancBlockStructFinalCache.get(node);
                const rr = (r != null && r !== '') ? String(r) : null;
                if (rr) return __cacheAndReturn(out(false, [rr], {}));
            } else {
                __perfInc('ancestorBlockerDom.structFinal.miss');
            }
        } catch {
        }

        const chain = ancestorsIncludingSelf(node);
        const __domStructSeen = [];
        for (const a of chain) {
            if (!isElement(a)) continue;

            __domStructSeen.push(a);

            // If an ancestor already has a final structural blocker cached,
            // short-circuit immediately (this is what the test expects).
            try {
                if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(a)) {
                    __perfInc('ancestorBlockerDom.structFinal.hit');
                    const r = __ancBlockStructFinalCache.get(a);
                    const rr = (r != null && r !== '') ? String(r) : null;
                    if (rr) {
                        // Propagate to nodes we've seen on this walk (including `node`)
                        try {
                            for (const s of __domStructSeen) {
                                if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, rr);
                            }
                        } catch {
                        }
                        return __cacheAndReturn(out(false, [rr], {}));
                    }
                }
            } catch {
            }

            // Cached structural blockers (per scope) to short-circuit shared ancestor checks.
            let struct = null;
            try {
                if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
                    __perfInc('ancestorBlockerDom.struct.hit');
                    const cached = __ancBlockDomCache.get(a);
                    struct = cached && cached.struct ? String(cached.struct) : null;
                } else {
                    __perfInc('ancestorBlockerDom.struct.miss');
                    const tn = (a.tagName || '').toLowerCase();
                    if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
                    else if (tn === 'template') struct = 'templateContent';
                    else if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') struct = 'nonRenderedElement';
                    else if (tn === 'input') {
                        const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                        if (t === 'hidden') struct = 'inputHidden';
                    }
                    try {
                        if (__ancBlockDomCache) {
                            const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                            __ancBlockDomCache.set(a, {
                                struct,
                                css: prev && prev.css ? prev.css : null,
                                cssKnown: prev && prev.cssKnown === true ? true : false,
                                visibility: prev && prev.visibility ? prev.visibility : null,
                                contentVisHidden: prev && prev.contentVisHidden === true ? true : null,
                                opacity: prev && typeof prev.opacity === 'number' ? prev.opacity : null
                            });
                        }
                    } catch {
                        __perfInc('ancestorBlockerDom.struct.nocache');
                    }

                }
            } catch {
            }

            if (struct) {
                try {
                    if (__ancBlockStructFinalCache) {
                        for (const s of __domStructSeen) {
                            if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, struct);
                        }
                    }
                } catch {
                }
                return __cacheAndReturn(out(false, [struct], {}));
            }
        }

        try {
            if (__ancBlockStructFinalCache) {
                for (const s of __domStructSeen) {
                    if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, null);
                }
            }
        } catch {
        }

        // Closed <details> hides content visually
        if (inClosedDetailsContent(node)) return __cacheAndReturn(out(false, ['detailsClosed'], {}));

        // 2) CSS visibility suppression + opacity chain
        let opacityProduct = 1;
        for (const a of chain) {
            if (!isElement(a)) continue;

            let cssBlock = null;
            let cssKnown = false;

            let cachedVisibility = null;
            let cachedContentVisHidden = null;
            let cachedOpacity = null;
            let cs = null;

            try {
                if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
                    const cached = __ancBlockDomCache.get(a);
                    if (cached) {
                        // cssKnown means "we already computed display/visibility/content-visibility once"
                        if (cached.cssKnown === true) {
                            __perfInc('ancestorBlockerDom.css.hit');
                            cssKnown = true;
                            cssBlock = cached.css ? String(cached.css) : null;
                        } else {
                            __perfInc('ancestorBlockerDom.css.miss');
                        }

                        cachedVisibility = cached.visibility != null ? String(cached.visibility) : null;
                        cachedContentVisHidden = cached.contentVisHidden === true ? true : null;
                        cachedOpacity =
                            (typeof cached.opacity === 'number' && Number.isFinite(cached.opacity))
                                ? cached.opacity
                                : null;
                    }
                } else {
                    __perfInc('ancestorBlockerDom.css.miss');
                }
            } catch {
            }

            // Compute CSS blockers (and maybe opacity) only when needed
            if (!cssKnown && cachedContentVisHidden !== true) {
                cs = computedStyle(a);

                if (cs && cs.display === 'none') cssBlock = 'displayNone';
                else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
                    cssBlock = 'visibilityHidden';
                    cachedVisibility = cs.visibility;
                } else if (cs && cs.contentVisibility === 'hidden') {
                    cssBlock = 'contentVisibilityHidden';
                    cachedContentVisHidden = true;
                }

                // NEW: parse opacity once and cache it (even if cssBlock is null)
                if (cachedOpacity == null) {
                    try {
                        const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
                        const parsed = Number.parseFloat(raw);
                        if (Number.isFinite(parsed)) cachedOpacity = parsed;
                    } catch {
                    }
                }

                try {
                    if (__ancBlockDomCache) {
                        const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                        __ancBlockDomCache.set(a, {
                            struct: prev && prev.struct ? prev.struct : null,
                            css: cssBlock || null,
                            cssKnown: true,
                            visibility: cachedVisibility || (prev && prev.visibility ? prev.visibility : null),
                            contentVisHidden: cachedContentVisHidden === true ? true : (prev && prev.contentVisHidden === true ? true : null),
                            opacity: cachedOpacity == null ? (prev && typeof prev.opacity === 'number' ? prev.opacity : null) : cachedOpacity
                        });
                    }
                } catch {
                    __perfInc('ancestorBlockerDom.css.nocache');
                }
            }

            if (cssBlock === 'displayNone') return __cacheAndReturn(out(false, ['displayNone'], {}));
            if (cssBlock === 'visibilityHidden') {
                return __cacheAndReturn(out(false, ['visibilityHidden'], {visibility: cachedVisibility || 'hidden'}));
            }
            if (cssBlock === 'contentVisibilityHidden') {
                return __cacheAndReturn(out(false, ['contentVisibilityHidden'], {}));
            }

            // If opacity isn't cached yet, compute once and write it back even when cssBlock was cached.
            // This prevents repeated computedStyle(a) calls across many isDomVisibleEligible() invocations.
            if (cachedOpacity == null) {
                try {
                    if (!cs) cs = computedStyle(a);
                    const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
                    const parsed = Number.parseFloat(raw);
                    if (Number.isFinite(parsed)) {
                        cachedOpacity = parsed;

                        // Write back to cache without disturbing other fields
                        try {
                            if (__ancBlockDomCache) {
                                const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                                if (prev) {
                                    __ancBlockDomCache.set(a, {
                                        struct: prev.struct || null,
                                        css: prev.css || null,
                                        visibility: prev.visibility || null,
                                        contentVisHidden: prev.contentVisHidden === true ? true : null,
                                        opacity: cachedOpacity
                                    });
                                } else {
                                    __ancBlockDomCache.set(a, {
                                        struct: null,
                                        css: cssBlock || null,
                                        visibility: cachedVisibility || null,
                                        contentVisHidden: cachedContentVisHidden === true ? true : null,
                                        opacity: cachedOpacity
                                    });
                                }
                            }
                        } catch {}
                    }
                } catch {}
            }

            // opacity handling (visual)
            const op = cachedOpacity != null ? cachedOpacity : 1;
            opacityProduct *= op;
            if (opacityProduct <= 0.0001) {
                return __cacheAndReturn(out(false, ['opacityZero'], { opacity: opacityProduct }));
            }
        }

        // 3) Layout/geometry (optional)
        const visibilityMode =
            opts && opts.visibilityMode === 'styleAndGeometry'
                ? 'styleAndGeometry'
                : 'styleOnly';

        const useGeometry =
            visibilityMode === 'styleAndGeometry' &&
            !(opts && opts.disableGeometry === true);

        if (useGeometry) {
            try {
                if (node.getClientRects) {
                    const rects = node.getClientRects();
                    const rectCount = rects ? rects.length : 0;

                    if (!rectCount) {
                        return __cacheAndReturn(out(false, ['noClientRects'], {rectCount: 0}));
                    }

                    const r = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
                    const w = r && Number.isFinite(r.width) ? r.width : 0;
                    const h = r && Number.isFinite(r.height) ? r.height : 0;

                    if (w <= 0 || h <= 0) {
                        return __cacheAndReturn(out(false, ['zeroArea'], {rectCount, width: w, height: h}));
                    }

                    return __cacheAndReturn(out(true, reasons, {
                        rectCount,
                        width: w,
                        height: h,
                        opacity: opacityProduct
                    }));
                }
            } catch {
                // ignore geometry failures; fall back to style-only eligibility
            }
        }

        return __cacheAndReturn(out(true, reasons, {opacity: opacityProduct}));
    }

    function getEligibilityInfo(node, _ctx, opts) {
        const targetSet = opts && (opts.targetSet === 'acc' || opts.targetSet === 'dom') ? opts.targetSet : 'dom';
        const r = targetSet === 'dom' ? isDomVisibleEligible(node, _ctx, opts) : isAccTreeEligible(node);
        return {
            eligible: !!(r && r.eligible),
            reasons: (r && Array.isArray(r.reasons)) ? r.reasons.slice(0) : [],
            targetSet,
            accEligible: targetSet === 'acc' ? !!(r && r.eligible) : null,
        };
    }

    // E) IDREF helpers
    function resolveIdRefs(idrefString, _ctx, opts) {
        const raw = trim(idrefString);
        if (!raw) return {refs: [], missing: [], flags: ['empty']};

        // Normalize whitespace for stable cache keys
        const parts = raw.split(/\s+/).filter(Boolean);
        const normKey = parts.join(' ');

        // Root-scoped cache map
        let cacheMap = null;
        if (__idRefCacheByRoot) {
            const scopeObj =
                (root && typeof root === 'object') ? root :
                    (document && typeof document === 'object') ? document :
                        null;
            if (scopeObj) {
                try {
                    cacheMap = __idRefCacheByRoot.get(scopeObj) || null;
                    if (!cacheMap) {
                        cacheMap = new Map();
                        __idRefCacheByRoot.set(scopeObj, cacheMap);
                    }
                } catch {
                    cacheMap = null;
                }
            }
        }

        // Cached base result is *untruncated* (opts.maxRefs applied per call)
        if (cacheMap) {
            try {
                const cached = cacheMap.get(normKey);
                if (cached && cached.refs && cached.missing && cached.flags) {
                    const baseRefs = Array.isArray(cached.refs) ? cached.refs.slice(0) : [];
                    const baseMissing = Array.isArray(cached.missing) ? cached.missing.slice(0) : [];
                    const baseFlags = Array.isArray(cached.flags) ? cached.flags.slice(0) : [];

                    // Apply deterministic truncation if requested
                    if (opts && opts.maxRefs && baseRefs.length > opts.maxRefs) {
                        baseRefs.length = Math.max(0, Number(opts.maxRefs) | 0);
                        baseFlags.push('truncated');
                    }

                    __perfInc('idref.resolve.hit');
                    return {refs: baseRefs, missing: baseMissing, flags: baseFlags};
                }
            } catch {
                // cache read errors should never throw
            }
        }

        __perfInc(cacheMap ? 'idref.resolve.miss' : 'idref.resolve.nocache');
        // Compute base result
        const refs = [];
        const missing = [];
        const seen = new Set();

        for (const id of parts) {
            const key = trim(id);
            if (!key) continue;

            let el = safeDocGetById(key);
            if (!el) el = safeRootQueryById(key);

            if (!el || !isElement(el)) {
                missing.push(key);
                continue;
            }
            if (seen.has(el)) continue;
            seen.add(el);
            refs.push(el);
        }

        const flags = [];
        if (missing.length) flags.push('idref-missing');
        if (parts.length !== refs.length + missing.length) flags.push('deduped'); // indicates repeats

        // Store untruncated base result
        if (cacheMap) {
            try {
                cacheMap.set(normKey, {
                    refs: refs.slice(0),
                    missing: missing.slice(0),
                    flags: flags.slice(0),
                    partsLen: parts.length
                });
            } catch {
                // ignore cache write errors
            }
        }

        // Apply deterministic truncation per call
        if (opts && opts.maxRefs && refs.length > opts.maxRefs) {
            refs.length = Math.max(0, Number(opts.maxRefs) | 0);
            flags.push('truncated');
        }

        return {refs, missing, flags};
    }

    function getTextFromIdRefs(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);
        const texts = [];
        for (const el of r.refs) {
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {
            }
        }
        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');
        return {text, refsCount: r.refs.length, missing: r.missing.slice(0), flags};
    }

    function isIdRefEligibleTarget(node) {
        // IDREF policy: include hidden/aria-hidden/collapsed targets,
        // exclude only inertness or non-composed.
        if (!isElement(node)) return {eligible: false, reasons: ['notElement']};

        // NOTE: `root` is not an eligibility boundary for IDREF targets.

        if (hasBlockingInert(node)) return {eligible: false, reasons: ['inert']};

        return {eligible: true, reasons: []};
    }

    function getTextFromIdRefsIdrefEligible(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);

        const texts = [];
        const excluded = []; // [{ id, reasons }]
        for (const el of r.refs) {
            const elig = isIdRefEligibleTarget(el);
            if (!elig.eligible) {
                const id = trim(el.getAttribute && el.getAttribute('id'));
                excluded.push({id: id || null, reasons: elig.reasons.slice(0)});
                continue;
            }
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {
            }
        }

        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');

        if (excluded.length) flags.push('idref-excluded');

        return {
            text,
            refsCount: r.refs.length,
            missing: r.missing.slice(0),
            excluded,
            flags
        };
    }

    // B) Accessible name / description helpers (mechanism-first, but scoped & deterministic)
    function getAccessibleNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const key = __getNameOptsKey(opts);
        try {
            if (__accessibleNameCacheByKey && __accessibleNameCacheByKey.has(key)) {
                const wm = __accessibleNameCacheByKey.get(key);
                if (wm && wm instanceof WeakMap && wm.has(el)) {
                    const c = wm.get(el);
                    if (c && typeof c === 'object') {
                        __perfInc('accessibleName.hit');
                        return {
                            present: !!c.present,
                            value: c.value == null ? '' : String(c.value),
                            mechanism: c.mechanism || 'none',
                            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                        };
                    }
                }
            }
        } catch {
        }
        __perfInc('accessibleName.miss');

        const aria = getAriaNameInfo(el, _ctx, opts);
        if (aria && aria.present && aria.value) {
            const out = {
                present: true,
                value: aria.value,
                mechanism: aria.mechanism,
                flags: flags.concat(aria.flags || [])
            };
            try {
                if (__accessibleNameCacheByKey) {
                    const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                    if (wm && wm instanceof WeakMap) wm.set(el, {
                        present: !!out.present,
                        value: out.value,
                        mechanism: out.mechanism,
                        flags: out.flags.slice(0)
                    });
                }
            } catch {
            }
            return out;
        }
        if (aria && aria.flags && aria.flags.length) {
            for (const f of aria.flags) flags.push(f);
        }

        // Explicit <label for="..."> or wrapping <label> (common and deterministic for form controls)
        const id = trim(getAttr(el, 'id'));
        if (id) {
            // Prefer indexed lookup (1 build per run) over repeated querySelector per element.
            const entry = __lookupLabelForId(id, key);
            if (entry && entry.exists) {
                const lt = entry.text || '';
                if (lt) {
                    const out = {present: true, value: lt, mechanism: 'label', flags};
                    try {
                        if (__accessibleNameCacheByKey) {
                            const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                            if (wm && wm instanceof WeakMap) wm.set(el, {
                                present: true,
                                value: out.value,
                                mechanism: out.mechanism,
                                flags: out.flags.slice(0)
                            });
                        }
                    } catch {
                    }
                    return out;
                }
                // If label exists but is empty, fall through (matches prior behavior: empty label doesn't produce a name).
            }
        }


        const title = trim(getAttr(el, 'title'));
        if (title) {
            flags.push('title-used');
            const out = {present: true, value: title, mechanism: 'title', flags};
            try {
                if (__accessibleNameCacheByKey) {
                    const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                    if (wm && wm instanceof WeakMap) wm.set(el, {
                        present: true,
                        value: out.value,
                        mechanism: out.mechanism,
                        flags: out.flags.slice(0)
                    });
                }
            } catch {
            }
            return out;
        }

        const out = {present: false, value: '', mechanism: 'none', flags};
        try {
            if (__accessibleNameCacheByKey) {
                const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                if (wm && wm instanceof WeakMap) wm.set(el, {
                    present: false,
                    value: '',
                    mechanism: 'none',
                    flags: out.flags.slice(0)
                });
            }
        } catch {
        }
        return out;
    }

    function getAccessibleDescriptionInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const key = __getDescOptsKey(opts);
        try {
            if (__accessibleDescCacheByKey && __accessibleDescCacheByKey.has(key)) {
                const wm = __accessibleDescCacheByKey.get(key);
                if (wm && wm instanceof WeakMap && wm.has(el)) {
                    const c = wm.get(el);
                    if (c && typeof c === 'object') {
                        __perfInc('accessibleDesc.hit');
                        return {
                            present: !!c.present,
                            value: c.value == null ? '' : String(c.value),
                            mechanism: c.mechanism || 'none',
                            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                        };
                    }
                }
            }
        } catch {
        }
        __perfInc('accessibleDesc.miss');

        const describedBy = trim(getAttr(el, 'aria-describedby'));
        if (describedBy) {
            const t = getTextFromIdRefs(describedBy, _ctx, opts);
            for (const f of t.flags) flags.push(f);
            if (t.text) {
                const out = {present: true, value: t.text, mechanism: 'aria-describedby', flags};
                try {
                    if (__accessibleDescCacheByKey) {
                        const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                        if (wm && wm instanceof WeakMap) wm.set(el, {
                            present: true,
                            value: out.value,
                            mechanism: out.mechanism,
                            flags: out.flags.slice(0)
                        });
                    }
                } catch {
                }
                return out;
            }
            flags.push('empty');
        }

        const allowTitle = !!(opts && opts.allowTitle === true);
        if (allowTitle) {
            const title = trim(getAttr(el, 'title'));
            if (title) {
                flags.push('title-used');
                const out = {present: true, value: title, mechanism: 'title', flags};
                try {
                    if (__accessibleDescCacheByKey) {
                        const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                        if (wm && wm instanceof WeakMap) wm.set(el, {
                            present: true,
                            value: out.value,
                            mechanism: out.mechanism,
                            flags: out.flags.slice(0)
                        });
                    }
                } catch {
                }
                return out;
            }
        }

        const out = {present: false, value: '', mechanism: 'none', flags};
        try {
            if (__accessibleDescCacheByKey) {
                const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                if (wm && wm instanceof WeakMap) wm.set(el, {
                    present: false,
                    value: '',
                    mechanism: 'none',
                    flags: out.flags.slice(0)
                });
            }
        } catch {
        }
        return out;
    }

    // C) Text alternative helper (mechanism-aware by element/type)
    function getTextAlternativeInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) {
            return {
                present: false,
                value: '',
                mechanism: 'unsupported',
                requiredMechanism: 'unknown',
                flags: ['notElement']
            };
        }

        const tag = lower(el.tagName);
        const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';

        const isImageLike =
            tag === 'img' ||
            tag === 'area' ||
            (tag === 'input' && type === 'image');

        if (isImageLike) {
            const altRaw = getAttr(el, 'alt');
            const altPresent = altRaw != null;
            const altText = trim(altRaw);

            if (altPresent) {
                if (!altText) flags.push('alt-empty');
                return {
                    present: true,
                    value: altText,
                    mechanism: 'alt',
                    requiredMechanism: 'alt',
                    flags
                };
            }

            // Missing alt is a real issue even if an accessible name exists.
            const name = getAccessibleNameInfo(el, _ctx, opts);
            if (name && name.present && name.value) flags.push('name-present-but-alt-missing');
            flags.push('alt-missing');

            return {
                present: false,
                value: name && name.present ? (name.value || '') : '',
                mechanism: name && name.present ? 'accessible-name' : 'none',
                requiredMechanism: 'alt',
                flags: flags.concat((name && name.flags) ? name.flags.slice(0) : [])
            };
        }

        if (tag === 'canvas') {
            const fallback = trim(el.textContent || '');
            if (fallback) {
                return {
                    present: true,
                    value: fallback,
                    mechanism: 'canvas-fallback',
                    requiredMechanism: 'fallback-or-name',
                    flags
                };
            }

            const name = getAccessibleNameInfo(el, _ctx, opts);
            if (name && name.present && name.value) {
                return {
                    present: true,
                    value: name.value,
                    mechanism: 'accessible-name',
                    requiredMechanism: 'fallback-or-name',
                    flags: flags.concat(name.flags ? name.flags.slice(0) : [])
                };
            }

            return {
                present: false,
                value: '',
                mechanism: 'none',
                requiredMechanism: 'fallback-or-name',
                flags
            };
        }

        return {
            present: false,
            value: '',
            mechanism: 'unsupported',
            requiredMechanism: 'unknown',
            flags: ['unsupported-element']
        };
    }

    // D) Role + focusability helpers
    function getRoleInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {role: '', source: 'none', flags: ['notElement']};

        const explicit = trim(getAttr(el, 'role'));
        if (explicit) {
            const v = explicit;
            const low = v.toLowerCase();
            if (low === 'presentation' || low === 'none') flags.push('presentation');
            // Minimal sanity: role token should not contain spaces beyond role list; keep deterministic
            if (/\s/.test(v)) flags.push('multiple-roles');
            return {role: v, source: 'explicit', flags};
        }

        const allowImplicit = !(opts && opts.disallowImplicit === true);
        if (!allowImplicit) return {role: '', source: 'none', flags};

        const tag = lower(el.tagName);
        const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';
        const href = tag === 'a' || tag === 'area' ? trim(getAttr(el, 'href')) : '';

        // Minimal implicit mapping (expand later if needed, but keep stable and small).
        let role = '';
        if ((tag === 'a' || tag === 'area') && href) role = 'link';
        else if (tag === 'button') role = 'button';
        else if (tag === 'summary') role = 'button';
        else if (tag === 'input') {
            if (type === 'checkbox') role = 'checkbox';
            else if (type === 'radio') role = 'radio';
            else if (type === 'range') role = 'slider';
            else if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') role = 'button';
            else if (type !== 'hidden') role = 'textbox';
        } else if (tag === 'select') role = 'combobox';
        else if (tag === 'textarea') role = 'textbox';

        if (role) return {role, source: 'implicit', flags};
        return {role: '', source: 'none', flags};
    }

    function getFocusableInfo(el, _ctx, opts) {
        // Allocation-minimal merge: avoid chained concat() which creates intermediate arrays.
        if (!isElement(el)) return {focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement']};

        const pf = getPlatformFocusability(el); // returns focusable + tabbable + mechanism + flags

        // Merge flags deterministically (stable order: local flags, then pf.flags)
        const outFlags = [];
        // (No local flags today; keep structure for forward compatibility without extra allocations.)
        if (pf && Array.isArray(pf.flags) && pf.flags.length) {
            for (let i = 0; i < pf.flags.length; i++) outFlags.push(pf.flags[i]);
        }

        return {
            focusable: !!(pf && pf.focusable),
            tabbable: !!(pf && pf.tabbable),
            mechanism: (pf && pf.mechanism) || 'none',
            flags: outFlags
        };
    }

    // Back-compat: keep existing helper but implement via new name helper.
    function hasAccessibleName(el) {
        const info = getAccessibleNameInfo(el);
        return !!(info && info.present && trim(info.value));
    }

    function createSelectorUniqIndex() {
        const scope = root && root.querySelectorAll ? root : document;

        const idCount = new Map();
        const testIdCount = new Map(); // data-testid + data-test + data-cy + data-qa
        const nameCount = new Map();   // key: tag|name
        const ariaLabelCount = new Map(); // key: tag|aria-label
        const roleAriaLabelCount = new Map(); // key: role|aria-label

        const sel = '[id],[data-testid],[data-test],[data-cy],[data-qa],[name],[aria-label],[role]';
        const nodes = (typeof queryAllSmart === 'function')
            ? (queryAllSmart(sel) || [])
            : Array.from(scope.querySelectorAll(sel));

        const inc = (map, key) => map.set(key, (map.get(key) || 0) + 1);

        for (const el of nodes) {
            if (!el || el.nodeType !== 1) continue;

            const tag = (el.tagName || '').toLowerCase();

            const id = el.getAttribute('id');
            if (id && id.trim()) inc(idCount, id.trim());

            for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                const v = el.getAttribute(a);
                if (v && v.trim()) inc(testIdCount, a + '=' + v.trim());
            }

            const name = el.getAttribute('name');
            if (name && name.trim() && tag) inc(nameCount, tag + '|' + name.trim());

            const aria = el.getAttribute('aria-label');
            if (aria && aria.trim() && tag) inc(ariaLabelCount, tag + '|' + aria.trim());

            const role = el.getAttribute('role');
            if (role && role.trim() && aria && aria.trim()) {
                inc(roleAriaLabelCount, role.trim() + '|' + aria.trim());
            }
        }

        return {idCount, testIdCount, nameCount, ariaLabelCount, roleAriaLabelCount};
    }

    function buildSimpleSelector(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return fallbackTag || 'html';

            const tag = (el.tagName || fallbackTag || 'html').toLowerCase();

            const cssEscapeIdent = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {
                }
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const escapeAttrValue = __escapeAttrValue;

            const id = el.getAttribute && el.getAttribute('id');
            if (id && id.trim()) return '#' + cssEscapeIdent(id.trim());

            for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                const v = el.getAttribute && el.getAttribute(a);
                if (v && v.trim()) return '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
            }

            const name = el.getAttribute && el.getAttribute('name');
            if (name && name.trim()) return tag + '[name="' + escapeAttrValue(name.trim()) + '"]';

            return tag;
        } catch {
            return fallbackTag || 'html';
        }
    }

    function getUniqIndex() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__uniqIndexByScope) {
            __perfInc('uniqIndex.nocache');
            // Fallback: build per call (should be rare; determinism preserved)
            return createSelectorUniqIndex();
        }

        const cached = __uniqIndexByScope.get(scopeObj);
        if (cached) {
            __perfInc('uniqIndex.hit');
            return cached;
        }

        __perfInc('uniqIndex.miss');
        const idx = createSelectorUniqIndex();
        try {
            __uniqIndexByScope.set(scopeObj, idx);
        } catch { /* ignore */
        }
        __perfInc('uniqIndex.build');
        return idx;
    }

    function buildSelectorUncached(el) {
        const escapeAttrValue = __escapeAttrValue;
        try {
            if (!el || el.nodeType !== 1) return 'html';

            const cssEscape = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {
                }
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const idx = getUniqIndex();
            const tag = (el.tagName || '').toLowerCase();

            const uniqueIdSel = () => {
                const id = el.getAttribute('id');
                if (!id || !id.trim()) return null;
                const v = id.trim();
                if (idx && (idx.idCount.get(v) || 0) === 1) return '#' + cssEscape(v);
                return null;
            };

            const uniqueTestSel = () => {
                for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                    const v = el.getAttribute(a);
                    if (!v || !v.trim()) continue;
                    const key = a + '=' + v.trim();
                    if (idx && (idx.testIdCount.get(key) || 0) === 1) {
                        return '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
                    }
                }
                return null;
            };

            const uniqueNameSel = () => {
                const v = el.getAttribute('name');
                if (!v || !v.trim() || !tag) return null;
                const key = tag + '|' + v.trim();
                if (idx && (idx.nameCount.get(key) || 0) === 1) return tag + '[name="' + escapeAttrValue(v.trim()) + '"]';
                return null;
            };

            const uniqueAriaSel = () => {
                const v = el.getAttribute('aria-label');
                if (!v || !v.trim() || !tag) return null;
                const key = tag + '|' + v.trim();
                if (idx && (idx.ariaLabelCount.get(key) || 0) === 1) return tag + '[aria-label="' + escapeAttrValue(v.trim()) + '"]';
                return null;
            };

            const uniqueRoleAriaSel = () => {
                const role = el.getAttribute('role');
                const aria = el.getAttribute('aria-label');
                if (!role || !role.trim() || !aria || !aria.trim()) return null;
                const key = role.trim() + '|' + aria.trim();
                if (idx && (idx.roleAriaLabelCount.get(key) || 0) === 1) {
                    return '[role="' + escapeAttrValue(role.trim()) + '"][aria-label="' + escapeAttrValue(aria.trim()) + '"]';
                }
                return null;
            };

            const direct =
                uniqueIdSel() ||
                uniqueTestSel() ||
                uniqueRoleAriaSel() ||
                uniqueNameSel() ||
                uniqueAriaSel();

            if (direct) return direct;

            const parts = [];

            function nthOfType(node) {
                const t = (node.tagName || '').toLowerCase() || '*';
                const p = node.parentElement;
                if (!p) return t;

                let i = 1;
                let sib = node.previousElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) i++;
                    sib = sib.previousElementSibling;
                }

                let hasSame = false;
                sib = node.nextElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) {
                        hasSame = true;
                        break;
                    }
                    sib = sib.nextElementSibling;
                }
                if (!hasSame) {
                    sib = node.nextElementSibling;
                    while (sib) {
                        if ((sib.tagName || '').toLowerCase() === t) {
                            hasSame = true;
                            break;
                        }
                        sib = sib.previousElementSibling;
                    }
                }
                return hasSame ? t + ':nth-of-type(' + i + ')' : t;
            }

            let node = el;
            let safety = 0;

            while (node && node.nodeType === 1 && safety++ < 20) {
                let anchor = null;

                if (node !== el) {
                    const t = (node.tagName || '').toLowerCase();
                    const id = node.getAttribute('id');
                    if (id && id.trim() && idx && (idx.idCount.get(id.trim()) || 0) === 1) anchor = '#' + cssEscape(id.trim());
                    if (!anchor) {
                        for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                            const v = node.getAttribute(a);
                            if (v && v.trim() && idx && (idx.testIdCount.get(a + '=' + v.trim()) || 0) === 1) {
                                anchor = '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
                                break;
                            }
                        }
                    }
                    if (!anchor) {
                        const name = node.getAttribute('name');
                        if (name && name.trim() && t && idx && (idx.nameCount.get(t + '|' + name.trim()) || 0) === 1) {
                            anchor = t + '[name="' + escapeAttrValue(name.trim()) + '"]';
                        }
                    }
                    if (!anchor) {
                        const aria = node.getAttribute('aria-label');
                        if (aria && aria.trim() && t && idx && (idx.ariaLabelCount.get(t + '|' + aria.trim()) || 0) === 1) {
                            anchor = t + '[aria-label="' + escapeAttrValue(aria.trim()) + '"]';
                        }
                    }
                }

                if (node === el) {
                    parts.unshift(nthOfType(node));
                } else if (anchor) {
                    parts.unshift(anchor);
                    break;
                } else {
                    parts.unshift(nthOfType(node));
                }

                if (!node.parentElement || node === root) break;
                node = node.parentElement;
            }

            const candidate = parts.join(' > ') || (tag || 'html');

            try {
                const scope = root && root.querySelectorAll ? root : document;
                const matches = scope.querySelectorAll(candidate);
                if (matches && matches.length === 1 && matches[0] === el) return candidate;
            } catch {
            }

            return buildSimpleSelector(el, tag || 'html');
        } catch {
            return 'html';
        }
    }

    function buildSelector(el) {
        try {
            if (__selectorCache && el && typeof el === 'object' && __selectorCache.has(el)) {
                __perfInc('selector.hit');
                return __selectorCache.get(el) || 'html';
            }
        } catch {
        }
        __perfInc('selector.miss');
        const sel = buildSelectorUncached(el);
        try {
            if (__selectorCache && el && typeof el === 'object') __selectorCache.set(el, sel);
        } catch {
        }
        return sel;
    }

    function getNonEmptyTitle(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'title');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch {
            return null;
        }
    }

    function getNonEmptyPlaceholder(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'placeholder');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch {
            return null;
        }
    }

    function hasLabelAssociation(el) {
        // Deterministic, stable subset:
        // - <label for="id">
        // - wrapping <label> ... <input> ...
        if (!isElement(el)) return false;

        try {
            if (__labelAssociationCache && el && typeof el === 'object' && __labelAssociationCache.has(el)) {
                __perfInc('labelAssociation.hit');
                return !!__labelAssociationCache.get(el);
            }
        } catch {
        }

        __perfInc('labelAssociation.miss');
        let out = false;

        const id = trim(getAttr(el, 'id'));
        if (id) {
            const entry = __lookupLabelForId(id, '__default__');
            if (entry && entry.exists) {
                out = true;
            }
        }

        if (!out && el.closest) {
            try {
                const wrap = el.closest('label');
                if (wrap && isElement(wrap)) out = true;
            } catch {
            }
        }

        try {
            if (__labelAssociationCache && el && typeof el === 'object') __labelAssociationCache.set(el, !!out);
        } catch {
        }

        return out;
    }

    function getLabelMethod(el, _ctx, opts) {
        // returns { method, value } where value is best-effort text, deterministically trimmed
        if (!isElement(el)) return {method: 'none', value: null};

        try {
            if (__labelMethodCache && el && typeof el === 'object' && __labelMethodCache.has(el)) {
                __perfInc('labelMethod.hit');
                const c = __labelMethodCache.get(el);
                if (c && typeof c === 'object') {
                    return {method: c.method || 'none', value: c.value == null ? null : String(c.value)};
                }
            }
        } catch {
        }

        __perfInc('labelMethod.miss');
        let out = {method: 'none', value: null};

        if (hasLabelAssociation(el)) out = {method: 'label', value: null};
        else if (getAriaLabelledByInfo) {
            try {
                const info = getAriaLabelledByInfo(el, _ctx, {maxRefs: 8});
                const v = info && info.present ? trim(info.value) : '';
                if (v) out = {method: 'aria-labelledby', value: v};
            } catch {
            }
        }

        if (out.method === 'none' && getAriaLabelInfo) {
            try {
                const info = getAriaLabelInfo(el);
                const v = info && info.present ? trim(info.value) : '';
                if (v) out = {method: 'aria-label', value: v};
            } catch {
            }
        }

        if (out.method === 'none') {
            const titleV = getNonEmptyTitle(el);
            if (titleV) out = {method: 'title', value: titleV};
        }

        if (out.method === 'none') {
            const phV = getNonEmptyPlaceholder(el);
            if (phV) out = {method: 'placeholder', value: phV};
        }

        try {
            if (__labelMethodCache && el && typeof el === 'object') {
                __labelMethodCache.set(el, {method: out.method, value: out.value});
            }
        } catch {
        }

        return out;
    }

    function getLabelStrength(method) {
        // policy choice; this is deterministic and tweakable
        if (method === 'label' || method === 'aria-labelledby') return 'strong';
        if (method === 'aria-label') return 'medium';
        if (method === 'title' || method === 'placeholder') return 'weak';
        return 'none';
    }

    function reportOccurrence(node, partial) {
        const o = (partial && typeof partial === 'object' && !Array.isArray(partial)) ? { ...partial } : {};
        // Attach the node for engine-side finalization. This must be removed later before returning results.
        o.__node = node || null;
        return o;
    }

    let __contrastSharedCache = {};
    try {
        // In Node/JSDOM tests, the harness sets global.window/global.document.
        // The engine may instantiate helpers per rule without passing opts.window,
        // so we must be able to recover the stable realm window to share caches.
        const w =
            realmWindow ||
            (document && document.defaultView) ||
            (typeof global !== 'undefined' && global.window ? global.window : null);

        if (w) {
            if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
            if (!w.__a11ycoreSharedCache.contrast) w.__a11ycoreSharedCache.contrast = {};
            __contrastSharedCache = w.__a11ycoreSharedCache.contrast;
        }
    } catch {
        __contrastSharedCache = {};
    }

    const __contrastShared = {
        trim,
        computedStyle,
        composedParent,
        buildSimpleSelector,
        __contrastSharedCache
    };

    const contrast = createContrastHelpers(
        {window: realmWindow || window, document, root},
        __contrastShared
    );

    // Expose shared cache to rules (deterministic, in-memory only)
    contrast.sharedCache = __contrastShared.__contrastSharedCache;

    return {
        // Existing query/snippet utilities
        queryAll,
        queryAllDeep,
        queryAllSmart,
        getOuterHtmlSnippet,
        buildSimpleSelector,
        buildSelector,

        // Existing (back-compat)
        hasAccessibleName,
        isExcluded,
        isAccTreeEligible,
        isDomVisibleEligible,

        // Eligibility info wrapper
        getEligibilityInfo,

        // IDREF primitives
        resolveIdRefs,
        getTextFromIdRefs,
        getTextFromIdRefsIdrefEligible,

        // ARIA-only name primitives (new)
        getAriaLabelInfo,
        getAriaLabelledByInfo,
        getAriaNameInfo,

        // Name / description
        getAccessibleNameInfo,
        getAccessibleDescriptionInfo,

        // Text alternatives
        getTextAlternativeInfo,

        // Role / focusability
        getRoleInfo,
        getFocusableInfo,

        getAttributeInfo,

        getLabelMethod, getLabelStrength,

        // Perf counters (only populated when opts.perfStats === true)
        getPerfStats,
        resetPerfStats,

        reportOccurrence,

        contrast
    };
});

// Inlined from src/core/dom-runner.js
const runCore = (function runCore(pageUrl, contextSelector, engineOptions, runOnly, RULE_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION) {
    const ctxSelector =
        (typeof contextSelector === 'string' && contextSelector.trim())
            ? contextSelector.trim()
            : null;

    const policy = resolvePolicy(POLICY_CONTRACTS, engineOptions);

    const root =
        ctxSelector
            ? (document.querySelector(ctxSelector) ||
                document.documentElement ||
                document.body ||
                document.querySelector('html'))
            : (document.documentElement ||
                document.body ||
                document.querySelector('html'));


    const includeShadowDom = !!(engineOptions && engineOptions.includeShadowDom);
    const excludeSelectors = normalizeSelectorList(engineOptions && engineOptions.excludeSelectors);

    const url = pageUrl || (document.location && document.location.href) || null;
    const title = document.title || null;
    // Deterministic timestamp: only use host-provided value (no time-based logic).
    const timestamp =
        (engineOptions && typeof engineOptions.timestamp === 'string' && engineOptions.timestamp.trim())
            ? engineOptions.timestamp.trim()
            : null;

    const sharedHelpers = createDomHelpers({
        document,
        window,
        root,
        includeShadowDom,
        excludeSelectors,
        // Optional perf counters (bench/debug only). Deterministic and per-run.
        perfStats: !!(engineOptions && engineOptions.perfStats)
    });

    const profileRules = !!(engineOptions && engineOptions.profileRules);
    const ruleTimings = profileRules ? Object.create(null) : null;

    function nowMs() {
        // performance.now() if available, else Date.now()
        try {
            if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
                return performance.now();
            }
        } catch (e) {}
        return Date.now();
    }

    // =========================
    // Probes (optional evidence fed by the host app)
    // Keep deterministic + serializable + no-throws.
    // =========================
    function sanitizeProbeValue(v, depth) {
        // depth-bounded, JSON-safe sanitizer
        if (depth <= 0) return null;
        if (v == null) return null;

        const t = typeof v;
        if (t === 'string') return v.length > 2000 ? v.slice(0, 2000) : v;
        if (t === 'number') return Number.isFinite(v) ? v : null;
        if (t === 'boolean') return v;
        if (t === 'function') return null;

        if (Array.isArray(v)) {
            // cap arrays to avoid huge payloads
            const out = [];
            const n = Math.min(v.length, 200);
            for (let i = 0; i < n; i++) out.push(sanitizeProbeValue(v[i], depth - 1));
            return out;
        }

        if (t === 'object') {
            const out = {};
            const keys = Object.keys(v);
            // cap object keys
            const n = Math.min(keys.length, 50);
            for (let i = 0; i < n; i++) {
                const k = keys[i];
                // only allow string keys
                if (typeof k !== 'string') continue;
                out[k] = sanitizeProbeValue(v[k], depth - 1);
            }
            return out;
        }

        return null;
    }

    let probes = null;
    try {
        const rawProbes = engineOptions && typeof engineOptions.probes === 'object' ? engineOptions.probes : null;
        probes = rawProbes ? sanitizeProbeValue(rawProbes, 6) : null;
        if (!probes || typeof probes !== 'object' || Array.isArray(probes)) probes = null;
    } catch (e) {
        probes = null;
    }

    const rulesResults = [];

    for (const def of RULE_DEFS) {
        const t0 = ruleTimings ? nowMs() : 0;
        const defResolved = resolveRuleDefI18n(def, engineOptions);
        if (!ruleMatchesRunOnly(defResolved, runOnly)) continue;

        const implEntry = RULE_IMPLS[defResolved.ruleId];
        const impl = implEntry && typeof implEntry.run === 'function' ? implEntry.run : null;
        const applicabilityFn = implEntry && typeof implEntry.applicability === 'function' ? implEntry.applicability : null;
        if (typeof impl !== 'function') continue;

        const ruleConfig =
            engineOptions && engineOptions.rules && engineOptions.rules[defResolved.ruleId]
                ? engineOptions.rules[defResolved.ruleId]
                : null;

        const ctx = {
            document,
            window,
            root,
            rule: defResolved,
            config: ruleConfig,
            helpers: sharedHelpers,
            engineTag: ENGINE_TAG,
            contextSelector: ctxSelector,
            engineOptions: (engineOptions && typeof engineOptions === 'object') ? engineOptions : {},

            // Optional evidence channel provided by host app
            inputs: {
                probes
            }
        };

        if (typeof applicabilityFn === 'function') {
            let applicable = true;
            try {
                const res = applicabilityFn(ctx);
                if (typeof res === 'boolean') applicable = res;
                else if (res && typeof res === 'object' && typeof res.applicable === 'boolean') applicable = res.applicable;
            } catch (err) {
                const raw = {
                    outcome: 'cantTell',
                    occurrences: [],
                    error: String(err && err.message ? err.message : err),
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
                if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
                continue;
            }

            if (!applicable) {
                const raw = {
                    outcome: 'notApplicable',
                    occurrences: [],
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy, sharedHelpers));
                if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
                continue;
            }
        }

        let result;
        try {
            result = impl(ctx);
        } catch (err) {
            result = {
                outcome: 'cantTell',
                occurrences: [],
                error: String(err && err.message ? err.message : err),
                engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
            };
        }

        if (!result || typeof result !== 'object') {
            if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
            continue;
        }
        if (!result.engineOptions) {
            result.engineOptions = { ...(ctx.engineOptions || {}), locale: normalizeLocale(engineOptions && engineOptions.locale) };
        }
        rulesResults.push(normalizeRuleResult(defResolved, result, SCHEMA_VERSION, policy, sharedHelpers));
        if (ruleTimings) ruleTimings[defResolved.ruleId] = (ruleTimings[defResolved.ruleId] || 0) + (nowMs() - t0);
    }


    // Optional perf counters passthrough (only when enabled). Deterministic.
    let perfStats = null;
    try {
        if (engineOptions && engineOptions.perfStats && sharedHelpers && typeof sharedHelpers.getPerfStats === 'function') {
            perfStats = sharedHelpers.getPerfStats();
        }
    } catch (e) {
        perfStats = null;
    }

    if (ruleTimings) {
        if (perfStats && engineOptions && engineOptions.profileRules) {
            perfStats.ruleTimings = ruleTimings; // (whatever your timing map is)
        }
    }

    return {
        engine: { tag: ENGINE_TAG, schemaVersion: SCHEMA_VERSION },
        url,
        title,
        timestamp,
        perfStats,
        contextSelector: ctxSelector,
        rules: rulesResults
    };
});

  return runCore(pageUrl, contextSelector, engineOptions, resolveEffectiveRunOnly(engineOptions, runOnly), RULE_DEFS, RULE_IMPLS, ENGINE_TAG, SCHEMA_VERSION);
}

module.exports = {
  ENGINE_TAG,
  SCHEMA_VERSION,
  DEFAULT_POLICY,
  POLICY_CONTRACTS,
  resolvePolicy,
  RULE_DEFS,
  getRuleDefById,
  getRulesCatalog,
  getRulesForRunOnly,
  runDomRulesInPage,
  runa11yCoreInPage,
  __internal: { normalizeRuleResult }
};
