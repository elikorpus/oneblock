require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET, PORT } = process.env;

for (const [name, value] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD, SESSION_SECRET })) {
  if (!value) {
    console.error(`Missing ${name} in admin/.env — copy admin/.env.example to admin/.env and fill it in.`);
    process.exit(1);
  }
}

// Service-role client: bypasses every RLS policy in the app. This must only
// ever run on localhost, and this key must never reach a browser.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const app = express();
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

function requireAuth(req, res, next) {
  if (req.session.authed) return next();
  return res.status(401).json({ error: 'Not signed in' });
}

function asyncRoute(handler) {
  return (req, res) => {
    handler(req, res).catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.message || 'Server error' });
    });
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const expectedUsername = ADMIN_USERNAME || 'admin';
  if (username === expectedUsername && password === ADMIN_PASSWORD) {
    req.session.authed = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Wrong username or password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ authed: !!req.session.authed });
});

app.use('/api', requireAuth);

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

app.get(
  '/api/communities',
  asyncRoute(async (req, res) => {
    const [{ data: communities, error: communitiesError }, { data: scores, error: scoresError }] = await Promise.all([
      supabase.from('communities').select('*').order('created_at', { ascending: false }),
      supabase.rpc('community_scores'),
    ]);
    if (communitiesError) throw communitiesError;
    if (scoresError) throw scoresError;
    const scoresById = new Map((scores || []).map((s) => [s.community_id, s]));
    const merged = (communities || []).map((c) => ({
      id: c.id,
      name: c.name,
      signupKey: c.signup_key,
      createdAt: c.created_at,
      householdCount: scoresById.get(c.id)?.household_count ?? 0,
      eventsPerMonth: scoresById.get(c.id)?.events_per_month ?? 0,
      kidsCount: scoresById.get(c.id)?.kids_count ?? 0,
      score: scoresById.get(c.id)?.score ?? null,
    }));
    res.json(merged);
  })
);

app.post(
  '/api/communities',
  asyncRoute(async (req, res) => {
    const { name, signupKey, houses } = req.body || {};
    if (!name?.trim() || !signupKey?.trim()) {
      return res.status(400).json({ error: 'Name and signup key are required' });
    }
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({ name: name.trim(), signup_key: signupKey.trim() })
      .select()
      .single();
    if (communityError) throw communityError;

    const parsedHouses = parseHouseLines(houses);
    if (parsedHouses.length > 0) {
      const { error: housesError } = await supabase
        .from('houses')
        .insert(parsedHouses.map((h) => ({ ...h, community_id: community.id })));
      if (housesError) throw housesError;
    }
    res.json({ ok: true, community, housesAdded: parsedHouses.length });
  })
);

app.get(
  '/api/communities/:id/houses',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .eq('community_id', req.params.id)
      .order('address', { ascending: true });
    if (error) throw error;
    res.json(
      (data || []).map((h) => ({ id: h.id, address: h.address, latitude: h.latitude, longitude: h.longitude, claimed: !!h.resident_profile_id }))
    );
  })
);

app.post(
  '/api/communities/:id/houses',
  asyncRoute(async (req, res) => {
    const parsedHouses = parseHouseLines(req.body?.houses);
    if (parsedHouses.length === 0) return res.status(400).json({ error: 'No valid house lines found' });
    const { error } = await supabase.from('houses').insert(parsedHouses.map((h) => ({ ...h, community_id: req.params.id })));
    if (error) throw error;
    res.json({ ok: true, housesAdded: parsedHouses.length });
  })
);

/** Parses "id, address, lat, lng" lines (one house per line) into house rows. */
function parseHouseLines(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const rows = [];
  for (const line of raw.split('\n')) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 4 || parts.some((p) => !p)) continue;
    const [id, address, latStr, lngStr] = parts;
    const latitude = Number(latStr);
    const longitude = Number(lngStr);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    rows.push({ id, address, latitude, longitude });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Residents & HOA board
// ---------------------------------------------------------------------------

app.get(
  '/api/profiles',
  asyncRoute(async (req, res) => {
    const { communityId, q } = req.query;
    let query = supabase.from('profiles').select('*').order('first_name', { ascending: true });
    if (communityId) query = query.eq('community_id', communityId);
    const { data, error } = await query;
    if (error) throw error;
    let rows = data || [];
    if (q?.trim()) {
      const needle = q.trim().toLowerCase();
      rows = rows.filter((p) => `${p.first_name} ${p.last_name} ${p.street}`.toLowerCase().includes(needle));
    }
    res.json(
      rows.map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        street: p.street,
        communityId: p.community_id,
        isBoardMember: p.is_board_member,
        createdAt: p.created_at,
      }))
    );
  })
);

