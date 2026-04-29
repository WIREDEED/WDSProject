import { buildPageUrl, getCurrentFileName } from "./ui.js";

export const money = (value) => Number(Number(value || 0).toFixed(2));
export const normalizeNext = (value) => (value === "order" ? "order" : "dashboard");
const ADMIN_SESSION_KEY = "wds_admin_verified";
const LOCAL_ADMIN_SESSION_KEY = "wds_local_admin_verified";

export const LOCAL_ADMIN_CREDENTIALS = {
  email: "wbdprojectumb@gmail.com",
  password: "Wash123!",
  pin: "1111",
  role: "Administrator"
};

const isConfiguredAdminEmail = (email) =>
  String(email || "").trim().toLowerCase() === LOCAL_ADMIN_CREDENTIALS.email.toLowerCase();

export const getProtectedPageType = () => {
  const fileName = getCurrentFileName();

  if (["dashboard.html", "account.html"].includes(fileName)) {
    return "customer";
  }

  if (["admin-portal.html"].includes(fileName)) {
    return "admin";
  }

  return null;
};

export const isProtectedPage = () => Boolean(getProtectedPageType());

export const redirectToLogin = (next) => {
  window.location.href = buildPageUrl(
    "login.html",
    new URLSearchParams({ next: normalizeNext(next) })
  );
};

export const redirectToAdminLogin = (message = "") => {
  const params = new URLSearchParams();
  if (message) params.set("error", message);
  window.location.href = buildPageUrl("admin-login.html", params);
};

export const setAdminPortalVerification = (authUserId) => {
  if (!authUserId) return;
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, authUserId);
};

export const clearAdminPortalVerification = () => {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.sessionStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
};

export const hasAdminPortalVerification = (authUserId) =>
  Boolean(authUserId) && window.sessionStorage.getItem(ADMIN_SESSION_KEY) === authUserId;

export const setLocalAdminPortalVerification = (email) => {
  if (!email) return;
  window.sessionStorage.setItem(LOCAL_ADMIN_SESSION_KEY, email);
};

export const hasLocalAdminPortalVerification = () =>
  window.sessionStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === LOCAL_ADMIN_CREDENTIALS.email;

export const buildRegisteredOrderRedirect = (profile) => {
  const params = new URLSearchParams({
    customerType: "registered",
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    email: profile.email || ""
  });

  return buildPageUrl("appointment.html", params);
};

export const getDefaultSavedPayment = async (supabase, userId) => {
  const { data, error } = await supabase
    .from("saved_payment_methods")
    .select("payment_method_id, card_brand, last4")
    .eq("user_id", userId)
    .eq("is_default", true)
    .order("payment_method_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

export const getAdminProfile = async (supabase, authUserId) => {
  if (!authUserId) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("admin_id, auth_user_id, admin_email, full_name, pin_code, role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (
      error.code === "42P01" ||
      error.code === "42501" ||
      message.includes("admin_users") ||
      message.includes("permission denied")
    ) {
      return null;
    }

    throw error;
  }
  return data || null;
};

const buildProfileState = (profile) => {
  if (!profile) return null;

  return {
    userId: profile.user_id,
    fullName: profile.full_name,
    phone: profile.phone,
    email: profile.email,
    walletBalance: money(profile.wallet_balance),
    loyaltyPoints: Number(profile.loyalty_points || 0),
    textUpdates: Boolean(profile.text_updates),
    emailUpdates: Boolean(profile.email_updates),
    allowSavedCard: Boolean(profile.allow_saved_card)
  };
};

export const upsertUserProfile = async (supabase, authUser, profileFields = {}) => {
  const { fullName = "", phone = "", email = authUser.email || "" } = profileFields;

  const { data: existingByAuthId, error: authLookupError } = await supabase
    .from("users")
    .select("user_id, full_name, phone, email, wallet_balance, loyalty_points, text_updates, email_updates, allow_saved_card, auth_user_id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (authLookupError) throw authLookupError;

  if (existingByAuthId) {
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: fullName || existingByAuthId.full_name,
        phone: phone || existingByAuthId.phone,
        email: email || existingByAuthId.email
      })
      .eq("user_id", existingByAuthId.user_id)
      .select("user_id, full_name, phone, email, wallet_balance, loyalty_points, text_updates, email_updates, allow_saved_card, auth_user_id")
      .single();

    if (error) throw error;
    return data;
  }

  const { data: existingByEmail, error: emailLookupError } = await supabase
    .from("users")
    .select("user_id")
    .eq("email", authUser.email || "")
    .maybeSingle();

  if (emailLookupError) throw emailLookupError;

  if (existingByEmail) {
    const { data, error } = await supabase
      .from("users")
      .update({
        auth_user_id: authUser.id,
        full_name: fullName || authUser.user_metadata?.full_name || "",
        phone: phone || authUser.user_metadata?.phone || "",
        email: email || authUser.email || ""
      })
      .eq("user_id", existingByEmail.user_id)
      .select("user_id, full_name, phone, email, wallet_balance, loyalty_points, text_updates, email_updates, allow_saved_card, auth_user_id")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      auth_user_id: authUser.id,
      full_name: fullName || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Customer",
      phone: phone || authUser.user_metadata?.phone || "",
      email: email || authUser.email || "",
      password_hash: null,
      wallet_balance: 0,
      loyalty_points: 0,
      text_updates: true,
      email_updates: true,
      allow_saved_card: true
    })
    .select("user_id, full_name, phone, email, wallet_balance, loyalty_points, text_updates, email_updates, allow_saved_card, auth_user_id")
    .single();

  if (error) throw error;
  return data;
};

