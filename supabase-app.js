import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import {
  getSessionState,
  updateAuthNavigation,
  populateSessionFields,
  getProtectedPageType,
  redirectToLogin,
  redirectToAdminLogin,
  clearAdminPortalVerification
} from "./state.js";
import { loadDashboardData } from "./dashboard.js";
import { initAdminPortal } from "./admin.js";
import {
  bindLoginForm,
  bindRegisterForm,
  bindAccountForm,
  bindReviewForm,
  bindAdminLoginForm
} from "./handlers.js";

const wireLogout = () => {
  document.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || target.id !== "logoutLink") {
      return;
    }

    event.preventDefault();
    clearAdminPortalVerification();
    await supabase.auth.signOut();
    window.location.href = "index.html";
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
  bindAdminLoginForm(supabase, showToast);

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