app.post(
  '/api/profiles/:id/board',
  asyncRoute(async (req, res) => {
    const { isBoardMember } = req.body || {};
    const { error } = await supabase.from('profiles').update({ is_board_member: !!isBoardMember }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  })
);

app.delete(
  '/api/profiles/:id',
  asyncRoute(async (req, res) => {
    // profiles.id references auth.users(id) on delete cascade, so deleting the
    // auth user cascades to the profile and everything tied to it (asks, posts,
    // messages, RSVPs, waves, etc.); their house (if any) reverts to unclaimed.
    const { data: userData } = await supabase.auth.admin.getUserById(req.params.id);
    const email = userData?.user?.email || null;

    // `false` = hard delete (not a soft/tombstone delete), so the email is
    // immediately free to sign up again.
    const { error } = await supabase.auth.admin.deleteUser(req.params.id, false);
    if (error) throw error;

    // Belt-and-suspenders: some projects leave a stale auth.identities row
    // behind a hard delete, which blocks re-signup with "User already
    // registered" even though the account is gone. Clean that up too.
    if (email) {
      const { error: purgeError } = await supabase.rpc('purge_orphaned_auth_identities', { target_email: email });
      if (purgeError) console.warn(`Could not purge orphaned auth identities for ${email}:`, purgeError.message);
    }

    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Realtor signup keys (self-serve realtor onboarding codes)
// ---------------------------------------------------------------------------

app.get(
  '/api/realtor-signup-keys',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase.from('realtor_signup_keys').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  })
);

app.post(
  '/api/realtor-signup-keys',
  asyncRoute(async (req, res) => {
    const { key, label } = req.body || {};
    if (!key?.trim()) return res.status(400).json({ error: 'Key is required' });
    const { data, error } = await supabase
      .from('realtor_signup_keys')
      .insert({ key: key.trim(), label: (label || '').trim() })
      .select()
      .single();
    if (error) throw error;
    res.json({ ok: true, key: data });
  })
);

app.delete(
  '/api/realtor-signup-keys/:id',
  asyncRoute(async (req, res) => {
    const { error } = await supabase.from('realtor_signup_keys').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Realtor accounts (real logins) — view + revoke only. Realtors are only ever
// created by the realtor themselves, via a signup code, from the app.
// ---------------------------------------------------------------------------

app.get(
  '/api/realtor-accounts',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase.from('realtor_accounts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  })
);

app.delete(
  '/api/realtor-accounts/:id',
  asyncRoute(async (req, res) => {
    // Deleting the auth user cascades to realtor_accounts (on delete cascade).
    const { data: userData } = await supabase.auth.admin.getUserById(req.params.id);
    const email = userData?.user?.email || null;

    const { error } = await supabase.auth.admin.deleteUser(req.params.id, false);
    if (error) throw error;

    if (email) {
      const { error: purgeError } = await supabase.rpc('purge_orphaned_auth_identities', { target_email: email });
      if (purgeError) console.warn(`Could not purge orphaned auth identities for ${email}:`, purgeError.message);
    }

    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Certified realtors directory (what residents see on the Sell screen)
// ---------------------------------------------------------------------------

app.get(
  '/api/realtors',
  asyncRoute(async (req, res) => {
    const { communityId } = req.query;
    let query = supabase.from('realtors').select('*').order('created_at', { ascending: false });
    if (communityId) query = query.eq('community_id', communityId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  })
);

app.post(
  '/api/realtors',
  asyncRoute(async (req, res) => {
    const { communityId, name, tag, dealsNote, phone, email } = req.body || {};
    if (!communityId || !name?.trim()) return res.status(400).json({ error: 'Community and name are required' });
    const { error } = await supabase.from('realtors').insert({
      community_id: communityId,
      name: name.trim(),
      tag: (tag || '').trim(),
      deals_note: (dealsNote || '').trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
    });
    if (error) throw error;
    res.json({ ok: true });
  })
);

app.delete(
  '/api/realtors/:id',
  asyncRoute(async (req, res) => {
    const { error } = await supabase.from('realtors').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Local businesses (resident shoutouts + admin-curated sponsored/paid spots)
// ---------------------------------------------------------------------------

app.get(
  '/api/businesses',
  asyncRoute(async (req, res) => {
    const { communityId } = req.query;
    let query = supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (communityId) query = query.eq('community_id', communityId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  })
);

app.post(
  '/api/businesses',
  asyncRoute(async (req, res) => {
    const { communityId, name, category, description, phone, website, address } = req.body || {};
    if (!communityId || !name?.trim()) return res.status(400).json({ error: 'Community and name are required' });
    const { error } = await supabase.from('businesses').insert({
      community_id: communityId,
      name: name.trim(),
      category: (category || '').trim(),
      description: (description || '').trim(),
      phone: (phone || '').trim(),
      website: (website || '').trim(),
      address: (address || '').trim(),
      is_sponsored: true,
    });
    if (error) throw error;
    res.json({ ok: true });
  })
);

app.post(
  '/api/businesses/:id/sponsor',
  asyncRoute(async (req, res) => {
    const { isSponsored } = req.body || {};
    const { error } = await supabase.from('businesses').update({ is_sponsored: !!isSponsored }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  })
);

app.delete(
  '/api/businesses/:id',
  asyncRoute(async (req, res) => {
    const { error } = await supabase.from('businesses').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Moderation log (read-only oversight across all communities)
// ---------------------------------------------------------------------------

app.get(
  '/api/moderation-log',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase
      .from('moderation_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json(data || []);
  })
);

// ---------------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------------

app.use(express.static(path.join(__dirname, 'public')));

const port = Number(PORT) || 4287;
app.listen(port, '127.0.0.1', () => {
  console.log(`OneBlock admin dashboard running at http://localhost:${port}`);
  console.log('This server holds the Supabase service role key — do not expose it beyond your own machine.');
});
