# TasaGo: base productiva

## Decisión

La primera etapa productiva usa la aplicación Next.js ya aprobada en Vercel y agrega Supabase como servicio administrado para PostgreSQL y almacenamiento privado. La experiencia visual no se reemplaza.

## Flujo del expediente

1. El cliente completa los datos guiados.
2. El servidor valida los datos y crea un folio aleatorio no predecible.
3. El cliente conserva una credencial privada de recuperación; en la base solo se guarda su hash.
4. Cada antecedente recibe una autorización temporal de carga.
5. El archivo se almacena en un bucket privado y su metadata queda asociada al expediente.
6. Al volver desde el mismo dispositivo, la aplicación recupera el expediente y los antecedentes recibidos.

## Pipeline operativo

`borrador → pendiente_pago → pagado → validacion_documental → analisis → informe_generado → entregado`

La modalidad con visita puede usar `visita_pendiente` antes del análisis. `cancelado` cierra una solicitud sin eliminar la trazabilidad.

## Seguridad aplicada

- La clave secreta de Supabase solo existe en el servidor.
- Los antecedentes no tienen enlaces públicos.
- Los tokens de acceso se guardan cifrados mediante hash SHA-256.
- El servidor valida campos, formato de archivo y máximo de 15 MB.
- La base bloquea el acceso anónimo mediante Row Level Security sin políticas públicas.
- Los archivos aceptados son PDF, JPG, PNG y HEIC.

## Validación completada

- Proyecto `tasago-validacion` creado en la organización TasaGo Chile.
- Migraciones de estructura y permisos mínimos aplicadas correctamente.
- RLS confirmado en expedientes, documentos y eventos.
- Bucket privado confirmado.
- Creación, folio, carga 33/67/100 %, recuperación tras recarga y PDF demo comprobados con datos ficticios.

## Configuración pendiente para producción

1. Configurar en Vercel las cuatro variables descritas en `.env.example`.
2. Repetir la prueba integral en la URL de preview del Pull Request.
3. Conectar Mercado Pago mediante preferencia creada en servidor y webhook verificado.
4. Incorporar acceso por enlace seguro enviado al correo.

## Alcance siguiente

- Acceso por enlace seguro enviado al correo, en vez de depender del dispositivo.
- Mercado Pago real, idempotencia y conciliación.
- Panel administrador con roles y auditoría.
- Cola de OCR, extracción de datos y control humano.
- Generación del informe PDF con folio, metodología y firma simple.
