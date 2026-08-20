create extension if not exists pgcrypto;

create table if not exists public.expedientes (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  access_token_hash text not null unique,
  servicio text not null check (servicio in ('Express', 'Visita profesional')),
  estado text not null default 'borrador' check (estado in ('borrador', 'pendiente_pago', 'pagado', 'validacion_documental', 'analisis', 'informe_generado', 'entregado', 'visita_pendiente', 'cancelado')),
  finalidad text not null,
  tipo_inmueble text not null,
  direccion text not null,
  comuna text not null,
  superficie_m2 integer not null check (superficie_m2 > 0),
  nombre text not null,
  correo text not null,
  telefono text not null,
  porcentaje_documentos integer not null default 0 check (porcentaje_documentos between 0 and 100),
  mercado_pago_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  tipo text not null check (tipo in ('propiedad', 'superficie', 'fotos')),
  nombre_original text not null,
  ruta_storage text not null unique,
  content_type text not null,
  tamano_bytes bigint not null check (tamano_bytes > 0 and tamano_bytes <= 15728640),
  estado text not null default 'pendiente_carga' check (estado in ('pendiente_carga', 'recibido', 'validado', 'rechazado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expediente_id, tipo)
);

create table if not exists public.eventos_expediente (
  id bigint generated always as identity primary key,
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  tipo text not null,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists expedientes_estado_idx on public.expedientes (estado, created_at desc);
create index if not exists expedientes_correo_idx on public.expedientes (lower(correo));
create index if not exists documentos_expediente_idx on public.documentos (expediente_id, estado);
create index if not exists eventos_expediente_idx on public.eventos_expediente (expediente_id, created_at desc);

alter table public.expedientes enable row level security;
alter table public.documentos enable row level security;
alter table public.eventos_expediente enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tasago-antecedentes', 'tasago-antecedentes', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- No se crean políticas públicas: las operaciones pasan por el servidor de TasaGo
-- y las cargas usan enlaces firmados de corta duración.
