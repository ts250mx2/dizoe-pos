import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    let query = 'UPDATE tblUsuarios SET Usuario = ?, IdPuesto = ?, Login = ?, Status = ?';
    let paramsArr = [data.Usuario, data.IdPuesto, data.Login, data.Status];
    
    if (data.Password) {
        query += ', Password = ?';
        paramsArr.push(data.Password);
    }
    
    query += ' WHERE IdUsuario = ?';
    paramsArr.push(id);

    await pool.query(query, paramsArr);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Don't allow deleting self or admin 1
    if (id === '1') return NextResponse.json({ message: 'No se puede eliminar al administrador principal' }, { status: 400 });
    
    await pool.query('DELETE FROM tblUsuarios WHERE IdUsuario = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
