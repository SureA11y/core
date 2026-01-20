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
  "a11ycore-object-text-alternative-present": { run: require("./rules/automatic/object-text-alternative-present.js").runInPage, applicability: require("./rules/automatic/object-text-alternative-present.js").applicability || null },
  "a11ycore-object-text-alternative-quality": { run: require("./rules/manual/object-text-alternative-quality-manual.js").runInPage, applicability: require("./rules/manual/object-text-alternative-quality-manual.js").applicability || null },
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
    "a11ycore_html_lang_attr_hint_invalid": "Use a valid BCP 47 language tag in <html lang=\"…\"> (for example: \"en\", \"fr\", \"en-US\")."
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
    "a11ycore_html_lang_attr_hint_invalid": "Utilisez une balise de langue BCP 47 valide dans <html lang=\"…\"> (par exemple : « fr », « en », « fr-FR »)."
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

  function applyI18nParams(str, params) {
    if (typeof str !== 'string' || !str) return '';
    if (!params || typeof params !== 'object') return str;

    // Robust {{param}} interpolation:
    // - allows whitespace: {{ param }}
    // - allows dashes, dots, colons, etc in keys: {{pattern-code}}
  return str.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, rawKey) => {
    const k = String(rawKey || '').trim();
    const v = Object.prototype.hasOwnProperty.call(params, k) ? params[k] : '';
    return v === null || v === undefined ? '' : String(v);
  });
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

