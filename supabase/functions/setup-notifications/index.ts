import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create notifications table
    const createTableSQL = `
      -- Create notifications table if not exists
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

      -- Enable RLS
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
      DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
      DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

      -- Create policies
      CREATE POLICY "Users can view own notifications"
        ON notifications FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can update own notifications"
        ON notifications FOR UPDATE
        USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete own notifications"
        ON notifications FOR DELETE
        USING (auth.uid() = user_id);

      CREATE POLICY "System can insert notifications"
        ON notifications FOR INSERT
        WITH CHECK (true);

      -- Enable realtime
      ALTER TABLE notifications REPLICA IDENTITY FULL;
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError && !tableError.message.includes('does not exist')) {
      console.error("Error creating table:", tableError);
    }

    // Add table to realtime publication
    const { error: realtimeError } = await supabase.rpc('exec_sql', {
      sql: "ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;"
    });

    if (realtimeError && !realtimeError.message.includes('does not exist')) {
      console.error("Error setting up realtime:", realtimeError);
    }

    // Create trigger function
    const createTriggerSQL = `
      -- Drop existing function and trigger if they exist
      DROP TRIGGER IF EXISTS on_course_created ON courses;
      DROP FUNCTION IF EXISTS notify_students_new_course();

      -- Create function
      CREATE OR REPLACE FUNCTION notify_students_new_course()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO notifications (user_id, title, message, type, course_id)
        SELECT 
          id,
          '🎓 Nuevo curso disponible',
          'El curso "' || NEW.name || '" ya está disponible. ¡Inscríbete ahora!',
          'success',
          NEW.id
        FROM profiles
        WHERE role = 'student';
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger
      CREATE TRIGGER on_course_created
        AFTER INSERT ON courses
        FOR EACH ROW
        EXECUTE FUNCTION notify_students_new_course();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL });
    
    if (triggerError && !triggerError.message.includes('does not exist')) {
      console.error("Error creating trigger:", triggerError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Sistema de notificaciones configurado correctamente"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en setup-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
