import type { ComponentProps } from 'react';
import type { ClerkProvider } from '@clerk/nextjs';

type ClerkAppearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>;

/** Shared Clerk colors and styles. Surface-specific overrides preserve the
 * existing auth/profile and embedded roster appearances without changing roles
 * or authentication. Inline style objects intentionally win over Clerk CSS. */
const IVORY     = '#f0f2ee';
const IVORY_DIM = '#c4ccca';
const GOLD      = '#c9a548';
const GOLD_LT   = '#e4c97a';
const BLACK_2   = '#0c110e';
const BLACK_3   = '#131a16';
const BLACK_4   = '#1a221d';
const BORDER    = 'rgba(255,255,255,0.07)';

const sharedVariables = {
  "colorPrimary": GOLD,
  "colorBackground": BLACK_2,
  "colorInputBackground": BLACK_3,
  "colorInputText": IVORY,
  "colorText": IVORY,
  "colorTextSecondary": IVORY_DIM,
  "colorNeutral": IVORY,
  "colorDanger": "#dc2626",
  "fontFamily": "var(--font-inter)",
  "borderRadius": "0.125rem"
} as const;

const sharedElements = {
  "footerActionLink": {
    "color": GOLD_LT
  },
  "formButtonPrimary": {
    "background": GOLD,
    "color": "#000",
    "fontSize": "0.7rem",
    "fontWeight": 500,
    "textTransform": "uppercase",
    "letterSpacing": "0.07em",
    "borderRadius": "0.125rem"
  },
  "navbar": {
    "background": BLACK_3,
    "borderRight": `1px solid ${BORDER}`
  },
  "navbarButton": {
    "color": IVORY_DIM,
    "borderRadius": "0.125rem"
  },
  "navbarButton__active": {
    "color": IVORY,
    "background": BLACK_4
  },
  "navbarButtonIcon": {
    "color": IVORY_DIM
  },
  "pageScrollBox": {
    "background": BLACK_2
  },
  "scrollBox": {
    "background": BLACK_2
  },
  "profileSectionTitle": {
    "borderBottom": `1px solid ${BORDER}`
  },
  "profileSectionTitleText": {
    "color": IVORY,
    "fontSize": "0.68rem",
    "fontWeight": 500,
    "letterSpacing": "0.14em",
    "textTransform": "uppercase"
  },
  "profileSectionContent": {
    "color": IVORY_DIM
  },
  "profileSectionItem": {
    "color": IVORY_DIM
  },
  "profileSectionPrimaryButton": {
    "color": IVORY,
    "background": "transparent",
    "border": `1px solid ${BORDER}`,
    "borderRadius": "0.125rem",
    "fontSize": "0.7rem",
    "fontWeight": 500
  },
  "formFieldLabel": {
    "color": IVORY_DIM,
    "fontSize": "0.7rem",
    "letterSpacing": "0.1em",
    "textTransform": "uppercase"
  },
  "formFieldHintText": {
    "color": IVORY_DIM
  },
  "formFieldErrorText": {
    "color": "#f87171"
  },
  "formButtonReset": {
    "color": IVORY_DIM
  },
  "badgeText": {
    "color": IVORY_DIM,
    "fontSize": "0.65rem"
  },
  "formButtonDanger": {
    "color": "#f87171"
  },
  "alertText": {
    "color": IVORY_DIM
  }
} as const;

export const dashboardClerkAppearance = {
  variables: {
    ...sharedVariables,
    "colorSuccess": "#2d6a4f"
  },
  elements: {
    ...sharedElements,
    "card": "bg-black-2 border border-border-sub shadow-2xl",
    "modalContent": {
      "background": BLACK_2,
      "border": `1px solid ${BORDER}`
    },
    "modalCloseButton": {
      "color": IVORY_DIM
    },
    "headerTitle": "font-display font-light text-ivory text-3xl",
    "headerSubtitle": {
      "color": IVORY_DIM
    },
    "socialButtonsBlockButton": "border-border-sub bg-black-3 hover:bg-black-4 text-ivory",
    "userPreviewMainIdentifier": {
      "color": IVORY
    },
    "userPreviewSecondaryIdentifier": {
      "color": IVORY_DIM
    },
    "accordionTriggerButton": {
      "color": IVORY_DIM
    },
    "accordionContent": {
      "color": IVORY_DIM
    },
    "formFieldInput": {
      "color": IVORY,
      "background": BLACK_3,
      "border": `1px solid ${BORDER}`
    },
    "badge": {
      "color": IVORY_DIM,
      "background": BLACK_4,
      "border": `1px solid ${BORDER}`
    }
  },
} satisfies ClerkAppearance;

export const rosterClerkAppearance = {
  variables: {
    ...sharedVariables,
  },
  elements: {
    ...sharedElements,
    "card": {
      "background": BLACK_2,
      "border": `1px solid ${BORDER}`,
      "borderRadius": "0.125rem",
      "boxShadow": "none"
    },
    "formFieldInput": {
      "color": IVORY,
      "background": BLACK_3,
      "border": `1px solid ${BORDER}`,
      "borderRadius": "0.125rem"
    },
    "badge": {
      "color": IVORY_DIM,
      "background": BLACK_4,
      "border": `1px solid ${BORDER}`,
      "borderRadius": "0.125rem"
    },
    "rootBox": {
      "width": "100%"
    },
    "organizationPreviewMainIdentifier": {
      "color": IVORY
    },
    "organizationPreviewSecondaryIdentifier": {
      "color": IVORY_DIM
    },
    "organizationPreviewAvatarBox": {
      "borderRadius": "0.125rem"
    },
    "tableHead": {
      "background": BLACK_3,
      "borderBottom": `1px solid ${BORDER}`
    },
    "tableBody": {
      "background": BLACK_2
    },
    "select": {
      "background": BLACK_3,
      "border": `1px solid ${BORDER}`
    },
    "selectButton": {
      "background": BLACK_3,
      "color": IVORY,
      "border": `1px solid ${BORDER}`
    },
    "selectOption": {
      "background": BLACK_3,
      "color": IVORY
    },
    "selectOptions": {
      "background": BLACK_3,
      "border": `1px solid ${BORDER}`
    }
  },
} satisfies ClerkAppearance;
