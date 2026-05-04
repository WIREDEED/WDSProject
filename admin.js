import { getCurrentFileName, showToast as fallbackToast } from "./ui.js";

const TABLE_CONFIG = {
  users: {
    label: "Users",
    description: "Customer profiles, balances, loyalty totals, and account preferences.",
    primaryKey: "user_id",
    searchableColumns: ["user_id", "full_name", "email", "phone"],
    fields: [
      { key: "user_id", label: "User ID", type: "number", readOnly: true },
      { key: "full_name", label: "Full Name", type: "text", required: true },
      { key: "phone", label: "Phone", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "loyalty_points", label: "Loyalty Points", type: "number", step: "1" },
      { key: "auth_user_id", label: "Auth User ID", type: "text" },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true },
      { key: "updated_at", label: "Updated At", type: "datetime-local", readOnly: true }
    ]
  },
  admin_users: {
    label: "Admin Users",
    description: "Approved staff accounts, their roles, and PIN verification records.",
    primaryKey: "admin_id",
    searchableColumns: ["admin_id", "full_name", "admin_email", "role"],
    fields: [
      { key: "admin_id", label: "Admin ID", type: "number", readOnly: true },
      { key: "full_name", label: "Full Name", type: "text", required: true },
      { key: "admin_email", label: "Admin Email", type: "email", required: true },
      { key: "pin_code", label: "PIN Code", type: "text", required: true, maxLength: 4 },
      { key: "role", label: "Role", type: "text", required: true },
      { key: "auth_user_id", label: "Auth User ID", type: "text", required: true },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true },
      { key: "updated_at", label: "Updated At", type: "datetime-local", readOnly: true }
    ]
  },
  guest_orders: {
    label: "Guest Orders",
    description: "Guest customer identities captured before an order is attached.",
    primaryKey: "guest_order_id",
    searchableColumns: ["guest_order_id", "full_name", "phone"],
    fields: [
      { key: "guest_order_id", label: "Guest Order ID", type: "number", readOnly: true },
      { key: "full_name", label: "Full Name", type: "text", required: true },
      { key: "phone", label: "Phone", type: "text", required: true },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true }
    ]
  },
  orders: {
    label: "Orders",
    description: "Appointments, service choices, payment state, and total pricing.",
    primaryKey: "order_id",
    searchableColumns: ["order_id", "service_type", "order_status", "payment_status", "payment_method", "notes"],
    fields: [
      { key: "order_id", label: "Order ID", type: "number", readOnly: true },
      { key: "user_id", label: "User ID", type: "relation", relation: "users" },
      { key: "guest_order_id", label: "Guest Order ID", type: "relation", relation: "guest_orders" },
      {
        key: "service_type",
        label: "Service Type",
        type: "select",
        required: true,
        options: [
          { value: "Wash and Fold", label: "Wash and Fold" },
          { value: "Dry Cleaning", label: "Dry Cleaning" },
          { value: "Wash and Iron", label: "Wash and Iron" },
          { value: "Specialty Cleaning", label: "Specialty Cleaning" }
        ]
      },
      { key: "appointment_date", label: "Appointment Date", type: "date", required: true },
      { key: "appointment_time", label: "Appointment Time", type: "text", required: true },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "order_status",
        label: "Order Status",
        type: "select",
        required: true,
        options: [
          { value: "Drop off", label: "Drop off" },
          { value: "Started", label: "Started" },
          { value: "In Progress", label: "In Progress" },
          { value: "Ready", label: "Ready" },
          { value: "Completed", label: "Completed" },
          { value: "Cancelled", label: "Cancelled" }
        ]
      },
      {
        key: "payment_method",
        label: "Payment Method",
        type: "select",
        required: true,
        options: [
          { value: "cash", label: "Cash" },
          { value: "card", label: "Card" },
          { value: "new-card", label: "New Card" },
          { value: "saved-card", label: "Saved Card" }
        ]
      },
      {
        key: "payment_status",
        label: "Payment Status",
        type: "select",
        required: true,
        options: [
          { value: "Pending", label: "Pending" },
          { value: "Paid", label: "Paid" },
          { value: "Refunded", label: "Refunded" }
        ]
      },
      { key: "subtotal", label: "Subtotal", type: "number", step: "0.01", required: true },
      { key: "tax", label: "Tax", type: "number", step: "0.01", required: true },
      { key: "total", label: "Total", type: "number", step: "0.01", required: true },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true },
      { key: "updated_at", label: "Updated At", type: "datetime-local", readOnly: true }
    ]
  },
  order_items: {
    label: "Order Items",
    description: "Line items, quantities, and extended totals for every order.",
    primaryKey: "order_item_id",
    searchableColumns: ["order_item_id", "order_id", "item_type"],
    fields: [
      { key: "order_item_id", label: "Order Item ID", type: "number", readOnly: true },
      { key: "order_id", label: "Order ID", type: "relation", relation: "orders", required: true },
      { key: "item_type", label: "Item Type", type: "text", required: true },
      { key: "quantity", label: "Quantity", type: "number", step: "1", required: true },
      { key: "unit_price", label: "Unit Price", type: "number", step: "0.01", required: true },
      { key: "line_total", label: "Line Total", type: "number", step: "0.01", required: true },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true }
    ]
  },
  status_updates: {
    label: "Status Updates",
    description: "Timeline events attached to each order for customer progress tracking.",
    primaryKey: "status_update_id",
    searchableColumns: ["status_update_id", "order_id", "status", "note", "updated_by"],
    fields: [
      { key: "status_update_id", label: "Status Update ID", type: "number", readOnly: true },
      { key: "order_id", label: "Order ID", type: "relation", relation: "orders", required: true },
      { key: "status", label: "Status", type: "text", required: true },
      { key: "note", label: "Note", type: "textarea" },
      { key: "updated_by", label: "Updated By", type: "text" },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true }
    ]
  },
  wallet_transactions: {
    label: "Wallet Transactions",
    description: "Balance movement records tied to customers and optional orders.",
    primaryKey: "wallet_transaction_id",
    searchableColumns: ["wallet_transaction_id", "user_id", "order_id", "transaction_type", "description"],
    fields: [
      { key: "wallet_transaction_id", label: "Wallet Transaction ID", type: "number", readOnly: true },
      { key: "user_id", label: "User ID", type: "relation", relation: "users", required: true },
      { key: "order_id", label: "Order ID", type: "relation", relation: "orders" },
      {
        key: "transaction_type",
        label: "Transaction Type",
        type: "select",
        required: true,
        options: [
          { value: "credit", label: "Credit" },
          { value: "debit", label: "Debit" },
          { value: "refund", label: "Refund" }
        ]
      },
      { key: "amount", label: "Amount", type: "number", step: "0.01", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true }
    ]
  },
  loyalty_transactions: {
    label: "Loyalty Transactions",
    description: "Points earned or spent by order with descriptive audit notes.",
    primaryKey: "loyalty_transaction_id",
    searchableColumns: ["loyalty_transaction_id", "user_id", "order_id", "description"],
    fields: [
      { key: "loyalty_transaction_id", label: "Loyalty Transaction ID", type: "number", readOnly: true },
      { key: "user_id", label: "User ID", type: "relation", relation: "users", required: true },
      { key: "order_id", label: "Order ID", type: "relation", relation: "orders" },
      { key: "points_change", label: "Points Change", type: "number", step: "1", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true }
    ]
  },
  saved_payment_methods: {
    label: "Saved Payment Methods",
    description: "Stored card references and default payment preferences for users.",
    primaryKey: "payment_method_id",
    searchableColumns: ["payment_method_id", "user_id", "card_brand", "last4"],
    fields: [
      { key: "payment_method_id", label: "Payment Method ID", type: "number", readOnly: true },
      { key: "user_id", label: "User ID", type: "relation", relation: "users", required: true },
      { key: "card_token", label: "Card Token", type: "text", required: true },
      { key: "card_brand", label: "Card Brand", type: "text", required: true },
      { key: "last4", label: "Last 4", type: "text", required: true, maxLength: 4 },
      { key: "is_default", label: "Is Default", type: "checkbox" },
      { key: "created_at", label: "Created At", type: "datetime-local", readOnly: true }
    ]
  }
};

