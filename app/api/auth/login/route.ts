import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { message: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      `SELECT IdUsuario, Usuario, IdPuesto
       FROM tblUsuarios
       WHERE LOWER(Login) = LOWER(?) AND Password = ? AND Status = 1`,
      [String(login).trim(), password]
    );

    const user = (rows as RowDataPacket[])[0];
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('dizoe-token', 'valid-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Error en el servidor' }, { status: 500 });
  }
}
