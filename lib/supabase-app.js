import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import {
  getSessionState,
  updateAuthNavigation,
  populateSessionFields,
  getProtectedPageType,
  redirectToLogin,
  redirectToAdminLogin,
  clearAdminPortalVerification
} from "./state.js?v=admin-boot-3";
import { loadDashboardData } from "./dashboard.js?v=admin-boot-3";
import { initAdminPortal } from "./admin.js?v=admin-boot-3";
import {
  bindLoginForm,
  bindRegisterForm,
  bindAccountForm,
  bindReviewForm
} from "./handlers.js?v=admin-boot-3";

const clearSupabaseAuthStorage = () => {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    Object.keys(storage)
      .filter((key) => /^sb-.*-auth-token$/.test(key) || key.includes("supabase.auth.token"))
      .forEach((key) => storage.removeItem(key));
  });
};

const wireLogout = () => {
  document.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || target.id !== "logoutLink") {
      return;
    }

    event.preventDefault();
    try {
      clearAdminPortalVerification();
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      clearSupabaseAuthStorage();
      window.location.replace("index.html");
    }
  });
};

export const bootSupabaseApp = async ({ showToast }) => {
  if (!isSupabaseConfigured) {
    if (getProtectedPageType()) {
      showToast("error", "Add your Supabase URL and publishable key in supabaseClient.js first.");
    }
    return;
  }

  wireLogout();

  let sessionState = await getSessionState(supabase);
  const protectedPageType = getProtectedPageType();

  if (!sessionState.loggedIn && protectedPageType === "customer") {
    redirectToLogin("dashboard");
    return;
  }

  if (protectedPageType === "admin") {
    if (!sessionState.loggedIn || !sessionState.isAdmin) {
      redirectToAdminLogin("Please sign in with an approved admin account.");
      return;
    }

    if (!sessionState.adminVerified) {
      redirectToAdminLogin("Please verify your admin PIN before entering the portal.");
      return;
    }
  }

  updateAuthNavigation(sessionState);
  populateSessionFields(sessionState);
  await loadDashboardData(supabase, sessionState, showToast);
  await initAdminPortal(supabase, sessionState, showToast);
  bindLoginForm(supabase, showToast);
  bindRegisterForm(supabase, showToast);
  bindAccountForm(supabase, sessionState, showToast);
  bindReviewForm(supabase, sessionState, showToast);

  supabase.auth.onAuthStateChange(async () => {
    sessionState = await getSessionState(supabase);
    const currentProtectedPageType = getProtectedPageType();

    if (!sessionState.loggedIn && currentProtectedPageType === "customer") {
      redirectToLogin("dashboard");
      return;
    }

    if (currentProtectedPageType === "admin") {
      if (!sessionState.loggedIn || !sessionState.isAdmin) {
        redirectToAdminLogin("Please sign in with an approved admin account.");
        return;
      }

      if (!sessionState.adminVerified) {
        redirectToAdminLogin("Please verify your admin PIN before entering the portal.");
        return;
      }
    }

    updateAuthNavigation(sessionState);
    populateSessionFields(sessionState);
    await initAdminPortal(supabase, sessionState, showToast);
  });
};
