import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.templating import Jinja2Templates
from website import websites 
app = FastAPI()

# Ensure the 'static' directory exists
if not os.path.exists("static"):
    os.makedirs("static")
    
# Mount static files (for CSS, JS, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Route for the home page
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "websites": websites})

# New route for the about page
@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

# Route for the contact page
@app.get("/contact", response_class=HTMLResponse)
async def contact(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})

# Route for redirecting to external websites or internal pages
@app.get("/{website}", response_class=HTMLResponse)
async def redirect_to_website(website: str):
    if website.lower() == "about":
        return RedirectResponse(url="/about", status_code=302)
    elif website.lower() == "contact":
        return RedirectResponse(url="/contact", status_code=302)
    elif website.lower() == "api/websites":
        return websites
    website_info = websites.get(website.lower())
    if website_info:
        return RedirectResponse(url=website_info['url'], status_code=302)
    else:
        return HTMLResponse(content=f"<h1>Website '{website}' not found</h1>", status_code=404)

# New route for returning the list of websites as JSON
@app.get("/api/websites", response_class=JSONResponse)
async def get_websites():
    return websites