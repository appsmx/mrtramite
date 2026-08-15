// Endpoint temporal para actualizar la visión del bot en la DB de LOGAN OS.
// POST /api/admin/update-bot-vision
// Usa Neon serverless HTTP API directamente (sin driver, solo fetch).
// Se elimina después de usarse.

import { NextResponse } from 'next/server'

const PROJECT_ID = 'cmsmfx4670000jr04lzzy1znm'

// Neon connection info (from the pooler connection string)
const NEON_HOST = 'ep-small-morning-avu016o1-pooler.c-11.us-east-1.aws.neon.tech'
const NEON_USER = 'neondb_owner'
const NEON_PASS = 'npg_tTpqg54HYBZm'
const NEON_DB = 'neondb'

const VISION = `Mr. Tramite es una gestoria profesional de tramites en Mexico. Nuestro modelo: el cliente NO paga hasta tener su cita confirmada. Atendemos por web (mrtramite.mx), WhatsApp (526642342946) y Messenger.

CONTACTO:
- Web: https://mrtramite.mx
- WhatsApp: https://wa.me/526642342946
- Email: contacto@mrtramite.mx
- Chat de la pagina web: este mismo chat

IMPORTANTE: Cuando el cliente escriba por este chat, NO decir "sigue escribiendo por WhatsApp". Ya estamos en el chat de la pagina. Si necesita atencion humana, decir: "Un asesor te contactara a la brevedad. Si prefieres, tambien puedes escribirnos por WhatsApp al 664-234-2946."

TRAMITE 1: VISA AMERICANA B1/B2 (LASER)
Solo para mexicanos.
Precio: $800 MXN (se paga DESPUES de confirmar la cita consular).
Incluye: llenado completo del DS-160 + creacion de cita consular.
Requisito obligatorio: tener PASAPORTE MEXICANO VIGENTE (minimo 6 meses de vigencia).

DOCUMENTOS E INFORMACION NECESARIA (para el formulario DS-160):

DOCUMENTOS PERSONALES:
1. Pasaporte vigente
2. Numero de telefono
3. Correo electronico
4. Redes sociales (ultimos 5 anos)
5. Acta de nacimiento
6. Domicilio completo
7. Estado civil

FAMILIA:
a. Nombre de esposo/a y fecha de nacimiento
b. Nombre de hijos y fecha de nacimiento
8. Nombre, domicilio y fecha de nacimiento de padres
9. Nombre de familiares directos en Estados Unidos
10. Nombre de familiares indirectos en Estados Unidos

INFORMACION LABORAL:
a. Nombre de la empresa
b. Numero de telefono de la empresa
c. Fecha de ingreso
d. Ingreso mensual
e. Descripcion de actividades o funciones

INFORMACION ACADEMICA:
a. Nombre de la escuela
b. Fecha de ingreso y fecha de terminacion de estudios
c. Domicilio de la escuela
d. Numero de telefono de la escuela

INFORMACION ADICIONAL:
a. Paises que has visitado en los ultimos 5 anos
b. Has tenido visa anteriormente?
c. Te han negado tu visa? Motivo

NOTA IMPORTANTE: Estos son los requisitos principales para el llenado del DS-160. Sin embargo, existe informacion secundaria que es MUY importante y puede AUMENTAR las probabilidades de que aprueben la visa. Mr. Tramite te asesora sobre que informacion adicional conviene presentar segun tu perfil.

El cliente puede proporcionar esta informacion de dos formas:
1. Llenando el formulario en la pagina web (mrtramite.mx, boton Iniciar tramite)
2. Enviando la informacion por WhatsApp (526642342946)

Tambien puede realizar el pago por transferencia bancaria si lo prefiere.

TRAMITE 2: PASAPORTE MEXICANO
Precio: Por definir (proximamente).
Incluye: agendamiento de cita + asesoria de requisitos.

DOCUMENTOS NECESARIOS:
1. CURP certificada
2. Copia de acta de nacimiento
3. Identificacion oficial vigente (INE o licencia)

TRAMITE 3: CITA INE
Precio: Por definir (proximamente).
Incluye: agendamiento de cita.

DOCUMENTOS NECESARIOS:
1. Acta de nacimiento
2. Comprobante de domicilio (no mayor a 3 meses)
3. Identificacion oficial vigente

POLITICAS:
- NO se cobra nada por adelantado. Solo pagas al confirmar la cita.
- Si no pagas despues de confirmar: la cita se cancela, sin cargo.
- Si tus documentos tienen errores despues de pagar: $300 MXN por nueva cita.
- Si la cita se cancela por causa externa (consulado): 50% del costo por nueva gestion.
- No hay reembolso una vez ejecutado el tramite.

TONO Y PERSONALIDAD DEL BOT:
- Hablar como un asesor amigable y profesional.
- Usar emojis moderadamente (1-2 por mensaje).
- Siempre mencionar que no pagas hasta tener tu cita confirmada cuando sea relevante.
- Si no puedes resolver algo, ofrecer contacto con un asesor humano.
- NUNCA inventar informacion que no este aqui.
- Ser conciso: respuestas de 2-4 parrafos maximo.`

export async function POST() {
  try {
    // Use Neon's serverless HTTP query API
    // Format: https://[project-host]/sql with basic auth
    const authHeader = 'Basic ' + Buffer.from(`${NEON_USER}:${NEON_PASS}`).toString('base64')

    // First, let's try to list tables to find the correct name
    const listTablesRes = await fetch(`https://${NEON_HOST}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Neon-Database': NEON_DB,
        'Neon-Pool-Opt-In': 'true',
      },
      body: JSON.stringify({
        query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
        params: [],
      }),
    })

    if (!listTablesRes.ok) {
      const errText = await listTablesRes.text()
      return NextResponse.json({ error: 'Failed to list tables', status: listTablesRes.status, details: errText }, { status: 500 })
    }

    const tablesData = await listTablesRes.json()

    // Now try the update with the correct table name
    const updateRes = await fetch(`https://${NEON_HOST}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Neon-Database': NEON_DB,
        'Neon-Pool-Opt-In': 'true',
      },
      body: JSON.stringify({
        query: `UPDATE "Project" SET "vision" = $1, "updatedAt" = NOW() WHERE "id" = $2 RETURNING "name", LENGTH("vision") as vision_len`,
        params: [VISION, PROJECT_ID],
      }),
    })

    if (!updateRes.ok) {
      const errText = await updateRes.text()
      // If Project doesn't work, try lowercase
      const update2Res = await fetch(`https://${NEON_HOST}/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'Neon-Database': NEON_DB,
          'Neon-Pool-Opt-In': 'true',
        },
        body: JSON.stringify({
          query: `UPDATE project SET vision = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING name, LENGTH(vision) as vision_len`,
          params: [VISION, PROJECT_ID],
        }),
      })

      if (!update2Res.ok) {
        const err2Text = await update2Res.text()
        return NextResponse.json({ 
          error: 'Both queries failed', 
          tables: tablesData,
          attempt1: errText, 
          attempt2: err2Text 
        }, { status: 500 })
      }

      const data2 = await update2Res.json()
      return NextResponse.json({ ok: true, result: data2, tables: tablesData })
    }

    const data = await updateRes.json()
    return NextResponse.json({ ok: true, result: data, tables: tablesData })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
