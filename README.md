# Sirius - Sistema de Vigilancia y Cumplimiento de Seguridad

**VIGILANCE • COMPLIANCE • PROTECTION**

## Descripción General

Sirius es el núcleo de vigilancia de seguridad y cumplimiento legislativo del ecosistema Daniel AI. Monitorea todas las actividades del sistema, detecta amenazas, y garantiza el cumplimiento con regulaciones de salud (HIPAA, GDPR, Ley 1581 de Colombia).

## Características Principales

- 🔍 **Monitoreo en Tiempo Real**: Seguimiento continuo de eventos de seguridad
- ⚖️ **Cumplimiento Legislativo**: Aplicación automática de HIPAA, GDPR, y regulaciones locales
- 🚨 **Detección de Amenazas**: Identificación de anomalías y prevención de intrusiones
- 📊 **Gestión de Auditorías**: Registros de auditoría inmutables y completos
- 🔐 **Control de Acceso**: Autorización granular y gestión de permisos
- 🔔 **Sistema de Alertas**: Notificaciones en tiempo real para eventos de seguridad

## Arquitectura Modular

Sirius opera como un hub central de seguridad que:
1. Recibe eventos de seguridad de todos los componentes del ecosistema
2. Evalúa eventos contra reglas de cumplimiento
3. Detecta anomalías y amenazas potenciales
4. Aplica políticas de control de acceso
5. Mantiene registros de auditoría inmutables
6. Genera reportes de cumplimiento

## Integración con Polaris

Sirius trabaja estrechamente con Polaris para seguridad basada en identidad:
- Recibe eventos de verificación de identidad desde Polaris
- Proporciona decisiones de autorización a Polaris
- Monitorea patrones de autenticación biométrica
- Aplica políticas de acceso basadas en identidad

## Stack Tecnológico

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL (registros de auditoría inmutables)
- **Motor de Reglas**: Motor de cumplimiento personalizado
- **Despliegue**: Google Cloud Run
- **Seguridad**: mTLS, AES-256, Firma de Solicitudes

## Módulos Core

1. **ComplianceEngine**: Motor de reglas para cumplimiento legislativo
2. **SecurityMonitor**: Monitoreo de eventos de seguridad en tiempo real
3. **ThreatDetector**: Detección de anomalías y amenazas
4. **AuditLogger**: Sistema de registro inmutable
5. **AccessControl**: Gestión de autorización y permisos

## Instalación y Despliegue

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev

# Desplegar a Google Cloud Run
gcloud builds submit --config cloudbuild.yaml
```

## Documentación

- [Manual de Integración](./docs/INTEGRATION_MANUAL.md)
- [Mandato de Cumplimiento](./docs/COMPLIANCE_MANDATE.md)
- [Arquitectura](./docs/architecture.md)
- [Matriz de Trazabilidad](./docs/traceability_matrix.md)

---

**Sirius Core** - Parte del ecosistema Daniel AI  
Versión: 1.0.0 | Fecha: 2026-01-16

