let communities = [];

async function api(path, options) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function randomCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return prefix ? `${prefix}-${out}` : out;
}

function setMsg(el, text, ok) {
  el.textContent = text;
  el.className = `msg ${ok ? 'ok' : 'error'}`;
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Auth + tabs
// ---------------------------------------------------------------------------

async function checkSession() {
  const { authed } = await api('/session');
  if (authed) showApp();
  else showLogin();
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  loadAll();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    await api('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await api('/logout', { method: 'POST' });
  showLogin();
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

async function loadAll() {
  await loadCommunities();
  loadResidents();
  loadRealtorAccounts();
  loadRealtorKeys();
  loadRealtorsDirectory();
  loadBusinesses();
  loadModerationLog();
}

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

function fillCommunitySelects() {
  const selects = [
    document.getElementById('add-houses-community'),
    document.getElementById('residents-community'),
    document.getElementById('realtors-directory-community'),
    document.getElementById('businesses-community'),
  ];
  for (const select of selects) {
    const current = select.value;
    select.innerHTML = communities.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    if (current) select.value = current;
  }
}

async function loadCommunities() {
  communities = await api('/communities');
  const tbody = document.querySelector('#communities-table tbody');
  tbody.innerHTML = communities
    .map(
      (c) => `<tr>
        <td>${c.name}</td>
        <td><code>${c.signupKey}</code></td>
        <td>${c.householdCount}</td>
        <td>${c.eventsPerMonth}</td>
        <td>${c.score ?? '–'}</td>
      </tr>`
    )
    .join('');
  fillCommunitySelects();
}

document.getElementById('generate-key-btn').addEventListener('click', () => {
  document.getElementById('community-signup-key').value = randomCode();
});

document.getElementById('create-community-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('create-community-msg');
  try {
    const result = await api('/communities', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('community-name').value,
        signupKey: document.getElementById('community-signup-key').value,
        houses: document.getElementById('community-houses').value,
      }),
    });
    setMsg(msg, `Created "${result.community.name}" with ${result.housesAdded} house(s).`, true);
    e.target.reset();
    await loadCommunities();
  } catch (err) {
    setMsg(msg, err.message, false);
  }
});

document.getElementById('add-houses-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('add-houses-msg');
  const communityId = document.getElementById('add-houses-community').value;
  try {
    const result = await api(`/communities/${communityId}/houses`, {
      method: 'POST',
      body: JSON.stringify({ houses: document.getElementById('add-houses-lines').value }),
    });
    setMsg(msg, `Added ${result.housesAdded} house(s).`, true);
    e.target.reset();
    await loadCommunities();
  } catch (err) {
    setMsg(msg, err.message, false);
  }
});

// ---------------------------------------------------------------------------
// Residents & HOA
// ---------------------------------------------------------------------------

async function loadResidents() {
  const communityId = document.getElementById('residents-community').value;
  const q = document.getElementById('residents-search').value;
  const params = new URLSearchParams();
  if (communityId) params.set('communityId', communityId);
  if (q) params.set('q', q);
  const rows = await api(`/profiles?${params}`);
  const tbody = document.querySelector('#residents-table tbody');
  tbody.innerHTML = rows
    .map(
      (p) => `<tr>
        <td>${p.name || '(no name yet)'}</td>
        <td>${p.street || ''}</td>
        <td><span class="pill ${p.isBoardMember ? 'on' : 'off'}">${p.isBoardMember ? 'Board member' : 'Resident'}</span></td>
        <td>
          <button class="row-btn ghost-btn" data-toggle-board="${p.id}" data-current="${p.isBoardMember}">${p.isBoardMember ? 'Remove from board' : 'Make HOA board'}</button>
          <button class="row-btn danger-btn" data-delete-profile="${p.id}" data-name="${p.name || 'this resident'}">Delete</button>
        </td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-toggle-board]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggleBoard;
      const next = btn.dataset.current !== 'true';
      btn.disabled = true;
      try {
        await api(`/profiles/${id}/board`, { method: 'POST', body: JSON.stringify({ isBoardMember: next }) });
        await loadResidents();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
  tbody.querySelectorAll('[data-delete-profile]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Delete ${btn.dataset.name}? This deletes their login and all their data (asks, posts, messages, RSVPs). Their house reverts to unclaimed.`)) return;
      btn.disabled = true;
      try {
        await api(`/profiles/${btn.dataset.deleteProfile}`, { method: 'DELETE' });
        await loadResidents();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
}

document.getElementById('residents-community').addEventListener('change', loadResidents);
let residentsSearchTimer;
document.getElementById('residents-search').addEventListener('input', () => {
  clearTimeout(residentsSearchTimer);
  residentsSearchTimer = setTimeout(loadResidents, 250);
});

// ---------------------------------------------------------------------------
// Realtor accounts
// ---------------------------------------------------------------------------

async function loadRealtorAccounts() {
  const rows = await api('/realtor-accounts');
  const tbody = document.querySelector('#realtor-accounts-table tbody');
  tbody.innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.tag || ''}</td>
        <td><button class="row-btn danger-btn" data-delete-account="${r.id}">Revoke</button></td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-delete-account]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Revoke this realtor account? This deletes their login entirely.')) return;
      await api(`/realtor-accounts/${btn.dataset.deleteAccount}`, { method: 'DELETE' });
      await loadRealtorAccounts();
    });
  });
}

// ---------------------------------------------------------------------------
// Realtor signup keys
// ---------------------------------------------------------------------------

