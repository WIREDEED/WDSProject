import { buildPageUrl } from "./ui.js";
import {
  money,
  normalizeNext,
  buildRegisteredOrderRedirect,
  redirectToLogin,
  getSessionState,
  upsertUserProfile
} from "./state.js";

const LOYALTY_REDEMPTION_TIERS = [
  { points: 100, discount: 15, minimumOrder: 60 },
  { points: 50, discount: 7, minimumOrder: 35 },
  { points: 25, discount: 3, minimumOrder: 20 },
  { points: 10, discount: 1, minimumOrder: 10 }
];

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

const getEligibleLoyaltyTier = (points, orderTotal, requestedPoints) => {
  const tier = LOYALTY_REDEMPTION_TIERS.find((option) => option.points === requestedPoints);

  if (!tier) return null;
  if (points < tier.points) return null;
  if (orderTotal < tier.minimumOrder) return null;

  return tier;
};

const updateDiscountPreview = (tier) => {
  const discountInput = document.getElementById("loyaltyDiscountAmount");
  const redeemedInput = document.getElementById("loyaltyPointsRedeemed");
  const discountPreview = document.getElementById("discountPreview");
  const discountAmount = document.getElementById("discountAmount");
  const finalTotal = document.getElementById("finalTotal");
  const orderTotal = document.getElementById("orderTotal");

  if (!discountInput || !redeemedInput || !discountPreview || !discountAmount || !finalTotal || !orderTotal) return;

  const baseTotal = money(orderTotal.value);
  const discount = tier ? money(tier.discount) : 0;
  const adjustedTotal = money(Math.max(baseTotal - discount, 0));

  redeemedInput.value = tier ? String(tier.points) : "0";
  discountInput.value = discount.toFixed(2);
  discountAmount.textContent = discount.toFixed(2);
  finalTotal.textContent = adjustedTotal.toFixed(2);
  discountPreview.classList.toggle("hidden", !tier);
};

