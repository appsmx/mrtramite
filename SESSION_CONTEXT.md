# SESSION_CONTEXT.md

Proyecto: Mr. Trámite
Metodología: LOGAN v1.0
Estado: `[estado:construcción]` — MVP en producción + Botpress configurado
Avance: Sistema completo en Vercel, Botpress conectado a WhatsApp Business API

## Objetivo completado en esta sesión

Construcción, despliegue y configuración completa del MVP de Mr. Trámite. El sistema está en vivo en https://mrtramite.vercel.app con base de datos Neon PostgreSQL, Cloudinary para documentos, alertas Telegram, y bot de WhatsApp conectado vía Botpress.

## Sistema en producción

| Componente | Estado | URL / Servicio |
|---|---|---|
| Sitio web | ✅ Funcionando | https://mrtramite.vercel.app |
| Base de datos | ✅ Neon PostgreSQL | Connection string en .env |
| Cloudinary | ✅ Configurado | Cloud name: nvjxzuy1 |
| Telegram | ✅ Bot activo | @mr_tramite_bot, Chat ID: 1572031936 |
| Botpress | ✅ Conectado a WhatsApp | OAuth Connection, Phone Number ID: 1300688526450924 |
| WhatsApp negocio | ✅ 6642342946 | Configurado en Meta for Developers |
| GitHub repo | ✅ appsmx/mrtramite | Documentación + código fuente |
| LOGAN repo | ✅ appsmx/logan | Metodología (público) |

## Credenciales

- **Admin:** mrtramitemx@gmail.com / tramitE1.
- **WhatsApp negocio:** 6642342946
- **Banco:** HSBC, Julian Rangel Quiñonez, Cuenta 6620535019, CLABE 021028066205350194

## Configuración de Botpress

- Bot creado en Botpress Cloud
- Knowledge Base configurado con información de Mr. Trámite
- Flujo de conversación manual (no AutonomousNode):
  - Bienvenida → Capturar nombre → Teléfono → Email → CURP → Confirmar → Execute Code (axios POST al webhook) → Mensaje final con folio
- Webhook endpoint: https://mrtramite.vercel.app/api/webhook-botpress
- Integración WhatsApp: OAuth Connection activa
- Meta for Developers: App "Mr. Trámite" con WhatsApp Business API
- Phone Number ID: 1300688526450924
- WABA ID: 2240282463392422

## Pendientes

1. **Publicar el bot en Botpress** — hacer click en "Publish"
2. **Verificar número de prueba de Meta** — probar enviando WhatsApp
3. **Verificación de negocio en Meta** — necesaria para producción sin restricciones (1-3 días)
4. **Dominio personalizado** — comprar .mx o .com y conectar a Vercel
5. **Emails reales con Resend** — actualmente simulados
6. **Mercado Pago real** — actualmente transferencia manual

## Documentos actualizados

- `Biblia_MrTramite.md` v0.8 — 17 decisiones, MVP completo
- `DS-160_campos.md` v1.1 — catálogo de campos
- `schema/schema.prisma` — PostgreSQL (Neon)
- `SESSION_CONTEXT.md` — este documento
- `README.md` — documentación-only repo

## Riesgos identificados

- **Password de admin:** `tramitE1.` es desarrollo. Cambiar antes de marketing.
- **Access Token de Meta:** temporal (24h). Necesita token permanente.
- **Número de prueba de Meta:** solo permite mensajes a números registrados como testers.
- **LOGAN repo público:** cualquiera puede leerlo. Considerar hacerlo privado.

## Observaciones

- El código fuente vive en el repo appsmx/mrtramite (no solo documentación)
- Vercel redeploy automático con cada push a GitHub
- Variables de entorno en Vercel: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, CLOUDINARY_*, TELEGRAM_*
- El footer de la landing dice "Powered by LOGAN" con link al repo
- El número de WhatsApp cambió de personal a negocio: 6642342946
