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
          { value: "Dry Cleaning", label: "Dry Cleaning" },
          { value: "Wash and Fold", label: "Wash and Fold" },
          { value: "Ironing", label: "Ironing" },
          { value: "Bedding and Linen", label: "Bedding and Linen" },
          { value: "Curtain Cleaning", label: "Curtain Cleaning" },
          { value: "Leather Cleaning", label: "Leather Cleaning" },
          { value: "Mixed Order", label: "Mixed Order" }
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
  vendors: {
    label: "Vendors",
    description: "Vendor orders, delivery timing, and fulfillment notes.",
    primaryKey: "vendor_id",
    searchableColumns: ["vendor_id", "vendor_name", "delivery_status", "description"],
    fields: [
      { key: "vendor_id", label: "Vendor ID", type: "number", readOnly: true },
      { key: "vendor_name", label: "Vendor Name", type: "text", required: true },
      { key: "order_cost", label: "Order Cost", type: "number", step: "0.01", required: true },
      { key: "order_date", label: "Order Date", type: "date", required: true },
      { key: "delivery_date", label: "Delivery Date", type: "date" },
      {
        key: "delivery_status",
        label: "Delivery Status",
        type: "select",
        required: true,
        options: [
          { value: "Delivered", label: "Delivered" },
          { value: "Not Delivered", label: "Not Delivered" }
        ]
      },
      { key: "description", label: "Description", type: "textarea" },
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

const ORDER_ITEM_CATALOG = {
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
  isLocalAdminMode: false,
  analytics: {
    orders: [],
    orderItems: [],
    metric: "income",
    serviceFilter: "allServices",
    timeScale: "days",
    points: [],
    hoveredIndex: null,
    loaded: false
  }
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

const formatExactTenDigitPhoneSearch = (value) => {
  const rawValue = String(value || "");
  const digits = rawValue.replace(/\D/g, "");
  if (/^\d{10}$/.test(rawValue)) return `(${rawValue.slice(0, 3)}) ${rawValue.slice(3, 6)}-${rawValue.slice(6)}`;
  if (/^\(\d{3}\) \d{3}-\d{4}$/.test(rawValue)) return rawValue;
  if (/^[\d()\-\s]+$/.test(rawValue)) return digits;
  return rawValue.replace(/[()\-\s]/g, "");
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

const getFieldConfig = (tableKey, fieldKey) =>
  TABLE_CONFIG[tableKey]?.fields.find((field) => field.key === fieldKey) || null;

const createSelectMarkup = (id, name, label, options, selectedValue = "", required = false, placeholder = "") => `
  <div class="field-group">
    <label for="${id}">${label}</label>
    <select id="${id}" name="${name}" ${required ? "required" : ""}>
      <option value="">${placeholder || `Select ${label}`}</option>
      ${options
        .map(
          (option) =>
            `<option value="${escapeHtml(option.value)}" ${String(selectedValue) === String(option.value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`
        )
        .join("")}
    </select>
  </div>
`;

const parseAdminOrderItems = (formData) =>
  Object.entries(ORDER_ITEM_CATALOG)
    .map(([key, config]) => {
      const quantity = parseInt(String(formData.get(`order_item_${key}`) || "0"), 10);
      return {
        itemType: config.label,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
        unitPrice: config.unitPrice
      };
    })
    .filter((item) => item.quantity > 0);

const calculateAdminOrderTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const roundedSubtotal = Number(subtotal.toFixed(2));
  const tax = Number((roundedSubtotal * 0.05).toFixed(2));
  const total = Number((roundedSubtotal + tax).toFixed(2));
  return { subtotal: roundedSubtotal, tax, total };
};

const createOrderEditorMarkup = () => {
  const serviceOptions = getFieldConfig("orders", "service_type")?.options || [];
  const paymentOptions = getFieldConfig("orders", "payment_method")?.options || [];
  const userOptions = state.relationOptions.users || [];
  const selectedCustomerId = state.selectedCustomerId || "";

  return `
    <div class="field-group full">
      <p class="muted-copy">Create a complete order from one screen. This will create the order row and all matching order item rows automatically.</p>
    </div>
    ${createSelectMarkup("field-order-customer-type", "order_customer_type", "Customer Type", [
      { value: "registered", label: "Registered Customer" },
      { value: "guest", label: "Guest Order" }
    ], selectedCustomerId ? "registered" : "guest", true)}
    ${createSelectMarkup("field-user-id", "user_id", "Registered Customer", userOptions, selectedCustomerId, false, "Select customer")}
    <div class="field-group">
      <label for="field-guest-full-name">Guest Full Name</label>
      <input id="field-guest-full-name" name="guest_full_name" type="text" placeholder="Guest full name">
    </div>
    <div class="field-group">
      <label for="field-guest-phone">Guest Phone</label>
      <input id="field-guest-phone" name="guest_phone" type="text" placeholder="Guest phone number">
    </div>
    ${createSelectMarkup("field-service-type", "service_type", "Service Type", serviceOptions, "", true)}
    <div class="field-group">
      <label for="field-appointment-date">Appointment Date</label>
      <input id="field-appointment-date" name="appointment_date" type="date" required>
    </div>
    <div class="field-group">
      <label for="field-appointment-time">Appointment Time</label>
      <input id="field-appointment-time" name="appointment_time" type="text" placeholder="2:00 PM" required>
    </div>
    ${createSelectMarkup("field-payment-method", "payment_method", "Payment Method", paymentOptions, "cash", true)}
    <div class="field-group full">
      <label for="field-order-notes">Notes</label>
      <textarea id="field-order-notes" name="notes" placeholder="Pickup notes, stain notes, or special instructions"></textarea>
    </div>
    <div class="field-group full">
      <h3>Items</h3>
      <p class="muted-copy">Enter quantities for the items in this order. Totals will be calculated automatically when the order is created.</p>
    </div>
    ${Object.entries(ORDER_ITEM_CATALOG)
      .map(
        ([key, item]) => `
          <div class="field-group">
            <label for="field-order-item-${key}">${escapeHtml(item.label)}</label>
            <input id="field-order-item-${key}" name="order_item_${key}" type="number" min="0" step="1" value="0">
          </div>
        `
      )
      .join("")}
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

  if (state.isCreating && ["orders", "order_items"].includes(state.currentTable)) {
    title.textContent = "Create Order record";
    lead.textContent = "Create a new order and its order items together from the admin portal.";
    saveButton.textContent = "Create Order";
    fieldsContainer.innerHTML = createOrderEditorMarkup();
    deleteButton.disabled = true;
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

const ANALYTICS_METRICS = {
  income: { label: "Income", unit: "money", summary: "total order income, excluding cancelled orders" },
  pretaxIncome: { label: "Pre-Tax Income", unit: "money", summary: "subtotal income before tax from non-cancelled orders" },
  orders: { label: "Orders Created", unit: "count", summary: "non-cancelled orders created" },
  paidOrders: { label: "Paid Orders", unit: "count", summary: "paid, non-cancelled orders" },
  completedOrders: { label: "Orders Completed", unit: "count", summary: "orders marked completed" },
  averageOrder: { label: "Average Order Value", unit: "money", summary: "average value per non-cancelled order" }
};

const ANALYTICS_SERVICE_FILTERS = {
  allServices: { label: "All Services", serviceType: "" },
  dryCleaning: { label: "Dry Cleaning", serviceType: "dry cleaning" },
  washFold: { label: "Wash and Fold", serviceType: "wash and fold" },
  ironing: { label: "Ironing", serviceType: "ironing" },
  beddingLinen: { label: "Bedding and Linen", serviceType: "bedding and linen" },
  curtainCleaning: { label: "Curtain Cleaning", serviceType: "curtain cleaning" },
  leatherCleaning: { label: "Leather Cleaning", serviceType: "leather cleaning" },
  mixedOrder: { label: "Mixed Order", serviceType: "mixed order" }
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getRowDate = (row) => {
  const parsed = new Date(row.created_at || row.updated_at || row.appointment_date || "");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAnalyticsWeekStart = (date) => {
  const start = getLocalDayStart(date);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
};

const buildAnalyticsBuckets = (scale) => {
  const now = new Date();

  if (scale === "hours") {
    return Array.from({ length: 9 }, (_, index) => {
      const hour = 9 + index;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour + 1);
      const displayHour = hour > 12 ? hour - 12 : hour;
      return { label: `${displayHour} ${hour >= 12 ? "PM" : "AM"}`, start, end };
    });
  }

  if (scale === "weeks") {
    const currentWeek = getAnalyticsWeekStart(now);
    return Array.from({ length: 10 }, (_, index) => {
      const start = addDays(currentWeek, (index - 9) * 7);
      return { label: `${start.getMonth() + 1}/${start.getDate()}`, start, end: addDays(start, 7) };
    });
  }

  if (scale === "months") {
    return Array.from({ length: 12 }, (_, index) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { label: start.toLocaleString(undefined, { month: "short" }), start, end };
    });
  }

  if (scale === "years") {
    return Array.from({ length: 5 }, (_, index) => {
      const year = now.getFullYear() - 4 + index;
      return { label: String(year), start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
    });
  }

  const today = getLocalDayStart(now);
  return Array.from({ length: 14 }, (_, index) => {
    const start = addDays(today, index - 13);
    return { label: `${start.getMonth() + 1}/${start.getDate()}`, start, end: addDays(start, 1) };
  });
};

const isDateInBucket = (date, bucket) => date && date >= bucket.start && date < bucket.end;

const getAnalyticsOrderSet = () =>
  state.analytics.orders.filter((order) => String(order.order_status || "").toLowerCase() !== "cancelled");

const orderMatchesAnalyticsService = (order, serviceFilter = state.analytics.serviceFilter) => {
  const filter = ANALYTICS_SERVICE_FILTERS[serviceFilter];
  if (!filter || !filter.serviceType) return true;
  const service = String(order.service_type || "").trim().toLowerCase();
  return service === filter.serviceType;
};

const formatAnalyticsValue = (value, metricKey = state.analytics.metric) =>
  ANALYTICS_METRICS[metricKey]?.unit === "money" ? formatCurrency(value) : Number(value || 0).toLocaleString();

const getAnalyticsPercentChange = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0 && current === 0) {
    return { className: "neutral", text: "0%" };
  }

  if (previous === 0) {
    return { className: "positive", text: "+100%" };
  }

  const percent = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.abs(percent) < 0.05 ? 0 : Number(percent.toFixed(1));

  if (rounded === 0) {
    return { className: "neutral", text: "0%" };
  }

  return {
    className: rounded > 0 ? "positive" : "negative",
    text: `${rounded > 0 ? "+" : ""}${rounded}%`
  };
};

const buildAnalyticsPoints = () => {
  const metric = state.analytics.metric;
  const buckets = buildAnalyticsBuckets(state.analytics.timeScale);
  const activeOrders = getAnalyticsOrderSet();

  return buckets.map((bucket) => {
    const bucketOrders = activeOrders.filter((order) => isDateInBucket(getRowDate(order), bucket));
    const orders = bucketOrders.filter((order) => orderMatchesAnalyticsService(order));
    const income = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pretaxIncome = orders.reduce((sum, order) => sum + getPreTaxOrderAmount(order), 0);

    let value = income;
    if (metric === "pretaxIncome") value = pretaxIncome;
    if (metric === "orders") value = orders.length;
    if (metric === "paidOrders") value = orders.filter((order) => order.payment_status === "Paid").length;
    if (metric === "completedOrders") value = orders.filter((order) => order.order_status === "Completed").length;
    if (metric === "averageOrder") value = orders.length ? income / orders.length : 0;

    return {
      ...bucket,
      value,
      serviceOrderCount: orders.length,
      serviceIncome: income
    };
  });
};

const renderAnalyticsSummary = () => {
  const orders = getAnalyticsOrderSet();
  const income = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const completedOrders = orders.filter((order) => order.order_status === "Completed").length;
  const average = orders.length ? income / orders.length : 0;

  const revenueEl = document.getElementById("adminAnalyticsRevenue");
  const ordersEl = document.getElementById("adminAnalyticsOrders");
  const completedEl = document.getElementById("adminAnalyticsCompleted");
  const averageEl = document.getElementById("adminAnalyticsAverage");

  if (revenueEl) revenueEl.textContent = formatCurrency(income);
  if (ordersEl) ordersEl.textContent = orders.length.toLocaleString();
  if (completedEl) completedEl.textContent = completedOrders.toLocaleString();
  if (averageEl) averageEl.textContent = formatCurrency(average);
};

const drawAnalyticsChart = () => {
  const canvas = document.getElementById("adminAnalyticsChart");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const wrap = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  if (!ctx || !wrap) return;

  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(620, Math.floor(wrap.clientWidth));
  const height = Math.max(360, Math.floor(parseFloat(window.getComputedStyle(wrap).height) || 420));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const points = state.analytics.points;
  const metric = ANALYTICS_METRICS[state.analytics.metric] || ANALYTICS_METRICS.income;
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const niceMax = maxValue <= 0 ? 1 : maxValue * 1.16;
  const plot = { left: 76, right: 28, top: 26, bottom: 66 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(15, 79, 150, 0.12)";
  ctx.fillStyle = "#58708d";
  ctx.lineWidth = 1;
  ctx.font = "12px Merriweather, Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let index = 0; index <= 4; index += 1) {
    const y = plot.top + plotHeight * (index / 4);
    const value = niceMax * (1 - index / 4);
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(width - plot.right, y);
    ctx.stroke();
    ctx.fillText(metric.unit === "money" ? `$${Math.round(value)}` : Math.round(value), plot.left - 12, y);
  }

  if (!points.length) return;

  const slot = plotWidth / points.length;
  const barWidth = Math.max(18, Math.min(56, slot * 0.58));
  const linePoints = [];

  points.forEach((point, index) => {
    const x = plot.left + slot * index + slot / 2;
    const barHeight = (point.value / niceMax) * plotHeight;
    const y = plot.top + plotHeight - barHeight;
    const isHovered = state.analytics.hoveredIndex === index;

    linePoints.push({ x, y });

    const gradient = ctx.createLinearGradient(0, y, 0, plot.top + plotHeight);
    gradient.addColorStop(0, isHovered ? "#0f4f96" : "#4b86d8");
    gradient.addColorStop(1, isHovered ? "#87b8ef" : "#cfdffb");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - barWidth / 2, y, barWidth, Math.max(2, barHeight));

    ctx.fillStyle = isHovered ? "#0f4f96" : "#58708d";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(point.label, x, plot.top + plotHeight + 18);
  });

  ctx.strokeStyle = "#247a4d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  linePoints.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  linePoints.forEach((point, index) => {
    ctx.beginPath();
    ctx.fillStyle = state.analytics.hoveredIndex === index ? "#0f4f96" : "#247a4d";
    ctx.arc(point.x, point.y, state.analytics.hoveredIndex === index ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  });
};

const renderAnalytics = () => {
  const metricSelect = document.getElementById("adminAnalyticsMetric");
  const timeScaleSelect = document.getElementById("adminAnalyticsTimeScale");
  const title = document.getElementById("adminAnalyticsTitle");
  const subtitle = document.getElementById("adminAnalyticsSubtitle");
  const total = document.getElementById("adminAnalyticsTotal");
  const metric = ANALYTICS_METRICS[state.analytics.metric] || ANALYTICS_METRICS.income;
  const serviceFilter = ANALYTICS_SERVICE_FILTERS[state.analytics.serviceFilter];

  state.analytics.points = buildAnalyticsPoints();
  const visibleValues = state.analytics.points.filter((point) => point.value > 0);
  const totalValue =
    state.analytics.metric === "averageOrder"
      ? visibleValues.reduce((sum, point) => sum + point.value, 0) / Math.max(visibleValues.length, 1)
      : state.analytics.points.reduce((sum, point) => sum + point.value, 0);

  if (metricSelect instanceof HTMLSelectElement) metricSelect.value = state.analytics.serviceFilter;
  if (timeScaleSelect instanceof HTMLSelectElement) timeScaleSelect.value = state.analytics.timeScale;
  if (title) title.textContent = `${metric.label} by ${state.analytics.timeScale}${serviceFilter ? ` - ${serviceFilter.label}` : ""}`;
  if (subtitle) {
    subtitle.textContent = state.analytics.loaded
      ? `Showing ${metric.summary} for ${serviceFilter?.label || "the selected service"}. Change the time scale, service filter, or button to explore another view.`
      : "Loading graph data...";
  }
  if (total) {
    total.textContent = `${formatAnalyticsValue(totalValue)} ${state.analytics.metric === "averageOrder" ? "average" : "total"}`;
  }

  document.querySelectorAll("[data-analytics-metric]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-analytics-metric") === state.analytics.metric);
  });

  renderAnalyticsSummary();
  drawAnalyticsChart();
};

const updateAnalyticsHover = (event) => {
  const canvas = document.getElementById("adminAnalyticsChart");
  const tooltip = document.getElementById("adminAnalyticsTooltip");
  if (!(canvas instanceof HTMLCanvasElement) || !(tooltip instanceof HTMLElement) || !state.analytics.points.length) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const plotLeft = 76;
  const plotRight = 28;
  const slot = (rect.width - plotLeft - plotRight) / state.analytics.points.length;
  const index = Math.max(0, Math.min(state.analytics.points.length - 1, Math.floor((x - plotLeft) / slot)));
  const point = state.analytics.points[index];
  const previousPoint = index > 0 ? state.analytics.points[index - 1] : null;
  const metric = ANALYTICS_METRICS[state.analytics.metric] || ANALYTICS_METRICS.income;
  const serviceFilter = ANALYTICS_SERVICE_FILTERS[state.analytics.serviceFilter];
  const change = previousPoint
    ? getAnalyticsPercentChange(point.value, previousPoint.value)
    : { className: "neutral", text: "0%" };

  state.analytics.hoveredIndex = index;
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(rect.width - 180, Math.max(12, x + 12))}px`;
  tooltip.style.top = `${Math.max(12, event.clientY - rect.top - 46)}px`;
  tooltip.innerHTML = `
    <strong>${escapeHtml(point.label)}</strong>
    <span>${escapeHtml(metric.label)}: ${escapeHtml(formatAnalyticsValue(point.value))}</span>
    <span>${escapeHtml(serviceFilter?.label || "Service")} Orders: ${escapeHtml(Number(point.serviceOrderCount || 0).toLocaleString())}</span>
    <span>Income: ${escapeHtml(formatCurrency(point.serviceIncome || 0))}</span>
    <span class="analytics-change ${change.className}">${escapeHtml(change.text)}</span>
  `;
  drawAnalyticsChart();
};

const clearAnalyticsHover = () => {
  const tooltip = document.getElementById("adminAnalyticsTooltip");
  state.analytics.hoveredIndex = null;
  if (tooltip instanceof HTMLElement) tooltip.hidden = true;
  drawAnalyticsChart();
};

const loadAnalyticsData = async (supabase, showToast) => {
  const chart = document.getElementById("adminAnalyticsChart");
  if (!chart) return;

  try {
    const [{ data: orders, error: ordersError }, { data: orderItems, error: itemsError }] = await Promise.all([
      supabase
        .from("orders")
        .select("order_id, service_type, order_status, payment_status, subtotal, tax, total, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("order_items")
        .select("order_item_id, order_id, item_type, quantity, line_total, created_at")
        .order("created_at", { ascending: false })
        .limit(1000)
    ]);

    if (ordersError || itemsError) throw ordersError || itemsError;

    state.analytics.orders = orders || [];
    state.analytics.orderItems = orderItems || [];
    state.analytics.loaded = true;
    renderAnalytics();
  } catch (error) {
    showToast("error", error.message || "Could not load graph data.");
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
  state.rows = [];
  state.selectedRowId = null;
  state.isCreating = false;
  renderAll();
  await loadRelationOptions(supabase, showToast);
  const { data, error } = await supabase
    .from(state.currentTable)
    .select("*")
    .order(config.primaryKey, { ascending: false })
    .limit(250);

  if (error) {
    renderAll();
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

const createAdminOrderRecord = async (supabase) => {
  const form = document.getElementById("adminEditorForm");
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("The order form is not available right now.");
  }

  const formData = new FormData(form);
  const customerType = String(formData.get("order_customer_type") || "guest");
  const serviceType = String(formData.get("service_type") || "").trim();
  const appointmentDate = String(formData.get("appointment_date") || "").trim();
  const appointmentTime = String(formData.get("appointment_time") || "").trim();
  const paymentMethod = String(formData.get("payment_method") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const items = parseAdminOrderItems(formData);

  if (!serviceType || !appointmentDate || !appointmentTime || !paymentMethod) {
    throw new Error("Service, appointment date, appointment time, and payment method are required.");
  }

  if (!items.length) {
    throw new Error("Add at least one order item before creating the order.");
  }

  let userId = null;
  let guestOrderId = null;

  if (customerType === "registered") {
    userId = Number(formData.get("user_id") || 0);
    if (!userId) {
      throw new Error("Select a registered customer before creating this order.");
    }
  } else {
    const guestName = String(formData.get("guest_full_name") || "").trim();
    const guestPhone = String(formData.get("guest_phone") || "").trim();

    if (!guestName || !guestPhone) {
      throw new Error("Guest name and phone are required for guest orders.");
    }

    const { data: guest, error: guestError } = await supabase
      .from("guest_orders")
      .insert({ full_name: guestName, phone: guestPhone })
      .select("guest_order_id")
      .single();

    if (guestError) throw guestError;
    guestOrderId = guest.guest_order_id;
  }

  const { subtotal, tax, total } = calculateAdminOrderTotals(items);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      guest_order_id: guestOrderId,
      service_type: serviceType,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      notes: notes || null,
      order_status: "Drop off",
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
      line_total: Number((item.quantity * item.unitPrice).toFixed(2))
    }))
  );

  if (itemsError) throw itemsError;

  const { error: statusError } = await supabase.from("status_updates").insert({
    order_id: orderId,
    status: "Drop off",
    note: "Order created from admin portal",
    updated_by: "Admin Portal"
  });

  if (statusError) throw statusError;

  return orderId;
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
  const analyticsRefreshButton = document.getElementById("adminAnalyticsRefreshButton");
  const analyticsMetricSelect = document.getElementById("adminAnalyticsMetric");
  const analyticsTimeScaleSelect = document.getElementById("adminAnalyticsTimeScale");
  const analyticsMetricButtons = document.getElementById("adminAnalyticsMetricButtons");
  const analyticsChart = document.getElementById("adminAnalyticsChart");

  customerSearchForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const term = customerSearchInput instanceof HTMLInputElement ? customerSearchInput.value : "";
    await searchCustomers(supabase, showToast, term);
  });

  customerSearchInput?.addEventListener("input", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const formattedValue = formatExactTenDigitPhoneSearch(event.target.value);
    if (formattedValue !== event.target.value) {
      event.target.value = formattedValue;
    }
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
    state.rows = [];
    state.selectedRowId = null;
    state.isCreating = false;
    if (searchInput instanceof HTMLInputElement) searchInput.value = "";
    renderAll();
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
    await loadAnalyticsData(supabase, showToast);
    showToast("success", `${getConfig().label} refreshed.`);
  });

  analyticsRefreshButton?.addEventListener("click", async () => {
    await loadAnalyticsData(supabase, showToast);
    showToast("success", "Graph refreshed.");
  });

  analyticsMetricSelect?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    state.analytics.serviceFilter = event.target.value;
    renderAnalytics();
  });

  analyticsTimeScaleSelect?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    state.analytics.timeScale = event.target.value;
    renderAnalytics();
  });

  analyticsMetricButtons?.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-analytics-metric]") : null;
    if (!(target instanceof HTMLElement)) return;
    state.analytics.metric = target.getAttribute("data-analytics-metric") || state.analytics.metric;
    renderAnalytics();
  });

  analyticsChart?.addEventListener("mousemove", updateAnalyticsHover);
  analyticsChart?.addEventListener("mouseleave", clearAnalyticsHover);
  window.addEventListener("resize", drawAnalyticsChart);

  newButton?.addEventListener("click", async () => {
    if (["orders", "order_items"].includes(state.currentTable)) {
      await loadRelationOptions(supabase, showToast);
    }

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

    try {
      if (state.isCreating && ["orders", "order_items"].includes(state.currentTable)) {
        const orderId = await createAdminOrderRecord(supabase);
        state.currentTable = "orders";
        const activeTableSelect = document.getElementById("adminTableSelect");
        if (activeTableSelect instanceof HTMLSelectElement) activeTableSelect.value = "orders";
        state.selectedRowId = orderId;
        state.isCreating = false;
        showToast("success", "Order record created.");
        await loadTableRows(supabase, showToast);
        await loadAnalyticsData(supabase, showToast);
        return;
      }

      const payload = buildPayloadFromForm(form);

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
      await loadAnalyticsData(supabase, showToast);
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
      await loadAnalyticsData(supabase, showToast);
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
  renderAnalytics();
  await loadAnalyticsData(supabase, showToast);
  await loadTableRows(supabase, showToast);
};
