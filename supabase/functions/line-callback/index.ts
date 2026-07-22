import { createClient } from 'jsr:@supabase/supabase-js@2';

const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';
const REDIRECT_SCHEME = 'maithing://auth/callback';

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    return Response.redirect(
      `${REDIRECT_SCHEME}?error=${encodeURIComponent(error ?? 'missing_code')}`,
    );
  }

  const channelId = Deno.env.get('LINE_CHANNEL_ID');
  const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!channelId || !channelSecret) {
    return new Response('LINE credentials not configured', { status: 500 });
  }

  // Exchange code for LINE tokens
  const tokenRes = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${supabaseUrl}/functions/v1/line-callback`,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('LINE token exchange failed:', body);
    return Response.redirect(`${REDIRECT_SCHEME}?error=token_exchange_failed`);
  }

  const tokens = (await tokenRes.json()) as { access_token: string; id_token?: string };

  // Get LINE profile
  const profileRes = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    return Response.redirect(`${REDIRECT_SCHEME}?error=profile_fetch_failed`);
  }

  const profile = (await profileRes.json()) as {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };

  // Derive email — LINE doesn't always provide one; use a stable synthetic address
  let email: string | null = null;
  if (tokens.id_token) {
    try {
      // Decode JWT payload (no verification needed here — we trust LINE's signed response)
      const payload = JSON.parse(atob(tokens.id_token.split('.')[1]!)) as { email?: string };
      email = payload.email ?? null;
    } catch {
      // ignore decode errors
    }
  }
  const effectiveEmail = email ?? `line_${profile.userId}@line.user`;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Upsert user — createUser errors if email exists, so find first
  let userId: string;
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === effectiveEmail);

  if (found) {
    userId = found.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: effectiveEmail,
      email_confirm: true,
      user_metadata: {
        full_name: profile.displayName,
        avatar_url: profile.pictureUrl,
        provider: 'line',
        line_user_id: profile.userId,
      },
    });
    if (createErr || !created.user) {
      console.error('createUser failed:', createErr);
      return Response.redirect(`${REDIRECT_SCHEME}?error=user_create_failed`);
    }
    userId = created.user.id;
  }

  // Generate a magic-link action URL that the app can exchange for a session
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: effectiveEmail,
    options: { redirectTo: REDIRECT_SCHEME },
  });

  if (linkErr || !linkData.properties.action_link) {
    console.error('generateLink failed:', linkErr);
    return Response.redirect(`${REDIRECT_SCHEME}?error=link_generation_failed`);
  }

  return Response.redirect(linkData.properties.action_link);
});
