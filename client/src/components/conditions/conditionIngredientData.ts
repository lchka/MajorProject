// Ingredient data for each condition: soothing and warning ingredients with explanations
export type IngredientInfo = { name: string; explanation: string };
export type ConditionIngredientData = {
  [key: string]: {
    soothing: IngredientInfo[];
    warning: IngredientInfo[];
  };
};

export const conditionIngredientData: ConditionIngredientData = {
  Psoriasis: {
    soothing: [
      { name: "Ceramides", explanation: "Help restore skin barrier and retain moisture." },
      { name: "Salicylic acid (low %)", explanation: "Gently exfoliates and reduces scaling." },
      { name: "Aloe vera", explanation: "Soothes and calms irritated skin." },
    ],
    warning: [
      { name: "Fragrance", explanation: "Can trigger irritation or allergic reactions." },
      { name: "Alcohol", explanation: "May dry out and irritate skin." },
      { name: "Harsh exfoliants", explanation: "Can worsen irritation and damage skin barrier." },
    ],
  },
  Eczema: {
    soothing: [
      { name: "Ceramides", explanation: "Restore and protect the skin barrier." },
      { name: "Colloidal oatmeal", explanation: "Soothes itching and inflammation." },
      { name: "Shea butter", explanation: "Deeply moisturizes and nourishes." },
    ],
    warning: [
      { name: "Fragrance", explanation: "Common trigger for eczema flare-ups." },
      { name: "Alcohol", explanation: "Can dry and irritate sensitive skin." },
      { name: "Essential oils", explanation: "May cause irritation or allergic reactions." },
    ],
  },
  Acne: {
    soothing: [
      { name: "Niacinamide", explanation: "Reduces inflammation and regulates oil." },
      { name: "Zinc", explanation: "Helps control oil and calm breakouts." },
      { name: "Aloe vera", explanation: "Soothes redness and irritation." },
    ],
    warning: [
      { name: "Heavy oils (comedogenic)", explanation: "Can clog pores and worsen acne." },
      { name: "Alcohol (overuse)", explanation: "May dry out and irritate skin." },
      { name: "Pore-clogging ingredients", explanation: "Increase risk of breakouts." },
    ],
  },
  Rosacea: {
    soothing: [
      { name: "Niacinamide", explanation: "Soothes redness and strengthens barrier." },
      { name: "Azelaic acid", explanation: "Reduces redness and bumps." },
      { name: "Centella asiatica", explanation: "Calms and repairs skin." },
    ],
    warning: [
      { name: "Alcohol", explanation: "Can trigger flare-ups and dryness." },
      { name: "Fragrance", explanation: "May irritate sensitive skin." },
      { name: "Spicy ingredients", explanation: "Can worsen redness and irritation." },
    ],
  },
  Vitiligo: {
    soothing: [
      { name: "Gentle moisturisers", explanation: "Help maintain skin hydration." },
      { name: "Antioxidants (vitamin C, E)", explanation: "Protect against oxidative stress." },
      { name: "Sunscreen", explanation: "Prevents sunburn and further pigment loss." },
    ],
    warning: [
      { name: "Harsh chemicals", explanation: "Can irritate depigmented skin." },
      { name: "Irritants", explanation: "May worsen sensitivity." },
      { name: "Unprotected sun exposure", explanation: "Increases risk of sunburn." },
    ],
  },
  "Seborrheic Dermatitis": {
    soothing: [
      { name: "Zinc pyrithione", explanation: "Antifungal and anti-inflammatory." },
      { name: "Ketoconazole", explanation: "Reduces yeast and inflammation." },
      { name: "Niacinamide", explanation: "Soothes and strengthens skin." },
    ],
    warning: [
      { name: "Heavy oils", explanation: "Can worsen greasiness and flares." },
      { name: "Fatty alcohols (in some cases)", explanation: "May aggravate symptoms for some." },
      { name: "Fragrance", explanation: "Can trigger irritation." },
    ],
  },
  Hives: {
    soothing: [
      { name: "Aloe vera", explanation: "Soothes itching and redness." },
      { name: "Colloidal oatmeal", explanation: "Calms and relieves irritation." },
      { name: "Antihistamine-supporting ingredients", explanation: "Help reduce allergic response." },
    ],
    warning: [
      { name: "Fragrance", explanation: "May worsen allergic reactions." },
      { name: "Alcohol", explanation: "Can dry and irritate skin." },
      { name: "Known allergens", explanation: "Should be strictly avoided." },
    ],
  },
  "Contact Dermatitis": {
    soothing: [
      { name: "Ceramides", explanation: "Restore and protect the skin barrier." },
      { name: "Panthenol", explanation: "Soothes and repairs irritated skin." },
      { name: "Oatmeal", explanation: "Reduces itching and inflammation." },
    ],
    warning: [
      { name: "Fragrance", explanation: "Common irritant for sensitive skin." },
      { name: "Preservatives (like parabens for some)", explanation: "May trigger reactions in some individuals." },
      { name: "Irritants", explanation: "Should be avoided to prevent flares." },
    ],
  },
  Melasma: {
    soothing: [
      { name: "Vitamin C", explanation: "Brightens and protects skin." },
      { name: "Niacinamide", explanation: "Evens skin tone and soothes." },
      { name: "Azelaic acid", explanation: "Reduces pigmentation and inflammation." },
    ],
    warning: [
      { name: "Sun exposure", explanation: "Worsens pigmentation." },
      { name: "Heat", explanation: "Can trigger melasma in some." },
      { name: "Irritating actives (overuse of acids/retinoids)", explanation: "May worsen sensitivity." },
    ],
  },
  Folliculitis: {
    soothing: [
      { name: "Salicylic acid", explanation: "Unclogs pores and reduces bumps." },
      { name: "Tea tree (low %)", explanation: "Antimicrobial and calming." },
      { name: "Benzoyl peroxide", explanation: "Reduces bacteria and inflammation." },
    ],
    warning: [
      { name: "Occlusive oils", explanation: "Can trap sweat and bacteria." },
      { name: "Tight/occlusive products", explanation: "May worsen follicle blockage." },
      { name: "Sweat buildup", explanation: "Can aggravate symptoms." },
    ],
  },
};
