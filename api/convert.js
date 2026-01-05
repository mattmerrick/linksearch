/**
 * Vercel serverless function for Reddit JSON conversion
 * Uses Reddit's official OAuth API for reliable, compliant access
 * 
 * Setup required:
 * 1. Create a Reddit app at https://www.reddit.com/prefs/apps
 * 2. Set app type to "script" (correct for public web apps where users don't log in)
 * 3. Set environment variables:
 *    - REDDIT_CLIENT_ID: Your app's client ID (under the app name)
 *    - REDDIT_CLIENT_SECRET: Your app's secret
 *    - REDDIT_USER_AGENT: A unique identifier (e.g., "YourAppName/1.0 by YourUsername")
 * 
 * Note: "script" type is correct even for public web apps because:
 * - Users don't need to authenticate with Reddit
 * - Your server makes API calls on behalf of all users
 * - "web app" type is only needed if users must log in with their Reddit accounts
 */

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    // Check for required environment variables
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const userAgent = process.env.REDDIT_USER_AGENT || 'RedditConverter/1.0';

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        error: 'Reddit API credentials not configured. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables.'
      });
    }

    // Parse request body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      res.status(400).json({ success: false, error: 'Invalid JSON in request body' });
      return;
    }
    
    const { url } = body || {};

    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    // Extract post ID from URL
    const postId = extractPostId(url.trim());
    if (!postId) {
      return res.status(400).json({ success: false, error: 'Invalid Reddit URL. Please provide a valid Reddit post URL.' });
    }

    // Get OAuth access token
    const accessToken = await getRedditAccessToken(clientId, clientSecret, userAgent);

    // Fetch post data using Reddit OAuth API
    const redditData = await fetchRedditPost(postId, accessToken, userAgent);

    // Extract post info and comments
    const postInfo = extractPostInfo(redditData);
    const comments = extractComments(redditData);

    // Sort comments by upvotes
    const sortedComments = sortCommentsByUpvotes(comments);

    // Format output
    const output = formatOutput(postInfo, sortedComments);

    res.status(200).json({
      success: true,
      output: output,
      post_info: postInfo,
      comment_count: sortedComments.length
    });
    return;

  } catch (error) {
    console.error('Error in convert API:', error);
    const errorMessage = error.message || 'An error occurred while processing the URL';
    console.error('Error details:', errorMessage, error.stack);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
    return;
  }
}

/**
 * Extract Reddit post ID from URL
 * Supports formats like:
 * - https://www.reddit.com/r/subreddit/comments/abc123/title/
 * - https://old.reddit.com/r/subreddit/comments/abc123/title/
 * - /r/subreddit/comments/abc123/title/
 */
function extractPostId(url) {
  try {
    // Normalize URL
    let normalized = url.trim();
    
    // If it's a relative URL, make it absolute
    if (normalized.startsWith('/r/') || normalized.startsWith('/comments/')) {
      normalized = 'https://www.reddit.com' + normalized;
    }
    
    // Replace old.reddit.com with www.reddit.com
    normalized = normalized.replace(/https?:\/\/(old|np)\.reddit\.com/, 'https://www.reddit.com');
    
    // Ensure we're using https
    normalized = normalized.replace(/^http:\/\//, 'https://');
    
    // Remove .json if present
    normalized = normalized.replace(/\.json$/, '');
    
    // Extract post ID from URL pattern: /comments/{postId}/
    const match = normalized.match(/\/comments\/([a-z0-9]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting post ID:', error);
    return null;
  }
}

/**
 * Get OAuth access token from Reddit
 * Uses client credentials flow (no user authentication needed for read-only access)
 */
async function getRedditAccessToken(clientId, clientSecret, userAgent) {
  try {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OAuth error:', response.status, errorText);
      throw new Error(`Failed to get Reddit access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error(`Failed to authenticate with Reddit API: ${error.message}`);
  }
}

/**
 * Fetch Reddit post data using OAuth API
 * The comments endpoint returns both post and comments in the same format as the JSON endpoint
 */
async function fetchRedditPost(postId, accessToken, userAgent) {
  try {
    // First, get the post to find the subreddit
    const postInfoUrl = `https://oauth.reddit.com/api/info.json?id=t3_${postId}`;
    const postInfoResponse = await fetch(postInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': userAgent,
        'Accept': 'application/json'
      }
    });

    if (!postInfoResponse.ok) {
      const errorText = await postInfoResponse.text();
      console.error('Reddit API error:', postInfoResponse.status, errorText);
      
      if (postInfoResponse.status === 403) {
        throw new Error('Access denied. Please check your Reddit API credentials.');
      }
      if (postInfoResponse.status === 404) {
        throw new Error('Post not found. Please check the Reddit URL.');
      }
      if (postInfoResponse.status === 429) {
        throw new Error('Reddit rate limit exceeded. Please wait a few minutes and try again.');
      }
      
      throw new Error(`Reddit API error: ${postInfoResponse.status} ${postInfoResponse.statusText}`);
    }

    const postInfoData = await postInfoResponse.json();
    
    if (!postInfoData.data || !postInfoData.data.children || postInfoData.data.children.length === 0) {
      throw new Error('Post not found or inaccessible');
    }

    const post = postInfoData.data.children[0].data;
    const subreddit = post.subreddit;
    
    // Fetch post with comments using the comments endpoint
    // This returns data in the same format as www.reddit.com/.../comments/{id}.json
    const commentsUrl = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;
    const commentsResponse = await fetch(commentsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': userAgent,
        'Accept': 'application/json'
      }
    });

    if (!commentsResponse.ok) {
      // If comments fail, return just the post data in expected format
      console.warn('Failed to fetch comments, returning post only');
      return [postInfoData, { data: { children: [] } }];
    }

    const commentsData = await commentsResponse.json();
    
    // Return in the same format as the old JSON endpoint (array with [post, comments])
    return commentsData;
  } catch (error) {
    console.error('Error fetching Reddit post:', error);
    throw new Error(`Error fetching Reddit data: ${error.message}`);
  }
}

