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
      return new Response(
        JSON.stringify({ error: "服务配置错误" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 验证调用者身份
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "未提供身份验证信息" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 通过 JWT 获取调用者用户信息
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "身份验证失败" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 检查调用者是否是 boss 角色
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "boss") {
      return new Response(
        JSON.stringify({ error: "权限不足，仅管理员可以修改教师信息" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { teacherId, fullName, email, password } = await req.json();

    if (!teacherId || !fullName) {
      return new Response(
        JSON.stringify({ error: "缺少必填字段" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password && password.length < 6) {
      return new Response(
        JSON.stringify({ error: "密码长度至少6位" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 更新 Auth 用户的邮箱和密码
    const authUpdates: Record<string, string> = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(teacherId, authUpdates);
      if (authUpdateError) {
        console.error("Auth update error:", authUpdateError);
        return new Response(
          JSON.stringify({ error: `更新账号信息失败: ${authUpdateError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 更新 profiles 表的姓名和邮箱
    const profileUpdates: Record<string, string> = { full_name: fullName };
    if (email) profileUpdates.email = email;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdates)
      .eq("id", teacherId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: `更新失败: ${updateError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "教师信息已更新" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `服务器错误: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
