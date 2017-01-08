require('dotenv').config({path: __dirname + '/.env'});
const debug = require('debug')('db');

import { Pool } from 'pg';
import {
  schemaCreateQuery,
  schemaDropQuery,
  selectPostsQuery,
  selectPostsWithoutLikesQuery,
  selectNumPostComments,
  insertPostQuery,
  updatePostReactionsQuery,
  selectTopLevelCommentsQuery,
  selectNumCommentReplies,
  insertCommentQuery,
} from './queries';

export const client = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export const closeDbConnection = () => client.end();

export const schema = {
  create: () => {
    return client.query(schemaCreateQuery).then(() => {
      console.log('schema created!');
    }).catch(err => console.log(err));
  },
  drop: () => {
    return client.query(schemaDropQuery).then(() => {
      console.log('schema dropped!');
    }).catch(err => console.log(err));
  }
};

export const getPosts = pageId => {
  debug('getting posts');
  return client.query(selectPostsQuery, [
    pageId
  ]).then(res => res.rows).catch(err => console.log(err));
}

export const getPostsWithoutLikes = pageId => {
  debug('getting posts');
  return client.query(selectPostsWithoutLikesQuery, [
    pageId
  ]).then(res => res.rows).catch(err => console.log(err));
}

export const getNumPostComments = postId => {
  debug('getting number of post comments');
  return client.query(selectNumPostComments, [
    postId
  ])
  .then(res => res.rows[0].count)
  .catch(err => console.log(err));
}

export const savePost = post => {
  debug('saving post');
  return client.query(insertPostQuery, [
    post.id,
    post.page_id,
    post.caption,
    post.description,
    post.link,
    post.message,
    JSON.stringify(post.message_tags),
    post.name,
    post.picture,
    JSON.stringify(post.properties),
    post.shares,
    post.source,
    post.type,
    new Date(post.created_time),
    new Date(),
  ]).then(() => {
    console.log(`post with ID ${post.id} inserted`);
  }).catch(err => console.log(err));
};

export const savePostReactions = (postId, reactions) => {
  debug('saving post reactions');
  return client.query(updatePostReactionsQuery, [
    postId,
    reactions.like,
    reactions.love,
    reactions.wow,
    reactions.haha,
    reactions.sad,
    reactions.angry
  ]).then(() => {
    console.log(`updated reactions for post with ID ${postId}`);
  }).catch(err => console.log(err));
};

export const getTopLevelComments = () => {
  debug('getting top level comments');
  return client.query(selectTopLevelCommentsQuery)
  .then(res => res.rows)
  .catch(err => console.log(err));
}

export const getNumCommentReplies = commentId => {
  debug('getting number of comment replies');
  return client.query(selectNumCommentReplies, [
    commentId
  ])
  .then(res => res.rows[0].count)
  .catch(err => console.log(err));
}

export const saveComment = comment => {
  debug('saving comment');
  return client.query(insertCommentQuery, [
    comment.id,
    comment.post_id,
    comment.from,
    comment.like_count,
    comment.message,
    JSON.stringify(comment.message_tags),
    comment.parent,
    new Date(comment.created_time),
    new Date(),
  ]).then(res => {
    console.log(`comment with ID ${comment.id} inserted`);
  }).catch(err => console.log(err));
};
