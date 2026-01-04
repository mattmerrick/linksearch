"""
Alternative Flask-based API endpoint for Vercel
This can be used if the serverless function approach doesn't work
"""
from flask import Flask, request, jsonify
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reddit_converter import (
    ensure_json_url,
    fetch_reddit_json,
    extract_post_info,
    extract_comments,
    sort_comments_by_upvotes,
    format_output
)

app = Flask(__name__)

@app.route('/api/convert', methods=['POST', 'OPTIONS'])
def convert():
    """API endpoint to convert Reddit URL to formatted text"""
    # Handle CORS
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
    
    try:
        data = request.get_json()
        url = data.get('url', '').strip() if data else ''
        
        if not url:
            return jsonify({'success': False, 'error': 'URL is required'}), 400
        
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
        
        response = jsonify({
            'success': True,
            'output': output,
            'post_info': post_info,
            'comment_count': len(sorted_comments)
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    except Exception as e:
        response = jsonify({
            'success': False,
            'error': str(e)
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

