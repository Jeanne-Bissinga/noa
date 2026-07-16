import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: ["node_modules/**", ".next/**"],
  },
  {
    rules: {
      // UI en français : les apostrophes (« d'être », « l'entretien »…) dans le
      // texte JSX sont légitimes. Les échapper en &apos; nuirait à la lisibilité.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
