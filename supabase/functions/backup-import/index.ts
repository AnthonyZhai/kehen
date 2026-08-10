import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("服务配置错误");
    }

    // 验证调用者身份
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "未提供身份验证信息" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "身份验证失败" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 检查调用者是否是 boss 角色
    const { data: callerProfile } = await supabaseAdmin.from("profiles").select("role").eq("id", caller.id).single();
    if (!callerProfile || callerProfile.role !== "boss") {
      return new Response(JSON.stringify({ error: "权限不足，仅管理员可以导入数据" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { backup_data } = await req.json();

    if (!backup_data || typeof backup_data !== 'object') {
      return new Response(JSON.stringify({ error: "无效的备份数据格式" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: Record<string, { success: number, failed: number, errors: string[] }> = {};

    // 注意：为了保证数据一致性，导入顺序很重要
    // 1. 先删除子表数据 (避免 FK 冲突)
    // 2. 再删除父表数据
    // 3. 按依赖关系插入数据

    // 删除顺序 (从子到父)
    const deleteOrder = ['renewal_records', 'class_records', 'students', 'classes', 'profiles', 'public_awards', 'public_courses', 'public_teachers', 'public_site_settings'];

    console.log("Starting data cleanup...");
    for (const table of deleteOrder) {
      if (backup_data[table]) {
        const { error: deleteError } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
        if (deleteError) {
          console.error(`Error deleting from ${table}:`, deleteError);
          // 即使删除失败也尝试继续插入，但记录错误
          results[table] = { success: 0, failed: 0, errors: [`删除旧数据失败: ${deleteError.message}`] };
        } else {
          results[table] = { success: 0, failed: 0, errors: [] };
          console.log(`Deleted all data from ${table}`);
        }
      }
    }

    // 插入顺序 (从父到子)
    const insertOrder = ['profiles', 'classes', 'students', 'renewal_records', 'class_records', 'public_awards', 'public_courses', 'public_teachers', 'public_site_settings'];

    console.log("Starting data import...");
    for (const table of insertOrder) {
      if (backup_data[table] && Array.isArray(backup_data[table])) {
        const rows = backup_data[table];
        if (rows.length === 0) continue;

        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        for (const row of rows) {
          // 移除自动生成的字段，让数据库重新生成
          const { id, created_at, updated_at, ...insertData } = row;

          const { error: insertError } = await supabaseAdmin.from(table).insert(insertData);
          if (insertError) {
            failedCount++;
            if (errors.length < 5) errors.push(`${row.id || JSON.stringify(row).slice(0, 50)}: ${insertError.message}`);
            console.error(`Insert error in ${table}:`, insertError);
          } else {
            successCount++;
          }
        }
        results[table] = { success: successCount, failed: failedCount, errors };
        console.log(`Imported ${table}: ${successCount} success, ${failedCount} failed`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, imported_at: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: `服务器错误: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
