/**
 * Vercel serverless function for Reddit JSON conversion
 * Pure JavaScript - no Python needed!
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

    // Ensure JSON URL
    const jsonUrl = ensureJsonUrl(url.trim());

    // Fetch Reddit JSON
    const redditData = await fetchRedditJson(jsonUrl);

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

function ensureJsonUrl(url) {
  if (url.endsWith('.json')) {
    return url;
  }
  return url.replace(/\/$/, '') + '.json';
}

async function fetchRedditJson(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  try {
    console.log('Fetching Reddit URL:', url);
    const response = await fetch(url, { 
      headers,
      method: 'GET'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Reddit API error:', response.status, errorText);
      throw new Error(`Reddit API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched Reddit data');
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
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

