(() => {
  const init = async () => {
    const { normalizePageLinks, showToast } = await import("./ui.js?v=admin-boot-8");
    const { bootSupabaseApp } = await import("./supabase-app.js?v=admin-boot-8");

    normalizePageLinks();
    await bootSupabaseApp({ showToast });
  };

  init().catch((error) => {
    console.error("Admin app load failed:", error);
    import("./ui.js?v=admin-boot-8").then(({ showToast }) => {
      showToast("error", error?.message || "The admin portal could not finish loading.");
    });
  });
})();