function extractPostInfo(data) {
  if (!data || !Array.isArray(data) || data.length < 1) {
    throw new Error('Invalid Reddit data structure: missing post data');
  }

  if (!data[0] || !data[0].data || !data[0].data.children || data[0].data.children.length < 1) {
    throw new Error('Invalid Reddit data structure: missing post children');
  }

  const postData = data[0].data.children[0].data;
  return {
    title: postData.title || '',
    selftext: postData.selftext || '',
    author: postData.author || '',
    score: postData.score || 0,
    url: postData.url || ''
  };
}

function extractComments(data) {
  const comments = [];

  if (!data || !Array.isArray(data) || data.length < 2) {
    return comments;
  }

  function traverseComments(commentTree) {
    if (!commentTree || !commentTree.data) {
      return;
    }

    const commentData = commentTree.data;

    // Skip "more" objects and deleted comments
    if (commentData.kind === 'more' || 
        !commentData.body || 
        commentData.body === '[deleted]' || 
        commentData.body === '[removed]') {
      if (commentData.replies && commentData.replies.data) {
        for (const reply of commentData.replies.data.children || []) {
          traverseComments(reply);
        }
      }
      return;
    }

    // Extract comment information
    const comment = {
      body: commentData.body || '',
      author: commentData.author || '[deleted]',
      score: commentData.score || 0,
      upvotes: commentData.ups || 0,
      downvotes: commentData.downs || 0,
      created_utc: commentData.created_utc || 0,
      is_submitter: commentData.is_submitter || false,
      permalink: commentData.permalink || ''
    };

    // Only add comments with actual content
    if (comment.body) {
      comments.push(comment);
    }

    // Recursively process replies
    if (commentData.replies && commentData.replies.data) {
      for (const reply of commentData.replies.data.children || []) {
        traverseComments(reply);
      }
    }
  }

  // Start traversing from the second item (comments section)
  if (!data[1] || !data[1].data || !data[1].data.children) {
    return comments; // No comments section
  }

  const commentsSection = data[1].data.children;
  for (const commentTree of commentsSection) {
    traverseComments(commentTree);
  }

  return comments;
}

function sortCommentsByUpvotes(comments) {
  return [...comments].sort((a, b) => b.upvotes - a.upvotes);
}

function formatOutput(postInfo, comments) {
  const output = [];

  // Post information
  output.push('='.repeat(80));
  output.push('REDDIT POST');
  output.push('='.repeat(80));
  output.push(`Title: ${postInfo.title || 'N/A'}`);
  output.push(`Author: u/${postInfo.author || 'N/A'}`);
  output.push(`Score: ${postInfo.score || 0} upvotes`);
  output.push('');

  if (postInfo.selftext) {
    output.push('Post Content:');
    output.push('-'.repeat(80));
    output.push(postInfo.selftext);
    output.push('');
  }

  // Comments
  output.push('='.repeat(80));
  output.push(`COMMENTS (Sorted by Upvotes, Highest First)`);
  output.push(`Total Comments: ${comments.length}`);
  output.push('='.repeat(80));
  output.push('');

  comments.forEach((comment, idx) => {
    output.push(`Comment #${idx + 1}`);
    output.push('-'.repeat(80));
    output.push(`Upvotes: ${comment.upvotes} | Score: ${comment.score} | Author: u/${comment.author}`);
    if (comment.is_submitter) {
      output.push('(Original Poster)');
    }
    output.push('');
    output.push(comment.body);
    output.push('');
    output.push('');
  });

  return output.join('\n');
}