function normalizeRuleResult(def, raw, schemaVersion, policy) {
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
    if (typeof o.selector !== 'string') o.selector = '';
    if (typeof o.summary !== 'string') o.summary = '';
    if (typeof o.hint !== 'string') o.hint = '';
    if (typeof o.html !== 'string') o.html = '';
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
    const root = opts && opts.root ? opts.root : null;
    const includeShadowDom = !!(opts && opts.includeShadowDom);
    const excludeSelectors = Array.isArray(opts && opts.excludeSelectors) ? opts.excludeSelectors : [];

    // --- eligibility utilities ---
    const isElement = (n) => !!n && n.nodeType === 1;
    const computedStyle = (el) => {
        try { return window && window.getComputedStyle ? window.getComputedStyle(el) : (el && el.style) || {}; }
        catch { return {}; }
    };
    const getRootNodeSafe = (n) => {
        try { return n && n.getRootNode ? n.getRootNode({ composed: true }) : (document || null); }
        catch { return document || null; }
    };
    const composedParent = (n) => {
        if (!n) return null;
        const p = n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
        if (p) return p;
        const rn = getRootNodeSafe(n);
        return rn && rn.host ? rn.host : null;
    };
    const ancestorsIncludingSelf = (n) => {
        const out = [];
        let cur = n, guard = 0;
        while (cur && guard++ < 200) { out.push(cur); cur = composedParent(cur); }
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
        try { return el && el.getAttribute ? el.getAttribute(name) : null; }
        catch { return null; }
    };

    function parseTabIndex(el) {
        const raw = getAttr(el, 'tabindex');
        const t = trim(raw);
        if (raw == null || t === '') return { has: false, value: null, valid: false };
        const n = Number(t);
        if (Number.isNaN(n)) return { has: true, value: null, valid: false };
        return { has: true, value: n, valid: true };
    }

    function getPlatformFocusability(el) {
        if (!isElement(el)) {
            return { focusable:false, tabbable:false, mechanism:'none', flags:['notElement'] };
        }
        if (hasBlockingInert(el)) {
            return { focusable:false, tabbable:false, mechanism:'none', flags:['inert'] };
        }

        const flags = [];
        const disabled = !!(el.matches && el.matches(':disabled'));
        if (disabled) return { focusable: false, tabbable: false, mechanism: 'disabled', flags: ['disabled'] };

        const ti = parseTabIndex(el);
        if (ti.has) {
            if (!ti.valid) return { focusable: false, tabbable: false, mechanism: 'tabindex', flags: ['tabindex-invalid'] };
            if (ti.value < 0) return { focusable: true, tabbable: false, mechanism: 'tabindex', flags: ['tabindex-negative'] };
            return { focusable: true, tabbable: true, mechanism: 'tabindex', flags: ['tabindex-nonnegative'] };
        }

        // native focusability
        // (keep your existing logic here; when it returns true, consider it tabbable)
        const native = isPlatformFocusable(el); // uses your existing boolean logic
        if (native) return { focusable: true, tabbable: true, mechanism: 'native', flags };

        return { focusable: false, tabbable: false, mechanism: 'none', flags };
    }

    // --- attribute ---
    function getAttributeInfo(el, attr) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const attrValue = trim(getAttr(el, attr));
        if (!attrValue) return { present: false, value: '', mechanism: attr, flags: ['empty'] };

        return { present: true, value: attrValue, mechanism: attr, flags };
    }

    // --- ARIA name primitives (reusable across rules) ---
    function getAriaLabelInfo(el) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const ariaLabel = trim(getAttr(el, 'aria-label'));
        if (!ariaLabel) return { present: false, value: '', mechanism: 'aria-label', flags: ['empty'] };

        return { present: true, value: ariaLabel, mechanism: 'aria-label', flags };
    }

    function getAriaLabelledByInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const ariaLabelledBy = trim(getAttr(el, 'aria-labelledby'));
        if (!ariaLabelledBy) return { present: false, value: '', mechanism: 'aria-labelledby', flags: ['missing'] };

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
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const lb = getAriaLabelledByInfo(el, _ctx, opts);
        if (lb.present && lb.value) return { present: true, value: lb.value, mechanism: 'aria-labelledby', flags: flags.concat(lb.flags || []) };

        const al = getAriaLabelInfo(el);
        if (al.present && al.value) return { present: true, value: al.value, mechanism: 'aria-label', flags: flags.concat(al.flags || []) };

        // If aria-labelledby existed but was empty/unresolvable, preserve that info in flags.
        if (trim(getAttr(el, 'aria-labelledby'))) flags.push('aria-labelledby-empty-or-unresolvable');
        if (getAttr(el, 'aria-label') != null && !trim(getAttr(el, 'aria-label'))) flags.push('aria-label-empty');

        return { present: false, value: '', mechanism: 'none', flags };
    }

    const lower = (v) => trim(v).toLowerCase();

    const safeDocGetById = (id) => {
        try {
            if (document && document.getElementById) return document.getElementById(id);
        } catch {}
        return null;
    };

    const safeRootQueryById = (id) => {
        // Best-effort for cases where root is not the document (e.g. shadow root-like, fragment roots).
        // Note: IDs are document-global in HTML, but test harnesses may use scoped roots.
        if (!root || !root.querySelector) return null;
        try { return root.querySelector('#' + id); } catch { return null; }
    };

    function inClosedDetailsContent(node) {
        try {
            if (!isElement(node)) return false;
            const summary = node.closest && node.closest('summary');
            if (summary && summary.contains(node)) return false;
            const details = node.closest && node.closest('details');
            if (details && !details.hasAttribute('open')) return true;
        } catch {}
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
                    const esc = (s) => {
                        try { return window && window.CSS && typeof window.CSS.escape === 'function' ? window.CSS.escape(s) : s; }
                        catch { return s; }
                    };
                    const n = esc(rawName);

                    // Be practical: accept both "#name" and "name", and ignore case.
                    const sels = [
                        `img[usemap="#${n}" i]`,
                        `img[usemap="${n}" i]`
                    ];

                    for (const sel of sels) {
                        try {
                            if (document.querySelector(sel)) return true;
                        } catch {}
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

    function isReferencedByVisibleIdRef(node) {
        if (!document || !isElement(node)) return false;
        const id = node.getAttribute && node.getAttribute('id');
        if (!id || !id.trim()) return false;
        const esc = (s) => {
            try { return window && window.CSS && typeof window.CSS.escape === 'function' ? window.CSS.escape(s) : s; }
            catch { return s; }
        };
        const idSel = esc(id.trim());
        const refs = [
            ...Array.from(document.querySelectorAll('[aria-labelledby~="' + idSel + '"]')),
            ...Array.from(document.querySelectorAll('[aria-describedby~="' + idSel + '"]')),
        ];
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
        const results = [];
        const seen = new Set();

        function pushAll(node) {
            if (!node || !node.querySelectorAll) return;
            let els = [];
            try {
                els = Array.from(node.querySelectorAll(sel));
            } catch {
                els = [];
            }
            for (const el of els) {
                if (el && !seen.has(el) && !isExcluded(el)) {
                    seen.add(el);
                    results.push(el);
                }
            }
        }

        function walk(node) {
            if (!node) return;
            if (node.nodeType === 1 && isExcluded(node)) return;

            pushAll(node);

            let all = [];
            try {
                all = node.querySelectorAll ? Array.from(node.querySelectorAll('*')) : [];
            } catch {
                all = [];
            }

            for (const el of all) {
                if (el && el.shadowRoot) walk(el.shadowRoot);
            }
        }

        walk(root);
        return results;
    }

    function queryAllSmart(sel) {
        const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
        return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
    }

    function getOuterHtmlSnippet(el) {
        if (!el || typeof el !== 'object') return '';
        try {
            const html = el.outerHTML || '';
            if (html.length > 2000) return html.slice(0, 2000) + '…';
            return html;
        } catch {
            return '';
        }
    }

    // --- Accessibility-tree eligibility (ordered checks) ---
    function isAccTreeEligible(node) {
        const reasons = [];
        if (!isElement(node)) return { eligible: false, reasons: ['notElement'] };

        // If shadow traversal is disabled and node is outside root, treat as non-composed
        if (root && !includeShadowDom) {
            try { if (!root.contains(node)) return { eligible: false, reasons: ['nonComposed'] }; } catch {}
        }

        const chain = ancestorsIncludingSelf(node);

        // 1) HTML/DOM hiding
        for (const a of chain) {
            if (!isElement(a)) continue;
            if (a.hasAttribute && a.hasAttribute('hidden')) return { eligible: false, reasons: ['hiddenAttr'] };
            const tn = (a.tagName || '').toLowerCase();
            if (tn === 'template') return { eligible: false, reasons: ['templateContent'] };
            if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') {
                return { eligible: false, reasons: ['nonRenderedElement'] };
            }
            if (tn === 'input') {
                const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                if (t === 'hidden') return { eligible: false, reasons: ['inputHidden'] };
            }
        }
        if (inClosedDetailsContent(node)) return { eligible: false, reasons: ['detailsClosed'] };

        // 2) Inertness / modality
        if (hasBlockingInert(node)) {
            return { eligible: false, reasons: ['inert'] };
        }
        // Modal dialog (best effort)
        try {
            const openModals = document ? Array.from(document.querySelectorAll('dialog[open][aria-modal="true"]')) : [];
            if (openModals.length) {
                let inside = false;
                for (const d of openModals) { if (d.contains(node)) { inside = true; break; } }
                if (!inside) return { eligible: false, reasons: ['modalInert'] };
            }
        } catch {}

        // 3) CSS rendering suppression
        for (const a of chain) {
            if (!isElement(a)) continue;

            // <area> is a non-rendered element; some DOMs report display:none for it.
            // Don’t treat the *area itself* as ineligible based on computed style.
            if (a === node) {
                const tn = (a.tagName || '').toLowerCase();
                if (tn === 'area') continue;
            }

            const cs = computedStyle(a);
            if (cs && cs.display === 'none') return { eligible: false, reasons: ['displayNone'] };
            if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
                return { eligible: false, reasons: ['visibilityHidden'] };
            }
        }

        // 4) ARIA subtree hiding with exceptions
        let ariaHidden = false;
        for (const a of chain) {
            if (!isElement(a)) continue;
            const v = a.getAttribute && a.getAttribute('aria-hidden');
            if (v != null && String(v).trim().toLowerCase() === 'true') { ariaHidden = true; break; }
        }
        if (ariaHidden) {
            const f = getPlatformFocusability(node);
            const idref = isReferencedByVisibleIdRef(node);

            // IDREF exception stays
            if (idref) return { eligible: true, reasons: ['ariaHiddenOverriddenIdref'] };

            // Only tabbable focus overrides aria-hidden
            if (f && f.tabbable) return { eligible: true, reasons: ['ariaHiddenOverriddenTabbable'] };

            // Programmatic focus (tabindex < 0) does NOT override eligibility
            if (f && f.focusable && !f.tabbable) {
                return { eligible: false, reasons: ['ariaHiddenProgrammaticFocusExcluded'] };
            }

            return { eligible: false, reasons: ['ariaHidden'] };
        }

        // 5/6 handled implicitly; 7 already covered
        return { eligible: true, reasons };
    }

    // A) wrapper: standardized eligibility info for logging
    function getEligibilityInfo(node, _ctx, opts) {
        const targetSet = opts && (opts.targetSet === 'acc' || opts.targetSet === 'dom') ? opts.targetSet : 'dom';
        const r = isAccTreeEligible(node); // signature-safe
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
        if (!raw) return { refs: [], missing: [], flags: ['empty'] };

        const parts = raw.split(/\s+/).filter(Boolean);
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
        if (opts && opts.maxRefs && refs.length > opts.maxRefs) {
            // deterministic truncation if requested
            refs.length = Math.max(0, Number(opts.maxRefs) | 0);
            flags.push('truncated');
        }

        return { refs, missing, flags };
    }

    function getTextFromIdRefs(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);
        const texts = [];
        for (const el of r.refs) {
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {}
        }
        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');
        return { text, refsCount: r.refs.length, missing: r.missing.slice(0), flags };
    }

    // B) Accessible name / description helpers (mechanism-first, but scoped & deterministic)
    function getAccessibleNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const aria = getAriaNameInfo(el, _ctx, opts);
        if (aria && aria.present && aria.value) {
            return { present: true, value: aria.value, mechanism: aria.mechanism, flags: flags.concat(aria.flags || []) };
        }
        if (aria && aria.flags && aria.flags.length) {
            for (const f of aria.flags) flags.push(f);
        }

        // Explicit <label for="..."> or wrapping <label> (common and deterministic for form controls)
        // Note: This is not a full Accessible Name Computation; it is a pragmatic, stable subset.
        const id = trim(getAttr(el, 'id'));
        if (id && document && document.querySelector) {
            try {
                // Avoid CSS.escape reliance for determinism/availability; do best effort.
                const sel = 'label[for="' + id.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
                const label = document.querySelector(sel);
                const lt = label ? trim(label.textContent) : '';
                if (lt) return { present: true, value: lt, mechanism: 'label', flags };
            } catch {}
        }
        if (el.closest) {
            try {
                const wrap = el.closest('label');
                const wt = wrap ? trim(wrap.textContent) : '';
                if (wt) return { present: true, value: wt, mechanism: 'label', flags };
            } catch {}
        }

        // Optionally allow contents-based names for obvious elements.
        // Default: allow for <button>, <a>, <summary> (very common, deterministic).
        const allowContents = !(opts && opts.disallowContents === true);
        if (allowContents) {
            const tag = lower(el.tagName);
            const isContentsNamed =
                tag === 'button' ||
                tag === 'a' ||
                tag === 'summary';
            if (isContentsNamed) {
                const ct = trim(el.textContent);
                if (ct) return { present: true, value: ct, mechanism: 'contents', flags };
            }
        }

        const title = trim(getAttr(el, 'title'));
        if (title) {
            flags.push('title-used');
            return { present: true, value: title, mechanism: 'title', flags };
        }

        return { present: false, value: '', mechanism: 'none', flags };
    }

    function getAccessibleDescriptionInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const describedBy = trim(getAttr(el, 'aria-describedby'));
        if (describedBy) {
            const t = getTextFromIdRefs(describedBy, _ctx, opts);
            for (const f of t.flags) flags.push(f);
            if (t.text) return { present: true, value: t.text, mechanism: 'aria-describedby', flags };
            flags.push('empty');
            // fall through
        }

        const allowTitle = !!(opts && opts.allowTitle === true);
        if (allowTitle) {
            const title = trim(getAttr(el, 'title'));
            if (title) {
                flags.push('title-used');
                return { present: true, value: title, mechanism: 'title', flags };
            }
        }

        return { present: false, value: '', mechanism: 'none', flags };
    }

    // C) Text alternative helper (mechanism-aware by element/type)
    function getTextAlternativeInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) {
            return { present: false, value: '', mechanism: 'unsupported', requiredMechanism: 'unknown', flags: ['notElement'] };
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

        return { present: false, value: '', mechanism: 'unsupported', requiredMechanism: 'unknown', flags: ['unsupported-element'] };
    }

    // D) Role + focusability helpers
    function getRoleInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { role: '', source: 'none', flags: ['notElement'] };

        const explicit = trim(getAttr(el, 'role'));
        if (explicit) {
            const v = explicit;
            const low = v.toLowerCase();
            if (low === 'presentation' || low === 'none') flags.push('presentation');
            // Minimal sanity: role token should not contain spaces beyond role list; keep deterministic
            if (/\s/.test(v)) flags.push('multiple-roles');
            return { role: v, source: 'explicit', flags };
        }

        const allowImplicit = !(opts && opts.disallowImplicit === true);
        if (!allowImplicit) return { role: '', source: 'none', flags };

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

        if (role) return { role, source: 'implicit', flags };
        return { role: '', source: 'none', flags };
    }

    function getFocusableInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement'] };

        const pf = getPlatformFocusability(el); // returns focusable + tabbable + mechanism + flags
        // Merge flags deterministically
        const outFlags = []
            .concat(Array.isArray(flags) ? flags : [])
            .concat(Array.isArray(pf.flags) ? pf.flags : []);

        return {
            focusable: !!pf.focusable,
            tabbable: !!pf.tabbable,
            mechanism: pf.mechanism || 'none',
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

        return { idCount, testIdCount, nameCount, ariaLabelCount, roleAriaLabelCount };
    }

    function buildSimpleSelector(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return fallbackTag || 'html';

            const tag = (el.tagName || fallbackTag || 'html').toLowerCase();

            const cssEscapeIdent = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {}
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

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

    let __uniqIndex = null;
    function getUniqIndex() {
        if (__uniqIndex) return __uniqIndex;
        __uniqIndex = createSelectorUniqIndex();
        return __uniqIndex;
    }

    function buildSelector(el) {
        const escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        try {
            if (!el || el.nodeType !== 1) return 'html';

            const cssEscape = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {}
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
                sib = node.previousElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) { hasSame = true; break; }
                    sib = sib.previousElementSibling;
                }
                if (!hasSame) {
                    sib = node.nextElementSibling;
                    while (sib) {
                        if ((sib.tagName || '').toLowerCase() === t) { hasSame = true; break; }
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
            } catch {}

            return buildSimpleSelector(el, tag || 'html');
        } catch {
            return 'html';
        }
    }

    function getNonEmptyTitle(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'title');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch { return null; }
    }

    function getNonEmptyPlaceholder(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'placeholder');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch { return null; }
    }

    function getLabelMethod(el) {
        // returns { method, value } where value is best-effort text, deterministically trimmed
        if (hasLabelAssociation(el)) return { method: 'label', value: null };

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

        const titleV = getNonEmptyTitle(el);
        if (titleV) return { method: 'title', value: titleV };

        const phV = getNonEmptyPlaceholder(el);
        if (phV) return { method: 'placeholder', value: phV };

        return { method: 'none', value: null };
    }

    function getLabelStrength(method) {
        // policy choice; this is deterministic and tweakable
        if (method === 'label' || method === 'aria-labelledby') return 'strong';
        if (method === 'aria-label') return 'medium';
        if (method === 'title' || method === 'placeholder') return 'weak';
        return 'none';
    }

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

        // Eligibility info wrapper
        getEligibilityInfo,

        // IDREF primitives
        resolveIdRefs,
        getTextFromIdRefs,

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

        getLabelMethod
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
    const timestamp = new Date().toISOString();

    const sharedHelpers = createDomHelpers({
        document,
        window,
        root,
        includeShadowDom,
        excludeSelectors
    });

    const rulesResults = [];

    for (const def of RULE_DEFS) {
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
            contextSelector: ctxSelector
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
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy));
                continue;
            }

            if (!applicable) {
                const raw = {
                    outcome: 'notApplicable',
                    occurrences: [],
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy));
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

        if (!result || typeof result !== 'object') continue;
        if (!result.engineOptions) {
            result.engineOptions = { locale: normalizeLocale(engineOptions && engineOptions.locale) };
        }
        rulesResults.push(normalizeRuleResult(defResolved, result, SCHEMA_VERSION, policy));
    }

    return {
        engine: { tag: ENGINE_TAG, schemaVersion: SCHEMA_VERSION },
        url,
        title,
        timestamp,
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

    const { document, root, helpers, rule } = ctx;
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
            } catch { return 'html'; }
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
    } catch {}
    return null;
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
        try { return Array.from((queryAllSmart ? queryAllSmart("area") : queryAll("area")) || []); }
        catch { return queryAll("area"); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

// Must belong to a *used* image map (referenced by an <img usemap>). If unused, not applicable.
const img = getReferencingImgForArea(el);
if (!img) continue;

// The referencing <img> must be eligible in the accessibility tree.
if (isAccTreeEligible) {
    const imgElig = (() => { try { return isAccTreeEligible(img, ctx); } catch { return { eligible: true, reasons: [] }; } })();
    if (imgElig && imgElig.eligible === false) continue;
}

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

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review whether <area> is decorative (alt=\"\").",
            hint: "Confirm the area does not convey information or function. If it is interactive or meaningful, provide meaningful alt text.",
            i18n: {
                summaryKey: "a11ycore_area_altDecorative_summary_cantTell",
                hintKey: "a11ycore_area_altDecorative_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
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

  function getReferencingImgForArea(areaEl) {
    try {
      if (!areaEl || !areaEl.closest) return null;
      const map = areaEl.closest('map');
      if (!map) return null;

      const mapName = getMapName(map);
      if (!mapName) return null;

      // Deterministic: first matching <img usemap> in document order
      const imgs = Array.from(document.querySelectorAll('img[usemap]'));
      for (const img of imgs) {
        const u = normUsemap(img.getAttribute('usemap'));
        if (u && u === mapName) return img;
      }
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

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
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
    });
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

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;


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
    } catch {}
    return null;
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
        try { return Array.from((queryAllSmart ? queryAllSmart("area") : queryAll("area")) || []); }
        catch { return queryAll("area"); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

// Must belong to a *used* image map (referenced by an <img usemap>). If unused, not applicable.
const img = getReferencingImgForArea(el);
if (!img) continue;

// The referencing <img> must be eligible in the accessibility tree.
if (isAccTreeEligible) {
    const imgElig = (() => { try { return isAccTreeEligible(img, ctx); } catch { return { eligible: true, reasons: [] }; } })();
    if (imgElig && imgElig.eligible === false) continue;
}

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

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review alt text on <area> for accuracy and appropriateness.",
            hint: "Ensure the alt text identifies the destination/action of the image map area in context.",
            i18n: {
                summaryKey: "a11ycore_area_altQuality_summary_cantTell",
                hintKey: "a11ycore_area_altQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        });
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
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
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

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
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
    });
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
        try { return Array.from((queryAllSmart ? queryAllSmart("canvas") : queryAll("canvas")) || []); }
        catch { return queryAll("canvas"); }
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
        if (!((helpers && typeof helpers.getTextAlternativeInfo === 'function' && (function(){ try { const ti = helpers.getTextAlternativeInfo(el, ctx); return !!(ti && ti.present); } catch { return false; } })()))) continue;

        applicableCount += 1;

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review text alternative for <canvas> for equivalence and appropriateness.",
            hint: "Confirm the fallback text or accessible name conveys the same information/function as the canvas content.",
            i18n: {
                summaryKey: "a11ycore_canvas_textAltQuality_summary_cantTell",
                hintKey: "a11ycore_canvas_textAltQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: (function(){ try { return helpers.getTextAlternativeInfo(el, ctx); } catch { return null; } })()
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
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

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
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
    });
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

    const { document, root, helpers, rule } = ctx;
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
            } catch { return 'html'; }
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
        try { return Array.from((queryAllSmart ? queryAllSmart("embed") : queryAll("embed")) || []); }
        catch { return queryAll("embed"); }
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
        if (!((function(){
  try {
    const ariaLabel = String(el.getAttribute('aria-label') || '').trim();
    if (ariaLabel) return true;
    const ariaLb = String(el.getAttribute('aria-labelledby') || '').trim();
    if (ariaLb && helpers && typeof helpers.getTextFromIdRefs === 'function') {
      const t = helpers.getTextFromIdRefs(ariaLb, ctx);
      if (t && t.text && String(t.text).trim()) return true;
    }
    const title = String(el.getAttribute('title') || '').trim();
    if (title) return true;
    return false;
  } catch { return false; }
})())) continue;

        applicableCount += 1;

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review text alternative for <embed> for accuracy and appropriateness.",
            hint: "Confirm the ARIA name or title accurately identifies the embedded content in context.",
            i18n: {
                summaryKey: "a11ycore_embed_textAltQuality_summary_cantTell",
                hintKey: "a11ycore_embed_textAltQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: (function(){ try { return { ariaLabel: el.getAttribute('aria-label')||null, ariaLabelledBy: el.getAttribute('aria-labelledby')||null, title: el.getAttribute('title')||null }; } catch { return null; } })()
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}), applicability: null },
    "a11ycore-form-control-programmatic-label-present": { run: (function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const buildSelector = helpers && typeof helpers.buildSelector === 'function' ? helpers.buildSelector : null;
    const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function' ? helpers.getOuterHtmlSnippet : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
    const getAriaLabelInfo = helpers && typeof helpers.getAriaLabelInfo === 'function' ? helpers.getAriaLabelInfo : null;
    const getAriaLabelledByInfo = helpers && typeof helpers.getAriaLabelledByInfo === 'function' ? helpers.getAriaLabelledByInfo : null;

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

    function getNonEmptyAttr(el, name) {
        if (!getAttributeInfo) return '';
        try {
            const info = getAttributeInfo(el, name);
            return info && info.present ? trim(info.value) : '';
        } catch {
            return '';
        }
    }

    function computeLabelMethodFallback(el) {
        // Deterministic priority order
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
        // Prefer helper if provided, but never trust shape; never throw.
        if (getLabelMethod) {
            try {
                const r = getLabelMethod(el, ctx);
                const m = r && typeof r.method === 'string' ? r.method : 'none';
                const v = r && r.value != null ? trim(r.value) : '';
                // normalize unexpected values deterministically
                if (!Object.prototype.hasOwnProperty.call(metrics.byMethod, m)) return { method: 'none', value: '' };
                return { method: m, value: v };
            } catch {
                // fall through
            }
        }
        return computeLabelMethodFallback(el);
    }

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
            const r = isAccTreeEligible(el, ctx); // signature-safe; helper accepts extra args
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

    function hasLabelAssociation(el) {
        // 1) Native labels API (fast/robust when available)
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

            // Avoid reliance on CSS.escape; do best-effort escaping deterministically.
            const esc = idAttr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const sel = `label[for="${esc}"]`;
            return !!document.querySelector(sel);
        } catch {
            return false;
        }
    }

    // Only labelable-ish controls (conservative, deterministic)
    const selector =
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';

    const nodes = safeQueryAll(selector);

    if (!nodes.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [], data: { details: { metrics } } };
    }

    const occurrences = [];

    for (const el of nodes) {
        if (!el || !el.getAttribute) continue;

        // acc eligibility
        if (!isEligibleAcc(el)) continue;

        // role="presentation"/"none" exclusion only when NOT focusable
        const role = (() => {
            try { return trim(el.getAttribute('role')).toLowerCase(); } catch { return ''; }
        })();
        const fi = getFocusableInfo ? getFocusableInfo(el, ctx) : null;
        const tabbable = !!(fi && fi.tabbable);

        if ((role === 'presentation' || role === 'none') && !tabbable) continue;

        metrics.applicableCount += 1;

        const label = getLabelMethodSafe(el);
        metrics.byMethod[label.method] += 1;

        const strength = getLabelStrength(label.method);
        const ok = label.method !== 'none';

        if (ok) {
            metrics.passCount += 1;
            if (strength === 'weak') metrics.weakPassCount += 1;
            continue;
        }

        metrics.failCount += 1;

        const vf = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: buildSelector ? buildSelector(el) : 'html',
            html: getOuterHtmlSnippet ? getOuterHtmlSnippet(el) : '',
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
        });
    }

    if (metrics.applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [], data: { details: { metrics } } };
    }
    if (occurrences.length) {
        return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences, data: { details: { metrics } } };
    }
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], data: { details: { metrics } } };
}), applicability: null },
    "a11ycore-form-control-programmatic-label-quality": { run: (function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const buildSelector = helpers && typeof helpers.buildSelector === 'function' ? helpers.buildSelector : null;
    const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function' ? helpers.getOuterHtmlSnippet : null;

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

        const fi = getFocusableInfo ? getFocusableInfo(el, ctx) : null;
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

        occurrences.push({
            selector: buildSelector ? buildSelector(el) : 'html',
            html: getOuterHtmlSnippet ? getOuterHtmlSnippet(el) : '',
            summary: 'Form control’s primary label is derived from title or placeholder.',
            hint: 'Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.',
            i18n: {
                summaryKey: 'a11ycore_formControl_programmaticLabelQuality_summary_cantTell',
                hintKey: 'a11ycore_formControl_programmaticLabelQuality_hint_cantTell',
                params: { element: (el.tagName || '').toLowerCase(), method, methodLabel }
            },
            data: {
                visibilityFilter: vf
                    ? { targetSet: vf.targetSet, accEligible: vf.accEligible, reasons: vf.reasons }
                    : { targetSet: 'acc', accEligible: null, reasons: [] },
                details: {
                    reasonCode,
                    labelMethod: method,
                    labelStrength: 'weak',
                    recommendedMethods: ['label', 'aria-labelledby'],
                    sourceText: (label && label.value ? String(label.value).slice(0, 120) : '') // deterministic truncation
                }
            }
        });
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

    if (!html || html.tagName.toLowerCase() !== 'html') {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: 'minor',
            occurrences: []
        };
    }

    let visibilityFilterFromHelper = null;
    if (helpers && typeof helpers.getEligibilityInfo === 'function') {
        try {
            visibilityFilterFromHelper = helpers.getEligibilityInfo(html, ctx, { targetSet: 'acc' });
        } catch {
            visibilityFilterFromHelper = null;
        }
    }

    const visibilityFilter =
        (visibilityFilterFromHelper && typeof visibilityFilterFromHelper === 'object')
            ? visibilityFilterFromHelper
            : { targetSet: 'acc', accEligible: true, reasons: [] };

    const rawLang = html.getAttribute('lang'); // null if missing
    const lang = (rawLang || '').trim();

    if (rawLang === null) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: [{
                selector: 'html',
                html: html.outerHTML,
                i18n: {
                    summaryKey: 'a11ycore_html_lang_attr_missing_absent',
                    hintKey: 'a11ycore_html_lang_attr_hint_missing_absent',
                    params: {}
                },
                data: {
                    visibilityFilter,
                    details: {
                        reasonCode: 'lang-missing',
                        location: 'html'
                    }
                }
            }]
        };
    }

    if (lang.length === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: [{
                selector: 'html',
                html: html.outerHTML,
                i18n: {
                    summaryKey: 'a11ycore_html_lang_attr_missing_empty',
                    hintKey: 'a11ycore_html_lang_attr_hint_missing_empty',
                    params: {}
                },
                data: {
                    visibilityFilter,
                    details: {
                        reasonCode: 'lang-empty',
                        location: 'html'
                    }
                }
            }]
        };
    }

    // Minimal BCP47 primary subtag check
    if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(lang)) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: [{
                selector: 'html',
                html: html.outerHTML,
                i18n: {
                    summaryKey: 'a11ycore_html_lang_attr_invalid',
                    hintKey: 'a11ycore_html_lang_attr_hint_invalid',
                    params: { lang }
                },
                data: {
                    visibilityFilter,
                    details: {
                        reasonCode: 'lang-invalid-bcp47',
                        lang
                    }
                }
            }]
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
        try { return Array.from((queryAllSmart ? queryAllSmart("img") : queryAll("img")) || []); }
        catch { return queryAll("img"); }
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

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review whether <img> is decorative (alt=\"\").",
            hint: "Confirm the image is purely decorative. If it conveys information or function, provide meaningful alt text.",
            i18n: {
                summaryKey: "a11ycore_img_altDecorative_summary_cantTell",
                hintKey: "a11ycore_img_altDecorative_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        });
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
            } catch { return 'html'; }
        };

    const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function'
        ? helpers.getOuterHtmlSnippet
        : (el) => { try { return (el && el.outerHTML) ? String(el.outerHTML).slice(0, 2000) : ''; } catch { return ''; } };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const imgs = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('img') : queryAll('img')) || []); }
        catch { return queryAll('img'); }
    })();

    if (!imgs.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const isFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    for (const el of imgs) {
        if (!el || !el.getAttribute) continue;

        // Applicability: only imgs exposed to assistive tech (with focusable/IDREF exceptions handled by helper)
        let elig = null;
        if (isAccTreeEligible) {
            elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();

            if (elig && elig.eligible === false) {
                continue; // ineligible: does not contribute to pass/fail
            }
        }

        // Role (presentation/none)
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();

        if (role === 'presentation' || role === 'none') {
            // Exclude ONLY if not focusable
            let focusable = false;

            if (isFocusableInfo) {
                const fi = (() => { try { return isFocusableInfo(el, ctx); } catch { return null; } })();
                focusable = !!(fi && fi.focusable);
            } else {
                // deterministic fallback: tabindex presence/valid number
                const tabindex = el.getAttribute('tabindex');
                focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
            }

            if (!focusable) {
                continue; // excluded and does not contribute to pass/fail
            }
        }

        // From here: applicable
        applicableCount += 1;

        const hasAlt = el.getAttribute('alt') !== null;
        if (hasAlt) continue;

        const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector,
            html,
            summary: 'Missing alt attribute on <img>.',
            hint: 'Add an alt attribute (use alt="" only for decorative images).',
            i18n: {
                summaryKey: 'a11ycore_img_altPresent_summary_fail',
                hintKey: 'a11ycore_img_altPresent_hint_fail',
                params: { element: 'img' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
            }
        });
    }

    // If no applicable images, rule is not applicable (even if there are imgs in DOM)
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
            } catch { return 'html'; }
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
        try { return Array.from((queryAllSmart ? queryAllSmart("img") : queryAll("img")) || []); }
        catch { return queryAll("img"); }
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

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review alt text on <img> for accuracy and appropriateness.",
            hint: "Ensure the alt text conveys the image\u2019s purpose/information in context (not redundant, not filename-like).",
            i18n: {
                summaryKey: "a11ycore_img_altQuality_summary_cantTell",
                hintKey: "a11ycore_img_altQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
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
        try { return Array.from((queryAllSmart ? queryAllSmart("input[type=\"image\"]") : queryAll("input[type=\"image\"]")) || []); }
        catch { return queryAll("input[type=\"image\"]"); }
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

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review <input type=\"image\"> with alt=\"\".",
            hint: "This control is typically functional. Confirm it has an equivalent accessible name elsewhere, or provide meaningful alt text.",
            i18n: {
                summaryKey: "a11ycore_inputImage_altDecorative_summary_cantTell",
                hintKey: "a11ycore_inputImage_altDecorative_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        });
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

        const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector,
            html,
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
        });
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
        try { return Array.from((queryAllSmart ? queryAllSmart("input[type=\"image\"]") : queryAll("input[type=\"image\"]")) || []); }
        catch { return queryAll("input[type=\"image\"]"); }
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

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review alt text on <input type=\"image\"> for accuracy and appropriateness.",
            hint: "Ensure the alt text describes the control\u2019s action (e.g., \u201cSearch\u201d, \u201cSubmit order\u201d) in context.",
            i18n: {
                summaryKey: "a11ycore_inputImage_altQuality_summary_cantTell",
                hintKey: "a11ycore_inputImage_altQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        });
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
      // Deterministic: use textContent only (ignore markup). This matches your canvas fallback logic.
      const t = trim(el.textContent || '');
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

    const fb = computeFallbackText(el);
    const name = computeNameInfo(el);

    const hasTextAlt = !!(fb.present || name.present);
    if (hasTextAlt) continue;

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
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
    });
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

    const { document, root, helpers, rule } = ctx;
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
            } catch { return 'html'; }
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
        try { return Array.from((queryAllSmart ? queryAllSmart("object") : queryAll("object")) || []); }
        catch { return queryAll("object"); }
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
        if (!((function(){
  try {
    const fb = String(el.textContent || '').trim();
    if (fb) return true;
    const ariaLabel = String(el.getAttribute('aria-label') || '').trim();
    if (ariaLabel) return true;
    const ariaLb = String(el.getAttribute('aria-labelledby') || '').trim();
    if (ariaLb && helpers && typeof helpers.getTextFromIdRefs === 'function') {
      const t = helpers.getTextFromIdRefs(ariaLb, ctx);
      if (t && t.text && String(t.text).trim()) return true;
    }
    const title = String(el.getAttribute('title') || '').trim();
    if (title) return true;
    return false;
  } catch { return false; }
})())) continue;

        applicableCount += 1;

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review text alternative for <object> for equivalence and appropriateness.",
            hint: "Confirm the fallback content or ARIA name provides an equivalent alternative for the embedded content.",
            i18n: {
                summaryKey: "a11ycore_object_textAltQuality_summary_cantTell",
                hintKey: "a11ycore_object_textAltQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: (function(){ try { return { fallbackText: (String(el.textContent||'').trim()||null), ariaLabel: el.getAttribute('aria-label')||null, ariaLabelledBy: el.getAttribute('aria-labelledby')||null, title: el.getAttribute('title')||null }; } catch { return null; } })()
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
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
      if (!el || !el.childNodes) return '';
      for (const n of Array.from(el.childNodes)) {
        if (!n || n.nodeType !== 1) continue;
        const tn = (n.localName || n.tagName || '').toLowerCase();
        if (tn === localName) {
          const t = trim(n.textContent);
          if (t) return t;
        }
      }
    } catch {}
    return '';
  }

  const images = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('svg image') : queryAll('svg image')) || []); }
    catch { return queryAll('svg image'); }
  })();

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
    const descText = directChildText(el, 'desc');
    const nameInfo = getAccessibleNameInfo ? (() => { try { return getAccessibleNameInfo(el, ctx); } catch { return null; } })() : null;
    const hasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));

    if (titleText || descText || hasName) continue;

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
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
    });
  }

  if (applicableCount === 0) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (!occurrences.length) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-svg-text-alternative-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
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
      } catch { return 'html'; }
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

  const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function'
    ? helpers.getAriaNameInfo
    : null;

  function trim(v) {
    try { return (v == null ? '' : String(v)).trim(); } catch { return ''; }
  }

  function hasNonEmptyTitleOrDesc(svg) {
    try {
      if (!svg || !svg.querySelector) return false;
      const t = svg.querySelector('title');
      if (t) {
        const txt = trim(t.textContent);
        if (txt) return true;
      }
      const d = svg.querySelector('desc');
      if (d) {
        const txt = trim(d.textContent);
        if (txt) return true;
      }
    } catch {}
    return false;
  }

  function hasAriaName(svg) {
    if (!getAriaNameInfo) return false;
    const info = (() => { try { return getAriaNameInfo(svg, ctx); } catch { return null; } })();
    return !!(info && info.present && trim(info.value));
  }

  function isFocusable(svg) {
    if (getFocusableInfo) {
      const fi = (() => { try { return getFocusableInfo(svg, ctx); } catch { return null; } })();
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

  function hasIntentSignal(svg) {
    // Deterministic "intended to be conveyed" approximation.
    // (Prevents flagging decorative inline SVGs that are not exposed as images.)
    const role = (() => {
      try { return String(svg.getAttribute('role') || '').trim().toLowerCase(); }
      catch { return ''; }
    })();

    if (role === 'img') return true;

    // ARIA naming attributes present (even if empty) signals intent; empty values will still fail.
    try {
      if (svg.getAttribute('aria-label') != null) return true;
      if (svg.getAttribute('aria-labelledby') != null) return true;
    } catch {}

    if (hasNonEmptyTitleOrDesc(svg)) return true;
    if (isFocusable(svg)) return true;

    return false;
  }

  const svgs = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []); }
    catch { return queryAll('svg'); }
  })();

  if (!svgs.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of svgs) {
    if (!el || !el.getAttribute) continue;

    // Applicability step 1: only acc-tree eligible nodes (with helper exceptions)
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // Applicability step 2: role (presentation/none) exclusion only when not focusable
    const role = (() => {
      try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
      catch { return ''; }
    })();

    if (role === 'presentation' || role === 'none') {
      if (!isFocusable(el)) continue;
    }

    // Applicability step 3: intent signal gating
    if (!hasIntentSignal(el)) continue;

    applicableCount += 1;

    const ok = hasNonEmptyTitleOrDesc(el) || hasAriaName(el);
    if (ok) continue;

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
      summary: 'Missing text alternative for <svg>.',
      hint: 'Provide a <title> or <desc> element with text, or an ARIA name (aria-label/aria-labelledby).',
      i18n: {
        summaryKey: 'a11ycore_svg_textAltPresent_summary_fail',
        hintKey: 'a11ycore_svg_textAltPresent_hint_fail',
        params: { element: 'svg' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}), applicability: null },
    "a11ycore-svg-text-alternative-quality": { run: (function runInPage(ctx) {

    const { document, root, helpers, rule } = ctx;
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
            } catch { return 'html'; }
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
        try { return Array.from((queryAllSmart ? queryAllSmart("svg") : queryAll("svg")) || []); }
        catch { return queryAll("svg"); }
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
        if (!((function(){
  try {
    const hasTitle = !!el.querySelector && !!el.querySelector('title') && String(el.querySelector('title').textContent || '').trim() !== '';
    const hasDesc = !!el.querySelector && !!el.querySelector('desc') && String(el.querySelector('desc').textContent || '').trim() !== '';
    const ariaLabel = String(el.getAttribute('aria-label') || '').trim();
    const ariaLb = String(el.getAttribute('aria-labelledby') || '').trim();
    if (hasTitle || hasDesc) return true;
    if (ariaLabel) return true;
    if (ariaLb && helpers && typeof helpers.getTextFromIdRefs === 'function') {
      const t = helpers.getTextFromIdRefs(ariaLb, ctx);
      return !!(t && t.text && String(t.text).trim());
    }
    return false;
  } catch { return false; }
})())) continue;

        applicableCount += 1;

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review text alternative for <svg> for accuracy and appropriateness.",
            hint: "Confirm the <title>/<desc> or ARIA name conveys the meaning/purpose of the graphic in context.",
            i18n: {
                summaryKey: "a11ycore_svg_textAltQuality_summary_cantTell",
                hintKey: "a11ycore_svg_textAltQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: (function(){ try { return { hasTitle: !!el.querySelector('title'), hasDesc: !!el.querySelector('desc'), ariaLabel: el.getAttribute('aria-label') || null, ariaLabelledBy: el.getAttribute('aria-labelledby') || null }; } catch { return null; } })()
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}), applicability: null },
    "a11ycore-video-poster-text-alternative-present": { run: (function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
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
        } catch { return 'html'; }
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

  const isFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAccessibleNameInfo = helpers && typeof helpers.getAccessibleNameInfo === 'function'
    ? helpers.getAccessibleNameInfo
    : null;

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  function hasMeaningfulFallbackText(el) {
    try {
      // Best-effort: textContent is deterministic and usually excludes <source>/<track> anyway.
      const t = trim(el && el.textContent);
      return !!t;
    } catch {
      return false;
    }
  }

  const videos = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('video') : queryAll('video')) || []); }
    catch { return queryAll('video'); }
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
    const nameInfo = getAccessibleNameInfo ? (() => { try { return getAccessibleNameInfo(el, ctx); } catch { return null; } })() : null;
    const hasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));

    if (hasFallback || hasName) continue;

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
      summary: 'Missing text alternative for <video> poster.',
      hint: 'Provide an accessible name (e.g., aria-label/aria-labelledby) or meaningful fallback text inside <video>.',
      i18n: {
        summaryKey: 'a11ycore_videoPoster_textAltPresent_summary_fail',
        hintKey: 'a11ycore_videoPoster_textAltPresent_hint_fail',
        params: { element: 'video' }
      },
      data: {
        poster,
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
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
    "a11ycore_html_lang_attr_hint_invalid": "Use a valid BCP 47 language tag in <html lang=\"…\"> (for example: \"en\", \"fr\", \"en-US\")."
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
    "a11ycore_html_lang_attr_hint_invalid": "Utilisez une balise de langue BCP 47 valide dans <html lang=\"…\"> (par exemple : « fr », « en », « fr-FR »)."
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

  function applyI18nParams(str, params) {
    if (typeof str !== 'string' || !str) return '';
    if (!params || typeof params !== 'object') return str;

    // Robust {{param}} interpolation:
    // - allows whitespace: {{ param }}
    // - allows dashes, dots, colons, etc in keys: {{pattern-code}}
  return str.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, rawKey) => {
    const k = String(rawKey || '').trim();
    const v = Object.prototype.hasOwnProperty.call(params, k) ? params[k] : '';
    return v === null || v === undefined ? '' : String(v);
  });
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

