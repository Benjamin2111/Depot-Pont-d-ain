import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

    const admin = getSupabaseAdmin();

    // Vérifie que l'appelant est bien connecté et responsable
    const { data: callerData, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !callerData.user) return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });

    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', callerData.user.id).single();
    if (!callerProfile || callerProfile.role !== 'responsable') {
      return NextResponse.json({ error: 'Seul un responsable peut créer un utilisateur.' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, password, role } = body;
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caractères.' }, { status: 400 });
    }
    if (role !== 'ouvrier' && role !== 'responsable') {
      return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName.trim(), last_name: lastName.trim(), role }
    });

    if (createErr) {
      return NextResponse.json({ error: createErr.message || 'Impossible de créer le compte.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, userId: created.user.id });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erreur serveur.' }, { status: 500 });
  }
}
