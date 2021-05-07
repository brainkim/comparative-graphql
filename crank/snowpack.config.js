module.exports = {
  mount: {
    public: "/",
    src: "/_dist_",
  },
  plugins: [
    "@snowpack/plugin-dotenv",
    "@snowpack/plugin-babel",
    "@snowpack/plugin-typescript",
  ],
  installOptions: {
    installTypes: true,
  },

  devOptions: {
    "open": "none",
    "hmrErrorOverlay": false,
    "port": 4001,
  },
};
