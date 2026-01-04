# Reddit JSON to ChatGPT Converter

A simple tool that converts Reddit post JSON data into a readable format optimized for ChatGPT consumption. It extracts comments, sorts them by upvotes (highest first), and formats everything in a clean, readable way.

## Features

- **Web Interface** - Beautiful, modern UI for easy use
- **Automatic JSON handling** - Adds `.json` to Reddit URLs automatically
- **Extracts post information** - Title, content, and author
- **Extracts all comments** - Including nested replies
- **Sorts by upvotes** - Highest to lowest
- **One-click copy** - Easy clipboard copying
- **Handles deleted/removed comments** - Gracefully filters them out

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Web Interface (Recommended)

Start the Flask web server:

```bash
python app.py
```

Then open your browser and navigate to:
```
http://localhost:5000
```

Enter a Reddit post URL and click "Convert". The formatted output will appear below with a copy button.

### Command Line Interface

You can also use the command-line tool:

```bash
python reddit_converter.py <reddit_url> [--output output.txt]
```

**Examples:**

**Output to console:**
```bash
python reddit_converter.py https://www.reddit.com/r/ArtificialInteligence/comments/1hr4p1x/monthly_is_there_a_tool_for_post/
```

**Save to file:**
```bash
python reddit_converter.py https://www.reddit.com/r/ArtificialInteligence/comments/1hr4p1x/monthly_is_there_a_tool_for_post/ -o reddit_output.txt
```

## Output Format

The output includes:
- Post title, author, and score
- Post content (if it's a text post)
- All comments sorted by upvotes
- Each comment shows: upvotes, score, author, and full text

## Notes

- The script uses a custom User-Agent header as required by Reddit's API
- Deleted and removed comments are automatically filtered out
- Nested comment replies are included in the extraction
- The web interface runs on `http://localhost:5000` by default

