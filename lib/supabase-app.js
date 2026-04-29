import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import {
  getSessionState,
  updateAuthNavigation,
  populateSessionFields,
  isProtectedPage,
  redirectToLogin
} from "./state.js";
import { loadDashboardData } from "./dashboard.js";
import {
  bindLoginForm,
  bindRegisterForm,
  bindAccountForm,
  bindReviewForm
} from "./handlers.js";

const wireLogout = () => {
  document.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || target.id !== "logoutLink") {
      return;
    }

    event.preventDefault();
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "index.html";
    }
  });
};

export const bootSupabaseApp = async ({ showToast }) => {
  if (!isSupabaseConfigured) {
    if (isProtectedPage()) {
      showToast("error", "Add your Supabase URL and publishable key in supabaseClient.js first.");
    }
    return;
  }

  wireLogout();

  let sessionState = await getSessionState(supabase);

  if (!sessionState.loggedIn && isProtectedPage()) {
    redirectToLogin("dashboard");
    return;
  }

  updateAuthNavigation(sessionState);
  populateSessionFields(sessionState);
  await loadDashboardData(supabase, sessionState, showToast);
  bindLoginForm(supabase, showToast);
  bindRegisterForm(supabase, showToast);
  bindAccountForm(supabase, sessionState, showToast);
  bindReviewForm(supabase, sessionState, showToast);

  supabase.auth.onAuthStateChange(async () => {
    sessionState = await getSessionState(supabase);

    if (!sessionState.loggedIn && isProtectedPage()) {
      redirectToLogin("dashboard");
      return;
    }

    updateAuthNavigation(sessionState);
    populateSessionFields(sessionState);
  });
};
