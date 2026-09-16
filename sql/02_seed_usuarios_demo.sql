/*
    Sistema CCTV - Usuarios de prueba
    ---------------------------------
    Mismas credenciales que muestra hoy la pantalla de login
    (apps/web/src/pages/LoginPage.jsx):
        Admin:   admin@cctv.com   / admin123
        Usuario: usuario@cctv.com / usuario123

    Los hashes son bcrypt (costo 10). La API que reemplace a PocketBase debe
    verificar con bcrypt.compare(password, password_hash) al hacer login.
*/

USE SistemaCCTV;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'admin@cctv.com')
INSERT INTO dbo.users (email, password_hash, name, role, activo, verified)
VALUES (N'admin@cctv.com', '$2b$10$fgaboAcTpd30ey4lA.vTMeQRwMJwyY64Z785b5TW.dJYQlxXKqtVa', N'Administrador', N'Admin', 1, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'usuario@cctv.com')
INSERT INTO dbo.users (email, password_hash, name, role, activo, verified)
VALUES (N'usuario@cctv.com', '$2b$10$Wbh4sSCwUI5LsZaxgLRmAeFuvdDjkA4hMQ8LYG3E/RCOZQSbfXX1.', N'Usuario Técnico', N'Usuario', 1, 1);
GO
