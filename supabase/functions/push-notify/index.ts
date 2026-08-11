import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  subtitle?: string;
  sound?: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  subtitle?: string;
  sound?: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { to, title, body, data, subtitle, sound } = payload;
  if (!to || !title || !body) {
    return new Response(JSON.stringify({ error: 'Missing required fields: to, title, body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ error: 'No recipients provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  const results: Record<string, unknown>[] = [];
  const errors: Record<string, unknown>[] = [];
  const chunkSize = 100;

  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);
    const messages: ExpoPushMessage[] = chunk.map((token) => ({
      to: token,
      title,
      body,
      data,
      subtitle,
      sound: sound ?? 'default',
    }));

    try {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
          ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      results.push({ status: response.status, data: result });
      if (!response.ok) {
        errors.push({ status: response.status, data: result });
      }
    } catch (err) {
      errors.push({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  if (errors.length > 0 && results.length === 0) {
    return new Response(JSON.stringify({ error: 'Failed to send push notifications', errors }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      results,
      errors: errors.length > 0 ? errors : undefined,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
