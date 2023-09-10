from stellar import StellarUnicorn
from picographics import PicoGraphics, DISPLAY_STELLAR_UNICORN
import time

# create a PicoGraphics framebuffer to draw into
graphics = PicoGraphics(display=DISPLAY_STELLAR_UNICORN)

# create our StellarUnicorn object
su = StellarUnicorn()

# paste your generated code from the Unicorn pixel art tool in here
data = {
    "grid": [
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
        [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7],
    ],
    "palette": [
        {"r":0,"g":0,"b":0},
        {"r":255,"g":0,"b":0},
        {"r":0,"g":255,"b":0},
        {"r":0,"g":0,"b":255},
        {"r":255,"g":255,"b":0},
        {"r":255,"g":0,"b":255},
        {"r":0,"g":255,"b":255},
        {"r":255,"g":255,"b":255},
    ]
}


# grab the data from the code
palette_data = data["palette"]
pixel_data = data["grid"]

# Iterating through the palette:
print("Palette Colors:")
for color in palette_data:
    r = color["r"]
    g = color["g"]
    b = color["b"]
    print(f"Red: {r}, Green: {g}, Blue: {b}")

print(palette_data[5]["b"])

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

    time.sleep(0.02)