export const getSessionState = async (supabase) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    if (hasLocalAdminPortalVerification()) {
      return {
        loggedIn: true,
        authUser: null,
        profile: null,
        savedPayment: null,
        isAdmin: true,
        adminProfile: {
          adminId: "local-admin",
          authUserId: null,
          fullName: "WDS Admin",
          email: LOCAL_ADMIN_CREDENTIALS.email,
          pinCode: LOCAL_ADMIN_CREDENTIALS.pin,
          role: LOCAL_ADMIN_CREDENTIALS.role,
          isLocalFallback: true
        },
        adminVerified: true
      };
    }

    return {
      loggedIn: false,
      profile: null,
      savedPayment: null,
      isAdmin: false,
      adminProfile: null,
      adminVerified: false
    };
  }

  const adminProfile = await getAdminProfile(supabase, session.user.id);
  const emailAdminFallback = isConfiguredAdminEmail(session.user.email);
  let profile = null;
  let savedPayment = null;

  try {
    profile = await upsertUserProfile(supabase, session.user, {
      fullName: session.user.user_metadata?.full_name || "",
      phone: session.user.user_metadata?.phone || "",
      email: session.user.email || ""
    });

    if (profile?.user_id) {
      savedPayment = await getDefaultSavedPayment(supabase, profile.user_id);
    }
  } catch (error) {
    if (!adminProfile) {
      throw error;
    }
  }

  return {
    loggedIn: true,
    authUser: session.user,
    isAdmin: Boolean(adminProfile || emailAdminFallback),
    adminProfile: adminProfile
      ? {
          adminId: adminProfile.admin_id,
          authUserId: adminProfile.auth_user_id,
          fullName: adminProfile.full_name,
          email: adminProfile.admin_email,
          pinCode: adminProfile.pin_code,
          role: adminProfile.role || "Administrator"
        }
      : emailAdminFallback
        ? {
            adminId: "configured-admin",
            authUserId: session.user.id,
            fullName: session.user.user_metadata?.full_name || "WDS Admin",
            email: session.user.email || LOCAL_ADMIN_CREDENTIALS.email,
            pinCode: LOCAL_ADMIN_CREDENTIALS.pin,
            role: LOCAL_ADMIN_CREDENTIALS.role,
            isLocalFallback: true
          }
        : null,
    adminVerified: hasAdminPortalVerification(session.user.id),
    profile: buildProfileState(profile),
    savedPayment
  };
};

