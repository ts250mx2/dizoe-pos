# DIZOE POS

Sistema independiente de punto de venta, agenda y administración para DIZOE Beauty Salon & Nails. Está basado funcionalmente en `integra-estetica`, pero no incluye registro, creación ni selección de proyectos y trabaja con una sola base de datos MySQL.

## Configuración

1. Copia `.env.example` como `.env` y coloca las credenciales de MySQL.
2. Instala dependencias con `npm install`.
3. Crea la base de datos, tablas y catálogos iniciales con `npm run seed`.
4. Inicia el sistema con `npm run dev` y abre `http://localhost:3021`.

El usuario inicial es `admin` y la contraseña inicial es `admin123`. Cámbiala desde el módulo Usuarios después del primer acceso.

## Módulos

- POS y cobros en efectivo, tarjeta o transferencia
- Agenda y citas
- Reservación pública en `/reservar` con disponibilidad y privacidad de clientes
- Horarios semanales, capacidades por bloque y excepciones por fecha/hora
- Clientes
- Caja, cortes y movimientos
- Servicios y categorías
- Categorías separadas por Servicio, Producto y Extra/Adicional
- Inventario de productos con entradas, salidas, ajustes, mínimos e historial
- Usuarios y configuración de ticket
- Dashboard de ventas

La identidad visual y el favicon se encuentran en `public/branding/dizoe-logo.png` y `app/icon.png`.
