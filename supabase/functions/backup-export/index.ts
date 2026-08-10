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
      return new Response(JSON.stringify({ error: "权限不足，仅管理员可以导出数据" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 按照依赖顺序导出数据（父表先于子表）
    const exportData: Record<string, any[]> = {};

    // 导出 profiles (不包含密码等敏感信息，但此处为了完整性全量导出)
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    exportData['profiles'] = profiles || [];

    // 导出 classes (父表)
    const { data: classes } = await supabaseAdmin.from('classes').select('*');
    exportData['classes'] = classes || [];

    // 导出 students (依赖 classes/profiles)
    const { data: students } = await supabaseAdmin.from('students').select('*');
    exportData['students'] = students || [];

    // 导出 renewal_records (依赖 students/profiles)
    const { data: renewal_records } = await supabaseAdmin.from('renewal_records').select('*');
    exportData['renewal_records'] = renewal_records || [];

    // 导出 class_records (依赖 students/profiles)
    const { data: class_records } = await supabaseAdmin.from('class_records').select('*');
    exportData['class_records'] = class_records || [];

    // 导出公开数据表
    const { data: public_awards } = await supabaseAdmin.from('public_awards').select('*');
    exportData['public_awards'] = public_awards || [];

    const { data: public_courses } = await supabaseAdmin.from('public_courses').select('*');
    exportData['public_courses'] = public_courses || [];

    const { data: public_teachers } = await supabaseAdmin.from('public_teachers').select('*');
    exportData['public_teachers'] = public_teachers || [];

    const { data: public_site_settings } = await supabaseAdmin.from('public_site_settings').select('*');
    exportData['public_site_settings'] = public_site_settings || [];

    const exportTime = new Date().toISOString();

    return new Response(
      JSON.stringify({ success: true, data: exportData, exported_at: exportTime }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: `服务器错误: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
