import { money } from "./state.js";
import { getCurrentFileName } from "./ui.js";

export const loadDashboardData = async (supabase, sessionState, showToast) => {
  if (!sessionState.loggedIn || !sessionState.profile || getCurrentFileName() !== "dashboard.html") {
    return;
  }

  const userId = sessionState.profile.userId;
  const dashboardTransactions = document.getElementById("dashboardTransactions");
  const dashboardTimeline = document.getElementById("dashboardTimeline");
  const activeOrderTitle = document.getElementById("activeOrderTitle");
  const activeOrderLead = document.getElementById("activeOrderLead");
  const activeOrderStatus = document.getElementById("activeOrderStatus");
  const activeOrderMeta = document.getElementById("activeOrderMeta");
  const completedOrderBox = document.getElementById("completedOrderBox");

  if (!dashboardTransactions || !dashboardTimeline || !activeOrderTitle || !activeOrderLead || !activeOrderStatus || !activeOrderMeta || !completedOrderBox) {
    return;
  }

  try {
    const { data: activeOrders, error: activeError } = await supabase
      .from("orders")
      .select("order_id, service_type, appointment_date, appointment_time, order_status, payment_method, total, updated_at, created_at")
      .eq("user_id", userId)
      .neq("order_status", "Completed")
      .neq("order_status", "Cancelled")
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeError) throw activeError;

    const activeOrder = activeOrders?.[0] || null;
    let timeline = [];

    if (activeOrder) {
      const { data, error } = await supabase
        .from("status_updates")
        .select("status, note, created_at")
        .eq("order_id", activeOrder.order_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      timeline = data || [];
    }

    const { data: completedOrders, error: completedError } = await supabase
      .from("orders")
      .select("order_id, service_type, total, updated_at, created_at")
      .eq("user_id", userId)
      .eq("order_status", "Completed")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (completedError) throw completedError;

    const { data: walletRows, error: walletError } = await supabase
      .from("wallet_transactions")
      .select("created_at, amount, description")
      .eq("user_id", userId);

    if (walletError) throw walletError;

    const { data: loyaltyRows, error: loyaltyError } = await supabase
      .from("loyalty_transactions")
      .select("created_at, points_change, description")
      .eq("user_id", userId);

    if (loyaltyError) throw loyaltyError;

    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("order_id, service_type, total, created_at, payment_method")
      .eq("user_id", userId)
      .neq("payment_method", "wallet")
      .eq("payment_status", "Paid");

    if (orderError) throw orderError;

    if (activeOrder) {
      activeOrderTitle.textContent = `Order #${activeOrder.order_id}`;
      activeOrderLead.textContent = `${activeOrder.service_type} scheduled for ${new Date(activeOrder.appointment_date).toLocaleDateString()} at ${activeOrder.appointment_time}.`;
      activeOrderStatus.textContent = activeOrder.order_status;
      activeOrderStatus.className = `status-badge ${String(activeOrder.order_status || "started").toLowerCase().replace(/\s+/g, "-")}`;
      activeOrderMeta.textContent = `Payment: ${String(activeOrder.payment_method || "pending").replace("-", " ")} | Total: $${Number(activeOrder.total || 0).toFixed(2)}`;
    }

    if (timeline.length) {
      dashboardTimeline.innerHTML = timeline
        .map((step, index, steps) => {
          const stepClass = index === steps.length - 1 ? "timeline-step current" : "timeline-step complete";
          return `
            <div class="${stepClass}">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>${step.status}</strong>
                <p>${new Date(step.created_at).toLocaleString()}${step.note ? ` | ${step.note}` : ""}</p>
              </div>
            </div>
          `;
        })
        .join("");
    }

    const latestCompletedOrder = completedOrders?.[0];

    if (latestCompletedOrder) {
      completedOrderBox.innerHTML = `
        <p><strong>Order #${latestCompletedOrder.order_id}</strong></p>
        <p><strong>Service:</strong> ${latestCompletedOrder.service_type}</p>
        <p><strong>Total:</strong> $${Number(latestCompletedOrder.total || 0).toFixed(2)}</p>
        <p><strong>Completed:</strong> ${new Date(latestCompletedOrder.updated_at || latestCompletedOrder.created_at).toLocaleString()}</p>
      `;
    }

    const transactions = [
      ...(walletRows || []).map((row) => ({
        created_at: row.created_at,
        amount: row.amount,
        description: row.description,
        source: "wallet"
      })),
      ...(loyaltyRows || []).map((row) => ({
        created_at: row.created_at,
        amount: row.points_change,
        description: row.description,
        source: "loyalty"
      })),
      ...(orderRows || []).map((row) => ({
        created_at: row.created_at,
        amount: -money(row.total),
        description: `Order payment for ${row.service_type} (#${row.order_id})`,
        source: "order"
      }))
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);

    if (transactions.length) {
      dashboardTransactions.innerHTML = transactions
        .map((transaction) => {
          if (transaction.source === "loyalty") {
            const points = Number(transaction.amount || 0);
            return `
              <div class="transaction-item loyalty">
                <div>
                  <strong>${transaction.description || "Loyalty update"}</strong>
                  <p>${new Date(transaction.created_at).toLocaleString()}</p>
                </div>
                <span>${points >= 0 ? "+" : ""}${points} pts</span>
              </div>
            `;
          }

          const amount = Number(transaction.amount || 0);
          return `
            <div class="transaction-item ${amount >= 0 ? "positive" : "negative"}">
              <div>
                <strong>${transaction.description || "Wallet update"}</strong>
                <p>${new Date(transaction.created_at).toLocaleString()}</p>
              </div>
              <span>${amount >= 0 ? "+" : "-"}$${Math.abs(amount).toFixed(2)}</span>
            </div>
          `;
        })
        .join("");
    }
  } catch (_error) {
    showToast("error", "Could not load the dashboard right now.");
  }
};

export const loadWalletData = async (supabase, sessionState, showToast) => {
  if (!sessionState.loggedIn || !sessionState.profile || getCurrentFileName() !== "wallet.html") {
    return;
  }

  const walletLedger = document.getElementById("walletLedger");

  if (!walletLedger) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("transaction_type, amount, description, created_at")
      .eq("user_id", sessionState.profile.userId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) throw error;

    if (Array.isArray(data) && data.length) {
      walletLedger.innerHTML = data
        .map((transaction) => {
          const amount = Number(transaction.amount || 0);
          return `
            <div class="ledger-item">
              <div>
                <strong>${transaction.description || transaction.transaction_type}</strong>
                <p>${new Date(transaction.created_at).toLocaleString()}</p>
              </div>
              <span class="detail-pill">${amount >= 0 ? "+" : "-"}$${Math.abs(amount).toFixed(2)}</span>
            </div>
          `;
        })
        .join("");
    }
  } catch (_error) {
    showToast("error", "Could not load wallet activity right now.");
  }
};
