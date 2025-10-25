module.exports = function (api) {
  api.cache(true);

  return {
    presets: [["babel-preset-expo"], "nativewind/babel"],

    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],

          alias: {
            "@": "./",
            "@/components": "./components",
            "@/lib": "./lib",
            "@/assets": "./assets",
            "@/store": "./lib/store",
            "@/services": "./lib/services",
            "@/types": "./lib/types",
            "@/constants": "./lib/constants",
            "@/hooks": "./lib/hooks",
            "@/utils": "./lib/utils",
            "tailwind.config": "./tailwind.config.js",
          },
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