export const updateAuthNavigation = (sessionState) => {
  const authLink = document.querySelector("[data-auth-link]");
  const nav = document.querySelector(".main-nav");
  const existingLogout = document.getElementById("logoutLink");
  const fileName = getCurrentFileName();

  if (sessionState.loggedIn) {
    if (authLink) {
      authLink.textContent = sessionState.profile ? "Dashboard" : "Admin Portal";
      authLink.setAttribute("href", sessionState.profile ? "dashboard.html" : "admin-portal.html");
    }

    if (nav && !existingLogout) {
      const logoutLink = document.createElement("a");
      logoutLink.id = "logoutLink";
      logoutLink.href = "#logout";
      logoutLink.textContent = "Log Out";
      nav.appendChild(logoutLink);
    }

    return;
  }

  if (authLink) {
    const next =
      fileName === "appointment.html" ||
      fileName === "clothing.html" ||
      fileName === "review.html" ||
      fileName === "start-order.html"
        ? "order"
        : "dashboard";
    authLink.textContent = "Login";
    authLink.setAttribute("href", buildPageUrl("login.html", new URLSearchParams({ next })));
  }

  if (fileName !== "admin-portal.html") {
    existingLogout?.remove();
  }
};

export const populateSessionFields = (sessionState) => {
  if (!sessionState.loggedIn || !sessionState.profile) return;

  document.querySelectorAll("[data-logged-out-only]").forEach((element) => {
    element.remove();
  });

  const profile = sessionState.profile;
  const fields = {
    dashboardUserName: profile.fullName || "friend",
    dashboardLoyaltyPoints: `${profile.loyaltyPoints} pts`,
    accountName: profile.fullName || "",
    accountPhone: profile.phone || "",
    accountEmail: profile.email || "",
    accountLoyaltyPoints: `${profile.loyaltyPoints} pts`
  };

  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (!element) return;
    if (element instanceof HTMLInputElement) {
      element.value = value;
    } else {
      element.textContent = value;
    }
  });

  const savedPaymentStatus = document.getElementById("savedPaymentStatus");
  const savedPaymentDescription = document.getElementById("savedPaymentDescription");

  if (savedPaymentStatus && savedPaymentDescription) {
    if (sessionState.savedPayment) {
      savedPaymentStatus.textContent = "Saved";
      savedPaymentDescription.textContent = `${sessionState.savedPayment.card_brand || "Card"} ending in ${sessionState.savedPayment.last4}`;
    } else {
      savedPaymentStatus.textContent = "None";
      savedPaymentDescription.textContent = "No saved payment method yet.";
    }
  }

  const textUpdates = document.getElementById("textUpdates");
  const emailUpdates = document.getElementById("emailUpdates");
  const allowSavedCard = document.getElementById("allowSavedCard");

  if (textUpdates instanceof HTMLInputElement) textUpdates.checked = profile.textUpdates;
  if (emailUpdates instanceof HTMLInputElement) emailUpdates.checked = profile.emailUpdates;
  if (allowSavedCard instanceof HTMLInputElement) allowSavedCard.checked = profile.allowSavedCard;

  const guestOrderChoices = document.getElementById("guestOrderChoices");
  const registeredOrderChoice = document.getElementById("registeredOrderChoice");
  const registeredStartOrder = document.getElementById("registeredStartOrder");

  if (
    guestOrderChoices instanceof HTMLElement &&
    registeredOrderChoice instanceof HTMLElement &&
    registeredStartOrder instanceof HTMLAnchorElement
  ) {
    guestOrderChoices.classList.add("hidden");
    registeredOrderChoice.classList.remove("hidden");
    registeredStartOrder.href = buildRegisteredOrderRedirect(profile);
  }

  const customerTypeInput = document.getElementById("customerType");
  const appointmentName = document.getElementById("fullName");
  const appointmentPhone = document.getElementById("phone");
  const appointmentEmail = document.getElementById("email");

  if (
    customerTypeInput instanceof HTMLInputElement &&
    customerTypeInput.value === "registered" &&
    appointmentName instanceof HTMLInputElement &&
    appointmentPhone instanceof HTMLInputElement &&
    appointmentEmail instanceof HTMLInputElement &&
    !appointmentName.value &&
    !appointmentPhone.value &&
    !appointmentEmail.value
  ) {
    appointmentName.value = profile.fullName || "";
    appointmentPhone.value = profile.phone || "";
    appointmentEmail.value = profile.email || "";
  }
};
