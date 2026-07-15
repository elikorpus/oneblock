-- Neighborly — first community seed: Kings River Point
-- Run this once in the Supabase SQL Editor, after schema.sql and migration_002.
-- Addresses geocoded against "The Lakes at Kings River Estates", Atascocita, TX 77346.
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
    ('21203', '21203 Kings River Point', 30.0273424, -95.1582732),
    ('21211', '21211 Kings River Point', 30.0273998, -95.1581991),
    ('21219', '21219 Kings River Point', 30.0274568, -95.1581245),
    ('21226', '21226 Kings River Point', 30.0282536, -95.1571103),
    ('21210', '21210 Kings River Point', 30.0279100, -95.1573379),
    ('21126', '21126 Kings River Point', 30.0267979, -95.1584895)
) as v(id, address, latitude, longitude);
