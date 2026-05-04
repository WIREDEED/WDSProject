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
      { key: "password_hash", label: "Password Hash", type: "text" },
      { key: "wallet_balance", label: "Wallet Balance", type: "number", step: "0.01" },
      { key: "loyalty_points", label: "Loyalty Points", type: "number", step: "1" },
      { key: "text_updates", label: "Text Updates", type: "checkbox" },
      { key: "email_updates", label: "Email Updates", type: "checkbox" },
      { key: "allow_saved_card", label: "Allow Saved Card", type: "checkbox" },
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

let initialized = false;

const state = {
  currentTable: "users",
  rows: [],
  selectedRowId: null,
  searchTerm: "",
  searchColumn: "all",
  isCreating: false,
  relationOptions: {},
  isLocalAdminMode: false,
  analytics: {
    orders: [],
    orderItems: [],
    metric: "revenue",
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

const parseDateTimeLocal = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
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
  if (portalCount) portalCount.textContent = `${Object.keys(TABLE_CONFIG).length} tables configured`;
};

const renderAll = () => {
  renderSearchColumns();
  renderTableMeta();
  renderRecordList();
  renderEditor();
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

const ANALYTICS_METRICS = {
  revenue: { label: "Income", unit: "money", summary: "total income from non-cancelled orders" },
  orders: { label: "Orders Created", unit: "count", summary: "non-cancelled orders created" },
  items: { label: "Items Sold", unit: "count", summary: "total item quantity sold" },
  averageOrder: { label: "Average Order Value", unit: "money", summary: "average value per non-cancelled order" },
  washFold: { label: "Wash and Fold Orders", unit: "count", summary: "Wash and Fold orders created" },
  dryCleaning: { label: "Dry Cleaning Orders", unit: "count", summary: "Dry Cleaning orders created" },
  washIron: { label: "Wash and Iron Orders", unit: "count", summary: "Wash and Iron orders created" },
  specialty: { label: "Specialty Cleaning Orders", unit: "count", summary: "Specialty Cleaning orders created" }
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatAnalyticsValue = (value, metricKey = state.analytics.metric) =>
  ANALYTICS_METRICS[metricKey]?.unit === "money" ? formatMoney(value) : formatNumber(value);

const normalizeServiceType = (value) => String(value || "").trim().toLowerCase();

const metricMatchesOrder = (order, metricKey) => {
  const service = normalizeServiceType(order.service_type);
  if (metricKey === "washFold") return service === "wash and fold";
  if (metricKey === "dryCleaning") return service === "dry cleaning";
  if (metricKey === "washIron") return service === "wash and iron";
  if (metricKey === "specialty") return service === "specialty cleaning";
  return true;
};

const getRowDate = (row) => {
  const parsed = new Date(row.created_at || row.updated_at || row.appointment_date || "");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getWeekStart = (date) => {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, offset));
};

const buildTimeBuckets = (scale) => {
  const now = new Date();

  if (scale === "hours") {
    return Array.from({ length: 9 }, (_, index) => {
      const hour = 9 + index;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour + 1);
      const labelHour = hour > 12 ? hour - 12 : hour;
      const suffix = hour >= 12 ? "PM" : "AM";
      return { label: `${labelHour} ${suffix}`, start, end };
    });
  }

  if (scale === "weeks") {
    const currentWeek = getWeekStart(now);
    return Array.from({ length: 10 }, (_, index) => {
      const start = addDays(currentWeek, (index - 9) * 7);
      const end = addDays(start, 7);
      return { label: `${start.getMonth() + 1}/${start.getDate()}`, start, end };
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

  const today = startOfDay(now);
  return Array.from({ length: 14 }, (_, index) => {
    const start = addDays(today, index - 13);
    const end = addDays(start, 1);
    return { label: `${start.getMonth() + 1}/${start.getDate()}`, start, end };
  });
};

const isInsideBucket = (date, bucket) => date && date >= bucket.start && date < bucket.end;

const getAnalyticsPoints = () => {
  const metric = state.analytics.metric;
  const buckets = buildTimeBuckets(state.analytics.timeScale);
  const activeOrders = state.analytics.orders.filter((order) => order.order_status !== "Cancelled");

  return buckets.map((bucket) => {
    const orders = activeOrders.filter((order) => isInsideBucket(getRowDate(order), bucket));
    const items = state.analytics.orderItems.filter((item) => isInsideBucket(getRowDate(item), bucket));
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const matchingOrders = orders.filter((order) => metricMatchesOrder(order, metric));

    let value = revenue;
    if (metric === "orders") value = orders.length;
    if (metric === "items") value = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    if (metric === "averageOrder") value = orders.length ? revenue / orders.length : 0;
    if (["washFold", "dryCleaning", "washIron", "specialty"].includes(metric)) value = matchingOrders.length;

    return { ...bucket, value };
  });
};

const renderAnalyticsSummary = () => {
  const activeOrders = state.analytics.orders.filter((order) => order.order_status !== "Cancelled");
  const revenue = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const itemCount = state.analytics.orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const average = activeOrders.length ? revenue / activeOrders.length : 0;

  const revenueEl = document.getElementById("adminStatRevenue");
  const ordersEl = document.getElementById("adminStatOrders");
  const itemsEl = document.getElementById("adminStatItems");
  const averageEl = document.getElementById("adminStatAverage");

  if (revenueEl) revenueEl.textContent = formatMoney(revenue);
  if (ordersEl) ordersEl.textContent = formatNumber(activeOrders.length);
  if (itemsEl) itemsEl.textContent = formatNumber(itemCount);
  if (averageEl) averageEl.textContent = formatMoney(average);
};

const drawAnalyticsChart = () => {
  const canvas = document.getElementById("adminStatsChart");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const wrapper = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  if (!ctx || !wrapper) return;

  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(620, Math.floor(wrapper.clientWidth));
  const height = Math.max(360, Math.floor(wrapper.clientHeight || 420));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const points = state.analytics.points;
  const metric = ANALYTICS_METRICS[state.analytics.metric];
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const niceMax = maxValue <= 0 ? 1 : maxValue * 1.16;
  const plot = { left: 70, right: 24, top: 26, bottom: 64 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(15, 79, 150, 0.12)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#58708d";
  ctx.font = "12px Merriweather, Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i += 1) {
    const y = plot.top + plotHeight * (i / 4);
    const value = niceMax * (1 - i / 4);
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(width - plot.right, y);
    ctx.stroke();
    ctx.fillText(metric.unit === "money" ? `$${Math.round(value)}` : Math.round(value), plot.left - 12, y);
  }

  if (!points.length) return;

  const slot = plotWidth / points.length;
  const barWidth = Math.max(18, Math.min(54, slot * 0.58));
  const linePoints = [];

  points.forEach((point, index) => {
    const x = plot.left + slot * index + slot / 2;
    const barHeight = (point.value / niceMax) * plotHeight;
    const y = plot.top + plotHeight - barHeight;
    const isHovered = state.analytics.hoveredIndex === index;

    linePoints.push({ x, y });
    const gradient = ctx.createLinearGradient(0, y, 0, plot.top + plotHeight);
    gradient.addColorStop(0, isHovered ? "#0f4f96" : "#4b86d8");
    gradient.addColorStop(1, isHovered ? "#7aa7e8" : "#cfdffb");
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
  const metricSelect = document.getElementById("adminMetricSelect");
  const timeScaleSelect = document.getElementById("adminTimeScaleSelect");
  const title = document.getElementById("adminChartTitle");
  const subtitle = document.getElementById("adminChartSubtitle");
  const total = document.getElementById("adminChartTotal");
  const metric = ANALYTICS_METRICS[state.analytics.metric] || ANALYTICS_METRICS.revenue;

  state.analytics.points = getAnalyticsPoints();
  const totalValue =
    state.analytics.metric === "averageOrder"
      ? state.analytics.points.reduce((sum, point) => sum + point.value, 0) / Math.max(state.analytics.points.filter((point) => point.value).length, 1)
      : state.analytics.points.reduce((sum, point) => sum + point.value, 0);

  if (metricSelect instanceof HTMLSelectElement) metricSelect.value = state.analytics.metric;
  if (timeScaleSelect instanceof HTMLSelectElement) timeScaleSelect.value = state.analytics.timeScale;
  if (title) title.textContent = `${metric.label} by ${state.analytics.timeScale}`;
  if (subtitle) {
    subtitle.textContent = state.analytics.loaded
      ? `Showing ${metric.summary}. Use the controls to change the x axis or y axis.`
      : "Loading company stats...";
  }
  if (total) total.textContent = `${formatAnalyticsValue(totalValue)} ${state.analytics.metric === "averageOrder" ? "average" : "total"}`;

  document.querySelectorAll("[data-admin-metric]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-admin-metric") === state.analytics.metric);
  });

  renderAnalyticsSummary();
  drawAnalyticsChart();
};

const updateAnalyticsHover = (event) => {
  const canvas = document.getElementById("adminStatsChart");
  const tooltip = document.getElementById("adminChartTooltip");
  if (!(canvas instanceof HTMLCanvasElement) || !(tooltip instanceof HTMLElement) || !state.analytics.points.length) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const plotLeft = 70;
  const plotRight = 24;
  const plotWidth = rect.width - plotLeft - plotRight;
  const slot = plotWidth / state.analytics.points.length;
  const index = Math.max(0, Math.min(state.analytics.points.length - 1, Math.floor((x - plotLeft) / slot)));
  const point = state.analytics.points[index];

  state.analytics.hoveredIndex = index;
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(rect.width - 170, Math.max(12, x + 12))}px`;
  tooltip.style.top = `${Math.max(12, event.clientY - rect.top - 42)}px`;
  tooltip.innerHTML = `<strong>${escapeHtml(point.label)}</strong><span>${escapeHtml(ANALYTICS_METRICS[state.analytics.metric].label)}: ${escapeHtml(formatAnalyticsValue(point.value))}</span>`;
  drawAnalyticsChart();
};

const clearAnalyticsHover = () => {
  const tooltip = document.getElementById("adminChartTooltip");
  state.analytics.hoveredIndex = null;
  if (tooltip instanceof HTMLElement) tooltip.hidden = true;
  drawAnalyticsChart();
};

const loadAnalyticsData = async (supabase, showToast) => {
  const [{ data: orders, error: ordersError }, { data: orderItems, error: itemsError }] = await Promise.all([
    supabase
      .from("orders")
      .select("order_id, service_type, order_status, payment_status, total, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("order_items")
      .select("order_item_id, order_id, item_type, quantity, line_total, created_at")
      .order("created_at", { ascending: false })
      .limit(1000)
  ]);

  if (ordersError || itemsError) {
    const message = ordersError?.message || itemsError?.message || "Could not load company stats.";
    showToast("error", message);
    return;
  }

  state.analytics.orders = orders || [];
  state.analytics.orderItems = orderItems || [];
  state.analytics.loaded = true;
  renderAnalytics();
};

const wireEvents = (supabase, showToast) => {
  const tableSelect = document.getElementById("adminTableSelect");
  const searchColumn = document.getElementById("adminSearchColumn");
  const searchInput = document.getElementById("adminSearchInput");
  const refreshButton = document.getElementById("adminRefreshButton");
  const newButton = document.getElementById("adminNewRecordButton");
  const recordList = document.getElementById("adminRecordList");
  const form = document.getElementById("adminEditorForm");
  const deleteButton = document.getElementById("adminDeleteButton");
  const analyticsRefreshButton = document.getElementById("adminAnalyticsRefreshButton");
  const timeScaleSelect = document.getElementById("adminTimeScaleSelect");
  const metricSelect = document.getElementById("adminMetricSelect");
  const metricButtons = document.getElementById("adminMetricButtons");
  const chartCanvas = document.getElementById("adminStatsChart");

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
    await loadAnalyticsData(supabase, showToast);
    showToast("success", `${getConfig().label} refreshed.`);
  });

  analyticsRefreshButton?.addEventListener("click", async () => {
    await loadAnalyticsData(supabase, showToast);
    showToast("success", "Company stats refreshed.");
  });

  timeScaleSelect?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    state.analytics.timeScale = event.target.value;
    renderAnalytics();
  });

  metricSelect?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    state.analytics.metric = event.target.value;
    renderAnalytics();
  });

  metricButtons?.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-admin-metric]") : null;
    if (!(target instanceof HTMLElement)) return;
    state.analytics.metric = target.getAttribute("data-admin-metric") || state.analytics.metric;
    renderAnalytics();
  });

  chartCanvas?.addEventListener("mousemove", updateAnalyticsHover);
  chartCanvas?.addEventListener("mouseleave", clearAnalyticsHover);
  window.addEventListener("resize", drawAnalyticsChart);

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
