import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify caller is a teacher
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const callerId = claimsData.claims.sub;

    // Check teacher role
    const { data: roleCheck } = await anonClient.rpc("has_role", {
      _user_id: callerId,
      _role: "teacher",
    });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { student_ids } = await req.json();
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return new Response(JSON.stringify({ error: "student_ids required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Service role client for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clean up related data (no FK cascades from auth.users)
    const tables = [
      { table: "submission_answers", via: "submission_id", subquery: true },
      { table: "assessment_answers", via: "submission_id", subquery: true },
      { table: "quiz_submissions", column: "student_id" },
      { table: "assessment_submissions", column: "student_id" },
      { table: "assessment_student_assignments", column: "student_id" },
      { table: "assignment_submissions", column: "student_id" },
      { table: "attendance", column: "student_id" },
      { table: "lesson_completions", column: "student_id" },
      { table: "student_notes", column: "student_id" },
      { table: "manual_grades", column: "student_id" },
      { table: "notifications", column: "user_id" },
      { table: "stream_comments", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "profiles", column: "id" },
    ];

    // Delete submission_answers linked to quiz_submissions of these students
    await adminClient
      .from("submission_answers")
      .delete()
      .in(
        "submission_id",
        (
          await adminClient
            .from("quiz_submissions")
            .select("id")
            .in("student_id", student_ids)
        ).data?.map((r: any) => r.id) || []
      );

    // Delete assessment_answers linked to assessment_submissions of these students
    await adminClient
      .from("assessment_answers")
      .delete()
      .in(
        "submission_id",
        (
          await adminClient
            .from("assessment_submissions")
            .select("id")
            .in("student_id", student_ids)
        ).data?.map((r: any) => r.id) || []
      );

    // Delete from direct-column tables
    for (const t of tables) {
      if ("subquery" in t) continue; // already handled above
      await adminClient.from(t.table).delete().in(t.column!, student_ids);
    }

    // Delete auth users
    const errors: string[] = [];
    for (const id of student_ids) {
      const { error } = await adminClient.auth.admin.deleteUser(id);
      if (error) errors.push(`${id}: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        deleted: student_ids.length - errors.length,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
