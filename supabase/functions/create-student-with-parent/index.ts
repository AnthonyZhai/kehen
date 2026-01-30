import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "服务配置错误" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "无效的请求数据" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      studentName, 
      className, 
      subject, 
      totalHours, 
      remainingHours,
      parentName,
      parentEmail,
      parentPassword 
    } = body;

    console.log("Received request:", { studentName, parentName, parentEmail });

    // 验证必填字段
    if (!studentName || !parentName || !parentEmail || !parentPassword) {
      return new Response(
        JSON.stringify({ error: "缺少必填字段：学生姓名、家长姓名、邮箱和密码" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (parentPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "密码长度至少6位" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parentId = null;
    let isExistingParent = false;

    // 检查家长账号是否已存在
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', parentEmail)
      .maybeSingle();

    if (existingProfile) {
      parentId = existingProfile.id;
      isExistingParent = true;
      console.log("Found existing parent:", parentId);
    } else {
      // 创建家长账号
      console.log("Creating new parent account...");
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: parentEmail,
        password: parentPassword,
        email_confirm: true,
        user_metadata: {
          full_name: parentName,
          role: 'parent'
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: `创建家长账号失败: ${authError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      parentId = authData.user.id;
      console.log("Created parent:", parentId);
    }

    // 创建学生记录
    console.log("Creating student...");
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        name: studentName,
        class_name: className || '',
        subject: subject || '',
        total_hours: totalHours || 0,
        remaining_hours: remainingHours !== undefined && remainingHours !== '' ? remainingHours : (totalHours || 0),
        parent_id: parentId,
        alert_threshold: 2,
        status: 'active'
      })
      .select()
      .single();

    if (studentError) {
      console.error("Student error:", studentError);
      return new Response(
        JSON.stringify({ error: `创建学生失败: ${studentError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Success! Student created:", student.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        student,
        parentId,
        message: isExistingParent ? '学生已创建（家长账号已存在）' : '学生和家长账号已创建'
      }),
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
