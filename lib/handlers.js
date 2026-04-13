import { buildPageUrl } from "./ui.js";
import {
  money,
  normalizeNext,
  buildRegisteredOrderRedirect,
  redirectToLogin,
  getSessionState,
  upsertUserProfile
} from "./state.js";

const ITEM_CATALOG = {
  shirts: { label: "T-Shirts and Shirts", unitPrice: 3.0 },
  pants: { label: "Pants", unitPrice: 5.0 },
  jackets: { label: "Jackets", unitPrice: 6.0 },
  suits: { label: "Suits", unitPrice: 10.0 },
  dresses: { label: "Dresses", unitPrice: 10.0 },
  bedsheets: { label: "Bed Sheets", unitPrice: 8.0 },
  curtains: { label: "Curtains", unitPrice: 12.0 },
  leather: { label: "Leather Items", unitPrice: 15.0 },
  other: { label: "Other Items", unitPrice: 0.0 }
};

const parseItemsFromForm = (formData) =>
  Object.entries(ITEM_CATALOG)
    .map(([key, config]) => {
      const quantity = parseInt(formData.get(key) || "0", 10);
      return {
        key,
        itemType: config.label,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
        unitPrice: config.unitPrice
      };
    })
    .filter((item) => item.quantity > 0);

const calculateTotals = (items) => {
  const subtotal = money(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const tax = money(subtotal * 0.05);
  const total = money(subtotal + tax);
  return { subtotal, tax, total };
};

const createCardToken = () => {
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  return `tok_${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
};

const validateCardFields = (formData) => {
  const cardholderName = String(formData.get("cardholderName") || "").trim();
  const cardNumber = String(formData.get("cardNumber") || "").replace(/\D/g, "");
  const expiry = String(formData.get("expiry") || "").trim();
  const cvv = String(formData.get("cvv") || "").trim();

  if (!cardholderName || cardNumber.length < 12 || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3,4}$/.test(cvv)) {
    throw new Error("Please complete the card details before confirming your order.");
  }

  return { cardNumber };
};

const createSavedCardRecord = async (supabase, userId, rawCardNumber) => {
  const digits = String(rawCardNumber || "").replace(/\D/g, "");

  if (digits.length < 12) {
    return;
  }

  const { error: clearError } = await supabase
    .from("saved_payment_methods")
    .update({ is_default: false })
    .eq("user_id", userId);

  if (clearError) throw clearError;

  const { error: insertError } = await supabase.from("saved_payment_methods").insert({
    user_id: userId,
    card_token: createCardToken(),
    card_brand: "Card",
    last4: digits.slice(-4),
    is_default: true
  });

  if (insertError) throw insertError;
};

export const bindLoginForm = (supabase, showToast) => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const next = normalizeNext(formData.get("next"));

    if (!email || !password) {
      showToast("error", "Please enter your email and password.");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const sessionState = await getSessionState(supabase);

      if (!sessionState.loggedIn || !sessionState.profile) {
        throw new Error("Your account is not ready yet.");
      }

      window.location.href =
        next === "order" ? buildRegisteredOrderRedirect(sessionState.profile) : "dashboard.html";
    } catch (error) {
      showToast("error", error.message || "That email or password is incorrect.");
    }
  });
};

export const bindRegisterForm = (supabase, showToast) => {
  const registerForm = document.getElementById("registerForm");

  if (!registerForm) return;

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!registerForm.checkValidity()) {
      registerForm.reportValidity();
      return;
    }

    const formData = new FormData(registerForm);
    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const next = normalizeNext(formData.get("next"));

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      showToast("error", "Please fill out every required field.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } }
      });

      if (error) throw error;
      if (data.user) await upsertUserProfile(supabase, data.user, { fullName, phone, email });

      let sessionState = await getSessionState(supabase);

      if (!sessionState.loggedIn) {
        const signIn = await supabase.auth.signInWithPassword({ email, password });
        if (!signIn.error) sessionState = await getSessionState(supabase);
      }

      if (!sessionState.loggedIn || !sessionState.profile) {
        showToast("success", "Your account was created. If email confirmation is on in Supabase, confirm your email before logging in.");
        window.location.href = buildPageUrl("login.html", new URLSearchParams({ next }));
        return;
      }

      window.location.href =
        next === "order" ? buildRegisteredOrderRedirect(sessionState.profile) : "dashboard.html";
    } catch (error) {
      showToast("error", error.message || "Could not create your account right now.");
    }
  });
};

export const bindAccountForm = (supabase, sessionState, showToast) => {
  const accountForm = document.querySelector(".account-form");

  if (!accountForm) return;

  accountForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!sessionState.loggedIn || !sessionState.profile) {
      redirectToLogin("dashboard");
      return;
    }

    const formData = new FormData(accountForm);
    const fullName = String(formData.get("accountName") || "").trim();
    const phone = String(formData.get("accountPhone") || "").trim();
    const email = String(formData.get("accountEmail") || "").trim();
    const password = String(formData.get("accountPassword") || "").trim();
    const textUpdates = formData.get("textUpdates") === "on";
    const emailUpdates = formData.get("emailUpdates") === "on";
    const allowSavedCard = formData.get("allowSavedCard") === "on";

    if (!fullName || !phone || !email) {
      showToast("error", "Name, phone number, and email are required.");
      return;
    }

    try {
      const authUpdates = { data: { full_name: fullName, phone } };
      if (email !== sessionState.profile.email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      const { error: authError } = await supabase.auth.updateUser(authUpdates);
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          phone,
          email,
          text_updates: textUpdates,
          email_updates: emailUpdates,
          allow_saved_card: allowSavedCard
        })
        .eq("user_id", sessionState.profile.userId);

      if (profileError) throw profileError;

      showToast("success", "Your account changes were saved.");
      window.location.reload();
    } catch (error) {
      showToast("error", error.message || "Could not update your account right now.");
    }
  });
};

export const bindReviewForm = (supabase, sessionState, showToast) => {
  const reviewForm = document.getElementById("reviewForm");

  if (!reviewForm) return;

  const paymentOptions = document.getElementById("paymentOptions");
  const paymentHint = document.getElementById("paymentHint");

  if (sessionState.loggedIn && sessionState.profile && !sessionState.savedPayment && paymentOptions) {
    const savedCardOption = paymentOptions.querySelector('input[value="saved-card"]')?.closest(".payment-option");
    savedCardOption?.remove();
  }

  if (sessionState.loggedIn && sessionState.profile && sessionState.savedPayment && paymentHint) {
    paymentHint.textContent = `Saved card available: ${sessionState.savedPayment.card_brand || "Card"} ending in ${sessionState.savedPayment.last4}.`;
    paymentHint.classList.remove("hidden");
  }

  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(reviewForm);
    const customerType = String(formData.get("customerType") || "guest");
    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const service = String(formData.get("service") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const time = String(formData.get("time") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const paymentMethod = String(formData.get("paymentMethod") || "").trim();
    const items = parseItemsFromForm(formData);

    if (!fullName || !phone || !service || !date || !time || !paymentMethod) {
      showToast("error", "Please complete the order details before confirming.");
      return;
    }

    if (!items.length) {
      showToast("error", "Please choose at least one item before confirming your order.");
      return;
    }

    if (customerType === "registered" && (!sessionState.loggedIn || !sessionState.profile)) {
      redirectToLogin("order");
      return;
    }

    let cardDetails = null;

    try {
      if (paymentMethod === "new-card" || paymentMethod === "card") {
        cardDetails = validateCardFields(formData);
      }

      const { subtotal, tax, total } = calculateTotals(items);
      let userId = null;
      let guestOrderId = null;

      if (customerType === "registered") {
        userId = sessionState.profile.userId;

        if (paymentMethod === "saved-card" && !sessionState.savedPayment) {
          throw new Error("There is no saved payment method on this account yet.");
        }
      } else {
        const { data: guest, error: guestError } = await supabase
          .from("guest_orders")
          .insert({ full_name: fullName, phone })
          .select("guest_order_id")
          .single();

        if (guestError) throw guestError;
        guestOrderId = guest.guest_order_id;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          guest_order_id: guestOrderId,
          service_type: service,
          appointment_date: date,
          appointment_time: time,
          notes: notes || null,
          order_status: "Started",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cash" ? "Pending" : "Paid",
          subtotal,
          tax,
          total
        })
        .select("order_id")
        .single();

      if (orderError) throw orderError;

      const orderId = order.order_id;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: orderId,
          item_type: item.itemType,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: money(item.quantity * item.unitPrice)
        }))
      );

      if (itemsError) throw itemsError;

      const { error: statusError } = await supabase.from("status_updates").insert({
        order_id: orderId,
        status: "Started",
        note: "Order placed by customer",
        updated_by: customerType === "registered" ? "Customer Account" : "Guest Checkout"
      });

      if (statusError) throw statusError;

      if (customerType === "registered" && sessionState.profile) {
        const updates = { loyalty_points: sessionState.profile.loyaltyPoints + 10 };

        const { error: userUpdateError } = await supabase
          .from("users")
          .update(updates)
          .eq("user_id", userId);

        if (userUpdateError) throw userUpdateError;

        const { error: loyaltyTxError } = await supabase.from("loyalty_transactions").insert({
          user_id: userId,
          order_id: orderId,
          points_change: 10,
          description: `10 points earned for order #${orderId}`
        });

        if (loyaltyTxError) throw loyaltyTxError;

        if (paymentMethod === "new-card" && formData.get("savePaymentMethod") === "yes" && cardDetails) {
          await createSavedCardRecord(supabase, userId, cardDetails.cardNumber);
        }
      }

      if (customerType === "guest") {
        const guestIds = JSON.parse(window.localStorage.getItem("wds_guest_order_ids") || "[]");
        guestIds.push(orderId);
        window.localStorage.setItem("wds_guest_order_ids", JSON.stringify(guestIds.slice(-10)));
      }

      window.localStorage.setItem("wds_last_order_id", String(orderId));
      window.location.href = buildPageUrl("confirmation.html", new URLSearchParams({ orderId: String(orderId) }));
    } catch (error) {
      showToast("error", error.message || "Could not save the order right now.");
    }
  });
};
