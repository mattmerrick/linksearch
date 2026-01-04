"""
Vercel serverless function for Reddit JSON conversion
"""
import json
import sys
import os

# Add parent directory to path to import reddit_converter
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reddit_converter import (
    ensure_json_url,
    fetch_reddit_json,
    extract_post_info,
    extract_comments,
    sort_comments_by_upvotes,
    format_output
)


def handler(request):
    """Vercel serverless function handler"""
    # Handle CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Parse request body
        if request.method != 'POST':
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'success': False, 'error': 'Method not allowed'})
            }
        
        # Get request body - Vercel passes it as request.body (string) or request.json
        if hasattr(request, 'json') and request.json:
            body = request.json
        elif hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        else:
            body = {}
        
        url = body.get('url', '').strip()
        
        if not url:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'success': False, 'error': 'URL is required'})
            }
        
        # Ensure JSON URL
        json_url = ensure_json_url(url)
        
        # Fetch and parse JSON
        reddit_data = fetch_reddit_json(json_url)
        
        # Extract post info and comments
        post_info = extract_post_info(reddit_data)
        comments = extract_comments(reddit_data)
        
        # Sort comments by upvotes
        sorted_comments = sort_comments_by_upvotes(comments)
        
        # Format output
        output = format_output(post_info, sorted_comments)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'output': output,
                'post_info': post_info,
                'comment_count': len(sorted_comments)
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }

