-- OneBlock — first community seed: Kings River Point
-- Run this once in the Supabase SQL Editor, after schema.sql and migration_002.
-- Addresses hand-verified against actual rooftops (long-pressed in Google Maps),
-- not geocoded from the address string — the original geocoded coordinates were
-- consistently off by 20-60m from the real houses.
-- Signup key: set your own below before running (never commit the real key).

with new_community as (
  insert into public.communities (name, signup_key)
  values ('Kings River Point', 'REPLACE_WITH_SIGNUP_KEY')
  returning id
)
insert into public.houses (id, community_id, address, latitude, longitude)
select v.id, nc.id, v.address, v.latitude, v.longitude
from new_community nc
cross join (
  values
    ('21203', '21203 Kings River Point', 30.028122410431518, -95.15802655333495),
    ('21211', '21211 Kings River Point', 30.028272690432726, -95.15766275344467),
    ('21219', '21219 Kings River Point', 30.028639125644993, -95.15737504242033),
    ('21226', '21226 Kings River Point', 30.02873990038138, -95.15633961245697),
    ('21210', '21210 Kings River Point', 30.027900077957057, -95.15694466477237),
    ('21126', '21126 Kings River Point', 30.027379692972342, -95.15748023359392)
) as v(id, address, latitude, longitude);
