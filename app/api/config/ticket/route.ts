import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Ensure table exists with all new fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tblConfigTicket (
        Id INT PRIMARY KEY DEFAULT 1,
        Header1 VARCHAR(255),
        Header2 VARCHAR(255),
        Header3 VARCHAR(255),
        Header4 VARCHAR(255),
        Header5 VARCHAR(255),
        Footer1 VARCHAR(255),
        Footer2 VARCHAR(255),
        Footer3 VARCHAR(255),
        PrintKitchenDefault TINYINT DEFAULT 0,
        RequireCustomerName TINYINT DEFAULT 1,
        LogoPath VARCHAR(500),
        AppTitle VARCHAR(255),
        PrimaryColor VARCHAR(20),
        PrimaryHover VARCHAR(20),
        AccentColor VARCHAR(20),
        BgColor VARCHAR(20),
        SurfaceColor VARCHAR(20)
      )
    `);

    // Add missing columns if they don't exist
    const [columns] = await pool.query('SHOW COLUMNS FROM tblConfigTicket');
    const colNames = (columns as any[]).map(c => c.Field);
    
    if (!colNames.includes('LogoPath')) await pool.query('ALTER TABLE tblConfigTicket ADD COLUMN LogoPath VARCHAR(500)');
    if (!colNames.includes('AppTitle')) await pool.query('ALTER TABLE tblConfigTicket ADD COLUMN AppTitle VARCHAR(255)');
    if (!colNames.includes('PrimaryColor')) await pool.query('ALTER TABLE tblConfigTicket ADD COLUMN PrimaryColor VARCHAR(20)');
    if (!colNames.includes('PrimaryHover')) await pool.query('ALTER TABLE tblConfigTicket ADD COLUMN PrimaryHover VARCHAR(20)');
    if (!colNames.includes('AccentColor')) await pool.query('ALTER TABLE tblConfigTicket ADD COLUMN AccentColor VARCHAR(20)');
    if (!colNames.includes('BgColor')) await pool.query('ALTER TABLE tblConfigTicket ADD COLUMN BgColor VARCHAR(20)');
    if (!colNames.includes('SurfaceColor')) await pool.query('ALTER TABLE tblConfigTicket ADD COLUMN SurfaceColor VARCHAR(20)');

    const [rows] = await pool.query('SELECT * FROM tblConfigTicket WHERE Id = 1');
    let config = (rows as any[])[0];

    if (!config) {
      config = {
        Id: 1,
        Header1: 'DIZOE',
        Header2: 'Beauty Salon & Nails',
        Header3: '',
        Header4: '',
        Header5: '',
        Footer1: 'Gracias por su preferencia',
        Footer2: '¡Te esperamos pronto!',
        Footer3: '',
        RequireCustomerName: 1,
        AppTitle: 'DIZOE POS',
        LogoPath: '/branding/dizoe-logo.png',
        PrimaryColor: '#d9b95f',
        PrimaryHover: '#aa8130',
        AccentColor: '#edd789'
      };
      await pool.query('INSERT INTO tblConfigTicket SET ?', [config]);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const [rows] = await pool.query('SELECT Id FROM tblConfigTicket WHERE Id = 1');
    if ((rows as any[]).length === 0) {
      await pool.query('INSERT INTO tblConfigTicket SET ?, Id = 1', [data]);
    } else {
      await pool.query('UPDATE tblConfigTicket SET ? WHERE Id = 1', [data]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
