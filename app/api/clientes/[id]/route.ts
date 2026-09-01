import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { NombreCliente, Telefono, CorreoElectronico } = await request.json();

    await pool.query(
      'UPDATE tblClientes SET NombreCliente = ?, Telefono = ?, CorreoElectronico = ? WHERE IdCliente = ?',
      [NombreCliente, Telefono, CorreoElectronico, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clientes PUT error:', error);
    return NextResponse.json({ message: 'Error al actualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query('UPDATE tblClientes SET Status = 0 WHERE IdCliente = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clientes DELETE error:', error);
    return NextResponse.json({ message: 'Error al eliminar cliente' }, { status: 500 });
  }
}
