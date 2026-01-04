#!/usr/bin/env python3
"""
Reddit JSON to ChatGPT Converter
Takes a Reddit post URL, fetches the .json version, extracts comments,
and ranks them by upvotes for easy ChatGPT consumption.
"""

import requests
import json
import sys
from typing import List, Dict, Any
from urllib.parse import urlparse, urlunparse


def ensure_json_url(url: str) -> str:
    """Ensure the URL ends with .json"""
    if url.endswith('.json'):
        return url
    # Remove trailing slash if present
    url = url.rstrip('/')
    return f"{url}.json"


def fetch_reddit_json(url: str) -> Dict[str, Any]:
    """Fetch JSON data from Reddit URL"""
    headers = {
        'User-Agent': 'RedditConverter/1.0 (Educational Purpose)'
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        error_msg = f"Error fetching URL: {e}"
        if hasattr(sys, 'stderr'):
            print(error_msg, file=sys.stderr)
        raise Exception(error_msg) from e


def extract_post_info(data: List[Dict]) -> Dict[str, Any]:
    """Extract post title, text, and author from the first item"""
    if not data or len(data) < 1:
        return {}
    
    post_data = data[0]['data']['children'][0]['data']
    return {
        'title': post_data.get('title', ''),
        'selftext': post_data.get('selftext', ''),
        'author': post_data.get('author', ''),
        'score': post_data.get('score', 0),
        'url': post_data.get('url', '')
    }


def extract_comments(data: List[Dict]) -> List[Dict[str, Any]]:
    """Extract all comments from the JSON structure"""
    comments = []
    
    if len(data) < 2:
        return comments
    
    def traverse_comments(comment_tree: Dict) -> None:
        """Recursively traverse comment tree"""
        if 'data' not in comment_tree:
            return
        
        comment_data = comment_tree['data']
        
        # Skip "more" objects and deleted comments
        if comment_data.get('kind') == 'more' or comment_data.get('body') in [None, '[deleted]', '[removed]']:
            if 'replies' in comment_data and comment_data['replies']:
                for reply in comment_data['replies'].get('data', {}).get('children', []):
                    traverse_comments(reply)
            return
        
        # Extract comment information
        comment = {
            'body': comment_data.get('body', ''),
            'author': comment_data.get('author', '[deleted]'),
            'score': comment_data.get('score', 0),
            'upvotes': comment_data.get('ups', 0),
            'downvotes': comment_data.get('downs', 0),
            'created_utc': comment_data.get('created_utc', 0),
            'is_submitter': comment_data.get('is_submitter', False),
            'permalink': comment_data.get('permalink', '')
        }
        
        # Only add comments with actual content
        if comment['body']:
            comments.append(comment)
        
        # Recursively process replies
        if 'replies' in comment_data and comment_data['replies']:
            if isinstance(comment_data['replies'], dict):
                for reply in comment_data['replies'].get('data', {}).get('children', []):
                    traverse_comments(reply)
    
    # Start traversing from the second item (comments section)
    comments_section = data[1]['data']['children']
    for comment_tree in comments_section:
        traverse_comments(comment_tree)
    
    return comments


def sort_comments_by_upvotes(comments: List[Dict]) -> List[Dict]:
    """Sort comments by upvotes (highest first)"""
    return sorted(comments, key=lambda x: x['upvotes'], reverse=True)


def format_output(post_info: Dict, comments: List[Dict]) -> str:
    """Format the output in a readable way for ChatGPT"""
    output = []
    
    # Post information
    output.append("=" * 80)
    output.append("REDDIT POST")
    output.append("=" * 80)
    output.append(f"Title: {post_info.get('title', 'N/A')}")
    output.append(f"Author: u/{post_info.get('author', 'N/A')}")
    output.append(f"Score: {post_info.get('score', 0)} upvotes")
    output.append("")
    
    if post_info.get('selftext'):
        output.append("Post Content:")
        output.append("-" * 80)
        output.append(post_info['selftext'])
        output.append("")
    
    # Comments
    output.append("=" * 80)
    output.append(f"COMMENTS (Sorted by Upvotes, Highest First)")
    output.append(f"Total Comments: {len(comments)}")
    output.append("=" * 80)
    output.append("")
    
    for idx, comment in enumerate(comments, 1):
        output.append(f"Comment #{idx}")
        output.append("-" * 80)
        output.append(f"Upvotes: {comment['upvotes']} | Score: {comment['score']} | Author: u/{comment['author']}")
        if comment['is_submitter']:
            output.append("(Original Poster)")
        output.append("")
        output.append(comment['body'])
        output.append("")
        output.append("")
    
    return "\n".join(output)


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Convert Reddit post JSON to ChatGPT-readable format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='Example: python reddit_converter.py https://www.reddit.com/r/ArtificialInteligence/comments/1hr4p1x/monthly_is_there_a_tool_for_post/'
    )
    parser.add_argument('url', help='Reddit post URL')
    parser.add_argument('-o', '--output', help='Output file (default: stdout)', default=None)
    
    args = parser.parse_args()
    
    url = args.url
    json_url = ensure_json_url(url)
    
    print(f"Fetching: {json_url}", file=sys.stderr)
    
    # Fetch and parse JSON
    data = fetch_reddit_json(json_url)
    
    # Extract post info and comments
    post_info = extract_post_info(data)
    comments = extract_comments(data)
    
    print(f"Found {len(comments)} comments", file=sys.stderr)
    
    # Sort comments by upvotes
    sorted_comments = sort_comments_by_upvotes(comments)
    
    # Format and output
    output = format_output(post_info, sorted_comments)
    
    # Write to file or stdout
    if args.output:
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"Output saved to: {args.output}", file=sys.stderr)
        except Exception as e:
            print(f"Error writing to file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Handle Unicode encoding for Windows console
        try:
            print(output)
        except UnicodeEncodeError:
            # Fallback: encode to UTF-8 and write to stdout
            sys.stdout.buffer.write(output.encode('utf-8'))
            sys.stdout.buffer.write(b'\n')


if __name__ == "__main__":
    main()