function normalizeRuleResult(def, raw, schemaVersion, policy) {
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
    if (typeof o.selector !== 'string') o.selector = '';
    if (typeof o.summary !== 'string') o.summary = '';
    if (typeof o.hint !== 'string') o.hint = '';
    if (typeof o.html !== 'string') o.html = '';
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
    const root = opts && opts.root ? opts.root : null;
    const includeShadowDom = !!(opts && opts.includeShadowDom);
    const excludeSelectors = Array.isArray(opts && opts.excludeSelectors) ? opts.excludeSelectors : [];

    // --- eligibility utilities ---
    const isElement = (n) => !!n && n.nodeType === 1;
    const computedStyle = (el) => {
        try { return window && window.getComputedStyle ? window.getComputedStyle(el) : (el && el.style) || {}; }
        catch { return {}; }
    };
    const getRootNodeSafe = (n) => {
        try { return n && n.getRootNode ? n.getRootNode({ composed: true }) : (document || null); }
        catch { return document || null; }
    };
    const composedParent = (n) => {
        if (!n) return null;
        const p = n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
        if (p) return p;
        const rn = getRootNodeSafe(n);
        return rn && rn.host ? rn.host : null;
    };
    const ancestorsIncludingSelf = (n) => {
        const out = [];
        let cur = n, guard = 0;
        while (cur && guard++ < 200) { out.push(cur); cur = composedParent(cur); }
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
        try { return el && el.getAttribute ? el.getAttribute(name) : null; }
        catch { return null; }
    };

    function parseTabIndex(el) {
        const raw = getAttr(el, 'tabindex');
        const t = trim(raw);
        if (raw == null || t === '') return { has: false, value: null, valid: false };
        const n = Number(t);
        if (Number.isNaN(n)) return { has: true, value: null, valid: false };
        return { has: true, value: n, valid: true };
    }

    function getPlatformFocusability(el) {
        if (!isElement(el)) {
            return { focusable:false, tabbable:false, mechanism:'none', flags:['notElement'] };
        }
        if (hasBlockingInert(el)) {
            return { focusable:false, tabbable:false, mechanism:'none', flags:['inert'] };
        }

        const flags = [];
        const disabled = !!(el.matches && el.matches(':disabled'));
        if (disabled) return { focusable: false, tabbable: false, mechanism: 'disabled', flags: ['disabled'] };

        const ti = parseTabIndex(el);
        if (ti.has) {
            if (!ti.valid) return { focusable: false, tabbable: false, mechanism: 'tabindex', flags: ['tabindex-invalid'] };
            if (ti.value < 0) return { focusable: true, tabbable: false, mechanism: 'tabindex', flags: ['tabindex-negative'] };
            return { focusable: true, tabbable: true, mechanism: 'tabindex', flags: ['tabindex-nonnegative'] };
        }

        // native focusability
        // (keep your existing logic here; when it returns true, consider it tabbable)
        const native = isPlatformFocusable(el); // uses your existing boolean logic
        if (native) return { focusable: true, tabbable: true, mechanism: 'native', flags };

        return { focusable: false, tabbable: false, mechanism: 'none', flags };
    }

    // --- attribute ---
    function getAttributeInfo(el, attr) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const attrValue = trim(getAttr(el, attr));
        if (!attrValue) return { present: false, value: '', mechanism: attr, flags: ['empty'] };

        return { present: true, value: attrValue, mechanism: attr, flags };
    }

    // --- ARIA name primitives (reusable across rules) ---
    function getAriaLabelInfo(el) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const ariaLabel = trim(getAttr(el, 'aria-label'));
        if (!ariaLabel) return { present: false, value: '', mechanism: 'aria-label', flags: ['empty'] };

        return { present: true, value: ariaLabel, mechanism: 'aria-label', flags };
    }

    function getAriaLabelledByInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const ariaLabelledBy = trim(getAttr(el, 'aria-labelledby'));
        if (!ariaLabelledBy) return { present: false, value: '', mechanism: 'aria-labelledby', flags: ['missing'] };

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
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const lb = getAriaLabelledByInfo(el, _ctx, opts);
        if (lb.present && lb.value) return { present: true, value: lb.value, mechanism: 'aria-labelledby', flags: flags.concat(lb.flags || []) };

        const al = getAriaLabelInfo(el);
        if (al.present && al.value) return { present: true, value: al.value, mechanism: 'aria-label', flags: flags.concat(al.flags || []) };

        // If aria-labelledby existed but was empty/unresolvable, preserve that info in flags.
        if (trim(getAttr(el, 'aria-labelledby'))) flags.push('aria-labelledby-empty-or-unresolvable');
        if (getAttr(el, 'aria-label') != null && !trim(getAttr(el, 'aria-label'))) flags.push('aria-label-empty');

        return { present: false, value: '', mechanism: 'none', flags };
    }

    const lower = (v) => trim(v).toLowerCase();

    const safeDocGetById = (id) => {
        try {
            if (document && document.getElementById) return document.getElementById(id);
        } catch {}
        return null;
    };

    const safeRootQueryById = (id) => {
        // Best-effort for cases where root is not the document (e.g. shadow root-like, fragment roots).
        // Note: IDs are document-global in HTML, but test harnesses may use scoped roots.
        if (!root || !root.querySelector) return null;
        try { return root.querySelector('#' + id); } catch { return null; }
    };

    function inClosedDetailsContent(node) {
        try {
            if (!isElement(node)) return false;
            const summary = node.closest && node.closest('summary');
            if (summary && summary.contains(node)) return false;
            const details = node.closest && node.closest('details');
            if (details && !details.hasAttribute('open')) return true;
        } catch {}
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
                    const esc = (s) => {
                        try { return window && window.CSS && typeof window.CSS.escape === 'function' ? window.CSS.escape(s) : s; }
                        catch { return s; }
                    };
                    const n = esc(rawName);

                    // Be practical: accept both "#name" and "name", and ignore case.
                    const sels = [
                        `img[usemap="#${n}" i]`,
                        `img[usemap="${n}" i]`
                    ];

                    for (const sel of sels) {
                        try {
                            if (document.querySelector(sel)) return true;
                        } catch {}
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

    function isReferencedByVisibleIdRef(node) {
        if (!document || !isElement(node)) return false;
        const id = node.getAttribute && node.getAttribute('id');
        if (!id || !id.trim()) return false;
        const esc = (s) => {
            try { return window && window.CSS && typeof window.CSS.escape === 'function' ? window.CSS.escape(s) : s; }
            catch { return s; }
        };
        const idSel = esc(id.trim());
        const refs = [
            ...Array.from(document.querySelectorAll('[aria-labelledby~="' + idSel + '"]')),
            ...Array.from(document.querySelectorAll('[aria-describedby~="' + idSel + '"]')),
        ];
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
        const results = [];
        const seen = new Set();

        function pushAll(node) {
            if (!node || !node.querySelectorAll) return;
            let els = [];
            try {
                els = Array.from(node.querySelectorAll(sel));
            } catch {
                els = [];
            }
            for (const el of els) {
                if (el && !seen.has(el) && !isExcluded(el)) {
                    seen.add(el);
                    results.push(el);
                }
            }
        }

        function walk(node) {
            if (!node) return;
            if (node.nodeType === 1 && isExcluded(node)) return;

            pushAll(node);

            let all = [];
            try {
                all = node.querySelectorAll ? Array.from(node.querySelectorAll('*')) : [];
            } catch {
                all = [];
            }

            for (const el of all) {
                if (el && el.shadowRoot) walk(el.shadowRoot);
            }
        }

        walk(root);
        return results;
    }

    function queryAllSmart(sel) {
        const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
        return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
    }

    function getOuterHtmlSnippet(el) {
        if (!el || typeof el !== 'object') return '';
        try {
            const html = el.outerHTML || '';
            if (html.length > 2000) return html.slice(0, 2000) + '…';
            return html;
        } catch {
            return '';
        }
    }

    // --- Accessibility-tree eligibility (ordered checks) ---
    function isAccTreeEligible(node) {
        const reasons = [];
        if (!isElement(node)) return { eligible: false, reasons: ['notElement'] };

        // If shadow traversal is disabled and node is outside root, treat as non-composed
        if (root && !includeShadowDom) {
            try { if (!root.contains(node)) return { eligible: false, reasons: ['nonComposed'] }; } catch {}
        }

        const chain = ancestorsIncludingSelf(node);

        // 1) HTML/DOM hiding
        for (const a of chain) {
            if (!isElement(a)) continue;
            if (a.hasAttribute && a.hasAttribute('hidden')) return { eligible: false, reasons: ['hiddenAttr'] };
            const tn = (a.tagName || '').toLowerCase();
            if (tn === 'template') return { eligible: false, reasons: ['templateContent'] };
            if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') {
                return { eligible: false, reasons: ['nonRenderedElement'] };
            }
            if (tn === 'input') {
                const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                if (t === 'hidden') return { eligible: false, reasons: ['inputHidden'] };
            }
        }
        if (inClosedDetailsContent(node)) return { eligible: false, reasons: ['detailsClosed'] };

        // 2) Inertness / modality
        if (hasBlockingInert(node)) {
            return { eligible: false, reasons: ['inert'] };
        }
        // Modal dialog (best effort)
        try {
            const openModals = document ? Array.from(document.querySelectorAll('dialog[open][aria-modal="true"]')) : [];
            if (openModals.length) {
                let inside = false;
                for (const d of openModals) { if (d.contains(node)) { inside = true; break; } }
                if (!inside) return { eligible: false, reasons: ['modalInert'] };
            }
        } catch {}

        // 3) CSS rendering suppression
        for (const a of chain) {
            if (!isElement(a)) continue;

            // <area> is a non-rendered element; some DOMs report display:none for it.
            // Don’t treat the *area itself* as ineligible based on computed style.
            if (a === node) {
                const tn = (a.tagName || '').toLowerCase();
                if (tn === 'area') continue;
            }

            const cs = computedStyle(a);
            if (cs && cs.display === 'none') return { eligible: false, reasons: ['displayNone'] };
            if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
                return { eligible: false, reasons: ['visibilityHidden'] };
            }
        }

        // 4) ARIA subtree hiding with exceptions
        let ariaHidden = false;
        for (const a of chain) {
            if (!isElement(a)) continue;
            const v = a.getAttribute && a.getAttribute('aria-hidden');
            if (v != null && String(v).trim().toLowerCase() === 'true') { ariaHidden = true; break; }
        }
        if (ariaHidden) {
            const f = getPlatformFocusability(node);
            const idref = isReferencedByVisibleIdRef(node);

            // IDREF exception stays
            if (idref) return { eligible: true, reasons: ['ariaHiddenOverriddenIdref'] };

            // Only tabbable focus overrides aria-hidden
            if (f && f.tabbable) return { eligible: true, reasons: ['ariaHiddenOverriddenTabbable'] };

            // Programmatic focus (tabindex < 0) does NOT override eligibility
            if (f && f.focusable && !f.tabbable) {
                return { eligible: false, reasons: ['ariaHiddenProgrammaticFocusExcluded'] };
            }

            return { eligible: false, reasons: ['ariaHidden'] };
        }

        // 5/6 handled implicitly; 7 already covered
        return { eligible: true, reasons };
    }

    // A) wrapper: standardized eligibility info for logging
    function getEligibilityInfo(node, _ctx, opts) {
        const targetSet = opts && (opts.targetSet === 'acc' || opts.targetSet === 'dom') ? opts.targetSet : 'dom';
        const r = isAccTreeEligible(node); // signature-safe
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
        if (!raw) return { refs: [], missing: [], flags: ['empty'] };

        const parts = raw.split(/\s+/).filter(Boolean);
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
        if (opts && opts.maxRefs && refs.length > opts.maxRefs) {
            // deterministic truncation if requested
            refs.length = Math.max(0, Number(opts.maxRefs) | 0);
            flags.push('truncated');
        }

        return { refs, missing, flags };
    }

    function getTextFromIdRefs(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);
        const texts = [];
        for (const el of r.refs) {
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {}
        }
        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');
        return { text, refsCount: r.refs.length, missing: r.missing.slice(0), flags };
    }

    // B) Accessible name / description helpers (mechanism-first, but scoped & deterministic)
    function getAccessibleNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const aria = getAriaNameInfo(el, _ctx, opts);
        if (aria && aria.present && aria.value) {
            return { present: true, value: aria.value, mechanism: aria.mechanism, flags: flags.concat(aria.flags || []) };
        }
        if (aria && aria.flags && aria.flags.length) {
            for (const f of aria.flags) flags.push(f);
        }

        // Explicit <label for="..."> or wrapping <label> (common and deterministic for form controls)
        // Note: This is not a full Accessible Name Computation; it is a pragmatic, stable subset.
        const id = trim(getAttr(el, 'id'));
        if (id && document && document.querySelector) {
            try {
                // Avoid CSS.escape reliance for determinism/availability; do best effort.
                const sel = 'label[for="' + id.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
                const label = document.querySelector(sel);
                const lt = label ? trim(label.textContent) : '';
                if (lt) return { present: true, value: lt, mechanism: 'label', flags };
            } catch {}
        }
        if (el.closest) {
            try {
                const wrap = el.closest('label');
                const wt = wrap ? trim(wrap.textContent) : '';
                if (wt) return { present: true, value: wt, mechanism: 'label', flags };
            } catch {}
        }

        // Optionally allow contents-based names for obvious elements.
        // Default: allow for <button>, <a>, <summary> (very common, deterministic).
        const allowContents = !(opts && opts.disallowContents === true);
        if (allowContents) {
            const tag = lower(el.tagName);
            const isContentsNamed =
                tag === 'button' ||
                tag === 'a' ||
                tag === 'summary';
            if (isContentsNamed) {
                const ct = trim(el.textContent);
                if (ct) return { present: true, value: ct, mechanism: 'contents', flags };
            }
        }

        const title = trim(getAttr(el, 'title'));
        if (title) {
            flags.push('title-used');
            return { present: true, value: title, mechanism: 'title', flags };
        }

        return { present: false, value: '', mechanism: 'none', flags };
    }

    function getAccessibleDescriptionInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const describedBy = trim(getAttr(el, 'aria-describedby'));
        if (describedBy) {
            const t = getTextFromIdRefs(describedBy, _ctx, opts);
            for (const f of t.flags) flags.push(f);
            if (t.text) return { present: true, value: t.text, mechanism: 'aria-describedby', flags };
            flags.push('empty');
            // fall through
        }

        const allowTitle = !!(opts && opts.allowTitle === true);
        if (allowTitle) {
            const title = trim(getAttr(el, 'title'));
            if (title) {
                flags.push('title-used');
                return { present: true, value: title, mechanism: 'title', flags };
            }
        }

        return { present: false, value: '', mechanism: 'none', flags };
    }

    // C) Text alternative helper (mechanism-aware by element/type)
    function getTextAlternativeInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) {
            return { present: false, value: '', mechanism: 'unsupported', requiredMechanism: 'unknown', flags: ['notElement'] };
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

        return { present: false, value: '', mechanism: 'unsupported', requiredMechanism: 'unknown', flags: ['unsupported-element'] };
    }

    // D) Role + focusability helpers
    function getRoleInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { role: '', source: 'none', flags: ['notElement'] };

        const explicit = trim(getAttr(el, 'role'));
        if (explicit) {
            const v = explicit;
            const low = v.toLowerCase();
            if (low === 'presentation' || low === 'none') flags.push('presentation');
            // Minimal sanity: role token should not contain spaces beyond role list; keep deterministic
            if (/\s/.test(v)) flags.push('multiple-roles');
            return { role: v, source: 'explicit', flags };
        }

        const allowImplicit = !(opts && opts.disallowImplicit === true);
        if (!allowImplicit) return { role: '', source: 'none', flags };

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

        if (role) return { role, source: 'implicit', flags };
        return { role: '', source: 'none', flags };
    }

    function getFocusableInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement'] };

        const pf = getPlatformFocusability(el); // returns focusable + tabbable + mechanism + flags
        // Merge flags deterministically
        const outFlags = []
            .concat(Array.isArray(flags) ? flags : [])
            .concat(Array.isArray(pf.flags) ? pf.flags : []);

        return {
            focusable: !!pf.focusable,
            tabbable: !!pf.tabbable,
            mechanism: pf.mechanism || 'none',
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

        return { idCount, testIdCount, nameCount, ariaLabelCount, roleAriaLabelCount };
    }

    function buildSimpleSelector(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return fallbackTag || 'html';

            const tag = (el.tagName || fallbackTag || 'html').toLowerCase();

            const cssEscapeIdent = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {}
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

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

    let __uniqIndex = null;
    function getUniqIndex() {
        if (__uniqIndex) return __uniqIndex;
        __uniqIndex = createSelectorUniqIndex();
        return __uniqIndex;
    }

    function buildSelector(el) {
        const escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        try {
            if (!el || el.nodeType !== 1) return 'html';

            const cssEscape = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {}
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
                sib = node.previousElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) { hasSame = true; break; }
                    sib = sib.previousElementSibling;
                }
                if (!hasSame) {
                    sib = node.nextElementSibling;
                    while (sib) {
                        if ((sib.tagName || '').toLowerCase() === t) { hasSame = true; break; }
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
            } catch {}

            return buildSimpleSelector(el, tag || 'html');
        } catch {
            return 'html';
        }
    }

    function getNonEmptyTitle(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'title');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch { return null; }
    }

    function getNonEmptyPlaceholder(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'placeholder');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch { return null; }
    }

    function getLabelMethod(el) {
        // returns { method, value } where value is best-effort text, deterministically trimmed
        if (hasLabelAssociation(el)) return { method: 'label', value: null };

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

        const titleV = getNonEmptyTitle(el);
        if (titleV) return { method: 'title', value: titleV };

        const phV = getNonEmptyPlaceholder(el);
        if (phV) return { method: 'placeholder', value: phV };

        return { method: 'none', value: null };
    }

    function getLabelStrength(method) {
        // policy choice; this is deterministic and tweakable
        if (method === 'label' || method === 'aria-labelledby') return 'strong';
        if (method === 'aria-label') return 'medium';
        if (method === 'title' || method === 'placeholder') return 'weak';
        return 'none';
    }

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

        // Eligibility info wrapper
        getEligibilityInfo,

        // IDREF primitives
        resolveIdRefs,
        getTextFromIdRefs,

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

        getLabelMethod
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
    const timestamp = new Date().toISOString();

    const sharedHelpers = createDomHelpers({
        document,
        window,
        root,
        includeShadowDom,
        excludeSelectors
    });

    const rulesResults = [];

    for (const def of RULE_DEFS) {
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
            contextSelector: ctxSelector
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
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy));
                continue;
            }

            if (!applicable) {
                const raw = {
                    outcome: 'notApplicable',
                    occurrences: [],
                    engineOptions: { locale: normalizeLocale(engineOptions && engineOptions.locale) }
                };
                rulesResults.push(normalizeRuleResult(defResolved, raw, SCHEMA_VERSION, policy));
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

        if (!result || typeof result !== 'object') continue;
        if (!result.engineOptions) {
            result.engineOptions = { locale: normalizeLocale(engineOptions && engineOptions.locale) };
        }
        rulesResults.push(normalizeRuleResult(defResolved, result, SCHEMA_VERSION, policy));
    }

    return {
        engine: { tag: ENGINE_TAG, schemaVersion: SCHEMA_VERSION },
        url,
        title,
        timestamp,
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
