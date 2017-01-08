export const appId = '';
export const appSecret = '';

export const pages = [
  {
    id: '20531316728',
    name: 'facebook'
  }
];

export const postsSince = new Date('2015-11-01 00:00:00').getTime() / 1000; // (unix timestamp) - will only get posts after this date
export const postsPerRequest = 100; // Number of posts to get per Facebook API request (max 100)
export const postsPerRun = 10000; // Maximum number of posts to get per run
export const commentsPerRequest = 100; // Number of comments to get per Facebook API request (max 100)
export const commentsPerPostPerRun = 10000; // Maximum number of comments to get per run
