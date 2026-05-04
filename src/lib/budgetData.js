import { supabase } from "@/lib/supabase";

async function currentUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Supabase session error:", error);
    throw error;
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to continue.");
  }

  return userId;
}

function logAndThrow(label, error) {
  if (error) {
    console.error(label, error);
    throw error;
  }
}

export async function listRows(table, { orderBy = "created_at", ascending = false, filters = {} } = {}) {
  const userId = await currentUserId();
  let query = supabase.from(table).select("*").eq("user_id", userId);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  const { data, error } = await query;
  logAndThrow(`Supabase ${table} list error:`, error);
  return data || [];
}

export async function createRow(table, values) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from(table)
    .insert({ ...values, user_id: userId })
    .select()
    .single();

  logAndThrow(`Supabase ${table} create error:`, error);
  return data;
}

export async function createRows(table, rows) {
  const userId = await currentUserId();
  const payload = rows.map((row) => ({ ...row, user_id: userId }));
  const { data, error } = await supabase.from(table).insert(payload).select();

  logAndThrow(`Supabase ${table} bulk create error:`, error);
  return data || [];
}

export async function updateRow(table, id, values) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  logAndThrow(`Supabase ${table} update error:`, error);
  return data;
}

export async function deleteRow(table, id) {
  const userId = await currentUserId();
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);

  logAndThrow(`Supabase ${table} delete error:`, error);
}

export const accountsApi = {
  list: () => listRows("accounts", { orderBy: "name", ascending: true }),
  create: (values) => createRow("accounts", values),
  update: (id, values) => updateRow("accounts", id, values),
  delete: (id) => deleteRow("accounts", id),
};

export const categoriesApi = {
  list: () => listRows("categories", { orderBy: "name", ascending: true }),
  create: (values) => createRow("categories", values),
  bulkCreate: (rows) => createRows("categories", rows),
  update: (id, values) => updateRow("categories", id, values),
  delete: (id) => deleteRow("categories", id),
};

export const transactionsApi = {
  list: () => listRows("transactions", { orderBy: "date", ascending: false }),
  create: (values) => createRow("transactions", values),
  update: (id, values) => updateRow("transactions", id, values),
  delete: (id) => deleteRow("transactions", id),
};

export const budgetPlansApi = {
  list: (month) => listRows("budget_plans", { orderBy: "category_id", ascending: true, filters: { month } }),
  upsert: async ({ id, category_id, month, planned_amount }) => {
    if (id) {
      return updateRow("budget_plans", id, { planned_amount });
    }
    return createRow("budget_plans", { category_id, month, planned_amount });
  },
};

export async function getUserSettings() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  logAndThrow("Supabase user_settings load error:", error);
  return data;
}

export async function saveUserSettings(settings) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ ...settings, user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();

  logAndThrow("Supabase user_settings save error:", error);
  return data;
}
