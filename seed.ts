import mysql from 'mysql2/promise';

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;

function env(name: (typeof required)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en .env`);
  return value;
}

async function seed() {
  const database = env('DB_NAME');
  if (!/^[a-zA-Z0-9_]+$/.test(database)) {
    throw new Error('DB_NAME solo puede contener letras, números y guion bajo');
  }

  const server = await mysql.createConnection({
    host: env('DB_HOST'),
    user: env('DB_USER'),
    password: env('DB_PASSWORD'),
    port: Number(process.env.DB_PORT || 3306),
  });

  await server.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await server.end();

  const pool = mysql.createPool({
    host: env('DB_HOST'),
    user: env('DB_USER'),
    password: env('DB_PASSWORD'),
    database,
    port: Number(process.env.DB_PORT || 3306),
    decimalNumbers: true,
  });

  const statements = [
    `CREATE TABLE IF NOT EXISTS tblUsuarios (
      IdUsuario INT PRIMARY KEY,
      Usuario VARCHAR(100) NOT NULL,
      IdPuesto INT NOT NULL,
      Login VARCHAR(80) NOT NULL,
      Password VARCHAR(100) NOT NULL,
      Status TINYINT NOT NULL DEFAULT 1,
      UNIQUE KEY uq_usuario_login (Login)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblCategorias (
      IdCategoria INT PRIMARY KEY,
      Categoria VARCHAR(100) NOT NULL,
      EsExtra TINYINT NOT NULL DEFAULT 0,
      TipoCategoria VARCHAR(20) NOT NULL DEFAULT 'SERVICIO'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblProductos (
      IdProducto INT PRIMARY KEY,
      Producto VARCHAR(255) NOT NULL,
      Precio1 DECIMAL(10,2) NOT NULL DEFAULT 0,
      Precio2 DECIMAL(10,2) NOT NULL DEFAULT 0,
      Precio3 DECIMAL(10,2) NOT NULL DEFAULT 0,
      IVA DECIMAL(10,2) NOT NULL DEFAULT 0,
      Status TINYINT NOT NULL DEFAULT 1,
      Multiple TINYINT NOT NULL DEFAULT 0,
      IdCategoria INT,
      ArchivoImagen VARCHAR(500),
      DuracionMinutos INT NOT NULL DEFAULT 60,
      StockActual DECIMAL(12,3) NOT NULL DEFAULT 0,
      StockMinimo DECIMAL(12,3) NOT NULL DEFAULT 0,
      UnidadMedida VARCHAR(30) NOT NULL DEFAULT 'pieza',
      KEY idx_producto_categoria (IdCategoria)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblClientes (
      IdCliente INT AUTO_INCREMENT PRIMARY KEY,
      NombreCliente VARCHAR(255) NOT NULL,
      Telefono VARCHAR(30),
      CorreoElectronico VARCHAR(255),
      FechaRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      Status TINYINT NOT NULL DEFAULT 1,
      KEY idx_cliente_nombre (NombreCliente),
      KEY idx_cliente_telefono (Telefono)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblCitas (
      IdCita INT AUTO_INCREMENT PRIMARY KEY,
      IdCliente INT NOT NULL,
      Titulo VARCHAR(255),
      Descripcion TEXT,
      FechaCita DATETIME NOT NULL,
      Duracion INT NOT NULL DEFAULT 60,
      Status TINYINT NOT NULL DEFAULT 1,
      IdUsuario INT,
      IdProducto INT NULL,
      Origen VARCHAR(20) NOT NULL DEFAULT 'INTERNO',
      FechaRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_cita_fecha (FechaCita),
      KEY idx_cita_cliente (IdCliente)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblAperturasCierres (
      IdApertura INT AUTO_INCREMENT PRIMARY KEY,
      IdUsuarioApertura INT,
      FechaApertura DATETIME NOT NULL,
      FondoCaja DECIMAL(10,2) NOT NULL DEFAULT 0,
      IdSupervisorCierre INT NOT NULL DEFAULT 0,
      FechaCierre DATETIME,
      Efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
      Tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0,
      TotalVentas DECIMAL(10,2) NOT NULL DEFAULT 0,
      Cancelados INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblVentas (
      IdVenta INT PRIMARY KEY,
      IdApertura INT,
      IdComputadora INT NOT NULL DEFAULT 1,
      Folio VARCHAR(20),
      Total DECIMAL(10,2) NOT NULL DEFAULT 0,
      FechaVenta DATETIME NOT NULL,
      IdAperturaPago INT,
      Efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
      Tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0,
      Transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
      Cancelada TINYINT NOT NULL DEFAULT 0,
      VentaEn TINYINT NOT NULL DEFAULT 1,
      Cliente VARCHAR(255),
      IdCliente INT,
      KEY idx_venta_fecha (FechaVenta),
      KEY idx_venta_apertura (IdApertura),
      KEY idx_venta_cliente (IdCliente)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblDetalleVentas (
      IdDetalleVenta INT AUTO_INCREMENT PRIMARY KEY,
      IdVenta INT NOT NULL,
      IdProducto INT NOT NULL,
      Cantidad DECIMAL(10,2) NOT NULL DEFAULT 1,
      Precio DECIMAL(10,2) NOT NULL DEFAULT 0,
      Fecha DATETIME NOT NULL,
      Folio VARCHAR(20),
      IdApertura INT,
      TipoPrecio INT NOT NULL DEFAULT 1,
      Descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
      EsExtra TINYINT NOT NULL DEFAULT 0,
      IdDetallePadre INT,
      KEY idx_detalle_venta (IdVenta),
      KEY idx_detalle_producto (IdProducto),
      KEY idx_detalle_fecha (Fecha)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblMovimientos (
      IdMovimiento INT AUTO_INCREMENT PRIMARY KEY,
      IdApertura INT NOT NULL,
      Concepto VARCHAR(255) NOT NULL,
      Efectivo DECIMAL(10,2) NOT NULL,
      FechaRetiro DATETIME NOT NULL,
      KEY idx_movimiento_apertura (IdApertura)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblMovimientosInventario (
      IdMovimientoInventario INT AUTO_INCREMENT PRIMARY KEY,
      IdProducto INT NOT NULL,
      TipoMovimiento VARCHAR(20) NOT NULL,
      Cantidad DECIMAL(12,3) NOT NULL,
      StockAnterior DECIMAL(12,3) NOT NULL,
      StockNuevo DECIMAL(12,3) NOT NULL,
      Motivo VARCHAR(255) NOT NULL,
      IdVenta INT NULL,
      FechaMovimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_inventario_producto (IdProducto),
      KEY idx_inventario_fecha (FechaMovimiento),
      KEY idx_inventario_venta (IdVenta)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblConfiguracionAgenda (
      Id INT PRIMARY KEY DEFAULT 1,
      IntervaloMinutos INT NOT NULL DEFAULT 30,
      AnticipacionMinimaHoras INT NOT NULL DEFAULT 2,
      DiasFuturos INT NOT NULL DEFAULT 60,
      ReservasPublicasActivas TINYINT NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblHorariosAgenda (
      IdHorario INT AUTO_INCREMENT PRIMARY KEY,
      DiaSemana TINYINT NOT NULL,
      HoraInicio TIME NOT NULL,
      HoraFin TIME NOT NULL,
      Capacidad INT NOT NULL DEFAULT 1,
      Activo TINYINT NOT NULL DEFAULT 1,
      KEY idx_horario_dia (DiaSemana)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblExcepcionesAgenda (
      IdExcepcion INT AUTO_INCREMENT PRIMARY KEY,
      Fecha DATE NOT NULL,
      HoraInicio TIME NOT NULL,
      HoraFin TIME NOT NULL,
      Capacidad INT NOT NULL DEFAULT 0,
      Nota VARCHAR(255),
      KEY idx_excepcion_fecha (Fecha)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tblConfigTicket (
      Id INT PRIMARY KEY DEFAULT 1,
      Header1 VARCHAR(255), Header2 VARCHAR(255), Header3 VARCHAR(255),
      Header4 VARCHAR(255), Header5 VARCHAR(255),
      Footer1 VARCHAR(255), Footer2 VARCHAR(255), Footer3 VARCHAR(255),
      PrintKitchenDefault TINYINT DEFAULT 0,
      RequireCustomerName TINYINT DEFAULT 1,
      LogoPath VARCHAR(500), AppTitle VARCHAR(255),
      PrimaryColor VARCHAR(20), PrimaryHover VARCHAR(20), AccentColor VARCHAR(20),
      BgColor VARCHAR(20), SurfaceColor VARCHAR(20)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const statement of statements) await pool.query(statement);

  const ensureColumn = async (table: string, column: string, definition: string) => {
    const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    if ((rows as unknown[]).length === 0) {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
  };

  await ensureColumn('tblCategorias', 'TipoCategoria', "VARCHAR(20) NOT NULL DEFAULT 'SERVICIO'");
  await ensureColumn('tblProductos', 'StockActual', 'DECIMAL(12,3) NOT NULL DEFAULT 0');
  await ensureColumn('tblProductos', 'StockMinimo', 'DECIMAL(12,3) NOT NULL DEFAULT 0');
  await ensureColumn('tblProductos', 'UnidadMedida', "VARCHAR(30) NOT NULL DEFAULT 'pieza'");
  await ensureColumn('tblProductos', 'DuracionMinutos', 'INT NOT NULL DEFAULT 60');
  await ensureColumn('tblCitas', 'IdProducto', 'INT NULL');
  await ensureColumn('tblCitas', 'Origen', "VARCHAR(20) NOT NULL DEFAULT 'INTERNO'");

  const [agendaConfigInsert] = await pool.query(`INSERT IGNORE INTO tblConfiguracionAgenda
    (Id, IntervaloMinutos, AnticipacionMinimaHoras, DiasFuturos, ReservasPublicasActivas)
    VALUES (1, 30, 2, 60, 1)`);

  if ((agendaConfigInsert as { affectedRows: number }).affectedRows > 0) {
    const defaultSchedule = [
      [1, '10:00:00', '19:00:00', 2], [2, '10:00:00', '19:00:00', 2],
      [3, '10:00:00', '19:00:00', 2], [4, '10:00:00', '19:00:00', 2],
      [5, '10:00:00', '19:00:00', 2], [6, '10:00:00', '16:00:00', 2],
    ];
    await pool.query('INSERT INTO tblHorariosAgenda (DiaSemana, HoraInicio, HoraFin, Capacidad) VALUES ?', [defaultSchedule]);
  }

  // Conserva la clasificación anterior: EsExtra=1 ahora es EXTRA.
  await pool.query("UPDATE tblCategorias SET TipoCategoria = 'EXTRA' WHERE EsExtra = 1");

  await pool.query(
    `INSERT IGNORE INTO tblUsuarios
      (IdUsuario, Usuario, IdPuesto, Login, Password, Status)
     VALUES (1, 'Administrador DIZOE', 1, 'admin', 'admin123', 1)`
  );

  const categories = [
    [1, 'Cabello', 0, 'SERVICIO'],
    [2, 'Uñas', 0, 'SERVICIO'],
    [3, 'Color y tratamientos', 0, 'SERVICIO'],
    [4, 'Belleza y cuidado', 0, 'SERVICIO'],
    [5, 'Extras', 1, 'EXTRA'],
    [6, 'Productos de belleza', 0, 'PRODUCTO'],
  ];
  await pool.query(
    'INSERT IGNORE INTO tblCategorias (IdCategoria, Categoria, EsExtra, TipoCategoria) VALUES ?',
    [categories]
  );

  const services = [
    [1, 'Corte de dama', 250, 0, 0, 0, 1, 0, 1],
    [2, 'Peinado', 300, 0, 0, 0, 1, 0, 1],
    [3, 'Manicure', 220, 0, 0, 0, 1, 0, 2],
    [4, 'Pedicure', 280, 0, 0, 0, 1, 0, 2],
    [5, 'Aplicación de gel', 350, 0, 0, 0, 1, 0, 2],
    [6, 'Tinte', 650, 0, 0, 0, 1, 0, 3],
    [7, 'Tratamiento capilar', 450, 0, 0, 0, 1, 0, 3],
    [8, 'Diseño de ceja', 150, 0, 0, 0, 1, 0, 4],
    [9, 'Retiro de gel', 100, 0, 0, 0, 1, 0, 5],
    [10, 'Decoración por uña', 25, 0, 0, 0, 1, 0, 5],
  ];
  await pool.query(
    `INSERT IGNORE INTO tblProductos
      (IdProducto, Producto, Precio1, Precio2, Precio3, IVA, Status, Multiple, IdCategoria)
     VALUES ?`,
    [services]
  );

  await pool.query(
    `INSERT INTO tblConfigTicket
      (Id, Header1, Header2, Header3, Footer1, Footer2, RequireCustomerName,
       LogoPath, AppTitle, PrimaryColor, PrimaryHover, AccentColor)
     VALUES
      (1, 'DIZOE', 'Beauty Salon & Nails', '', 'Gracias por tu preferencia',
       '¡Te esperamos pronto!', 1, '/branding/dizoe-logo.png', 'DIZOE POS',
       '#d9b95f', '#aa8130', '#edd789')
     ON DUPLICATE KEY UPDATE
       Header1 = VALUES(Header1), Header2 = VALUES(Header2),
       LogoPath = VALUES(LogoPath), AppTitle = VALUES(AppTitle),
       PrimaryColor = VALUES(PrimaryColor), PrimaryHover = VALUES(PrimaryHover),
       AccentColor = VALUES(AccentColor)`
  );

  await pool.end();
  console.log(`Base de datos ${database} lista para DIZOE POS.`);
}

seed().catch((error) => {
  console.error('No se pudo inicializar DIZOE POS:', error);
  process.exitCode = 1;
});
