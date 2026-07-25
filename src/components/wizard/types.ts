// Tipos del wizard de solicitud de trámite
// Basados en DS-160_campos.md v1.1 (DEC-015) y Biblia v0.6 DEC-014

export type CanalContacto = 'WHATSAPP' | 'MESSENGER' | 'EMAIL' | 'INSTAGRAM' | 'OTRO'
export type Sexo = 'MASCULINO' | 'FEMENINO' | 'OTRO'
export type EstadoCivil = 'SOLTERO' | 'CASADO' | 'VIUDO' | 'DIVORCIADO' | 'UNION_LIBRE'
export type SituacionLaboral = 'EMPLEADO' | 'INDEPENDIENTE' | 'ESTUDIANTE' | 'DESEMPLEADO' | 'JUBILADO'

export interface RedSocial {
  id: string
  plataforma: string
  usuario: string
}

export interface Hijo {
  id: string
  nombre: string
  fechaNacimiento: string
  viveEnUS: boolean
}

export interface FamiliarEEUU {
  id: string
  nombre: string
  parentesco: string
  estatusMigratorio: string
}

export interface PaisVisitado {
  id: string
  pais: string
  fecha: string
  duracionDias: string
}

export interface NivelAcademico {
  id: string
  nivel: 'SECUNDARIA' | 'PREPARATORIA' | 'UNIVERSIDAD' | 'OTRO'
  estudio: boolean
  nombreEscuela: string
  fechaIngreso: string
  fechaTerminacion: string
  domicilio: string
  telefono: string
}

export interface DocumentoSubido {
  id: string
  tipo: string
  fileName: string
  fileSize: number
  // En MVP, almacenamos como base64 en localStorage (limitado).
  // En producción, esto se sube a storage (Cloudinary/S3).
  dataUrl?: string
}

export interface WizardData {
  // Paso 1: Selección
  tramiteCodigo: string

  // Paso 2: Prerequisitos
  tienePasaporteVigente: boolean | null

  // Paso 3: Datos personales (sin pasaporte - DEC-017)
  nombreCompleto: string
  otrosNombres: string
  sexo: Sexo | ''
  fechaNacimiento: string
  lugarNacimiento: string
  paisNacimiento: string
  nacionalidad: string
  curp: string
  telefono: string
  email: string
  redesSociales: RedSocial[]

  // Paso 4: Domicilio + estado civil + padres
  // Domicilio
  calle: string
  colonia: string
  ciudad: string
  estadoMexico: string
  codigoPostal: string
  // Estado civil
  estadoCivil: EstadoCivil | ''
  // Cónyuge
  nombreConyuge: string
  fechaNacConyuge: string
  conyugeViveUS: boolean | null
  // Hijos
  hijos: Hijo[]
  // Padres
  nombrePadre: string
  fechaNacPadre: string
  padreViveUS: boolean | null
  nombreMadre: string
  fechaNacMadre: string
  madreViveUS: boolean | null

  // Paso 5: Familiares en EE.UU.
  tieneFamiliaresDirectosUS: boolean | null
  familiaresDirectos: FamiliarEEUU[]
  tieneOtrosParientesUS: boolean | null
  otrosParientes: FamiliarEEUU[]

  // Paso 6: Laboral
  situacionLaboral: SituacionLaboral | ''
  nombreEmpresa: string
  telefonoEmpresa: string
  fechaIngresoEmpresa: string
  direccionEmpresa: string
  ingresoMensual: string
  descripcionActividades: string

  // Paso 7: Académica
  nivelesAcademicos: NivelAcademico[]

  // Paso 8: Viajes y visas previas
  haVisitadoOtrosPaises: boolean | null
  paisesVisitados: PaisVisitado[]
  haTenidoVisaAnterior: boolean | null
  tipoVisaAnterior: string
  numeroVisaAnterior: string
  fechaEmisionVisaAnterior: string
  fechaExpiracionVisaAnterior: string
  visaCanceladaRevocada: boolean | null
  haSidoNegadaVisa: boolean | null
  fechaNegacionVisa: string
  motivoNegacionVisa: string
  haSidoNegadoIngresoUS: boolean | null
  haTrabajadoIlegalUS: boolean | null

  // Paso 9: Documentos
  documentos: DocumentoSubido[]

  // Paso 10: Consentimiento
  aceptaAvisoPrivacidad: boolean
  aceptaTerminos: boolean
  canalPreferido: CanalContacto | ''
}

export const initialWizardData: WizardData = {
  tramiteCodigo: 'VISA',
  tienePasaporteVigente: null,
  nombreCompleto: '',
  otrosNombres: '',
  sexo: '',
  fechaNacimiento: '',
  lugarNacimiento: '',
  paisNacimiento: 'México',
  nacionalidad: 'Mexicana',
  curp: '',
  telefono: '',
  email: '',
  redesSociales: [],
  calle: '',
  colonia: '',
  ciudad: '',
  estadoMexico: '',
  codigoPostal: '',
  estadoCivil: '',
  nombreConyuge: '',
  fechaNacConyuge: '',
  conyugeViveUS: null,
  hijos: [],
  nombrePadre: '',
  fechaNacPadre: '',
  padreViveUS: null,
  nombreMadre: '',
  fechaNacMadre: '',
  madreViveUS: null,
  tieneFamiliaresDirectosUS: null,
  familiaresDirectos: [],
  tieneOtrosParientesUS: null,
  otrosParientes: [],
  situacionLaboral: '',
  nombreEmpresa: '',
  telefonoEmpresa: '',
  fechaIngresoEmpresa: '',
  direccionEmpresa: '',
  ingresoMensual: '',
  descripcionActividades: '',
  nivelesAcademicos: [
    { id: 'sec', nivel: 'SECUNDARIA', estudio: false, nombreEscuela: '', fechaIngreso: '', fechaTerminacion: '', domicilio: '', telefono: '' },
    { id: 'prep', nivel: 'PREPARATORIA', estudio: false, nombreEscuela: '', fechaIngreso: '', fechaTerminacion: '', domicilio: '', telefono: '' },
    { id: 'uni', nivel: 'UNIVERSIDAD', estudio: false, nombreEscuela: '', fechaIngreso: '', fechaTerminacion: '', domicilio: '', telefono: '' },
  ],
  haVisitadoOtrosPaises: null,
  paisesVisitados: [],
  haTenidoVisaAnterior: null,
  tipoVisaAnterior: '',
  numeroVisaAnterior: '',
  fechaEmisionVisaAnterior: '',
  fechaExpiracionVisaAnterior: '',
  visaCanceladaRevocada: null,
  haSidoNegadaVisa: null,
  fechaNegacionVisa: '',
  motivoNegacionVisa: '',
  haSidoNegadoIngresoUS: null,
  haTrabajadoIlegalUS: null,
  documentos: [],
  aceptaAvisoPrivacidad: false,
  aceptaTerminos: false,
  canalPreferido: '',
}

export const TOTAL_STEPS = 10

export const STEP_TITLES = [
  'Selección de trámite',
  'Prerequisitos',
  'Datos personales',
  'Domicilio y familia',
  'Familiares en EE.UU.',
  'Información laboral',
  'Información académica',
  'Viajes y visas previas',
  'Carga de documentos',
  'Revisión y envío',
] as const