async function loadRealtorKeys() {
  const rows = await api('/realtor-signup-keys');
  const tbody = document.querySelector('#realtor-keys-table tbody');
  tbody.innerHTML = rows
    .map(
      (k) => `<tr>
        <td><code>${k.key}</code></td>
        <td>${k.label || ''}</td>
        <td><button class="row-btn danger-btn" data-delete-key="${k.id}">Delete</button></td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-delete-key]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this realtor signup code?')) return;
      await api(`/realtor-signup-keys/${btn.dataset.deleteKey}`, { method: 'DELETE' });
      await loadRealtorKeys();
    });
  });
}

document.getElementById('generate-realtor-key-btn').addEventListener('click', () => {
  document.getElementById('realtor-key-code').value = randomCode('REALTOR');
});

document.getElementById('create-realtor-key-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('create-realtor-key-msg');
  try {
    await api('/realtor-signup-keys', {
      method: 'POST',
      body: JSON.stringify({
        key: document.getElementById('realtor-key-code').value,
        label: document.getElementById('realtor-key-label').value,
      }),
    });
    setMsg(msg, 'Code created.', true);
    e.target.reset();
    await loadRealtorKeys();
  } catch (err) {
    setMsg(msg, err.message, false);
  }
});

// ---------------------------------------------------------------------------
// Certified realtors directory
// ---------------------------------------------------------------------------

async function loadRealtorsDirectory() {
  const communityId = document.getElementById('realtors-directory-community').value;
  if (!communityId) return;
  const rows = await api(`/realtors?communityId=${communityId}`);
  const tbody = document.querySelector('#realtors-directory-table tbody');
  tbody.innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${r.name}</td>
        <td>${r.tag || ''}</td>
        <td>${r.deals_note || ''}</td>
        <td><button class="row-btn danger-btn" data-delete-directory="${r.id}">Remove</button></td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-delete-directory]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this realtor from the directory?')) return;
      await api(`/realtors/${btn.dataset.deleteDirectory}`, { method: 'DELETE' });
      await loadRealtorsDirectory();
    });
  });
}

document.getElementById('realtors-directory-community').addEventListener('change', loadRealtorsDirectory);

document.getElementById('create-realtor-directory-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('create-realtor-directory-msg');
  const communityId = document.getElementById('realtors-directory-community').value;
  if (!communityId) return setMsg(msg, 'Create a community first.', false);
  try {
    await api('/realtors', {
      method: 'POST',
      body: JSON.stringify({
        communityId,
        name: document.getElementById('directory-name').value,
        tag: document.getElementById('directory-tag').value,
        dealsNote: document.getElementById('directory-deals').value,
        phone: document.getElementById('directory-phone').value,
        email: document.getElementById('directory-email').value,
      }),
    });
    setMsg(msg, 'Added to directory.', true);
    e.target.reset();
    await loadRealtorsDirectory();
  } catch (err) {
    setMsg(msg, err.message, false);
  }
});

// ---------------------------------------------------------------------------
// Local businesses (resident shoutouts + admin-curated sponsored spots)
// ---------------------------------------------------------------------------

async function loadBusinesses() {
  const communityId = document.getElementById('businesses-community').value;
  if (!communityId) return;
  const rows = await api(`/businesses?communityId=${communityId}`);
  const tbody = document.querySelector('#businesses-table tbody');
  tbody.innerHTML = rows
    .map(
      (b) => `<tr>
        <td>${b.name}</td>
        <td>${b.category || ''}</td>
        <td><span class="pill ${b.is_sponsored ? 'on' : 'off'}">${b.is_sponsored ? 'Sponsored' : 'Organic'}</span></td>
        <td>
          <button class="row-btn ghost-btn" data-toggle-sponsor="${b.id}" data-current="${b.is_sponsored}">${b.is_sponsored ? 'Unmark sponsored' : 'Mark sponsored'}</button>
          <button class="row-btn danger-btn" data-delete-business="${b.id}">Remove</button>
        </td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-toggle-sponsor]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggleSponsor;
      const next = btn.dataset.current !== 'true';
      btn.disabled = true;
      try {
        await api(`/businesses/${id}/sponsor`, { method: 'POST', body: JSON.stringify({ isSponsored: next }) });
        await loadBusinesses();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
  tbody.querySelectorAll('[data-delete-business]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this business listing?')) return;
      await api(`/businesses/${btn.dataset.deleteBusiness}`, { method: 'DELETE' });
      await loadBusinesses();
    });
  });
}

document.getElementById('businesses-community').addEventListener('change', loadBusinesses);

document.getElementById('create-business-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('create-business-msg');
  const communityId = document.getElementById('businesses-community').value;
  if (!communityId) return setMsg(msg, 'Create a community first.', false);
  try {
    await api('/businesses', {
      method: 'POST',
      body: JSON.stringify({
        communityId,
        name: document.getElementById('business-name').value,
        category: document.getElementById('business-category').value,
        description: document.getElementById('business-description').value,
        phone: document.getElementById('business-phone').value,
        website: document.getElementById('business-website').value,
        address: document.getElementById('business-address').value,
      }),
    });
    setMsg(msg, 'Added as a sponsored listing.', true);
    e.target.reset();
    await loadBusinesses();
  } catch (err) {
    setMsg(msg, err.message, false);
  }
});

// ---------------------------------------------------------------------------
// Moderation log
// ---------------------------------------------------------------------------

async function loadModerationLog() {
  const rows = await api('/moderation-log');
  const communityName = (id) => communities.find((c) => c.id === id)?.name || id;
  const tbody = document.querySelector('#moderation-table tbody');
  tbody.innerHTML = rows
    .map(
      (m) => `<tr>
        <td>${communityName(m.community_id)}</td>
        <td>${m.entity_type}</td>
        <td>${m.summary}</td>
        <td>${timeAgo(m.created_at)}</td>
      </tr>`
    )
    .join('');
}

checkSession();
