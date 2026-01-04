#!/usr/bin/env python3
"""
Flask web application for Reddit JSON to ChatGPT Converter
"""

from flask import Flask, render_template, request, jsonify
from reddit_converter import (
    ensure_json_url,
    fetch_reddit_json,
    extract_post_info,
    extract_comments,
    sort_comments_by_upvotes,
    format_output
)

app = Flask(__name__)


@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')


@app.route('/api/convert', methods=['POST'])
def convert():
    """API endpoint to convert Reddit URL to formatted text"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
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
        
        return jsonify({
            'success': True,
            'output': output,
            'post_info': post_info,
            'comment_count': len(sorted_comments)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

