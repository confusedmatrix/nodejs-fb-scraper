#!/usr/bin/env node
'use strict';

import { ArgumentParser } from 'argparse';
import fb from 'fb';

// Set the Graph API version
fb.options({version: 'v2.7'});

import {
  appId,
  appSecret,
  pages,
  postsSince,
  postsPerRequest,
  postsPerRun,
  commentsPerRequest,
  commentsPerPostPerRun,
} from './config';
import {
  auth,
  recursivePosts,
  recursiveComments,
  recursiveCommentReplies,
  reactions,
} from './fb';
import {
  closeDbConnection,
  schema,
  getPosts,
  getNumPostComments,
  savePost,
  savePostReactions,
  getTopLevelComments,
  getNumCommentReplies,
  saveComment,
} from './db';

const parser = new ArgumentParser({});

parser.addArgument('command', {
  help: 'The command you wish to run (e.g. schema:create)',
});

parser.addArgument('--page', {
  help: 'The page name (required for the run command)',
  choices: pages.map(page => page.name),
});

const args = parser.parseArgs();

const page = pages.find(page => page.name === args.page);

switch (args.command) {
  case 'schema:create':
    schema.create().catch(err => console.log(err));
    closeDbConnection();
    break;
  case 'schema:drop':
    schema.drop().catch(err => console.log(err));
    closeDbConnection();
    break;
  case 'run:posts':
    if (args.page && !page) {
      console.log('Page (' + args.page + ') not recognised');
      process.exit(1);
    }
    // Authenticate with the graph API
    auth(appId, appSecret).then(accessToken => {
      fb.setAccessToken(accessToken);
    }).then(() => {
      // fetch posts
      return recursivePosts(page.id, postsPerRun, {
        limit: postsPerRequest, // posts per request
        since: postsSince,
      });
    })
    .catch(err => console.log(err))
    .then(posts => {
      // save posts
      return Promise.all(
        posts.map(post => {
          post.page_id = page.id;
          return new Promise((resolve, reject) => {
            savePost(post).then(() => resolve(post));
          });
        })
      );
    }).catch(error => {
      console.log('ERROR:', error);
    }).then(() => {
      closeDbConnection();
    });
    break;
  case 'run:reactions':
    if (args.page && !page) {
      console.log('Page (' + args.page + ') not recognised');
      process.exit(1);
    }
    // Authenticate with the graph API
    auth(appId, appSecret).then(accessToken => {
      fb.setAccessToken(accessToken);
    }).then(() => {
      // fetch posts from DB
      return getPosts(page.id, postsPerRun, {
        limit: postsPerRequest, // posts per request
        since: 0
      });
    }).then(posts => {
      // fetch reactions for each post
      return new Promise((resolve, reject) => {
        const nextPost = post => {
          if (posts.length < 1) return resolve();
          reactions(post.id)
          .then(reactions => {
            post.reactions = reactions;
            savePostReactions(post.id, post.reactions).then(() => {
              nextPost(posts.shift());
            });
          })
          .catch(err => {
            console.log(post.id, err)
            nextPost(posts.shift());
          });
        };

        nextPost(posts.shift());
      })
      .then(() => {
        closeDbConnection();
      });
    });
    break;
  case 'run:comments':
    if (args.page && !page) {
      console.log('Page (' + args.page + ') not recognised');
      process.exit(1);
    }
    // Authenticate with the graph API
    auth(appId, appSecret).then(accessToken => {
      fb.setAccessToken(accessToken);
    }).then(() => {
      // fetch posts from DB
      return getPosts(page.id, postsPerRun, {
        limit: postsPerRequest, // posts per request
        since: 0
      });
    }).then(posts => {
      // fetch comments for each post
      return new Promise((resolve, reject) => {
        const nextPost = post => {
          if (posts.length < 1) return resolve();
          getNumPostComments(post.id)
          .then(offset => {
            return recursiveComments(post.id, commentsPerPostPerRun, {
              limit: commentsPerRequest,
              offset
            });
          })
          .then(comments => {
            return Promise.all(
              comments.map(comment => saveComment(comment))
            );
          })
          .then(() => {
            nextPost(posts.shift());
          })
          .catch(err => {
            console.log(post.id, err)
            nextPost(posts.shift());
          });
        }

        nextPost(posts.shift());
      })
      .then(() => {
        closeDbConnection();
      });
    });
    break;
  case 'run:replies':
    // Authenticate with the graph API
    auth(appId, appSecret).then(accessToken => {
      fb.setAccessToken(accessToken);
    }).then(() => {
      // fetch comments from DB
      return getTopLevelComments();
    }).then(comments => {
      // fetch replies for each comment
      return new Promise((resolve, reject) => {
        const nextComment = comment => {
          if (comments.length < 1) return resolve();
          getNumCommentReplies(comment.id)
          .then(offset => {
            return recursiveCommentReplies(comment.id, comment.post_id, commentsPerPostPerRun, {
              limit: commentsPerRequest,
              offset
            });
          })
          .then(replies => {
            return Promise.all(
              replies.map(reply => saveComment(reply))
            );
          })
          .then(() => {
            nextComment(comments.shift());
          })
          .catch(err => {
            console.log(post.id, err)
            nextComment(comments.shift());
          });
        }

        nextComment(comments.shift());
      })
      .then(() => {
        closeDbConnection();
      });
    });
    break;
  default:
    console.log('command not recognised');
}
