import requests
from bs4 import BeautifulSoup

def get_favicon(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    icon_link = soup.find("link", rel="shortcut icon")
    if not icon_link:
        icon_link = soup.find("link", rel="icon")
    if not icon_link:
        return url + '/favicon.ico' # Default location
    return icon_link['href']

print(get_favicon('https://chatgai.lovepor.cn'))