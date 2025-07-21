
-- Create a table for deployment logs
create table "public"."deployment_logs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid,
    "status" text,
    "lines_of_sql" integer,
    "file_count" integer,
    "error_message" text
);

alter table "public"."deployment_logs" enable row level security;

-- Create policy that allows users to view their own deployment logs
create policy "Users can view their own deployment logs"
on "public"."deployment_logs"
as permissive
for select
to public
using ((auth.uid() = user_id));

-- Create policy that allows users to insert their own deployment logs
create policy "Users can insert their own deployment logs"
on "public"."deployment_logs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));

-- Enable realtime for automatic updates
ALTER TABLE public.deployment_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_logs;
