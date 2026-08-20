grant usage on schema public to service_role;

grant select, insert, update, delete
on table public.expedientes
to service_role;

grant select, insert, update, delete
on table public.documentos
to service_role;

grant select, insert
on table public.eventos_expediente
to service_role;

grant usage, select
on sequence public.eventos_expediente_id_seq
to service_role;

-- No se conceden privilegios a anon ni authenticated. El acceso público
-- permanece bloqueado y todas las operaciones pasan por el servidor TasaGo.