const HIDDEN_TABLES = new Set([
  "wallet_transactions",
  "loyalty_transactions",
  "saved_payment_methods",
  "admin_users"
]);

let initialized = false;

const state = {
  currentTable: "users",
  rows: [],
  selectedRowId: null,
  searchTerm: "",
  searchColumn: "all",
  isCreating: false,
  relationOptions: {},
  customerResults: [],
  selectedCustomerId: null,
  isLocalAdminMode: false
};

const getConfig = () => TABLE_CONFIG[state.currentTable];

const RELATION_CONFIG = {
  users: {
    table: "users",
    primaryKey: "user_id",
    orderBy: "user_id",
    buildLabel: (row) => `#${row.user_id} - ${row.full_name || "Unnamed user"}${row.email ? ` (${row.email})` : ""}`
  },
  guest_orders: {
    table: "guest_orders",
    primaryKey: "guest_order_id",
    orderBy: "guest_order_id",
    buildLabel: (row) => `#${row.guest_order_id} - ${row.full_name || "Guest"}${row.phone ? ` (${row.phone})` : ""}`
  },
  orders: {
    table: "orders",
    primaryKey: "order_id",
    orderBy: "order_id",
    buildLabel: (row) => `#${row.order_id} - ${row.service_type || "Order"}${row.order_status ? ` (${row.order_status})` : ""}`
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDateTimeLocal = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset();
  const local = new Date(parsed.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const formatDisplayDateTime = (value) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : parsed.toLocaleString();
};

const parseDateTimeLocal = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(amount || 0));

const getLocalDayStart = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getLocalWeekStart = (date = new Date()) => {
  const start = getLocalDayStart(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const getPreTaxOrderAmount = (order) => {
  const subtotal = Number(order.subtotal);
  if (Number.isFinite(subtotal)) return subtotal;

  const total = Number(order.total || 0);
  const tax = Number(order.tax || 0);
  return Math.max(total - tax, 0);
};

const matchesCustomerTerm = (customer, term) => {
  const searchText = [
    customer.full_name,
    customer.email,
    customer.phone,
    customer.user_id
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchText.includes(term.toLowerCase());
};

const getSelectedRow = () => {
  const config = getConfig();
  return state.rows.find((row) => String(row[config.primaryKey]) === String(state.selectedRowId)) || null;
};

const getFilteredRows = () => {
  const term = state.searchTerm.trim().toLowerCase();
  const config = getConfig();

  if (!term) return state.rows;

  return state.rows.filter((row) => {
    const columns =
      state.searchColumn === "all"
        ? config.searchableColumns
        : [state.searchColumn];

    return columns.some((column) =>
      String(row[column] ?? "")
        .toLowerCase()
        .includes(term)
    );
  });
};

const buildRecordSummary = (row, config) => {
  const titleColumn =
    config.searchableColumns.find((column) => column !== config.primaryKey && row[column]) ||
    config.primaryKey;
  const metaColumns = config.searchableColumns.filter(
    (column) => column !== config.primaryKey && column !== titleColumn && row[column] !== null && row[column] !== undefined && row[column] !== ""
  );

  return {
    title: row[titleColumn] || `${config.label} record`,
    subtitle: metaColumns.slice(0, 2).map((column) => `${column.replace(/_/g, " ")}: ${row[column]}`).join(" | ")
  };
};

const createEmptyRow = (config) =>
  config.fields.reduce((row, field) => {
    if (field.readOnly) {
      row[field.key] = "";
    } else if (field.type === "checkbox") {
      row[field.key] = false;
    } else if (field.type === "relation") {
      row[field.key] = "";
    } else {
      row[field.key] = "";
    }
    return row;
  }, {});

const coerceFieldValue = (field, rawValue, input) => {
  if (field.type === "checkbox") {
    return Boolean(input?.checked);
  }

  if (rawValue === "") {
    return field.required ? rawValue : null;
  }

  if (field.type === "number") {
    return Number(rawValue);
  }

  if (field.type === "relation") {
    return Number(rawValue);
  }

  if (field.type === "datetime-local") {
    return parseDateTimeLocal(rawValue);
  }

  return rawValue;
};

const createFieldMarkup = (field, value) => {
  const wrapperClass = field.type === "textarea" ? "field-group full" : "field-group";
  const safeValue = value ?? "";

  if (field.type === "checkbox") {
    return `
      <div class="${wrapperClass}">
        <label class="admin-checkbox-field">
          <input type="checkbox" name="${field.key}" ${safeValue ? "checked" : ""} ${field.readOnly ? "disabled" : ""}>
          <span>${field.label}</span>
        </label>
      </div>
    `;
  }

  if (field.type === "textarea") {
    return `
      <div class="${wrapperClass}">
        <label for="field-${field.key}">${field.label}</label>
        <textarea id="field-${field.key}" name="${field.key}" ${field.readOnly ? "readonly" : ""} ${field.required ? "required" : ""}>${escapeHtml(safeValue)}</textarea>
      </div>
    `;
  }

  if (field.type === "select") {
    const selectedValue = String(safeValue ?? "");
    return `
      <div class="${wrapperClass}">
        <label for="field-${field.key}">${field.label}</label>
        <select
          id="field-${field.key}"
          name="${field.key}"
          ${field.readOnly ? "disabled" : ""}
          ${field.required ? "required" : ""}
        >
          <option value="">Select ${field.label}</option>
          ${(field.options || [])
            .map(
              (option) =>
                `<option value="${escapeHtml(option.value)}" ${selectedValue === String(option.value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`
            )
            .join("")}
        </select>
      </div>
    `;
  }

  if (field.type === "relation") {
    const relationKey = field.relation;
    const relationOptions = state.relationOptions[relationKey] || [];
    const selectedValue = String(safeValue ?? "");
    const hasSelectedValue = relationOptions.some((option) => String(option.value) === selectedValue);
    const missingOptionMarkup =
      selectedValue && !hasSelectedValue
        ? `<option value="${escapeHtml(selectedValue)}" selected>#${escapeHtml(selectedValue)} - Current linked record</option>`
        : "";

    return `
      <div class="${wrapperClass}">
        <label for="field-${field.key}">${field.label}</label>
        <select
          id="field-${field.key}"
          name="${field.key}"
          ${field.readOnly ? "disabled" : ""}
          ${field.required ? "required" : ""}
        >
          <option value="">${field.required ? `Select ${field.label}` : `No ${field.label}`}</option>
          ${missingOptionMarkup}
          ${relationOptions
            .map(
              (option) =>
                `<option value="${escapeHtml(option.value)}" ${selectedValue === String(option.value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`
            )
            .join("")}
        </select>
      </div>
    `;
  }

  const valueAttribute =
    field.type === "datetime-local"
      ? formatDateTimeLocal(safeValue)
      : escapeHtml(safeValue);

  return `
    <div class="${wrapperClass}">
      <label for="field-${field.key}">${field.label}</label>
      <input
        id="field-${field.key}"
        name="${field.key}"
        type="${field.type}"
        value="${valueAttribute}"
        ${field.step ? `step="${field.step}"` : ""}
        ${field.maxLength ? `maxlength="${field.maxLength}"` : ""}
        ${field.readOnly ? "readonly" : ""}
        ${field.required ? "required" : ""}
      >
    </div>
  `;
};

const renderSearchColumns = () => {
  const select = document.getElementById("adminSearchColumn");
  const config = getConfig();
  if (!select) return;

  select.innerHTML = `
    <option value="all">All searchable columns</option>
    ${config.searchableColumns
      .map((column) => `<option value="${column}">${column.replace(/_/g, " ")}</option>`)
      .join("")}
  `;
  select.value = state.searchColumn;
};

const renderRecordList = () => {
  const recordList = document.getElementById("adminRecordList");
  const resultCount = document.getElementById("adminResultCount");
  const config = getConfig();
  const rows = getFilteredRows();

  if (!recordList || !resultCount) return;

  resultCount.textContent = `${rows.length} record${rows.length === 1 ? "" : "s"} loaded`;

  if (!rows.length) {
    recordList.innerHTML = '<p class="muted-copy">No records match the current search.</p>';
    return;
  }

  recordList.innerHTML = rows
    .map((row) => {
      const primaryValue = row[config.primaryKey];
      const summary = buildRecordSummary(row, config);
      const isActive = !state.isCreating && String(primaryValue) === String(state.selectedRowId);

      return `
        <button type="button" class="admin-record-card ${isActive ? "active" : ""}" data-record-id="${escapeHtml(primaryValue)}">
          <span class="detail-pill">#${escapeHtml(primaryValue)}</span>
          <strong>${escapeHtml(summary.title)}</strong>
          <p>${escapeHtml(summary.subtitle || config.description)}</p>
        </button>
      `;
    })
    .join("");
};

const renderEditor = () => {
  const form = document.getElementById("adminEditorForm");
  const fieldsContainer = document.getElementById("adminEditorFields");
  const title = document.getElementById("adminEditorTitle");
  const lead = document.getElementById("adminEditorLead");
  const deleteButton = document.getElementById("adminDeleteButton");
  const saveButton = document.getElementById("adminSaveButton");
  const config = getConfig();
  const selectedRow = state.isCreating ? createEmptyRow(config) : getSelectedRow();

  if (!form || !fieldsContainer || !title || !lead || !deleteButton || !saveButton) return;

  if (!selectedRow) {
    title.textContent = "Select a record";
    lead.textContent = "Choose a row from the browser to review and update its values here.";
    fieldsContainer.innerHTML = '<p class="muted-copy">The editor will populate once you select a record.</p>';
    deleteButton.disabled = true;
    saveButton.textContent = "Save Changes";
    return;
  }

  title.textContent = state.isCreating ? `Create ${config.label} record` : `Edit ${config.label} record`;
  lead.textContent = state.isCreating
    ? "Fill in the fields below, then save to create a new database row."
    : `Updating ${config.primaryKey.replace(/_/g, " ")} ${selectedRow[config.primaryKey]}.`;
  saveButton.textContent = state.isCreating ? "Create Record" : "Save Changes";

  fieldsContainer.innerHTML = config.fields
    .map((field) => createFieldMarkup(field, selectedRow[field.key]))
    .join("");

  deleteButton.disabled = state.isCreating;
};

const renderTableMeta = () => {
  const description = document.getElementById("adminTableDescription");
  const portalCount = document.getElementById("adminTableCount");

  if (description) {
    description.textContent = state.isLocalAdminMode
      ? "Local admin mode is active. The portal UI works locally, but database edits still depend on your Supabase table permissions and policies."
      : getConfig().description;
  }
  if (portalCount) {
    const visibleTableCount = Object.keys(TABLE_CONFIG).filter((tableName) => !HIDDEN_TABLES.has(tableName)).length;
    portalCount.textContent = `${visibleTableCount} tables configured`;
  }
};

const loadProfitSummary = async (supabase, showToast) => {
  const todayAmount = document.getElementById("adminProfitToday");
  const weekAmount = document.getElementById("adminProfitWeek");
  const todayCount = document.getElementById("adminProfitTodayCount");
  const weekCount = document.getElementById("adminProfitWeekCount");
  const updatedText = document.getElementById("adminProfitUpdated");

  if (!todayAmount || !weekAmount || !todayCount || !weekCount || !updatedText) return;

  const now = new Date();
  const todayStart = getLocalDayStart(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekStart = getLocalWeekStart(now);

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("subtotal, tax, total, order_status, payment_status, created_at")
      .gte("created_at", weekStart.toISOString())
      .neq("order_status", "Cancelled")
      .eq("payment_status", "Paid");

    if (error) throw error;

    const weekOrders = data || [];
    const todayOrders = weekOrders.filter((order) => {
      const createdAt = new Date(order.created_at);
      return createdAt >= todayStart && createdAt < tomorrowStart;
    });

    const sumOrders = (orders) => orders.reduce((sum, order) => sum + getPreTaxOrderAmount(order), 0);

    todayAmount.textContent = formatCurrency(sumOrders(todayOrders));
    weekAmount.textContent = formatCurrency(sumOrders(weekOrders));
    todayCount.textContent = `${todayOrders.length} paid order${todayOrders.length === 1 ? "" : "s"} counted`;
    weekCount.textContent = `${weekOrders.length} paid order${weekOrders.length === 1 ? "" : "s"} counted`;
    updatedText.textContent = `Updated ${now.toLocaleString()}. Tax and cancelled orders are excluded.`;
  } catch (error) {
    todayAmount.textContent = "$0.00";
    weekAmount.textContent = "$0.00";
    todayCount.textContent = "Could not load orders";
    weekCount.textContent = "Could not load orders";
    updatedText.textContent = "Profit summary could not be loaded.";
    showToast("error", error.message || "Could not load profit summary.");
  }
};

const renderAll = () => {
  renderSearchColumns();
  renderTableMeta();
  renderRecordList();
  renderEditor();
};

const renderCustomerLookupMessage = (message) => {
  const lookup = document.getElementById("adminCustomerLookup");
  if (lookup) lookup.innerHTML = `<p class="muted-copy">${escapeHtml(message)}</p>`;
};

const loadCustomerOrders = async (supabase, userId) => {
  const { data: orders, error: orderError } = await supabase
    .from("orders")
    .select("order_id, service_type, appointment_date, appointment_time, order_status, payment_method, payment_status, subtotal, tax, total, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (orderError) throw orderError;

  const orderIds = (orders || []).map((order) => order.order_id);
  let items = [];

  if (orderIds.length) {
    const { data, error } = await supabase
      .from("order_items")
      .select("order_id, item_type, quantity, line_total")
      .in("order_id", orderIds)
      .order("order_item_id", { ascending: true });

    if (error) throw error;
    items = data || [];
  }

  const itemsByOrder = items.reduce((groups, item) => {
    groups[item.order_id] = groups[item.order_id] || [];
    groups[item.order_id].push(item);
    return groups;
  }, {});

  return (orders || []).map((order) => ({
    ...order,
    items: itemsByOrder[order.order_id] || []
  }));
};

const renderCustomerLookup = async (supabase, showToast, customerId = state.selectedCustomerId) => {
  const lookup = document.getElementById("adminCustomerLookup");
  if (!lookup) return;

  if (!state.customerResults.length) {
    renderCustomerLookupMessage("Search for a customer to view their profile, loyalty points, contact information, and orders.");
    return;
  }

  const selectedCustomer =
    state.customerResults.find((customer) => String(customer.user_id) === String(customerId)) ||
    state.customerResults[0];

  state.selectedCustomerId = selectedCustomer.user_id;
  lookup.innerHTML = '<p class="muted-copy">Loading customer details...</p>';

  try {
    const orders = await loadCustomerOrders(supabase, selectedCustomer.user_id);

    lookup.innerHTML = `
      <div class="admin-customer-layout">
        <div class="admin-customer-results">
          ${state.customerResults
            .map((customer) => {
              const isActive = String(customer.user_id) === String(selectedCustomer.user_id);
              return `
                <button type="button" class="admin-customer-result ${isActive ? "active" : ""}" data-customer-id="${escapeHtml(customer.user_id)}">
                  <strong>${escapeHtml(customer.full_name || "Unnamed customer")}</strong>
                  <p>${escapeHtml(customer.email || "No email")} | ${escapeHtml(customer.phone || "No phone")}</p>
                </button>
              `;
            })
            .join("")}
        </div>

        <div>
          <div class="admin-customer-profile">
            <span class="eyebrow">Customer Profile</span>
            <h3>${escapeHtml(selectedCustomer.full_name || "Unnamed customer")}</h3>
            <div class="admin-customer-profile-grid">
              <p><strong>User ID:</strong> #${escapeHtml(selectedCustomer.user_id)}</p>
              <p><strong>Loyalty:</strong> ${escapeHtml(selectedCustomer.loyalty_points || 0)} pts</p>
              <p><strong>Email:</strong> ${escapeHtml(selectedCustomer.email || "Not available")}</p>
              <p><strong>Phone:</strong> ${escapeHtml(selectedCustomer.phone || "Not available")}</p>
              <p><strong>Created:</strong> ${escapeHtml(formatDisplayDateTime(selectedCustomer.created_at))}</p>
              <p><strong>Orders:</strong> ${orders.length}</p>
            </div>
          </div>

          <div class="admin-customer-orders">
            ${orders.length
              ? orders
                  .map((order) => {
                    const itemSummary = order.items.length
                      ? order.items
                          .map((item) => `${Number(item.quantity || 0)}x ${escapeHtml(item.item_type)} (${formatCurrency(item.line_total)})`)
                          .join(", ")
                      : escapeHtml(order.service_type || "No item details");

                    return `
                      <button type="button" class="admin-customer-order" data-edit-order-id="${escapeHtml(order.order_id)}">
                        <h4>Order #${escapeHtml(order.order_id)}</h4>
                        <p><strong>Service:</strong> ${escapeHtml(order.service_type || "Not available")}</p>
                        <p><strong>Items:</strong> ${itemSummary}</p>
                        <p><strong>Appointment:</strong> ${escapeHtml(order.appointment_date || "No date")} at ${escapeHtml(order.appointment_time || "No time")}</p>
                        <p><strong>Status:</strong> ${escapeHtml(order.order_status || "Not available")} | <strong>Payment:</strong> ${escapeHtml(order.payment_status || "Not available")}</p>
                        <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)} | <strong>Total:</strong> ${formatCurrency(order.total)}</p>
                        <p><strong>Placed:</strong> ${escapeHtml(formatDisplayDateTime(order.created_at))}</p>
                      </button>
                    `;
                  })
                  .join("")
              : '<p class="muted-copy">No orders found for this customer.</p>'}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    showToast("error", error.message || "Could not load customer orders.");
    renderCustomerLookupMessage("Customer details could not be loaded.");
  }
};

const searchCustomers = async (supabase, showToast, term) => {
  const cleanTerm = term.trim();

  if (!cleanTerm) {
    state.customerResults = [];
    state.selectedCustomerId = null;
    renderCustomerLookupMessage("Enter a customer name, email, or phone number to search.");
    return;
  }

  renderCustomerLookupMessage("Searching customers...");

  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, full_name, phone, email, loyalty_points, created_at, updated_at")
      .order("full_name", { ascending: true })
      .limit(250);

    if (error) throw error;

    state.customerResults = (data || []).filter((customer) => matchesCustomerTerm(customer, cleanTerm));
    state.selectedCustomerId = state.customerResults[0]?.user_id ?? null;

    if (!state.customerResults.length) {
      renderCustomerLookupMessage("No customers match that search.");
      return;
    }

    await renderCustomerLookup(supabase, showToast);
  } catch (error) {
    state.customerResults = [];
    state.selectedCustomerId = null;
    showToast("error", error.message || "Could not search customers.");
    renderCustomerLookupMessage("Customer search could not be loaded.");
  }
};

const loadRelationOptions = async (supabase, showToast) => {
  const relationKeys = [
    ...new Set(
      getConfig().fields
        .filter((field) => field.type === "relation" && field.relation)
        .map((field) => field.relation)
    )
  ];

  const loadedOptions = {};

  await Promise.all(
    relationKeys.map(async (relationKey) => {
      const relation = RELATION_CONFIG[relationKey];
      if (!relation) return;

      const { data, error } = await supabase
        .from(relation.table)
        .select("*")
        .order(relation.orderBy, { ascending: false })
        .limit(200);

      if (error) {
        showToast("error", error.message || `Could not load ${relation.table} options.`);
        loadedOptions[relationKey] = [];
        return;
      }

      loadedOptions[relationKey] = (data || []).map((row) => ({
        value: row[relation.primaryKey],
        label: relation.buildLabel(row)
      }));
    })
  );

  state.relationOptions = loadedOptions;
};

const loadTableRows = async (supabase, showToast) => {
  const config = getConfig();
  await loadRelationOptions(supabase, showToast);
  const { data, error } = await supabase
    .from(state.currentTable)
    .select("*")
    .order(config.primaryKey, { ascending: false })
    .limit(250);

  if (error) {
    showToast("error", error.message || `Could not load ${config.label}.`);
    return;
  }

  state.rows = data || [];
  state.isCreating = false;
  state.selectedRowId = state.rows[0]?.[config.primaryKey] ?? null;
  renderAll();
  await loadProfitSummary(supabase, showToast);
};

const openOrderInEditor = async (supabase, showToast, orderId) => {
  const tableSelect = document.getElementById("adminTableSelect");

  state.currentTable = "orders";
  state.searchColumn = "all";
  state.searchTerm = "";
  state.isCreating = false;

  if (tableSelect instanceof HTMLSelectElement) tableSelect.value = "orders";

  await loadRelationOptions(supabase, showToast);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("order_id", { ascending: false })
    .limit(250);

  if (error) {
    showToast("error", error.message || "Could not load orders.");
    return;
  }

  state.rows = data || [];
  state.selectedRowId = orderId;
  renderAll();
  document.querySelector(".admin-editor-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const buildPayloadFromForm = (form) => {
  const config = getConfig();
  const payload = {};

  config.fields.forEach((field) => {
    if (field.readOnly) return;

    const input = form.elements.namedItem(field.key);
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement)) return;

    const rawValue = input.type === "checkbox" ? input.checked : input.value.trim();
    payload[field.key] = coerceFieldValue(field, rawValue, input);
  });

  return payload;
};

const wireEvents = (supabase, showToast) => {
  const customerSearchForm = document.getElementById("adminCustomerSearchForm");
  const customerSearchInput = document.getElementById("adminCustomerSearchInput");
  const tableSelect = document.getElementById("adminTableSelect");
  const searchColumn = document.getElementById("adminSearchColumn");
  const searchInput = document.getElementById("adminSearchInput");
  const refreshButton = document.getElementById("adminRefreshButton");
  const newButton = document.getElementById("adminNewRecordButton");
  const recordList = document.getElementById("adminRecordList");
  const form = document.getElementById("adminEditorForm");
  const deleteButton = document.getElementById("adminDeleteButton");

  customerSearchForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const term = customerSearchInput instanceof HTMLInputElement ? customerSearchInput.value : "";
    await searchCustomers(supabase, showToast, term);
  });

  document.getElementById("adminCustomerLookup")?.addEventListener("click", async (event) => {
    const orderTarget = event.target instanceof HTMLElement ? event.target.closest("[data-edit-order-id]") : null;
    if (orderTarget instanceof HTMLElement) {
      const orderId = orderTarget.dataset.editOrderId;
      if (orderId) await openOrderInEditor(supabase, showToast, orderId);
      return;
    }

    const target = event.target instanceof HTMLElement ? event.target.closest("[data-customer-id]") : null;
    if (!(target instanceof HTMLElement)) return;

    state.selectedCustomerId = target.dataset.customerId || null;
    await renderCustomerLookup(supabase, showToast, state.selectedCustomerId);
  });

  tableSelect?.addEventListener("change", async (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    state.currentTable = event.target.value;
    state.searchColumn = "all";
    state.searchTerm = "";
    if (searchInput instanceof HTMLInputElement) searchInput.value = "";
    await loadTableRows(supabase, showToast);
  });

  searchColumn?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    state.searchColumn = event.target.value;
    renderRecordList();
  });

  searchInput?.addEventListener("input", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    state.searchTerm = event.target.value;
    renderRecordList();
  });

  refreshButton?.addEventListener("click", async () => {
    await loadTableRows(supabase, showToast);
    showToast("success", `${getConfig().label} refreshed.`);
  });

  newButton?.addEventListener("click", () => {
    state.isCreating = true;
    state.selectedRowId = null;
    renderRecordList();
    renderEditor();
    window.setTimeout(() => {
      const firstEditableField = document.querySelector(
        "#adminEditorFields input:not([readonly]):not([type='checkbox']), #adminEditorFields textarea:not([readonly]), #adminEditorFields select:not([disabled])"
      );

      if (
        firstEditableField instanceof HTMLInputElement ||
        firstEditableField instanceof HTMLTextAreaElement ||
        firstEditableField instanceof HTMLSelectElement
      ) {
        firstEditableField.focus();
      }
    }, 0);
  });

  recordList?.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-record-id]") : null;
    if (!(target instanceof HTMLElement)) return;

    state.selectedRowId = target.dataset.recordId || null;
    state.isCreating = false;
    renderRecordList();
    renderEditor();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(form instanceof HTMLFormElement)) return;

    const config = getConfig();
    const payload = buildPayloadFromForm(form);

    try {
      if (state.isCreating) {
        const { data, error } = await supabase
          .from(state.currentTable)
          .insert(payload)
          .select(config.primaryKey)
          .single();
        if (error) throw error;
        state.selectedRowId = data?.[config.primaryKey] ?? null;
        state.isCreating = false;
        showToast("success", `${config.label} record created.`);
      } else {
        const selectedRow = getSelectedRow();
        if (!selectedRow) throw new Error("Choose a record to update first.");

        const { error } = await supabase
          .from(state.currentTable)
          .update(payload)
          .eq(config.primaryKey, selectedRow[config.primaryKey]);

        if (error) throw error;
        showToast("success", `${config.label} record updated.`);
      }

      await loadTableRows(supabase, showToast);
    } catch (error) {
      showToast("error", error.message || `Could not save ${config.label}.`);
    }
  });

  deleteButton?.addEventListener("click", async () => {
    const config = getConfig();
    const selectedRow = getSelectedRow();

    if (!selectedRow) {
      showToast("error", "Choose a record before trying to delete it.");
      return;
    }

    const confirmed = window.confirm(`Delete ${config.label} record #${selectedRow[config.primaryKey]}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from(state.currentTable)
        .delete()
        .eq(config.primaryKey, selectedRow[config.primaryKey]);

      if (error) throw error;

      showToast("success", `${config.label} record deleted.`);
      await loadTableRows(supabase, showToast);
    } catch (error) {
      showToast("error", error.message || `Could not delete ${config.label}.`);
    }
  });
};

export const initAdminPortal = async (supabase, sessionState, showToast = fallbackToast) => {
  if (getCurrentFileName() !== "admin-portal.html") {
    return;
  }

  const tableSelect = document.getElementById("adminTableSelect");
  const portalName = document.getElementById("adminPortalName");
  const portalRole = document.getElementById("adminPortalRole");

  if (portalName && sessionState.adminProfile?.fullName) {
    portalName.textContent = sessionState.adminProfile.fullName;
  }

  if (portalRole && sessionState.adminProfile?.role) {
    portalRole.textContent = sessionState.adminProfile.role;
  }

  if (tableSelect && !tableSelect.options.length) {
    tableSelect.innerHTML = Object.entries(TABLE_CONFIG)
      .filter(([key]) => !HIDDEN_TABLES.has(key))
      .map(([key, config]) => `<option value="${key}">${config.label}</option>`)
      .join("");
  }

  if (!initialized) {
    wireEvents(supabase, showToast);
    initialized = true;
  }

  state.isLocalAdminMode = Boolean(sessionState.adminProfile?.isLocalFallback);
  state.currentTable = tableSelect?.value || state.currentTable;
  renderAll();
  await loadTableRows(supabase, showToast);
};
