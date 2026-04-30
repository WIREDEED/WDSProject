(() => {
  const init = async () => {
    const { normalizePageLinks, showToast } = await import("./lib/ui.js");
    const { bootSupabaseApp } = await import("./lib/supabase-app.js?v=admin-boot-3");

    normalizePageLinks();
    await bootSupabaseApp({ showToast });
  };

  init().catch((error) => {
    console.error("Admin app load failed:", error);
    import("./lib/ui.js").then(({ showToast }) => {
      showToast("error", error?.message || "The admin portal could not finish loading.");
    });
  });
})();
