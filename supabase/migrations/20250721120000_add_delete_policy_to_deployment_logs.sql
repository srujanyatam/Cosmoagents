
create policy "Users can delete their own deployment logs"
on "public"."deployment_logs"
as permissive
for delete
to public
using ((auth.uid() = user_id)); 