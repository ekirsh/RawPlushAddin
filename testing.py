import requests
from googlesearch import search
from bs4 import BeautifulSoup
import json
import trafilatura
from openai import OpenAI
import pytube
import re
import sys
from youtube_transcript_api import YouTubeTranscriptApi

client = OpenAI()

def is_youtube_url(url):
    youtube_regex = (
        r'(https?://)?(www\.)?'
        '(youtube|youtu|youtube-nocookie)\.(com|be)/'
        '(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    
    youtube_regex_match = re.match(youtube_regex, url)
    return bool(youtube_regex_match)

def extract_video_id(url):
    video_id = re.search(r'v=([^&]*)', url).group(1)
    return video_id


def google_search(query):
    urls = []
    try:
        for url in search(query, num=15, stop=15, pause=2):
            urls.append(url)
    except ImportError:
        print("No module named 'google' found")
    return urls

def get_transcript(url):
    video_id = extract_video_id(url)
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = " ".join([i['text'] for i in transcript_list])
    except Exception as e:
        print(e)
        return
    return transcript

def summarize_transcript(transcript):
    system_prompt = "You are a helpful assistant. Summarize the following text to help create an artist description for this music artist. Remove any irrelevant information. Make sure to include any important points about this artist (only if they are available), such as who they are managed by, what label they are signed to, what producers/writers they work with, who their musical influences are, what artists they love/are influenced by, who their manager is, where they live, their age etc."
    user_prompt = transcript
    response = client.chat.completions.create(
        model='gpt-3.5-turbo-16k',
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ],
        max_tokens=4096,
        temperature=1
    )
    summary = response.choices[0].message.content
    return summary


def summarize_text(text, api_key):
    headers = {"Authorization": "Bearer " + api_key}

    url = "https://api.edenai.run/v2/text/summarize"
    payload = {
        "providers": "cohere",
        "language": "en",
        "text": text,
        "output_sentences": 5
    }

    response = requests.post(url, json=payload, headers=headers)

    result = json.loads(response.text)
    print(result)
    return result['cohere']['result']

def get_text_from_url(url):
    # Send a GET request to the website
    response = requests.get(url)

    # If the GET request is successful, the status code will be 200
    if response.status_code == 200:
        # Get the content of the response
        page_content = response.content

        # Create a BeautifulSoup object and specify the parser
        soup = BeautifulSoup(page_content, 'html.parser')

        # Get all the text in the page
        text = soup.get_text()
        print(text)
        return text

    else:
        return "Failed to retrieve page"


base_urls_to_ignore = ['https://twitter.com/','https://open.spotify.com/','https://www.instagram.com/', 'https://www.youtube.com/', 'https://soundcloud.com/', 'https://www.tiktok.com/', 'https://music.apple.com/']


def get_relevant_text(url):
    if is_youtube_url(url):
        print(url)
        print("YOUTUBE")
        try:
            summary = summarize_transcript(get_transcript(url))
            print(summary)
            return summary
        except:
            return ""
    if any(url.startswith(base_url) for base_url in base_urls_to_ignore):
        print(f"Ignoring URL: {url}")
        return ""
    # Download the webpage
    downloaded = trafilatura.fetch_url(url)

    # Extract relevant text
    text = trafilatura.extract(downloaded)
    print(text)
    return text


def main():
    artist_name = sys.argv[1] + " music"  # replace with the artist's name
    api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOTMzYjEwMzktNWE1MC00OTg0LWE1NzQtYTBmZGMwMWExNDUwIiwidHlwZSI6ImFwaV90b2tlbiJ9.OTfofBiS_WTq5WfpBGGI5HiibQLsJSdZxj2y1d8dDUE"  # replace with your Eden AI API key
    urls = google_search(artist_name)
    all_text = ""
    for url in urls:
        text = get_relevant_text(url)
        try:
            all_text += text + " "
        except:
            print("COULD NOT ADD")
    print(all_text)
 #   summary = summarize_text(all_text, api_key)
    summary = summarize_transcript(all_text)
    print("FINAL OUTPUT: ")
    print(summary)

if __name__ == "__main__":
    main()
