import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT IdUsuario, Usuario, IdPuesto, Login, Status FROM tblUsuarios ORDER BY Usuario ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const [maxId] = await pool.query('SELECT MAX(IdUsuario) as maxId FROM tblUsuarios');
    const id = ((maxId as any[])[0].maxId || 0) + 1;

    await pool.query(
      'INSERT INTO tblUsuarios (IdUsuario, Usuario, IdPuesto, Login, Password, Status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.Usuario, data.IdPuesto, data.Login, data.Password, 1]
    );
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
