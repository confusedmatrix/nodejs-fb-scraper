const debug = require('debug')('fb');

import fb from 'fb';
import url from 'url';

const reactionTypes = [
  'LIKE',
  'LOVE',
  'WOW',
  'HAHA',
  'SAD',
  'ANGRY',
];

const query = (endpoint, options = {}, transform) => {
  return new Promise((resolve, reject) => {
    fb.api(endpoint, options, res => {
      if (!res || res.error)
        return reject(!res ? 'error occurred' : res.error);

      res = transform ? transform(res) : res;
      return resolve(res);
    });
  });
};

// untested. See https://www.npmjs.com/package/fb#batch-requests
const batch = (queries = [], transform) => {
  return new Promise((resolve, reject) => {
    fb.api('', 'post', {
      batch: queries
    }, res => {
      if (!res || res.error)
        return reject(!res ? 'error occurred' : res.error);

      res = transform ? transform(res) : res;
      return resolve(res);
    });
  });
};

export const auth = (appId, appSecret) => {
  return query('oauth/access_token', {
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'client_credentials',
  }, res => {
    return res.access_token;
  });
};

const posts = (pageId, params) => {
  debug('Getting posts');
  return query(pageId + '/posts', {
    fields: [
      'id',
      'caption',
      'created_time',
      'description',
      'link',
      'message',
      'message_tags',
      'name',
      'picture',
      'properties',
      'shares',
      'source',
      'type',
    ],
    limit: params.limit,
    since: params.since,
    until: params.until,
    __paging_token: params.__paging_token,
  }, res => {
    res.data = res.data.map(post => {
      post.shares = !post.shares || !post.shares.count ? 0 : post.shares.count;
      return post;
    });
    return res;
  });
};

export const recursivePosts = (pageId, max, params) => {
  return new Promise((resolve, reject) => {
    let allPosts = [];
    const getPosts = (params) => {
      // Only resolve promise when we have enough results
      if (allPosts.length >= max || params == null) return resolve(allPosts);

      posts(pageId, params).then(res => {
        if (res.data.length < 1) return getPosts(null);
        allPosts = allPosts.concat(res.data);
        const nextLink = res.paging.next;
        const nextParams = nextLink ? url.parse(nextLink, true).query : null
        getPosts(nextParams);
      }).catch(err => console.log(err));
    };

    getPosts(params);
  });
};

const comments = (postId, params) => {
  debug('Getting comments');
  return query(postId + '/comments', {
    fields: [
      'id',
      'created_time',
      'from',
      'like_count',
      'message',
      'message_tags',
    ],
    order: 'chronological',
    limit: params.limit,
    offset: params.offset || 0,
    after: params.after,
  }, res => {
    res.data = res.data.map(comment => {
      comment.post_id = postId;
      comment.parent = null;
      return comment;
    });
    return res;
  });
};

export const recursiveComments = (postId, max, params) => {
  return new Promise((resolve, reject) => {

    let allComments = [];
    const getComments = (params) => {
      // Only resolve promise when we have enough results
      if (allComments.length >= max || params == null) return resolve(allComments);

      comments(postId, params).then(res => {
        if (res.data.length < 1) return getComments(null);
        allComments = allComments.concat(res.data);
        const nextLink = res.paging.next;
        const nextParams = nextLink ? url.parse(nextLink, true).query : null
        getComments(nextParams);
      }).catch(err => {
        console.log(err);
        resolve(allComments);
      });
    };

    getComments(params);
  });
};

const commentReplies = (commentId, postId, params) => {
  debug('Getting comments');
  return query(commentId + '/comments', {
    fields: [
      'id',
      'created_time',
      'from',
      'like_count',
      'message',
      'message_tags',
    ],
    order: 'chronological',
    limit: params.limit,
    offset: params.offset || 0,
    after: params.after,
  }, res => {
    res.data = res.data.map(comment => {
      comment.post_id = postId;
      comment.parent = commentId;
      return comment;
    });
    return res;
  });
};

export const recursiveCommentReplies = (commentId, postId, max, params) => {
  return new Promise((resolve, reject) => {

    let allReplies = [];
    const getCommentReplies = (params) => {
      // Only resolve promise when we have enough results
      if (allReplies.length >= max || params == null) return resolve(allReplies);

      commentReplies(commentId, postId, params).then(res => {
        if (res.data.length < 1) return getCommentReplies(null);
        allReplies = allReplies.concat(res.data);
        const nextLink = res.paging.next;
        const nextParams = nextLink ? url.parse(nextLink, true).query : null
        getCommentReplies(nextParams);
      }).catch(err => {
        console.log(err);
        resolve(allReplies);
      });
    };

    getCommentReplies(params);
  });
};

export const reactions = postId => {
  debug('Getting reactions');
  return Promise.all(
    reactionTypes.map(type => {
      return reaction(postId, type)
    })
  ).then(reactions => {
    return reactions.reduce((allReactions, reaction) => {
      allReactions[reaction.type.toLowerCase()] = reaction.count;
      return allReactions;
    }, {});
  });
};

const reaction = (postId, type) => {
  debug('Getting ' + type + ' reactions');
  return query(postId + '/reactions', {
    type,
    summary: true,
  }, res => {
    return {
      type,
      count: res.hasOwnProperty('summary') ? res.summary.total_count : null,
    }
  });
};
