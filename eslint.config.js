import hopeConfig, {
  config,
  globals,
  tsConfigs,
  tsParser,
} from "eslint-config-mister-hope";

export default config(
  ...hopeConfig,

  {
    ignores: ["**/node_modules/**", ".temp/**", "dist/**"],
  },

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "commitlint.config.ts",
            "eslint.config.js",
            "gulpfile.cjs",
            "scripts/*.js",
          ],
        },
        parser: tsParser,
        tsconfigDirName: import.meta.dirname,
        extraFileExtensions: [".wxs"],
      },
    },
  },

  {
    files: ["app/**/*.ts"],
    languageOptions: {
      globals: {
        wx: "readonly",
        getApp: "readonly",
        getCurrentPages: "readonly",
        App: "readonly",
        Page: "readonly",
        Component: "readonly",
        getRegExp: "readonly",
      },
    },
  },

  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "property",
          filter: {
            regex: "Content-Type",
            match: true,
          },
          format: null,
        },
        {
          selector: "default",
          format: ["camelCase"],
        },
        {
          selector: ["variable"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["parameter"],
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["property"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "import",
          format: ["PascalCase", "camelCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["PascalCase"],
        },
      ],

      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },

  {
    files: ["app/**/*.wxs"],
    ...tsConfigs.disableTypeChecked,
  },

  {
    files: ["app/**/*.wxs"],
    languageOptions: {
      ecmaVersion: 5,
      globals: {
        getDate: "readonly",
        getRegExp: "readonly",
        console: "readonly",
        module: "readonly",
      },
    },
    rules: {
      curly: ["error", "all"],
      "func-names": ["error", "never"],
      "func-style": ["error", "declaration"],
      "no-var": "off",
      "object-shorthand": ["error", "never"],
      "prefer-destructuring": "off",
      "prefer-template": "off",

      "@typescript-eslint/no-var-requires": "off",

      "import/no-commonjs": "off",
      "import/no-default-export": "off",
      "import/no-named-export": "off",
    },
  },

  {
    files: ["scripts/**/*.js", "gulpfile.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
