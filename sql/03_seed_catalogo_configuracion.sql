/*
    Sistema CCTV - Catálogo de materiales/servicios y configuración base
    --------------------------------------------------------------------
    Generado a partir de apps/pocketbase/pb_migrations/1786470801_seed_cctv_data.js
    (el catálogo oficial de precios y las listas de configuración de la app).
    Idempotente: no duplica filas si se ejecuta más de una vez.
*/

USE SistemaCCTV;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.catalogo)
BEGIN
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-001', N'CCTV', N'CCTV', N'Cámara IP 2MP', N'Unidad', 85, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-002', N'CCTV', N'CCTV', N'Cámara analógica 2MP', N'Unidad', 45, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-003', N'CCTV', N'CCTV', N'Cámara bullet', N'Unidad', 70, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-004', N'CCTV', N'CCTV', N'Cámara domo', N'Unidad', 75, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-005', N'CCTV', N'CCTV', N'Cámara PTZ', N'Unidad', 480, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-006', N'CCTV', N'CCTV', N'NVR 8 canales', N'Unidad', 260, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-007', N'CCTV', N'CCTV', N'DVR 8 canales', N'Unidad', 180, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-008', N'CCTV', N'CCTV', N'XVR 16 canales', N'Unidad', 320, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-009', N'CCTV', N'CCTV', N'Disco duro CCTV 2TB', N'Unidad', 95, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-010', N'CCTV', N'CCTV', N'Fuente 12V 2A', N'Unidad', 12, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-011', N'CCTV', N'CCTV', N'Fuente PoE', N'Unidad', 28, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-012', N'CCTV', N'CCTV', N'Adaptador BNC', N'Unidad', 3, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-013', N'CCTV', N'CCTV', N'Monitor 24"', N'Unidad', 150, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'CCTV-014', N'CCTV', N'CCTV', N'Soporte de cámara', N'Unidad', 9, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-001', N'Redes', N'Redes', N'Cable UTP Cat 5e', N'Metro', 0.45, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-002', N'Redes', N'Redes', N'Cable UTP Cat 6', N'Metro', 0.75, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-003', N'Redes', N'Redes', N'Cable exterior UTP', N'Metro', 0.95, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-004', N'Redes', N'Redes', N'Fibra óptica monomodo', N'Metro', 1.2, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-005', N'Redes', N'Redes', N'Conector RJ45', N'Unidad', 0.4, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-006', N'Redes', N'Redes', N'Keystone Cat 6', N'Unidad', 3.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-007', N'Redes', N'Redes', N'Patch Cord 3 pies', N'Unidad', 2.8, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-008', N'Redes', N'Redes', N'Patch Panel 24 puertos', N'Unidad', 45, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-009', N'Redes', N'Redes', N'Switch 8 puertos', N'Unidad', 35, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-010', N'Redes', N'Redes', N'Switch PoE 8 puertos', N'Unidad', 110, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-011', N'Redes', N'Redes', N'Router', N'Unidad', 60, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-012', N'Redes', N'Redes', N'Access Point', N'Unidad', 85, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-013', N'Redes', N'Redes', N'Módulo SFP', N'Unidad', 40, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'RED-014', N'Redes', N'Redes', N'Convertidor de medios', N'Unidad', 32, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-001', N'Instalación', N'Instalación', N'Canaleta plástica', N'Metro', 1.8, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-002', N'Instalación', N'Instalación', N'Tubería PVC 1/2"', N'Metro', 1.1, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-003', N'Instalación', N'Instalación', N'Tubería EMT 1/2"', N'Metro', 2.3, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-004', N'Instalación', N'Instalación', N'Tubería flexible', N'Metro', 1.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-005', N'Instalación', N'Instalación', N'Caja de registro', N'Unidad', 6.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-006', N'Instalación', N'Instalación', N'Gabinete metálico', N'Unidad', 85, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-007', N'Instalación', N'Instalación', N'Rack de pared 9U', N'Unidad', 130, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-008', N'Instalación', N'Instalación', N'Bandeja para rack', N'Unidad', 22, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-009', N'Instalación', N'Instalación', N'Organizador de cable', N'Unidad', 18, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-010', N'Instalación', N'Instalación', N'Bridas plásticas', N'Bolsa', 3.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-011', N'Instalación', N'Instalación', N'Abrazaderas', N'Unidad', 0.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-012', N'Instalación', N'Instalación', N'Tornillería', N'Kit', 5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-013', N'Instalación', N'Instalación', N'Cinta aislante', N'Unidad', 1.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-014', N'Instalación', N'Instalación', N'Conectores varios', N'Unidad', 0.8, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'INS-015', N'Instalación', N'Instalación', N'Soportes metálicos', N'Unidad', 7, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-001', N'Energía', N'Energía', N'UPS 1000VA', N'Unidad', 180, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-002', N'Energía', N'Energía', N'Regulador de voltaje', N'Unidad', 45, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-003', N'Energía', N'Energía', N'Supresor de picos', N'Unidad', 25, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-004', N'Energía', N'Energía', N'Regleta 6 tomas', N'Unidad', 12, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-005', N'Energía', N'Energía', N'Batería 12V 7Ah', N'Unidad', 28, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-006', N'Energía', N'Energía', N'Fuente centralizada 10A', N'Unidad', 55, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-007', N'Energía', N'Energía', N'Breaker 20A', N'Unidad', 9, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-008', N'Energía', N'Energía', N'Cable eléctrico THHN 12', N'Metro', 0.85, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ENE-009', N'Energía', N'Energía', N'Tomacorriente doble', N'Unidad', 4.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-001', N'Control de acceso', N'Control de acceso', N'Biométrico de huella', N'Unidad', 190, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-002', N'Control de acceso', N'Control de acceso', N'Lector de proximidad', N'Unidad', 65, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-003', N'Control de acceso', N'Control de acceso', N'Tarjeta de proximidad', N'Unidad', 2.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-004', N'Control de acceso', N'Control de acceso', N'Cerradura electromagnética', N'Unidad', 95, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-005', N'Control de acceso', N'Control de acceso', N'Botón de salida', N'Unidad', 15, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-006', N'Control de acceso', N'Control de acceso', N'Fuente para control de acceso', N'Unidad', 35, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-007', N'Control de acceso', N'Control de acceso', N'Sensor magnético', N'Unidad', 8, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-008', N'Control de acceso', N'Control de acceso', N'Sirena', N'Unidad', 22, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'ACC-009', N'Control de acceso', N'Control de acceso', N'Intercomunicador', N'Unidad', 120, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-001', N'Servicios', N'Servicios', N'Visita técnica', N'Servicio', 45, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-002', N'Servicios', N'Servicios', N'Diagnóstico', N'Servicio', 40, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-003', N'Servicios', N'Servicios', N'Hora técnica', N'Hora', 18, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-004', N'Servicios', N'Servicios', N'Mano de obra', N'Global', 120, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-005', N'Servicios', N'Servicios', N'Instalación de cámara', N'Unidad', 30, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-006', N'Servicios', N'Servicios', N'Configuración de cámara', N'Unidad', 15, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-007', N'Servicios', N'Servicios', N'Configuración NVR', N'Servicio', 45, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-008', N'Servicios', N'Servicios', N'Configuración DVR', N'Servicio', 40, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-009', N'Servicios', N'Servicios', N'Configuración de red', N'Servicio', 60, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-010', N'Servicios', N'Servicios', N'Configuración de acceso remoto', N'Servicio', 50, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-011', N'Servicios', N'Servicios', N'Cableado estructurado', N'Metro', 1.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-012', N'Servicios', N'Servicios', N'Canalización', N'Metro', 2.5, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-013', N'Servicios', N'Servicios', N'Instalación de rack', N'Servicio', 90, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-014', N'Servicios', N'Servicios', N'Programación', N'Hora', 20, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-015', N'Servicios', N'Servicios', N'Migración de sistema', N'Global', 250, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-016', N'Servicios', N'Servicios', N'Transporte', N'Global', 35, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-017', N'Servicios', N'Servicios', N'Viáticos', N'Día', 25, 1, 1, 0);
    INSERT INTO dbo.catalogo (codigo, categoria, subcategoria, descripcion, unidad, precio, iva, activo, demo) VALUES (N'SRV-018', N'Servicios', N'Servicios', N'Otro servicio', N'Global', 0, 1, 1, 0);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.configuracion WHERE clave = N'general')
    INSERT INTO dbo.configuracion (clave, valor) VALUES (N'general', N'{"empresa":"Seguridad Electrónica CCTV, S.A.","nit":"0000-000000-000-0","direccion":"San Salvador, El Salvador","telefono":"+503 0000-0000","correo":"contacto@empresa.com","logo":"","iva":13,"moneda":"$"}');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.configuracion WHERE clave = N'actividades')
    INSERT INTO dbo.configuracion (clave, valor) VALUES (N'actividades', N'["Inspección física de cámaras","Limpieza externa","Limpieza de lentes","Limpieza de domos","Verificación de enfoque","Verificación de calidad de imagen","Verificación de visión nocturna","Verificación de infrarrojos","Revisión de alimentación","Revisión de conectores","Revisión de cableado","Revisión de canalización","Revisión de fuentes","Revisión de switches","Revisión de puertos PoE","Revisión de NVR","Revisión de DVR","Revisión de XVR","Revisión de almacenamiento","Revisión de discos duros","Verificación de fecha y hora","Verificación de grabaciones","Prueba de reproducción","Prueba de acceso remoto","Verificación de red","Revisión de UPS","Revisión de gabinetes","Revisión de racks","Respaldo de configuración","Actualización de firmware","Prueba general del sistema"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.configuracion WHERE clave = N'tiposEquipo')
    INSERT INTO dbo.configuracion (clave, valor) VALUES (N'tiposEquipo', N'["Cámara IP","Cámara analógica","Cámara domo","Cámara bullet","Cámara PTZ","Cámara térmica","NVR","DVR","XVR","Servidor","Disco duro","Monitor","Switch PoE","Switch","Router","UPS","Fuente","Gabinete","Rack","Control de acceso","Biométrico","Intercomunicador","Otro"]');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.configuracion WHERE clave = N'condicionesDefault')
    INSERT INTO dbo.configuracion (clave, valor) VALUES (N'condicionesDefault', N'{"alcance":"Suministro, instalación y configuración de los materiales y servicios descritos en la presente oferta.","tiempoEntrega":"5 días hábiles posteriores a la aprobación.","tiempoEjecucion":"3 días hábiles.","vigencia":"15 días calendario.","formaPago":"Crédito 30 días contra entrega de factura.","garantia":"12 meses en equipos y 6 meses en mano de obra.","exclusiones":"Obra civil, trabajos eléctricos mayores y permisos.","observaciones":""}');
GO

