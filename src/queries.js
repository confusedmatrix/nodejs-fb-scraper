export const schemaCreateQuery = `
CREATE TABLE IF NOT EXISTS posts (
  id text PRIMARY KEY,
  page_id text,
  caption text,
  description text,
  link text,
  message text,
  message_tags jsonb,
  name text,
  picture text,
  properties jsonb,
  reactions_like integer,
  reactions_love integer,
  reactions_wow integer,
  reactions_haha integer,
  reactions_sad integer,
  reactions_angry integer,
  shares text,
  source text,
  type text,
  created_time timestamp,
  retrieved_time timestamp
);

CREATE TABLE IF NOT EXISTS comments (
  id text PRIMARY KEY,
  post_id text,
  user_id text,
  like_count smallint,
  message text,
  message_tags jsonb,
  parent text,
  created_time timestamp,
  retrieved_time timestamp
);
`;

export const schemaDropQuery = `
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS comments;
`;

export const selectPostsQuery = `
SELECT id FROM posts
WHERE page_id = $1;
`;

export const insertPostQuery = `
INSERT INTO posts (
  id, page_id, caption, description, link, message, message_tags, name, picture,
  properties, shares, source, type, created_time, retrieved_time
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
) ON CONFLICT (id) DO UPDATE SET shares = $10;
`;

export const updatePostReactionsQuery = `
UPDATE posts SET
  reactions_like = $2,
  reactions_love = $3,
  reactions_wow = $4,
  reactions_haha = $5,
  reactions_sad = $6,
  reactions_angry = $7
WHERE id = $1;
`;

export const selectTopLevelCommentsQuery = `
SELECT * FROM comments
WHERE parent IS NULL;
`;

export const selectNumPostComments = `
SELECT COUNT(*) AS count FROM comments
WHERE post_id = $1;
`;

export const selectNumCommentReplies = `
SELECT COUNT(*) as count FROM comments
WHERE parent = $1;
`;

export const insertCommentQuery = `
INSERT INTO comments (
  id, post_id, user_id, like_count, message, message_tags,
  parent, created_time, retrieved_time
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
) ON CONFLICT DO NOTHING;
`;
