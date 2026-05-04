import { getCurrentFileName } from "./ui.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getAppointmentTimestamp = (order) => {
  const rawDate = String(order?.appointment_date || "");
  const rawTime = String(order?.appointment_time || "12:00 AM");
  const timestamp = Date.parse(`${rawDate} ${rawTime}`);
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
};

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
  const cancelActiveOrderButton = document.getElementById("cancelActiveOrderButton");
  const activeOrderPanel = activeOrderTitle?.closest(".status-main");
  const completedOrderBox = document.getElementById("completedOrderBox");

  if (!dashboardTransactions || !dashboardTimeline || !activeOrderTitle || !activeOrderLead || !activeOrderStatus || !activeOrderMeta || !cancelActiveOrderButton || !activeOrderPanel || !completedOrderBox) {
    return;
  }

  try {
    const { data: activeOrders, error: activeError } = await supabase
      .from("orders")
      .select("order_id, service_type, appointment_date, appointment_time, order_status, payment_method, total, updated_at, created_at")
      .eq("user_id", userId)
      .neq("order_status", "Completed")
      .neq("order_status", "Cancelled")
      .order("created_at", { ascending: false });

    if (activeError) throw activeError;

    const activeOrderList = [...(activeOrders || [])].sort((firstOrder, secondOrder) => {
      const dateDifference = getAppointmentTimestamp(firstOrder) - getAppointmentTimestamp(secondOrder);
      if (dateDifference !== 0) return dateDifference;
      return Number(firstOrder.order_id || 0) - Number(secondOrder.order_id || 0);
    });
    const activeOrderIds = activeOrderList.map((order) => order.order_id);
    let activeOrderItems = [];

    if (activeOrderIds.length) {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, item_type, quantity, line_total")
        .in("order_id", activeOrderIds)
        .order("order_item_id", { ascending: true });

      if (error) throw error;
      activeOrderItems = data || [];
    }

    const activeItemsByOrder = activeOrderItems.reduce((groups, item) => {
      groups[item.order_id] = groups[item.order_id] || [];
      groups[item.order_id].push(item);
      return groups;
    }, {});

    const activeOrder = activeOrderList[0] || null;
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

    const { data: loyaltyRows, error: loyaltyError } = await supabase
      .from("loyalty_transactions")
      .select("order_id, points_change")
      .eq("user_id", userId);

    if (loyaltyError) throw loyaltyError;

    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("order_id, service_type, total, updated_at, created_at, payment_method")
      .eq("user_id", userId)
      .eq("order_status", "Completed")
      .order("updated_at", { ascending: false })
      .limit(20);

    if (orderError) throw orderError;

    if (activeOrderList.length) {
      activeOrderPanel.innerHTML = `
        <div class="current-order-list">
          ${activeOrderList
            .map((order) => {
              const statusClass = String(order.order_status || "started").toLowerCase().replace(/\s+/g, "-");
              const orderStatus = String(order.order_status || "Drop off");
              const paymentMethod = String(order.payment_method || "pending").replace("-", " ");
              const canCancelOrder = orderStatus.toLowerCase() === "drop off";
              const items = activeItemsByOrder[order.order_id] || [];
              const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
              const itemSummaryMarkup = items.length
                ? `
                    <p><strong>Items:</strong> ${itemCount} item${itemCount === 1 ? "" : "s"}</p>
                    <ul class="current-order-items">
                      ${items
                        .map(
                          (item) =>
                            `<li>${Number(item.quantity || 0)}x ${escapeHtml(item.item_type)}</li>`
                        )
                        .join("")}
                    </ul>
                  `
                : `<p><strong>Items:</strong> Item details are not available yet.</p>`;

              return `
                <div class="current-order-card">
                  <h3>Order #${order.order_id}</h3>
                  <p>${escapeHtml(order.service_type)} scheduled for ${new Date(order.appointment_date).toLocaleDateString()} at ${escapeHtml(order.appointment_time)}.</p>
                  <p><strong>Service:</strong> ${escapeHtml(order.service_type || "Not available")}</p>
                  ${itemSummaryMarkup}
                  <p><strong>Placed:</strong> ${escapeHtml(formatDateTime(order.created_at))}</p>
                  <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${escapeHtml(orderStatus)}</span></p>
                  <p><strong>Payment:</strong> ${escapeHtml(paymentMethod)} | <strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</p>
                  ${canCancelOrder
                    ? `<button type="button" class="btn btn-outline danger-btn cancel-order-button" data-cancel-order-id="${order.order_id}">Cancel Order</button>`
                    : `<p class="current-order-note">Cancellation is unavailable after this order moves forward.</p>`}
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    } else {
      cancelActiveOrderButton.classList.add("hidden");
      delete cancelActiveOrderButton.dataset.orderId;
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

    const orderIds = (orderRows || []).map((order) => order.order_id);
    let itemRows = [];

    if (orderIds.length) {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, item_type, quantity, line_total")
        .in("order_id", orderIds)
        .order("order_item_id", { ascending: true });

      if (error) throw error;
      itemRows = data || [];
    }

    const itemsByOrder = itemRows.reduce((groups, item) => {
      groups[item.order_id] = groups[item.order_id] || [];
      groups[item.order_id].push(item);
      return groups;
    }, {});

    const pointsByOrder = (loyaltyRows || []).reduce((groups, row) => {
      if (!row.order_id) return groups;
      groups[row.order_id] = (groups[row.order_id] || 0) + Number(row.points_change || 0);
      return groups;
    }, {});

    if (orderRows?.length) {
      dashboardTransactions.innerHTML = orderRows
        .map((order) => {
          const items = itemsByOrder[order.order_id] || [];
          const itemSummary = items.length
            ? items
                .map((item) => `${Number(item.quantity || 0)}x ${escapeHtml(item.item_type)}`)
                .join(", ")
            : escapeHtml(order.service_type || "Order items");
          const total = Number(order.total || 0);
          const points = pointsByOrder[order.order_id] || 0;
          const completedAt = order.updated_at || order.created_at;

          return `
            <div class="transaction-item order-transaction negative">
              <div>
                <strong>Order #${order.order_id} completed</strong>
                <p><strong>Items:</strong> ${itemSummary}</p>
                <p><strong>Completed:</strong> ${new Date(completedAt).toLocaleString()}</p>
              </div>
              <div class="transaction-amount-stack">
                <span>-$${total.toFixed(2)}</span>
                <span class="loyalty-points-chip">${points >= 0 ? "+" : ""}${points} pts</span>
              </div>
            </div>
          `;
        })
        .join("");
    }

    activeOrderPanel.addEventListener("click", async (event) => {
      const cancelButton = event.target.closest("[data-cancel-order-id]");

      if (!cancelButton) return;

      const orderId = cancelButton.dataset.cancelOrderId;

      if (!orderId) return;

      const shouldCancel = window.confirm("Cancel this order? This will remove it from your active orders.");
      if (!shouldCancel) return;

      cancelButton.disabled = true;

      try {
        const { data: currentOrder, error: currentOrderError } = await supabase
          .from("orders")
          .select("order_status")
          .eq("order_id", orderId)
          .eq("user_id", userId)
          .single();

        if (currentOrderError) throw currentOrderError;

        if (String(currentOrder.order_status || "").toLowerCase() !== "drop off") {
          showToast("error", "This order has already moved forward and cannot be cancelled.");
          cancelButton.disabled = false;
          return;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            order_status: "Cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("order_id", orderId)
          .eq("user_id", userId);

        if (updateError) throw updateError;

        const { error: statusError } = await supabase.from("status_updates").insert({
          order_id: Number(orderId),
          status: "Cancelled",
          note: "Order cancelled by customer"
        });

        if (statusError) throw statusError;

        const { data: loyaltyRows, error: loyaltyLookupError } = await supabase
          .from("loyalty_transactions")
          .select("points_change")
          .eq("order_id", orderId)
          .eq("user_id", userId);

        if (loyaltyLookupError) throw loyaltyLookupError;

        const loyaltyPointsToReverse = (loyaltyRows || []).reduce(
          (sum, row) => sum + Number(row.points_change || 0),
          0
        );

        if (loyaltyPointsToReverse !== 0) {
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("loyalty_points")
            .eq("user_id", userId)
            .single();

          if (profileError) throw profileError;

          const { error: pointsUpdateError } = await supabase
            .from("users")
            .update({
              loyalty_points: Number(profile.loyalty_points || 0) - loyaltyPointsToReverse
            })
            .eq("user_id", userId);

          if (pointsUpdateError) throw pointsUpdateError;

          const { error: reversalError } = await supabase.from("loyalty_transactions").insert({
            user_id: userId,
            order_id: Number(orderId),
            points_change: -loyaltyPointsToReverse,
            description: `Loyalty points reversed because customer cancelled order #${orderId}`
          });

          if (reversalError) throw reversalError;
        }

        showToast("success", "Your order was cancelled.");
        window.location.reload();
      } catch (_error) {
        cancelButton.disabled = false;
        showToast("error", "Could not cancel this order right now.");
      }
    });
  } catch (_error) {
    showToast("error", "Could not load the dashboard right now.");
  }
};
