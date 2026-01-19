# PRD: Customer.io Connect para Tiendanube (Native App)

**Versión:** 1.1 (Basada en Template Nativo Node.js)

**Stack Técnico:** Node.js (Backend) + React (Frontend) + Tiendanube Styleguide

**Estado:** Definición Técnica Terminada

## 1. Objetivo del Producto

Integrar **Customer.io Data Pipelines** en tiendas Tiendanube de forma nativa, permitiendo el rastreo de eventos tanto en el navegador (JS) como en el servidor (Webhooks de órdenes).

---

## 2. Implementación Técnica (Basada en Template)

### 2.1. Arquitectura de Referencia

La aplicación utilizará la estructura del repositorio `tiendanube-app-native-template-node`:

* **Frontend (/frontend):** Single Page Application (SPA) en React encargada de la configuración del usuario. Debe utilizar el submódulo `tiendanube-styleguide` para garantizar consistencia visual.
* **Backend (/backend):** Servidor Express que maneja el flujo de OAuth, el almacenamiento de credenciales y la lógica de webhooks.

### 2.2. Configuración de la App (User Interface)

Dentro del directorio `/frontend/src/components`, se creará un formulario de configuración que incluya:

* **Campos de Entrada:**
* `CDP Write Key` (Input de texto).
* `Region Center` (Select: `US` o `EU`).
* `Custom Proxy Domain` (Input de texto, opcional).


* **Persistencia:** Al hacer clic en "Guardar", se enviarán los datos al backend para almacenarse en la base de datos vinculada al `store_id` (vía Sequelize/Mongoose según se configure el template).

### 2.3. Inyección de Scripts (Storefront)

A diferencia de los App Blocks de Shopify, utilizaremos la **Scripts API** de Tiendanube.

* **Momento de ejecución:** Al completar el flujo de OAuth o cuando el usuario actualice su `Write Key`.
* **Payload del Script:**
```javascript
// El backend debe generar dinámicamente este JS
const baseUrl = custom_proxy || (region === 'eu' ? 'https://cdp-eu.customer.io' : 'https://cdp.customer.io');
// Inyectar el snippet estándar de analytics.js usando esta baseUrl

```



### 2.4. Manejo de Webhooks (Server-Side)

Se extenderán los controladores del directorio `/backend/webhooks` para procesar los eventos de Tiendanube y enviarlos a Customer.io.

| Evento | Tópico Tiendanube | Lógica de Mapeo |
| --- | --- | --- |
| **Venta Realizada** | `order/created` | Mapear `body.total` y `body.products` al evento "Order Completed". |
| **Pago Confirmado** | `order/paid` | Enviar evento "Order Paid" para disparar flujos de post-venta. |
| **Orden Cancelada** | `order/cancelled` | Notificar a Customer.io para detener flujos de recuperación. |

---

## 3. Requerimientos de Infraestructura y Seguridad

### 3.1. Autenticación (OAuth)

* Se utilizará el flujo de autenticación nativo incluido en el template.
* El `access_token` de cada tienda debe almacenarse de forma segura para realizar llamadas a la API de Scripts y registrar Webhooks.

### 3.2. Variables de Entorno (`.env`)

El archivo de configuración debe incluir:

* `TIENDANUBE_CLIENT_ID`: ID de la aplicación en el Partner Dashboard.
* `TIENDANUBE_CLIENT_SECRET`: Secreto de la aplicación.
* `APP_URL`: URL base donde se hospeda la app (para redirecciones de OAuth).

---

## 4. Flujo de Usuario (UX)

1. **Instalación:** El mercader instala la app desde la Tienda de Aplicaciones.
2. **Autorización:** Se redirige al mercader para aceptar permisos (lectura de órdenes, escritura de scripts).
3. **Configuración:** Se abre el Iframe nativo donde el usuario ingresa su `Write Key` de Customer.io y selecciona su región.
4. **Activación:** Tras guardar, la app inyecta automáticamente el script en el storefront y queda lista para trackear.

---

## 5. Diferencias Clave vs Shopify (Para el desarrollador)

* **No hay Liquid:** No podemos usar archivos `.liquid`. Todo cambio en el frontend del cliente se hace vía la API de Scripts.
* **Base de Datos Propia:** Es obligatorio tener una base de datos para relacionar el `shop_id` con el `write_key` de Customer.io, ya que Tiendanube no guarda meta-campos de configuración de apps de la misma forma que Shopify.
* **Estilos:** Es mandatorio usar `tiendanube-styleguide` para pasar la revisión de la tienda de aplicaciones.