const bindLoyaltyDiscountOptions = (sessionState) => {
  const container = document.getElementById("loyaltyDiscountOptions");
  const orderTotal = document.getElementById("orderTotal");
  const customerTypeInput = document.getElementById("orderCustomerType");
  const dollars = String.fromCharCode(36);

  if (!container || !orderTotal) return;

  if (customerTypeInput instanceof HTMLInputElement && customerTypeInput.value !== "registered") {
    container.innerHTML = '<p class="loyalty-discount-note">Create or use an account to redeem loyalty points.</p>';
    updateDiscountPreview(null);
    return;
  }

  const baseTotal = money(orderTotal.value);

  if (!sessionState.loggedIn || !sessionState.profile) {
    container.innerHTML = '<p class="loyalty-discount-note">Log in to redeem loyalty points for a discount.</p>';
    updateDiscountPreview(null);
    return;
  }

  const availablePoints = sessionState.profile.loyaltyPoints;
  const tierMarkup = LOYALTY_REDEMPTION_TIERS.map((tier) => {
    const hasPoints = availablePoints >= tier.points;
    const meetsMinimum = baseTotal >= tier.minimumOrder;
    const disabled = !hasPoints || !meetsMinimum;
    const reason = !hasPoints
      ? "Need " + tier.points + " pts"
      : !meetsMinimum
        ? "Requires " + dollars + tier.minimumOrder.toFixed(2) + " order"
        : "Apply " + dollars + tier.discount.toFixed(2) + " off";

    return '<label class="loyalty-discount-choice ' + (disabled ? 'disabled' : '') + '">' +
      '<input type="radio" name="loyaltyTier" value="' + tier.points + '" ' + (disabled ? 'disabled' : '') + '>' +
      '<span>' + tier.points + ' pts = ' + dollars + tier.discount.toFixed(2) + ' off <small>' + reason + '</small></span>' +
      '</label>';
  }).join("");

  container.innerHTML =
    '<h4>Use Loyalty Points</h4>' +
    '<p class="loyalty-discount-note">Available balance: ' + availablePoints + ' pts</p>' +
    '<label class="loyalty-discount-choice">' +
      '<input type="radio" name="loyaltyTier" value="0" checked>' +
      '<span>No discount this order</span>' +
    '</label>' +
    tierMarkup;

  container.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.name !== "loyaltyTier") return;
    const requestedPoints = parseInt(event.target.value || "0", 10);
    const tier = getEligibleLoyaltyTier(availablePoints, baseTotal, requestedPoints);
    updateDiscountPreview(tier);
  });

  updateDiscountPreview(null);
};
const createCardToken = () => {
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  return `tok_${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
};

const validateCardFields = (formData, message = "Please complete the card details before confirming your order.") => {
  const cardholderName = String(formData.get("cardholderName") || "").trim();
  const cardNumber = String(formData.get("cardNumber") || "").replace(/\D/g, "");
  const expiry = String(formData.get("expiry") || "").trim();
  const cvv = String(formData.get("cvv") || "").trim();

  if (!cardholderName || cardNumber.length < 12 || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3,4}$/.test(cvv)) {
    throw new Error(message);
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

  const savedCard = {
    card_brand: "Card",
    last4: digits.slice(-4)
  };

  const { error: insertError } = await supabase.from("saved_payment_methods").insert({
    user_id: userId,
    card_token: createCardToken(),
    card_brand: savedCard.card_brand,
    last4: savedCard.last4,
    is_default: true
  });

  if (insertError) throw insertError;

  return savedCard;
};

const removeSavedCardRecords = async (supabase, userId) => {
  const { error } = await supabase
    .from("saved_payment_methods")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
};

const updateSavedPaymentDisplay = (savedPayment) => {
  const savedPaymentStatus = document.getElementById("savedPaymentStatus");
  const savedPaymentDescription = document.getElementById("savedPaymentDescription");
  const removeSavedCardButton = document.getElementById("removeSavedCard");

  if (savedPaymentStatus && savedPaymentDescription) {
    if (savedPayment) {
      savedPaymentStatus.textContent = "Saved";
      savedPaymentDescription.textContent = `${savedPayment.card_brand || "Card"} ending in ${savedPayment.last4}`;
    } else {
      savedPaymentStatus.textContent = "None";
      savedPaymentDescription.textContent = "No saved payment method yet.";
    }
  }

  if (removeSavedCardButton instanceof HTMLButtonElement) {
    removeSavedCardButton.disabled = !savedPayment;
  }
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

  const accountNote = document.getElementById("accountFormNote");
  const cardActionInput = document.getElementById("accountCardAction");
  const savedCardForm = document.getElementById("savedCardForm");
  const showNewCardButton = document.getElementById("showNewCardForm");
  const removeSavedCardButton = document.getElementById("removeSavedCard");

  const setAccountNote = (type, message) => {
    if (!accountNote) return;
    accountNote.textContent = message;
    accountNote.classList.remove("hidden", "form-note-success", "form-note-error");
    accountNote.classList.add(type === "error" ? "form-note-error" : "form-note-success");
  };

  const clearCardFields = () => {
    ["cardholderName", "cardNumber", "expiry", "cvv"].forEach((id) => {
      const field = document.getElementById(id);
      if (field instanceof HTMLInputElement) field.value = "";
    });
  };

  const closeCardForm = () => {
    savedCardForm?.classList.add("hidden");
    if (cardActionInput instanceof HTMLInputElement) cardActionInput.value = "";
    if (showNewCardButton instanceof HTMLButtonElement) showNewCardButton.textContent = "Add New Card";
    clearCardFields();
  };

  updateSavedPaymentDisplay(sessionState.savedPayment);

  showNewCardButton?.addEventListener("click", () => {
    const isHidden = savedCardForm?.classList.contains("hidden") ?? true;

    if (isHidden) {
      savedCardForm?.classList.remove("hidden");
      if (cardActionInput instanceof HTMLInputElement) cardActionInput.value = "save-card";
      if (showNewCardButton instanceof HTMLButtonElement) showNewCardButton.textContent = "Cancel New Card";
      document.getElementById("cardholderName")?.focus();
    } else {
      closeCardForm();
    }
  });

  removeSavedCardButton?.addEventListener("click", () => {
    if (!sessionState.savedPayment) {
      setAccountNote("error", "There is no saved card to remove yet.");
      return;
    }

    const shouldRemove = window.confirm("Remove your saved card from this account?");
    if (!shouldRemove) return;

    if (cardActionInput instanceof HTMLInputElement) cardActionInput.value = "remove-card";
    accountForm.requestSubmit();
  });

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
    const cardAction = String(formData.get("accountCardAction") || "").trim();
    const textUpdates = formData.get("textUpdates") === "on";
    const emailUpdates = formData.get("emailUpdates") === "on";
    const allowSavedCard = formData.get("allowSavedCard") === "on";

    if (!fullName || !phone || !email) {
      const message = "Name, phone number, and email are required.";
      setAccountNote("error", message);
      showToast("error", message);
      return;
    }

    if (password && password.length < 6) {
      const message = "Your new password must be at least 6 characters.";
      setAccountNote("error", message);
      showToast("error", message);
      return;
    }

    let cardDetails = null;

    try {
      if (cardAction === "save-card") {
        cardDetails = validateCardFields(formData, "Please complete the card details before saving your new card.");
      }

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

      const successMessages = ["Your account changes were saved."];

      if (cardAction === "save-card" && cardDetails) {
        sessionState.savedPayment = await createSavedCardRecord(supabase, sessionState.profile.userId, cardDetails.cardNumber);
        updateSavedPaymentDisplay(sessionState.savedPayment);
        closeCardForm();
        successMessages.push("Your new card was saved.");
      }

      if (cardAction === "remove-card") {
        await removeSavedCardRecords(supabase, sessionState.profile.userId);
        sessionState.savedPayment = null;
        updateSavedPaymentDisplay(null);
        closeCardForm();
        successMessages.push("Your saved card was removed.");
      }

      const passwordField = document.getElementById("accountPassword");
      if (passwordField instanceof HTMLInputElement) passwordField.value = "";
      if (password) successMessages.push("Your password was updated.");

      const successMessage = successMessages.join(" ");
      setAccountNote("success", successMessage);
      showToast("success", successMessage);
    } catch (error) {
      const message = error.message || "Could not update your account right now.";
      setAccountNote("error", message);
      showToast("error", message);
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

  bindLoyaltyDiscountOptions(sessionState);

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
    const requestedLoyaltyPoints = parseInt(formData.get("loyaltyTier") || formData.get("loyaltyPointsRedeemed") || "0", 10);
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
      let discountTier = null;
      let userId = null;
      let guestOrderId = null;

      if (customerType === "registered") {
        userId = sessionState.profile.userId;

        if (paymentMethod === "saved-card" && !sessionState.savedPayment) {
          throw new Error("There is no saved payment method on this account yet.");
        }

        if (requestedLoyaltyPoints > 0) {
          discountTier = getEligibleLoyaltyTier(sessionState.profile.loyaltyPoints, total, requestedLoyaltyPoints);

          if (!discountTier) {
            throw new Error("That loyalty discount is not available for this order.");
          }
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

      // SILENT SUCCESS LOGIC: 
      // We wrap the insertion in logic that ignores the 'unique_order_prevention' error.
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
          subtotal: subtotal,
          tax: tax,
          total: total 
        })
        .select("order_id")
        .single();

      let orderId = order?.order_id;

      if (orderError) {
        // If it's the duplicate order prevention error, find the one already in the DB
        if (orderError.message.includes("unique_order_prevention")) {
          const { data: existingOrder } = await supabase
            .from("orders")
            .select("order_id")
            .eq("user_id", userId)
            .eq("appointment_date", date)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          orderId = existingOrder?.order_id;
        } else {
          throw orderError;
        }
      }

      if (!orderId) throw new Error("Could not retrieve order details.");

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: orderId,
          item_type: item.itemType,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: money(item.quantity * item.unitPrice)
        }))
      );

      // We ignore item duplicates too in case items already exists
      if (itemsError && !itemsError.message.includes("duplicate key")) throw itemsError;

      const { error: statusError } = await supabase.from("status_updates").insert({
        order_id: orderId,
        status: "Started",
        note: "Order placed by customer",
        updated_by: customerType === "registered" ? "Customer Account" : "Guest Checkout"
      });

      if (statusError && !statusError.message.includes("duplicate key")) throw statusError;

      if (customerType === "registered" && sessionState.profile) {
        
        if (discountTier) {
          // RPC is already protected against duplicates on the DB side
          await supabase.rpc('spend_loyalty_points', {
            p_user_id: userId,
            p_order_id: orderId,
            p_points: discountTier.points
          });
        }

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