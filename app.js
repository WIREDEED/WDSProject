(() => {
  const applyInputFormatting = () => {
    const formatPhoneNumber = (value) => {
      const digits = String(value || "").replace(/\D/g, "").slice(0, 10);

      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    const formatCardNumber = (value) =>
      String(value || "")
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ")
        .trim();

    const formatExpiry = (value) => {
      const digits = String(value || "").replace(/\D/g, "").slice(0, 4);
      return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
    };

    const formatCvv = (value) => String(value || "").replace(/\D/g, "").slice(0, 4);

    document.addEventListener("input", (event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement)) return;

      if (target.dataset.format === "phone") target.value = formatPhoneNumber(target.value);
      if (target.dataset.format === "card") target.value = formatCardNumber(target.value);
      if (target.dataset.format === "expiry") target.value = formatExpiry(target.value);
      if (target.dataset.format === "cvv") target.value = formatCvv(target.value);
    });
  };

  const showQueryToast = async () => {
    const { showToast, buildPageUrl, getCurrentFileName } = await import("./lib/ui.js");
    const params = new URLSearchParams(window.location.search);
    const queryError = params.get("error");
    const querySuccess = params.get("success");

    if (queryError) {
      showToast("error", queryError);
      params.delete("error");
    }

    if (querySuccess) {
      showToast("success", querySuccess);
      params.delete("success");
    }

    if (queryError || querySuccess) {
      window.history.replaceState({}, "", buildPageUrl(getCurrentFileName(), params));
    }
  };

  const updateConfirmationPage = () => {
    const params = new URLSearchParams(window.location.search);
    const orderId =
      params.get("orderId") || window.localStorage.getItem("wds_last_order_id") || "";
    const message = document.getElementById("thankYouMessage");

    if (message && orderId) {
      message.textContent = `Your order #${orderId} has been saved. We will see you soon.`;
    }
  };

  const init = async () => {
    const { normalizePageLinks, showToast, getCurrentFileName } = await import("./lib/ui.js");
    const { bootSupabaseApp } = await import("./lib/supabase-app.js?v=admin-boot-3");

    normalizePageLinks();
    applyInputFormatting();
    await showQueryToast();

    if (getCurrentFileName() === "confirmation.html") {
      updateConfirmationPage();
    }

    await bootSupabaseApp({ showToast });
  };

  init().catch((error) => {
    console.error("App load failed:", error);
    import("./lib/ui.js").then(({ showToast }) => {
      showToast("error", error?.message || "The app could not finish loading.");
    });
  });
})();
