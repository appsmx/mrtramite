# SESSION_CONTEXT.md

Proyecto: Mr. Trámite
Metodología: LOGAN v1.0
Estado: `[estado:construcción]` — MVP en producción + dominio propio configurado
Avance: Sistema completo, dominio mrtramite.mx adquirido en Cloudflare

## Objetivo completado en esta sesión

Adquisición del dominio `mrtramite.mx` en Cloudflare + configuración de Email Routing + actualización del código para usar el dominio propio.

## Sistema en producción

| Componente | Estado | URL / Servicio |
|---|---|---|
| Sitio web | ✅ Funcionando | https://mrtramite.mx |
| Dominio | ✅ mrtramite.mx en Cloudflare | DNS + Email Routing |
| Base de datos | ✅ Neon PostgreSQL | Connection string en .env |
| Cloudinary | ✅ Configurado | Cloud name: nvjxzuy1 |
| Telegram | ✅ Bot activo | @mr_tramite_bot, Chat ID: 1572031936 |
| Email | ✅ contacto@mrtramite.mx | Cloudflare Email Routing → mrtramitemx@gmail.com |
| GitHub repo | ✅ appsmx/mrtramite | Documentación + código fuente |
| LOGAN repo | ✅ appsmx/logan | Metodología (público) |
| Chat widget | ✅ LOGAN OS | logancorp.vercel.app/api/assistant/chat |

## Credenciales

- **Admin:** mrtramitemx@gmail.com / (cambiar desde Ajustes)
- **WhatsApp negocio:** 6642342946
- **Email corporativo:** contacto@mrtramite.mx → reenvía a mrtramitemx@gmail.com
- **Dominio:** mrtramite.mx (Cloudflare, registrado 2026-08-15)

## Decisiones activas (DEC-001 a DEC-021)

Las 21 decisiones documentadas en Biblia_MrTramite.md v0.8 están reflejadas en código y producción.

## Pendientes

1. **Conectar dominio en Vercel** — agregar mrtramite.mx en Project Settings → Domains
2. **Actualizar NEXTAUTH_URL en Vercel** — cambiar a https://mrtramite.mx
3. **Mercado Pago real** — configurar MERCADO_PAGO_ACCESS_TOKEN cuando lleguen credenciales
4. **Verificación de negocio en Meta** — para WhatsApp sin restricciones
5. **Emails reales con Resend** — configurar RESEND_API_KEY + verificar dominio en Resend
6. **Google Workspace** — cuando se necesite inbox corporativo completo (fase 2)

## Documentos actualizados

- `Biblia_MrTramite.md` v0.8 — 21 decisiones, MVP completo
- `DS-160_campos.md` v1.1 — catálogo de campos
- `schema/schema.prisma` — PostgreSQL (Neon)
- `SESSION_CONTEXT.md` — este documento
- `README.md` — URL producción: https://mrtramite.mx

## Próximo objetivo

1. Configurar DNS de Cloudflare → Vercel (A record + CNAME)
2. Agregar dominio en Vercel dashboard
3. Cuando lleguen credenciales de MP → integrar pagos reales
4. Verificar dominio en Resend para emails desde @mrtramite.mx

## Observaciones

- El código fuente vive en el repo appsmx/mrtramite
- Vercel redeploy automático con cada push a GitHub
- Variables de entorno en Vercel: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, CLOUDINARY_*, TELEGRAM_*, MERCADO_PAGO_*
- Email Routing de Cloudflare es gratuito y suficiente para el MVP
- Para enviar emails "como" contacto@mrtramite.mx desde Gmail, configurar SMTP relay (paso posterior)

---
*Generado por: PCS (LOGAN §10)*
*Fecha: 2026-08-15*
*Versión: v1.2 — Dominio propio adquirido*
*URL: https://mrtramite.mx*
