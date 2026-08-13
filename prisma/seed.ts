// Seed inicial para Mr. Trámite
// Crea: módulo Visa activo, usuario admin, y valida que las relaciones funcionen.

import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Iniciando seed...')

  // 1. Crear módulo Visa (DEC-010)
  const visa = await db.tramiteTipo.upsert({
    where: { codigo: 'VISA' },
    update: {},
    create: {
      codigo: 'VISA',
      nombre: 'Visa Americana de turista',
      descripcion: 'Visa de turista B1/B2 para EE.UU. Incluye DS-160 + cita consular.',
      precio: 800,
      activo: true,
      prerequisito: 'pasaporte_vigente',
      version: '1.1',
      configJson: JSON.stringify({
        catalogoDs160: 'DS-160_campos.md v1.1',
        categorias: 13,
        documentosRequeridos: ['PASAPORTE', 'ACTA_NACIMIENTO', 'FOTO_PASAPORTE'],
        documentosOpcionales: ['COMPROBANTE_DOMICILIO', 'RECIBOS_INGRESOS'],
        documentosCondicionales: {
          ACTA_MATRIMONIO: 'estado_civil_casado',
        },
      }),
    },
  })
  console.log('✓ Módulo Visa creado:', visa.codigo, '— $' + visa.precio)

  // Crear otros módulos inactivos (DEC-010 — preparados para fase 2)
  for (const codigo of ['PASAP', 'INE', 'LIC', 'CURP']) {
    await db.tramiteTipo.upsert({
      where: { codigo },
      update: {},
      create: {
        codigo,
        nombre: `Trámite ${codigo} (pendiente de configurar)`,
        precio: 0,
        activo: false,
        configJson: '{}',
      },
    })
  }
  console.log('✓ 4 módulos adicionales creados (inactivos)')

  // 2. Crear usuario admin (DEC-013)
  // Nota: en producción se debe hashear el password. Aquí es solo para seed.
  const admin = await db.usuario.upsert({
    where: { email: 'admin@mrtramite.mx' },
    update: {},
    create: {
      email: 'admin@mrtramite.mx',
      passwordHash: 'CHANGE_ME_IN_PRODUCTION',
      nombre: 'Mr. Trámite (Admin)',
      rol: 'ADMIN',
    },
  })
  console.log('✓ Usuario admin creado:', admin.email, '(' + admin.rol + ')')

  // 3. Crear un cliente de prueba + expediente para validar relaciones
  const cliente = await db.cliente.create({
    data: {
      nombreCompleto: 'Juan Pérez García (seed)',
      curp: 'PEJJ900101HDFXXX01',
      email: 'juan@example.com',
      telefono: '5512345678',
      canalPreferido: 'WHATSAPP',
      canalLlegada: 'WEB',
    },
  })
  console.log('✓ Cliente de prueba creado:', cliente.nombreCompleto)

  const expediente = await db.expediente.create({
    data: {
      folio: 'MRT-2026-SEED-001',
      clienteId: cliente.id,
      tramiteTipoId: visa.id,
      estado: 'NUEVO',
      ds160Data: JSON.stringify({ categoriasCompletadas: 0, enProgreso: true }),
    },
  })
  console.log('✓ Expediente de prueba creado:', expediente.folio, '(' + expediente.estado + ')')

  // 4. Crear una acción de auditoría (DEC-011)
  const accion = await db.accion.create({
    data: {
      expedienteId: expediente.id,
      codigo: 'SYSTEM-INIT',
      descripcion: 'Expediente creado vía seed',
      ejecutadoPorId: admin.id,
      estadoPrevio: 'NUEVO',
      estadoNuevo: 'NUEVO',
      metadataJson: JSON.stringify({ origen: 'seed', timestamp: new Date().toISOString() }),
    },
  })
  console.log('✓ Acción de auditoría creada:', accion.codigo)

  // Resumen
  const counts = {
    usuarios: await db.usuario.count(),
    clientes: await db.cliente.count(),
    tramiteTipos: await db.tramiteTipo.count(),
    expedientes: await db.expediente.count(),
    acciones: await db.accion.count(),
  }
  console.log('\n📊 Resumen final:')
  console.log('  Usuarios:', counts.usuarios)
  console.log('  Clientes:', counts.clientes)
  console.log('  TramiteTipos:', counts.tramiteTipos)
  console.log('  Expedientes:', counts.expedientes)
  console.log('  Acciones:', counts.acciones)
  console.log('\n✅ Seed completado.')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
