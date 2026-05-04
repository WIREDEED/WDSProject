(() => {
  const init = async () => {
    const { normalizePageLinks, showToast } = await import("./ui.js");
    const { bootSupabaseApp } = await import("./supabase-app.js");

    normalizePageLinks();
    await bootSupabaseApp({ showToast });
  };

  init().catch((error) => {
    console.error("Admin app load failed:", error);
    import("./ui.js").then(({ showToast }) => {
      showToast("error", error?.message || "The admin portal could not finish loading.");
    });
  });
})();
