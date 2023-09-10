import machine
import time
import json

from stellar import StellarUnicorn
from picographics import PicoGraphics, DISPLAY_STELLAR_UNICORN

# create a PicoGraphics framebuffer to draw into
graphics = PicoGraphics(display=DISPLAY_STELLAR_UNICORN)

# create our StellarUnicorn object
su = StellarUnicorn()

# returns the id of the button that is currently pressed or
# None if none are
def pressed():
    if su.is_pressed(StellarUnicorn.SWITCH_A):
        return StellarUnicorn.SWITCH_A
    if su.is_pressed(StellarUnicorn.SWITCH_B):
        return StellarUnicorn.SWITCH_B
    if su.is_pressed(StellarUnicorn.SWITCH_C):
        return StellarUnicorn.SWITCH_C
    if su.is_pressed(StellarUnicorn.SWITCH_D):
        return StellarUnicorn.SWITCH_D
    return None

# Specify the path to your JavaScript file containing the JSON data
json_file_path = 'images.json'

# Load the JSON data from the JavaScript file
with open(json_file_path, 'r') as file:
    image = json.load(file)

# grab the data from the code
palette_data = image[1]["palette"]
pixel_data = image[1]["grid"]
image_shown = 0
image_count = len(image)

# Iterating through the palette:
print("Palette Colors:")
for color in palette_data:
    r = color["r"]
    g = color["g"]
    b = color["b"]
    print(f"Red: {r}, Green: {g}, Blue: {b}")

# pen colours to draw with
BG = graphics.create_pen(0, 0, 0)

while True:
    # clear the graphics object
    graphics.set_pen(BG)
    graphics.clear()

    # draw the graphics
    for y, row in enumerate(pixel_data):
        for x, pixel in enumerate(row):
            r = palette_data[pixel]["r"]
            g = palette_data[pixel]["g"]
            b = palette_data[pixel]["b"]
            FG = graphics.create_pen(r, g, b)
            graphics.set_pen(FG)
            graphics.pixel(x, y)

    # update the display
    su.update(graphics)

    if pressed() == StellarUnicorn.SWITCH_A:
        print("Button A was pressed")
        
        if image_shown < image_count-1:
            image_shown +=1
        elif image_shown == image_count-1:
            image_shown = 0
        
        
        # grab the data from the code
        palette_data = image[image_shown]["palette"]
        pixel_data = image[image_shown]["grid"]
        
    time.sleep(0.3)
    

# wait until all buttons are released
while pressed() is not None:
    time.sleep(0.1)
