export const ROUTE_TO_FILE = {
  "/": "index.html",
  "/start-order": "start-order.html",
  "/guest-checkout": "guest-checkout.html",
  "/register": "register.html",
  "/login": "login.html",
  "/appointment": "appointment.html",
  "/clothing": "clothing.html",
  "/review": "review.html",
  "/dashboard": "dashboard.html",
  "/wallet": "wallet.html",
  "/account": "account.html",
  "/contact": "contact.html",
  "/faqs": "faqs.html",
  "/confirmation": "confirmation.html"
};

export const buildFileUrl = (value) => {
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    const [path, query = ""] = value.split("?");
    const file = ROUTE_TO_FILE[path] || ROUTE_TO_FILE[`${path}/`];
    return file ? `${file}${query ? `?${query}` : ""}` : value;
  }

  return value;
};

export const getCurrentFileName = () => {
  const path = window.location.pathname;
  const lastSegment = path.split("/").filter(Boolean).pop();

  if (!lastSegment || !lastSegment.includes(".")) {
    return ROUTE_TO_FILE[path] || "index.html";
  }

  return lastSegment;
};

export const buildPageUrl = (fileName, params = null) => {
  const search = params instanceof URLSearchParams ? params.toString() : "";
  return `${fileName}${search ? `?${search}` : ""}`;
};

export const normalizePageLinks = () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    const normalized = buildFileUrl(href);

    if (normalized && normalized !== href) {
      link.setAttribute("href", normalized);
    }
  });

  document.querySelectorAll("form[action]").forEach((form) => {
    const action = form.getAttribute("action");
    const normalized = buildFileUrl(action);

    if (normalized && normalized !== action) {
      form.setAttribute("action", normalized);
    }
  });
};

export const showToast = (type, message) => {
  if (!message) {
    return;
  }

  const existingToast = document.getElementById("siteToast");

  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.id = "siteToast";
  toast.className = `site-toast ${type === "error" ? "site-toast-error" : "site-toast-success"}`;
  toast.innerHTML = `
    <div class="site-toast-inner">
      <strong>${type === "error" ? "Please check this" : "Good news"}</strong>
      <p>${message}</p>
    </div>
    <button type="button" class="site-toast-close" aria-label="Dismiss message">x</button>
  `;

  document.body.appendChild(toast);

  const dismiss = () => {
    toast.classList.add("site-toast-hide");
    window.setTimeout(() => toast.remove(), 220);
  };

  toast.querySelector(".site-toast-close")?.addEventListener("click", dismiss);
  window.setTimeout(dismiss, 4500);
};
